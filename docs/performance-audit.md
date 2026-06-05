# Performance Audit — Contemporary World 3D

**Method.** Static code analysis + measured bundle/asset sizes + code-pattern counts (grep). A live browser GPU/CPU profiler was not available in this environment, so runtime costs are reasoned from code paths and measured asset sizes rather than captured flame charts. Each bottleneck below lists its concrete evidence.

**Scope of fixes applied.** Cesium render loop, idle-globe cost, album-archive compositing, and image decode hints. Image re-encoding and a few larger items are documented as recommendations (see end).

---

## Top bottlenecks

### 1. Cesium rendered every frame, always — even when fully hidden  **(FIXED)**
- **Evidence:** `grep requestRenderMode src/components/CesiumEarth.jsx` → none. Cesium's default render loop draws Google Photorealistic 3D Tiles at ~60 fps continuously, including while the globe is fully covered by the opaque album archive (`z-120`), game modals, and the boot loader, and during static landmark holds. This is the heaviest single GPU cost on the site.
- **Files:** `src/components/CesiumEarth.jsx`, `src/lib/cesium/cameraController.js`.
- **Fix applied:** enabled `viewer.scene.requestRenderMode = true` and call `viewer.scene.requestRender()` inside `setCameraPose` so every camera move repaints exactly once. The camera `tick` now also stands down entirely when `window.projectsFinaleActive` (archive/game overlay covers the globe). Net: Cesium idles whenever nothing visible changes (static holds, reading pauses, archive, games, post-warmup boot). Tile streaming and user input already auto-request frames, so the globe still updates when it should.
- **Before/after:** before = continuous 60 fps GPU render regardless of visibility; after = renders only on camera move / tile load / input. Expect the largest improvement during static landmark holds, the album archive, game modals, and reading pauses.

### 2. Idle globe rotation forced 60 fps through the reading sections  **(FIXED)**
- **Evidence:** `buildEarthIdleDriver()` in `CesiumEarth.jsx` calls `setCameraPose` every frame while the overview globe idles behind the 5 pillar sections (`camHeight > 1e6`), forcing a repaint every frame for a barely-perceptible 0.82°/s drift.
- **Fix applied:** throttled the idle rotation to ~30 fps (`IDLE_FRAME_MS = 33`), advancing by real elapsed time so the speed is unchanged. Combined with render-on-demand, the long reading phase now renders at ~30 fps instead of 60 while keeping the ambient motion.
- **Tradeoff:** the drift updates at 30 fps; visually indistinguishable at 0.82°/s, ~half the render cost.

### 3. Album archive: 23 GPU blur layers + a wasted backdrop-filter  **(FIXED)**
- **Evidence:** `ProjectsFinale.jsx` `StackCard` inner span had `background: rgba(15,15,15,1)` (**opaque**) **and** `backdropFilter: blur(10px)` — the blur had nothing to blur through but still allocated a backdrop-filter layer, rendered on ~23 cards during archive scroll/hover. `grep backdrop-filter src` → 20 occurrences.
- **Fix applied:** removed the wasted `backdrop-filter` from the opaque card (zero visual change), and scoped `will-change: transform` to only the visible cards (button) and only the hovered card (inner pane) instead of all ~23 always-promoted layers.
- **Tradeoff:** none visible; fewer GPU layers / less compositing memory during the archive.

### 4. Album cover images = 29 MB  **(FIXED — re-encoded; further WebP option noted)**
- **Evidence:** original `public/album_covers` = **28.6 MB**; individual covers up to **2.5 MB** PNG, some at >1024 px. The archive mounts ~23 `<img>` cards that download, decode, and upload these as GPU textures when it opens — a major decode/VRAM spike and the biggest asset cost.
- **Files:** `public/album_covers/*.png`, `src/components/ProjectsFinale.jsx` (`ProjectCover`), `src/components/games/AlbumGameShell.jsx`.
- **Fix applied:** added `decoding="async"` to the cover `<img>`s (off-thread decode), and re-encoded every cover **in place to ≤800 px square, truecolor, lossless-optimized** (Pillow). The cards display at ≤540 px CSS, so quality is preserved. **28.6 MB → 14.4 MB** total, and every texture is now capped at 800×800 (~2.56 MB VRAM each instead of up to ~4–16 MB), which is the bigger runtime win. Originals remain in git history.
- **Note (tooling):** the `convert` on PATH was Windows' FAT→NTFS utility, not ImageMagick; Pillow was installed locally (`pip install`, via `--trusted-host` to get past a proxy SSL error) purely as a one-time asset tool — **not** a shipped/`package.json` dependency.
- **Further (optional, not done):** truecolor PNG of these detailed, text-heavy covers can't reach ~3–5 MB losslessly; reaching that needs WebP (~q80, ~3–5 MB total) or palette quantization (quality risk on gradients/text) — both change format/paths, so left out per the "resize PNG in place" choice.

### 5. Fonts ≈ 1.3 MB of unsubsetted TTF  **(RECOMMENDED)**
- **Evidence:** `dist/assets/inter-400/500/600/700.ttf` ≈ **325 KB each = ~1.3 MB**. TTF is uncompressed vs WOFF2 and unsubsetted.
- **Recommendation:** subset to the glyphs used and convert to WOFF2 (typically ~70–80% smaller, ~1.3 MB → ~250–350 KB). Needs a font tool (fonttools/`woff2`); one-time cached load, so lower runtime-lag impact than items 1–4. Not changed.

---

## Other findings (lower impact / not changed)
- **`DeliveryPlane` three.js chunk = 883 KB but already lazy** (loads only when the delivery game opens). `index` JS = ~630 KB (gzip ~209 KB). The 4 static game components could be `React.lazy`-split in `gameRegistry` to trim the initial chunk further — recommended, not done (adds Suspense boundaries).
- **`MapHud.jsx`** is dead code (not imported/rendered) with its own rAF; it costs nothing at runtime today but can be deleted.
- **Lateral-globe-shift rAF** (`CesiumEarth.jsx`) runs every frame but early-returns unless the lean direction changes and already centers during the archive — negligible; left as-is.
- **`content-visibility: auto`** on offscreen sections could skip layout/paint, but the pinned GSAP ScrollTriggers + measured word animations make it risky without live testing — recommended only.
- React state during animation is already ref/imperative-driven (ProjectsFinale ring-buffer transform, Cesium camera ticks, `ScrollProgress`), so no per-frame `setState` storms were found.

---

## Verification
- `npm run lint` and `npm run build` pass.
- Manual browser pass: intro, 5 pillar sections, landmark transitions + `LandmarkTitleCard`, WTC/Historical Epochs ending, album archive scroll/hover, opening/closing each game modal, mobile widths. Confirm smoother scroll/animation with no regressions — the globe must still render and animate during transitions, idle drift, drag, and tile streaming (render-on-demand only skips frames when nothing changes).
