'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Check,
  Copy,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';

// Toul Tom Pong (Russian Market area), Phnom Penh
const VANNY_TTP_HUB: google.maps.LatLngLiteral = {
  lat: 11.5403,
  lng: 104.9143,
};

interface PlaceCategory {
  id: string;
  label: string;
  includedPrimaryTypes?: string[];
  textQuery?: string;
}

const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: 'coffee',
    label: 'Specialty Coffee',
    includedPrimaryTypes: ['cafe', 'coffee_shop'],
  },
  {
    id: 'coworking',
    label: 'Coworking & Study',
    textQuery: 'coworking space Toul Tom Pong Phnom Penh',
  },
  {
    id: 'atm',
    label: 'ATMs & Banking',
    includedPrimaryTypes: ['atm', 'bank'],
  },
  {
    id: 'gym',
    label: 'Gyms & Fitness',
    includedPrimaryTypes: ['gym', 'fitness_center'],
  },
  {
    id: 'dining',
    label: 'Nomad Dining',
    includedPrimaryTypes: ['restaurant'],
  },
];

interface ArrivalOrigin {
  id: string;
  label: string;
  queryOrCoords: string | google.maps.LatLngLiteral;
}

const ARRIVAL_ORIGINS: ArrivalOrigin[] = [
  {
    id: 'pnh',
    label: "Phnom Penh Int'l Airport (PNH)",
    queryOrCoords: 'Phnom Penh International Airport, Phnom Penh, Cambodia',
  },
  {
    id: 'kti',
    label: "Techo Int'l Airport (KTI)",
    queryOrCoords: 'Techo International Airport, Cambodia',
  },
  {
    id: 'riverside',
    label: 'Riverside / Sisowath Quay',
    queryOrCoords: { lat: 11.5688, lng: 104.9311 },
  },
];

interface DiscoveredPlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  rating?: number | null;
  userRatingCount?: number | null;
  primaryTypeDisplayName?: string;
  googleMapsURI?: string;
}

interface ComputedRouteSummary {
  originLabel: string;
  destinationLabel: string;
  travelMode: 'DRIVING' | 'WALKING';
  distanceKm: string;
  durationMinutes: number;
}

function checkQuotaError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

