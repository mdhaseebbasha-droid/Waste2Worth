import express, { Request, Response, Router } from 'express';
import {
  generateProjectsFromWaste,
  detectWasteFromImage,
  detectWasteFromImages,
  ImageInput,
} from './geminiService.ts';
import { searchYouTubeTutorials } from './youtubeService.ts';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to generate 5 DIY projects based on waste materials
apiRouter.post('/generate-projects', async (req: Request, res: Response) => {
  try {
    const { wasteItems } = req.body;
    if (!Array.isArray(wasteItems) || wasteItems.length === 0) {
      return res.status(400).json({ error: 'wasteItems array is required and must not be empty.' });
    }

    const projects = await generateProjectsFromWaste(wasteItems);
    return res.json({ projects });
  } catch (error: any) {
    console.error('Error generating projects:', error);

    const isTransient =
      error?.status === 503 ||
      error?.status === 429 ||
      error?.isUserFriendly ||
      String(error?.message || '').includes('503') ||
      String(error?.message || '').includes('429') ||
      String(error?.message || '').includes('UNAVAILABLE') ||
      String(error?.message || '').includes('high demand') ||
      String(error?.message || '').includes('RESOURCE_EXHAUSTED');

    const errorMsg = 'AI is temporarily unavailable. Please try again.';
    return res.status(isTransient ? 503 : 500).json({
      error: errorMsg,
    });
  }
});

// Endpoint to detect waste items from uploaded image(s)
// Supports single image ({ imageBase64, mimeType }) AND multiple images ({ images: [{ data, mimeType }] })
apiRouter.post('/detect-waste', async (req: Request, res: Response) => {
  try {
    const { images, imageBase64, mimeType } = req.body;

    let imageList: ImageInput[] = [];

    if (Array.isArray(images) && images.length > 0) {
      // Multiple images provided
      imageList = images.map((img: any) => {
        if (typeof img === 'string') {
          return { data: img, mimeType: 'image/jpeg' };
        }
        return {
          data: img.data || img.imageBase64 || '',
          mimeType: img.mimeType || 'image/jpeg',
        };
      }).filter((img) => Boolean(img.data));
    } else if (imageBase64) {
      // Single image provided (backward compatibility)
      imageList = [{ data: imageBase64, mimeType: mimeType || 'image/jpeg' }];
    }

    if (imageList.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    if (imageList.length > 5) {
      imageList = imageList.slice(0, 5);
    }

    const result = await detectWasteFromImages(imageList);
    return res.json({
      items: result.items,
      detectedMaterials: result.detectedMaterials,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('Error detecting waste:', error);
    return res.status(500).json({
      error: 'Unable to analyze the uploaded images. Please try again.',
    });
  }
});

// Endpoint to search YouTube tutorials
// GET /api/youtube/search?q=<search query>
const handleYouTubeSearch = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      return res.status(400).json({
        error: 'YouTube tutorials are temporarily unavailable.',
        videos: [],
      });
    }

    const result = await searchYouTubeTutorials(query.trim());

    if (result.error && result.videos.length === 0) {
      return res.json({
        error: 'YouTube tutorials are temporarily unavailable.',
        videos: [],
        fallbackUrl: result.fallbackUrl,
      });
    }

    return res.json({
      videos: result.videos,
      fallbackUrl: result.fallbackUrl,
    });
  } catch (error: any) {
    console.error('Error in YouTube search endpoint:', error?.message || error);
    return res.status(500).json({
      error: 'YouTube tutorials are temporarily unavailable.',
      videos: [],
    });
  }
};

apiRouter.get('/youtube/search', handleYouTubeSearch);
apiRouter.get('/youtube-search', handleYouTubeSearch);

// Explicit JSON 404 handler for any undefined /api routes
// Guarantees frontend never receives HTML doctype errors for API calls
apiRouter.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});
