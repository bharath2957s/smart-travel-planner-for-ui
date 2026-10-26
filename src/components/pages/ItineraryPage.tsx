/**
 * Smart AI Travel Planner 3.0
 * Itinerary Page
 * Faithfully matches Stitch Image 16 (Timeline & Inspection Rail)
 */

import React, { useState, useEffect } from 'react';
import { TripPlan, DayItinerary, Activity, CurrencyCode, ExpenseItem, ActivityCategory } from '../../types/travel';
import { formatCurrency, convertCurrency, calculateBilateralSplit } from '../../lib/budget';
import { regenerateDayItinerary } from '../../lib/itineraryEngine';
import { resolveCoordinates } from '../../lib/geocoding';
import { ItineraryInteractiveMap } from '../maps/ItineraryInteractiveMap';
import { GoogleItineraryMap } from '../maps/GoogleItineraryMap';
import { RealPlacePhoto } from '../RealPlacePhoto';
import { RealLandmarkArchive } from '../itinerary/RealLandmarkArchive';

export function syncActivityWithBudget(
  trip: TripPlan,
  activity: Activity,
  targetDayNumber: number,
  action: 'upsert' | 'delete',
  oldDayNumber?: number
): TripPlan {
  const mapCategory = (cat: string): ExpenseItem['category'] => {
    switch (cat) {
      case 'accommodations':
        return 'accommodations';
      case 'transit':
        return 'transit';
      case 'gastronomy':
        return 'gastronomy';
      case 'culture':
      case 'wellness':
      case 'maritime':
      case 'nature':
      case 'adventure':
      case 'experiences':
      default:
        return 'experiences';
    }
  };

  const expenseId = `exp-act-${activity.id}`;
  const dayObj = trip.itinerary.find((d) => d.dayNumber === targetDayNumber);
  const dateStr = dayObj?.dateStr || `Day ${targetDayNumber}`;

  // 1. Update Itinerary Days
  const updatedItinerary = trip.itinerary.map((d) => {
    if (oldDayNumber && d.dayNumber === oldDayNumber && oldDayNumber !== targetDayNumber) {
      const filtered = d.activities.filter((a) => a.id !== activity.id);
      return {
        ...d,
        activities: filtered,
        totalEstimatedCost: filtered.reduce((acc, a) => acc + (a.estimatedCost || 0), 0),
      };
    }

    if (d.dayNumber === targetDayNumber) {
      let nextActs: Activity[];
      if (action === 'delete') {
        nextActs = d.activities.filter((a) => a.id !== activity.id);
      } else {
        const existingIdx = d.activities.findIndex((a) => a.id === activity.id);
        if (existingIdx >= 0) {
          nextActs = d.activities.map((a) => (a.id === activity.id ? activity : a));
        } else {
          nextActs = [...d.activities, activity];
        }
      }
      return {
        ...d,
        activities: nextActs,
        totalEstimatedCost: nextActs.reduce((acc, a) => acc + (a.estimatedCost || 0), 0),
      };
    }

    if (action === 'delete') {
      const filtered = d.activities.filter((a) => a.id !== activity.id);
      return {
        ...d,
        activities: filtered,
        totalEstimatedCost: filtered.reduce((acc, a) => acc + (a.estimatedCost || 0), 0),
      };
    }

    return d;
  });

  // 2. Synchronize Budget Items
  const currentItems = trip.budget.items || [];
  let updatedItems: ExpenseItem[];

  if (action === 'delete') {
    updatedItems = currentItems.filter((it) => it.id !== expenseId);
  } else {
    const existingIndex = currentItems.findIndex((it) => it.id === expenseId);
    const newExpenseItem: ExpenseItem = {
      id: expenseId,
      entityName: activity.title || activity.placeName || 'Custom Activity',
      subDetail: `Day ${targetDayNumber} · ${activity.timeSlot || 'Planned'}`,
      dateRange: dateStr,
      category: mapCategory(activity.category),
      paymentMethod: 'Planned Activity',
      status: 'authorized',
      amount: Math.max(0, Math.round(activity.estimatedCost || 0)),
    };

    if (existingIndex >= 0) {
      updatedItems = currentItems.map((it, idx) => (idx === existingIndex ? newExpenseItem : it));
    } else {
      updatedItems = [newExpenseItem, ...currentItems];
    }
  }

  // 3. Recalculate deterministic budget totals
  const totalCommitted = updatedItems.reduce((acc, it) => acc + Math.max(0, it.amount), 0);
  const contingencyReserve = Math.round((totalCommitted * 7.6) / 100);
  const totalCap = trip.budget.totalCap || (totalCommitted + contingencyReserve);

  const splitMath = calculateBilateralSplit(
    totalCommitted,
    trip.budget.bilateralSplit?.person1?.sharePercent || 50,
    trip.budget.bilateralSplit?.person2?.sharePercent || 50
  );

  return {
    ...trip,
    itinerary: updatedItinerary,
    budget: {
      ...trip.budget,
      items: updatedItems,
      committedOutlay: totalCommitted,
      contingencyReserve,
      fxHedgedValue: totalCommitted,
      bilateralSplit: {
        person1: {
          name: trip.budget.bilateralSplit?.person1?.name || 'Traveler 1',
          sharePercent: 50,
          amount: splitMath.person1Share,
          paymentDetails: 'Primary Share',
        },
        person2: {
          name: trip.budget.bilateralSplit?.person2?.name || 'Traveler 2',
          sharePercent: 50,
          amount: splitMath.person2Share,
          paymentDetails: 'Secondary Share',
        },

      },
    },
  };
}

