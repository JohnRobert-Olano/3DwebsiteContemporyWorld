# Website Structure Map

Use this file as an editing map for the whole website. It lists the visible feature, the file that owns it, the main component/container/selector, and the safest target to mention when writing a prompt or making code edits.

## App Overview

The app is a Vite React site. The visible experience is built from three main layers:

1. `src/App.jsx`: global shell, intro, reset overlay, primary nav, progress bar, fixed globe layer, and foreground content.
2. `src/components/CesiumEarth.jsx`: the fixed 3D Earth background, camera transitions, loading states, and camera HUD.
3. `src/components/Content.jsx`: the scroll-driven foreground website, five topic panels, 12 landmark sections, landmark title cards, destination navigation, and projects finale unlock button.

Top-level render tree:

```txt
index.html
  #root
    src/main.jsx
      <App />
        <main>
          <IntroSequence />
          reset overlay
          primary navigation
          <ScrollProgress />
          <Suspense fallback={<LoadingScreen />}>
            <CesiumEarth />
          </Suspense>
          <Content />
            mobile topic nav
            desktop destination index
            mobile destination drawer
            hero spacer
            5 topic <ContentSection /> panels
            12 landmark <section /> anchors
            <LandmarkTitleCard /> overlay
            <ProjectsFinale />
            footer spacer
```

## Quick Edit Index

