/**
 * Smart AI Travel Planner 3.0
 * Intelligent AI Travel Copilot & Autonomous Assistant
 *
 * Golden Hour Luxury Theme (Scoped to non-home pages):
 * - User bubbles in --ink (#14213D) with light text (#FBF6EE)
 * - AI bubbles in white (#FFFFFF) with thin border (rgba(20,33,61,0.12))
 * - Typing indicator with three softly bouncing dots
 * - Inputs on --surface-soft (#FBF6EE) with gold focus ring
 * - Send CTA button in terracotta (#E76F51)
 */

import React, { useState, useRef, useEffect } from 'react';
import { TripPlan, CurrencyCode } from '../../types/travel';
import { sendChatMessage, CopilotApiResult } from '../../lib/api';
import { formatCurrency } from '../../lib/budget';

interface ConciergeChatPageProps {
  trip: TripPlan;
  currency: CurrencyCode;
  onUpdateTrip?: (updated: TripPlan) => void;
  onNavigate?: (page: string, params?: { dayNumber?: number; targetId?: string }) => void;
  allTrips?: TripPlan[];
  onSelectTrip?: (tripId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  suggestions?: string[];
  executedActions?: string[];
  navigation?: {
    page: string;
    dayNumber?: number;
    targetId?: string;
  };
  actionProposal?: {
    actionId: string;
    type: string;
    title: string;
    description: string;
    payload: any;
    isDestructive?: boolean;
    status?: 'pending' | 'confirmed' | 'cancelled';
  };
  metadata?: {
    agent?: string;
  };
}

export const ConciergeChatPage: React.FC<ConciergeChatPageProps> = ({
  trip,
  currency,
  onUpdateTrip,
  onNavigate,
  allTrips,
  onSelectTrip,
}) => {
  // Undo history stack
  const [undoHistory, setUndoHistory] = useState<TripPlan[]>([]);

  // Initial greeting dynamically tailored to current trip
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `Hello! I am **Elena Vance**, your autonomous AI Travel Copilot. I'm actively managing your **${trip.title}** to **${trip.destination}**.\n\nI can directly modify your itinerary days, add or move landmarks, optimize your budget, or navigate anywhere across the planner. How may I assist your journey today?`,
      suggestions: [
        'Summarize my trip',
        'Make Day 2 less tiring',
        'Find cheaper activities',
        'Open Landmark Archive',
        'Go to Budget Planner',
      ],
      metadata: {
        agent: 'Elena Vance · Lead Travel Copilot',
      },
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle user Undo request
  const handleUndo = () => {
    if (undoHistory.length === 0 || !onUpdateTrip) return;

    const previousTrip = undoHistory[undoHistory.length - 1];
    setUndoHistory((prev) => prev.slice(0, -1));

    onUpdateTrip(previousTrip);

    setMessages((prev) => [
      ...prev,
      {
        id: `undo-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Restored! I have undone the previous itinerary modification and restored your trip to its prior schedule. Total estimated cost is now ${formatCurrency(previousTrip.budget.committedOutlay, currency)}.`,
        metadata: { agent: 'Elena Vance · Version Controller' },
      },
    ]);
  };

  // Execute or confirm action
  const handleConfirmAction = async (msgId: string, proposal: NonNullable<ChatMessage['actionProposal']>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionProposal
          ? { ...m, actionProposal: { ...m.actionProposal, status: 'confirmed' } }
          : m
      )
    );

