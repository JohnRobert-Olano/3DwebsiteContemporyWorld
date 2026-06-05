import { useEffect, useRef, useState } from 'react';

const images = {
  hero: {
    src:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANKZuqYL5YqSwugyYNGdecmH_vg2bMJ3WSmGEQexVPDImihnlKwORiRtJgB5ulxNmqRAmRcwVTzF9TbvknnHknQ1BFBdy9-utT3h4YJJgKUteZHBMaYeSBO_ntOhRkvpiDGkuO3ru0OnsauFtTyiP4yMERvH2yzOKRp-8ufQgBzwhd-13o5YzWdUJhI5dLmm3YCsnfCGN84VS5Lv9D4Hd6BAPKYzoW83I9cHiE1TUTl-B09BNfm0FQaPppZyvmnINuXS8ahZZfUQq2',
    alt: 'An elder sharing local customs and language knowledge with a younger listener',
  },
  sovereignty: {
    src:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBlxBCYLefhCsFztmA55Grh-f_QsvGQHy89y71UU246-WEInzS2U-qkrGAxW6bfXsHumFa7xkTdvLGNr_sWmAhBXdo8FxBxU_-62wDTyHxU8M7jZ0F5Y8gJc0BsBYQX8Vg1AIYpt81UwXcxqjnlzUweVvYhZ98-h4GkVa6pd6-tPKgmZpojA_DJa151DincqSxV-bvwf3fmIrtAwt-wMasyvxj5gqCTmz7xAs3JBwN0Yg4iApYbz-OptrLiQiCNbpUkqoSdCikY0ixy',
    alt:
      'Indigenous hands weaving a complex geometric pattern using natural ochre and mustard-dyed fibers',
  },
};

const articleMeta = {
  brand: 'Tech Revives',
  tagline: 'Heritage & Innovation',
  socialProof: 'Supported by UNESCO and 45+ Indigenous Tribes',
  footer:
    'A digital initiative dedicated to the documentation and revitalization of endangered languages through humane technology.',
  copyright: "Copyright 2024 Tech Revives. Supporting UNESCO's Decade of Indigenous Languages.",
};

const avatars = [
  { label: 'UN', title: 'UNESCO Partner', tone: 'mustard' },
  { label: 'LA', title: 'Linguistic Alliance', tone: 'forest' },
  { label: 'TC', title: 'Tribal Council', tone: 'terracotta' },
];

const heroDescription =
  'Bridging the digital divide to preserve ancient wisdom through AI-driven translation, community mapping, and neural vocal reconstruction.';

const quoteCard =
  'Language is the soul of a people, and technology is its modern vessel.';

const overview =
  'Every two weeks, a language dies. With it, we lose centuries of ecological knowledge, spiritual practices, and unique worldviews. In the face of this silent extinction, a new wave of Digital Revitalizers is leveraging cutting-edge technology to capture, archive, and breathe new life into these ancestral tongues. This initiative explores the intersection of deep learning and indigenous sovereignty.';

const aiFrontier = {
  title: 'The AI Frontier: Deep Learning for Low-Resource Languages',
  body: [
    <>
      Most AI models, like GPT-4, are trained on billions of parameters from high-resource languages like English or
      Mandarin. For the 3,000 languages currently at risk, there is not enough written data to train traditional
      models. Tech Revives utilizes <strong>Zero-Shot Transfer Learning</strong>, where a model trained on a major
      language can apply its logical structures to a critically endangered one with minimal input.
    </>,
    'Working directly with tribal elders, linguists are capturing oral histories to create unique Neural Voice Banks. These allow future generations to not just read their heritage, but hear it in the accurate cadence and timbre of their ancestors.',
  ],
};

const stats = [
  { value: '43%', label: 'of languages are endangered' },
  { value: '150+', label: 'Dialects digitized in 2023' },
  { value: '10k', label: 'Hours of audio archived' },
];

