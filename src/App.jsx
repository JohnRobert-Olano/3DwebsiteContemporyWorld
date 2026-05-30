import { Suspense, useCallback, useEffect, useState, useRef, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

const CesiumEarth = lazy(() => import('./components/CesiumEarth'));
import Content from './components/Content';
import LoadingScreen from './components/LoadingScreen';
import IntroSequence from './components/IntroSequence';
import ScrollProgress from './components/ScrollProgress';

function App() {
  const [isResetting, setIsResetting] = useState(false);
  // Intro starts hidden: it only mounts once the Earth is visually ready, so the
  // World View reveal always plays over a finished globe (never a black/empty stage).
  const [introActive, setIntroActive] = useState(false);
  const [earthReady, setEarthReady] = useState(false);
  const [earthError, setEarthError] = useState(false);
  const lenisRef = useRef(null);

  // The boot loading screen owns the first-render gate until Cesium confirms the
  // tiles are visually ready, or a setup/tile error makes waiting pointless.
  const booting = !earthReady && !earthError;

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

  const handleEarthReady = useCallback(() => setEarthReady(true), []);

  const handleEarthError = useCallback(() => {
    setEarthError(true);
    // Don't leave the page scroll-locked behind a terminal setup-error screen.
    if (lenisRef.current) lenisRef.current.start();
  }, []);

  // Fired after the boot loader finishes fading out. Play the World View intro only
  // when the Earth actually rendered — on the error path the intro never mounts.
  const handleBootGateExit = useCallback(() => {
    if (earthReady) setIntroActive(true);
  }, [earthReady]);

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

      {/* Boot loading gate — owns the first render until the Earth is visually
          ready, then fades out and hands off to the World View intro. */}
      <AnimatePresence onExitComplete={handleBootGateExit}>
        {booting && <LoadingScreen key="boot" />}
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

      <nav className="pointer-events-auto fixed left-1/2 top-4 z-50 -translate-x-1/2 sm:top-5" aria-label="Primary navigation">
        <div className="flex items-center justify-center gap-5 sm:gap-8">
          <a
            href="/"
            onClick={handleHomeClick}
            className="px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            World View
          </a>
          <a
            href="#culture"
            className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Topics
          </a>
        </div>
      </nav>

      {/* Scroll progress bar (top sliver) */}
      <ScrollProgress />

      {/* Immersive 3D Earth Layer (Fixed Background) */}
      <Suspense fallback={<LoadingScreen />}>
        <CesiumEarth onVisualReady={handleEarthReady} onSetupError={handleEarthError} />
      </Suspense>

      {/* GSAP DOM Scrollytelling Layer (Foreground) */}
      <Content lenisRef={lenisRef} />
    </main>
  );
}

export default App;
