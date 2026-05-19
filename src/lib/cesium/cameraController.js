import * as Cesium from 'cesium';
import { zoomToHeight, heightToZoom, mapboxPitchToCesiumDeg } from './zoomToHeight';

// ─── Pose model ─────────────────────────────────────────────────────────────
// A "pose" describes WHERE TO LOOK and FROM WHAT ANGLE, in HeadingPitchRange
// offset semantics around a ground target. This matches what Mapbox actually
// did under the hood: `center` was the ground point being looked at; zoom,
// pitch, and bearing positioned the camera around it.
//
// Pose shape:
//   { lon, lat }     — geodetic ground target (the landmark)
//   range            — distance from camera to target, in meters
//   headingDeg       — clockwise from north, position OF camera relative to target
//   pitchDeg         — Cesium HPR pitch: negative = camera above target (looking down)
//                      pitch -90 = camera directly above target (top-down)
//                      pitch   0 = camera at target elevation (horizontal)
//
// Conversion from Mapbox:
//   range     = zoomToHeight(zoom)
//   pitchDeg  = mapboxPitch - 90        (Mapbox 0 = top-down → Cesium HPR -90)
//   headingDeg = mapboxBearing + 180    (Mapbox bearing = look direction;
//                                        Cesium HPR heading = camera position)
//
// The +180 heading offset is the easy one to miss — Mapbox bearing 0 means the
// camera LOOKS north, which puts the CAMERA south of the target. Cesium HPR
// heading 0 places the CAMERA north of the target. Off by 180°.

export function poseFromMapbox({ center, zoom, pitch, bearing }, altitudeMeters = 100) {
  return {
    lon: center[0],
    lat: center[1],
    // Ground elevation above the WGS84 ellipsoid at the target. CRITICAL:
    // without this, Cartesian3.fromDegrees(lon, lat, 0) plants the target at
    // sea level — in Xi'an (~405m), Madrid (~657m), or Neuschwanstein (~950m)
    // that puts the target underground and the HPR camera offset ends up
    // inside the terrain mesh.
    altitude: altitudeMeters,
    range: zoomToHeight(zoom),
    headingDeg: ((bearing + 180) % 360 + 360) % 360,
    pitchDeg: mapboxPitchToCesiumDeg(pitch),
  };
}

function hprFromPose(pose) {
  return new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(pose.headingDeg),
    Cesium.Math.toRadians(pose.pitchDeg),
    pose.range,
  );
}

function targetFromPose(pose) {
  return Cesium.Cartesian3.fromDegrees(pose.lon, pose.lat, pose.altitude ?? 0);
}

