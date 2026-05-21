# ProjectsFinale — Phase 2 Inspection Report

> **Plan-mode note**: The user's workflow asks for `docs/projects-finale-plan.md`. Plan mode restricts edits to this file only. The content below is the deliverable; on Phase 3 it will also be copied to `docs/projects-finale-plan.md`.

---

## Context

Add a new closing section to **World View — Contemporary World 3D** called **Projects Finale**: a scroll-driven 3D card stack inspired by unveil.fr, placed after the twelve-destination world tour. The Cesium globe continues running behind it. CSS 3D transforms only — no WebGL, no R3F.

The change is **additive and self-contained**: a new data file, a new component, one import line in `Content.jsx`, and a README documentation update. No edits to `CesiumEarth.jsx`, `IntroSequence.jsx`, `SlidePanel.jsx`, `ScrollProgress.jsx`, or `App.jsx`.

---

## 1. Insertion Point — DECIDED: Replace album-recap

`Content.jsx` uses a **single root scroll container** — there is no `<main>` element. All sections are children of:

```jsx
<div ref={containerRef} className="main-scroller relative z-10 w-full pointer-events-none font-sans">
```

The last destination section is rendered inside `destinations.map(...)` at [Content.jsx:735-768](src/components/Content.jsx#L735). It is immediately followed by:

```jsx
{/* ─── ALBUM STACK ─── Placeholder template after the 12 landmarks */}
<section id="album-recap" ...>
  <LandmarkAlbumStack />
</section>

{/* ─── FOOTER SPACER ─── */}
<div className="footer-spacer h-[60vh]" aria-hidden="true" />
```

**Decision**: Replace the `#album-recap` section entirely with `<section id="projects-finale"><ProjectsFinale /></section>`. ProjectsFinale takes the slot currently occupied by `LandmarkAlbumStack`. Footer spacer remains.

**Scope changes from this decision**:
- **Delete** the `#album-recap` section JSX in `Content.jsx`.
- **Remove** the `import LandmarkAlbumStack from './LandmarkAlbumStack';` line from `Content.jsx`.
- **Delete** the now-unused file `src/components/LandmarkAlbumStack.jsx` (per project convention — no zombie files, no `// removed` comments).
- **Check** `src/lib/data/destinations.ts` for any `journeyNavItems` entry referencing `album-recap`. If found, swap the `id`/`href` to `projects-finale` and update the label to "Projects Finale" (or similar — TBD in implementation). This is a one-line edit, scoped narrowly.

---

## 2. Window State Contract

New properties this component will own:

| Property | Type | Written by | Read by (this pass) |
|---|---|---|---|
| `window.projectsFinaleActive` | `boolean` | ProjectsFinale | (none — exposed for future use) |
| `window.projectsScrollProgress` | `0–1` | ProjectsFinale | (none — exposed for future use) |

Both will be initialized to `false` / `0` at mount and cleared on unmount. **No existing components will be modified to read these in this pass** — per the task spec, CesiumEarth is not touched. The README's "Global Window State" table at [README.md:372-384](README.md#L372) is the only place modified to document them.

Set/clear sites in the new component:
- `onEnter` and `onEnterBack` → `window.projectsFinaleActive = true`
- `onLeave` and `onLeaveBack` → `window.projectsFinaleActive = false`
- `onUpdate` → `window.projectsScrollProgress = self.progress`

This extends the existing window-state pattern (see how `setDestinationTourState` at [Content.jsx:127-147](src/components/Content.jsx#L127) writes `window.destinationTourActive` + `window.destinationTourState`). No React Context, no Zustand, no callback props.

---

## 3. Confirmed-Existing Utilities

### `.glass` (actual definition wins — discrepancy below)

From [src/index.css:45-50](src/index.css#L45):

```css
.glass {
  background: oklch(100% 0 0 / 3%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid oklch(100% 0 0 / 8%);
}
```

This is the implementation. Reused as-is for the OVERVIEW / INDEX pill and the meta readout.

### Brand palette — DECIDED: codebase violet

The task spec references **`#0A6ED3` (blue) / `#054E98`** for active toggle, focus outlines, and image fallback gradient. These values appear **nowhere in the repo** (grepped).

The actual brand from [src/index.css:3-23](src/index.css#L3) and [brand-spec.md:5-11](brand-spec.md#L5):
```
--accent: oklch(60% 0.25 290)  /* Electric Violet */
--bg:     oklch(12% 0.015 250) /* Deep Obsidian */
--fg:     oklch(98% 0.005 250)
--muted:  oklch(60% 0.015 250)
```

Focus-visible outline is `outline: 2px solid var(--accent)` at [src/App.css:14-16](src/App.css#L14).

**Decision**: Use `var(--accent)` (electric violet) everywhere the spec dictates `#0A6ED3`. Specifically:
- Active OVERVIEW/INDEX toggle background: `bg-[oklch(60%_0.25_290)]` (Tailwind v4 arbitrary value, since CSS-var-inside-arbitrary `bg-[var(--accent)]` is also valid and preferred).
- Focus-visible outline color: `outline-[var(--accent)]`.
- Image fallback gradient: `linear-gradient(135deg, oklch(60% 0.25 290) 0%, oklch(40% 0.2 290) 100%)` — violet, not blue.
- Active-card subtle glow / border accent (where the spec implies blue): violet.

### Fonts — DECIDED: drop serif, use sans

The task spec says fonts are **General Sans (sans)** and **Gambetta (serif)**. The actual codebase:
- Tailwind v4, no `tailwind.config.js`. Theme in `@theme` block at [src/index.css:3-11](src/index.css#L3).
- `--font-sans` is `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif`.
- **No `--font-serif` token, no Gambetta @font-face, no Google Fonts import.**

**Decision**: Use `font-sans` throughout. Establish title hierarchy via weight (`font-semibold` / `font-bold`) and size, not family. The "serif" treatment in the spec is dropped — `index.css` is not modified.

---

## 4. Data File Decision

**Mirror `destinations.ts` exactly: use `.ts` extension, no `interface` declared, no actual TypeScript syntax, named const export.**

Findings:
- `src/lib/data/destinations.ts` exists and uses `.ts`, but the file contains **no TypeScript syntax** — it is plain ES modules with object literals. Export pattern: `export const destinations = [...]`.
- The repo has **no `tsconfig.json`** and **no `typescript` package** in devDependencies. Only `@types/react` and `@types/react-dom` are present.
- Vite v8 + `@vitejs/plugin-react` transpiles JSX. `.ts` files are passed through as-is. Adding actual TS syntax (interfaces, type annotations) would break the build.
- Import convention in [Content.jsx](src/components/Content.jsx): `import { destinations, journeyNavItems } from '../lib/data/destinations';` (no extension, named import).

So the new file at `src/lib/data/projects.ts` will export:

```js
export const projects = [
  { id: 'placeholder-01', title: '...', role: '...', year: 2024, image: '/projects/placeholder-01.jpg', blurb: '...', accent: undefined, link: undefined },
  // ... 7 more
];
```

A JSDoc `@typedef` comment at the top gives editor hints without affecting the build:

```js
/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} role
 * @property {number} year
 * @property {string} image
 * @property {string} blurb
 * @property {string} [accent]
 * @property {string} [link]
 */
```

---

## 5. Mobile Strategy

**Auto-switch to INDEX grid below 768px** (no 3D stack on mobile).

Rationale:
- Cesium already runs heavy on mobile; stacking 8 large CSS-3D cards with `preserve-3d` and `transform-style` on top adds GPU pressure.
- A scroll-pinned 3D fly-through is hard to navigate on a touch device where the user expects normal vertical scroll.
- The INDEX mode is already required by the spec and renders the same data — making it the mobile default is one extra `useMediaQuery` and zero new code.
- Matches the existing pattern at [IntroSequence.jsx:24-30](src/components/IntroSequence.jsx#L24) which already branches on `window.innerWidth < 768`.

Implementation: a `useEffect`-driven `isMobile` state that reads `window.matchMedia('(max-width: 767px)').matches` and re-evaluates on resize. When `isMobile || prefersReducedMotion`, render the grid mode and skip ScrollTrigger creation entirely.

The OVERVIEW / INDEX toggle is still rendered on mobile so the desktop OVERVIEW mode is documented in the UI — but on mobile the OVERVIEW button is disabled (grayed) with an explanatory tooltip / `aria-label`. (Or hidden — see Q4.)

> ⚠️ **Open question (Q4)**: On mobile, **hide the OVERVIEW toggle entirely** (toggle disappears, only INDEX renders), or **show both but disable OVERVIEW**? I default to "hide entirely" for cleanliness.

---

## 6. Z-Index for Fullscreen Card

Existing z-index ladder (confirmed):

| Layer | z-index |
|---|---|
| CesiumEarth canvas | `z-0` |
| Main content (`main-scroller`) | `z-10` |
| Section cards (`.pingpong-card`) | `z-20` |
| SlidePanel | `z-40` |
| CesiumEarth HUD | `z-40` |
| Mobile/desktop navs | `z-50` |
| ScrollProgress bar | `z-[60]` |
| Mobile journey menu | `z-[70]` |
| Reset/loading overlay | `z-[100]` |
| IntroSequence | `z-[200]` |

The spec suggests `z-[150]` for the fullscreen card. That would place the modal **above the loading/reset overlay (`z-[100]`)** — meaning if a reset is triggered while the modal is open, the modal would visually obscure the loading screen. That's wrong.

**Proposed: `z-[80]`** — above all navs (z-50, z-60, z-70) but below reset (z-100) and intro (z-200). Backdrop also at `z-[80]`, card at `z-[81]`.

> ⚠️ **Open question (Q5)**: `z-[80]` (clean ladder) vs. `z-[150]` (spec literal). I default to `z-[80]`.

---

## 7. Component & File Inventory (no changes outside this list)

| Action | File |
|---|---|
| **Create** | `src/lib/data/projects.ts` |
| **Create** | `src/components/ProjectsFinale.jsx` |
| **Modify** | `src/components/Content.jsx` — swap `LandmarkAlbumStack` import + `#album-recap` section for `ProjectsFinale` import + `#projects-finale` section |
| **Modify** | `src/lib/data/destinations.ts` — if `journeyNavItems` contains an `album-recap` entry, retarget it to `projects-finale` (one-line edit) |
| **Modify** | `README.md` — add two rows to "Global Window State" table only |
| **Delete** | `src/components/LandmarkAlbumStack.jsx` — replaced by ProjectsFinale, no longer imported anywhere |
| **Create** | `docs/projects-finale-plan.md` — copy of this report |

Files explicitly **not** touched: `App.jsx`, `CesiumEarth.jsx`, `IntroSequence.jsx`, `SlidePanel.jsx`, `ScrollProgress.jsx`, `GeoBorders.jsx`, `LandmarkTitleCard.jsx`, any file under `src/lib/cesium/`, `index.css`.

---

## 8. Patterns to Reuse (do not reinvent)

- **prefers-reduced-motion detection**: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — same as [Content.jsx:149-152](src/components/Content.jsx#L149).
- **ScrollTrigger pin shape**: `start: 'top top'`, `pin: true`, `anticipatePin: 1` — same as destination pins at [Content.jsx:280-300](src/components/Content.jsx#L280). New addition: `scrub: 1` and `end: '+=400%'`.
- **gsap.context() for cleanup**: every existing ScrollTrigger in Content.jsx lives inside a `gsap.context()` that is reverted on unmount. The new effect must follow the same pattern.
- **Lenis pause/resume during modals**: use `window.codexLenis?.stop()` on fullscreen open, `window.codexLenis?.start()` on close. (No existing example does exactly this, but the API surface is the same as in [App.jsx:15-31](src/App.jsx#L15).)
- **Framer Motion AnimatePresence**: pattern from [SlidePanel.jsx:1-12](src/components/SlidePanel.jsx#L1) — but with `role="dialog" aria-modal="true"` added (SlidePanel doesn't have these; the spec correctly asks for them).
- **`.glass` utility**: reuse the existing class for the toggle pill and meta readout. No inline glass.

---

## 9. Implementation Sketch (Phase 3 preview)

`ProjectsFinale.jsx` outline:

```jsx
// Geometry tunables (top of file)
const STEP_X_VW = 6.5, STEP_Y_VW = -5, STEP_Z_PX = -140;
const ROT_X_DEG = 18, ROT_Y_DEG = -28;
const CARD_W = 520, CARD_H = 320;
const SCRUB_DISTANCE = '+=400%';

export default function ProjectsFinale() {
  const sectionRef = useRef(null);
  const stackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(null);  // project | null
  const [mode, setMode] = useState('OVERVIEW');        // 'OVERVIEW' | 'INDEX'
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 1. detect rm + mobile in useEffect (matchMedia + resize listener)
  // 2. if (!reducedMotion && !isMobile && mode === 'OVERVIEW'): create ScrollTrigger inside gsap.context()
  //    - onUpdate: set --travel CSS var on stackRef, set window.projectsScrollProgress, setActiveIndex
  //    - onEnter/onEnterBack: window.projectsFinaleActive = true
  //    - onLeave/onLeaveBack: window.projectsFinaleActive = false
  //    - return () => ctx.revert()
  // 3. Escape key listener for fullscreen close
  // 4. Lenis stop/start on fullscreen toggle

  return (
    <section ref={sectionRef} id="projects-finale" className="relative w-full" style={{ minHeight: '100vh' }}>
      {/* meta readout (top-left) */}
      {/* OVERVIEW/INDEX toggle (bottom-right) inside .glass pill */}
      {/* mode === 'INDEX' || reducedMotion || isMobile ? <Grid/> : <Stack/> */}
      {/* AnimatePresence for fullscreen card */}
    </section>
  );
}
```

Cards inside `<Stack/>`:
```jsx
<div ref={stackRef} className="absolute inset-0 [perspective:1200px]">
  <div className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ '--travel': 0 }}>
    {projects.map((p, i) => (
      <button
        key={p.id}
        onClick={() => setFullscreen(p)}
        style={{
          transform: `translate3d(${i * STEP_X_VW}vw, ${i * STEP_Y_VW}vw, calc(${i * STEP_Z_PX}px + var(--travel))) rotateX(${ROT_X_DEG}deg) rotateY(${ROT_Y_DEG}deg)`,
        }}
        className="absolute ..."
        // no transition: transform — scrub-driven
      />
    ))}
  </div>
</div>
```

---

## 10. Verification Plan (Phase 4)

Run in order:
1. `npm run lint` — fix issues introduced by this change only.
2. `npm run build` — must succeed.
3. `npm run dev` and verify in browser:
   - [ ] Cesium globe visible behind the section
   - [ ] Lenis smooth scroll continues through the section
   - [ ] Pin engages; cards animate on scroll; `--travel` updates monotonically with scroll
   - [ ] Click on a card opens fullscreen; Escape closes; backdrop click closes; click inside card does not close
   - [ ] OVERVIEW / INDEX toggle swaps modes without remounting the section
   - [ ] DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" → page reload → section renders as static grid, no pin, no animation, fullscreen card opens with `duration: 0` transition
   - [ ] Resize to <768px width → INDEX grid renders without ScrollTrigger
4. Console check: `window.projectsFinaleActive` flips `true` when section is pinned, `false` when scrolled past. `window.projectsScrollProgress` goes 0 → 1 smoothly.

---

## 11. Decisions Summary

| # | Question | Resolution |
|---|---|---|
| Q1 | Position relative to `#album-recap`? | **Replace album-recap.** Delete the existing section + `LandmarkAlbumStack.jsx`; retarget any `journeyNavItems` entry. |
| Q2 | Brand color: spec's blue (#0A6ED3) or codebase's violet? | **Codebase violet (`var(--accent)` = `oklch(60% 0.25 290)`).** No hardcoded blues. |
| Q3 | Serif font for active title? | **Drop serif, use `font-sans` with weight/size hierarchy.** `index.css` not modified. |
| Q4 | Mobile OVERVIEW toggle: hide or disable? | **Hide entirely on mobile.** Only INDEX renders below 768px. (Locked unless you object.) |
| Q5 | Fullscreen card z-index: `z-[80]` or `z-[150]`? | **`z-[80]`** (above navs z-50/60/70, below reset z-100 and intro z-200). Backdrop z-[80], card z-[81]. (Locked unless you object.) |

---

## 12. Follow-Up Suggestions (not implemented in this pass)

- Wire CesiumEarth to react to `window.projectsFinaleActive` (e.g., slow idle rotation rather than the last destination pose). Out of scope here; the flag is exposed for this purpose.
- Re-evaluate `journeyNavItems` ordering after the swap — if the recap was the final item, "Projects Finale" replaces it cleanly; if it sat earlier in the nav, the order may want a tweak.
