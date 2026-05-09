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
    // Calculate normal in world space to compare with sun direction.
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    // Calculate world position of the vertex for cursor distance tracking
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;
  uniform vec3 hoverPosition;
  uniform float hoverRadius;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float sunLight = dot(normal, normalize(sunDirection));

    // Soft, photographic day/night falloff like satellite Earth renders.
    float dayFactor = smoothstep(-0.5, 0.18, sunLight);
    float duskFactor = smoothstep(-0.45, 0.18, sunLight);

    // 2. Interactive Flashlight (Cursor Tracking)
    float dist = distance(vWorldPosition, hoverPosition);
    // Creates a sharp spot that fades slightly at the very edge
    float hoverFactor = 1.0 - smoothstep(hoverRadius * 0.8, hoverRadius, dist);

    // 3. Final Day logic (It is daytime IF the sun hits it OR the user hovers)
    float finalDayFactor = clamp(dayFactor + hoverFactor, 0.0, 1.0);

    // Sample the high-res textures
    vec4 dayTex = texture2D(dayMap, vUv);
    vec4 nightTex = texture2D(nightMap, vUv);
    float waterMask = texture2D(specularMap, vUv).r;

    // Brighten the satellite texture and push the palette toward the reference:
    // deep blue oceans, warmer deserts, richer greens, and clean white clouds.
    vec3 dayColor = pow(dayTex.rgb, vec3(0.8)) * 1.38;
    float oceanColor = smoothstep(0.12, 0.55, dayTex.b - max(dayTex.r, dayTex.g) * 0.35);
    float warmLand = smoothstep(0.04, 0.28, dayTex.r - dayTex.b);
    float cloudWhite = smoothstep(0.48, 0.88, max(max(dayTex.r, dayTex.g), dayTex.b));

    dayColor = mix(dayColor, dayColor * vec3(0.8, 1.02, 1.5) + vec3(0.01, 0.04, 0.12), oceanColor * 0.48);
    dayColor = mix(dayColor, dayColor * vec3(1.16, 1.06, 0.88), warmLand * 0.35);
    dayColor = mix(dayColor, vec3(1.0), cloudWhite * 0.18);

    vec3 nightSurface = dayColor * vec3(0.07, 0.12, 0.24);
    vec3 cityLights = nightTex.rgb * vec3(1.0, 0.72, 0.42) * (1.0 - finalDayFactor) * 1.35;
    vec3 baseColor = mix(nightSurface + cityLights, dayColor, finalDayFactor);

    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.35);
    vec3 atmosphere = vec3(0.08, 0.42, 1.0) * rim * (0.18 + duskFactor * 0.42);
    vec3 oceanGlint = vec3(0.18, 0.44, 0.9) * waterMask * pow(max(sunLight, 0.0), 2.0) * 0.18;

    gl_FragColor = vec4(baseColor + atmosphere + oceanGlint, 1.0);
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
  const [dayMap, nightMap, cloudsMap, specularMap] = useTexture([
    '/earth_day.jpg',
    '/earth_night.jpg',
    '/earth_clouds.png',
    '/earth_specular.jpg'
  ]);

  useEffect(() => {
    [dayMap, nightMap, cloudsMap].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
  }, [dayMap, nightMap, cloudsMap]);

  // Front-left sunlight gives the globe the same bright satellite-render angle
  // as the reference while leaving a soft night edge on the far side.
  const sunDirection = useMemo(() => new THREE.Vector3(-0.46, 0.28, 0.84).normalize(), []);

  // Custom Shader Material for Earth
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        specularMap: { value: specularMap },
        sunDirection: { value: sunDirection },
        hoverPosition: { value: new THREE.Vector3(0, 0, 1000) }, // Hidden initially
        hoverRadius: { value: 0.32 } // Size of a metropolitan area
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
  }, [dayMap, nightMap, specularMap, sunDirection]);

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
        uniform vec3 sunDirection;
        varying float intensity;
        varying vec3 vNormal;
        void main() {
          float sunLight = dot(normalize(vNormal), normalize(sunDirection));
          float dayFactor = smoothstep(-0.35, 0.25, sunLight);

          vec3 finalColor = mix(vec3(0.0, 0.08, 0.42), glowColor, dayFactor);
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
      const targetX = state.pointer.y * 0.26;
      const targetY = state.pointer.x * 0.44;
      const targetZ = state.pointer.x * -0.08;
      const targetOffsetX = state.pointer.x * 0.12;
      const targetOffsetY = state.pointer.y * 0.08 + Math.sin(elapsed * 1.15) * 0.05;

      tiltRef.current.rotation.x = THREE.MathUtils.damp(tiltRef.current.rotation.x, targetX, 5, delta);
      tiltRef.current.rotation.y = THREE.MathUtils.damp(tiltRef.current.rotation.y, targetY, 5, delta);
      tiltRef.current.rotation.z = THREE.MathUtils.damp(tiltRef.current.rotation.z, targetZ, 4, delta);
      tiltRef.current.position.x = THREE.MathUtils.damp(tiltRef.current.position.x, targetOffsetX, 5, delta);
      tiltRef.current.position.y = THREE.MathUtils.damp(tiltRef.current.position.y, targetOffsetY, 5, delta);
    }

    if (spinRef.current) {
      spinRef.current.rotation.y += delta * (0.24 + motion.spinBoost);
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

    gsap.set(stage.position, { x: 0, y: -0.2, z: 0.8 });
    gsap.set(stage.rotation, { x: -0.12, y: -0.4, z: 0 });
    gsap.set(stage.scale, { x: 1.18, y: 1.18, z: 1.18 });
    if (spinRef.current) {
      gsap.set(spinRef.current.rotation, { y: 1.65 });
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

    // Product-showcase style movement: the globe stays hero-sized while each section
    // gives it a quick turntable shift, similar to the basketball site's center object.
    tl.to(stage.position, { x: 1.25, y: -0.08, z: 1.25, duration: 1 }, 0)
      .to(stage.rotation, { x: 0.28, y: Math.PI * 0.55, z: -0.08, duration: 1 }, 0)
      .to(stage.scale, { x: 1.32, y: 1.32, z: 1.32, duration: 1 }, 0)

      .to(stage.position, { x: -1.15, y: 0.18, z: 1.05, duration: 1 }, 1)
      .to(stage.rotation, { x: -0.42, y: Math.PI * 1.25, z: 0.1, duration: 1 }, 1)
      .to(stage.scale, { x: 1.28, y: 1.28, z: 1.28, duration: 1 }, 1)

      .to(stage.position, { x: 0.05, y: 0.02, z: 1.85, duration: 1 }, 2)
      .to(stage.rotation, { x: 0.05, y: Math.PI * 2.45, z: 0, duration: 1 }, 2)
      .to(stage.scale, { x: 1.48, y: 1.48, z: 1.48, duration: 1 }, 2)

      .to(stage.position, { x: -1.7, y: -0.05, z: 1.15, duration: 1 }, 3)
      .to(stage.rotation, { x: 0.18, y: Math.PI * 3.2, z: 0.12, duration: 1 }, 3)
      .to(stage.scale, { x: 1.28, y: 1.28, z: 1.28, duration: 1 }, 3)

      .to(stage.position, { x: 0, y: -0.15, z: 0.45, duration: 1 }, 4)
      .to(stage.rotation, { x: -0.1, y: Math.PI * 4.05, z: 0, duration: 1 }, 4)
      .to(stage.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 1 }, 4);

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
