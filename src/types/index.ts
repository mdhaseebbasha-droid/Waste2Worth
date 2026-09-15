export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Challenging';

export interface DIYProject {
  id: string;
  title: string;
  description: string;
  category: string;
  wasteUsed: string[];
  additionalMaterials: string[];
  tools: string[];
  difficulty: DifficultyLevel;
  estimatedTime: string;
  steps: string[];
  safetyTips: string[];
  youtubeSearchQuery: string;
  savedAt?: string;
}

export interface WasteMaterial {
  id: string;
  name: string;
  category: 'Plastic' | 'Paper & Cardboard' | 'Glass & Metal' | 'Organic & Fabric' | 'Other';
  icon: string;
  examples: string;
  defaultPopular?: boolean;
}

export interface DetectedWasteItem {
  name: string;
  confidence?: number;
}

export interface WasteDetectionResponse {
  items: DetectedWasteItem[];
  detectedMaterials: string[];
  summary: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  publishTime?: string;
}

export interface YouTubeSearchResult {
  available: boolean;
  query: string;
  fallbackUrl: string;
  videos: YouTubeVideoItem[];
  error?: string;
}
