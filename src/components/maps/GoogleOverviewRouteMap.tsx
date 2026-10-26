/**
 * Smart AI Travel Planner 3.0
 * Google Maps Overview Route Geospatial Map Component
 *
 * Implements:
 * 1. `@vis.gl/react-google-maps` with `APIProvider`, `<Map>`, `<AdvancedMarker>`, and `<Polyline>`.
 * 2. Mandatory attribution: `internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}`.
 * 3. Dynamic origin departure marker & destination arrival marker with live labels.
 * 4. Geocoding of user-selected destination and origin with no hardcoded Goa/Bandoli defaults.
 * 5. Neutral empty state when no destination is selected.
 * 6. Error handling with retry if geocoding fails.
 * 7. Flight arc or overland corridor visualization based on distance and transport mode.
 * 8. Live telemetry HUD: distance in km, transit mode, journey duration, and fare.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import { TripPlan, CurrencyCode } from '../../types/travel';
import { resolveCoordinates, geocodePlace, calculateDistanceKm } from '../../lib/geocoding';
import { formatCurrency } from '../../lib/budget';
import {
  getGoogleMapsApiKey,
  buildGoogleMapsDirectionsUrl,
  MapCoordinate,
} from '../../lib/googleMapsService';

interface GoogleOverviewRouteMapProps {
  trip?: TripPlan | null;
  currency: CurrencyCode;
  height?: string;
  className?: string;
  onExploreTransit?: () => void;
}

/**
 * Calculates curved aviation arc between two points for realistic international visualization
 */
function createCurvedArc(
  start: MapCoordinate,
  end: MapCoordinate,
  numPoints = 30
): MapCoordinate[] {
  const points: MapCoordinate[] = [];
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const curvature = 0.15;

  const arcMidLat = midLat - dLng * curvature;
  const arcMidLng = midLng + dLat * curvature;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat =
      Math.pow(1 - t, 2) * start.lat +
      2 * (1 - t) * t * arcMidLat +
      Math.pow(t, 2) * end.lat;
    const lng =
      Math.pow(1 - t, 2) * start.lng +
      2 * (1 - t) * t * arcMidLng +
      Math.pow(t, 2) * end.lng;
    points.push({ lat, lng });
  }

  return points;
}

// Controller to auto-fit corridor bounds or center on destination
const CorridorBoundsController: React.FC<{
  originCoords: MapCoordinate | null;
  destCoords: MapCoordinate;
}> = ({ originCoords, destCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (typeof google !== 'undefined' && google.maps && google.maps.LatLngBounds) {
      if (originCoords) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(originCoords);
        bounds.extend(destCoords);
        map.fitBounds(bounds, {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        });
      } else {
        map.setCenter(destCoords);
        map.setZoom(12);
      }
    }
  }, [map, originCoords, destCoords]);

  return null;
};

