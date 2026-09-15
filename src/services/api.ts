import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { DIYProject, YouTubeSearchResult, WasteDetectionResponse, DetectedWasteItem } from '../types/index.ts';

const LOCAL_STORAGE_SAVED_KEY = 'waste2worth_guest_saved_projects';

// Helper to safely parse JSON or throw clean error
async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    throw new Error(`Failed to read response from server (${response.status})`);
  }

  let data: any;
  if (contentType.includes('application/json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(
        response.ok
          ? 'Invalid JSON response from server.'
          : `Server error (${response.status}): Unable to parse error details.`
      );
    }
  } else {
    // Non-JSON response (e.g. HTML error page or proxy error)
    throw new Error('Unable to analyze the uploaded images. Please try again.');
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ----------------------------------------------------
// API Client Functions
// ----------------------------------------------------

export async function generateProjectsAPI(wasteItems: string[]): Promise<DIYProject[]> {
  try {
    const response = await fetch('/api/generate-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wasteItems }),
    });

    const data = await parseJsonResponse<{ projects: DIYProject[] }>(response);
    if (!data.projects || !Array.isArray(data.projects) || data.projects.length === 0) {
      throw new Error('AI is temporarily unavailable. Please try again.');
    }
    return data.projects;
  } catch (err: any) {
    console.error('generateProjectsAPI error:', err);
    throw new Error('AI is temporarily unavailable. Please try again.');
  }
}

/**
 * Detect waste items from multiple uploaded images (1 to 5 images).
 */
export async function detectWasteFromImagesAPI(
  images: Array<{ data: string; mimeType: string }>
): Promise<WasteDetectionResponse> {
  const response = await fetch('/api/detect-waste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });

  const data = await parseJsonResponse<WasteDetectionResponse>(response);

  // Normalize response fields for seamless consumer usage
  const items: DetectedWasteItem[] = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.detectedMaterials)
    ? data.detectedMaterials.map((name) => ({ name, confidence: 0.9 }))
    : [];

  const detectedMaterials = items.length > 0
    ? items.map((i) => i.name)
    : (data.detectedMaterials || []);

  return {
    items,
    detectedMaterials,
    summary: data.summary || (items.length > 0 ? `Detected ${items.length} material(s).` : 'No materials detected.'),
  };
}

/**
 * Single-image detect API (retained for backward compatibility and single photo flows).
 */
export async function detectWasteAPI(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<WasteDetectionResponse> {
  return detectWasteFromImagesAPI([{ data: imageBase64, mimeType }]);
}

export async function searchYouTubeAPI(query: string): Promise<YouTubeSearchResult> {
  const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    return {
      available: false,
      query,
      fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      videos: [],
    };
  }
  return response.json();
}

// ----------------------------------------------------
// Firestore & Local Persistence Functions
// ----------------------------------------------------

export async function saveProject(userId: string | null | undefined, project: DIYProject): Promise<void> {
  const projectToSave = {
    ...project,
    savedAt: new Date().toISOString(),
  };

  if (!userId) {
    // Save to localStorage for guest
    const current = getLocalSavedProjects();
    const updated = [projectToSave, ...current.filter((p) => p.id !== project.id)];
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
    return;
  }

  try {
    const docRef = doc(db, 'users', userId, 'savedProjects', project.id);
    await setDoc(docRef, {
      ...projectToSave,
      firestoreTimestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error saving project to Firestore, falling back to local storage:', err);
    const current = getLocalSavedProjects();
    const updated = [projectToSave, ...current.filter((p) => p.id !== project.id)];
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
  }
}

export async function removeSavedProject(userId: string | null | undefined, projectId: string): Promise<void> {
  if (!userId) {
    const current = getLocalSavedProjects();
    const updated = current.filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
    return;
  }

  try {
    const docRef = doc(db, 'users', userId, 'savedProjects', projectId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error removing project from Firestore, checking local storage:', err);
    const current = getLocalSavedProjects();
    const updated = current.filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
  }
}

export async function getSavedProjects(userId: string | null | undefined): Promise<DIYProject[]> {
  if (!userId) {
    return getLocalSavedProjects();
  }

  try {
    const colRef = collection(db, 'users', userId, 'savedProjects');
    const q = query(colRef, orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Check if there are local projects to migrate
      const local = getLocalSavedProjects();
      return local;
    }

    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as DIYProject[];
  } catch (err) {
    console.warn('Could not fetch from Firestore, returning local cache:', err);
    return getLocalSavedProjects();
  }
}

export function subscribeSavedProjects(
  userId: string | null | undefined,
  callback: (projects: DIYProject[]) => void
): () => void {
  if (!userId) {
    callback(getLocalSavedProjects());
    // listen to storage events
    const listener = () => callback(getLocalSavedProjects());
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }

  try {
    const colRef = collection(db, 'users', userId, 'savedProjects');
    const q = query(colRef);
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as DIYProject[];
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscription error, falling back to local storage:', error);
        callback(getLocalSavedProjects());
      }
    );
  } catch (err) {
    console.warn('Firestore init failed in subscription, using local storage:', err);
    callback(getLocalSavedProjects());
    return () => {};
  }
}

function getLocalSavedProjects(): DIYProject[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
