import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useTexture, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const haloRef = useRef();
  const groupRef = useRef();

  // Load the 3 downloaded textures
  const [dayMap, nightMap, cloudsMap] = useTexture([
    '/earth_day.jpg',
    '/earth_night.jpg',
    '/earth_clouds.png'
  ]);

  // Fresnel Atmosphere Material (Blue/Gold Halo)
  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.3 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color("#4A90E2") }, // Blueish tint for the Earth's atmosphere
        viewVector: { value: new THREE.Vector3(0, 0, 5) }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, intensity );
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07; // Clouds rotate faster
    
    if (haloRef.current) {
      haloRef.current.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        state.camera.position, 
        haloRef.current.getWorldPosition(new THREE.Vector3())
      );
    }
    
    // Smooth Parallax via Mouse
    const targetX = (state.pointer.y * Math.PI) / 10;
    const targetY = (state.pointer.x * Math.PI) / 10;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
  });

  useEffect(() => {
    // 3D Master Timeline attached to the main scroller
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".main-scroller",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Premium weight
      }
    });

    // Sec 1: Westphalia & Sovereignty (Earth zooms in on Europe)
    tl.to(groupRef.current.position, { z: 2.5, duration: 1 }, 0)
      .to(groupRef.current.rotation, { x: 0.6, y: -0.5, duration: 1 }, 0)
    
    // Sec 2: Pillars of Governance (Earth rotates to show global connections, shifts right)
      .to(groupRef.current.rotation, { y: Math.PI / 2, duration: 1 }, 1)
      .to(groupRef.current.position, { x: 2, z: 1, duration: 1 }, 1)
    
    // Sec 3: The North-South Divide (Earth tilts to show the hemispheres)
      .to(groupRef.current.rotation, { x: 1.5, y: Math.PI, duration: 1 }, 2)
      .to(groupRef.current.position, { x: -2, duration: 1 }, 2)
    
    // Sec 4: Contemporary Issues (Earth becomes darkened/glitchy)
      .to(groupRef.current.rotation, { x: -0.5, y: Math.PI * 1.5, duration: 1 }, 3)
      .to(groupRef.current.position, { x: 0, z: 3.5, duration: 1 }, 3)
      .to(earthRef.current.material.color, { r: 0.2, g: 0.2, b: 0.2, duration: 1 }, 3) // Darken
    
    // Sec 5: Timeline 1945–Present (Earth rotates linearly, moves left)
      .to(groupRef.current.position, { x: -2, z: 0, duration: 1 }, 4)
      .to(groupRef.current.rotation, { y: Math.PI * 2.5, duration: 1 }, 4)
      .to(earthRef.current.material.color, { r: 1, g: 1, b: 1, duration: 1 }, 4) // Restore color
    
    // Sec 6: Learning Hooks (Earth zooms out to full view)
      .to(groupRef.current.position, { x: 0, y: 0, z: 0, duration: 1 }, 5)
      .to(groupRef.current.rotation, { x: 0, y: 0, duration: 1 }, 5);

    return () => tl.kill();
  }, []);

  return (
    <group ref={groupRef}>
      {/* Base Earth Day */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={dayMap} 
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      
      {/* Night Lights (Additive Blend overlay) */}
      <mesh>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshBasicMaterial 
          map={nightMap} 
          blending={THREE.AdditiveBlending} 
          transparent={true} 
          opacity={0.4} 
          depthWrite={false}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 64, 64]} />
        <meshStandardMaterial 
          map={cloudsMap} 
          transparent={true} 
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Glow / Fresnel */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[2.3, 64, 64]} />
        <primitive object={haloMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export default function Scene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Earth />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 5, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -5, -5]} intensity={0.3} color="#E8C56A" />
        </Suspense>
      </Canvas>
    </div>
  );
}
