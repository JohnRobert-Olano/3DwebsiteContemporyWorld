import { useCallback, useEffect, useRef, useState } from 'react';

const images = {
  hero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBqHPPwcJhbWRTRbELVCD_cq82QACjCQwVoI8cB15N7CfeDCimuv0gk3p4dc1aVFVGwfYrR95uEYJZLW4LieXUO6vvqKn3fkVgeBOtCvsshVYipQna7Gmx_z09kpiPpzZin6prxQpdbClXLlMqpULHrGT2eTjRO3ao0piFPjGTkAdEvLVYMCQ36mv9tXlI7u8goVOZULvIGQGTh1s2CS1N17xRJssH5Osrp81bzJQ-LRuftmYu6LlpA8tGyic-d1AChuIYyNxa480uM',
  shipyard:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB3fPzb1MUDCh3_f0jd5-Jf_7k81pCuGOkHBl-dYb0tKqOT71dZa4inBbenCT29y9ufaKhyN-4NoZmDrNULHCsm0OQihPYh4T0gfdZYb2FMU39ii_wxeXRBQAL9MRzoFPDH5gu7Yfbha_1JFUJo_3jbYCc71rtIx2eggtNJbyOTE35pf29txBJGPdOGzdyL9T-x6iqV95vsp-vfAdZ2YsA1BQhXN-x_0tjG0PY4DSEYuCW07epTdVl8bHDT2So1lRHets1pCxikEl0v',
  clock:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBiq3KB4-VXNd_rnMIX5S0hE__Y4K5wla6SkLxP7RjcpMw4NjXCRNnEVC03jMJ3e4--CawK3HZI_niI9Z9E0JfSu5RCsWqPKKtB3HGAkf_6bbDSZlosVXq-2IfxGfBQmgmXM3Ha_f0yhoJTU0txQxP_6LJepttVpPdWM9k8JkyRbmzsLUK85idvX3JhdAQKAVKKLms8dET0cxX7if6dM3Tftuzp5Ae-VSJ3PXQ6e_SNn4U4mxputsZTuoitYzy2u6B1Vgpmn9f7-U22',
};

const stats = [
  {
    id: 'inflation',
    target: 3.1,
    label: 'Global Inflation Projection (2026)',
    tone: 'red',
  },
  {
    id: 'growth',
    target: 2.7,
    label: 'Global Growth Projection (2026)',
    tone: 'black',
  },
];

const tags = ['IMF-DATA', 'RECOVERY-RISK', 'URGENT'];

const sources = [
  {
    id: 'unctad',
    title: 'UNCTAD: World Economic Situation 2026',
    href: 'https://unctad.org/publication/world-economic-situation-and-prospects-2026',
    icon: 'document',
  },
  {
    id: 'imf',
    title: 'IMF: World Economic Outlook April 2026',
    href: 'https://www.imf.org/en/publications/weo/issues/2026/04/14/world-economic-outlook-april-2026',
    icon: 'chart',
  },
];

function createStatValues(valueResolver) {
  return stats.reduce((values, stat) => {
    values[stat.id] = typeof valueResolver === 'function' ? valueResolver(stat) : valueResolver;
    return values;
  }, {});
}

function DownIcon() {
  return (
    <svg className="global-inflation-article__small-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 7l6 6 6-6" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" />
    </svg>
  );
}

