# World View — Contemporary World 3D

An immersive, scroll-driven website that explores globalization through a live 3D interactive globe. The experience begins with a cinematic intro sequence, guides the user through five thematic sections on globalization, then launches a world tour of twelve landmark destinations rendered in real-time 3D via Mapbox GL.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
  - [App Entry Point](#app-entry-point)
  - [Intro Sequence](#intro-sequence)
  - [3D Globe (MapboxEarth)](#3d-globe-mapboxearth)
  - [Scrollytelling Layer (Content)](#scrollytelling-layer-content)
  - [Slide Panel](#slide-panel)
  - [Scroll Progress Bar](#scroll-progress-bar)
- [Destinations Data](#destinations-data)
- [Globe Behavior](#globe-behavior)
  - [Scene Profiles](#scene-profiles)
  - [Rome Descent](#rome-descent)
  - [World Tour Flights](#world-tour-flights)
  - [Tile Preloading](#tile-preloading)
  - [Custom 3D Fallback Landmarks](#custom-3d-fallback-landmarks)
  - [Earth Idle Animation](#earth-idle-animation)
- [Globalization Sections](#globalization-sections)
- [Navigation](#navigation)
- [Global Window State](#global-window-state)
- [Accessibility](#accessibility)
- [Styling](#styling)

---

## Overview

World View is a single-page, scroll-driven experience built around a persistent Mapbox GL globe that reacts to scroll position and section context. The user journey is:

1. **Intro** — A cinematic "WORLD VIEW" wordmark orbits a virtual 3D cylinder with a lens flare and starfield, then fades out to reveal the live globe.
2. **Globalization Sections** — Five GSAP-pinned panels (Culture, Economy, Environment, Politics, Technology) appear as ping-pong cards while the globe tilts responsively left and right.
3. **Rome Descent** — A scroll-scrubbed cinematic dive takes the camera from global view all the way down to street level at the Colosseum in Rome.
4. **World Tour** — Twelve landmark destination cards each trigger an automatic camera flight to their real-world coordinates, with 3D buildings and terrain.

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI framework | React | ^19.2 |
| Build tool | Vite | ^8.0 |
| 3D map / globe | Mapbox GL JS | ^3.23 |
| Scroll animation | GSAP + ScrollTrigger | ^3.15 |
| UI animation | Framer Motion | ^12.38 |
| Smooth scroll | Lenis | ^1.3 |
| CSS framework | Tailwind CSS | ^4.3 |
| 3D scene (unused/suspended) | Three.js / R3F | ^0.184 |
| Type safety (data layer) | TypeScript | via `.ts` data file |

---

## Project Structure

```
src/
├── App.jsx                  # Root: Lenis setup, navbar, intro gate, reset handler
├── main.jsx                 # React DOM entry point
├── index.css                # Global styles, custom keyframes, Tailwind theme
├── App.css
│
├── components/
│   ├── MapboxEarth.jsx      # Live 3D globe — all camera logic, scene switching, preloading
│   ├── Content.jsx          # GSAP scrollytelling — section cards + destination cards
│   ├── IntroSequence.jsx    # Cinematic "WORLD VIEW" wordmark animation
│   ├── SlidePanel.jsx       # Slide-in info panel (Colosseum slide at Rome descent end)
│   ├── ScrollProgress.jsx   # Fixed blue progress bar at top of viewport
│   ├── LoadingScreen.jsx    # R3F Loader fallback (Suspense boundary)
│   ├── Scene.jsx            # (Reserved) Three.js scene scaffold
│   ├── CanvasContainer.jsx  # (Reserved) R3F canvas wrapper
│   ├── DomOverlay.jsx       # (Reserved) DOM overlay helper
│   └── GeoBorders.jsx       # (Reserved) Geographic border layer
│
└── lib/
    └── data/
        └── destinations.ts  # 12 destination objects + romeIntro + journeyNavItems

public/
├── artifact_culture_1-4.png # Culture section decorative assets
├── earth_day.jpg            # (Reserved) Earth texture
├── earth_night.jpg          # (Reserved) Earth texture
├── earth_clouds.png         # (Reserved) Cloud overlay
├── earth_normal.jpg         # (Reserved) Normal map
├── earth_specular.jpg       # (Reserved) Specular map
├── earth_topology.png       # (Reserved) Topology map
└── countries.geojson        # Country boundary data
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

Requires Node 18+ and a valid Mapbox public token (see below).

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```

The token must start with `pk.`. If missing or invalid, a setup-error banner is shown in the UI and the globe will not load. The token is read at runtime via `import.meta.env.VITE_MAPBOX_TOKEN`.

---

## Architecture

### App Entry Point

[src/App.jsx](src/App.jsx) orchestrates the top-level experience:

- **Lenis smooth scroll** is initialized once on mount. The instance is stored on `window.codexLenis` for access across components. Scroll is locked (`lenis.stop()`) during the intro and unlocked when `onComplete` fires.
- **Intro gate** — `introActive` state keeps `<IntroSequence>` mounted. When the animation completes it calls `handleIntroComplete`, which dismisses the intro and starts Lenis.
- **Home / reset** — Clicking "Home" in the navbar triggers `handleHomeClick`, which fades in a loading spinner, jumps the scroll to the top instantly (behind the overlay), dispatches a `resetGlobe` custom event, and waits for the `globeResetComplete` response before fading back out.
- **Navbar** — Glassmorphism pill with Home and Timeline links, fixed center-top.
- **Layer order** — `MapboxEarth` (fixed, `z-0`) sits behind the GSAP `Content` layer (`z-10`). The intro overlay sits at `z-[200]`.

---

### Intro Sequence

[src/components/IntroSequence.jsx](src/components/IntroSequence.jsx)

A frame-accurate `requestAnimationFrame` loop drives a single normalized `progress` value (0→1) that feeds all derived animation values in a single render pass — no timelines, no state thrash.

**Three variants** are selected at mount time:

| Variant | Condition | Duration | Behavior |
|---|---|---|---|
| `desktop` | Default | 5 400 ms | 1.5-revolution cylinder orbit |
| `mobile` | `innerWidth < 768` | 4 000 ms | Shorter orbit, no hidden phase |
| `static` | `prefers-reduced-motion` | 1 200 ms | Static fade-in, no orbit |

**"WORLD" letters** are projected onto a virtual cylinder using hand-computed trigonometry: each letter is positioned by `sin(angle) * radius` on the X axis and scaled by `cos(angle)` to simulate depth foreshortening. Letters with `cos ≤ 0.05` (behind the cylinder) are hidden.

**"VIEW" letters** sit below on a flat plane and fade in at 50% of the animation progress.

**Supporting elements** (cinematic variants only):
- Lens flare — a radial gradient `div` with `mixBlendMode: screen` that expands from 0.2× to 1.7× scale.
- Starfield — 8 positioned `motion.span` dots with staggered `opacity` keyframes.

Pressing **Escape** rewinds the RAF clock to the outro phase for a fast skip.

---

### 3D Globe (MapboxEarth)

[src/components/MapboxEarth.jsx](src/components/MapboxEarth.jsx)

The heart of the experience. A single Mapbox GL instance is mounted fixed behind all content and never unmounted for the lifetime of the page.

#### Map Configuration

- **Projection:** `globe`
- **Initial view:** Colosseum coordinates, zoom 1.35, pitch/bearing 0
- **Scroll zoom:** disabled (page scroll must pass through)
- **User interaction:** drag pan + rotate, double-click zoom, pinch-zoom on touch all enabled

#### Cinematic Lighting

Custom lights are applied on every style load via `setCinematicLights()`:

```
ambient: color #d6c4ff (lavender), intensity 0.38
directional: color #ffb36a (warm gold), direction [238, 54], intensity 0.82
             cast-shadows: true, shadow-intensity 0.72
```

#### Atmosphere / Fog

```
color: rgb(8, 12, 24)       — dark horizon
high-color: rgb(36, 92, 170) — blue atmosphere band
horizon-blend: 0.08
space-color: rgb(2, 4, 12)
star-intensity: 0.45
```

#### Terrain

Mapbox DEM terrain is added on every style load with zoom-interpolated exaggeration (0.32 at zoom 6 → 0 at zoom 15), giving depth to the descent without distorting city-level views.

---

### Scene Profiles

The map switches between two Mapbox styles depending on context:

| Profile | Style | 3D Buildings | Labels | Used When |
|---|---|---|---|---|
| `earth` | Custom earth style | Off | All hidden | Globe view, idle, Rome first half |
| `city-model` | Custom city style | On (faded theme) | All hidden | Rome second half, destination close-ups |

Style switching is serialized via `map.codexStyleSwitching` flag. If a switch is already in progress, subsequent requests are dropped. After every style load, lights + terrain + fallback landmarks are re-applied.

---

### Rome Descent

The Rome section is the only scroll-scrubbed camera sequence. `window.romeModeActive` and `window.romeScrollProgress` (0→1) are written by a GSAP ScrollTrigger in `Content.jsx` and read every RAF tick in `MapboxEarth`.

**Phase 1 (progress 0→0.5) — Earth style:**
Camera lerps from global idle (`zoom 1.35`) to Rome overview (`zoom 5.5, pitch 38°`).

**Phase 2 (progress 0.5→1) — City-model style:**
Camera lerps from Rome overview down to street-level Colosseum (`zoom 16.6, pitch 76°, bearing -32°`).

At `progress >= 0.92` the `SlidePanel` (Colosseum info card) slides in from the right. At `progress > 0.3` tile preloading for the Colosseum destination begins.

Keyframes:

```
earth.start  → center: [12.49, 22],   zoom: 1.35, pitch: 0,  bearing: 0
earth.mid    → center: [12.50, 41.90], zoom: 5.5,  pitch: 38, bearing: -16
city.end     → center: [12.49, 41.89], zoom: 16.6, pitch: 76, bearing: -32
```

---

### World Tour Flights

After the Rome descent, scrolling through twelve destination sections each triggers an automatic `flyTo` (not scroll-scrubbed). `Content.jsx` writes to `window.destinationTourState` and `window.destinationTourActive`; `MapboxEarth` picks these up each RAF tick and calls `applyDestinationTourState()`.

Each destination has a custom camera override in `DESTINATION_VIEW_OVERRIDES`:

| Destination | Zoom | Pitch | Bearing | Notes |
|---|---|---|---|---|
| Colosseum | 16.6 | 76° | -32° | Default city-end profile |
| St. Peter's Basilica | 16.5 | 65° | -90° | Camera east, looking west at dome |
| Xi'an City Wall | 16.4 | 72° | 0° | Camera south of Yongning Gate |
| Royal Palace Madrid | 17.0 | 70° | 0° | Ceremonial south facade |
| Neuschwanstein | 17.3 | 72° | -45° | Gatehouse head-on |
| Buckingham Palace | 17.0 | 72° | -90° | East facade from the Mall |
| Big Ben | 17.4 | 66° | 180° | North face of Elizabeth Tower |
| Statue of Liberty | 17.4 | 62° | -64° | Camera facing her face |
| White House | 17.4 | 68° | 180° | North Portico front view |
| World Trade Center | 15.8 | 65° | 180° | Pulled back to fit spire |
| San Salvador Island | 14.5 | 60° | 0° | 3D angled bird's-eye |
| Magellan Landing Site | 6.5 | 30° | 0° | Wide earth view (no city tiles) |

On **mobile** (`innerWidth < 768`), all destinations use the earth style at zoom ~6.2 to avoid loading heavy city-model tiles on smaller connections.

---

### Tile Preloading

An invisible offscreen Mapbox instance (640×480, `left: -9999px`) is kept running for the page lifetime. While the user dwells on destination N, `queueDestinationPreload()` jumps the preload map to destination N+1 so its tiles land in the browser HTTP cache before the next `flyTo` runs.

- Skipped on mobile and under `prefers-reduced-motion`
- Serialized queue — only one preload runs at a time
- 8-second hard timeout per destination
- Destinations already cached are deduped

---

### Custom 3D Fallback Landmarks

Mapbox's built-in 3D landmarks only exist for major cities. Three destinations have no native 3D data; hand-crafted GeoJSON `fill-extrusion` polygons substitute:

**Xi'an City Wall** — A hollow rectangle (outer ring + inner hole) approximating the Ming-era wall perimeter (~870 × 800 m at focal scale), plus a taller south gate tower block at the Yongning Gate position.

**San Salvador Island** — An elliptical island ring (32-point polygon, ~620 × 375 m half-axes) plus a slender lighthouse marker (6 m square, 32 m tall) at center.

**Magellan Landing Site** — A low rectangular memorial platform (~35 × 15 m) plus a narrow vertical marker (6 m square, 18 m tall).

All extrusions fade in from zoom 10→12 and reach full opacity at zoom 12+.

---

### Earth Idle Animation

When the globe is not in Rome mode or destination tour mode, a `requestAnimationFrame` loop drives a continuous idle animation:

- **Auto-rotation** — longitude advances at 1.45°/second
- **Bobbing** — latitude oscillates with `sin(time * 1.5) * 1.5°`
- **Tilt response** — when a globalization section is active, `window.globeTargetDirection` (-1 or 1) is read each tick. The globe tilts, banks, zooms out, and pads toward the opposite side of the screen so the content card has room. The transition uses an ease factor of 0.012 per frame for smooth inertia.

---

### Scrollytelling Layer (Content)

[src/components/Content.jsx](src/components/Content.jsx)

Built on GSAP ScrollTrigger with Lenis providing the smooth scroll feed.

#### Globalization Sections (Ping-Pong)

Five sections (Culture, Economy, Environment, Politics, Technology) are pinned one at a time. Each section's card animates in from the side (alternating right/left), holds, then fades out:

- Even-index (0, 2, 4) → card slides from the **right**
- Odd-index (1, 3) → card slides from the **left**

Child `.stagger-item` elements animate in with a 0.5s stagger after the card arrives.

Each pin covers `+=150%` of scroll distance (fast pin-hold-release rhythm).

#### Destination Sections

Twelve sections follow the ping-pong sections. Each is pinned for `+=85%`. On `onEnter`/`onEnterBack`:
1. The destination card fades in from below
2. `window.destinationTourState` is updated, triggering the globe flight in MapboxEarth

The Colosseum section (index 0) additionally renders a **floating gladiatorial painting** — *Pollice Verso* by Jean-Léon Gérôme (1872, public domain) — positioned at the top of the section with a gentle CSS float animation (`spartan-float`, 4s ease-in-out).

---

### Slide Panel

[src/components/SlidePanel.jsx](src/components/SlidePanel.jsx)

A fixed right-side drawer (`Framer Motion` slide-in) that appears when the Rome descent reaches ~92% completion. Displays a formatted article card (tag, subtitle, title, summary, key points) for the Colosseum. Dismissable via the close button.

---

### Scroll Progress Bar

[src/components/ScrollProgress.jsx](src/components/ScrollProgress.jsx)

A 2 px blue (`#0A6ED3`) `scaleX` bar fixed to the top of the viewport. Tracks `window.scrollY / (document.scrollHeight - innerHeight)`, throttled to one RAF update per scroll event.

---

## Destinations Data

[src/lib/data/destinations.ts](src/lib/data/destinations.ts)

Typed array of 12 destination objects:

```ts
{
  id: string          // kebab-case unique identifier
  name: string        // display name
  location: string    // city / country label
  built: string       // construction date or type
  lat: number         // WGS-84 latitude
  lon: number         // WGS-84 longitude
  about: string       // short description
  significance: string // one-line cultural significance
}
```

`journeyNavItems` is derived from this array and drives the right-sidebar journey nav and the mobile journey menu.

---

## Navigation

### Top Navbar
Glassmorphism pill, fixed center-top. Contains:
- **Home** — triggers globe reset (fade overlay → scroll to top → `resetGlobe` event → `globeResetComplete`)
- **Timeline** — anchor to `#culture` (first globalization section)

### Section Nav (Mobile)
Fixed bottom bar showing numbered section pills. Tapping any scrolls to that panel via Lenis.

### Journey Index (Desktop)
Fixed right sidebar, visible only during the destination tour. Shows all 12 destinations as a vertical list with active/past dot indicators. Clicking scrolls to that destination section.

### Journey Menu (Mobile)
A full-screen overlay triggered by a hamburger button (top-right, visible during the tour). Lists all destinations with location subtitles.

---

## Global Window State

MapboxEarth and Content communicate exclusively through shared `window` properties, avoiding prop drilling across the component tree:

| Property | Type | Written by | Read by | Purpose |
|---|---|---|---|---|
| `window.romeModeActive` | `boolean` | Content | MapboxEarth | Is the Rome descent ScrollTrigger active? |
| `window.romeScrollProgress` | `0–1` | Content | MapboxEarth | Normalized scroll progress within Rome descent |
| `window.destinationTourActive` | `boolean` | Content | MapboxEarth | Is a destination section pinned? |
| `window.destinationTourState` | `{index, progress, requestedAt}` | Content | MapboxEarth | Which destination and how far in |
| `window.globeTargetDirection` | `-1 \| 0 \| 1` | Content | MapboxEarth | Which side of screen the card is on |
| `window.codexLenis` | `Lenis` | App | Content | Shared Lenis instance for smooth scrollTo |

---

## Accessibility

- All interactive elements have `focus-visible` outlines in the brand blue (`#0A6ED3`)
- `aria-label` and `aria-current="step"` on all nav buttons
- `aria-hidden="true"` on decorative elements (intro, globe container, progress bar, floating image)
- `prefers-reduced-motion` is checked at multiple points:
  - IntroSequence falls back to a static fade variant
  - GSAP scroll animations are skipped (content is statically visible)
  - Globe flies are replaced with `jumpTo` (instant)
  - Tile preloading is disabled
  - The floating Spartan image animation is paused via CSS media query

---

## Styling

Tailwind CSS v4 with a custom theme defined in `index.css`:

```css
--color-primary: #0A6ED3   /* Brand blue */
--color-secondary: #054E98
--color-dark: #000000
--color-darker: #000010
--font-sans: 'General Sans', sans-serif
--font-serif: 'Gambetta', serif
```

The `.glass` utility class provides the glassmorphism treatment used on the navbar and section cards:
```css
background: rgba(10, 110, 211, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(10, 110, 211, 0.2);
```

Custom keyframe animations:
- `destination-marker-pulse` — expanding ring on map markers
- `spartan-float` — gentle 14px vertical bob on the Colosseum battle painting (4s)
