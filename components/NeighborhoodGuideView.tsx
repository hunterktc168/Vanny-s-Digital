'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiIsLoaded,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Beer,
  Briefcase,
  Check,
  Coffee,
  Compass,
  Copy,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
  Utensils,
} from 'lucide-react';

// Toul Tom Pong (Russian Market area), Phnom Penh
const VANNY_TTP_HUB: google.maps.LatLngLiteral = {
  lat: 11.5403,
  lng: 104.9143,
};

type SpotCategory = 'cafe' | 'bar' | 'restaurant' | 'coworking';
type CategoryFilter = 'all' | SpotCategory;

interface GuidePlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  category: SpotCategory;
  featuredSpot?: boolean;
  rating?: number | null;
  userRatingCount?: number | null;
  primaryTypeDisplayName?: string;
  googleMapsURI?: string;
}

interface RoutePreview {
  destinationName: string;
  mode: 'WALKING' | 'DRIVING';
  distanceKm: string;
  durationMinutes: number;
}

const CATEGORY_META: Record<
  SpotCategory,
  {
    label: string;
    pinBg: string;
    pinBorder: string;
    badgeText: string;
  }
> = {
  cafe: {
    label: 'Cafe',
    pinBg: '#b45309',
    pinBorder: '#78350f',
    badgeText: 'text-amber-800',
  },
  bar: {
    label: 'Bar & Nightlife',
    pinBg: '#7c3aed',
    pinBorder: '#4c1d95',
    badgeText: 'text-violet-800',
  },
  restaurant: {
    label: 'Restaurant',
    pinBg: '#be123c',
    pinBorder: '#881337',
    badgeText: 'text-rose-800',
  },
  coworking: {
    label: 'Co-working',
    pinBg: '#0369a1',
    pinBorder: '#0c4a6e',
    badgeText: 'text-sky-800',
  },
};

const FEATURED_PLACE_QUERIES: Array<{
  query: string;
  category: SpotCategory;
}> = [
  { query: 'Concept Cafe Phnom Penh', category: 'cafe' },
  { query: 'The Slay Phnom Penh', category: 'bar' },
  { query: 'Bang Bang Phnom Penh', category: 'bar' },
];

const CATEGORY_DISCOVERY_QUERIES: Array<{
  category: SpotCategory;
  textQuery?: string;
  includedPrimaryTypes?: string[];
}> = [
  {
    category: 'cafe',
    includedPrimaryTypes: ['cafe', 'coffee_shop'],
  },
  {
    category: 'bar',
    includedPrimaryTypes: ['bar', 'pub', 'night_club'],
  },
  {
    category: 'restaurant',
    includedPrimaryTypes: ['restaurant'],
  },
  {
    category: 'coworking',
    textQuery: 'coworking space Toul Tom Pong Phnom Penh',
  },
];

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

