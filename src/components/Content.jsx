import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

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
export default function Content() {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(-1);

  /* ── ScrollTrigger wiring ─────────────────────────────────
     NO pin. NO scrub. Pure callback-driven timelines.
     ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.pingpong-card');

      cards.forEach((card, i) => {
        const panel = card.closest('.panel-section');
        if (!panel) return;

        /* — Initial state: card hidden off-screen on its anchor side — */
        const side = cardSide(i);
        gsap.set(card, {
          opacity: 0,
          x: side === 'right' ? 80 : -80,
        });

        /* — Build a rapid fire-and-forget timeline — */
        const enterTL = gsap.timeline({ paused: true });

        /* Card slides in */
        enterTL.to(card, {
          opacity: 1,
          x: 0,
          duration: 0.55,
          ease: 'power3.out',
        });

        /* Micro-stagger inner typography */
        const staggerEls = card.querySelectorAll('.stagger-item');
        enterTL.fromTo(
          staggerEls,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power3.out',
            stagger: 0.05,
          },
          0.1, // slight overlap with card entrance
        );

        /* — Build the exit timeline (reverse direction) — */
        const exitTL = gsap.timeline({ paused: true });
        exitTL.to(card, {
          opacity: 0,
          x: side === 'right' ? 50 : -50,
          duration: 0.35,
          ease: 'power2.in',
        });

        /* — ScrollTrigger: toggleActions fires timelines — */
        ScrollTrigger.create({
          trigger: panel,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => {
            exitTL.pause(0);
            enterTL.restart();
            setActiveSection(i);
          },
          onEnterBack: () => {
            exitTL.pause(0);
            enterTL.restart();
            setActiveSection(i);
          },
          onLeave: () => {
            enterTL.pause();
            exitTL.restart();
          },
          onLeaveBack: () => {
            enterTL.pause();
            exitTL.restart();
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  /* ── Smooth scrollTo for side-nav clicks ────────────────── */
  const scrollTo = useCallback((index) => {
    const panels = document.querySelectorAll('.panel-section');
    if (panels[index]) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: panels[index], offsetY: window.innerHeight * 0.15 },
        ease: 'power3.inOut',
      });
    }
  }, []);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="main-scroller relative z-10 w-full pointer-events-none font-sans"
    >
      {/* ─── SIDE NAV (Desktop — right-aligned, 01-05 tracker) ─── */}
      <nav
        className="fixed right-5 top-1/2 z-50 hidden w-48 -translate-y-1/2 flex-col gap-2 pointer-events-auto lg:flex"
        aria-label="Section navigation"
      >
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`grid grid-cols-[2rem_1fr] items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
              activeSection === i
                ? 'border-[#0A6ED3]/70 bg-[#0A6ED3]/20 text-white scale-105'
                : 'border-white/10 bg-black/35 text-gray-400 hover:border-white/30 hover:bg-white/10 hover:text-white'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.title}`}
          >
            <span className="text-[0.65rem] text-[#7DB7F0]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="truncate">{sec.navLabel}</span>
          </button>
        ))}
      </nav>

      {/* ─── MOBILE NAV (bottom bar) ─── */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/70 p-2 backdrop-blur-xl pointer-events-auto lg:hidden"
        aria-label="Mobile section navigation"
      >
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`min-w-max rounded-md border px-3 py-2 text-xs uppercase tracking-[0.14em] transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
              activeSection === i
                ? 'border-[#0A6ED3]/70 bg-[#0A6ED3]/20 text-white'
                : 'border-white/10 bg-white/5 text-gray-400'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.title}`}
          >
            {String(i + 1).padStart(2, '0')} {sec.navLabel}
          </button>
        ))}
      </nav>

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

      {/* ─── FOOTER SPACER ─── */}
      <div className="h-[40vh]" aria-hidden="true" />
    </div>
  );
}
