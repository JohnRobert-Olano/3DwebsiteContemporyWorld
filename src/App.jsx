import { Suspense } from 'react';
import CanvasContainer from './components/CanvasContainer';
import DomOverlay from './components/DomOverlay';
import LoadingScreen from './components/LoadingScreen';

function App() {
  return (
    <main className="relative w-full min-h-screen bg-[var(--color-dark)] text-white overflow-x-hidden">
      {/* 3D Canvas Layer */}
      <Suspense fallback={<LoadingScreen />}>
        <CanvasContainer />
      </Suspense>

      {/* GSAP DOM Scrollytelling Layer */}
      <DomOverlay />
    </main>
  );
}

export default App;
