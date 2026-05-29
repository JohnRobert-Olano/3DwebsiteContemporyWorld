import { Fragment, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

// Overlay rendered inside each destination section. The card is a
// phase-driven state machine - Content.jsx tells it when to enter / exit so
// the in/out animations stay synchronized with the Cesium camera flights.
//
// Layout matches the Google Earth Studio reference: landmark name top-left,
// location sub-line below, large outlined era-range text centered.
// Next-landmark preview is intentionally omitted (locked decision).
//
// Phases:
//   hidden   - text fully invisible, no transitions running.
//   entering - words staggered into view; fires onEnterComplete on settle.
//   visible  - words held in their in-frame state.
//   exiting  - words staggered out of view; fires onExitComplete on settle.
function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Split a string into ordered word / whitespace tokens so each word gets its
// own inline-block span (for GSAP per-word staggering) while whitespace stays
// as plain text - no layout reflow, no broken kerning between words.
function tokenizeText(text) {
  if (!text) return [];
  return String(text)
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) => ({
      type: /^\s+$/.test(part) ? 'space' : 'word',
      value: part,
    }));
}

function renderWordTokens(tokens) {
  return tokens.map((token, i) => (
    token.type === 'space' ? (
      <Fragment key={i}>{token.value}</Fragment>
    ) : (
      <span
        key={i}
        className="split-word"
        data-motion-role="title"
        style={{ display: 'inline-block', willChange: 'transform, opacity' }}
      >
        {token.value}
      </span>
    )
  ));
}

