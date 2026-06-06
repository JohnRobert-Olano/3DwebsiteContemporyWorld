import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage = {
  src: '/article_assets/ai-global-healthcare/hero.png',
  alt: 'Clinical AI interface over a global healthcare network',
};

const authorImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0UKR37zwddKz-oDBHgbK5VwXe-rDHu6O3t7VY6Bys9mTxo18J-Plx-ewLFOAXn0WDNZs3cLimMvsqbAsJpCtszVSLfxg2BvUtkMBG-VVo5q-OjFXSYc2krmF_IXub10Q7wccpxOVhDmr9svzWX5WwRKwKJrtWFFR6ZcRZyAhLpMk85lCtu0jdDQqIKtKuFL0p8sNziBOKCTHr5lXPxpcoNaSIfYemVgr80r_t6jJ4yFipkLE5ykEwICtup10vczwjhqjPAv58rc4',
  alt: 'Medical insights researcher profile portrait',
};

const networkImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCI2xtEmJKVqPqJwclDgcCuBUvATvqp5vlhKa2UcT2n4Dl-Gt3mOyY0V8An6mcWzJyjvdVyeysYxYEKT8XpjUlxOQ_7jH3xA4LOvXZXeSyTO0cvYAr6wNbjPxmcnkhPRem9D7axrxJM2t3yAfNrBOKm9iJjUJpeAtGfsATDLnE67zGh5vO8wzRF1Ck1sW05m_52x1leU6RVMwQxwnBUC4fJzms3t7Ab68ZH-r4jyohi5dJHyFmaKPiOWGMZfxoQl70zwwgEjZI0uQQ',
  alt: 'Connected healthcare network visualization',
  caption: 'Digital innovations are scaling up to create a more connected health network.',
};

const articleMeta = {
  brand: 'ClinicalAI',
  badge: 'Feature Article',
  date: 'March 14, 2026',
  author: 'Medical Insights',
  division: 'AI Diagnostic Division',
  footer: 'Copyright 2026 Clinical AI Research Institute. All rights reserved.',
};

const tocItems = [
  { id: 'overview', label: 'Overview', icon: 'lightbulb' },
  { id: 'capabilities', label: 'AI Capabilities', icon: 'speed' },
  { id: 'economics', label: 'Health Economics', icon: 'payments' },
];

const overview = {
  title: 'Overview',
  text:
    'Artificial intelligence and global healthcare systems are rapidly transforming the world by democratizing access to essential services and medical expertise, effectively bridging long-standing gaps in healthcare equity and diagnostic capabilities.',
};

const articleCopy = {
  capabilitiesLead:
    'Right now, an estimated 4.5 billion people worldwide lack access to basic healthcare, representing a staggering global deficit of resources, time, and medical professionals. But a new wave of artificial intelligence is stepping in to address this massive gap, not by replacing doctors, but by giving them unprecedented capabilities.',
  pullquote:
    'AI is proving capable of interpreting medical scans with an accuracy that frequently outpaces human clinicians.',
  capabilitiesBodyBefore:
    'By automating routine diagnoses and analyzing complex data in seconds, AI software is proving capable of interpreting medical scans and patient symptoms with an accuracy that frequently outpaces human clinicians. In high-stakes scenarios where every second counts, AI is already proving its worth; for example, modern AI-powered stroke detectors are currently operating with ',
  capabilitiesBodyEmphasis: 'twice the accuracy of human doctors',
  capabilitiesBodyAfter:
    '. By catching what the human eye might miss, these programs are significantly cutting down on missed diagnoses and radically speeding up treatment plans.',
  economicsOne:
    'This technological leap means medical staff can act faster, triage more effectively, and extend their reach into remote and underserved clinics that previously lacked specialized diagnostic tools. The ripple effects go far beyond just accurate scans, fundamentally reshaping the economics of medicine.',
  economicsTwo:
    'According to a 2025 review by Forbes Advisor, AI digital health solutions hold the potential to enhance efficiency, reduce costs, and improve health outcomes globally. By streamlining the administrative and diagnostic bottlenecks that traditionally slow down medical care, both massive urban hospitals and small rural clinics are suddenly finding themselves with newfound capacity.',
  future:
    "Ultimately, global collaboration on medical AI is doing more than just advancing science - it is creating a more connected, efficient health network. As these digital innovations scale up, they are laying the groundwork for a future where high-quality, affordable medical care isn't a geographic lottery, but an accessible reality for all.",
};