function PlaceMarkerWithInfo({
  place,
  selected,
  onSelect,
  onRouteFromHub,
}: {
  place: DiscoveredPlace;
  selected: boolean;
  onSelect: (p: DiscoveredPlace) => void;
  onRouteFromHub: (p: DiscoveredPlace, mode: 'DRIVING' | 'WALKING') => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.displayName}
        onClick={() => onSelect(place)}
      >
        <Pin
          background={selected ? '#0f766e' : '#1e293b'}
          borderColor={selected ? '#115e59' : '#0f172a'}
          glyphColor="#ffffff"
          scale={selected ? 1.15 : 0.95}
        />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => onSelect(place)}
        >
          <div className="p-1 space-y-1.5 text-slate-900">
            <p className="text-xs font-semibold">{place.displayName}</p>
            {place.formattedAddress && (
              <p className="text-[11px] text-slate-600 leading-snug">
                {place.formattedAddress}
              </p>
            )}
            {typeof place.rating === 'number' && (
              <p className="text-[11px] font-mono tabular-nums text-slate-700">
                Rating: {place.rating.toFixed(1)} ({place.userRatingCount ?? 0})
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onRouteFromHub(place, 'WALKING')}
                className="px-2 py-1 rounded bg-teal-700 text-white text-[11px] font-medium hover:bg-teal-800 cursor-pointer"
              >
                Walk Route
              </button>
              <button
                type="button"
                onClick={() => onRouteFromHub(place, 'DRIVING')}
                className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 text-[11px] font-medium hover:bg-slate-50 cursor-pointer"
              >
                Tuk-Tuk Route
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function HubMarker() {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={VANNY_TTP_HUB}
        title="Vanny's Peaceful Guesthouse (Toul Tom Pong)"
        onClick={() => setOpen((v) => !v)}
      >
        <Pin
          background="#0f766e"
          borderColor="#042f2e"
          glyphColor="#ffffff"
          scale={1.25}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} maxWidth={240} onCloseClick={() => setOpen(false)}>
          <div className="p-1 space-y-1 text-slate-900">
            <p className="text-xs font-semibold">Vanny&apos;s Peaceful Guesthouse</p>
            <p className="text-[11px] text-slate-600">
              Toul Tom Pong (Russian Market), Phnom Penh
            </p>
            <p className="text-[11px] font-mono tabular-nums text-teal-700">
              11.5403° N, 104.9143° E
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function TtpMapWorkspace() {
  const map = useMap();
  const isLoaded = useApiIsLoaded();
  const loadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');

  const [activeCategory, setActiveCategory] = useState<string>('coffee');
  const [customQuery, setCustomQuery] = useState('');
  const [places, setPlaces] = useState<DiscoveredPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<DiscoveredPlace | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [selectedOriginId, setSelectedOriginId] = useState<string>('pnh');
  const [routeMode, setRouteMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<ComputedRouteSummary | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [copiedRoute, setCopiedRoute] = useState(false);

  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const clearPolylines = useCallback(() => {
    for (const poly of polylinesRef.current) {
      poly.setMap(null);
    }
    polylinesRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearPolylines();
    };
  }, [clearPolylines]);

  const mapPlacesResponse = (rawPlaces: google.maps.places.Place[]): DiscoveredPlace[] => {
    const mapped: DiscoveredPlace[] = [];
    for (const p of rawPlaces) {
      const loc = p.location;
      if (!loc) continue;
      mapped.push({
        id: p.id,
        displayName: p.displayName ?? 'Unnamed Place',
        formattedAddress: p.formattedAddress ?? '',
        location: { lat: loc.lat(), lng: loc.lng() },
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        primaryTypeDisplayName: p.primaryTypeDisplayName ?? undefined,
        googleMapsURI: p.googleMapsURI ?? undefined,
      });
    }
    return mapped;
  };

  const runCategorySearch = useCallback(
    async (categoryId: string) => {
      if (!placesLib) return;
      const cat = PLACE_CATEGORIES.find((c) => c.id === categoryId) ?? PLACE_CATEGORIES[0];
      setActiveCategory(cat.id);
      setIsSearching(true);
      setPlacesError(null);
      setSelectedPlace(null);

      try {
        const fields = [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'primaryTypeDisplayName',
          'googleMapsURI',
        ];

        let foundPlaces: google.maps.places.Place[] = [];
        if (cat.textQuery) {
          const resp = await placesLib.Place.searchByText({
            textQuery: cat.textQuery,
            fields,
            locationBias: {
              center: VANNY_TTP_HUB,
              radius: 1500,
            },
            maxResultCount: 10,
            language: 'en',
            region: 'KH',
          });
          foundPlaces = resp.places ?? [];
        } else {
          const resp = await placesLib.Place.searchNearby({
            locationRestriction: {
              center: VANNY_TTP_HUB,
              radius: 1200,
            },
            includedPrimaryTypes: cat.includedPrimaryTypes,
            fields,
            maxResultCount: 10,
            language: 'en',
            region: 'KH',
          });
          foundPlaces = resp.places ?? [];
        }

        const mapped = mapPlacesResponse(foundPlaces);
        setPlaces(mapped);

        if (map && coreLib && mapped.length > 0) {
          const bounds = new coreLib.LatLngBounds();
          bounds.extend(VANNY_TTP_HUB);
          for (const item of mapped) {
            bounds.extend(item.location);
          }
          map.fitBounds(bounds, 48);
        }
      } catch (err) {
        checkQuotaError(err);
        setPlacesError(
          err instanceof Error ? err.message : 'Unable to fetch nearby Toul Tom Pong spots.'
        );
      } finally {
        setIsSearching(false);
      }
    },
    [placesLib, map, coreLib]
  );

  const runTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !customQuery.trim()) return;
    setIsSearching(true);
    setPlacesError(null);
    setSelectedPlace(null);

    try {
      const resp = await placesLib.Place.searchByText({
        textQuery: `${customQuery.trim()} near Toul Tom Pong Phnom Penh`,
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'primaryTypeDisplayName',
          'googleMapsURI',
        ],
        locationBias: {
          center: VANNY_TTP_HUB,
          radius: 2500,
        },
        maxResultCount: 10,
        language: 'en',
        region: 'KH',
      });
      const mapped = mapPlacesResponse(resp.places ?? []);
      setPlaces(mapped);

      if (map && coreLib && mapped.length > 0) {
        const bounds = new coreLib.LatLngBounds();
        bounds.extend(VANNY_TTP_HUB);
        for (const item of mapped) {
          bounds.extend(item.location);
        }
        map.fitBounds(bounds, 48);
      }
    } catch (err) {
      checkQuotaError(err);
      setPlacesError(err instanceof Error ? err.message : 'Place search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const initialSearchDoneRef = useRef(false);
  useEffect(() => {
    if (!placesLib || !isLoaded || initialSearchDoneRef.current) return;
    initialSearchDoneRef.current = true;
    queueMicrotask(() => {
      void runCategorySearch('coffee');
    });
  }, [placesLib, isLoaded, runCategorySearch]);

  const computeRoute = useCallback(
    async (
      origin: string | google.maps.LatLngLiteral,
      destination: string | google.maps.LatLngLiteral,
      originLabel: string,
      destinationLabel: string,
      mode: 'DRIVING' | 'WALKING'
    ) => {
      if (!routesLib || !map) return;
      clearPolylines();
      setIsRouting(true);
      setRouteError(null);

      try {
        const sdkTravelMode =
          mode === 'WALKING' ? routesLib.TravelMode.WALKING : routesLib.TravelMode.DRIVING;

        const { routes } = await routesLib.Route.computeRoutes({
          origin,
          destination,
          travelMode: sdkTravelMode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        });

        if (!routes || routes.length === 0) {
          setRouteError('No route returned for this pair.');
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines({
          polylineOptions: {
            strokeColor: '#0f766e',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
        });
        for (const poly of newPolylines) {
          poly.setMap(map);
        }
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 56);
        }

        const distKm = ((primaryRoute.distanceMeters ?? 0) / 1000).toFixed(2);
        const durMins = Math.max(1, Math.round((primaryRoute.durationMillis ?? 0) / 60000));

        setRouteSummary({
          originLabel,
          destinationLabel,
          travelMode: mode,
          distanceKm: distKm,
          durationMinutes: durMins,
        });
      } catch (err) {
        checkQuotaError(err);
        setRouteError(
          err instanceof Error
            ? err.message
            : 'Unable to load route data. Please check network or API permissions.'
        );
      } finally {
        setIsRouting(false);
      }
    },
    [routesLib, map, clearPolylines]
  );

  const handleArrivalRoute = () => {
    const originObj =
      ARRIVAL_ORIGINS.find((o) => o.id === selectedOriginId) ?? ARRIVAL_ORIGINS[0];
    void computeRoute(
      originObj.queryOrCoords,
      VANNY_TTP_HUB,
      originObj.label,
      "Vanny's Peaceful Guesthouse (TTP)",
      routeMode
    );
  };

  const handleCopyGuestRouteNote = async () => {
    if (!routeSummary) return;
    const modeLabel =
      routeSummary.travelMode === 'WALKING' ? 'walking' : 'by tuk-tuk / car';
    const note = `Directions note from Vanny's Peaceful Guesthouse (Toul Tom Pong): ${routeSummary.originLabel} to ${routeSummary.destinationLabel} is ${routeSummary.distanceKm} km (~${routeSummary.durationMinutes} mins ${modeLabel}).`;
    try {
      await navigator.clipboard.writeText(note);
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  if (
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-red-700">
          Google Maps failed to initialize
        </p>
        <p className="text-xs text-slate-600">
          Verify your Google Maps API key configuration and enabled APIs (Maps JS, Places New,
          Routes).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Toul Tom Pong Nomad Map &amp; Route Calculator
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Live Google Places discovery around Vanny&apos;s Peaceful Guesthouse and instant
              airport or local route estimates for Telegram guest replies.
            </p>
          </div>

          <form onSubmit={runTextSearch} className="flex items-center gap-2 shrink-0">
            <div className="relative w-64 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Search e.g. pharmacy, laundry, coffee"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !customQuery.trim()}
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Search TTP
            </button>
          </form>
        </div>

        {/* Category Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {PLACE_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => void runCategorySearch(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Arrival Transfer Route Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Phnom Penh arrival origin"
              value={selectedOriginId}
              onChange={(e) => setSelectedOriginId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              {ARRIVAL_ORIGINS.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  From: {origin.label}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setRouteMode('DRIVING')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  routeMode === 'DRIVING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Tuk-Tuk / Car
              </button>
              <button
                type="button"
                onClick={() => setRouteMode('WALKING')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  routeMode === 'WALKING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Walk
              </button>
            </div>

            <button
              type="button"
              onClick={handleArrivalRoute}
              disabled={isRouting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isRouting ? 'Calculating...' : 'Calculate Transfer'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Route Summary Banner (when active) */}
      {(routeSummary || routeError) && (
        <section className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {routeError ? (
            <p className="text-xs font-medium text-red-700">{routeError}</p>
          ) : routeSummary ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500">
                  {routeSummary.originLabel} &rarr; {routeSummary.destinationLabel}
                </p>
                <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
                  {routeSummary.distanceKm} km · ~{routeSummary.durationMinutes} mins (
                  {routeSummary.travelMode === 'WALKING' ? 'Walking' : 'Tuk-Tuk / Driving'})
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyGuestRouteNote}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedRoute ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Note</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Guest Route Note</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPolylines();
                    setRouteSummary(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </>
          ) : null}
        </section>
      )}

      {/* Main Unified Split: Interactive Google Map + Live Nearby Results List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 h-[500px] lg:h-[600px] relative">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={VANNY_TTP_HUB}
            defaultZoom={15}
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <HubMarker />
            {places.map((place) => (
              <PlaceMarkerWithInfo
                key={place.id}
                place={place}
                selected={selectedPlace?.id === place.id}
                onSelect={(p) =>
                  setSelectedPlace((prev) => (prev?.id === p.id ? null : p))
                }
                onRouteFromHub={(p, mode) =>
                  void computeRoute(
                    VANNY_TTP_HUB,
                    p.location,
                    "Vanny's Peaceful Guesthouse",
                    p.displayName,
                    mode
                  )
                }
              />
            ))}
          </GoogleMap>

          <button
            type="button"
            onClick={() => {
              map?.panTo(VANNY_TTP_HUB);
              map?.setZoom(15);
            }}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm text-xs font-medium text-slate-800 hover:bg-white cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-700" />
            <span>Recenter TTP Hub</span>
          </button>
        </div>

        {/* Live Places Sidebar List */}
        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-hidden h-[500px] lg:h-[600px]">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Nearby Toul Tom Pong Spots
              </h2>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                {places.length} live Google Places results
              </p>
            </div>
            <button
              type="button"
              onClick={() => void runCategorySearch(activeCategory)}
              disabled={isSearching}
              title="Refresh nearby places"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {placesError ? (
              <div className="p-5 text-xs text-red-700 space-y-2">
                <p className="font-medium">Places search error</p>
                <p>{placesError}</p>
              </div>
            ) : isSearching ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MapPin className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-700">No places returned</p>
                <p className="text-xs text-slate-500">
                  Try another category or broader Toul Tom Pong keyword.
                </p>
              </div>
            ) : (
              places.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                return (
                  <div
                    key={place.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(place);
                        map?.panTo(place.location);
                        map?.setZoom(16);
                      }}
                      className="w-full text-left space-y-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {place.displayName}
                        </span>
                        {typeof place.rating === 'number' && (
                          <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-slate-700 shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{place.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                      {place.primaryTypeDisplayName && (
                        <p className="text-[11px] font-medium text-teal-700">
                          {place.primaryTypeDisplayName}
                        </p>
                      )}
                      {place.formattedAddress && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {place.formattedAddress}
                        </p>
                      )}
                    </button>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void computeRoute(
                            VANNY_TTP_HUB,
                            place.location,
                            "Vanny's Peaceful Guesthouse",
                            place.displayName,
                            'WALKING'
                          )
                        }
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Walk Time
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void computeRoute(
                            VANNY_TTP_HUB,
                            place.location,
                            "Vanny's Peaceful Guesthouse",
                            place.displayName,
                            'DRIVING'
                          )
                        }
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Tuk-Tuk Time
                      </button>
                      {place.googleMapsURI && (
                        <a
                          href={place.googleMapsURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[11px] font-medium text-teal-700 hover:underline"
                        >
                          Maps &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function TtpMapExplorer({ apiKey }: { apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-900">
          Google Maps API Key Not Available
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Configure or restart the server environment with your Google Maps Platform API key to
          load live Toul Tom Pong maps, nearby places, and route times.
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language="en"
      region="KH"
      libraries={['places', 'routes', 'marker']}
    >
      <TtpMapWorkspace />
    </APIProvider>
  );
}
