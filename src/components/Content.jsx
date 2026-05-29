import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { destinations, journeyNavItems } from '../lib/data/destinations';
import { projects } from '../lib/data/projects';
import LandmarkTitleCard from './LandmarkTitleCard';
import ProjectsFinale from './ProjectsFinale';
import SplitWords from './SplitWords';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ────────────────────────────────────────────────────────────
   Section Data  (unchanged - pure content, no layout logic)
   ──────────────────────────────────────────────────────────── */
const sections = [
  {
    id: 'culture',
    navLabel: 'Culture',
    mobileLabel: 'Culture',
    title: 'Culture',
    subTitle: 'The Global Village',
    headlineLines: ['The', 'global', 'village'],
    summary:
      'Culture moves through music, language, food, art, film, and daily habits. Globalization lets people adopt, adapt, and exchange cultural expression beyond their own society.',
    points: [
      {
        label: 'Exchange',
        text: 'Ideas and styles travel across borders through media, migration, education, and commerce.',
      },
      {
        label: 'Hybrid identity',
        text: 'Local culture is not simply erased; it often blends with global influences into new forms.',
      },
    ],
    example:
      'K-pop, Japanese anime, Hollywood films, and English as a common business language all show culture becoming both local and global.',
  },
  {
    id: 'economy',
    navLabel: 'Economy',
    mobileLabel: 'Economy',
    title: 'Economy',
    subTitle: 'The Engine',
    headlineLines: ['The', 'global', 'economy'],
    summary:
      'Economic globalization links national economies through trade, investment, supply chains, and financial markets into one interdependent system.',
    points: [
      {
        label: 'Drivers',
        text: 'Transnational corporations, free trade agreements, and foreign direct investment connect production and capital.',
      },
      {
        label: 'Ripple effects',
        text: 'A recession, shipping disruption, or tariff policy can spread quickly across many countries.',
      },
    ],
    example:
      'A car assembled in Germany may rely on Brazilian steel, Taiwanese microchips, Malaysian rubber, and global logistics.',
  },
  {
    id: 'environment',
    navLabel: 'Environment',
    mobileLabel: 'Climate',
    title: 'Environment',
    subTitle: 'The Shared Home',
    headlineLines: ['The', 'shared', 'home'],
    summary:
      'Environmental globalization shows that air, oceans, climate, and biodiversity ignore political borders, making ecological problems shared problems.',
    points: [
      {
        label: 'Shared systems',
        text: 'Climate change, deforestation, pollution, and biodiversity loss move through connected natural systems.',
      },
      {
        label: 'Shared responsibility',
        text: 'Solutions require cooperation because environmental harm often crosses the border where it began.',
      },
    ],
    example:
      'Carbon emissions in industrialized countries can raise sea levels that threaten Pacific Island communities.',
  },
  {
    id: 'politics',
    navLabel: 'Politics',
    mobileLabel: 'Power',
    title: 'Politics',
    subTitle: 'The Rules of the Game',
    headlineLines: ['The', 'rules of', 'the game'],
    summary:
      'Political globalization creates institutions, treaties, and agreements for cooperation, negotiation, and dispute resolution.',
    points: [
      {
        label: 'Institutions',
        text: 'The UN, WTO, and IMF shape diplomacy, trade rules, financial stability, and international cooperation.',
      },
      {
        label: 'Tension',
        text: 'Shared rules matter most when nations are connected but still disagree about power, priorities, and values.',
      },
    ],
    example:
      'The Paris Climate Agreement, UN peacekeeping missions, and WTO trade rulings are all political globalization in action.',
  },
  {
    id: 'technology',
    navLabel: 'Technology',
    mobileLabel: 'Tech',
    title: 'Technology',
    subTitle: 'The Nervous System',
    headlineLines: ['The', 'nervous', 'system'],
    summary:
      'Technology provides the networks and tools that let information, money, goods, services, and people coordinate across distance almost instantly.',
    points: [
      {
        label: 'Infrastructure',
        text: 'Internet platforms, smartphones, AI, satellites, and undersea cables keep global systems connected.',
      },
      {
        label: 'Acceleration',
        text: 'Technology increases the speed and scale of cultural, economic, political, and environmental change.',
      },
    ],
    example:
      'A video call across continents or an instant remittance payment are everyday examples of technological globalization.',
  },
];

/* ────────────────────────────────────────────────────────────
   Ping-Pong layout helpers
   Even-index sections (0,2,4) → Earth LEFT, Card RIGHT
   Odd-index  sections (1,3)   → Earth RIGHT, Card LEFT
   ──────────────────────────────────────────────────────────── */
const cardSide = (i) => (i % 2 === 0 ? 'right' : 'left');

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
const setDestinationTourState = (index) => {
  const now = performance.now();
  const current = window.destinationTourState;
  if (
    current?.index === index
    && current.requestedAt
    && now - current.requestedAt < 8000
  ) {
    window.destinationTourActive = true;
    return false;
  }

  window.destinationTourActive = true;
  window.destinationTourState = {
    index,
    progress: 1,
    requestedAt: now,
  };
  return true;
};

const FINAL_DESTINATION_ID = 'world-trade-center-nyc';
// How long the camera must hold steady (codexDestinationFlying === false)
// before we accept it as "settled" and trigger the title-in animation. Too
// short and a brief flyTo cancellation will re-enter the title prematurely;
// too long and the title feels unresponsive after the camera lands.
const REVEAL_ENTRY_BUFFER_MS = 180;
const REVEAL_STABLE_MS = 200;
const REVEAL_FALLBACK_MS = 6500;
const TECHNOLOGY_PANEL_HOLD_MS = 1200;
const TECHNOLOGY_SNAP_GUARD_MS = 2200;
const TECHNOLOGY_GESTURE_QUIET_MS = 1200;

