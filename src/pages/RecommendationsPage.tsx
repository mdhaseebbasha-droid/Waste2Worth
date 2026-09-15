import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Gauge,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Package,
  Layers,
  CheckCircle2,
  FolderHeart,
  Palette,
  Hammer,
  Lamp,
  Flower2,
  Boxes,
  Home,
  Wrench,
  Sparkle,
} from 'lucide-react';
import { DIYProject } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { saveProject, removeSavedProject, getSavedProjects } from '../services/api.ts';

type FilterType =
  | 'All'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Decoration'
  | 'Home'
  | 'Garden'
  | 'Useful';

const FILTER_OPTIONS: FilterType[] = [
  'All',
  'Easy',
  'Medium',
  'Hard',
  'Decoration',
  'Home',
  'Garden',
  'Useful',
];

interface RecommendationsPageProps {
  projects: DIYProject[];
  wasteItems: string[];
  onSelectProject: (project: DIYProject) => void;
  onOpenAuth: () => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  projects: propProjects,
  wasteItems: propWasteItems,
  onSelectProject,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const stateData = location.state as { projects?: DIYProject[]; wasteItems?: string[] } | null;
  const currentProjects = stateData?.projects || propProjects;
  const currentWaste = stateData?.wasteItems || propWasteItems;

  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved projects to show bookmark state
  useEffect(() => {
    async function loadSaved() {
      try {
        const saved = await getSavedProjects(currentUser?.uid);
        setSavedProjectIds(saved.map((p) => p.id));
      } catch {
        // ignore
      }
    }
    loadSaved();
  }, [currentUser?.uid]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSave = async (e: React.MouseEvent, project: DIYProject) => {
    e.stopPropagation();
    const isSaved = savedProjectIds.includes(project.id);

    try {
      if (isSaved) {
        await removeSavedProject(currentUser?.uid, project.id);
        setSavedProjectIds((prev) => prev.filter((id) => id !== project.id));
        showToast(`Removed "${project.title}" from saved projects.`);
      } else {
        await saveProject(currentUser?.uid, project);
        setSavedProjectIds((prev) => [...prev, project.id]);
        showToast(
          currentUser
            ? `Saved "${project.title}" to your account!`
            : `Saved "${project.title}" locally. Sign in anytime to sync.`
        );
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleCardClick = (project: DIYProject) => {
    onSelectProject(project);
    navigate(`/project/${project.id}`, { state: { project } });
  };

  const filteredProjects = currentProjects.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Easy') return p.difficulty.toLowerCase() === 'easy';
    if (activeFilter === 'Medium') return p.difficulty.toLowerCase() === 'medium';
    if (activeFilter === 'Hard') {
      return (
        p.difficulty.toLowerCase() === 'hard' ||
        p.difficulty.toLowerCase() === 'challenging'
      );
    }

    const text = `${p.category} ${p.title} ${p.description}`.toLowerCase();

    if (activeFilter === 'Decoration') {
      return (
        text.includes('decor') ||
        text.includes('art') ||
        text.includes('wall') ||
        text.includes('vase') ||
        text.includes('ornament')
      );
    }
    if (activeFilter === 'Home') {
      return (
        text.includes('home') ||
        text.includes('room') ||
        text.includes('kitchen') ||
        text.includes('desk') ||
        text.includes('lamp') ||
        text.includes('light') ||
        text.includes('table')
      );
    }
    if (activeFilter === 'Garden') {
      return (
        text.includes('garden') ||
        text.includes('plant') ||
        text.includes('pot') ||
        text.includes('outdoor') ||
        text.includes('green')
      );
    }
    if (activeFilter === 'Useful') {
      return (
        text.includes('useful') ||
        text.includes('storage') ||
        text.includes('organizer') ||
        text.includes('holder') ||
        text.includes('box') ||
        text.includes('basket') ||
        text.includes('tool') ||
        text.includes('dispenser') ||
        text.includes('planter')
      );
    }

    return true;
  });

  // Visual styling and illustration cues per category
  const getProjectVisual = (project: DIYProject) => {
    const text = `${project.title} ${project.category}`.toLowerCase();
    if (text.includes('planter') || text.includes('garden') || text.includes('pot') || text.includes('plant')) {
      return {
        icon: Flower2,
        accentBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-200',
        badge: 'Garden & Planter',
        headerGrad: 'from-emerald-50 via-teal-50/50 to-white',
        iconBg: 'bg-emerald-100 text-emerald-700',
      };
    }
    if (text.includes('lamp') || text.includes('light') || text.includes('lantern') || text.includes('candle')) {
      return {
        icon: Lamp,
        accentBg: 'bg-amber-500/10 text-amber-800 border-amber-200',
        badge: 'Lighting & Decor',
        headerGrad: 'from-amber-50 via-orange-50/40 to-white',
        iconBg: 'bg-amber-100 text-amber-700',
      };
    }
    if (text.includes('organizer') || text.includes('holder') || text.includes('storage') || text.includes('box') || text.includes('basket')) {
      return {
        icon: Boxes,
        accentBg: 'bg-cyan-500/10 text-cyan-800 border-cyan-200',
        badge: 'Storage & Organizer',
        headerGrad: 'from-cyan-50 via-sky-50/50 to-white',
        iconBg: 'bg-cyan-100 text-cyan-700',
      };
    }
    if (text.includes('decor') || text.includes('art') || text.includes('wall') || text.includes('vase')) {
      return {
        icon: Palette,
        accentBg: 'bg-rose-500/10 text-rose-800 border-rose-200',
        badge: 'Home Decoration',
        headerGrad: 'from-rose-50 via-pink-50/40 to-white',
        iconBg: 'bg-rose-100 text-rose-700',
      };
    }
    if (text.includes('home') || text.includes('desk') || text.includes('room')) {
      return {
        icon: Home,
        accentBg: 'bg-indigo-500/10 text-indigo-800 border-indigo-200',
        badge: 'Home Product',
        headerGrad: 'from-indigo-50 via-slate-50 to-white',
        iconBg: 'bg-indigo-100 text-indigo-700',
      };
    }
    return {
      icon: Hammer,
      accentBg: 'bg-stone-500/10 text-stone-800 border-stone-200',
      badge: project.category || 'Useful Craft',
      headerGrad: 'from-stone-100/70 via-stone-50 to-white',
      iconBg: 'bg-stone-200/80 text-stone-700',
    };
  };

  if (!currentProjects || currentProjects.length === 0) {
    return (
      <div className="min-h-screen py-16 text-center max-w-lg mx-auto px-4">
        <div className="h-16 w-16 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-4">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 font-display">No Projects Yet</h2>
        <p className="text-stone-600 text-sm mt-2 mb-6">
          Pick or scan your household waste materials first, and Gemini AI will generate 5 customized DIY project recommendations.
        </p>
        <button
          onClick={() => navigate('/select')}
          className="rounded-xl bg-emerald-700 text-white px-6 py-3 font-semibold text-sm shadow-md hover:bg-emerald-800 transition"
        >
          Select Waste Materials
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section required by specification */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
            ✨ Ideas Made From Your Waste
          </h1>
          <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-2xl">
            Here are some things you can create with the materials you already have.
          </p>
          {currentWaste && currentWaste.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-xs text-stone-400 font-medium">Confirmed waste:</span>
              {currentWaste.map((item, i) => (
                <span
                  key={i}
                  className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 border border-stone-200/80"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/select', { state: { preSelected: currentWaste } })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2.5 text-xs font-semibold text-stone-700 transition shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Change Materials</span>
          </button>

          <button
            onClick={() => navigate('/saved')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-800 transition"
          >
            <FolderHeart className="h-3.5 w-3.5 text-stone-600" />
            <span>Saved Projects</span>
          </button>
        </div>
      </div>

      {/* Required Filters: All, Easy, Medium, Hard, Decoration, Home, Garden, Useful */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-2 shrink-0">
            Filters:
          </span>
          {FILTER_OPTIONS.map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <button
                key={filter}
                id={`filter-btn-${filter.toLowerCase()}`}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-200/60 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Project Cards Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, idx) => {
            const isSaved = savedProjectIds.includes(project.id);
            const visual = getProjectVisual(project);
            const VisualIcon = visual.icon;

            return (
              <div
                key={project.id || idx}
                id={`project-card-${idx}`}
                onClick={() => handleCardClick(project)}
                className="group cursor-pointer rounded-2xl border border-stone-200 bg-white shadow-2xs hover:shadow-xl hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden relative"
              >
                {/* Visual Header with Category and Illustration */}
                <div className={`relative p-5 pb-4 bg-gradient-to-b ${visual.headerGrad} border-b border-stone-100`}>
                  <div className="flex items-center justify-between mb-3">
                    {/* Category Pill with Icon */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${visual.accentBg}`}
                    >
                      <VisualIcon className="h-3.5 w-3.5" />
                      <span>{project.category || visual.badge}</span>
                    </span>

                    {/* Bookmark Save Button */}
                    <button
                      onClick={(e) => handleToggleSave(e, project)}
                      title={isSaved ? 'Remove from saved' : 'Save project'}
                      className={`rounded-full p-2 transition ${
                        isSaved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100/90 text-stone-400 hover:text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 fill-emerald-700 text-emerald-700" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Project Title */}
                  <h3 className="text-lg font-bold text-stone-900 font-display group-hover:text-emerald-800 transition line-clamp-2">
                    {project.title}
                  </h3>

                  {/* Meta: Difficulty and Estimated Time */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Gauge className="h-3.5 w-3.5 text-stone-400" />
                      <span
                        className={`font-semibold ${
                          project.difficulty.toLowerCase() === 'easy'
                            ? 'text-emerald-700'
                            : project.difficulty.toLowerCase() === 'medium'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {project.difficulty}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>{project.estimatedTime}</span>
                    </span>
                  </div>
                </div>

                {/* Project Description & Materials */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed mb-4">
                    {project.description}
                  </p>

                  {/* Waste Materials Used */}
                  <div className="space-y-1.5 pt-3 border-t border-stone-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Waste Materials Used:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.wasteUsed.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200/60"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card CTA with View Project button */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 group-hover:text-stone-700">
                      {project.steps.length} clear steps
                    </span>
                    <button
                      id={`view-project-btn-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(project);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 group-hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition"
                    >
                      <span>View Project</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Filter State */
        <div className="text-center py-16 rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-8">
          <div className="h-12 w-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            No projects found under "{activeFilter}"
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-4">
            None of the 5 generated ideas matched the selected filter. Try choosing another filter or show all.
          </p>
          <button
            onClick={() => setActiveFilter('All')}
            className="rounded-xl bg-emerald-700 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-800 transition"
          >
            Show All Projects
          </button>
        </div>
      )}
    </div>
  );
};

