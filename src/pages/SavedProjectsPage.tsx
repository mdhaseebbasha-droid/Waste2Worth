import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  ArrowRight,
  Clock,
  Gauge,
  Sparkles,
  Search,
  LogIn,
  AlertCircle,
  FolderHeart,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { DIYProject } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getSavedProjects, removeSavedProject } from '../services/api.ts';

interface SavedProjectsPageProps {
  onSelectProject: (project: DIYProject) => void;
  onOpenAuth: () => void;
}

export const SavedProjectsPage: React.FC<SavedProjectsPageProps> = ({
  onSelectProject,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [savedProjects, setSavedProjects] = useState<DIYProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const list = await getSavedProjects(currentUser?.uid);
      setSavedProjects(list);
    } catch (err) {
      console.error('Error fetching saved:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [currentUser?.uid]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRemove = async (e: React.MouseEvent, projectId: string, title: string) => {
    e.stopPropagation();
    try {
      await removeSavedProject(currentUser?.uid, projectId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast(`Removed "${title}" from saved projects.`);
    } catch (err) {
      console.error('Error removing:', err);
    }
  };

  const handleView = (project: DIYProject) => {
    onSelectProject(project);
    navigate(`/project/${project.id}`, { state: { project } });
  };

  const filtered = savedProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.wasteUsed.some((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved DIY Portfolio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
            My Saved Projects
          </h1>
          <p className="mt-2 text-stone-600 text-sm max-w-2xl">
            {currentUser
              ? `Synced with your Firebase account (${currentUser.email})`
              : 'Stored in your browser. Sign in to sync across all your devices.'}
          </p>
        </div>

        {!currentUser && (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold shadow-2xs transition"
          >
            <Cloud className="h-4 w-4" />
            <span>Sign In to Sync Projects</span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      {savedProjects.length > 0 && (
        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved projects by name or waste..."
            className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-xs text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="py-20 text-center text-stone-400">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading saved projects...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
            <FolderHeart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 font-display">
            {searchQuery ? 'No matching projects found' : 'No Saved Projects Yet'}
          </h3>
          <p className="text-xs text-stone-500 mt-1.5 mb-6">
            {searchQuery
              ? 'Try adjusting your search keywords.'
              : 'Select waste materials or upload a photo to generate creative upcycling ideas, then bookmark your favorites!'}
          </p>
          <button
            onClick={() => navigate('/select')}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition"
          >
            Start Creating DIY Ideas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => handleView(project)}
              className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="rounded-md bg-stone-100 px-2.5 py-0.5 font-semibold text-stone-700">
                    {project.category}
                  </span>
                  <button
                    onClick={(e) => handleRemove(e, project.id, project.title)}
                    className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-stone-900 font-display group-hover:text-emerald-800 transition line-clamp-2">
                  {project.title}
                </h3>

                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-4 flex items-center gap-3 text-xs text-stone-500">
                  <span className="font-semibold text-emerald-700">{project.difficulty}</span>
                  <span>•</span>
                  <span>{project.estimatedTime}</span>
                  <span>•</span>
                  <span>{project.steps.length} steps</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 truncate max-w-[150px]">
                  Waste: {project.wasteUsed.join(', ')}
                </span>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  <span>View Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
