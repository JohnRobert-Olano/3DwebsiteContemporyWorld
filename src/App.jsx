import { Suspense, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import MapboxEarth from './components/MapboxEarth';
import Content from './components/Content';
import LandmarkEventOverlay from './components/LandmarkEventOverlay';
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080808]/90 backdrop-blur-md"
          >
            <div className="relative flex flex-col items-center justify-center">
               <div className="w-24 h-24 border-4 border-t-[#0A6ED3] border-r-transparent border-b-[#0A6ED3]/30 border-l-transparent rounded-full animate-spin" />
               <div className="absolute top-0 w-24 h-24 border-4 border-t-transparent border-r-[#7DB7F0] border-b-transparent border-l-[#7DB7F0]/30 rounded-full animate-[spin_1.5s_linear_reverse_infinite]" />
               <div className="mt-8 text-xs font-bold tracking-[0.3em] text-[#0A6ED3] uppercase animate-pulse">
                 Synchronizing
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar (Cosmos Glassmorphism) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" aria-label="Primary navigation">
        <div className="glass px-5 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center gap-5 shadow-2xl sm:px-8 sm:gap-8">
          <a
            href="/"
            onClick={handleHomeClick}
            className="text-xs uppercase tracking-widest font-bold text-white hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A6ED3] transition-colors cursor-pointer"
          >
            Home
          </a>
          <a
            href="#culture"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A6ED3] transition-colors cursor-pointer"
          >
            Timeline
          </a>
        </div>
      </nav>

      {/* Scroll progress bar (top sliver) */}
      <ScrollProgress />

      {/* Immersive 3D Earth Layer (Fixed Background) */}
      <Suspense fallback={<LoadingScreen />}>
        <MapboxEarth />
      </Suspense>

      {/* Cinematic foreground PNG overlays — sits between the map (z-0) and
          the Content layer (z-10) so the destination card and nav stay on top. */}
      <LandmarkEventOverlay />

      {/* GSAP DOM Scrollytelling Layer (Foreground) */}
      <Content lenisRef={lenisRef} />
    </main>
  );
}

export default App;
