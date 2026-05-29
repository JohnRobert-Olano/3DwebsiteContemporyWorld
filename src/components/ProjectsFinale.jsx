import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'framer-motion';
import { projects } from '../lib/data/projects';

gsap.registerPlugin(ScrollTrigger);

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
const SCRUB_DISTANCE = '+=520%';
const STACK_ORIGIN_X = '54%';
const STACK_ORIGIN_Y = '59%';
const CARD_WIDTH = 'clamp(360px, 30vw, 540px)';
const CARD_ASPECT = '1 / 1';
const VISIBLE_RADIUS = 9;
// Hover: pull the active cover out of the stack to the right, lift it toward
// the viewer, and scale it slightly so the artwork can be inspected.
// toward the viewer, and scale it slightly - together this reads as the
const HOVER_SHIFT_X_PX = 150;
const HOVER_SHIFT_Y_PX = -42;
const HOVER_LIFT_Z_PX = 360;
const HOVER_SCALE = 1.08;

// Extra copies before and after the live set keep the pinned scrub from showing gaps.
const LOOP_COPIES = 2;
const TOTAL_VIRTUAL = PROJECT_COUNT * (1 + LOOP_COPIES * 2);
const START_SEQUENCE = PROJECT_COUNT * LOOP_COPIES;

const BG_GALLERY = 'var(--bg)';
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

function setProjectsFinaleReady(isReady) {
  if (typeof window === 'undefined') return;
  window.projectsFinaleReady = isReady;
  if (isReady) {
    window.dispatchEvent(new Event('projectsFinaleReady'));
  }
}

function buildVirtualCards() {
  if (!PROJECT_COUNT) return [];

  return Array.from({ length: TOTAL_VIRTUAL }, (_, sequenceIndex) => {
    const realIndex = wrapIndex(sequenceIndex);
    return {
      sequenceIndex,
      realIndex,
      project: projects[realIndex],
    };
  });
}

const VIRTUAL_CARDS = buildVirtualCards();

function ProjectCover({ project }) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = cleanText(project.title);
  const role = cleanText(project.role);
  const useFallback = !project.image || imageFailed;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Primary image - fills the card; slight translucency mimics the
          glass-pane stack in the unveil reference. */}
      {!useFallback && (
        <img
          src={project.image}
          alt=""
          onError={() => setImageFailed(true)}
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

      {useFallback && (
        <div
          className="absolute right-4 top-3 font-mono text-[9px] uppercase tracking-[0.24em]"
          style={{ color: LABEL_DARK, textShadow: 'none' }}
        >
          {project.year}
        </div>
      )}
    </div>
  );
}

