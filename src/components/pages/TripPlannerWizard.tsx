/**
 * Smart AI Travel Planner 3.0
 * Multi-Step AI Trip Planner Wizard
 *
 * Golden Hour Luxury Theme (Scoped to non-home pages):
 * - White card, 16px radius, soft shadow
 * - Inputs on --surface-soft (#FBF6EE) with 1px --border (rgba(20,33,61,0.12))
 * - On focus: gold border (#D4A24C) + soft gold ring (0 0 0 4px rgba(212,162,76,0.2))
 * - Primary button: terracotta bg (#E76F51), white text, hover lift 1px, press scale 0.98
 * - Synthesis state: skeleton shimmer placeholders, step transitions
 */

import React, { useState, useEffect, useRef } from 'react';
import { CurrencyCode, TravelStyle, TripPlan, TripType, CabinClass } from '../../types/travel';
import { generateTrip } from '../../lib/api';
import { formatCurrency, calculateFeasiblePlan, convertCurrency } from '../../lib/budget';
import { searchLocations, NormalizedLocation } from '../../lib/geocoding';

interface TripPlannerWizardProps {
  initialDestination?: string;
  initialOrigin?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialTravelers?: number;
  currency: CurrencyCode;
  onTripGenerated: (newTrip: TripPlan) => void;
  onCancel: () => void;
}

const INCLUSIVE_INTERESTS = [
  'Beaches & Coastal Walks',
  'Ancient Temples & Heritage',
  'Local Street Food & Night Markets',
  'Waterfalls & Nature Trails',
  'Wildlife Sanctuaries',
  'Scenic Rail & Road Journeys',
  'Museums & Cultural Gallerias',
  'Adventure Sports & Kayaking',
  'Photography & Viewpoints',
  'Wellness & Ayurvedic Spas',
  'Fine Dining & Cafes',
  'Relaxed Hill Station Leisure',
];

