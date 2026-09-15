import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Recycle className="h-4 w-4" />
              </div>
              <span className="font-display font-extrabold text-white text-base tracking-tight">
                Waste2Worth AI
              </span>
            </div>
            <p className="text-stone-400 max-w-sm leading-relaxed">
              Empowering households worldwide to upcycle everyday waste materials into functional, beautiful items using Gemini AI.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Gemini 2.5 Flash</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Firebase Authentication & Cloud Firestore</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/select" className="hover:text-emerald-400 transition">
                  Select Waste
                </Link>
              </li>
              <li>
                <Link to="/scan" className="hover:text-emerald-400 transition">
                  AI Waste Camera Scanner
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-emerald-400 transition">
                  My Saved Projects
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] mb-3">
              Eco Impact
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>• Divert plastic & cardboard from landfills</li>
              <li>• Zero-cost creative craft blueprints</li>
              <li>• Real YouTube video tutorials</li>
              <li>• Safe for families & DIY enthusiasts</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
          <p>© {new Date().getFullYear()} Waste2Worth AI. Sustainable DIY Powered by Google Gemini.</p>
          <p className="flex items-center gap-1">
            Built with care for a cleaner planet
          </p>
        </div>
      </div>
    </footer>
  );
};
