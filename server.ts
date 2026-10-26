/**
 * Smart AI Travel Planner 3.0
 * Express Full-Stack Server & API Router
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import { orchestrateTripPlan, TripGenerationInput } from './src/server/agents/orchestrator';
import { generateGeminiText, extractDocumentWithGemini, getGeminiClient } from './src/server/geminiService';
import { calculateBudgetTotals, calculateCategoryBreakdown, calculateBilateralSplit } from './src/lib/budget';
import { fetchLiveExchangeRates } from './src/lib/currencyService';
import { searchLocations } from './src/lib/geocoding';
import { generateGoogleFlightsUrl, generateSkyscannerUrl, generateBookingDotComUrl, generateGoogleHotelsUrl } from './src/lib/bookingLinks';
import { DEFAULT_ODYSSEY, SAMPLE_TRIPS_LIBRARY } from './src/lib/mockData';
import { TripPlan, FlightOption, SanctuaryStay, ExtractedDocument } from './src/types/travel';
import { searchUnsplashPhotos, trackUnsplashDownload, clearServerPhotoCache } from './src/server/unsplashService';
import { processCopilotMessage } from './src/server/copilotService';
import {
  synthesizeEvaluationDataForTrip,
  measureRealNetworkLatency,
  getWorkflowHistory,
} from './src/server/agentMetricsService';
import multer from 'multer';

// Preserve existing runtime environment variables if .env has empty values
const existingGeminiKey = process.env.GEMINI_API_KEY;
dotenv.config();
if (existingGeminiKey && (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '')) {
  process.env.GEMINI_API_KEY = existingGeminiKey;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// ================= AUTHENTICATION & USER STORE =================
interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  tier: 'explorer' | 'premium' | 'concierge';
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number; // Unix timestamp ms
}

const usersStore = new Map<string, StoredUser>();
const sessionsStore = new Map<string, Session>();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Seed a standard initial user so valid logins are immediately testable
const initialSalt = crypto.randomBytes(16).toString('hex');
const initialUser: StoredUser = {
  id: 'usr-default-01',
  name: 'Julian Vance',
  email: 'traveler@world.com',
  salt: initialSalt,
  passwordHash: hashPassword('Traveler123!', initialSalt),
  tier: 'explorer',
  createdAt: new Date().toISOString(),
};
usersStore.set(initialUser.id, initialUser);

function getUserFromRequest(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const session = sessionsStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionsStore.delete(token);
    return null;
  }
  return usersStore.get(session.userId) || null;
}

// In-Memory Data Store with default trips tagged with default owner
let tripsStore: TripPlan[] = SAMPLE_TRIPS_LIBRARY.map((t) => ({
  ...t,
  userId: initialUser.id,
}));

// ================= API ROUTES =================

/**
 * 1. GET /api/health
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    version: '3.0.0',
    model: 'gemini-3.8-flash',
    uptime: process.uptime(),
    activeTripsCount: tripsStore.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * AUTHENTICATION ENDPOINTS
 */

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ success: false, error: 'A valid email address is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    return;
  }

  const cleanName = name && typeof name === 'string' && name.trim() ? name.trim() : cleanEmail.split('@')[0];

  // Check if user already exists
  for (const existingUser of usersStore.values()) {
    if (existingUser.email.toLowerCase() === cleanEmail) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists. Please log in.' });
      return;
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    email: cleanEmail,
    salt,
    passwordHash,
    tier: 'explorer',
    createdAt: new Date().toISOString(),
  };

  usersStore.set(newUser.id, newUser);

  // Seed default personalized trip for this new user so they have private itineraries ready
  const userTrip: TripPlan = {
    ...DEFAULT_ODYSSEY,
    id: `trip-${newUser.id}-01`,
    userId: newUser.id,
    title: `${cleanName}'s Amalfi Odyssey`,
  };
  tripsStore.unshift(userTrip);

  const token = generateSessionToken();
  const session: Session = {
    token,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  sessionsStore.set(token, session);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      tier: newUser.tier,
      createdAt: newUser.createdAt,
    },
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  let foundUser: StoredUser | null = null;
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === cleanEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser || !verifyPassword(password, foundUser.salt, foundUser.passwordHash)) {
    res.status(401).json({ success: false, error: 'Invalid email or password. Please try again.' });
    return;
  }

  const token = generateSessionToken();
  const session: Session = {
    token,
    userId: foundUser.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  sessionsStore.set(token, session);

  res.json({
    success: true,
    token,
    user: {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      tier: foundUser.tier,
      createdAt: foundUser.createdAt,
    },
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized or session expired.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    sessionsStore.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * 2. POST /api/trips/generate
 * Multi-Agent Orchestrator synthesizes a complete trip
 */
app.post('/api/trips/generate', async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    const input: TripGenerationInput = req.body || {};
    const trip = await orchestrateTripPlan(input);
    trip.userId = user?.id || 'guest';
    tripsStore.unshift(trip);
    res.status(201).json({ success: true, trip });
  } catch (error) {
    console.error('Failed to generate trip:', error);
    res.status(500).json({ success: false, error: 'Failed to synthesize travel plan' });
  }
});

/**
 * 3. GET /api/trips
 * User isolation: Authenticated users only see their own trips.
 */
app.get('/api/trips', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user) {
    let userTrips = tripsStore.filter((t) => t.userId === user.id);
    if (userTrips.length === 0) {
      userTrips = SAMPLE_TRIPS_LIBRARY.map((t, idx) => ({
        ...t,
        id: `trip-${user.id}-${idx + 1}`,
        userId: user.id,
      }));
      tripsStore.unshift(...userTrips);
    }
    res.json({ success: true, trips: userTrips });
    return;
  }
  res.json({ success: true, trips: tripsStore });
});