| Visible thing or feature | Primary file | Component/container/selector to target | Notes |
|---|---|---|---|
| App shell and main background | `src/App.jsx` | `<main className="relative w-full min-h-screen ...">` | Root visual wrapper for the whole app. |
| Primary top nav | `src/App.jsx` | `nav[aria-label="Primary navigation"]` | Contains `Index` reset link and `Archive` link. |
| Home/reset behavior | `src/App.jsx` | `handleHomeClick` | Scrolls to top, dispatches `resetGlobe`, shows "Resynchronizing". |
| Reset loading overlay | `src/App.jsx` | fixed `z-[100]` motion overlay | Text is currently `Resynchronizing`. |
| Smooth scrolling | `src/App.jsx` | `Lenis` setup, `window.codexLenis` | Shared by content and finale scroll actions. |
| Intro animation | `src/components/IntroSequence.jsx` | `<IntroSequence />` fixed `z-[200]` | WORLD cylinder text, starfield, intro timing. |
| Global scroll progress bar | `src/components/ScrollProgress.jsx` | fixed top `z-[60]` bar | Thin primary-color line at top of viewport. |
| Globe canvas/container | `src/components/CesiumEarth.jsx` | outer fixed `div` with `data-lenis-prevent` | Fixed background layer behind all content. |
| 3D Earth loading illustration | `src/components/EarthLoadingState.jsx` | `.earth-preload-shell` and child classes | Styled in `src/index.css`. |
| Full app loading fallback | `src/components/LoadingScreen.jsx` | fixed `z-[150]` wrapper | Used while lazy `CesiumEarth` loads. |
| Camera HUD/telemeter | `src/components/MapHud.jsx` | fixed top-left `tech-border` panel | Reads from `window.codexMap` shim. |
| Five topic panels | `src/components/Content.jsx` | `sections` array and `ContentSection` | Culture, Economy, Environment, Politics, Technology. |
| Topic panel section wrappers | `src/components/Content.jsx` | `#culture`, `#economy`, etc. with `.panel-section` | Each is one viewport scroll target. |
| Topic headline text | `src/components/Content.jsx` | `#culture-title`, `#economy-title`, etc. | Headline words use `.split-word`. |
| Topic microcopy | `src/components/Content.jsx` | `.content-panel-copy` | Summary plus "Archive Index" link. |
| Word-by-word animation wrapper | `src/components/SplitWords.jsx` | `.split-word` spans | Used by topic panels and landmark titles. |
| Desktop landmark navigation | `src/components/Content.jsx` | `nav[aria-label="Destination index"]` | Right-side "Global Registry" list. |
| Mobile topic nav | `src/components/Content.jsx` | `nav[aria-label="Mobile section navigation"]` | Bottom numbered pills for the 5 topic panels. |
| Mobile landmark menu button | `src/components/Content.jsx` | `button[aria-label="Open destination index"]` | Opens the full-screen mobile destination drawer. |
| Mobile landmark drawer | `src/components/Content.jsx` | fixed `z-[70]` drawer, heading `Data Index` | Contains all 12 destination buttons. |
| Landmark scroll anchors | `src/components/Content.jsx` | `#destination-{destination.id}` and `.destination-section` | One invisible/full-screen anchor per landmark. |
| Landmark title card overlay | `src/components/LandmarkTitleCard.jsx` | `.landmark-title-card` | Fixed portal overlay in normal motion. |
| Landmark title name | `src/components/LandmarkTitleCard.jsx` | first `h1` inside `.landmark-title-card` | Uses `destination.name`. |
| Landmark "Discover more" text | `src/components/LandmarkTitleCard.jsx` | `discoverContainerRef` group | Animated with title words. |
| Landmark era/year text | `src/components/LandmarkTitleCard.jsx` | `.landmark-era` | Uses `destination.eraRange`; styled in `src/index.css`. |
| 12 landmark data/content | `src/lib/data/destinations.ts` | `destinations` array | IDs, names, locations, era ranges, lat/lon, camera data. |
| Landmark camera framing | `src/components/CesiumEarth.jsx` | `DESTINATION_VIEW_OVERRIDES`, `getDestinationCamera` | Some destinations also define `camera` in data. |
| Landmark camera transition | `src/components/CesiumEarth.jsx` | `applyDestinationTourState` | Calls `zoomThroughEarthLayers`. |
| Camera interpolation helpers | `src/lib/cesium/cameraController.js` | `zoomThroughEarthLayers`, `panToPose`, `poseFromMapbox` | Core Cesium camera math. |
| Final WTC articles button | `src/components/Content.jsx` | `button[aria-label="Go to articles"]` | Only appears at `world-trade-center-nyc`. |
| Projects finale unlock logic | `src/components/Content.jsx` | `scrollToProjectsFinale` | Dispatches `projectsFinaleUnlock`, waits for ready event. |
| Projects finale section | `src/components/ProjectsFinale.jsx` | `#projects-finale` | Hidden until unlocked by the WTC button. |
| Diagonal album/card stack | `src/components/ProjectsFinale.jsx` | `StackCard`, `stackRef`, `VIRTUAL_CARDS` | Desktop overview mode only. |
| Project cover visual | `src/components/ProjectsFinale.jsx` | `ProjectCover` | Image, fallback panel, index/year labels. |
| Projects grid fallback/index | `src/components/ProjectsFinale.jsx` | `GridCard` and mode `INDEX` | Used on mobile, reduced motion, or index mode. |
| Project fullscreen modal | `src/components/ProjectsFinale.jsx` | `FullscreenView` | Opens when clicking a project card. |
| Project data/content | `src/lib/data/projects.ts` | `projects` array | Title, role, year, image, blurb, link. |
| Global typography and colors | `src/index.css` | `:root`, `@theme`, font faces | Defines Inter Fixed, colors, CSS utility hooks. |
| Glass UI style | `src/index.css` | `.glass` | Used by primary nav. |
| Technical border style | `src/index.css` | `.tech-border` | Used by HUD and slide panel. |
| Projects finale chrome hiding | `src/index.css` | `body.in-projects-finale ...` | Hides nav/HUD during pinned finale. |

## Main Files

| File | Role |
|---|---|
| `index.html` | Browser entry HTML with the `#root` mount node. |
| `src/main.jsx` | Imports Cesium widget CSS and `src/index.css`, then renders `<App />`. |
| `src/App.jsx` | Main shell and global navigation. |
| `src/index.css` | Tailwind import, theme tokens, font faces, global utility classes, loading Earth CSS, landmark era styling, finale chrome hiding. |
| `src/components/Content.jsx` | Main scrollytelling controller and foreground DOM. This is the largest coordination file. |
| `src/components/CesiumEarth.jsx` | Cesium viewer setup and all 3D Earth camera drivers. |
| `src/lib/cesium/cameraController.js` | Camera pose conversion and transition math. |
| `src/lib/cesium/zoomToHeight.js` | Converts Mapbox-style zoom values into Cesium camera ranges. |
| `src/lib/data/destinations.ts` | All 12 landmark data entries. |
| `src/lib/data/projects.ts` | Projects/album/finale card data. |

`src/App.css` still contains starter-style CSS selectors such as `.counter`, `.hero`, `#center`, and `#next-steps`. It is not part of the current main app structure unless imported elsewhere.

