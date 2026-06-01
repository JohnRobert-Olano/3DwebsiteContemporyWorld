import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { projects } from '../lib/data/projects';
import AlbumGameShell from './games/AlbumGameShell';
import { gameRegistry } from './games/gameRegistry';

const PROJECT_COUNT = projects.length;

// Diagonal unveil-style stack: lower-left cards are closer, upper-right cards recede.
// The reference (unveil.fr) uses flat upright panes stepped along a diagonal -
// only gentle Y yaw + tiny X pitch, NO Z roll. A non-zero rotateZ makes the
// cards look like parallelograms/diamonds, which is the look we want to avoid.
const STEP_X_VW = 8.25;
const STEP_Y_VW = -5.15;
const STEP_Z_PX = -118;
const ROT_X_DEG = 3;
const ROT_Y_DEG = -16;
const ROT_Z_DEG = 0;
const STACK_ORIGIN_X = '54%';
const STACK_ORIGIN_Y = '59%';
const CARD_WIDTH = 'clamp(360px, 30vw, 540px)';
const CARD_ASPECT = '1 / 1';
const VISIBLE_RADIUS = 9;
// Hover: nudge the active cover sideways inside the stack. Keep it in-plane
// so the interaction feels like the original slide, not a full cover reveal.
const HOVER_SHIFT_X_PX = 240;
const HOVER_SHIFT_Y_PX = 0;
const HOVER_LIFT_Z_PX = 0;
const HOVER_SCALE = 1;

// Windowed ring buffer: render slots from -RENDER_RADIUS..+RENDER_RADIUS around
// the active index. Slots are keyed by offset (never remount); the outer rings
// beyond VISIBLE_RADIUS fade, so covers recycled at the far edge stay invisible.
// There is no finite strip and no boundary to teleport across - the loop is
// genuinely endless and flicker-free.
const RENDER_RADIUS = VISIBLE_RADIUS + 2;
const MAX_TARGET_AHEAD = Math.max(2, RENDER_RADIUS - 3);

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const TEXT_DARK = '#ffffff';
const TEXT_META = 'rgba(255, 255, 255, 0.7)';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.45)';
const BORDER_CARD = 'rgba(255, 255, 255, 0.12)';
const FOCUS_RING = 'var(--accent)';
const SHADOW_ACTIVE =
  '0 30px 84px rgba(0,0,0,0.6), 0 10px 26px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.15)';
const SHADOW_DEFAULT =
  '0 20px 54px rgba(0,0,0,0.4), 0 3px 12px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)';

const NOISE_TEXTURE =
  'url("data:image/svg+xml,%3Csvg viewBox=%270 0 220 220%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.038%27/%3E%3C/svg%3E")';

// Single fallback for when the project image fails to load. The covers in the
// reference (unveil.fr) are full-bleed images on translucent glass panes -
// per-card color treatments are intentionally removed.
const FALLBACK_PAPER_BG = 'linear-gradient(155deg, rgba(20,20,22,0.85) 0%, rgba(10,10,12,0.95) 100%)';
const LABEL_DARK = 'rgba(255,255,255,0.84)';

const TEXT_FIXES = [
  [/\u00c2\u00b7/g, ' / '],
  [/\u00b7/g, ' / '],
  [/\u00e2\u20ac\u201d/g, '-'],
  [/\u00e2\u20ac\u201c/g, '-'],
  [/\u00e2\u20ac\u2122/g, "'"],
];

function wrapIndex(index, length = PROJECT_COUNT) {
  return ((index % length) + length) % length;
}

function cleanText(value) {
  return TEXT_FIXES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value ?? ''),
  ).replace(/\s{2,}/g, ' ');
}

// Move the whole stack by the fractional part of the sequence only (|d| stays
// around 0.5), so the container transform never accumulates or jumps at a loop
// boundary. Net on-screen position of a slot = (offset - d) * STEP.
function applyStackTransform(el, d) {
  el.style.transform = `translate3d(${(-d * STEP_X_VW).toFixed(4)}vw, ${(-d * STEP_Y_VW).toFixed(4)}vw, ${(-d * STEP_Z_PX).toFixed(2)}px)`;
}

