import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage = {
  src: '/article_assets/global-streaming-culture/hero.png',
  alt:
    'Three stylized pop performers in bright outfits arranged like a retro global streaming poster',
};

const articleMeta = {
  brand: 'GLOBAL CULTURE',
  heroTagline: 'BREAKING LANGUAGE BARRIERS:',
  badge: 'GLOBAL STREAMING UNITE',
  footer:
    'Uniting the world through localized streaming. We are the editorial pulse of the digital era.',
  copyright: 'Copyright 2024 Global Culture Streaming Unite. All rights reserved.',
};

const leadParagraph =
  'The era of the "one-inch barrier" is officially over. What started as a niche fascination with international cinema has exploded into a full-scale cultural revolution, where linguistic boundaries are crumbling beneath the weight of high-quality, localized storytelling. Streaming platforms are no longer just exporting Western ideals; they are cultivating a borderless ecosystem where a series from Seoul can dominate conversations in Sao Paulo.';

const mainCopy = [
  "In the last five years, the consumption of non-English language content has surged by over 50% globally. This isn't just a trend; it's a structural shift in how we perceive entertainment. The accessibility afforded by ubiquitous streaming services, coupled with sophisticated dubbing and subtitling technology, has democratized the viewing experience.",
  'Creators from diverse backgrounds - Thailand, Spain, Nigeria, and beyond - are finding that the more specific and localized their stories are, the more universal they become. The "Global Culture" is not about creating a homogenized middle ground; it is about celebrating the textures of different societies in a way that resonates with human emotion regardless of geography.',
];

const sideCopy = [
  'As streaming platforms continue to invest billions into local production hubs, the traditional gatekeepers of media are losing their grip. We are witnessing the rise of a new "Editorial Board" - one formed by the algorithms and authentic word-of-mouth of billions of connected users.',
  'The result is a more empathetic global population. When we spend hours in the homes and lives of characters from across the ocean, the "other" becomes familiar. We share their struggles, their music, and their memes. Language is no longer a wall; it is a bridge.',
];

const techCallout = {
  title: 'THE TECH REVOLUTION',
  body:
    'AI-driven localization is shrinking the time-to-market for international hits, allowing a show to premiere globally in 190+ countries simultaneously with near-perfect accuracy.',
};

const pullQuote = 'Non-English content now accounts for over 30% of total viewing hours globally.';

