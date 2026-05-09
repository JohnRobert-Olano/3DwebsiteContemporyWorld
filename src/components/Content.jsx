import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const sections = [
  {
    id: 'culture',
    navLabel: 'Culture',
    title: 'Culture',
    subTitle: 'The Global Village',
    summary: 'Culture moves through music, language, food, art, film, and daily habits. Globalization lets people adopt, adapt, and exchange cultural expression beyond their own society.',
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
    example: 'K-pop, Japanese anime, Hollywood films, and English as a common business language all show culture becoming both local and global.',
  },
  {
    id: 'economy',
    navLabel: 'Economy',
    title: 'Economy',
    subTitle: 'The Engine',
    summary: 'Economic globalization links national economies through trade, investment, supply chains, and financial markets into one interdependent system.',
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
    example: 'A car assembled in Germany may rely on Brazilian steel, Taiwanese microchips, Malaysian rubber, and global logistics.',
  },
  {
    id: 'environment',
    navLabel: 'Environment',
    title: 'Environment',
    subTitle: 'The Shared Home',
    summary: 'Environmental globalization shows that air, oceans, climate, and biodiversity ignore political borders, making ecological problems shared problems.',
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
    example: 'Carbon emissions in industrialized countries can raise sea levels that threaten Pacific Island communities.',
  },
  {
    id: 'politics',
    navLabel: 'Politics',
    title: 'Politics',
    subTitle: 'The Rules of the Game',
    summary: 'Political globalization creates institutions, treaties, and agreements for cooperation, negotiation, and dispute resolution.',
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
    example: 'The Paris Climate Agreement, UN peacekeeping missions, and WTO trade rulings are all political globalization in action.',
  },
  {
    id: 'technology',
    navLabel: 'Technology',
    title: 'Technology',
    subTitle: 'The Nervous System',
    summary: 'Technology provides the networks and tools that let information, money, goods, services, and people coordinate across distance almost instantly.',
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
    example: 'A video call across continents or an instant remittance payment are everyday examples of technological globalization.',
  },
];

export default function Content() {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.panel-section');

      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveSection(i),
          onEnterBack: () => setActiveSection(i),
        });

        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=350%',
          pin: true,
          pinSpacing: true,
        });

        const elements = panel.querySelectorAll('.anim-element');

        gsap.fromTo(
          elements,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: panel,
              start: 'top bottom',
              end: 'top top',
              scrub: 1,
            },
          },
        );

        gsap.to(elements, {
          opacity: 0,
          y: -30,
          ease: 'power2.in',
          stagger: 0.1,
          scrollTrigger: {
            trigger: panel,
            start: '+=300%',
            end: '+=350%',
            scrub: 1,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollTo = (index) => {
    const panels = document.querySelectorAll('.panel-section');

    if (panels[index]) {
      const trigger = ScrollTrigger.getAll().find((t) => t.pin === panels[index]);
      const targetPos = trigger ? trigger.start : panels[index].offsetTop;
      gsap.to(window, { duration: 1.5, scrollTo: targetPos, ease: 'power3.inOut' });
    }
  };

  return (
    <div ref={containerRef} className="main-scroller relative z-10 w-full pointer-events-none font-sans">
      <nav
        className="fixed right-5 top-1/2 z-50 hidden w-48 -translate-y-1/2 flex-col gap-2 pointer-events-auto lg:flex"
        aria-label="Section navigation"
      >
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`grid grid-cols-[2rem_1fr] items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs uppercase tracking-[0.16em] transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3] ${
              activeSection === i
                ? 'border-[#0A6ED3]/70 bg-[#0A6ED3]/20 text-white'
                : 'border-white/10 bg-black/35 text-gray-400 hover:border-white/30 hover:bg-white/10 hover:text-white'
            }`}
            aria-current={activeSection === i ? 'step' : undefined}
            aria-label={`Jump to ${sec.title}`}
          >
            <span className="text-[0.65rem] text-[#7DB7F0]">{String(i + 1).padStart(2, '0')}</span>
            <span className="truncate">{sec.navLabel}</span>
          </button>
        ))}
      </nav>

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

      {sections.map((sec, index) => {
        const panelPosition = index % 2 === 0
          ? 'md:justify-end md:pr-[8vw] lg:pr-64'
          : 'md:justify-start md:pl-[8vw]';

        return (
          <section
            id={sec.id}
            key={sec.id}
            className={`panel-section min-h-screen w-full overflow-hidden flex items-start justify-start px-4 pb-28 pt-28 sm:px-8 md:items-center md:pt-32 lg:pb-20 ${panelPosition}`}
            aria-labelledby={`${sec.id}-title`}
          >
            <article className="card-content pointer-events-auto box-border w-full max-w-[22rem] rounded-lg border border-[#0A6ED3]/30 bg-black/55 p-5 shadow-2xl backdrop-blur-md sm:max-w-xl sm:p-8 md:p-10">
              <div className="anim-element mb-4 flex flex-wrap items-center gap-3 sm:mb-5">
                <span className="rounded-md border border-[#0A6ED3]/50 bg-[#0A6ED3]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                  Section {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {sec.subTitle}
                </span>
              </div>

              <h2
                id={`${sec.id}-title`}
                className="anim-element font-sans text-3xl font-bold uppercase leading-none tracking-normal text-white drop-shadow-lg sm:text-5xl md:text-6xl"
              >
                {sec.title}
              </h2>

              <p className="anim-element mt-4 max-w-prose break-words text-sm leading-6 text-gray-200 drop-shadow-sm sm:mt-5 md:text-lg md:leading-7">
                {sec.summary}
              </p>

              <div className="anim-element mt-6 grid gap-4 border-t border-white/10 pt-5 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:pt-6">
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

              <div className="anim-element mt-5 border-t border-white/10 pt-4 sm:mt-6 sm:pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  In practice
                </h3>
                <p className="mt-2 break-words text-sm leading-6 text-gray-300">
                  {sec.example}
                </p>
              </div>
            </article>
          </section>
        );
      })}
    </div>
  );
}