function IntroHero({ onBegin, onAtlas }) {
  const metrics = [
    { value: sections.length, label: 'systems' },
    { value: destinations.length, label: 'landmarks' },
    { value: projects.length, label: 'visual essays' },
  ];

  return (
    <section
      className="relative min-h-[100dvh] w-full overflow-hidden"
      aria-labelledby="intro-hero-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(242,109,91,0.18),transparent_34%),linear-gradient(90deg,rgba(5,7,14,0.78),rgba(5,7,14,0.18)_52%,rgba(5,7,14,0.7))]" />
      <div className="pointer-events-auto relative z-20 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col justify-end px-5 pb-24 pt-28 sm:px-8 md:pb-20 lg:justify-center lg:px-10">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)]">
          <div className="max-w-5xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              Contemporary world atlas
            </p>
            <h1
              id="intro-hero-title"
              className="mt-5 max-w-5xl font-display text-[clamp(2.75rem,8vw,5.5rem)] font-semibold leading-[0.98] tracking-normal text-white"
            >
              Globalization in motion
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/[0.82] sm:text-lg">
              Explore how culture, capital, climate, power, and technology move across one shared planet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onBegin}
                className="cursor-pointer rounded-full bg-white px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-bg shadow-[0_16px_42px_rgba(0,0,0,0.36)] transition-colors duration-200 hover:bg-primary hover:text-bg focus-visible:outline-primary"
              >
                Begin journey
              </button>
              <button
                type="button"
                onClick={onAtlas}
                className="cursor-pointer rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-xl transition-colors duration-200 hover:border-primary/80 hover:bg-primary/[0.12] focus-visible:outline-primary"
              >
                Open atlas
              </button>
            </div>
          </div>

          <dl className="grid gap-3 border-l border-white/[0.12] pl-5 sm:grid-cols-3 sm:border-l-0 sm:border-t sm:pl-0 sm:pt-5 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {metric.label}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-white">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   ContentSection
   Editorial typography panel for one of the five globalization
   topics. Each word in the headline, microcopy, and "Archive
   Index" link is wrapped in a `.split-word` inline-block span so
   GSAP can pan them in/out horizontally with a per-word stagger.
   ──────────────────────────────────────────────────────────── */
