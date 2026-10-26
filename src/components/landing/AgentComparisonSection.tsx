import React from 'react';
import { Cpu, Network, ArrowRight, Activity, Check, Minus } from 'lucide-react';

interface AgentComparisonSectionProps {
  onOpenAgentCenter: () => void;
}

export const AgentComparisonSection: React.FC<AgentComparisonSectionProps> = ({
  onOpenAgentCenter,
}) => {
  const comparisonRows = [
    {
      dimension: 'Architecture',
      single: 'Monolithic single-process orchestrator',
      multi: 'Distributed multi-role pipeline (Orchestrator + 5 Specialists)',
    },
    {
      dimension: 'Task Handling',
      single: 'Linear end-to-end synthesis in single model context window',
      multi: 'Modular domain separation (Itinerary, Budget, Route, Safety, Concierge)',
    },
    {
      dimension: 'Coordination Overhead',
      single: 'Minimal — zero inter-agent communication messages',
      multi: 'Moderate to High — inter-agent message passing & consensus',
    },
    {
      dimension: 'Parallel Execution',
      single: 'Sequential processing across travel domains',
      multi: 'Concurrent execution for non-dependent domain tasks',
    },
    {
      dimension: 'Resource Usage',
      single: 'Lower peak memory and token payload requirements',
      multi: 'Higher memory and token volume across specialized prompts',
    },
    {
      dimension: 'Execution Time',
      single: 'Faster for simple queries; varies with output length',
      multi: 'Dependent on parallel network latency and consensus steps',
    },
    {
      dimension: 'Itinerary Quality & Granularity',
      single: 'Cohesive narrative tone; potential domain oversights',
      multi: 'Deep domain-specific detail and modular refinement',
    },
  ];

  return (
    <section id="agent-comparison" className="py-20 sm:py-28 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Architecture Tradeoffs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight text-white">
            Single-Agent vs. Multi-Agent AI
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Understanding how architectural choices impact execution performance, token economics, and itinerary granularity on real travel workloads.
          </p>
        </div>

        {/* 2 Architecture Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Single-Agent AI Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a1526]/85 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-heading text-white">Single-Agent AI</h3>
                <span className="text-[11px] text-blue-300 font-mono uppercase tracking-wider">
                  Unified Orchestrator Model
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              One agent handles the planning workflow from start to finish. It manages the entire user prompt, reasoning, and document synthesis in a single context window.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Simpler coordination & tracing:</strong> No inter-agent consensus overhead or message drops.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Streamlined context:</strong> Lower total token count and predictable memory footprint.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Implementation dependent:</strong> Execution time and quality depend entirely on single prompt expressiveness.</span>
              </li>
            </ul>
          </div>

          {/* Multi-Agent AI Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a1526]/85 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-heading text-white">Multi-Agent AI</h3>
                <span className="text-[11px] text-purple-300 font-mono uppercase tracking-wider">
                  Specialized Agent Collective
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Multiple specialized agents coordinate their work. Specific domain agents (Itinerary, Budget, Route, Safety, Concierge) independently analyze constraints and synchronize.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Modular responsibilities:</strong> Each agent operates with specialized domain instructions and system prompts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Parallel task execution:</strong> Allows independent sub-plans (e.g. weather and flights) to run concurrently.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Coordination overhead:</strong> Incurs additional network round-trips, synthesis steps, and memory usage.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="rounded-3xl bg-[#070e1b]/90 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-serif-heading">
                Architectural Dimension Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated under identical destination, duration, and traveler constraints
              </p>
            </div>
            <button
              onClick={onOpenAgentCenter}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open Agent Center</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 sm:px-6 font-bold uppercase tracking-wider text-slate-400 w-1/4">
                    Dimension
                  </th>
                  <th className="p-4 sm:px-6 font-bold uppercase tracking-wider text-blue-300 w-3/8">
                    Single-Agent Architecture
                  </th>
                  <th className="p-4 sm:px-6 font-bold uppercase tracking-wider text-purple-300 w-3/8">
                    Multi-Agent Architecture
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 sm:px-6 font-semibold text-white">
                      {row.dimension}
                    </td>
                    <td className="p-4 sm:px-6 text-slate-300 leading-relaxed">
                      {row.single}
                    </td>
                    <td className="p-4 sm:px-6 text-slate-300 leading-relaxed">
                      {row.multi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Telemetry note */}
          <div className="p-4 sm:px-6 bg-white/[0.02] border-t border-white/10 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Real telemetry traces are collected on every run via the Agent Center evaluation harness.
            </span>
            <span className="font-mono text-cyan-400">
              No artificial winners declared · Empirical evaluation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
