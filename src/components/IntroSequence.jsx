import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Per-variant timing/orbit profile
const VARIANT_CONFIG = {
  // prefers-reduced-motion → static wordmark fade-in, no orbit
  static: { totalMs: 1200, spinStartDeg: 0, isStatic: true },
  // Phone-sized viewports → shorter orbit, no full hidden phase
  mobile: { totalMs: 4000, spinStartDeg: -270, isStatic: false },
  // Default cinematic 1.5-revolution orbit
  desktop: { totalMs: 5400, spinStartDeg: -540, isStatic: false },
};

// Cinematic phase ratios (mobile + desktop share these)
const SPIN_END_RATIO = 0.65;
const VIEW_FADE_START_RATIO = 0.5;
const VIEW_FADE_END_RATIO = 0.68;
const OUTRO_START_RATIO = 0.88;

// Static phase ratios
const STATIC_FADE_IN_END_RATIO = 0.35;
const STATIC_OUTRO_START_RATIO = 0.72;

const WORLD_LETTERS = 'WORLD'.split('');
const VIEW_LETTERS = 'VIEW'.split('');
const SPIN_END_DEG = 0;
const LETTER_ANGLE_DEG = 25;
const RADIUS = 600;

const WORLD_FONT_SIZE = 240;
const VIEW_FONT_SIZE = 88;
const VIEW_LETTER_SPACING = 140;
const VIEW_Y_OFFSET = 230;

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const toRad = (deg) => (deg * Math.PI) / 180;

function getInitialVariant() {
  if (typeof window === 'undefined') return 'desktop';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return 'static';

  if (window.innerWidth < 768) return 'mobile';
  return 'desktop';
}

