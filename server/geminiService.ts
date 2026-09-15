import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Configurable model name via server-side environment variable.
// Uses a currently available, stable Gemini Flash model supported by the Gemini API.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface DIYProject {
  id: string;
  title: string;
  description: string;
  category: string;
  wasteUsed: string[];
  additionalMaterials: string[];
  tools: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Challenging';
  estimatedTime: string;
  steps: string[];
  safetyTips: string[];
  youtubeSearchQuery: string;
}

export interface GenerateProjectsResponse {
  projects: DIYProject[];
}

/**
 * Checks if an error is a transient 429 (rate limit) or 503 (unavailable / high demand) error.
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.code || error.statusCode;
  if (status === 429 || status === 503) return true;

  const msg = (error.message || error.toString() || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('temporarily busy') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit')
  );
}

/**
 * Executes a Gemini API call with up to 2 retries and short exponential backoff.
 * If all retries fail with a transient error, throws a clean user-friendly error.
 */
async function callWithRetry<T>(
  operation: (model: string) => Promise<T>,
  model: string = GEMINI_MODEL,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any = null;
  const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const currentModel = modelsToTry[attempt % modelsToTry.length];
    try {
      return await operation(currentModel);
    } catch (err: any) {
      lastError = err;

      if (attempt === maxRetries) {
        break;
      }

      // Short exponential backoff: ~500ms on first retry, ~1000ms on second retry
      const baseDelay = 500 * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 150);
      const delay = baseDelay + jitter;

      console.warn(
        `Gemini temporary error (${err?.status || '503/429'}). Retrying in ${delay}ms with candidate model (attempt ${attempt + 1}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If the error was transient or exhausted retries, throw user-friendly error
  const friendlyError: any = new Error('AI is temporarily unavailable. Please try again.');
  friendlyError.status = 503;
  friendlyError.isUserFriendly = true;
  throw friendlyError;
}

/**
 * Validates and sanitizes raw project objects returned by Gemini.
 * Ensures the output strictly conforms to the required structured format.
 */
function validateAndSanitizeProjects(
  rawProjects: any[],
  fallbackWaste: string[]
): DIYProject[] {
  if (!Array.isArray(rawProjects) || rawProjects.length === 0) {
    throw new Error('No projects returned by AI.');
  }

  const validDifficulties: Array<'Easy' | 'Medium' | 'Hard'> = [
    'Easy',
    'Medium',
    'Hard',
  ];

  const sanitized: DIYProject[] = [];

  for (let idx = 0; idx < rawProjects.length; idx++) {
    const p = rawProjects[idx];
    if (!p || typeof p !== 'object') continue;

    const title = typeof p.title === 'string' && p.title.trim().length > 0
      ? p.title.trim()
      : `Upcycled ${p.category || 'DIY'} Project ${idx + 1}`;

    const description = typeof p.description === 'string' && p.description.trim().length > 0
      ? p.description.trim()
      : 'A creative and sustainable household upcycling project.';

    const category = typeof p.category === 'string' && p.category.trim().length > 0
      ? p.category.trim()
      : 'Useful';

    const wasteUsed = Array.isArray(p.wasteUsed) && p.wasteUsed.length > 0
      ? p.wasteUsed.map((w: any) => String(w).trim()).filter(Boolean)
      : fallbackWaste;

    const additionalMaterials = Array.isArray(p.additionalMaterials) && p.additionalMaterials.length > 0
      ? p.additionalMaterials.map((m: any) => String(m).trim()).filter(Boolean)
      : ['PVA Glue', 'Twine or String', 'Acrylic Paint'];

    const tools = Array.isArray(p.tools) && p.tools.length > 0
      ? p.tools.map((t: any) => String(t).trim()).filter(Boolean)
      : ['Scissors', 'Ruler'];

    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (typeof p.difficulty === 'string') {
      const lower = p.difficulty.trim().toLowerCase();
      if (lower === 'easy') difficulty = 'Easy';
      else if (lower === 'hard' || lower === 'challenging' || lower === 'difficult') difficulty = 'Hard';
      else difficulty = 'Medium';
    }

    const estimatedTime = typeof p.estimatedTime === 'string' && p.estimatedTime.trim().length > 0
      ? p.estimatedTime.trim()
      : '25-35 mins';

    const steps = Array.isArray(p.steps) && p.steps.length > 0
      ? p.steps.map((s: any) => String(s).trim()).filter(Boolean)
      : [
          'Thoroughly clean and dry all selected waste materials.',
          'Measure, mark, and safely cut materials according to your desired size.',
          'Secure structural elements together using suitable adhesive or fasteners.',
          'Apply decorative touches, sand down any rough edges, and inspect the finished project.',
        ];

    const safetyTips = Array.isArray(p.safetyTips) && p.safetyTips.length > 0
      ? p.safetyTips.map((tip: any) => String(tip).trim()).filter(Boolean)
      : [
          'Exercise caution when using scissors or craft knives; cut away from your body.',
          'Smooth down or tape any sharp edges on containers before assembly.',
        ];

    const youtubeSearchQuery = typeof p.youtubeSearchQuery === 'string' && p.youtubeSearchQuery.trim().length > 0
      ? p.youtubeSearchQuery.trim()
      : `${title} DIY tutorial`;

    sanitized.push({
      id: `proj-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      description,
      category,
      wasteUsed,
      additionalMaterials,
      tools,
      difficulty,
      estimatedTime,
      steps,
      safetyTips,
      youtubeSearchQuery,
    });
  }

  if (sanitized.length === 0) {
    throw new Error('AI response contained no valid project definitions.');
  }

  return sanitized.slice(0, 5);
}

