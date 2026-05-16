import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as THREE from 'three';
import SlidePanel from './SlidePanel';
import MapHud from './MapHud';
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
  // Cagusu-an Church and Plaza, Homonhon Island, Guiuan, Eastern Samar.
  // Cinematic close-up: camera tilted heavily east so the offshore 3D ship
  // (Three.js custom layer) reads against the open Philippine Sea while the
  // chapel + plaza coastline anchors the lower foreground.
  'magellan-landing-site': { zoom: 16.2, pitch: 65, bearing: 90 },
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
  // Cagusu-an Church and Plaza, Homonhon Island, Guiuan, Eastern Samar.
  // Kept deliberately low and small — the offshore 3D Three.js ship is the
  // hero element, so this fallback just gives the chapel + plaza a faint
  // physical footprint at city-model zooms.
  const center = [125.81721, 10.72224];
  const halfW = 0.00012; // ~13m east-west half (small chapel footprint)
  const halfH = 0.00010; // ~11m north-south half

  const chapel = [
    [center[0] - halfW, center[1] - halfH],
    [center[0] + halfW, center[1] - halfH],
    [center[0] + halfW, center[1] + halfH],
    [center[0] - halfW, center[1] + halfH],
    [center[0] - halfW, center[1] - halfH],
  ];

  const plazaHalfW = 0.00030; // ~33m plaza apron in front of the chapel
  const plazaHalfH = 0.00018;
  const plaza = [
    [center[0] - plazaHalfW, center[1] - plazaHalfH],
    [center[0] + plazaHalfW, center[1] - plazaHalfH],
    [center[0] + plazaHalfW, center[1] + plazaHalfH],
    [center[0] - plazaHalfW, center[1] + plazaHalfH],
    [center[0] - plazaHalfW, center[1] - plazaHalfH],
  ];

  return [
    {
      type: 'Feature',
      properties: {
        id: 'cagusu-an-plaza',
        height: 0.4,
        base: 0,
        color: '#D9C9A8',
      },
      geometry: { type: 'Polygon', coordinates: [plaza] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'cagusu-an-chapel',
        height: 6,
        base: 0,
        color: '#E8DCC1',
      },
      geometry: { type: 'Polygon', coordinates: [chapel] },
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

// ─── Magellan 3D ship (Three.js custom Mapbox layer) ──────────────────────
// A Magellan-era square-rigged nao rendered as a Mapbox `type: 'custom'`
// layer with `renderingMode: '3d'`. The layer reuses Mapbox's WebGL
// context (no separate fullscreen canvas) and is positioned via
// `MercatorCoordinate.fromLngLat`. Only renders when the active
// destination matches `visibleDestinationId`.
const MAGELLAN_SHIP_LAYER_ID = 'codex-magellan-ship-3d';

// ╔════════════════════════════════════════════════════════════════════╗
// ║  EDIT ME — Magellan ship placement                                 ║
// ║  All values below are easy to tweak; nothing else needs to change. ║
// ╚════════════════════════════════════════════════════════════════════╝
const MAGELLAN_SHIP_CONFIG = {
  visibleDestinationId: 'magellan-landing-site',
  // Anchor = the destination pin (Cagusu-an Church & Plaza).
  anchorLngLat: [125.81721, 10.72224],
  // Push the ship offshore so it doesn't float on top of the chapel.
  // Positive lng → east (out into the Philippine Sea).
  // At ~10.7°N, 0.0024° lng ≈ 265 m and 0.0006° lat ≈ 66 m.
  offshoreOffset: [0.0024, 0.0006],
  altitude: 0,            // meters above sea level (negative = sit deeper)
  scale: 1.6,             // multiplier on the meter-unit scale (1.0 = real-meter sized)
  // Yaw in degrees applied around the world-up axis (positive = CCW).
  // Default rotates the bow toward the northwest so the broadside faces
  // the camera approaching from the east at bearing 90.
  rotation: [0, 0, 35],
};

const SHIP_WOOD_DARK = 0x553720;
const SHIP_WOOD_MID = 0x7a5230;
const SHIP_WOOD_LIGHT = 0xa57440;
const SHIP_SAIL_CLOTH = 0xf3e7c8;
const SHIP_ROPE = 0x2a1c10;
const SHIP_FLAG_RED = 0xc0392b;
const SHIP_FLAG_GOLD = 0xd4a64a;
const SHIP_METAL = 0x2b2622;

function makeStandard(color, roughness = 0.85, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: opts.metalness ?? 0,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

// Parametric hull: ribs along X (keel), elliptical lower halves, with
// width / depth profiles that taper to a sharp bow and a wider, raised
// stern — the silhouette of a 16th-century nao.
function createHullGeometry({ length, beam, depth, ribs, ringPoints }) {
  const positions = [];
  const indices = [];

  for (let i = 0; i < ribs; i += 1) {
    const t = i / (ribs - 1); // 0 = stern, 1 = bow
    const x = -length / 2 + t * length;

    // Beam (half-width). Max near 0.45 along the keel, narrow at bow.
    const widthCurve = Math.sin(t * Math.PI) * (0.78 + 0.22 * (1 - t));
    const halfBeam = beam * widthCurve;

    // Keel depth — deepest in the middle, lifted at both ends.
    const keelDepth = -depth * Math.sin(Math.min(1, t * 1.35)) *
      Math.sin(Math.min(1, (1 - t) * 1.25));

    // Top deck-edge height: forecastle bump at bow, sterncastle rise at stern.
    const bowRise = t > 0.86 ? ((t - 0.86) / 0.14) * 0.9 : 0;
    const sternRise = t < 0.18 ? ((0.18 - t) / 0.18) * 1.4 : 0;
    const topY = bowRise + sternRise;

    for (let j = 0; j < ringPoints; j += 1) {
      const a = (j / (ringPoints - 1)) * Math.PI; // 0..PI
      const z = -halfBeam * Math.cos(a);
      const blend = Math.sin(a); // 0 at deck edges, 1 at keel
      const y = topY * (1 - blend) + keelDepth * blend;
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < ribs - 1; i += 1) {
    for (let j = 0; j < ringPoints - 1; j += 1) {
      const a = i * ringPoints + j;
      const b = a + 1;
      const c = (i + 1) * ringPoints + j;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Curved sail plane — slightly billowed by displacing the middle row.
function createSailGeometry(width, height, billow = 0.18) {
  const geo = new THREE.PlaneGeometry(width, height, 6, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (x / width) + 0.5;
    const v = (y / height) + 0.5;
    // Billow strongest in the middle, taper toward the edges.
    const bow = billow * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
    pos.setZ(i, bow * width);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildSquareSail({ width, height, material, position }) {
  const sail = new THREE.Mesh(createSailGeometry(width, height), material);
  sail.position.set(position[0], position[1], position[2]);
  // Sail bows forward (toward bow = +X), so face the curved side outward.
  sail.rotation.y = 0;
  return sail;
}

function buildMastAssembly({
  rootY,
  mastHeight,
  mastRadius,
  yardSpans, // array of { y, width, sailHeight }
  woodMat,
  sailMat,
  flag,
}) {
  const group = new THREE.Group();

  // Main mast pole
  const mastGeo = new THREE.CylinderGeometry(mastRadius * 0.7, mastRadius, mastHeight, 12);
  const mast = new THREE.Mesh(mastGeo, woodMat);
  mast.position.y = rootY + mastHeight / 2;
  group.add(mast);

  // Top cap / crow's nest disk
  const capGeo = new THREE.CylinderGeometry(mastRadius * 1.8, mastRadius * 1.2, 0.18, 12);
  const cap = new THREE.Mesh(capGeo, woodMat);
  cap.position.y = rootY + mastHeight - 0.5;
  group.add(cap);

  // Yards (cross beams) + sails
  yardSpans.forEach((spec, i) => {
    const yardGeo = new THREE.CylinderGeometry(0.08, 0.08, spec.width, 8);
    const yard = new THREE.Mesh(yardGeo, woodMat);
    yard.rotation.z = Math.PI / 2;
    yard.position.set(0, spec.y, 0);
    group.add(yard);

    // Sail hangs below the yard by spec.sailHeight, centered on the mast.
    const sail = buildSquareSail({
      width: spec.width * 0.92,
      height: spec.sailHeight,
      material: sailMat,
      position: [0, spec.y - spec.sailHeight / 2 - 0.04, 0.04],
    });
    group.add(sail);

    // Reef line / rope across the bottom of each sail.
    const reefGeo = new THREE.CylinderGeometry(0.025, 0.025, spec.width * 0.92, 6);
    const reef = new THREE.Mesh(reefGeo, makeStandard(SHIP_ROPE, 1.0));
    reef.rotation.z = Math.PI / 2;
    reef.position.set(0, spec.y - spec.sailHeight - 0.05, 0.04);
    group.add(reef);

    // Lift lines from yard tip → mast top.
    if (i === yardSpans.length - 1) {
      const lineMat = makeStandard(SHIP_ROPE, 1.0);
      [-1, 1].forEach((sign) => {
        const len = mastHeight - (spec.y - rootY);
        const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, len * 1.05, 5);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(sign * spec.width * 0.46, spec.y + len * 0.45, 0);
        line.rotation.z = sign * Math.atan2(spec.width * 0.46, len) * 0.95;
        group.add(line);
      });
    }
  });

  // Flag at the masthead
  if (flag) {
    const flagGeo = new THREE.PlaneGeometry(flag.width, flag.height, 4, 2);
    const fp = flagGeo.attributes.position;
    for (let i = 0; i < fp.count; i += 1) {
      const x = fp.getX(i);
      const wave = Math.sin((x / flag.width) * Math.PI * 1.6) * 0.06;
      fp.setZ(i, wave);
    }
    fp.needsUpdate = true;
    flagGeo.computeVertexNormals();
    const flagMat = makeStandard(flag.color, 0.85, { side: THREE.DoubleSide });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(flag.width / 2 + 0.05, rootY + mastHeight + 0.35, 0);
    group.add(flagMesh);

    // Flagpole continuation above the mast top
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6);
    const pole = new THREE.Mesh(poleGeo, woodMat);
    pole.position.set(0, rootY + mastHeight + 0.45, 0);
    group.add(pole);
  }

  return group;
}

function buildMagellanShip() {
  const root = new THREE.Group();

  const hullDark = makeStandard(SHIP_WOOD_DARK, 0.9);
  const hullMid = makeStandard(SHIP_WOOD_MID, 0.85);
  const hullLight = makeStandard(SHIP_WOOD_LIGHT, 0.8);
  const sailMat = makeStandard(SHIP_SAIL_CLOTH, 0.95, { side: THREE.DoubleSide });
  const ropeMat = makeStandard(SHIP_ROPE, 1.0);
  const metalMat = makeStandard(SHIP_METAL, 0.6, { metalness: 0.5 });

  // ── Hull ───────────────────────────────────────────────────────────
  // Modeled in meters: 28 m overall length, ~7.6 m beam, ~3.6 m depth.
  const hullGeo = createHullGeometry({
    length: 28,
    beam: 3.8,
    depth: 3.6,
    ribs: 28,
    ringPoints: 18,
  });
  const hull = new THREE.Mesh(hullGeo, hullDark);
  hull.position.y = 2.0; // float waterline halfway up the hull
  root.add(hull);

  // Hull wale — a lighter band along the deck line (port + starboard).
  [-1, 1].forEach((sign) => {
    const waleGeo = new THREE.BoxGeometry(26, 0.18, 0.22);
    const wale = new THREE.Mesh(waleGeo, hullLight);
    wale.position.set(0, 2.0, sign * 3.3);
    root.add(wale);
  });

  // ── Deck planking ──────────────────────────────────────────────────
  const deckGeo = new THREE.BoxGeometry(24, 0.12, 6.3);
  const deck = new THREE.Mesh(deckGeo, hullMid);
  deck.position.set(0.4, 2.05, 0);
  root.add(deck);

  // ── Sterncastle (raised aft structure, 2 stages) ──────────────────
  const sternBaseGeo = new THREE.BoxGeometry(5.5, 2.2, 5.6);
  const sternBase = new THREE.Mesh(sternBaseGeo, hullDark);
  sternBase.position.set(-10.5, 3.2, 0);
  root.add(sternBase);

  const sternUpperGeo = new THREE.BoxGeometry(4.2, 1.4, 4.6);
  const sternUpper = new THREE.Mesh(sternUpperGeo, hullMid);
  sternUpper.position.set(-11.2, 5.0, 0);
  root.add(sternUpper);

  // Sterncastle railing
  const sternRailGeo = new THREE.BoxGeometry(4.4, 0.14, 0.16);
  const sternRailFore = new THREE.Mesh(sternRailGeo, hullLight);
  sternRailFore.position.set(-11.2, 5.8, 2.4);
  root.add(sternRailFore);
  const sternRailAft = new THREE.Mesh(sternRailGeo, hullLight);
  sternRailAft.position.set(-11.2, 5.8, -2.4);
  root.add(sternRailAft);

  // Stern windows (gallery) — three rectangles set into the back face.
  for (let i = -1; i <= 1; i += 1) {
    const winGeo = new THREE.BoxGeometry(0.06, 0.7, 0.5);
    const win = new THREE.Mesh(winGeo, makeStandard(0x2a2a3a, 0.6, { metalness: 0.4 }));
    win.position.set(-13.3, 3.4, i * 1.0);
    root.add(win);
  }

  // ── Forecastle (raised bow structure) ──────────────────────────────
  const foreGeo = new THREE.BoxGeometry(3.5, 1.7, 4.5);
  const foreCastle = new THREE.Mesh(foreGeo, hullDark);
  foreCastle.position.set(10.5, 2.95, 0);
  root.add(foreCastle);

  // Bowsprit (forward-leaning small mast)
  const bowspritGeo = new THREE.CylinderGeometry(0.14, 0.18, 6.5, 10);
  const bowsprit = new THREE.Mesh(bowspritGeo, hullDark);
  bowsprit.position.set(14.0, 4.4, 0);
  bowsprit.rotation.z = Math.PI / 2 + 0.25; // tilted upward toward bow
  root.add(bowsprit);

  // Tiny spritsail under the bowsprit
  const spritSailGeo = new THREE.PlaneGeometry(2.6, 1.5, 4, 3);
  const spritSail = new THREE.Mesh(spritSailGeo, sailMat);
  spritSail.position.set(13.5, 3.5, 0);
  spritSail.rotation.y = Math.PI / 2;
  root.add(spritSail);

  // ── Masts ─────────────────────────────────────────────────────────
  // Foremast (forward), Mainmast (mid, tallest), Mizzenmast (aft, lateen).
  const deckY = 2.1;

  const foremast = buildMastAssembly({
    rootY: deckY,
    mastHeight: 14,
    mastRadius: 0.34,
    yardSpans: [
      { y: deckY + 6.5, width: 7.5, sailHeight: 3.6 },
      { y: deckY + 11.0, width: 5.6, sailHeight: 2.6 },
    ],
    woodMat: hullMid,
    sailMat,
    flag: { width: 1.2, height: 0.6, color: SHIP_FLAG_RED },
  });
  foremast.position.set(7.5, 0, 0);
  root.add(foremast);

  const mainmast = buildMastAssembly({
    rootY: deckY,
    mastHeight: 18,
    mastRadius: 0.42,
    yardSpans: [
      { y: deckY + 7.5, width: 9.5, sailHeight: 4.2 },
      { y: deckY + 13.0, width: 7.0, sailHeight: 3.2 },
      { y: deckY + 17.2, width: 4.4, sailHeight: 1.8 },
    ],
    woodMat: hullMid,
    sailMat,
    flag: { width: 1.5, height: 0.8, color: SHIP_FLAG_GOLD },
  });
  mainmast.position.set(0, 0, 0);
  root.add(mainmast);

  // Mizzenmast — shorter, with a lateen (triangular) sail
  const mizzenHeight = 11.5;
  const mizzenGeo = new THREE.CylinderGeometry(0.22, 0.32, mizzenHeight, 10);
  const mizzen = new THREE.Mesh(mizzenGeo, hullMid);
  mizzen.position.set(-8.5, deckY + mizzenHeight / 2, 0);
  root.add(mizzen);

  // Lateen yard (long diagonal beam)
  const lateenYardGeo = new THREE.CylinderGeometry(0.09, 0.09, 9.0, 8);
  const lateenYard = new THREE.Mesh(lateenYardGeo, hullMid);
  lateenYard.position.set(-8.5, deckY + 8.0, 0);
  lateenYard.rotation.z = -Math.PI / 5;
  root.add(lateenYard);

  // Lateen triangular sail
  const lateenShape = new THREE.Shape();
  lateenShape.moveTo(-3.8, -3.6);
  lateenShape.lineTo(4.2, 1.2);
  lateenShape.lineTo(-3.6, 1.6);
  lateenShape.closePath();
  const lateenGeo = new THREE.ShapeGeometry(lateenShape);
  const lateenSail = new THREE.Mesh(lateenGeo, sailMat);
  lateenSail.position.set(-8.5, deckY + 7.5, 0.05);
  lateenSail.rotation.z = -Math.PI / 5;
  root.add(lateenSail);

  // Flag at mizzentop
  const mizzenFlagGeo = new THREE.PlaneGeometry(0.9, 0.5, 4, 2);
  const mizzenFlag = new THREE.Mesh(mizzenFlagGeo, makeStandard(SHIP_FLAG_RED, 0.85, { side: THREE.DoubleSide }));
  mizzenFlag.position.set(-8.5 + 0.5, deckY + mizzenHeight + 0.3, 0);
  root.add(mizzenFlag);

  // ── Rigging — fore-aft stays and shrouds ──────────────────────────
  const stays = [
    // Forestay: bowsprit tip → foremast top
    { from: [14.0, 4.4, 0], to: [7.5, deckY + 14, 0] },
    // Foremast → mainmast
    { from: [7.5, deckY + 14, 0], to: [0, deckY + 18, 0] },
    // Mainmast → mizzenmast
    { from: [0, deckY + 18, 0], to: [-8.5, deckY + mizzenHeight, 0] },
    // Mizzenmast → sterncastle aft
    { from: [-8.5, deckY + mizzenHeight, 0], to: [-12.5, 5.6, 0] },
  ];
  stays.forEach(({ from, to }) => {
    const v1 = new THREE.Vector3(...from);
    const v2 = new THREE.Vector3(...to);
    const len = v1.distanceTo(v2);
    const geo = new THREE.CylinderGeometry(0.04, 0.04, len, 6);
    const line = new THREE.Mesh(geo, ropeMat);
    line.position.copy(v1).lerp(v2, 0.5);
    // Orient the cylinder (default along Y) toward v2
    const dir = v2.clone().sub(v1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    line.quaternion.copy(quat);
    root.add(line);
  });

  // Shrouds — slanted lines from masthead to deck edge port + starboard.
  const shroudSpec = [
    { x: 7.5, top: deckY + 13, z: 2.6 },
    { x: 7.5, top: deckY + 13, z: -2.6 },
    { x: 0, top: deckY + 17, z: 2.9 },
    { x: 0, top: deckY + 17, z: -2.9 },
    { x: -8.5, top: deckY + mizzenHeight - 1, z: 2.4 },
    { x: -8.5, top: deckY + mizzenHeight - 1, z: -2.4 },
  ];
  shroudSpec.forEach(({ x, top, z }) => {
    const v1 = new THREE.Vector3(x, top, 0);
    const v2 = new THREE.Vector3(x, deckY + 0.2, z);
    const len = v1.distanceTo(v2);
    const geo = new THREE.CylinderGeometry(0.035, 0.035, len, 6);
    const line = new THREE.Mesh(geo, ropeMat);
    line.position.copy(v1).lerp(v2, 0.5);
    const dir = v2.clone().sub(v1).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    line.quaternion.copy(quat);
    root.add(line);
  });

  // ── Anchor + bow ornament ─────────────────────────────────────────
  const anchorStockGeo = new THREE.BoxGeometry(0.1, 1.4, 0.1);
  const anchorStock = new THREE.Mesh(anchorStockGeo, metalMat);
  anchorStock.position.set(13.5, 2.4, 1.8);
  root.add(anchorStock);
  const anchorArmGeo = new THREE.BoxGeometry(0.9, 0.1, 0.1);
  const anchorArm = new THREE.Mesh(anchorArmGeo, metalMat);
  anchorArm.position.set(13.5, 1.7, 1.8);
  root.add(anchorArm);

  return root;
}

function createMagellanShipLayer() {
  return {
    id: MAGELLAN_SHIP_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Warm sunlight from the east (matches camera bearing 90); cool
      // bounce fill from the back to keep the shadow side readable.
      this.scene.add(new THREE.AmbientLight(0xfff1d6, 0.6));
      const sun = new THREE.DirectionalLight(0xfff2c8, 1.25);
      sun.position.set(0, 80, 60);
      this.scene.add(sun);
      const fill = new THREE.DirectionalLight(0xc6d8ff, 0.35);
      fill.position.set(-60, 40, -40);
      this.scene.add(fill);

      this.ship = buildMagellanShip();
      this.scene.add(this.ship);

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      this.renderer.autoClear = false;
    },
    render(gl, matrix) {
      if (!this.map) return;
      if (!this.map.codexMagellanShipVisible) return;
      if (!this.scene || !this.renderer) return;

      const cfg = MAGELLAN_SHIP_CONFIG;
      const shipLng = cfg.anchorLngLat[0] + cfg.offshoreOffset[0];
      const shipLat = cfg.anchorLngLat[1] + cfg.offshoreOffset[1];

      const merc = mapboxgl.MercatorCoordinate.fromLngLat(
        [shipLng, shipLat],
        cfg.altitude,
      );
      const mercScale = merc.meterInMercatorCoordinateUnits() * cfg.scale;

      const rotX = THREE.MathUtils.degToRad(cfg.rotation[0] || 0);
      const rotY = THREE.MathUtils.degToRad(cfg.rotation[1] || 0);
      const rotZ = THREE.MathUtils.degToRad(cfg.rotation[2] || 0);

      // Mapbox is Z-up; Three.js is Y-up. The PI/2 rotation around X
      // aligns the ship's deck plane (XZ in Three.js) with the ground.
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        Math.PI / 2 + rotX,
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        rotY,
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        rotZ,
      );

      // Subtle bob so the ship reads as floating — only animated while
      // the ship is visible to avoid burning frames otherwise.
      const t = performance.now() / 1000;
      this.ship.position.y = Math.sin(t * 0.9) * 0.18;
      this.ship.rotation.z = Math.sin(t * 0.55) * 0.012;

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(merc.x, merc.y, merc.z)
        .scale(new THREE.Vector3(mercScale, -mercScale, mercScale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
    onRemove() {
      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat) => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
      // Renderer shares Mapbox's GL context — do NOT call renderer.dispose()
      // here, that would tear down Mapbox too.
      this.scene = null;
      this.ship = null;
      this.renderer = null;
      this.camera = null;
    },
  };
}

function ensureMagellanShipLayer(map) {
  if (!map.isStyleLoaded()) return;
  if (map.getLayer(MAGELLAN_SHIP_LAYER_ID)) return;
  safelyApply(() => map.addLayer(createMagellanShipLayer()));
}

function removeMagellanShipLayer(map) {
  if (!map.getLayer || !map.getLayer(MAGELLAN_SHIP_LAYER_ID)) return;
  safelyApply(() => map.removeLayer(MAGELLAN_SHIP_LAYER_ID));
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

  // Hide the 3D ship whenever destination overlays go away — keeps it
  // confined to the Magellan stop and avoids ghost renders elsewhere.
  map.codexMagellanShipVisible = false;
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
  // Cagusu-an Church and Plaza, Homonhon Island. Cinematic close-up that
  // frames the offshore Three.js ship + coastline. Desktop uses the
  // city-model style for terrain + scale detail; mobile drops to the
  // lighter earth style but still pulls in close enough for the ship to
  // remain visible against the Philippine Sea.
  if (destination.id === 'magellan-landing-site') {
    return {
      profile: isNarrow ? 'earth' : 'city-model',
      styleUrl: isNarrow ? EARTH_STYLE_URL : CITY_MODEL_STYLE_URL,
      styleConfig: isNarrow ? EARTH_BASEMAP_CONFIG : CITY_BASEMAP_CONFIG,
      camera: isNarrow
        ? { zoom: 14.8, pitch: 55, bearing: 90 }
        : DESTINATION_VIEW_OVERRIDES['magellan-landing-site'],
      curve: 1.25,
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

  // Toggle the 3D Magellan ship for its dedicated destination only.
  map.codexMagellanShipVisible =
    destination.id === MAGELLAN_SHIP_CONFIG.visibleDestinationId;
  if (map.codexMagellanShipVisible) {
    ensureMagellanShipLayer(map);
  }

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
  // Tracks the active map instance so the HUD overlay can subscribe to its
  // events. Kept separate from `mapRef` because state changes trigger a
  // re-render — the HUD needs that to mount once the map is ready.
  const [hudMap, setHudMap] = useState(null);
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
    setHudMap(map);
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
      // Custom 3D Magellan ship layer — Mapbox tears down custom layers
      // on every style switch, so re-add it whenever the style reloads.
      ensureMagellanShipLayer(map);

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
      // Explicitly remove the 3D ship before tearing down the map so its
      // onRemove() runs and disposes the Three.js geometry/materials.
      removeMagellanShipLayer(map);
      disposePreloadMap();
      map.remove();
      mapRef.current = null;
      setHudMap(null);
    };
  }, [token]);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Live camera coordinate / debug HUD — remove this line + the MapHud
          import above to disable the overlay. */}
      <MapHud map={hudMap} />

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
