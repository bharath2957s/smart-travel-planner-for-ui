/**
 * Smart AI Travel Planner 3.0
 * Unified Navigation System (Sidebar + Sticky Operational Header)
 *
 * Golden Hour Luxury Theme (Scoped to non-home pages):
 * - Navbar is --bg (#F6EFE6) with blurred translucent background that gains soft shadow after scrolling
 * - Clean responsive sidebar with --surface (#FFFFFF), warm gold/terracotta accents, and crisp typography
 * - Full 9-currency selector with live symbols
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, TripPlan } from '../types/travel';
import { CURRENCY_RATES } from '../lib/budget';
import { useAuth } from '../lib/AuthContext';

export type ActivePage =
  | 'landing'
  | 'dashboard'
  | 'planner'
  | 'itinerary'
  | 'globe'
  | 'flights'
  | 'hotels'
  | 'budget'
  | 'weather'
  | 'chat'
  | 'documents'
  | 'agents'
  | 'saved'
  | 'settings';

interface NavigationProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  activeTrip: TripPlan;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenQuickPlan: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenAuthModal?: () => void;
}

const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'SGD',
  'AED',
];

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  onNavigate,
  activeTrip,
  currency,
  onCurrencyChange,
  onOpenQuickPlan,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to add soft shadow to sticky operational navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSyncLive = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1200);
  };

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const navItemClass = (page: ActivePage) => {
    const isActive = activePage === page;
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-[#FBF6EE] text-[#14213D] border-l-4 border-l-[#D4A24C] shadow-2xs font-bold'
        : 'text-[#6B6F80] hover:text-[#14213D] hover:bg-[#FBF6EE]'
    }`;
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-[#14213D]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-label="Close mobile menu"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#FFFFFF] z-50 flex flex-col justify-between border-r border-[rgba(20,33,61,0.12)] shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-72'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="h-20 px-5 flex items-center justify-between border-b border-[rgba(20,33,61,0.12)] shrink-0 bg-[#FFFFFF]">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavClick('landing')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4A24C] via-[#E76F51] to-[#14213D] flex items-center justify-center p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#FFFFFF] rounded-[10px] flex items-center justify-center">
                  <span className="font-serif-heading text-lg font-bold bg-gradient-to-r from-[#D4A24C] to-[#E76F51] bg-clip-text text-transparent">
                    Æ
                  </span>
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-serif-heading text-sm font-bold tracking-[0.16em] text-[#14213D] uppercase truncate">
                    AETHERIS
                  </span>
                  <span className="text-[10px] text-[#D4A24C] font-semibold tracking-widest uppercase">
                    Golden Hour OS
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-[#6B6F80] hover:text-[#14213D] hover:bg-[#FBF6EE] transition-colors"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined text-lg">
                {sidebarCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#6B6F80] hover:text-[#14213D]"
              aria-label="Close Sidebar"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Quick Plan CTA Button (Terracotta main CTA) */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => {
                onOpenQuickPlan();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-between shadow-sm hover:shadow-md active:scale-98 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform">
                  auto_awesome
                </span>
                {!sidebarCollapsed && <span>Plan a Trip</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  AI Wizard
                </span>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-4 flex-1">
            {/* Core Section */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6F80]">
                  Core
                </div>
              )}
              <div onClick={() => handleNavClick('dashboard')} className={navItemClass('dashboard')}>
                <span className="material-symbols-outlined text-lg">grid_view</span>
                {!sidebarCollapsed && <span>Overview</span>}
              </div>
              <div onClick={() => handleNavClick('itinerary')} className={navItemClass('itinerary')}>
                <span className="material-symbols-outlined text-lg">route</span>
                {!sidebarCollapsed && <span>My Itineraries</span>}
              </div>
            </div>

            {/* Discovery & Search */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6F80]">
                  Discovery & Search
                </div>
              )}
              <div onClick={() => handleNavClick('landing')} className={navItemClass('landing')}>
                <span className="material-symbols-outlined text-lg">travel_explore</span>
                {!sidebarCollapsed && <span>Explore Showcase</span>}
              </div>
              <div onClick={() => handleNavClick('globe')} className={navItemClass('globe')}>
                <span className="material-symbols-outlined text-lg">public</span>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>3D Globe Explorer</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2A9D8F]/15 text-[#1E7469] font-bold border border-[#2A9D8F]/30">
                      Live
                    </span>
                  </div>
                )}
              </div>
              <div onClick={() => handleNavClick('flights')} className={navItemClass('flights')}>
                <span className="material-symbols-outlined text-lg">flight</span>
                {!sidebarCollapsed && <span>Flights & Routes</span>}
              </div>
              <div onClick={() => handleNavClick('hotels')} className={navItemClass('hotels')}>
                <span className="material-symbols-outlined text-lg">hotel</span>
                {!sidebarCollapsed && <span>Hotels & Stays</span>}
              </div>
            </div>

            {/* Intelligence & Finance */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6F80]">
                  Intelligence & Finance
                </div>
              )}
              <div onClick={() => handleNavClick('chat')} className={navItemClass('chat')}>
                <span className="material-symbols-outlined text-lg text-[#E76F51]">smart_toy</span>
                {!sidebarCollapsed && <span>AI Travel Assistant</span>}
              </div>
              <div onClick={() => handleNavClick('agents')} className={navItemClass('agents')}>
                <span className="material-symbols-outlined text-lg text-[#2A9D8F]">hub</span>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Agent Center</span>
                    <span className="w-2 h-2 rounded-full bg-[#2A9D8F]" />
                  </div>
                )}
              </div>
              <div onClick={() => handleNavClick('budget')} className={navItemClass('budget')}>
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                {!sidebarCollapsed && <span>Budget Planner</span>}
              </div>
              <div onClick={() => handleNavClick('weather')} className={navItemClass('weather')}>
                <span className="material-symbols-outlined text-lg text-[#D4A24C]">wb_twilight</span>
                {!sidebarCollapsed && <span>Weather & Safety</span>}
              </div>
            </div>

            {/* Personal Dossiers */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6F80]">
                  Personal Dossiers
                </div>
              )}
              <div onClick={() => handleNavClick('documents')} className={navItemClass('documents')}>
                <span className="material-symbols-outlined text-lg">document_scanner</span>
                {!sidebarCollapsed && <span>Documents & OCR</span>}
              </div>
              <div onClick={() => handleNavClick('saved')} className={navItemClass('saved')}>
                <span className="material-symbols-outlined text-lg text-[#D4A24C]">bookmark</span>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Saved Trips</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#D4A24C]/15 text-[#B27B22] border border-[#D4A24C]/30">
                      Saved
                    </span>
                  </div>
                )}
              </div>
              <div onClick={() => handleNavClick('settings')} className={navItemClass('settings')}>
                <span className="material-symbols-outlined text-lg">settings</span>
                {!sidebarCollapsed && <span>Settings</span>}
              </div>
            </div>
          </nav>

          {/* Sidebar Bottom Status Badge */}
          {!sidebarCollapsed && (
            <div className="p-3.5 m-3 rounded-2xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A9D8F] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2A9D8F]" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A9D8F]">
                    Golden Hour 3.0
                  </span>
                </div>
                <span className="text-[10px] text-[#D4A24C] font-mono font-bold">SYNCD</span>
              </div>
              <p className="text-[11px] text-[#6B6F80] leading-relaxed">
                Multi-agent routing & verified itinerary matrix active.
              </p>
              <div className="w-full bg-[#EBDCC6] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D4A24C] via-[#E76F51] to-[#D4A24C] w-[100%] rounded-full" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* STICKY TOP OPERATIONAL BAR:
          Navbar is --bg (#F6EFE6) with a blurred translucent background that gains a soft shadow after scrolling */}
      <header
        className={`sticky top-0 z-30 h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full transition-all duration-300 ${
          scrolled
            ? 'bg-[#F6EFE6]/95 backdrop-blur-md shadow-md border-b border-[rgba(20,33,61,0.14)]'
            : 'bg-[#F6EFE6]/85 backdrop-blur-md border-b border-[rgba(20,33,61,0.08)] shadow-2xs'
        }`}
      >
        {/* Left: Mobile Drawer Trigger & Current Odyssey Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] text-[#14213D] hover:bg-[#FBF6EE] shrink-0 cursor-pointer shadow-xs"
            aria-label="Open mobile navigation"
          >
            <span className="material-symbols-outlined text-lg block">menu</span>
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#6B6F80] flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-[#2A9D8F]/15 border border-[#2A9D8F]/30 text-[#1E7469] font-mono text-[10px] uppercase font-bold tracking-wider">
                {activeTrip.confNumber}
              </span>
              <span className="text-[#D4A24C] hidden sm:inline">·</span>
              <span className="hidden sm:inline font-medium text-[#14213D]">
                {activeTrip.durationDays} Days / {Math.max(1, activeTrip.durationDays - 1)} Nights
              </span>
              <span className="text-[#D4A24C] hidden md:inline">·</span>
              <span className="hidden md:inline font-medium text-[#6B6F80]">
                {activeTrip.travelersCount} Traveler{activeTrip.travelersCount > 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="font-serif-heading text-sm sm:text-base md:text-lg text-[#14213D] font-bold tracking-tight truncate">
              {activeTrip.title}
            </h1>
          </div>
        </div>

        {/* Right: Telemetry, Currency & Action CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Rhythm Pacing Gauge */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] shadow-2xs">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-[#6B6F80] uppercase tracking-wider font-semibold">
                Rhythm Pacing
              </span>
              <span className="text-xs text-[#14213D] font-semibold font-mono">
                Relaxed {activeTrip.pacing.relaxedPercent}% · Active {activeTrip.pacing.activePercent}%
              </span>
            </div>
            <div className="w-7 h-7 relative flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#EBDCC6]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-[#D4A24C]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${activeTrip.pacing.relaxedPercent}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute text-[8px] font-bold text-[#D4A24C] font-mono">
                {activeTrip.pacing.relaxedPercent}
              </span>
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C] text-xs font-semibold text-[#14213D] transition-all cursor-pointer shadow-2xs"
              title="Select Base Currency"
            >
              <span className="text-[#D4A24C] font-mono font-bold">
                {CURRENCY_RATES[currency]?.symbol || '₹'}
              </span>
              <span>{currency}</span>
              <span className="material-symbols-outlined text-sm text-[#6B6F80]">expand_more</span>
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyDropdownOpen(false)}
                  aria-label="Close currency dropdown"
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[rgba(20,33,61,0.14)] p-1.5 z-50 max-h-72 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6F80]">
                    Select Currency
                  </div>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onCurrencyChange(c);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currency === c
                          ? 'bg-[#FBF6EE] text-[#14213D] font-bold border border-[#D4A24C]/40'
                          : 'text-[#14213D] hover:bg-[#FBF6EE]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-6 text-[#D4A24C]">
                          {CURRENCY_RATES[c]?.symbol}
                        </span>
                        <span>{c}</span>
                      </div>
                      <span className="text-[10px] text-[#6B6F80] font-medium">
                        {CURRENCY_RATES[c]?.name?.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sync Live Button */}
          <button
            onClick={handleSyncLive}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] text-[#2A9D8F] hover:text-[#1E7469] hover:bg-[#FBF6EE] font-semibold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
            title="Synchronize live rates and weather"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                syncing ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span className="hidden sm:inline">Sync Live</span>
          </button>

          {/* Dispatch Concierge CTA (Ink dark button) */}
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14213D] hover:bg-[#1E2E52] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-98 cursor-pointer"
            title="Open AI Concierge Chat"
          >
            <span className="material-symbols-outlined text-sm text-[#D4A24C]">bolt</span>
            <span className="hidden md:inline">Concierge</span>
          </button>

          {/* Profile & Auth Section */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-white border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C] shadow-2xs transition-all cursor-pointer"
                title={`${user.name} (${user.email})`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D4A24C] to-[#E76F51] flex items-center justify-center text-white text-[11px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#14213D] hidden sm:inline max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <span className="material-symbols-outlined text-sm text-[#6B6F80]">expand_more</span>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[rgba(20,33,61,0.14)] p-2 z-50">
                    <div className="px-3 py-2 border-b border-[rgba(20,33,61,0.08)]">
                      <strong className="text-xs text-[#14213D] block truncate">{user.name}</strong>
                      <span className="text-[10px] text-[#6B6F80] block truncate">{user.email}</span>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#D4A24C]/15 text-[#B27B22] border border-[#D4A24C]/30">
                        {user.tier} Member
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('settings');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#14213D] hover:bg-[#FBF6EE] rounded-xl flex items-center gap-2 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#6B6F80]">settings</span>
                        <span>Account & Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('saved');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#14213D] hover:bg-[#FBF6EE] rounded-xl flex items-center gap-2 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#D4A24C]">bookmark</span>
                        <span>My Saved Trips</span>
                      </button>

                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#D64545] hover:bg-rose-50 rounded-xl flex items-center gap-2 font-semibold transition mt-1 border-t border-[rgba(20,33,61,0.08)] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#D64545]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => (onOpenAuthModal ? onOpenAuthModal() : onNavigate('settings'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(20,33,61,0.12)] bg-white hover:bg-[#FBF6EE] text-[#14213D] font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#D4A24C]">account_circle</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
