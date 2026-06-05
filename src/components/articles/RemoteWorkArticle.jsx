import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCrNHlpQT823C0UvFShSl2ypSfrCyXneiT8uREm4OWSK8OvQNNqqjqjFfSKGiqdtIkNXL57bnn2RYWF6WtIrAm18hKY6MZF0OvRB62MHZka-w-euSEQykpHiCTehDb_fVUt4BnOl6wVcpIOJ2vTyDEGk4iLk2KIr_HPg7dtQoRo7KDPKEFcEtwVxQvMr5n-bFPk44TURQWP3KgXVSYddEmzM69vaY6Sp3FiVmQTa7H16wtN1JP9jqRlMkBiG3Cnnsary-uIeJh-WFsm',
  alt: 'Remote professionals collaborating across cities through connected digital workspaces',
};

const mediaImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA45ZbVvb2CrLn4rM5dMUx-4z1UiLByx4QU8XKvmZ81mDJ-AAoflG4NOmbvrdAtdDLSXi-WtsxLHjR_k2uE9JcSei8SiusGP40WeXtDhukW8HWEk_l2wFKhL0zOyLgfExKEbh1aemvQBDfNlDMKdQXAr6GVnJnHLLoP5onIV-aVy7d5Lm8j7myfBktbkoHiLRvENYfmfPA6YI0YJxIxRXYQMYmN7KNa2ght4bfuF8fGyNLpgET9unmnW_uAT_nAKuMMMC_FExT2DjUo',
  alt: 'Digital nomad productivity hub with a laptop and remote collaboration tools',
  caption: 'Digital Nomad Productivity Hub',
};

const articleMeta = {
  brand: 'RemoteGlobal',
  category: 'Future of Work',
  author: 'Alexander Voss',
  date: 'Oct 24, 2024',
  footer: 'Boundless potential for digital nomads.',
};

const pullQuote =
  "The future of work has no zip code. With projections showing up to 92 million jobs could go fully remote by 2030, the traditional office is expanding across continents. Discover how the 'work from anywhere' revolution is dismantling geographic barriers, connecting borderless talent with international companies, and creating an inclusive labor market where your skills matter far more than your location.";

const sections = [
  {
    id: 'opening',
    body: [
      'The digital landscape is undergoing a tectonic shift. What began as a necessity during global lockdowns has matured into a fundamental restructuring of how we define productivity and professional presence. Today, a developer in Nairobi can collaborate with a design studio in Copenhagen, and a financial analyst in Buenos Aires can lead a team based in Singapore.',
    ],
  },
  {
    id: 'boundaries',
    title: 'The Erosion of Boundaries',
    body: [
      'Traditional employment was once dictated by the commute - a physical tether that limited human potential to a narrow radius around city centers. This geographic lottery often penalized talented individuals in emerging economies or rural areas. Remote work is the ultimate equalizer, replacing proximity with proficiency.',
      'Beyond individual gains, companies are discovering that a global workforce brings a diversity of perspective that was previously unattainable. When a team consists of members from six different time zones and cultures, the resulting innovation is inherently more robust and inclusive.',
    ],
  },
  {
    id: 'impact',
    title: 'The Socio-Economic Impact',
    body: [
      'The impact of this revolution extends far beyond the screen. We are witnessing the revitalization of second-tier cities as digital nomads migrate away from hyper-expensive urban hubs. This redistribution of wealth and human capital has the potential to stabilize regional economies and reduce the environmental strain caused by massive daily commutes.',
    ],
  },
];

