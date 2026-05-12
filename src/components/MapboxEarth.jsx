import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import SlidePanel from './SlidePanel';

const ROME_SLIDE = {
  tag: 'Slide 01',
  subTitle: 'Destination — Rome',
  title: 'Lorem Ipsum',
  summary:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  points: [
    {
      label: 'Lorem',
      text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    {
      label: 'Ipsum',
      text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
  ],
  example:
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
};

const ROME = [12.4964, 41.9028];
const COLOSSEUM = {
  center: [12.4922, 41.8902],
};
const EARTH_STYLE_URL = 'mapbox://styles/markjohn17/cmoyf4n2b003p01rfc3r655m4';
const CITY_MODEL_STYLE_URL = 'mapbox://styles/markjohn17/cmoyg3ev9000r01suak0y71v7';
const TERRAIN_SOURCE_ID = 'mapbox-dem';
const EARTH_RESTORE_ZOOM = 16.5;
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

function startEarthScrollMotion(map, onScrollStatusChange) {
  let frameId = 0;
  let lastTime = performance.now();
  let spinLng = EARTH_IDLE_CENTER[0];
  let horizontalDirection = 0;
  let lastIsEnd = false;

  const tick = (time) => {
    const deltaSeconds = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const shouldAnimateEarth = (
      map.codexSceneProfile === 'earth'
      && !map.codexRouteAnimating
      && !map.codexStyleSwitching
      && map.isStyleLoaded()
      && map.getZoom() <= EARTH_SCROLL_MOTION_MAX_ZOOM
    );

    if (shouldAnimateEarth) {
      const targetDirection = getEarthScrollDirection();
      const transferVelocity = targetDirection - horizontalDirection;
      horizontalDirection += transferVelocity * EARTH_MOTION_EASE;
      
      // Add extra spin proportional to transfer velocity so it "spins" while transferring
      const transferSpin = Math.abs(transferVelocity) * 300;
      spinLng = wrapLongitude(spinLng + (EARTH_ROTATION_DEGREES_PER_SECOND + transferSpin) * deltaSeconds);

      const paddingAmount = getEarthHorizontalPadding() * Math.abs(horizontalDirection);

      // Calculate hover and banking effects
      const timeInSeconds = time / 1000;
      const bobbing = Math.sin(timeInSeconds * 1.5) * 1.5; // subtle vertical hover
      const banking = horizontalDirection * -12; // dynamic banking when moving left/right

      // Calculate dynamic zoom: small in the center, massive when pushed to the sides
      const baseZoom = 1.35;
      const targetEdgeZoom = getEarthIdleZoom();
      const dynamicZoom = baseZoom + (targetEdgeZoom - baseZoom) * Math.abs(horizontalDirection);

      map.jumpTo({
        center: [spinLng, EARTH_IDLE_CENTER[1] + bobbing],
        zoom: dynamicZoom,
        pitch: Math.abs(horizontalDirection) * 8, // slight tilt back when shifted
        bearing: banking,
        padding: {
          top: 0,
          bottom: 0,
          left: horizontalDirection > 0 ? paddingAmount : 0,
          right: horizontalDirection < 0 ? paddingAmount : 0,
        },
      });

      // Only show the map button when we explicitly hit the footer spacer at the absolute bottom
      const currentIsEnd = !!window.isAtEnd;
      if (currentIsEnd !== lastIsEnd) {
        lastIsEnd = currentIsEnd;
        onScrollStatusChange(currentIsEnd);
      }
    }

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
  };
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

function restoreEarthStyleWhenZoomedOut(map) {
  const shouldRestoreEarth = (
    map.codexSceneProfile === 'city-model'
    && !map.codexRouteAnimating
    && !map.codexStyleSwitching
    && map.getZoom() <= EARTH_RESTORE_ZOOM
  );

  if (shouldRestoreEarth) {
    void switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');
  }
}

async function flyToColosseum(map) {
  map.codexRouteAnimating = true;

  // Enable all interactions for free exploration
  map.scrollZoom.enable();
  map.boxZoom.enable();
  map.dragRotate.enable();
  map.dragPan.enable();
  map.keyboard.enable();
  map.doubleClickZoom.enable();
  map.touchZoomRotate.enable();

  try {
    await switchSceneStyle(map, EARTH_STYLE_URL, EARTH_BASEMAP_CONFIG, 'earth');

    map.flyTo({
      center: ROME,
      zoom: 4.5,
      pitch: 24,
      bearing: -12,
      duration: 2400,
      curve: 1.35,
      essential: true,
    });
    await waitForMoveEnd(map);

    await switchSceneStyle(map, CITY_MODEL_STYLE_URL, CITY_BASEMAP_CONFIG, 'city-model');

    map.flyTo({
      center: COLOSSEUM.center,
      zoom: 12.8,
      pitch: 54,
      bearing: -24,
      duration: 2600,
      curve: 1.25,
      essential: true,
    });
    await waitForMoveEnd(map);

    map.flyTo({
      center: COLOSSEUM.center,
      zoom: 17.25,
      pitch: 56,
      bearing: -32,
      duration: 3200,
      curve: 1.15,
      essential: true,
    });
    await waitForMoveEnd(map);
  } finally {
    map.codexRouteAnimating = false;
  }
}

export default function MapboxEarth() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState('');
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [showRomeSlide, setShowRomeSlide] = useState(false);

  const handleExploreRome = async () => {
    if (!mapRef.current) return;
    if (mapRef.current.codexRouteAnimating) return;
    await flyToColosseum(mapRef.current);
    setShowRomeSlide(true);
  };
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
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      dragPan: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      config: {
        basemap: EARTH_BASEMAP_CONFIG,
      },
      attributionControl: false,
    });

    mapRef.current = map;
    map.codexSceneProfile = 'earth';
    map.codexRouteAnimating = false;
    map.codexStyleSwitching = false;
    const stopEarthScrollMotion = startEarthScrollMotion(map, (endStatus) => {
      setIsAtEnd(endStatus);
    });

    map.on('style.load', () => {
      const config = map.codexSceneProfile === 'city-model'
        ? CITY_BASEMAP_CONFIG
        : EARTH_BASEMAP_CONFIG;

      enhanceScene(map, config);

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
      setMapError(message);
    });

    map.on('zoomend', () => {
      restoreEarthStyleWhenZoomedOut(map);
    });

    const handleResetGlobe = async () => {
      if (!mapRef.current) return;
      const m = mapRef.current;

      setShowRomeSlide(false);
      m.codexRouteAnimating = true;

      m.scrollZoom.disable();
      m.boxZoom.disable();
      m.dragRotate.disable();
      m.dragPan.disable();
      m.keyboard.disable();
      m.doubleClickZoom.disable();
      m.touchZoomRotate.disable();

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

      <AnimatePresence>
        {isAtEnd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none"
          >
            <button
              type="button"
              onClick={handleExploreRome}
              className="pointer-events-auto cursor-pointer rounded-full border border-[#0A6ED3]/60 bg-[#0A6ED3]/20 p-4 text-white transition-all duration-300 hover:bg-[#0A6ED3]/40 hover:scale-110 hover:shadow-[0_0_20px_rgba(10,110,211,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7DB7F0] flex items-center justify-center backdrop-blur-xl"
              aria-label="Explore Rome"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>



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
