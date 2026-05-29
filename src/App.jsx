import { Suspense, useEffect, useState, useRef, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

const CesiumEarth = lazy(() => import('./components/CesiumEarth'));
import Content from './components/Content';
import LoadingScreen from './components/LoadingScreen';
import IntroSequence from './components/IntroSequence';
import ScrollProgress from './components/ScrollProgress';

function App() {
  const [isResetting, setIsResetting] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const lenisRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      duration: reducedMotion ? 0.01 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: !reducedMotion,
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
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden bg-bg text-white font-sans">
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

      <nav className="fixed left-1/2 top-4 z-50 w-[min(92vw,46rem)] -translate-x-1/2 pointer-events-auto sm:top-5" aria-label="Primary navigation">
        <div className="glass grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full px-3 py-2 sm:px-4">
          <a
            href="/"
            onClick={handleHomeClick}
            className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-primary focus-visible:outline-primary"
          >
            World View
          </a>
          <div className="hidden h-px bg-white/[0.12] sm:block" aria-hidden="true" />
          <a
            href="#culture"
            className="justify-self-end rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted transition-colors hover:text-white focus-visible:outline-primary sm:justify-self-auto"
          >
            Topics
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
