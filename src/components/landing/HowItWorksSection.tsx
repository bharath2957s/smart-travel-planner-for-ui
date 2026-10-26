import React from 'react';
import { Sparkles, ArrowRight, Sliders, CheckCircle2, BarChart3, Edit3, Compass } from 'lucide-react';

interface HowItWorksSectionProps {
  onPlanTrip: () => void;
  onExploreResearch: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onPlanTrip,
  onExploreResearch,
}) => {
  const steps = [
    {
      step: '01',
      title: 'Define Trip Parameters',
      description: 'Enter the destination, dates, budget, and preferences — including travel style, pacing balance, and traveler group size.',
      detail: 'Inputs origin, target hub, currency, and financial constraints.',
      icon: Sliders,
      badge: 'Step 1',
    },
    {
      step: '02',
      title: 'Automated AI Orchestration',
      description: 'Let the configured AI travel-planning workflow process the request across venue search, route geometry, and scheduling.',
      detail: 'Runs single-agent synthesis or dispatches multi-agent coordinators.',
      icon: Sparkles,
      badge: 'Step 2',
    },
    {
      step: '03',
      title: 'Review Structured Plan',
      description: 'Review the itinerary, destinations, and estimated expenses with deterministic balance checks and contingency reserves.',
      detail: 'Audits daily activities, booking links, and bilateral expense splits.',
      icon: CheckCircle2,
      badge: 'Step 3',
    },
    {
      step: '04',
      title: 'Refine & Manage Itinerary',
      description: 'Refine the trip and manage the itinerary — swap landmarks, adjust time slots, and upload travel documents for OCR extraction.',
      detail: 'Interactive day planner, custom notes, and dossier storage.',
      icon: Edit3,
      badge: 'Step 4',
    },
    {
      step: '05',
      title: 'Compare Agent Architectures',
      description: 'Explore the research tools to compare AI architectures, where available — inspecting latency, memory, and plan fidelity.',
      detail: 'Accesses real-time telemetry logs inside the Agent Center.',
      icon: BarChart3,
      badge: 'Step 5',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>5-Stage Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight text-white">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            From initial parameters to verified logistics and comparative research, every step of the journey is clearly structured.
          </p>
        </div>

        {/* 5-Step Horizontal / Grid Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="relative p-6 rounded-3xl bg-[#0a1526]/85 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Header step counter */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      {st.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-serif-heading text-white mb-2 leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                {/* Micro detail footer */}
                <div className="pt-4 border-t border-white/10 mt-5">
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {st.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Prompts */}
        <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onPlanTrip}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Build Your Itinerary Now</span>
          </button>
          <button
            onClick={onExploreResearch}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition cursor-pointer"
          >
            <span>Inspect Benchmark Telemetry</span>
          </button>
        </div>
      </div>
    </section>
  );
};
