import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { landmarkEventScenes } from '../lib/data/landmarkEvents';

const sideToAnchor = (side) => {
  if (side === 'left') return { left: '0', right: 'auto' };
  if (side === 'right') return { left: 'auto', right: '0' };
  // center: positioned at left:50%, the wrapper CSS pulls it back by 50% of
  // its own width via a transform that also folds in parallax.
  return { left: '50%', right: 'auto' };
};

const sideToTransformOrigin = (side) => {
  if (side === 'left') return '0% 100%';
  if (side === 'right') return '100% 100%';
  return '50% 100%';
};

function EventFigure({ figure, sceneRef, prefersReducedMotion, parallax }) {
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);
  // When the real PNG is missing, swap to a silhouette placeholder so the
  // animation system stays visible. The wrapper/transform pipeline doesn't
  // care which child it animates — drop a real PNG in /public/events/... and
  // this fallback disappears automatically.
  const [missing, setMissing] = useState(false);

  const side = figure.side ?? 'left';
  const depth = figure.depth ?? 'foreground';

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (prefersReducedMotion) {
      const target = figure.activeTo ?? { x: 0, y: 0, opacity: 1, scale: 1 };
      gsap.set(el, {
        x: 0,
        y: 0,
        opacity: target.opacity ?? 1,
        scale: 1,
      });
      return;
    }
    const enter = figure.enterFrom ?? { x: 0, y: 40, opacity: 0, scale: 1 };
    gsap.set(el, {
      x: enter.x ?? 0,
      y: enter.y ?? 0,
      opacity: enter.opacity ?? 0,
      scale: enter.scale ?? 1,
    });
  }, [figure, prefersReducedMotion]);

  useEffect(() => {
    const el = imgRef.current;
    const scene = sceneRef.current;
    if (!el || !scene || prefersReducedMotion) return undefined;

    const onActive = () => {
      const target = figure.activeTo ?? { x: 0, y: 0, opacity: 1, scale: 1 };
      gsap.to(el, {
        x: target.x ?? 0,
        y: target.y ?? 0,
        opacity: target.opacity ?? 1,
        scale: target.scale ?? 1,
        duration: 1.1,
        ease: 'power3.out',
        overwrite: true,
      });
    };

    const onLeave = () => {
      const target = figure.exitTo ?? { x: 0, y: -30, opacity: 0, scale: 1 };
      gsap.to(el, {
        x: target.x ?? 0,
        y: target.y ?? 0,
        opacity: target.opacity ?? 0,
        scale: target.scale ?? 1,
        duration: 0.7,
        ease: 'power2.in',
        overwrite: true,
      });
    };

    scene.addEventListener('scene:enter', onActive);
    scene.addEventListener('scene:leave', onLeave);

    return () => {
      scene.removeEventListener('scene:enter', onActive);
      scene.removeEventListener('scene:leave', onLeave);
    };
  }, [figure, sceneRef, prefersReducedMotion]);

  // Parallax — applied to the WRAPPER (CSS transform), so GSAP can keep
  // ownership of the inner <img>'s transform without fighting it.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const speed = figure.parallaxSpeed ?? 0;
    if (speed === 0 || prefersReducedMotion) {
      wrapper.style.setProperty('--ev-parallax-x', '0px');
      wrapper.style.setProperty('--ev-parallax-y', '0px');
      return;
    }
    wrapper.style.setProperty('--ev-parallax-x', `${parallax.x * speed * 30}px`);
    wrapper.style.setProperty('--ev-parallax-y', `${parallax.y * speed * 18}px`);
  }, [parallax, figure.parallaxSpeed, prefersReducedMotion]);

  const anchor = sideToAnchor(side);

  const wrapperStyle = {
    ...anchor,
    bottom: figure.bottom ?? '8vh',
    '--ev-w-desktop': figure.desktopWidth ?? 'clamp(180px, 18vw, 320px)',
    '--ev-w-mobile': figure.mobileWidth ?? '34vw',
  };

  const sideClass =
    side === 'left'
      ? 'event-figure-left'
      : side === 'right'
        ? 'event-figure-right'
        : 'event-figure-center';
  const depthClass =
    depth === 'background' ? 'event-figure-background' : 'event-figure-foreground';
  const mobileClass = figure.hideOnMobile ? 'event-figure-hide-mobile' : '';

  return (
    <div
      ref={wrapperRef}
      className={`event-figure-wrapper ${sideClass} ${depthClass} ${mobileClass}`.trim()}
      style={wrapperStyle}
    >
      {missing ? (
        <div
          ref={imgRef}
          className={`event-figure event-figure-placeholder ${figure.className ?? ''}`.trim()}
          style={{ transformOrigin: sideToTransformOrigin(side) }}
          title={figure.alt ?? figure.src}
        >
          <span className="event-figure-placeholder-label">
            {figure.alt ?? 'Missing PNG'}
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={figure.src}
          alt={figure.alt ?? ''}
          onError={() => setMissing(true)}
          draggable={false}
          className={`event-figure ${figure.className ?? ''}`.trim()}
          style={{ transformOrigin: sideToTransformOrigin(side) }}
        />
      )}
    </div>
  );
}

function Scene({ destinationId, isActive, parallax, prefersReducedMotion }) {
  const sceneRef = useRef(null);
  const figures = landmarkEventScenes[destinationId] ?? [];
  const wasActiveRef = useRef(false);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (isActive) {
      scene.dispatchEvent(new CustomEvent('scene:enter'));
      wasActiveRef.current = true;
    } else if (wasActiveRef.current) {
      scene.dispatchEvent(new CustomEvent('scene:leave'));
    }
  }, [isActive]);

  if (figures.length === 0) return null;

  return (
    <div
      ref={sceneRef}
      className="landmark-event-scene"
      data-destination={destinationId}
      data-active={isActive ? 'true' : 'false'}
      aria-hidden="true"
    >
      {figures.map((figure, i) => (
        <EventFigure
          key={`${destinationId}-${i}`}
          figure={figure}
          sceneRef={sceneRef}
          prefersReducedMotion={prefersReducedMotion}
          parallax={parallax}
        />
      ))}
    </div>
  );
}

export default function LandmarkEventOverlay() {
  const [activeId, setActiveId] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const prefersReducedMotion =
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const onChange = (event) => {
      setActiveId(event.detail?.id ?? null);
    };
    window.addEventListener('landmark:active', onChange);
    return () => window.removeEventListener('landmark:active', onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    let raf = 0;
    let pending = null;

    const apply = () => {
      raf = 0;
      if (pending) setParallax(pending);
    };

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pending = {
        x: (e.clientX / w) * 2 - 1,
        y: (e.clientY / h) * 2 - 1,
      };
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [prefersReducedMotion]);

  const allIds = Object.keys(landmarkEventScenes);

  return (
    <div className="landmark-event-layer" aria-hidden="true">
      {allIds.map((id) => (
        <Scene
          key={id}
          destinationId={id}
          isActive={activeId === id}
          parallax={parallax}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </div>
  );
}
