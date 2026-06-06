import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAdVrMt557Bxuz7TQHQpFzjuQYKs8KF2AS0u9E-wQtB41AgZZhBOr9yBGa-oPF6_sNqZoNJzlurnbUaPHs-SzbwvnoNjLo0hbcmTuDK378wC3FZp4tEGiR8hk7I8fEMQ1kU4gc_xpBnEmEUZ-Y7Pn7mkOIkI2jxKTeE8i6mG_8-1qtqCELT9xwH_Hd-2Ma8Q1gNvTJSQ0x2Eb_aD7FYvceB80396kYamQnRZ6NP9WUvly3WOKXkJm0a28zdpcc_M4y6YhZNDEj2v3Q';

const warRoomImage = '/article_assets/armed-conflict/war-room.png';

const towerImage = '/article_assets/armed-conflict/tower.png';

const interstitialImage = '/article_assets/armed-conflict/battlefield.png';

const navItems = [
  ['prelude', 'Prelude'],
  ['shifting-nature', 'Warfare Sectors'],
  ['fractured-system', 'Global Fractures'],
  ['conclusion', 'Summary'],
];

const stats = [
  {
    value: '1/7',
    tone: 'primary',
    label: 'People living under threat',
    source: 'Source: ICRC 2026 Analysis',
  },
  {
    value: '$100B',
    tone: 'secondary',
    label: 'Ukraine support commitments',
    source: 'Fiscal Year 2026 Projected',
  },
  {
    value: '124',
    tone: 'urgent',
    label: 'Active state conflicts',
    source: 'Global Conflict Database',
  },
];

const techCards = [
  {
    id: 'autonomous',
    code: 'UAV',
    title: 'Autonomous Systems',
    description: 'Proliferation of AI-driven drone swarms and uncrewed maritime vessels.',
  },
  {
    id: 'cyber',
    code: 'NET',
    title: 'Cyber Operations',
    description: 'Persistent digital siege of critical infrastructure and financial systems.',
  },
  {
    id: 'space',
    code: 'ORB',
    title: 'Outer-Space Competition',
    description: 'Weaponization of satellite orbits and orbital interception capabilities.',
  },
];

const logData = {
  autonomous: [
    { text: 'CRITICAL: INITIALIZING STRATNET TACTICAL HANDSHAKE...', type: 'info' },
    { text: 'CONNECTING TO SECURE NODE: Drone-UAV-Central...', type: 'normal' },
    { text: 'DECRYPTING NODE SIGINT FIELD... [SUCCESS]', type: 'success' },
    { text: 'AUDITING AUTONOMOUS VECTOR METRICS:', type: 'info' },
    { text: '>> AI SWARM DENSITY: 142 Active UAV Coordinates Identified', type: 'warning' },
    { text: '>> MARITIME UMV TELEMETRY: 24 Vessels in Sector 3 (South China Sea)', type: 'warning' },
    { text: '>> PATHFINDER DECISION-ENGINE: Autonomous Targeting Rules Active', type: 'error' },
    { text: 'WARNING: ATTRITION RATES EXCEED PREDICTED THRESHOLDS BY 14.8%', type: 'warning' },
    { text: 'INTELLIGENCE PAYLOAD SECURED. AUDIT RECORDED.', type: 'success' },
  ],
  cyber: [
    { text: 'CRITICAL: ESTABLISHING NETWORK FIREWALL AUDIT...', type: 'info' },
    { text: 'PINGING CORE DEFENSE NODES... RESPONSE 14ms [SECURE]', type: 'normal' },
    { text: 'DETECTING THREAT VECTORS IN PROGRESS...', type: 'warning' },
    { text: '>> DIGITAL SIEGE DETECTED: IP Block range 194.22.0.0/16', type: 'error' },
    { text: '>> PROTOCOL ABUSE: Overflow attempt detected on grid SCADA systems', type: 'error' },
    { text: ">> ATTRIBUTION SPECTRUM: Signature matches 'State-Sponsored Actor'", type: 'warning' },
    { text: 'COUNTERMEASURES: Dynamic DNS routing and payload scrubbing active.', type: 'success' },
    { text: 'DECRYPTION COMPLETE. DATA ARCHIVED.', type: 'success' },
  ],
  space: [
    { text: 'CRITICAL: CONNECTING TO SATELLITE COMMAND DATALINK...', type: 'info' },
    { text: 'RESOLVING SPACE-TRACKING ORBITAL COORDINATES...', type: 'normal' },
    { text: 'ESTABLISHING LASER FEED FOR LOW EARTH ORBIT (LEO) NODES...', type: 'normal' },
    { text: 'ASAT (ANTI-SATELLITE) INTERCEPT SCANNING ACTIVE:', type: 'info' },
    { text: '>> OBJECT TRACKING: LEO-241 (Sovereign communications transponder)', type: 'warning' },
    { text: '>> DEVIATION DETECTED: Kinematic interception course plotted by LEO-Object-99', type: 'error' },
    { text: '>> STATUS: Spacecraft status downgraded to HIGH RISK OF DEBRIS FIELD', type: 'error' },
    { text: 'ENCRYPTED TELEMETRY STREAM ACQUIRED.', type: 'success' },
  ],
};

