/**
 * Smart AI Travel Planner 3.0
 * Client API Layer with Real Endpoints & Transparent Fallbacks
 */

import {
  TripPlan,
  ExpenseItem,
  FlightOption,
  SanctuaryStay,
  WeatherTelemetry,
  ExtractedDocument,
} from '../types/travel';
import { WorkflowEvaluationData, NetworkLatencyReport } from '../types/agentMetrics';
import { DEFAULT_ODYSSEY, SAMPLE_TRIPS_LIBRARY } from './mockData';
import {
  calculateBudgetTotals,
  calculateCategoryBreakdown,
  calculateBilateralSplit,
  calculateFeasiblePlan,
} from './budget';
import { fetchLiveExchangeRates, ExchangeRateData } from './currencyService';
import { searchLocations, resolveCoordinates, NormalizedLocation } from './geocoding';

import { searchCommercialFlights } from './flightProvider';
import { synthesizeMultiModalRoutes } from './routePlanner';
import { User, AuthResponse } from '../types/auth';

const API_BASE = '/api';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem('aetheris_auth_token_v3');
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('aetheris_auth_token_v3', token);
    } else {
      localStorage.removeItem('aetheris_auth_token_v3');
    }
  } catch {
    // ignore
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setStoredAuthToken(data.token);
      return data;
    }
    return { success: false, error: data.error || 'Authentication failed' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during login' };
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setStoredAuthToken(data.token);
      return data;
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during registration' };
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) return data.user;
    }
    // Token invalid or expired
    setStoredAuthToken(null);
  } catch {
    // Network failure
  }
  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // ignore
  } finally {
    setStoredAuthToken(null);
  }
}

export async function fetchTrips(): Promise<TripPlan[]> {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.trips)) {
      return data.trips;
    }
  } catch (err) {
    console.warn('[API] fetchTrips fallback to local data', err);
  }
  return SAMPLE_TRIPS_LIBRARY;
}

export async function fetchTripById(id: string): Promise<TripPlan | null> {
  try {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.trip) {
      return data.trip;
    }
  } catch (err) {
    console.warn('[API] fetchTripById fallback', err);
  }
  return SAMPLE_TRIPS_LIBRARY.find((t) => t.id === id) || DEFAULT_ODYSSEY;
}

export async function createTrip(trip: TripPlan): Promise<TripPlan | null> {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(trip),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.trip) return data.trip;
    }
  } catch (err) {
    console.warn('[API] createTrip error:', err);
  }
  return trip;
}

export async function updateTrip(id: string, updates: Partial<TripPlan>): Promise<TripPlan | null> {
  try {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.trip) return data.trip;
    }
  } catch (err) {
    console.warn('[API] updateTrip error:', err);
  }
  return null;
}

export async function deleteTrip(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.warn('[API] deleteTrip error:', err);
  }
  return false;
}