function StackCard({ card, activeSequenceIndex, onOpen, reducedMotion }) {
  const { project, sequenceIndex } = card;
  const [isHovered, setIsHovered] = useState(false);
  const distance = Math.abs(sequenceIndex - activeSequenceIndex);
  const isActive = sequenceIndex === activeSequenceIndex;
  const visible = distance <= VISIBLE_RADIUS;
  const canInteract = visible;
  const hoverActive = canInteract && isHovered && !reducedMotion;
  const opacity = visible ? 1 : 0;
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
      className="absolute cursor-pointer overflow-visible rounded-[2px] p-0 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{
        left: STACK_ORIGIN_X,
        top: STACK_ORIGIN_Y,
        width: CARD_WIDTH,
        aspectRatio: CARD_ASPECT,
        transform: `translate(-50%, -50%) translate3d(${sequenceIndex * STEP_X_VW}vw, ${sequenceIndex * STEP_Y_VW}vw, ${sequenceIndex * STEP_Z_PX}px) rotateX(${ROT_X_DEG}deg) rotateY(${ROT_Y_DEG}deg) rotateZ(${ROT_Z_DEG}deg)`,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: hoverActive ? 3000 : 1000 - sequenceIndex,
        opacity,
        pointerEvents: canInteract ? 'auto' : 'none',
        transition: reducedMotion ? 'none' : 'opacity 0.24s ease',
        willChange: 'transform, opacity',
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
        // Mirror the stack hover: slide RIGHT out of the grid row + lift up +
        // scale, so the hovered cover pops forward to show the artwork.
        transform: isHovered ? 'translate3d(14px, -10px, 0) scale(1.04)' : 'translate3d(0, 0, 0) scale(1)',
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

  return (
    <motion.div
      key={project.id}
      className="fixed inset-0 z-[80] flex items-center justify-center px-5 py-8 backdrop-blur-md sm:px-6 sm:py-10"
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
        className="relative z-[81] flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[6px] shadow-[0_40px_120px_rgba(0,0,0,0.3)]"
        style={{
          transformOrigin: 'center center',
          background: 'rgba(18, 18, 18, 0.82)',
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
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsFinale() {
  const sectionRef = useRef(null);
  const stackRef = useRef(null);
  const lastActiveSequenceRef = useRef(START_SEQUENCE);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSequenceIndex, setActiveSequenceIndex] = useState(START_SEQUENCE);
  const [fullscreen, setFullscreen] = useState(null);
  const [mode, setMode] = useState('OVERVIEW');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(
    () => typeof window !== 'undefined' && window.projectsFinaleUnlocked === true,
  );

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const unlock = () => setIsUnlocked(true);
    if (window.projectsFinaleUnlocked) unlock();

    window.addEventListener('projectsFinaleUnlock', unlock);
    return () => window.removeEventListener('projectsFinaleUnlock', unlock);
  }, []);

  useEffect(() => {
    window.projectsFinaleActive = false;
    window.projectsScrollProgress = 0;
    setProjectsFinaleReady(false);

    const useStack = isUnlocked && mode === 'OVERVIEW' && !reducedMotion && !isMobile;
    if (!useStack || !PROJECT_COUNT) {
      const stackEl = stackRef.current;
      if (stackEl) stackEl.style.transform = 'translate3d(0, 0, 0)';
      document.body.classList.remove('in-projects-finale');
      return undefined;
    }

    const section = sectionRef.current;
    const stackEl = stackRef.current;
    if (!section || !stackEl) return undefined;

    const setCamera = (progress) => {
      const currentSequence = START_SEQUENCE + progress * PROJECT_COUNT;
      const camX = -(currentSequence * STEP_X_VW);
      const camY = -(currentSequence * STEP_Y_VW);
      const camZ = currentSequence * Math.abs(STEP_Z_PX);
      stackEl.style.transform = `translate3d(${camX}vw, ${camY}vw, ${camZ}px)`;

      const nearestSequence = Math.round(currentSequence);
      if (nearestSequence !== lastActiveSequenceRef.current) {
        lastActiveSequenceRef.current = nearestSequence;
        setActiveSequenceIndex(nearestSequence);
        setActiveIndex(wrapIndex(nearestSequence));
      }
    };

    setCamera(0);
    setActiveSequenceIndex(START_SEQUENCE);
    setActiveIndex(0);
    lastActiveSequenceRef.current = START_SEQUENCE;

    const enter = () => {
      window.projectsFinaleActive = true;
      document.body.classList.add('in-projects-finale');
    };
    const leave = () => {
      window.projectsFinaleActive = false;
      document.body.classList.remove('in-projects-finale');
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: SCRUB_DISTANCE,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onEnter: enter,
        onEnterBack: enter,
        onLeave: leave,
        onLeaveBack: leave,
        onUpdate: (self) => {
          window.projectsScrollProgress = self.progress;
          setCamera(self.progress);
        },
      });
    }, sectionRef);

    ScrollTrigger.refresh();
    const readyFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      setProjectsFinaleReady(true);
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      ctx.revert();
      window.projectsFinaleActive = false;
      window.projectsScrollProgress = 0;
      setProjectsFinaleReady(false);
      document.body.classList.remove('in-projects-finale');
    };
  }, [mode, reducedMotion, isMobile, isUnlocked]);

  const closeFullscreen = useCallback(() => setFullscreen(null), []);

  useEffect(() => {
    if (!fullscreen) return undefined;

    window.codexLenis?.stop?.();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.codexLenis?.start?.();
    };
  }, [fullscreen, closeFullscreen]);

  const useStack = isUnlocked && mode === 'OVERVIEW' && !reducedMotion && !isMobile;

  useEffect(() => {
    if (!isUnlocked || useStack) return undefined;

    const section = sectionRef.current;
    const readyFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      setProjectsFinaleReady(true);
    });

    if (!section || typeof IntersectionObserver === 'undefined') {
      document.body.classList.add('in-projects-finale');
      return () => {
        window.cancelAnimationFrame(readyFrame);
        setProjectsFinaleReady(false);
        document.body.classList.remove('in-projects-finale');
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle('in-projects-finale', entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(section);

    return () => {
      window.cancelAnimationFrame(readyFrame);
      observer.disconnect();
      setProjectsFinaleReady(false);
      document.body.classList.remove('in-projects-finale');
    };
  }, [isUnlocked, useStack]);

  const activeProject = projects[activeIndex] ?? projects[0];

  if (!PROJECT_COUNT) return null;

  return (
    <section
      ref={sectionRef}
      id="projects-finale"
      className={`panel-section relative w-full overflow-hidden transition-opacity duration-300 ${
        isUnlocked ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{ minHeight: '100dvh', background: BG_GALLERY }}
      aria-label="Article archive"
      aria-hidden={!isUnlocked}
    >
      {isUnlocked && (
        <>
          <div className="pointer-events-none absolute left-[6vw] top-[8vh] z-30 max-w-[82vw] sm:max-w-[56vw] lg:max-w-[38vw]">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.24em]"
              style={{ color: TEXT_MUTED }}
            >
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
            <p
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: TEXT_META }}
            >
              {cleanText(activeProject.role)} / {activeProject.year}
            </p>
          </div>

          {useStack && (
            <div
              className="absolute inset-0 z-10"
              style={{ perspective: '1800px', perspectiveOrigin: '54% 52%' }}
            >
              <div
                ref={stackRef}
                className="absolute inset-0"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                {VIRTUAL_CARDS.map((card) => (
                  <StackCard
                    key={`project-card-${card.sequenceIndex}`}
                    card={card}
                    activeSequenceIndex={activeSequenceIndex}
                    onOpen={setFullscreen}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>
          )}

          {!useStack && (
            <div className="absolute inset-0 overflow-y-auto px-[6vw] pb-[16vh] pt-[34vh]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {projects.map((project) => (
                  <GridCard
                    key={project.id}
                    project={project}
                    onOpen={setFullscreen}
                  />
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
        </>
      )}
    </section>
  );
}
