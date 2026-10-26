import React from 'react';
import { Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { LargeOrigamiAirplane } from './OrigamiIcons';
import { LandingSearchWidget } from './LandingSearchWidget';
import { LandingSearchState } from '../../types/landingTypes';

interface LandingHeroProps {
  onPlanTrip: () => void;
  onExploreResearch: () => void;
  onDiscoverProject: () => void;
  onSearch: (criteria: LandingSearchState) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onPlanTrip,
  onExploreResearch,
  onDiscoverProject,
  onSearch,
}) => {
  return (
    <section className="relative w-full pt-12 pb-16 sm:pb-24 text-white overflow-hidden">
      {/* Subtle dashed flight arc line */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-25">
        <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
          <path
            d="M 120,300 C 320,180 540,360 680,220 C 780,120 720,70 650,110 C 580,150 640,240 760,200 C 880,150 1020,80 1140,90"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Editorial Copy Column */}
          <div className="lg:col-span-8 flex flex-col items-start pt-2 sm:pt-6">
            {/* Context kicker badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Multi-Agent Travel Architecture & Autonomous Planning</span>
            </div>

            {/* Exact Required Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white font-serif-heading leading-[1.08] drop-shadow-md">
              Smarter Travel Planning, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400">
                Powered by AI
              </span>
            </h1>

            {/* Exact Required Supporting Text */}
            <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              Discover destinations, build personalized itineraries, optimize your travel budget, and explore how intelligent AI agents help turn your travel ideas into organized journeys.
            </p>

            {/* CTAs Row */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {/* Primary CTA */}
              <button
                onClick={onPlanTrip}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-cyan-900/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Plan Your Trip</span>
                <ArrowRight className="w-4 h-4 text-slate-950 transform group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary CTA */}
              <button
                onClick={onExploreResearch}
                className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/35 backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-cyan-300" />
                <span>Explore AI Research</span>
              </button>

              {/* Optional Text Link */}
              <button
                onClick={onDiscoverProject}
                className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>Discover the Project</span>
                <span className="transform group-hover:translate-y-0.5 transition-transform">↓</span>
              </button>
            </div>

            {/* Key feature micro-guarantees */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Zero-Retention Privacy for Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Deterministic Budget Arithmetic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Live Single vs Multi-Agent Telemetry</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Focal Airplane Accent */}
          <div className="lg:col-span-4 relative flex items-center justify-center lg:justify-end">
            <div className="relative group">
              <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <LargeOrigamiAirplane className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 drop-shadow-2xl opacity-95" />
              </div>

              {/* Floating glass summary badge */}
              <div className="absolute -bottom-4 -left-4 sm:left-4 bg-[#070e1b]/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-xl text-slate-200 text-xs space-y-1 max-w-[220px]">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  <span>Agent Benchmark</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Comparing Single-Agent & Multi-Agent orchestration on real travel workloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Search Widget */}
      <div className="mt-10 sm:mt-14 relative z-20">
        <LandingSearchWidget onSearch={onSearch} />
      </div>
    </section>
  );
};
