import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SlidePanel from './SlidePanel';
import { destinations } from '../lib/data/destinations';

const ROME_SLIDE = {
  tag: 'Slide 01',
  subTitle: 'Destination - Rome',
  title: 'Colosseum',
  summary:
    'Ancient Roman amphitheater, the largest ever built. It anchors the transition from the Rome descent into the global destination journey.',
  points: [
    {
      label: 'Built',
      text: '70-80 AD',
    },
    {
      label: 'Location',
      text: 'Rome, Italy',
    },
  ],
  example:
    'Scroll onward to keep the same globe in view as it rotates through twelve historical and cultural stops.',
};

const ROME = [12.4964, 41.9028];
const COLOSSEUM = {
  center: [12.4922, 41.8902],
};
const EARTH_STYLE_URL = 'mapbox://styles/markjohn17/cmoyf4n2b003p01rfc3r655m4';
const CITY_MODEL_STYLE_URL = 'mapbox://styles/markjohn17/cmoyg3ev9000r01suak0y71v7';
const TERRAIN_SOURCE_ID = 'mapbox-dem';
const DESTINATION_ROUTE_SOURCE_ID = 'destination-route';
const DESTINATION_ROUTE_GLOW_LAYER_ID = 'destination-route-glow';
const DESTINATION_ROUTE_LINE_LAYER_ID = 'destination-route-line';
const EARTH_SCROLL_MOTION_MAX_ZOOM = 5.2;
const EARTH_IDLE_CENTER = [12.4922, 22];
const EARTH_ROTATION_DEGREES_PER_SECOND = 1.45;
const EARTH_MOTION_EASE = 0.012;
const LIGHT_PRESET = 'dusk';
const HIDDEN_LABEL_CONFIG = {
  showPlaceLabels: false,
  showAdminBoundaries: false,
  showRoadsAndTransit: false,
  showPedestrianRoads: false,
  showRoadLabels: false,
  showTransitLabels: false,
  showPointOfInterestLabels: false,
  densityPointOfInterestLabels: 1,
  fuelingStationModePointOfInterestLabels: 'none',
  backgroundPointOfInterestLabels: 'none',
};
const EARTH_BASEMAP_CONFIG = {
  ...HIDDEN_LABEL_CONFIG,
  lightPreset: LIGHT_PRESET,
  show3dObjects: false,
  show3dBuildings: false,
  show3dFacades: false,
  show3dLandmarks: false,
  show3dTrees: false,
  showIndoorLabels: false,
  showLandmarkIcons: false,
  showLandmarkIconLabels: false,
};
const CITY_BASEMAP_CONFIG = {
  ...HIDDEN_LABEL_CONFIG,
  theme: 'faded',
  lightPreset: LIGHT_PRESET,
  show3dObjects: true,
  show3dBuildings: true,
  show3dFacades: true,
  show3dLandmarks: true,
  show3dTrees: true,
  showIndoorLabels: false,
  showLandmarkIcons: false,
  showLandmarkIconLabels: false,
  colorBuildings: 'hsl(32, 18%, 55%)',
};
const LABEL_LAYER_PATTERN = /(label|boundary|admin|poi|place|road-number|road-shield|transit|airport)/i;

const waitForMoveEnd = (map) => new Promise((resolve) => {
  map.once('moveend', resolve);
});

const waitForStyleLoad = (map) => new Promise((resolve) => {
  if (map.isStyleLoaded()) {
    resolve();
    return;
  }

  map.once('style.load', resolve);
});

function safelyApply(callback) {
  try {
    callback();
    return true;
  } catch {
    return false;
  }
}

function hideLabelAndBoundaryLayers(map) {
  const layers = map.getStyle().layers || [];

  layers.forEach((layer) => {
    const shouldHideLayer = (
      (layer.type === 'symbol' && LABEL_LAYER_PATTERN.test(layer.id))
      || (layer.type === 'line' && /(boundary|admin)/i.test(layer.id))
    );

    if (shouldHideLayer) {
      safelyApply(() => map.setLayoutProperty(layer.id, 'visibility', 'none'));
    }
  });
}

function configureBasemapStyle(map, config) {
  safelyApply(() => map.setConfig('basemap', config));

  Object.entries(config).forEach(([property, value]) => {
    safelyApply(() => map.setConfigProperty('basemap', property, value));
  });

  hideLabelAndBoundaryLayers(map);
}

function setCinematicLights(map) {
  safelyApply(() => map.setLights([
    {
      id: 'cinematic-ambient',
      type: 'ambient',
      properties: {
        color: '#d6c4ff',
        intensity: 0.38,
      },
    },
    {
      id: 'cinematic-sun',
      type: 'directional',
      properties: {
        color: '#ffb36a',
        direction: [238, 54],
        intensity: 0.82,
        'cast-shadows': true,
        'shadow-intensity': 0.72,
        'shadow-quality': 0.9,
      },
    },
  ]));
}