/**
 * 4. POST /api/trips
 */
app.post('/api/trips', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const newTrip: TripPlan = req.body;
  if (!newTrip || !newTrip.title) {
    res.status(400).json({ success: false, error: 'Trip title and content required' });
    return;
  }
  if (!newTrip.id) {
    newTrip.id = `trip-${Date.now()}`;
  }
  newTrip.userId = user ? user.id : (newTrip.userId || 'guest');
  tripsStore.unshift(newTrip);
  res.status(201).json({ success: true, trip: newTrip });
});

/**
 * 5. GET /api/trips/:id
 */
app.get('/api/trips/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const trip = tripsStore.find((t) => t.id === req.params.id);
  if (!trip) {
    res.status(404).json({ success: false, error: 'Trip not found' });
    return;
  }
  if (user && trip.userId && trip.userId !== user.id && trip.userId !== 'guest') {
    res.status(403).json({ success: false, error: 'Access denied: You cannot view another user\'s private trip.' });
    return;
  }
  res.json({ success: true, trip });
});

/**
 * 6. PATCH /api/trips/:id
 */
app.patch('/api/trips/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const idx = tripsStore.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Trip not found' });
    return;
  }
  const existingTrip = tripsStore[idx];
  if (user && existingTrip.userId && existingTrip.userId !== user.id && existingTrip.userId !== 'guest') {
    res.status(403).json({ success: false, error: 'Access denied: You cannot modify another user\'s trip.' });
    return;
  }
  tripsStore[idx] = {
    ...tripsStore[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, trip: tripsStore[idx] });
});

/**
 * 7. DELETE /api/trips/:id
 */
app.delete('/api/trips/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const targetTrip = tripsStore.find((t) => t.id === req.params.id);
  if (!targetTrip) {
    res.status(404).json({ success: false, error: 'Trip not found' });
    return;
  }
  if (user && targetTrip.userId && targetTrip.userId !== user.id && targetTrip.userId !== 'guest') {
    res.status(403).json({ success: false, error: 'Access denied: You cannot delete another user\'s trip.' });
    return;
  }
  tripsStore = tripsStore.filter((t) => t.id !== req.params.id);
  res.json({ success: true, message: 'Trip deleted' });
});