function ContentSection({ sec, index, onActive, onLeave }) {
  const sectionRef = useRef(null);
  const side = cardSide(index);
  const headlinePos = side === 'right' ? 'right-[6vw]' : 'left-[6vw]';
  const microcopyPos = side === 'right' ? 'left-[6vw]' : 'right-[6vw]';
  const headlineAlign = side === 'right' ? 'text-right' : 'text-left';
  const indentProp = side === 'right' ? 'paddingRight' : 'paddingLeft';
  const microLabel = sec.subTitle;
  const fullHeadline = `${sec.headlineLines.join(' ')}.`;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const headlineWords = Array.from(section.querySelectorAll('h2 .split-word'));
    const detailWords = Array.from(section.querySelectorAll('.content-panel-copy .split-word'));
    const words = [...headlineWords, ...detailWords];

    if (reduced) {
      // Reduced motion: words stay statically visible; only signal which
      // section is active so the nav highlight and globe tilt still update.
      gsap.set(words, { opacity: 1, x: 0, y: 0 });
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => onActive?.(index),
        onEnterBack: () => onActive?.(index),
        onLeave: () => onLeave?.(index),
        onLeaveBack: () => onLeave?.(index),
      });
      return () => st.kill();
    }

    // Each word starts below its final position and fades in. Stagger is
    // intentionally larger than the duration-relative micro-cascade the
    // previous X-slide used, so the reveal reads as discrete word-by-word
    // beats instead of a near-simultaneous block fade.
    gsap.set(words, { opacity: 0, x: 0, y: 28 });

    let activeTl = null;

    const playEnter = () => {
      activeTl?.kill();
      gsap.set(words, { opacity: 0, x: 0, y: 28 });
      activeTl = gsap.timeline();
      activeTl.to(headlineWords, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        ease: 'power3.out',
        stagger: 0.075,
      }, 0);
      activeTl.to(detailWords, {
        opacity: 1,
        y: 0,
        duration: 0.54,
        ease: 'power3.out',
        stagger: 0.038,
      }, 0.12);
    };

    const playExit = () => {
      activeTl?.kill();
      activeTl = gsap.timeline();
      activeTl.to(headlineWords, {
        opacity: 0,
        y: -22,
        duration: 0.42,
        ease: 'power2.in',
        stagger: 0.035,
      }, 0);
      activeTl.to(detailWords, {
        opacity: 0,
        y: -22,
        duration: 0.34,
        ease: 'power2.in',
        stagger: 0.022,
      }, 0.04);
    };

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => { onActive?.(index); playEnter(); },
      onEnterBack: () => { onActive?.(index); playEnter(); },
      onLeave: () => { onLeave?.(index); playExit(); },
      onLeaveBack: () => { onLeave?.(index); playExit(); },
    });

    return () => {
      activeTl?.kill();
      st.kill();
    };
  }, [index, onActive, onLeave]);

  return (
    <section
      id={sec.id}
      ref={sectionRef}
      className="panel-section relative w-full overflow-visible"
      style={{ minHeight: '100dvh' }}
      aria-labelledby={`${sec.id}-title`}
    >
      <div
        className="content-panel-type pointer-events-none absolute inset-0 z-20"
      >
        {/* Huge editorial headline - top, outer edge */}
        <h2
          id={`${sec.id}-title`}
          className={`pointer-events-auto absolute top-[12dvh] sm:top-[14dvh] ${headlinePos} max-w-[88vw] font-semibold text-white leading-[0.95] tracking-normal ${headlineAlign}`}
          style={{ fontSize: 'clamp(48px, 10.4vw, 188px)' }}
          aria-label={fullHeadline}
        >
          <span aria-hidden="true">
            {sec.headlineLines.map((line, lineIdx) => {
              const isLastLine = lineIdx === sec.headlineLines.length - 1;
              const words = line.split(/\s+/).filter(Boolean);
              return (
                <span
                  key={`${sec.id}-line-${lineIdx}`}
                  className="block"
                  style={{ [indentProp]: `${lineIdx}ch` }}
                >
                  {words.map((word, wordIdx) => {
                    const isLastWord = isLastLine && wordIdx === words.length - 1;
                    return (
                      <span key={wordIdx}>
                        {wordIdx > 0 && ' '}
                        <span
                          className="split-word"
                          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
                        >
                          {word}
                          {isLastWord && <span className="text-primary">.</span>}
                        </span>
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        </h2>

        {/* Microcopy block - bottom, opposite edge (near globe).
            Always text-left (ragged-right) regardless of which corner
            it lives in - matches the editorial reference. */}
        <div
          className={`content-panel-copy pointer-events-auto absolute bottom-[18dvh] ${microcopyPos} flex w-[88vw] max-w-[22rem] flex-col gap-4 rounded-[6px] border border-white/[0.10] bg-bg/[0.58] p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-5 lg:bottom-[10dvh]`}
        >
          <SplitWords
            as="span"
            text={microLabel}
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary"
          />
          <SplitWords
            as="p"
            text={sec.summary}
            className="text-[13px] leading-[1.6] text-white/[0.86] sm:text-sm"
          />
          <a
            href="#destination-colosseum"
            className="self-start rounded-full border border-white/[0.16] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-primary/70 hover:text-primary focus-visible:outline-primary"
            aria-label="Open landmark atlas"
          >
            <span aria-hidden="true">
              <span
                className="split-word"
                style={{ display: 'inline-block', willChange: 'transform, opacity' }}
              >
                Open
              </span>
              {' '}
              <span
                className="split-word"
                style={{ display: 'inline-block', willChange: 'transform, opacity' }}
              >
                atlas
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Content({ lenisRef }) {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(-1);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(-1);
  const [isJourneyMenuOpen, setIsJourneyMenuOpen] = useState(false);
  const activeJourneyIndexRef = useRef(-1);

  // ── Title state machine ──────────────────────────────────
  // The only title that should ever be rendering visibly. -1 = none on screen.
  const [visibleTitleIndex, setVisibleTitleIndex] = useState(-1);
  // 'hidden' | 'entering' | 'visible' | 'exiting'. Drives the LandmarkTitleCard
  // animation phase for the index in visibleTitleIndex.
  const [titlePhase, setTitlePhase] = useState('hidden');

  // Refs mirror the title state machine so the wheel/touch/nav handlers can
  // read the latest values without re-binding on every state update.
  const visibleTitleIndexRef = useRef(-1);
  const titlePhaseRef = useRef('hidden');
  // Action to invoke once the current exit animation finishes - used by the
  // wheel/touch/nav handlers to defer the actual scroll/snap until the
  // previous landmark title has finished animating out.
  const pendingActionRef = useRef(null);

  useEffect(() => {
    visibleTitleIndexRef.current = visibleTitleIndex;
  }, [visibleTitleIndex]);
  useEffect(() => {
    titlePhaseRef.current = titlePhase;
  }, [titlePhase]);
  useEffect(() => {
    activeJourneyIndexRef.current = activeJourneyIndex;
  }, [activeJourneyIndex]);

  const reducedMotionPreferred =
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stable callbacks for ContentSection ScrollTriggers. The globe tilt and
  // active-section state used to live in the parent effect; lifting them out
  // here keeps the ContentSection effect deps stable across renders.
  const handleSectionEnter = useCallback((sectionIndex) => {
    setActiveSection(sectionIndex);
    window.globeTargetDirection = sectionIndex % 2 === 0 ? -1 : 1;
    if (sectionIndex === sections.length - 1) {
      window.codexTechnologyPanelHoldUntil = Math.max(
        window.codexTechnologyPanelHoldUntil || 0,
        performance.now() + TECHNOLOGY_PANEL_HOLD_MS,
      );
      window.codexTechnologyPanelArmed = false;
      if (window.codexTechnologyPanelArmTimer) {
        window.clearTimeout(window.codexTechnologyPanelArmTimer);
      }
      window.codexTechnologyPanelArmTimer = window.setTimeout(() => {
        window.codexTechnologyPanelArmed = true;
      }, TECHNOLOGY_GESTURE_QUIET_MS);
    }
  }, []);

  const handleSectionLeave = useCallback(() => {
    window.globeTargetDirection = 0;
  }, []);

  // LandmarkTitleCard callbacks. Stable references so the child effect deps
  // don't re-run every parent render.
  const handleTitleEnterComplete = useCallback((index) => {
    if (visibleTitleIndexRef.current !== index) return;
    if (activeJourneyIndexRef.current !== index) return;
    titlePhaseRef.current = 'visible';
    setTitlePhase('visible');
  }, []);

  const handleTitleExitComplete = useCallback((index) => {
    if (visibleTitleIndexRef.current !== index) return;
    visibleTitleIndexRef.current = -1;
    titlePhaseRef.current = 'hidden';
    setVisibleTitleIndex(-1);
    setTitlePhase('hidden');

    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) {
      // Defer one frame so the state updates above commit before the action
      // (which usually kicks off a scroll/snap that reads the same state).
      window.requestAnimationFrame(pending);
    }
  }, []);

  // Run `action` after the currently-visible title finishes animating out.
  // If no title is on screen we run it immediately. If an exit is already in
  // flight we just replace any earlier pending action (last call wins).
  const withTitleExit = useCallback((action) => {
    const phase = titlePhaseRef.current;
    const idx = visibleTitleIndexRef.current;
    if (phase === 'exiting') {
      pendingActionRef.current = action;
      return;
    }
    if (idx >= 0 && (phase === 'visible' || phase === 'entering')) {
      pendingActionRef.current = action;
      titlePhaseRef.current = 'exiting';
      setTitlePhase('exiting');
      return;
    }
    action();
  }, []);

  const activateJourneyIndex = useCallback((index) => {
    if (index < 0 || index >= destinations.length) return;
    if (window.projectsFinaleTransitioning) return;
    if (
      activeJourneyIndexRef.current === index
      && window.destinationTourActive
      && window.destinationTourState?.index === index
    ) {
      return;
    }
    const didRequestTour = setDestinationTourState(index);
    activeJourneyIndexRef.current = index;
    setActiveSection(sections.length + index);
    setActiveJourneyIndex(index);
    if (!didRequestTour) {
      window.destinationTourActive = true;
    }
  }, []);

  const settleJourneyIndex = useCallback((index) => {
    if (index < 0 || index >= destinations.length) return;
    ScrollTrigger.update();
    window.requestAnimationFrame(() => {
      ScrollTrigger.update();
      activateJourneyIndex(index);
      window.setTimeout(() => activateJourneyIndex(index), 120);
    });
  }, [activateJourneyIndex]);

  /* ── ScrollTrigger wiring ───────────────────────────────── */
  useEffect(() => {
    window.romeModeActive = false;
    window.romeScrollProgress = 0;
    window.destinationTourActive = false;
    window.destinationTourState = { index: 0, progress: 0 };
    window.projectsFinaleActive = false;
    window.projectsScrollProgress = 0;
    window.projectsFinaleUnlocked = false;
    window.projectsFinaleReady = false;
    window.projectsFinaleTransitioning = false;
    document.body.classList.remove('in-projects-finale');

    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // No scroll-scrubbed animations - content stays statically visible.
      window.globeTargetDirection = 0;
      return undefined;
    }

    let syncFrame = null;
    let viewportSyncFrame = null;
    let viewportSyncTimer = null;
    let viewportSyncTrigger = null;
    let scheduleActiveDestinationSync = null;
    const syncTimers = [];

    const ctx = gsap.context(() => {
      // Section panels (Culture → Technology) own their own ScrollTriggers
      // inside ContentSection so the word-by-word slide-in / slide-out
      // animations can stay scoped to each section's DOM subtree.

      // Each landmark gets a short top-pin so it behaves as a discrete page.
      // The wheel/touch handler below snaps to the next landmark on a single
      // scroll input - and the title state machine (see useEffect later in
      // this component) drives the in/out animations independently from the
      // ScrollTrigger callbacks.
      const destinationPanels = gsap.utils.toArray('.destination-section');

      destinationPanels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=10%',
          pin: true,
          anticipatePin: 1,
          onEnter: () => {
            activateJourneyIndex(i);
          },
          onEnterBack: () => {
            activateJourneyIndex(i);
          },
          onLeaveBack: () => {
            if (i === 0) {
              window.destinationTourActive = false;
              activeJourneyIndexRef.current = -1;
              setActiveJourneyIndex(-1);
            } else {
              activateJourneyIndex(i - 1);
            }
          },
        });
      });

      const syncActiveDestinationFromViewport = () => {
        const viewportHeight = window.innerHeight;
        const activePanel = destinationPanels.reduce((best, panel, index) => {
          const rect = panel.getBoundingClientRect();
          if (rect.bottom <= 0 || rect.top >= viewportHeight) return best;

          const score = Math.abs(rect.top);
          if (
            !best
            || score < best.score - 1
            || (Math.abs(score - best.score) <= 1 && index > best.index)
          ) {
            return { index, score };
          }
          return best;
        }, null);

        if (!activePanel) return;
        activateJourneyIndex(activePanel.index);
        syncTimers.push(window.setTimeout(() => activateJourneyIndex(activePanel.index), 120));
      };

      scheduleActiveDestinationSync = () => {
        if (!viewportSyncFrame) {
          viewportSyncFrame = window.requestAnimationFrame(() => {
            viewportSyncFrame = null;
            syncActiveDestinationFromViewport();
          });
        }
        if (viewportSyncTimer) window.clearTimeout(viewportSyncTimer);
        viewportSyncTimer = window.setTimeout(() => {
          viewportSyncTimer = null;
          syncActiveDestinationFromViewport();
        }, 220);
      };

      viewportSyncTrigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: scheduleActiveDestinationSync,
      });

      ScrollTrigger.refresh();
      syncFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.update();
        syncActiveDestinationFromViewport();
      });
      [150, 500, 1000, 1800].forEach((delay) => {
        syncTimers.push(window.setTimeout(() => {
          ScrollTrigger.update();
          syncActiveDestinationFromViewport();
        }, delay));
      });
    }, containerRef);

    return () => {
      if (syncFrame) window.cancelAnimationFrame(syncFrame);
      if (viewportSyncFrame) window.cancelAnimationFrame(viewportSyncFrame);
      if (viewportSyncTimer) window.clearTimeout(viewportSyncTimer);
      viewportSyncTrigger?.kill();
      syncTimers.forEach((timer) => window.clearTimeout(timer));
      ctx.revert();
      window.romeModeActive = false;
      window.destinationTourActive = false;
      window.projectsFinaleUnlocked = false;
      window.projectsFinaleReady = false;
      window.projectsFinaleTransitioning = false;
      document.body.classList.remove('in-projects-finale');
    };
  }, [activateJourneyIndex]);

  /* ── Drive the title-out animation when activeJourneyIndex changes ──
     If the user has scrolled (or clicked) to a new landmark while a title
     is still visible, kick off its exit so the new one can come in cleanly.
     The wheel/touch/nav handlers below also call into the exit path before
     initiating the scroll itself; this effect catches any remaining case
     (e.g., scrolling back from the first landmark to the home section). */
  useEffect(() => {
    const phase = titlePhaseRef.current;
    const visIdx = visibleTitleIndexRef.current;

    if (visIdx < 0) return;
    if (visIdx === activeJourneyIndex) return;
    if (phase !== 'visible' && phase !== 'entering') return;

    titlePhaseRef.current = 'exiting';
    setTitlePhase('exiting');
  }, [activeJourneyIndex]);

  /* ── Per-destination reveal waits for the Cesium camera to settle ──
     The title-in animation only fires once:
       1. activeJourneyIndex points at a real destination, AND
       2. No other title is currently on screen (visibleTitleIndex === -1),
          which means any previous title has finished exiting, AND
       3. window.codexDestinationFlying has been false for REVEAL_STABLE_MS,
          confirming the camera has actually settled on the landmark. */
  useEffect(() => {
    if (activeJourneyIndex < 0) return undefined;
    if (visibleTitleIndex >= 0) return undefined;
    if (titlePhase !== 'hidden') return undefined;

    const targetIndex = activeJourneyIndex;
    let cancelled = false;
    let entryTimer = null;
    let stableTimer = null;
    let fallbackTimer = null;
    let rafId = 0;

    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const clearStableTimer = () => {
      if (stableTimer) {
        window.clearTimeout(stableTimer);
        stableTimer = null;
      }
    };

    const triggerEnter = () => {
      if (cancelled) return;
      // Bail if state has moved on (user already scrolled past again).
      if (activeJourneyIndexRef.current !== targetIndex) return;
      if (!reducedMotion && window.codexDestinationFlying) return;
      if (window.destinationTourActive && window.destinationTourState?.index !== targetIndex) return;
      clearStableTimer();
      if (rafId) window.cancelAnimationFrame(rafId);
      visibleTitleIndexRef.current = targetIndex;
      titlePhaseRef.current = 'entering';
      setVisibleTitleIndex(targetIndex);
      setTitlePhase('entering');
    };

    if (reducedMotion) {
      triggerEnter();
      return undefined;
    }

    const checkCameraSettled = () => {
      if (cancelled) return;

      if (window.codexDestinationFlying) {
        clearStableTimer();
      } else if (!stableTimer) {
        stableTimer = window.setTimeout(triggerEnter, REVEAL_STABLE_MS);
      }

      rafId = window.requestAnimationFrame(checkCameraSettled);
    };

    entryTimer = window.setTimeout(checkCameraSettled, REVEAL_ENTRY_BUFFER_MS);
    fallbackTimer = window.setTimeout(triggerEnter, REVEAL_FALLBACK_MS);

    return () => {
      cancelled = true;
      if (entryTimer) window.clearTimeout(entryTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      clearStableTimer();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [activeJourneyIndex, visibleTitleIndex, titlePhase]);

  /* ── 1-scroll auto-advance between all content panels ───── */
  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    let isSnapping = false;
    let cooldownTimer = null;
    let guardRestartTimer = null;
    let touchStartY = null;
    let lastWheelTime = 0;
    let freshWheelGuardUntil = 0;

    const extendFreshWheelGuard = (durationMs) => {
      const nextUntil = performance.now() + durationMs;
      freshWheelGuardUntil = Math.max(freshWheelGuardUntil, nextUntil);
      window.codexTechnologyPanelHoldUntil = Math.max(
        window.codexTechnologyPanelHoldUntil || 0,
        nextUntil,
      );
    };

    const disarmTechnologyUntilQuiet = () => {
      window.codexTechnologyPanelArmed = false;
      if (window.codexTechnologyPanelArmTimer) {
        window.clearTimeout(window.codexTechnologyPanelArmTimer);
      }
      window.codexTechnologyPanelArmTimer = window.setTimeout(() => {
        window.codexTechnologyPanelArmed = true;
      }, TECHNOLOGY_GESTURE_QUIET_MS);
    };

    const holdTechnologyPanel = () => {
      const technologyPanel = document.getElementById('technology');
      if (!technologyPanel) return;

      const y = Math.round(technologyPanel.getBoundingClientRect().top + window.scrollY);
      const lenis = window.codexLenis;
      if (lenis?.stop) lenis.stop();
      if (lenis?.scrollTo) {
        lenis.scrollTo(y, { immediate: true, force: true, lock: false });
      }
      window.scrollTo(0, y);
      window.destinationTourActive = false;
      activeJourneyIndexRef.current = -1;
      setActiveJourneyIndex(-1);
      setActiveSection(sections.length - 1);
      window.ScrollTrigger?.update?.();

      if (guardRestartTimer) clearTimeout(guardRestartTimer);
      guardRestartTimer = setTimeout(() => {
        if (!window.codexDestinationFlying && lenis?.start) lenis.start();
      }, 320);
    };

    const releaseLock = (delay = 220, requireFreshWheel = false) => {
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        isSnapping = false;
        if (requireFreshWheel) {
          extendFreshWheelGuard(900);
        }
        const lenis = window.codexLenis;
        if (lenis?.start) lenis.start();
      }, delay);
    };

    const isFreshWheelGuarded = (direction) => {
      if (direction <= 0) return false;
      const technologyPanel = document.getElementById('technology');
      const technologyIsCurrent = technologyPanel
        && Math.abs(technologyPanel.getBoundingClientRect().top) <= 24
        && !window.destinationTourActive;

      const guardUntil = Math.max(
        freshWheelGuardUntil,
        window.codexTechnologyPanelHoldUntil || 0,
      );
      const isGuarded = performance.now() < guardUntil
        || (technologyIsCurrent && window.codexTechnologyPanelArmed === false);
      if (!isGuarded) return false;

      // Trackpad momentum can keep sending wheel events after the snap lands.
      // Extend the guard until that burst has gone quiet, then the next
      // deliberate scroll is allowed to advance into the landmark tour.
      extendFreshWheelGuard(280);
      if (technologyIsCurrent) disarmTechnologyUntilQuiet();
      holdTechnologyPanel();
      return true;
    };

    const findCurrentPanelIdx = (panels) => {
      // Use viewport-relative geometry - element.offsetTop is broken for
      // GSAP-pinned destinations (their offsetParent becomes the pin-spacer,
      // so offsetTop reports 0 and the loop runs off the end of the list).
      const tolerance = 8;
      let idx = -1;
      for (let i = 0; i < panels.length; i += 1) {
        const rectTop = panels[i].getBoundingClientRect().top;
        if (rectTop <= tolerance) {
          idx = i;
        } else {
          break;
        }
      }
      return idx;
    };

    const getSnapPanels = () => (
      Array.from(document.querySelectorAll('.panel-section:not(#projects-finale)'))
    );

    const isProjectsFinaleInView = () => {
      if (!window.projectsFinaleUnlocked) return false;
      const finale = document.getElementById('projects-finale');
      return finale ? finale.getBoundingClientRect().top <= 8 : false;
    };

    const shouldBlockFinalPanelDownScroll = (direction) => {
      if (direction <= 0 || window.projectsFinaleActive || isProjectsFinaleInView()) {
        return false;
      }

      const panels = getSnapPanels();
      if (!panels.length) return false;

      return findCurrentPanelIdx(panels) >= panels.length - 1;
    };

    const snapToPanel = (direction) => {
      if (isSnapping) return true;

      // ProjectsFinale is a scrub-pinned section: wheel input must reach
      // Lenis so the pin's progress advances. It is intentionally excluded
      // from the ordinary panel snap list and entered only by the WTC CTA.
      if (window.projectsFinaleActive || isProjectsFinaleInView()) return false;

      const lenis = window.codexLenis;
      // While Lenis is stopped (intro playing, /Home reset in progress),
      // lenis.scrollTo returns early without firing onComplete. Engaging
      // the snap here would lock isSnapping=true forever, freezing every
      // subsequent wheel event after the intro.
      if (lenis?.isStopped) return false;

      const panels = getSnapPanels();
      if (!panels.length) return false;

      const currentIdx = findCurrentPanelIdx(panels);
      const activatePanelDestination = (panelIndex) => {
        const destinationIndex = panelIndex - sections.length;
        if (destinationIndex < 0 || destinationIndex >= destinations.length) return;
        settleJourneyIndex(destinationIndex);
      };

      // Above the first panel scrolling up - release to native scroll.
      if (currentIdx === -1 && direction < 0) return false;

      const targetIdx = currentIdx === -1 ? 0 : currentIdx + direction;

      // Above the first panel scrolling up - release to native scroll.
      if (targetIdx < 0) return false;
      // At or past the last panel scrolling down - block the wheel event so
      // the user stays parked at the final landmark (WTC). Returning true
      // tells handleWheel to call preventDefault and stop the scroll.
      if (targetIdx >= panels.length) {
        activatePanelDestination(currentIdx);
        return true;
      }

      const target = panels[targetIdx];
      if (!target) return false;
      const syncTargetPanel = () => activatePanelDestination(targetIdx);
      const landingOnTechnology = targetIdx === sections.length - 1;

      isSnapping = true;
      if (landingOnTechnology) {
        extendFreshWheelGuard(TECHNOLOGY_SNAP_GUARD_MS);
        disarmTechnologyUntilQuiet();
      }

      // Defensive fallback: even with the isStopped check above, if Lenis
      // ever fails to fire onComplete (e.g. scroll target equals current
      // position), unstick the lock after the snap duration + buffer.
      const fallbackTimer = setTimeout(() => {
        syncTargetPanel();
        releaseLock(landingOnTechnology ? 450 : 0, landingOnTechnology);
      }, 3000);

      if (lenis?.scrollTo) {
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          lock: true,
          onComplete: () => {
            clearTimeout(fallbackTimer);
            syncTargetPanel();
            releaseLock(landingOnTechnology ? 450 : 220, landingOnTechnology);
          },
        });
      } else {
        clearTimeout(fallbackTimer);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(syncTargetPanel, 1500);
        releaseLock(landingOnTechnology ? 1700 : 1500, landingOnTechnology);
      }

      return true;
    };

    // Block scroll while a title is mid-exit OR mid-enter so the user
    // can't compose two camera transitions on top of each other. The
    // exit-then-snap path below is the only way to advance while a
    // title is visible.
    const isTitleBusy = () => {
      const phase = titlePhaseRef.current;
      return phase === 'exiting';
    };

    const requestSnap = (direction) => {
      const phase = titlePhaseRef.current;
      const visIdx = visibleTitleIndexRef.current;
      if (phase === 'exiting') {
        // Already exiting - last input wins. Replace pending without
        // starting a second exit.
        pendingActionRef.current = () => snapToPanel(direction);
        return true;
      }
      if (visIdx >= 0 && (phase === 'visible' || phase === 'entering')) {
        // Defer the snap until the current title has finished its
        // out animation. handleTitleExitComplete invokes pendingActionRef.
        pendingActionRef.current = () => snapToPanel(direction);
        titlePhaseRef.current = 'exiting';
        setTitlePhase('exiting');
        return true;
      }
      return snapToPanel(direction);
    };

    // CAPTURE PHASE - must fire BEFORE Lenis's bubble-phase listener,
    // otherwise Lenis's preventDefault locks the wheel event out of reach.
    const handleWheel = (e) => {
      // Block scroll while a snap is mid-flight, the map camera is still
      // flying, or the title-out animation is in progress.
      if (isSnapping || window.codexDestinationFlying || isTitleBusy()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      const now = performance.now();
      if (Math.abs(e.deltaY) < 4) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      if (isFreshWheelGuarded(direction)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // One trackpad gesture fires many wheel events; treat the burst as one.
      if (now - lastWheelTime < 120) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      lastWheelTime = now;
      const consumed = requestSnap(direction);

      if (consumed) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (touchStartY == null) return;
      const delta = touchStartY - e.touches[0].clientY;
      if (Math.abs(delta) < 4) return;

      const direction = delta > 0 ? 1 : -1;
      if (isSnapping || isFreshWheelGuarded(direction) || window.codexDestinationFlying || isTitleBusy()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (shouldBlockFinalPanelDownScroll(direction)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartY == null) return;

      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY - touchEndY;
      touchStartY = null;

      if (Math.abs(delta) < 40) return;

      const direction = delta > 0 ? 1 : -1;
      if (isSnapping || isFreshWheelGuarded(direction) || window.codexDestinationFlying || isTitleBusy()) return;
      requestSnap(direction);
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
      if (cooldownTimer) clearTimeout(cooldownTimer);
      if (guardRestartTimer) clearTimeout(guardRestartTimer);
      if (window.codexTechnologyPanelArmTimer) {
        window.clearTimeout(window.codexTechnologyPanelArmTimer);
      }
    };
  }, [settleJourneyIndex]);

  /* ── Smooth scrollTo for side-nav clicks ────────────────── */
  const scrollToElement = useCallback((target, offsetY = 0, onComplete) => {
    const lenis = lenisRef?.current || window.codexLenis;
    let completed = false;
    const complete = () => {
      if (completed) return;
      completed = true;
      onComplete?.();
    };

    if (target?.getBoundingClientRect) {
      const targetTop = target.getBoundingClientRect().top + offsetY;
      if (Math.abs(targetTop) <= 2) {
        window.requestAnimationFrame(complete);
      }
    }

    if (lenis?.scrollTo) {
      lenis.scrollTo(target, {
        offset: -offsetY,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: complete,
      });
      return;
    }

    gsap.to(window, {
      duration: 1.2,
      scrollTo: { y: target, offsetY },
      ease: 'power3.inOut',
      onComplete: complete,
    });
  }, [lenisRef]);

  const scrollTo = useCallback((index) => {
    const panels = document.querySelectorAll('.panel-section');
    if (panels[index]) {
      withTitleExit(() => scrollToElement(panels[index], window.innerHeight * 0.15));
    }
  }, [scrollToElement, withTitleExit]);

  const scrollToJourney = useCallback((index) => {
    const target = document.getElementById(`destination-${destinations[index]?.id}`);

    if (target) {
      withTitleExit(() => {
        scrollToElement(target, 0, () => settleJourneyIndex(index));
        setIsJourneyMenuOpen(false);
      });
    }
  }, [scrollToElement, settleJourneyIndex, withTitleExit]);

  const scrollToProjectsFinale = useCallback(() => {
    const target = document.getElementById('projects-finale');
    if (!target) return;

    withTitleExit(() => {
      window.projectsFinaleTransitioning = true;
      visibleTitleIndexRef.current = -1;
      titlePhaseRef.current = 'hidden';
      setVisibleTitleIndex(-1);
      setTitlePhase('hidden');
      activeJourneyIndexRef.current = -1;
      setActiveJourneyIndex(-1);
      setActiveSection(sections.length + destinations.length);
      window.destinationTourActive = false;

      let didScroll = false;
      let fallbackTimer = null;

      const clearDestinationTitle = () => {
        visibleTitleIndexRef.current = -1;
        titlePhaseRef.current = 'hidden';
        setVisibleTitleIndex(-1);
        setTitlePhase('hidden');
        activeJourneyIndexRef.current = -1;
        setActiveJourneyIndex(-1);
      };

      const releaseFinaleTransition = () => {
        window.projectsFinaleTransitioning = false;
        clearDestinationTitle();
      };

      const scrollAfterReady = () => {
        if (didScroll) return;
        didScroll = true;
        window.removeEventListener('projectsFinaleReady', scrollAfterReady);
        if (fallbackTimer) window.clearTimeout(fallbackTimer);

        window.requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          window.requestAnimationFrame(() => {
            const readyTarget = document.getElementById('projects-finale') || target;
            const releaseTimer = window.setTimeout(releaseFinaleTransition, 1800);
            scrollToElement(readyTarget, 0, () => {
              window.clearTimeout(releaseTimer);
              releaseFinaleTransition();
            });
          });
        });
      };

      window.projectsFinaleUnlocked = true;
      window.dispatchEvent(new Event('projectsFinaleUnlock'));

      if (window.projectsFinaleReady) {
        scrollAfterReady();
        return;
      }

      window.addEventListener('projectsFinaleReady', scrollAfterReady, { once: true });
      fallbackTimer = window.setTimeout(scrollAfterReady, 700);
    });
  }, [scrollToElement, withTitleExit]);

  const journeyNavActive = activeSection >= sections.length;


  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="main-scroller relative z-10 w-full pointer-events-none font-sans"
    >


      {/* ─── MOBILE NAV (bottom bar) ─── */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 flex gap-1.5 overflow-x-auto rounded-full border border-white/[0.10] bg-bg/[0.74] p-1.5 shadow-2xl backdrop-blur-2xl pointer-events-auto lg:hidden"
        aria-label="Mobile section navigation"
      >
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`min-w-max rounded-full border px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer sm:px-3 sm:tracking-[0.16em] ${
              activeSection === i
                ? 'border-primary/60 bg-primary/[0.15] text-white'
                : 'border-white/[0.08] bg-white/[0.04] text-muted'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.navLabel}`}
          >
            {sec.mobileLabel}
          </button>
        ))}
      </nav>

      <nav
        className={`fixed right-8 top-1/2 z-50 hidden w-72 -translate-y-1/2 flex-col gap-1 rounded-[6px] border border-white/[0.08] bg-bg/[0.62] p-3 shadow-2xl backdrop-blur-2xl transition-opacity duration-300 pointer-events-auto lg:flex ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Destination index"
      >
        <div className="mb-3 border-b border-white/[0.08] px-2 pb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
          Landmark atlas
        </div>
        {journeyNavItems.map((item, i) => {
          const isActive = activeJourneyIndex === i;

          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => scrollToJourney(i)}
              className={`group relative flex cursor-pointer flex-col rounded-[5px] border-l px-3 py-2.5 text-left transition-all duration-200 ${
                isActive
                  ? 'border-l-primary bg-white/[0.06] text-white'
                  : 'border-l-white/[0.08] text-muted hover:border-l-primary/60 hover:bg-white/[0.08] hover:text-white'
              }`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Jump to ${item.name}`}
            >
              <span className="w-full truncate font-mono text-[9px] uppercase tracking-[0.15em]">
                {item.name}
              </span>
              <span className="mt-1 w-full truncate text-[11px] text-white/[0.46]">
                {item.location}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setIsJourneyMenuOpen(true)}
        className={`fixed right-4 top-20 z-50 cursor-pointer rounded-full border border-white/[0.12] bg-bg/[0.72] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white shadow-xl backdrop-blur-2xl transition-opacity duration-300 lg:hidden ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Open destination index"
        aria-expanded={isJourneyMenuOpen}
      >
        Atlas
      </button>

      {isJourneyMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-bg/[0.96] p-6 backdrop-blur-3xl pointer-events-auto lg:hidden">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.26em] text-white">
              Landmark atlas
            </h2>
            <button
              type="button"
              onClick={() => setIsJourneyMenuOpen(false)}
              aria-label="Close destination index"
              className="cursor-pointer rounded-full border border-white/[0.12] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-8 grid gap-3 overflow-y-auto max-h-[70vh]">
            {journeyNavItems.map((item, i) => {
              const isActive = activeJourneyIndex === i;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToJourney(i)}
                  className={`flex cursor-pointer flex-col rounded-[6px] border px-5 py-4 text-left transition-all ${
                    isActive
                      ? 'border-primary/60 bg-primary/[0.12] text-white'
                      : 'border-white/[0.08] bg-white/[0.04] text-muted'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="block w-full truncate font-mono text-[10px] uppercase tracking-[0.18em]">
                    {item.name}
                  </span>
                  <span className="mt-2 block w-full truncate text-xs text-white/[0.48]">
                    {item.location}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <IntroHero
        onBegin={() => scrollTo(0)}
        onAtlas={() => scrollToJourney(0)}
      />

      {/* ─── SECTION PANELS ───
          Editorial typography over the live globe. Headline anchors to the
          outer ping-pong edge; microcopy sits at the opposite-bottom corner
          near the globe. Each section's words slide in / out word-by-word
          via its own ScrollTrigger inside ContentSection. */}
      {sections.map((sec, index) => (
        <ContentSection
          key={sec.id}
          sec={sec}
          index={index}
          onActive={handleSectionEnter}
          onLeave={handleSectionLeave}
        />
      ))}

      {destinations.map((destination, i) => {
        const isFinalDestination = destination.id === FINAL_DESTINATION_ID;

        // Reduced-motion path: skip the state machine and render the title
        // statically inside each section (each section is viewport-tall, so
        // only the one currently scrolled into view shows its title). For the
        // normal-motion path the title is rendered once outside this map as
        // a fixed viewport overlay - see the block right after this map.
        const sectionPhase = reducedMotionPreferred
          ? 'visible'
          : (visibleTitleIndex === i ? titlePhase : 'hidden');

        const isFinalDestinationVisible = isFinalDestination
          && (sectionPhase === 'visible' || sectionPhase === 'entering');

        return (
          // Scroll-target section for each landmark. In normal motion the
          // section is just a scroll anchor + WTC CTA host; the title overlay
          // lives outside (so the pinned section's transform context can't
          // strand it). Reduced motion keeps the title inside the section.
          <section
            id={`destination-${destination.id}`}
            key={destination.id}
            className="destination-section panel-section relative w-full overflow-visible"
            style={{ minHeight: '100dvh' }}
          >
            {reducedMotionPreferred && (
              <LandmarkTitleCard
                destination={destination}
                index={i}
                phase={sectionPhase}
                onEnterComplete={handleTitleEnterComplete}
                onExitComplete={handleTitleExitComplete}
              />
            )}
            {isFinalDestination && (
              <div
                className={`absolute bottom-[18vh] left-[6vw] z-30 transition-all duration-500 ease-out sm:bottom-[12vh] ${
                  isFinalDestinationVisible
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0'
                }`}
                aria-hidden={!isFinalDestinationVisible}
              >
                <button
                  type="button"
                  onClick={scrollToProjectsFinale}
                  aria-label="Go to articles"
                  disabled={!isFinalDestinationVisible}
                  tabIndex={isFinalDestinationVisible ? undefined : -1}
                  className="cursor-pointer rounded-full border border-white/20 bg-white px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-bg shadow-[0_18px_45px_rgba(0,0,0,0.35)] outline-none transition-colors duration-200 hover:border-primary/70 hover:bg-primary hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  Open articles
                </button>
              </div>
            )}
          </section>
        );
      })}

      {/* ─── Normal-motion title overlay ───
          One LandmarkTitleCard at viewport-overlay scope, driven by the
          state machine. Mounts when the camera has settled on a landmark,
          unmounts after the exit animation. Rendering it outside any
          destination-section avoids the ScrollTrigger-pin transform stack
          (which can re-parent fixed children to the pin-spacer). */}
      {!reducedMotionPreferred && visibleTitleIndex >= 0 && (
        <LandmarkTitleCard
          destination={destinations[visibleTitleIndex]}
          index={visibleTitleIndex}
          phase={titlePhase}
          onEnterComplete={handleTitleEnterComplete}
          onExitComplete={handleTitleExitComplete}
        />
      )}

      {/* ─── PROJECTS FINALE ───
          Closing 3D card stack (unveil.fr-style) shown after the 12 landmarks.
          Owns its own pinned ScrollTrigger; the snap bypass at the top of
          snapToPanel lets wheel input feed the scrub while pinned. */}
      <ProjectsFinale />

      {/* ─── FOOTER SPACER ─── */}
      <div className="footer-spacer h-[60vh]" aria-hidden="true" />
    </div>
  );
}