## App Shell

Primary owner: `src/App.jsx`

Important containers:

```txt
<main className="relative w-full min-h-screen bg-[#080808] text-white overflow-x-hidden font-sans">
nav[aria-label="Primary navigation"]
<ScrollProgress />
<CesiumEarth />
<Content lenisRef={lenisRef} />
```

Behavior hooks:

| Hook/function | Purpose |
|---|---|
| `handleIntroComplete` | Ends intro and restarts Lenis scrolling. |
| `handleHomeClick` | Shows reset overlay, scrolls to top, dispatches `resetGlobe`, waits for `globeResetComplete`. |
| `window.codexLenis` | Global Lenis instance used by `Content.jsx` and `ProjectsFinale.jsx`. |

Prompt targets:

```txt
To edit the top navigation, target `nav[aria-label="Primary navigation"]` in `src/App.jsx`.
To edit the reset-to-home behavior, target `handleHomeClick` in `src/App.jsx`.
To edit the intro handoff, target `handleIntroComplete` and the `<IntroSequence />` block in `src/App.jsx`.
```

## Foreground Scrollytelling

Primary owner: `src/components/Content.jsx`

Root container:

```txt
<div ref={containerRef} className="main-scroller relative z-10 w-full pointer-events-none font-sans">
```

This component owns:

- The 5 globalization topic sections.
- The mobile topic navigation.
- The desktop and mobile landmark navigation.
- The 12 landmark scroll anchor sections.
- The landmark title-card timing state machine.
- The WTC "Go to articles" button.
- The unlock/scroll behavior into the projects finale.
- Scroll snapping and gesture guards between major sections.

Important state and functions:

| Name | Purpose |
|---|---|
| `sections` | Content data for Culture, Economy, Environment, Politics, Technology. |
| `activeSection` | Current 5-topic section index. |
| `activeJourneyIndex` | Current landmark index from 0 to 11. |
| `visibleTitleIndex` | Landmark title currently mounted/visible. |
| `titlePhase` | `hidden`, `entering`, `visible`, or `exiting`. |
| `setDestinationTourState(index)` | Writes `window.destinationTourActive` and `window.destinationTourState` for the Cesium layer. |
| `activateJourneyIndex(index)` | Updates foreground active landmark and tells Cesium to fly/zoom there. |
| `withTitleExit(action)` | Waits for title-card exit animation before running a scroll/navigation action. |
| `scrollTo(index)` | Scrolls to one of the 5 topic panels. |
| `scrollToJourney(index)` | Scrolls to one of the 12 landmark anchors. |
| `scrollToProjectsFinale()` | Unlocks the finale, waits until it is ready, then scrolls into it. |

## Five Topic Panels

Primary owner: `src/components/Content.jsx`

Data source:

```txt
const sections = [
  culture,
  economy,
  environment,
  politics,
  technology
]
```

Rendered by:

```txt
<ContentSection sec={sec} index={index} />
```

Panel DOM pattern:

```txt
section#culture.panel-section
  .content-panel-type
    h2#culture-title
      .split-word
    .content-panel-copy
      micro label
      summary text
      Archive Index link
```

Section IDs and title IDs:

| Topic | Section selector | Title selector |
|---|---|---|
| Culture | `#culture.panel-section` | `#culture-title` |
| Economy | `#economy.panel-section` | `#economy-title` |
| Environment | `#environment.panel-section` | `#environment-title` |
| Politics | `#politics.panel-section` | `#politics-title` |
| Technology | `#technology.panel-section` | `#technology-title` |

Layout logic:

- `cardSide(index)` alternates the content position left/right.
- Even sections use one side; odd sections use the opposite side.
- `handleSectionEnter` sets `window.globeTargetDirection` so the fixed globe shifts left or right.
- Each panel has its own GSAP `ScrollTrigger`.
- Headline, summary, and microcopy are split into `.split-word` spans for staggered slide animations.

Prompt targets:

```txt
To change the text of Culture/Economy/etc., edit the `sections` array in `src/components/Content.jsx`.
To change the visual layout of the 5 panels, edit `ContentSection` in `src/components/Content.jsx`.
To change word animation behavior for the 5 panels, edit the GSAP timeline inside `ContentSection`.
To change the reusable word wrapper, edit `src/components/SplitWords.jsx`.
```

