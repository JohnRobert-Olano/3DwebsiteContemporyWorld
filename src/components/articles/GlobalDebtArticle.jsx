import { useCallback, useEffect, useRef, useState } from 'react';

const images = {
  hero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCtZrGBZeVnA_UxViUIkwk5HMyWCyctKTEW1uhHREI1Q_ANct1MUUhdoyZ_8GgxIVOzT4Xa9fqCdt-8zrigWzhp3Y0_q4iiiuhNLlG8W5_ytEft57yCy6Im--Uzg_jr5sMknexbSGC2iz7e9oF3uv1NINVIqCcZpjPvzwZRNAP34yVWrADxcfZ1tarQcMmTutgGFvYyFKtwJbHM9DJw-PeuwjfN6RfvqPZqSfoYoT0YnJcgwMUBbCuAGJnkKV4Tn54Qjr3Q3qaOyYU',
  lockedIn:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgVAJ9bJaE7Y72TmSha5ip0qWwyk82SPeAifpOWbODLTjyE6DerLoSYDGAI0GfSpb2E7VYYPeW5LVLSRPqnrbGPb3z7kSgB8EOwsfVnuHa7APbMNwe1m0a_u0lufKZAyiwFWCCYiGdfpcrS_tX9CyIX0lZCgnZqGz5xZqrdmClIXuQXqzM_q8YoHwgmbj7rcfYz0v_0F6SLzNABW-QRg-lc0d5YugME5_yPFbgel3vklktlZn_ssAU1UQ6SEJ0DB1XJLeqzUM8Uk',
};

