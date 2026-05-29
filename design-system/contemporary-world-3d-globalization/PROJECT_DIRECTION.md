# Project Direction

## Design Read

Immersive 3D editorial experience for contemporary-world learners, built around a live globe rather than a generic landing page.

## Dial Settings

- Design variance: 8
- Motion intensity: 6
- Visual density: 4

## System Overrides

The generated ui-ux-pro-max system correctly identified an immersive spatial interface, but its playful typography recommendation is not appropriate for this project. Use a cinematic editorial language instead:

- Theme: locked dark spatial interface with warm graphite surfaces.
- Accent: one orbital coral accent for UI state, CTAs, progress, and active elements.
- Typography: General Sans where the existing document import is available, local Inter fallback for body copy, tabular mono for HUD data.
- Layout: globe-first composition, wide editorial type, sparse panels, no generic marketing card rows.
- Motion: GSAP ScrollTrigger for scrubbed and pinned narrative moments, Framer Motion for contained UI transitions, reduced-motion fallbacks preserved.
- Accessibility: visible focus states, mobile-readable text blocks, integrated loading and missing-env states.

## Highest-Impact Audit Findings

1. First viewport after the intro lacked narrative hierarchy and underused the globe as the primary hero material.
2. Violet accent, debug-style labels, slash-heavy microcopy, and numbered section controls made the interface feel more prototype-like than editorial.
3. Mobile text panels sat too close to bottom controls and needed stronger readable surfaces.
4. Missing environment-variable feedback was technically clear but visually detached from the experience.
5. Scroll progress and viewport sync leaned on direct scroll listeners where ScrollTrigger could handle the same work with less React state churn.
