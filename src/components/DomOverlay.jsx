import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function DomOverlay() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Basic GSAP setup for scrollytelling
    const ctx = gsap.context(() => {
      gsap.from('.stagger-text', {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top center',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative z-10 w-full min-h-[300vh]">
      {/* Hero Section */}
      <section className="hero-section h-screen flex flex-col justify-center items-center text-center px-4">
        <h1 className="stagger-text text-5xl md:text-7xl font-serif text-[var(--color-primary)] font-bold mb-6">
          Globalization Money
        </h1>
        <p className="stagger-text text-lg md:text-xl text-white/80 max-w-2xl font-sans glass p-6 rounded-2xl">
          The new era of borderless finance and digital economies.
        </p>
      </section>

      {/* Scrollytelling Content */}
      <section className="h-screen flex items-center px-8 md:px-24">
        <div className="glass p-8 rounded-3xl max-w-lg">
          <h2 className="text-3xl font-serif text-[var(--color-primary)] mb-4">
            A World Connected
          </h2>
          <p className="text-white/70">
            Scroll to explore how capital moves across the globe in real-time.
          </p>
        </div>
      </section>
    </div>
  );
}