## Landmark Tour

Primary owners:

- `src/components/Content.jsx` for scroll anchors, nav, title-card state, and WTC finale button.
- `src/components/CesiumEarth.jsx` for destination camera movement.
- `src/components/LandmarkTitleCard.jsx` for visible title design and animation.
- `src/lib/data/destinations.ts` for data.

Landmark order:

| Index | ID | Name | Section selector |
|---:|---|---|---|
| 1 | `colosseum` | Colosseum | `#destination-colosseum` |
| 2 | `saint-peters-basilica` | Saint Peter's Basilica | `#destination-saint-peters-basilica` |
| 3 | `xian-city-wall` | Xi'an City Wall | `#destination-xian-city-wall` |
| 4 | `san-salvador-island` | San Salvador Island | `#destination-san-salvador-island` |
| 5 | `magellan-landing-site` | Cagusu-an Church and Plaza | `#destination-magellan-landing-site` |
| 6 | `royal-palace-madrid` | Royal Palace of Madrid | `#destination-royal-palace-madrid` |
| 7 | `neuschwanstein-castle` | Neuschwanstein Castle | `#destination-neuschwanstein-castle` |
| 8 | `buckingham-palace` | Buckingham Palace | `#destination-buckingham-palace` |
| 9 | `big-ben` | Big Ben | `#destination-big-ben` |
| 10 | `statue-of-liberty` | Statue of Liberty | `#destination-statue-of-liberty` |
| 11 | `white-house` | The White House | `#destination-white-house` |
| 12 | `world-trade-center-nyc` | World Trade Center NYC | `#destination-world-trade-center-nyc` |

Landmark anchor DOM pattern:

```txt
section#destination-colosseum.destination-section.panel-section
section#destination-saint-peters-basilica.destination-section.panel-section
...
section#destination-world-trade-center-nyc.destination-section.panel-section
  button[aria-label="Go to articles"]
```

Destination data fields:

```txt
id
name
location
built
eraRange
lat
lon
camera
about
significance
```

Prompt targets:

```txt
To rename a landmark or change title-card content, edit `src/lib/data/destinations.ts`.
To change a landmark camera angle, edit the destination `camera` object in `src/lib/data/destinations.ts` or `DESTINATION_VIEW_OVERRIDES` in `src/components/CesiumEarth.jsx`.
To change the landmark scroll anchor or WTC button placement, edit the `destinations.map(...)` render block in `src/components/Content.jsx`.
To change the desktop destination list, edit `nav[aria-label="Destination index"]` in `src/components/Content.jsx`.
To change the mobile destination drawer, edit the `isJourneyMenuOpen` drawer in `src/components/Content.jsx`.
```

## Landmark Title Cards

Primary owner: `src/components/LandmarkTitleCard.jsx`

Container selectors:

```txt
.landmark-title-card
.landmark-era
.split-word
```

Visible groups:

| Group | Source | Ref/selector |
|---|---|---|
| Landmark name | `destination.name` | `nameContainerRef` and top-left `h1` |
| Discover label | Static text `Discover more` | `discoverContainerRef` |
| Era range | `destination.eraRange` | `eraContainerRef`, `.landmark-era` |
| Backdrop scrim | Internal gradient | `backdropRef` |

Animation model:

- `phase="entering"` slides words in with staggered GSAP timelines.
- `phase="visible"` holds all title words visible.
- `phase="exiting"` slides words out before the next camera change/navigation continues.
- `phase="hidden"` keeps it invisible.
- In normal motion, the title card is portaled to `document.body` as a fixed overlay.
- In reduced motion, the title card is rendered inside each landmark section.

Timing controller:

The title-card state machine lives in `src/components/Content.jsx`, not inside the card itself. Look for:

```txt
visibleTitleIndex
titlePhase
handleTitleEnterComplete
handleTitleExitComplete
withTitleExit
REVEAL_ENTRY_BUFFER_MS
REVEAL_STABLE_MS
REVEAL_FALLBACK_MS
```

Prompt targets:

```txt
To redesign title-card typography, target `.landmark-title-card` and `.landmark-era` in `src/components/LandmarkTitleCard.jsx` plus `.landmark-era` in `src/index.css`.
To change title-card timing or synchronization with the camera, target the title state machine in `src/components/Content.jsx`.
To change the enter/out animation, target the GSAP effect inside `src/components/LandmarkTitleCard.jsx`.
```