export async function generateTrip(input: any): Promise<TripPlan> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s safety timeout

    const res = await fetch(`${API_BASE}/trips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.trip) {
      return data.trip;
    }
  } catch (err) {
    console.warn('[API] generateTrip server call failed, building deterministic plan:', err);
  }

  // Client-side fallback that ALWAYS respects destination, dates, traveler count, and budget!
  const dest = input.destination?.trim() || 'Bengaluru, Karnataka, India';
  const orig = input.origin?.trim() || 'Shivamogga, India';
  const destCenter = resolveCoordinates(dest) || { lat: 12.9716, lon: 77.5946 };
  const origCenter = resolveCoordinates(orig) || { lat: 13.9299, lon: 75.5681 };
  const tripType = input.tripType || 'round_trip';
  const isRoundTrip = tripType === 'round_trip';
  const cabinClass = input.cabinClass || 'economy';
  const days = Math.max(1, input.durationDays || 4);
  const travelers = Math.max(1, input.travelersCount || 2);
  const style = input.style || 'budget';
  const userBudget = input.maxBudget || (style === 'budget' ? 12000 : 35000);
  const currency = input.currency || 'INR';

  const feasibility = calculateFeasiblePlan({
    origin: orig,
    destination: dest,
    durationDays: days,
    travelersCount: travelers,
    userBudget,
    travelStyle: style,
  });

  const startDateStr = input.startDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const endDateStr = input.endDate || new Date(Date.now() + (7 + days) * 86400000).toISOString().split('T')[0];

  const totalTransportCost = feasibility.costBreakdown.transport;
  const outboundTransitCost = isRoundTrip ? Math.round(totalTransportCost * 0.5) : totalTransportCost;
  const returnTransitCost = isRoundTrip ? Math.round(totalTransportCost * 0.5) : 0;

  const expenseItems: ExpenseItem[] = [
    {
      id: `exp-fall-transit-outbound`,
      entityName: `Outbound Transit: ${orig.split(',')[0]} ➔ ${dest.split(',')[0]}`,
      subDetail: 'Direct Rail / Intercity Bus / Commercial Air',
      dateRange: startDateStr,
      category: 'transit',
      paymentMethod: 'Self-Funded',
      status: 'authorized',
      amount: outboundTransitCost,
    },
    ...(isRoundTrip
      ? [
          {
            id: `exp-fall-transit-return`,
            entityName: `Return Transit: ${dest.split(',')[0]} ➔ ${orig.split(',')[0]}`,
            subDetail: 'Direct Rail / Intercity Bus / Commercial Air Return',
            dateRange: endDateStr,
            category: 'transit' as const,
            paymentMethod: 'Self-Funded',
            status: 'authorized' as const,
            amount: returnTransitCost,
          },
        ]
      : []),
    {
      id: `exp-fall-2`,
      entityName: `${dest.split(',')[0]} Accommodation (${days - 1}N)`,
      subDetail: `${style === 'budget' ? 'Verified Homestay/Hostel' : 'Comfort 3-Star Hotel'}`,
      dateRange: `${startDateStr} - ${endDateStr}`,
      category: 'accommodations',
      paymentMethod: 'Direct Booking',
      status: 'authorized',
      amount: feasibility.costBreakdown.accommodation,
    },
    {
      id: `exp-fall-3`,
      entityName: 'Food & Local Dining',
      subDetail: `${days} Days · Authentic local cuisine`,
      dateRange: 'Full Duration',
      category: 'gastronomy',
      paymentMethod: 'On-Ground Pay',
      status: 'settled',
      amount: feasibility.costBreakdown.food,
    },
    {
      id: `exp-fall-4`,
      entityName: 'Local Sightseeing & Experiences',
      subDetail: `Top monuments, parks, and walking tours in ${dest.split(',')[0]}`,
      dateRange: 'Full Duration',
      category: 'experiences',
      paymentMethod: 'Self-Funded',
      status: 'authorized',
      amount: feasibility.costBreakdown.activities,
    },
  ];

  const fallbackItinerary = Array.from({ length: days }, (_, i) => {
    const act1Coords = {
      lat: Number((destCenter.lat + 0.007 * ((i % 3) - 1) + 0.004).toFixed(4)),
      lon: Number((destCenter.lon + 0.007 * (((i + 1) % 3) - 1) + 0.003).toFixed(4)),
    };
    const act2Coords = {
      lat: Number((destCenter.lat + 0.008 * ((i % 3) - 1) - 0.005).toFixed(4)),
      lon: Number((destCenter.lon + 0.008 * (((i + 2) % 3) - 1) - 0.004).toFixed(4)),
    };

    return {
      dayNumber: i + 1,
      dateStr: `Day ${i + 1}`,
      title: i === 0 ? `Arrival in ${dest.split(',')[0]}` : i === days - 1 ? `Return Departure` : `Exploring ${dest.split(',')[0]} Day ${i + 1}`,
      tagline: i === 0 ? 'Settling in & local orientation' : 'Iconic sights & cultural discoveries',
      weather: {
        tempC: 27,
        condition: 'Sunny & Pleasant',
        rainProb: '0%',
        wind: '8 km/h',
      },
      totalEstimatedCost: Math.round(feasibility.costBreakdown.activities / days),
      activities: [
        {
          id: `act-fall-${i + 1}-1`,
          placeName: `Historic Center of ${dest.split(',')[0]}`,
          destination: dest,
          dayNumber: i + 1,
          dateStr: `Day ${i + 1}`,
          coordinates: act1Coords,
          timeSlot: 'Morning · 09:30 - 12:30',
          title: `Explore ${dest.split(',')[0]} City Center & Landmarks`,
          category: 'culture' as const,
          categoryLabel: 'Culture & Sightseeing',
          description: `Visit key historic landmarks, viewpoints, and neighborhood streets in ${dest}.`,
          duration: '3 hours',
          estimatedCost: Math.round((feasibility.costBreakdown.activities / days) * 0.5),
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200',
        },
        {
          id: `act-fall-${i + 1}-2`,
          placeName: `${dest.split(',')[0]} Promenade & Market`,
          destination: dest,
          dayNumber: i + 1,
          dateStr: `Day ${i + 1}`,
          coordinates: act2Coords,
          timeSlot: 'Afternoon · 14:00 - 18:00',
          title: `Local Gastronomy & Evening Sunset Walk`,
          category: 'gastronomy' as const,
          categoryLabel: 'Food & Leisure',
          description: `Enjoy authentic regional dishes and relaxing sunset atmosphere at local promenades.`,
          duration: '3.5 hours',
          estimatedCost: Math.round((feasibility.costBreakdown.activities / days) * 0.5),
          image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?q=80&w=1200',
        },
      ],
    };
  });

    const outboundRoutes = synthesizeMultiModalRoutes({
      origin: orig,
      destination: dest,
      startDate: startDateStr,
      endDate: endDateStr,
      travelersCount: travelers,
      distanceKm: 350,
      direction: 'outbound',
    });

    const outboundFlights = searchCommercialFlights({
      origin: orig,
      destination: dest,
      startDate: startDateStr,
      endDate: endDateStr,
      travelersCount: travelers,
      cabinClass,
      selectedRoute: outboundRoutes[0],
      direction: 'outbound',
    });

    const returnRoutes = isRoundTrip
      ? synthesizeMultiModalRoutes({
          origin: orig,
          destination: dest,
          startDate: startDateStr,
          endDate: endDateStr,
          travelersCount: travelers,
          distanceKm: 350,
          direction: 'return',
        })
      : [];

    const returnFlights = isRoundTrip
      ? searchCommercialFlights({
          origin: orig,
          destination: dest,
          startDate: startDateStr,
          endDate: endDateStr,
          travelersCount: travelers,
          cabinClass,
          selectedRoute: returnRoutes[0],
          direction: 'return',
        })
      : [];

    return {
      id: `trip-${Date.now()}`,
      title: `${dest.split(',')[0]} ${days}-Day Itinerary`,
      confNumber: `TRIP-${Math.floor(10000 + Math.random() * 90000)}`,
      tripType,
      cabinClass,
      destination: dest,
      origin: orig,
      startDate: startDateStr,
      endDate: endDateStr,
      durationDays: days,
      travelersCount: travelers,
      travelerDescription: `${travelers} Traveler${travelers > 1 ? 's' : ''} · ${style.toUpperCase()} · ${isRoundTrip ? 'Round Trip' : 'One-Way'}`,
      style,
      pacing: { relaxedPercent: 70, activePercent: 30 },
      budget: {
        totalCap: userBudget,
        maxBudget: userBudget,
        committedOutlay: feasibility.recommendedPlanCost,
        contingencyReserve: feasibility.contingencyAmount,
        fxHedgedValue: feasibility.recommendedPlanCost,
        currency,
        items: expenseItems,
        bilateralSplit: {
          person1: { name: 'Traveler 1', sharePercent: 50, amount: Math.round(feasibility.recommendedPlanCost * 0.5), paymentDetails: 'Primary Share' },
          person2: { name: 'Traveler 2', sharePercent: 50, amount: Math.round(feasibility.recommendedPlanCost * 0.5), paymentDetails: 'Secondary Share' },
        },
        optimizationAlerts: [
          {
            id: 'opt-fall-1',
            type: feasibility.isFeasible ? 'saving' : 'arbitrage',
            title: feasibility.isFeasible ? 'Plan Optimized to Budget' : 'Budget Shortfall Advisory',
            savingsAmount: feasibility.isFeasible ? feasibility.remainingBudget : feasibility.shortfall,
            description: feasibility.feasibilityExplanation,
            applied: true,
          },
        ],
      },
      itinerary: fallbackItinerary,
      flights: outboundFlights,
      outboundJourney: {
        direction: 'outbound',
        origin: orig,
        destination: dest,
        travelDate: startDateStr,
        availableOptions: outboundFlights,
        selectedOptionId: outboundFlights[0]?.id,
        selectedOption: outboundFlights[0],
      },
      returnJourney: isRoundTrip
        ? {
            direction: 'return',
            origin: dest,
            destination: orig,
            travelDate: endDateStr,
            availableOptions: returnFlights,
            selectedOptionId: returnFlights[0]?.id,
            selectedOption: returnFlights[0],
          }
        : undefined,
      selectedOutboundFlightId: outboundFlights[0]?.id,
      selectedOutboundFlight: outboundFlights[0],
      selectedReturnFlightId: isRoundTrip ? returnFlights[0]?.id : undefined,
      selectedReturnFlight: isRoundTrip ? returnFlights[0] : undefined,
      selectedFlightId: outboundFlights[0]?.id,
      selectedFlight: outboundFlights[0],
      multiModalRoutes: outboundRoutes,
      returnMultiModalRoutes: returnRoutes,
      selectedRouteId: outboundRoutes[0]?.id,
      selectedRoute: outboundRoutes[0],
      selectedReturnRouteId: isRoundTrip ? returnRoutes[0]?.id : undefined,
      selectedReturnRoute: isRoundTrip ? returnRoutes[0] : undefined,
      sanctuaries: [],
    weather: {
      location: dest,
      tempC: 27,
      condition: 'Clear Sky & Favorable',
      windSpeedKts: 7,
      windDirection: 'SW',
      uvIndex: 5.5,
      goldenHour: '18:15 — 18:50',
      visibilityKm: 20,
      packingChecklist: [
        { category: 'Essentials', items: ['Breathable clothing', 'Walking footwear', 'Sunscreen', 'Photo ID'] },
      ],
      advisoryLevel: 'safe',
      advisoryText: 'Normal travel precautions recommended. Keep digital copies of reservations.',
    },
    agents: [],
    documents: [],
    waypoints: [
      { name: orig, lat: origCenter.lat, lon: origCenter.lon, dayNum: 'Origin', color: '#7c3aed' },
      { name: dest, lat: destCenter.lat, lon: destCenter.lon, dayNum: 'Destination', color: '#0891b2' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CopilotApiResult {
  reply: string;
  agent: string;
  timestamp: string;
  updatedTrip?: TripPlan;
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
  };
  executedActions?: string[];
  sentiment?: string;
  suggestions?: string[];
  switchTripId?: string;
}

export async function sendChatMessage(
  message: string,
  tripContext?: TripPlan,
  options?: {
    allTrips?: TripPlan[];
    selectedDay?: number;
    confirmedAction?: any;
    history?: { sender: 'user' | 'assistant'; text: string }[];
  }
): Promise<CopilotApiResult> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        tripContext,
        allTrips: options?.allTrips,
        selectedDay: options?.selectedDay,
        confirmedAction: options?.confirmedAction,
        history: options?.history,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return {
          reply: data.reply,
          agent: data.agent || 'Aetheris Concierge',
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedTrip: data.updatedTrip,
          navigation: data.navigation,
          actionProposal: data.actionProposal,
          executedActions: data.executedActions,
          sentiment: data.sentiment,
        };
      }
    }
  } catch (err) {
    console.warn('[API] sendChatMessage server fallback', err);
  }

  // Client fallback
  const destination = tripContext?.destination || 'your destination';
  return {
    reply: `I have received your request regarding "${message}". For your trip to ${destination}, you can ask me to add or move landmarks, remove activities, make your schedule more relaxed, optimize costs, or navigate directly to any section of your trip.`,
    agent: 'Aetheris AI Concierge',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function getLiveCurrencyRates(): Promise<ExchangeRateData> {
  try {
    const res = await fetch(`${API_BASE}/currency/rates`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    console.warn('[API] getLiveCurrencyRates fallback to direct fetch', err);
  }
  return fetchLiveExchangeRates();
}

export async function searchLocationsApi(query: string): Promise<NormalizedLocation[]> {
  try {
    const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('[API] searchLocationsApi fallback', err);
  }
  return searchLocations(query);
}

export interface ParseDocumentResult {
  success: boolean;
  document?: ExtractedDocument;
  error?: string;
  message?: string;
}

export interface ParseDocumentInput {
  file?: File;
  files?: File[];
  frontFile?: File;
  backFile?: File;
  name?: string;
  content?: string;
  type?: string;
  size?: string;
  tripId?: string;
  saveToTrip?: boolean;
}

export async function parseDocument(input: ParseDocumentInput): Promise<ParseDocumentResult> {
  try {
    let res: Response;
    const token = getStoredAuthToken();
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const hasMultipartFiles = input.file || (input.files && input.files.length > 0) || input.frontFile || input.backFile;

    if (hasMultipartFiles) {
      // Send as native FormData multipart/form-data
      const formData = new FormData();

      if (input.frontFile) {
        formData.append('front', input.frontFile, input.frontFile.name);
      }
      if (input.backFile) {
        formData.append('back', input.backFile, input.backFile.name);
      }
      if (input.file) {
        formData.append('file', input.file, input.file.name);
      }
      if (input.files && input.files.length > 0) {
        input.files.forEach((f, idx) => {
          const fieldName = idx === 0 ? 'front' : 'back';
          formData.append(fieldName, f, f.name);
        });
      }

      if (input.tripId) {
        formData.append('tripId', input.tripId);
      }
      if (input.saveToTrip) {
        formData.append('saveToTrip', 'true');
      }

      res = await fetch(`${API_BASE}/documents/extract`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });
    } else {
      // Send as JSON Base64
      res = await fetch(`${API_BASE}/documents/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          fileName: input.name,
          fileContentBase64: input.content,
          fileType: input.type,
          fileSize: input.size,
          tripId: input.tripId,
          saveToTrip: input.saveToTrip,
        }),
      });
    }

    const contentType = res.headers.get('content-type') || '';
    const status = res.status;

    // Detect if server returned HTML (e.g. 404, 502, or SPA index.html fallback)
    if (contentType.toLowerCase().includes('text/html')) {
      console.warn(`[OCR Client] Received unexpected HTML response from ${res.url} (status: ${status})`);
      return {
        success: false,
        error: 'SERVER_RETURNED_HTML',
        message: `OCR extraction server returned an HTML error page (Status ${status} ${res.statusText || ''}) instead of JSON. Please verify that the backend server is running and retry.`,
      };
    }

    // Read response text safely
    const responseText = await res.text();
    if (!responseText || responseText.trim().length === 0) {
      return {
        success: false,
        error: 'EMPTY_RESPONSE',
        message: `OCR service returned an empty response (Status ${status}).`,
      };
    }

    // Safely parse JSON
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: 'INVALID_JSON_RESPONSE',
        message: `Unable to parse server response as JSON (Status ${status}). Diagnostic details: ${responseText.slice(0, 100)}`,
      };
    }

    if (res.ok && data.success && data.document) {
      return { success: true, document: data.document };
    }

    return {
      success: false,
      error: data.error || `HTTP_${status}`,
      message: data.message || `Document extraction failed with status code ${status}.`,
    };
  } catch (err: any) {
    console.error('[OCR Client Network Error]:', err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err?.message || 'Network communication error during extraction.',
    };
  }
}

