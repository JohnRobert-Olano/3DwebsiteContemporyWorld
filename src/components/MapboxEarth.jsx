import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SlidePanel from './SlidePanel';
import { destinations, romeIntro } from '../lib/data/destinations';

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

// Per-destination cinematic flight tuning (mirrors Rome's two-stage handoff).
// 0.0 → 0.5 (earth profile):  previous coords (globe altitude) → current coords (regional zoom).
// 0.5 → 1.0 (city profile):   current coords (regional zoom)   → current coords (ground/landmark zoom).
//
// The final city-end keyframe uses a near-horizontal pitch (76°) so the
// landmark is seen from a low, front-facing eye-level perspective rather
// than a top-down bird's-eye view — the building rises in the frame with
// the city horizon visible behind it.
const DESTINATION_FLIGHT = {
  earthStart: { zoom: 2.4, pitch: 0, bearing: 0 },
  earthMid: { zoom: 5.5, pitch: 38, bearing: -16 },
  cityEnd: { zoom: 16.6, pitch: 76, bearing: -32 },
  mobileSnap: { zoom: 6.2, pitch: 0, bearing: 0 },
};
const DESTINATION_PHASE_SPLIT = 0.5;
const DESTINATION_MARKER_FADE_IN_START = 0.1;
const DESTINATION_MARKER_FADE_IN_END = 0.25;
const DESTINATION_MARKER_FADE_OUT_START = 0.42;
const DESTINATION_MARKER_FADE_OUT_END = 0.52;
const DESTINATION_ARC_FADE_START = 0.45;
const DESTINATION_ARC_FADE_END = 0.55;
const DESTINATION_ROUTE_GLOW_BASE_OPACITY = 0.26;
const DESTINATION_ROUTE_LINE_BASE_OPACITY = 0.86;

const emptyRouteData = {
  type: 'FeatureCollection',
  features: [],
};

// ─── Custom 3D fallback landmarks ──────────────────────────────────────────
// Mapbox's built-in `show3dLandmarks` only renders first-party landmark
// meshes for major cities. Destinations like Xi'An's fortifications, the tiny
// San Salvador Island, and Cagusuan Church have no 3D data, so at city-zoom
// the user would see nothing distinctive. These hand-crafted fill-extrusion
// shapes give each location a recognizable physical presence at the same
// scale as Mapbox's real landmarks.
const FALLBACK_LANDMARK_SOURCE_ID = 'codex-fallback-landmarks';
const FALLBACK_LANDMARK_LAYER_ID = 'codex-fallback-landmarks-extrusion';

function buildXianWallFeatures() {
  // Xi'An's Ming-era city walls form a rectangular ring around the historic
  // core, roughly 3.5km x 2.7km, 12m tall, ~14m thick.
  const center = [108.9486, 34.2611];
  const halfW = 0.019;   // ~1.74 km east half-width
  const halfH = 0.012;   // ~1.33 km north half-height
  const tLon = 0.00015;  // ~14m wall thickness east-west
  const tLat = 0.00013;  // ~14m wall thickness north-south

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

  return [
    {
      type: 'Feature',
      properties: {
        id: 'xian-walls',
        height: 12,
        base: 0,
        color: '#7C6A55',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [outer, inner],
      },
    },
  ];
}