function formatTerminalTime() {
  return new Date().toTimeString().split(' ')[0];
}

export default function ArmedConflictArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const heroBgRef = useRef(null);
  const terminalBodyRef = useRef(null);
  const consoleDialogRef = useRef(null);
  const timersRef = useRef([]);
  const [consoleState, setConsoleState] = useState({
    open: false,
    sector: null,
    title: '',
    subtitle: '',
    actionLabel: 'DISMISS CONNECTION',
  });
  const [terminalLines, setTerminalLines] = useState([]);
  const [terminalComplete, setTerminalComplete] = useState(false);
  const [terminalTime, setTerminalTime] = useState(formatTerminalTime);

  const clearTerminalTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const closeConsole = useCallback(() => {
    clearTerminalTimers();
    setConsoleState((current) => ({ ...current, open: false }));
    setTerminalLines([]);
    setTerminalComplete(false);
    if (typeof window !== 'undefined') {
      window.projectsArticleConsoleOpen = false;
      delete window.projectsArticleCloseConsole;
    }
  }, [clearTerminalTimers]);

  const openConsole = useCallback((sector) => {
    const card = techCards.find((item) => item.id === sector);
    if (!card) return;

    clearTerminalTimers();
    setTerminalLines([]);
    setTerminalComplete(false);
    setTerminalTime(formatTerminalTime());
    setConsoleState({
      open: true,
      sector,
      title: `${card.title.toUpperCase()} TACTICAL LINK`,
      subtitle: 'AUDITING SECURE SENSOR FIELDS...',
      actionLabel: 'DISMISS CONNECTION',
    });
  }, [clearTerminalTimers]);

  const scrollToSection = useCallback((sectionId) => {
    const target = scrollRef.current?.querySelector(`#${sectionId}`);
    target?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-article-reveal]'));
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
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const scroller = scrollRef.current;
    const heroBg = heroBgRef.current;
    if (!scroller || !heroBg) return undefined;

    let frameId = 0;
    const syncParallax = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const offset = Math.min(scroller.scrollTop, scroller.clientHeight);
        heroBg.style.transform = `scale(1.05) translateY(${(offset * 0.22).toFixed(2)}px)`;
      });
    };

    syncParallax();
    scroller.addEventListener('scroll', syncParallax, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      scroller.removeEventListener('scroll', syncParallax);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!consoleState.open) return undefined;

    const intervalId = window.setInterval(() => {
      setTerminalTime(formatTerminalTime());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [consoleState.open]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.projectsArticleConsoleOpen = consoleState.open;
    if (consoleState.open) {
      window.projectsArticleCloseConsole = closeConsole;
    }

    return () => {
      if (window.projectsArticleConsoleOpen) window.projectsArticleConsoleOpen = false;
      if (window.projectsArticleCloseConsole === closeConsole) {
        delete window.projectsArticleCloseConsole;
      }
    };
  }, [closeConsole, consoleState.open]);

  useEffect(() => {
    if (!consoleState.open || !consoleState.sector) return undefined;

    clearTerminalTimers();
    const lines = logData[consoleState.sector] ?? [];

    if (reducedMotion) {
      const timerId = window.setTimeout(() => {
        setTerminalLines(lines);
        setTerminalComplete(true);
      }, 0);
      timersRef.current.push(timerId);
      return clearTerminalTimers;
    }

    lines.forEach((line, index) => {
      const timerId = window.setTimeout(() => {
        setTerminalLines((current) => [...current, line]);
        if (index === lines.length - 1) setTerminalComplete(true);
      }, 180 + index * 210);
      timersRef.current.push(timerId);
    });

    return clearTerminalTimers;
  }, [clearTerminalTimers, consoleState.open, consoleState.sector, reducedMotion]);

  useEffect(() => {
    terminalBodyRef.current?.scrollTo({
      top: terminalBodyRef.current.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [terminalLines, reducedMotion]);

  useEffect(() => {
    if (!consoleState.open) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      consoleDialogRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [consoleState.open]);

  useEffect(() => () => {
    clearTerminalTimers();
    if (typeof window !== 'undefined') window.projectsArticleConsoleOpen = false;
  }, [clearTerminalTimers]);

  return (
    <article
      className="armed-conflict-article"
      aria-label={`${project.title} article`}
    >
      <div className="armed-conflict-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className="armed-conflict-article__navbar" aria-label="Dispatch article sections">
          <div className="armed-conflict-article__container armed-conflict-article__navbar-container">
            <div className="armed-conflict-article__brand">DISPATCH: 2026</div>
            <div className="armed-conflict-article__nav-links">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className="armed-conflict-article__nav-link"
                  onClick={() => scrollToSection(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <header className="armed-conflict-article__hero">
          <div className="armed-conflict-article__hero-bg-container" aria-hidden="true">
            <div
              ref={heroBgRef}
              className="armed-conflict-article__hero-bg"
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
            <div className="armed-conflict-article__vignette" />
            <div className="armed-conflict-article__hero-gradient" />
          </div>
          <div className="armed-conflict-article__hero-content">
            <h1 className="armed-conflict-article__display armed-conflict-article__hero-title">
              2026: <span>A World in Conflict</span>
            </h1>
            <p className="armed-conflict-article__body-lg armed-conflict-article__hero-subtitle">
              "The defining crisis of a fractured global system."
            </p>
            <div className="armed-conflict-article__scroll-indicator" aria-hidden="true">
              <span>BEGIN TRANSMISSION</span>
              <span className="armed-conflict-article__scroll-mark">VV</span>
            </div>
          </div>
        </header>

        <main>
          <section
            className="armed-conflict-article__section armed-conflict-article__prelude"
            id="prelude"
            data-article-reveal
          >
            <div className="armed-conflict-article__container">
              <div className="armed-conflict-article__prelude-grid">
                <div className="armed-conflict-article__prelude-content">
                  <div className="armed-conflict-article__section-kicker">
                    <div />
                    <span>PRELUDE</span>
                    <div />
                  </div>
                  <p className="armed-conflict-article__prelude-text">
                    The world is experiencing more active wars than at any point since World War II. One in seven people globally now lives under the direct threat of armed conflict. The architecture of the 20th century is dissolving, replaced by a volatile landscape of multi-polar aggression and high-tech attrition.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="armed-conflict-article__stats-band" data-article-reveal>
            <div className="armed-conflict-article__container">
              <div className="armed-conflict-article__stats-grid">
                {stats.map((stat) => (
                  <div className="armed-conflict-article__stats-card" key={stat.label}>
                    <h3 className={`armed-conflict-article__stats-number is-${stat.tone}`}>
                      {stat.value}
                    </h3>
                    <p>{stat.label}</p>
                    <div>{stat.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className="armed-conflict-article__section armed-conflict-article__shifting"
            id="shifting-nature"
            data-article-reveal
          >
            <div className="armed-conflict-article__container">
              <div className="armed-conflict-article__shifting-grid">
                <div className="armed-conflict-article__shifting-copy">
                  <h2 className="armed-conflict-article__headline">
                    The Shifting <br />
                    <span>Nature of War</span>
                  </h2>
                  <p className="armed-conflict-article__body-md">
                    The battlefield has expanded beyond the terrestrial. In 2026, the ICRC notes that conflict is no longer confined to the physical exchange of kinetic force. It has migrated into the invisible and the infinite.
                  </p>

                  <div className="armed-conflict-article__tech-list" aria-label="Warfare sectors">
                    {techCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className="armed-conflict-article__tech-card"
                        onClick={() => openConsole(card.id)}
                        aria-label={`Open tactical console for ${card.title}`}
                      >
                        <span className="armed-conflict-article__tech-glow" aria-hidden="true" />
                        <span className="armed-conflict-article__tech-code" aria-hidden="true">
                          {card.code}
                        </span>
                        <span className="armed-conflict-article__tech-title">{card.title}</span>
                        <span className="armed-conflict-article__tech-desc">{card.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="armed-conflict-article__war-image-shell">
                  <img
                    src={warRoomImage}
                    alt="Gritty tactical control room with radar monitoring maps"
                    className="armed-conflict-article__war-image"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="armed-conflict-article__image-stamp">
                    IMAGE REF: ARCHIVE_11 // SIGINT INTERCEPT // SECTOR 7-B
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="armed-conflict-article__bento-band"
            id="fractured-system"
            data-article-reveal
          >
            <div className="armed-conflict-article__container">
              <div className="armed-conflict-article__bento-header">
                <span>GEOPOLITICAL ANALYSIS</span>
                <h2 className="armed-conflict-article__headline">A Fractured Global System</h2>
              </div>
              <div className="armed-conflict-article__bento-grid">
                <div className="armed-conflict-article__bento-card armed-conflict-article__bento-card--large">
                  <img
                    src={towerImage}
                    alt="Derelict militarized lookout tower at dusk"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="armed-conflict-article__bento-content">
                    <h3>Geoeconomic Confrontation</h3>
                    <p>
                      Trade is no longer a tool of cooperation but a theater of war. Sanctions, decoupling, and resource hoarding have created a split global market.
                    </p>
                  </div>
                </div>

                <div className="armed-conflict-article__bento-card armed-conflict-article__bento-card--medium">
                  <div className="armed-conflict-article__bento-content is-top">
                    <span className="armed-conflict-article__bento-glyph" aria-hidden="true">ST</span>
                    <h3>State-Based Conflict</h3>
                    <p>
                      The return of large-scale state-on-state warfare has broken the long peace. National interests are now enforced through military mobilization rather than multilateral treaties.
                    </p>
                  </div>
                </div>

                <div className="armed-conflict-article__bento-card">
                  <div className="armed-conflict-article__bento-content is-top">
                    <p className="armed-conflict-article__bento-meta">01 // COALITION</p>
                    <p>Weakening of traditional alliances as regional powers assert autonomy.</p>
                  </div>
                </div>

                <div className="armed-conflict-article__bento-card">
                  <div className="armed-conflict-article__bento-content is-top">
                    <p className="armed-conflict-article__bento-meta">02 // DIPLOMACY</p>
                    <p>The paralysis of global bodies has left a vacuum in conflict resolution.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="armed-conflict-article__interstitial"
            style={{ backgroundImage: `url('${interstitialImage}')` }}
            data-article-reveal
          >
            <div className="armed-conflict-article__interstitial-overlay" />
            <div className="armed-conflict-article__interstitial-content">
              <blockquote>
                "War does not determine who is right - only who is left."
              </blockquote>
            </div>
          </section>

          <section
            className="armed-conflict-article__section armed-conflict-article__conclusion"
            id="conclusion"
            data-article-reveal
          >
            <div className="armed-conflict-article__container armed-conflict-article__conclusion-container">
              <div className="armed-conflict-article__red-divider" />
              <h2 className="armed-conflict-article__display">The Return of Power Politics</h2>
              <p className="armed-conflict-article__body-lg">
                As we navigate the mid-point of this decade, the optimistic visions of global integration have been replaced by a somber reality: power politics have returned. The weakening of diplomacy is not just a failure of institutions; it is a fundamental shift in how the world conceives of security. We are entering an era where the only constant is volatility.
              </p>
            </div>
          </section>
        </main>

        <footer className="armed-conflict-article__footer">
          <div className="armed-conflict-article__container armed-conflict-article__footer-container">
            <div>
              <div className="armed-conflict-article__footer-brand">DISPATCH</div>
              <div className="armed-conflict-article__footer-kicker">GLOBAL STRATEGY ARCHIVE</div>
            </div>
            <p>(c) 2026 GLOBAL STRATEGY ARCHIVE. ALL RIGHTS RESERVED.</p>
          </div>
        </footer>
      </div>

      {consoleState.open && (
        <div
          className="armed-conflict-article__console-overlay"
          onClick={closeConsole}
          role="presentation"
        >
          <div
            className="armed-conflict-article__console"
            role="dialog"
            aria-modal="true"
            aria-labelledby="armed-conflict-console-title"
            aria-describedby="armed-conflict-console-subtitle"
            tabIndex={-1}
            ref={consoleDialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="armed-conflict-article__console-close"
              aria-label="Close tactical console"
              onClick={closeConsole}
            >
              Close
            </button>
            <h3 id="armed-conflict-console-title">{consoleState.title}</h3>
            <p id="armed-conflict-console-subtitle">{consoleState.subtitle}</p>

            <div className="armed-conflict-article__terminal">
              <div className="armed-conflict-article__scan-bar" aria-hidden="true" />
              <div className="armed-conflict-article__terminal-header">
                <span>HOST: STRATNET-NODE-2026</span>
                <span>SYS_TIME: {terminalTime}</span>
              </div>
              <div
                className="armed-conflict-article__terminal-body"
                ref={terminalBodyRef}
                role="log"
                aria-live="polite"
                aria-atomic="false"
              >
                {terminalLines.map((line, index) => (
                  <div
                    className={`armed-conflict-article__terminal-row is-${line.type}`}
                    key={`${line.text}-${index}`}
                  >
                    {line.text}
                  </div>
                ))}
                {!terminalComplete && (
                  <div className="armed-conflict-article__terminal-row is-info">
                    _
                  </div>
                )}
              </div>
            </div>

            <div className="armed-conflict-article__console-actions">
              <button
                type="button"
                className="armed-conflict-article__console-action"
                onClick={closeConsole}
                disabled={!terminalComplete}
              >
                {consoleState.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
