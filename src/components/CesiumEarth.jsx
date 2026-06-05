import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import EarthLoadingState from './EarthLoadingState';
import { destinations } from '../lib/data/destinations';
import {
  poseFromMapbox,
  setCameraPose,
  panToPose,
  zoomThroughEarthLayers,
  readCameraAsMapboxPose,
  projectLngLat,
} from '../lib/cesium/cameraController';

const EARTH_IDLE_CENTER = [12.4922, 22];
const EARTH_OVERVIEW_ZOOM = 1.12;
const EARTH_ROTATION_DEGREES_PER_SECOND = 0.82;
const EARTH_MOTION_EASE = 0.0055;
// Cap the ambient idle-rotation repaint to ~30fps (keeps the drift gentle while
// halving the Cesium render cost during the reading sections).
const IDLE_FRAME_MS = 33;

// ── Landmark warm-up tuning ─────────────────────────────────────────────────
// Behind the boot loader we teleport the camera to each of the 12 destination
// views and wait for their photorealistic tiles to load, so later scroll-driven
// transitions don't start from blank/gray meshes. Bounded so a slow or failed
// view can never hang the boot.
const WARMUP_PER_DEST_TIMEOUT_MS = 9000; // max wait for one view's full detail
const WARMUP_SETTLE_MS = 500;            // fully-loaded must hold this long = settled
const WARMUP_MIN_WAIT_MS = 300;          // give traversal time to request tiles first
const WARMUP_OVERALL_TIMEOUT_MS = 100000; // hard cap on the whole warm-up pass
const WARMUP_SAMPLE_WAIT_CAP_MS = 8000;  // cap on awaiting ground-height sampling
const WARMUP_POLL_MS = 100;
// Each landmark is warmed at TWO views the live flight passes through: the
// mid-flight regional approach (≈ zoomThroughEarthLayers' regionalPose) and the
// final close-up - so the descent and the landing are both resident.
const WARMUP_APPROACH_ZOOM = 5.35;
const WARMUP_APPROACH_PITCH = 32; // Mapbox pitch -> Cesium -58 via poseFromMapbox

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

  // The starting pose for the staged zoom is the last pose we applied (idle
  // rotation tick or the previous landmark). If no prior driver has run yet,
  // the zoom blooms out from the destination and settles back into the tuned
  // local camera.
  const startPose = codex.lastAppliedPose ?? pose;

  window.codexDestinationFlying = true;
  const flightToken = Symbol('codex-flight');
  codex.activeFlightToken = flightToken;

  const finishFlight = () => {
    if (codex.activeFlightToken === flightToken) {
      window.codexDestinationFlying = false;
      codex.lastAppliedPose = pose;
      codex.cancelActivePan = null;
    }
  };

  const cancelFlight = () => {
    if (codex.activeFlightToken === flightToken) {
      window.codexDestinationFlying = false;
      codex.cancelActivePan = null;
    }
  };

  if (tourState.index === 0) {
    codex.cancelActivePan = panToPose(viewer, startPose, pose, {
      durationSec: 1.8,
      arcRangeM: 0,
      isInteracting: () => codex.userInteracting,
      complete: finishFlight,
      cancel: cancelFlight,
    });
    return;
  }

  // Three-layer transition for later landmarks: pull back to Earth scale,
  // reframe at regional altitude, then descend into the tuned landmark camera.
  codex.cancelActivePan = zoomThroughEarthLayers(viewer, startPose, pose, {
    isInteracting: () => codex.userInteracting,
    complete: finishFlight,
    cancel: cancelFlight,
  });
}

// ── Idle Earth (between topic panels and the destination tour) ─────────────
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

