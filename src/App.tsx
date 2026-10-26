/**
 * Smart AI Travel Planner 3.0
 * Master Application Root & Reactive State Router
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode, TripPlan, ExpenseItem, ExtractedDocument } from './types/travel';
import { DEFAULT_ODYSSEY, SAMPLE_TRIPS_LIBRARY } from './lib/mockData';
import { Navigation, ActivePage } from './components/Navigation';
import { LandingPage } from './components/pages/LandingPage';
import { TravelLandingPage } from './components/landing/TravelLandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { TripPlannerWizard } from './components/pages/TripPlannerWizard';
import { ItineraryPage } from './components/pages/ItineraryPage';
import { FlightsPage } from './components/pages/FlightsPage';
import { HotelsPage } from './components/pages/HotelsPage';
import { BudgetPage } from './components/pages/BudgetPage';
import { AgentCenterPage } from './components/pages/AgentCenterPage';
import { WeatherSafetyPage } from './components/pages/WeatherSafetyPage';
import { ConciergeChatPage } from './components/pages/ConciergeChatPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { SavedTripsPage } from './components/pages/SavedTripsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LandingSignInModal } from './components/landing/LandingSignInModal';
import { AppFooter } from './components/AppFooter';
import { fetchTrips, createTrip, updateTrip, deleteTrip as deleteTripApi } from './lib/api';
import AOS from 'aos';

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Master Trips State with LocalStorage Persistence
  const [trips, setTrips] = useState<TripPlan[]>(() => {
    try {
      const saved = localStorage.getItem('aetheris_trips_data_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return SAMPLE_TRIPS_LIBRARY;
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('aetheris_active_trip_id_v3');
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return DEFAULT_ODYSSEY.id;
  });

  // Financial Currency State
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const savedCur = localStorage.getItem('aetheris_currency_v3');
      if (savedCur && ['INR', 'USD', 'EUR', 'GBP'].includes(savedCur)) {
        return savedCur as CurrencyCode;
      }
    } catch {
      // ignore
    }
    return 'INR';
  });

  // Current Active Page
  const [activePage, setActivePage] = useState<ActivePage>('landing');

  // Itinerary focused day state (for AI Copilot & deep navigation)
  const [itineraryDay, setItineraryDay] = useState<number | undefined>(undefined);

  // Sidebar Collapsed State (lifted for collision-free layout)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Quick Plan Modal State
  const [quickPlanOpen, setQuickPlanOpen] = useState(false);

  // Pre-filled data for TripPlannerWizard (e.g. from Home page Search widget or Plan Trip button)
  const [plannerInitialData, setPlannerInitialData] = useState<{
    destination?: string;
    origin?: string;
    startDate?: string;
    endDate?: string;
    travelers?: number;
  } | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('aetheris_trips_data_v3', JSON.stringify(trips));
    } catch {
      // ignore
    }
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheris_active_trip_id_v3', activeTripId);
    } catch {
      // ignore
    }
  }, [activeTripId]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheris_currency_v3', currency);
    } catch {
      // ignore
    }
  }, [currency]);

  // Initialize AOS (Animate On Scroll) once with accessibility & lifecycle safety
  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-cubic',
      offset: 30,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }, []);

  // Refresh AOS calculations when page or active trip changes
  useEffect(() => {
    const timer = setTimeout(() => {
      AOS.refresh();
    }, 120);
    return () => clearTimeout(timer);
  }, [activePage, activeTripId]);

  // Find currently active trip
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || DEFAULT_ODYSSEY;

  // Fetch user-isolated trips from backend when authenticated
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      fetchTrips()
        .then((serverTrips) => {
          if (isMounted && Array.isArray(serverTrips) && serverTrips.length > 0) {
            setTrips(serverTrips);
            if (!serverTrips.some((t) => t.id === activeTripId)) {
              setActiveTripId(serverTrips[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn('Trips sync fallback to local storage:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Handlers
  const handleCurrencyChange = (newCur: CurrencyCode) => {
    setCurrency(newCur);
  };

  const handleSelectTrip = (tripId: string) => {
    setActiveTripId(tripId);
    setActivePage('dashboard');
  };

  const handleTripGenerated = (newTrip: TripPlan) => {
    const tripWithOwner: TripPlan = user ? { ...newTrip, userId: user.id } : newTrip;
    setTrips((prev) => [tripWithOwner, ...prev]);
    setActiveTripId(tripWithOwner.id);
    setQuickPlanOpen(false);
    setActivePage('dashboard');
    if (isAuthenticated) {
      createTrip(tripWithOwner).catch((err) => console.warn('Could not persist new trip to server:', err));
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    if (trips.length <= 1) return;
    const remaining = trips.filter((t) => t.id !== tripId);
    setTrips(remaining);
    if (activeTripId === tripId) {
      setActiveTripId(remaining[0].id);
    }
    if (isAuthenticated) {
      deleteTripApi(tripId).catch((err) => console.warn('Could not delete trip on server:', err));
    }
  };

  const handleUpdateTrip = (updatedTrip: TripPlan) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    if (isAuthenticated) {
      updateTrip(updatedTrip.id, updatedTrip).catch((err) => console.warn('Could not update trip on server:', err));
    }
  };

  const handleUpdateTripBudget = (newItems: ExpenseItem[]) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrip.id) return t;
        const totalCommitted = newItems.reduce((acc, it) => acc + it.amount, 0);
        const updated: TripPlan = {
          ...t,
          budget: {
            ...t.budget,
            items: newItems,
            committedOutlay: totalCommitted,
          },
        };
        if (isAuthenticated) {
          updateTrip(updated.id, updated).catch(() => {});
        }
        return updated;
      })
    );
  };

  const handleUpdateTripDocuments = (doc: ExtractedDocument) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrip.id) return t;
        const existing: ExtractedDocument[] = t.extractedDocuments || [];
        const updatedDocs = existing.some((d: ExtractedDocument) => d.id === doc.id)
          ? existing.map((d: ExtractedDocument) => (d.id === doc.id ? doc : d))
          : [doc, ...existing];
        const updatedTrip: TripPlan = {
          ...t,
          extractedDocuments: updatedDocs,
        };
        if (isAuthenticated) {
          updateTrip(updatedTrip.id, updatedTrip).catch(() => {});
        }
        return updatedTrip;
      })
    );
  };


  const handleResetData = () => {
    setTrips(SAMPLE_TRIPS_LIBRARY);
    setActiveTripId(DEFAULT_ODYSSEY.id);
    setCurrency('INR');
    try {
      localStorage.removeItem('aetheris_trips_data_v3');
      localStorage.removeItem('aetheris_active_trip_id_v3');
      localStorage.removeItem('aetheris_currency_v3');
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* If activePage is 'landing', show full-screen landing with header integration */}
      {activePage === 'landing' ? (
        <TravelLandingPage
          onStartPlanning={(initialData) => {
            if (initialData) {
              setPlannerInitialData(initialData);
            } else {
              setPlannerInitialData({
                destination: activeTrip.destination || '',
                origin: activeTrip.origin || 'Shivamogga, India',
              });
            }
            setActivePage('planner');
          }}
          onNavigate={(page) => setActivePage(page as ActivePage)}
        />
      ) : (
        /* Collision-Free App Shell: Golden Hour Theme Scoped with Smooth Column Transitions */
        <div className="app-theme flex-1 flex flex-col min-h-screen relative bg-[#F6EFE6] text-[#14213D] selection:bg-[#E76F51]/20 selection:text-[#14213D]">
          <div
            className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
              sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
            }`}
          >
            <Navigation
              activePage={activePage}
              onNavigate={(page) => setActivePage(page)}
              activeTrip={activeTrip}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              onOpenQuickPlan={() => setQuickPlanOpen(true)}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />

            {/* Main App Page Content Area with Smooth Page Transition */}
            <main
              key={activePage}
              className="gh-page-enter flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0"
            >
              {activePage === 'dashboard' && (
                <DashboardPage
                  trip={activeTrip}
                  currency={currency}
                  onNavigate={(page) => setActivePage(page as ActivePage)}
                  onOpenQuickPlan={() => setQuickPlanOpen(true)}
                  allTrips={trips}
                  onSelectTrip={handleSelectTrip}
                />
              )}

              {activePage === 'planner' && (
                <TripPlannerWizard
                  initialDestination={plannerInitialData?.destination || activeTrip.destination}
                  initialOrigin={plannerInitialData?.origin || activeTrip.origin}
                  initialStartDate={plannerInitialData?.startDate}
                  initialEndDate={plannerInitialData?.endDate}
                  initialTravelers={plannerInitialData?.travelers}
                  currency={currency}
                  onTripGenerated={handleTripGenerated}
                  onCancel={() => setActivePage('dashboard')}
                />
              )}

              {activePage === 'itinerary' && (
                <ItineraryPage
                  trip={activeTrip}
                  currency={currency}
                  onUpdateTrip={handleUpdateTrip}
                  onNavigate={(page) => setActivePage(page as ActivePage)}
                  initialDay={itineraryDay}
                />
              )}

              {activePage === 'flights' && (
                <FlightsPage
                  trip={activeTrip}
                  currency={currency}
                  onNavigate={(page) => setActivePage(page as ActivePage)}
                  onUpdateTrip={handleUpdateTrip}
                />
              )}

              {activePage === 'hotels' && (
                <HotelsPage
                  trip={activeTrip}
                  currency={currency}
                  onNavigate={(page) => setActivePage(page as ActivePage)}
                />
              )}

              {activePage === 'budget' && (
                <BudgetPage
                  trip={activeTrip}
                  currency={currency}
                  onUpdateItems={handleUpdateTripBudget}
                />
              )}

              {activePage === 'agents' && (
                <AgentCenterPage
                  trip={activeTrip}
                  currency={currency}
                  onNavigate={(page) => setActivePage(page as ActivePage)}
                />
              )}

              {activePage === 'weather' && (
                <WeatherSafetyPage trip={activeTrip} />
              )}

              {activePage === 'chat' && (
                <ConciergeChatPage
                  trip={activeTrip}
                  currency={currency}
                  onUpdateTrip={handleUpdateTrip}
                  onNavigate={(page, params) => {
                    if (params?.dayNumber) {
                      setItineraryDay(params.dayNumber);
                    }
                    setActivePage(page as ActivePage);
                    if (params?.targetId) {
                      setTimeout(() => {
                        const el = document.getElementById(params.targetId!);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 350);
                    }
                  }}
                  allTrips={trips}
                  onSelectTrip={handleSelectTrip}
                />
              )}

              {activePage === 'documents' && (
                <DocumentsPage
                  trip={activeTrip}
                  onUpdateTripDocuments={handleUpdateTripDocuments}
                />
              )}

              {activePage === 'saved' && (
                <SavedTripsPage
                  trips={trips}
                  activeTripId={activeTrip.id}
                  currency={currency}
                  onSelectTrip={handleSelectTrip}
                  onOpenPlanner={() => setActivePage('planner')}
                  onDeleteTrip={handleDeleteTrip}
                />
              )}

              {activePage === 'settings' && (
                <SettingsPage
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  onResetData={handleResetData}
                  onOpenAuthModal={() => setAuthModalOpen(true)}
                />
              )}
            </main>

            {/* In-App Golden Hour Footer */}
            <AppFooter
              onNavigate={(page) => setActivePage(page)}
              activeTrip={activeTrip}
            />
          </div>
        </div>
      )}

      {/* Global Quick Plan Modal Dialog */}
      {quickPlanOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto my-auto">
            <TripPlannerWizard
              initialDestination="Kyoto & Arashiyama, Japan"
              currency={currency}
              onTripGenerated={handleTripGenerated}
              onCancel={() => setQuickPlanOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Global Authentication Modal */}
      <LandingSignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