export async function generateProjectsFromWaste(wasteItems: string[]): Promise<DIYProject[]> {
  if (!wasteItems || wasteItems.length === 0) {
    throw new Error('At least one waste item must be provided.');
  }

  const ai = getGenAI();

  const prompt = `You are an expert sustainable DIY designer, craft instructor, and upcycling specialist.
The user has confirmed the following waste materials: ${wasteItems.join(', ')}.

Generate exactly 5 creative and realistic DIY/upcycling projects that can be made using these materials.

IMPORTANT AI LOGIC:
- Use ONLY the confirmed waste materials provided in this request. Never use materials that were removed or were detected in an earlier analysis.
- The user has ONLY these waste materials available: ${wasteItems.join(', ')}.
- Every project MUST use at least one material from: ${wasteItems.join(', ')}.
- In the "wasteUsed" array for each project, include ONLY materials from: ${wasteItems.join(', ')}. Never include any materials that were removed or were detected in an earlier analysis (such as newspaper, unless newspaper is explicitly listed in ${wasteItems.join(', ')}).
- Do NOT generate random generic DIY projects.
- Prioritize:
  1. Useful household products
  2. Home decorations
  3. Storage solutions
  4. Garden products
  5. Organizers
  6. Creative recycled products
- Avoid projects that require expensive materials.
- Avoid dangerous or unrealistic projects.
- Difficulty MUST be one of: "Easy", "Medium", or "Hard".
- Category should be one of: "Garden", "Home", "Decoration", "Useful", "Storage", "Organizers".
- Include a specific, realistic YouTube search query (e.g. "${wasteItems[0]} DIY organizer tutorial").

Return ONLY valid JSON matching this exact structure:
{
  "projects": [
    {
      "title": "Example Project Name",
      "description": "A clear description of the project using confirmed waste.",
      "category": "Useful",
      "wasteUsed": [
        "${wasteItems[0]}"
      ],
      "additionalMaterials": [
        "Glue",
        "Ruler"
      ],
      "tools": [
        "Scissors"
      ],
      "difficulty": "Easy",
      "estimatedTime": "20 minutes",
      "steps": [
        "Step 1 instruction...",
        "Step 2 instruction..."
      ],
      "safetyTips": [
        "Safety precaution..."
      ],
      "youtubeSearchQuery": "${wasteItems[0]} DIY craft tutorial"
    }
  ]
}

Generate exactly 5 projects.
Do not return Markdown code blocks.
Do not return explanatory text outside the JSON.`;

  return await callWithRetry(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    }

    const rawProjects = Array.isArray(parsed) ? parsed : (parsed?.projects || []);
    return validateAndSanitizeProjects(rawProjects, wasteItems);
  });
}

export interface ImageInput {
  data: string; // base64 string (with or without data URL prefix)
  mimeType?: string;
}

export interface DetectedItemResult {
  name: string;
  confidence: number;
}

export interface MultiImageDetectionResult {
  items: DetectedItemResult[];
  detectedMaterials: string[];
  summary: string;
}

