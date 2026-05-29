// Equirectangular projection helper: real (lon, lat) -> percent position on the
// FlatWorldMap (which uses viewBox 0..360 x, 0..180 y). Markers placed with this
// helper sit on the correct continents.
const geo = (lon, lat) => ({
  x: ((lon + 180) / 360) * 100,
  y: ((90 - lat) / 180) * 100,
});

export const DELIVERY_COUNTRIES = [
  { id: 'usa', name: 'USA', ...geo(-98, 39) },
  { id: 'brazil', name: 'Brazil', ...geo(-51, -10) },
  { id: 'germany', name: 'Germany', ...geo(10, 51) },
  { id: 'india', name: 'India', ...geo(79, 22) },
  { id: 'japan', name: 'Japan', ...geo(138, 36) },
  { id: 'philippines', name: 'Philippines', ...geo(122, 12) },
  { id: 'south-korea', name: 'South Korea', ...geo(127, 37) },
];

export const DELIVERY_EVENTS = [
  { result: 'Successful Delivery', message: 'Shipment arrived successfully.', successful: true },
  { result: 'Shipment Delayed', message: 'Storm caused shipping delays.', successful: false },
  { result: 'Shipment Blocked', message: 'Port strike blocked shipment.', successful: false },
  { result: 'Shipment Blocked', message: 'Pandemic restricted border access.', successful: false },
  { result: 'Shipment Delayed', message: 'Conflict rerouted the shipment.', successful: false },
];

export const INITIAL_RIPPLE_REGIONS = {
  usa: { label: 'USA', ...geo(-98, 39), stability: 85 },
  eu: { label: 'EU', ...geo(10, 50), stability: 80 },
  china: { label: 'China', ...geo(104, 35), stability: 60 },
  southAmerica: { label: 'South America', ...geo(-58, -12), stability: 95 },
  india: { label: 'India', ...geo(79, 22), stability: 70 },
  southeastAsia: { label: 'Southeast Asia', ...geo(102, 14), stability: 85 },
};

export const INITIAL_GLOBAL_STABILITY = 78;

const midpoint = (first, second) => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

export const RIPPLE_CONNECTIONS = [
  ['usa', 'eu'],
  ['usa', 'china'],
  ['eu', 'china'],
  ['china', 'southeastAsia'],
  ['india', 'southeastAsia'],
  ['southAmerica', 'usa'],
];

export const RIPPLE_EVENTS = [
  {
    id: 'trade-war',
    label: 'TRADE WAR INITIATED',
    origin: midpoint(INITIAL_RIPPLE_REGIONS.usa, INITIAL_RIPPLE_REGIONS.china),
    originLabel: 'USA-China trade corridor',
    tone: 'negative',
    globalDelta: -5,
    deltas: {
      usa: -10,
      china: -10,
      eu: -4,
      southAmerica: -3,
      india: -3,
      southeastAsia: -5,
    },
    effect: 'Trade barriers slow exports, raise costs, and reduce confidence across connected markets.',
  },
  {
    id: 'pandemic',
    label: 'PANDEMIC SHUTDOWN',
    origin: INITIAL_RIPPLE_REGIONS.southeastAsia,
    originLabel: 'Southeast Asia',
    tone: 'negative',
    globalDelta: -10,
    deltas: {
      usa: -8,
      eu: -8,
      china: -9,
      southAmerica: -6,
      india: -10,
      southeastAsia: -12,
    },
    effect: 'Factory closures, border rules, and labor disruptions interrupt global supply chains.',
  },
  {
    id: 'green-tech',
    label: 'GREEN TECH BREAKTHROUGH',
    origin: INITIAL_RIPPLE_REGIONS.eu,
    originLabel: 'EU',
    tone: 'positive',
    globalDelta: 7,
    deltas: {
      usa: 4,
      eu: 10,
      china: 3,
      southAmerica: 3,
      india: 6,
      southeastAsia: 5,
    },
    effect: 'Clean technology investment improves productivity, energy resilience, and market confidence.',
  },
  {
    id: 'tax-pact',
    label: 'GLOBAL TAX PACT SIGNED',
    origin: midpoint(INITIAL_RIPPLE_REGIONS.usa, INITIAL_RIPPLE_REGIONS.eu),
    originLabel: 'USA/EU coordination zone',
    tone: 'positive',
    globalDelta: 5,
    deltas: {
      usa: 5,
      eu: 7,
      china: -2,
      southAmerica: 3,
      india: 4,
      southeastAsia: 3,
    },
    effect: 'Tax coordination reduces avoidance, stabilizes public revenue, and shifts some capital flows.',
  },
];

export const TRADE_NATIONALITIES = ['Japan', 'Brazil', 'USA', 'Philippines', 'Germany'];

export const TRADE_NATIONALITY_POINTS = {
  Japan: geo(138, 36),
  Brazil: geo(-51, -10),
  USA: geo(-98, 39),
  Philippines: geo(122, 12),
  Germany: geo(10, 51),
};

export const TRADE_ITEMS = [
  { id: 'rice', label: 'Sacks of Rice', price: 2 },
  { id: 'mangoes', label: 'Mangoes', price: 5 },
  { id: 'microchips', label: 'Microchips', price: 50 },
  { id: 'oil', label: 'Oil', price: 80 },
  { id: 'textiles', label: 'Textiles', price: 15 },
];
