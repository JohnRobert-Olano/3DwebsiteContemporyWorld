import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import SlidePanel from './SlidePanel';
import MapHud from './MapHud';
import EarthLoadingState from './EarthLoadingState';
import { destinations } from '../lib/data/destinations';
import {
  poseFromMapbox,
  setCameraPose,
  panToPose,
  zoomThroughEarthLayers,
  lerpMapboxPoses,
  readCameraAsMapboxPose,
  projectLngLat,
} from '../lib/cesium/cameraController';

const ROME_SLIDE = {
  tag: 'Field note',
  subTitle: 'Rome descent',
  title: 'Colosseum',
  summary:
    'Ancient Roman amphitheater, the largest ever built. It anchors the transition from the Rome descent into the global destination journey.',
  points: [
    { label: 'Built', text: '70-80 AD' },
    { label: 'Location', text: 'Rome, Italy' },
  ],
  example:
    'Scroll onward to keep the same globe in view as it rotates through twelve historical and cultural stops.',
};

const ROME = [12.4964, 41.9028];
const COLOSSEUM = { center: [12.49143, 41.89191] };
const EARTH_IDLE_CENTER = [12.4922, 22];
const EARTH_OVERVIEW_ZOOM = 1.12;
const EARTH_ROTATION_DEGREES_PER_SECOND = 0.82;
const EARTH_MOTION_EASE = 0.0055;

function SetupErrorState({ message }) {
  return (
    <section
      className="fixed inset-0 z-30 flex items-center justify-center px-5 py-24"
      aria-labelledby="setup-error-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(242,109,91,0.16),transparent_32%),linear-gradient(180deg,rgba(5,7,14,0.28),rgba(5,7,14,0.82))]" />
      <article className="relative w-full max-w-2xl rounded-[8px] border border-white/[0.12] bg-bg/[0.78] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
          Globe setup paused
        </p>
        <h2
          id="setup-error-title"
          className="mt-4 font-display text-3xl font-semibold leading-tight tracking-normal sm:text-4xl"
        >
          The 3D Earth needs two local environment variables.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/[0.76] sm:text-base">
          Add the required keys to your local or deployment environment, then restart the Vite server. The site keeps the keys out of the client UI.
        </p>
        <div className="mt-6 grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white sm:grid-cols-2">
          <code className="rounded-[5px] border border-white/[0.10] bg-white/[0.06] px-3 py-3">
            VITE_GOOGLE_MAPS_API_KEY
          </code>
          <code className="rounded-[5px] border border-white/[0.10] bg-white/[0.06] px-3 py-3">
            VITE_CESIUM_ION_TOKEN
          </code>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-white/[0.58]">
          Current check: {message}
        </p>
      </article>
    </section>
  );
}

// Mapbox-shaped keyframes kept unchanged so visual tuning notes from the
// original component still apply 1:1. They are converted to Cesium poses at
// the boundary by lerpMapboxPoses().
const ROME_KEYFRAMES = {
  earth: {
    start: { center: EARTH_IDLE_CENTER, zoom: EARTH_OVERVIEW_ZOOM, pitch: 0, bearing: 0 },
    mid: { center: ROME, zoom: 5.5, pitch: 38, bearing: -16 },
  },
  city: {
    mid: { center: ROME, zoom: 5.5, pitch: 38, bearing: -16 },
    end: { center: COLOSSEUM.center, zoom: 17.79, pitch: 59.5, bearing: 336.8 },
  },
};

