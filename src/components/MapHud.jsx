// ─── Map Camera HUD ────────────────────────────────────────────────────────
// Live read-out of Mapbox camera state (lng, lat, zoom, pitch, bearing, alt).
// Subtle developer-style overlay pinned to the top-left of the viewport.
// Self-contained — to remove, delete this file and the <MapHud /> usage in
// MapboxEarth.jsx. It only listens to map events and never mutates the map.
// ──────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

function formatNumber(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function formatAltitude(altitudeMeters, zoom) {
  if (Number.isFinite(altitudeMeters)) {
    if (Math.abs(altitudeMeters) >= 10000) {
      return `${(altitudeMeters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(altitudeMeters).toLocaleString()} m`;
  }
  return `~ map zoom ${formatNumber(zoom, 2)}`;
}

function readCameraAltitude(map) {
  try {
    const free = map.getFreeCameraOptions?.();
    const position = free?.position;
    if (position && typeof position.toAltitude === 'function') {
      return position.toAltitude();
    }
  } catch {
    // Free camera not available on every projection / version — fall through.
  }
  return null;
}

export default function MapHud({ map }) {
  const [stats, setStats] = useState(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!map) return undefined;

    const read = () => {
      rafRef.current = 0;
      const center = map.getCenter();
      setStats({
        lng: center.lng,
        lat: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        altitude: readCameraAltitude(map),
      });
    };

    // Coalesce the four overlapping events (move/zoom/rotate/pitch all fire
    // together during a flyTo) into one read per animation frame.
    const schedule = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(read);
    };

    read();

    map.on('move', schedule);
    map.on('zoom', schedule);
    map.on('rotate', schedule);
    map.on('pitch', schedule);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      map.off('move', schedule);
      map.off('zoom', schedule);
      map.off('rotate', schedule);
      map.off('pitch', schedule);
    };
  }, [map]);

  if (!stats) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 top-3 z-50 select-none rounded-md border border-white/10 bg-black/55 px-3 py-2 font-mono text-[11px] leading-tight text-white/85 shadow-lg backdrop-blur-md"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-hidden="true"
    >
      <div className="mb-1 text-[9px] uppercase tracking-[0.18em] text-white/45">
        Camera HUD
      </div>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
        <span className="text-white/45">Longitude</span>
        <span>{formatNumber(stats.lng, 5)}</span>

        <span className="text-white/45">Latitude</span>
        <span>{formatNumber(stats.lat, 5)}</span>

        <span className="text-white/45">Zoom</span>
        <span>{formatNumber(stats.zoom, 2)}</span>

        <span className="text-white/45">Pitch</span>
        <span>{formatNumber(stats.pitch, 1)}°</span>

        <span className="text-white/45">Bearing</span>
        <span>{formatNumber(stats.bearing, 1)}°</span>

        <span className="text-white/45">Altitude</span>
        <span>{formatAltitude(stats.altitude, stats.zoom)}</span>
      </div>
    </div>
  );
}
