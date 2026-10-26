/**
 * Smart AI Travel Planner 3.0
 * Saved Trips & Expedition Library Page
 *
 * Golden Hour Luxury Theme (Scoped to non-home pages):
 * - Card grid with cover photo (hover zoom 1.05)
 * - Trip title in ink (#14213D), date, and gold "Saved" badge
 * - Delete uses soft red (#D64545) and asks for confirmation before removing
 */

import React, { useState } from 'react';
import { TripPlan, CurrencyCode } from '../../types/travel';
import { formatCurrency } from '../../lib/budget';
import { RealPlacePhoto } from '../RealPlacePhoto';

interface SavedTripsPageProps {
  trips: TripPlan[];
  activeTripId: string;
  currency: CurrencyCode;
  onSelectTrip: (tripId: string) => void;
  onOpenPlanner: () => void;
  onDeleteTrip: (tripId: string) => void;
}

export const SavedTripsPage: React.FC<SavedTripsPageProps> = ({
  trips,
  activeTripId,
  currency,
  onSelectTrip,
  onOpenPlanner,
  onDeleteTrip,
}) => {
  // Confirmation state for deleting a trip
  const [tripToDelete, setTripToDelete] = useState<TripPlan | null>(null);

  const handleConfirmDelete = () => {
    if (tripToDelete) {
      onDeleteTrip(tripToDelete.id);
      setTripToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[rgba(20,33,61,0.12)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4A24C]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B27B22]">
              Expedition Registry & Archives
            </span>
          </div>
          <h1 className="font-serif-heading text-3xl font-bold text-[#14213D] mt-1">
            Saved Journeys & Expeditions
          </h1>
          <p className="text-xs text-[#6B6F80]">
            Manage your autonomous itineraries, synchronized dossiers, and archived travel plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPlanner}
            className="px-5 py-2.5 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-px active:scale-98 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Plan New Odyssey</span>
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((t, idx) => {
          const isActive = t.id === activeTripId;
          return (
            <div
              key={t.id}
              className={`bg-white rounded-[16px] border transition-all duration-260 overflow-hidden flex flex-col justify-between group hover:-translate-y-1 ${
                isActive
                  ? 'border-[#D4A24C] ring-2 ring-[#D4A24C]/25 shadow-[0_10px_30px_rgba(20,33,61,0.10)]'
                  : 'border-[rgba(20,33,61,0.12)] hover:border-[#D4A24C]/40 shadow-[0_2px_8px_rgba(20,33,61,0.06)] hover:shadow-[0_10px_30px_rgba(20,33,61,0.10)]'
              }`}
            >
              {/* Card Banner Image with Hover Zoom */}
              <div className="h-48 relative overflow-hidden bg-[#EBDCC6]">
                <RealPlacePhoto
                  placeName={t.destination}
                  destination={t.destination}
                  aspectRatio="h-full"
                  className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                  alt={t.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14213D]/80 via-transparent to-black/25 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-[#14213D] uppercase tracking-wider shadow-xs">
                      {t.durationDays} Days • {t.travelersCount} Guests
                    </span>
                    {isActive && (
                      <span className="px-2.5 py-1 rounded-full bg-[#2A9D8F] text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                        Active Odyssey
                      </span>
                    )}
                  </div>

                  {/* Gold "Saved" Badge */}
                  <span className="px-2.5 py-1 rounded-full bg-[#D4A24C] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">bookmark</span>
                    <span>Saved</span>
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] uppercase font-mono text-[#D4A24C] tracking-wider block font-semibold">
                    {t.destination}
                  </span>
                  <h3 className="font-serif-heading text-lg font-bold truncate text-white">
                    {t.title}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B6F80]">
                    <span>Departure Hub:</span>
                    <strong className="text-[#14213D]">{t.origin}</strong>
                  </div>
                  <div className="flex justify-between text-[#6B6F80]">
                    <span>Date:</span>
                    <strong className="text-[#14213D] font-mono">
                      {t.startDate} → {t.endDate}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#6B6F80]">
                    <span>Allocated Capital:</span>
                    <strong className="text-[#D4A24C] font-mono font-bold">
                      {formatCurrency(t.budget.maxBudget ?? t.budget.totalCap, currency)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#6B6F80]">
                    <span>Travel Style:</span>
                    <span className="capitalize font-semibold text-[#2A9D8F]">
                      {t.style}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[rgba(20,33,61,0.08)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTrip(t.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-px active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#FBF6EE] text-[#14213D] border border-[#D4A24C]/40 shadow-2xs font-bold'
                        : 'bg-[#14213D] hover:bg-[#1E2E52] text-white shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm text-[#D4A24C]">
                      {isActive ? 'check' : 'folder_open'}
                    </span>
                    <span>{isActive ? 'Currently Active' : 'Load Dossier'}</span>
                  </button>

                  {trips.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTripToDelete(t)}
                      title="Delete Journey"
                      className="p-2.5 rounded-xl text-[#D64545] hover:bg-rose-50 transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 bg-[#14213D]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-2xl border border-[rgba(20,33,61,0.12)] space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#D64545] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif-heading text-lg font-bold text-[#14213D]">
                Delete Saved Journey?
              </h3>
              <p className="text-xs text-[#6B6F80] leading-relaxed">
                Are you sure you want to remove <strong className="text-[#14213D]">"{tripToDelete.title}"</strong> ({tripToDelete.destination}) from your saved archives? This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] hover:bg-[#FBF6EE] text-xs font-semibold text-[#14213D] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#D64545] hover:bg-[#bf3939] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