function ProjectCover({ project }) {
  const [failedImage, setFailedImage] = useState(null);
  const title = cleanText(project.title);
  const role = cleanText(project.role);
  const useFallback = !project.image || failedImage === project.image;
  const isPlayable = Boolean(gameRegistry[project.id]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Primary image - fills the card; slight translucency mimics the
          glass-pane stack in the unveil reference. */}
      {!useFallback && (
        <img
          src={project.image}
          alt=""
          onError={() => setFailedImage(project.image)}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: 1,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {/* Fallback panel - gallery-card off-white with project title + role.
          Used only when the underlying image asset fails to load. */}
      {useFallback && (
        <div
          className="absolute inset-0 flex flex-col justify-end p-6"
          style={{ background: FALLBACK_PAPER_BG }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: NOISE_TEXTURE,
              opacity: 0.5,
              mixBlendMode: 'multiply',
            }}
          />
          <div
            className="relative font-mono text-[9px] uppercase tracking-[0.3em]"
            style={{ color: TEXT_MUTED }}
          >
            {role}
          </div>
          <h3
            className="relative mt-1.5 text-lg font-semibold leading-tight md:text-xl"
            style={{ color: TEXT_DARK, letterSpacing: '-0.01em' }}
          >
            {title}
          </h3>
        </div>
      )}

      {isPlayable && (
        <div className="project-game-badge">
          Game
        </div>
      )}

      {useFallback && (
        <div
          className={`absolute right-4 ${isPlayable ? 'top-10' : 'top-3'} font-mono text-[9px] uppercase tracking-[0.24em]`}
          style={{ color: LABEL_DARK, textShadow: 'none' }}
        >
          {project.year}
        </div>
      )}
    </div>
  );
}

function StackCard({ project, offset, onOpen, reducedMotion }) {
  const [isHovered, setIsHovered] = useState(false);
  const distance = Math.abs(offset);
  const isActive = offset === 0;
  // Slots are keyed by offset, so opacity is constant per slot - the outer two
  // rings fade, which hides the cover-content recycling at the far edge.
  const opacity = Math.max(0, Math.min(1, (RENDER_RADIUS - distance) / 2));
  const canInteract = distance <= VISIBLE_RADIUS;
  const hoverActive = canInteract && isHovered && !reducedMotion;
  const hoverTransform = hoverActive
    ? ` translate3d(${HOVER_SHIFT_X_PX}px, ${HOVER_SHIFT_Y_PX}px, ${HOVER_LIFT_Z_PX}px) scale(${HOVER_SCALE})`
    : '';

  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={`Open ${cleanText(project.title)}`}
      aria-hidden={canInteract ? undefined : 'true'}
      tabIndex={canInteract ? undefined : -1}
      className="absolute cursor-pointer overflow-visible rounded-[2px] p-0 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{
        left: STACK_ORIGIN_X,
        top: STACK_ORIGIN_Y,
        width: CARD_WIDTH,
        aspectRatio: CARD_ASPECT,
        transform: `translate(-50%, -50%) translate3d(${offset * STEP_X_VW}vw, ${offset * STEP_Y_VW}vw, ${offset * STEP_Z_PX}px) rotateX(${ROT_X_DEG}deg) rotateY(${ROT_Y_DEG}deg) rotateZ(${ROT_Z_DEG}deg)`,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: hoverActive ? 3000 : 1000 - offset,
        opacity,
        pointerEvents: canInteract ? 'auto' : 'none',
        willChange: 'transform',
        outlineColor: FOCUS_RING,
      }}
    >
      <span
        className="absolute inset-0 block overflow-hidden rounded-[2px]"
        style={{
          border: `1px solid ${BORDER_CARD}`,
          background: 'rgba(15, 15, 15, 1)',
          backdropFilter: 'blur(10px)',
          boxShadow: hoverActive || isActive ? SHADOW_ACTIVE : SHADOW_DEFAULT,
          filter: hoverActive || isActive ? 'brightness(1.03) saturate(1.05)' : 'brightness(1) saturate(1)',
          transform: hoverActive ? hoverTransform : 'translate3d(0, 0, 0) scale(1)',
          transformStyle: 'preserve-3d',
          transition: reducedMotion
            ? 'none'
            : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.24s ease, box-shadow 0.24s ease',
          willChange: 'transform',
        }}
      >
        <ProjectCover project={project} />
      </span>
    </button>
  );
}

function GridCard({ project, onOpen }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={`Open ${cleanText(project.title)}`}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-[2px] p-0 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{
        border: `1px solid ${BORDER_CARD}`,
        background: 'rgba(15, 15, 15, 0.45)',
        backdropFilter: 'blur(10px)',
        boxShadow: isHovered ? SHADOW_ACTIVE : SHADOW_DEFAULT,
        outlineColor: FOCUS_RING,
        // Mirror the stack hover: slide sideways without turning the grid card
        // into a full cover reveal.
        transform: isHovered ? 'translate3d(22px, 0, 0) scale(1.01)' : 'translate3d(0, 0, 0) scale(1)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s ease',
        zIndex: isHovered ? 20 : 1,
        willChange: 'transform',
      }}
    >
      <ProjectCover project={project} />
    </button>
  );
}