export default function CesiumEarth({ onVisualReady, onSetupError, onWarmupProgress } = {}) {
  const containerRef = useRef(null);
  const containerOuterRef = useRef(null);
  const containerInnerRef = useRef(null);
  const viewerRef = useRef(null);
  const visualReadyNotifiedRef = useRef(false);
  const onWarmupProgressRef = useRef(onWarmupProgress);
  const [setupError, setSetupError] = useState('');
  const [tilesVisualReady, setTilesVisualReady] = useState(false);
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

  // Notify the parent once the photorealistic tiles are visually ready so the
  // boot loading screen can release the first-render gate. Ref-guarded so a
  // changing callback identity can't fire it twice.
  useEffect(() => {
    if (tilesVisualReady && !visualReadyNotifiedRef.current) {
      visualReadyNotifiedRef.current = true;
      onVisualReady?.();
    }
  }, [tilesVisualReady, onVisualReady]);

  // Surface setup/tile failures upward so the boot loader stops waiting and the
  // SetupErrorState below becomes visible instead of an infinite loader.
  useEffect(() => {
    if (initialSetupError) onSetupError?.();
  }, [initialSetupError, onSetupError]);

  // Keep the warm-up progress callback current without re-running the heavy
  // viewer effect (which only depends on the API keys).
  useEffect(() => {
    onWarmupProgressRef.current = onWarmupProgress;
  }, [onWarmupProgress]);

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
      // Transparent drawing buffer so the cinematic word reveals can sit in a
      // DOM layer BEHIND this canvas and be occluded by the real Earth.
      contextOptions: { webgl: { alpha: true } },
    });
    viewer.scene.globe.show = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = false;
    viewer.scene.skyBox.show = false;
    // Render on demand: Cesium only repaints when something actually changes
    // (camera moves via setCameraPose -> requestRender, tiles stream, user
    // input). This stops the heavy 3D-tiles GPU work during static landmark
    // holds, reading pauses, and while the globe is hidden behind the archive /
    // game modals - the single biggest runtime win for this scene.
    viewer.scene.requestRenderMode = true;
    // Transparent clear colour: the dark page background (and any reveal title
    // layered behind the canvas) shows through the empty space around the globe.
    viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;

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
      // True while the offscreen landmark warm-up owns the camera (boot only),
      // so the idle/tour drivers in the RAF tick stand down.
      warmupActive: false,
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

    // Initial camera: neutral globe overview. Colosseum is reached only by
    // activating destination 1, avoiding a duplicate pre-tour Colosseum zoom.
    const initialPose = poseFromMapbox({
      center: EARTH_IDLE_CENTER,
      zoom: EARTH_OVERVIEW_ZOOM,
      pitch: 0,
      bearing: 0,
    }, 0);
    setCameraPose(viewer, initialPose);
    codex.lastAppliedPose = initialPose;

    // ── window.codexMap shim ────────────────────────────────────────────────
    // Provides the Mapbox-like methods the DOM scrollytelling layer relies on:
    //   project([lon, lat]) - for the Colosseum SVG connector lines.
    //   getCenter / getZoom / getPitch / getBearing - for camera parity.
    //   on / off - coalesced onto Cesium's single camera.changed event.
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
    // ── Google Photorealistic 3D Tiles ──────────────────────────────────────
    let tileset = null;
    let cancelledTilesetLoad = false;
    let pendingDebounce = 0;
    let samplePromise = null;
    let warmupTimer = 0;
    let firstTileSeen = false;

    const delay = (ms) => new Promise((resolve) => {
      warmupTimer = window.setTimeout(resolve, ms);
    });

    // Resolve once the tileset has FULLY streamed the current camera view: it
    // requested tiles, `tilesLoaded` (every tile meeting the screen-space error
    // this frame) is true, and pending+processing held at zero for a short
    // stable window - or `timeoutMs` elapsed, or the load was cancelled.
    const waitForTilesSettled = (ts, timeoutMs) => new Promise((resolve) => {
      const start = performance.now();
      let requested = false;
      let idleSince = null;
      const poll = () => {
        if (cancelledTilesetLoad || !ts) { resolve('cancelled'); return; }
        const stats = ts.statistics;
        const pending = stats.numberOfPendingRequests + stats.numberOfTilesProcessing;
        const elapsed = performance.now() - start;
        if (pending > 0) requested = true;
        const fullyLoaded = pending === 0 && ts.tilesLoaded === true
          && (requested || elapsed >= WARMUP_MIN_WAIT_MS);
        if (fullyLoaded) {
          if (idleSince == null) idleSince = performance.now();
          if (performance.now() - idleSince >= WARMUP_SETTLE_MS) { resolve('settled'); return; }
        } else {
          idleSince = null;
        }
        if (elapsed >= timeoutMs) { resolve('timeout'); return; }
        warmupTimer = window.setTimeout(poll, WARMUP_POLL_MS);
      };
      poll();
    });

    // Offscreen warm-up: visit each of the 12 destination camera poses behind
    // the loading screen so their tiles are resident before the real journey.
    const runWarmup = async () => {
      const total = destinations.length;
      codex.warmupActive = true;
      if (!cancelledTilesetLoad) onWarmupProgressRef.current?.(0, total);

      // Let ground-height sampling fill codex.elevations so each warm-up frame
      // matches the real transition framing (capped so it can't hang).
      if (samplePromise) {
        try { await Promise.race([samplePromise, delay(WARMUP_SAMPLE_WAIT_CAP_MS)]); } catch { /* ignore */ }
      }

      // Warm with the LIVE runtime tileset config (do NOT override skip-LOD /
      // base SSE / foveation): the live camera does a coarse skip-LOD first
      // pass, so the cache must hold those coarse ancestor tiles AND the refined
      // leaves. Forcing immediatelyLoadDesiredLevelOfDetail here would cache only
      // the leaves, leaving the runtime to stream the coarse pass on arrival
      // (the "black tiles with lines"). waitForTilesSettled waits for the view
      // to fully refine before moving on.

      // Teleport to a view, then wait for its tiles to fully load.
      const warmPose = async (dest, zoom, pitch, bearing, altitude, label) => {
        if (cancelledTilesetLoad || !tileset) return;
        const pose = poseFromMapbox({ center: destinationToLngLat(dest), zoom, pitch, bearing }, altitude);
        setCameraPose(viewer, pose);
        codex.lastAppliedPose = pose;
        const result = await waitForTilesSettled(tileset, WARMUP_PER_DEST_TIMEOUT_MS);
        if (result === 'timeout') {
          console.warn(`[CesiumEarth] landmark warm-up timed out for ${dest.id} (${label}); continuing`);
        }
      };

      const overallDeadline = performance.now() + WARMUP_OVERALL_TIMEOUT_MS;
      for (let i = 0; i < total; i += 1) {
        if (cancelledTilesetLoad || !tileset) break;
        if (performance.now() > overallDeadline) {
          console.warn('[CesiumEarth] landmark warm-up hit the overall timeout; starting with a partial preload');
          break;
        }
        const dest = destinations[i];
        const camera = getDestinationCamera(dest);
        const altitude = camera.altitude ?? codex.elevations.get(dest.id) ?? 100;

        // (a) Mid-flight regional approach over the destination, then
        // (b) the final landmark close-up. Both views the live transition
        // passes through are fully refined before the journey.
        await warmPose(dest, WARMUP_APPROACH_ZOOM, WARMUP_APPROACH_PITCH, camera.bearing, altitude, 'approach');
        if (cancelledTilesetLoad) break;
        await warmPose(dest, camera.zoom, camera.pitch, camera.bearing, altitude, 'landing');
        if (cancelledTilesetLoad) break;
        onWarmupProgressRef.current?.(i + 1, total);
      }

      // Restore the neutral Earth overview before handing off to the intro.
      if (!cancelledTilesetLoad) {
        setCameraPose(viewer, initialPose);
        codex.lastAppliedPose = initialPose;
      }
      codex.warmupActive = false;
      if (!cancelledTilesetLoad) setTilesVisualReady(true);
    };

    // First visible photorealistic tile = initial Earth is ready. Rather than
    // revealing the site immediately, start the offscreen landmark warm-up; the
    // loader stays up until runWarmup finishes (or times out).
    const onFirstTile = () => {
      if (cancelledTilesetLoad || firstTileSeen) return;
      firstTileSeen = true;
      if (tileset?.tileVisible) tileset.tileVisible.removeEventListener(onFirstTile);
      if (tileset?.initialTilesLoaded) tileset.initialTilesLoaded.removeEventListener(onFirstTile);
      runWarmup();
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
        tileset.cacheBytes = 3_000_000_000;
        tileset.maximumCacheOverflowBytes = 1_000_000_000;
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
        tileset.tileVisible.addEventListener(onFirstTile);
        tileset.initialTilesLoaded.addEventListener(onFirstTile);

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
          ...destinations.map((d) => ({ id: d.id, lon: d.lon, lat: d.lat })),
        ];
        const cartographics = sampleTargets.map((p) =>
          Cesium.Cartographic.fromDegrees(p.lon, p.lat),
        );
        samplePromise = viewer.scene
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
    let lastIdleTime = performance.now();
    const reducedMotion = prefersReducedMotion();

    const tick = (time) => {
      const viewerNow = viewerRef.current;
      if (!viewerNow || viewerNow.isDestroyed()) return;

      // The offscreen landmark warm-up owns the camera during boot - don't let
      // the idle/tour drivers move it while we visit each destination view.
      // Likewise, while the album archive / a game modal fully covers the globe
      // (projectsFinaleActive), skip all camera work so render-on-demand can
      // idle Cesium entirely - nothing is visible to update.
      if (codex.warmupActive || window.projectsFinaleActive) {
        lastIdleTime = time;
        frameId = requestAnimationFrame(tick);
        return;
      }

      const tourState = getDestinationTourState();
      if (tourState.active) {
        applyDestinationTourState(viewerNow, tourState, codex);
        frameId = requestAnimationFrame(tick);
        return;
      }

      // Idle mode: clear destination flight state and rotate slowly.
      codex.destinationActiveIndex = null;

      const camHeight = viewerNow.camera.positionCartographic.height;
      const recentlyInteracted = (time - codex.lastInteractionAt) < INTERACTION_COOLDOWN_MS;
      const shouldAnimateEarth = !reducedMotion
        && !codex.userInteracting
        && !recentlyInteracted
        && !window.codexDestinationFlying
        && camHeight > 1_000_000; // ~zoom <= 5.2-ish; gate matches Mapbox EARTH_SCROLL_MOTION_MAX_ZOOM
      if (shouldAnimateEarth) {
        // Throttle the ambient rotation to ~IDLE_FRAME_MS so it stays a gentle
        // drift without forcing a 60fps Cesium repaint through the long reading
        // sections. Advance by the real elapsed time so the speed is unchanged.
        if (time - lastIdleTime >= IDLE_FRAME_MS) {
          const idleDelta = Math.min(0.05, (time - lastIdleTime) / 1000);
          lastIdleTime = time;
          applyEarthIdleRotation(viewerNow, time, idleDelta, codex);
        }
      } else {
        lastIdleTime = time;
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    // ── Modern World Earth-exit ────────────────────────────────────────────
    // Toggle the CSS class that rushes the whole Earth canvas upward + fades it.
    // Driven by Content's `globe-exit` event when the post-WTC ending is entered
    // / left. Reduced-motion downgrades this to a gentle opacity fade in CSS.
    const handleGlobeExit = (event) => {
      const inner = containerInnerRef.current;
      if (!inner) return;
      inner.classList.toggle('earth-exit-active', !!event.detail?.active);
    };
    window.addEventListener('globe-exit', handleGlobeExit);

    // ── Reset Globe ────────────────────────────────────────────────────────
    const handleResetGlobe = () => {
      // Any reset (Home / back-scroll into the zoom-out) cancels the exit so the
      // Earth returns cleanly into view.
      containerInnerRef.current?.classList.remove('earth-exit-active');
      window.destinationTourActive = false;
      window.destinationTourState = { index: 0, progress: 0 };
      window.codexDestinationFlying = false;
      codex.destinationActiveIndex = null;
      codex.activeFlightToken = null;
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
      codex.warmupActive = false;
      clearTimeout(warmupTimer);
      clearTimeout(pendingDebounce);
      cancelAnimationFrame(frameId);
      if (codex.cancelActivePan) {
        codex.cancelActivePan();
        codex.cancelActivePan = null;
      }
      window.removeEventListener('resetGlobe', handleResetGlobe);
      window.removeEventListener('globe-exit', handleGlobeExit);
      canvas.removeEventListener('contextmenu', suppressContextMenu);
      canvas.removeEventListener('mousedown', startInteraction);
      window.removeEventListener('mouseup', endInteraction);
      canvas.removeEventListener('touchstart', startInteraction);
      canvas.removeEventListener('touchend', endInteraction);
      canvas.removeEventListener('touchcancel', endInteraction);
      canvas.removeEventListener('wheel', bumpInteraction);
      viewer.camera.changed.removeEventListener(onCameraChanged);
      if (tileset?.tileVisible) {
        tileset.tileVisible.removeEventListener(onFirstTile);
      }
      if (tileset?.initialTilesLoaded) {
        tileset.initialTilesLoaded.removeEventListener(onFirstTile);
      }
      cameraChangedListeners.clear();
      if (window.codexMap === mapShim) delete window.codexMap;
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
     Suppressed during the destination tour so those framings remain
     centered on their targets. */
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
        {/* earth-stage owns the cinematic post-WTC exit: `earth-exit-active`
            translates the whole Earth canvas upward + fades it (CSS). The outer
            container keeps the lateral-shift transform, so the two never fight. */}
        <div ref={containerInnerRef} className="earth-stage absolute inset-0" data-lenis-prevent>
          <div ref={containerRef} className="h-full w-full" data-lenis-prevent />
        </div>
        {!tilesVisualReady && !initialSetupError && <EarthLoadingState label="" />}
      </div>

      {(tilesStreaming || !tilesVisualReady) && !initialSetupError && (
        <div className="pointer-events-none fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-white/[0.14] bg-bg/[0.68] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white/80 shadow-lg backdrop-blur-md">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          {tilesVisualReady ? 'Loading 3D tiles' : 'Preparing 3D Earth'}
        </div>
      )}

      {initialSetupError && <SetupErrorState message={initialSetupError} />}
    </>
  );
}