// Per-destination camera framing. Mapbox-shaped (zoom/pitch/bearing) for parity
// with the original tuning comments; converted on use.
const DESTINATION_VIEW_OVERRIDES = {
  'colosseum': { zoom: 17.79, pitch: 59.5, bearing: 336.8, altitude: 0 },
  'saint-peters-basilica': { zoom: 17.57, pitch: 72.7, bearing: 313.7, altitude: 0 },
  // Xi'an falls in Google's photogrammetry coverage gap (no 3D mesh for any
  // Chinese city). At ground level the wall reads as flat satellite imagery,
  // so frame it as an oblique aerial instead - the full ~3.4 km × 2.6 km
  // rectangular fortification + moat is unmistakable from this altitude.
  'xian-city-wall': { zoom: 14, pitch: 45, bearing: 0 },
  'royal-palace-madrid': { zoom: 15.87, pitch: 73.9, bearing: 334.6, altitude: 0 },
  'neuschwanstein-castle': { zoom: 15.57, pitch: 72.3, bearing: 278.7, altitude: 0 },
  'buckingham-palace': { zoom: 18.12, pitch: 70.4, bearing: 261.1, altitude: 0 },
  'big-ben': { zoom: 17.59, pitch: 76.5, bearing: 213.6, altitude: 0 },
  'statue-of-liberty': { zoom: 18.59, pitch: 66.6, bearing: 354.0, altitude: 0 },
  'white-house': { zoom: 17.73, pitch: 73.2, bearing: 180.1, altitude: 0 },
  'world-trade-center-nyc': { zoom: 16.37, pitch: 61.6, bearing: 54.7, altitude: 0 },
  'san-salvador-island': { zoom: 11.38, pitch: 46.6, bearing: 334.8, altitude: 0 },
  // Original Mapbox pitch was 85 (near-horizon). At Cesium height 280 m this
  // would clip the camera into terrain - pulled back to pitch 75 / zoom 17.5
  // to keep the photogrammetry in frame. Re-tune in dev if needed.
  'magellan-landing-site': { zoom: 17.25, pitch: 67.6, bearing: 260.9, altitude: 0 },
};

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const wrapLongitude = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function destinationToLngLat(destination) {
  return [destination.lon, destination.lat];
}

function getDestinationCamera(destination) {
  return destination.camera
    || DESTINATION_VIEW_OVERRIDES[destination.id]
    || { zoom: 17.6, pitch: 70, bearing: 0 };
}

function getDestinationTourState() {
  const active = !!window.destinationTourActive;
  const state = window.destinationTourState || { index: 0, progress: 0 };
  return { active, index: state.index ?? 0, progress: state.progress ?? 0 };
}

// ── Rome scrub ─────────────────────────────────────────────────────────────
// Two-phase, scrub-driven (no animation). Drives the camera with a per-frame
// setView() based on window.romeScrollProgress.
function applyRomeScrollState(viewer, progress, codex) {
  if (codex.userInteracting) return;
  const idleAlt = codex.elevations.get('EARTH_IDLE') ?? 0;
  const romeAlt = codex.elevations.get('ROME') ?? 20;
  const colossAlt = DESTINATION_VIEW_OVERRIDES['colosseum']?.altitude ?? codex.elevations.get('colosseum') ?? 30;
  let pose;
  if (progress < 0.5) {
    const t = easeInOutCubic(progress / 0.5);
    pose = lerpMapboxPoses(ROME_KEYFRAMES.earth.start, ROME_KEYFRAMES.earth.mid, t, idleAlt, romeAlt);
  } else {
    const t = easeInOutCubic((progress - 0.5) / 0.5);
    pose = lerpMapboxPoses(ROME_KEYFRAMES.city.mid, ROME_KEYFRAMES.city.end, t, romeAlt, colossAlt);
  }
  setCameraPose(viewer, pose);
  codex.lastAppliedPose = pose;
}

function applyRomeReducedMotionState(viewer, progress, codex) {
  if (codex.userInteracting) return;
  const pose = progress >= 0.5
    ? poseFromMapbox(
      { center: COLOSSEUM.center, zoom: 17.79, pitch: 59.5, bearing: 336.8 },
      DESTINATION_VIEW_OVERRIDES['colosseum']?.altitude ?? codex.elevations.get('colosseum') ?? 30,
    )
    : poseFromMapbox(
      { center: EARTH_IDLE_CENTER, zoom: EARTH_OVERVIEW_ZOOM, pitch: 0, bearing: 0 },
      codex.elevations.get('EARTH_IDLE') ?? 0,
    );
  setCameraPose(viewer, pose);
  codex.lastAppliedPose = pose;
}

