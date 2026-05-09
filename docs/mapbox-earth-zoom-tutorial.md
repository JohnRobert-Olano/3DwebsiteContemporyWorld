# Mapbox Earth Zoom Tutorial

This tutorial replaces the custom Three.js Earth zoom idea with Mapbox GL JS, using your custom Mapbox Studio globe style and camera flight controls. It intentionally avoids custom markers/pins in code so the globe stays controlled by the Mapbox style.

Official references:
- Mapbox GL JS install guide: https://docs.mapbox.com/mapbox-gl-js/guides/install/
- Mapbox projections and globe: https://docs.mapbox.com/mapbox-gl-js/guides/projections/
- Mapbox flyTo example: https://docs.mapbox.com/mapbox-gl-js/example/flyto/

## 1. Create A Mapbox Token

1. Create or open a Mapbox account at https://account.mapbox.com/.
2. Copy a public access token.
3. Add it to a local `.env` file at the repo root:

```env
VITE_MAPBOX_TOKEN=pk.your_public_mapbox_token_here
```

Vite only exposes browser environment variables that start with `VITE_`, so do not use `MAPBOX_TOKEN` without the prefix.

## 2. Install Mapbox GL JS

```powershell
npm install mapbox-gl
```

## 3. Create A Mapbox Scene Component

Create `src/components/MapboxEarth.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const COLOSSEUM = {
  center: [12.4922, 41.8902],
};
const MAPBOX_STYLE_URL = 'mapbox://styles/markjohn17/cmoyf4n2b003p01rfc3r655m4';

const waitForMoveEnd = (map) => new Promise((resolve) => {
  map.once('moveend', resolve);
});

async function flyToColosseum(map) {
  map.flyTo({
    center: [12.4964, 41.9028],
    zoom: 4.5,
    pitch: 0,
    bearing: 0,
    duration: 2400,
    essential: true,
  });
  await waitForMoveEnd(map);

  map.flyTo({
    center: COLOSSEUM.center,
    zoom: 11.5,
    pitch: 45,
    bearing: -20,
    duration: 2600,
    essential: true,
  });
  await waitForMoveEnd(map);

  map.flyTo({
    center: COLOSSEUM.center,
    zoom: 17,
    pitch: 68,
    bearing: -35,
    duration: 3200,
    essential: true,
  });
}

export default function MapboxEarth() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE_URL,
      projection: 'globe',
      center: [12.4922, 41.8902],
      zoom: 1.35,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
    });

    mapRef.current = map;

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(8, 12, 24)',
        'high-color': 'rgb(36, 92, 170)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(2, 4, 12)',
        'star-intensity': 0.45,
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="fixed bottom-24 left-4 z-40 rounded-lg border border-[#0A6ED3]/30 bg-black/70 p-3 shadow-2xl backdrop-blur-xl sm:left-6">
        <button
          type="button"
          onClick={() => mapRef.current && flyToColosseum(mapRef.current)}
          className="cursor-pointer rounded-md border border-[#0A6ED3]/60 bg-[#0A6ED3]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-[#0A6ED3]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DB7F0]"
        >
          Colosseum
        </button>
      </div>
    </div>
  );
}
```

## 4. Swap The Scene

In `src/App.jsx`, replace the current Three.js scene import:

```jsx
import Scene from './components/Scene';
```

with:

```jsx
import MapboxEarth from './components/MapboxEarth';
```

Then replace:

```jsx
<Scene />
```

with:

```jsx
<MapboxEarth />
```

Keep the existing `Content` overlay if you still want the scrollytelling cards above the map.

## 5. Expected Behavior

The `Colosseum` button should produce a staged camera move:

1. Space/globe view.
2. Europe/Italy view.
3. Rome city view.
4. Low, pitched Colosseum area view.

Mapbox will not be identical to Google Earth photorealistic 3D tiles, but your custom Mapbox style gives a real interactive globe and city map without frame-by-frame images or code-added pins.

## 6. Notes Before Production

- Use Mapbox billing/usage limits appropriate for public deployment.
- Keep the token restricted in your Mapbox account settings.
- If the first load feels heavy, lazy-load `MapboxEarth` only when the user enters the map experience.
- If you need more photorealistic 3D city detail later, compare this with CesiumJS plus Google Photorealistic 3D Tiles.
