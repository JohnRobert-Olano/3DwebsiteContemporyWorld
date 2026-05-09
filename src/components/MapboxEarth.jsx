import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
const EARTH_MOTION_EASE = 0.085;
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
  const panels = Array.from(document.querySelectorAll('.panel-section'));
  const viewportAnchor = window.innerHeight * 0.5;

  const activeIndex = panels.findIndex((panel) => {
    const rect = panel.getBoundingClientRect();
    return rect.top <= viewportAnchor && rect.bottom >= viewportAnchor;
  });

  if (activeIndex === -1) {
    return 0;
  }

  return activeIndex % 2 === 0 ? -1 : 1;
}

function getEarthIdleZoom() {
  const isNarrow = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;

  if (isNarrow) {
    return 1.18;
  }

  if (isTablet) {
    return 1.58;
  }

  return Math.min(1.9, Math.max(1.76, window.innerWidth * 0.00125));
}

function getEarthHorizontalPadding() {
  const isNarrow = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;
  const ratio = isNarrow ? 0.4 : isTablet ? 0.52 : 0.62;
  const min = isNarrow ? 130 : isTablet ? 300 : 640;
  const max = isNarrow ? 240 : isTablet ? 500 : 940;

  return Math.min(max, Math.max(min, window.innerWidth * ratio));
}

function startEarthScrollMotion(map) {
  let frameId = 0;
  let lastTime = performance.now();
  let spinLng = EARTH_IDLE_CENTER[0];
  let horizontalDirection = 0;

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
      horizontalDirection += (targetDirection - horizontalDirection) * EARTH_MOTION_EASE;
      spinLng = wrapLongitude(spinLng + EARTH_ROTATION_DEGREES_PER_SECOND * deltaSeconds);

      const paddingAmount = getEarthHorizontalPadding() * Math.abs(horizontalDirection);

      map.jumpTo({
        center: [spinLng, EARTH_IDLE_CENTER[1]],
        zoom: getEarthIdleZoom(),
        pitch: 0,
        bearing: 0,
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
      config: {
        basemap: EARTH_BASEMAP_CONFIG,
      },
      attributionControl: true,
    });

    mapRef.current = map;
    map.codexSceneProfile = 'earth';
    map.codexRouteAnimating = false;
    map.codexStyleSwitching = false;
    const stopEarthScrollMotion = startEarthScrollMotion(map);

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

    return () => {
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

      <div className="fixed bottom-24 left-4 z-40 pointer-events-auto rounded-lg border border-[#0A6ED3]/30 bg-black/70 p-3 shadow-2xl backdrop-blur-xl sm:left-6">
        <button
          type="button"
          onClick={() => mapRef.current && flyToColosseum(mapRef.current)}
          className="cursor-pointer rounded-md border border-[#0A6ED3]/60 bg-[#0A6ED3]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-[#0A6ED3]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DB7F0]"
        >
          Colosseum
        </button>
        <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gray-400">
          Globe to Rome
        </p>
      </div>

      {setupError && (
        <div className="fixed left-1/2 top-24 z-50 w-[min(90vw,32rem)] -translate-x-1/2 rounded-lg border border-red-500/40 bg-black/80 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">
          <p className="font-semibold uppercase tracking-[0.16em] text-red-300">
            Mapbox setup issue
          </p>
          <p className="mt-2 text-gray-200">{setupError}</p>
        </div>
      )}
    </>
  );
}
