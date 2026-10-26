/**
 * Smart AI Travel Planner 3.0
 * Premium Homepage Redesign
 *
 * Preserves strictly:
 * - Scroll-driven paper airplane canvas animation (/frames/*.webp)
 * - 3D Earth orbit animation (/frames_earth/*.webp)
 * - Mode toggle between Airplane flight and Earth orbit
 * - Frame sequence and canvas rendering logic
 *
 * Implements:
 * 1. Hero: "Smarter Travel Planning, Powered by AI" with Plan Your Trip & Explore AI Research CTAs
 * 2. Responsive Navigation Bar with smooth anchor scrolling
 * 3. About the Project section (#about) with architectural workflow diagram
 * 4. Key Features grid (#features) covering all 9 verified app modules with live navigation
 * 5. How It Works 5-stage methodology (#how-it-works)
 * 6. Single-Agent vs Multi-Agent AI comparison (#agent-comparison) with comparative table
 * 7. Research & Benchmarking section (#research) highlighting 7 live telemetry parameters
 * 8. Destination inspiration showcase with real Unsplash photography
 * 9. Project Mission & Verified Engineering Footer (#about-us)
 */

import React, { useState } from 'react';
import { AirplaneCanvas } from './AirplaneCanvas';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { ProjectAboutSection } from './ProjectAboutSection';
import { KeyFeaturesSection } from './KeyFeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { AgentComparisonSection } from './AgentComparisonSection';
import { ResearchBenchmarkingSection } from './ResearchBenchmarkingSection';
import { PopularPackages } from './PopularPackages';
import { ProjectMissionFooter } from './ProjectMissionFooter';
import { LandingBookingModal } from './LandingBookingModal';
import { LandingSignInModal } from './LandingSignInModal';
import { TravelPackage, LandingSearchState } from '../../types/landingTypes';

export interface PlannerInitialData {
  destination?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
}

interface TravelLandingPageProps {
  /** Called when user clicks "Plan Trip" or searches from the landing hero */
  onStartPlanning: (initialData?: PlannerInitialData) => void;
  /** Direct page navigation into dashboard / research / tools */
  onNavigate?: (page: string) => void;
}

export const TravelLandingPage: React.FC<TravelLandingPageProps> = ({
  onStartPlanning,
  onNavigate,
}) => {
  const [bgMode, setBgMode] = useState<'airplane' | 'earth'>('airplane');
  const [activeNav, setActiveNav] = useState('home');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [signedInUser, setSignedInUser] = useState<string | null>(null);

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);

    if (navId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(navId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (navId === 'packages' || navId === 'destinations') {
      document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlanTrip = () => {
    onStartPlanning();
  };

  const handleExploreResearch = () => {
    if (onNavigate) {
      onNavigate('agents');
    } else {
      document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiscoverProject = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeatureNavigate = (page: string) => {
    if (page === 'planner') {
      onStartPlanning();
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  const handleSearch = (criteria: LandingSearchState) => {
    onStartPlanning({
      origin: criteria.from,
      destination: criteria.to,
      startDate: criteria.departDate,
      endDate: criteria.returnDate,
      travelers: criteria.travelers,
    });
  };

  return (
    <div
      className="min-h-screen text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col font-sans relative"
      style={{ background: 'transparent' }}
    >
      {/* 1. CRITICAL: Preserve the existing scroll-driven canvas background */}
      <AirplaneCanvas mode={bgMode} />

      {/* Main Page Content Overlay — positioned over the fixed canvas */}
      <main className="flex-1 relative z-10">
        {/* Top Gradient & Hero Container */}
        <div className="bg-gradient-to-b from-[#070e1b]/90 via-[#070e1b]/50 to-transparent">
          <LandingNavbar
            activeNav={activeNav}
            onNavClick={handleNavClick}
            onSignInClick={() => setIsSignInOpen(true)}
            onPlanTrip={handlePlanTrip}
            theme={bgMode}
            onThemeChange={(m) => setBgMode(m)}
          />
          <LandingHero
            onPlanTrip={handlePlanTrip}
            onExploreResearch={handleExploreResearch}
            onDiscoverProject={handleDiscoverProject}
            onSearch={handleSearch}
          />
        </div>

        {/* 2. About the Project Section */}
        <div className="bg-gradient-to-b from-transparent via-[#070e1b]/70 to-[#070e1b]/80">
          <ProjectAboutSection
            onPlanTrip={handlePlanTrip}
            onExploreResearch={handleExploreResearch}
          />
        </div>

        {/* 3. Key Features Section */}
        <div className="bg-gradient-to-b from-[#070e1b]/80 via-[#0a1526]/85 to-[#070e1b]/80">
          <KeyFeaturesSection
            onNavigateTo={handleFeatureNavigate}
          />
        </div>

        {/* 4. How It Works Section */}
        <div className="bg-gradient-to-b from-[#070e1b]/80 via-[#0a1526]/75 to-transparent">
          <HowItWorksSection
            onPlanTrip={handlePlanTrip}
            onExploreResearch={handleExploreResearch}
          />
        </div>

        {/* 5. Single-Agent vs Multi-Agent Comparison Section */}
        <div className="bg-gradient-to-b from-transparent via-[#070e1b]/80 to-[#070e1b]/90">
          <AgentComparisonSection
            onOpenAgentCenter={handleExploreResearch}
          />
        </div>

        {/* 6. Research & Benchmarking Section */}
        <div className="bg-gradient-to-b from-[#070e1b]/90 via-[#091529]/90 to-[#070e1b]/80">
          <ResearchBenchmarkingSection
            onOpenAgentCenter={handleExploreResearch}
          />
        </div>

        {/* 7. Destination Inspiration (Popular Packages) with Genuine Photography */}
        <div className="bg-gradient-to-b from-[#070e1b]/80 via-[#070e1b]/70 to-[#070e1b]/90">
          <PopularPackages
            onSelectPackage={(pkg) => setSelectedPackage(pkg)}
            onViewAll={() => document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>

        {/* 8. Project Mission & Verified Engineering Footer */}
        <div className="bg-gradient-to-b from-[#070e1b]/90 via-[#050b15]/95 to-[#040810]">
          <ProjectMissionFooter
            onNavClick={handleNavClick}
            onPlanTrip={handlePlanTrip}
            onOpenAgentCenter={handleExploreResearch}
          />
        </div>
      </main>

      {/* Booking Modal */}
      <LandingBookingModal
        packageItem={selectedPackage}
        pricingPlan={null}
        onClose={() => setSelectedPackage(null)}
        onStartPlanning={(destination) => {
          setSelectedPackage(null);
          onStartPlanning({ destination });
        }}
      />

      {/* Sign In Modal */}
      <LandingSignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={(email) => setSignedInUser(email)}
      />

      {/* Signed In Notification Toast */}
      {signedInUser && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium">Logged in as {signedInUser}</span>
          <button
            onClick={() => setSignedInUser(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