const diagnosticCards = [
  {
    id: 'speed',
    icon: 'speed',
    title: 'Unprecedented Speed',
    description: 'Analyzing complex diagnostic data in seconds rather than hours, enabling immediate clinical triage.',
  },
  {
    id: 'reach',
    icon: 'clinical',
    title: 'Universal Reach',
    description: 'Extending specialized diagnostic tools to remote clinics that previously lacked access to specialist staff.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}



function Icon({ name, className = 'ai-global-healthcare-article__icon' }) {
  const paths = {
    analytics: 'M4 19V5M4 19h17M8 16v-5M12 16V8M16 16v-3M20 16V6',
    search:
      'm16.2 16.2 4.3 4.3M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
    bookmark: 'M6 4h12v17l-6-3.7L6 21V4Z',
    share: 'M8 12h8M14 6l6 6-6 6M4 4v16',
    subscribe: 'M4 6h16v12H4V6Zm1 1 7 6 7-6',
    close: 'm5 5 10 10M15 5 5 15',
    lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c.8.7 1 1.5 1 3h6c0-1.5.2-2.3 1-3a7 7 0 0 0-4-12Z',
    speed: 'M12 20a8 8 0 1 0-8-8M12 12l5-5M4 20h16',
    payments: 'M4 7h16v10H4V7Zm0 3h16M7 15h4',
    clinical: 'M12 4v16M4 12h16M7 7h10v10H7V7Z',
    copy: 'M8 8h11v11H8V8ZM5 15H4V4h11v1',
    mail: 'M4 6h16v12H4V6Zm1 1 7 6 7-6',
    group: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5M3 20c.7-4 3-6 6-6s5.3 2 6 6M14 15c2.6.3 4.3 2 5 5',
    chat: 'M5 5h14v10H8l-4 4V5Z',
  };

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d={paths[name]} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.9" />
    </svg>
  );
}

export default function AIGlobalHealthcareArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const progressFrameRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const setSectionRef = useCallback(
    (id) => (node) => {
      if (node) sectionRefs.current[id] = node;
    },
    [],
  );

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateScrollState = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const nextProgress = maxScroll > 0 ? (scroller.scrollTop / maxScroll) * 100 : 0;
      const scrollPosition = scroller.scrollTop + 140;

      let currentSection = 'overview';
      tocItems.forEach((item) => {
        const node = sectionRefs.current[item.id];
        if (node && scrollPosition >= node.offsetTop) currentSection = item.id;
      });

      setProgress(clamp(nextProgress, 0, 100));
      setNavScrolled(scroller.scrollTop > 40);
      setActiveSection((current) => (current === currentSection ? current : currentSection));
      progressFrameRef.current = 0;
    };

    const handleScroll = () => {
      if (progressFrameRef.current) return;
      progressFrameRef.current = requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    scroller.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-ai-healthcare-reveal]'));
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

  useEffect(
    () => () => {
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
    },
    [],
  );

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  const scrollToSection = useCallback(
    (id) => {
      const scroller = scrollRef.current;
      const section = sectionRefs.current[id];
      if (!scroller || !section) return;

      scroller.scrollTo({
        top: Math.max(section.offsetTop - 90, 0),
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [reducedMotion],
  );

  const handleSpotlight = useCallback(
    (event) => {
      if (reducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    },
    [reducedMotion],
  );

  const resetSpotlight = useCallback((event) => {
    event.currentTarget.style.removeProperty('--mouse-x');
    event.currentTarget.style.removeProperty('--mouse-y');
  }, []);

  const highlighted = useCallback((text) => text, []);

  return (
    <article
      className={`ai-global-healthcare-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
    >
      <div
        className="ai-global-healthcare-article__progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        style={{ '--read-progress': `${progress}%` }}
      />

      <div className="ai-global-healthcare-article__scroll" ref={scrollRef} data-lenis-prevent>
        <header className={`ai-global-healthcare-article__nav${navScrolled ? ' is-scrolled' : ''}`}>
          <div className="ai-global-healthcare-article__nav-inner">
            <button type="button" className="ai-global-healthcare-article__brand" onClick={scrollToTop}>
              <Icon name="analytics" />
              <span>{articleMeta.brand}</span>
            </button>

            <nav className="ai-global-healthcare-article__nav-links" aria-label="Article sections">
              {tocItems.map((item) => (
                <button
                  type="button"
                  className={activeSection === item.id ? 'is-active' : undefined}
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="ai-global-healthcare-article__main">
          <section className="ai-global-healthcare-article__hero">
            <img src={heroImage.src} alt={heroImage.alt} className="ai-global-healthcare-article__hero-image" />
            <div className="ai-global-healthcare-article__hero-overlay" aria-hidden="true" />
            <div className="ai-global-healthcare-article__hero-content">
              <div className="ai-global-healthcare-article__tag-row">
                <span>{articleMeta.badge}</span>
                <time dateTime="2026-03-14">{articleMeta.date}</time>
              </div>
              <h1>
                Bridging the 4.5 Billion Gap:
                <span>How AI is Rewriting the Rules of Global Healthcare</span>
              </h1>
            </div>
          </section>

          <div className="ai-global-healthcare-article__layout">
            <aside className="ai-global-healthcare-article__sidebar" aria-label="Article navigation">
              <div
                className="ai-global-healthcare-article__glass ai-global-healthcare-article__sidebar-panel"
                onPointerMove={handleSpotlight}
                onPointerLeave={resetSpotlight}
                data-ai-healthcare-reveal
              >
                <div className="ai-global-healthcare-article__author">
                  <img src={authorImage.src} alt={authorImage.alt} loading="lazy" />
                  <div>
                    <h2>{articleMeta.author}</h2>
                    <p>{articleMeta.division}</p>
                  </div>
                </div>

                <div className="ai-global-healthcare-article__toc">
                  {tocItems.map((item) => (
                    <button
                      type="button"
                      className={activeSection === item.id ? 'is-active' : undefined}
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>


              </div>

              <div
                className="ai-global-healthcare-article__glass ai-global-healthcare-article__bento"
                onPointerMove={handleSpotlight}
                onPointerLeave={resetSpotlight}
                data-ai-healthcare-reveal
              >
                <p>AI Precision</p>
                <div>
                  <strong>2X</strong>
                  <span>Accuracy</span>
                </div>
                <blockquote>
                  "Modern AI-powered stroke detectors are currently operating with twice the accuracy of human doctors."
                </blockquote>
              </div>
            </aside>

            <article className="ai-global-healthcare-article__article" id="ai-healthcare-article-content">
              <section
                className="ai-global-healthcare-article__section"
                id="overview"
                ref={setSectionRef('overview')}
                data-ai-healthcare-reveal
              >
                <div className="ai-global-healthcare-article__glass ai-global-healthcare-article__overview" onPointerMove={handleSpotlight} onPointerLeave={resetSpotlight}>
                  <h2>
                    <Icon name="lightbulb" />
                    {overview.title}
                  </h2>
                  <p>{highlighted(overview.text)}</p>
                </div>
              </section>

              <section
                className="ai-global-healthcare-article__section ai-global-healthcare-article__text-flow"
                id="capabilities"
                ref={setSectionRef('capabilities')}
                data-ai-healthcare-reveal
              >
                <p>
                  {articleCopy.capabilitiesLead}
                </p>

                <figure className="ai-global-healthcare-article__pullquote">
                  <blockquote>{highlighted(articleCopy.pullquote)}</blockquote>
                </figure>

                <p>
                  {highlighted(articleCopy.capabilitiesBodyBefore)}
                  <span className="ai-global-healthcare-article__underlined">
                    {highlighted(articleCopy.capabilitiesBodyEmphasis)}
                  </span>
                  {highlighted(articleCopy.capabilitiesBodyAfter)}
                </p>

                <div className="ai-global-healthcare-article__diagnostic-grid">
                  {diagnosticCards.map((card) => (
                    <article
                      className="ai-global-healthcare-article__glass ai-global-healthcare-article__diagnostic-card"
                      key={card.id}
                      onPointerMove={handleSpotlight}
                      onPointerLeave={resetSpotlight}
                    >
                      <Icon name={card.icon} className="ai-global-healthcare-article__diagnostic-icon" />
                      <h3>{highlighted(card.title)}</h3>
                      <p>{highlighted(card.description)}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section
                className="ai-global-healthcare-article__section ai-global-healthcare-article__text-flow"
                id="economics"
                ref={setSectionRef('economics')}
                data-ai-healthcare-reveal
              >
                <p>{highlighted(articleCopy.economicsOne)}</p>
                <p>{highlighted(articleCopy.economicsTwo)}</p>

                <figure className="ai-global-healthcare-article__network-image">
                  <img src={networkImage.src} alt={networkImage.alt} loading="lazy" />
                  <figcaption>{highlighted(networkImage.caption)}</figcaption>
                </figure>
              </section>

              <section className="ai-global-healthcare-article__section ai-global-healthcare-article__text-flow" data-ai-healthcare-reveal>
                <h2>Future Section</h2>
                <p>{highlighted(articleCopy.future)}</p>
              </section>
            </article>
          </div>
        </main>

        <footer className="ai-global-healthcare-article__footer">
          <span>{articleMeta.brand}</span>
          <p>{articleMeta.footer}</p>
        </footer>
      </div>
    </article>
  );
}