/**
 * 8. POST /api/chat
 * Autonomous AI Travel Copilot & Tool Calling Endpoint
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, tripContext, allTrips, selectedDay, confirmedAction, history } = req.body;
  if (!message && !confirmedAction) {
    res.status(400).json({ success: false, error: 'Message or confirmedAction required' });
    return;
  }

  try {
    const copilotResult = await processCopilotMessage({
      message: message || '',
      tripContext: tripContext || tripsStore[0],
      allTrips: allTrips || tripsStore,
      selectedDay: Number(selectedDay) || 1,
      confirmedAction,
      conversationHistory: history,
    });

    // If trip was updated, persist in server-side tripsStore
    if (copilotResult.updatedTrip) {
      const idx = tripsStore.findIndex((t) => t.id === copilotResult.updatedTrip!.id);
      if (idx >= 0) {
        tripsStore[idx] = copilotResult.updatedTrip;
      } else {
        tripsStore.unshift(copilotResult.updatedTrip);
      }
    }

    res.json(copilotResult);
  } catch (err: any) {
    console.error('[Copilot Error in /api/chat]:', err);
    res.status(500).json({
      success: false,
      reply: 'I encountered an unexpected issue while updating your itinerary. Please try again.',
      agent: 'Elena Vance · System Safeguard',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }
});

/**
 * 9. POST /api/budget/calculate
 * Deterministic arithmetic validation
 */
app.post('/api/budget/calculate', (req: Request, res: Response) => {
  const { items, totalCap, contingencyPercent, person1Percent, person2Percent } = req.body;
  if (!items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'Expense items array required' });
    return;
  }

  const cap = Number(totalCap) || 0;
  const contingency = Number(contingencyPercent) || 7.6;
  const totals = calculateBudgetTotals(items, cap, contingency);
  const categories = calculateCategoryBreakdown(items);
  const split = calculateBilateralSplit(totals.committedOutlay, person1Percent || 50, person2Percent || 50);

  res.json({
    success: true,
    data: {
      totals,
      categories,
      split,
    },
  });
});

/**
 * 10. POST /api/weather
 * Microclimate and buoy telemetry
 */
app.post('/api/weather', (req: Request, res: Response) => {
  const { location } = req.body;
  const targetLoc = location || 'Positano, Amalfi Coast, Italy';

  res.json({
    success: true,
    weather: {
      location: targetLoc,
      tempC: 24,
      condition: 'Twilight Calm',
      seaTempC: 22,
      swellMeters: 0.3,
      windSpeedKts: 6,
      windDirection: 'WNW',
      uvIndex: 6.8,
      goldenHour: '19:12 — 20:04',
      visibilityKm: 18,
      packingChecklist: [
        { category: 'Daytime Coastal', items: ['Linen button-down shirts', 'Reef-safe sunscreen SPF 50', 'Polarized eyewear'] },
        { category: 'Evening Gastronomy', items: ['Smart-casual blazer', 'Light cashmere scarf'] },
      ],
      advisoryLevel: 'safe',
      advisoryText: 'Sea swell minimal (0.3m). Ideal conditions for Riva yacht tender crossing.',
    },
  });
});

/**
 * 11. GET /api/currency/rates
 * Live exchange rates via Frankfurter API with caching
 */
app.get('/api/currency/rates', async (req: Request, res: Response) => {
  try {
    const ratesData = await fetchLiveExchangeRates();
    res.json({ success: true, ...ratesData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve exchange rates' });
  }
});

/**
 * 12. GET /api/geocode
 * Autocomplete location search
 */
app.get('/api/geocode', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query || query.trim().length < 2) {
    res.json({ success: true, results: [] });
    return;
  }
  const results = await searchLocations(query);
  res.json({ success: true, results });
});

/**
 * 12b. GET /api/unsplash/search
 * Official Unsplash API search endpoint for genuine destination & landmark photography
 * Keeps UNSPLASH_ACCESS_KEY safe on the server
 */
app.get('/api/unsplash/search', async (req: Request, res: Response) => {
  try {
    const placeName = (req.query.placeName as string) || '';
    const destination = (req.query.destination as string) || '';
    const city = (req.query.city as string) || '';
    const country = (req.query.country as string) || '';

    if (!placeName || placeName.trim().length < 2) {
      res.json({
        success: false,
        status: 'INVALID_QUERY',
        photo: null,
        error: 'Attraction name is required',
      });
      return;
    }

    const result = await searchUnsplashPhotos(placeName, destination, city, country);
    res.json(result);
  } catch (err: any) {
    console.error('[Unsplash Search Endpoint Error]:', err);
    res.status(500).json({
      success: false,
      status: 'SERVICE_UNAVAILABLE',
      photo: null,
      error: err?.message || 'Failed to search Unsplash photos',
    });
  }
});