## 3D Earth Layer

Primary owner: `src/components/CesiumEarth.jsx`

Main containers:

```txt
<div ref={containerOuterRef} className="fixed inset-0 z-0 will-change-transform" data-lenis-prevent>
  <div className="absolute inset-0" data-lenis-prevent>
    <div ref={containerRef} className="h-full w-full" data-lenis-prevent />
  </div>
</div>
```

Key responsibilities:

- Creates the Cesium `Viewer`.
- Loads Google Photorealistic 3D Tiles.
- Samples landmark surface heights.
- Provides a Mapbox-like `window.codexMap` shim for HUD and projection helpers.
- Drives idle globe rotation.
- Drives Rome intro/descent scrub.
- Drives landmark destination transitions.
- Handles `resetGlobe`.
- Shows setup errors and tile-loading badges.

Important constants/functions:

| Name | Purpose |
|---|---|
| `ROME_KEYFRAMES` | Rome/Colosseum scrub camera keyframes. |
| `DESTINATION_VIEW_OVERRIDES` | Camera fallback/override per landmark. |
| `applyRomeScrollState` | Scroll-scrubbed Rome descent camera. |
| `applyDestinationTourState` | Landmark camera transition entry point. |
| `buildEarthIdleDriver` | Idle rotating Earth driver. |
| `handleResetGlobe` | Resets global flags and returns camera to overview. |
| `containerOuterRef` shift effect | Moves globe left/right during the five topic panels. |

Prompt targets:

```txt
To change the idle globe position/rotation, target `EARTH_IDLE_CENTER`, `EARTH_OVERVIEW_ZOOM`, and `buildEarthIdleDriver` in `src/components/CesiumEarth.jsx`.
To change Rome-to-Colosseum motion, target `ROME_KEYFRAMES` and `applyRomeScrollState`.
To change landmark camera transitions, target `applyDestinationTourState` in `src/components/CesiumEarth.jsx` and `zoomThroughEarthLayers` in `src/lib/cesium/cameraController.js`.
To change the live camera HUD, target `src/components/MapHud.jsx`.
```

## Camera Controller

Primary owner: `src/lib/cesium/cameraController.js`

Core helpers:

| Function | Purpose |
|---|---|
| `poseFromMapbox` | Converts Mapbox-style center/zoom/pitch/bearing into Cesium pose data. |
| `setCameraPose` | Instantly applies a pose. Used for scrub and idle frames. |
| `flyToPose` | Cesium flight helper; currently landmark tour prefers staged zoom instead. |
| `panToPose` | Smooth shortest-path pan between poses, used by reset and available for panning. |
| `zoomThroughEarthLayers` | Three-stage Earth-scale destination transition. |
| `lerpMapboxPoses` | Interpolates Mapbox-shaped poses for the Rome scrub. |
| `readCameraAsMapboxPose` | Converts current Cesium camera back into Mapbox-style values for HUD. |
| `projectLngLat` | Projects lon/lat to screen coordinates. |

`zoomThroughEarthLayers` stages:

```txt
1. startPose -> globalPose
2. globalPose -> regionalPose
3. regionalPose -> endPose
```

Prompt targets:

```txt
To make landmark transitions feel more like zoom layers, tune `globalRange`, `regionalRange`, `durationSec`, and the `stages` array inside `zoomThroughEarthLayers`.
To make pathing shorter or more geodesic, target `slerpLatLon`, `lerpAngle`, and `panToPose`.
```

## Projects Finale / Album Website

Primary owner: `src/components/ProjectsFinale.jsx`

Data owner: `src/lib/data/projects.ts`

Entry point:

```txt
section#projects-finale.panel-section
```

Unlock path:

```txt
Content.jsx
  world-trade-center-nyc section
    button[aria-label="Go to articles"]
      scrollToProjectsFinale()
        window.projectsFinaleUnlocked = true
        dispatch projectsFinaleUnlock
        wait for projectsFinaleReady
        scroll to #projects-finale
```

Main components inside `ProjectsFinale.jsx`:

| Component/function | Purpose |
|---|---|
| `ProjectCover` | The visible card/album cover surface. Handles project image, fallback cover, index label, year label. |
| `StackCard` | Desktop diagonal 3D stack card. |
| `GridCard` | Grid/index card fallback. |
| `FullscreenView` | Project modal when a card is opened. |
| `ProjectsFinale` | Section state, pinning, stack scroll, mode toggle, unlock handling. |

Key stack constants:

| Constant | Purpose |
|---|---|
| `STEP_X_VW` | Horizontal spacing per diagonal card step. |
| `STEP_Y_VW` | Vertical spacing per diagonal card step. |
| `STEP_Z_PX` | Depth spacing per card step. |
| `ROT_X_DEG`, `ROT_Y_DEG`, `ROT_Z_DEG` | 3D card rotation. |
| `SCRUB_DISTANCE` | Scroll distance for the pinned card stack. |
| `STACK_ORIGIN_X`, `STACK_ORIGIN_Y` | Stack origin in viewport. |
| `CARD_WIDTH`, `CARD_ASPECT` | Card size and aspect ratio. |
| `LOOP_COPIES`, `TOTAL_VIRTUAL`, `START_SEQUENCE` | Looping virtual-card setup. |

Important selectors:

```txt
#projects-finale
button[aria-label^="Open "]     // project cards
button[aria-label="Close project"]
button[aria-label="Switch to overview view"]
button[aria-label="Switch to index view"]
```

Mode behavior:

- `OVERVIEW`: desktop diagonal card stack if unlocked, not mobile, and not reduced motion.
- `INDEX`: grid card view.
- Mobile and reduced-motion users get the grid view instead of the pinned stack.
- During the pinned finale, `document.body.classList.add('in-projects-finale')` hides normal chrome via `src/index.css`.

Prompt targets:

```txt
To change the album cover/card design, target `ProjectCover` in `src/components/ProjectsFinale.jsx`.
To change the diagonal stack layout, target `StackCard` and the stack constants at the top of `src/components/ProjectsFinale.jsx`.
To change the scroll-loop behavior, target `VIRTUAL_CARDS`, `START_SEQUENCE`, `setCamera`, and the `ScrollTrigger.create` block in `ProjectsFinale`.
To change the project text/images, edit `src/lib/data/projects.ts`.
To change the fullscreen project modal, target `FullscreenView`.
```

## Data Files

### Landmarks

File: `src/lib/data/destinations.ts`

Use this file when changing:

- Landmark names.
- Landmark order.
- Landmark location text.
- Era/year ranges shown in the title card.
- Latitude/longitude pins.
- Per-landmark camera objects.
- About/significance copy.
- Destination nav labels, because `journeyNavItems` is derived from `destinations`.

Important note: The `magellan-landing-site` data entry displays as `Cagusu-an Church and Plaza`. The scroll section ID remains `#destination-magellan-landing-site`.

### Projects

File: `src/lib/data/projects.ts`

Use this file when changing:

- Project/album card title.
- Role/category label.
- Year label.
- Image path.
- Fullscreen blurb.
- Optional external link.

Project images currently point to files in `public/`, for example `/artifact_culture_4.png`.

## Styling Hooks

Primary owner: `src/index.css`

Important global hooks:

| Selector/token | Purpose |
|---|---|
| `@font-face` | Loads `Inter Fixed` from `src/assets/fonts`. |
| `@theme` | Tailwind theme variables. |
| `:root` | Runtime CSS variables: `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`, font variables. |
| `body` | Global background, color, font smoothing. |
| `.font-display` | Display font hook. |
| `.font-mono` | Monospace font hook. |
| `.content-panel-type` | Ensures topic panel typography uses content font. |
| `.glass` | Glass nav style. |
| `.tech-border` | Technical thin border style. |
| `.earth-preload-*` | Loading Earth illustration. |
| `.destination-map-marker` | Legacy/marker styling hook. |
| `.split-word` | Default opacity for animated word spans. |
| `.landmark-era` | Landmark era typography and text stroke. |
| `body.in-projects-finale ...` | Hides nav/HUD while finale is active. |

Prompt targets:

```txt
To change site-wide colors, edit `:root` and `@theme` in `src/index.css`.
To change global typography, edit `@font-face`, `--font-content`, `--font-display`, and `--font-body`.
To change the landmark era outline style, edit `.landmark-era`.
To change the preloader globe, edit `.earth-preload-*` classes and `EarthLoadingState.jsx`.
```

