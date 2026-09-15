import dotenv from 'dotenv';
dotenv.config();

export interface YouTubeVideoItem {
  id?: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

export interface YouTubeSearchResult {
  available: boolean;
  query: string;
  fallbackUrl: string;
  videos: YouTubeVideoItem[];
  error?: string;
}

// In-memory cache to prevent repeated YouTube API hits for identical queries
interface CacheEntry {
  timestamp: number;
  data: YouTubeSearchResult;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 200;

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16));
      } catch {
        return '';
      }
    });
}

export async function searchYouTubeTutorials(rawQuery: string): Promise<YouTubeSearchResult> {
  const query = (rawQuery || '').trim();
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  if (!query) {
    return {
      available: false,
      query: '',
      fallbackUrl: 'https://www.youtube.com',
      videos: [],
      error: 'YouTube tutorials are temporarily unavailable.',
    };
  }

  // Check in-memory cache first
  const cacheKey = query.toLowerCase();
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // Validate API key existence (handle missing or default placeholder)
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_YOUTUBE_API_KEY') {
    const result: YouTubeSearchResult = {
      available: false,
      query,
      fallbackUrl,
      videos: [],
      error: 'YouTube tutorials are temporarily unavailable.',
    };
    return result;
  }

  try {
    // Enhance query if needed to keep results focused on DIY tutorials & upcycling
    let searchQuery = query;
    const lower = query.toLowerCase();
    if (!lower.includes('diy') && !lower.includes('tutorial') && !lower.includes('how to')) {
      searchQuery = `${query} DIY tutorial`;
    }

    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    apiUrl.searchParams.set('part', 'snippet');
    apiUrl.searchParams.set('type', 'video');
    apiUrl.searchParams.set('maxResults', '3');
    apiUrl.searchParams.set('q', searchQuery);
    apiUrl.searchParams.set('safeSearch', 'moderate');
    apiUrl.searchParams.set('key', apiKey.trim());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(
        `YouTube Data API v3 error (${response.status}):`,
        errText.slice(0, 200)
      );

      const result: YouTubeSearchResult = {
        available: false,
        query,
        fallbackUrl,
        videos: [],
        error: 'YouTube tutorials are temporarily unavailable.',
      };
      return result;
    }

    const data: any = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    const videos: YouTubeVideoItem[] = items
      .map((item: any) => {
        const videoId = item?.id?.videoId;
        if (!videoId || typeof videoId !== 'string') return null;

        const snippet = item.snippet || {};
        const title = decodeHtmlEntities(snippet.title || 'DIY Tutorial Video');
        const description = decodeHtmlEntities(snippet.description || '');
        const channelTitle = decodeHtmlEntities(snippet.channelTitle || 'YouTube Creator');
        const thumbnail =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const publishedAt = snippet.publishedAt || snippet.publishTime || '';

        return {
          id: videoId,
          videoId,
          title,
          description,
          thumbnail,
          channelTitle,
          publishedAt,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter((v: YouTubeVideoItem | null): v is YouTubeVideoItem => v !== null)
      .slice(0, 3);

    const result: YouTubeSearchResult = {
      available: videos.length > 0,
      query,
      fallbackUrl,
      videos,
      error: videos.length === 0 ? 'YouTube tutorials are temporarily unavailable.' : undefined,
    };

    // Store in cache
    if (queryCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = queryCache.keys().next().value;
      if (oldestKey) queryCache.delete(oldestKey);
    }
    queryCache.set(cacheKey, { timestamp: Date.now(), data: result });

    return result;
  } catch (error: any) {
    console.error('Network or parsing error fetching YouTube tutorials:', error?.message || error);
    return {
      available: false,
      query,
      fallbackUrl,
      videos: [],
      error: 'YouTube tutorials are temporarily unavailable.',
    };
  }
}

