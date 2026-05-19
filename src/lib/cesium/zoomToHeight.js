// Maps a Mapbox-style zoom level to a Cesium camera height (meters above the
// WGS84 ellipsoid) so the ported camera math reads at roughly the same scale
// the original landmark choreography was tuned at. Anchors are empirical and
// assume Cesium's default ~60° vertical FOV; tune in dev if a destination
// frames too tight or too loose.
const ANCHORS = [
  [1.0, 35_000_000],
  [1.35, 22_000_000],
  [2.0, 14_000_000],
  [3.0, 8_000_000],
  [4.0, 4_500_000],
  [5.5, 1_500_000],
  [8.0, 250_000],
  [10.0, 60_000],
  [12.0, 25_000],
  [14.0, 8_000],
  [15.8, 3_200],
  [16.0, 2_500],
  [17.0, 1_200],
  [17.4, 850],
  [17.6, 700],
  [18.0, 500],
  [18.3, 380],
  [18.69, 280],
  [19.0, 200],
  [20.0, 100],
];

export function zoomToHeight(zoom) {
  if (!Number.isFinite(zoom)) return 1_000_000;
  if (zoom <= ANCHORS[0][0]) return ANCHORS[0][1];
  const last = ANCHORS[ANCHORS.length - 1];
  if (zoom >= last[0]) return last[1];
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const [z0, h0] = ANCHORS[i];
    const [z1, h1] = ANCHORS[i + 1];
    if (zoom >= z0 && zoom <= z1) {
      const t = (zoom - z0) / (z1 - z0);
      // Interpolate logarithmically — height spans 5+ orders of magnitude;
      // linear interp would over-weight the high end.
      return Math.exp(Math.log(h0) + (Math.log(h1) - Math.log(h0)) * t);
    }
  }
  return last[1];
}

export function heightToZoom(height) {
  if (!Number.isFinite(height) || height <= 0) return 1.0;
  if (height >= ANCHORS[0][1]) return ANCHORS[0][0];
  const last = ANCHORS[ANCHORS.length - 1];
  if (height <= last[1]) return last[0];
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const [z0, h0] = ANCHORS[i];
    const [z1, h1] = ANCHORS[i + 1];
    if (height <= h0 && height >= h1) {
      const t = (Math.log(height) - Math.log(h0)) / (Math.log(h1) - Math.log(h0));
      return z0 + (z1 - z0) * t;
    }
  }
  return last[0];
}

// Mapbox pitch (0 = top-down, 85 = near-horizon) → Cesium pitch (-90 = top-down,
// 0 = horizon) in radians-friendly degrees.
export function mapboxPitchToCesiumDeg(mapboxPitch) {
  return mapboxPitch - 90;
}