function enableTerrainDepth(map) {
  if (!map.getSource(TERRAIN_SOURCE_ID)) {
    map.addSource(TERRAIN_SOURCE_ID, {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({
    source: TERRAIN_SOURCE_ID,
    exaggeration: [
      'interpolate',
      ['linear'],
      ['zoom'],
      6,
      0.32,
      12,
      0.18,
      15,
      0,
    ],
  });
}

function enhanceScene(map, config) {
  configureBasemapStyle(map, config);
  setCinematicLights(map);
  enableTerrainDepth(map);
}

function wrapLongitude(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerpLngLat = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const ROME_KEYFRAMES = {
  earth: {
    start: { center: EARTH_IDLE_CENTER, zoom: 1.35, pitch: 0, bearing: 0 },
    mid: { center: ROME, zoom: 5.5, pitch: 38, bearing: -16 },
  },
  city: {
    mid: { center: ROME, zoom: 5.5, pitch: 38, bearing: -16 },
    end: { center: COLOSSEUM.center, zoom: 16.6, pitch: 76, bearing: -32 },
  },
};

// Per-destination camera targets for automatic, non-scrubbed flights.
const DESTINATION_FLIGHT = {
  cityEnd: { zoom: 16.6, pitch: 76, bearing: -32 },
  islandBirdseye: { zoom: 14.2, pitch: 0, bearing: 0 },
  mobileIslandBirdseye: { zoom: 13.2, pitch: 0, bearing: 0 },
  mobileSnap: { zoom: 6.2, pitch: 0, bearing: 0 },
};

const DESTINATION_VIEW_OVERRIDES = {
  // Camera east, looking west across St. Peter's Square toward the basilica facade + dome.
  // Lower pitch silhouettes the dome against the sky.
  'saint-peters-basilica': { zoom: 16.5, pitch: 65, bearing: -90 },
  // Pin at real-world South Gate. Camera south of the gate at a steep pitch
  // so the gatehouse + barbican fill the frame, the wall extends east/west,
  // and the moat sits in the foreground — the iconic Yongning Gate view.
  'xian-city-wall': { zoom: 16.4, pitch: 72, bearing: 0 },
  // Front view of the south facade — the ceremonial main entrance via the
  // Puerta del Príncipe across Plaza de la Armería.
  'royal-palace-madrid': { zoom: 17.0, pitch: 70, bearing: 0 },
  // Head-on view of the Torbau gatehouse archway. Camera SE looking NW.
  'neuschwanstein-castle': { zoom: 17.3, pitch: 72, bearing: -45 },
  // Front view of the east facade (Mall / Victoria Memorial).
  'buckingham-palace': { zoom: 17.0, pitch: 72, bearing: -90 },
  // Head-on front view of Elizabeth Tower's north face, Palace of
  // Westminster as backdrop.
  'big-ben': { zoom: 17.4, pitch: 66, bearing: 180 },
  // Statue faces SE at ~116° azimuth — camera SE, looking NW at her face.
  'statue-of-liberty': { zoom: 17.4, pitch: 62, bearing: -64 },
  // Front view of the North Portico (Pennsylvania Avenue / official entry).
  'white-house': { zoom: 17.4, pitch: 68, bearing: 180 },
  // Pulled back so One WTC tower fits in frame with the surrounding Lower
  // Manhattan skyline instead of clipping the spire.
  'world-trade-center-nyc': { zoom: 15.8, pitch: 65, bearing: 180 },
  // 3D angled view of the island (no longer a flat satellite top-down).
  // Pitch 60 + city-model profile renders the fallback island extrusion.
  'san-salvador-island': { zoom: 14.5, pitch: 60, bearing: 0 },
};

const DESTINATION_FLIGHT_DURATION = 2200;
const DESTINATION_MOBILE_FLIGHT_DURATION = 1500;
const DESTINATION_ROUTE_GLOW_BASE_OPACITY = 0.26;
const DESTINATION_ROUTE_LINE_BASE_OPACITY = 0.86;

const emptyRouteData = {
  type: 'FeatureCollection',
  features: [],
};

// ─── Custom 3D fallback landmarks ──────────────────────────────────────────
// Mapbox's built-in `show3dLandmarks` only renders first-party landmark
// meshes for major cities. Destinations like Xi'an City Wall, the tiny
// San Salvador Island, and Magellan Landing Site have no 3D data, so at city-zoom
// the user would see nothing distinctive. These hand-crafted fill-extrusion
// shapes give each location a recognizable physical presence at the same
// scale as Mapbox's real landmarks.
const FALLBACK_LANDMARK_SOURCE_ID = 'codex-fallback-landmarks';
const FALLBACK_LANDMARK_LAYER_ID = 'codex-fallback-landmarks-extrusion';

function buildXianWallFeatures() {
  // Xi'an City Wall — focal-scale model. The real Ming-era perimeter is
  // ~3.5km × 2.7km, but at the cityEnd cinematic framing (zoom 16.6,
  // pitch 76, bearing -32) a wall ring that wide sits beyond the
  // foreground and Mapbox's natural city tiles fill the center of the
  // shot instead of our fortification. We collapse the ring to a
  // compact ~950m × 800m wall centered on the destination anchor so it
  // reads as the focal landmark in the frame — matching the "fortified
  // compound at center of view" reference. The walls are slightly
  // thickened and a taller south gate tower marks the face the camera
  // sweeps toward.
  const center = [108.9486, 34.2611];
  const halfW = 0.00475;  // ~435m east-west half (~870m total)
  const halfH = 0.00360;  // ~400m north-south half (~800m total)
  const tLon = 0.00022;   // ~20m wall thickness east-west
  const tLat = 0.00020;   // ~22m wall thickness north-south

  // Outer ring (counter-clockwise)
  const outer = [
    [center[0] - halfW, center[1] - halfH],
    [center[0] + halfW, center[1] - halfH],
    [center[0] + halfW, center[1] + halfH],
    [center[0] - halfW, center[1] + halfH],
    [center[0] - halfW, center[1] - halfH],
  ];
  // Inner ring / hole (clockwise — produces the wall donut)
  const inner = [
    [center[0] - halfW + tLon, center[1] - halfH + tLat],
    [center[0] - halfW + tLon, center[1] + halfH - tLat],
    [center[0] + halfW - tLon, center[1] + halfH - tLat],
    [center[0] + halfW - tLon, center[1] - halfH + tLat],
    [center[0] - halfW + tLon, center[1] - halfH + tLat],
  ];

  // South Gate Tower (Yongning-style) — straddles the south wall and rises
  // above it. The cinematic camera sweeps in from the southeast at
  // bearing -32, so a taller mass on the south face gives the shot a
  // recognizable focal landmark instead of a plain wall ring.
  const gateCenterLat = center[1] - halfH;
  const gateHalfLon = 0.00028;  // ~26m E-W half
  const gateHalfLat = 0.00024;  // ~26m N-S half (straddles the wall)
  const gateTower = [
    [center[0] - gateHalfLon, gateCenterLat - gateHalfLat],
    [center[0] + gateHalfLon, gateCenterLat - gateHalfLat],
    [center[0] + gateHalfLon, gateCenterLat + gateHalfLat],
    [center[0] - gateHalfLon, gateCenterLat + gateHalfLat],
    [center[0] - gateHalfLon, gateCenterLat - gateHalfLat],
  ];

  return [
    {
      type: 'Feature',
      properties: {
        id: 'xian-walls',
        height: 14,
        base: 0,
        color: '#7C6A55',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [outer, inner],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'xian-south-gate-tower',
        height: 28,
        base: 0,
        color: '#9C8463',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [gateTower],
      },
    },
  ];
}

function buildSanSalvadorFeatures() {
  // San Salvador Island, Masinloc, Zambales. This top-down fallback is kept
  // low and wide so the bird's-eye map view reads as the whole island.
  const center = [119.9114, 15.5087];
  const halfW = 0.0058;  // ~620m east-west half
  const halfH = 0.0034;  // ~375m north-south half
  const islandPoints = 32;
  const islandRing = [];
  for (let i = 0; i <= islandPoints; i += 1) {
    const theta = (i / islandPoints) * Math.PI * 2;
    islandRing.push([
      center[0] + Math.cos(theta) * halfW,
      center[1] + Math.sin(theta) * halfH,
    ]);
  }

  // Slender lighthouse marker (~6m square) rising 26m above the island.
  const lh = 0.000028;
  const lighthouseRing = [
    [center[0] - lh, center[1] - lh],
    [center[0] + lh, center[1] - lh],
    [center[0] + lh, center[1] + lh],
    [center[0] - lh, center[1] + lh],
    [center[0] - lh, center[1] - lh],
  ];

  return [
    {
      type: 'Feature',
      properties: {
        id: 'san-salvador-island',
        height: 6,
        base: 0,
        color: '#7BAD8E',
      },
      geometry: { type: 'Polygon', coordinates: [islandRing] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'san-salvador-lighthouse',
        height: 32,
        base: 6,
        color: '#F4F0E6',
      },
      geometry: { type: 'Polygon', coordinates: [lighthouseRing] },
    },
  ];
}

function buildMagellanLandingFeatures() {
  // Magellan Landing Site / Magellan's Anchorage in Barangay Masao, Butuan.
  // Modeled as a low coastal memorial platform plus a compact vertical marker.
  const center = [125.483603, 8.999434];
  const halfW = 0.00016; // ~17.5m east-west half
  const halfH = 0.00007; // ~7.7m north-south half

  const platform = [
    [center[0] - halfW, center[1] - halfH],
    [center[0] + halfW, center[1] - halfH],
    [center[0] + halfW, center[1] + halfH],
    [center[0] - halfW, center[1] + halfH],
    [center[0] - halfW, center[1] - halfH],
  ];

  const markerHalf = 0.000028; // ~3m half-side marker
  const marker = [
    [center[0] - markerHalf, center[1] - markerHalf],
    [center[0] + markerHalf, center[1] - markerHalf],
    [center[0] + markerHalf, center[1] + markerHalf],
    [center[0] - markerHalf, center[1] + markerHalf],
    [center[0] - markerHalf, center[1] - markerHalf],
  ];

  return [
    {
      type: 'Feature',
      properties: {
        id: 'magellan-landing-platform',
        height: 2,
        base: 0,
        color: '#C8B27A',
      },
      geometry: { type: 'Polygon', coordinates: [platform] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'magellan-landing-marker',
        height: 18,
        base: 2,
        color: '#F4F0E6',
      },
      geometry: { type: 'Polygon', coordinates: [marker] },
    },
  ];
}

function buildFallbackLandmarkGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      ...buildXianWallFeatures(),
      ...buildSanSalvadorFeatures(),
      ...buildMagellanLandingFeatures(),
    ],
  };
}

function ensureFallbackLandmarks(map) {
  if (!map.isStyleLoaded()) return;

  if (!map.getSource(FALLBACK_LANDMARK_SOURCE_ID)) {
    safelyApply(() => map.addSource(FALLBACK_LANDMARK_SOURCE_ID, {
      type: 'geojson',
      data: buildFallbackLandmarkGeoJSON(),
    }));
  }

  if (!map.getLayer(FALLBACK_LANDMARK_LAYER_ID)) {
    safelyApply(() => map.addLayer({
      id: FALLBACK_LANDMARK_LAYER_ID,
      type: 'fill-extrusion',
      source: FALLBACK_LANDMARK_SOURCE_ID,
      minzoom: 10,
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-vertical-gradient': true,
        'fill-extrusion-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0,
          12, 0.85,
          15, 1.0,
        ],
      },
    }));
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => clamp(value, 0, 1);

const destinationToLngLat = (destination) => [destination.lon, destination.lat];

function createDestinationMarker(map) {
  if (map.codexDestinationMarker) return map.codexDestinationMarker;

  const element = document.createElement('div');
  element.className = 'destination-map-marker';
  element.innerHTML = '<span class="destination-map-marker__pulse"></span><span class="destination-map-marker__core"></span>';
  element.style.opacity = '0';

  const marker = new mapboxgl.Marker({
    element,
    anchor: 'center',
  })
    .setLngLat(COLOSSEUM.center)
    .addTo(map);

  map.codexDestinationMarker = marker;
  map.codexDestinationMarkerElement = element;
  return marker;
}

function ensureDestinationOverlays(map) {
  if (!map.isStyleLoaded()) return;

  if (!map.getSource(DESTINATION_ROUTE_SOURCE_ID)) {
    safelyApply(() => map.addSource(DESTINATION_ROUTE_SOURCE_ID, {
      type: 'geojson',
      lineMetrics: true,
      data: emptyRouteData,
    }));
  }

  if (!map.getSource(DESTINATION_ROUTE_SOURCE_ID)) {
    createDestinationMarker(map);
    return;
  }

  if (!map.getLayer(DESTINATION_ROUTE_GLOW_LAYER_ID)) {
    safelyApply(() => map.addLayer({
      id: DESTINATION_ROUTE_GLOW_LAYER_ID,
      type: 'line',
      source: DESTINATION_ROUTE_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#7DB7F0',
        'line-width': 8,
        'line-blur': 6,
        'line-opacity': 0.26,
      },
    }));
  }

  if (!map.getLayer(DESTINATION_ROUTE_LINE_LAYER_ID)) {
    safelyApply(() => map.addLayer({
      id: DESTINATION_ROUTE_LINE_LAYER_ID,
      type: 'line',
      source: DESTINATION_ROUTE_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#F97316',
        'line-width': 2.6,
        'line-opacity': 0.86,
      },
    }));
  }

  createDestinationMarker(map);
}