function buildSanSalvadorFeatures() {
  // San Salvador Island, Zambales — small tropical island ~500m x 300m.
  // Modeled as an oval landmass with a slim lighthouse marker at center.
  const center = [120.15, 14.7833];
  const halfW = 0.00235;  // ~250m east-west half
  const halfH = 0.0014;   // ~155m north-south half
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

function buildCagusuanFeatures() {
  // Cagusuan Church & Plaza, Guiuan, Eastern Samar — small Spanish-era
  // heritage chapel. Modeled as a 25m x 12m nave plus a 6m square bell
  // tower on the south facade.
  const center = [125.7297, 11.0286];
  const halfW = 0.000055;   // ~6m east-west half (12m wide nave)
  const halfH = 0.00011;    // ~12.5m north-south half (25m long nave)

  const nave = [
    [center[0] - halfW, center[1] - halfH],
    [center[0] + halfW, center[1] - halfH],
    [center[0] + halfW, center[1] + halfH],
    [center[0] - halfW, center[1] + halfH],
    [center[0] - halfW, center[1] - halfH],
  ];

  const t = 0.0000275; // ~3m half-side (6m square tower)
  const towerCenterLat = center[1] - halfH - t; // south of the nave
  const tower = [
    [center[0] - t, towerCenterLat - t],
    [center[0] + t, towerCenterLat - t],
    [center[0] + t, towerCenterLat + t],
    [center[0] - t, towerCenterLat + t],
    [center[0] - t, towerCenterLat - t],
  ];

  return [
    {
      type: 'Feature',
      properties: {
        id: 'cagusuan-nave',
        height: 12,
        base: 0,
        color: '#E8D9B9',
      },
      geometry: { type: 'Polygon', coordinates: [nave] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'cagusuan-bell-tower',
        height: 20,
        base: 0,
        color: '#D4B896',
      },
      geometry: { type: 'Polygon', coordinates: [tower] },
    },
  ];
}

function buildFallbackLandmarkGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      ...buildXianWallFeatures(),
      ...buildSanSalvadorFeatures(),
      ...buildCagusuanFeatures(),
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
const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const destinationToLngLat = (destination) => [destination.lon, destination.lat];

function lerpLongitude(a, b, t) {
  const delta = wrapLongitude(b - a);
  return wrapLongitude(a + delta * t);
}

function lerpLngLatWrapped(a, b, t) {
  return [lerpLongitude(a[0], b[0], t), lerp(a[1], b[1], t)];
}

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

function makeRouteFeature(from, to, drawProgress) {
  const progress = clamp01(drawProgress);
  if (progress <= 0.01) return emptyRouteData;

  const fromCoord = destinationToLngLat(from);
  const toCoord = destinationToLngLat(to);
  const fullSteps = 72;
  const visibleSteps = Math.max(2, Math.ceil(fullSteps * progress));
  const coordinates = [];
  const lonDistance = Math.abs(wrapLongitude(toCoord[0] - fromCoord[0]));
  const latDistance = Math.abs(toCoord[1] - fromCoord[1]);
  const lift = Math.min(10, Math.max(1.8, (lonDistance + latDistance) * 0.08));

  for (let i = 0; i < visibleSteps; i += 1) {
    const t = visibleSteps === 1 ? 0 : (i / (visibleSteps - 1)) * progress;
    const eased = easeInOutCubic(clamp01(t));
    coordinates.push([
      lerpLongitude(fromCoord[0], toCoord[0], eased),
      lerp(fromCoord[1], toCoord[1], eased) + Math.sin(eased * Math.PI) * lift,
    ]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  };
}

function updateDestinationRoute(map, index, progress) {
  const source = map.getSource(DESTINATION_ROUTE_SOURCE_ID);
  if (!source) return;

  const current = destinations[index];
  const previous = index === 0 ? romeIntro : destinations[index - 1];
  const drawProgress = smoothstep(0.08, 0.58, progress);

  safelyApply(() => source.setData(makeRouteFeature(previous, current, drawProgress)));
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

function buildDestinationKeyframes(index) {
  const current = destinations[index] || destinations[0];
  const previousSource =
    index === 0 ? romeIntro : destinations[index - 1] || current;
  const currentCenter = destinationToLngLat(current);
  const previousCenter = destinationToLngLat(previousSource);

  return {
    earth: {
      start: { center: previousCenter, ...DESTINATION_FLIGHT.earthStart },
      mid: { center: currentCenter, ...DESTINATION_FLIGHT.earthMid },
    },
    city: {
      mid: { center: currentCenter, ...DESTINATION_FLIGHT.earthMid },
      end: { center: currentCenter, ...DESTINATION_FLIGHT.cityEnd },
    },
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
  if (map.codexStyleSwitching || map.codexRouteAnimating) return;
  // Yield to the user while they are actively dragging / rotating the map.
  if (map.codexUserInteracting) return;

  const destination = destinations[tourState.index];
  if (!destination) return;

  ensureDestinationOverlays(map);

  const isNarrow = window.innerWidth < 768;
  const reducedMotion = prefersReducedMotion();
  const padding = getDestinationPadding();
  const destinationCenter = destinationToLngLat(destination);
  const keyframes = buildDestinationKeyframes(tourState.index);
  const progress = clamp01(tourState.progress);
  const marker = createDestinationMarker(map);

  // Mobile: skip the city-model swap entirely per spec §9.
  // Snap to a moderate earth-zoom view of the current destination on entry.
  if (isNarrow) {
    if (map.codexSceneProfile !== 'earth') {
      void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
      return;
    }
    map.jumpTo({
      center: destinationCenter,
      ...DESTINATION_FLIGHT.mobileSnap,
      padding,
    });
    marker.setLngLat(destinationCenter);
    if (map.codexDestinationMarkerElement) {
      map.codexDestinationMarkerElement.style.opacity = '1';
    }
    setRouteLayersOpacity(map, 0);
    return;
  }

  // Reduced motion: snap directly to the city-end keyframe (mirrors Rome's reduced-motion path).
  if (reducedMotion) {
    if (map.codexSceneProfile !== 'city-model') {
      void switchSceneStyle(map, CITY_MODEL_STYLE_URL, CITY_BASEMAP_CONFIG, 'city-model');
      return;
    }
    map.jumpTo({
      ...keyframes.city.end,
      padding,
    });
    marker.setLngLat(destinationCenter);
    if (map.codexDestinationMarkerElement) {
      map.codexDestinationMarkerElement.style.opacity = '0';
    }
    setRouteLayersOpacity(map, 0);
    return;
  }

  // Full cinematic flight on desktop/tablet.
  if (progress < DESTINATION_PHASE_SPLIT) {
    // Earth phase: rotate from previous landmark coords toward current at regional altitude.
    if (map.codexSceneProfile !== 'earth') {
      void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
      return;
    }
    const localT = easeInOutCubic(clamp01(progress / DESTINATION_PHASE_SPLIT));
    const k = keyframes.earth;
    map.jumpTo({
      center: lerpLngLatWrapped(k.start.center, k.mid.center, localT),
      zoom: lerp(k.start.zoom, k.mid.zoom, localT),
      pitch: lerp(k.start.pitch, k.mid.pitch, localT),
      bearing: lerp(k.start.bearing, k.mid.bearing, localT),
      padding,
    });
  } else {
    // City phase: descend onto the landmark with 3D buildings and dramatic pitch.
    if (map.codexSceneProfile !== 'city-model') {
      void switchSceneStyle(map, CITY_MODEL_STYLE_URL, CITY_BASEMAP_CONFIG, 'city-model');
      return;
    }
    const localT = easeInOutCubic(
      clamp01((progress - DESTINATION_PHASE_SPLIT) / (1 - DESTINATION_PHASE_SPLIT)),
    );
    const k = keyframes.city;
    map.jumpTo({
      center: lerpLngLatWrapped(k.mid.center, k.end.center, localT),
      zoom: lerp(k.mid.zoom, k.end.zoom, localT),
      pitch: lerp(k.mid.pitch, k.end.pitch, localT),
      bearing: lerp(k.mid.bearing, k.end.bearing, localT),
      padding,
    });
  }

  // Marker pin lives in the rotation window only; it gets buried once the camera zooms in.
  marker.setLngLat(destinationCenter);
  if (map.codexDestinationMarkerElement) {
    const markerOpacity =
      smoothstep(
        DESTINATION_MARKER_FADE_IN_START,
        DESTINATION_MARKER_FADE_IN_END,
        progress,
      )
      * (
        1
        - smoothstep(
          DESTINATION_MARKER_FADE_OUT_START,
          DESTINATION_MARKER_FADE_OUT_END,
          progress,
        )
      );
    map.codexDestinationMarkerElement.style.opacity = `${markerOpacity}`;
  }

  // Flight-path arc draws in the rotation window, then fades out before the city descent.
  updateDestinationRoute(map, tourState.index, tourState.progress);
  const arcAlpha = 1 - smoothstep(
    DESTINATION_ARC_FADE_START,
    DESTINATION_ARC_FADE_END,
    progress,
  );
  setRouteLayersOpacity(map, arcAlpha);
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
        destinationWasActive = false;
      }

      if (reducedMotion) {
        applyRomeReducedMotionState(map, romeProgress);
      } else {
        applyRomeScrollState(map, romeProgress);
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
      destinationWasActive = true;
      frameId = requestAnimationFrame(tick);
      return;
    }

    if (destinationWasActive) {
      hideDestinationOverlays(map);
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
// mesh data (e.g. remote destinations like Cagusuan or San Salvador where the
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
