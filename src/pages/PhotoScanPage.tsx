import React, { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Camera,
  X,
  Plus,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Images,
} from 'lucide-react';
import { detectWasteFromImagesAPI, generateProjectsAPI } from '../services/api.ts';
import { DIYProject, DetectedWasteItem } from '../types/index.ts';

interface PhotoScanPageProps {
  onProjectsGenerated: (projects: DIYProject[], wasteItems: string[]) => void;
}

interface SelectedPhoto {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12MB per image
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Resize high-res photos to prevent massive base64 payloads and latency
function optimizeImageDataUrl(dataUrl: string, mimeType: string, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (dataUrl.length < 400 * 1024) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(dataUrl);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      try {
        const optimized = canvas.toDataURL(outMime, quality);
        resolve(optimized);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const PhotoScanPage: React.FC<PhotoScanPageProps> = ({ onProjectsGenerated }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Photos state: supports 1 to 5 photos
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Detected materials state: Source of truth for current confirmed materials
  const [detectedMaterials, setDetectedMaterials] = useState<string[]>([]);
  const [materialConfidences, setMaterialConfidences] = useState<Record<string, number>>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [customItemInput, setCustomItemInput] = useState('');
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Validate a single file
  const validateFile = (file: File): string | null => {
    const isAllowedType =
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
      file.name.match(/\.(jpe?g|png|webp)$/i);

    if (!isAllowedType) {
      return `"${file.name}" is not supported. Please upload JPG, JPEG, PNG, or WEBP.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds the maximum allowed size of 12MB.`;
    }

    return null;
  };

  // Process selected File objects and append to state up to MAX_PHOTOS
  const processFiles = (files: FileList | File[], isAppend: boolean = false) => {
    setAnalysisError(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    // Check errors
    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        setAnalysisError(err);
        return;
      }
    }

    const currentCount = isAppend ? selectedPhotos.length : 0;
    const availableSlots = MAX_PHOTOS - currentCount;

    if (availableSlots <= 0) {
      setAnalysisError(`Maximum of ${MAX_PHOTOS} photos reached. Remove a photo to add a new one.`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      setAnalysisError(`Only ${availableSlots} more photo(s) could be added. Maximum is ${MAX_PHOTOS} photos.`);
    }

    let loadedCount = 0;
    const newPhotos: SelectedPhoto[] = [];

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        const mime = file.type || 'image/jpeg';
        const optimizedDataUrl = await optimizeImageDataUrl(rawDataUrl, mime);

        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          dataUrl: optimizedDataUrl,
          mimeType: mime,
          size: file.size,
        });

        loadedCount++;
        if (loadedCount === filesToProcess.length) {
          setSelectedPhotos((prev) => {
            const combined = isAppend ? [...prev, ...newPhotos] : newPhotos;
            return combined.slice(0, MAX_PHOTOS);
          });
          // Set focus on newly added image if it's initial upload
          if (!isAppend) {
            setActivePhotoIndex(0);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInitialFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, false);
      // Reset input value so re-uploading identical file works
      e.target.value = '';
    }
  };

  const handleAddMoreInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, true);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, selectedPhotos.length > 0);
    }
  };

  const handleRemovePhoto = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activePhotoIndex >= filtered.length) {
        setActivePhotoIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  const handleClearAllPhotos = () => {
    setSelectedPhotos([]);
    setActivePhotoIndex(0);
    setDetectedMaterials([]);
    setMaterialConfidences({});
    setAiSummary(null);
    setAnalysisError(null);
  };

  // Perform multi-image analysis with Gemini multimodal API
  const handleAnalyzeWaste = async () => {
    if (selectedPhotos.length === 0) {
      setAnalysisError('Please upload at least 1 photo to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const payloadImages = selectedPhotos.map((photo) => ({
        data: photo.dataUrl,
        mimeType: photo.mimeType,
      }));

      const result = await detectWasteFromImagesAPI(payloadImages);

      const rawNames: string[] = (result.detectedMaterials && result.detectedMaterials.length > 0)
        ? result.detectedMaterials
        : (result.items || []).map((it) => it.name);

      const uniqueNames = Array.from(
        new Set(rawNames.map((n) => n.trim()).filter((n) => n.length > 0))
      );

      setDetectedMaterials(uniqueNames);

      const confMap: Record<string, number> = {};
      if (result.items && Array.isArray(result.items)) {
        for (const it of result.items) {
          if (it.name && typeof it.confidence === 'number') {
            confMap[it.name.trim().toLowerCase()] = it.confidence;
          }
        }
      }
      setMaterialConfidences(confMap);

      setAiSummary(
        result.summary ||
          (uniqueNames.length > 0
            ? `Identified ${uniqueNames.length} materials across your ${selectedPhotos.length} photo(s).`
            : 'No recognizable waste items found. You can add materials manually below.')
      );
    } catch (err: any) {
      console.error('Waste detection failed:', err);
      setAnalysisError(
        err.message || 'Unable to analyze images. Please try again or add materials manually.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveItem = (itemName: string) => {
    setDetectedMaterials((prev) =>
      prev.filter((m) => m.trim().toLowerCase() !== itemName.trim().toLowerCase())
    );
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customItemInput.trim();
    if (!trimmed) return;

    const exists = detectedMaterials.some(
      (m) => m.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      setDetectedMaterials((prev) => [...prev, trimmed]);
    }
    setCustomItemInput('');
  };

  const handleConfirmAndGenerate = async () => {
    // SOURCE OF TRUTH: Read exclusively and strictly from the current state of detectedMaterials
    const currentMaterials = detectedMaterials.map((m) => m.trim()).filter((m) => m.length > 0);

    if (currentMaterials.length === 0) {
      setAnalysisError('Please add or confirm at least one waste material before generating ideas.');
      return;
    }

    setIsGeneratingProjects(true);
    setAnalysisError(null);

    try {
      const projects = await generateProjectsAPI(currentMaterials);
      onProjectsGenerated(projects, currentMaterials);
      navigate('/recommendations', {
        state: { projects, wasteItems: currentMaterials },
      });
    } catch (err: any) {
      console.error('Project generation error:', err);
      setAnalysisError('AI is temporarily unavailable. Please try again.');
    } finally {
      setIsGeneratingProjects(false);
    }
  };

  const currentPreviewPhoto = selectedPhotos[activePhotoIndex] || selectedPhotos[0];

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          <Camera className="h-3.5 w-3.5" />
          <span>Gemini Vision Waste Detection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
          Upload Waste Photos
        </h1>
        <p className="mt-2 text-stone-600 text-sm sm:text-base">
          Snap or upload up to 5 photos of your recyclable household packaging, containers, or scraps.
          Gemini analyzes all photos together to detect reusable materials.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photos Upload & Thumbnails */}
        <div className="lg:col-span-6 space-y-4">
          {/* Hidden file input for initial selection (supports multiple files) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={handleInitialFileInputChange}
            className="hidden"
            id="photos-file-input"
          />

          {/* Hidden file input for 'Add More Photos' */}
          <input
            type="file"
            ref={addMoreInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={handleAddMoreInputChange}
            className="hidden"
            id="add-more-photos-input"
          />

          {selectedPhotos.length === 0 ? (
            /* Empty State / Dropzone */
            <div
              id="photo-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-stone-300 bg-white hover:border-emerald-500 hover:bg-stone-50/50'
              }`}
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-2xs">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 font-display">
                Upload Waste Photos
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Select 1 to 5 photos from your device, or drag and drop them here.
              </p>
              <p className="text-[11px] text-stone-400 mt-1 font-medium">
                Supports JPG, JPEG, PNG, WEBP (Up to 5 images)
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-900 text-white px-5 py-2.5 text-xs font-semibold shadow-xs hover:bg-stone-800 transition">
                <Images className="h-4 w-4" />
                <span>Upload Waste Photos</span>
              </div>
            </div>
          ) : (
            /* Selected Photos Manager */
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              {/* Main Active Photo Preview */}
              <div className="relative aspect-4/3 bg-stone-950 flex items-center justify-center">
                {currentPreviewPhoto && (
                  <img
                    src={currentPreviewPhoto.dataUrl}
                    alt={currentPreviewPhoto.name || 'Waste photo preview'}
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {/* Overlay while analyzing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold">
                      Analyzing {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} together...
                    </p>
                    <p className="text-xs text-stone-300 mt-1 max-w-xs">
                      Gemini is scanning for plastics, cardboard, jars, cans, and reusable packaging
                    </p>
                  </div>
                )}

                {/* Photo indicator badge */}
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  Photo {activePhotoIndex + 1} of {selectedPhotos.length}
                </div>

                {/* Remove active photo button */}
                <button
                  onClick={(e) => handleRemovePhoto(currentPreviewPhoto.id, e)}
                  disabled={isAnalyzing}
                  className="absolute top-3 right-3 bg-stone-900/80 hover:bg-red-600 backdrop-blur-xs text-white p-1.5 rounded-lg transition disabled:opacity-50"
                  title="Remove this photo"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status & Control Header */}
              <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Images className="h-4 w-4 text-emerald-600" />
                  <span>{selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} selected</span>
                  <span className="text-stone-400 font-normal">
                    ({selectedPhotos.length}/{MAX_PHOTOS})
                  </span>
                </span>

                <div className="flex items-center gap-3">
                  {selectedPhotos.length < MAX_PHOTOS && (
                    <button
                      id="add-more-photos-btn"
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Add More Photos</span>
                    </button>
                  )}
                  <button
                    onClick={handleClearAllPhotos}
                    disabled={isAnalyzing}
                    className="text-xs font-medium text-stone-500 hover:text-red-600 disabled:opacity-50 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="p-3 bg-stone-100/60 border-t border-stone-200">
                <p className="text-[11px] font-semibold text-stone-500 mb-2 uppercase tracking-wider">
                  Selected Photos (Click to preview, X to remove)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {selectedPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition group ${
                        activePhotoIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-stone-900/80 text-white text-[9px] font-bold px-1 rounded-xs">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={(e) => handleRemovePhoto(photo.id, e)}
                        disabled={isAnalyzing}
                        className="absolute top-1 right-1 bg-stone-900/80 hover:bg-red-600 text-white p-0.5 rounded-full opacity-80 hover:opacity-100 transition"
                        title={`Remove photo ${idx + 1}`}
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more placeholder button inside grid if under limit */}
                  {selectedPhotos.length < MAX_PHOTOS && (
                    <button
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-stone-400 hover:text-emerald-700 transition"
                      title="Add more photos"
                    >
                      <Plus className="h-4 w-4 mb-0.5" />
                      <span className="text-[10px] font-semibold leading-none">Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Bar: "Analyze Waste" Button */}
              <div className="p-4 bg-white border-t border-stone-200">
                <button
                  id="analyze-waste-btn"
                  onClick={handleAnalyzeWaste}
                  disabled={isAnalyzing || selectedPhotos.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white py-3 text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      <span>Analyzing {selectedPhotos.length} Photo{selectedPhotos.length > 1 ? 's' : ''}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Analyze Waste ({selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick tips guide */}
          <div className="rounded-xl bg-stone-100/70 border border-stone-200/80 p-4 text-xs text-stone-600">
            <p className="font-bold text-stone-800 mb-1">Tips for best AI recognition:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-stone-500">
              <li>Upload 1 to 5 photos from different angles or different waste materials.</li>
              <li>Plastics, cardboard boxes, cans, glass jars, and textiles are automatically recognized.</li>
              <li>Identical materials across photos are automatically grouped and deduplicated.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: AI Detected Materials & Final Confirmation */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div>
                <h2 id="detected-materials-title" className="text-lg font-bold text-stone-900 font-display">
                  AI Detected Materials — {detectedMaterials.length} {detectedMaterials.length === 1 ? 'item' : 'items'}
                </h2>
                <p className="text-xs text-stone-500">
                  Review, edit, or add materials before generating DIY blueprints.
                </p>
              </div>
              <span
                id="detected-materials-count-badge"
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  detectedMaterials.length > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {detectedMaterials.length} {detectedMaterials.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="mb-4 flex flex-col gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-900 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 font-medium">
                    <span>{analysisError}</span>
                  </div>
                  <button
                    onClick={() => setAnalysisError(null)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* Try Again Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={detectedMaterials.length > 0 ? handleConfirmAndGenerate : handleAnalyzeWaste}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}

            {/* Content states */}
            {isAnalyzing ? (
              <div className="py-12 text-center text-stone-500 space-y-2">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-700" />
                <p className="text-sm font-semibold text-stone-800">Gemini is analyzing your photos...</p>
                <p className="text-xs text-stone-500">
                  Scanning {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} for recyclable materials.
                </p>
              </div>
            ) : detectedMaterials.length === 0 ? (
              <div className="py-8 text-center text-stone-500">
                <p className="text-sm font-semibold text-stone-700">No materials confirmed (0 items)</p>
                <p className="text-xs text-stone-500 mt-1 mb-2">
                  {selectedPhotos.length > 0
                    ? 'No materials currently selected. Add materials manually below or re-analyze photos.'
                    : 'Upload waste photos on the left or add materials manually below.'}
                </p>
              </div>
            ) : (
              <div>
                {aiSummary && (
                  <div className="mb-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3 text-xs text-emerald-900">
                    <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                      <span>AI Vision Result:</span>
                    </p>
                    <p className="text-stone-700">{aiSummary}</p>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-800">
                    Confirmed Materials:
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Click &times; to remove any material
                  </span>
                </div>

                {/* List of Detected Materials with X button and confidence */}
                <div className="space-y-2 mb-6">
                  {detectedMaterials.map((material) => {
                    const confidence = materialConfidences[material.toLowerCase()];
                    return (
                      <div
                        key={material}
                        className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span className="text-sm font-semibold text-stone-900 capitalize">
                            {material}
                          </span>
                          {typeof confidence === 'number' && (
                            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded-sm">
                              {Math.round(confidence * 100)}% match
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(material)}
                          className="rounded-lg p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                          title={`Remove ${material}`}
                          aria-label={`Remove ${material}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Custom / Additional Material Manually */}
            {!isAnalyzing && (
              <form onSubmit={handleAddCustomItem} className="flex gap-2 mb-6 pt-3 border-t border-stone-100">
                <input
                  id="custom-material-input"
                  type="text"
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  placeholder="Add material manually (e.g. Cardboard, Glass jars, Tin cans)..."
                  className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  id="add-material-btn"
                  type="submit"
                  className="rounded-xl bg-stone-800 hover:bg-stone-900 text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            )}

            {/* Final Confirmation and Generation CTA */}
            <div className="space-y-2">
              <button
                id="confirm-and-generate-btn"
                onClick={handleConfirmAndGenerate}
                disabled={detectedMaterials.length === 0 || isAnalyzing || isGeneratingProjects}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-sm font-bold shadow-md shadow-emerald-900/15 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isGeneratingProjects ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gemini is Crafting Projects...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Confirm &amp; Generate Ideas ({detectedMaterials.length} {detectedMaterials.length === 1 ? 'item' : 'items'})
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  navigate('/select', {
                    state: { preSelected: detectedMaterials },
                  })
                }
                className="w-full text-center py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
              >
                Or choose from full materials catalog &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Experience Overlay */}
      {isGeneratingProjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4">
          <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 font-display tracking-tight mb-2">
              ✨ AI is turning your waste into ideas...
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto mb-5">
              Analyzing your confirmed materials and crafting 5 practical, creative DIY projects with full instructions.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 py-2.5 px-4 rounded-xl">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Generating step-by-step instructions &amp; materials list...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
