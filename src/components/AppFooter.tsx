/**
 * Smart AI Travel Planner 3.0
 * In-App Application Footer (Non-Home Pages)
 *
 * Golden Hour Luxury Theme:
 * - Background: --ink (#14213D)
 * - Muted descriptive text
 * - Gold hover links (#D4A24C)
 * - Active trip synchronization indicator
 */

import React from 'react';
import { ActivePage } from './Navigation';
import { TripPlan } from '../types/travel';

interface AppFooterProps {
  onNavigate: (page: ActivePage) => void;
  activeTrip: TripPlan;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, activeTrip }) => {
  return (
    <footer className="w-full bg-[#14213D] text-[#8E95A5] border-t border-[rgba(255,255,255,0.08)] py-10 px-4 sm:px-6 lg:px-8 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-[rgba(255,255,255,0.08)]">
        {/* Brand & Active Trip Summary */}
        <div className="space-y-2 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4A24C] to-[#E76F51] flex items-center justify-center text-white shadow-xs">
              <span className="font-serif-heading font-bold text-sm">Æ</span>
            </div>
            <div>
              <span className="font-serif-heading text-sm font-bold tracking-wider text-white uppercase">
                AETHERIS
              </span>
              <span className="text-[10px] text-[#D4A24C] font-semibold tracking-widest uppercase ml-2">
                Golden Hour OS
              </span>
            </div>
          </div>
          <p className="text-xs text-[#8E95A5] leading-relaxed">
            Autonomous multi-agent journey synthesis with deterministic budgeting, real-time photo verification, and intelligent copilot orchestration.
          </p>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[11px] text-[#D4A24C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F] animate-pulse" />
            <span>Active Journey: <strong className="text-white font-medium">{activeTrip.destination}</strong> ({activeTrip.durationDays} Days)</span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
              Odyssey Core
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Overview Deck
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('itinerary')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Chronological Route
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Trip Planner Wizard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('saved')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Saved Journeys
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
              Mobility & Stay
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('flights')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Flights & Transit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('hotels')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Sanctuary Stays
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('budget')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Capital & Split
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('weather')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Weather & Safety
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A24C] block">
              Intelligence
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  AI Travel Copilot
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('documents')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Documents & OCR
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('agents')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Multi-Agent Benchmarks
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="hover:text-[#D4A24C] transition-colors cursor-pointer text-left"
                >
                  Explore Showcase
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6B6F80]">
        <div>
          © {new Date().getFullYear()} Aetheris Travel Intelligence. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-1.5 text-[#2A9D8F]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F]" />
            <span>Autonomous Engine 3.0 Active</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="hover:text-[#D4A24C] transition-colors cursor-pointer"
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="hover:text-[#D4A24C] transition-colors cursor-pointer"
          >
            Home Showcase
          </button>
        </div>
      </div>
    </footer>
  );
};
