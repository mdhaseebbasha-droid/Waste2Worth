import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Gauge,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  ExternalLink,
  Play,
  Hammer,
  Package,
  Wrench,
  Sparkles,
  Check,
  Youtube,
  Tv,
} from 'lucide-react';
import { DIYProject, YouTubeSearchResult, YouTubeVideoItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { saveProject, removeSavedProject, getSavedProjects, searchYouTubeAPI } from '../services/api.ts';

interface ProjectDetailsPageProps {
  currentProject: DIYProject | null;
  onOpenAuth: () => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  currentProject: propProject,
  onOpenAuth,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Get project from location state or props or saved storage
  const locationProject = (location.state as any)?.project as DIYProject | undefined;
  const [project, setProject] = useState<DIYProject | null>(locationProject || propProject || null);
  const [isSaved, setIsSaved] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // YouTube Tutorial state
  const [ytData, setYtData] = useState<YouTubeSearchResult | null>(null);
  const [ytLoading, setYtLoading] = useState(false);

  // If project not in state, look up in saved projects
  useEffect(() => {
    async function loadProject() {
      if (!project && id) {
        try {
          const allSaved = await getSavedProjects(currentUser?.uid);
          const found = allSaved.find((p) => p.id === id);
          if (found) {
            setProject(found);
          }
        } catch {
          // ignore
        }
      }
    }
    loadProject();
  }, [id, project, currentUser?.uid]);

  // Check saved status
  useEffect(() => {
    async function checkSaved() {
      if (!project) return;
      try {
        const allSaved = await getSavedProjects(currentUser?.uid);
        setIsSaved(allSaved.some((p) => p.id === project.id));
      } catch {
        // ignore
      }
    }
    checkSaved();
  }, [project, currentUser?.uid]);

  // Fetch YouTube tutorials for project
  useEffect(() => {
    if (!project?.youtubeSearchQuery) return;

    let isMounted = true;
    async function fetchYT() {
      setYtLoading(true);
      try {
        const result = await searchYouTubeAPI(project!.youtubeSearchQuery);
        if (isMounted) {
          setYtData(result);
        }
      } catch (err) {
        console.warn('YouTube fetch error:', err);
      } finally {
        if (isMounted) setYtLoading(false);
      }
    }
    fetchYT();

    return () => {
      isMounted = false;
    };
  }, [project?.youtubeSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSave = async () => {
    if (!project) return;

    try {
      if (isSaved) {
        await removeSavedProject(currentUser?.uid, project.id);
        setIsSaved(false);
        showToast('Removed from saved projects.');
      } else {
        await saveProject(currentUser?.uid, project);
        setIsSaved(true);
        showToast(
          currentUser
            ? 'Project saved to your account!'
            : 'Project saved locally. Sign in anytime to sync.'
        );
      }
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const toggleStep = (stepIdx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIdx) ? prev.filter((i) => i !== stepIdx) : [...prev, stepIdx]
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: project?.title,
          text: project?.description,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Project link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!project) {
    return (
      <div className="min-h-screen py-16 text-center max-w-lg mx-auto px-4">
        <h2 className="text-2xl font-bold text-stone-900 font-display">Project Not Found</h2>
        <p className="text-stone-600 text-sm mt-2 mb-6">
          The requested DIY guide is not available or has expired.
        </p>
        <button
          onClick={() => navigate('/select')}
          className="rounded-xl bg-emerald-700 text-white px-6 py-2.5 font-semibold text-sm shadow-md"
        >
          Select Waste Materials
        </button>
      </div>
    );
  }

  const completionPercent = Math.round(
    (completedSteps.length / (project.steps.length || 1)) * 100
  );

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation and Top Bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl px-3.5 py-2 shadow-2xs transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Share project"
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 p-2 text-stone-600 transition"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={handlePrint}
            title="Print DIY instructions"
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 p-2 text-stone-600 transition"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            id="details-save-project-btn"
            onClick={handleToggleSave}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-2xs transition ${
              isSaved
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-emerald-700" />
                <span>Saved to Projects</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Save Project</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 uppercase tracking-wider">
            {project.category}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
              project.difficulty === 'Easy'
                ? 'bg-emerald-100 text-emerald-800'
                : project.difficulty === 'Medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            Difficulty: {project.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            <Clock className="h-3 w-3 text-stone-500" />
            <span>{project.estimatedTime}</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight leading-snug">
          {project.title}
        </h1>

        <p className="mt-3 text-base text-stone-600 leading-relaxed max-w-3xl">
          {project.description}
        </p>

        {/* Progress Tracker Bar */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-stone-700">
              Maker Checklist Progress:
            </span>
            <span className="font-bold text-emerald-700">
              {completedSteps.length} of {project.steps.length} steps ({completionPercent}%)
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Guide Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Waste Materials, Additional Materials, Tools, Safety Tips */}
        <div className="lg:col-span-4 space-y-6">
          {/* Waste Materials */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-emerald-700" />
              <span>Waste Materials</span>
            </h3>
            <ul className="space-y-1.5 text-xs">
              {project.wasteUsed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-stone-800 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="capitalize">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Materials */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Hammer className="h-4 w-4 text-stone-500" />
              <span>Additional Materials</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-600">
              {project.additionalMaterials.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-stone-500" />
              <span>Tools</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-600">
              {project.tools.map((tool, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Tips */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Safety Tips</span>
            </h3>
            <ul className="space-y-2 text-xs text-amber-900">
              {project.safetyTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 font-medium leading-relaxed">
                  <span className="font-bold text-amber-700">!</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Step-by-Step & YouTube Tutorial */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step-by-Step */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-900 font-display">
                Step-by-Step
              </h2>
              <span className="text-xs text-stone-400 italic">
                Tap to check off steps as you go
              </span>
            </div>

            <div className="space-y-4">
              {project.steps.map((step, idx) => {
                const isChecked = completedSteps.includes(idx);
                const stepNumStr = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={idx}
                    id={`step-item-${idx}`}
                    onClick={() => toggleStep(idx)}
                    className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all flex items-start gap-4 ${
                      isChecked
                        ? 'border-emerald-200 bg-emerald-50/30 opacity-75'
                        : 'border-stone-200 bg-stone-50/30 hover:border-emerald-300 hover:bg-white'
                    }`}
                  >
                    {/* Big Step Number: 01, 02, 03 */}
                    <div
                      className={`h-11 w-11 rounded-xl border flex flex-col items-center justify-center shrink-0 transition ${
                        isChecked
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-stone-200 bg-white text-emerald-900'
                      }`}
                    >
                      {isChecked ? (
                        <Check className="h-5 w-5 stroke-[3]" />
                      ) : (
                        <span className="text-base font-extrabold font-mono tracking-tighter">
                          {stepNumStr}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono tracking-wider text-stone-400">
                          {stepNumStr}
                        </span>
                        {isChecked && (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Completed ✓
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm sm:text-base leading-relaxed ${
                          isChecked ? 'text-stone-500 line-through' : 'text-stone-800 font-medium'
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* YouTube Tutorial */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <div className="h-7 w-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Youtube className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 font-display">
                YouTube Tutorial
              </h2>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6 sm:p-8 text-center">
              <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Youtube className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                Watch DIY Video Tutorials
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto mb-4">
                Explore real video demonstrations and walkthroughs for this craft on YouTube.
              </p>

              {/* YouTube Search Query */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-3.5 py-1.5 text-xs text-stone-700 mb-6 max-w-full overflow-hidden">
                <span className="text-stone-400 font-semibold">Search query:</span>
                <span className="font-mono font-bold truncate">"{project.youtubeSearchQuery}"</span>
              </div>

              <div>
                <a
                  id="search-youtube-btn"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    project.youtubeSearchQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-sm font-bold shadow-md shadow-red-900/10 transition"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Search YouTube</span>
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
