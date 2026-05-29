import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const bar = barRef.current;
    if (!bar) return undefined;

    gsap.set(bar, { scaleX: 0 });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 z-[60] h-[2px] w-full pointer-events-none"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-primary"
        style={{
          boxShadow: '0 0 12px var(--color-primary)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
