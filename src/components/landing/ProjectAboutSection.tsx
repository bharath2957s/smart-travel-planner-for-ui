import React from 'react';
import { Sparkles, Brain, Cpu, Layers, GitBranch, ArrowRight, ShieldCheck, Database } from 'lucide-react';

interface ProjectAboutSectionProps {
  onPlanTrip: () => void;
  onExploreResearch: () => void;
}

export const ProjectAboutSection: React.FC<ProjectAboutSectionProps> = ({
  onPlanTrip,
  onExploreResearch,
}) => {
  return (
    <section id="about" className="py-20 sm:py-28 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Dual-Purpose Application</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight text-white">
            About the Project
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Smart AI Travel Planner is an AI-powered travel-planning application designed to organize trips according to users' destinations, dates, interests, and budgets. It also provides a research environment for comparing single-agent and multi-agent AI approaches to travel planning.
          </p>
        </div>

        {/* Editorial 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission & Core Pillars */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a1526]/80 backdrop-blur-xl border border-white/10 shadow-xl space-y-6">
              <h3 className="text-xl font-bold font-serif-heading text-white">
                Structured Travel Synthesis & Agent Exploration
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rather than producing unstructured chat output or rigid boilerplate templates, the application coordinates real logistics: arithmetic budget balances with contingency buffers, multi-modal transit legs, live microclimate advisories, and privacy-preserving document OCR.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Practical Travel Assistant</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Generates complete day-by-day itineraries with morning, afternoon, and evening pacing, verified landmark coordinates, and real booking links.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Architectural Research Lab</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Measures real computational tradeoffs between unified single-agent synthesis and specialized multi-agent pipeline orchestration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Deterministic Invariants</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      All financial totals, bilateral expense splits, and geographic coordinates are verified by deterministic arithmetic rather than model guesswork.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={onPlanTrip}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Planning</span>
                </button>
                <button
                  onClick={onExploreResearch}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition cursor-pointer"
                >
                  <span>View Architecture</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Flow Diagram */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#070e1b]/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    System Workflow Diagram
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Pipeline v3.5
                </span>
              </div>

              {/* Workflow Nodes */}
              <div className="space-y-3 font-sans">
                {/* Step 1 */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Traveler Input</div>
                      <div className="text-[11px] text-slate-400">Destination · Dates · Budget · Pacing</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Input</span>
                </div>

                <div className="flex justify-center -my-1 text-cyan-400/60">
                  <span className="text-xs">↓</span>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-bold text-cyan-200">Orchestration Core</div>
                      <div className="text-[11px] text-slate-300">Single-Agent (Unified) OR Multi-Agent (Specialized)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">Engine</span>
                </div>

                <div className="flex justify-center -my-1 text-cyan-400/60">
                  <span className="text-xs">↓</span>
                </div>

                {/* Step 3: Modules */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="font-semibold text-slate-200 text-[11px]">Itinerary & Venue</div>
                    <div className="text-[10px] text-slate-400">Pacing & Coordinates</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="font-semibold text-slate-200 text-[11px]">Budget & Split</div>
                    <div className="text-[10px] text-slate-400">Arithmetic Validation</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="font-semibold text-slate-200 text-[11px]">Transit & Stays</div>
                    <div className="text-[10px] text-slate-400">Live Provider Search</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="font-semibold text-slate-200 text-[11px]">Document OCR</div>
                    <div className="text-[10px] text-slate-400">Identity & Tickets</div>
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-cyan-400/60">
                  <span className="text-xs">↓</span>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <div>
                      <div className="text-xs font-bold text-emerald-200">Interactive Dossier & Telemetry</div>
                      <div className="text-[11px] text-slate-300">Synchronized plan + Real Agent Center benchmark logs</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">Output</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