function FullscreenView({ project, onClose, reducedMotion }) {
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 220, damping: 28 };
  const role = cleanText(project.role);
  const title = cleanText(project.title);
  const blurb = cleanText(project.blurb);
  const gameMeta = gameRegistry[project.id];
  const GameComponent = gameMeta?.Component;
  const isGameModal = Boolean(GameComponent);

  return (
    <motion.div
      key={project.id}
      className={`fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-md ${
        isGameModal ? 'px-1.5 py-1.5 sm:px-2 sm:py-2 lg:px-4 lg:py-4' : 'px-5 py-8 sm:px-6 sm:py-10'
      }`}
      style={{ background: 'rgba(26,25,23,0.72)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        className={`relative z-[81] flex w-full flex-col overflow-hidden rounded-[6px] shadow-[0_40px_120px_rgba(0,0,0,0.3)] ${
          isGameModal ? 'projects-game-modal' : 'max-h-full'
        }`}
        style={{
          height: isGameModal ? 'calc(100dvh - clamp(0.75rem, 2vw, 2rem))' : undefined,
          maxHeight: isGameModal ? 'calc(100dvh - clamp(0.75rem, 2vw, 2rem))' : undefined,
          maxWidth: gameMeta ? 'min(1480px, calc(100vw - clamp(0.5rem, 2vw, 2rem)))' : '64rem',
          transformOrigin: 'center center',
          background: gameMeta ? 'rgba(13, 13, 13, 0.98)' : 'rgba(18, 18, 18, 0.82)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${BORDER_CARD}`,
        }}
        initial={
          reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.86, rotateX: ROT_X_DEG, rotateY: ROT_Y_DEG }
        }
        animate={
          reducedMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }
        }
        exit={
          reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.94, rotateX: ROT_X_DEG / 2, rotateY: ROT_Y_DEG / 2 }
        }
        transition={transition}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] outline-none transition-colors hover:bg-white hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            border: `1px solid ${BORDER_CARD}`,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(255, 255, 255, 0.8)',
            outlineColor: FOCUS_RING,
          }}
        >
          Close
        </button>
        {GameComponent ? (
          <AlbumGameShell project={project} gameMeta={gameMeta}>
            <GameComponent project={project} reducedMotion={reducedMotion} />
          </AlbumGameShell>
        ) : (
          <>
            <div className="relative aspect-square w-full overflow-hidden">
              <ProjectCover project={project} />
            </div>
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:p-10">
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: TEXT_MUTED }}
                >
                  {role}
                </div>
                <h3
                  className="mt-3 text-3xl font-bold tracking-normal md:text-4xl"
                  style={{ color: TEXT_DARK, letterSpacing: 0 }}
                >
                  {title}
                </h3>
                <p
                  className="mt-5 max-w-prose text-sm leading-relaxed md:text-base"
                  style={{ color: TEXT_META }}
                >
                  {blurb}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: TEXT_MUTED }}
                >
                  Year
                </div>
                <div className="text-2xl font-semibold" style={{ color: TEXT_DARK }}>
                  {project.year}
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] transition-colors hover:bg-[#1a1917] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      border: `1px solid ${BORDER_CARD}`,
                      color: TEXT_META,
                      outlineColor: FOCUS_RING,
                    }}
                  >
                    Visit Site
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const WHEEL_SENSITIVITY = 0.012; // sequence units per wheel deltaY pixel
const TOUCH_SENSITIVITY = 0.02; // sequence units per touch-drag pixel
const STACK_LERP = 0.14; // smoothing toward the target sequence

