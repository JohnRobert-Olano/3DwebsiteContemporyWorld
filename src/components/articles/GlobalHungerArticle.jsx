import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB1G4oGHXo4Ii219Vcthq6TfOtFIMMeflZ_c74qy7k9MiK4v9OG_FidhM20cm1MPy-IZZm3rT-EdhlUB7nB2u6UY-RbNTKuqrTk60U6v3B1-zonmIrxggmfKRaFxLl21yXLFQxUWQJTA62uG29IDC-U5BI4goFN1JWyjY8p09ByhSxOXLK03HeHAYViqpH9Br71jQgi0Z8Vc0MPsHVcp42vVDfe2iyDSjtk7lUEqvsG02dm9QZoUUggM9PfUol4hExn6ZrrnOgg9fU';

const watchlistImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA14MlMEYbdtsyp-jT6CvgvBGExYH7XZhDpN8AUw1JBpXeOu0WEOaA7naZdu3L9dX1_JiNURO4MRmcTNTwqfsGTEUR0ItOUhsTDM6UVJG0j22u8fB6WSQJ92RJno1qvNXcVYwRjrgcOfZiAerc6Ni5Nqlahbteam3sbG_2uPw2TtBCAHUNjhYJIs2soHgKEqhEvqPA4gh_0S8QjmpiRDz8MwcNr3wi97tCH6UYnajSospa5dhawfi_uM_5LwXtHYocQ7fenhV1WBQw';

const regions = [
  {
    id: 'sub-saharan-africa',
    name: 'Sub-Saharan Africa',
    value: '+14%',
    percent: 80,
    aria: 'Sub-Saharan Africa: plus fourteen percent. Toggle regional details.',
    tooltip:
      'Conflict and prolonged desertification have pushed emergency status to historically high levels across the Sahel corridor.',
  },
  {
    id: 'central-asia',
    name: 'Central Asia',
    value: '+8%',
    percent: 60,
    aria: 'Central Asia: plus eight percent. Toggle regional details.',
    tooltip:
      'Disrupted import routes and extreme seasonal temperature variations have strained regional distribution hubs.',
  },
  {
    id: 'south-america',
    name: 'South America',
    value: '+5%',
    percent: 40,
    aria: 'South America: plus five percent. Toggle regional details.',
    tooltip:
      'Border closures and internal economic pressures exacerbate nutritional vulnerability in remote transit areas.',
  },
];

const featureCards = [
  {
    id: 'budget-reallocation',
    title: 'Budget Reallocation',
    description: 'Funds are being redirected to border surveillance and regional defense contracts.',
    icon: 'money',
  },
  {
    id: 'diplomatic-erosion',
    title: 'Diplomatic Erosion',
    description: 'Multi-lateral treaties on food security are being ignored or unilaterally abandoned.',
    icon: 'globe',
  },
];

