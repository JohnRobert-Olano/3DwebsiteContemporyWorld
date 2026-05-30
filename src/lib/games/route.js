// Shared quadratic-curve geometry for the Global Delivery Simulator flight route.
// Works in map percent space: x and y are 0..100, with y increasing DOWNWARD to
// match the SVG/CSS map (and DELIVERY_COUNTRIES percents). Both the SVG route
// <path> and the 3D plane (DeliveryPlane) sample these helpers so their arcs are
// pixel-for-pixel identical.

const ARC_RATIO = 0.22; // arc height as a fraction of the chord length
const MAX_ARC = 26; // clamp (percent units) so long routes don't bow off-map

// Control point for the quadratic bezier: the chord midpoint pushed along the
// chord's "upward" normal (toward the top of the map) so the route bows like a
// great-circle flight arc. Distance scales with route length, then clamps.
export function routeControlPoint(from, to) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;

  // Perpendicular normal, forced to point upward (negative y) so the arc always
  // bows toward the top edge regardless of travel direction.
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  const offset = Math.min(len * ARC_RATIO, MAX_ARC);
  return { x: mx + nx * offset, y: my + ny * offset };
}

// Point on the quadratic bezier at parameter t (0..1).
export function bezierPoint(from, cp, to, t) {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * cp.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * cp.y + t * t * to.y,
  };
}

// First derivative (tangent vector) of the quadratic bezier at parameter t.
export function bezierTangent(from, cp, to, t) {
  const u = 1 - t;
  return {
    x: 2 * u * (cp.x - from.x) + 2 * t * (to.x - cp.x),
    y: 2 * u * (cp.y - from.y) + 2 * t * (to.y - cp.y),
  };
}