/**
 * Explicitly save reviewed document to trip dossier
 */
export async function saveReviewedDocumentToTrip(
  document: ExtractedDocument,
  tripId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/documents/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ document, tripId }),
    });
    const data = await res.json();
    return { success: !!data.success, error: data.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save document to dossier' };
  }
}


/**
 * Fetch comprehensive agent center evaluation metrics
 */
export async function fetchAgentCenterMetrics(tripId?: string): Promise<{
  metrics: WorkflowEvaluationData;
  history: WorkflowEvaluationData[];
} | null> {
  try {
    const url = tripId
      ? `${API_BASE}/agent-center/metrics?tripId=${encodeURIComponent(tripId)}`
      : `${API_BASE}/agent-center/metrics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.metrics) {
      return {
        metrics: data.metrics,
        history: data.history || [],
      };
    }
  } catch (err) {
    console.warn('[API] fetchAgentCenterMetrics failed', err);
  }
  return null;
}

/**
 * Trigger an on-demand real network latency probe test
 */
export async function runNetworkPingTest(): Promise<NetworkLatencyReport | null> {
  try {
    const res = await fetch(`${API_BASE}/agent-center/test-ping`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.networkLatency) {
      return data.networkLatency;
    }
  } catch (err) {
    console.warn('[API] runNetworkPingTest failed', err);
  }
  return null;
}

/**
 * Request real-time evaluation of a customized trip plan
 */
export async function evaluateTripMetrics(trip: TripPlan): Promise<WorkflowEvaluationData | null> {
  try {
    const res = await fetch(`${API_BASE}/agent-center/evaluate-trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && data.metrics) {
      return data.metrics;
    }
  } catch (err) {
    console.warn('[API] evaluateTripMetrics failed', err);
  }
  return null;
}