// ── Destination tour ───────────────────────────────────────────────────────
// Event-based: fires once per landmark transition and runs a staged
// Earth-scale zoom. Sets window.codexDestinationFlying so the scroll layer
// knows to defer further snap-advances until the final local view settles.
function applyDestinationTourState(viewer, tourState, codex) {
  if (codex.userInteracting) return;
  if (window.codexDestinationFlying) return;

  const destination = destinations[tourState.index];
  if (!destination) return;

  // Re-entering the same landmark (e.g., scroll back into the pin): hold the
  // current view - don't re-fire flyTo.
  if (codex.destinationActiveIndex === tourState.index) return;
  codex.destinationActiveIndex = tourState.index;

  const reducedMotion = prefersReducedMotion();
  const camera = getDestinationCamera(destination);
  const altitude = camera.altitude ?? codex.elevations.get(destination.id) ?? 100;
  const pose = poseFromMapbox({
    center: destinationToLngLat(destination),
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing,
  }, altitude);

  if (reducedMotion) {
    setCameraPose(viewer, pose);
    codex.lastAppliedPose = pose;
    return;
  }

  // Cancel any staged zoom that's still running from a previous landmark
  // transition; its complete callback will not fire because the new zoom owns
  // window.codexDestinationFlying from here.
  if (codex.cancelActivePan) {
    codex.cancelActivePan();
    codex.cancelActivePan = null;
  }

  // The starting pose for the staged zoom is the last pose we applied (Rome
  // scrub end, idle rotation tick, or the previous landmark). If no prior
  // driver has run yet, the zoom blooms out from the destination and settles
  // back into the tuned local camera.
  const startPose = codex.lastAppliedPose ?? pose;

  window.codexDestinationFlying = true;
  const flightToken = Symbol('codex-flight');
  codex.activeFlightToken = flightToken;

  // Three-layer transition: pull back to Earth scale, reframe at regional
  // altitude, then descend into the tuned landmark camera.
  codex.cancelActivePan = zoomThroughEarthLayers(viewer, startPose, pose, {
    isInteracting: () => codex.userInteracting,
    complete: () => {
      if (codex.activeFlightToken === flightToken) {
        window.codexDestinationFlying = false;
        codex.lastAppliedPose = pose;
        codex.cancelActivePan = null;
      }
    },
    cancel: () => {
      if (codex.activeFlightToken === flightToken) {
        window.codexDestinationFlying = false;
        codex.cancelActivePan = null;
      }
    },
  });
}

// ── Idle Earth (between Rome and the first landmark) ───────────────────────
// Slow autonomous rotation with subtle bobbing + banking. Reads
// window.globeTargetDirection to lean the globe left/right while the user
// scrolls between section panels.
function buildEarthIdleDriver() {
  let spinLng = EARTH_IDLE_CENTER[0];
  let horizontalDirection = 0;

  return function applyEarthIdleRotation(viewer, time, deltaSeconds, codex) {
    if (codex.userInteracting) return;

    const targetDirection = window.globeTargetDirection || 0;
    const transferVelocity = targetDirection - horizontalDirection;
    horizontalDirection += transferVelocity * EARTH_MOTION_EASE;

    const transferSpin = Math.abs(transferVelocity) * 95;
    spinLng = wrapLongitude(spinLng + (EARTH_ROTATION_DEGREES_PER_SECOND + transferSpin) * deltaSeconds);

    const timeInSeconds = time / 1000;
    const bobbing = Math.sin(timeInSeconds * 1.5) * 1.5;
    const banking = horizontalDirection * -12;

    // Cesium has no "padding" - we mimic the off-center framing by nudging the
    // target longitude proportional to the lean direction. Empirical 6° push
    // approximates the Mapbox padding offset without distorting the view.
    const lonOffset = horizontalDirection * 6;

    const baseZoom = EARTH_OVERVIEW_ZOOM;
    const idleZoom = window.innerWidth < 768
      ? 1.22
      : window.innerWidth < 1024
        ? 1.48
        : Math.min(2.25, Math.max(1.75, window.innerWidth * 0.00125));
    const dynamicZoom = baseZoom + (idleZoom - baseZoom) * Math.abs(horizontalDirection);

    // Altitude doesn't matter at globe range - target is millions of meters
    // from camera. Use 0.
    const pose = poseFromMapbox({
      center: [wrapLongitude(spinLng + lonOffset), EARTH_IDLE_CENTER[1] + bobbing],
      zoom: dynamicZoom,
      pitch: Math.abs(horizontalDirection) * 8,
      bearing: banking,
    }, 0);
    setCameraPose(viewer, pose);
    codex.lastAppliedPose = pose;
  };
}

