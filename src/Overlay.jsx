import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Overlay = ({ modelRef }) => {
  const overlayRef = useRef();

  useLayoutEffect(() => {
    if (!modelRef.current || !modelRef.current.group) return;

    const group = modelRef.current.group;

    let ctx = gsap.context(() => {
      // Setup text reveal animations
      const textElements = document.querySelectorAll('.reveal-text');
      textElements.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // 3D Model Scroll Animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: overlayRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth scrubbing
        },
      });

      // Section 1 to Section 2 (Hero to Market Intelligence)
      tl.to(group.position, { x: 2, y: -0.5, z: 0, ease: 'power1.inOut' }, 0)
        .to(group.rotation, { x: 0.2, y: Math.PI / 2, z: 0, ease: 'power1.inOut' }, 0)
        .to(group.scale, { x: 1.2, y: 1.2, z: 1.2, ease: 'power1.inOut' }, 0);

      // Section 2 to Section 3 (Market Intelligence to Predictive Trade)
      tl.to(group.position, { x: -2, y: 0.5, z: 1, ease: 'power1.inOut' }, 1)
        .to(group.rotation, { x: -0.2, y: Math.PI, z: 0.1, ease: 'power1.inOut' }, 1)
        .to(group.scale, { x: 1.5, y: 1.5, z: 1.5, ease: 'power1.inOut' }, 1);

      // Section 3 to Section 4 (Predictive Trade to Fluid Compensation)
      tl.to(group.position, { x: 0, y: 0, z: 2, ease: 'power1.inOut' }, 2)
        .to(group.rotation, { x: 0, y: Math.PI * 1.5, z: 0, ease: 'power1.inOut' }, 2)
        .to(group.scale, { x: 1.8, y: 1.8, z: 1.8, ease: 'power1.inOut' }, 2);

      // Section 4 to Footer
      tl.to(group.position, { x: 0, y: 1, z: 0, ease: 'power1.inOut' }, 3)
        .to(group.rotation, { x: 0.5, y: Math.PI * 2, z: 0, ease: 'power1.inOut' }, 3)
        .to(group.scale, { x: 1, y: 1, z: 1, ease: 'power1.inOut' }, 3);

    }, overlayRef);

    return () => ctx.revert();
  }, [modelRef]);

  return (
    <div ref={overlayRef} className="w-full">
      {/* SECTION 1: The Hero */}
      <section className="h-screen w-full flex items-center justify-center p-8 lg:p-24 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="glass px-8 py-10 rounded-2xl pointer-events-auto shadow-2xl">
            <h1 className="reveal-text font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-dark">
              Globalization <br/>
              <span className="text-white drop-shadow-md">Money.</span>
            </h1>
            <p className="reveal-text font-mono text-sm md:text-base uppercase tracking-widest text-dark/70 mb-8 max-w-xl mx-auto">
              The Borderless Paradigm
            </p>
            <button className="reveal-text px-8 py-4 bg-dark text-white font-sans font-medium text-lg rounded-full hover:bg-white hover:text-dark transition-colors duration-300 pointer-events-auto border border-dark">
              Enter the Network
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Market Intelligence */}
      <section className="h-screen w-full flex items-center p-8 lg:p-24 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex justify-start">
          <div className="glass p-8 md:p-12 rounded-2xl max-w-lg pointer-events-auto shadow-xl">
            <h2 className="reveal-text font-serif text-4xl md:text-5xl font-bold mb-4">
              Market <br/> Intelligence
            </h2>
            <p className="reveal-text font-sans text-lg text-dark/80 mb-6 leading-relaxed">
              Real-time capital mapping across global borders. Identify shifting liquidity events before they manifest.
            </p>
            <div className="reveal-text font-mono text-xs font-bold uppercase tracking-widest text-dark/60 border-l-2 border-dark pl-4">
              Latency: &lt; 12ms <br/>
              Nodes Active: 14,204
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Predictive Trade */}
      <section className="h-screen w-full flex items-center p-8 lg:p-24 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex justify-end">
          <div className="glass p-8 md:p-12 rounded-2xl max-w-lg pointer-events-auto shadow-xl">
            <h2 className="reveal-text font-serif text-4xl md:text-5xl font-bold mb-4">
              Predictive <br/> Trade
            </h2>
            <p className="reveal-text font-sans text-lg text-dark/80 mb-6 leading-relaxed">
              AI-driven economic forecasting. We don't just follow the markets; we calculate the most probable futures and position you at the vanguard.
            </p>
            <div className="reveal-text flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-dark flex items-center justify-center text-white font-mono text-xs font-bold">AI</div>
              <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center text-dark font-mono text-xs font-bold border border-dark/20">ML</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Fluid Compensation */}
      <section className="h-screen w-full flex items-center p-8 lg:p-24 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex justify-start">
          <div className="glass p-8 md:p-12 rounded-2xl max-w-lg pointer-events-auto shadow-xl">
            <h2 className="reveal-text font-serif text-4xl md:text-5xl font-bold mb-4">
              Fluid <br/> Compensation
            </h2>
            <p className="reveal-text font-sans text-lg text-dark/80 mb-6 leading-relaxed">
              Distributed workforce liquidity. Payroll and compensation strategies optimized for a geography-agnostic world.
            </p>
            <button className="reveal-text font-sans font-bold uppercase text-sm tracking-wider border-b-2 border-dark pb-1 hover:text-white hover:border-white transition-colors duration-300">
              Discover Liquidity
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: The Footer */}
      <footer className="h-[50vh] w-full flex flex-col items-center justify-center p-8 pointer-events-none bg-dark/5 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h3 className="reveal-text font-serif text-3xl md:text-4xl font-bold mb-8">
            Trusted by forward-thinking teams.
          </h3>
          <div className="reveal-text flex flex-wrap justify-center gap-8 opacity-60 pointer-events-auto">
            {/* Logos Placeholder */}
            <span className="font-mono text-xl font-bold">CORP.A</span>
            <span className="font-mono text-xl font-bold">GLOBAL.INC</span>
            <span className="font-mono text-xl font-bold">VENTURE.IO</span>
          </div>
          <p className="reveal-text mt-16 font-mono text-xs tracking-widest text-dark/40 uppercase">
            © 2026 Globalization Money. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Overlay;