export default function LandmarkTitleCard({
  destination,
  index,
  phase = 'hidden',
  onEnterComplete,
  onExitComplete,
}) {
  const backdropRef = useRef(null);
  const nameContainerRef = useRef(null);
  const discoverContainerRef = useRef(null);
  const eraContainerRef = useRef(null);

  const nameTokens = useMemo(() => tokenizeText(destination.name), [destination.name]);
  const eraTokens = useMemo(() => tokenizeText(destination.eraRange), [destination.eraRange]);
  const locationTokens = useMemo(() => tokenizeText(destination.location), [destination.location]);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const nameC = nameContainerRef.current;
    const discoverC = discoverContainerRef.current;
    const eraC = eraContainerRef.current;
    if (!backdrop || !nameC || !discoverC || !eraC) return undefined;

    // Each region collects its own word spans + the decorative discover line
    // (which is tagged `.split-word` so it animates alongside the two words).
    const nameWords = Array.from(nameC.querySelectorAll('.split-word'));
    const discoverWords = Array.from(discoverC.querySelectorAll('.split-word'));
    const eraWords = Array.from(eraC.querySelectorAll('.split-word'));
    const allWords = [...nameWords, ...discoverWords, ...eraWords];
    const allElements = [backdrop, ...allWords];
    gsap.killTweensOf(allElements);

    const reduced = prefersReducedMotion();

    if (phase === 'hidden') {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(allWords, { opacity: 0, x: 0, y: 28 });
      return undefined;
    }

    if (phase === 'visible') {
      gsap.set(backdrop, { opacity: 1 });
      gsap.set(allWords, { opacity: 1, x: 0, y: 0 });
      return undefined;
    }

    if (phase === 'entering') {
      if (reduced) {
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(allWords, { opacity: 1, x: 0, y: 0 });
        const id = window.setTimeout(() => onEnterComplete?.(index), 0);
        return () => window.clearTimeout(id);
      }

      // Each region starts below its final position so words slide up into
      // place. Stagger is deliberately wide (≈10% of duration per word) so
      // each word reads as its own beat instead of all words arriving at
      // once.
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(nameWords, { opacity: 0, x: 0, y: 32 });
      gsap.set(discoverWords, { opacity: 0, x: 0, y: 20 });
      gsap.set(eraWords, { opacity: 0, x: 0, y: 36 });

      const tl = gsap.timeline({
        onComplete: () => onEnterComplete?.(index),
      });
      // Backdrop leads the text in by a beat so the typography reads against
      // a settled scrim rather than fading up over a still-bright globe.
      tl.to(backdrop, {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
      }, 0);
      tl.to(nameWords, {
        opacity: 1,
        y: 0,
        duration: 0.66,
        ease: 'power3.out',
        stagger: 0.085,
      }, 0.12);
      tl.to(eraWords, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.095,
      }, 0.22);
      tl.to(discoverWords, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.06,
      }, 0.32);

      return () => tl.kill();
    }

    if (phase === 'exiting') {
      if (reduced) {
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(allWords, { opacity: 0, x: 0, y: 0 });
        const id = window.setTimeout(() => onExitComplete?.(index), 0);
        return () => window.clearTimeout(id);
      }

      const tl = gsap.timeline({
        onComplete: () => onExitComplete?.(index),
      });
      tl.to(discoverWords, {
        opacity: 0,
        y: -18,
        duration: 0.32,
        ease: 'power2.in',
        stagger: 0.035,
      }, 0);
      tl.to(nameWords, {
        opacity: 0,
        y: -22,
        duration: 0.38,
        ease: 'power2.in',
        stagger: 0.04,
      }, 0.04);
      tl.to(eraWords, {
        opacity: 0,
        y: -26,
        duration: 0.44,
        ease: 'power2.in',
        stagger: 0.045,
      }, 0.02);
      // Backdrop trails the text out so the scrim never lingers without text
      // on it (and is fully gone before the next camera flight begins).
      tl.to(backdrop, {
        opacity: 0,
        duration: 0.46,
        ease: 'power2.in',
      }, 0.22);

      return () => tl.kill();
    }

    return undefined;
  }, [phase, index, onEnterComplete, onExitComplete]);

  const ariaHidden = phase === 'hidden' || phase === 'exiting';
  // When the state machine is running we render the active card as a fixed
  // viewport overlay so its stacking context can't be trapped behind the
  // pinned destination section or the Cesium canvas. Reduced-motion paths
  // (no ScrollTrigger / state machine) keep the original in-section layout
  // - only the section currently in the viewport shows its title.
  const reduced = prefersReducedMotion();
  const useFixed = !reduced;
  const containerClass = useFixed
    ? 'landmark-title-card pointer-events-none fixed inset-0 z-[75]'
    : 'landmark-title-card pointer-events-none absolute inset-0 z-20';
  const containerStyle = useFixed
    ? { display: phase === 'hidden' ? 'none' : 'block' }
    : undefined;

  const card = (
    <div
      className={containerClass}
      aria-hidden={ariaHidden}
      style={containerStyle}
    >
      {/* Low-opacity scrim that sits behind every text element. Animated
          together with the text so it only appears while a title is on
          screen and is fully gone during the camera flight between
          landmarks. */}
      <div
        ref={backdropRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.15) 72%, rgba(0,0,0,0) 100%)',
          willChange: 'opacity',
        }}
        aria-hidden="true"
      />

      <div className="absolute left-[6vw] top-[14vh] max-w-[60vw]">
        <h1
          ref={nameContainerRef}
          className="font-display text-4xl font-bold uppercase tracking-normal text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-6xl lg:text-7xl"
          aria-label={destination.name}
        >
          <span aria-hidden="true">{renderWordTokens(nameTokens)}</span>
        </h1>
        <div
          ref={discoverContainerRef}
          className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/85"
          aria-hidden="true"
        >
          {/* Decorative leading line - tagged `.split-word` so it slides
              in/out with the two text words and no element pops between
              the title phases. */}
          <span
            className="split-word inline-block h-px w-6 bg-white/85"
            style={{ willChange: 'transform, opacity' }}
          />
          <span>{renderWordTokens(locationTokens)}</span>
        </div>
      </div>

      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6">
        <span
          ref={eraContainerRef}
          className="landmark-era text-4xl tracking-normal sm:text-6xl md:text-7xl lg:text-8xl"
          aria-label={destination.eraRange}
        >
          <span aria-hidden="true">{renderWordTokens(eraTokens)}</span>
        </span>
      </div>
    </div>
  );

  if (useFixed && typeof document !== 'undefined') {
    return createPortal(card, document.body);
  }

  return card;
}