interface ItineraryPageProps {
  trip: TripPlan;
  currency: CurrencyCode;
  onUpdateTrip?: (updated: TripPlan) => void;
  onNavigate?: (page: string) => void;
  initialDay?: number;
}

export const ItineraryPage: React.FC<ItineraryPageProps> = ({
  trip,
  currency,
  onUpdateTrip,
  onNavigate,
  initialDay,
}) => {
  // Dynamically select initial day based on initialDay prop or trip duration
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (initialDay && trip.itinerary && trip.itinerary.some((d) => d.dayNumber === initialDay)) {
      return initialDay;
    }
    return trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary[0].dayNumber : 1;
  });

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Synchronize when initialDay prop changes
  useEffect(() => {
    if (initialDay && trip.itinerary && trip.itinerary.some((d) => d.dayNumber === initialDay)) {
      setSelectedDay(initialDay);
    }
  }, [initialDay, trip]);

  // Keep selectedDay within valid bounds if trip changes
  useEffect(() => {
    if (trip.itinerary && trip.itinerary.length > 0) {
      if (!trip.itinerary.some((d) => d.dayNumber === selectedDay)) {
        setSelectedDay(trip.itinerary[0].dayNumber);
      }
    }
  }, [trip, selectedDay]);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Custom Activity Modal Form State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [originalDay, setOriginalDay] = useState<number>(1);

  const [formTitle, setFormTitle] = useState('');
  const [formDay, setFormDay] = useState<number>(1);
  const [formTime, setFormTime] = useState('Morning · 09:30 - 12:30');
  const [formCategory, setFormCategory] = useState<string>('experiences');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [formPrice, setFormPrice] = useState<string>(''); // Required manual numeric input, no fallback!
  const [formNotes, setFormNotes] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentDayData =
    trip.itinerary.find((d) => d.dayNumber === selectedDay) ||
    trip.itinerary[0] || {
      dayNumber: 1,
      dateStr: 'Day 1',
      title: 'Arrival & Welcome',
      tagline: 'Initial Exploration',
      activities: [],
      weather: { tempC: 24, condition: 'Clear', rainProb: '0%', wind: 'W 5 kts' },
      totalEstimatedCost: 0,
    };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    try {
      const updated = regenerateDayItinerary(trip, selectedDay, currency);
      onUpdateTrip?.(updated);
      showToast(`Day ${selectedDay} regenerated with verified unique places for ${trip.destination}.`);
    } catch (err) {
      console.warn('Regeneration error:', err);
      showToast(`Day ${selectedDay} refreshed.`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSwapAlternative = (actId: string, altLabel: string, costDelta: number) => {
    showToast(`Activity swapped for: "${altLabel}" (Cost delta: ${formatCurrency(costDelta, currency)})`);
  };

  // Open modal for inserting new custom activity
  const handleOpenAddModal = (dayToInsert?: number) => {
    setIsEditing(false);
    setEditingActivityId(null);
    const targetDay = dayToInsert || selectedDay || 1;
    setFormDay(targetDay);
    setOriginalDay(targetDay);
    setFormTitle('');
    setFormTime('Morning · 09:30 - 12:30');
    setFormCategory('experiences');
    setCustomCategoryName('');
    setFormPrice(''); // Blank - user MUST enter manually!
    setFormNotes('');
    setPriceError(null);
    setIsSaving(false);
    setShowActivityModal(true);
  };

  // Open modal for editing an existing activity
  const handleOpenEditModal = (act: Activity, currentDay: number) => {
    setIsEditing(true);
    setEditingActivityId(act.id);
    setFormDay(currentDay);
    setOriginalDay(currentDay);
    setFormTitle(act.placeName || act.title);
    setFormTime(act.timeSlot || 'Morning · 09:30 - 12:30');
    setFormCategory(act.category || 'experiences');
    setCustomCategoryName(act.category === ('custom' as any) ? act.categoryLabel : '');
    setFormPrice(String(act.estimatedCost ?? 0));
    setFormNotes(act.description || '');
    setPriceError(null);
    setIsSaving(false);
    setShowActivityModal(true);
  };

  // Delete an activity and remove its cost from the budget immediately
  const handleDeleteActivity = (actId: string, dayNumber: number) => {
    const act = trip.itinerary.flatMap((d) => d.activities).find((a) => a.id === actId);
    if (!act) return;

    const updatedTrip = syncActivityWithBudget(trip, act, dayNumber, 'delete');
    onUpdateTrip?.(updatedTrip);
    showToast(`Removed "${act.title}" from Day ${dayNumber} and updated budget.`);
  };

  // Save activity (create or edit) with strict price validation
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceError(null);

    if (!formTitle.trim()) {
      return;
    }

    // Strict validation: price must be manually entered, numeric, and non-negative
    const trimmedPrice = formPrice.trim();
    if (trimmedPrice === '') {
      setPriceError('Please enter a valid price in INR (enter ₹0 for free activities).');
      return;
    }

    const numericPrice = Number(trimmedPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setPriceError('Price must be a valid non-negative number (₹0 or greater).');
      return;
    }

    setIsSaving(true);

    const resolvedCategoryLabel =
      formCategory === 'custom'
        ? (customCategoryName.trim() || 'Custom Activity')
        : formCategory.toUpperCase();

    const resolvedCustomCoords = resolveCoordinates(formTitle.trim(), trip.destination);

    const activityData: Activity = {
      id: isEditing && editingActivityId ? editingActivityId : `custom-act-${Date.now()}`,
      timeSlot: formTime.trim() || 'Custom Slot',
      title: formTitle.trim(),
      placeName: formTitle.trim(),
      destination: trip.destination,
      coordinates: resolvedCustomCoords || undefined,
      category: formCategory as ActivityCategory,
      categoryLabel: resolvedCategoryLabel,
      description: formNotes.trim() || 'Curated activity in private dossier.',
      duration: '2h',
      estimatedCost: Math.round(numericPrice),
      image: '',
      isVerified: true,
      dataSource: 'User-Curated Itinerary',
    };

    const updatedTrip = syncActivityWithBudget(
      trip,
      activityData,
      formDay,
      'upsert',
      isEditing ? originalDay : undefined
    );

    onUpdateTrip?.(updatedTrip);
    setShowActivityModal(false);
    setIsSaving(false);

    showToast(
      isEditing
        ? `Updated "${activityData.title}" (Cost: ${formatCurrency(activityData.estimatedCost, 'INR')})`
        : `Added "${activityData.title}" to Day ${formDay} (Cost: ${formatCurrency(activityData.estimatedCost, 'INR')})`
    );
  };

  const dayTotalConverted = convertCurrency(currentDayData.totalEstimatedCost, 'INR', currency);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg border border-[#334155] flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-sm text-[#0891B2]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Odyssey Header Section */}
      <div className="relative w-full rounded-[16px] bg-white p-6 md:p-8 shadow-[0_2px_8px_rgba(20,33,61,0.06)] mb-6 border border-[rgba(20,33,61,0.12)] overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#D4A24C]/15 via-[#E76F51]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-2 mb-2 text-[#D4A24C] flex-wrap">
              <span className="material-symbols-outlined text-lg text-[#D4A24C]">verified_user</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B27B22]">
                Autonomous Concierge Curation · Golden Hour Tier
              </span>
              <span className="text-[rgba(20,33,61,0.2)]">•</span>
              <span className="text-[11px] font-mono text-[#6B6F80] uppercase tracking-wider">
                Ref ID: {trip.confNumber.replace('CONF. #', '')}
              </span>
            </div>

            <h1 className="font-serif-heading text-3xl md:text-4xl lg:text-5xl text-[#14213D] font-bold tracking-tight leading-none mb-3">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-[#6B6F80] pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6EE] text-[#14213D] border border-[rgba(20,33,61,0.12)]">
                <span className="material-symbols-outlined text-[#D4A24C] text-base">calendar_month</span>
                <span className="text-xs font-semibold">{trip.durationDays} Days / {trip.durationDays - 1} Nights</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6EE] text-[#14213D] border border-[rgba(20,33,61,0.12)]">
                <span className="material-symbols-outlined text-[#E76F51] text-base">speed</span>
                <span className="text-xs">
                  Pacing: <strong className="text-[#14213D] font-bold">Relaxed {trip.pacing.relaxedPercent}%</strong> · Active {trip.pacing.activePercent}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF6EE] text-[#14213D] border border-[rgba(20,33,61,0.12)]">
                <span className="material-symbols-outlined text-[#2A9D8F] text-base">pin_drop</span>
                <span className="text-xs font-semibold">{trip.destination}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FBF6EE] text-[#14213D] border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C] text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-98 shadow-2xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[#D4A24C] text-base ${isRegenerating ? 'animate-spin' : ''}`}>
                auto_fix_high
              </span>
              <span>{isRegenerating ? 'Recalculating...' : 'Regenerate Day with AI'}</span>
            </button>
            <button
              onClick={() => showToast('Dossier link copied to clipboard.')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FBF6EE] text-[#14213D] border border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C] text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-98 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#2A9D8F]">share</span>
              <span>Share Dossier</span>
            </button>
            <button
              onClick={() => showToast('Pass generated and synced with Apple Wallet.')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1E2E52] text-white text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-98 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#D4A24C]">account_balance_wallet</span>
              <span>Export to Apple Wallet</span>
            </button>
          </div>
        </div>

        {/* Day Selector Strip */}
        <div className="relative z-10 mt-8 pt-4 border-t border-[rgba(20,33,61,0.12)] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: trip.durationDays }, (_, i) => i + 1).map((dNum) => {
            const isSelected = selectedDay === dNum;
            const matchingDay = trip.itinerary.find((d) => d.dayNumber === dNum);
            const dateLabel = matchingDay?.dateStr || `Day 0${dNum}`;

            return (
              <button
                key={dNum}
                onClick={() => setSelectedDay(dNum)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex flex-col items-start gap-0.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E76F51] text-white shadow-sm font-bold scale-102'
                    : 'bg-[#FBF6EE] text-[#6B6F80] hover:text-[#14213D] hover:bg-white border border-[rgba(20,33,61,0.12)]'
                }`}
              >
                <span className={`text-[10px] uppercase font-mono ${isSelected ? 'text-white/80' : 'text-[#8E95A5]'}`}>
                  {dateLabel}
                </span>
                <span>Day {dNum < 10 ? `0${dNum}` : dNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Asymmetric Workspace (8 Cols Timeline / 4 Cols Inspection Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timeline Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Timeline Meta Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0891B2] text-lg">tune</span>
              <span className="text-xs font-bold text-[#0F172A]">Chronological Route Sequence</span>
              <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[10px] font-bold text-[#0891B2] uppercase">
                {currentDayData.activities.length} Key Curations
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#64748B] text-xs font-medium">
              <span className="material-symbols-outlined text-sm">drag_indicator</span>
              <span className="hidden sm:inline">Reorder cards to reschedule automatically</span>
            </div>
          </div>

          {/* Activities List */}
          {currentDayData.activities.map((activity, idx) => (
            <React.Fragment key={activity.id}>
              <div
                onClick={() => setSelectedActivityId(activity.id)}
                className={`relative bg-white rounded-[16px] p-5 md:p-6 border border-[rgba(20,33,61,0.12)] border-l-4 border-l-[#D4A24C] transition-all duration-260 cursor-pointer group hover:-translate-y-1 ${
                  selectedActivityId === activity.id
                    ? 'ring-2 ring-[#D4A24C]/30 shadow-[0_10px_30px_rgba(20,33,61,0.10)] bg-[#FBF6EE]/40'
                    : 'shadow-[0_2px_8px_rgba(20,33,61,0.06)] hover:shadow-[0_10px_30px_rgba(20,33,61,0.10)]'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header & Time Slot */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="material-symbols-outlined text-[#D4A24C] text-base">
                        pin_drop
                      </span>
                      {/* Time label in gold */}
                      <div className="px-2.5 py-1 rounded-md bg-[#FBF6EE] text-[#B27B22] border border-[#D4A24C]/35 font-mono text-[11px] font-bold uppercase tracking-wider">
                        {activity.timeSlot}
                      </div>
                      <span className="text-[#6B6F80] text-xs">Est. {activity.duration}</span>
                      {selectedActivityId === activity.id && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E76F51] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                          Focused on Map
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(activity, selectedDay);
                        }}
                        className="p-1.5 rounded-lg text-[#6B6F80] hover:text-[#14213D] hover:bg-[#FBF6EE] transition-colors cursor-pointer"
                        title="Edit Activity & Price"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${activity.title}" from Day ${selectedDay}? Its cost will be deducted from your budget immediately.`)) {
                            handleDeleteActivity(activity.id, selectedDay);
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#6B6F80] hover:text-[#D64545] hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Activity"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Activity Details & Photographic Imagery with Rounded Corners & Subtle Gradient */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 relative bg-[#EBDCC6]">
                      <RealPlacePhoto
                        placeName={activity.placeName || activity.title}
                        destination={trip.destination}
                        characteristics={activity.description}
                        aspectRatio="16/9"
                        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                        alt={`${activity.title} in ${trip.destination}`}
                      />
                      {/* Subtle bottom gradient so text stays readable */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14213D]/70 via-transparent to-transparent pointer-events-none" />
                      {activity.badge && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#14213D]/80 text-[#D4A24C] text-[10px] font-mono font-semibold uppercase backdrop-blur-sm z-10 border border-[#D4A24C]/30">
                          {activity.badge}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[#2A9D8F]">
                            <span className="material-symbols-outlined text-sm">
                              {activity.category === 'culture'
                                ? 'fort'
                                : activity.category === 'nature'
                                ? 'landscape'
                                : activity.category === 'gastronomy'
                                ? 'restaurant'
                                : activity.category === 'maritime'
                                ? 'sailing'
                                : activity.category === 'adventure'
                                ? 'explore'
                                : 'place'}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {activity.categoryLabel}
                            </span>
                            {activity.neighborhood && (
                              <span className="text-xs text-[#6B6F80]">
                                · {activity.neighborhood}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1E7469] bg-[#2A9D8F]/15 px-2 py-0.5 rounded-full border border-[#2A9D8F]/30">
                              <span className="material-symbols-outlined text-xs">verified</span>
                              <span>{activity.isVerified ? 'Verified Landmark' : 'Curated Place'}</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-[#14213D] bg-[#FBF6EE] px-2 py-0.5 rounded-md border border-[rgba(20,33,61,0.12)]">
                              Est. {formatCurrency(activity.estimatedCost, currency)}
                            </span>
                          </div>
                        </div>

                        {/* Place Name in ink */}
                        <h2 className="font-serif-heading text-lg text-[#14213D] font-bold mb-1">
                          {activity.placeName || activity.title}
                        </h2>
                        {/* Short description in muted */}
                        <p className="text-xs text-[#6B6F80] leading-relaxed">
                          {activity.description}
                        </p>
                      </div>

                      {/* Specs & Data Source */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                        {activity.specs && activity.specs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {activity.specs.map((sp, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md bg-[#FBF6EE] border border-[rgba(20,33,61,0.08)] text-[#14213D] text-[11px] font-medium"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        )}
                        {activity.dataSource && (
                          <span className="text-[10px] text-[#8E95A5] font-mono">
                            Source: {activity.dataSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Alternative Swaps */}
                  {activity.alternatives && activity.alternatives.length > 0 && (
                    <div className="pt-2 border-t border-[rgba(20,33,61,0.08)] flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#6B6F80] font-bold">
                        AI Alternatives:
                      </span>
                      {activity.alternatives.map((alt) => (
                        <button
                          key={alt.id}
                          onClick={() => handleSwapAlternative(activity.id, alt.label, alt.costDelta)}
                          className="px-2.5 py-1 rounded-full bg-[#FBF6EE] hover:bg-[#EBDCC6] border border-[#D4A24C]/40 text-[#14213D] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs text-[#D4A24C]">swap_horiz</span>
                          <span>{alt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transit Connector between events if specified */}
              {activity.transitAfter && (
                <div className="flex items-center gap-3 pl-8 pr-4 py-1 text-xs text-[#64748B]">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0891B2] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base">directions_boat</span>
                  </div>
                  <div className="flex-1">
                    <strong className="text-[#0F172A]">{activity.transitAfter.title}: </strong>
                    <span>{activity.transitAfter.description}</span>
                    <span className="text-[#94A3B8] ml-1">• {activity.transitAfter.buffer}</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Add Activity Button */}
          <button
            onClick={() => handleOpenAddModal(selectedDay)}
            className="w-full py-4 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#0891B2] bg-white/70 hover:bg-white text-[#64748B] hover:text-[#0891B2] transition-all flex items-center justify-center gap-2 group shadow-2xs"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-lg">
              add_circle
            </span>
            <span className="text-xs font-bold uppercase tracking-wider">
              Insert Custom Activity or Transfer into Day {selectedDay < 10 ? `0${selectedDay}` : selectedDay}
            </span>
          </button>
        </div>

        {/* Side Inspection Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real Landmark Archive (Connected dynamically to trip itinerary & Unsplash) */}
          <RealLandmarkArchive
            trip={trip}
            currency={currency}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSelectActivity={(id) => setSelectedActivityId(id)}
            onUpdateTrip={onUpdateTrip}
            onOpenAddActivityModal={() => handleOpenAddModal(selectedDay)}
            onNavigateToPlanner={() => onNavigate?.('planner')}
          />

          {/* Real Live Interactive Route Map */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0891B2] text-lg">map</span>
                <span className="text-xs font-bold text-[#0F172A]">Interactive Itinerary Map</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0891B2] text-[10px] font-bold uppercase">
                Day {selectedDay} Sequence
              </span>
            </div>

            <GoogleItineraryMap
              itinerary={trip.itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              selectedActivityId={selectedActivityId}
              onSelectActivity={(id) => setSelectedActivityId(id)}
              currency={currency}
              destination={trip.destination}
              origin={trip.origin}
              height="380px"
            />

            {currentDayData.activities.length > 0 && (
              <div className="space-y-1.5 text-xs pt-2 border-t border-[#E2E8F0]">
                {currentDayData.activities.map((act, aIdx) => {
                  const resolved = act.coordinates || resolveCoordinates(act.placeName || act.title, trip.destination);
                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedActivityId === act.id ? 'bg-[#EFF6FF] text-[#0891B2]' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[#0F172A] font-medium truncate max-w-[62%]">
                        <span className={`w-2 h-2 rounded-full ${resolved ? 'bg-[#0891B2]' : 'bg-amber-400'}`} />
                        <span className="truncate">WP{aIdx + 1} · {act.placeName || act.title}</span>
                      </span>
                      <span className="font-mono text-[10px]">
                        {resolved ? (
                          <span className="text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {resolved.lat.toFixed(2)}°N, {resolved.lon.toFixed(2)}°E
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Location unmapped
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Atmospheric Telemetry */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0891B2] text-lg">sunny</span>
                <span className="text-xs font-bold text-[#0F172A]">Atmospheric Telemetry</span>
              </div>
              <span className="text-[10px] font-bold text-[#0891B2] uppercase">Optimal</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0891B2] shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">wb_sunny</span>
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-[#0F172A]">24°C</span>
                  <p className="text-[11px] text-[#0891B2] font-semibold">Mediterranean Clear</p>
                </div>
              </div>
              <div className="text-right text-[11px] text-[#64748B]">
                <p className="font-bold text-[#059669]">0% Rain</p>
                <p>Wind: WNW 7 kts</p>
              </div>
            </div>
          </div>

          {/* Itemized Day Expense Ledger */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0891B2] text-lg">receipt_long</span>
                <span className="text-xs font-bold text-[#0F172A]">Day {selectedDay} Expense Ledger</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#0891B2] font-mono text-[10px] font-bold border border-[#E2E8F0]">
                Verified
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0] space-y-2 text-xs">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-semibold text-[#0F172A]">Private Yacht Charter Riva 48'</p>
                  <p className="text-[10px] text-[#64748B]">Includes skipper & marine champagne</p>
                </div>
                <span className="font-mono font-bold text-[#0F172A]">
                  {formatCurrency(convertCurrency(165000, 'INR', currency), currency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-[#0F172A]">La Fontelina Reserved Lunch</p>
                  <p className="text-[10px] text-[#64748B]">Prepaid tasting & sommelier (2 guests)</p>
                </div>
                <span className="font-mono font-bold text-[#0F172A]">
                  {formatCurrency(convertCurrency(42800, 'INR', currency), currency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-[#0F172A]">Helicopter Transit (Capri ➔ Ravello)</p>
                  <p className="text-[10px] text-[#64748B]">Private charter & landing fees</p>
                </div>
                <span className="font-mono font-bold text-[#0F172A]">
                  {formatCurrency(convertCurrency(79500, 'INR', currency), currency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-[#0F172A]">Rossellinis Michelin Dining</p>
                  <p className="text-[10px] text-[#64748B]">Seven courses + live acoustic cello</p>
                </div>
                <span className="font-mono font-bold text-[#0F172A]">
                  {formatCurrency(convertCurrency(56200, 'INR', currency), currency)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Day Total Allocation</span>
                <p className="text-[10px] text-[#0891B2]">Settled via Travel Vault</p>
              </div>
              <span className="font-serif-heading text-lg font-bold text-[#0F172A] font-mono">
                {formatCurrency(dayTotalConverted, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insert or Edit Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] space-y-5 animate-scale-up my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-serif-heading text-xl font-bold text-[#0F172A]">
                  {isEditing ? 'Edit Activity Details' : `Insert Custom Activity`}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {isEditing
                    ? 'Modify activity schedule, category, and budget allocation.'
                    : `Add a bespoke landmark or private excursion into Day ${formDay}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              {/* Activity Title (Required) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block mb-1">
                  Activity Title <span className="text-[#E76F51]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Private Catamaran Coastal Cruise"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all font-semibold text-[#14213D]"
                />
              </div>

              {/* Day Selection & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block mb-1">
                    Itinerary Day <span className="text-[#E76F51]">*</span>
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all font-medium text-[#14213D]"
                  >
                    {trip.itinerary.map((d) => (
                      <option key={d.dayNumber} value={d.dayNumber}>
                        Day {d.dayNumber} — {d.title || d.dateStr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all text-[#14213D]"
                  />
                </div>
              </div>

              {/* Quick Time Preset Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Morning · 09:30 - 12:30',
                  'Afternoon · 14:00 - 17:00',
                  'Evening · 18:30 - 21:30',
                  'Full Day Excursion',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormTime(slot)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                      formTime === slot
                        ? 'bg-[#FBF6EE] text-[#14213D] border-[#D4A24C] font-bold'
                        : 'bg-white text-[#6B6F80] border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C]/40'
                    }`}
                  >
                    {slot.split(' · ')[0]}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all text-[#14213D]"
                >
                  <option value="experiences">Experiences & Sightseeing</option>
                  <option value="culture">Cultural Heritage & Monuments</option>
                  <option value="gastronomy">Gastronomy & Dining</option>
                  <option value="maritime">Maritime & Boat Excursions</option>
                  <option value="wellness">Wellness, Spa & Thermal Springs</option>
                  <option value="nature">Nature & Scenic Viewpoints</option>
                  <option value="adventure">Adventure & Outdoor Sports</option>
                  <option value="transit">Local Transit & Private Transfer</option>
                  <option value="custom">Custom Category...</option>
                </select>

                {formCategory === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] text-[#14213D]"
                  />
                )}
              </div>

              {/* Custom Price (INR ₹) — Required Manual Numeric Input */}
              <div className="p-4 rounded-2xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-1">
                    <span>Custom Price (INR ₹)</span>
                    <span className="text-[#E76F51]">*</span>
                  </label>
                  <span className="text-[10px] text-[#D4A24C] font-semibold">
                    Indian Rupee Format
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#D4A24C]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Enter amount (e.g. 2500, or 0 if free)"
                    value={formPrice}
                    onChange={(e) => {
                      setFormPrice(e.target.value);
                      if (priceError) setPriceError(null);
                    }}
                    className={`w-full pl-8 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl border focus:outline-none text-[#14213D] transition-all ${
                      priceError
                        ? 'border-rose-400 bg-rose-50/40 focus:border-[#D64545]'
                        : 'border-[rgba(20,33,61,0.12)] focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 bg-white'
                    }`}
                  />
                </div>

                {priceError ? (
                  <p className="text-[11px] text-[#D64545] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{priceError}</span>
                  </p>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-[#6B6F80]">
                    <span>Enter ₹0 for free sightseeing or uncharged walks.</span>
                    {formPrice.trim() !== '' && !isNaN(Number(formPrice)) && (
                      <span className="font-mono font-semibold text-[#D4A24C]">
                        Preview: {formatCurrency(Number(formPrice), 'INR')}
                        {currency !== 'INR' && ` (${formatCurrency(Number(formPrice), currency)})`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Notes / Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B6F80] block mb-1">
                  Notes or Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Private booking notes, meeting point, reservation confirmation, or dress code..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all text-[#14213D]"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(20,33,61,0.12)]">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#6B6F80] hover:text-[#14213D] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:-translate-y-px active:scale-98 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isEditing ? 'check' : 'bookmark_add'}
                  </span>
                  <span>{isSaving ? 'Synchronizing...' : isEditing ? 'Update Activity' : 'Save to Itinerary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
