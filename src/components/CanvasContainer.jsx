import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useEffect } from 'react';
import { Environment, Icosahedron, MeshDistortMaterial, Float } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

function Scene() {
  const meshRef = useRef();
  const materialRef = useRef();

  useEffect(() => {
    // ScrollTriggers mapped to the DOM sections
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".scrolly-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      }
    });

    // We have 6 sections. Each transition happens progressively across the scroll height.
    // Sec 1 (Initial): Centered, rotating.
    // Sec 2: Scales down slightly, shifts to the right
    tl.to(meshRef.current.position, { x: 2, duration: 1 }, 0)
      .to(meshRef.current.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 1 }, 0)
    
    // Sec 3: Rotates 180 degrees (Math.PI), lighting shifts (simulated by color and distortion)
      .to(meshRef.current.rotation, { y: Math.PI, duration: 1 }, 1)
      .to(materialRef.current, { color: new THREE.Color("#2a2a2a"), distort: 0.3, duration: 1 }, 1)
    
    // Sec 4: Agitated state, zooms in. Camera zoom simulated by moving Z.
      .to(meshRef.current.position, { x: 0, z: 2.5, duration: 1 }, 2)
      .to(materialRef.current, { distort: 0.9, speed: 6, color: new THREE.Color("#4a1a1a"), duration: 1 }, 2)
    
    // Sec 5: Timeline of Turning points. Sphere shifts left.
      .to(meshRef.current.position, { x: -2, z: 0, duration: 1 }, 3)
      .to(materialRef.current, { distort: 0.2, speed: 1, color: new THREE.Color("#1a3a3a"), duration: 1 }, 3)
      .to(meshRef.current.rotation, { x: Math.PI / 4, duration: 1 }, 3)
    
    // Sec 6: Centers, scales up, highly interactive
      .to(meshRef.current.position, { x: 0, z: 0, duration: 1 }, 4)
      .to(meshRef.current.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 4)
      .to(materialRef.current, { color: new THREE.Color("#1A1A1A"), distort: 0.4, speed: 2, duration: 1 }, 4);

    return () => {
      tl.kill();
    };
  }, []);

  // Parallax effect with mouse
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Baseline slow rotation
      meshRef.current.rotation.x += delta * 0.05;
      meshRef.current.rotation.y += delta * 0.1;
      
      // Target rotation based on mouse position for parallax
      // state.pointer.x and y are normalized between -1 and 1
      const targetX = (state.pointer.y * Math.PI) / 6;
      const targetY = (state.pointer.x * Math.PI) / 6;
      
      // Additive rotation for the interactive feel
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, meshRef.current.rotation.x + targetX, 0.02);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, meshRef.current.rotation.y + targetY, 0.02);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1.5, 64]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#1A1A1A"
          roughness={0.2}
          metalness={0.8}
          distort={0.2}
          speed={1}
        />
      </Icosahedron>
    </Float>
  );
}

export default function CanvasContainer() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#E8C56A" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
        </Suspense>
      </Canvas>
    </div>
  );
}
