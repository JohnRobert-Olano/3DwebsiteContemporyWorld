import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage = {
  src: '/article_assets/multilateralism-vaccines/hero.png',
  alt: 'Black and white editorial image representing vaccine delivery and global health coordination',
};

const articleMeta = {
  brand: 'THE ALLIANCE',
  issue: 'Issue No. 42',
  category: 'Global Health / Investigative',
  author: 'Senior Investigative Correspondent',
  date: 'October 2024',
  supportNote:
    'Mock education only. No payment is processed, no data is sent, and this form exists only to explain the funding model.',
  footer:
    'A field report on vaccine access, pooled purchasing, and the infrastructure of shared global health responsibility.',
};

const lead =
  'In an era of fragmenting global cooperation, the Gavi Vaccine Alliance stands as a clinical testament to what humanity can achieve through radical collaboration. Since its inception in 2000, Gavi has fundamentally reshaped the landscape of global health equity.';

const bodySections = [
  {
    title: 'The Architecture of Impact',
    paragraphs: [
      "Gavi's model is unique. It is not just a funding mechanism; it is a public-private partnership that aggregates demand for vaccines in the world's poorest countries. By doing so, it creates a stable, predictable market that encourages manufacturers to lower prices and invest in research and development for diseases that primarily affect developing nations.",
      'The results of this strategic orchestration are staggering. By negotiating lower prices and ensuring supply chain integrity, Gavi has brought life-saving immunizations to remote corners of the globe where medical infrastructure was previously non-existent.',
    ],
  },
];

const sustainabilityCopy =
  "Crucially, Gavi does not merely supply vaccines. It creates sustainable health programs. Recipient nations participate in co-financing, meaning that as a nation's economy grows, they transition from Gavi support to self-sufficiency. This strategy guarantees long-term sustainability rather than permanent dependency, paving a structured exit strategy for aid intervention.";

const impactStats = [
  {
    id: 'children',
    target: 1000000000,
    label: 'Children Immunized',
    format: (value) => `${(value / 1000000000).toFixed(1)} Billion`,
  },
  {
    id: 'lives',
    target: 20000000,
    label: 'Future Lives Saved',
    format: (value) => `${Math.round(value / 1000000)} Million`,
  },
];

const costPoints = [
  { year: '2001', value: '$3.50', x: 50, y: 50 },
  { year: '2007', value: '$2.70', x: 175, y: 110 },
  { year: '2013', value: '$1.75', x: 300, y: 180 },
  { year: '2019', value: '$0.95', x: 425, y: 240 },
  { year: '2024', value: '$0.70', x: 550, y: 260 },
];

const mapBubbles = [
  { region: 'Sub-Saharan Africa', reach: '40 Countries Supported', label: 'AFRICA', x: 300, y: 210, r: 45 },
  { region: 'South Asia', reach: '8 Countries Supported', label: 'S. ASIA', x: 440, y: 160, r: 35 },
  { region: 'Latin America & Caribbean', reach: '10 Countries Supported', label: 'LATAM', x: 150, y: 230, r: 25 },
  { region: 'East Asia & Pacific', reach: '12 Countries Supported', label: 'E. ASIA', x: 510, y: 220, r: 28 },
];

const timelineMilestones = [
  {
    year: '2000',
    title: 'Davos Inception',
    drawerTitle: 'Davos Inception Launch',
    short:
      'Founded at the World Economic Forum to halt the decade-long stall in global childhood immunization rates.',
    description:
      'Founded at the World Economic Forum to halt the decade-long stall in global childhood immunization rates by pooling global public and private resources.',
  },
  {
    year: '2005',
    title: 'Pentavalent Rollout',
    drawerTitle: 'The Pentavalent Rollout',
    short:
      'Accelerated target delivery of the 5-in-1 vaccine protectant across the poorest territories.',
    description:
      'Accelerated target delivery of the 5-in-1 vaccine protectant for diphtheria, tetanus, pertussis, hepatitis B, and Hib nationwide in the poorest territories.',
  },
  {
    year: '2010',
    title: 'Pneumococcal AMC',
    drawerTitle: 'Pneumococcal AMC Target',
    short: 'Pioneered the first Advance Market Commitment securing low pneumococcal vaccine prices.',
    description:
      'Pioneered the first Advance Market Commitment, securing low pneumococcal vaccine prices for developing countries through target manufacturer funding contracts.',
  },
  {
    year: '2020',
    title: 'COVAX Mobilization',
    drawerTitle: 'COVAX Global Facility',
    short: 'Co-led the global COVAX response facility, delivering over 2 billion COVID-19 vaccine doses globally.',
    description:
      'Co-led the global COVAX response facility, delivering over 2 billion COVID-19 vaccine doses in the largest and most complex product rollout in history.',
  },
  {
    year: '2024',
    title: 'Malaria Defense',
    drawerTitle: 'Malaria Rollout Era',
    short: 'Historic launch of RTS,S and R21 malaria vaccines across Sub-Saharan Africa.',
    description:
      'Historic launch of RTS,S and R21 malaria vaccines across Sub-Saharan Africa, targeting a disease that kills a child under five every minute.',
  },
];

