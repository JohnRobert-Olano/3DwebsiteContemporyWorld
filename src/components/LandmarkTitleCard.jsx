// Overlay rendered inside each destination section. By default, the
// `.destination-reveal` children are picked up by the existing GSAP staggered
// fade in Content.jsx (revealCard / hideCard). The final landmark can opt out
// so React can reveal it only after the Cesium camera settles.
//
// Layout matches the Google Earth Studio reference: landmark name top-left,
// decorative "— Discover more" sub-line below, large outlined era-range text
// centered. Next-landmark preview is intentionally omitted (locked decision).
export default function LandmarkTitleCard({ destination, deferReveal = false, ready = true }) {
  const revealClassName = deferReveal
    ? `transition-all duration-500 ease-out ${
      ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    }`
    : 'destination-reveal';

  return (
    <div
      className="landmark-title-card pointer-events-none absolute inset-0 z-20"
      aria-hidden={deferReveal && !ready}
    >
      <div className={`${revealClassName} absolute left-[6vw] top-[14vh] max-w-[60vw]`}>
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-6xl lg:text-7xl">
          {destination.name}
        </h1>
        <div
          className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/85"
          aria-hidden="true"
        >
          <span className="inline-block h-px w-6 bg-white/85" />
          Discover more
        </div>
      </div>

      <div className={`${revealClassName} absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6`}>
        <span className="landmark-era text-5xl tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          {destination.eraRange}
        </span>
      </div>
    </div>
  );
}
