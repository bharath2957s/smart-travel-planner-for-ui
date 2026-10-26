import React from 'react';
import { PaperPlaneLogo } from './OrigamiIcons';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Github, Globe } from 'lucide-react';

interface ProjectMissionFooterProps {
  onNavClick: (item: string) => void;
  onPlanTrip: () => void;
  onOpenAgentCenter: () => void;
}

export const ProjectMissionFooter: React.FC<ProjectMissionFooterProps> = ({
  onNavClick,
  onPlanTrip,
  onOpenAgentCenter,
}) => {
  return (
    <footer id="about-us" className="pt-20 pb-12 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Project Mission Banner Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0c1a30] via-[#091529] to-[#070e1b] border border-white/15 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Project Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-heading tracking-tight text-white">
                Structured Travel Synthesis Meets Agent Architecture Research
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Our mission is to replace ambiguous chatbots and inflexible templates with structured, verified travel itineraries. By pairing deterministic financial invariants with intelligent agent orchestration, Smart AI Travel Planner makes every journey actionable while systematically investigating single-agent versus multi-agent system performance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                onClick={onPlanTrip}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plan Your Journey</span>
              </button>
              <button
                onClick={onOpenAgentCenter}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Agent Research Lab</span>
              </button>
            </div>
          </div>

          {/* Architecture & Engineering Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">Frontend Architecture</span>
              <p className="font-semibold text-white">React 19 & Tailwind CSS v4</p>
              <p className="text-slate-400 text-[11px]">Vite SPA with responsive glassmorphism & canvas animation.</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">Backend & APIs</span>
              <p className="font-semibold text-white">Express & Node.js Engine</p>
              <p className="text-slate-400 text-[11px]">Strict JSON error boundaries, Frankfurter FX, Unsplash photography.</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">Model Integration</span>
              <p className="font-semibold text-white">Google GenAI SDK</p>
              <p className="text-slate-400 text-[11px]">Multimodal OCR ingestion and agent-guided travel copilot.</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">Observability</span>
              <p className="font-semibold text-white">Agent Center Telemetry</p>
              <p className="text-slate-400 text-[11px]">Live CPU utilization, RSS memory profiling, and network latency.</p>
            </div>
          </div>
        </div>

        {/* Clean Footer Navigation & Links */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <PaperPlaneLogo className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-semibold text-slate-200">
              Smart AI Travel Planner 3.0
            </span>
            <span className="text-slate-600">·</span>
            <span>Empirical AI Travel & Research Suite</span>
          </div>

          {/* Quick Anchor Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-slate-300">
            <button
              onClick={() => onNavClick('home')}
              className="hover:text-white transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => onNavClick('about')}
              className="hover:text-white transition cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => onNavClick('features')}
              className="hover:text-white transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => onNavClick('how-it-works')}
              className="hover:text-white transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavClick('agent-comparison')}
              className="hover:text-white transition cursor-pointer"
            >
              Agent Comparison
            </button>
            <button
              onClick={() => onNavClick('research')}
              className="hover:text-white transition cursor-pointer"
            >
              Research
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            © 2026 Smart AI Travel Planner
          </div>
        </div>
      </div>
    </footer>
  );
};