export default function ProjectsFinale() {
  const archiveRootRef = useRef(null);
  const stackRef = useRef(null);
  const seqRef = useRef(0); // continuous scroll position, in cards (unbounded)
  const targetSeqRef = useRef(0);
  const baseRef = useRef(0); // integer base React has committed (== `base` state)
  const requestedBaseRef = useRef(0); // last base we asked React to render
  const fullscreenRef = useRef(null);

  // `base` is the active integer index; content for slot `offset` is
  // projects[wrapIndex(base + offset)]. Driving content off committed state (not
  // a ref) keeps the rendered covers and the container transform on the same
  // basis, which is what removes the loop-boundary flicker.
  const [base, setBase] = useState(0);
  const [fullscreen, setFullscreen] = useState(null);
  const [mode, setMode] = useState('OVERVIEW');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [archiveActive, setArchiveActive] = useState(
    () => typeof window !== 'undefined' && window.projectsFinaleUnlocked === true,
  );

  const useStack = archiveActive && mode === 'OVERVIEW' && !reducedMotion && !isMobile;

  useEffect(() => {
    fullscreenRef.current = fullscreen;
  }, [fullscreen]);

  // ── Responsive / reduced-motion sync ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 767px)');

    const sync = () => {
      setReducedMotion(rmQuery.matches);
      setIsMobile(mobileQuery.matches);
    };
    sync();

    rmQuery.addEventListener('change', sync);
    mobileQuery.addEventListener('change', sync);
    return () => {
      rmQuery.removeEventListener('change', sync);
      mobileQuery.removeEventListener('change', sync);
    };
  }, []);

  // ── Enter archive mode on the unlock event dispatched by "Open articles" ──
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const enter = () => setArchiveActive(true);
    if (window.projectsFinaleUnlocked) enter();
    window.addEventListener('projectsFinaleUnlock', enter);
    return () => window.removeEventListener('projectsFinaleUnlock', enter);
  }, []);

  const closeFullscreen = useCallback(() => setFullscreen(null), []);

  const exitArchive = useCallback(() => {
    if (typeof window !== 'undefined') window.projectsFinaleUnlocked = false;
    setFullscreen(null);
    setMode('OVERVIEW');
    setArchiveActive(false);
  }, []);

  // ── Archive activation: lock the world, stop Lenis, move focus inside ─────
  useEffect(() => {
    if (!archiveActive) return undefined;
    document.body.classList.add('album-archive-active');
    window.projectsFinaleActive = true;
    window.codexLenis?.stop?.();

    const focusFrame = window.requestAnimationFrame(() => {
      archiveRootRef.current?.focus?.();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove('album-archive-active');
      document.body.classList.remove('projects-finale-modal-open');
      window.projectsFinaleActive = false;
      window.codexLenis?.start?.();
    };
  }, [archiveActive]);

  // ── Escape: close the game modal first, otherwise exit the archive ────────
  useEffect(() => {
    if (!archiveActive) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (fullscreenRef.current) setFullscreen(null);
      else exitArchive();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [archiveActive, exitArchive]);

  // ── Game modal body class (defensive chrome hide) ─────────────────────────
  useEffect(() => {
    if (!fullscreen) return undefined;
    document.body.classList.add('projects-finale-modal-open');
    return () => document.body.classList.remove('projects-finale-modal-open');
  }, [fullscreen]);

  // Keep the container transform on the SAME basis as the rendered content:
  // whenever `base` commits, re-apply the fractional transform before paint so
  // the content-shift and transform-shift land in one frame (no flicker).
  useLayoutEffect(() => {
    baseRef.current = base;
    requestedBaseRef.current = base;
    const el = stackRef.current;
    if (el) applyStackTransform(el, seqRef.current - base);
  }, [base]);

  // ── Internal looping driver ───────────────────────────────────────────────
  // Wheel / touch / arrow input advances an unbounded virtual sequence (NOT
  // document scroll), so the archive can never slide into the world. Only a
  // window of cards is rendered around the active index, recycled via
  // wrapIndex, so the loop is endless with no boundary to teleport across.
  useEffect(() => {
    if (!archiveActive || !useStack) return undefined;
    const root = archiveRootRef.current;
    const stackEl = stackRef.current;
    if (!root || !stackEl) return undefined;

    seqRef.current = 0;
    targetSeqRef.current = 0;
    baseRef.current = 0;
    requestedBaseRef.current = 0;
    setBase(0);
    applyStackTransform(stackEl, 0);

    const nudge = (delta) => {
      targetSeqRef.current = clampNumber(
        targetSeqRef.current + delta,
        seqRef.current - MAX_TARGET_AHEAD,
        seqRef.current + MAX_TARGET_AHEAD,
      );
    };

    let raf = window.requestAnimationFrame(function tick() {
      const target = targetSeqRef.current;
      const next = seqRef.current + (target - seqRef.current) * STACK_LERP;
      seqRef.current = Math.abs(target - next) < 0.0004 ? target : next;

      // Transform uses the committed base so it always matches the rendered
      // covers; the layout effect re-syncs on the frame `base` actually changes.
      applyStackTransform(stackEl, seqRef.current - baseRef.current);

      const desiredBase = Math.round(seqRef.current);
      if (desiredBase !== requestedBaseRef.current) {
        requestedBaseRef.current = desiredBase;
        setBase(desiredBase);
      }
      raf = window.requestAnimationFrame(tick);
    });

    const onWheel = (e) => {
      if (fullscreenRef.current) return; // let the open game scroll internally
      e.preventDefault();
      nudge(e.deltaY * WHEEL_SENSITIVITY);
    };

    let touchY = null;
    const onTouchStart = (e) => { touchY = e.touches[0]?.clientY ?? null; };
    const onTouchMove = (e) => {
      if (fullscreenRef.current || touchY == null) return;
      e.preventDefault();
      const current = e.touches[0]?.clientY ?? touchY;
      nudge((touchY - current) * TOUCH_SENSITIVITY);
      touchY = current;
    };
    const onTouchEnd = () => { touchY = null; };

    const onKey = (e) => {
      if (fullscreenRef.current) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') {
        e.preventDefault();
        nudge(1);
      } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') {
        e.preventDefault();
        nudge(-1);
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    root.addEventListener('touchcancel', onTouchEnd, { passive: true });
    root.addEventListener('keydown', onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', onTouchEnd);
      root.removeEventListener('keydown', onKey);
    };
  }, [archiveActive, useStack]);

  const activeIndex = wrapIndex(base);
  const activeProject = projects[activeIndex] ?? projects[0];

  if (!PROJECT_COUNT || !archiveActive) return null;

  return createPortal(
    <div
      ref={archiveRootRef}
      className="album-archive"
      role="dialog"
      aria-modal="true"
      aria-label="Album archive"
      tabIndex={-1}
      data-lenis-prevent
    >
      <div className="pointer-events-none absolute left-[6vw] top-[6vh] z-30 max-w-[82vw] sm:max-w-[56vw] lg:max-w-[40vw]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: TEXT_MUTED }}>
          <span
            className="mr-2 inline-block h-px w-6 align-middle"
            style={{ background: TEXT_MUTED }}
            aria-hidden="true"
          />
          Article archive
        </p>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: TEXT_MUTED }}>
          {PROJECT_COUNT} visual essays
        </div>
        <h2
          className="mt-3 text-3xl font-semibold leading-tight tracking-normal sm:text-4xl lg:text-5xl"
          style={{ color: TEXT_DARK, letterSpacing: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          {cleanText(activeProject.title)}
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: TEXT_META }}>
          {cleanText(activeProject.role)} / {activeProject.year}
        </p>
      </div>

      <button
        type="button"
        onClick={exitArchive}
        aria-label="Return to the world"
        className="pointer-events-auto absolute right-[6vw] top-[6vh] z-40 cursor-pointer rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] outline-none transition-colors hover:bg-white hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          border: `1px solid ${BORDER_CARD}`,
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(4px)',
          outlineColor: FOCUS_RING,
        }}
      >
        Back to World
      </button>

      {useStack && (
        <div
          className="absolute inset-0 z-10"
          style={{ perspective: '1800px', perspectiveOrigin: '54% 52%' }}
        >
          <div
            ref={stackRef}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transform: 'translate3d(0, 0, 0)' }}
          >
            {Array.from({ length: RENDER_RADIUS * 2 + 1 }, (_, i) => {
              const offset = i - RENDER_RADIUS;
              return (
                <StackCard
                  key={offset}
                  offset={offset}
                  project={projects[wrapIndex(base + offset)]}
                  onOpen={setFullscreen}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </div>
        </div>
      )}

      {!useStack && (
        <div
          className="absolute inset-0 overflow-y-auto px-[6vw] pb-[16vh] pt-[30vh] sm:pt-[26vh]"
          data-lenis-prevent
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <GridCard key={project.id} project={project} onOpen={setFullscreen} />
            ))}
          </div>
        </div>
      )}

      {!isMobile && (
        <div
          className="pointer-events-auto absolute bottom-8 right-8 z-30 flex items-center gap-1 rounded-full p-1 backdrop-blur-sm"
          style={{
            background: 'rgba(15, 15, 15, 0.65)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${BORDER_CARD}`,
          }}
        >
          {['OVERVIEW', 'INDEX'].map((viewMode) => {
            const active = mode === viewMode;
            const disabled = viewMode === 'OVERVIEW' && reducedMotion;
            return (
              <button
                key={viewMode}
                type="button"
                onClick={() => !disabled && setMode(viewMode)}
                disabled={disabled}
                aria-pressed={active}
                aria-label={`Switch to ${viewMode.toLowerCase()} view`}
                className={`rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? 'text-bg'
                    : disabled
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer hover:text-white'
                }`}
                style={{
                  background: active ? 'rgba(255,255,255,0.94)' : 'transparent',
                  color: active ? 'var(--bg)' : disabled ? TEXT_MUTED : TEXT_META,
                  outlineColor: FOCUS_RING,
                }}
              >
                {viewMode}
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {fullscreen && (
          <FullscreenView
            project={fullscreen}
            onClose={closeFullscreen}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