export const GoogleOverviewRouteMap: React.FC<GoogleOverviewRouteMapProps> = ({
  trip,
  currency,
  height = '480px',
  className = '',
  onExploreTransit,
}) => {
  const apiKey = getGoogleMapsApiKey();
  const isKeyConfigured = Boolean(apiKey && apiKey.length > 10);

  const destName = trip?.destination?.trim() || '';
  const originName = trip?.origin?.trim() || '';

  const [destCoords, setDestCoords] = useState<MapCoordinate | null>(() => {
    const sync = resolveCoordinates(destName);
    return sync ? { lat: sync.lat, lng: sync.lon } : null;
  });

  const [originCoords, setOriginCoords] = useState<MapCoordinate | null>(() => {
    const sync = resolveCoordinates(originName);
    return sync ? { lat: sync.lat, lng: sync.lon } : null;
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Synchronously or asynchronously resolve coordinates whenever destination or origin changes
  useEffect(() => {
    if (!destName) {
      setDestCoords(null);
      setGeocodingError(null);
      return;
    }

    let isCancelled = false;

    // Check synchronous cache first
    const syncDest = resolveCoordinates(destName);
    const syncOrig = originName ? resolveCoordinates(originName) : null;

    if (syncDest) {
      setDestCoords({ lat: syncDest.lat, lng: syncDest.lon });
      if (syncOrig) {
        setOriginCoords({ lat: syncOrig.lat, lng: syncOrig.lon });
      }
      setGeocodingError(null);
      setIsGeocoding(false);
      return;
    }

    // Otherwise initiate async geocoding
    setIsGeocoding(true);
    setGeocodingError(null);

    Promise.all([
      geocodePlace(destName),
      originName ? geocodePlace(originName) : Promise.resolve(null),
    ])
      .then(([resDest, resOrig]) => {
        if (isCancelled) return;
        setIsGeocoding(false);

        if (resDest) {
          setDestCoords({ lat: resDest.lat, lng: resDest.lon });
          if (resOrig) {
            setOriginCoords({ lat: resOrig.lat, lng: resOrig.lon });
          }
          setGeocodingError(null);
        } else {
          setGeocodingError(`Unable to locate coordinates for destination "${destName}". Please check the spelling or select a verified place.`);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setIsGeocoding(false);
        console.error('[GoogleOverviewRouteMap] Geocoding failure:', err);
        setGeocodingError(`Geocoding service unavailable for "${destName}".`);
      });

    return () => {
      isCancelled = true;
    };
  }, [destName, originName, retryNonce]);

  // Compute corridor distance and curved arc
  const distanceKm = useMemo(() => {
    if (!destCoords) return 0;
    if (!originCoords) return 0;
    return Math.round(
      calculateDistanceKm(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      )
    );
  }, [originCoords, destCoords]);

  const arcPath = useMemo(() => {
    if (!originCoords || !destCoords) return [];
    return createCurvedArc(originCoords, destCoords, 30);
  }, [originCoords, destCoords]);

  // Transit route details
  const selectedFlight = trip?.selectedFlight;
  const transportMode =
    trip?.selectedRoute?.legs?.[0]?.mode || (distanceKm > 600 ? 'flight' : 'drive');

  // Google Maps corridor URL
  const googleMapsRouteUrl = useMemo(() => {
    if (!destCoords) return '';
    return buildGoogleMapsDirectionsUrl(
      originCoords || originName || 'Current Location',
      destCoords,
      {
        travelMode: transportMode === 'flight' ? 'transit' : 'driving',
      }
    );
  }, [originCoords, originName, destCoords, transportMode]);

  // Neutral empty state if no destination is selected
  if (!destName) {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-slate-50 border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center p-8 text-center ${className}`}
        style={{ minHeight: height }}
      >
        <div className="w-14 h-14 rounded-2xl bg-cyan-100/60 text-[#0891B2] flex items-center justify-center mb-3 shadow-2xs">
          <span className="material-symbols-outlined text-3xl">map</span>
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">No Destination Selected</h3>
        <p className="text-xs text-[#64748B] max-w-sm mt-1">
          Select or search for a destination in the Trip Planner to view live interactive routes, terrain mapping, and travel corridors.
        </p>
      </div>
    );
  }

  // Geocoding error state
  if (geocodingError && !destCoords) {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-rose-50/50 border border-rose-200 flex flex-col items-center justify-center p-8 text-center ${className}`}
        style={{ minHeight: height }}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl">location_off</span>
        </div>
        <h3 className="text-sm font-bold text-[#0F172A]">Destination Not Found</h3>
        <p className="text-xs text-rose-700 max-w-md mt-1 mb-4">{geocodingError}</p>
        <button
          type="button"
          onClick={() => setRetryNonce((n) => n + 1)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          <span>Retry Location Geocoding</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-white border border-[#E2E8F0] shadow-sm flex flex-col ${className}`}
      style={{ minHeight: height }}
    >
      {/* Top Corridor Status Header */}
      <div className="p-3.5 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0891B2] to-[#7C3AED] flex items-center justify-center text-white shadow-2xs">
            <span className="material-symbols-outlined text-lg">
              {transportMode === 'flight' ? 'flight_takeoff' : 'directions_car'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">
                {originName ? `${originName.split(',')[0]} → ` : ''}{destName.split(',')[0]} Corridor
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                {transportMode === 'flight' ? 'Aviation Corridor' : 'Overland Transit'}
              </span>
            </div>
            <p className="text-[10px] text-[#64748B]">
              {distanceKm > 0 ? `Corridor Distance: ${distanceKm.toLocaleString()} km · ` : ''}
              {destName}
            </p>
          </div>
        </div>

        {/* Telemetry Actions */}
        <div className="flex items-center gap-2">
          {onExploreTransit && (
            <button
              type="button"
              onClick={onExploreTransit}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-[#CBD5E1] transition-colors"
            >
              Transit Options
            </button>
          )}

          {googleMapsRouteUrl && (
            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-xs">navigation</span>
              <span>Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Map View */}
      <div className="relative flex-1 w-full" style={{ height: height }}>
        {isGeocoding && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#0891B2]">sync</span>
            <span className="text-xs font-medium text-[#64748B] mt-2">Geocoding {destName}...</span>
          </div>
        )}

        {isKeyConfigured && destCoords ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={destCoords}
              defaultZoom={originCoords ? 6 : 12}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              fullscreenControl={false}
              streetViewControl={false}
              mapTypeControl={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
              <CorridorBoundsController
                originCoords={originCoords}
                destCoords={destCoords}
              />

              {/* Transit Arc / Line between origin and destination */}
              {originCoords && (
                <Polyline
                  path={transportMode === 'flight' ? arcPath : [originCoords, destCoords]}
                  strokeColor={transportMode === 'flight' ? '#2A9D8F' : '#D4A24C'}
                  strokeOpacity={0.9}
                  strokeWeight={transportMode === 'flight' ? 3.5 : 4}
                />
              )}

              {/* Origin Marker (Teal) */}
              {originCoords && (
                <AdvancedMarker position={originCoords} title={`Origin: ${originName}`}>
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div className="bg-[#2A9D8F] text-white p-2 rounded-full shadow-lg border-2 border-white ring-2 ring-[#2A9D8F]/30 transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-base leading-none">flight_takeoff</span>
                    </div>
                    <span className="mt-1 bg-[#14213D] text-[#FBF6EE] text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                      {originName.split(',')[0]} (Origin)
                    </span>
                  </div>
                </AdvancedMarker>
              )}

              {/* Destination Marker (Terracotta) */}
              <AdvancedMarker position={destCoords} title={`Destination: ${destName}`}>
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className="bg-[#E76F51] text-white p-2 rounded-full shadow-lg border-2 border-white ring-2 ring-[#E76F51]/30 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-base leading-none">location_on</span>
                  </div>
                  <span className="mt-1 bg-[#E76F51] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                    {destName.split(',')[0]} (Destination)
                  </span>
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* Zero-key Fallback UI */
          <div className="absolute inset-0 bg-[#FBF6EE] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[rgba(20,33,61,0.12)] text-[#D4A24C] flex items-center justify-center mb-3 shadow-xs">
              <span className="material-symbols-outlined text-2xl">route</span>
            </div>
            <h3 className="font-serif-heading text-sm font-bold text-[#14213D]">
              {originName ? `${originName.split(',')[0]} to ` : ''}{destName.split(',')[0]} Corridor Ready
            </h3>
            <p className="text-xs text-[#6B6F80] max-w-md mt-1 mb-4 leading-relaxed">
              {distanceKm > 0 ? `Direct ${distanceKm.toLocaleString()} km travel route calculated. ` : ''}
              Launch Google Maps navigation with live traffic, flight schedules, and transit connections.
            </p>
            {googleMapsRouteUrl && (
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#E76F51] hover:bg-[#de6344] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-px active:scale-98"
              >
                <span className="material-symbols-outlined text-sm">navigation</span>
                <span>Open Complete Corridor in Google Maps</span>
              </a>
            )}
          </div>
        )}

        {/* Floating Telemetry HUD (Bottom-Left) */}
        {distanceKm > 0 && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[rgba(20,33,61,0.12)] shadow-[0_10px_30px_rgba(20,33,61,0.10)] max-w-xs space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#6B6F80] border-b border-[rgba(20,33,61,0.08)] pb-1">
              <span className="font-bold text-[#14213D] uppercase tracking-wider">Corridor Telemetry</span>
              <span className="font-semibold text-[#2A9D8F] font-mono">{distanceKm} km</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[#6B6F80] block text-[9px]">Operator / Route</span>
                <span className="font-bold text-[#14213D] truncate block">
                  {selectedFlight ? selectedFlight.operator : 'Commercial Transit'}
                </span>
              </div>
              <div>
                <span className="text-[#6B6F80] block text-[9px]">Duration</span>
                <span className="font-bold text-[#14213D]">
                  {selectedFlight ? selectedFlight.duration : `${Math.round(distanceKm / 80)}h overland`}
                </span>
              </div>
            </div>
            {selectedFlight && (
              <div className="pt-1 border-t border-[rgba(20,33,61,0.08)] flex items-center justify-between text-[10px]">
                <span className="text-[#6B6F80]">Total Fare:</span>
                <span className="font-bold text-[#D4A24C] font-mono">
                  {formatCurrency(selectedFlight.price, currency)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