function hideDestinationOverlays(map) {
  if (map.codexDestinationMarkerElement) {
    map.codexDestinationMarkerElement.style.opacity = '0';
  }

  const source = map.getSource(DESTINATION_ROUTE_SOURCE_ID);
  if (source) {
    safelyApply(() => source.setData(emptyRouteData));
  }
}

function getDestinationTourState() {
  const rawState = window.destinationTourState || { index: 0, progress: 0 };
  return {
    active: !!window.destinationTourActive,
    index: clamp(rawState.index || 0, 0, destinations.length - 1),
    progress: clamp01(rawState.progress || 0),
  };
}

function getDestinationPadding() {
  // Center the destination in the viewport. The info card now floats at the
  // bottom of the screen rather than the side, so the camera focal point sits
  // dead-center with no horizontal offset. A small bottom padding lifts the
  // landmark slightly above the card on every viewport.
  const isNarrow = window.innerWidth < 768;
  return {
    top: 0,
    bottom: Math.round(window.innerHeight * (isNarrow ? 0.30 : 0.18)),
    left: 0,
    right: 0,
  };
}

function getDestinationFlightProfile(destination, isNarrow) {
  // Magellan Landing Site — pulled way back so the southern half of the
  // Philippines is visible. Uses earth style (city-model has no detail at
  // this zoom). Slight pitch gives a 3D tilted map view.
  if (destination.id === 'magellan-landing-site') {
    return {
      profile: 'earth',
      styleUrl: EARTH_STYLE_URL,
      styleConfig: EARTH_BASEMAP_CONFIG,
      camera: isNarrow
        ? { zoom: 5.8, pitch: 25, bearing: 0 }
        : { zoom: 6.5, pitch: 30, bearing: 0 },
      curve: 1.1,
    };
  }

  return {
    profile: isNarrow ? 'earth' : 'city-model',
    styleUrl: isNarrow ? EARTH_STYLE_URL : CITY_MODEL_STYLE_URL,
    styleConfig: isNarrow ? EARTH_BASEMAP_CONFIG : CITY_BASEMAP_CONFIG,
    camera: isNarrow
      ? DESTINATION_FLIGHT.mobileSnap
      : DESTINATION_VIEW_OVERRIDES[destination.id] || DESTINATION_FLIGHT.cityEnd,
    curve: isNarrow ? 1.1 : 1.35,
  };
}

