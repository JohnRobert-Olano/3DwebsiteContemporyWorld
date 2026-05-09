import { Suspense, useEffect } from 'react';
import Lenis from 'lenis';
import Scene from './components/Scene';
import Content from './components/Content';
import LoadingScreen from './components/LoadingScreen';

function App() {
  useEffect(() => {
    // Lenis Smooth Scroll Setup for that "choppy-free" premium feel
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
    <main className="relative w-full min-h-screen bg-[#E8C56A] text-gray-900 overflow-x-hidden">
      {/* Immersive 3D Earth Layer (Fixed) */}
      <Suspense fallback={<LoadingScreen />}>
        <Scene />
      </Suspense>

      {/* GSAP DOM Scrollytelling Layer */}
      <Content />
    </main>
  );
}

export default App;