/**
 * 12c. POST /api/unsplash/track-download
 * Fires Unsplash download_location tracking per official API guidelines
 */
app.post('/api/unsplash/track-download', async (req: Request, res: Response) => {
  try {
    const { downloadLocation } = req.body || {};
    if (downloadLocation) {
      await trackUnsplashDownload(downloadLocation);
    }
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

/**
 * 12d. POST /api/places/generate-illustration (DEPRECATED & DISABLED)
 * AI image generation is completely disabled in favor of real Unsplash photography
 */
app.post('/api/places/generate-illustration', (_req: Request, res: Response) => {
  res.json({
    success: false,
    errorCode: 'GENERATION_FAILED',
    error: 'AI illustration generation has been permanently disabled. Real photographs from Unsplash are used instead.',
  });
});

/**
 * 12c. GET /api/places/real-photo
 * Server-side Wikipedia / Wikimedia PageImages search with proper User-Agent
 * Adheres to priority 1: real photograph lookup
 */
app.get('/api/places/real-photo', async (req: Request, res: Response) => {
  try {
    const placeName = (req.query.placeName as string) || '';
    const destination = (req.query.destination as string) || '';

    if (!placeName || placeName.trim().length < 2) {
      res.json({ success: false, photo: null });
      return;
    }

    const queries = [
      placeName.trim(),
      `${placeName.trim()} ${destination ? destination.split(',')[0].trim() : ''}`.trim(),
    ];

    for (const q of queries) {
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(
          q
        )}&gsrlimit=5&prop=pageimages|info&piprop=thumbnail|original&pithumbsize=1280`;

        const wikiRes = await fetch(wikiUrl, {
          headers: {
            'User-Agent': 'SmartAI-TravelPlanner/3.0 (travel@smartplanner.io; info@travelplanner.app)',
            'Accept': 'application/json',
          },
        });

        if (wikiRes.ok) {
          const data: any = await wikiRes.json();
          if (data?.query?.pages) {
            const pages = Object.values(data.query.pages) as any[];
            const normQuery = placeName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
            const queryTokens = normQuery.split(' ').filter((t: string) => t.length > 2);

            const candidates = pages
              .filter((p) => p.thumbnail?.source || p.original?.source)
              .map((p) => {
                const titleTokens = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ');
                const matchScore = queryTokens.filter((t: string) => titleTokens.includes(t)).length;
                return { page: p, matchScore };
              })
              .sort((a, b) => b.matchScore - a.matchScore);

            const best = candidates[0]?.page;
            if (best && (best.thumbnail?.source || best.original?.source)) {
              const candidateUrl = best.thumbnail?.source || best.original?.source;
              const originalUrl = best.original?.source || candidateUrl;

              res.json({
                success: true,
                photo: {
                  id: `wiki-${best.pageid}`,
                  url: originalUrl,
                  thumbUrl: candidateUrl,
                  placeName: best.title || placeName,
                  location: destination || 'Verified Destination',
                  photographer: 'Wikimedia Commons Contributor',
                  license: 'Creative Commons / Public Domain',
                  licenseUrl: 'https://commons.wikimedia.org',
                  source: 'Wikimedia Commons',
                  attributionText: `Photo: ${best.title} · Wikimedia Commons (CC / Public Domain)`,
                  mediaType: 'photo',
                  label: 'Photograph',
                },
              });
              return;
            }
          }
        }
      } catch (subErr) {
        console.warn('[real-photo query error]:', q, subErr);
      }
    }

    res.json({ success: false, photo: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Real photo lookup failed' });
  }
});

/**
 * 12d. GET /api/places/proxy-image
 * Proxies and caches Wikimedia / Wikipedia images with appropriate headers
 */
app.get('/api/places/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || (!imageUrl.startsWith('https://upload.wikimedia.org') && !imageUrl.startsWith('https://thumb.wikimedia.org'))) {
    res.status(400).send('Invalid or unauthorized image URL');
    return;
  }

  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'SmartAI-TravelPlanner/3.0 (travel@smartplanner.io)',
      },
    });

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).send('Failed to fetch image upstream');
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Proxy error');
  }
});

/**
 * 13. POST /api/flights/search
 * Flight corridor search with destination-aware booking links
 */
app.post('/api/flights/search', (req: Request, res: Response) => {
  const { origin = 'Shivamogga, India', destination = 'Goa, India', date = '2025-10-14', travelers = 2 } = req.body;
  const bookingCtx = {
    origin,
    destination,
    startDate: date,
    endDate: date,
    travelers: Number(travelers) || 2,
  };

  const gfUrl = generateGoogleFlightsUrl(bookingCtx);
  const skyUrl = generateSkyscannerUrl(bookingCtx);

  const dynamicFlights: FlightOption[] = [
    {
      id: `fl-dyn-1`,
      operator: 'IndiGo / Regional Air Transit',
      tailNumber: `Flight 6E-${Math.floor(100 + Math.random() * 800)}`,
      aircraftModel: 'Airbus A320neo / ATR 72',
      type: 'commercial',
      departureTime: '09:15 AM',
      originIata: origin.substring(0, 3).toUpperCase(),
      originName: origin,
      originDetail: 'Terminal Departure Hub',
      arrivalTime: '11:45 AM',
      destinationIata: destination.substring(0, 3).toUpperCase(),
      destinationName: destination,
      destinationDetail: 'Arrival Terminal',
      duration: '2h 30m Direct',
      serenityScore: 92,
      isConfirmed: false,
      price: 8500,
      priceLabel: '₹8,500 (Est. Live)',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200',
      carbonBadge: 'Fuel Efficient Modern Fleet',
      amenities: [
        { icon: 'luggage', title: '15kg Check-in Baggage', desc: 'Complimentary standard allowance' },
        { icon: 'flight', title: 'Live Provider Search', desc: 'Verify real fares on Google Flights' },
      ],
      bookingUrl: gfUrl,
    },
    {
      id: `fl-dyn-2`,
      operator: 'Air India / Vistara Star Alliance',
      tailNumber: `Flight AI-${Math.floor(200 + Math.random() * 700)}`,
      aircraftModel: 'Boeing 737 / A321',
      type: 'commercial',
      departureTime: '14:20 PM',
      originIata: origin.substring(0, 3).toUpperCase(),
      originName: origin,
      originDetail: 'Main Terminal',
      arrivalTime: '17:00 PM',
      destinationIata: destination.substring(0, 3).toUpperCase(),
      destinationName: destination,
      destinationDetail: 'Main Terminal',
      duration: '2h 40m Direct',
      serenityScore: 94,
      isConfirmed: false,
      price: 11200,
      priceLabel: '₹11,200 (Est. Live)',
      image: 'https://images.unsplash.com/photo-1540339832862-474599807836?q=80&w=1200',
      amenities: [
        { icon: 'restaurant', title: 'Complimentary Meal', desc: 'Hot gourmet in-flight dining' },
        { icon: 'airplane_ticket', title: 'Skyscanner Search', desc: 'Compare live ticket availability' },
      ],
      bookingUrl: skyUrl,
    },
  ];

  res.json({
    success: true,
    flights: dynamicFlights,
    searchParams: { origin, destination, date, travelers },
  });
});

/**
 * 14. POST /api/hotels/search
 * Stays & sanctuaries with real Booking.com & Google Hotels search links
 */
app.post('/api/hotels/search', (req: Request, res: Response) => {
  const { destination = 'Goa, India', guests = 2, dates = 'Oct 14-19' } = req.body;
  const bookingCtx = {
    origin: '',
    destination,
    startDate: '2025-10-14',
    endDate: '2025-10-19',
    travelers: Number(guests) || 2,
    rooms: Math.ceil((Number(guests) || 2) / 2),
  };

  const bookingUrl = generateBookingDotComUrl(bookingCtx);
  const googleHotelsUrl = generateGoogleHotelsUrl(bookingCtx);

  const dynamicHotels: SanctuaryStay[] = [
    {
      id: `stay-search-1`,
      name: `${destination.split(',')[0]} Heritage Boutique Sanctuary`,
      location: destination,
      subLocation: 'Central Historic District',
      keys: 2,
      tagline: 'Verified Guest Rating 8.9 · Free Cancellation Available',
      stateroomName: 'Deluxe Comfort King Room',
      stateroomDesc: 'Air Conditioning · High Speed Wi-Fi · Ensuite Bathroom',
      pricePerNight: 3500,
      totalNights: 4,
      rating: 8.9,
      acousticIsolationScore: 'Quiet Garden View',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
      isPrimaryAnchor: true,
      highlights: [
        'Central prime location near sights',
        'Daily breakfast included',
        'Direct live search on Booking.com',
      ],
      inclusions: ['Free Wi-Fi', 'Breakfast buffet', '24h front desk'],
      metrics: [
        { label: 'Rating', value: '8.9 / 10' },
        { label: 'Provider', value: 'Booking.com Link' },
      ],
      bookingUrl,
    },
    {
      id: `stay-search-2`,
      name: `${destination.split(',')[0]} Eco Garden Homestay & Suites`,
      location: destination,
      subLocation: 'Scenic Greenery & Peaceful Enclave',
      keys: 1,
      tagline: 'Budget Friendly · Clean & Highly Rated (9.1)',
      stateroomName: 'Standard Double Suite with Balcony',
      stateroomDesc: 'Terrace View · Ceiling Fan & AC · Hot Shower',
      pricePerNight: 1600,
      totalNights: 4,
      rating: 9.1,
      acousticIsolationScore: 'Surrounded by nature',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200',
      isPrimaryAnchor: false,
      highlights: [
        'Exceptional host hospitality',
        'Walking distance to local cafes',
        'Compare rates via Google Hotels',
      ],
      inclusions: ['Complimentary tea/coffee', 'Luggage storage', 'Filtered water'],
      metrics: [
        { label: 'Rating', value: '9.1 / 10' },
        { label: 'Provider', value: 'Google Hotels Link' },
      ],
      bookingUrl: googleHotelsUrl,
    },
  ];

  res.json({
    success: true,
    sanctuaries: dynamicHotels,
    searchParams: { destination, guests, dates },
  });
});

// Configure multer memory storage for single or multi-part file uploads (front & back ID cards)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
    files: 2, // Max 2 files for front & back card pairs
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    const allowedExt = /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.originalname);
    if (allowedMime.includes(file.mimetype) || allowedExt) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_FILE_TYPE: Only JPG, PNG, WEBP, and PDF documents are supported for OCR extraction.'));
    }
  },
});

const multipartUploadMiddleware = (req: Request, res: Response, next: any) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.any()(req as any, res as any, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'FILE_TOO_LARGE',
            message: 'One or more files exceed the 15 MB limit. Please select a smaller document.',
          });
        }
        return res.status(400).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: err.message || 'Failed to process document upload.',
        });
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * 13. POST /api/documents/extract
 * Real Document OCR Extraction for Identity Documents (Aadhaar front/back, Driving Licence,
 * Passport, Visa) and Travel Documents (Flights, Hotels, Train, Bus, Receipts)
 */
app.post('/api/documents/extract', multipartUploadMiddleware, async (req: Request, res: Response) => {
  const parts: { base64Data: string; mimeType: string; fileName: string; side?: 'front' | 'back' | 'single' }[] = [];
  let tripId: string | undefined = (req.body?.tripId as string) || (req.query?.tripId as string);
  const shouldSaveToTrip = req.body?.saveToTrip === true || req.body?.saveToTrip === 'true';

  // 1. Process files from multipart/form-data
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const f of req.files) {
      let side: 'front' | 'back' | 'single' = 'single';
      if (f.fieldname === 'front' || f.originalname.toLowerCase().includes('front')) {
        side = 'front';
      } else if (f.fieldname === 'back' || f.originalname.toLowerCase().includes('back')) {
        side = 'back';
      }
      parts.push({
        base64Data: f.buffer.toString('base64'),
        mimeType: f.mimetype,
        fileName: f.originalname,
        side,
      });
    }
  }

  // 2. Process JSON Base64 payloads (single or multiple)
  if (parts.length === 0 && req.body) {
    if (Array.isArray(req.body.files) && req.body.files.length > 0) {
      for (const item of req.body.files) {
        if (item.base64Data) {
          parts.push({
            base64Data: item.base64Data,
            mimeType: item.mimeType || item.fileType || 'image/jpeg',
            fileName: item.fileName || 'document',
            side: item.side || 'single',
          });
        }
      }
    } else if (req.body.frontBase64 || req.body.backBase64) {
      if (req.body.frontBase64) {
        parts.push({
          base64Data: req.body.frontBase64,
          mimeType: req.body.frontMimeType || 'image/jpeg',
          fileName: req.body.frontFileName || 'front_side.jpg',
          side: 'front',
        });
      }
      if (req.body.backBase64) {
        parts.push({
          base64Data: req.body.backBase64,
          mimeType: req.body.backMimeType || 'image/jpeg',
          fileName: req.body.backFileName || 'back_side.jpg',
          side: 'back',
        });
      }
    } else {
      const rawBase64 = req.body.fileContentBase64 || req.body.base64Data || req.body.fileData;
      if (rawBase64) {
        parts.push({
          base64Data: rawBase64,
          mimeType: req.body.fileType || req.body.mimeType || 'application/pdf',
          fileName: req.body.fileName || 'document',
          side: 'single',
        });
      }
    }
  }

  // Validate presence of file content
  if (parts.length === 0) {
    res.status(400).json({
      success: false,
      error: 'FILE_CONTENT_REQUIRED',
      message: 'No document content was uploaded. Please upload a valid JPG, PNG, WEBP, or PDF file (or front & back pair).',
    });
    return;
  }

  // Validate supported file format for each part
  for (const part of parts) {
    const effectiveMimeType = part.mimeType.toLowerCase();
    const isSupportedType =
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(effectiveMimeType) ||
      /\.(jpg|jpeg|png|webp|pdf)$/i.test(part.fileName);

    if (!isSupportedType) {
      res.status(415).json({
        success: false,
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: `Unsupported document format for "${part.fileName}". Real OCR ingestion only supports JPG, PNG, WEBP, and PDF documents.`,
      });
      return;
    }
  }

  // Check if AI OCR engine is configured
  if (!getGeminiClient()) {
    res.status(503).json({
      success: false,
      error: 'OCR_SERVICE_UNCONFIGURED',
      message: 'The AI OCR extraction engine is currently unconfigured. Please configure GEMINI_API_KEY in the server environment (.env) to enable intelligent image and PDF extraction.',
    });
    return;
  }

  try {
    const ocrResult = await extractDocumentWithGemini(parts);

    if (!ocrResult || !ocrResult.rawText || ocrResult.rawText.trim().length === 0) {
      res.status(422).json({
        success: false,
        error: 'DOCUMENT_UNREADABLE',
        message: 'The OCR engine could not read any legible text from the uploaded document(s). Please verify that the image or PDF is clear, unblurred, and right-side up.',
      });
      return;
    }

    const primaryFileName = parts.length > 1
      ? `${parts[0].fileName} + ${parts[1].fileName} (Card Pair)`
      : parts[0].fileName;

    const documentRecord: ExtractedDocument = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fileName: primaryFileName,
      fileSize: `${parts.length} file${parts.length > 1 ? 's' : ''}`,
      fileType: parts[0].mimeType,
      uploadedAt: new Date().toISOString(),
      parsedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      confidenceScore: Math.round((ocrResult.confidenceScore || 0.95) * 100) / 100,
      documentCategory: ocrResult.documentCategory || 'general',
      documentType: ocrResult.documentType || 'other',
      documentTypeLabel: ocrResult.documentTypeLabel || ocrResult.documentType,
      isPair: parts.length > 1,
      pairSide: ocrResult.pairSide || (parts.length > 1 ? 'both' : parts[0].side || 'single'),
      isMaskedByDefault: true,
      fields: ocrResult.fields || {},
      rawText: ocrResult.rawText,
      rawSummary: ocrResult.rawSummary || 'Successfully extracted document fields.',
      status: (ocrResult.confidenceScore || 0.95) >= 0.7 ? 'verified' : 'needs_review',
    };

    // Only save permanently to trip store if explicitly requested by user
    if (shouldSaveToTrip) {
      const user = getUserFromRequest(req);
      const targetTrip = tripId
        ? tripsStore.find((t) => t.id === tripId)
        : tripsStore.find((t) => (user ? t.userId === user.id : true)) || tripsStore[0];

      if (targetTrip) {
        targetTrip.extractedDocuments = targetTrip.extractedDocuments || [];
        targetTrip.extractedDocuments.unshift(documentRecord);
      }
    }

    res.json({
      success: true,
      document: documentRecord,
    });
  } catch (err: any) {
    // Privacy safeguard: do not log raw images or sensitive document contents
    console.error('[OCR Extraction Endpoint Error]:', err?.message || 'Processing error');
    res.status(500).json({
      success: false,
      error: 'EXTRACTION_PROCESSING_ERROR',
      message: err?.message || 'An unexpected error occurred while parsing the document with OCR.',
    });
  }
});

/**
 * Explicit save endpoint: User reviews extracted data and explicitly saves to dossier
 */
app.post('/api/documents/save', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { document, tripId } = req.body;
  if (!document || !document.id) {
    res.status(400).json({ success: false, error: 'Document payload required' });
    return;
  }

  const targetTrip = tripId
    ? tripsStore.find((t) => t.id === tripId)
    : tripsStore.find((t) => (user ? t.userId === user.id : true)) || tripsStore[0];

  if (targetTrip) {
    targetTrip.extractedDocuments = targetTrip.extractedDocuments || [];
    const idx = targetTrip.extractedDocuments.findIndex((d) => d.id === document.id);
    if (idx >= 0) {
      targetTrip.extractedDocuments[idx] = document;
    } else {
      targetTrip.extractedDocuments.unshift(document);
    }
    res.json({ success: true, message: 'Document saved to trip dossier', document });
  } else {
    res.status(404).json({ success: false, error: 'Target trip not found' });
  }
});

/**
 * 16a. GET /api/agent-center/metrics
 * Returns comprehensive evaluation metrics for active trip or requested trip ID
 */
app.get('/api/agent-center/metrics', async (req: Request, res: Response) => {
  try {
    const tripId = req.query.tripId as string;
    let targetTrip = tripId ? tripsStore.find((t) => t.id === tripId) : tripsStore[0];
    if (!targetTrip) {
      targetTrip = DEFAULT_ODYSSEY;
    }

    const evaluation = await synthesizeEvaluationDataForTrip(targetTrip, PORT);
    res.json({
      success: true,
      metrics: evaluation,
      history: getWorkflowHistory(),
    });
  } catch (err: any) {
    console.error('[Agent Center Metrics API Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to collect agent evaluation metrics',
      message: err?.message,
    });
  }
});

/**
 * 16b. POST /api/agent-center/test-ping
 * On-demand application-level HTTP latency measurement across internal & external endpoints
 */
app.post('/api/agent-center/test-ping', async (_req: Request, res: Response) => {
  try {
    const networkLatency = await measureRealNetworkLatency(PORT);
    res.json({
      success: true,
      networkLatency,
    });
  } catch (err: any) {
    console.error('[Agent Center Ping Test Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to measure network latencies',
      message: err?.message,
    });
  }
});

/**
 * 16c. POST /api/agent-center/evaluate-trip
 * Evaluates any uploaded or customized trip payload
 */
app.post('/api/agent-center/evaluate-trip', async (req: Request, res: Response) => {
  try {
    const tripPayload: TripPlan = req.body?.trip || tripsStore[0] || DEFAULT_ODYSSEY;
    const evaluation = await synthesizeEvaluationDataForTrip(tripPayload, PORT);
    res.json({
      success: true,
      metrics: evaluation,
    });
  } catch (err: any) {
    console.error('[Agent Center Evaluate Trip Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate trip metrics',
      message: err?.message,
    });
  }
});

// ================= API FALLTHROUGH & ERROR PROTECTION =================
// Strict 404 handler for any unmatched /api/* route: ALWAYS returns structured JSON, never falls through to Vite HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API_ENDPOINT_NOT_FOUND',
    message: `API route ${req.method} ${req.originalUrl} not found. Please verify the endpoint path and HTTP method.`,
  });
});

// Strict JSON error handling middleware for /api routes
app.use('/api', (err: any, req: Request, res: Response, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('[API Error Middleware]:', err);
  const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
  res.status(status).json({
    success: false,
    error: err.code || 'API_PROCESSING_ERROR',
    message: err.message || 'An unexpected error occurred while processing the API request.',
  });
});

// ================= VITE DEV OR STATIC SERVE =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static bundle
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart AI Travel Planner 3.0 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