function setRouteLayersOpacity(map, alpha) {
  const clamped = clamp01(alpha);
  if (map.getLayer(DESTINATION_ROUTE_GLOW_LAYER_ID)) {
    safelyApply(() =>
      map.setPaintProperty(
        DESTINATION_ROUTE_GLOW_LAYER_ID,
        'line-opacity',
        DESTINATION_ROUTE_GLOW_BASE_OPACITY * clamped,
      ),
    );
  }
  if (map.getLayer(DESTINATION_ROUTE_LINE_LAYER_ID)) {
    safelyApply(() =>
      map.setPaintProperty(
        DESTINATION_ROUTE_LINE_LAYER_ID,
        'line-opacity',
        DESTINATION_ROUTE_LINE_BASE_OPACITY * clamped,
      ),
    );
  }
}

function applyDestinationTourState(map, tourState) {
  if (map.codexStyleSwitching) return;
  // Yield to the user while they are actively dragging / rotating the map.
  if (map.codexUserInteracting) return;

  const destination = destinations[tourState.index];
  if (!destination) return;

  ensureDestinationOverlays(map);

  const isNarrow = window.innerWidth < 768;
  const reducedMotion = prefersReducedMotion();
  const padding = getDestinationPadding();
  const destinationCenter = destinationToLngLat(destination);
  const marker = createDestinationMarker(map);
  const flightProfile = getDestinationFlightProfile(destination, isNarrow);
  const { profile, styleUrl, styleConfig, camera, curve } = flightProfile;
  const duration = reducedMotion
    ? 0
    : isNarrow
      ? DESTINATION_MOBILE_FLIGHT_DURATION
      : DESTINATION_FLIGHT_DURATION;

  // Mobile keeps the lighter earth profile; most desktop stops use city-model
  // detail, while island stops can request a true overhead earth view.
  if (map.codexSceneProfile !== profile) {
    void switchSceneStyle(map, styleUrl, styleConfig, profile);
    return;
  }

  // ── Reduced motion (spec §9): hold the landmark dwell view, no push dive.
  if (map.codexDestinationActiveIndex === tourState.index) {
    marker.setLngLat(destinationCenter);
    if (map.codexDestinationMarkerElement) {
      map.codexDestinationMarkerElement.style.opacity = '1';
    }
    setRouteLayersOpacity(map, 0);
    return;
  }

  map.codexDestinationActiveIndex = tourState.index;
  marker.setLngLat(destinationCenter);
  if (map.codexDestinationMarkerElement) {
    map.codexDestinationMarkerElement.style.opacity = '1';
  }
  setRouteLayersOpacity(map, 0);

  if (reducedMotion) {
    map.jumpTo({
      center: destinationCenter,
      ...camera,
      padding,
    });
    return;
  }

  // First entry from idle: the camera is at globe zoom (~1.35) and a normal
  // 2.2s flyTo to zoom 16.6 spends most of its run at zoom 5-12 over Rome,
  // where city-model LOD hasn't kicked in — that mid-flight frame is the
  // "satellite Colosseum" the user sees. Pre-jump close to the destination
  // so the visible flyTo is a short polish move instead of a 15-zoom dive.
  const comingFromIdle = map.getZoom() < 4;
  if (comingFromIdle) {
    map.jumpTo({
      center: destinationCenter,
      zoom: Math.max((camera.zoom ?? 16) - 1.5, 13),
      pitch: 0,
      bearing: 0,
    });
  }

  map.flyTo({
    center: destinationCenter,
    ...camera,
    padding,
    duration: comingFromIdle ? 900 : duration,
    curve: comingFromIdle ? 1.1 : curve,
    essential: true,
  });

}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyRomeScrollState(map, progress) {
  if (map.codexStyleSwitching || map.codexRouteAnimating) return;
  if (map.codexUserInteracting) return;

  if (progress < 0.5) {
    if (map.codexSceneProfile !== 'earth') {
      void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
      return;
    }
    const localT = easeInOutCubic(progress / 0.5);
    const k = ROME_KEYFRAMES.earth;
    map.jumpTo({
      center: lerpLngLat(k.start.center, k.mid.center, localT),
      zoom: lerp(k.start.zoom, k.mid.zoom, localT),
      pitch: lerp(k.start.pitch, k.mid.pitch, localT),
      bearing: lerp(k.start.bearing, k.mid.bearing, localT),
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } else {
    if (map.codexSceneProfile !== 'city-model') {
      void switchSceneStyle(map, CITY_MODEL_STYLE_URL, CITY_BASEMAP_CONFIG, 'city-model');
      return;
    }
    const localT = easeInOutCubic((progress - 0.5) / 0.5);
    const k = ROME_KEYFRAMES.city;
    map.jumpTo({
      center: lerpLngLat(k.mid.center, k.end.center, localT),
      zoom: lerp(k.mid.zoom, k.end.zoom, localT),
      pitch: lerp(k.mid.pitch, k.end.pitch, localT),
      bearing: lerp(k.mid.bearing, k.end.bearing, localT),
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }
}

function applyRomeReducedMotionState(map, progress) {
  if (map.codexStyleSwitching || map.codexRouteAnimating) return;
  if (map.codexUserInteracting) return;

  if (progress >= 0.5) {
    if (map.codexSceneProfile !== 'city-model') {
      void switchSceneStyle(map, CITY_MODEL_STYLE_URL, CITY_BASEMAP_CONFIG, 'city-model');
      return;
    }
    map.jumpTo({
      center: COLOSSEUM.center,
      zoom: 17.25,
      pitch: 56,
      bearing: -32,
    });
  } else {
    if (map.codexSceneProfile !== 'earth') {
      void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
      return;
    }
    map.jumpTo({
      center: EARTH_IDLE_CENTER,
      zoom: 1.35,
      pitch: 0,
      bearing: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }
}

function getEarthScrollDirection() {
  // Use the global variable updated by Content.jsx's GSAP ScrollTrigger
  // This prevents expensive DOM layout thrashing on every frame (60fps).
  return window.globeTargetDirection || 0;
}

function getEarthIdleZoom() {
  const isNarrow = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;

  if (isNarrow) {
    return 1.4;
  }

  if (isTablet) {
    return 1.8;
  }

  // Significantly increase zoom to make the Earth massive (like the basketball reference)
  return Math.min(2.8, Math.max(2.1, window.innerWidth * 0.0016));
}

function getEarthHorizontalPadding() {
  // Push the Earth so far that its center is almost at the edge of the screen.
  // 85% padding means the center of the globe will be at 92.5% of the screen width.
  return window.innerWidth * 0.85;
}

function startEarthScrollMotion(map, onSlideToggle) {
  let frameId = 0;
  let lastTime = performance.now();
  let spinLng = EARTH_IDLE_CENTER[0];
  let horizontalDirection = 0;
  let lastSlideOpen = false;
  let destinationWasActive = false;
  const reducedMotion = prefersReducedMotion();

  const tick = (time) => {
    const deltaSeconds = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const romeProgress = window.romeScrollProgress || 0;
    const inRomeMode = !!window.romeModeActive;

    if (inRomeMode) {
      if (destinationWasActive) {
        hideDestinationOverlays(map);
        map.codexDestinationActiveIndex = null;
        destinationWasActive = false;
      }

      if (reducedMotion) {
        applyRomeReducedMotionState(map, romeProgress);
      } else {
        applyRomeScrollState(map, romeProgress);
      }

      // Warm the Colosseum tiles in the offscreen preload map once the
      // descent is past the earth phase, so the first destination is fully
      // cached before the user even leaves Rome.
      if (romeProgress > 0.3) {
        queueDestinationPreload(destinations[0]);
      }

      const wantSlideOpen = romeProgress >= 0.92;
      if (wantSlideOpen !== lastSlideOpen) {
        lastSlideOpen = wantSlideOpen;
        onSlideToggle(wantSlideOpen);
      }

      frameId = requestAnimationFrame(tick);
      return;
    }

    const tourState = getDestinationTourState();

    if (tourState.active) {
      if (lastSlideOpen) {
        lastSlideOpen = false;
        onSlideToggle(false);
      }

      applyDestinationTourState(map, tourState);

      // Warm the next destination's tiles as soon as the current automatic
      // flight starts, so the following flyTo has less network work to do.
      if (tourState.progress > 0.25) {
        queueDestinationPreload(destinations[tourState.index + 1]);
      }

      destinationWasActive = true;
      frameId = requestAnimationFrame(tick);
      return;
    }

    if (destinationWasActive) {
      hideDestinationOverlays(map);
      map.codexDestinationActiveIndex = null;
      destinationWasActive = false;
    }

    // Out of Rome mode: ensure we're back on earth style + slide is closed
    if (
      map.codexSceneProfile === 'city-model'
      && !map.codexStyleSwitching
      && !map.codexRouteAnimating
    ) {
      void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
    }

    if (lastSlideOpen) {
      lastSlideOpen = false;
      onSlideToggle(false);
    }

    const shouldAnimateEarth = (
      !reducedMotion
      && !map.codexUserInteracting
      && map.codexSceneProfile === 'earth'
      && !map.codexRouteAnimating
      && !map.codexStyleSwitching
      && map.isStyleLoaded()
      && map.getZoom() <= EARTH_SCROLL_MOTION_MAX_ZOOM
    );

    if (shouldAnimateEarth) {
      const targetDirection = getEarthScrollDirection();
      const transferVelocity = targetDirection - horizontalDirection;
      horizontalDirection += transferVelocity * EARTH_MOTION_EASE;

      const transferSpin = Math.abs(transferVelocity) * 300;
      spinLng = wrapLongitude(spinLng + (EARTH_ROTATION_DEGREES_PER_SECOND + transferSpin) * deltaSeconds);

      const paddingAmount = getEarthHorizontalPadding() * Math.abs(horizontalDirection);

      const timeInSeconds = time / 1000;
      const bobbing = Math.sin(timeInSeconds * 1.5) * 1.5;
      const banking = horizontalDirection * -12;

      const baseZoom = 1.35;
      const targetEdgeZoom = getEarthIdleZoom();
      const dynamicZoom = baseZoom + (targetEdgeZoom - baseZoom) * Math.abs(horizontalDirection);

      map.jumpTo({
        center: [spinLng, EARTH_IDLE_CENTER[1] + bobbing],
        zoom: dynamicZoom,
        pitch: Math.abs(horizontalDirection) * 8,
        bearing: banking,
        padding: {
          top: 0,
          bottom: 0,
          left: horizontalDirection > 0 ? paddingAmount : 0,
          right: horizontalDirection < 0 ? paddingAmount : 0,
        },
      });
    }

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
  };
}

// Known non-fatal runtime errors emitted by Mapbox internals that do not break
// the map. Most commonly the 3D landmark/mesh worker throws when a tile lacks
// mesh data (e.g. remote destinations like Magellan Landing Site or San Salvador where the
// city-model style has no 3D landmarks). These should be logged but not shown
// in the user-facing "setup issue" banner, which is reserved for fatal
// configuration problems (missing/invalid token, hard load failure).
const NON_FATAL_MAPBOX_ERROR_PATTERNS = [
  /meshes is not iterable/i,
  /\.meshes/i,
  /3d\s*model/i,
  /landmark/i,
];

function isNonFatalMapboxError(message) {
  if (!message) return false;
  return NON_FATAL_MAPBOX_ERROR_PATTERNS.some((re) => re.test(message));
}

async function switchSceneStyle(map, styleUrl, config, profile) {
  if (map.codexSceneProfile === profile) {
    enhanceScene(map, config);
    return;
  }

  if (map.codexStyleSwitching) {
    return;
  }

  map.codexStyleSwitching = true;
  map.codexSceneProfile = profile;

  try {
    map.setStyle(styleUrl, {
      config: {
        basemap: config,
      },
    });
    await waitForStyleLoad(map);
    enhanceScene(map, config);
  } finally {
    map.codexStyleSwitching = false;
  }
}

// ─── Offscreen preload map ────────────────────────────────────────────────
// Tile + 3D landmark fetches are the dominant source of stutter when the
// main map teleports between destinations. We keep one hidden offscreen
// mapbox instance permanently parked at city-model scale and `jumpTo` it
// to the *next* destination while the user is still dwelling on the
// current one. The tiles + meshes it pulls down land in the browser's HTTP
// cache, so the next automatic `flyTo` has less network work to do and
// the transition stays smooth.
//
// Implementation notes:
//   - One single shared preload map for the page lifetime (lazy init).
//   - 640x480 viewport — large enough to request every tile the main
//     viewport will need at the same zoom, small enough to keep GPU + tile
//     count down.
//   - Skipped on mobile (mobile uses the earth style, no
//     city-model tiles to preload) and under reduced-motion.
//   - Serial queue: only one preload runs at a time (a single map can only
//     be at one location). Newer requests for already-cached destinations
//     are deduped.
//   - Hard 8s safety timeout on every preload so a slow tile never stalls
//     the queue.
let preloadMapInstance = null;
let preloadMapContainer = null;
const preloadedDestinationIds = new Set();
const preloadInFlight = new Map();
const preloadQueue = [];
let preloadQueueRunning = false;

function ensurePreloadMap() {
  if (typeof window === 'undefined') return null;
  if (preloadMapInstance) return preloadMapInstance;
  if (window.innerWidth < 768) return null;
  if (prefersReducedMotion()) return null;
  if (!mapboxgl.accessToken) return null;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;width:640px;height:480px;visibility:hidden;pointer-events:none;opacity:0;z-index:-9999;';
  document.body.appendChild(host);
  preloadMapContainer = host;

  try {
    preloadMapInstance = new mapboxgl.Map({
      container: host,
      style: CITY_MODEL_STYLE_URL,
      center: [12.4922, 41.8902],
      zoom: 16.6,
      pitch: 76,
      bearing: -32,
      antialias: false,
      interactive: false,
      attributionControl: false,
      config: {
        basemap: CITY_BASEMAP_CONFIG,
      },
    });

    preloadMapInstance.on('style.load', () => {
      enhanceScene(preloadMapInstance, CITY_BASEMAP_CONFIG);
    });

    preloadMapInstance.on('error', (event) => {
      const msg = event?.error?.message || '';
      // Preload is best-effort — mute non-fatal mesh / landmark warnings.
      if (!isNonFatalMapboxError(msg) && typeof console !== 'undefined') {
        console.warn('[Mapbox preload]', msg);
      }
    });
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[Mapbox preload] init failed', err);
    }
    if (preloadMapContainer?.parentNode) {
      preloadMapContainer.parentNode.removeChild(preloadMapContainer);
    }
    preloadMapInstance = null;
    preloadMapContainer = null;
  }

  return preloadMapInstance;
}

function preloadDestinationTiles(destination) {
  if (!destination) return Promise.resolve();
  const flightProfile = getDestinationFlightProfile(destination, false);
  if (flightProfile.profile !== 'city-model') {
    return Promise.resolve();
  }
  if (preloadedDestinationIds.has(destination.id)) return Promise.resolve();
  if (preloadInFlight.has(destination.id)) return preloadInFlight.get(destination.id);

  const map = ensurePreloadMap();
  if (!map) return Promise.resolve();

  const promise = new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      preloadedDestinationIds.add(destination.id);
      preloadInFlight.delete(destination.id);
      resolve();
    };

    const doJump = () => {
      try {
        map.jumpTo({
          center: [destination.lon, destination.lat],
          ...flightProfile.camera,
        });
        map.once('idle', finish);
      } catch {
        finish();
      }
    };

    if (map.isStyleLoaded()) {
      doJump();
    } else {
      map.once('style.load', doJump);
    }

    setTimeout(finish, 8000);
  });

  preloadInFlight.set(destination.id, promise);
  return promise;
}

async function runPreloadQueue() {
  if (preloadQueueRunning) return;
  preloadQueueRunning = true;
  try {
    while (preloadQueue.length > 0) {
      const dest = preloadQueue.shift();
      if (!dest || preloadedDestinationIds.has(dest.id)) continue;
      await preloadDestinationTiles(dest);
    }
  } finally {
    preloadQueueRunning = false;
  }
}

function queueDestinationPreload(destination) {
  if (!destination) return;
  if (getDestinationFlightProfile(destination, false).profile !== 'city-model') return;
  if (preloadedDestinationIds.has(destination.id)) return;
  if (preloadInFlight.has(destination.id)) return;
  if (preloadQueue.some((d) => d.id === destination.id)) return;
  preloadQueue.push(destination);
  void runPreloadQueue();
}

function disposePreloadMap() {
  preloadQueue.length = 0;
  preloadQueueRunning = false;
  preloadInFlight.clear();
  preloadedDestinationIds.clear();

  if (preloadMapInstance) {
    try {
      preloadMapInstance.remove();
    } catch {
      // ignore
    }
    preloadMapInstance = null;
  }
  if (preloadMapContainer?.parentNode) {
    preloadMapContainer.parentNode.removeChild(preloadMapContainer);
  }
  preloadMapContainer = null;
}

export default function MapboxEarth() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState('');
  const [showRomeSlide, setShowRomeSlide] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const setupError = !token
    ? 'Missing VITE_MAPBOX_TOKEN in .env'
    : !token.startsWith('pk.')
      ? 'VITE_MAPBOX_TOKEN is not a valid public Mapbox token. It should start with pk.'
      : mapError;

  useEffect(() => {
    if (!token || !token.startsWith('pk.')) {
      return undefined;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: EARTH_STYLE_URL,
      projection: 'globe',
      center: COLOSSEUM.center,
      zoom: 1.35,
      pitch: 0,
      bearing: 0,
      antialias: true,
      maxPitch: 85,
      // Mouse interactivity: drag to pan, right-click drag to rotate, double-click
      // to zoom in, pinch to zoom/rotate on touch screens. Scroll wheel zoom stays
      // OFF so the page can still scroll while the cursor is over the globe.
      scrollZoom: false,
      boxZoom: false,
      dragRotate: true,
      dragPan: true,
      keyboard: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      config: {
        basemap: EARTH_BASEMAP_CONFIG,
      },
      attributionControl: false,
    });

    mapRef.current = map;
    map.codexSceneProfile = 'earth';
    map.codexRouteAnimating = false;
    map.codexStyleSwitching = false;
    map.codexUserInteracting = false;
    map.codexUserInteractionCount = 0;

    // Track active user gestures via direct DOM events on the map canvas, so
    // the scroll-driven auto-flight can yield while the user is dragging /
    // rotating / pinching the globe. Mapbox's *start / *end events would also
    // fire for our own programmatic jumpTo calls, so we listen to raw pointer
    // events instead. A counter handles overlapping gestures (drag + pinch).
    const mapCanvas = map.getCanvas();
    const startInteraction = () => {
      map.codexUserInteractionCount += 1;
      map.codexUserInteracting = true;
    };
    const endInteraction = () => {
      map.codexUserInteractionCount = Math.max(
        0,
        map.codexUserInteractionCount - 1,
      );
      if (map.codexUserInteractionCount === 0) {
        map.codexUserInteracting = false;
      }
    };
    // mousedown on the canvas; mouseup on the window (releases outside the
    // canvas still need to end the interaction).
    mapCanvas.addEventListener('mousedown', startInteraction);
    window.addEventListener('mouseup', endInteraction);
    mapCanvas.addEventListener('touchstart', startInteraction, { passive: true });
    mapCanvas.addEventListener('touchend', endInteraction);
    mapCanvas.addEventListener('touchcancel', endInteraction);

    const stopEarthScrollMotion = startEarthScrollMotion(map, (open) => {
      setShowRomeSlide(open);
    });

    map.on('style.load', () => {
      const config = map.codexSceneProfile === 'city-model'
        ? CITY_BASEMAP_CONFIG
        : EARTH_BASEMAP_CONFIG;

      enhanceScene(map, config);
      if (window.destinationTourActive) {
        ensureDestinationOverlays(map);
      }
      ensureFallbackLandmarks(map);

      if (!map.getFog()) {
        map.setFog({
          color: 'rgb(8, 12, 24)',
          'high-color': 'rgb(36, 92, 170)',
          'horizon-blend': 0.08,
          'space-color': 'rgb(2, 4, 12)',
          'star-intensity': 0.45,
        });
      }
    });

    map.on('error', (event) => {
      const message = event?.error?.message || 'Mapbox failed to load';
      if (isNonFatalMapboxError(message)) {
        if (typeof console !== 'undefined') {
          console.warn('[Mapbox non-fatal]', message);
        }
        return;
      }
      setMapError(message);
    });

    const handleResetGlobe = async () => {
      if (!mapRef.current) return;
      const m = mapRef.current;

      setShowRomeSlide(false);
      window.romeModeActive = false;
      window.romeScrollProgress = 0;
      window.destinationTourActive = false;
      window.destinationTourState = { index: 0, progress: 0 };
      m.codexDestinationActiveIndex = null;
      hideDestinationOverlays(m);
      m.codexRouteAnimating = true;

      try {
        await switchSceneStyle(m, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
        m.flyTo({
          center: EARTH_IDLE_CENTER,
          zoom: 1.35,
          pitch: 0,
          bearing: 0,
          duration: 2500,
          essential: true,
        });
        await waitForMoveEnd(m);
        window.dispatchEvent(new Event('globeResetComplete'));
      } finally {
        m.codexRouteAnimating = false;
      }
    };

    window.addEventListener('resetGlobe', handleResetGlobe);

    return () => {
      window.removeEventListener('resetGlobe', handleResetGlobe);
      mapCanvas.removeEventListener('mousedown', startInteraction);
      window.removeEventListener('mouseup', endInteraction);
      mapCanvas.removeEventListener('touchstart', startInteraction);
      mapCanvas.removeEventListener('touchend', endInteraction);
      mapCanvas.removeEventListener('touchcancel', endInteraction);
      stopEarthScrollMotion();
      disposePreloadMap();
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {setupError && (
        <div className="fixed left-1/2 top-24 z-50 w-[min(90vw,32rem)] -translate-x-1/2 rounded-lg border border-red-500/40 bg-black/80 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">
          <p className="font-semibold uppercase tracking-[0.16em] text-red-300">
            Mapbox setup issue
          </p>
          <p className="mt-2 text-gray-200">{setupError}</p>
        </div>
      )}

      <SlidePanel
        open={showRomeSlide}
        onClose={() => setShowRomeSlide(false)}
        slide={ROME_SLIDE}
      />
    </>
  );
}