export default function IntroSequence({ onComplete }) {
  const [variant] = useState(getInitialVariant);
  const cfg = VARIANT_CONFIG[variant];

  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const startTimeRef = useRef(null);

  // Escape rewinds the rAF clock to the outro phase, letting the natural fade play out.
  const skipToOutro = useCallback(() => {
    if (completedRef.current || startTimeRef.current === null) return;
    const skipTarget = cfg.isStatic ? STATIC_OUTRO_START_RATIO : OUTRO_START_RATIO;
    const elapsed = performance.now() - startTimeRef.current;
    const currentRatio = elapsed / cfg.totalMs;
    if (currentRatio < skipTarget) {
      startTimeRef.current = performance.now() - cfg.totalMs * skipTarget;
    }
  }, [cfg.totalMs, cfg.isStatic]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') skipToOutro();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipToOutro]);

  useEffect(() => {
    let rafId;
    const tick = (now) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / cfg.totalMs);
      setProgress(p);

      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cfg.totalMs, onComplete]);

  // --- Derived per-frame values ---
  let cylinderAngle;
  let viewOpacity;
  let viewY;
  let overallOpacity;

  if (cfg.isStatic) {
    // Static fade-in: letters parked in final position, opacity ramps in/out
    cylinderAngle = 0;
    const fadeInT = Math.min(1, progress / STATIC_FADE_IN_END_RATIO);
    const outroT = Math.max(
      0,
      (progress - STATIC_OUTRO_START_RATIO) / (1 - STATIC_OUTRO_START_RATIO),
    );
    const fadeIn = easeOutCubic(fadeInT);
    viewOpacity = fadeIn;
    viewY = VIEW_Y_OFFSET;
    overallOpacity = Math.min(fadeIn, 1 - Math.max(0, Math.min(1, outroT)));
  } else {
    // Cinematic orbit
    const spinT = Math.min(1, progress / SPIN_END_RATIO);
    cylinderAngle =
      cfg.spinStartDeg + (SPIN_END_DEG - cfg.spinStartDeg) * easeOutQuart(spinT);

    const viewFadeT = Math.max(
      0,
      Math.min(
        1,
        (progress - VIEW_FADE_START_RATIO) /
          (VIEW_FADE_END_RATIO - VIEW_FADE_START_RATIO),
      ),
    );
    viewOpacity = easeOutCubic(viewFadeT);
    viewY = VIEW_Y_OFFSET + (1 - viewOpacity) * 28;

    const outroT = Math.max(
      0,
      Math.min(1, (progress - OUTRO_START_RATIO) / (1 - OUTRO_START_RATIO)),
    );
    overallOpacity = 1 - outroT;
  }

  const halfIdx = (WORLD_LETTERS.length - 1) / 2;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden pointer-events-none"
      style={{ opacity: overallOpacity }}
      aria-hidden="true"
    >
      {/* Cosmic dimming vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,12,0.32) 0%, rgba(0,0,8,0.72) 55%, rgba(0,0,0,0.96) 100%)',
        }}
      />

      {/* Lens flare — cinematic variants only */}
      {!cfg.isStatic && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '70vmin',
            height: '70vmin',
            background:
              'radial-gradient(circle, rgba(255,220,140,0.55) 0%, rgba(255,170,70,0.28) 26%, rgba(80,140,220,0.18) 50%, transparent 65%)',
            mixBlendMode: 'screen',
            filter: 'blur(2px)',
          }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{
            scale: [0.2, 0.9, 1.4, 1.55, 1.7],
            opacity: [0, 0.55, 0.55, 0.35, 0],
          }}
          transition={{
            duration: cfg.totalMs / 1000,
            times: [0, 0.42, 0.62, 0.85, 1],
            ease: 'easeOut',
          }}
        />
      )}

      {/* Wordmark SVG */}
      <svg
        viewBox="-800 -400 1600 800"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'min(110vmin, 1500px)',
          height: 'auto',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="iv-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="22%" stopColor="#E2E7ED" />
            <stop offset="46%" stopColor="#8E97A2" />
            <stop offset="50%" stopColor="#262B33" />
            <stop offset="54%" stopColor="#8E97A2" />
            <stop offset="78%" stopColor="#DCE2E9" />
            <stop offset="100%" stopColor="#4B5160" />
          </linearGradient>
          <linearGradient id="iv-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE9A8" />
            <stop offset="35%" stopColor="#F5C25A" />
            <stop offset="65%" stopColor="#A2701F" />
            <stop offset="100%" stopColor="#5C3D0E" />
          </linearGradient>
          <filter id="iv-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.7" />
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#0A6ED3" floodOpacity="0.5" />
            <feDropShadow dx="0" dy="0" stdDeviation="24" floodColor="#FFC857" floodOpacity="0.4" />
          </filter>
        </defs>

        <g filter="url(#iv-glow)">
          {/* WORLD — letters orbit a virtual cylinder, projected by hand */}
          {WORLD_LETTERS.map((char, i) => {
            const baseAngle = (i - halfIdx) * LETTER_ANGLE_DEG;
            const totalAngleDeg = baseAngle + cylinderAngle;
            const angleRad = toRad(totalAngleDeg);
            const cos = Math.cos(angleRad);

            if (cos <= 0.05) return null;

            const x = Math.sin(angleRad) * RADIUS;
            const scaleX = cos;
            const opacity = Math.min(1, cos * 1.5);

            return (
              <text
                key={`world-${i}`}
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'General Sans', system-ui, sans-serif"
                fontWeight="900"
                fontSize={WORLD_FONT_SIZE}
                fill="url(#iv-chrome)"
                stroke="url(#iv-gold)"
                strokeWidth="3"
                paintOrder="stroke fill"
                transform={`translate(${x.toFixed(2)}, 0) scale(${scaleX.toFixed(4)}, 1)`}
                opacity={opacity.toFixed(3)}
              >
                {char}
              </text>
            );
          })}

          {/* VIEW — flat, hand-positioned for clean centering */}
          {VIEW_LETTERS.map((char, i) => {
            const xPos = (i - (VIEW_LETTERS.length - 1) / 2) * VIEW_LETTER_SPACING;
            return (
              <text
                key={`view-${i}`}
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'General Sans', system-ui, sans-serif"
                fontWeight="700"
                fontSize={VIEW_FONT_SIZE}
                fill="url(#iv-chrome)"
                stroke="url(#iv-gold)"
                strokeWidth="1.8"
                paintOrder="stroke fill"
                transform={`translate(${xPos}, ${viewY.toFixed(2)})`}
                opacity={viewOpacity.toFixed(3)}
              >
                {char}
              </text>
            );
          })}
        </g>
      </svg>

      {!cfg.isStatic && <Starfield duration={cfg.totalMs / 1000} />}
    </motion.div>
  );
}

function Starfield({ duration }) {
  const stars = [
    { x: '12%', y: '22%', s: 2, d: 0.2 },
    { x: '78%', y: '18%', s: 3, d: 0.6 },
    { x: '22%', y: '74%', s: 2, d: 1.1 },
    { x: '86%', y: '68%', s: 2, d: 1.5 },
    { x: '38%', y: '14%', s: 1, d: 0.9 },
    { x: '64%', y: '82%', s: 1, d: 1.3 },
    { x: '8%', y: '52%', s: 1, d: 0.4 },
    { x: '92%', y: '40%', s: 2, d: 1.8 },
  ];

  return (
    <div className="absolute inset-0">
      {stars.map((star, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: star.x,
            top: star.y,
            width: `${star.s * 2}px`,
            height: `${star.s * 2}px`,
            boxShadow: '0 0 8px rgba(255,255,255,0.9)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1, 0] }}
          transition={{
            duration: Math.min(3.6, duration * 0.75),
            delay: Math.min(star.d, duration * 0.5),
            times: [0, 0.2, 0.55, 0.8, 1],
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
