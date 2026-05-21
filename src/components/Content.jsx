import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { destinations, journeyNavItems } from '../lib/data/destinations';
import LandmarkTitleCard from './LandmarkTitleCard';
import ProjectsFinale from './ProjectsFinale';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ────────────────────────────────────────────────────────────
   Section Data  (unchanged — pure content, no layout logic)
   ──────────────────────────────────────────────────────────── */
const sections = [
  {
    id: 'culture',
    navLabel: 'Culture',
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
  window.destinationTourActive = true;
  window.destinationTourState = {
    index,
    progress: 1,
    requestedAt: performance.now(),
  };
};

const FINAL_DESTINATION_ID = 'world-trade-center-nyc';
const REVEAL_ENTRY_BUFFER_MS = 180;
const REVEAL_STABLE_MS = 180;
const REVEAL_FALLBACK_MS = 3200;

export default function Content({ lenisRef }) {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(-1);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(-1);
  const [isJourneyMenuOpen, setIsJourneyMenuOpen] = useState(false);
  const [destinationReadySet, setDestinationReadySet] = useState(() => new Set());

  /* ── ScrollTrigger wiring ───────────────────────────────── */
  useEffect(() => {
    window.romeModeActive = false;
    window.romeScrollProgress = 0;
    window.destinationTourActive = false;
    window.destinationTourState = { index: 0, progress: 0 };
    window.projectsFinaleActive = false;
    window.projectsScrollProgress = 0;
    window.projectsFinaleUnlocked = false;
    document.body.classList.remove('in-projects-finale');

    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // No scroll-scrubbed animations — content stays statically visible
      window.globeTargetDirection = 0;
      return undefined;
    }

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.pingpong-card');

      cards.forEach((card, i) => {
        const panel = card.closest('.panel-section');
        if (!panel) return;

        const side = cardSide(i);
        const staggerEls = card.querySelectorAll('.stagger-item');

        gsap.set(card, { opacity: 0, x: side === 'right' ? 100 : -100 });
        gsap.set(staggerEls, { opacity: 0, y: 30 });

        const tl = gsap.timeline({ paused: true });
        tl.to(card, {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power2.out',
        });
        tl.to(
          staggerEls,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            stagger: 0.08,
          },
          '<+=0.15',
        );

        ScrollTrigger.create({
          trigger: panel,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            setActiveSection(i);
            window.globeTargetDirection = i % 2 === 0 ? -1 : 1;
            tl.play(0);
          },
          onEnterBack: () => {
            setActiveSection(i);
            window.globeTargetDirection = i % 2 === 0 ? -1 : 1;
            tl.play(0);
          },
          onLeave: () => {
            window.globeTargetDirection = 0;
          },
          onLeaveBack: () => {
            window.globeTargetDirection = 0;
          },
        });
      });

      const destinationCards = gsap.utils.toArray('.destination-card');

      destinationCards.forEach((card, i) => {
        const panel = card.closest('.destination-section');
        if (!panel) return;
        const revealEls = panel.querySelectorAll('.destination-reveal');

        gsap.set(card, {
          opacity: 0,
          y: 60,
          scale: 1,
          xPercent: -50,
        });
        gsap.set(revealEls, { opacity: 0, y: 18 });

        // Entering a destination panel is enough to launch the full card
        // reveal and Mapbox flight. The animation is no longer scrubbed by
        // continued wheel/touch movement.
        const revealCard = () => {
          setActiveSection(sections.length + i);
          setActiveJourneyIndex(i);
          setDestinationTourState(i);
          setDestinationReadySet((prev) => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          });

          gsap.killTweensOf([card, ...revealEls]);
          gsap.set(revealEls, { opacity: 0, y: 18 });
          gsap.to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.34,
            ease: 'power2.out',
            overwrite: true,
          });
          gsap.to(revealEls, {
            opacity: 1,
            y: 0,
            duration: 0.46,
            ease: 'power2.out',
            stagger: 0.04,
            overwrite: true,
          });
        };

        const hideCard = (y = -24) => {
          setDestinationReadySet((prev) => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          });
          gsap.killTweensOf([card, ...revealEls]);
          gsap.to(card, {
            opacity: 0,
            y,
            scale: 1,
            duration: 0.24,
            ease: 'power2.in',
            overwrite: true,
          });
          gsap.to(revealEls, {
            opacity: 0,
            y: y < 0 ? -18 : 18,
            duration: 0.24,
            ease: 'power2.in',
            overwrite: true,
          });
        };

        // Short pin so each landmark behaves as a discrete page.
        // The wheel/touch handler below auto-snaps to the next landmark
        // after a single scroll input.
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=10%',
          pin: true,
          anticipatePin: 1,
          onEnter: revealCard,
          onEnterBack: revealCard,
          onLeave: () => hideCard(-24),
          onLeaveBack: () => {
            hideCard(40);
            if (i === 0) {
              window.destinationTourActive = false;
              setActiveJourneyIndex(-1);
            } else {
              setDestinationTourState(i - 1);
              setActiveJourneyIndex(i - 1);
            }
          },
        });
      });
    }, containerRef);

    return () => {
      ctx.revert();
      window.romeModeActive = false;
      window.destinationTourActive = false;
      window.projectsFinaleUnlocked = false;
      document.body.classList.remove('in-projects-finale');
    };
  }, []);

  /* -- Per-destination reveal waits for the Cesium camera to settle -- */
  useEffect(() => {
    if (activeJourneyIndex < 0) return undefined;

    const currentIndex = activeJourneyIndex;

    // Already revealed — nothing to do.
    if (destinationReadySet.has(currentIndex)) {
      return undefined;
    }

    let cancelled = false;
    let revealed = false;
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

    const revealDestination = () => {
      if (cancelled || revealed) return;
      revealed = true;
      clearStableTimer();
      if (rafId) window.cancelAnimationFrame(rafId);
      setDestinationReadySet((prev) => new Set(prev).add(currentIndex));
    };

    // Reduced motion: camera jumps instantly, reveal immediately.
    if (reducedMotion) {
      revealDestination();
      return undefined;
    }

    const checkCameraSettled = () => {
      if (cancelled || revealed) return;

      if (window.codexDestinationFlying) {
        clearStableTimer();
      } else if (!stableTimer) {
        stableTimer = window.setTimeout(revealDestination, REVEAL_STABLE_MS);
      }

      rafId = window.requestAnimationFrame(checkCameraSettled);
    };

    entryTimer = window.setTimeout(checkCameraSettled, REVEAL_ENTRY_BUFFER_MS);
    fallbackTimer = window.setTimeout(revealDestination, REVEAL_FALLBACK_MS);

    return () => {
      cancelled = true;
      if (entryTimer) window.clearTimeout(entryTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      clearStableTimer();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [activeJourneyIndex, destinationReadySet]);

  /* ── 1-scroll auto-advance between all content panels ───── */
  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    let isSnapping = false;
    let cooldownTimer = null;
    let touchStartY = null;
    let lastWheelTime = 0;

    const releaseLock = (delay = 220) => {
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        isSnapping = false;
        const lenis = window.codexLenis;
        if (lenis?.start) lenis.start();
      }, delay);
    };

    const findCurrentPanelIdx = (panels) => {
      // Use viewport-relative geometry — element.offsetTop is broken for
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

      // Above the first panel scrolling up — release to native scroll.
      if (currentIdx === -1 && direction < 0) return false;

      const targetIdx = currentIdx === -1 ? 0 : currentIdx + direction;

      // Above the first panel scrolling up — release to native scroll.
      if (targetIdx < 0) return false;
      // At or past the last panel scrolling down — block the wheel event so
      // the user stays parked at the final landmark (WTC). Returning true
      // tells handleWheel to call preventDefault and stop the scroll.
      if (targetIdx >= panels.length) return true;

      const target = panels[targetIdx];
      if (!target) return false;

      isSnapping = true;

      // Defensive fallback: even with the isStopped check above, if Lenis
      // ever fails to fire onComplete (e.g. scroll target equals current
      // position), unstick the lock after the snap duration + buffer.
      const fallbackTimer = setTimeout(() => {
        isSnapping = false;
      }, 3000);

      if (lenis?.scrollTo) {
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          lock: true,
          onComplete: () => {
            clearTimeout(fallbackTimer);
            releaseLock(220);
          },
        });
      } else {
        clearTimeout(fallbackTimer);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        releaseLock(1500);
      }

      return true;
    };

    // CAPTURE PHASE — must fire BEFORE Lenis's bubble-phase listener,
    // otherwise Lenis's preventDefault locks the wheel event out of reach.
    const handleWheel = (e) => {
      // Block scroll while a snap is mid-flight OR while the map camera
      // is still flying — overlapping inputs cause flyTo cancellations
      // that read as a double-jump transition.
      if (isSnapping || window.codexDestinationFlying) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      const now = performance.now();
      // One trackpad gesture fires many wheel events; treat the burst as one.
      if (now - lastWheelTime < 120) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      if (Math.abs(e.deltaY) < 4) return;

      lastWheelTime = now;
      const direction = e.deltaY > 0 ? 1 : -1;
      const consumed = snapToPanel(direction);

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
      if (isSnapping || window.codexDestinationFlying) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      const delta = touchStartY - e.touches[0].clientY;
      if (Math.abs(delta) < 4) return;

      const direction = delta > 0 ? 1 : -1;
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
      snapToPanel(direction);
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
    };
  }, []);

  /* ── Smooth scrollTo for side-nav clicks ────────────────── */
  const scrollToElement = useCallback((target, offsetY = 0) => {
    const lenis = lenisRef?.current || window.codexLenis;
    if (lenis?.scrollTo) {
      lenis.scrollTo(target, {
        offset: -offsetY,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      return;
    }

    gsap.to(window, {
      duration: 1.2,
      scrollTo: { y: target, offsetY },
      ease: 'power3.inOut',
    });
  }, [lenisRef]);

  const scrollTo = useCallback((index) => {
    const panels = document.querySelectorAll('.panel-section');
    if (panels[index]) {
      scrollToElement(panels[index], window.innerHeight * 0.15);
    }
  }, [scrollToElement]);

  const scrollToJourney = useCallback((index) => {
    const target = document.getElementById(`destination-${destinations[index]?.id}`);

    if (target) {
      scrollToElement(target, 0);
      setIsJourneyMenuOpen(false);
    }
  }, [scrollToElement]);

  const scrollToProjectsFinale = useCallback(() => {
    const target = document.getElementById('projects-finale');
    if (target) {
      window.projectsFinaleUnlocked = true;
      window.dispatchEvent(new Event('projectsFinaleUnlock'));
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => scrollToElement(target, 0));
      });
    }
  }, [scrollToElement]);

  const journeyNavActive = activeSection >= sections.length;
  const reducedMotionPreferred =
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="main-scroller relative z-10 w-full pointer-events-none font-sans"
    >


      {/* ─── MOBILE NAV (bottom bar) ─── */}
      <nav
        className="fixed bottom-6 left-6 right-6 z-50 flex gap-1.5 overflow-x-auto rounded-lg border border-white/5 bg-black/60 p-1.5 backdrop-blur-2xl pointer-events-auto lg:hidden shadow-2xl"
        aria-label="Mobile section navigation"
      >
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`min-w-max rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
              activeSection === i
                ? 'border-primary/50 bg-primary/10 text-white'
                : 'border-white/5 bg-white/5 text-muted'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.navLabel}`}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </nav>

      <nav
        className={`fixed right-8 top-1/2 z-50 hidden w-64 -translate-y-1/2 flex-col gap-1 rounded border border-white/5 bg-black/40 p-3 shadow-2xl backdrop-blur-2xl transition-opacity duration-300 pointer-events-auto lg:flex ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Destination index"
      >
        <div className="mb-3 px-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted border-b border-white/5 pb-2">
          Global Registry
        </div>
        {journeyNavItems.map((item, i) => {
          const isActive = activeJourneyIndex === i;
          const isPast = activeJourneyIndex > i;

          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => scrollToJourney(i)}
              className={`group relative flex cursor-pointer items-center gap-4 rounded px-2 py-2 text-left transition-all duration-200 ${
                isActive ? 'bg-white/5 text-white' : 'text-muted hover:bg-white/10 hover:text-white'
              }`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Jump to ${item.name}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-primary shadow-[0_0_10px_var(--color-primary)] scale-125'
                    : isPast
                      ? 'bg-primary/40'
                      : 'bg-white/20'
                }`}
                aria-hidden="true"
              />
              <span className="truncate font-mono text-[9px] uppercase tracking-[0.15em]">
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setIsJourneyMenuOpen(true)}
        className={`fixed right-6 top-24 z-50 cursor-pointer rounded border border-white/10 bg-black/60 p-3 text-white shadow-xl backdrop-blur-2xl transition-opacity duration-300 lg:hidden ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Open destination index"
        aria-expanded={isJourneyMenuOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isJourneyMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/95 p-8 backdrop-blur-3xl pointer-events-auto lg:hidden">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.4em] text-white">
              Data Index
            </h2>
            <button
              type="button"
              onClick={() => setIsJourneyMenuOpen(false)}
              className="cursor-pointer rounded border border-white/10 p-2 text-muted hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
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
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded border px-5 py-4 text-left transition-all ${
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-white'
                      : 'border-white/5 bg-white/5 text-muted'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[10px] uppercase tracking-[0.2em]">
                      {item.name}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── HERO SPACER (initial view before first section) ─── */}
      <div className="h-[70vh]" aria-hidden="true" />

      {/* ─── SECTION PANELS ───
          Editorial typography over the live globe. Headline anchors
          to the outer edge (same side as the existing pingpong-card
          slot); microcopy sits at the opposite-bottom corner near the
          globe. The globe tilt (window.globeTargetDirection) is
          unchanged — only the type layout was redesigned. */}
      {sections.map((sec, index) => {
        const side = cardSide(index);
        // Headline anchors outer edge; microcopy anchors opposite edge (near globe).
        const headlinePos = side === 'right' ? 'right-[6vw]' : 'left-[6vw]';
        const microcopyPos = side === 'right' ? 'left-[6vw]' : 'right-[6vw]';
        const headlineAlign = side === 'right' ? 'text-right' : 'text-left';
        const indentProp = side === 'right' ? 'paddingRight' : 'paddingLeft';

        return (
          <section
            id={sec.id}
            key={sec.id}
            className="panel-section relative w-full overflow-visible"
            style={{ minHeight: '100vh' }}
            aria-labelledby={`${sec.id}-title`}
          >
            <div
              className="pingpong-card pointer-events-none absolute inset-0 z-20"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Huge editorial headline — top, outer edge */}
              <h2
                id={`${sec.id}-title`}
                className={`stagger-item pointer-events-auto absolute top-[14vh] ${headlinePos} max-w-[88vw] font-sans font-light text-white leading-[0.92] tracking-[-0.04em] ${headlineAlign}`}
                style={{ fontSize: 'clamp(56px, 11vw, 220px)' }}
              >
                {sec.headlineLines.map((line, i) => {
                  const isLast = i === sec.headlineLines.length - 1;
                  return (
                    <span
                      key={`${sec.id}-line-${i}`}
                      className="block"
                      style={{ [indentProp]: `${i}ch` }}
                    >
                      {line}
                      {isLast && <span className="text-[#FF3B30]">.</span>}
                    </span>
                  );
                })}
              </h2>

              {/* Microcopy block — bottom, opposite edge (near globe).
                  Always text-left (ragged-right) regardless of which corner
                  it lives in — matches the editorial reference. */}
              <div
                className={`stagger-item pointer-events-auto absolute bottom-[10vh] ${microcopyPos} flex w-[88vw] max-w-[300px] flex-col gap-4 text-left`}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/60">
                  {String(index + 1).padStart(2, '0')} — {sec.navLabel}
                </span>
                <p className="text-[12px] leading-[1.55] text-white sm:text-[13px]">
                  {sec.summary}
                </p>
                <a
                  href="#destination-colosseum"
                  className="self-start font-sans text-[11px] text-white underline underline-offset-[5px] decoration-white/60 transition-colors hover:decoration-white"
                >
                  Archive Index
                </a>
              </div>
            </div>
          </section>
        );
      })}

      {destinations.map((destination, i) => {
        const isFinalDestination = destination.id === FINAL_DESTINATION_ID;
        const isReady = reducedMotionPreferred || destinationReadySet.has(i);
        const isFinalDestinationVisible = isFinalDestination && isReady;

        return (
          // Scroll-target section for each landmark. The visible content is the
          // LandmarkTitleCard overlay (Google Earth-style title + era range).
          // The invisible .destination-card div is kept as GSAP's index target
          // for the existing reveal/hide ScrollTrigger logic.
          <section
            id={`destination-${destination.id}`}
            key={destination.id}
            className="destination-section panel-section relative w-full overflow-visible"
            style={{ minHeight: '100vh' }}
          >
            <LandmarkTitleCard
              destination={destination}
              deferReveal
              ready={isReady}
            />
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
                  className="cursor-pointer rounded border border-white/20 bg-white px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-black shadow-[0_18px_45px_rgba(0,0,0,0.35)] outline-none transition-colors duration-200 hover:border-white/70 hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Go to articles
                </button>
              </div>
            )}
            <div
              className="destination-card pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
              style={{ willChange: 'transform, opacity', transform: 'translateX(-50%)' }}
              aria-hidden="true"
            />
          </section>
        );
      })}

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
