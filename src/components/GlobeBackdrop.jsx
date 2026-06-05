import { useEffect, useState } from 'react';
import GlobeWordReveal from './GlobeWordReveal';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Deterministic upward speed-line streaks for the post-WTC "Modern World"
// Earth-exit. Computed once at module load (seeded LCG), so the layout is stable
// across renders and never re-randomises. Biased into the left/right thirds so
// the centred title stays clean. Animated with transform + opacity only.
const EXIT_STREAK_COUNT = 18;
const EXIT_STREAKS = (() => {
  let seed = 0x1a2b3c;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: EXIT_STREAK_COUNT }, (_, i) => {
    const side = rand();
    const left = i % 2 === 0
      ? 2 + side * 34   // left third:  2% .. 36%
      : 64 + side * 34; // right third: 64% .. 98%
    return {
      left,
      delay: -rand() * 2.2,          // negative = already mid-cycle on mount
      duration: 1.5 + rand() * 1.4,  // 1.5s .. 2.9s
      height: 16 + rand() * 26,      // 16vh .. 42vh streak length
      opacity: 0.18 + rand() * 0.3,  // 0.18 .. 0.48 visible-phase alpha
      width: rand() > 0.7 ? 2 : 1.5, // mostly hairline
    };
  });
})();

// Speed-line streaks rushing upward beside the Earth during the Modern World
// exit. Driven by the `globe-exit` event; force-cleared on `resetGlobe` (Home /
// back-scroll). Renders nothing under reduced motion or while idle, so it costs
// nothing outside the ending.
function GlobeExitStreaks() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onExit = (event) => setActive(!!event.detail?.active);
    const onReset = () => setActive(false);
    window.addEventListener('globe-exit', onExit);
    window.addEventListener('resetGlobe', onReset);
    return () => {
      window.removeEventListener('globe-exit', onExit);
      window.removeEventListener('resetGlobe', onReset);
    };
  }, []);

  if (!active || prefersReducedMotion()) return null;

  return (
    <div className="globe-exit-streaks" aria-hidden="true">
      {EXIT_STREAKS.map((streak, i) => (
        <span
          key={i}
          className="globe-exit-streak"
          style={{
            left: `${streak.left}%`,
            width: `${streak.width}px`,
            height: `${streak.height}vh`,
            animationDelay: `${streak.delay}s`,
            animationDuration: `${streak.duration}s`,
            '--streak-opacity': streak.opacity,
          }}
        />
      ))}
    </div>
  );
}

// Full-viewport layer rendered BEHIND the (now transparent) Cesium canvas, so
// the real Earth occludes the centre of the cinematic word reveals. The reveal
// panels in Content drive it through `globe-reveal` window events rather than
// rendering the title themselves (they live above the globe and couldn't sit
// behind it). The exit streaks sit behind the title within this same layer.
export default function GlobeBackdrop() {
  const [reveal, setReveal] = useState({ text: '', active: false });

  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const onReveal = (event) => {
      const detail = event.detail || {};
      setReveal((current) => ({
        // Keep the last text while animating out so the exit transition reads.
        text: detail.text || current.text,
        active: !!detail.active,
      }));
    };
    window.addEventListener('globe-reveal', onReveal);
    return () => window.removeEventListener('globe-reveal', onReveal);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden={!reveal.active}>
      <GlobeExitStreaks />
      {reveal.text && (
        <GlobeWordReveal text={reveal.text} active={reveal.active} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
