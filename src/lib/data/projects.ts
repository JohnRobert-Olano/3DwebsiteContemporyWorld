/**
 * @typedef {Object} Project
 * @property {string} id           Kebab-case unique identifier
 * @property {string} title        Display title
 * @property {string} role         Role / discipline (e.g. "Research · Concept")
 * @property {number} year         Year (4-digit)
 * @property {string} image        Path under /public; falls back to generated cover art on load error
 * @property {string} blurb        Short description shown in fullscreen view
 * @property {string} [accent]     Optional accent color override (CSS color)
 * @property {string} [link]       Optional external URL
 */

export const projects = [
  {
    id: 'global-village',
    title: 'Global Village',
    role: 'Research · Concept',
    year: 2024,
    image: '/artifact_culture_4.png',
    blurb:
      'A research piece on cultural exchange in the post-internet era — how local identities adapt, absorb, and re-export.',
  },
  {
    id: 'engine-room',
    title: 'Engine Room',
    role: 'Data Visualization',
    year: 2024,
    image: '/artifact_culture_3.png',
    blurb:
      'Mapping the supply chains that move global capital — assembled from public trade data and rendered as a living atlas.',
  },
  {
    id: 'shared-home',
    title: 'Shared Home',
    role: 'Climate Storytelling',
    year: 2023,
    image: '/artifact_culture_2.png',
    blurb:
      'A visual essay on transboundary environmental impact, tracing how emissions in one region reshape coastlines in another.',
  },
  {
    id: 'rules-of-the-game',
    title: 'Rules of the Game',
    role: 'Interactive Documentary',
    year: 2023,
    image: '/artifact_culture_1.png',
    blurb:
      'How treaties, institutions, and quiet tensions shape the rhythm of global politics — told through six diplomatic moments.',
  },
  {
    id: 'nervous-system',
    title: 'Nervous System',
    role: 'WebGL Experience',
    year: 2023,
    image: '/artifact_culture_3.png',
    blurb:
      'A real-time render of the undersea cables that carry the modern world — every flicker is a packet routed in your name.',
  },
  {
    id: 'common-ground',
    title: 'Common Ground',
    role: 'Editorial',
    year: 2022,
    image: '/artifact_culture_2.png',
    blurb:
      'Twelve landmarks reframed as a single story — what we preserve, what we forget, what we keep building over.',
  },
  {
    id: 'long-now',
    title: 'Long Now',
    role: 'Concept · Identity',
    year: 2022,
    image: '/artifact_culture_1.png',
    blurb:
      'A brand system designed for projects that span generations — typography, motion, and motion-restraint at decade scale.',
  },
  {
    id: 'world-view',
    title: 'World View',
    role: 'This Site',
    year: 2025,
    image: '/artifact_culture_4.png',
    blurb:
      'You are here. The whole journey, viewed from above — a closing reflection on the twelve destinations you just toured.',
  },
];
