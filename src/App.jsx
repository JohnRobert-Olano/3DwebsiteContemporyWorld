import { Suspense, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import CesiumEarth from './components/CesiumEarth';
import Content from './components/Content';
import LoadingScreen from './components/LoadingScreen';
import IntroSequence from './components/IntroSequence';
import ScrollProgress from './components/ScrollProgress';

function App() {
  const [isResetting, setIsResetting] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const lenisRef = useRef(null);

  useEffect(() => {
    // Lenis Smooth Scroll Setup
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    lenisRef.current = lenis;
    window.codexLenis = lenis;
    // Hold scroll while the intro plays so the user can't bail out mid-reveal
    lenis.stop();

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      if (window.codexLenis === lenis) {
        delete window.codexLenis;
      }
    };
  }, []);

  const handleIntroComplete = () => {
    setIntroActive(false);
    if (lenisRef.current) lenisRef.current.start();
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setIsResetting(true);
    if (lenisRef.current) lenisRef.current.stop();
    
    // Perform reset actions behind the loading screen
    setTimeout(() => {
      // Jump to top instantly behind the loading screen using Lenis
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
      window.dispatchEvent(new Event('resetGlobe'));
      
      const onResetComplete = () => {
        setIsResetting(false);
        if (lenisRef.current) lenisRef.current.start();
        window.removeEventListener('globeResetComplete', onResetComplete);
      };
      
      window.addEventListener('globeResetComplete', onResetComplete);
      // Fallback in case of flight interruption
      setTimeout(onResetComplete, 3500);
    }, 600); // Wait for fade in
  };

  return (
    <main className="relative w-full min-h-screen bg-[#080808] text-white overflow-x-hidden font-sans">
      <AnimatePresence>
        {introActive && (
          <IntroSequence key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <div className="relative flex flex-col items-center justify-center">
               <div className="w-16 h-16 border-[0.5px] border-white/20 rounded-full flex items-center justify-center">
                 <div className="w-12 h-12 border-t border-primary rounded-full animate-spin" />
               </div>
               <div className="mt-6 font-mono text-[10px] tracking-[0.4em] text-muted uppercase">
                 Resynchronizing
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar (Minimalist Tech) */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" aria-label="Primary navigation">
        <div className="glass px-6 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl flex items-center gap-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <a
            href="/"
            onClick={handleHomeClick}
            className="text-[10px] uppercase tracking-[0.25em] font-bold text-white hover:text-primary transition-colors cursor-pointer"
          >
            Index
          </a>
          <div className="w-px h-3 bg-white/10" />
          <a
            href="#culture"
            className="text-[10px] uppercase tracking-[0.25em] text-muted hover:text-white transition-colors cursor-pointer"
          >
            Archive
          </a>
        </div>
      </nav>

      {/* Scroll progress bar (top sliver) */}
      <ScrollProgress />

      {/* Immersive 3D Earth Layer (Fixed Background) */}
      <Suspense fallback={<LoadingScreen />}>
        <CesiumEarth />
      </Suspense>

      {/* GSAP DOM Scrollytelling Layer (Foreground) */}
      <Content lenisRef={lenisRef} />
    </main>
  );
}

export default App;