const donationAmounts = [25, 100, 500];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatImpactStat(stat, value) {
  return stat.format(value);
}

function CloseIcon() {
  return (
    <svg className="multilateralism-vaccines-article__drawer-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="multilateralism-vaccines-article__arrow-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 12h15M14 6l6 6-6 6" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" />
    </svg>
  );
}

export default function MultilateralismVaccinesArticle({ project, reducedMotion = false }) {
  const articleRef = useRef(null);
  const scrollRef = useRef(null);
  const vizRef = useRef(null);
  const progressFrameRef = useRef(0);
  const focusReturnRef = useRef(null);
  const focusTimerRef = useRef(0);
  const supportTimerRef = useRef(0);
  const supportCloseTimerRef = useRef(0);
  const supportCloseButtonRef = useRef(null);
  const timelineCloseButtonRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('impact');
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(() =>
    impactStats.reduce((acc, stat) => ({ ...acc, [stat.id]: 0 }), {}),
  );
  const [costReplayKey, setCostReplayKey] = useState(0);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', body: '' });
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportStatus, setSupportStatus] = useState('idle');

  const closeDrawer = useCallback(() => {
    setActiveDrawer(null);

    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      focusReturnRef.current?.focus();
      focusReturnRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateProgress = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const nextProgress = maxScroll > 0 ? (scroller.scrollTop / maxScroll) * 100 : 0;
      setProgress(clamp(nextProgress, 0, 100));
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

    const revealElements = Array.from(scroller.querySelectorAll('[data-vaccines-reveal]'));

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
        threshold: 0.1,
        rootMargin: '0px 0px -54px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const viz = vizRef.current;
    if (!scroller || !viz) return undefined;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && activeTab === 'impact') {
            setStatsTriggered(true);
            observer.disconnect();
          }
        });
      },
      {
        root: scroller,
        threshold: 0.25,
      },
    );

    observer.observe(viz);

    return () => observer.disconnect();
  }, [activeTab, reducedMotion]);

  useEffect(() => {
    if (!statsTriggered || reducedMotion) return undefined;

    const duration = 1500;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progressRatio = clamp(elapsed / duration, 0, 1);
      const eased = 1 - (1 - progressRatio) ** 3;

      setAnimatedStats(
        impactStats.reduce(
          (acc, stat) => ({
            ...acc,
            [stat.id]: Math.round(stat.target * eased),
          }),
          {},
        ),
      );

      if (progressRatio >= 1) window.clearInterval(timer);
    }, 30);

    return () => window.clearInterval(timer);
  }, [statsTriggered, reducedMotion]);

  useEffect(() => {
    if (!activeDrawer) return undefined;

    const focusTarget = activeDrawer === 'support' ? supportCloseButtonRef.current : timelineCloseButtonRef.current;
    const focusTimer = window.setTimeout(() => focusTarget?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      closeDrawer();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [activeDrawer, closeDrawer]);

  useEffect(
    () => () => {
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      if (supportTimerRef.current) window.clearTimeout(supportTimerRef.current);
      if (supportCloseTimerRef.current) window.clearTimeout(supportCloseTimerRef.current);
    },
    [],
  );

  const showTooltip = (event, title, body) => {
    const articleRect = articleRef.current?.getBoundingClientRect();
    if (!articleRect) return;

    const targetRect = event.currentTarget?.getBoundingClientRect();
    const clientX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : targetRect.left + targetRect.width / 2;
    const clientY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : targetRect.top + targetRect.height / 2;

    setTooltip({
      visible: true,
      x: clientX - articleRect.left + 14,
      y: clientY - articleRect.top - 18,
      title,
      body,
    });
  };

  const hideTooltip = () => {
    setTooltip((current) => ({ ...current, visible: false }));
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    hideTooltip();

    if (tab === 'impact') setStatsTriggered(true);
    if (tab === 'cost' && !reducedMotion) setCostReplayKey((key) => key + 1);
  };



  const openTimelineDrawer = (event, milestone) => {
    focusReturnRef.current = event.currentTarget;
    setActiveMilestone(milestone);
    setActiveDrawer('timeline');
  };

  const handleSupportSubmit = (event) => {
    event.preventDefault();
    if (supportStatus === 'processing') return;

    setSupportStatus('processing');

    if (supportTimerRef.current) window.clearTimeout(supportTimerRef.current);
    if (supportCloseTimerRef.current) window.clearTimeout(supportCloseTimerRef.current);

    supportTimerRef.current = window.setTimeout(
      () => {
        setSupportStatus('success');
        supportCloseTimerRef.current = window.setTimeout(() => {
          closeDrawer();
          setSupportName('');
          setSupportEmail('');
          setSelectedAmount(100);
          setSupportStatus('idle');
        }, reducedMotion ? 800 : 2300);
      },
      reducedMotion ? 120 : 900,
    );
  };

  const displayStats = impactStats.reduce((acc, stat) => {
    const value = reducedMotion || statsTriggered ? animatedStats[stat.id] || stat.target : animatedStats[stat.id] || 0;
    return {
      ...acc,
      [stat.id]: reducedMotion ? formatImpactStat(stat, stat.target) : formatImpactStat(stat, value),
    };
  }, {});

  return (
    <article
      className={`multilateralism-vaccines-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
      ref={articleRef}
    >
      <div
        className="multilateralism-vaccines-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="multilateralism-vaccines-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className="multilateralism-vaccines-article__navbar" aria-label="The Alliance">
          <div className="multilateralism-vaccines-article__navbar-inner">
            <span className="multilateralism-vaccines-article__brand">{articleMeta.brand}</span>
          </div>
        </nav>

        <header className="multilateralism-vaccines-article__hero">
          <img src={heroImage.src} alt={heroImage.alt} />
          <div className="multilateralism-vaccines-article__hero-overlay" aria-hidden="true" />
          <div className="multilateralism-vaccines-article__hero-content" data-vaccines-reveal>
            <p className="multilateralism-vaccines-article__kicker">Multilateralism at its best</p>
            <h1>How the Gavi Vaccine Alliance Has Saved Over 20 Million Lives</h1>
          </div>
        </header>

        <main className="multilateralism-vaccines-article__main">
          <section className="multilateralism-vaccines-article__intro-grid" data-vaccines-reveal>
            <p className="multilateralism-vaccines-article__lead">{lead}</p>
          </section>

          <section className="multilateralism-vaccines-article__editorial-grid">
            <aside className="multilateralism-vaccines-article__sidebar" data-vaccines-reveal>
              <span>{articleMeta.issue}</span>
              <strong>{articleMeta.category}</strong>
              <dl>
                <div>
                  <dt>Author</dt>
                  <dd>{articleMeta.author}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{articleMeta.date}</dd>
                </div>
              </dl>
            </aside>

            <div className="multilateralism-vaccines-article__body">
              {bodySections.map((section) => (
                <section className="multilateralism-vaccines-article__text-block" key={section.title}>
                  <h2 data-vaccines-reveal>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} data-vaccines-reveal>
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}

              <section className="multilateralism-vaccines-article__viz" ref={vizRef} data-vaccines-reveal>
                <h2>Data Visualization: The Gavi Metric Canvas</h2>
                <div className="multilateralism-vaccines-article__tabs" role="tablist" aria-label="Gavi metric views">
                  {[
                    ['impact', 'Impact Stats'],
                    ['cost', 'Cost Decrease'],
                    ['reach', 'Country Reach'],
                  ].map(([tab, label]) => (
                    <button
                      className="multilateralism-vaccines-article__tab"
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls={`multilateralism-vaccines-${tab}-panel`}
                      id={`multilateralism-vaccines-${tab}-tab`}
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div
                  className="multilateralism-vaccines-article__tab-panel"
                  id="multilateralism-vaccines-impact-panel"
                  role="tabpanel"
                  aria-labelledby="multilateralism-vaccines-impact-tab"
                  hidden={activeTab !== 'impact'}
                >
                  <div className="multilateralism-vaccines-article__stats-grid">
                    {impactStats.map((stat) => (
                      <article className="multilateralism-vaccines-article__stat-card" key={stat.id}>
                        <strong>{displayStats[stat.id]}</strong>
                        <span>{stat.label}</span>
                      </article>
                    ))}
                  </div>
                </div>

                <div
                  className="multilateralism-vaccines-article__tab-panel"
                  id="multilateralism-vaccines-cost-panel"
                  role="tabpanel"
                  aria-labelledby="multilateralism-vaccines-cost-tab"
                  hidden={activeTab !== 'cost'}
                >
                  <svg className="multilateralism-vaccines-article__chart" viewBox="0 0 600 350" aria-label="Pentavalent vaccine cost reduction chart">
                    <g className="multilateralism-vaccines-article__chart-grid">
                      {[50, 125, 200, 275].map((y) => (
                        <line x1="50" y1={y} x2="550" y2={y} key={y} />
                      ))}
                    </g>
                    {[
                      ['$3.50', 55],
                      ['$2.50', 130],
                      ['$1.50', 205],
                      ['$0.50', 280],
                    ].map(([label, y]) => (
                      <text className="multilateralism-vaccines-article__chart-axis" x="20" y={y} textAnchor="middle" key={label}>
                        {label}
                      </text>
                    ))}
                    {costPoints.map((point) => (
                      <text className="multilateralism-vaccines-article__chart-axis" x={point.x} y="310" textAnchor="middle" key={point.year}>
                        {point.year}
                      </text>
                    ))}
                    <path className="multilateralism-vaccines-article__chart-average" d="M 50 150 L 550 150" />
                    <path
                      className={`multilateralism-vaccines-article__chart-line${reducedMotion ? '' : ' is-drawing'}`}
                      d="M 50 50 L 175 110 L 300 180 L 425 240 L 550 260"
                      key={costReplayKey}
                    />
                    {costPoints.map((point) => (
                      <circle
                        className="multilateralism-vaccines-article__chart-dot"
                        cx={point.x}
                        cy={point.y}
                        r="7"
                        key={point.year}
                        tabIndex={0}
                        role="button"
                        aria-label={`Year ${point.year}: ${point.value} per dose`}
                        onPointerMove={(event) => showTooltip(event, `Year ${point.year}`, `${point.value} per dose`)}
                        onPointerLeave={hideTooltip}
                        onFocus={(event) => showTooltip(event, `Year ${point.year}`, `${point.value} per dose`)}
                        onBlur={hideTooltip}
                      />
                    ))}
                  </svg>
                </div>

                <div
                  className="multilateralism-vaccines-article__tab-panel"
                  id="multilateralism-vaccines-reach-panel"
                  role="tabpanel"
                  aria-labelledby="multilateralism-vaccines-reach-tab"
                  hidden={activeTab !== 'reach'}
                >
                  <svg className="multilateralism-vaccines-article__chart" viewBox="0 0 600 350" aria-label="Country reach bubble map">
                    <rect x="0" y="0" width="600" height="350" fill="none" />
                    {mapBubbles.map((bubble) => (
                      <g key={bubble.region}>
                        <circle
                          className="multilateralism-vaccines-article__map-bubble"
                          cx={bubble.x}
                          cy={bubble.y}
                          r={bubble.r}
                          tabIndex={0}
                          role="button"
                          aria-label={`${bubble.region}: ${bubble.reach}`}
                          onPointerMove={(event) => showTooltip(event, bubble.region, bubble.reach)}
                          onPointerLeave={hideTooltip}
                          onFocus={(event) => showTooltip(event, bubble.region, bubble.reach)}
                          onBlur={hideTooltip}
                        />
                        <text className="multilateralism-vaccines-article__map-label" x={bubble.x} y={bubble.y + 5} textAnchor="middle" aria-hidden="true">
                          {bubble.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>

              <p className="multilateralism-vaccines-article__paragraph" data-vaccines-reveal>
                {sustainabilityCopy}
              </p>
            </div>
          </section>

          <section className="multilateralism-vaccines-article__timeline" data-vaccines-reveal>
            <div className="multilateralism-vaccines-article__timeline-header">
              <h2>Gavi's Strategic Horizon</h2>
              <p>Click any milestone card to investigate historical documents and milestones.</p>
            </div>

            <div className="multilateralism-vaccines-article__timeline-track">
              {timelineMilestones.map((milestone) => (
                <button
                  className="multilateralism-vaccines-article__timeline-card"
                  type="button"
                  key={`${milestone.year}-${milestone.title}`}
                  onClick={(event) => openTimelineDrawer(event, milestone)}
                  aria-haspopup="dialog"
                >
                  <span className="multilateralism-vaccines-article__timeline-year">{milestone.year}</span>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.short}</span>
                  <em>
                    Investigate
                    <ArrowIcon />
                  </em>
                </button>
              ))}
            </div>
          </section>
        </main>

        <footer className="multilateralism-vaccines-article__footer">
          <strong>THE ALLIANCE</strong>
          <p>{articleMeta.footer}</p>
        </footer>
      </div>

      <div
        className={`multilateralism-vaccines-article__drawer-backdrop${activeDrawer ? ' is-active' : ''}`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDrawer();
        }}
        aria-hidden={!activeDrawer}
      />

      <aside
        className={`multilateralism-vaccines-article__drawer${activeDrawer === 'support' ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="multilateralism-vaccines-support-title"
        aria-hidden={activeDrawer !== 'support'}
      >
        <button
          className="multilateralism-vaccines-article__drawer-close"
          type="button"
          aria-label="Close support drawer"
          ref={supportCloseButtonRef}
          onClick={closeDrawer}
        >
          <CloseIcon />
        </button>
        <h2 id="multilateralism-vaccines-support-title">Support Global Health</h2>
        <p>
          Your investment directly helps Gavi secure lower vaccine prices and fund supply chain networks in low-income
          countries.
        </p>
        <p className="multilateralism-vaccines-article__mock-note">{articleMeta.supportNote}</p>

        <form className="multilateralism-vaccines-article__support-form" onSubmit={handleSupportSubmit}>
          <fieldset>
            <legend>Select amount (USD)</legend>
            <div className="multilateralism-vaccines-article__donation-grid">
              {donationAmounts.map((amount) => (
                <button
                  className="multilateralism-vaccines-article__donation-button"
                  type="button"
                  aria-pressed={selectedAmount === amount}
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            Full name
            <input
              type="text"
              required
              value={supportName}
              onChange={(event) => setSupportName(event.target.value)}
              placeholder="E.g., Margaret Chan"
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              required
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              placeholder="name@organization.org"
            />
          </label>

          <button className="multilateralism-vaccines-article__submit-button" type="submit" disabled={supportStatus === 'processing'}>
            {supportStatus === 'processing' ? 'Processing...' : 'Authorize mock support'}
          </button>

          {supportStatus === 'success' ? (
            <p className="multilateralism-vaccines-article__confirmation" role="status">
              Thank you, {supportName || 'supporter'}. This mock ${selectedAmount} pledge illustrates how pooled
              financing can immunize children.
            </p>
          ) : null}
        </form>
      </aside>

      <aside
        className={`multilateralism-vaccines-article__drawer${activeDrawer === 'timeline' ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="multilateralism-vaccines-timeline-title"
        aria-hidden={activeDrawer !== 'timeline'}
      >
        <button
          className="multilateralism-vaccines-article__drawer-close"
          type="button"
          aria-label="Close timeline details"
          ref={timelineCloseButtonRef}
          onClick={closeDrawer}
        >
          <CloseIcon />
        </button>
        <span className="multilateralism-vaccines-article__drawer-year">{activeMilestone?.year || '2000'}</span>
        <h2 id="multilateralism-vaccines-timeline-title">{activeMilestone?.drawerTitle || 'Milestone Details'}</h2>
        <p>{activeMilestone?.description || 'Milestone details will appear here.'}</p>
      </aside>

      <div
        className={`multilateralism-vaccines-article__tooltip${tooltip.visible ? ' is-visible' : ''}`}
        style={{ '--tooltip-x': `${tooltip.x}px`, '--tooltip-y': `${tooltip.y}px` }}
        role="tooltip"
      >
        <strong>{tooltip.title}</strong>
        <span>{tooltip.body}</span>
      </div>
    </article>
  );
}
