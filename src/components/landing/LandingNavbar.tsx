import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, LogOut, Globe, Compass, ArrowRight } from 'lucide-react';
import { PaperPlaneLogo } from './OrigamiIcons';
import { useAuth } from '../../lib/AuthContext';

interface LandingNavbarProps {
  onSignInClick: () => void;
  activeNav?: string;
  onNavClick: (item: string) => void;
  onPlanTrip?: () => void;
  theme?: 'airplane' | 'earth';
  onThemeChange?: (theme: 'airplane' | 'earth') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onSignInClick,
  activeNav = 'home',
  onNavClick,
  onPlanTrip,
  theme = 'airplane',
  onThemeChange,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Agent Comparison', id: 'agent-comparison' },
    { label: 'Research', id: 'research' },
    { label: 'About Us', id: 'about-us' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#070e1b]/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent border-b border-white/5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center transform -rotate-6 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105 shadow-sm">
            <PaperPlaneLogo className="w-6 h-6 text-cyan-400 drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight leading-none font-serif-heading">
                Smart AI
              </span>
              <span className="text-cyan-400 font-sans text-xs font-bold px-1.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 leading-none">
                3.0
              </span>
            </div>
            <span className="text-slate-400 text-[10px] font-medium tracking-[0.2em] uppercase leading-tight mt-1">
              Travel Planner & Research
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex items-center gap-6 2xl:gap-8">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`text-xs font-medium tracking-wide transition-colors cursor-pointer py-1.5 relative ${
                  isActive
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side Controls: Theme Switcher + Plan CTA + Auth */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Animated Background Mode Switcher (Airplane / Earth) */}
          {onThemeChange && (
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 flex items-center gap-1 text-xs">
              <button
                id="theme-btn-airplane"
                aria-label="Switch to Paper Airplane background animation"
                onClick={() => onThemeChange('airplane')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  theme === 'airplane'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Scroll-driven Paper Airplane flight"
              >
                <span>✈️</span>
                <span>Flight</span>
              </button>
              <button
                id="theme-btn-earth"
                aria-label="Switch to 3D Earth orbit animation"
                onClick={() => onThemeChange('earth')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  theme === 'earth'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="3D Earth Orbit sequence"
              >
                <span>🌍</span>
                <span>Orbit</span>
              </button>
            </div>
          )}

          {/* Prominent Plan My Trip Button */}
          {onPlanTrip && (
            <button
              onClick={onPlanTrip}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 active:scale-95 transition-all duration-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/30 ring-1 ring-cyan-300/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Plan My Trip</span>
            </button>
          )}

          {/* Auth Controls */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all duration-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 p-2 z-50 text-slate-200 backdrop-blur-xl">
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {user.tier} explorer
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 active:scale-95 transition-all duration-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {onPlanTrip && (
            <button
              onClick={onPlanTrip}
              className="bg-cyan-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Plan
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 text-white border border-white/15"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070e1b]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavClick(item.id);
                }}
                className={`text-left py-2 px-3 rounded-lg text-sm font-medium transition ${
                  activeNav === item.id
                    ? 'bg-cyan-950/60 text-cyan-400 font-bold border border-cyan-800/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mode Switcher on Mobile */}
          {onThemeChange && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">Background Animation</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onThemeChange('airplane')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    theme === 'airplane' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 bg-white/5'
                  }`}
                >
                  ✈️ Flight
                </button>
                <button
                  onClick={() => onThemeChange('earth')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    theme === 'earth' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 bg-white/5'
                  }`}
                >
                  🌍 Orbit
                </button>
              </div>
            </div>
          )}

          {/* Sign In / User Status on Mobile */}
          <div className="pt-2 border-t border-white/10">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Signed in as {user.name}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-rose-400 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/20"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
