import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const heroImage = {
  src: '/article_assets/high-seas-treaty/hero.png',
  alt: 'Majestic ocean sunset wave representing the High Seas Treaty',
};

const articleMeta = {
  brand: 'EcoLex',
  category: 'Environment',
  issue: 'Ocean Governance / 2026',
  author: 'EcoLex Environmental Desk',
  region: 'International Waters',
  treaty: 'BBNJ Agreement',
};

const overviewText =
  'The "High Seas Treaty," formally known as the BBNJ Agreement, marks a turning point in international law. For the first time, the global community has established a framework to protect biodiversity in international waters - the vast expanses of ocean beyond national jurisdiction that cover nearly half the planet surface.';

const timelineMilestones = [
  {
    id: 'adoption',
    date: 'June 2023',
    title: 'Treaty Adoption',
    description: 'The United Nations officially adopts the text by consensus, ending decades of negotiation.',
    icon: 'document',
  },
  {
    id: 'ratification',
    date: 'Sept 19, 2025',
    title: 'Ratification Milestone',
    description: 'Morocco and Sierra Leone push the count to 60, meeting the legal threshold for activation.',
    icon: 'verified',
  },
  {
    id: 'force',
    date: 'Jan 17, 2026',
    title: 'Entry into Force',
    description: 'The treaty becomes legally binding international law, 120 days after the 60th ratification.',
    icon: 'gavel',
  },
  {
    id: 'goal',
    date: '2030',
    title: '30% Protection Goal',
    description: "A major step toward protecting 30% of the world's oceans through Marine Protected Areas.",
    icon: 'globe',
  },
];

const articleBody = [
  {
    title: 'A New Era for International Waters',
    paragraphs: [
      'For generations, the High Seas - areas more than 200 nautical miles from any coast - were a "wild west." Governed by fragmented agreements or none at all, these waters faced increasing pressure from overfishing, deep-sea mining, and the accelerating effects of climate change. The High Seas Treaty changes the calculus by establishing a global framework for Environmental Impact Assessments (EIAs) and the sharing of marine genetic resources.',
    ],
  },
  {
    title: 'The Impact of Ratification',
    paragraphs: [
      'The recent ratification by Morocco and Sierra Leone is more than just a bureaucratic milestone. It represents the collective will of the Global South and the international community to take stewardship of our shared heritage. This treaty provides the legal teeth needed to implement Marine Protected Areas (MPAs) in international waters, which is essential for reaching the "30 by 30" target set at the COP15 biodiversity summit.',
      'Implementation remains the next great challenge. Creating the administrative bodies to manage the treaty, funding its enforcement, and ensuring scientific cooperation across borders will require sustained political will. However, with the 60-state threshold surpassed, the gears of international law are now in motion.',
    ],
  },
];

const midArticleFigure = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBWCwesjkhrX2BjbDxHWnYzhVqPRlbE-O0Rm3_vpM9_N-ziC56Azw6kT1RIMPXpd8U0rV2evuTd8RJY3JBlTl4IX79CJyhuu3xFzT9BAcAWF5GrWHR9gMGTfFNnx7IjXy0edWAhfGoLzi_IWFOlqKY_sIebCXdE8vkGu53r5CVvK3cOYw9EUmfSI5WKCQ4OiCLJnWSLYs6Uk4PUK7WPNN_dJgkWkV2KCXQ7s0Mh6I16NtDfijih8SfcvER2Apu-GJrCW_0NEJU0OzOx',
  alt: 'Underwater coral reef showing marine biodiversity',
  caption: 'Protection of marine biodiversity is at the core of the new BBNJ framework. Photo: EcoLex Editorial',
};

const quoteBlock = {
  text: 'This is a victory for the ocean, and for the multilateral system itself. We are finally moving from words to binding action.',
  author: 'United Nations High Commissioner for the Oceans',
};

