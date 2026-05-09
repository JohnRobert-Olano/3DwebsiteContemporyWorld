import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useTexture, Stars } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// Custom Earth Shader for Photorealistic Day/Night & Interactive Flashlight
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    // Calculate normal in world space to compare with sun direction
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate world position of the vertex for cursor distance tracking
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  uniform vec3 hoverPosition;
  uniform float hoverRadius;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    // 1. Sun Lighting (Hard Terminator Line for 50/50 split)
    vec3 normal = normalize(vNormal);
    float sunLight = dot(normal, normalize(sunDirection));
    
    // Sharp transition between day and night
    float dayFactor = smoothstep(-0.02, 0.02, sunLight);

    // 2. Interactive Flashlight (Cursor Tracking)
    float dist = distance(vWorldPosition, hoverPosition);
    // Creates a sharp spot that fades slightly at the very edge
    float hoverFactor = 1.0 - smoothstep(hoverRadius * 0.8, hoverRadius, dist);

    // 3. Final Day logic (It is daytime IF the sun hits it OR the user hovers)
    float finalDayFactor = clamp(dayFactor + hoverFactor, 0.0, 1.0);

    // Sample the high-res textures
    vec4 dayTex = texture2D(dayMap, vUv);
    vec4 nightTex = texture2D(nightMap, vUv);

    // 4. Base Texture (Black on night side, brilliant day texture on lit/hovered side)
    vec3 baseColor = mix(vec3(0.0), dayTex.rgb, finalDayFactor);

    // 5. Night Emissive (City lights ONLY show where it's purely night and NOT hovered)
    // Tinting slightly orange/yellow for warmth as requested
    vec3 cityLights = nightTex.rgb * vec3(1.0, 0.8, 0.5) * (1.0 - finalDayFactor) * 2.0;

    gl_FragColor = vec4(baseColor + cityLights, 1.0);
  }
`;

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const haloRef = useRef();
  const groupRef = useRef();

  // High-Resolution Textures
  const [dayMap, nightMap, cloudsMap] = useTexture([
    '/earth_day.jpg',
    '/earth_night.jpg',
    '/earth_clouds.png'
  ]);

  // 90-degree Side Angle Sun
  const sunDirection = useMemo(() => new THREE.Vector3(1, 0, 0).normalize(), []);

  // Custom Shader Material for Earth
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        sunDirection: { value: sunDirection },
        hoverPosition: { value: new THREE.Vector3(0, 0, 1000) }, // Hidden initially
        hoverRadius: { value: 0.25 } // Size of a metropolitan area
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
  }, [dayMap, nightMap, sunDirection]);

  // Atmospheric Glow Shader
  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.15 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color("#4A90E2") },
        viewVector: { value: new THREE.Vector3(0, 0, 5) },
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.35 - dot(vNormal, vNormel), 4.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 sunDirection;
        varying float intensity;
        varying vec3 vNormal;
        void main() {
          // Fade glow on the night side to a dark shadow outline
          float sunLight = dot(vNormal, normalize(sunDirection));
          float dayFactor = smoothstep(-0.2, 0.2, sunLight);
          
          vec3 finalColor = mix(vec3(0.0), glowColor, dayFactor);
          gl_FragColor = vec4(finalColor, intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, [sunDirection]);

  useFrame((state, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.02;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.035; // Clouds drift slightly faster
    
    // Update view vector for atmosphere
    if (haloRef.current) {
      haloRef.current.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        state.camera.position, 
        haloRef.current.getWorldPosition(new THREE.Vector3())
      );
    }
  });

  // Track the cursor hit on the 3D mesh
  const handlePointerMove = (e) => {
    if (earthRef.current) {
      earthMaterial.uniforms.hoverPosition.value.copy(e.point);
    }
  };

  const handlePointerOut = () => {
    if (earthRef.current) {
      earthMaterial.uniforms.hoverPosition.value.set(0, 0, 1000);
    }
  };

  useEffect(() => {
    gsap.set(groupRef.current.position, { z: -15, y: -2 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".main-scroller",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    });

    // Sec 1 -> Sec 2: Zoom in on Northern Hemisphere
    tl.to(groupRef.current.position, { z: 1.5, y: -1, duration: 1 }, 0)
      .to(groupRef.current.rotation, { x: 0.6, duration: 1 }, 0)
    
    // Sec 2 -> Sec 3: Tilt to show the South
      .to(groupRef.current.rotation, { x: -0.8, y: Math.PI, duration: 1 }, 1)
      .to(groupRef.current.position, { y: 1.5, duration: 1 }, 1)
    
    // Sec 3 -> Sec 4: High-speed rotation
      .to(groupRef.current.rotation, { x: 0, y: "+=" + (Math.PI * 6), duration: 1 }, 2)
      .to(groupRef.current.position, { z: 3, y: 0, duration: 1 }, 2)
    
    // Sec 4 -> Sec 5: Steady rotation, shifted left
      .to(groupRef.current.position, { x: -2, z: 0, duration: 1 }, 3)
      .to(groupRef.current.rotation, { y: "+=" + (Math.PI * 2), duration: 1 }, 3)
    
    // Sec 5 -> Sec 6: Zoom out
      .to(groupRef.current.position, { x: 0, y: 0, z: -2, duration: 1 }, 4)
      .to(groupRef.current.rotation, { x: 0, duration: 1 }, 4);

    return () => tl.kill();
  }, []);

  return (
    <group ref={groupRef}>
      {/* High-Poly Earth with Shader & Raycast tracking */}
      <mesh 
        ref={earthRef} 
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[2, 256, 256]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>

      {/* Cloud Layer (Standard material catches the directional light automatically!) */}
      <mesh ref={cloudsRef} pointerEvents="none">
        <sphereGeometry args={[2.015, 128, 128]} />
        <meshStandardMaterial 
          map={cloudsMap} 
          transparent={true} 
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Glow */}
      <mesh ref={haloRef} pointerEvents="none">
        <sphereGeometry args={[2.1, 128, 128]} />
        <primitive object={haloMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export default function Scene() {
  return (
    // Set to pointer-events-auto so we can interact with the Earth!
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Deep Space Environment */}
          <Stars radius={100} depth={50} count={10000} factor={4} saturation={0} fade speed={1} />
          
          {/* A single, powerful 90-degree Directional Light to act as the Sun.
              X=10, Y=0, Z=0 ensures it lights exactly half the sphere horizontally.
              This affects the clouds seamlessly, while the custom shader handles the surface. */}
          <directionalLight position={[10, 0, 0]} intensity={3} color="#ffffff" />
          
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
}
