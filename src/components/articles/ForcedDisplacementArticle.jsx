import { useCallback, useEffect, useRef, useState } from 'react';

const images = {
  gaza:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB4QvPWqdslFZCjelydROE_hJ-2ARj7pFi27LTWWuOT2hIUic6ts66onsCyWaZ0qkiVr5hRzEF9LgSMzMSnvwesNM6WSUjyByPE6K2WIQHVT6nZFjzJ2XG02XokNHFg4ma33d48_jsPZspDJim1vFX5UAKDSumBrTqE7j7mXJNoH7uj04MPiA51dVy2mYA5q8RzatZvv6cncAQyx-xvFIDAmrOdANw4pcx8GDG7X9uAMUV1PoJoQGeqP20OjnRYmt4thgZSviFiT_R9',
  sudan:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCUXlz-gWkNS_8GLBIC0DF5z5GPj6L7vH-X_5zDgPJCQeLY6C4HhJQDxyk9-DPvsM7sra4Tscmn3FXtHaoWJBiTDbDxjNpwV6QpLy5vQN8JZIqDWJaMK2_bQ_3wrlf7e5FT1QSY9R0BRxzjpY75uD-a1atiKzh_YUOVMEqOpnTt_-DbVEaDzWWp0RRxmFv9XUwRjvIC31zApedliEssyIfNLmIofiOJ19Jlzm-O6PSuUwujrlj9uXPqFUJN0UB2L5cR_Zxyd05I1Ds0',
  ukraine:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCY2cvjASMUXEiRWN7OHUlwlDYeEx4sA2UWxnnlE8wuyRew6vfZKUT7y-SUBdL91hUgBxcvFEYR82-dVmLMPzcCwfCX-drwNzPs83iuy8hDAqhAYs0fIyxd3BOYl7lFvBYpRoldsKTlCN8wCgaKplg_UYzeMwZEvN2WQohSSPcU9ZExKljOo0tI_6rpNlgsNBATA3bg_NaQx1TPc-4fLD0qZzn4gRjig6Q3n7WfHoNqcuOfYnbUaH27xPMn0vb7wBAneHIxPqWRrvQG',
  latinAmerica:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJE9vOWKIUURELxwXXjhasz79U3mACM4WNNwsf4M8TG-GGN0YRDoCGq7acP9rCXv85P7wMTP1wZEJsLJwPkh-V6VP92nVXDelhOx363pKf4_d1yPmdQ46K9mKhhHuaWkPNM0-hufttUfsHePNM-D2lx57mdMMbdtLNNb8pmkJlJk5MiOAziYjO3s7hmpuX-CsFtdzln6uuKSJIrwbB7vJfYp6XhqE-ME_USAwLm0fk6nLgIBpBijIeAUx6-_-bUzQUNcq1zwV1If-t',
  mediterranean:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA9HNfl4F3XTdBVE6XY7mlWdbJRnq_NFak8YgUHApXNv0_fwIAoHGpdmxjud9d9D5v6QILWilrZgsMEwDT-biir44327m7AsHekEpJp5Lc5rIhPSceLZI0ndkRd2R0g3e6as0B876L3IlIPdPEMoqWvq5TV62XSUURfNjHMw11o8l6vlQUa1yvyKCG2cfF9ekAqPKgGtkpaPzCLqqVMBSPXdujGm6Mi3rOwr573ouxJ_cXUq9oagqIYT7tzMj9RuYtfDAhATVUOHixt',
  school:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsi-bfAyaufby__uYwRtOE3zJmYR7o5MyWQuGSaVwr4PkHV8P-znc1cmAZioIlO-pyE3ZHOCdWcrbVNAZYPr22MtcLyCkMOQpA5dmaTShr1ImyJX613k28E7XkuQW5AqP9dZVzxhRIZBQG0ai1W0woPlNeDb7IRuMafQf7uu-S4OEtCDTD6_wwfAOyhsiV2_zqWcYb69LgzkcpMr4kIYHwb5k8i15Y1iHYSPaye7B1vD-J82oz2o1PVvmDOCKUT27QRrYHGo8QIfgQ',
  camera:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjuGsS1mGWWVnW09x2-WJbClsx6aNT0cEaZzZ35dNuWafGHu8rWyTh38d27qNlBgkb2KSCUpUKv-3H-54wIXQV4Erm1Zd2qMIaxaoyYZ6lFfyVSMeBWQo3LQKK__lkVH5QWceyG3g-NGK9sCi91c4CMgRRev-kxhpNcbhESdqXflUQC3DTYvLzxk-23s6xFxaS-QOWvMYjvM57yd37pNbLW3mpPXAsfa5W8qT4vU7P60hM91dF6Kx_iGtLS-Bg4zglHjlLivvHPFJJ',
  crossing:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAmjZ2PFhgHHoIi91K37Lxz1mylZMcmLHzg7x83Y4TcXmJCFmrg5LzXNHSA-xVIdLi-q0F8yY0i4jJEgBJlBJnFEjj46gMPo7Mo9aLVdTefbU3i1jIWrGlWsdRRgYroGZlNHGb_VWroRYU0qje0xwwgB3RCV1NVaTLmV5p7SKT7D0bV4Iu3XniNvV-hBj_h7lfET6JQRI_WHk7qJ7rAivTtx9fbLaCDn0cU9GOm0J0PXkHDeqzeCCSCYXQZS-JyEqs_Ljrd_eQ61ezD',
};

