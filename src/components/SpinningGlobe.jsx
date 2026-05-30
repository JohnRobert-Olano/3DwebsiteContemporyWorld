// Dependency-free vector Earth for the boot loading gate. Two copies of an
// equirectangular continent map scroll inside a circular mask; because the
// texture is identical and we translate by exactly one map width, longitude
// wraps seamlessly. Spherical lighting + atmosphere come from CSS overlays, so
// this stays crisp at any size and adds nothing to the initial JS bundle.
//
// Continent outlines are the same low-poly coastlines used by FlatWorldMap
// (lon/lat space, viewBox 0..360 x, 0..180 y), duplicated here to keep the
// loader self-contained and independent of the games' shared map.
const CONTINENTS = [
  '22,28 35,22 60,20 95,18 120,24 124,38 112,46 102,55 100,64 92,70 85,75 96,82 83,74 75,66 60,52 56,44 48,36 38,30',
  '130,12 150,10 158,22 150,32 135,28 128,18',
  '105,78 118,80 130,86 145,96 138,112 126,124 120,134 112,146 108,132 104,112 102,96 103,84',
  '170,56 180,52 195,54 212,58 220,70 231,80 222,92 221,108 214,120 200,126 192,116 188,100 186,88 176,80 163,76 166,64',
  '171,50 176,40 185,30 200,22 230,18 280,16 320,18 345,22 348,32 335,40 312,52 305,60 295,70 288,80 284,86 275,78 262,82 258,80 252,72 245,72 233,78 224,76 216,64 210,54 200,50 192,48 183,52',
  '294,110 312,102 326,106 333,116 328,128 312,124 298,120 295,112',
  '174,32 179,30 181,36 177,40 173,37',
  '314,48 320,46 323,54 320,62 315,58',
  '299,72 304,73 305,82 301,86 298,80',
  '283,88 300,90 308,94 296,98 285,94',
  '225,104 229,106 230,114 226,116 224,110',
  '349,127 353,128 353,137 349,138 348,132',
];

const ANTARCTICA = '0,168 40,164 110,166 180,163 250,166 320,164 360,167 360,180 0,180';

function Hemisphere() {
  return (
    <svg
      className="loader-globe__hemi"
      viewBox="0 0 360 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="#3fa873"
        stroke="rgba(6,34,24,0.4)"
        strokeWidth="0.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {CONTINENTS.map((points, index) => (
          <polygon key={index} points={points} />
        ))}
      </g>
      <polygon points={ANTARCTICA} fill="rgba(214,236,231,0.55)" stroke="none" />
    </svg>
  );
}

export default function SpinningGlobe({ className = '' }) {
  return (
    <div className={`loader-globe ${className}`} aria-hidden="true">
      <div className="loader-globe__track">
        <Hemisphere />
        <Hemisphere />
      </div>
      <div className="loader-globe__shade" />
    </div>
  );
}
