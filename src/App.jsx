import { Suspense, useEffect } from 'react';
import Lenis from 'lenis';
import MapboxEarth from './components/MapboxEarth';
import Content from './components/Content';
import LoadingScreen from './components/LoadingScreen';

function App() {
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

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="relative w-full min-h-screen bg-[#080808] text-white overflow-x-hidden font-sans">

      {/* Navbar (Cosmos Glassmorphism) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" aria-label="Primary navigation">
        <div className="glass px-5 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center gap-5 shadow-2xl sm:px-8 sm:gap-8">
          <span className="text-xs uppercase tracking-widest font-bold text-white">Global Cosmos</span>
          <a
            href="#culture"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A6ED3] transition-colors cursor-pointer"
          >
            Explore sections
          </a>
        </div>
      </nav>

      {/* Immersive 3D Earth Layer (Fixed Background) */}
      <Suspense fallback={<LoadingScreen />}>
        <MapboxEarth />
      </Suspense>

      {/* GSAP DOM Scrollytelling Layer (Foreground) */}
      <Content />
    </main>
  );
}

export default App;
