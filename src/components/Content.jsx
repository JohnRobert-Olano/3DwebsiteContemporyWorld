import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { destinations, journeyNavItems } from '../lib/data/destinations';

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
const ROME_NAV = { id: 'rome', navLabel: 'Rome Intro' };

const setDestinationTourState = (index, progress) => {
  window.destinationTourActive = true;
  window.destinationTourState = {
    index,
    progress,
  };
};

const buildLabelFor = (destination) => {
  if (destination.id === 'world-trade-center-nyc') return 'Rebuilt';
  if (destination.built === 'Natural island') return 'Type';
  return 'Built';
};

export default function Content({ lenisRef }) {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(-1);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(-1);
  const [isJourneyMenuOpen, setIsJourneyMenuOpen] = useState(false);

  /* ── ScrollTrigger wiring ───────────────────────────────── */
  useEffect(() => {
    window.romeModeActive = false;
    window.romeScrollProgress = 0;
    window.destinationTourActive = false;
    window.destinationTourState = { index: 0, progress: 0 };

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
        gsap.set(card, {
          opacity: 0,
          x: side === 'right' ? 100 : -100,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: 'top top',
            end: '+=150%',
            scrub: 1,
            pin: true,
            onEnter: () => {
              setActiveSection(i);
              window.globeTargetDirection = i % 2 === 0 ? -1 : 1;
            },
            onEnterBack: () => {
              setActiveSection(i);
              window.globeTargetDirection = i % 2 === 0 ? -1 : 1;
            },
            onLeave: () => {
              window.globeTargetDirection = 0;
            },
            onLeaveBack: () => {
              window.globeTargetDirection = 0;
            },
          },
        });

        tl.to(card, {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power2.out',
        });

        const staggerEls = card.querySelectorAll('.stagger-item');
        tl.fromTo(
          staggerEls,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: 'power2.out',
            stagger: 0.5,
          },
          '<+=0.5',
        );

        tl.to({}, { duration: 1.5 });

        tl.to(card, {
          opacity: 0,
          x: side === 'right' ? 50 : -50,
          duration: 1,
          ease: 'power2.in',
        });
      });

      // Rome — pinned section that scrub-drives the Mapbox camera flight
      const romeIndex = sections.length;
      ScrollTrigger.create({
        trigger: '.rome-section',
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1,
        onEnter: () => {
          setActiveSection(romeIndex);
          setActiveJourneyIndex(0);
          window.romeModeActive = true;
          window.destinationTourActive = false;
          window.globeTargetDirection = 0;
        },
        onEnterBack: () => {
          setActiveSection(romeIndex);
          setActiveJourneyIndex(0);
          window.romeModeActive = true;
          window.destinationTourActive = false;
          window.globeTargetDirection = 0;
        },
        onUpdate: (self) => {
          window.romeScrollProgress = self.progress;
        },
        onLeave: () => {
          window.romeModeActive = false;
          window.romeScrollProgress = 0;
        },
        onLeaveBack: () => {
          window.romeModeActive = false;
          window.romeScrollProgress = 0;
        },
      });

      // Fade the "Rome" title out as the camera descends so it doesn't obscure the Colosseum
      gsap.to('.rome-title-wrapper', {
        opacity: 0,
        y: -40,
        scrollTrigger: {
          trigger: '.rome-section',
          start: 'top top',
          end: '+=180%',
          scrub: 1,
        },
      });

      const destinationCards = gsap.utils.toArray('.destination-card');

      destinationCards.forEach((card, i) => {
        const panel = card.closest('.destination-section');
        if (!panel) return;

        gsap.set(card, {
          opacity: 0,
          y: 60,
          xPercent: -50,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: 'top top',
            end: '+=180%',
            scrub: 1,
            pin: true,
            onEnter: () => {
              setActiveSection(romeIndex + i + 1);
              setActiveJourneyIndex(i + 1);
              window.romeModeActive = false;
              setDestinationTourState(i, 0);
            },
            onEnterBack: () => {
              setActiveSection(romeIndex + i + 1);
              setActiveJourneyIndex(i + 1);
              window.romeModeActive = false;
              setDestinationTourState(i, 1);
            },
            onUpdate: (self) => {
              setDestinationTourState(i, self.progress);
            },
            onLeave: () => {
              setDestinationTourState(i, 1);
            },
            onLeaveBack: () => {
              if (i === 0) {
                window.destinationTourActive = false;
                setActiveJourneyIndex(0);
              } else {
                setDestinationTourState(i - 1, 1);
                setActiveJourneyIndex(i);
              }
            },
          },
        });

        tl.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
        });

        tl.fromTo(
          card.querySelectorAll('.destination-reveal'),
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 1.35,
            ease: 'power2.out',
            stagger: 0.24,
          },
          '<+=0.35',
        );

        tl.to({}, { duration: 1.1 });

        tl.to(card, {
          opacity: 0,
          y: -40,
          duration: 0.75,
          ease: 'power2.in',
        });
      });
    }, containerRef);

    return () => {
      ctx.revert();
      window.romeModeActive = false;
      window.destinationTourActive = false;
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
    const target =
      index === 0
        ? document.getElementById('rome')
        : document.getElementById(`destination-${destinations[index - 1]?.id}`);

    if (target) {
      scrollToElement(target, 0);
      setIsJourneyMenuOpen(false);
    }
  }, [scrollToElement]);

  const journeyNavActive = activeSection >= sections.length;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="main-scroller relative z-10 w-full pointer-events-none font-sans"
    >


      {/* ─── MOBILE NAV (bottom bar) ─── */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/70 p-2 backdrop-blur-xl pointer-events-auto lg:hidden"
        aria-label="Mobile section navigation"
      >
        {[...sections, ROME_NAV].map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`min-w-max rounded-md border px-3 py-2 text-xs uppercase tracking-[0.14em] transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
              activeSection === i
                ? 'border-[#0A6ED3]/70 bg-[#0A6ED3]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-400'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.navLabel}`}
          >
            {String(i + 1).padStart(2, '0')} {sec.navLabel}
          </button>
        ))}
      </nav>

      <nav
        className={`fixed right-4 top-1/2 z-50 hidden w-56 -translate-y-1/2 flex-col gap-1 rounded-lg border border-white/10 bg-black/55 p-2 shadow-2xl backdrop-blur-xl transition-opacity duration-300 pointer-events-auto lg:flex ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Destination index"
      >
        {journeyNavItems.map((item, i) => {
          const isActive = activeJourneyIndex === i;
          const isPast = activeJourneyIndex > i;

          return (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => scrollToJourney(i)}
              className={`group relative flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
                isActive ? 'bg-[#0A6ED3]/18 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Jump to ${item.name}`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-all duration-200 ${
                  isActive
                    ? 'scale-125 border-[#7DB7F0] bg-[#7DB7F0] shadow-[0_0_14px_rgba(125,183,240,0.8)]'
                    : isPast
                      ? 'border-[#7DB7F0]/40 bg-[#7DB7F0]/45'
                      : 'border-white/35 bg-transparent'
                }`}
                aria-hidden="true"
              />
              <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em]">
                {item.name}
              </span>
              <span className="pointer-events-none absolute right-full top-1/2 mr-3 max-w-52 -translate-y-1/2 rounded-md border border-white/10 bg-black/80 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-200 group-hover:opacity-100">
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setIsJourneyMenuOpen(true)}
        className={`fixed right-4 top-24 z-50 cursor-pointer rounded-full border border-white/10 bg-black/65 p-3 text-white shadow-xl backdrop-blur-xl transition-opacity duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] lg:hidden ${
          journeyNavActive ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Open destination index"
        aria-expanded={isJourneyMenuOpen}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {isJourneyMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/90 p-5 backdrop-blur-xl pointer-events-auto lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans text-sm font-bold uppercase tracking-[0.22em] text-white">
              World Tour
            </h2>
            <button
              type="button"
              onClick={() => setIsJourneyMenuOpen(false)}
              className="cursor-pointer rounded-full border border-white/10 p-2 text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3]"
              aria-label="Close destination index"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="mt-8 grid gap-2">
            {journeyNavItems.map((item, i) => {
              const isActive = activeJourneyIndex === i;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToJourney(i)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
                    isActive
                      ? 'border-[#0A6ED3]/70 bg-[#0A6ED3]/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray-500">
                      {item.location}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[#7DB7F0]">
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

      {/* ─── SECTION PANELS ─── */}
      {sections.map((sec, index) => {
        const side = cardSide(index);
        /* Card anchor: absolute position on the correct side */
        const positionClasses =
          side === 'right'
            ? 'right-0 mr-[4vw] lg:mr-[6vw]'
            : 'left-0 ml-[4vw] lg:ml-[6vw]';

        return (
          <section
            id={sec.id}
            key={sec.id}
            className="panel-section relative w-full overflow-visible"
            style={{ minHeight: '100vh' }}
            aria-labelledby={`${sec.id}-title`}
          >
            {/* Card wrapper — absolute so cards cross-fade without layout shift */}
            <div
              className={`pingpong-card pointer-events-auto absolute top-[12vh] ${positionClasses} z-20 box-border w-[90vw] max-w-[26rem] sm:max-w-xl`}
              style={{ willChange: 'transform, opacity' }}
            >
              <article className="rounded-lg border border-[#0A6ED3]/30 bg-black/60 p-5 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10">
                {/* Section label */}
                <div className="stagger-item mb-4 flex flex-wrap items-center gap-3 sm:mb-5">
                  <span className="rounded-md border border-[#0A6ED3]/50 bg-[#0A6ED3]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                    Section {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    {sec.subTitle}
                  </span>
                </div>

                {/* Title */}
                <h2
                  id={`${sec.id}-title`}
                  className="stagger-item font-sans text-3xl font-bold uppercase leading-none tracking-normal text-white drop-shadow-lg sm:text-5xl md:text-6xl"
                >
                  {sec.title}
                </h2>

                {/* Summary */}
                <p className="stagger-item mt-4 max-w-prose break-words text-sm leading-6 text-gray-200 drop-shadow-sm sm:mt-5 md:text-lg md:leading-7">
                  {sec.summary}
                </p>

                {/* Divider + Points */}
                <div className="stagger-item mt-6 grid gap-4 border-t border-white/10 pt-5 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:pt-6">
                  {sec.points.map((point) => (
                    <div key={point.label}>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                        {point.label}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-gray-300">
                        {point.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Divider + Example */}
                <div className="stagger-item mt-5 border-t border-white/10 pt-4 sm:mt-6 sm:pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    In practice
                  </h3>
                  <p className="mt-2 break-words text-sm leading-6 text-gray-300">
                    {sec.example}
                  </p>
                </div>
              </article>
            </div>
          </section>
        );
      })}

      {/* ─── ROME SECTION — pinned, scroll-scrubs the camera flight ─── */}
      <section
        id="rome"
        className="rome-section panel-section relative w-full overflow-visible"
        style={{ minHeight: '100vh' }}
        aria-labelledby="rome-title"
      >
        <div className="rome-title-wrapper absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
          <span className="rounded-md border border-[#0A6ED3]/50 bg-[#0A6ED3]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0] drop-shadow-lg">
            Final Destination
          </span>
          <h2
            id="rome-title"
            className="mt-5 font-sans text-5xl font-bold uppercase tracking-normal text-white drop-shadow-2xl sm:text-7xl md:text-8xl"
          >
            Rome
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-gray-300 sm:text-base">
            Scroll to descend through the atmosphere
          </p>
        </div>
      </section>

      {destinations.map((destination, index) => {
        const stopNumber = String(index + 1).padStart(2, '0');

        return (
          <section
            id={`destination-${destination.id}`}
            key={destination.id}
            className="destination-section panel-section relative w-full overflow-visible"
            style={{ minHeight: '100vh' }}
            aria-labelledby={`${destination.id}-title`}
          >
            <div
              className="destination-card pointer-events-auto absolute bottom-6 left-1/2 z-20 box-border w-[min(92vw,44rem)] max-h-[44vh] overflow-y-auto sm:bottom-8 sm:max-h-[42vh] lg:bottom-10 lg:max-h-[36vh] lg:w-[min(78vw,46rem)] xl:w-[min(64vw,52rem)]"
              style={{ willChange: 'transform, opacity', transform: 'translateX(-50%)' }}
            >
              <article className="rounded-lg border border-[#0A6ED3]/30 bg-black/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5 lg:p-6">
                <div className="destination-reveal flex flex-wrap items-center gap-3">
                  <span className="rounded-md border border-[#0A6ED3]/50 bg-[#0A6ED3]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                    Destination {stopNumber}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {destination.location}
                  </span>
                </div>

                <h2
                  id={`${destination.id}-title`}
                  className="destination-reveal mt-4 font-sans text-2xl font-bold uppercase leading-none tracking-normal text-white drop-shadow-lg sm:text-3xl lg:text-4xl"
                >
                  {destination.name}
                </h2>

                <dl className="destination-reveal mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                      {buildLabelFor(destination)}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-200">
                      {destination.built}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                      Location
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-200">
                      {destination.location}
                    </dd>
                  </div>
                </dl>

                <p className="destination-reveal mt-4 break-words text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">
                  {destination.about}
                </p>

                <div className="destination-reveal mt-5 border-t border-white/10 pt-4">
                  <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Significance
                  </h3>
                  <p className="mt-2 break-words text-sm leading-6 text-gray-300">
                    {destination.significance}
                  </p>
                </div>
              </article>
            </div>
          </section>
        );
      })}

      {/* ─── FOOTER SPACER ─── */}
      <div className="footer-spacer h-[60vh]" aria-hidden="true" />
    </div>
  );
}
