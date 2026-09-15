import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Search,
  AlertCircle,
  Loader2,
  Info,
  Lightbulb,
} from 'lucide-react';
import { POPULAR_WASTE_MATERIALS } from '../data/materials.ts';
import { generateProjectsAPI } from '../services/api.ts';
import { DIYProject } from '../types/index.ts';

interface WasteSelectionPageProps {
  onProjectsGenerated: (projects: DIYProject[], wasteItems: string[]) => void;
}

export const WasteSelectionPage: React.FC<WasteSelectionPageProps> = ({
  onProjectsGenerated,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItemInput, setCustomItemInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Loading tip rotation
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const craftingTips = [
    'Gemini AI is analyzing material structural strength and bonding methods...',
    'Matching your materials with safe household tools and adhesives...',
    'Prioritizing practical storage, home decor, and functional household crafts...',
    'Designing 5 step-by-step DIY project blueprints...',
    'Searching for authentic video tutorials and safety guidelines...',
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % craftingTips.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Check if current load is a browser refresh
  const isPageReload = () => {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      }
      return (performance as any).navigation?.type === 1;
    } catch {
      return false;
    }
  };

  // Handle pre-selected materials only from intentional in-session navigation
  useEffect(() => {
    if (isPageReload()) {
      // Browser refresh: always start clean with 0 selected
      setSelectedItems([]);
      try {
        window.history.replaceState({}, document.title);
      } catch {
        // ignore
      }
      return;
    }

    if (location.state && (location.state as any).preSelected) {
      const incoming: string[] = (location.state as any).preSelected;
      if (Array.isArray(incoming) && incoming.length > 0) {
        const cleaned = Array.from(
          new Set(
            incoming
              .map((i) => (typeof i === 'string' ? i.trim() : ''))
              .filter((i) => i.length > 0)
          )
        );
        setSelectedItems(cleaned);
      }
      // Consume state so it won't persist into browser reload
      try {
        window.history.replaceState({}, document.title);
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  const categories = ['All', 'Plastic', 'Paper & Cardboard', 'Glass & Metal', 'Organic & Fabric', 'Other'];

  const filteredMaterials = POPULAR_WASTE_MATERIALS.filter((mat) => {
    const matchesCat = activeCategory === 'All' || mat.category === activeCategory;
    const matchesSearch =
      mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.examples.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleMaterial = (name: string) => {
    setSelectedItems((prev) =>
      prev.some((item) => item.toLowerCase() === name.toLowerCase())
        ? prev.filter((item) => item.toLowerCase() !== name.toLowerCase())
        : [...prev, name]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customItemInput.trim();
    if (!trimmed) return;
    if (!selectedItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedItems((prev) => [...prev, trimmed]);
    }
    setCustomItemInput('');
  };

  const handleRemoveSelectedItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.toLowerCase() !== name.toLowerCase())
    );
  };

  const handleGenerate = async () => {
    if (selectedItems.length === 0) {
      setGenerationError('Please select or add at least one waste item.');
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);

    try {
      const projects = await generateProjectsAPI(selectedItems);
      onProjectsGenerated(projects, selectedItems);
      navigate('/recommendations', {
        state: { projects, wasteItems: selectedItems },
      });
    } catch (err: any) {
      console.error('Generation failed:', err);
      setGenerationError('AI is temporarily unavailable. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
          <Layers className="h-3.5 w-3.5" />
          <span>Step 1 of 2: Materials Selection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
          What waste materials do you have at home?
        </h1>
        <p className="mt-2 text-stone-600 text-sm sm:text-base">
          Select all the recyclable packaging or items you have on hand. Gemini AI will blend them into creative, useful DIY upcycling projects.
        </p>
      </div>

      {/* Selected Items Sticky Tray / Drawer */}
      <div
        id="selected-items-tray"
        className="sticky top-18 z-30 mb-8 rounded-2xl border border-stone-300/80 bg-white/95 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Selected Waste Materials
              </span>
              <span
                id="selected-materials-count-badge"
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${
                  selectedItems.length > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {selectedItems.length} selected
              </span>
              {selectedItems.length > 0 && (
                <button
                  id="clear-all-selected-btn"
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-stone-400 hover:text-red-600 ml-2 underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <p className="text-xs sm:text-sm text-stone-400 italic">
                No waste items selected yet. Tap any card below or type a custom item.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-900 shadow-2xs"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleRemoveSelectedItem(item)}
                      className="rounded-full hover:bg-emerald-200/60 p-0.5 text-emerald-700 transition"
                      aria-label={`Remove ${item}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="sm:border-l sm:border-stone-200 sm:pl-5 shrink-0">
            <button
              id="generate-ideas-btn"
              onClick={handleGenerate}
              disabled={selectedItems.length === 0 || isGenerating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 text-sm sm:text-base font-bold shadow-md shadow-emerald-900/15 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Gemini is Crafting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Ideas</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generation error alert */}
      {generationError && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold text-stone-900">AI is temporarily unavailable. Please try again.</p>
              <p className="text-xs text-stone-600 mt-0.5">High demand on AI services. Please retry your generation.</p>
            </div>
          </div>
          <button
            id="try-again-btn"
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Loading Modal / Overlay */}
      {isGenerating && (
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
            <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3 text-xs text-stone-700 font-medium min-h-[46px] flex items-center justify-center">
              <span className="transition-all duration-300">{craftingTips[currentTipIndex]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Form & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Add custom waste */}
        <form onSubmit={handleAddCustom} className="md:col-span-7 flex gap-2">
          <div className="relative flex-1">
            <Package className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <input
              id="custom-waste-input"
              type="text"
              value={customItemInput}
              onChange={(e) => setCustomItemInput(e.target.value)}
              placeholder="Add custom waste (e.g. shoebox, coconut shell, wine cork...)"
              className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            id="add-custom-waste-btn"
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white px-4 py-2.5 text-sm font-semibold shadow-2xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Search existing list */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
          <input
            id="search-materials-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter list below..."
            className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {filteredMaterials.map((mat) => {
          const isSelected = selectedItems.some(
            (item) => item.toLowerCase() === mat.name.toLowerCase()
          );
          return (
            <div
              key={mat.id}
              id={`material-card-${mat.id}`}
              onClick={() => toggleMaterial(mat.name)}
              className={`group relative cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all duration-150 flex flex-col justify-between select-none ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                    {mat.category}
                  </span>
                  {/* Checkbox indicator */}
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-stone-300 bg-white group-hover:border-stone-400'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-base font-bold text-stone-900 font-display mb-1">
                  {mat.name}
                </h3>
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {mat.examples}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span
                  className={`font-semibold ${
                    isSelected ? 'text-emerald-800' : 'text-stone-400 group-hover:text-stone-600'
                  }`}
                >
                  {isSelected ? 'Selected' : '+ Tap to select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search State */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-stone-300 bg-stone-50/50">
          <Info className="h-8 w-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">No matching materials found</p>
          <p className="text-xs text-stone-500 mt-1">
            Try a different search or use "Add custom waste" above.
          </p>
        </div>
      )}
    </div>
  );
};
