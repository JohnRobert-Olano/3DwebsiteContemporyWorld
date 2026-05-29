# Album Cover Games Implementation Prompt

```text
## Objective
Build five interactive mini-games inside the existing album-cover fullscreen modal for album covers 8, 9, 10, 11, and 12 in the Contemporary World 3D website. The games must launch when those album covers are clicked from the current archive stack or index grid, while all other album covers keep their existing static detail modal behavior.

## Context
Project root: D:\Github\3DwebsiteContemporyWorld

Current stack:
- Vite + React 19.
- Tailwind CSS v4 through @tailwindcss/vite.
- GSAP ScrollTrigger for pinned/scrubbed narrative sections.
- Framer Motion for modal transitions and contained UI transitions.
- Lenis smooth scroll stored as window.codexLenis.
- Cesium/3D Earth is the background experience, but this task is only for the album archive section.

Relevant existing files:
- src/components/ProjectsFinale.jsx
  - Renders the "Article archive" album-cover stack.
  - Uses the projects array from src/lib/data/projects.ts.
  - Desktop unlocked overview is a diagonal 3D cover stack driven by GSAP ScrollTrigger.
  - Mobile/reduced-motion/index mode renders a responsive grid.
  - Clicking any cover currently sets fullscreen project state and opens FullscreenView.
  - FullscreenView already stops Lenis while open, closes on Escape/backdrop/Close, and shows the album cover plus project text.
- src/lib/data/projects.ts
  - Covers 8-12 already exist and map to the five games:
    - Cover 8: id "infinite-scroll", title "The Infinite Scroll", role "Job Market Simulator", image "/album_covers/8.png".
    - Cover 9: id "philippine-salary-tax-simulator", title "Philippine Salary & Tax Simulator", role "Finance Simulator", image "/album_covers/9.png".
    - Cover 10: id "global-delivery-simulator", title "Global Delivery Simulator", role "Logistics Simulator", image "/album_covers/10.png".
    - Cover 11: id "ripple-economy", title "Ripple Economy", role "Economic Systems", image "/album_covers/11.png".
    - Cover 12: id "glob-ex", title "Glob:Ex", role "Global Exchange", image "/album_covers/12.png".
- src/index.css
  - Defines the dark spatial theme: --bg, --surface, --fg, --muted, --accent.
  - Existing site uses a locked dark spatial interface, warm graphite surfaces, one coral accent, sparse editorial type, mono HUD labels, visible focus states, and reduced-motion fallbacks.
- design-system/contemporary-world-3d-globalization/PROJECT_DIRECTION.md
  - Treat the site as an immersive 3D editorial experience for contemporary-world learners.
  - Preserve the dark spatial interface, coral accent, globe-first cinematic feel, sparse panels, and integrated motion discipline.

Source PDF:
- C:\Users\Owner\Downloads\GAMES FOR CONTEMPORARY WORLD.pdf
- Use the PDF as the game-design source if available. The required game specs are embedded below so this prompt is self-contained.

Design read:
This is not a standalone mini-game portal or landing page. Read it as a dark, spatial, editorial album archive where each clicked CD-style cover opens a playable "inside the cover" experience. The modal should still feel like the current album inspection model, but the static detail body becomes a compact, polished game console.

## Target State
When the user clicks album covers 8-12, the existing fullscreen modal opens and displays:
- The album cover art as a persistent sleeve/identity panel.
- A playable game console inside the same modal shell.
- A compact game header with title, role, reset/new-game control where appropriate, and readable instructions.
- The interactive game itself.
- Keyboard-accessible controls, visible focus states, and reduced-motion behavior.

When the user clicks covers 1-7 or 13-16, the existing static FullscreenView behavior remains unchanged.

## Scope
Work only in:
- src/components/ProjectsFinale.jsx
- New files under src/components/games/
- New files under src/lib/games/ if shared game constants/helpers make the implementation cleaner
- src/index.css only for small shared CSS utilities required by the games
- src/lib/data/projects.ts only if a tiny metadata addition is necessary

Do NOT touch:
- package.json or package-lock.json
- src/App.jsx
- src/components/Content.jsx
- src/components/CesiumEarth.jsx
- src/lib/cesium/
- public/album_covers/ images
- .env files
- Vite, ESLint, Tailwind, or deployment config
- Existing journey/landmark scroll behavior

## Constraints
- Do not add dependencies. Use React, Tailwind, CSS/SVG/DOM, GSAP/Framer only where already present.
- Do not create new routes or a separate page. The games must live inside the current clicked-cover fullscreen modal.
- Do not replace or regenerate album cover images.
- Do not change the 3D stack/card scrub behavior except wiring cover clicks to the right modal content.
- Do not add money systems, timers, inventory, auth, backend, persistence, or unrelated features beyond each game spec.
- Keep all game logic deterministic enough to test, but still allow controlled randomness where the PDF requests it.
- Avoid emojis as UI icons. Use text labels, simple CSS glyphs, or inline SVG shapes with accessible names.
- Keep the dark spatial site theme. You may adapt the PDF's claymorphism/cartoon requirements into a dark modal console with soft 2D tactile surfaces, beveled cards, gentle shadows, and cover-specific accent colors.
- Use 150-300ms for normal UI micro-interactions. Longer game animations are allowed only when they are the mechanic itself.
- Respect prefers-reduced-motion: remove or shorten route/ripple/travel animations and update state instantly when reduced motion is enabled.
- All controls must be accessible by keyboard, with visible focus states.
- Mobile layouts must work at 375px width with no horizontal page scroll.
- Only make changes directly requested. Do not refactor unrelated architecture.

## Implementation Direction
1. Inspect the current ProjectsFinale fullscreen flow before editing.
2. Create a small game registry keyed by project id for the five playable covers.
3. Refactor FullscreenView so it detects whether project.id has a registered game.
4. Preserve the existing modal open/close behavior, Escape handling, backdrop close, Lenis stop/start, and motion transitions.
5. For game projects, render a game modal layout:
   - Left/top identity panel: album cover image, title, role, short game premise.
   - Main panel: game component.
   - Footer or compact note area for educational context.
6. For non-game projects, render the existing static cover/details layout with no visible change.
7. Keep components small enough to read. Prefer one file per game plus a shared shell/registry if needed.
8. Add reset/new-game buttons inside each game where replay is natural.
9. Verify with npm run build. Run npm run lint if it is currently configured to pass in this repo.

## Game 1 - Cover 8 - "The Infinite Scroll"
Project id: infinite-scroll
Theme: entry-level job market simulator.

Core loop:
- Player starts at Career Progress 0.0 and must reach 1.0.
- Player drags an expansive "Job Market" grid to search for opportunities.
- The grid should feel huge, mostly empty, and visually noisy.
- Dragging consumes an Energy/Time meter to represent the exhaustion of job hunting.
- Win when Career Progress reaches 1.0.
- Trigger burnout if Energy reaches 0 or if the player hits too many HR Gatekeepers. Burnout dims/locks the grid until the player resets.

Map elements:
- Fresh Grad Role:
  - Very low spawn rate.
  - Render as camouflaged envelope tiles close to the grid's light grey tone.
  - On click, 50% chance to disappear with a "Position closed" or "Internal hire" message.
  - If successful, add +0.1 Career Progress.
- Senior Role:
  - Frequent bright gold locked briefcases in visible clusters.
  - Not claimable.
  - Hover/focus shows text like "Entry level: requires 5+ years experience and 3 languages."
  - Click plays/indicates "Access denied" and no progress.
- Freelance Gig:
  - Blue monitor tiles with moderate spawn rate.
  - Short time-to-live once visible, around 2-3 seconds.
  - If clicked before expiring, random reward: +0.01 or +0.5 Career Progress.
  - Represents saturated gig/BPO/VA work.
- HR Gatekeeper:
  - Red profile tiles, moving slowly or guarding fresh grad roles.
  - Clicking one freezes interactions for 3 seconds and shows "Your resume is being reviewed..." followed by no reward.
  - Increment penalty count.
- Green Pin On-Site Role:
  - Visible green pins spread far apart.
  - Click gives +0.3 Career Progress.
  - Immediately teleports/pans the viewport to a distant random coordinate, disorienting the player.

UI requirements:
- Show Career Progress meter, Energy/Time meter, penalty count, current message.
- Use draggable viewport with pointer events and keyboard fallback controls for pan.
- Provide Reset Market.
- Prevent modal backdrop close while dragging inside the game surface.

## Game 2 - Cover 9 - "Philippine Salary & Tax Simulator"
Project id: philippine-salary-tax-simulator
Theme: Philippine salary, statutory deductions, and take-home pay simulator.

Important:
- This is an educational simulator. Include a small note that it excludes company-specific allowances, de minimis benefits, 13th-month handling, and other conditional modifiers.
- Use the PDF formulas as the source of truth for this task.
- Use "PHP" formatting, for example PHP 45,000.00.

Controls:
- Monthly Basic Salary input range from PHP 10,000 to PHP 1,500,000.
- Use a slider plus synced numeric input.
- Recalculate instantly without page refresh.

Calculations:
- SSS employee share:
  - Employee share is exactly 5% of Monthly Salary Credit.
  - Clamp salary between PHP 5,000 and PHP 35,000.
  - Formula: clamp(monthlySalary, 5000, 35000) * 0.05.
  - Minimum deduction PHP 250, maximum PHP 1,750.
- PhilHealth employee share:
  - Employee share is exactly 2.5%.
  - Clamp salary between PHP 10,000 and PHP 100,000.
  - Formula: clamp(monthlySalary, 10000, 100000) * 0.025.
  - Minimum deduction PHP 250, maximum PHP 2,500.
- Pag-IBIG employee share:
  - 2% of monthly compensation.
  - Maximum salary base PHP 10,000.
  - Formula: Math.min(monthlySalary, 10000) * 0.02.
  - Maximum flat deduction PHP 200.
- Monthly taxable income:
  - monthlySalary - (sss + philHealth + pagIbig)
- Annual taxable income:
  - monthlyTaxableIncome * 12
- Annual TRAIN tax:
  - PHP 250,000 and below: 0
  - PHP 250,001 to PHP 400,000: 15% of excess over PHP 250,000
  - PHP 400,001 to PHP 800,000: PHP 22,500 + 20% of excess over PHP 400,000
  - PHP 800,001 to PHP 2,000,000: PHP 102,500 + 25% of excess over PHP 800,000
  - PHP 2,000,001 to PHP 8,000,000: PHP 402,500 + 30% of excess over PHP 2,000,000
  - Above PHP 8,000,000: PHP 2,202,500 + 35% of excess over PHP 8,000,000
- Monthly withholding tax:
  - annualTax / 12
- Net monthly pay:
  - monthlySalary - (sss + philHealth + pagIbig + monthlyWithholdingTax)

UI requirements:
- Hero metric for Net Take-Home Pay.
- Stacked horizontal visual breakdown bar with segments:
  - Net pay
  - SSS
  - PhilHealth
  - Pag-IBIG
  - Withholding tax
- Itemized summary table/card:
  - Gross monthly salary
  - Each statutory deduction
  - Total deductions and percentage of gross
  - Taxable income
  - Withholding tax
  - Net take-home pay
- Use accessible labels for slider and numeric input.

## Game 3 - Cover 10 - "Global Delivery Simulator"
Project id: global-delivery-simulator
Theme: simplified international logistics and disruption simulator.

Core loop:
- Player selects a departure country and destination country.
- Player clicks Start Shipping.
- A 2D plane or ship icon travels across a simplified 2D world map.
- On arrival, randomly generate one result:
  - Successful Delivery: increment Successful Shipments.
  - Shipment Delayed.
  - Shipment Blocked.
- Show a result card with a global event message.

Countries:
- USA
- Brazil
- Japan
- Germany
- India
- Philippines
- South Korea

UI requirements:
- Header: "GLOBAL DELIVERY SIMULATOR"
- Subtitle: "Ship products between countries and overcome global disruptions."
- Counter: Successful Shipments: [number]
- Two select controls: From Country and To Country.
- Disable Start Shipping if from and to are the same.
- Large Start Shipping button with tactile hover/active state.
- Simplified 2D SVG/CSS world map:
  - Blue ocean, green continents or abstract map masses.
  - Country markers at approximate positions.
  - Dotted route line between selected countries.
  - Animated vehicle icon along the line.
- Event messages:
  - "Shipment arrived successfully."
  - "Storm caused shipping delays."
  - "Port strike blocked shipment."
  - "Pandemic restricted border access."
  - "Conflict rerouted the shipment."
- No timers, currencies, inventory, reputation, or complex logistics systems.

## Game 4 - Cover 11 - "Ripple Economy"
Project id: ripple-economy
Theme: global economic shock and policy ripple simulator.

Core loop:
- Show a 2D world map with regional economic zones.
- Show master "Global Economic Stability" meter initialized at 78%.
- Player clicks one of four event buttons.
- A colored ripple originates from a relevant region and expands across the map.
- Region stability bars update based on event impact.
- Results card explains the fallout.

Regions:
- USA, start 85%
- EU, start 80%
- China, start 60%
- South America, start 95%
- India, start 70%
- Southeast Asia, start 85%

Control buttons:
- TRADE WAR INITIATED
- PANDEMIC SHUTDOWN
- GREEN TECH BREAKTHROUGH
- GLOBAL TAX PACT SIGNED

Suggested deterministic event deltas:
- Trade War Initiated, origin between USA and China:
  - USA -10, China -12, EU -5, South America -3, India -4, Southeast Asia -6, global -7.
  - Effect text: "Slowed trade, higher costs, and lower market confidence."
- Pandemic Shutdown, origin Southeast Asia:
  - USA -8, China -9, EU -8, South America -6, India -10, Southeast Asia -12, global -10.
  - Effect text: "Factory closures and border rules interrupt supply chains."
- Green Tech Breakthrough, origin EU:
  - USA +4, China +3, EU +10, South America +3, India +6, Southeast Asia +5, global +7.
  - Effect text: "Clean technology investment lifts productivity and confidence."
- Global Tax Pact Signed, origin EU/USA:
  - USA +5, China -2, EU +7, South America +3, India +4, Southeast Asia +3, global +5.
  - Effect text: "Coordination reduces tax avoidance but shifts some capital flows."

UI requirements:
- Clamp all stability values between 0 and 100.
- Global meter should be recalculated from the stored global value or as a weighted average, but keep visible changes aligned with the event text.
- Use soft bars with smooth transitions.
- Draw faint dashed connection lines between hubs.
- Show localized region tags and mini bars.
- Provide Reset Economy.
- Strictly 2D DOM/SVG. No WebGL, Canvas 3D, or Three.js.

## Game 5 - Cover 12 - "Glob:Ex" / "Peer-to-Peer Global Exchange"
Project id: glob-ex
Theme: simplified peer-to-peer international trade.

Core loop:
- Three-column layout:
  - Trader 1 profile on the left.
  - Trade Desk in the center.
  - Trader 2 profile on the right.
- Player customizes each trader by avatar type and nationality.
- Player selects trade direction, item, and quantity.
- Execute Trade immediately updates seller profit and buyer assets.
- Trade Log displays a receipt.

Trader profile requirements:
- Each trader has:
  - Profit bar and value, starts at $0.
  - Assets bar and value, starts at 0 units.
  - Simple 2D CSS/SVG avatar.
  - Avatar toggle: Boy / Girl.
  - Nationality select: Japan, Brazil, USA, Philippines, Germany.

Trade Desk controls:
- Trade direction:
  - Trader 1 sells to Trader 2
  - Trader 2 sells to Trader 1
- Trade item dropdown:
  - Sacks of Rice, price $2/unit
  - Mangoes, price $5/unit
  - Microchips, price $50/unit
  - Oil, price $80/unit
  - Textiles, price $15/unit
- Quantity input:
  - Default 1000.
  - Minimum 1.
  - Use numeric input with inputmode numeric.
- Execute Trade button.

Trade logic:
- totalValue = quantity * item.price
- Seller profit += totalValue
- Buyer assets += quantity
- Receipt text:
  - "[Seller Nationality] traded [quantity] [item] to [Buyer Nationality]. Value: $[totalValue]."
- Animate the changed profit/assets bars with CSS transitions.

UI requirements:
- Bright, readable 2D trading UI adapted into the dark spatial modal.
- Do not use emojis for item icons. Use plain labels or simple inline SVG/CSS marks.
- Provide Reset Exchange.
- On mobile, collapse to:
  - Trader 1
  - Trade Desk
  - Trader 2
  - Trade Log

## Shared Modal Design Requirements
- Keep the existing fullscreen backdrop and closing behavior.
- Upgrade the modal body for game projects into a polished "album console" with:
  - Dark graphite surface.
  - Thin translucent border.
  - Coral focus/accent states.
  - Tactile nested panels where useful.
  - Mono micro-labels.
  - No generic bright white page dropped inside the dark modal.
- The album art should remain visible and meaningful. Use it as the sleeve/cover identity, not just a tiny thumbnail.
- The game panel must fit within max-height and scroll internally only when necessary.
- Ensure clicks and drags inside games do not accidentally close the modal.
- Close button must remain visible and accessible at all viewport sizes.
- Use aria-labels for icon-only or compact buttons.
- Use real labels for all form controls.
- Use button elements for actions, not clickable divs.
- Make hover/focus states visible without shifting layout.

## Acceptance Criteria
- [ ] Album covers 8-12 open playable game experiences inside the existing fullscreen modal.
- [ ] Covers 1-7 and 13-16 still open the original static project modal.
- [ ] Cover 8 game includes draggable job market, career progress, energy/time, fresh grad roles, senior roles, freelance gigs, HR gatekeepers, on-site pins, win and burnout states.
- [ ] Cover 9 simulator calculates SSS, PhilHealth, Pag-IBIG, taxable income, TRAIN withholding tax, and net pay using the exact formulas above.
- [ ] Cover 10 simulator animates a 2D route between selected countries and generates success/delay/blocked outcomes.
- [ ] Cover 11 simulator updates regional/global stability meters and plays a 2D ripple effect for each event.
- [ ] Cover 12 simulator executes trades between two customizable traders and updates profit/assets/logs.
- [ ] Every game has a reset/new-game control.
- [ ] All controls have accessible labels and visible focus states.
- [ ] Escape closes the modal. Backdrop close still works. Clicking/dragging inside game panels does not accidentally close the modal.
- [ ] prefers-reduced-motion is respected for game animations.
- [ ] 375px, 768px, 1024px, and 1440px layouts have no incoherent overlap or horizontal page scroll.
- [ ] npm run build passes.
- [ ] npm run lint is run if feasible. If lint fails due to pre-existing unrelated issues, report them without broad refactors.

## Stop Conditions
Stop and ask before:
- Deleting any file.
- Adding any dependency.
- Changing package-lock.json.
- Editing files outside Scope.
- Changing the 3D Earth, destination journey, navigation IA, or album cover image assets.
- Making legal/tax claims beyond the educational formulas provided above.

## Progress Reporting
After each completed step, report:
Done: [what changed] - [files affected]

Final response must include:
- Short summary of implemented files/behavior.
- Build/lint results.
- Any known limitations or intentional simplifications.
- The local dev URL if a dev server is running.
```

Target: Codex agentic coding tool. Optimized for a scoped multi-file React implementation with explicit source context, game mechanics, file boundaries, acceptance criteria, and stop conditions.

Note: This prompt is for an agentic tool with real system access. Review the scope locks, forbidden actions, and stop conditions before pasting. Confirm file paths, directories, and permissions match the actual project.