const sovereignty = {
  title: 'Data Sovereignty: Who Owns the Words?',
  body:
    'One of the core challenges of Tech Revives is ensuring that indigenous communities maintain ownership over their digitized data. In the past, academic archives often extracted knowledge without returning benefit. Our platform uses decentralized storage protocols that give tribal councils Gatekeeper status over who can access specific dialects.',
  checklist: [
    'Encrypted archives accessible only via community-vetted tokens.',
    'Royalties from linguistic research redirected to local education.',
    'Digital tools built to operate offline for remote geographic regions.',
  ],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LeafIcon({ className = 'tech-revives-article__icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M19.5 4.5c-5.8.4-10.3 2.2-13 5.4-2.1 2.5-2.5 5.5-1.2 7.5 2 2.9 6.6 2.3 9.7-.7 2.4-2.3 3.8-6 4.5-12.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M5.7 17.2c2.8-3.7 6.2-6.4 10.3-8.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg className="tech-revives-article__badge-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 5.5h9M4 10.5h7M4 15.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M15.5 19.5 18 13l2.5 6.5M16.4 17.2h3.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M13 5.5c.7 3.2 2.3 5.5 5 6.9M18.5 5.5c-.8 3.1-2.5 5.4-5.1 6.9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="tech-revives-article__check-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.4 10.4 2.3 2.3 5-5.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function TechRevivesIndigenousLanguageArticle({ project, reducedMotion = false }) {
  const scrollRef = useRef(null);
  const progressFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);

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

    const revealElements = Array.from(scroller.querySelectorAll('[data-tech-revives-reveal]'));

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

  return (
    <article
      className={`tech-revives-article${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-label={`${project.title} article`}
    >
      <div
        className="tech-revives-article__progress"
        style={{ '--read-progress': `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="tech-revives-article__scroll" ref={scrollRef} data-lenis-prevent>
        <nav className="tech-revives-article__navbar" aria-label="Tech Revives">
          <div className="tech-revives-article__navbar-inner">
            <span className="tech-revives-article__brand">{articleMeta.brand}</span>
          </div>
        </nav>

        <main className="tech-revives-article__main">
          <section className="tech-revives-article__hero">
            <div className="tech-revives-article__hero-copy" data-tech-revives-reveal>
              <div className="tech-revives-article__tagline">
                <span aria-hidden="true" />
                <p>{articleMeta.tagline}</p>
              </div>
              <h1 className="tech-revives-article__title">
                Tech Revives <em>Endangered</em> Indigenous Languages
              </h1>
              <p className="tech-revives-article__hero-description">{heroDescription}</p>

              <div className="tech-revives-article__social-proof" aria-label={articleMeta.socialProof}>
                <div className="tech-revives-article__avatar-group" aria-hidden="true">
                  {avatars.map((avatar) => (
                    <span className={`tech-revives-article__avatar is-${avatar.tone}`} key={avatar.label} title={avatar.title}>
                      {avatar.label}
                    </span>
                  ))}
                </div>
                <p>{articleMeta.socialProof}</p>
              </div>
            </div>

            <figure className="tech-revives-article__hero-visual" data-tech-revives-reveal>
              <span className="tech-revives-article__decorative-circle" aria-hidden="true" />
              <div className="tech-revives-article__hero-image-frame">
                <img src={images.hero.src} alt={images.hero.alt} loading="lazy" />
              </div>
              <figcaption className="tech-revives-article__quote-card">
                <LeafIcon className="tech-revives-article__quote-icon" />
                <p>"{quoteCard}"</p>
              </figcaption>
            </figure>
          </section>

          <section className="tech-revives-article__overview" id="about" data-tech-revives-reveal>
            <div>
              <h2>Overview</h2>
            </div>
            <p>{overview}</p>
          </section>

          <section className="tech-revives-article__content" aria-label="Language technology report">
            <div className="tech-revives-article__pattern-divider" aria-hidden="true" />

            <div className="tech-revives-article__content-block" data-tech-revives-reveal>
              <div className="tech-revives-article__block-text">
                <h2>{aiFrontier.title}</h2>
                <div className="tech-revives-article__paragraphs">
                  {aiFrontier.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <aside className="tech-revives-article__stats-card" aria-label="Key statistics">
                <h3>Key Statistics</h3>
                <dl>
                  {stats.map((stat) => (
                    <div className="tech-revives-article__stat" key={stat.value}>
                      <dt>{stat.value}</dt>
                      <dd>{stat.label}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>

            <div className="tech-revives-article__content-block is-centered is-reversed" data-tech-revives-reveal>
              <figure className="tech-revives-article__image-panel">
                <div className="tech-revives-article__image-frame">
                  <img src={images.sovereignty.src} alt={images.sovereignty.alt} loading="lazy" />
                </div>
                <span className="tech-revives-article__badge-overlay" aria-hidden="true">
                  <LanguageIcon />
                </span>
              </figure>

              <div className="tech-revives-article__block-text">
                <h2>{sovereignty.title}</h2>
                <div className="tech-revives-article__paragraphs">
                  <p>{sovereignty.body}</p>
                </div>

                <ul className="tech-revives-article__checklist" aria-label="Data sovereignty safeguards">
                  {sovereignty.checklist.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </main>

        <footer className="tech-revives-article__footer">
          <div className="tech-revives-article__footer-inner">
            <div>
              <span>{articleMeta.brand}</span>
              <p>{articleMeta.footer}</p>
            </div>
            <p>{articleMeta.copyright}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