// Instant teleport — used for per-frame scroll scrubbing and idle rotation.
// Uses the documented lookAt + lookAtTransform(IDENTITY) pattern so the camera
// gets the right position/orientation without locking it to the target's local
// frame for subsequent operations.
export function setCameraPose(viewer, pose) {
  if (!viewer || viewer.isDestroyed?.()) return;
  viewer.camera.lookAt(targetFromPose(pose), hprFromPose(pose));
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

// Animated flight — used for landmark-to-landmark transitions. Uses
// flyToBoundingSphere with an HPR offset, which is the Cesium-idiomatic way
// to fly to a target with a specific viewing angle.
//
// Prefer panToPose for the destination tour: flyToBoundingSphere arcs the
// camera through space and can feel like a jump cut when start/end views
// have very different orientations. panToPose does a true frame-by-frame
// lerp of all six pose components with ease-in-out timing.
export function flyToPose(viewer, pose, { durationSec = 2.2, easingFunction, complete, cancel } = {}) {
  if (!viewer || viewer.isDestroyed?.()) return;
  const boundingSphere = new Cesium.BoundingSphere(targetFromPose(pose), 1);
  viewer.camera.flyToBoundingSphere(boundingSphere, {
    offset: hprFromPose(pose),
    duration: durationSec,
    easingFunction: easingFunction ?? Cesium.EasingFunction.CUBIC_OUT,
    complete,
    cancel,
  });
}

// ─── Smooth pan between two poses ───────────────────────────────────────────
// Lerps every component of the pose (target lon/lat/altitude, camera range,
// heading, pitch) over `durationSec` with an ease-in-out cubic curve. Returns
// a cancel function — call it to stop the pan early (e.g., when a new pan
// supersedes this one, or the user starts dragging).
//
// For long intercontinental flights, `arcRangeM` adds a sinusoidal boost to
// the camera-to-target distance mid-flight so the camera pulls back to a
// wide overview shot, then zooms back in at the destination. Set to 0 to
// disable arcing (true horizontal pan).

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp1 = (a, b, t) => a + (b - a) * t;

// Shortest-path angular interpolation. Handles wrap-around at 360°/-180° so
// the camera doesn't take the long way around when heading changes from
// 350° to 10° (which is a 20° change, not a 340° change).
const lerpAngle = (a, b, t) => {
  const diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
};

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function panToPose(viewer, startPose, endPose, opts = {}) {
  if (!viewer || viewer.isDestroyed?.()) return () => {};

  const distM = haversineMeters(startPose.lat, startPose.lon, endPose.lat, endPose.lon);
  // Default duration scales gently with distance — tuned for snappy
  // navigation: ~0.85 s for adjacent landmarks, capped at 2 s for the
  // longest intercontinental hops (roughly 3x faster than the previous
  // 2.5-6 s range).
  const durationSec = opts.durationSec
    ?? Math.min(2.0, Math.max(0.85, 0.85 + distM / 9_000_000));
  // For LONG intercontinental flights only (>1500 km), gently arc the
  // camera-to-target distance up so the camera pulls back to a wide
  // overview shot mid-flight. Short and medium hops (e.g., DC → NYC at
  // 330 km, Madrid → Vatican at 1300 km) get NO arc — they go straight
  // from A to B so the user never sees an unwanted "zoom out" mid-flight.
  const arcRangeM = opts.arcRangeM
    ?? (distM > 1_500_000 ? (distM - 1_500_000) * 0.08 : 0);
  const easing = opts.easing ?? easeInOutCubic;
  const isInteracting = opts.isInteracting ?? (() => false);

  const startTime = performance.now();
  let rafId = 0;
  let canceled = false;
  let finished = false;

  const tick = () => {
    if (viewer.isDestroyed?.() || canceled) {
      if (!finished) opts.cancel?.();
      return;
    }
    if (isInteracting()) {
      // Yield to the user — abort the pan in place. They've taken control.
      canceled = true;
      opts.cancel?.();
      return;
    }
    const elapsed = (performance.now() - startTime) / 1000;
    const t = Math.min(1, elapsed / durationSec);
    const eased = easing(t);
    const arcBoost = Math.sin(eased * Math.PI) * arcRangeM;

    const pose = {
      lon: lerpAngle(startPose.lon, endPose.lon, eased),
      lat: lerp1(startPose.lat, endPose.lat, eased),
      altitude: lerp1(startPose.altitude ?? 0, endPose.altitude ?? 0, eased),
      range: lerp1(startPose.range, endPose.range, eased) + arcBoost,
      headingDeg: lerpAngle(startPose.headingDeg, endPose.headingDeg, eased),
      pitchDeg: lerp1(startPose.pitchDeg, endPose.pitchDeg, eased),
    };
    setCameraPose(viewer, pose);

    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      finished = true;
      opts.complete?.();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (finished) return;
    canceled = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

// Lerp between two Mapbox-shaped poses (used by the Rome scrub). Returns a
// Cesium pose ready for setCameraPose. Altitudes can be passed per-endpoint
// so high-elevation keyframes don't fall underground.
export function lerpMapboxPoses(start, end, t, startAlt = 100, endAlt = startAlt) {
  const lerp = (a, b) => a + (b - a) * t;
  return poseFromMapbox(
    {
      center: [lerp(start.center[0], end.center[0]), lerp(start.center[1], end.center[1])],
      zoom: lerp(start.zoom, end.zoom),
      pitch: lerp(start.pitch, end.pitch),
      bearing: lerp(start.bearing, end.bearing),
    },
    lerp(startAlt, endAlt),
  );
}

// Snapshot the current camera as a Mapbox-shaped pose for the HUD readout. The
// "center" returned here is the camera's own ground-projected position, not
// the target it's looking at — there is no robust way to recover the latter
// after the user has gestured. Good enough for a debug overlay.
export function readCameraAsMapboxPose(viewer) {
  const cart = viewer.camera.positionCartographic;
  return {
    center: [Cesium.Math.toDegrees(cart.longitude), Cesium.Math.toDegrees(cart.latitude)],
    zoom: heightToZoom(cart.height),
    pitch: Cesium.Math.toDegrees(viewer.camera.pitch) + 90,
    // Camera.heading is the camera's look direction; convert back to Mapbox
    // bearing convention (look direction, not camera-from-target).
    bearing: Cesium.Math.toDegrees(viewer.camera.heading),
    altitude: cart.height,
  };
}

// Project [lon, lat, height?] geodetic to canvas pixels. Returns
// { x, y } with off-screen sentinels when the point is behind the globe so
// existing callers (Content.jsx's connector lines) don't crash on null.
export function projectLngLat(viewer, [lon, lat, height = 0]) {
  const cart = Cesium.Cartesian3.fromDegrees(lon, lat, height);
  const win = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cart);
  if (!win) return { x: -10_000, y: -10_000 };
  const camPos = viewer.camera.positionWC;
  const toPoint = Cesium.Cartesian3.subtract(cart, camPos, new Cesium.Cartesian3());
  const dot = Cesium.Cartesian3.dot(toPoint, viewer.camera.directionWC);
  if (dot <= 0) return { x: -10_000, y: -10_000 };
  return { x: win.x, y: win.y };
}
