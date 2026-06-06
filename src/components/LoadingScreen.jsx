import { motion, AnimatePresence } from 'framer-motion';
import SpinningGlobe from './SpinningGlobe';
import { destinations } from '../lib/data/destinations';

const TOTAL = destinations.length;

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M1.5 4.5l2 2L7.5 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Phase 1: Earth rendering ───────────────────────────────────────────── */
function EarthPhase() {
  return (
    <motion.div
      key="earth"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="relative flex h-full w-full flex-col items-center justify-center gap-6"
    >
      <SpinningGlobe />

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="earth-preload-label" role="status" aria-live="polite">
          <span className="earth-preload-label__dot" />
          <span>Rendering Earth</span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/22 max-w-[22rem] leading-relaxed">
          12 historical landmarks will be cached next for a seamless experience
        </p>
      </div>
    </motion.div>
  );
}

/* ── Landmark card (right-panel grid) ───────────────────────────────────── */
function LandmarkCard({ dest, index, warmupIndex }) {
  const done   = index < warmupIndex;
  const active = index === warmupIndex;

  return (
    <div
      role="listitem"
      className={`relative rounded-[6px] border px-3 py-2.5 transition-all duration-500 overflow-hidden ${
        done   ? 'border-white/[0.07] bg-white/[0.02]'
        : active ? 'border-primary/50 bg-primary/[0.07] shadow-[0_0_20px_oklch(68%_0.17_34_/_14%)]'
        :          'border-white/[0.05] bg-transparent'
      }`}
    >
      {/* Active shimmer */}
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className={`font-mono text-[7px] tracking-[0.18em] uppercase ${
          done ? 'text-white/18' : active ? 'text-primary/75' : 'text-white/14'
        }`}>
          Epoch {dest.epochIndex}
        </span>

        <div className="flex-shrink-0 mt-px">
          {done   ? <CheckIcon />
          : active ? <span className="block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          :          <span className="block w-1.5 h-1.5 rounded-full bg-white/[0.12]" />}
        </div>
      </div>

      <p className={`font-mono text-[8.5px] uppercase leading-tight truncate tracking-[0.06em] ${
        done ? 'text-white/28' : active ? 'text-white' : 'text-white/18'
      }`}>
        {dest.name}
      </p>
      <p className={`text-[8px] leading-tight mt-0.5 truncate ${
        done ? 'text-white/15' : active ? 'text-white/48' : 'text-white/10'
      }`}>
        {dest.location}
      </p>
    </div>
  );
}

/* ── Phase 2: Landmark warmup ───────────────────────────────────────────── */
function WarmupPhase({ warmupIndex }) {
  const pct     = Math.round((warmupIndex / TOTAL) * 100);
  const current = warmupIndex < TOTAL ? destinations[warmupIndex] : null;

  return (
    <motion.div
      key="warmup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full w-full overflow-hidden"
    >
      {/* Ambient glow — bleeds from the left edge */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_0%_50%,oklch(68%_0.17_34_/_6%),transparent_70%)]" />

      {/* ── LEFT INFO PANEL ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-between px-7 py-8 sm:px-10 sm:py-10 w-full lg:w-[42%] lg:border-r lg:border-white/[0.06] shrink-0 overflow-y-auto">

        {/* Top: globe + badge */}
        <div>
          <div className="mb-5 origin-left scale-[0.52] -ml-6">
            <SpinningGlobe />
          </div>

          <p className="font-mono text-[8.5px] uppercase tracking-[0.34em] text-primary mb-4">
            Pre-loading landmarks
          </p>

          <h1 className="font-display text-[1.75rem] sm:text-[2.1rem] font-semibold text-white leading-[1.08] tracking-tight mb-4">
            12 stops.<br />12 epochs.<br />All rendered.
          </h1>

          <p className="text-[12.5px] text-white/42 leading-[1.65] max-w-[22rem]">
            Sit back — we're getting everything ready so your experience is smooth from the very first scroll.
          </p>
        </div>

        {/* Middle: current landmark being cached */}
        <div className="my-6">
          {current ? (
            <div className="border-l-[2px] border-primary/70 pl-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-primary/65 mb-1.5">
                Now caching · Epoch {current.epochIndex}
              </p>
              <p className="font-semibold text-white text-[1.05rem] leading-tight mb-0.5">
                {current.name}
              </p>
              <p className="text-[11px] text-white/38 mb-2">
                {current.location}
              </p>
              <p className="text-[11px] text-white/28 leading-snug max-w-[18rem]">
                {current.epochTitle}
              </p>
            </div>
          ) : (
            <div className="border-l-[2px] border-primary/70 pl-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-primary/65 mb-1.5">
                Complete
              </p>
              <p className="font-semibold text-white text-[1.05rem]">All landmarks cached</p>
            </div>
          )}
        </div>

        {/* Bottom: progress + footer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-white/38">
              {warmupIndex} <span className="text-white/22">of</span> {TOTAL} landmarks
            </span>
            <span className="font-mono text-[9px] text-primary font-medium">{pct}%</span>
          </div>

          <div className="h-[2px] w-full rounded-full bg-white/[0.08] overflow-hidden mb-6">
            <motion.div
              className="h-full rounded-full bg-primary origin-left"
              animate={{ scaleX: pct / 100 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/18">
            This only happens once per session
          </p>
        </div>
      </div>

      {/* ── RIGHT EPOCH GRID — desktop only ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 px-8 py-10">
        <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-white/25 mb-5 shrink-0">
          12 Historical Epochs
        </p>

        <div
          className="grid gap-2 flex-1 content-start"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          role="list"
          aria-label="Landmark pre-loading progress"
        >
          {destinations.map((dest, i) => (
            <LandmarkCard key={dest.id} dest={dest} index={i} warmupIndex={warmupIndex} />
          ))}
        </div>
      </div>

      {/* Mobile shows only the left panel — grid is desktop-only to avoid cramping */}
    </motion.div>
  );
}

/* ── Root ───────────────────────────────────────────────────────────────── */
export default function LoadingScreen({ warmupIndex = -1 }) {
  const isWarming = warmupIndex >= 0;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-[150] overflow-hidden bg-bg select-none"
      style={{ background: 'var(--bg)' }}
    >
      <AnimatePresence mode="wait">
        {isWarming
          ? <WarmupPhase key="warmup" warmupIndex={warmupIndex} />
          : <EarthPhase  key="earth" />}
      </AnimatePresence>
    </motion.div>
  );
}
