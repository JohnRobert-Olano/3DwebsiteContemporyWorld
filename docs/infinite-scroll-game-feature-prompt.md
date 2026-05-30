# Infinite Scroll Game Feature Prompt

```text
Act as Claude Code in this repo: D:\Github\3DwebsiteContemporyWorld.

<context>
Game 1 is "The Infinite Scroll" and is implemented mainly in:
- src/components/games/InfiniteScrollGame.jsx
- src/index.css only if visual state classes need small updates

Current game already has these tile types: fresh, senior/yellow, freelance/blue, hr/red, onsite/green, plus noise. It currently targets 1.00 career progress. Revise only this game’s gameplay rules and UI copy. Do not modify the global website, album modal architecture, or other games. Do not install dependencies. Do not refactor unrelated code.
</context>

<task>
Update Game 1 so Career Progress represents "years of experience" and the win target becomes 3.00 years.

Implement these exact behaviors:

1. Fresh Grad / Invisible Job Market icons
- These are the camouflaged/invisible fresh icons.
- Clicking one always awards +0.20 Career Progress.
- Remove the existing 50% “position closed/internal hire” failure behavior for fresh icons.
- After a successful click, the icon disappears as collected.
- Message should make clear the player gained +0.20 years of experience.

2. Yellow Entry-Level icons
- Treat the current yellow/gold role as an Entry-Level Role, not a Senior Role.
- If Career Progress is below 1.00, clicking it must:
  - show a denial message explaining that entry level still requires 1.00 years of experience,
  - add no progress,
  - make the clicked icon disappear.
- If Career Progress is 1.00 or higher, clicking it must:
  - add +0.50 Career Progress,
  - make the icon disappear,
  - show a success message.
- Update labels, title text, tooltips, and legend copy to say Entry-Level Role instead of Senior Role where relevant.

3. Blue Freelancer icons
- Freelancer icons should cycle visibility indefinitely until clicked:
  - visible/spawned for 3 seconds,
  - hidden/despawned for 3 seconds,
  - visible again for 3 seconds,
  - repeat.
- They must remain clickable even when Career Progress is below 1.00.
- On click, stop that icon’s cycle, mark it collected, and award a random reward from +0.30 to +0.50 Career Progress.
- Message should show the exact reward, formatted to two decimals.

4. Red HR Gatekeeper icons
- Clicking a red HR icon shows the popup/message:
  "Your resume is being reviewed..."
- Lock all clicking and dragging for 5 seconds.
- Update the existing HR freeze duration from 3 seconds to 5 seconds.
- Do not award progress for HR clicks.
- Preserve existing HR penalty/burnout behavior unless it conflicts with the 5-second lock.

5. Green On-Site Role icons
- Clicking a green icon awards +0.30 Career Progress.
- Preserve the existing on-site role disappearance and teleport/disorientation behavior if it already exists.
- Message should show the +0.30 gain.

6. Career Progress / Win State
- Change the max target from 1.00 to 3.00.
- The progress number represents years of experience.
- Update the progress label/copy to communicate this clearly, for example:
  "Experience Progress"
  "0.00 / 3.00 years"
- Progress bar width must be based on progress / 3.00, clamped from 0% to 100%.
- Cap progress at 3.00.
- When progress reaches 3.00, set the game to the win state and show a congratulatory message, for example:
  "Congratulations. You reached 3.00 years of experience and finally broke through the job market."
- Keep Reset Market working.

<constraints>
- Keep the game self-contained and playable inside the existing album cover modal.
- Do not introduce page scrolling or modal overflow regressions.
- Preserve keyboard panning and drag controls.
- Preserve existing reduced-motion handling.
- Preserve existing styling language unless small CSS updates are needed for changed labels/states.
- Only make changes directly required by this request.
</constraints>

<acceptance_criteria>
- Fresh/invisible icon click: +0.20, no random failure, icon disappears.
- Yellow/entry-level click below 1.00: denied, +0.00, icon disappears.
- Yellow/entry-level click at or above 1.00: +0.50, icon disappears.
- Blue/freelancer icons cycle visible 3s / hidden 3s until clicked; click gives +0.30 to +0.50 even below 1.00.
- Red/HR click locks controls for 5 seconds and displays "Your resume is being reviewed..."
- Green/on-site click gives +0.30 and keeps existing teleport behavior.
- Progress target displays 3.00 years and the win state triggers at 3.00.
- npm run build passes.
</acceptance_criteria>

Before editing, inspect the current InfiniteScrollGame implementation. After editing, run npm run build and report the changed files plus any verification notes.
```

Target: Claude Code

Optimized with file-scoped repo context, exact gameplay rules, constraints, and acceptance checks so the agent can implement without guessing.
