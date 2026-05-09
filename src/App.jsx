import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import Overlay from './Overlay';

function App() {
  const modelRef = useRef();
  
  return (
    <div className="w-full bg-primary text-dark font-sans relative">
      {/* 3D Canvas Layer - Fixed Background */}
      <div className="fixed top-0 left-0 w-full h-[100vh] z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            {/* The modelRef is passed down to be controlled by GSAP */}
            <Experience ref={modelRef} />
          </Suspense>
        </Canvas>
      </div>

      {/* HTML / Scroll Layer */}
      <div className="relative z-10 w-full pointer-events-none">
        <Overlay modelRef={modelRef} />
      </div>
    </div>
  );
}

export default App;
