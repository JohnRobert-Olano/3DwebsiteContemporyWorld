import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafPending = false;

    const compute = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight =
        (document.documentElement.scrollHeight || 0) - window.innerHeight;
      const p = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      setProgress(p);
      rafPending = false;
    };

    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(compute);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    compute();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 z-[60] h-[2px] w-full pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-[#0A6ED3]"
        style={{
          transform: `scaleX(${progress})`,
          boxShadow: '0 0 8px rgba(10, 110, 211, 0.7)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