function MoneyOffIcon() {
  return (
    <svg className="global-hunger-article__feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        stroke="var(--gha-red)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function GlobeOffIcon() {
  return (
    <svg className="global-hunger-article__feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20" stroke="currentColor" strokeWidth="2" />
      <line
        x1="2.2"
        y1="2.2"
        x2="21.8"
        y2="21.8"
        stroke="var(--gha-red)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function FeatureIcon({ type }) {
  return type === 'globe' ? <GlobeOffIcon /> : <MoneyOffIcon />;
}

export default function GlobalHungerArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const heroImageRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);

  const scrollToSection = useCallback((sectionId) => {
    const target = scrollRef.current?.querySelector(`#${sectionId}`);
    target?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion]);

  const toggleRegion = useCallback((regionId) => {
    setActiveRegion((current) => (current === regionId ? null : regionId));
  }, []);

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
          heroImageRef.current.style.transform = `translateY(${(offset * 0.24).toFixed(2)}px) scale(1.05)`;
        }
      });
    };

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

    const revealElements = Array.from(scroller.querySelectorAll('[data-global-hunger-reveal]'));
    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-index', String(index));
      element.classList.remove('is-visible');
      if (reducedMotion) element.classList.add('is-visible');
    });

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      const timeoutId = window.setTimeout(() => setBarsAnimated(true), 0);
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-visible');
          if (entry.target.hasAttribute('data-region-bars')) {
            setBarsAnimated(true);
          }
          observer.unobserve(entry.target);
        });
      },
      {
        root: scroller,
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <article className="global-hunger-article" aria-label={`${project.title} article`}>
      <div
        className="global-hunger-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        aria-hidden="true"
      />

      <div className="global-hunger-article__scroll" ref={scrollRef} data-lenis-prevent>
        <main>
          <section className="global-hunger-article__hero" id="dossier-intro">
            <div className="global-hunger-article__hero-bg">
              <img
                ref={heroImageRef}
                src={heroImage}
                alt="Hands holding a dark bowl containing the Earth under dramatic lighting, representing global vulnerability."
                decoding="async"
              />
            </div>

            <div className="global-hunger-article__watermark" aria-hidden="true">
              <div className="global-hunger-article__watermark-left">GLOBAL</div>
              <div className="global-hunger-article__watermark-center">
                AND COLLAPSING<br />HUMANITARIAN AID
              </div>
              <div className="global-hunger-article__watermark-right">HUNGER</div>
            </div>

            <div className="global-hunger-article__hero-content">
              <span className="global-hunger-article__tagline">SPECIAL DOSSIER // 2026 EDITION</span>
              <h1 className="global-hunger-article__display">
                Global Hunger &<br />Collapsing Humanitarian<br />Aid
              </h1>
              <p className="global-hunger-article__body-lg global-hunger-article__hero-summary">
                As international solidarity fractures, millions are left in the shadow of a rising crisis.
                This is the documentation of a system reaching its breaking point.
              </p>
            </div>

            <button
              type="button"
              className="global-hunger-article__scroll-prompt"
              onClick={() => scrollToSection('dossier-figures')}
              aria-label="Scroll down to begin reading the dossier"
            >
              <span>SCROLL TO BEGIN</span>
              <span aria-hidden="true">v</span>
            </button>
          </section>

          <section
            className="global-hunger-article__figure"
            id="dossier-figures"
            data-global-hunger-reveal
            data-region-bars
          >
            <div className="global-hunger-article__atmospheric-glow" aria-hidden="true" />
            <div className="global-hunger-article__figure-layout">
              <div className="global-hunger-article__figure-left">
                <h2 className="global-hunger-article__figure-number">37M</h2>
                <h3 className="global-hunger-article__headline">At The Brink</h3>
                <div className="global-hunger-article__figure-divider" />
                <p className="global-hunger-article__body-lg">
                  Current data indicates 37 million people are currently facing emergency levels of hunger.
                  The gap between humanitarian need and available funding has reached an unprecedented chasm.
                </p>
              </div>

              <aside className="global-hunger-article__regional-card">
                <div className="global-hunger-article__card-badge">URGENT</div>
                <p className="global-hunger-article__mono">DATA POINT 08.2</p>
                <h4>Regional Impact Projection</h4>

                <div className="global-hunger-article__regional-bars" aria-label="Regional hunger impact percentage metrics">
                  {regions.map((region) => {
                    const isActive = activeRegion === region.id;
                    const width = barsAnimated || reducedMotion ? region.percent : 0;

                    return (
                      <button
                        type="button"
                        key={region.id}
                        className={`global-hunger-article__bar-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => toggleRegion(region.id)}
                        aria-label={region.aria}
                        aria-expanded={isActive}
                        style={{ '--bar-width': `${width}%` }}
                      >
                        <span className="global-hunger-article__bar-info">
                          <span>{region.name}</span>
                          <strong>{region.value}</strong>
                        </span>
                        <span className="global-hunger-article__bar-track" aria-hidden="true">
                          <span className="global-hunger-article__bar-fill" />
                        </span>
                        <span className="global-hunger-article__bar-tooltip">{region.tooltip}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </section>

          <section
            className="global-hunger-article__section global-hunger-article__section--paper"
            id="dossier-funding"
            data-global-hunger-reveal
          >
            <div className="global-hunger-article__container-narrow">
              <span className="global-hunger-article__section-label">SECTION I / DISRUPTION</span>
              <div className="global-hunger-article__section-title-wrap">
                <h2 className="global-hunger-article__headline">The Funding Collapse</h2>
              </div>

              <p className="global-hunger-article__body-lg">
                The architecture of global aid is crumbling. Major donor nations, once the bedrock of
                international response, are pivoting toward domestic protectionism and internal security.
                The shift is not merely a reduction in numbers - it is a fundamental realignment of priorities.
              </p>
              <p className="global-hunger-article__body-lg global-hunger-article__muted">
                By mid-2025, aid budgets from the G7 decreased by a staggering 22%. This shortfall has forced
                agencies to make impossible choices, triage-style decisions about who receives life-saving
                calories and who is left to wait for a solidarity that may never arrive.
              </p>

              <div className="global-hunger-article__feature-grid">
                {featureCards.map((card) => (
                  <div className="global-hunger-article__feature-card" key={card.id}>
                    <FeatureIcon type={card.icon} />
                    <h4>{card.title}</h4>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className="global-hunger-article__section"
            id="dossier-disorder"
            data-global-hunger-reveal
          >
            <div className="global-hunger-article__container-wide">
              <div className="global-hunger-article__split">
                <div className="global-hunger-article__media-side">
                  <div className="global-hunger-article__media-wrapper">
                    <img
                      src={watchlistImage}
                      alt="A desaturated, high-contrast landscape under dramatic shadows, evoking abandonment and humanitarian neglect."
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="global-hunger-article__media-caption">
                    <span>COORDINATES: 38.8951 N, 77.0364 W</span>
                    <strong>IMG_REF // WATCHLIST_2026</strong>
                  </div>
                </div>

                <div className="global-hunger-article__text-side">
                  <span className="global-hunger-article__section-label">SECTION II // THE WATCHLIST</span>
                  <h2 className="global-hunger-article__headline">A New World Disorder</h2>

                  <p className="global-hunger-article__body-lg">
                    According to the IRC's 2026 Emergency Watchlist, the global community is no longer
                    operating within the bounds of traditional crisis management. We have entered an era of
                    permanent emergency.
                  </p>

                  <figure className="global-hunger-article__quote">
                    <span aria-hidden="true">"</span>
                    <blockquote>
                      The systems designed to prevent widespread famine are being dismantled by the very hands
                      that built them. This is not a failure of resources, but a failure of will.
                    </blockquote>
                    <figcaption>IRC CHIEF STRATEGIST, ARCHIVE TRANSCRIPT</figcaption>
                  </figure>

                  <p className="global-hunger-article__body-lg global-hunger-article__muted">
                    Cascading climate events, combined with protracted conflict in breadbasket regions, have
                    created a feedback loop of instability. The Watchlist countries now represent a permanent
                    tier of global neglect.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className="global-hunger-article__section global-hunger-article__section--paper global-hunger-article__final"
            id="dossier-cta"
            data-global-hunger-reveal
          >
            <div className="global-hunger-article__container-narrow">
              <span className="global-hunger-article__section-label is-red">FINAL ANALYSIS</span>
              <h2 className="global-hunger-article__headline">Failing Solidarity</h2>

              <p className="global-hunger-article__body-lg">
                The final collapse is not of infrastructure, but of empathy. As the global north turns inward,
                the international capacity for solidarity weakens. We are witnessing the quiet death of the
                humanitarian consensus - a consensus that once declared hunger to be an intolerable stain on
                our collective existence.
              </p>
            </div>
          </section>
        </main>

        <footer className="global-hunger-article__footer" aria-label="Global Hunger dossier footer" />
      </div>
    </article>
  );
}
