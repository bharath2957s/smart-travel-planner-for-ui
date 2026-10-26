import React from 'react';
import {
  Activity,
  Cpu,
  Clock,
  HardDrive,
  Wifi,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ResearchBenchmarkingSectionProps {
  onOpenAgentCenter: () => void;
}

export const ResearchBenchmarkingSection: React.FC<ResearchBenchmarkingSectionProps> = ({
  onOpenAgentCenter,
}) => {
  const telemetryMetrics = [
    {
      label: 'Execution Time',
      icon: Clock,
      unit: 'Milliseconds / Seconds',
      description: 'End-to-end wall-clock duration from user submission to complete itinerary synthesis across single-agent and multi-agent runs.',
      tag: 'Latency Tracking',
    },
    {
      label: 'CPU Utilization',
      icon: Cpu,
      unit: 'Process % & User/Sys Time',
      description: 'Node.js event-loop CPU consumption measured across compute-intensive route optimization, coordinate distance sorting, and arithmetic verification.',
      tag: 'Compute Load',
    },
    {
      label: 'Peak Memory Usage',
      icon: HardDrive,
      unit: 'RSS & Heap Allocation (MB)',
      description: 'Continuous memory profiling capturing baseline, peak heap, and post-completion RAM allocation across concurrent agent threads.',
      tag: 'Memory Profiling',
    },
    {
      label: 'Network Latency',
      icon: Wifi,
      unit: 'Round-Trip Probe (ms)',
      description: 'Application-level HTTP latency measurements across internal endpoints, external geocoding, exchange rates, and multimodal LLM APIs.',
      tag: 'Endpoint Health',
    },
    {
      label: 'Budget Feasibility',
      icon: ShieldCheck,
      unit: 'Feasible / Invariant Score',
      description: 'Deterministic audit confirming that itemized expenses sum exactly to committed outlay and comply with user-defined total expenditure caps.',
      tag: 'Arithmetic Audit',
    },
    {
      label: 'Itinerary Quality & Cohesion',
      icon: Activity,
      unit: 'Pacing & Density Index',
      description: 'Validation of morning, afternoon, and evening scheduling, geographic travel times between consecutive stops, and activity balance.',
      tag: 'Schedule Quality',
    },
    {
      label: 'Task Completion & Reliability',
      icon: CheckCircle,
      unit: 'Pass Rate / Error Boundary',
      description: 'System reliability metric verifying whether all required travel legs, stays, and budget allocations were successfully constructed.',
      tag: 'Pipeline Reliability',
    },
  ];

  return (
    <section id="research" className="py-20 sm:py-28 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Empirical AI Benchmarking</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight text-white">
            Research & Benchmarking
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            The project explores how single-agent and multi-agent architectures perform on comparable travel-planning tasks, evaluating computational overhead against output granularity.
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {telemetryMetrics.map((met, idx) => {
            const Icon = met.icon;
            const isLast = idx === telemetryMetrics.length - 1;
            return (
              <div
                key={met.label}
                className={`p-6 rounded-3xl bg-[#0a1526]/85 backdrop-blur-xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between hover:border-cyan-500/30 transition-all ${
                  isLast ? 'md:col-span-2 lg:col-span-3 xl:col-span-2' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {met.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-serif-heading">
                      {met.label}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {met.unit}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {met.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Collected live in Agent Center</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout Action Banner */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-[#0d1e38] via-[#091529] to-[#0d1e38] border border-cyan-500/25 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold font-serif-heading text-white">
              Inspect Live Agent Center Telemetry
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Open the dedicated Agent Center to review active trip evaluations, trigger live network latency probes, inspect algorithmic complexities, and compare agent execution histories.
            </p>
          </div>

          <button
            onClick={onOpenAgentCenter}
            className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition cursor-pointer shrink-0"
          >
            <Activity className="w-4 h-4" />
            <span>Open Agent Center</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
