import { useEffect, useState } from 'react';
import GlobeWordReveal from './GlobeWordReveal';

// Full-viewport layer rendered BEHIND the (now transparent) Cesium canvas, so
// the real Earth occludes the centre of the cinematic word reveals. The reveal
// panels in Content drive it through `globe-reveal` window events rather than
// rendering the title themselves (they live above the globe and couldn't sit
// behind it).
export default function GlobeBackdrop() {
  const [reveal, setReveal] = useState({ text: '', active: false });

  const reducedMotion =
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const onReveal = (event) => {
      const detail = event.detail || {};
      setReveal((current) => ({
        // Keep the last text while animating out so the exit transition reads.
        text: detail.text || current.text,
        active: !!detail.active,
      }));
    };
    window.addEventListener('globe-reveal', onReveal);
    return () => window.removeEventListener('globe-reveal', onReveal);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden={!reveal.active}>
      {reveal.text && (
        <GlobeWordReveal text={reveal.text} active={reveal.active} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