const storyRecords = [
  {
    id: 'gaza',
    region: 'middle-east',
    regionLabel: 'Middle East',
    zoneLabel: 'ZONE 01: GAZA',
    title: 'Urban Devastation in Gaza',
    cardTitle: 'Urban Destruction in Gaza',
    caption: 'Journalistic photograph of structural devastation in urban quarters.',
    excerpt:
      '"Our neighborhood is gone. We carry the keys to houses that no longer exist, but the memory of the streets remains sharp."',
    desc:
      'Journalistic dispatches and structural assessments reveal an unprecedented scale of urban destruction in Gaza. More than 60% of housing units have suffered damage or destruction, driving continuous waves of internal displacement. With primary utility grids severed, families search for basic survival supplies in a severely restricted zone.',
    source: 'IRC / FIELD OFFICE',
    inspectorSource: 'IRC FIELD SURVEY',
    date: 'FEB 2026',
    image: images.gaza,
    alt: 'Damaged urban quarters in Gaza photographed as evidence of displacement pressure.',
  },
  {
    id: 'sudan',
    region: 'africa',
    regionLabel: 'Africa',
    zoneLabel: 'ZONE 02: SUDAN',
    title: 'Khartoum Shelter Diaries',
    caption: 'A candid portrait of displaced families seeking safety in temporary shelters.',
    excerpt:
      '"We walked for seven days under the sun. We are not migrants by choice, we are the breath of a nation searching for peace."',
    desc:
      'Fleeing clashes in major Sudanese metropolises, hundreds of thousands have sought shelter in makeshift border camps. The humanitarian response faces immense hurdles, including blockaded transit links and underfunded relief pipelines. Displaced families live in temporary tents under extreme weather conditions.',
    source: 'UNHCR DISPATCH',
    date: 'OCT 2025',
    image: images.sudan,
    alt: 'A displaced family in Sudan standing near temporary shelter materials.',
  },
  {
    id: 'ukraine',
    region: 'europe',
    regionLabel: 'Europe',
    zoneLabel: 'ZONE 03: EASTERN EUROPE',
    title: 'Grids of Eastern Europe',
    caption: 'An aerial perspective of camp grids arranged for emergency shelter.',
    excerpt:
      '"The temperature dropped to minus ten degrees. The camps are organized with military precision, but they still feel like temporary existence."',
    desc:
      'Widespread, structured camps erected in bordering European nations provide a baseline of safety but signal a crisis of duration. Many refugees have remained displaced for several years, navigating language barriers, uncertain legal protections, and limited access to permanent shelter networks.',
    source: 'BORDER MONITOR',
    date: 'JAN 2026',
    image: images.ukraine,
    alt: 'Aerial view of a structured emergency shelter camp in Eastern Europe.',
  },
  {
    id: 'latinamerica',
    region: 'americas',
    regionLabel: 'Americas',
    zoneLabel: 'ZONE 04: CENTRAL AMERICA',
    title: 'Darien Gap Remnants',
    caption: 'Abandoned personal belongings left behind near border crossings.',
    excerpt:
      '"Shoes, clothes, toys half-buried in the mud. Every item represents a child or parent who had to shed weight to survive the crossing."',
    desc:
      'Personal items left behind along dense jungle routes between Colombia and Panama tell a story of physical exhaustion. Faced with steep terrain, muddy tracks, and criminal groups, travelers are forced to dump belongings, including food, clothing, and documents, to preserve energy.',
    source: 'HUMAN RIGHTS WATCH',
    date: 'NOV 2025',
    image: images.latinAmerica,
    alt: 'Personal belongings abandoned along a Central American displacement route.',
  },
  {
    id: 'mediterranean',
    region: 'europe',
    regionLabel: 'Europe',
    zoneLabel: 'ZONE 05: MEDITERRANEAN',
    title: 'Central Mediterranean Crossing',
    caption: 'A fragile vessel navigating high seas at dawn, loaded with hope.',
    excerpt:
      '"A wooden fishing vessel designed for twenty people carrying eighty. The sea is beautiful and terrifying at the exact same moment."',
    desc:
      'Unseaworthy vessels loaded with dozens of asylum seekers continue to cross the Mediterranean. Civil rescue organizations log hazardous conditions, arguing that safe legal pathways must be established to prevent recurring mass casualties at sea.',
    source: 'SEAWATCH LOGS',
    date: 'AUG 2025',
    image: images.mediterranean,
    alt: 'A crowded vessel crossing the Mediterranean at dawn.',
  },
  {
    id: 'sudan-hospital',
    region: 'africa',
    regionLabel: 'Africa',
    title: 'Infrastructure Destruction Report',
    excerpt:
      '"Over sixty percent of educational facilities in regional sectors suffer catastrophic structural damage, locking children out of their future."',
    desc:
      'Survey teams document severe loss across schools, clinics, and civic infrastructure. The destruction forces displacement to become a multi-year condition because return is impossible when hospitals, classrooms, and water systems remain unusable.',
    source: 'ICRC SURVEY',
    date: 'DEC 2025',
    image: images.school,
    alt: 'Abandoned classrooms in a conflict zone after severe structural damage.',
  },
];