const showCards = [
  {
    id: 'squid-game',
    rank: '1',
    badge: 'KOREA',
    title: 'Squid Game',
    displayTitle: 'SQUID GAME',
    country: 'South Korea',
    hours: '1.65B',
    percent: 100,
    percentLabel: '100%',
    genre: 'Survival Drama, Thriller',
    description:
      "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.",
  },
  {
    id: 'money-heist',
    rank: '2',
    badge: 'SPAIN',
    title: 'Money Heist (La Casa de Papel)',
    displayTitle: 'MONEY HEIST',
    country: 'Spain',
    hours: '619M',
    percent: 37,
    percentLabel: '37%',
    genre: 'Heist Crime Drama, Suspense',
    description:
      'An unusual group of robbers attempt to carry out the most perfect heist in Spanish history - stealing 2.4 billion euros from the Royal Mint of Spain.',
  },
  {
    id: 'dark',
    rank: '3',
    badge: 'GERMANY',
    title: 'Dark',
    displayTitle: 'DARK',
    country: 'Germany',
    hours: '482M',
    percent: 29,
    percentLabel: '29%',
    genre: 'Science Fiction, Mystery',
    description:
      'A family saga with a supernatural twist, set in a German town, where the disappearance of two young children exposes the relationships among four families.',
  },
  {
    id: 'lupin',
    rank: '4',
    badge: 'FRANCE',
    title: 'Lupin',
    displayTitle: 'LUPIN',
    country: 'France',
    hours: '421M',
    percent: 25,
    percentLabel: '25%',
    genre: 'Mystery, Thriller, Adventure',
    description:
      'Inspired by the adventures of Arsene Lupin, gentleman thief Assane Diop sets out to avenge his father for an injustice inflicted by a wealthy family.',
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function SparkIcon() {
  return (
    <svg className="global-streaming-culture-article__callout-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M12 2.8 14.5 9l6.7 2-6.7 2L12 19.2 9.5 13l-6.7-2 6.7-2L12 2.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m19 3 .8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8L19 3Z" fill="currentColor" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg className="global-streaming-culture-article__section-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 20V4M4 20h18" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
      <path d="M8 17V10M13 17V6M18 17v-4" stroke="currentColor" strokeLinecap="square" strokeWidth="3" />
    </svg>
  );
}

export default function GlobalStreamingCultureArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const progressFrameRef = useRef(0);
  const closeButtonRef = useRef(null);
  const focusReturnRef = useRef(null);
  const focusTimerRef = useRef(0);
  const cardRefs = useRef(new Map());

  const [progress, setProgress] = useState(0);
  const [heroParallax, setHeroParallax] = useState(0);
  const [activeShowId, setActiveShowId] = useState(null);
  const [statReady, setStatReady] = useState(false);

  const activeShow = showCards.find((show) => show.id === activeShowId);

  const closeDetailModal = useCallback(() => {
    setActiveShowId(null);
    setStatReady(false);

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
      const scrollTop = scroller.scrollTop;
      const nextProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

      setProgress(clamp(nextProgress, 0, 100));
      setHeroParallax(reducedMotion ? 0 : clamp(scrollTop * -0.08, -78, 0));
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
  }, [reducedMotion]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const revealElements = Array.from(scroller.querySelectorAll('[data-streaming-reveal]'));

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
        rootMargin: '0px 0px -56px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!activeShow) return undefined;

    const statTimer = window.setTimeout(() => setStatReady(true), reducedMotion ? 0 : 140);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        closeDetailModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.clearTimeout(statTimer);
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [activeShow, closeDetailModal, reducedMotion]);

  useEffect(
    () => () => {
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    },
    [],
  );

  const openDetailModal = (showId, returnTarget) => {
    focusReturnRef.current = returnTarget;
    setStatReady(false);
    setActiveShowId(showId);
  };

  return (
    <article
      className={`global-streaming-culture-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
    >
      <div
        className="global-streaming-culture-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="global-streaming-culture-article__scroll" ref={scrollRef} data-lenis-prevent>
        <header className="global-streaming-culture-article__nav">
          <div className="global-streaming-culture-article__nav-inner">
            <span className="global-streaming-culture-article__nav-logo">{articleMeta.brand}</span>
          </div>
        </header>

        <main className="global-streaming-culture-article__main">
          <section className="global-streaming-culture-article__hero">
            <div className="global-streaming-culture-article__hero-slants" aria-hidden="true">
              <span className="global-streaming-culture-article__slant is-top" />
              <span className="global-streaming-culture-article__slant is-bottom" />
            </div>

            <div className="global-streaming-culture-article__hero-inner">
              <div
                className="global-streaming-culture-article__giant-text"
                style={{ '--hero-parallax': `${heroParallax}px` }}
                aria-hidden="true"
              >
                GLOBAL CULTURE
              </div>

              <div className="global-streaming-culture-article__hero-copy" data-streaming-reveal>
                <p className="global-streaming-culture-article__tagline">{articleMeta.heroTagline}</p>
                <h1 className="global-streaming-culture-article__title">
                  HOW <span className="is-gold">LOCALIZED</span> STREAMING CONTENT IS FORGING A TRULY{' '}
                  <span className="is-cyan">GLOBAL CULTURE</span>
                </h1>
              </div>

              <figure className="global-streaming-culture-article__hero-figure" data-streaming-reveal>
                <div className="global-streaming-culture-article__hero-card">
                  <img src={heroImage.src} alt={heroImage.alt} width="1280" height="720" />
                </div>
                <figcaption className="global-streaming-culture-article__hero-badge">{articleMeta.badge}</figcaption>
              </figure>
            </div>
          </section>

          <section className="global-streaming-culture-article__article">
            <div className="global-streaming-culture-article__article-grid">
              <div className="global-streaming-culture-article__lead-wrap" data-streaming-reveal>
                <p className="global-streaming-culture-article__lead">{leadParagraph}</p>
              </div>

              <div className="global-streaming-culture-article__reading-main" data-streaming-reveal>
                {mainCopy.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <aside className="global-streaming-culture-article__callout">
                  <SparkIcon />
                  <div>
                    <h2>{techCallout.title}</h2>
                    <p>{techCallout.body}</p>
                  </div>
                </aside>
              </div>

              <aside className="global-streaming-culture-article__reading-side" data-streaming-reveal>
                {sideCopy.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <blockquote className="global-streaming-culture-article__pullquote">
                  <span aria-hidden="true">"</span>
                  <p>
                    {pullQuote.split('30%')[0]}
                    <strong>30%</strong>
                    {pullQuote.split('30%')[1]}
                  </p>
                </blockquote>
              </aside>
            </div>
          </section>

          <section className="global-streaming-culture-article__infographic">
            <div className="global-streaming-culture-article__divider" aria-hidden="true" />
            <div className="global-streaming-culture-article__infographic-inner">
              <h2 className="global-streaming-culture-article__section-title" data-streaming-reveal>
                <BarChartIcon />
                <span>TOP PERFORMING NON-ENGLISH CONTENT</span>
              </h2>

              <div className="global-streaming-culture-article__shows-grid">
                {showCards.map((show, index) => (
                  <button
                    className="global-streaming-culture-article__show-card"
                    key={show.id}
                    type="button"
                    ref={(node) => {
                      if (node) cardRefs.current.set(show.id, node);
                      else cardRefs.current.delete(show.id);
                    }}
                    style={{ '--card-rotation': `${(index - 1.5) * 0.8}deg` }}
                    onClick={(event) => openDetailModal(show.id, event.currentTarget)}
                    aria-haspopup="dialog"
                    data-streaming-reveal
                  >
                    <span className="global-streaming-culture-article__card-number" aria-hidden="true">
                      {show.rank}
                    </span>
                    <span className="global-streaming-culture-article__card-content">
                      <span className="global-streaming-culture-article__card-badge">{show.badge}</span>
                      <span className="global-streaming-culture-article__card-title">{show.displayTitle}</span>
                      <span className="global-streaming-culture-article__card-stat">{show.hours} VIEWING HOURS</span>
                    </span>
                    <span className="global-streaming-culture-article__card-bar" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="global-streaming-culture-article__footer">
          <div className="global-streaming-culture-article__footer-inner">
            <strong>GLOBAL CULTURE</strong>
            <p>{articleMeta.footer}</p>
            <small>{articleMeta.copyright}</small>
          </div>
        </footer>
      </div>

      {activeShow ? (
        <div
          className="global-streaming-culture-article__detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetailModal();
          }}
        >
          <section
            className="global-streaming-culture-article__detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-streaming-culture-detail-title"
          >
            <button
              className="global-streaming-culture-article__detail-close"
              type="button"
              aria-label="Close detail modal"
              ref={closeButtonRef}
              onClick={closeDetailModal}
            >
              x
            </button>

            <header className="global-streaming-culture-article__detail-header">
              <span className="global-streaming-culture-article__detail-badge">{activeShow.country.toUpperCase()}</span>
              <h2 id="global-streaming-culture-detail-title">{activeShow.title.toUpperCase()}</h2>
              <p>{activeShow.hours} VIEWING HOURS</p>
            </header>

            <div className="global-streaming-culture-article__detail-body">
              <p className="global-streaming-culture-article__detail-genre">{activeShow.genre}</p>
              <p>{activeShow.description}</p>

              <p className="global-streaming-culture-article__detail-label">Streaming Share Index</p>
              <div className="global-streaming-culture-article__stat-bar">
                <span
                  className="global-streaming-culture-article__stat-fill"
                  style={{ '--stat-percent': statReady ? `${activeShow.percent}%` : '0%' }}
                  aria-hidden="true"
                />
                <span className="global-streaming-culture-article__stat-label">{activeShow.percentLabel}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
