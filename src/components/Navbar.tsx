import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { subscribeSavedProjects } from '../services/api.ts';
import { DIYProject } from '../types/index.ts';
import {
  Recycle,
  Sparkles,
  Camera,
  Bookmark,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeSavedProjects(currentUser?.uid, (projects: DIYProject[]) => {
      setSavedCount(projects.length);
    });
    return unsub;
  }, [currentUser?.uid]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Select Waste', path: '/select', icon: Layers },
    { label: 'Upload Waste Photos', path: '/scan', icon: Camera },
    { label: 'Saved Projects', path: '/saved', icon: Bookmark, badge: savedCount },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link
            to="/"
            id="brand-logo-link"
            className="flex items-center gap-2.5 group focus:outline-hidden"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-transform duration-200">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-extrabold text-lg text-stone-900 tracking-tight">
                  Waste2Worth
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                Upcycle Household Waste
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'text-emerald-900 bg-emerald-100/60 font-semibold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {Icon && <Icon className={`h-4 w-4 ${active ? 'text-emerald-700' : 'text-stone-400'}`} />}
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-full bg-stone-100/80 border border-stone-200/80 py-1.5 pl-2 pr-3.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                    {currentUser.displayName
                      ? currentUser.displayName[0]
                      : currentUser.email
                      ? currentUser.email[0]
                      : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-stone-800 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  id="user-logout-btn"
                  onClick={() => logout()}
                  title="Log out"
                  className="rounded-xl p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-signin-btn"
                  onClick={() => onOpenAuth('login')}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition"
                >
                  Sign In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-sm font-semibold shadow-xs transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-stone-600 hover:bg-stone-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6 text-stone-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-b border-stone-200 bg-stone-50 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  active ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 text-xs font-bold text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-stone-200">
            {currentUser ? (
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-stone-800">{currentUser.displayName || 'User'}</p>
                    <p className="text-stone-500 truncate max-w-[180px]">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  id="mobile-logout-btn"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="mobile-signin-btn"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-xl border border-stone-300 py-2.5 text-center text-sm font-semibold text-stone-700"
                >
                  Sign In
                </button>
                <button
                  id="mobile-signup-btn"
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-xl bg-emerald-700 py-2.5 text-center text-sm font-semibold text-white shadow-xs"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