## Global Window State And Events

This site coordinates scroll and Cesium camera state through a few `window` flags. These are important prompt targets because many visual features depend on them.

| Global | Writer/owner | Reader/owner | Purpose |
|---|---|---|---|
| `window.codexLenis` | `src/App.jsx` | `Content.jsx`, `ProjectsFinale.jsx` | Shared smooth-scroll controller. |
| `window.codexMap` | `CesiumEarth.jsx` | `MapHud.jsx`, possible projection users | Mapbox-like shim around Cesium camera. |
| `window.globeTargetDirection` | `Content.jsx` | `CesiumEarth.jsx` | Shifts/leans the globe left or right during topic panels. |
| `window.romeModeActive` | `Content.jsx` | `CesiumEarth.jsx` | Enables Rome scroll-scrub camera mode. |
| `window.romeScrollProgress` | `Content.jsx` | `CesiumEarth.jsx` | Progress value for Rome descent camera. |
| `window.destinationTourActive` | `Content.jsx` | `CesiumEarth.jsx` | Enables 12-landmark camera mode. |
| `window.destinationTourState` | `Content.jsx` | `CesiumEarth.jsx` | Stores active landmark index and request timestamp. |
| `window.codexDestinationFlying` | `CesiumEarth.jsx` | `Content.jsx` | Tells scroll/title logic that the camera is still moving. |
| `window.projectsFinaleUnlocked` | `Content.jsx` | `ProjectsFinale.jsx` | Allows finale to become visible. |
| `window.projectsFinaleReady` | `ProjectsFinale.jsx` | `Content.jsx` | Signals that the finale ScrollTrigger is ready to scroll into. |
| `window.projectsFinaleActive` | `ProjectsFinale.jsx` | `Content.jsx`, `CesiumEarth.jsx` | Indicates the finale is active/pinned. |
| `window.projectsScrollProgress` | `ProjectsFinale.jsx` | potential camera/readout users | Stores finale scrub progress. |
| `window.projectsFinaleTransitioning` | `Content.jsx` | `Content.jsx` | Prevents duplicate transitions while entering finale. |

Events:

| Event | Dispatched by | Listened by | Purpose |
|---|---|---|---|
| `resetGlobe` | `App.jsx` | `CesiumEarth.jsx` | Reset camera/globe state when clicking Index. |
| `globeResetComplete` | `CesiumEarth.jsx` | `App.jsx` | Lets App hide reset overlay and restart Lenis. |
| `projectsFinaleUnlock` | `Content.jsx` | `ProjectsFinale.jsx` | Unlocks and mounts the finale. |
| `projectsFinaleReady` | `ProjectsFinale.jsx` | `Content.jsx` | Tells Content it can scroll to `#projects-finale`. |

## Prompt Recipes

Use these patterns when asking an AI/code tool to edit the site:

```txt
Edit the [visible feature]. Target [component/function/selector] in [file].
Do not change unrelated scroll/camera state.
Preserve the existing Lenis, GSAP ScrollTrigger, and Cesium coordination unless necessary.
```

Examples:

```txt
Change the Culture panel headline and summary. Target the `sections` array in `src/components/Content.jsx`, specifically the object with `id: 'culture'`.
```

```txt
Make the World Trade Center "Go to articles" button larger and lower. Target the final-destination CTA block in `src/components/Content.jsx`, inside the `destinations.map(...)` render where `isFinalDestination` is true.
```

```txt
Retune the San Salvador Island camera. Target the `san-salvador-island` entry in `src/lib/data/destinations.ts` and, if needed, `DESTINATION_VIEW_OVERRIDES` in `src/components/CesiumEarth.jsx`.
```

```txt
Change the 12-landmark title-card text animation. Target the GSAP phase effect in `src/components/LandmarkTitleCard.jsx` and the title state machine in `src/components/Content.jsx`.
```

```txt
Change the album/finale card stack to be more diagonal. Target `STEP_X_VW`, `STEP_Y_VW`, `STEP_Z_PX`, `ROT_X_DEG`, `ROT_Y_DEG`, `StackCard`, and `setCamera` in `src/components/ProjectsFinale.jsx`.
```

```txt
Change project album covers and descriptions. Target the `projects` array in `src/lib/data/projects.ts`.
```