const storyById = storyRecords.reduce((records, story) => {
  records[story.id] = story;
  return records;
}, {});

const heroStories = storyRecords.filter((story) => story.zoneLabel);

const archiveFilters = [
  { id: 'all', label: 'All' },
  { id: 'middle-east', label: 'Middle East' },
  { id: 'africa', label: 'Africa' },
  { id: 'europe', label: 'Europe' },
  { id: 'americas', label: 'Americas' },
];

const transformationItems = [
  {
    number: '01',
    title: 'National Identity',
    body:
      'Displacement is reshaping the demographic maps of host nations. Borders are becoming fluid spaces of cultural exchange and political friction.',
  },
  {
    number: '02',
    title: 'Labor Dynamics',
    body:
      'The influx of displaced talent is creating new economic corridors, but the lack of formal recognition leads to widespread exploitation.',
  },
  {
    number: '03',
    title: 'Geopolitical Realignment',
    body:
      'The refugee crisis is the single greatest driver of shifting alliances in the 21st century, dictating trade deals and security pacts.',
  },
];

function QuoteIcon() {
  return (
    <svg className="forced-displacement-article__quote-icon" viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M18 8C10.6 12.1 7 17.5 7 25.2V36h14V22H13.9c.6-3.4 2.9-6.3 6.9-8.7L18 8Zm20 0c-7.4 4.1-11 9.5-11 17.2V36h14V22h-7.1c.6-3.4 2.9-6.3 6.9-8.7L38 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="forced-displacement-article__warning-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 22 20H2L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 8v6M12 17.5v.5" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="forced-displacement-article__layout-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="forced-displacement-article__layout-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 5h12M6 10h12M6 15h12" stroke="currentColor" strokeLinecap="square" strokeWidth="1.9" />
      <path d="M2.5 5h1M2.5 10h1M2.5 15h1" stroke="currentColor" strokeLinecap="square" strokeWidth="2.4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="forced-displacement-article__close-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

export default function ForcedDisplacementArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const heroSplintersRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [archiveLayout, setArchiveLayout] = useState('grid');
  const [activeStory, setActiveStory] = useState(null);

  const openStory = useCallback((storyId) => {
    const story = storyById[storyId];
    if (story) setActiveStory(story);
  }, []);

  const closeStory = useCallback(() => {
    setActiveStory(null);
  }, []);

  const filteredArchives =
    activeFilter === 'all' ? storyRecords : storyRecords.filter((story) => story.region === activeFilter);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const syncScrollEffects = () => {
      if (progressFrameRef.current) return;

      progressFrameRef.current = window.requestAnimationFrame(() => {
        progressFrameRef.current = 0;
        const scrollable = scroller.scrollHeight - scroller.clientHeight;
        const nextProgress = scrollable > 0 ? (scroller.scrollTop / scrollable) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, nextProgress)));

        if (!heroSplintersRef.current) return;
        if (reducedMotion) {
          heroSplintersRef.current.style.transform = 'none';
          return;
        }

        const offset = Math.min(scroller.scrollTop, scroller.clientHeight);
        heroSplintersRef.current.style.transform = `translateY(${(offset * 0.08).toFixed(2)}px) scale(1.018)`;
      });
    };

    syncScrollEffects();
    scroller.addEventListener('scroll', syncScrollEffects, { passive: true });

    return () => {
      window.cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = 0;
      scroller.removeEventListener('scroll', syncScrollEffects);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-forced-displacement-reveal]'));
    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-index', String(index));
      element.classList.remove('is-visible');
      if (reducedMotion) element.classList.add('is-visible');
    });

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        root: scroller,
        threshold: 0.12,
        rootMargin: '0px 0px -70px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!activeStory) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeStory();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStory, closeStory]);

  return (
    <article className="forced-displacement-article" aria-label={`${project.title} article`}>
      <div
        className="forced-displacement-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        aria-hidden="true"
      />
      <div className="forced-displacement-article__paper-grain" aria-hidden="true" />

      <div className="forced-displacement-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className="forced-displacement-article__masthead" aria-label="Forced displacement article">
          <div className="forced-displacement-article__nav-inner">
            <span className="forced-displacement-article__brand">CHRONICLE</span>
            <span className="forced-displacement-article__nav-meta">SPECIAL INVESTIGATION // 2026 EDITION</span>
          </div>
        </nav>

        <header className="forced-displacement-article__hero" id="forced-displacement-hero">
          <div className="forced-displacement-article__splinters" ref={heroSplintersRef}>
            {heroStories.map((story, index) => (
              <button
                type="button"
                className={`forced-displacement-article__splinter is-${index + 1}`}
                key={story.id}
                style={{ backgroundImage: `url(${story.image})` }}
                onClick={() => openStory(story.id)}
                aria-label={`Inspect archive story: ${story.title}`}
              >
                <span className="forced-displacement-article__wedge-caption">
                  <span className="forced-displacement-article__badge">{story.zoneLabel}</span>
                  <span>{story.caption}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="forced-displacement-article__type-accent is-left" aria-hidden="true">
            DISPLACEMENT // OPEN YOUR EYES PEOPLE // EXILE
          </div>
          <div className="forced-displacement-article__type-accent is-right" aria-hidden="true">
            WE LEAVE ONLY OUR MEMORIES FOR THIS LAND
          </div>

          <div className="forced-displacement-article__camera" aria-hidden="true">
            <img src={images.camera} alt="" decoding="async" />
          </div>

          <div className="forced-displacement-article__title-card">
            <div className="forced-displacement-article__card-indicator" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h1>FORCED DISPLACEMENT &amp; THE GLOBAL REFUGEE CRISIS</h1>
            <p>A SPECIAL INVESTIGATION // 2026 EDITION</p>
          </div>
        </header>

        <main className="forced-displacement-article__content" id="forced-displacement-content">
          <section className="forced-displacement-article__intro" data-forced-displacement-reveal>
            <p className="forced-displacement-article__lead">
              <span>117.3</span> million people were forcibly displaced worldwide in 2025, the highest number
              ever recorded in human history. Around 80% come from active conflict zones, with women and children
              making up the majority.
            </p>
            <div className="forced-displacement-article__red-rule" aria-hidden="true" />
          </section>

          <section className="forced-displacement-article__scale" data-forced-displacement-reveal>
            <div className="forced-displacement-article__scale-info">
              <h2>THE SCALE OF CRISIS</h2>
              <div className="forced-displacement-article__quote-border">
                <p>SOURCE: IRC REPORTS 2026</p>
                <blockquote>
                  "The sheer volume of human movement is no longer a localized phenomenon but a global atmospheric
                  shift."
                </blockquote>
              </div>
            </div>

            <div className="forced-displacement-article__scale-stats">
              <div className="forced-displacement-article__stat-row">
                <div className="forced-displacement-article__stat-card is-black">
                  <span>117M</span>
                  <small>Total Displaced Persons</small>
                </div>
                <div className="forced-displacement-article__stat-card">
                  <span>+12%</span>
                  <small>Annual Increase</small>
                </div>
              </div>
              <p className="forced-displacement-article__body">
                The International Rescue Committee recently unveiled data that shatters previous records. The 117.3
                million figure represents more than a statistic; it signifies a systemic failure of global diplomacy.
                Unlike previous waves of displacement, the modern crisis is characterized by permanence: refugees are
                now spending an average of 20 years in displacement, nearly triple the duration recorded in the 1990s.
              </p>
            </div>
          </section>

          <section className="forced-displacement-article__pullquote" data-forced-displacement-reveal>
            <div className="forced-displacement-article__pullquote-inner">
              <QuoteIcon />
              <blockquote>
                "WE ARE NOT MIGRANTS BY CHOICE. WE ARE THE EXHALE OF NATIONS THAT HAVE FORGOTTEN HOW TO BREATHE."
              </blockquote>
              <cite>- AMIRA K., KHARTOUM ARCHIVE</cite>
            </div>
          </section>

          <section className="forced-displacement-article__collapse" data-forced-displacement-reveal>
            <figure className="forced-displacement-article__bento-media">
              <img src={images.school} alt="Abandoned school classrooms in a conflict zone." decoding="async" />
            </figure>
            <div className="forced-displacement-article__bento-copy">
              <h2>SYSTEMIC COLLAPSE</h2>
              <p className="forced-displacement-article__body">
                The ICRC Humanitarian Outlook 2026 highlights a devastating trend: the deliberate destruction of
                civil infrastructure. Schools, hospitals, and water treatment plants are no longer collateral damage;
                they are targets.
              </p>
              <ul className="forced-displacement-article__warning-list">
                <li>
                  <WarningIcon />
                  <span>60% Hospital Infrastructure Loss</span>
                </li>
                <li>
                  <WarningIcon />
                  <span>42% Water Network Destruction</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="forced-displacement-article__transformation" data-forced-displacement-reveal>
            <h2>A GLOBAL TRANSFORMATION</h2>
            <div className="forced-displacement-article__transformation-list">
              {transformationItems.map((item) => (
                <article className="forced-displacement-article__transformation-item" key={item.number}>
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="forced-displacement-article__body">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="forced-displacement-article__archives" id="the-archives" data-forced-displacement-reveal>
            <div className="forced-displacement-article__section-header">
              <div>
                <h2>THE ARCHIVES</h2>
                <p>A collection of verified testimonies, field records, and primary sources.</p>
              </div>
              <div className="forced-displacement-article__archive-controls">
                <div className="forced-displacement-article__filters" role="group" aria-label="Archive filters">
                  {archiveFilters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        type="button"
                        className={`forced-displacement-article__filter ${isActive ? 'is-active' : ''}`}
                        aria-pressed={isActive}
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
                <div className="forced-displacement-article__layout-toggle" role="group" aria-label="Archive layout">
                  <button
                    type="button"
                    className={`forced-displacement-article__layout-button ${archiveLayout === 'grid' ? 'is-active' : ''}`}
                    aria-label="Show archive cards in grid layout"
                    aria-pressed={archiveLayout === 'grid'}
                    onClick={() => setArchiveLayout('grid')}
                  >
                    <GridIcon />
                  </button>
                  <button
                    type="button"
                    className={`forced-displacement-article__layout-button ${archiveLayout === 'list' ? 'is-active' : ''}`}
                    aria-label="Show archive cards in list layout"
                    aria-pressed={archiveLayout === 'list'}
                    onClick={() => setArchiveLayout('list')}
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className={`forced-displacement-article__archive-grid is-${archiveLayout}`}>
              {filteredArchives.map((story) => (
                <article className="forced-displacement-article__archive-card" key={story.id}>
                  <div className="forced-displacement-article__archive-media">
                    <img src={story.image} alt={story.alt} decoding="async" loading="lazy" />
                    <span>{story.regionLabel}</span>
                  </div>
                  <div className="forced-displacement-article__archive-info">
                    <div className="forced-displacement-article__archive-meta">
                      <span>{story.source}</span>
                      <span>{story.date}</span>
                    </div>
                    <h3>{story.cardTitle || story.title}</h3>
                    <p>{story.excerpt}</p>
                    <button type="button" onClick={() => openStory(story.id)}>
                      Inspect Archive
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="forced-displacement-article__bleed" data-forced-displacement-reveal>
            <img
              src={images.crossing}
              alt="Refugees walking across a desolate corridor during a monitored crossing."
              decoding="async"
              loading="lazy"
            />
            <div>
              <p>
                The Great Crossing: An estimated 4,000 individuals traverse the corridor daily. Verified by UNHCR
                field monitors.
              </p>
            </div>
          </section>
        </main>

        <footer className="forced-displacement-article__footer">
          <div>
            <h2>CHRONICLE</h2>
            <p>A permanent record of human displacement and the systemic failures that drive it.</p>
          </div>
          <p>Copyright 2026 Chronicle of Displacement. All primary data verified by humanitarian partners.</p>
        </footer>
      </div>

      {activeStory ? (
        <div
          className="forced-displacement-article__lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeStory.title} story inspector`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStory();
          }}
        >
          <div className="forced-displacement-article__lightbox">
            <button type="button" className="forced-displacement-article__lightbox-close" onClick={closeStory}>
              <CloseIcon />
              <span>Close inspector</span>
            </button>
            <div className="forced-displacement-article__lightbox-content">
              <figure className="forced-displacement-article__lightbox-media">
                <img src={activeStory.image} alt={activeStory.alt} decoding="async" />
              </figure>
              <div className="forced-displacement-article__lightbox-text">
                <span className="forced-displacement-article__badge">{activeStory.regionLabel}</span>
                <h2>{activeStory.title}</h2>
                <p>{activeStory.desc}</p>
                <div className="forced-displacement-article__lightbox-meta">
                  <span>{activeStory.inspectorSource || activeStory.source}</span>
                  <span>{activeStory.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