const statCards = [
  {
    id: 'horizon',
    tone: 'primary',
    title: 'The 2030 Horizon',
    value: '92M',
    description: 'Expected growth in the global remote workforce according to recent labor market projections.',
  },
  {
    id: 'talent',
    tone: 'secondary',
    title: 'Borderless Talent',
    value: '40%',
    description: 'Increase in cross-border hiring as companies move beyond local talent pools.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function GlobeIcon() {
  return (
    <svg className="remote-work-article__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5S14.2 18.1 12 20.5C9.8 18.1 8.8 15.3 8.8 12S9.8 5.9 12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="remote-work-article__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 17.5 9.2 12l3.7 3.5L20 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 7.5H20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIcon({ tone }) {
  return tone === 'primary' ? <TrendIcon /> : <GlobeIcon />;
}

export default function RemoteWorkArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const frameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [navShrunk, setNavShrunk] = useState(false);
  const [heroOffset, setHeroOffset] = useState(0);
  const [tiltState, setTiltState] = useState({});

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateScrollState = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      const nextProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

      setProgress(clamp(nextProgress, 0, 100));
      setNavShrunk(scrollTop > 54);
      setHeroOffset(reducedMotion ? 0 : clamp(scrollTop * 0.18, 0, 72));
      frameRef.current = 0;
    };

    const handleScroll = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    scroller.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-remote-work-reveal]'));

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

  const handleCardMove = useCallback(
    (cardId, event) => {
      if (reducedMotion) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = clamp(((y - centerY) / centerY) * -8, -8, 8);
      const rotateY = clamp(((x - centerX) / centerX) * 8, -8, 8);

      setTiltState((current) => ({
        ...current,
        [cardId]: {
          rotateX,
          rotateY,
          mouseX: `${(x / rect.width) * 100}%`,
          mouseY: `${(y / rect.height) * 100}%`,
        },
      }));
    },
    [reducedMotion],
  );

  const resetCardTilt = useCallback((cardId) => {
    setTiltState((current) => {
      if (!current[cardId]) return current;
      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }, []);

  const getCardStyle = (cardId) => {
    const tilt = tiltState[cardId];
    if (!tilt || reducedMotion) {
      return {
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      };
    }

    return {
      '--mouse-x': tilt.mouseX,
      '--mouse-y': tilt.mouseY,
      transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-6px)`,
    };
  };

  return (
    <article className="remote-work-article" aria-label={`${project.title} article`}>
      <div
        className="remote-work-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="remote-work-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav
          className={`remote-work-article__navbar${navShrunk ? ' is-shrunk' : ''}`}
          aria-label="RemoteGlobal"
        >
          <div className="remote-work-article__nav-inner">
            <span className="remote-work-article__brand">
              <GlobeIcon />
              {articleMeta.brand}
            </span>
          </div>
        </nav>

        <header className="remote-work-article__hero">
          <div className="remote-work-article__hero-image-wrapper">
            <img
              className="remote-work-article__hero-image"
              src={heroImage.src}
              alt={heroImage.alt}
              style={{ '--hero-y': `${heroOffset}px` }}
            />
            <div className="remote-work-article__hero-overlay" />
          </div>

          <div className="remote-work-article__hero-content">
            <div className="remote-work-article__hero-card" data-remote-work-reveal>
              <span className="remote-work-article__category">{articleMeta.category}</span>
              <h1 className="remote-work-article__title">Remote Work Opens Global Opportunities</h1>
              <div className="remote-work-article__meta">
                <span>By {articleMeta.author}</span>
                <span aria-hidden="true" />
                <time dateTime="2024-10-24">{articleMeta.date}</time>
              </div>
            </div>
          </div>
        </header>

        <main className="remote-work-article__article">
          <figure className="remote-work-article__pullquote" data-remote-work-reveal>
            <blockquote>{pullQuote}</blockquote>
          </figure>

          <section className="remote-work-article__section" aria-label="Overview">
            <div className="remote-work-article__text-flow">
              {sections[0].body.map((paragraph) => (
                <p className="remote-work-article__lead" key={paragraph} data-remote-work-reveal>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section className="remote-work-article__section" id={sections[1].id}>
            <h2 data-remote-work-reveal>{sections[1].title}</h2>
            <div className="remote-work-article__text-flow">
              <p data-remote-work-reveal>{sections[1].body[0]}</p>

              <div className="remote-work-article__bento-grid" aria-label="Remote work statistics">
                {statCards.map((card) => (
                  <article
                    className={`remote-work-article__bento-card is-${card.tone}`}
                    key={card.id}
                    style={getCardStyle(card.id)}
                    onMouseMove={(event) => handleCardMove(card.id, event)}
                    onMouseLeave={() => resetCardTilt(card.id)}
                    data-remote-work-reveal
                  >
                    <div className="remote-work-article__bento-content">
                      <span className="remote-work-article__bento-icon">
                        <StatIcon tone={card.tone} />
                      </span>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </div>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>

              <p data-remote-work-reveal>{sections[1].body[1]}</p>
            </div>
          </section>

          <figure className="remote-work-article__media" data-remote-work-reveal>
            <div className="remote-work-article__media-frame">
              <img src={mediaImage.src} alt={mediaImage.alt} loading="lazy" />
            </div>
            <figcaption>{mediaImage.caption}</figcaption>
          </figure>

          <section className="remote-work-article__section" id={sections[2].id}>
            <h2 data-remote-work-reveal>{sections[2].title}</h2>
            <div className="remote-work-article__text-flow">
              {sections[2].body.map((paragraph) => (
                <p key={paragraph} data-remote-work-reveal>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </main>

        <footer className="remote-work-article__footer">
          <div>
            <span>{articleMeta.brand}</span>
            <p>{articleMeta.footer}</p>
          </div>
          <p>Copyright 2024 RemoteGlobal.</p>
        </footer>
      </div>
    </article>
  );
}