const debtClock = {
  baseDebt: 92000000000000,
  baseTime: Date.parse('2026-01-01T00:00:00Z'),
  perSecondIncrease: 124500,
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const riskCards = [
  {
    title: 'Climate Leverage',
    body:
      "Emerging markets are forced to pay a risk premium on debt specifically because of their exposure to climate events they did not cause.",
  },
  {
    title: 'Currency Volatility',
    body:
      'The strengthening of the dollar makes repayment of USD-denominated loans impossible for nations with devaluing local currencies.',
  },
];

const keyStats = [
  ['Total Sovereign Debt', '$92 Trillion'],
  ['Interest as % of Revenue', '18% (Avg)'],
  ['Population at Risk', '3.3 Billion'],
];

const analysisRows = [
  ['Estimated Base (Q1 2026)', '$92,000,000,000,000'],
  ['Annual Accumulation Rate', '~$3.92 Trillion / year'],
  ['Per-Second Accumulation Rate', '+$124,500 / sec'],
  ['Debt-to-GDP Ratio in Least Developed Nations', '84% (Avg)'],
];

const downloadStages = [
  { limit: 20, message: 'Connecting to UNCTAD mirrors...' },
  { limit: 45, message: 'Resolving sovereign ledger database...' },
  { limit: 75, message: 'Decrypting report metadata assets...' },
  { limit: 90, message: 'Assembling zine publication layouts...' },
  { limit: 100, message: 'Synthesizing output document...' },
];

const bulletins = [
  {
    id: 'zambia',
    tag: 'Debt Alert',
    tone: 'error',
    summary: 'IMF warns of immediate liquidity crisis in Zambia.',
    title: 'Debt Alert: Zambia Crisis',
    text:
      'Negotiations with private sector creditors have hit an impasse, threatening the sovereign restructuring roadmap. The IMF has expressed concern over immediate liquidity shortfalls. Essential public service funding is being diverted to cover high-interest debt instruments, worsening conditions for local infrastructure and healthcare networks.',
  },
  {
    id: 'pakistan',
    tag: 'Market Watch',
    tone: 'primary',
    summary: 'Bond yield spikes in Pakistan as reserves drop.',
    title: 'Market Watch: Pakistan Reserves',
    text:
      'Foreign exchange reserves dropped below critical thresholds, triggering a spike in short-term government bond yields. External debt service payments scheduled for the upcoming quarters are compounding pressure on local currency valuations, forcing policy makers to explore emergency liquidity swap options.',
  },
  {
    id: 'brazil',
    tag: 'Policy Shift',
    tone: 'secondary',
    summary: 'Brazil pushes for new global debt framework.',
    title: 'Policy Shift: Sovereign Framework',
    text:
      'At the international economic summit, Brazil laid out a draft proposal for a comprehensive global debt resolution mechanism. The proposal advocates for writing down public debt in exchange for local green infrastructure investments, claiming that current institutional lending frameworks maintain historic financial dependency chains.',
  },
];

function formatDebtValue() {
  const elapsedMs = Math.max(0, Date.now() - debtClock.baseTime);
  const computedDebt = debtClock.baseDebt + (elapsedMs * debtClock.perSecondIncrease) / 1000;
  return currencyFormatter.format(computedDebt);
}

function CloseIcon() {
  return (
    <svg className="global-debt-article__close-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4 4 12 12M16 4 4 16" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

function AlertMark() {
  return (
    <span className="global-debt-article__stamp" aria-hidden="true">
      !
    </span>
  );
}

export default function GlobalDebtArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [debtValue, setDebtValue] = useState(() => formatDebtValue());
  const [activeModal, setActiveModal] = useState(null);
  const [activeBulletin, setActiveBulletin] = useState(null);
  const [downloadState, setDownloadState] = useState({
    progress: 0,
    status: 'Establishing encrypted connection to server archives...',
    complete: false,
  });

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setActiveBulletin(null);
  }, []);

  const openDownload = useCallback(() => {
    setDownloadState({
      progress: 0,
      status: 'Establishing encrypted connection to server archives...',
      complete: false,
    });
    setActiveModal('download');
  }, []);

  const openBulletin = useCallback((bulletin) => {
    setActiveBulletin(bulletin);
    setActiveModal('bulletin');
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const syncProgress = () => {
      if (progressFrameRef.current) return;

      progressFrameRef.current = window.requestAnimationFrame(() => {
        progressFrameRef.current = 0;
        const scrollable = scroller.scrollHeight - scroller.clientHeight;
        const nextProgress = scrollable > 0 ? (scroller.scrollTop / scrollable) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, nextProgress)));
      });
    };

    syncProgress();
    scroller.addEventListener('scroll', syncProgress, { passive: true });

    return () => {
      window.cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = 0;
      scroller.removeEventListener('scroll', syncProgress);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-global-debt-reveal]'));
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
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.12,
      },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDebtValue(formatDebtValue());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeModal !== 'download' || downloadState.complete) return undefined;

    const intervalId = window.setInterval(() => {
      setDownloadState((current) => {
        if (current.complete) return current;

        const nextProgress = Math.min(100, current.progress + 8);
        if (nextProgress >= 100) {
          window.clearInterval(intervalId);
          return {
            progress: 100,
            status: 'Compilation complete.',
            complete: true,
          };
        }

        const activeStage = downloadStages.find((stage) => nextProgress <= stage.limit) ?? downloadStages.at(-1);
        return {
          progress: nextProgress,
          status: activeStage.message,
          complete: false,
        };
      });
    }, reducedMotion ? 80 : 180);

    return () => window.clearInterval(intervalId);
  }, [activeModal, downloadState.complete, reducedMotion]);

  useEffect(() => {
    if (!activeModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

  return (
    <article className="global-debt-article" aria-label={`${project.title} article`}>
      <div
        className="global-debt-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />
      <div className="global-debt-article__paper-texture" aria-hidden="true" />

      <div className="global-debt-article__scroll" ref={scrollRef} data-lenis-prevent>
        <header className="global-debt-article__header">
          <div className="global-debt-article__header-inner">
            <span className="global-debt-article__logo">FISCAL COLLAPSE</span>
            <span className="global-debt-article__header-meta">SOVEREIGN LEDGER // 2026</span>
          </div>
        </header>

        <main className="global-debt-article__container">
          <section className="global-debt-article__hero" data-global-debt-reveal>
            <div className="global-debt-article__hero-bg">
              <img
                src={images.hero}
                alt="A grayscale collage of global distress, financial market screens, and development pressure."
                decoding="async"
              />
            </div>
            <div className="global-debt-article__hero-content">
              <div className="global-debt-article__title-collage" aria-label="Global debt">
                <span className="global-debt-article__collage-word is-global">GLOBAL</span>
                <span className="global-debt-article__collage-word is-debt">DEBT</span>
              </div>
              <div className="global-debt-article__hero-title-box">
                <h1>&amp; Fiscal Collapse in Developing Nations</h1>
              </div>
              <p className="global-debt-article__hero-badge">
                UNCTAD and WEF Warn of a Looming Development Trap
              </p>
            </div>
          </section>

          <div className="global-debt-article__main-grid">
            <div className="global-debt-article__story">
              <section className="global-debt-article__section" data-global-debt-reveal>
                <span className="global-debt-article__section-label">PART 01 // SYSTEMIC FRAGILITY</span>
                <h2 className="global-debt-article__section-title">The Structural Trap</h2>
                <div className="global-debt-article__copy">
                  <p>
                    For decades, developing nations have been caught in a cycle of high-interest borrowing and
                    systemic underinvestment. The current landscape is not just a fiscal hurdle; it is a meticulously
                    constructed architecture of dependency. As global interest rates surge, the cost of servicing
                    sovereign debt has eclipsed national spending on health, education, and infrastructure combined in
                    over 30 countries.
                  </p>
                  <div className="global-debt-article__pull-quote">
                    <span>Pull Quote</span>
                    <blockquote>
                      "Debt is no longer merely a financial issue, it has become a development trap that strangles the
                      future of an entire generation."
                    </blockquote>
                  </div>
                  <p>
                    The Development Trap occurs when a nation's fiscal space is so constrained by debt obligations that
                    it cannot invest in the very drivers of growth needed to outpace that debt. UNCTAD reports indicate
                    that nearly half of the global population lives in countries where interest payments exceed
                    healthcare budgets.
                  </p>
                </div>
              </section>

              <section className="global-debt-article__risks" data-global-debt-reveal>
                <AlertMark />
                <h2>Global Risks 2026</h2>
                <p>
                  The World Economic Forum's latest projections for 2026 highlight a tipping point. Climate
                  vulnerability, coupled with currency devaluation, creates a polycrisis effect. Smaller economies,
                  particularly in Sub-Saharan Africa and Southeast Asia, are seeing their debt-to-GDP ratios swell to
                  unsustainable levels not seen since the 1980s.
                </p>
                <div className="global-debt-article__risk-grid">
                  {riskCards.map((risk) => (
                    <article className="global-debt-article__risk-card" key={risk.title}>
                      <h3>{risk.title}</h3>
                      <p>{risk.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="global-debt-article__section" data-global-debt-reveal>
                <h2 className="global-debt-article__section-title">The Inequality Engine</h2>
                <div className="global-debt-article__copy">
                  <p>
                    The global financial system operates as a funnel, extracting wealth from the periphery to the core.
                    Private creditors now hold the majority of developing world debt, and unlike sovereign lenders, they
                    show little interest in debt relief or restructuring. This Inequality Engine ensures that while the
                    Global North discusses a transition to green energy, the Global South remains shackled to the coal
                    and oil projects of the past just to maintain liquidity.
                  </p>
                </div>
                <figure className="global-debt-article__media-card">
                  <img
                    src={images.lockedIn}
                    alt="Industrial gears and heavy chains representing systemic economic entrapment."
                    decoding="async"
                    loading="lazy"
                  />
                  <figcaption>
                    <strong>Locked In</strong>
                    <span>
                      "Infrastructure built on high-interest loans is infrastructure that the people can never truly
                      own." - FISCAL COLLAPSE EDITORIAL BOARD
                    </span>
                  </figcaption>
                </figure>
              </section>
            </div>

            <aside className="global-debt-article__sidebar" aria-label="Fiscal collapse data sidebar">
              <section className="global-debt-article__monitor" data-global-debt-reveal>
                <div className="global-debt-article__monitor-top">
                  <span>LIVE MONITOR</span>
                  <span className="global-debt-article__live-dot" aria-hidden="true" />
                </div>
                <h2>Global Sovereign Debt</h2>
                <output className="global-debt-article__debt-clock" aria-label="Simulated global sovereign debt">
                  {debtValue}
                </output>
                <p>
                  Sovereign debt accumulating in real time at a rate of <strong>+$124,500/sec</strong>. Click
                  Analysis to view projection parameters.
                </p>
                <button type="button" className="global-debt-article__button is-compact" onClick={() => setActiveModal('analysis')}>
                  Analysis
                </button>
              </section>

              <section className="global-debt-article__stats-card" data-global-debt-reveal>
                <h2>Key Stats</h2>
                <ul>
                  {keyStats.map(([label, value]) => (
                    <li key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
                </ul>
                <button type="button" className="global-debt-article__button" onClick={openDownload}>
                  DOWNLOAD FULL PDF
                </button>
              </section>

              <section className="global-debt-article__bulletins" data-global-debt-reveal>
                <h2>Urgent Bulletins</h2>
                <div className="global-debt-article__bulletin-list">
                  {bulletins.map((bulletin) => (
                    <button
                      type="button"
                      className="global-debt-article__bulletin"
                      key={bulletin.id}
                      onClick={() => openBulletin(bulletin)}
                    >
                      <span className={`global-debt-article__bulletin-tag is-${bulletin.tone}`}>{bulletin.tag}</span>
                      <span>{bulletin.summary}</span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>

        <footer className="global-debt-article__footer">
          <span>FISCAL COLLAPSE</span>
          <p>
            Copyright 2026 FISCAL COLLAPSE. A radical economic publication documenting systemic collapse through data
            and dissent.
          </p>
        </footer>
      </div>

      {activeModal ? (
        <div
          className="global-debt-article__modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={
            activeModal === 'analysis'
              ? 'Debt counter parameters'
              : activeModal === 'download'
                ? 'Download full PDF'
                : activeBulletin?.title
          }
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="global-debt-article__modal">
            <button type="button" className="global-debt-article__modal-close" onClick={closeModal}>
              <CloseIcon />
              <span>Close dialog</span>
            </button>

            {activeModal === 'analysis' ? (
              <>
                <h2>Debt Clock Parameters</h2>
                <p>
                  The real-time global debt clock scales using data modeled from UNCTAD, World Bank, and IMF reports.
                </p>
                <div className="global-debt-article__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisRows.map(([label, value]) => (
                        <tr key={label}>
                          <td>{label}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="global-debt-article__modal-note">
                  Disclaimer: This ticker represents a mathematical simulation of global liquidity expansion based on
                  cumulative sovereign and public liabilities.
                </p>
              </>
            ) : null}

            {activeModal === 'download' ? (
              <>
                <h2>{downloadState.complete ? 'Archive Pulled' : 'Pulling Archive'}</h2>
                <p>{downloadState.status}</p>
                <div className="global-debt-article__download-track" aria-label="Download progress">
                  <span style={{ '--download-progress': `${downloadState.progress}%` }} />
                </div>
                <p className={`global-debt-article__download-success ${downloadState.complete ? 'is-visible' : ''}`}>
                  DOWNLOAD SUCCESSFUL. FILE WRITTEN.
                </p>
              </>
            ) : null}

            {activeModal === 'bulletin' && activeBulletin ? (
              <>
                <h2>{activeBulletin.title}</h2>
                <p>{activeBulletin.text}</p>
                <p className="global-debt-article__modal-note">SOURCE: FISCAL COLLAPSE RESEARCH UNIT</p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
