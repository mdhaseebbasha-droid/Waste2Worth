import dotenv from 'dotenv';
dotenv.config();

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

export async function searchYouTubeTutorials(query: string): Promise<YouTubeSearchResult> {
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_YOUTUBE_API_KEY') {
    return {
      available: false,
      query,
      fallbackUrl,
      videos: [],
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.warn('YouTube API call responded with error:', response.status, errText);
      return {
        available: false,
        query,
        fallbackUrl,
        videos: [],
        error: `YouTube API returned status ${response.status}`,
      };
    }

    const data: any = await response.json();
    const items = data.items || [];

    const videos: YouTubeVideoItem[] = items.map((item: any) => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet || {};
      const thumbnail =
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.default?.url ||
        '';

      return {
        id: videoId || '',
        title: snippet.title || 'DIY Tutorial Video',
        channelTitle: snippet.channelTitle || 'Craft Creator',
        thumbnail,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : fallbackUrl,
        publishTime: snippet.publishTime,
      };
    });

    return {
      available: videos.length > 0,
      query,
      fallbackUrl,
      videos,
    };
  } catch (error: any) {
    console.error('Error fetching YouTube tutorials:', error);
    return {
      available: false,
      query,
      fallbackUrl,
      videos: [],
      error: error.message,
    };
  }
}