export const TripPlannerWizard: React.FC<TripPlannerWizardProps> = ({
  initialDestination = '',
  initialOrigin = 'Shivamogga, India',
  initialStartDate,
  initialEndDate,
  initialTravelers = 2,
  currency,
  onTripGenerated,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [destination, setDestination] = useState(initialDestination);
  const [origin, setOrigin] = useState(initialOrigin);

  // Trip Mode (Round-Trip default per requirements)
  const [tripType, setTripType] = useState<TripType>('round_trip');
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');

  // Autocomplete states for destination
  const [destSuggestions, setDestSuggestions] = useState<NormalizedLocation[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destDropdownRef = useRef<HTMLDivElement>(null);

  // Autocomplete states for origin
  const [origSuggestions, setOrigSuggestions] = useState<NormalizedLocation[]>([]);
  const [isSearchingOrig, setIsSearchingOrig] = useState(false);
  const [showOrigDropdown, setShowOrigDropdown] = useState(false);
  const origDropdownRef = useRef<HTMLDivElement>(null);

  // Dates & Duration
  const defaultStart = initialStartDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const defaultEnd = initialEndDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Travelers & Style
  const [travelers, setTravelers] = useState<number>(initialTravelers);
  const [style, setStyle] = useState<TravelStyle>('budget');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Beaches & Coastal Walks',
    'Local Street Food & Night Markets',
    'Ancient Temples & Heritage',
  ]);

  // Synchronize with external incoming initial props
  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  useEffect(() => {
    if (initialOrigin) setOrigin(initialOrigin);
  }, [initialOrigin]);

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialEndDate]);

  useEffect(() => {
    if (initialTravelers) setTravelers(initialTravelers);
  }, [initialTravelers]);

  // Preferences
  const [accommodationType, setAccommodationType] = useState('Clean Boutique Homestay / Guesthouse');
  const [transitPreference, setTransitPreference] = useState('Train / Intercity AC Bus (Economical)');
  const [dietary, setDietary] = useState('Vegetarian options preferred, local delicacies');

  // Budget
  const [maxBudget, setMaxBudget] = useState<number>(8000);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency);

  // Synthesis states with dynamic stage progress
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisStage, setSynthesisStage] = useState<string>('Initializing autonomous agents...');
  const [stage1Progress, setStage1Progress] = useState<number>(0);
  const [stage2Progress, setStage2Progress] = useState<number>(0);
  const [stage3Progress, setStage3Progress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate duration dynamically from dates
  const calculateDays = () => {
    if (tripType === 'one_way') return 3; // sensible default duration for one-way trip
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) || diffDays < 1 ? 4 : diffDays;
  };

  const durationDays = calculateDays();

  // Feasibility Calculation
  const feasibilityPreview = calculateFeasiblePlan({
    origin,
    destination,
    durationDays,
    travelersCount: travelers,
    travelStyle: style,
    userBudget: convertCurrency(maxBudget, selectedCurrency, 'INR'),
  });

  // Debounced Autocomplete for Destination
  useEffect(() => {
    if (!destination || destination.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const results = await searchLocations(destination);
        setDestSuggestions(results.slice(0, 5));
      } catch {
        setDestSuggestions([]);
      } finally {
        setIsSearchingDest(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destination]);

  // Debounced Autocomplete for Origin
  useEffect(() => {
    if (!origin || origin.trim().length < 2) {
      setOrigSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOrig(true);
      try {
        const results = await searchLocations(origin);
        setOrigSuggestions(results.slice(0, 5));
      } catch {
        setOrigSuggestions([]);
      } finally {
        setIsSearchingOrig(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [origin]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (destDropdownRef.current && !destDropdownRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
      }
      if (origDropdownRef.current && !origDropdownRef.current.contains(event.target as Node)) {
        setShowOrigDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
    } else {
      setSelectedInterests((prev) => [...prev, interest]);
    }
  };

  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!origin.trim()) {
        setValidationError('Please enter your departure origin hub.');
        return;
      }
      if (!destination.trim()) {
        setValidationError('Please enter a target destination.');
        return;
      }
      if (tripType === 'round_trip' && new Date(startDate) > new Date(endDate)) {
        setValidationError('Return date cannot be earlier than departure date.');
        return;
      }
    }
    if (step === 2 && selectedInterests.length === 0) {
      setValidationError('Please pick at least one travel interest or activity.');
      return;
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    setValidationError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSynthesize = async () => {
    setValidationError(null);
    setIsSynthesizing(true);
    setStage1Progress(15);
    setStage2Progress(0);
    setStage3Progress(0);
    setSynthesisStage(`Transit Arbitrage Agent: Analyzing round-trip corridors from ${origin} to ${destination}...`);

    const t1 = setTimeout(() => {
      setStage1Progress(65);
      setStage2Progress(20);
      setSynthesisStage(`Hotels & Stay Agent: Evaluating boutique homestays and sanctuaries...`);
    }, 600);

    const t2 = setTimeout(() => {
      setStage1Progress(100);
      setStage2Progress(75);
      setSynthesisStage(`Deterministic Budget Agent: Allocating ${formatCurrency(maxBudget, selectedCurrency)} with currency hedging...`);
    }, 1200);

    const t3 = setTimeout(() => {
      setStage2Progress(100);
      setStage3Progress(40);
      setSynthesisStage(`Itinerary Agent: Curating authenticated ${destination} sights & activities...`);
    }, 1700);

    const t4 = setTimeout(() => {
      setStage3Progress(85);
      setSynthesisStage('Finalizing complete round-trip itinerary & verified photo archives...');
    }, 2400);

    const failsafe = setTimeout(() => {
      setIsSynthesizing(false);
      setValidationError('Synthesis took longer than expected. Please retry or adjust parameters.');
    }, 19000);

    try {
      const generated = await generateTrip({
        destination,
        origin,
        tripType,
        cabinClass,
        preferredTransport: transitPreference,
        startDate,
        endDate: tripType === 'round_trip' ? endDate : undefined,
        durationDays,
        travelersCount: travelers,
        style,
        interests: selectedInterests,
        maxBudget,
        currency: selectedCurrency,
        dietaryOrAccessibility: dietary,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(failsafe);

      setStage1Progress(100);
      setStage2Progress(100);
      setStage3Progress(100);
      setSynthesisStage('Synthesis Complete! Transitioning to your journey dashboard...');

      setTimeout(() => {
        setIsSynthesizing(false);
        onTripGenerated(generated);
      }, 400);
    } catch (err) {
      console.error('Synthesis error:', err);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(failsafe);
      setIsSynthesizing(false);
      setValidationError('Failed to generate trip. Please verify your inputs and retry.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 px-4 sm:px-6">
      {/* Wizard Card Container: White card, 16px radius, soft shadow */}
      <div className="bg-white rounded-[16px] border border-[rgba(20,33,61,0.12)] shadow-[0_2px_8px_rgba(20,33,61,0.06)] p-6 sm:p-10 space-y-8 relative">
        {/* Step Indicator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[rgba(20,33,61,0.12)] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A24C]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B27B22]">
                Step {step} of 4 · Odyssey Synthesis
              </span>
            </div>
            <h2 className="font-serif-heading text-2xl md:text-3xl font-bold text-[#14213D] mt-1">
              {step === 1 && 'Where & When are you traveling?'}
              {step === 2 && 'Travel Style & Interests'}
              {step === 3 && 'Transit & Stay Preferences'}
              {step === 4 && 'Budget & Feasibility Review'}
            </h2>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-[#D4A24C]'
                    : s < step
                    ? 'w-4 bg-[#2A9D8F]'
                    : 'w-4 bg-[#EBDCC6]'
                }`}
              />
            ))}
          </div>
        </div>

        {validationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[#D64545] text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: DESTINATION, ORIGIN & DATES */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Trip Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block">
                Trip Journey Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTripType('round_trip')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                    tripType === 'round_trip'
                      ? 'bg-[#FBF6EE] border-[#D4A24C] ring-2 ring-[#D4A24C]/25 text-[#14213D]'
                      : 'bg-[#FFFFFF] border-[rgba(20,33,61,0.12)] text-[#6B6F80] hover:border-[#D4A24C]/40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      tripType === 'round_trip' ? 'bg-[#D4A24C] text-white shadow-2xs' : 'bg-[#EBDCC6]/50 text-[#6B6F80]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">sync_alt</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-[#14213D]">Round Trip</strong>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#1E7469] border border-[#2A9D8F]/30">
                        Recommended
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B6F80] block mt-0.5">
                      Both Outbound & Return corridors planned to starting origin.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTripType('one_way')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                    tripType === 'one_way'
                      ? 'bg-[#FBF6EE] border-[#D4A24C] ring-2 ring-[#D4A24C]/25 text-[#14213D]'
                      : 'bg-[#FFFFFF] border-[rgba(20,33,61,0.12)] text-[#6B6F80] hover:border-[#D4A24C]/40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      tripType === 'one_way' ? 'bg-[#D4A24C] text-white shadow-2xs' : 'bg-[#EBDCC6]/50 text-[#6B6F80]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-[#14213D] block">One-Way Journey</strong>
                    <span className="text-[11px] text-[#6B6F80] block mt-0.5">
                      Outbound travel only. Return leg not scheduled.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin Search with Autocomplete */}
              <div className="space-y-1.5 relative" ref={origDropdownRef}>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                  Departure City / Origin Hub
                </label>
                <div className="p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] flex items-center gap-2 transition-all duration-200 focus-within:border-[#D4A24C] focus-within:ring-4 focus-within:ring-[#D4A24C]/20">
                  <span className="material-symbols-outlined text-[#E76F51] text-lg">flight_takeoff</span>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onFocus={() => setShowOrigDropdown(true)}
                    placeholder="e.g. Bengaluru, Shivamogga, Mumbai"
                    className="w-full bg-transparent text-sm font-semibold text-[#14213D] focus:outline-none border-none p-0 placeholder-[#8E95A5]"
                  />
                  {isSearchingOrig && <span className="material-symbols-outlined text-xs animate-spin text-[#D4A24C]">sync</span>}
                </div>

                {/* Origin Suggestions Dropdown */}
                {showOrigDropdown && origSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[rgba(20,33,61,0.12)] z-30 max-h-56 overflow-y-auto divide-y divide-[rgba(20,33,61,0.06)]">
                    {origSuggestions.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setOrigin(loc.displayName);
                          setShowOrigDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-[#FBF6EE] text-xs transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <strong className="text-[#14213D] block">{loc.city}</strong>
                          <span className="text-[11px] text-[#6B6F80]">{loc.displayName}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#1E7469]">
                          {loc.country}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Search with Autocomplete */}
              <div className="space-y-1.5 relative" ref={destDropdownRef}>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                  Target Destination / Region
                </label>
                <div className="p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] flex items-center gap-2 transition-all duration-200 focus-within:border-[#D4A24C] focus-within:ring-4 focus-within:ring-[#D4A24C]/20">
                  <span className="material-symbols-outlined text-[#2A9D8F] text-lg">pin_drop</span>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="e.g. Goa, Mysuru, Jaipur, Paris"
                    className="w-full bg-transparent text-sm font-semibold text-[#14213D] focus:outline-none border-none p-0 placeholder-[#8E95A5]"
                  />
                  {isSearchingDest && <span className="material-symbols-outlined text-xs animate-spin text-[#D4A24C]">sync</span>}
                </div>

                {/* Destination Suggestions Dropdown */}
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[rgba(20,33,61,0.12)] z-30 max-h-56 overflow-y-auto divide-y divide-[rgba(20,33,61,0.06)]">
                    {destSuggestions.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setDestination(loc.displayName);
                          setShowDestDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-[#FBF6EE] text-xs transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <strong className="text-[#14213D] block">{loc.city}</strong>
                          <span className="text-[11px] text-[#6B6F80]">{loc.displayName}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#1E7469]">
                          {loc.country}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Travelers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs font-semibold text-[#14213D] transition-all duration-200 focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                    Return Date
                  </label>
                  {tripType === 'one_way' && (
                    <span className="text-[10px] text-[#D4A24C] font-bold uppercase">One-Way</span>
                  )}
                </div>
                {tripType === 'round_trip' ? (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs font-semibold text-[#14213D] transition-all duration-200 focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-[#FBF6EE]/60 border border-[rgba(20,33,61,0.08)] text-xs font-medium text-[#6B6F80] italic">
                    N/A · One-Way Journey
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                  Travelers ({durationDays} Days)
                </label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)]">
                  <button
                    type="button"
                    onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-[rgba(20,33,61,0.12)] font-bold text-sm text-[#14213D] flex items-center justify-center hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-[#14213D]">{travelers} Guests</span>
                  <button
                    type="button"
                    onClick={() => setTravelers((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-[rgba(20,33,61,0.12)] font-bold text-sm text-[#14213D] flex items-center justify-center hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Destination Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase text-[#6B6F80] block">
                Popular Verified Routes:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { orig: 'Shivamogga, India', dest: 'Goa, India', label: 'Shivamogga ➔ Goa (Coastal / 3D)' },
                  { orig: 'Bengaluru, India', dest: 'Mysuru, India', label: 'Bengaluru ➔ Mysuru (Royal Heritage)' },
                  { orig: 'New Delhi, India', dest: 'Jaipur, India', label: 'Delhi ➔ Jaipur (Pink City Weekend)' },
                  { orig: 'Mumbai, India', dest: 'Kochi, Kerala, India', label: 'Mumbai ➔ Kerala Backwaters' },
                ].map((route, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setOrigin(route.orig);
                      setDestination(route.dest);
                    }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#FBF6EE] hover:bg-white text-[#14213D] border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C] transition-all cursor-pointer"
                  >
                    {route.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TRAVEL STYLE & INTERESTS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                Travel Style & Budget Priority
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'budget',
                    title: 'Budget Explorer',
                    desc: 'Hostels, local transit, budget gems',
                    icon: 'savings',
                  },
                  {
                    id: 'balanced',
                    title: 'Balanced Leisure',
                    desc: 'Comfortable boutique stays, varied experiences',
                    icon: 'balance',
                  },
                  {
                    id: 'luxury',
                    title: 'Warm Luxury',
                    desc: '4-5 star resorts, private transit, fine dining',
                    icon: 'diamond',
                  },
                ].map((item) => {
                  const isSel = style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyle(item.id as TravelStyle)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                        isSel
                          ? 'bg-[#FBF6EE] border-[#D4A24C] ring-2 ring-[#D4A24C]/25 text-[#14213D]'
                          : 'bg-white border-[rgba(20,33,61,0.12)] text-[#6B6F80] hover:border-[#D4A24C]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`material-symbols-outlined text-lg ${
                            isSel ? 'text-[#D4A24C]' : 'text-[#6B6F80]'
                          }`}
                        >
                          {item.icon}
                        </span>
                        {isSel && (
                          <span className="w-2 h-2 rounded-full bg-[#D4A24C]" />
                        )}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#14213D] block">
                          {item.title}
                        </strong>
                        <span className="text-[11px] text-[#6B6F80] block mt-0.5 leading-snug">
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inclusive Activities & Interests */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block">
                Select Your Experiences & Themes (Select all that inspire you)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {INCLUSIVE_INTERESTS.map((interest) => {
                  const isChecked = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-[#FBF6EE] border-[#D4A24C] text-[#14213D] ring-1 ring-[#D4A24C]/20 font-bold'
                          : 'bg-white border-[rgba(20,33,61,0.12)] text-[#6B6F80] hover:bg-[#FBF6EE]'
                      }`}
                    >
                      <span className="truncate pr-1">{interest}</span>
                      <span
                        className={`material-symbols-outlined text-sm shrink-0 ${
                          isChecked ? 'text-[#D4A24C]' : 'text-[#8E95A5]'
                        }`}
                      >
                        {isChecked ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TRANSIT & STAY PREFERENCES */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                Accommodation Sanctuary Type
              </label>
              <select
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200"
              >
                <option value="Clean Boutique Homestay / Guesthouse">
                  Clean Boutique Homestay / Guesthouse (Authentic, economical, friendly)
                </option>
                <option value="Curated 3-Star Comfort Hotel">
                  Curated 3-Star Comfort Hotel (Standard rooms, elevator, breakfast)
                </option>
                <option value="Heritage Villa / Boutique Sanctuary">
                  Heritage Villa / Boutique Sanctuary (Historic character & private gardens)
                </option>
                <option value="Luxury 5-Star Resort & Spa">
                  Luxury 5-Star Resort & Spa (Full amenities, oceanfront/valley view, private pools)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                Corridor Transit Preference
              </label>
              <select
                value={transitPreference}
                onChange={(e) => setTransitPreference(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200"
              >
                <option value="Train / Intercity AC Bus (Economical)">
                  Train / Intercity AC Bus (Economical & scenic regional passage)
                </option>
                <option value="Private Cab / Self-Drive Rental">
                  Private Cab / Self-Drive Rental (Flexible pacing & door-to-door)
                </option>
                <option value="Premium Direct Flight">
                  Premium Direct Flight (Maximum comfort & priority check-in)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                Flight & Transit Cabin Tier
              </label>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value as CabinClass)}
                className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200"
              >
                <option value="economy">Economy Class (Standard smart tariff)</option>
                <option value="premium_economy">Premium Economy (Extra legroom & baggage)</option>
                <option value="business">Business Class (Priority boarding, lounge & meals)</option>
                <option value="first">First Class (VIP private suite)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80]">
                Dietary & Accessibility Preferences
              </label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="e.g. Pure Vegetarian, Jain options, Halal, Wheelchair accessible"
                className="w-full p-3 rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs text-[#14213D] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET & FEASIBILITY REVIEW */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Budget Input & Presets */}
            <div className="p-6 rounded-2xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider">
                    Total Spending Budget Limit
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-[#14213D]">
                      {formatCurrency(maxBudget, selectedCurrency)}
                    </span>
                    <span className="text-xs text-[#6B6F80]">
                      (~{formatCurrency(Math.round(maxBudget / travelers), selectedCurrency)} / person)
                    </span>
                  </div>
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B6F80]">Set exact amount:</span>
                  <input
                    type="number"
                    min={2000}
                    max={25000000}
                    step={1000}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value) || 0)}
                    className="w-36 p-2 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] text-sm font-bold font-mono text-[#14213D] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Quick Budget Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-[#6B6F80] block">
                  Quick Budget Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '₹8,000 (Low-Cost Regional)', amount: 8000 },
                    { label: '₹15,000 (Budget Explorer)', amount: 15000 },
                    { label: '₹35,000 (Comfort Couple)', amount: 35000 },
                    { label: '₹75,000 (Family Vacation)', amount: 75000 },
                    { label: '₹2,50,000 (Premium Luxury)', amount: 250000 },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMaxBudget(preset.amount)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        maxBudget === preset.amount
                          ? 'bg-[#D4A24C] text-white shadow-2xs font-bold'
                          : 'bg-white text-[#14213D] border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Feasibility & Cost Assessment Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                feasibilityPreview.isFeasible
                  ? 'bg-[#2A9D8F]/10 border-[#2A9D8F]/30 text-[#14213D]'
                  : 'bg-[#E76F51]/10 border-[#E76F51]/30 text-[#14213D]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`material-symbols-outlined text-lg ${
                    feasibilityPreview.isFeasible ? 'text-[#2A9D8F]' : 'text-[#E76F51]'
                  }`}
                >
                  {feasibilityPreview.isFeasible ? 'check_circle' : 'warning'}
                </span>
                <strong className="text-xs font-bold uppercase tracking-wider">
                  {feasibilityPreview.isFeasible
                    ? 'Budget Feasibility Confirmed'
                    : 'Budget Shortfall Advisory'}
                </strong>
              </div>

              <p className="text-xs leading-relaxed text-[#6B6F80]">
                {feasibilityPreview.feasibilityExplanation}
              </p>

              {/* Cost breakdown summary */}
              <div className="mt-3 pt-3 border-t border-[rgba(20,33,61,0.1)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6B6F80] block uppercase">Min. Realistic:</span>
                  <strong className="font-mono text-[#14213D]">{formatCurrency(feasibilityPreview.minimumFeasibleCost, selectedCurrency)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6F80] block uppercase">Recommended:</span>
                  <strong className="font-mono text-[#14213D]">{formatCurrency(feasibilityPreview.recommendedPlanCost, selectedCurrency)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6F80] block uppercase">
                    {feasibilityPreview.isFeasible ? 'Surplus Remaining:' : 'Deficit / Shortfall:'}
                  </span>
                  <strong className={`font-mono ${feasibilityPreview.isFeasible ? 'text-[#2A9D8F]' : 'text-[#D64545]'}`}>
                    {feasibilityPreview.isFeasible
                      ? formatCurrency(feasibilityPreview.remainingBudget, selectedCurrency)
                      : `-${formatCurrency(feasibilityPreview.shortfall, selectedCurrency)}`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6F80] block uppercase">Cost / Person:</span>
                  <strong className="font-mono text-[#14213D]">{formatCurrency(feasibilityPreview.costPerPerson, selectedCurrency)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="pt-6 border-t border-[rgba(20,33,61,0.12)] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] text-[#14213D] hover:bg-[#FBF6EE] text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-98 cursor-pointer shadow-2xs"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] text-[#6B6F80] hover:text-[#14213D] text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-98 cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:shadow-md flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-px active:scale-98 cursor-pointer"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="px-6 py-3 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-px active:scale-98 cursor-pointer disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-base ${isSynthesizing ? 'animate-spin' : ''}`}>
                {isSynthesizing ? 'sync' : 'auto_awesome'}
              </span>
              <span>{isSynthesizing ? 'Synthesizing Plan...' : 'Synthesize Journey Plan'}</span>
            </button>
          )}
        </div>

        {/* Multi-Agent Synthesis Overlay Modal with Skeleton Shimmer */}
        {isSynthesizing && (
          <div className="fixed inset-0 z-50 bg-[#14213D]/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] max-w-lg w-full p-8 shadow-2xl border border-[rgba(20,33,61,0.12)] text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4A24C] via-[#E76F51] to-[#14213D] flex items-center justify-center text-white mx-auto shadow-md">
                <span className="material-symbols-outlined text-3xl">hub</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif-heading text-xl font-bold text-[#14213D]">
                  Autonomous Journey Synthesis
                </h3>
                <p className="text-xs text-[#D4A24C] font-mono font-semibold min-h-[32px] flex items-center justify-center">
                  {synthesisStage}
                </p>
              </div>

              {/* Skeleton shimmer previews of incoming cards */}
              <div className="grid grid-cols-3 gap-2.5 py-1">
                <div className="h-16 gh-skeleton rounded-xl" />
                <div className="h-16 gh-skeleton rounded-xl" />
                <div className="h-16 gh-skeleton rounded-xl" />
              </div>

              <div className="space-y-3 text-left text-xs font-medium">
                <div>
                  <div className="flex justify-between text-[#6B6F80] mb-1">
                    <span>1. Route & Spatial Arbitration</span>
                    <span className="text-[#D4A24C] font-bold font-mono">{stage1Progress}%</span>
                  </div>
                  <div className="w-full bg-[#EBDCC6] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D4A24C] h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stage1Progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#6B6F80] mb-1">
                    <span>2. Deterministic Feasibility & Budget</span>
                    <span className="text-[#2A9D8F] font-bold font-mono">{stage2Progress}%</span>
                  </div>
                  <div className="w-full bg-[#EBDCC6] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2A9D8F] h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stage2Progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#6B6F80] mb-1">
                    <span>3. Itinerary & Verified Sights</span>
                    <span className="text-[#E76F51] font-bold font-mono">{stage3Progress}%</span>
                  </div>
                  <div className="w-full bg-[#EBDCC6] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#E76F51] h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stage3Progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSynthesizing(false)}
                  className="text-[11px] text-[#6B6F80] hover:text-[#14213D] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  Cancel / Close Synthesis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