/**
 * Detects waste and recyclable materials across one or multiple images using Gemini multimodal vision.
 * All images are analyzed together in the same prompt.
 * Duplicates are unified with the highest confidence score.
 */
export async function detectWasteFromImages(
  images: ImageInput[]
): Promise<MultiImageDetectionResult> {
  if (!images || images.length === 0) {
    throw new Error('At least one image must be provided.');
  }

  // Cap at 5 images
  const clampedImages = images.slice(0, 5);
  const ai = getGenAI();

  const parts: any[] = [];

  for (let i = 0; i < clampedImages.length; i++) {
    const img = clampedImages[i];
    const rawBase64 = img.data.includes(',') ? img.data.split(',')[1] : img.data;
    const mime = img.mimeType || 'image/jpeg';

    parts.push({
      inlineData: {
        mimeType: mime,
        data: rawBase64,
      },
    });
  }

  const promptText = `Analyze all ${clampedImages.length} uploaded photo(s) of household waste and recyclable materials together.
Identify all distinct recyclable or reusable materials and containers visible across all photos (such as Plastic bottles, Cardboard, Tin cans, Glass jars, Newspaper, Old clothes, Egg cartons, Plastic containers, Milk jugs, Bottle caps, Paper bags, etc.).

RULES:
1. Only identify materials that are actually visible in the uploaded images. Do NOT invent or assume materials that are not present.
2. If the same material (e.g. "Plastic bottles" or "Cardboard") appears across multiple photos, include it ONLY ONCE in the "items" list with its highest estimated confidence score.
3. Use standardized, clean, human-readable material names (e.g. "Plastic bottles", "Cardboard", "Tin cans", "Glass jars", "Newspaper", "Old clothes", "Egg cartons").
4. Provide a realistic confidence value between 0.70 and 0.99 for each clearly detected material.
5. If no recyclable or household waste materials are visible in the photos, return an empty items array: [].

Return ONLY a valid JSON object matching this exact schema:
{
  "items": [
    {
      "name": "Plastic bottles",
      "confidence": 0.96
    },
    {
      "name": "Cardboard",
      "confidence": 0.94
    },
    {
      "name": "Newspaper",
      "confidence": 0.92
    }
  ],
  "summary": "Brief 1-2 sentence overview of all detected materials across the uploaded photos."
}`;

  parts.push({
    text: promptText,
  });

  return await callWithRetry(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    }

    const rawItems: any[] = Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed?.detectedMaterials)
      ? parsed.detectedMaterials.map((m: any) => ({ name: String(m), confidence: 0.9 }))
      : [];

    // Deduplicate and sanitize items
    const seenMap = new Map<string, DetectedItemResult>();

    for (const raw of rawItems) {
      if (!raw) continue;
      const rawName = typeof raw === 'string' ? raw : raw?.name;
      if (!rawName || typeof rawName !== 'string') continue;

      const trimmedName = rawName.trim();
      if (!trimmedName) continue;

      // Canonical key for case-insensitive deduplication
      const canonicalKey = trimmedName.toLowerCase();

      let conf = 0.9;
      if (typeof raw === 'object' && typeof raw.confidence === 'number' && !isNaN(raw.confidence)) {
        conf = Math.min(1.0, Math.max(0.1, Number(raw.confidence.toFixed(2))));
      }

      if (seenMap.has(canonicalKey)) {
        const existing = seenMap.get(canonicalKey)!;
        if (conf > existing.confidence) {
          existing.confidence = conf;
        }
      } else {
        seenMap.set(canonicalKey, {
          name: trimmedName,
          confidence: conf,
        });
      }
    }

    const finalItems = Array.from(seenMap.values());
    const detectedMaterials = finalItems.map((item) => item.name);

    return {
      items: finalItems,
      detectedMaterials,
      summary:
        parsed.summary ||
        (finalItems.length > 0
          ? `Detected ${finalItems.length} reusable material(s) across your photo(s).`
          : 'No household waste materials detected. You can add materials manually.'),
    };
  });
}

// Retain detectWasteFromImage for backward compatibility
export async function detectWasteFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ detectedMaterials: string[]; items: DetectedItemResult[]; summary: string }> {
  return await detectWasteFromImages([{ data: imageBase64, mimeType }]);
}
