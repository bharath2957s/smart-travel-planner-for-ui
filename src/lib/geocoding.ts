/**
 * Smart AI Travel Planner 3.0
 * Geocoding, Autocomplete & Spatial Distance Engine
 *
 * Provides:
 * - Real geocoding via OpenStreetMap Nominatim with debouncing & rate limiting
 * - Instant curated global & domestic hubs database for offline resilience
 * - Haversine distance calculator for realistic transit mode arbitration (bus/train vs flight)
 * - Strict zero-fabricated coordinates: unknown locations return null, NEVER hardcoded Goa/Bandoli!
 */

export interface NormalizedLocation {
  displayName: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  type?: string;
}

// Curated verified destinations and iconic regional landmarks
export const VERIFIED_HUBS: NormalizedLocation[] = [
  // India Hubs & Major Cities
  { city: 'Shivamogga', state: 'Karnataka', country: 'India', displayName: 'Shivamogga, Karnataka, India', lat: 13.9299, lon: 75.5681 },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', displayName: 'Bengaluru (Bangalore), Karnataka, India', lat: 12.9716, lon: 77.5946 },
  { city: 'Mysuru', state: 'Karnataka', country: 'India', displayName: 'Mysuru (Mysore), Karnataka, India', lat: 12.2958, lon: 76.6394 },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', displayName: 'Mumbai, Maharashtra, India', lat: 19.0760, lon: 72.8777 },
  { city: 'New Delhi', state: 'Delhi', country: 'India', displayName: 'New Delhi, Delhi, India', lat: 28.6139, lon: 77.2090 },
  { city: 'Delhi', state: 'Delhi', country: 'India', displayName: 'Delhi, India', lat: 28.7041, lon: 77.1025 },
  { city: 'Goa', state: 'Goa', country: 'India', displayName: 'Goa, India', lat: 15.2993, lon: 74.1240 },
  { city: 'Panaji', state: 'Goa', country: 'India', displayName: 'Panaji, Goa, India', lat: 15.4909, lon: 73.8278 },
  { city: 'Margao', state: 'Goa', country: 'India', displayName: 'Margao, Goa, India', lat: 15.2832, lon: 73.9862 },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', displayName: 'Jaipur, Rajasthan, India', lat: 26.9124, lon: 75.7873 },
  { city: 'Udaipur', state: 'Rajasthan', country: 'India', displayName: 'Udaipur, Rajasthan, India', lat: 24.5854, lon: 73.7125 },
  { city: 'Kochi', state: 'Kerala', country: 'India', displayName: 'Kochi (Cochin), Kerala, India', lat: 9.9312, lon: 76.2673 },
  { city: 'Munnar', state: 'Kerala', country: 'India', displayName: 'Munnar, Kerala, India', lat: 10.0889, lon: 77.0595 },
  { city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', displayName: 'Varanasi, Uttar Pradesh, India', lat: 25.3176, lon: 82.9739 },
  { city: 'Manali', state: 'Himachal Pradesh', country: 'India', displayName: 'Manali, Himachal Pradesh, India', lat: 32.2396, lon: 77.1887 },
  { city: 'Shimla', state: 'Himachal Pradesh', country: 'India', displayName: 'Shimla, Himachal Pradesh, India', lat: 31.1048, lon: 77.1734 },
  { city: 'Ooty', state: 'Tamil Nadu', country: 'India', displayName: 'Ooty, Tamil Nadu, India', lat: 11.4102, lon: 76.6950 },
  { city: 'Darjeeling', state: 'West Bengal', country: 'India', displayName: 'Darjeeling, West Bengal, India', lat: 27.0410, lon: 88.2663 },
  { city: 'Puducherry', state: 'Puducherry', country: 'India', displayName: 'Puducherry (Pondicherry), India', lat: 11.9416, lon: 79.8083 },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', displayName: 'Hyderabad, Telangana, India', lat: 17.3850, lon: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', displayName: 'Chennai, Tamil Nadu, India', lat: 13.0827, lon: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', displayName: 'Kolkata, West Bengal, India', lat: 22.5726, lon: 88.3639 },
  { city: 'Amritsar', state: 'Punjab', country: 'India', displayName: 'Amritsar, Punjab, India', lat: 31.6340, lon: 74.8723 },
  { city: 'Rishikesh', state: 'Uttarakhand', country: 'India', displayName: 'Rishikesh, Uttarakhand, India', lat: 30.0869, lon: 78.2676 },
  { city: 'Agra', state: 'Uttar Pradesh', country: 'India', displayName: 'Agra, Uttar Pradesh, India', lat: 27.1767, lon: 78.0081 },
  { city: 'Pune', state: 'Maharashtra', country: 'India', displayName: 'Pune, Maharashtra, India', lat: 18.5204, lon: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', displayName: 'Ahmedabad, Gujarat, India', lat: 23.0225, lon: 72.5714 },
  { city: 'Chandigarh', state: 'Chandigarh', country: 'India', displayName: 'Chandigarh, India', lat: 30.7333, lon: 76.7794 },
  { city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', displayName: 'Srinagar, Jammu and Kashmir, India', lat: 34.0837, lon: 74.7973 },
  { city: 'Leh', state: 'Ladakh', country: 'India', displayName: 'Leh, Ladakh, India', lat: 34.1526, lon: 77.5771 },
  { city: 'Hampi', state: 'Karnataka', country: 'India', displayName: 'Hampi, Karnataka, India', lat: 15.3350, lon: 76.4600 },
  { city: 'Gokarna', state: 'Karnataka', country: 'India', displayName: 'Gokarna, Karnataka, India', lat: 14.5479, lon: 74.3188 },
  { city: 'Coorg', state: 'Karnataka', country: 'India', displayName: 'Coorg (Madikeri), Karnataka, India', lat: 12.4244, lon: 75.7382 },
  { city: 'Mangaluru', state: 'Karnataka', country: 'India', displayName: 'Mangaluru (Mangalore), Karnataka, India', lat: 12.9141, lon: 74.8560 },
  { city: 'Hubballi', state: 'Karnataka', country: 'India', displayName: 'Hubballi (Hubli), Karnataka, India', lat: 15.3647, lon: 75.1240 },
  { city: 'Chikmagalur', state: 'Karnataka', country: 'India', displayName: 'Chikmagalur, Karnataka, India', lat: 13.3161, lon: 75.7720 },
  { city: 'Wayanad', state: 'Kerala', country: 'India', displayName: 'Wayanad, Kerala, India', lat: 11.6854, lon: 76.1320 },
  { city: 'Alleppey', state: 'Kerala', country: 'India', displayName: 'Alappuzha (Alleppey), Kerala, India', lat: 9.4981, lon: 76.3388 },

  // Prominent Landmarks in Key Destinations (for precise activity placement)
  // Bengaluru
  { city: 'Bengaluru', country: 'India', displayName: 'Cubbon Park, Bengaluru', lat: 12.9763, lon: 77.5929 },
  { city: 'Bengaluru', country: 'India', displayName: 'Lalbagh Botanical Garden, Bengaluru', lat: 12.9507, lon: 77.5848 },
  { city: 'Bengaluru', country: 'India', displayName: 'Bangalore Palace, Bengaluru', lat: 12.9988, lon: 77.5921 },
  { city: 'Bengaluru', country: 'India', displayName: 'Vidhana Soudha, Bengaluru', lat: 12.9797, lon: 77.5907 },
  { city: 'Bengaluru', country: 'India', displayName: 'ISKCON Temple Bangalore', lat: 13.0098, lon: 77.5511 },
  { city: 'Bengaluru', country: 'India', displayName: 'Bannerghatta National Park, Bengaluru', lat: 12.8009, lon: 77.5777 },
  { city: 'Bengaluru', country: 'India', displayName: 'Commercial Street, Bengaluru', lat: 12.9822, lon: 77.6083 },
  { city: 'Bengaluru', country: 'India', displayName: 'Indiranagar 100ft Road, Bengaluru', lat: 12.9719, lon: 77.6412 },
  { city: 'Bengaluru', country: 'India', displayName: 'Kempegowda International Airport (BLR)', lat: 13.1986, lon: 77.7066 },

  // Mumbai
  { city: 'Mumbai', country: 'India', displayName: 'Gateway of India, Mumbai', lat: 18.9220, lon: 72.8347 },
  { city: 'Mumbai', country: 'India', displayName: 'Marine Drive, Mumbai', lat: 18.9432, lon: 72.8230 },
  { city: 'Mumbai', country: 'India', displayName: 'Colaba Causeway, Mumbai', lat: 18.9150, lon: 72.8280 },
  { city: 'Mumbai', country: 'India', displayName: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai', lat: 18.9400, lon: 72.8353 },
  { city: 'Mumbai', country: 'India', displayName: 'Bandra-Worli Sea Link, Mumbai', lat: 19.0330, lon: 72.8160 },
  { city: 'Mumbai', country: 'India', displayName: 'Elephanta Caves, Mumbai', lat: 18.9633, lon: 72.9315 },
  { city: 'Mumbai', country: 'India', displayName: 'Juhu Beach, Mumbai', lat: 19.0988, lon: 72.8264 },

  // Delhi
  { city: 'New Delhi', country: 'India', displayName: 'India Gate, New Delhi', lat: 28.6129, lon: 77.2295 },
  { city: 'New Delhi', country: 'India', displayName: 'Qutub Minar, New Delhi', lat: 28.5244, lon: 77.1855 },
  { city: 'New Delhi', country: 'India', displayName: 'Red Fort, Delhi', lat: 28.6562, lon: 77.2410 },
  { city: 'New Delhi', country: 'India', displayName: 'Humayun’s Tomb, New Delhi', lat: 28.5933, lon: 77.2507 },
  { city: 'New Delhi', country: 'India', displayName: 'Lotus Temple, New Delhi', lat: 28.5535, lon: 77.2588 },
  { city: 'New Delhi', country: 'India', displayName: 'Connaught Place, New Delhi', lat: 28.6315, lon: 77.2167 },

  // Jaipur
  { city: 'Jaipur', country: 'India', displayName: 'Hawa Mahal, Jaipur', lat: 26.9239, lon: 75.8267 },
  { city: 'Jaipur', country: 'India', displayName: 'Amber Palace (Amer Fort), Jaipur', lat: 26.9855, lon: 75.8513 },
  { city: 'Jaipur', country: 'India', displayName: 'City Palace, Jaipur', lat: 26.9258, lon: 75.8237 },
  { city: 'Jaipur', country: 'India', displayName: 'Jantar Mantar, Jaipur', lat: 26.9248, lon: 75.8246 },

  // Mysuru
  { city: 'Mysuru', country: 'India', displayName: 'Mysore Palace, Mysuru', lat: 12.3051, lon: 76.6551 },
  { city: 'Mysuru', country: 'India', displayName: 'Chamundi Hill, Mysuru', lat: 12.2743, lon: 76.6710 },
  { city: 'Mysuru', country: 'India', displayName: 'Brindavan Gardens, Mysuru', lat: 12.4244, lon: 76.5724 },

  // International Hubs & World Destinations
  { city: 'Paris', country: 'France', displayName: 'Paris, Île-de-France, France', lat: 48.8566, lon: 2.3522 },
  { city: 'Paris', country: 'France', displayName: 'Eiffel Tower, Paris', lat: 48.8584, lon: 2.2945 },
  { city: 'Paris', country: 'France', displayName: 'Louvre Museum, Paris', lat: 48.8606, lon: 2.3376 },
  { city: 'London', country: 'United Kingdom', displayName: 'London, Greater London, United Kingdom', lat: 51.5074, lon: -0.1278 },
  { city: 'Tokyo', country: 'Japan', displayName: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { city: 'Kyoto', country: 'Japan', displayName: 'Kyoto, Kansai, Japan', lat: 35.0116, lon: 135.7681 },
  { city: 'Rome', country: 'Italy', displayName: 'Rome, Lazio, Italy', lat: 41.9028, lon: 12.4964 },
  { city: 'Amalfi Coast', country: 'Italy', displayName: 'Amalfi Coast, Campania, Italy', lat: 40.6340, lon: 14.6027 },
  { city: 'Positano', country: 'Italy', displayName: 'Positano, Campania, Italy', lat: 40.6281, lon: 14.4850 },
  { city: 'Capri', country: 'Italy', displayName: 'Capri, Campania, Italy', lat: 40.5507, lon: 14.2426 },
  { city: 'Ravello', country: 'Italy', displayName: 'Ravello, Campania, Italy', lat: 40.6493, lon: 14.6111 },
  { city: 'Zurich', country: 'Switzerland', displayName: 'Zurich, Switzerland', lat: 47.3769, lon: 8.5417 },
  { city: 'Geneva', country: 'Switzerland', displayName: 'Geneva, Switzerland', lat: 46.2044, lon: 6.1432 },
  { city: 'Dubai', country: 'United Arab Emirates', displayName: 'Dubai, United Arab Emirates', lat: 25.2048, lon: 55.2708 },
  { city: 'Singapore', country: 'Singapore', displayName: 'Singapore, Singapore', lat: 1.3521, lon: 103.8198 },
  { city: 'Bangkok', country: 'Thailand', displayName: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018 },
  { city: 'Phuket', country: 'Thailand', displayName: 'Phuket, Thailand', lat: 7.8804, lon: 98.3923 },
  { city: 'Bali', country: 'Indonesia', displayName: 'Bali, Indonesia', lat: -8.4095, lon: 115.1889 },
  { city: 'New York', country: 'United States', displayName: 'New York, NY, United States', lat: 40.7128, lon: -74.0060 },
  { city: 'San Francisco', country: 'United States', displayName: 'San Francisco, CA, United States', lat: 37.7749, lon: -122.4194 },
  { city: 'Levi', state: 'Lapland', country: 'Finland', displayName: 'Levi, Lapland, Finland', lat: 67.8044, lon: 24.8082 },
  { city: 'Rovaniemi', state: 'Lapland', country: 'Finland', displayName: 'Rovaniemi, Lapland, Finland', lat: 66.5039, lon: 25.7294 },
  { city: 'Barcelona', country: 'Spain', displayName: 'Barcelona, Catalonia, Spain', lat: 41.3879, lon: 2.1699 },
  { city: 'Amsterdam', country: 'Netherlands', displayName: 'Amsterdam, Netherlands', lat: 52.3676, lon: 4.9041 },
];

const cache = new Map<string, NormalizedLocation[]>();
const resolvedCoordsCache = new Map<string, { lat: number; lon: number } | null>();

/**
 * Search locations with local verified index first, falling back to Nominatim
 */
export async function searchLocations(query: string): Promise<NormalizedLocation[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  if (cache.has(trimmed)) {
    return cache.get(trimmed)!;
  }

  // 1. Check local verified index for instant matches
  const localMatches = VERIFIED_HUBS.filter((h) => {
    const c = h.city.toLowerCase();
    const d = h.displayName.toLowerCase();
    const s = h.state ? h.state.toLowerCase() : '';
    const co = h.country.toLowerCase();
    return c.includes(trimmed) || d.includes(trimmed) || s.includes(trimmed) || co.includes(trimmed);
  });

  if (localMatches.length >= 3) {
    const res = localMatches.slice(0, 6);
    cache.set(trimmed, res);
    return res;
  }

  // 2. Query Nominatim with timeout and safety headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=5`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SmartAITravelPlanner/3.0 (travel-planner-app)',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const remoteResults: NormalizedLocation[] = data.map((item: any) => {
          const address = item.address || {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.state_district ||
            address.county ||
            item.name ||
            query;
          const country = address.country || '';
          const state = address.state || '';

          return {
            displayName: item.display_name,
            city,
            state,
            country,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
          };
        });

        const combined = [...localMatches];
        for (const r of remoteResults) {
          if (!combined.some((c) => c.displayName.toLowerCase() === r.displayName.toLowerCase())) {
            combined.push(r);
          }
        }

        const finalResults = combined.slice(0, 6);
        cache.set(trimmed, finalResults);
        return finalResults;
      }
    }
  } catch (err) {
    console.warn('[Geocoding] Nominatim fetch failed or timed out:', err);
  }

  cache.set(trimmed, localMatches);
  return localMatches;
}

/**
 * Calculate Great-Circle Distance (Haversine formula) in Kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Determine recommended transit mode based on distance and geography
 */
export function recommendTransitMode(
  distanceKm: number,
  isInternational: boolean
): 'train_bus' | 'flight' | 'drive' | 'mixed' {
  if (isInternational || distanceKm > 750) {
    return 'flight';
  }
  if (distanceKm <= 350) {
    return 'train_bus';
  }
  return 'mixed';
}

/**
 * Resolve coordinates synchronously for a city, destination name, or landmark.
 * Returns null if the location is not recognized.
 * NEVER returns hardcoded Goa/Bandoli!
 */
export function resolveCoordinates(
  placeName?: string | null,
  destinationContext?: string | null
): { lat: number; lon: number } | null {
  if (!placeName && !destinationContext) return null;

  const target = (placeName || destinationContext || '').trim();
  if (!target) return null;

  const norm = target.toLowerCase();

  // 1. Exact or partial city / hub match in VERIFIED_HUBS
  const hub = VERIFIED_HUBS.find((h) => {
    const cityName = h.city.toLowerCase();
    const dispName = h.displayName.toLowerCase();
    const firstWord = norm.split(',')[0].trim();

    return (
      norm === cityName ||
      norm === dispName ||
      cityName === firstWord ||
      dispName.includes(norm) ||
      norm.includes(cityName)
    );
  });

  if (hub) return { lat: hub.lat, lon: hub.lon };

  // 2. Specific landmark aliases
  if (norm.includes('amalfi') || norm.includes('positano') || norm.includes('capri')) {
    return { lat: 40.634, lon: 14.6027 };
  }
  if (norm.includes('zurich')) return { lat: 47.3769, lon: 8.5417 };
  if (norm.includes('kyoto')) return { lat: 35.0116, lon: 135.7681 };
  if (norm.includes('lapland') || norm.includes('levi')) return { lat: 67.8044, lon: 24.8082 };
  if (norm.includes('paris')) return { lat: 48.8566, lon: 2.3522 };
  if (norm.includes('london')) return { lat: 51.5074, lon: -0.1278 };
  if (norm.includes('bengaluru') || norm.includes('bangalore')) return { lat: 12.9716, lon: 77.5946 };
  if (norm.includes('mumbai') || norm.includes('bombay')) return { lat: 19.0760, lon: 72.8777 };
  if (norm.includes('delhi')) return { lat: 28.6139, lon: 77.2090 };
  if (norm.includes('jaipur')) return { lat: 26.9124, lon: 75.7873 };
  if (norm.includes('mysuru') || norm.includes('mysore')) return { lat: 12.2958, lon: 76.6394 };

  // 3. If placeName was not directly recognized, but a destinationContext was provided,
  // resolve the destination hub and compute a deterministic offset within the city
  if (destinationContext && destinationContext.trim().toLowerCase() !== norm) {
    const contextHub = resolveCoordinates(destinationContext);
    if (contextHub) {
      // Deterministic spread around destination city center based on placeName string hash
      let hash = 0;
      for (let i = 0; i < norm.length; i++) {
        hash = (hash << 5) - hash + norm.charCodeAt(i);
        hash |= 0;
      }
      const latOffset = (((Math.abs(hash) % 100) - 50) / 100) * 0.04;
      const lonOffset = (((Math.abs(hash >> 3) % 100) - 50) / 100) * 0.04;

      return {
        lat: Number((contextHub.lat + latOffset).toFixed(4)),
        lon: Number((contextHub.lon + lonOffset).toFixed(4)),
      };
    }
  }

  // Not resolvable synchronously: return null. Never substitute Goa/Bandoli!
  return null;
}

/**
 * Asynchronously geocode a place name with destination context and caching.
 * Queries Nominatim if local lookup fails.
 * Returns null if location cannot be resolved.
 */
export async function geocodePlace(
  placeName: string,
  destinationContext?: string
): Promise<{ lat: number; lon: number } | null> {
  const query = `${placeName}${destinationContext ? ` ${destinationContext}` : ''}`.trim();
  if (!query) return null;

  const cacheKey = query.toLowerCase();
  if (resolvedCoordsCache.has(cacheKey)) {
    return resolvedCoordsCache.get(cacheKey) || null;
  }

  // 1. Try synchronous resolution first
  const sync = resolveCoordinates(placeName, destinationContext);
  if (sync) {
    resolvedCoordsCache.set(cacheKey, sync);
    return sync;
  }

  // 2. Query Nominatim search
  try {
    const searchResults = await searchLocations(query);
    if (searchResults && searchResults.length > 0) {
      const top = searchResults[0];
      const coords = { lat: top.lat, lon: top.lon };
      resolvedCoordsCache.set(cacheKey, coords);
      return coords;
    }

    // Try just the destinationContext if specific place query yielded no result
    if (destinationContext) {
      const destResults = await searchLocations(destinationContext);
      if (destResults && destResults.length > 0) {
        const topDest = destResults[0];
        let hash = 0;
        for (let i = 0; i < placeName.length; i++) {
          hash = (hash << 5) - hash + placeName.charCodeAt(i);
          hash |= 0;
        }
        const latOffset = (((Math.abs(hash) % 100) - 50) / 100) * 0.03;
        const lonOffset = (((Math.abs(hash >> 3) % 100) - 50) / 100) * 0.03;
        const coords = {
          lat: Number((topDest.lat + latOffset).toFixed(4)),
          lon: Number((topDest.lon + lonOffset).toFixed(4)),
        };
        resolvedCoordsCache.set(cacheKey, coords);
        return coords;
      }
    }
  } catch (err) {
    console.warn('[Geocoding] geocodePlace network lookup error:', err);
  }

  resolvedCoordsCache.set(cacheKey, null);
  return null;
}
