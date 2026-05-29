import GlobExGame from './GlobExGame';
import GlobalDeliverySimulator from './GlobalDeliverySimulator';
import InfiniteScrollGame from './InfiniteScrollGame';
import RippleEconomyGame from './RippleEconomyGame';
import SalaryTaxSimulator from './SalaryTaxSimulator';

export const gameRegistry = {
  'infinite-scroll': {
    Component: InfiniteScrollGame,
    accent: '#f06b52',
    premise: 'Drag through a huge, noisy job market where beginner opportunities are scarce and costly to find.',
    contextNote: 'A commentary on entry-level work, experience barriers, gig volatility, and burnout.',
  },
  'philippine-salary-tax-simulator': {
    Component: SalaryTaxSimulator,
    accent: '#75d39a',
    premise: 'Model how gross monthly salary turns into net take-home pay after standard deductions and TRAIN tax.',
    contextNote: 'Educational only. Excludes allowances, de minimis benefits, 13th-month handling, and conditional modifiers.',
  },
  'global-delivery-simulator': {
    Component: GlobalDeliverySimulator,
    accent: '#6bb7ff',
    premise: 'Ship goods across a simplified world map and watch global disruptions alter the result.',
    contextNote: 'A light logistics model focused on distance, disruption, and cause-and-effect outcomes.',
  },
  'ripple-economy': {
    Component: RippleEconomyGame,
    accent: '#70d6d2',
    premise: 'Trigger economic shocks and policy events to see how stability changes across connected regions.',
    contextNote: 'Strictly 2D and deterministic so the impact of each event stays legible.',
  },
  'glob-ex': {
    Component: GlobExGame,
    accent: '#ffb85c',
    premise: 'Customize two traders, choose goods and quantity, then execute a peer-to-peer global exchange.',
    contextNote: 'A simplified transaction model: seller profit rises, buyer assets accumulate, and the receipt records the trade.',
  },
};
