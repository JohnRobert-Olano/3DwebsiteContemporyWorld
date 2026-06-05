import { useCallback, useEffect, useRef, useState } from 'react';

const heroImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDMQe55gRlKtjvO3LfmLWU2ocAJgCbTKjUOvjZnO2Wtg6Dkm0d5bfh4nZQP-hMDBON-P2xJ-Y_OHh3ypiE7O-1CPvxxhH8CVRUGYbIsf3vzG84DTaSUexw1_XrORg85_a-Wvy6PThu7MJxys75yJH6mghv2A4aI8vflD6vSrKLnqNhR0PiHVobznh5u6ADTuHL9kBwYv00Pz77V9LEa3Dd9TUrBeJhv5RnTzWoKZSyFYzXgSfq8s42a5t5lvtdcYu3EvToNE9T-mxQ',
  alt: 'Editorial illustration of mobile financial services connecting people to digital banking tools',
};

const articleMeta = {
  brand: 'FINTECH INSIGHTS',
  tag: 'Global Analysis / Vol. 24',
  footer:
    'Independent editorial and analysis on the intersection of finance and global technology.',
  copyright: 'Copyright 2024 Fintech Insights Editorial. All rights reserved.',
};

const overviewQuote =
  'By placing digital banking services directly into the hands of billions, mobile phones are dismantling traditional geographic barriers and unlocking unprecedented opportunities for financial inclusion worldwide...';

const articleParagraphs = [
  'Digital transformation is no longer a luxury reserved for developed economies. Across Sub-Saharan Africa, South Asia, and Latin America, the mobile device has evolved from a communication tool into a portable bank vault. This shift is bypassing the need for expensive brick-and-mortar infrastructure that previously excluded rural populations from the global financial system.',
  'The rise of mobile money platforms has allowed individuals to store, send, and receive funds without ever needing a traditional bank account. This leapfrogging of conventional banking models has led to a dramatic increase in economic participation, particularly among marginalized communities and female entrepreneurs who previously faced systemic barriers to credit.',
];

const dataInsight = {
  label: 'Data Insight',
  quote:
    '84% of adults in low- and middle-income countries now own a mobile phone, providing a foundational platform for digital financial services.',
  cite: 'World Bank Global Findex',
};

const opportunitySection = {
  title: 'The Infrastructure of Opportunity',
  intro:
    'Access to mobile fintech does more than just simplify payments; it creates a verifiable digital footprint. For the unbanked, this digital history serves as a surrogate for traditional credit scores, allowing fintech providers to offer micro-loans, insurance, and investment products based on mobile usage patterns and transaction consistency.',
  features: [
    'Instant micro-credit for smallholder farmers to purchase seeds and equipment.',
    'Direct government-to-citizen transfers, reducing leakages and corruption.',
    'Peer-to-peer remittance services at a fraction of traditional costs.',
  ],
  outro:
    'As we move forward, the challenge shifts from access to literacy and regulation. Ensuring that these new digital participants are protected from predatory lending and cyber-risks is the next frontier for global fintech leaders.',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ArrowUpIcon() {
  return (
    <svg className="mobile-fintech-article__button-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" />
    </svg>
  );
}

export default function MobileFintechArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateProgress = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      const nextProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

      setProgress(clamp(nextProgress, 0, 100));
      setShowBackToTop(scrollTop > 300);
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

    const revealElements = Array.from(scroller.querySelectorAll('[data-mobile-fintech-reveal]'));

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
        rootMargin: '0px 0px -50px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [reducedMotion]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  return (
    <article
      className={`mobile-fintech-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
    >
      <div
        className="mobile-fintech-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="mobile-fintech-article__scroll" ref={scrollRef} data-lenis-prevent>
        <header className="mobile-fintech-article__header">
          <div className="mobile-fintech-article__header-inner">
            <span className="mobile-fintech-article__logo">{articleMeta.brand}</span>
          </div>
        </header>

        <main className="mobile-fintech-article__paper">
          <section className="mobile-fintech-article__hero">
            <div className="mobile-fintech-article__hero-copy" data-mobile-fintech-reveal>
              <span className="mobile-fintech-article__tag">{articleMeta.tag}</span>
              <h1 className="mobile-fintech-article__title">
                <span>Mobile Fintech</span>
                <span>Drives Financial</span>
                <span>Inclusion</span>
              </h1>
              <div className="mobile-fintech-article__hero-divider" />
            </div>

            <figure className="mobile-fintech-article__hero-media" data-mobile-fintech-reveal>
              <div className="mobile-fintech-article__hero-card">
                <img src={heroImage.src} alt={heroImage.alt} />
              </div>
              <span className="mobile-fintech-article__currency-mark" aria-hidden="true">
                $
              </span>
            </figure>
          </section>

          <section className="mobile-fintech-article__overview" data-mobile-fintech-reveal>
            <p>{overviewQuote}</p>
          </section>

          <div className="mobile-fintech-article__article">
            <div className="mobile-fintech-article__text-flow">
              {articleParagraphs.map((paragraph, index) => (
                <p
                  className={index === 0 ? 'mobile-fintech-article__drop-cap' : undefined}
                  key={paragraph}
                  data-mobile-fintech-reveal
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <figure className="mobile-fintech-article__pullquote" data-mobile-fintech-reveal>
              <span>{dataInsight.label}</span>
              <blockquote>{dataInsight.quote}</blockquote>
              <figcaption>{dataInsight.cite}</figcaption>
            </figure>

            <section className="mobile-fintech-article__opportunity" data-mobile-fintech-reveal>
              <h2>{opportunitySection.title}</h2>
              <p>{opportunitySection.intro}</p>

              <ul className="mobile-fintech-article__feature-list" aria-label="Mobile fintech benefits">
                {opportunitySection.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true" />
                    <p>{feature}</p>
                  </li>
                ))}
              </ul>

              <p>{opportunitySection.outro}</p>
            </section>
          </div>
        </main>

        <footer className="mobile-fintech-article__footer">
          <div className="mobile-fintech-article__footer-inner">
            <div>
              <span>{articleMeta.brand}</span>
              <p>{articleMeta.footer}</p>
            </div>
            <p>{articleMeta.copyright}</p>
          </div>
        </footer>

        <button
          type="button"
          className={`mobile-fintech-article__back-to-top${showBackToTop ? ' is-visible' : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll article to top"
          aria-hidden={showBackToTop ? undefined : 'true'}
          tabIndex={showBackToTop ? 0 : -1}
        >
          <ArrowUpIcon />
        </button>
      </div>
    </article>
  );
}
