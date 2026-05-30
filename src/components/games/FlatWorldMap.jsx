import { WORLD_LAND_PATH } from '../../lib/games/worldGeo';

// Equirectangular (plate carree) world map drawn from real Natural Earth
// coastlines (see ../../lib/games/worldGeo). The viewBox is the geographic
// plane: x = lon + 180 (0..360), y = 90 - lat (0..180). Markers placed with the
// same transform (see the geo() helper in ../../lib/games/constants) therefore
// land on their real locations. preserveAspectRatio="none" makes the SVG fill
// its container so percentage-positioned HTML overlays (region cards, labels,
// the delivery vehicle) align with SVG points - callers keep the container at
// aspect-[2/1] so the fill stays undistorted.

// Opt-in palettes. `theme="dark"` (the default) is the dark-console look used by
// RippleEconomy and GlobEx; `theme="bright"` is used ONLY by the Global Delivery
// Simulator claymorphism restyle. Gradient ids are theme-specific so the two
// palettes never collide if both ever mount.
const THEMES = {
  dark: {
    oceanId: 'fwm-ocean',
    landId: 'fwm-land',
    ocean: ['#0b2733', '#071820'],
    land: ['#3a7d68', '#2c5f51'],
    landStroke: 'rgba(165,224,205,0.30)',
    grid: 'rgba(255,255,255,0.05)',
  },
  bright: {
    oceanId: 'fwm-ocean-bright',
    landId: 'fwm-land-bright',
    ocean: ['#69c8f2', '#2c9fe2'],
    land: ['#8fe06a', '#56bb47'],
    landStroke: 'rgba(38,112,46,0.55)',
    grid: 'rgba(18,70,110,0.10)',
  },
  // Flight-ops radar look used ONLY by the Global Delivery Simulator: deep navy
  // ocean, cyan-tinted landmasses, faint cyan graticule.
  ops: {
    oceanId: 'fwm-ocean-ops',
    landId: 'fwm-land-ops',
    ocean: ['#0b2036', '#06121f'],
    land: ['#1d5570', '#123a4f'],
    landStroke: 'rgba(96,209,255,0.45)',
    grid: 'rgba(96,209,255,0.10)',
  },
};

export default function FlatWorldMap({ children, className = '', ariaLabel = 'World map', theme = 'dark' }) {
  const palette = THEMES[theme] ?? THEMES.dark;

  return (
    <svg
      viewBox="0 0 360 180"
      className={className}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={palette.oceanId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ocean[0]} />
          <stop offset="100%" stopColor={palette.ocean[1]} />
        </linearGradient>
        <linearGradient id={palette.landId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.land[0]} />
          <stop offset="100%" stopColor={palette.land[1]} />
        </linearGradient>
      </defs>

      <rect width="360" height="180" fill={`url(#${palette.oceanId})`} />

      <g stroke={palette.grid} strokeWidth="0.5" vectorEffect="non-scaling-stroke">
        {[30, 60, 90, 120, 150].map((y) => (
          <line key={`lat-${y}`} x1="0" y1={y} x2="360" y2={y} />
        ))}
        {[60, 120, 180, 240, 300].map((x) => (
          <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="180" />
        ))}
      </g>

      <path
        d={WORLD_LAND_PATH}
        fillRule="evenodd"
        fill={`url(#${palette.landId})`}
        stroke={palette.landStroke}
        strokeWidth="0.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {children}
    </svg>
  );
}