function HubPinMarker() {
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
        <InfoWindow
          anchor={marker}
          maxWidth={240}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-1 space-y-1 text-slate-900">
            <p className="text-xs font-semibold">Vanny&apos;s Peaceful Guesthouse</p>
            <p className="text-[11px] text-slate-600">
              Home Base · Toul Tom Pong, Phnom Penh
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function GuideSpotMarker({
  spot,
  selected,
  onSelect,
  onRouteFromHub,
}: {
  spot: GuidePlace;
  selected: boolean;
  onSelect: (spot: GuidePlace | null) => void;
  onRouteFromHub: (spot: GuidePlace, mode: 'WALKING' | 'DRIVING') => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const meta = CATEGORY_META[spot.category];

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={spot.location}
        title={spot.displayName}
        onClick={() => onSelect(selected ? null : spot)}
      >
        <Pin
          background={meta.pinBg}
          borderColor={meta.pinBorder}
          glyphColor="#ffffff"
          scale={selected ? 1.2 : spot.featuredSpot ? 1.05 : 0.92}
        />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={270}
          onCloseClick={() => onSelect(null)}
        >
          <div className="p-1 space-y-1.5 text-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                {meta.label}
                {spot.featuredSpot ? ' · Featured' : ''}
              </span>
              {typeof spot.rating === 'number' && (
                <span className="text-[11px] font-mono tabular-nums text-slate-700">
                  ★ {spot.rating.toFixed(1)} ({spot.userRatingCount ?? 0})
                </span>
              )}
            </div>
            <p className="text-xs font-semibold leading-snug">{spot.displayName}</p>
            {spot.formattedAddress && (
              <p className="text-[11px] text-slate-600 leading-snug">
                {spot.formattedAddress}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onRouteFromHub(spot, 'WALKING')}
                className="px-2 py-1 rounded bg-teal-700 text-white text-[11px] font-medium hover:bg-teal-800 cursor-pointer"
              >
                Walk Route
              </button>
              <button
                type="button"
                onClick={() => onRouteFromHub(spot, 'DRIVING')}
                className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 text-[11px] font-medium hover:bg-slate-50 cursor-pointer"
              >
                Tuk-Tuk
              </button>
              {spot.googleMapsURI && (
                <a
                  href={spot.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[11px] font-medium text-teal-700 hover:underline"
                >
                  Maps &rarr;
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function NeighborhoodGuideWorkspace() {
  const map = useMap();
  const isLoaded = useApiIsLoaded();
  const loadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');

  const [spots, setSpots] = useState<GuidePlace[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<GuidePlace | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const mapRawPlace = (
    p: google.maps.places.Place,
    category: SpotCategory,
    featuredSpot = false
  ): GuidePlace | null => {
    if (!p.location) return null;
    return {
      id: p.id,
      displayName: p.displayName ?? 'Unnamed Venue',
      formattedAddress: p.formattedAddress ?? '',
      location: { lat: p.location.lat(), lng: p.location.lng() },
      category,
      featuredSpot,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      primaryTypeDisplayName: p.primaryTypeDisplayName ?? undefined,
      googleMapsURI: p.googleMapsURI ?? undefined,
    };
  };

  const fitMapToSpots = useCallback(
    (items: GuidePlace[]) => {
      if (!map || !coreLib || items.length === 0) return;
      const bounds = new coreLib.LatLngBounds();
      bounds.extend(VANNY_TTP_HUB);
      for (const item of items) {
        bounds.extend(item.location);
      }
      map.fitBounds(bounds, 48);
    },
    [map, coreLib]
  );

  const latestLoadIdRef = useRef(0);

  const loadNeighborhoodSpots = useCallback(async () => {
    if (!placesLib) return;
    const loadId = ++latestLoadIdRef.current;
    setIsLoadingPlaces(true);
    setPlacesError(null);

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

    try {
      const featuredPromises = FEATURED_PLACE_QUERIES.map(async (item) => {
        const resp = await placesLib.Place.searchByText({
          textQuery: item.query,
          fields,
          locationBias: { center: VANNY_TTP_HUB, radius: 1800 },
          maxResultCount: 1,
          language: 'en',
          region: 'KH',
        });
        const top = resp.places?.[0];
        return top ? mapRawPlace(top, item.category, true) : null;
      });

      const discoveryPromises = CATEGORY_DISCOVERY_QUERIES.map(async (cat) => {
        if (cat.textQuery) {
          const resp = await placesLib.Place.searchByText({
            textQuery: cat.textQuery,
            fields,
            locationBias: { center: VANNY_TTP_HUB, radius: 1500 },
            maxResultCount: 6,
            language: 'en',
            region: 'KH',
          });
          return (resp.places ?? [])
            .map((p) => mapRawPlace(p, cat.category, false))
            .filter((x): x is GuidePlace => x !== null);
        }

        const resp = await placesLib.Place.searchNearby({
          locationRestriction: { center: VANNY_TTP_HUB, radius: 1100 },
          includedPrimaryTypes: cat.includedPrimaryTypes,
          fields,
          maxResultCount: 6,
          language: 'en',
          region: 'KH',
        });
        return (resp.places ?? [])
          .map((p) => mapRawPlace(p, cat.category, false))
          .filter((x): x is GuidePlace => x !== null);
      });

      const [featuredSettled, discoverySettled] = await Promise.all([
        Promise.allSettled(featuredPromises),
        Promise.allSettled(discoveryPromises),
      ]);

      if (loadId !== latestLoadIdRef.current) return;

      const seenIds: Record<string, boolean> = {};
      const combined: GuidePlace[] = [];
      let firstError: unknown = null;

      for (const res of featuredSettled) {
        if (res.status === 'fulfilled') {
          const spot = res.value;
          if (spot && !seenIds[spot.id]) {
            seenIds[spot.id] = true;
            combined.push(spot);
          }
        } else {
          checkQuotaError(res.reason);
          if (!firstError) firstError = res.reason;
        }
      }

      for (const res of discoverySettled) {
        if (res.status === 'fulfilled') {
          for (const spot of res.value) {
            if (!seenIds[spot.id]) {
              seenIds[spot.id] = true;
              combined.push(spot);
            }
          }
        } else {
          checkQuotaError(res.reason);
          if (!firstError) firstError = res.reason;
        }
      }

      if (combined.length === 0 && firstError) {
        setPlacesError(
          firstError instanceof Error
            ? firstError.message
            : 'Unable to load Toul Tom Pong neighborhood places.'
        );
      } else {
        setSpots(combined);
        fitMapToSpots(combined);
      }
    } catch (err) {
      if (loadId !== latestLoadIdRef.current) return;
      checkQuotaError(err);
      setPlacesError(
        err instanceof Error
          ? err.message
          : 'Unable to load Toul Tom Pong neighborhood places.'
      );
    } finally {
      if (loadId === latestLoadIdRef.current) {
        setIsLoadingPlaces(false);
      }
    }
  }, [placesLib, fitMapToSpots]);

  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    if (!placesLib || !isLoaded || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;
    queueMicrotask(() => {
      void loadNeighborhoodSpots();
    });
  }, [placesLib, isLoaded, loadNeighborhoodSpots]);

  const handleComputeRouteFromHub = useCallback(
    async (spot: GuidePlace, mode: 'WALKING' | 'DRIVING') => {
      if (!routesLib || !map) return;
      clearPolylines();
      setIsRouting(true);
      setRouteError(null);

      try {
        const sdkMode =
          mode === 'WALKING'
            ? routesLib.TravelMode.WALKING
            : routesLib.TravelMode.DRIVING;

        const { routes } = await routesLib.Route.computeRoutes({
          origin: VANNY_TTP_HUB,
          destination: spot.location,
          travelMode: sdkMode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        });

        if (!routes || routes.length === 0) {
          setRouteError('No route available for this location.');
          return;
        }

        const primaryRoute = routes[0];
        const polylines = primaryRoute.createPolylines({
          polylineOptions: {
            strokeColor: '#0f766e',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
        });
        for (const poly of polylines) {
          poly.setMap(map);
        }
        polylinesRef.current = polylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 60);
        }

        const distanceKm = ((primaryRoute.distanceMeters ?? 0) / 1000).toFixed(2);
        const durationMinutes = Math.max(
          1,
          Math.round((primaryRoute.durationMillis ?? 0) / 60000)
        );

        setRoutePreview({
          destinationName: spot.displayName,
          mode,
          distanceKm,
          durationMinutes,
        });
      } catch (err) {
        checkQuotaError(err);
        setRouteError(
          err instanceof Error
            ? err.message
            : 'Unable to calculate route from guesthouse.'
        );
      } finally {
        setIsRouting(false);
      }
    },
    [routesLib, map, clearPolylines]
  );

  const handleCopySpotRecommendation = async (spot: GuidePlace) => {
    const ratingPart =
      typeof spot.rating === 'number'
        ? ` (${spot.rating.toFixed(1)}★ on Google Maps)`
        : '';
    const mapLinkPart = spot.googleMapsURI ? `\nMap: ${spot.googleMapsURI}` : '';
    const addressPart = spot.formattedAddress ? `\n${spot.formattedAddress}` : '';
    const text = `Toul Tom Pong Recommendation from Vanny's Peaceful Guesthouse:\n${spot.displayName} — ${CATEGORY_META[spot.category].label}${ratingPart}${addressPart}${mapLinkPart}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(spot.id);
      setTimeout(
        () => setCopiedId((prev) => (prev === spot.id ? null : prev)),
        2000
      );
    } catch {
      // Clipboard blocked
    }
  };

  const filteredSpots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return spots.filter((spot) => {
      const matchesCategory =
        activeFilter === 'all' || spot.category === activeFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        spot.displayName.toLowerCase().includes(q) ||
        spot.formattedAddress.toLowerCase().includes(q) ||
        CATEGORY_META[spot.category].label.toLowerCase().includes(q)
      );
    });
  }, [spots, activeFilter, searchTerm]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: spots.length,
      cafe: 0,
      bar: 0,
      restaurant: 0,
      coworking: 0,
    };
    for (const s of spots) {
      counts[s.category] += 1;
    }
    return counts;
  }, [spots]);

  const handleSelectFilter = (nextFilter: CategoryFilter) => {
    setActiveFilter(nextFilter);
    setSelectedSpot(null);
    const matching =
      nextFilter === 'all'
        ? spots
        : spots.filter((s) => s.category === nextFilter);
    if (matching.length > 0) {
      fitMapToSpots(matching);
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
          Verify your Google Maps API key configuration and enabled APIs (Maps JS,
          Places New, Routes).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-teal-700">
                Toul Tom Pong Concierge
              </span>
              <span aria-hidden="true">·</span>
              <span>Live Google Places Pins</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Toul Tom Pong Neighborhood Guide
            </h1>
            <p className="text-sm text-slate-600">
              Curated live map pins around Vanny&apos;s Peaceful Guesthouse including{' '}
              <span className="font-medium text-slate-800">Concept Cafe</span>,{' '}
              <span className="font-medium text-slate-800">The Slay</span>, and{' '}
              <span className="font-medium text-slate-800">Bang Bang</span> alongside
              top cafes, bars, restaurants, and co-working spaces.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter spots (e.g. Concept Cafe)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadNeighborhoodSpots()}
              disabled={isLoadingPlaces}
              title="Refresh live Google Places pins"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingPlaces ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Category Tabs & Color Legend */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-slate-100">
          <div
            role="tablist"
            aria-label="Neighborhood spot categories"
            className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg self-start"
          >
            {(
              [
                { id: 'all', label: 'All Spots', Icon: Compass },
                { id: 'cafe', label: 'Cafes', Icon: Coffee },
                { id: 'bar', label: 'Bars & Nightlife', Icon: Beer },
                { id: 'restaurant', label: 'Restaurants', Icon: Utensils },
                { id: 'coworking', label: 'Co-working', Icon: Briefcase },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectFilter(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    {categoryCounts[id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pin Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]" />
              <span>Vanny&apos;s Hub</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
              <span>Cafes</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
              <span>Bars</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#be123c]" />
              <span>Restaurants</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1]" />
              <span>Co-working</span>
            </span>
          </div>
        </div>
      </section>

      {/* Active Route Summary Banner */}
      {(routePreview || routeError || isRouting) && (
        <section className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {routeError ? (
            <p className="text-xs font-medium text-red-700">{routeError}</p>
          ) : isRouting ? (
            <p className="text-xs text-slate-600 inline-flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
              <span>Calculating route from Vanny&apos;s Peaceful Guesthouse...</span>
            </p>
          ) : routePreview ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500">
                  From Vanny&apos;s Peaceful Guesthouse &rarr;{' '}
                  {routePreview.destinationName}
                </p>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                  {routePreview.distanceKm} km · ~{routePreview.durationMinutes} mins (
                  {routePreview.mode === 'WALKING'
                    ? 'Walking'
                    : 'Tuk-Tuk / Driving'}
                  )
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearPolylines();
                  setRoutePreview(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
              >
                Clear Route
              </button>
            </>
          ) : null}
        </section>
      )}

      {/* Unified Map + Pinned Venues Directory */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 h-[480px] lg:h-[620px] relative">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={VANNY_TTP_HUB}
            defaultZoom={15}
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <HubPinMarker />
            {filteredSpots.map((spot) => (
              <GuideSpotMarker
                key={spot.id}
                spot={spot}
                selected={selectedSpot?.id === spot.id}
                onSelect={setSelectedSpot}
                onRouteFromHub={(target, mode) =>
                  void handleComputeRouteFromHub(target, mode)
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

        {/* Venue Directory */}
        <aside className="lg:col-span-5 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-hidden h-[480px] lg:h-[620px]">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pinned TTP Locations
              </h2>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                {filteredSpots.length} live Google Maps pins
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {placesError ? (
              <div className="p-5 text-xs text-red-700 space-y-1.5">
                <p className="font-semibold">Places loading error</p>
                <p>{placesError}</p>
              </div>
            ) : isLoadingPlaces && spots.length === 0 ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filteredSpots.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Compass className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-700">
                  No matching spots
                </p>
                <p className="text-xs text-slate-500">
                  Clear the search filter or switch back to All Spots.
                </p>
              </div>
            ) : (
              filteredSpots.map((spot) => {
                const isSelected = selectedSpot?.id === spot.id;
                const meta = CATEGORY_META[spot.category];
                const isCopied = copiedId === spot.id;

                return (
                  <div
                    key={spot.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpot(spot);
                        map?.panTo(spot.location);
                        map?.setZoom(16);
                      }}
                      className="w-full text-left space-y-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {spot.displayName}
                        </span>
                        {typeof spot.rating === 'number' && (
                          <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-slate-700 shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{spot.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`font-medium ${meta.badgeText}`}>
                          {meta.label}
                        </span>
                        {spot.featuredSpot && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-medium text-teal-700">
                              Featured TTP Highlight
                            </span>
                          </>
                        )}
                      </div>

                      {spot.formattedAddress && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {spot.formattedAddress}
                        </p>
                      )}
                    </button>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleComputeRouteFromHub(spot, 'WALKING')
                        }
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Walk Time
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleComputeRouteFromHub(spot, 'DRIVING')
                        }
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Tuk-Tuk
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopySpotRecommendation(spot)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer ml-auto"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
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

export default function NeighborhoodGuideView({ apiKey }: { apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <Compass className="w-7 h-7 text-slate-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-900">
          Google Maps API Key Not Available
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Configure or restart the server environment with your Google Maps Platform
          API key to pin Toul Tom Pong cafes, bars, restaurants, and co-working
          spaces.
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
      <NeighborhoodGuideWorkspace />
    </APIProvider>
  );
}