export default function CesiumEarth() {
  const containerRef = useRef(null);
  const containerOuterRef = useRef(null);
  const viewerRef = useRef(null);
  const [setupError, setSetupError] = useState('');
  const [showRomeSlide, setShowRomeSlide] = useState(false);
  const [tilesVisualReady, setTilesVisualReady] = useState(false);
  // The HUD mounts via state so it re-renders once the viewer is ready. Stored
  // as a wrapped object so MapHud receives the same `map` interface
  // it always had (getCenter/getZoom/getPitch/getBearing + .on/.off).
  const [hudShim, setHudShim] = useState(null);
  // True while the Photorealistic 3D Tiles streamer has pending tile requests.
  // Drives the small "Loading 3D tiles" badge in the corner so the user knows
  // why the view is still sharpening.
  const [tilesStreaming, setTilesStreaming] = useState(false);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

  const initialSetupError = !googleApiKey
    ? 'Missing VITE_GOOGLE_MAPS_API_KEY in the local or Vercel environment'
    : !ionToken
      ? 'Missing VITE_CESIUM_ION_TOKEN in the local or Vercel environment'
      : setupError;

  useEffect(() => {
    if (!googleApiKey || !ionToken) return undefined;

    Cesium.Ion.defaultAccessToken = ionToken;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      // The default Cesium globe is replaced by Google's 3D tileset - no
      // imagery layer needed. We still keep the globe ellipsoid alive for
      // SceneTransforms math but hide it.
      baseLayer: false,
    });
    viewer.scene.globe.show = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = false;
    viewer.scene.skyBox.show = false;
    viewer.scene.backgroundColor = Cesium.Color.fromBytes(2, 4, 12, 255);

    // ── Mouse / wheel / touch controls ─────────────────────────────────────
    // Left-drag pans, right-drag orbits (changes the viewing angle), middle-
    // drag tilts, wheel zooms in/out. Sane min/max so the user can't fall
    // through the Earth or zoom out past geosync orbit.
    const sscc = viewer.scene.screenSpaceCameraController;
    sscc.enableInputs = true;
    sscc.enableZoom = true;
    sscc.enableRotate = true;
    sscc.enableTilt = true;
    sscc.enableLook = true;
    sscc.minimumZoomDistance = 30;          // 30 m above ground
    sscc.maximumZoomDistance = 35_000_000;  // ~geosync ceiling

    viewerRef.current = viewer;

    // Per-viewer codex state - mirrors what MapboxEarth stashed on the
    // map object so the rest of the architecture has its expected hooks.
    const codex = {
      userInteracting: false,
      userInteractionCount: 0,
      destinationActiveIndex: null,
      activeFlightToken: null,
      // Timestamp of the last user gesture (drag, wheel, touch). Camera
      // drivers yield while this is recent so the camera doesn't snap back
      // the instant the user lets go of the mouse.
      lastInteractionAt: 0,
      // Sampled tileset surface elevation per landmark id (filled async after
      // the tileset loads). Without this, landmark targets default to height
      // 0 above the WGS84 ellipsoid and the camera ends up underground in
      // anywhere with non-trivial elevation (Xi'an, Madrid, Neuschwanstein).
      elevations: new Map(),
      // The most recent pose we applied to the camera. Used as the starting
      // pose for the next smooth pan so transitions don't snap.
      lastAppliedPose: null,
      // Cancel function for the currently-running pan animation; called when
      // a new pan supersedes the previous, or on cleanup.
      cancelActivePan: null,
    };
    const INTERACTION_COOLDOWN_MS = 1500;

    // Initial camera: globe overview (Rome under the cursor, same as the
    // original initial mapboxgl.Map config).
    const initialPose = poseFromMapbox({
      center: COLOSSEUM.center,
      zoom: EARTH_OVERVIEW_ZOOM,
      pitch: 0,
      bearing: 0,
    }, 0);
    setCameraPose(viewer, initialPose);
    codex.lastAppliedPose = initialPose;

    // ── window.codexMap shim ────────────────────────────────────────────────
    // Provides the four methods Content.jsx and MapHud.jsx rely on:
    //   project([lon, lat]) - for the Colosseum SVG connector lines.
    //   getCenter / getZoom / getPitch / getBearing - for MapHud readout.
    //   on / off - MapHud subscribes to move/zoom/rotate/pitch; we coalesce
    //     all four onto Cesium's single camera.changed event.
    const cameraChangedListeners = new Set();
    const onCameraChanged = () => {
      cameraChangedListeners.forEach((fn) => fn());
    };
    viewer.camera.percentageChanged = 0.001;
    viewer.camera.changed.addEventListener(onCameraChanged);

    const mapShim = {
      // Mapbox-API surface:
      project: (lngLat) => projectLngLat(viewer, lngLat),
      getCenter: () => {
        const p = readCameraAsMapboxPose(viewer);
        return { lng: p.center[0], lat: p.center[1] };
      },
      getZoom: () => readCameraAsMapboxPose(viewer).zoom,
      getPitch: () => readCameraAsMapboxPose(viewer).pitch,
      getBearing: () => readCameraAsMapboxPose(viewer).bearing,
      getFreeCameraOptions: () => ({
        position: { toAltitude: () => readCameraAsMapboxPose(viewer).altitude },
      }),
      on: (_evt, fn) => cameraChangedListeners.add(fn),
      off: (_evt, fn) => cameraChangedListeners.delete(fn),
      // Escape hatch for code that needs raw Cesium access:
      _viewer: viewer,
    };
    window.codexMap = mapShim;
    setHudShim(mapShim);

    // ── Google Photorealistic 3D Tiles ──────────────────────────────────────
    let tileset = null;
    let cancelledTilesetLoad = false;
    let pendingDebounce = 0;
    let visualRevealTimeout = 0;
    let revealedFirstTile = false;
    const revealPhotorealTiles = () => {
      if (cancelledTilesetLoad || revealedFirstTile) return;
      revealedFirstTile = true;
      visualRevealTimeout = window.setTimeout(() => {
        if (!cancelledTilesetLoad) setTilesVisualReady(true);
      }, 180);
      if (tileset?.tileVisible) {
        tileset.tileVisible.removeEventListener(revealPhotorealTiles);
      }
      if (tileset?.initialTilesLoaded) {
        tileset.initialTilesLoaded.removeEventListener(revealPhotorealTiles);
      }
    };

    (async () => {
      try {
        tileset = await Cesium.Cesium3DTileset.fromUrl(
          `https://tile.googleapis.com/v1/3dtiles/root.json?key=${googleApiKey}`,
          { showCreditsOnScreen: true },
        );
        if (cancelledTilesetLoad) {
          tileset.destroy();
          tileset = null;
          return;
        }

        // ── Preload / cache tuning ───────────────────────────────────────────
        // Default cache (~512 MB) is small for a 12-stop tour; tiles get
        // evicted by the time the user scrolls back. 1.5 GB keeps every
        // landmark's high-detail meshes resident after the first visit.
        tileset.cacheBytes = 1_500_000_000;
        tileset.maximumCacheOverflowBytes = 500_000_000;
        // Both default true - explicit so a future Cesium version doesn't
        // silently flip them off. preloadFlightDestinations is the big one
        // for us: during a flyTo, Cesium starts traversing the *destination*
        // viewpoint before the camera arrives, so the landing frame is
        // already mostly sharp.
        tileset.preloadFlightDestinations = true;
        tileset.preloadWhenHidden = true;
        // ── Smooth progressive loading ──────────────────────────────────────
        // Render a fast first pass at very low resolution, then refine in
        // steps. Without this the user sees blank gray tiles until the
        // detailed mesh is fully streamed; with it, they see a low-res
        // version of the scene almost immediately and watch it sharpen.
        tileset.skipLevelOfDetail = true;
        tileset.baseScreenSpaceError = 1024;        // very coarse first pass loads fast
        tileset.skipScreenSpaceErrorFactor = 16;    // standard progressive jumps
        tileset.skipLevels = 1;                     // don't skip too many LODs at once (smoother)
        tileset.immediatelyLoadDesiredLevelOfDetail = false;  // refine in passes, not all at once
        tileset.loadSiblings = false;               // don't burn budget on adjacent peripheral tiles
        tileset.dynamicScreenSpaceError = true;
        tileset.dynamicScreenSpaceErrorDensity = 0.00278;
        tileset.dynamicScreenSpaceErrorFactor = 4;
        tileset.foveatedScreenSpaceError = true;
        tileset.foveatedTimeDelay = 0.2;            // delay peripheral high-detail loads
        tileset.maximumScreenSpaceError = 16;       // default; lower = sharper but slower

        // Streaming indicator - debounce so brief loads don't flash the badge.
        const updateStreamingState = () => {
          if (!tileset) return;
          const pending = tileset.statistics.numberOfPendingRequests
            + tileset.statistics.numberOfTilesProcessing;
          clearTimeout(pendingDebounce);
          if (pending > 0) {
            setTilesStreaming(true);
          } else {
            pendingDebounce = setTimeout(() => setTilesStreaming(false), 250);
          }
        };
        tileset.loadProgress.addEventListener(updateStreamingState);
        tileset.tileVisible.addEventListener(revealPhotorealTiles);
        tileset.initialTilesLoaded.addEventListener(revealPhotorealTiles);

        viewer.scene.primitives.add(tileset);

        // ── Sample landmark ground elevations ──────────────────────────────
        // Cesium will load tiles at full detail at each of these points,
        // returning the actual surface height. One-time cost, ~1-3 s after
        // tileset ready. Until it resolves, landmark targets fall back to
        // 100 m which is fine for coastal cities but underground for places
        // like Xi'an or Neuschwanstein - those flights look wrong on the
        // very first visit then correct themselves on subsequent flights.
        const sampleTargets = [
          { id: 'EARTH_IDLE', lon: EARTH_IDLE_CENTER[0], lat: EARTH_IDLE_CENTER[1] },
          { id: 'ROME', lon: ROME[0], lat: ROME[1] },
          ...destinations.map((d) => ({ id: d.id, lon: d.lon, lat: d.lat })),
        ];
        const cartographics = sampleTargets.map((p) =>
          Cesium.Cartographic.fromDegrees(p.lon, p.lat),
        );
        viewer.scene
          .sampleHeightMostDetailed(cartographics)
          .then((carts) => {
            carts.forEach((c, i) => {
              if (c && Number.isFinite(c.height)) {
                codex.elevations.set(sampleTargets[i].id, c.height);
              }
            });
          })
          .catch((err) => {
            console.warn('[CesiumEarth] height sampling failed; landmark altitudes will use defaults', err);
          });
      } catch (err) {
        console.error('[CesiumEarth] Photorealistic 3D Tiles failed to load', err);
        const detail = err?.message || 'Tileset load failed';
        setSetupError(`Google 3D Tiles failed: ${detail}. Check VITE_GOOGLE_MAPS_API_KEY and the Map Tiles API restrictions.`);
      }
    })();

    // ── User interaction tracking ──────────────────────────────────────────
    // Count active pointer / touch gestures via raw DOM events on the canvas
    // so our own setView() / flyTo() don't accidentally flag the user as
    // interacting. Wheel events also bump the cooldown timestamp so the
    // camera doesn't snap back during the deceleration after a wheel-zoom.
    const canvas = viewer.canvas;
    canvas.style.cursor = 'grab';
    // Cesium uses right-click-drag for orbit/tilt, but the browser's native
    // context menu still pops up on right-click release. Suppress it so
    // right-drag feels like a 3D-app gesture, not a browser interaction.
    const suppressContextMenu = (e) => e.preventDefault();
    canvas.addEventListener('contextmenu', suppressContextMenu);

    const bumpInteraction = () => {
      codex.lastInteractionAt = performance.now();
    };
    const startInteraction = () => {
      codex.userInteractionCount += 1;
      codex.userInteracting = true;
      canvas.style.cursor = 'grabbing';
      bumpInteraction();
    };
    const endInteraction = () => {
      codex.userInteractionCount = Math.max(0, codex.userInteractionCount - 1);
      if (codex.userInteractionCount === 0) {
        codex.userInteracting = false;
        canvas.style.cursor = 'grab';
      }
      bumpInteraction();
    };
    canvas.addEventListener('mousedown', startInteraction);
    window.addEventListener('mouseup', endInteraction);
    canvas.addEventListener('touchstart', startInteraction, { passive: true });
    canvas.addEventListener('touchend', endInteraction);
    canvas.addEventListener('touchcancel', endInteraction);
    canvas.addEventListener('wheel', bumpInteraction, { passive: true });

    // ── RAF camera driver loop ─────────────────────────────────────────────
    const applyEarthIdleRotation = buildEarthIdleDriver();
    let frameId = 0;
    let lastTime = performance.now();
    let lastSlideOpen = false;
    const reducedMotion = prefersReducedMotion();

    const tick = (time) => {
      const deltaSeconds = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const viewerNow = viewerRef.current;
      if (!viewerNow || viewerNow.isDestroyed()) return;

      const romeProgress = window.romeScrollProgress || 0;
      const inRomeMode = !!window.romeModeActive;

      if (inRomeMode) {
        codex.destinationActiveIndex = null;
        if (reducedMotion) applyRomeReducedMotionState(viewerNow, romeProgress, codex);
        else applyRomeScrollState(viewerNow, romeProgress, codex);

        const wantSlideOpen = romeProgress >= 0.92;
        if (wantSlideOpen !== lastSlideOpen) {
          lastSlideOpen = wantSlideOpen;
          setShowRomeSlide(wantSlideOpen);
        }

        frameId = requestAnimationFrame(tick);
        return;
      }

      const tourState = getDestinationTourState();
      if (tourState.active) {
        if (lastSlideOpen) {
          lastSlideOpen = false;
          setShowRomeSlide(false);
        }
        applyDestinationTourState(viewerNow, tourState, codex);
        frameId = requestAnimationFrame(tick);
        return;
      }

      // Idle mode: clear destination flight state and rotate slowly.
      codex.destinationActiveIndex = null;
      if (lastSlideOpen) {
        lastSlideOpen = false;
        setShowRomeSlide(false);
      }

      const camHeight = viewerNow.camera.positionCartographic.height;
      const recentlyInteracted = (time - codex.lastInteractionAt) < INTERACTION_COOLDOWN_MS;
      const shouldAnimateEarth = !reducedMotion
        && !codex.userInteracting
        && !recentlyInteracted
        && !window.codexDestinationFlying
        && camHeight > 1_000_000; // ~zoom <= 5.2-ish; gate matches Mapbox EARTH_SCROLL_MOTION_MAX_ZOOM
      if (shouldAnimateEarth) {
        applyEarthIdleRotation(viewerNow, time, deltaSeconds, codex);
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    // ── Reset Globe ────────────────────────────────────────────────────────
    const handleResetGlobe = () => {
      window.romeModeActive = false;
      window.romeScrollProgress = 0;
      window.destinationTourActive = false;
      window.destinationTourState = { index: 0, progress: 0 };
      window.codexDestinationFlying = false;
      codex.destinationActiveIndex = null;
      codex.activeFlightToken = null;
      setShowRomeSlide(false);

      const target = poseFromMapbox({
        center: EARTH_IDLE_CENTER,
        zoom: EARTH_OVERVIEW_ZOOM,
        pitch: 0,
        bearing: 0,
      }, 0);
      window.codexDestinationFlying = true;
      const token = Symbol('reset-flight');
      codex.activeFlightToken = token;
      // Cancel any landmark pan in progress.
      if (codex.cancelActivePan) {
        codex.cancelActivePan();
        codex.cancelActivePan = null;
      }
      const startPose = codex.lastAppliedPose ?? target;
      codex.cancelActivePan = panToPose(viewer, startPose, target, {
        durationSec: 0.85,
        isInteracting: () => codex.userInteracting,
        complete: () => {
          if (codex.activeFlightToken === token) {
            window.codexDestinationFlying = false;
            codex.lastAppliedPose = target;
            codex.cancelActivePan = null;
          }
          window.dispatchEvent(new Event('globeResetComplete'));
        },
        cancel: () => {
          if (codex.activeFlightToken === token) {
            window.codexDestinationFlying = false;
            codex.cancelActivePan = null;
          }
          window.dispatchEvent(new Event('globeResetComplete'));
        },
      });
    };
    window.addEventListener('resetGlobe', handleResetGlobe);

    return () => {
      cancelledTilesetLoad = true;
      clearTimeout(visualRevealTimeout);
      clearTimeout(pendingDebounce);
      cancelAnimationFrame(frameId);
      if (codex.cancelActivePan) {
        codex.cancelActivePan();
        codex.cancelActivePan = null;
      }
      window.removeEventListener('resetGlobe', handleResetGlobe);
      canvas.removeEventListener('contextmenu', suppressContextMenu);
      canvas.removeEventListener('mousedown', startInteraction);
      window.removeEventListener('mouseup', endInteraction);
      canvas.removeEventListener('touchstart', startInteraction);
      canvas.removeEventListener('touchend', endInteraction);
      canvas.removeEventListener('touchcancel', endInteraction);
      canvas.removeEventListener('wheel', bumpInteraction);
      viewer.camera.changed.removeEventListener(onCameraChanged);
      if (tileset?.tileVisible) {
        tileset.tileVisible.removeEventListener(revealPhotorealTiles);
      }
      if (tileset?.initialTilesLoaded) {
        tileset.initialTilesLoaded.removeEventListener(revealPhotorealTiles);
      }
      cameraChangedListeners.clear();
      if (window.codexMap === mapShim) delete window.codexMap;
      setHudShim(null);
      viewerRef.current = null;
      try { viewer.destroy(); } catch { /* ignore */ }
    };
  }, [googleApiKey, ionToken]);

  /* ── Lateral globe shift ──────────────────────────────────────
     Cesium has no Mapbox-style camera padding. To position the
     visible globe on the left/right of the viewport during the
     ping-pong sections, translate the outer container via CSS.
     The camera logic (tilt/zoom/longitude nudge) is untouched -
     this only shifts the rendered output.
     Suppressed during Rome descent and destination tour so those
     framings remain centered on their targets. */
  useEffect(() => {
    const container = containerOuterRef.current;
    if (!container) return undefined;

    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SHIFT_VW = 44;
    container.style.transition = reducedMotion
      ? 'none'
      : 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)';

    let lastDir = 0;
    let rafId = 0;
    const tick = () => {
      const targetCentered =
        window.destinationTourActive
        || window.romeModeActive
        || window.projectsFinaleActive;
      const dir = targetCentered ? 0 : (window.globeTargetDirection || 0);
      if (dir !== lastDir) {
        lastDir = dir;
        container.style.transform = `translateX(${dir * SHIFT_VW}vw)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      container.style.transition = '';
      container.style.transform = '';
    };
  }, []);

  return (
    <>
      <div ref={containerOuterRef} className="fixed inset-0 z-0 will-change-transform" data-lenis-prevent>
        <div className="absolute inset-0" data-lenis-prevent>
          <div ref={containerRef} className="h-full w-full" data-lenis-prevent />
        </div>
        {!tilesVisualReady && !initialSetupError && <EarthLoadingState label="" />}
      </div>

      <MapHud map={hudShim} />

      {(tilesStreaming || !tilesVisualReady) && !initialSetupError && (
        <div className="pointer-events-none fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-white/[0.14] bg-bg/[0.68] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white/80 shadow-lg backdrop-blur-md">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          {tilesVisualReady ? 'Loading 3D tiles' : 'Preparing 3D Earth'}
        </div>
      )}

      {initialSetupError && <SetupErrorState message={initialSetupError} />}

      <SlidePanel
        open={showRomeSlide}
        onClose={() => setShowRomeSlide(false)}
        slide={ROME_SLIDE}
      />
    </>
  );
}
