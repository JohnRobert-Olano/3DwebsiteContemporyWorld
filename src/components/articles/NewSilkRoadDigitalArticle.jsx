import { useEffect, useRef, useState } from 'react';

const heroImage = {
  src:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBLXmhU-32xAmz8aCfossnb3UeerNL8SYsphWelxGfqiRLtfnqAD3rgNOZTiAAXUFbOQmXufGeBb-ZHMSpN7mr_IYUXsG0XOPBZfpD1Xp9Sf0RS9XuepuNyDfNObMlMvj94mW1rAm8CJKzAEmQUDDfm6ET4dAIqzwfhskSwZwKZi8GOnh_x-w6iDvCaczzRjxwr0qepjXGQROCublpnYSf6ICgysE7TVVak1FksG2NcesJb2xEcP-n3OvFKfzjEj2eu1DWxMp2CRMnQ',
  alt: 'Editorial illustration of a camel in a desert landscape holding a modern smartphone',
};

const sections = [
  {
    id: 'pivot',
    title: 'A Pandemic-Era Pivot',
    body: [
      'The global commerce landscape underwent a fundamental transformation during the early 2020s. What began as a desperate necessity for survival became a permanent shift in how small businesses operate across international lines. Small-to-medium enterprises that previously relied on local foot traffic were suddenly thrust into a global marketplace.',
      'The digital infrastructure that facilitated this transition acted as a modern version of the ancient Silk Road, providing the conduits through which culture, products, and capital could flow without the constraints of physical caravans or restricted border crossings.',
    ],
  },
  {
    id: 'surge',
    title: 'The Trillion-Dollar Surge',
    body: [
      "According to recent industry analysis, the e-commerce sector has reached a staggering $27 trillion valuation. This is not merely a figure representing retail transactions; it reflects a whole ecosystem of logistics, fintech, and digital marketing that empowers a craftsman in Marrakech to sell directly to a boutique in Tokyo.",
      'This surge is driven by mobile accessibility. As smartphone penetration deepens in developing economies, the barrier to entry for global trade has effectively vanished. A simple mobile device is now a storefront, a payment terminal, and a global distribution hub all in one.',
    ],
  },
  {
    id: 'middleman',
    title: 'The Death of the Middleman',
    body: [
      'Historically, the Silk Road was defined by its many waypoints, each adding a layer of cost and complexity. In the digital age, these intermediaries are being bypassed. Direct-to-consumer models allow producers to capture a larger share of the value chain, ensuring that economic benefits are retained by the creators rather than lost to logistics conglomerates.',
      'Decentralized finance and transparent supply chain tracking have further eroded the need for traditional institutional gatekeepers. We are witnessing the democratization of global trade, where reputation and quality carry more weight than geographical proximity or corporate backing.',
    ],
  },
];

const pullQuote =
  "The internet has matured into a virtual trade route, one that is not just delivering packages, but actively sustaining jobs, boosting incomes, and creating unprecedented economic opportunities.";

const statistic = {
  label: 'Key Statistics',
  value: 'Cross-border digital trade now accounts for over 22% of all global B2C transactions.',
};

export default function NewSilkRoadDigitalArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const updateProgress = () => {
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const nextProgress = maxScroll > 0 ? (scroller.scrollTop / maxScroll) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, nextProgress)));
    };

    const handleScroll = () => {
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
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

    const revealElements = Array.from(scroller.querySelectorAll('[data-new-silk-road-reveal]'));

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
        rootMargin: '0px 0px -60px 0px',
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <article className="new-silk-road-digital-article" aria-label={`${project.title} article`}>
      <div
        className="new-silk-road-digital-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />
      <div className="new-silk-road-digital-article__paper" aria-hidden="true" />

      <div className="new-silk-road-digital-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className="new-silk-road-digital-article__navbar" aria-label="Silk Road Journal">
          <div className="new-silk-road-digital-article__nav-inner">
            <span className="new-silk-road-digital-article__logo">Silk Road Journal</span>
          </div>
        </nav>

        <header className="new-silk-road-digital-article__hero">
          <div className="new-silk-road-digital-article__hero-copy" data-new-silk-road-reveal>
            <span className="new-silk-road-digital-article__tagline">Digital Commerce / 2024</span>
            <h1 className="new-silk-road-digital-article__title">
              The New Silk Road is <em>Digital</em>
            </h1>
            <div className="new-silk-road-digital-article__lead-rule">
              <p>
                Geography is no longer a limit. The internet has permanently evolved into a massive, $27 trillion
                borderless trade route.
              </p>
            </div>
          </div>

          <figure className="new-silk-road-digital-article__hero-media" data-new-silk-road-reveal>
            <img src={heroImage.src} alt={heroImage.alt} />
            <figcaption>Mobile storefronts now carry old trade routes into a borderless marketplace.</figcaption>
          </figure>
        </header>

        <main className="new-silk-road-digital-article__article">
          <section
            className="new-silk-road-digital-article__section"
            id={sections[0].id}
            data-new-silk-road-reveal
          >
            <h2>{sections[0].title}</h2>
            <div className="new-silk-road-digital-article__text-flow">
              {sections[0].body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <figure className="new-silk-road-digital-article__pullquote" data-new-silk-road-reveal>
            <blockquote>{pullQuote}</blockquote>
          </figure>

          <section
            className="new-silk-road-digital-article__section"
            id={sections[1].id}
            data-new-silk-road-reveal
          >
            <h2>{sections[1].title}</h2>
            <div className="new-silk-road-digital-article__text-flow">
              <p>{sections[1].body[0]}</p>
              <aside className="new-silk-road-digital-article__statistics-card">
                <span>{statistic.label}</span>
                <p>{statistic.value}</p>
              </aside>
              <p>{sections[1].body[1]}</p>
            </div>
          </section>

          <section
            className="new-silk-road-digital-article__section"
            id={sections[2].id}
            data-new-silk-road-reveal
          >
            <h2>{sections[2].title}</h2>
            <div className="new-silk-road-digital-article__text-flow">
              {sections[2].body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        </main>

        <footer className="new-silk-road-digital-article__footer">
          <div>
            <span>SRJ</span>
            <p>Exploring the intersection of history, trade, and the digital future.</p>
          </div>
          <p>Copyright 2024 Digital Silk Road Editorial. All rights reserved.</p>
        </footer>
      </div>
    </article>
  );
}