function UpIcon() {
  return (
    <svg className="global-inflation-article__small-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 13l6-6 6 6" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="global-inflation-article__small-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 11.2l8-4.4M6 8.8l8 4.4" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
      <circle cx="4.5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15.5" cy="5.8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15.5" cy="14.2" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SourceIcon({ type }) {
  if (type === 'chart') {
    return (
      <svg className="global-inflation-article__source-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19h17" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
        <path d="M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg className="global-inflation-article__source-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 3v5h5M9 12h8M9 16h8" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

export default function GlobalInflationArticle({ project, reducedMotion = false }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const heroImageRef = useRef(null);
  const statsRef = useRef(null);
  const progressFrameRef = useRef(0);
  const tooltipTimerRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [statValues, setStatValues] = useState(() => createStatValues(0));
  const [shareTooltip, setShareTooltip] = useState({
    visible: false,
    left: 0,
    top: 0,
    text: '',
    copied: false,
    failed: false,
  });

  const scrollToSection = useCallback((sectionId) => {
    const target = scrollRef.current?.querySelector(`#${sectionId}`);
    target?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  const copySelection = useCallback(async () => {
    const selectedText = shareTooltip.text.trim();
    if (!selectedText) return;

    const shareText = `"${selectedText}" - Global Inflation Report 2026`;
    let failed = false;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareText);
    } catch {
      failed = true;
    }

    window.clearTimeout(tooltipTimerRef.current);
    setShareTooltip((current) => ({
      ...current,
      visible: true,
      copied: true,
      failed,
    }));
    tooltipTimerRef.current = window.setTimeout(() => {
      setShareTooltip((current) => ({
        ...current,
        visible: false,
        copied: false,
        failed: false,
      }));
    }, 1400);
  }, [shareTooltip.text]);

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

        if (!reducedMotion && heroImageRef.current) {
          const offset = Math.min(scroller.scrollTop, scroller.clientHeight);
          heroImageRef.current.style.transform = `translateY(${(offset * 0.28).toFixed(2)}px) scale(1.06)`;
        }
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

    const revealElements = Array.from(scroller.querySelectorAll('[data-global-inflation-reveal]'));
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
    const scroller = scrollRef.current;
    const dashboard = statsRef.current;
    if (!scroller || !dashboard || statsTriggered) return undefined;

    let frameId = 0;
    const checkDashboardVisibility = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const dashboardRect = dashboard.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const visible = dashboardRect.bottom > scrollerRect.top && dashboardRect.top < scrollerRect.bottom;

        if (visible) {
          setStatsTriggered(true);
        }
      });
    };

    checkDashboardVisibility();
    scroller.addEventListener('scroll', checkDashboardVisibility, { passive: true });
    window.addEventListener('resize', checkDashboardVisibility);

    return () => {
      window.cancelAnimationFrame(frameId);
      scroller.removeEventListener('scroll', checkDashboardVisibility);
      window.removeEventListener('resize', checkDashboardVisibility);
    };
  }, [statsTriggered]);

  useEffect(() => {
    if (!statsTriggered) return undefined;

    if (reducedMotion) {
      const timeoutId = window.setTimeout(() => {
        setStatValues(createStatValues((stat) => stat.target));
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    let frameId = 0;
    const duration = 1800;
    const startedAt = performance.now();

    const animateStats = (timestamp) => {
      const elapsed = timestamp - startedAt;
      const ratio = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);

      setStatValues(createStatValues((stat) => stat.target * eased));

      if (ratio < 1) {
        frameId = window.requestAnimationFrame(animateStats);
      } else {
        setStatValues(createStatValues((stat) => stat.target));
      }
    };

    frameId = window.requestAnimationFrame(animateStats);

    return () => window.cancelAnimationFrame(frameId);
  }, [reducedMotion, statsTriggered]);

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollRef.current;
    if (!root || !scroller) return undefined;

    const hideTooltip = () => {
      setShareTooltip((current) => (current.visible ? { ...current, visible: false, copied: false, failed: false } : current));
    };

    const updateTooltip = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        hideTooltip();
        return;
      }

      const text = selection.toString().trim();
      if (text.length <= 10) {
        hideTooltip();
        return;
      }

      const range = selection.getRangeAt(0);
      const ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

      if (!ancestor || !root.contains(ancestor)) {
        hideTooltip();
        return;
      }

      const rect = range.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();

      if (rect.bottom < scrollerRect.top || rect.top > scrollerRect.bottom) {
        hideTooltip();
        return;
      }

      const left = Math.min(Math.max(rect.left - rootRect.left + (rect.width / 2), 88), rootRect.width - 88);
      const top = Math.max(54, rect.top - rootRect.top - 48);

      setShareTooltip({
        visible: true,
        left,
        top,
        text,
        copied: false,
        failed: false,
      });
    };

    const handleScopedPointer = (event) => {
      if (event.target.closest?.('.global-inflation-article__share-tooltip')) return;
      window.setTimeout(updateTooltip, 120);
    };

    document.addEventListener('selectionchange', updateTooltip);
    scroller.addEventListener('mouseup', updateTooltip);
    scroller.addEventListener('keyup', updateTooltip);
    scroller.addEventListener('mousedown', handleScopedPointer);

    return () => {
      document.removeEventListener('selectionchange', updateTooltip);
      scroller.removeEventListener('mouseup', updateTooltip);
      scroller.removeEventListener('keyup', updateTooltip);
      scroller.removeEventListener('mousedown', handleScopedPointer);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(tooltipTimerRef.current), []);

  return (
    <article className="global-inflation-article" ref={rootRef} aria-label={`${project.title} article`}>
      <div
        className="global-inflation-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        aria-hidden="true"
      />
      <div className="global-inflation-article__grain" aria-hidden="true" />

      <button
        type="button"
        className={`global-inflation-article__share-tooltip ${shareTooltip.visible ? 'is-visible' : ''}`}
        style={{
          '--tooltip-left': `${shareTooltip.left}px`,
          '--tooltip-top': `${shareTooltip.top}px`,
        }}
        onClick={copySelection}
        aria-live="polite"
      >
        <ShareIcon />
        <span>{shareTooltip.copied ? (shareTooltip.failed ? 'Copy unavailable' : 'Copied') : 'Share Quote'}</span>
      </button>

      <div className="global-inflation-article__scroll" ref={scrollRef} data-lenis-prevent>
        <header className="global-inflation-article__masthead">
          <div className="global-inflation-article__nav">
            <span className="global-inflation-article__logo">INFLATION WATCH</span>
            <span className="global-inflation-article__nav-meta">2026 SPECIAL REPORT</span>
          </div>
        </header>

        <section className="global-inflation-article__hero" id="inflation-hero">
          <div className="global-inflation-article__hero-bg">
            <img
              ref={heroImageRef}
              src={images.hero}
              alt="Gritty photographic collage representing economic volatility and cost-of-living pressure."
              decoding="async"
            />
          </div>
          <div className="global-inflation-article__hero-gradient" aria-hidden="true" />

          <div className="global-inflation-article__hero-content">
            <span className="global-inflation-article__hero-badge">Investigative Special Report</span>
            <h1 className="global-inflation-article__hero-title">
              <span>GLOBAL</span>
              <span>INFLATION &</span>
            </h1>
            <p className="global-inflation-article__hero-subtitle">THE COST-OF-LIVING CRISIS</p>
          </div>

          <button
            type="button"
            className="global-inflation-article__scroll-prompt"
            onClick={() => scrollToSection('inflation-intro')}
            aria-label="Scroll down to begin reading the report"
          >
            <span>SCROLL TO READ</span>
            <DownIcon />
          </button>
        </section>

        <main className="global-inflation-article__canvas">
          <aside className="global-inflation-article__sidebar" aria-label="Report Data Dashboard">
            <div className="global-inflation-article__sticky-panel">
              <div className="global-inflation-article__data-box" ref={statsRef}>
                <span className="global-inflation-article__data-label">Report Data</span>
                <div className="global-inflation-article__data-list">
                  {stats.map((stat) => (
                    <div className="global-inflation-article__data-point" key={stat.id}>
                      <div className={`global-inflation-article__data-value is-${stat.tone}`}>
                        {statValues[stat.id].toFixed(1)}%
                      </div>
                      <div className="global-inflation-article__data-copy">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="global-inflation-article__narrative" id="report-narrative">
            <section className="global-inflation-article__intro" id="inflation-intro" data-global-inflation-reveal>
              <p className="global-inflation-article__lead">
                Inflation remains one of the most worrying issues for people worldwide in 2026. As domestic
                price pressures continue to haunt major economies, the global financial architecture finds
                itself at a crossroads between recovery and systemic failure.
              </p>
              <p className="global-inflation-article__body">
                While central banks have aggressively manipulated interest rates to curb the post-pandemic
                surge, the underlying structural issues - supply chain resilience, geopolitical friction,
                and energy transitions - remain unaddressed.
              </p>
            </section>

            <section
              className="global-inflation-article__section global-inflation-article__section--accent"
              id="structural-pressure"
              data-global-inflation-reveal
            >
              <h2 className="global-inflation-article__section-title">Structural Pressure</h2>
              <div className="global-inflation-article__editorial-row">
                <div className="global-inflation-article__copy-stack">
                  <p className="global-inflation-article__body">
                    According to the <strong>UNCTAD World Economic Situation and Prospects 2026</strong>,
                    the world is witnessing a "fragmentation of global trade." This is not a temporary dip
                    but a fundamental realignment.
                  </p>
                  <p className="global-inflation-article__body is-muted">
                    Higher borrowing costs are disproportionately affecting developing nations, leading to
                    a widened gap between the global North and South. Without coordinated fiscal intervention,
                    the temporary inflation of the early 20s could become the structural stagnation of the
                    late 20s.
                  </p>
                </div>

                <figure className="global-inflation-article__image-card">
                  <img
                    src={images.shipyard}
                    alt="Industrial shipyard stacked with containers under a hazy monochrome sky."
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>FIG 2.1: MARITIME CONGESTION INDICES (UNCTAD)</figcaption>
                </figure>
              </div>
            </section>

            <section
              className="global-inflation-article__pullquote"
              data-global-inflation-reveal
              aria-label="Pull quote"
            >
              <div className="global-inflation-article__quote-pattern" aria-hidden="true" />
              <div className="global-inflation-article__pullquote-inner">
                <span className="global-inflation-article__quote-mark" aria-hidden="true">"</span>
                <blockquote>
                  We are entering an era where the tools of the past are no longer sufficient to manage the
                  complexities of the present.
                </blockquote>
                <cite>- Chief Economist, UNCTAD 2026 Projections</cite>
              </div>
            </section>

            <section className="global-inflation-article__section" id="fragile-recovery" data-global-inflation-reveal>
              <h2 className="global-inflation-article__section-title is-right">Fragile Recovery</h2>
              <div className="global-inflation-article__clock-grid">
                <div className="global-inflation-article__clock-frame">
                  <div className="global-inflation-article__dashed-frame" aria-hidden="true" />
                  <figure className="global-inflation-article__image-card">
                    <img
                      src={images.clock}
                      alt="Analog clock face reflected in a polished office desk in high-contrast monochrome style."
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                </div>

                <div className="global-inflation-article__copy-stack">
                  <p className="global-inflation-article__body">
                    The <strong>IMF World Economic Outlook (April 2026)</strong> offers a slightly more
                    optimistic, albeit cautious, forecast. While the soft landing remains the primary goal,
                    the path is riddled with "unforeseen seismic risks."
                  </p>
                  <p className="global-inflation-article__body is-muted is-italic">
                    Growth is projected at 2.7%, yet the IMF warns that "fragility is the new baseline."
                    Sovereign debt levels are at historic highs, leaving governments with little room for
                    maneuver if another shock hits the energy or food sectors.
                  </p>
                  <div className="global-inflation-article__badge-cloud" role="group" aria-label="Important report tags">
                    {tags.map((tag) => (
                      <span className={`global-inflation-article__badge ${tag === 'URGENT' ? 'is-warning' : ''}`} key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              className="global-inflation-article__section global-inflation-article__section--accent"
              id="global-disconnect"
              data-global-inflation-reveal
            >
              <h2 className="global-inflation-article__section-title">Global Disconnect</h2>
              <div className="global-inflation-article__disconnect-copy">
                <p className="global-inflation-article__body is-strong">
                  The core issue facing the global community in 2026 is a profound political coordination
                  failure. As nations retreat into protectionism, the shared challenge of inflation becomes
                  an individual survival race.
                </p>
                <p className="global-inflation-article__body is-muted">
                  Structural inflation is no longer just a monetary phenomenon; it is a political one. The
                  disconnect between central bank mandates and the reality of the cost-of-living crisis is
                  fueling populist unrest across every continent. Without a unified strategy - incorporating
                  debt relief for the vulnerable and aggressive investment in energy independence - the crisis
                  will simply become the norm.
                </p>
              </div>

              <div className="global-inflation-article__sources" id="sources">
                <h3>Primary Source Reports</h3>
                <ul>
                  {sources.map((source) => (
                    <li key={source.id}>
                      <a href={source.href} target="_blank" rel="noopener noreferrer">
                        <SourceIcon type={source.icon} />
                        <span>{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </main>

        <footer className="global-inflation-article__footer">
          <div className="global-inflation-article__footer-content">
            <div className="global-inflation-article__footer-logo">INFLATION WATCH</div>
            <button
              type="button"
              className="global-inflation-article__back-to-top"
              onClick={scrollToTop}
              aria-label="Back to top of report"
            >
              <UpIcon />
            </button>
            <div className="global-inflation-article__footer-meta">
              2026 INFLATION WATCH. Special Investigative Report.
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