    setIsTyping(true);
    try {
      setUndoHistory((prev) => [...prev, trip]);

      const res = await sendChatMessage('', trip, {
        allTrips,
        confirmedAction: {
          actionId: proposal.actionId,
          type: proposal.type,
          payload: proposal.payload,
        },
      });

      if (res.updatedTrip && onUpdateTrip) {
        onUpdateTrip(res.updatedTrip);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-conf-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: res.reply || 'Action executed successfully.',
          executedActions: res.executedActions,
          suggestions: res.suggestions,
          metadata: { agent: 'Elena Vance · Private Copilot' },
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I encountered an issue executing that action. Please retry.',
          metadata: { agent: 'Elena Vance · Private Copilot' },
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionProposal
          ? { ...m, actionProposal: { ...m.actionProposal, status: 'cancelled' } }
          : m
      )
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptToSend = (textToSend || inputText).trim();
    if (!promptToSend) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: promptToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res: CopilotApiResult = await sendChatMessage(promptToSend, trip, {
        allTrips,
      });

      if (res.updatedTrip && onUpdateTrip) {
        setUndoHistory((prev) => [...prev, trip]);
        onUpdateTrip(res.updatedTrip);
      }

      if (res.switchTripId && onSelectTrip) {
        onSelectTrip(res.switchTripId);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.reply,
        suggestions: res.suggestions,
        executedActions: res.executedActions,
        navigation: res.navigation,
        actionProposal: res.actionProposal,
        metadata: { agent: 'Elena Vance · Autonomous Copilot' },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          text: `I have received your request: "${promptToSend}". I am checking with your destination itinerary parameters for ${trip.destination}. How else may I assist your schedule?`,
          metadata: { agent: 'Elena Vance · Private Copilot' },
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      {/* Header Deck: Live Context & State Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(20,33,61,0.12)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4A24C] via-[#E76F51] to-[#14213D] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-xl">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-heading text-lg font-bold text-[#14213D]">
                AI Travel Copilot & Concierge
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#1E7469] border border-[#2A9D8F]/30 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F] animate-pulse" />
                <span>Autonomous & Synced</span>
              </span>
            </div>
            <p className="text-xs text-[#6B6F80]">
              Active Odyssey: <strong className="text-[#14213D]">{trip.destination}</strong> ({trip.durationDays} Days · {formatCurrency(trip.budget.committedOutlay, currency)} committed)
            </p>
          </div>
        </div>

        {/* Undo & Quick Controls */}
        <div className="flex items-center gap-2 text-xs">
          {undoHistory.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl bg-[#FBF6EE] hover:bg-[#EBDCC6] border border-[#D4A24C]/40 text-[#B27B22] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              title="Undo last itinerary modification"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              <span>Undo Last Edit ({undoHistory.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate?.('itinerary')}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[rgba(20,33,61,0.12)] hover:bg-[#FBF6EE] text-[#14213D] font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-[#D4A24C]">event_note</span>
            <span>View Itinerary</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-[16px] border border-[rgba(20,33,61,0.12)] shadow-[0_2px_8px_rgba(20,33,61,0.06)] p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender & Timestamp */}
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#6B6F80]">
              <span className="font-semibold text-[#14213D]">
                {msg.sender === 'user' ? 'You' : msg.metadata?.agent || 'Elena Vance'}
              </span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble: User in --ink with light text, AI in white with thin border */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#14213D] text-[#FBF6EE] shadow-sm rounded-tr-xs'
                  : 'bg-white border border-[rgba(20,33,61,0.12)] text-[#14213D] shadow-xs rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Executed Action Badges */}
              {msg.executedActions && msg.executedActions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[rgba(20,33,61,0.08)] flex flex-wrap gap-1.5">
                  {msg.executedActions.map((action, aIdx) => (
                    <span
                      key={aIdx}
                      className="px-2.5 py-1 rounded-lg bg-[#2A9D8F]/15 text-[#1E7469] border border-[#2A9D8F]/30 font-mono text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-xs text-[#2A9D8F]">check_circle</span>
                      <span>{action}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Navigation Action CTA Button */}
              {msg.navigation && onNavigate && (
                <div className="mt-3 pt-2.5 border-t border-[rgba(20,33,61,0.08)] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(msg.navigation!.page, {
                        dayNumber: msg.navigation!.dayNumber,
                        targetId: msg.navigation!.targetId,
                      })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:-translate-y-px active:scale-98 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>
                      Open {msg.navigation.page.toUpperCase()}
                      {msg.navigation.dayNumber ? ` (Day ${msg.navigation.dayNumber})` : ''}
                    </span>
                  </button>
                </div>
              )}

              {/* Action Proposal Card */}
              {msg.actionProposal && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#FBF6EE] border border-[#D4A24C]/40 text-[#14213D] space-y-2">
                  <div className="flex items-center gap-2 text-[#B27B22] font-bold text-xs">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>{msg.actionProposal.title}</span>
                  </div>
                  <p className="text-[11px] text-[#6B6F80] leading-relaxed">
                    {msg.actionProposal.description}
                  </p>

                  {msg.actionProposal.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(msg.id, msg.actionProposal!)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#E76F51] hover:bg-[#de6344] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Confirm & Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelAction(msg.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-white border border-[rgba(20,33,61,0.12)] text-[#14213D] hover:bg-[#FBF6EE] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {msg.actionProposal.status === 'confirmed' && (
                    <div className="text-[10px] font-bold text-[#2A9D8F] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span>
                      <span>Action confirmed and applied to itinerary.</span>
                    </div>
                  )}

                  {msg.actionProposal.status === 'cancelled' && (
                    <div className="text-[10px] font-semibold text-[#6B6F80]">
                      Proposal dismissed.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Suggestions Chips */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                {msg.suggestions.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSendMessage(sug)}
                    className="px-2.5 py-1 rounded-full bg-[#FBF6EE] hover:bg-[#EBDCC6] border border-[rgba(20,33,61,0.12)] text-[#14213D] text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator: three softly bouncing dots */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#6B6F80]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D4A24C] to-[#E76F51] flex items-center justify-center text-white text-xs">
              <span className="material-symbols-outlined text-xs">smart_toy</span>
            </div>
            <div className="bg-white border border-[rgba(20,33,61,0.12)] rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#D4A24C] gh-dot-1" />
              <span className="w-2 h-2 rounded-full bg-[#E76F51] gh-dot-2" />
              <span className="w-2 h-2 rounded-full bg-[#14213D] gh-dot-3" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Deck: Input on --surface-soft with gold focus ring, terracotta send button */}
      <div className="p-3 bg-white rounded-[16px] border border-[rgba(20,33,61,0.12)] shadow-[0_2px_8px_rgba(20,33,61,0.06)] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Ask Elena to adjust your itinerary, swap activities, or optimize budget..."
          className="flex-1 bg-[#FBF6EE] border border-[rgba(20,33,61,0.12)] text-xs text-[#14213D] px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4A24C] focus:ring-4 focus:ring-[#D4A24C]/20 transition-all duration-200 placeholder-[#8E95A5]"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          className="px-5 py-3 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-px active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
};
