import React from 'react';
import {
  Sparkles,
  CalendarDays,
  Calculator,
  Compass,
  Plane,
  CloudSun,
  FileText,
  Network,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

interface KeyFeaturesSectionProps {
  onNavigateTo: (page: string, initialData?: any) => void;
}

export const KeyFeaturesSection: React.FC<KeyFeaturesSectionProps> = ({ onNavigateTo }) => {
  const features = [
    {
      id: 'planner',
      title: 'AI-Powered Trip Planning',
      icon: Sparkles,
      description: 'End-to-end itinerary synthesis driven by natural language prompts, travel styles, and traveler group preferences.',
      actionLabel: 'Launch Planner',
      page: 'planner',
      accent: 'from-cyan-500/20 to-blue-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'itinerary',
      title: 'Personalized Day-by-Day Itineraries',
      icon: CalendarDays,
      description: 'Structured scheduling with morning, afternoon, and evening time slots, activity duration estimates, and pacing sliders.',
      actionLabel: 'View Itinerary',
      page: 'itinerary',
      accent: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
    },
    {
      id: 'budget',
      title: 'Budget Estimation and Planning',
      icon: Calculator,
      description: 'Deterministic expense tracking, bilateral cost splitting between travelers, and contingency reserve hedges across 9 currencies.',
      actionLabel: 'Open Budget',
      page: 'budget',
      accent: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'destinations',
      title: 'Destination and Activity Recommendations',
      icon: Compass,
      description: 'Curated points of interest verified against Wikimedia and Unsplash databases, complete with geographic coordinates.',
      actionLabel: 'Explore Stays',
      page: 'hotels',
      accent: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
    {
      id: 'flights',
      title: 'Flights, Routes, and Accommodation',
      icon: Plane,
      description: 'Multi-modal route discovery (air, train, bus, road) integrated with live search redirects to Google Flights, Skyscanner, and Booking.com.',
      actionLabel: 'Search Routes',
      page: 'flights',
      accent: 'from-sky-500/20 to-blue-500/10',
      iconColor: 'text-sky-400',
    },
    {
      id: 'weather',
      title: 'Weather and Travel Safety',
      icon: CloudSun,
      description: 'Destination microclimate telemetry, maritime sea swell indicators, UV indices, daylight hours, and packing advisories.',
      actionLabel: 'Check Weather',
      page: 'weather',
      accent: 'from-yellow-500/20 to-amber-500/10',
      iconColor: 'text-yellow-400',
    },
    {
      id: 'documents',
      title: 'Travel Documents and OCR Extraction',
      icon: FileText,
      description: 'Multimodal OCR parsing for Aadhaar cards (front & back), driving licences, passports, visas, and flight tickets with privacy masking.',
      actionLabel: 'Open OCR Tool',
      page: 'documents',
      accent: 'from-purple-500/20 to-pink-500/10',
      iconColor: 'text-purple-400',
    },
    {
      id: 'agents-arch',
      title: 'Single-Agent and Multi-Agent AI',
      icon: Network,
      description: 'Compare unified linear synthesis against specialized multi-agent workflows (Itinerary, Budget, Route, Safety, Concierge).',
      actionLabel: 'Compare Agents',
      page: 'agents',
      accent: 'from-indigo-500/20 to-purple-500/10',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'research',
      title: 'Agent Center & Research Benchmarking',
      icon: Activity,
      description: 'Measure execution duration, CPU utilization, peak memory allocation, network latency, and task completion rates on actual workloads.',
      actionLabel: 'Open Research',
      page: 'agents',
      accent: 'from-rose-500/20 to-purple-500/10',
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 relative z-10 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Comprehensive Functional Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading tracking-tight text-white">
            Key Features
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Every feature is backed by real running modules in the application — from deterministic financial arithmetic to genuine multimodal document extraction.
          </p>
        </div>

        {/* 3x3 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => onNavigateTo(feat.page)}
                className="group relative p-6 sm:p-7 rounded-3xl bg-[#0a1526]/80 backdrop-blur-xl border border-white/10 hover:border-white/25 shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Icon with subtle halo */}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.accent} border border-white/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-6 h-6 ${feat.iconColor}`} />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-serif-heading text-white group-hover:text-cyan-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                      {feat.description}
                    </p>
                  </div>
                </div>

                {/* Working Action Link */}
                <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300">
                  <span>{feat.actionLabel}</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
