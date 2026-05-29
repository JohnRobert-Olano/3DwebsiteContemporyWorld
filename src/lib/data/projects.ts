/**
 * @typedef {Object} Project
 * @property {string} id           Kebab-case unique identifier
 * @property {string} title        Display title
 * @property {string} role         Role / discipline
 * @property {number} year         Year (4-digit)
 * @property {string} image        Path under /public; falls back to generated cover art on load error
 * @property {string} blurb        Short description shown in fullscreen view
 * @property {string} [accent]     Optional accent color override (CSS color)
 * @property {string} [link]       Optional external URL
 */

const albumCoverBlurbs = {
  1: 'A visual essay on conflict, fragile alliances, and the human cost of security decisions.',
  2: 'Food systems, aid networks, and climate pressure are traced through a global hunger lens.',
  3: 'A study of prices, wages, and monetary shocks as they move through connected economies.',
  4: 'Displacement is framed as a human geography of borders, shelter, memory, and return.',
  5: 'Labor, extraction, and industrial policy are shown as linked struggles for dignity.',
  6: 'Sovereign borrowing, household debt, and development finance become one connected pressure system.',
  7: 'Cover studies for interactive lessons, prototypes, and contemporary-world simulations.',
  8: 'A job-market simulator about attention, opportunity, and the platform logic of work.',
  9: 'A practical finance simulation for Philippine salary, tax, and take-home pay decisions.',
  10: 'A logistics simulator that turns distance, delay, ports, and demand into playable systems.',
  11: 'An economic systems prototype about how shocks travel from one market to another.',
  12: 'A global exchange concept focused on trade, currency, and cross-border coordination.',
  13: 'Digital commerce is presented as a new route system for goods, platforms, and sellers.',
  14: 'Remote work is explored as a redistribution of opportunity, time, and geography.',
  15: 'Mobile finance appears as infrastructure for inclusion, remittances, and daily survival.',
  16: 'An open archive slot for unfinished covers, studies, and future globalization modules.',
};

const albumCoverBlurb = (coverNumber) =>
  albumCoverBlurbs[coverNumber] ?? `Visual essay ${coverNumber}.`;

export const projects = [
  {
    id: 'armed-conflict-world-disorder',
    title: 'Armed Conflict & The World Disorder',
    role: 'Global Security',
    year: 2026,
    image: '/album_covers/1.png',
    blurb: albumCoverBlurb(1),
  },
  {
    id: 'global-hunger',
    title: 'Global Hunger',
    role: 'Humanitarian Aid',
    year: 2026,
    image: '/album_covers/2.png',
    blurb: albumCoverBlurb(2),
  },
  {
    id: 'global-inflation',
    title: 'Global Inflation',
    role: 'Cost-of-Living Crisis',
    year: 2026,
    image: '/album_covers/3.png',
    blurb: albumCoverBlurb(3),
  },
  {
    id: 'forced-displacement',
    title: 'Forced Displacement',
    role: 'Refugee Crisis',
    year: 2026,
    image: '/album_covers/4.png',
    blurb: albumCoverBlurb(4),
  },
  {
    id: 'labor-justice-industry',
    title: 'Labor, Justice & Industry',
    role: 'Social Systems',
    year: 2026,
    image: '/album_covers/5.png',
    blurb: albumCoverBlurb(5),
  },
  {
    id: 'global-debt',
    title: 'Global Debt',
    role: 'Debt Economy',
    year: 2026,
    image: '/album_covers/6.png',
    blurb: albumCoverBlurb(6),
  },
  {
    id: 'game-covers',
    title: 'Game Covers',
    role: 'Archive Cover',
    year: 2026,
    image: '/album_covers/7.png',
    blurb: albumCoverBlurb(7),
  },
  {
    id: 'infinite-scroll',
    title: 'The Infinite Scroll',
    role: 'Job Market Simulator',
    year: 2026,
    image: '/album_covers/8.png',
    blurb: albumCoverBlurb(8),
  },
  {
    id: 'philippine-salary-tax-simulator',
    title: 'Philippine Salary & Tax Simulator',
    role: 'Finance Simulator',
    year: 2026,
    image: '/album_covers/9.png',
    blurb: albumCoverBlurb(9),
  },
  {
    id: 'global-delivery-simulator',
    title: 'Global Delivery Simulator',
    role: 'Logistics Simulator',
    year: 2026,
    image: '/album_covers/10.png',
    blurb: albumCoverBlurb(10),
  },
  {
    id: 'ripple-economy',
    title: 'Ripple Economy',
    role: 'Economic Systems',
    year: 2026,
    image: '/album_covers/11.png',
    blurb: albumCoverBlurb(11),
  },
  {
    id: 'glob-ex',
    title: 'Glob:Ex',
    role: 'Global Exchange',
    year: 2026,
    image: '/album_covers/12.png',
    blurb: albumCoverBlurb(12),
  },
  {
    id: 'new-silk-road-digital',
    title: 'The New Silk Road Is Digital',
    role: 'E-Commerce',
    year: 2026,
    image: '/album_covers/13.png',
    blurb: albumCoverBlurb(13),
  },
  {
    id: 'remote-work-global-opportunities',
    title: 'Remote Work Opens Global Opportunities',
    role: 'Remote Work',
    year: 2026,
    image: '/album_covers/14.png',
    blurb: albumCoverBlurb(14),
  },
  {
    id: 'mobile-fintech',
    title: 'Mobile Fintech',
    role: 'Financial Inclusion',
    year: 2026,
    image: '/album_covers/15.png',
    blurb: albumCoverBlurb(15),
  },
  {
    id: 'untitled-album-cover',
    title: 'Untitled Album Cover',
    role: 'Archive Cover',
    year: 2026,
    image: '/album_covers/16.png',
    blurb: albumCoverBlurb(16),
  },
];
