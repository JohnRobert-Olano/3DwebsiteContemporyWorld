import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  const { viewport } = useThree();
  const earthRef = useRef();
  const cloudsRef = useRef();
  const haloRef = useRef();
  const stageRef = useRef();
  const tiltRef = useRef();
  const spinRef = useRef();
  const motionRef = useRef({
    spinBoost: 0,
  });
  const dragRef = useRef({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });
  const motionProfile = useMemo(() => {
    const isNarrow = viewport.width < 5.6;
    const travelX = isNarrow
      ? THREE.MathUtils.clamp(viewport.width * 0.35, 1.15, 1.75)
      : THREE.MathUtils.clamp(viewport.width * 0.43, 3.45, 4.15);

    return {
      leftX: -travelX,
      rightX: travelX,
      baseZ: isNarrow ? -0.25 : 0.05,
      peakZ: isNarrow ? 0.1 : 0.45,
      baseScale: isNarrow ? 1.18 : 1.58,
      peakScale: isNarrow ? 1.32 : 1.72,
    };
  }, [viewport.width]);

  // High-Resolution Textures
  const [dayMap, cloudsMap, specularMap, topologyMap] = useTexture([
    '/earth_day.jpg',
    '/earth_clouds.png',
    '/earth_specular.jpg',
    '/earth_topology.png'
  ]);

  useEffect(() => {
    [dayMap, cloudsMap, topologyMap].forEach((texture) => {
      if (texture) {
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
    const drag = dragRef.current;
    motion.spinBoost = THREE.MathUtils.damp(motion.spinBoost, 0, 2.5, delta);

    if (tiltRef.current) {
      // Locked 23.5° axial tilt
      tiltRef.current.rotation.z = 0.41;

      tiltRef.current.rotation.x = THREE.MathUtils.damp(tiltRef.current.rotation.x, 0, 5, delta);
      tiltRef.current.rotation.y = THREE.MathUtils.damp(tiltRef.current.rotation.y, 0, 5, delta);
    }

    if (spinRef.current) {
      if (!drag.active) {
        spinRef.current.rotation.y += delta * (0.02 + motion.spinBoost);
      }
      if (!drag.active) {
        spinRef.current.rotation.x = THREE.MathUtils.damp(
          spinRef.current.rotation.x,
          Math.sin(elapsed * 0.55) * 0.035,
          1.6,
          delta
        );
      }
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.08;
    }

  });

  const updateHoverPosition = (e) => {
    if (earthRef.current && e.point) {
      earthMaterial.uniforms.hoverPosition.value.copy(e.point);
    }
  };

  // Track the cursor hit on the 3D mesh
  const handlePointerMove = (e) => {
    updateHoverPosition(e);

    const drag = dragRef.current;
    if (drag.active && spinRef.current) {
      e.stopPropagation();

      const dx = e.nativeEvent.clientX - drag.lastX;
      const dy = e.nativeEvent.clientY - drag.lastY;
      drag.lastX = e.nativeEvent.clientX;
      drag.lastY = e.nativeEvent.clientY;

      spinRef.current.rotation.y += dx * 0.01;
      spinRef.current.rotation.x += dy * 0.01;
    } else {
      motionRef.current.spinBoost = Math.max(motionRef.current.spinBoost, 0.12);
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    updateHoverPosition(e);

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      lastX: e.nativeEvent.clientX,
      lastY: e.nativeEvent.clientY,
    };

    if (e.target?.setPointerCapture && e.pointerId !== undefined) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const stopDragging = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    e.stopPropagation();
    if (e.target?.releasePointerCapture && drag.pointerId !== null) {
      e.target.releasePointerCapture(drag.pointerId);
    }

    dragRef.current = {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
    };
  };

  const handlePointerOut = () => {
    if (earthRef.current && !dragRef.current.active) {
      earthMaterial.uniforms.hoverPosition.value.set(0, 0, 1000);
    }
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const panels = gsap.utils.toArray('.panel-section');
    const sweeps = Math.max(panels.length, 1);

    // How many full left↔right sweeps across the total scroll.
    // Each section gets one half-sweep so the globe alternates sides per section.
    const steadyY = 0.0;
    const {
      leftX,
      rightX,
      baseZ,
      peakZ,
      baseScale,
      peakScale,
    } = motionProfile;

    // Continuous triangle-wave: maps 0→1 progress to a value that
    // oscillates 0→1→0→1… exactly `sweeps` half-cycles.
    // This is mathematically continuous everywhere (no floor/ceil jumps).
    const triangleWave = (progress) => {
      // Sawtooth: goes 0→sweeps linearly
      const sawtooth = progress * sweeps;
      // Triangle wave from sawtooth: folds at each integer
      // Formula: 1 - |2*(sawtooth mod 1) - 1|  but shifted so cycle 0 starts going right
      // Simpler: use acos(cos()) which is a perfect triangle wave
      const t = sawtooth * Math.PI; // half-period = 1 section
      return Math.acos(Math.cos(t)) / Math.PI; // normalized 0→1→0→1…
    };

    const easeInOut = gsap.parseEase("sine.inOut");

    const setGlobeForProgress = (progress, velocity = 0) => {
      // Clamp progress to avoid any overshoot
      const p = Math.max(0, Math.min(1, progress));

      // Continuous ping-pong horizontal position
      const rawPingPong = triangleWave(p);
      const easedPP = easeInOut(rawPingPong);

      // Center proximity: 0 at edges, 1 at center of each sweep
      // Uses sine of the ping-pong to create a smooth bulge
      const centerFactor = Math.sin(rawPingPong * Math.PI);

      // Position
      stage.position.set(
        THREE.MathUtils.lerp(leftX, rightX, easedPP),
        steadyY,
        THREE.MathUtils.lerp(baseZ, peakZ, centerFactor)
      );

      // Rotation: continuous Y rotation accumulates with scroll so globe
      // always turns in one direction (never snaps back)
      stage.rotation.set(
        THREE.MathUtils.lerp(0.1, 0.16, centerFactor),
        Math.PI * 0.45 + p * Math.PI * sweeps * 0.75,
        0
      );

      // Scale: slightly larger when centered
      const scale = THREE.MathUtils.lerp(baseScale, peakScale, centerFactor);
      stage.scale.set(scale, scale, scale);

      // Scroll-velocity spin boost
      motionRef.current.spinBoost = Math.max(
        motionRef.current.spinBoost,
        Math.min(Math.abs(velocity) / 1400, 2.2)
      );
    };

    // Initialize at scroll top
    setGlobeForProgress(0);

    const sectionMotion = ScrollTrigger.create({
      trigger: ".main-scroller",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setGlobeForProgress(self.progress, self.getVelocity()),
      onRefresh: (self) => setGlobeForProgress(self.progress, 0),
    });

    return () => {
      sectionMotion.kill();
    };
  }, [motionProfile]);

  return (
    <group ref={stageRef}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          {/* High-Poly Earth with Shader & Raycast tracking */}
          <mesh
            ref={earthRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
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
    <div className="fixed inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing" style={{ touchAction: 'pan-y' }}>
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