const galleryItems = [
  {
    id: 'coastal-reserve',
    type: 'image',
    variant: 'tall',
    src:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBK3TWo1AIbMIXyUrXEYKcMMK6ODWQI_xwjpbtLe52tUDYPgKF94GFGvJUwQSm8C4NhcObAjvBAWdkRoj1y0dT1ImaDSAI4I8iUCV73NWbjRqhhMmsJ98NDklMMg5T2DIwKDXAR-JGoAhMjJMxYrkB4QJARGLWnDUPSda4m_lggUdPEedbFVAxhF0Gv0_F-ozVf5km0SSYmkhn38-hZX0r3tGK1gIx7KQETrXpzCCZUdlOQNq-I3D6HPvPnk_o2euuD2_bogbFP_Cae',
    alt: 'Secluded tropical beach at dawn',
    caption: 'Dawn over coastal reserve',
  },
  {
    id: 'future',
    type: 'info',
    title: 'Securing the Future',
    text:
      'Every ratification brings us closer to a managed and sustainable ocean economy that balances extraction with preservation.',
  },
  {
    id: 'currents',
    type: 'image',
    src:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-jMl9Bbz07CcTQoQv9FXF4EK4SuA9mmRu8mlZSr5oocytIzEfRHPW9-wGj6tPDbtMPcsi2n3AFNh3GxjcWjR0AGhlhHpGKMa4hX2KUUi9ZuylQzsk_HnB8fkCMnJ62r5B2biZvQGMgaL6Hg6DMk6W8yMad3ME24_XcnCDI8dlefpP1m6afcGO-0146xGJAmSMLolzSf4_MamdEMaSlXVSReaJjB_zz4d_RquGGXSle2BLjzIqpuJq32-9pH2dbtNbnohkTSRTOWgQ',
    alt: 'Expansive aerial view of deep blue ocean currents',
    caption: 'Deep sea current dynamics',
  },
  {
    id: 'turtle',
    type: 'image',
    src:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBa5AzyARvNV4cdgpYPYcxgV11cm0SfUEam1DL89ZByU55lZkshm3sFwr8FZ3sWnmEIDVTe7MUs_NG6KIOmFmxtN1Hi_eNV0Ij-WuIJNgJrB6SFVMXqZouBXE6k7OLZetEygf9WPlZxujytyn2QlfN36bONR6XO7O3KVp-ayOylTNPDro_Ku9Dh3_9Gt9cnDXsAqca9HeuvaGkHKilROIS9wWyp0Ad-OTMFbGv9L82-pfbbXCMDqZ56YAzYo-z2OC7HGKABnwJJ3M2u',
    alt: 'Sea turtle gliding through clear ocean water',
    caption: 'Endangered marine habitat',
  },
  {
    id: 'metric',
    type: 'metric',
    value: '30%',
    text: 'Global protection goal for marine areas by the year 2030.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function SearchIcon() {
  return (
    <svg className="high-seas-treaty-article__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="m16.2 16.2 4.3 4.3M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="high-seas-treaty-article__icon" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="high-seas-treaty-article__scroll-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="m5 9 7 7 7-7" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" />
    </svg>
  );
}

function TimelineIcon({ type }) {
  const iconPath = {
    document: 'M7 3h7l4 4v14H7V3Zm7 0v5h5M10 12h6M10 16h6',
    verified: 'm4 12 4 4L20 6M5 4h12v4M5 20h12v-5',
    gavel: 'm14 5 5 5M4 20h8M6 18l7-7M9 4l7 7M7 6l7 7',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 12h17M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21M12 3C9.6 5.4 8.4 8.4 8.4 12S9.6 18.6 12 21',
  }[type];

  return (
    <svg className="high-seas-treaty-article__timeline-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d={iconPath} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.8" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="high-seas-treaty-article__quote-icon" viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <path d="M19 12c-5 2-8 6-8 12v12h13V23H17c0-3 2-6 6-8l-4-3Zm22 0c-5 2-8 6-8 12v12h13V23h-7c0-3 2-6 6-8l-4-3Z" fill="currentColor" />
    </svg>
  );
}

export default function HighSeasTreatyArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const overviewRef = useRef(null);
  const progressFrameRef = useRef(0);
  const focusReturnRef = useRef(null);
  const focusTimerRef = useRef(0);
  const searchInputRef = useRef(null);
  const actionInputRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [visibleMilestones, setVisibleMilestones] = useState([]);
  const [actionEmail, setActionEmail] = useState('');
  const [actionConsent, setActionConsent] = useState(false);
  const [actionStatus, setActionStatus] = useState('idle');

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);

    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      focusReturnRef.current?.focus();
      focusReturnRef.current = null;
    }, 0);
  }, []);

  const openOverlay = useCallback((overlay, event) => {
    focusReturnRef.current = event?.currentTarget ?? null;
    setActionStatus('idle');
    setActiveOverlay(overlay);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateProgress = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const nextProgress = maxScroll > 0 ? (scroller.scrollTop / maxScroll) * 100 : 0;
      setProgress(clamp(nextProgress, 0, 100));
      setNavScrolled(scroller.scrollTop > 50);
      progressFrameRef.current = 0;
    };

    const handleScroll = () => {
      if (progressFrameRef.current) return;
      progressFrameRef.current = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    scroller.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-high-seas-reveal]'));
    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-index', String(index));
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
        rootMargin: '0px 0px -56px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    if (reducedMotion) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      const fallbackTimer = window.setTimeout(() => {
        setVisibleMilestones(timelineMilestones.map((milestone) => milestone.id));
      }, 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    const steps = Array.from(scroller.querySelectorAll('[data-high-seas-timeline-step]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-milestone-id');
          if (!id) return;
          setVisibleMilestones((current) => (current.includes(id) ? current : [...current, id]));
          observer.unobserve(entry.target);
        });
      },
      {
        root: scroller,
        threshold: 0.28,
        rootMargin: '0px 0px -14% 0px',
      },
    );

    steps.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!activeOverlay) return undefined;

    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      if (activeOverlay === 'search') searchInputRef.current?.focus();
      if (activeOverlay === 'action') actionInputRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      closeOverlay();
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeOverlay, closeOverlay]);

  useEffect(
    () => () => {
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
    },
    [],
  );

  const timelineProgress = useMemo(() => {
    if (reducedMotion) return 100;
    if (visibleMilestones.length === 0) return 0;
    if (timelineMilestones.length <= 1) return 100;
    return ((visibleMilestones.length - 1) / (timelineMilestones.length - 1)) * 100;
  }, [reducedMotion, visibleMilestones.length]);

  const scrollToOverview = useCallback(() => {
    const scroller = scrollRef.current;
    const overview = overviewRef.current;
    if (!scroller || !overview) return;

    scroller.scrollTo({
      top: Math.max(overview.offsetTop - 72, 0),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  const handleActionSubmit = useCallback((event) => {
    event.preventDefault();
    setActionStatus('confirmed');
  }, []);

  const visibleMilestoneSet = useMemo(
    () => new Set(reducedMotion ? timelineMilestones.map((milestone) => milestone.id) : visibleMilestones),
    [reducedMotion, visibleMilestones],
  );

  return (
    <article
      className={`high-seas-treaty-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
    >
      <div
        className="high-seas-treaty-article__progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        style={{ '--read-progress': `${progress}%` }}
      />

      <div className="high-seas-treaty-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className={`high-seas-treaty-article__navbar${navScrolled ? ' is-scrolled' : ''}`} aria-label="EcoLex article navigation">
          <div className="high-seas-treaty-article__nav-container">
            <span className="high-seas-treaty-article__logo">{articleMeta.brand}</span>
            <div className="high-seas-treaty-article__nav-actions">
              <button
                type="button"
                className="high-seas-treaty-article__icon-button"
                aria-label="Search EcoLex archive"
                onClick={(event) => openOverlay('search', event)}
              >
                <SearchIcon />
              </button>
              <button
                type="button"
                className="high-seas-treaty-article__cta"
                onClick={(event) => openOverlay('action', event)}
              >
                Take Action
              </button>
            </div>
          </div>
        </nav>

        <main className="high-seas-treaty-article__main">
          <header className="high-seas-treaty-article__hero">
            <div className="high-seas-treaty-article__hero-bg" aria-hidden="true">
              <img src={heroImage.src} alt="" />
              <div className="high-seas-treaty-article__hero-gradient" />
            </div>
            <div className="high-seas-treaty-article__hero-content">
              <span className="high-seas-treaty-article__category">{articleMeta.category}</span>
              <h1 className="high-seas-treaty-article__title">
                A Historic Lifeline for the Ocean:
                <span>The High Seas Treaty</span>
              </h1>
              <p className="high-seas-treaty-article__subtitle">
                How the BBNJ Agreement is transforming global ocean governance and securing the future of our blue planet.
              </p>
              <button
                type="button"
                className="high-seas-treaty-article__scroll-button"
                aria-label="Scroll to treaty overview"
                onClick={scrollToOverview}
              >
                <ChevronDownIcon />
              </button>
            </div>
          </header>

          <section className="high-seas-treaty-article__overview" ref={overviewRef} data-high-seas-reveal>
            <div className="high-seas-treaty-article__overview-card">
              <p>{overviewText}</p>
            </div>
          </section>

          <section className="high-seas-treaty-article__timeline" aria-labelledby="high-seas-timeline-title">
            <div className="high-seas-treaty-article__section-heading" data-high-seas-reveal>
              <h2 id="high-seas-timeline-title">The Path to Protection</h2>
              <p>Key milestones in the ratification and implementation of the treaty.</p>
            </div>
            <div className="high-seas-treaty-article__timeline-tracker" style={{ '--timeline-progress': `${timelineProgress}%` }}>
              <div className="high-seas-treaty-article__timeline-line" aria-hidden="true" />
              <div className="high-seas-treaty-article__timeline-steps">
                {timelineMilestones.map((milestone) => (
                  <article
                    className={`high-seas-treaty-article__timeline-step${
                      visibleMilestoneSet.has(milestone.id) ? ' is-visible' : ''
                    }`}
                    key={milestone.id}
                    data-high-seas-reveal
                    data-high-seas-timeline-step
                    data-milestone-id={milestone.id}
                  >
                    <div className={`high-seas-treaty-article__timeline-marker high-seas-treaty-article__timeline-marker--${milestone.icon}`}>
                      <TimelineIcon type={milestone.icon} />
                    </div>
                    <span className="high-seas-treaty-article__timeline-date">{milestone.date}</span>
                    <h3>{milestone.title}</h3>
                    <p>{milestone.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <article className="high-seas-treaty-article__body">
            <aside className="high-seas-treaty-article__aside" aria-label="Article metadata" data-high-seas-reveal>
              <div>
                <span>Issue</span>
                <strong>{articleMeta.issue}</strong>
              </div>
              <div>
                <span>Author</span>
                <strong>{articleMeta.author}</strong>
              </div>
              <div>
                <span>Region</span>
                <strong>{articleMeta.region}</strong>
              </div>
              <div>
                <span>Framework</span>
                <strong>{articleMeta.treaty}</strong>
              </div>
            </aside>

            <div className="high-seas-treaty-article__text-flow">
              <section data-high-seas-reveal>
                <h2>{articleBody[0].title}</h2>
                {articleBody[0].paragraphs.map((paragraph) => (
                  <p className="high-seas-treaty-article__leading-text" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </section>

              <figure className="high-seas-treaty-article__figure" data-high-seas-reveal>
                <div className="high-seas-treaty-article__figure-frame">
                  <img src={midArticleFigure.src} alt={midArticleFigure.alt} loading="lazy" />
                  <figcaption>{midArticleFigure.caption}</figcaption>
                </div>
              </figure>

              <section data-high-seas-reveal>
                <h3>{articleBody[1].title}</h3>
                <p>{articleBody[1].paragraphs[0]}</p>
              </section>

              <figure className="high-seas-treaty-article__quote" data-high-seas-reveal>
                <QuoteIcon />
                <blockquote>{quoteBlock.text}</blockquote>
                <figcaption>{quoteBlock.author}</figcaption>
              </figure>

              <p data-high-seas-reveal>{articleBody[1].paragraphs[1]}</p>
            </div>
          </article>

          <section className="high-seas-treaty-article__gallery" aria-label="Visual proof">
            <div className="high-seas-treaty-article__gallery-grid">
              {galleryItems.map((item) => {
                if (item.type === 'info') {
                  return (
                    <article className="high-seas-treaty-article__gallery-info" key={item.id} data-high-seas-reveal>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </article>
                  );
                }

                if (item.type === 'metric') {
                  return (
                    <article className="high-seas-treaty-article__gallery-metric" key={item.id} data-high-seas-reveal>
                      <strong>{item.value}</strong>
                      <p>{item.text}</p>
                    </article>
                  );
                }

                return (
                  <figure
                    className={`high-seas-treaty-article__gallery-card${
                      item.variant === 'tall' ? ' high-seas-treaty-article__gallery-card--tall' : ''
                    }`}
                    key={item.id}
                    data-high-seas-reveal
                  >
                    <img src={item.src} alt={item.alt} loading="lazy" />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {activeOverlay === 'search' ? (
        <div
          className="high-seas-treaty-article__overlay is-open"
          role="dialog"
          aria-modal="true"
          aria-label="Search EcoLex archive"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOverlay();
          }}
        >
          <div className="high-seas-treaty-article__search-panel">
            <div className="high-seas-treaty-article__search-box">
              <SearchIcon />
              <input ref={searchInputRef} type="search" placeholder="Search EcoLex archive..." aria-label="Search EcoLex archive" />
              <button type="button" className="high-seas-treaty-article__icon-button" aria-label="Close search" onClick={closeOverlay}>
                <CloseIcon />
              </button>
            </div>
            <div className="high-seas-treaty-article__suggestions" aria-label="Trending search topics">
              <span>Trending:</span>
              {['#BBNJ', '#OceanGovernance', '#MarineProtectedAreas'].map((tag) => (
                <button type="button" key={tag}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeOverlay === 'action' ? (
        <div
          className="high-seas-treaty-article__overlay is-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="high-seas-action-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOverlay();
          }}
        >
          <div className="high-seas-treaty-article__action-panel">
            <button type="button" className="high-seas-treaty-article__modal-close" aria-label="Close take action modal" onClick={closeOverlay}>
              <CloseIcon />
            </button>
            <div className="high-seas-treaty-article__action-header">
              <span className="high-seas-treaty-article__action-symbol" aria-hidden="true">
                30
              </span>
              <h2 id="high-seas-action-title">Join the Lifeline</h2>
            </div>
            <p>
              Help advocate for rapid High Seas Treaty implementation. This mock form is local only and does not submit data,
              process petitions, or connect to any backend.
            </p>
            <form className="high-seas-treaty-article__action-form" onSubmit={handleActionSubmit}>
              <label htmlFor="high-seas-action-email">Email Address</label>
              <input
                ref={actionInputRef}
                id="high-seas-action-email"
                type="email"
                required
                value={actionEmail}
                onChange={(event) => setActionEmail(event.target.value)}
                placeholder="name@domain.com"
              />
              <label className="high-seas-treaty-article__checkbox" htmlFor="high-seas-action-consent">
                <input
                  id="high-seas-action-consent"
                  type="checkbox"
                  required
                  checked={actionConsent}
                  onChange={(event) => setActionConsent(event.target.checked)}
                />
                <span>I agree to receive ocean advocacy updates and alerts in this mock interaction.</span>
              </label>
              <button type="submit" className="high-seas-treaty-article__submit">
                {actionStatus === 'confirmed' ? 'Signed Locally' : 'Sign the Petition'}
              </button>
              {actionStatus === 'confirmed' ? (
                <p className="high-seas-treaty-article__confirmation" role="status">
                  Thank you. This local confirmation illustrates the source interaction without sending any data.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}
