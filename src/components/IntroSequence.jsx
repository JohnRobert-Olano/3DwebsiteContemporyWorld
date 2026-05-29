import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const VARIANT_CONFIG = {
  static: { totalMs: 1200, spinStartDeg: 0, isStatic: true },
  mobile: { totalMs: 4000, spinStartDeg: -270, isStatic: false },
  desktop: { totalMs: 5400, spinStartDeg: -540, isStatic: false },
};

const SPIN_END_RATIO = 0.65;
const SUBTITLE_FADE_START_RATIO = 0.5;
const OUTRO_START_RATIO = 0.88;
const STATIC_OUTRO_START_RATIO = 0.72;

const WORLD_LETTERS = 'WORLD'.split('');
const SPIN_END_DEG = 0;
const LETTER_ANGLE_DEG = 22;
const RADIUS = 500;

const STAR_COORDS = [
  { top: '12%', left: '18%', delay: 0.2 },
  { top: '45%', left: '85%', delay: 1.1 },
  { top: '78%', left: '14%', delay: 0.5 },
  { top: '32%', left: '56%', delay: 1.8 },
  { top: '88%', left: '41%', delay: 0.9 },
  { top: '22%', left: '74%', delay: 1.4 },
  { top: '63%', left: '31%', delay: 0.3 },
  { top: '15%', left: '92%', delay: 1.7 },
  { top: '51%', left: '69%', delay: 0.7 },
  { top: '91%', left: '83%', delay: 1.2 },
  { top: '37%', left: '21%', delay: 0.6 },
  { top: '74%', left: '58%', delay: 1.5 },
];

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

  let cylinderAngle;
  let subtitleOpacity;
  let overallOpacity;

  if (cfg.isStatic) {
    cylinderAngle = 0;
    const fadeIn = easeOutCubic(Math.min(1, progress / 0.35));
    subtitleOpacity = fadeIn;
    const outroT = Math.max(0, (progress - STATIC_OUTRO_START_RATIO) / (1 - STATIC_OUTRO_START_RATIO));
    overallOpacity = fadeIn * (1 - outroT);
  } else {
    const spinT = Math.min(1, progress / SPIN_END_RATIO);
    cylinderAngle = cfg.spinStartDeg + (SPIN_END_DEG - cfg.spinStartDeg) * easeOutQuart(spinT);
    const subtitleFadeT = Math.max(0, Math.min(1, (progress - SUBTITLE_FADE_START_RATIO) / (0.8 - SUBTITLE_FADE_START_RATIO)));
    subtitleOpacity = easeOutCubic(subtitleFadeT);
    const outroT = Math.max(0, Math.min(1, (progress - OUTRO_START_RATIO) / (1 - OUTRO_START_RATIO)));
    overallOpacity = 1 - outroT;
  }

  const halfIdx = (WORLD_LETTERS.length - 1) / 2;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden pointer-events-none bg-black"
      style={{ opacity: overallOpacity }}
      aria-hidden="true"
    >
      {/* Central Glow */}
      {!cfg.isStatic && (
        <div
          className="absolute h-[80vh] w-[80vh] rounded-full opacity-10 blur-[120px]"
          style={{
            background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`,
            transform: `scale(${0.5 + progress * 1.5})`,
          }}
        />
      )}

      {/* SVG Cylinder Projection */}
      <svg
        viewBox="-800 -400 1600 800"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(100vmin, 1400px)', height: 'auto' }}
      >
        <g>
          {WORLD_LETTERS.map((char, i) => {
            const baseAngle = (i - halfIdx) * LETTER_ANGLE_DEG;
            const totalAngleDeg = baseAngle + cylinderAngle;
            const angleRad = toRad(totalAngleDeg);
            const cos = Math.cos(angleRad);

            if (cos <= 0.02) return null;

            const x = Math.sin(angleRad) * RADIUS;
            const scaleX = Math.abs(cos);
            const opacity = Math.min(1, cos * 2);

            return (
              <text
                key={i}
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-display font-black"
                fontSize="240"
                fill="white"
                style={{
                  transform: `translate(${x.toFixed(2)}px, 0) scale(${scaleX.toFixed(4)}, 1)`,
                  opacity: opacity.toFixed(3),
                }}
              >
                {char}
              </text>
            );
          })}
        </g>
        
        {/* Subtitle */}
        <text
           x="0"
           y="240"
           textAnchor="middle"
           className="font-mono"
           fontSize="20"
           fill="var(--accent)"
           letterSpacing="12"
           opacity={subtitleOpacity}
           style={{ textTransform: 'uppercase' }}
        >
          Perspective Access
        </text>
      </svg>

      {/* Minimal Starfield */}
      {!cfg.isStatic && (
        <div className="absolute inset-0">
          {STAR_COORDS.map((star, i) => (
            <motion.div
              key={i}
              className="absolute h-[1.5px] w-[1.5px] rounded-full bg-white shadow-[0_0_8px_white]"
              style={{
                top: star.top,
                left: star.left,
              }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
