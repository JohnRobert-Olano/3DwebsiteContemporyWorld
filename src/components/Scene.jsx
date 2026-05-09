import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useTexture, Stars } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// Custom Earth Shader for Photorealistic Day/Night & Interactive Flashlight
const earthVertexShader = `
  uniform sampler2D topologyMap;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    // Displacement Mapping: use real-world GIS data
    float elevation = texture2D(topologyMap, vUv).r;
    vec3 displacedPosition = position + normal * (elevation * 0.08);

    vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D specularMap;
  uniform vec3 hoverPosition;
  uniform float hoverRadius;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

    vec4 dayTex = texture2D(dayMap, vUv);
    float waterMask = texture2D(specularMap, vUv).r;

    // Fully illuminated base palette
    vec3 dayColor = pow(dayTex.rgb, vec3(0.8)) * 1.38;
    float oceanColor = smoothstep(0.12, 0.55, dayTex.b - max(dayTex.r, dayTex.g) * 0.35);
    float warmLand = smoothstep(0.04, 0.28, dayTex.r - dayTex.b);
    float cloudWhite = smoothstep(0.48, 0.88, max(max(dayTex.r, dayTex.g), dayTex.b));

    // Deep water color #054598 / #04356A mapping
    dayColor = mix(dayColor, vec3(0.02, 0.21, 0.42), oceanColor * 0.7);
    dayColor = mix(dayColor, dayColor * vec3(1.16, 1.06, 0.88), warmLand * 0.35);
    dayColor = mix(dayColor, vec3(1.0), cloudWhite * 0.18);

    // Luminous Magnifier (Interactive Feature)
    float dist = distance(vWorldPosition, hoverPosition);
    float hoverFactor = 1.0 - smoothstep(0.0, hoverRadius, dist); // smoothstep blur

    // Spotlight effect: increase brightness & saturation
    vec3 highlightColor = dayColor * 1.8;
    float luma = dot(highlightColor, vec3(0.299, 0.587, 0.114));
    vec3 saturatedColor = mix(vec3(luma), highlightColor, 1.4);
    
    vec3 baseColor = mix(dayColor, saturatedColor, hoverFactor);

    // Atmosphere & Rim
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.35);
    vec3 atmosphere = vec3(0.04, 0.43, 0.83) * rim * 0.45;

    gl_FragColor = vec4(baseColor + atmosphere, 1.0);
  }
`;

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const haloRef = useRef();
  const stageRef = useRef();
  const tiltRef = useRef();
  const spinRef = useRef();
  const motionRef = useRef({
    spinBoost: 0,
  });

  // High-Resolution Textures
  const [dayMap, cloudsMap, specularMap, topologyMap] = useTexture([
    '/earth_day.jpg',
    '/earth_clouds.png',
    '/earth_specular.jpg',
    '/earth_topology.png'
  ]);

  useEffect(() => {
    [dayMap, cloudsMap, topologyMap].forEach((texture) => {
      if(texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.needsUpdate = true;
      }
    });
  }, [dayMap, cloudsMap, topologyMap]);

  // Front-left sunlight gives the globe the same bright satellite-render angle
  // as the reference while leaving a soft night edge on the far side.
  const sunDirection = useMemo(() => new THREE.Vector3(-0.46, 0.28, 0.84).normalize(), []);

  // Custom Shader Material for Earth
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        specularMap: { value: specularMap },
        topologyMap: { value: topologyMap },
        hoverPosition: { value: new THREE.Vector3(0, 0, 1000) }, // Hidden initially
        hoverRadius: { value: 0.6 } // Size of magnifier
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
  }, [dayMap, specularMap, topologyMap]);

  // Atmospheric Glow Shader
  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.15 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color("#4A90E2") },
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying float intensity;
        varying vec3 vNormal;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vec3 viewDirection = normalize(cameraPosition - worldPos.xyz);
          intensity = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 4.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 finalColor = glowColor;
          gl_FragColor = vec4(finalColor, intensity * 0.34);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, [sunDirection]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const motion = motionRef.current;
    motion.spinBoost = THREE.MathUtils.damp(motion.spinBoost, 0, 2.5, delta);

    if (tiltRef.current) {
      // Locked 23.5° axial tilt
      tiltRef.current.rotation.z = 0.41;
      
      const targetX = state.pointer.y * 0.1;
      const targetY = state.pointer.x * 0.1;

      tiltRef.current.rotation.x = THREE.MathUtils.damp(tiltRef.current.rotation.x, targetX, 5, delta);
      tiltRef.current.rotation.y = THREE.MathUtils.damp(tiltRef.current.rotation.y, targetY, 5, delta);
    }

    if (spinRef.current) {
      // Extremely slow baseline rotation so we don't drift away from targeted regions
      spinRef.current.rotation.y += delta * (0.02 + motion.spinBoost);
      spinRef.current.rotation.x = Math.sin(elapsed * 0.55) * 0.035;
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.08;
    }

  });

  // Track the cursor hit on the 3D mesh
  const handlePointerMove = (e) => {
    if (earthRef.current) {
      earthMaterial.uniforms.hoverPosition.value.copy(e.point);
      motionRef.current.spinBoost = Math.max(motionRef.current.spinBoost, 0.12);
    }
  };

  const handlePointerOut = () => {
    if (earthRef.current) {
      earthMaterial.uniforms.hoverPosition.value.set(0, 0, 1000);
    }
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    gsap.set(stage.position, { x: 2.2, y: 0, z: 0.8 });
    gsap.set(stage.rotation, { x: 0.2, y: Math.PI * 0.7, z: 0 });
    gsap.set(stage.scale, { x: 1.6, y: 1.6, z: 1.6 });
    if (spinRef.current) {
      gsap.set(spinRef.current.rotation, { y: 0 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".main-scroller",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        onUpdate: (self) => {
          const scrollVelocity = Math.abs(self.getVelocity());
          motionRef.current.spinBoost = Math.max(
            motionRef.current.spinBoost,
            Math.min(scrollVelocity / 1400, 2.2)
          );
        },
      }
    });

    // Sec 1 -> Sec 2: Economy (SE Asia & Taiwan)
    tl.to(stage.position, { x: 2.0, y: 0.3, z: 1.0, duration: 1 }, 0)
      .to(stage.rotation, { x: 0.1, y: Math.PI * 0.85, z: 0, duration: 1 }, 0)
      .to(stage.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 1 }, 0)

    // Sec 2 -> Sec 3: Environment (Pacific Ocean / Island regions)
    tl.to(stage.position, { x: 2.5, y: -0.2, z: 1.5, duration: 1 }, 1)
      .to(stage.rotation, { x: 0.0, y: Math.PI * 1.2, z: 0, duration: 1 }, 1)
      .to(stage.scale, { x: 1.9, y: 1.9, z: 1.9, duration: 1 }, 1)

    // Sec 3 -> Sec 4: Politics (Western Europe & North America)
    tl.to(stage.position, { x: 2.2, y: -0.4, z: 0.8, duration: 1 }, 2)
      .to(stage.rotation, { x: 0.3, y: Math.PI * 1.9, z: 0, duration: 1 }, 2)
      .to(stage.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 2)

    // Sec 4 -> Sec 5: Technology (Full global view)
    tl.to(stage.position, { x: 1.8, y: 0, z: 0, duration: 1 }, 3)
      .to(stage.rotation, { x: 0.1, y: Math.PI * 2.5, z: 0, duration: 1 }, 3)
      .to(stage.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1 }, 3);

    return () => tl.kill();
  }, []);

  return (
    <group ref={stageRef}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
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
              color="#ffffff"
              transparent={true}
              opacity={0.72}
              emissive="#ffffff"
              emissiveIntensity={0.16}
              depthWrite={false}
            />
          </mesh>

          {/* Atmospheric Glow */}
          <mesh ref={haloRef} pointerEvents="none">
            <sphereGeometry args={[2.04, 128, 128]} />
            <primitive object={haloMaterial} attach="material" />
          </mesh>
        </group>
      </group>
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
          
          {/* Front-left sunlight for the bright satellite-render look. */}
          <directionalLight position={[-5, 3, 8]} intensity={2.6} color="#ffffff" />
          
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
}
