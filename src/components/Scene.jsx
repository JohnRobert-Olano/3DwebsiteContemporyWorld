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

  /* ──────────────────────────────────────────────────────────
     Ping-Pong motion profile
     Even sections → Earth LEFT   (position.x = -travelX)
     Odd  sections → Earth RIGHT  (position.x = +travelX)
     ────────────────────────────────────────────────────────── */
  const motionProfile = useMemo(() => {
    const isNarrow = viewport.width < 5.6;
    const travelX = isNarrow
      ? THREE.MathUtils.clamp(viewport.width * 0.35, 1.15, 1.75)
      : THREE.MathUtils.clamp(viewport.width * 0.43, 2.2, 3.0);

    return {
      leftX: -travelX,
      rightX: travelX,
      baseScale: isNarrow ? 1.18 : 1.58,
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

  /* ──────────────────────────────────────────────────────────
     useFrame — CONTINUOUS Y-AXIS ROTATION
     Completely decoupled from ScrollTrigger.
     Runs every frame regardless of scroll state.
     ────────────────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────────────────
     ScrollTrigger → Ping-Pong X-Position
     NO scrub. NO pin. Callback-driven gsap.to() timelines.
     Each section trigger fires a rapid 0.8s position tween.
     ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const { leftX, rightX, baseScale } = motionProfile;

    // Initialize: center position
    stage.position.set(0, 0, 0);
    stage.scale.set(baseScale, baseScale, baseScale);

    const panels = gsap.utils.toArray('.panel-section');
    const triggers = [];

    panels.forEach((panel, i) => {
      // Even sections (0,2,4): Earth goes LEFT
      // Odd  sections (1,3):   Earth goes RIGHT
      const targetX = i % 2 === 0 ? leftX : rightX;

      const trigger = ScrollTrigger.create({
        trigger: panel,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          gsap.to(stage.position, {
            x: targetX,
            y: 0,
            z: 0.2,
            duration: 0.8,
            ease: 'power3.inOut',
            overwrite: true,
          });
        },
        onEnterBack: () => {
          gsap.to(stage.position, {
            x: targetX,
            y: 0,
            z: 0.2,
            duration: 0.8,
            ease: 'power3.inOut',
            overwrite: true,
          });
        },
        onLeave: () => {
          // If leaving the last panel, return to center
          if (i === panels.length - 1) {
            gsap.to(stage.position, {
              x: 0,
              y: 0,
              z: 0,
              duration: 0.8,
              ease: 'power3.inOut',
              overwrite: true,
            });
          }
        },
        onLeaveBack: () => {
          // If scrolling back above the first panel, return to center
          if (i === 0) {
            gsap.to(stage.position, {
              x: 0,
              y: 0,
              z: 0,
              duration: 0.8,
              ease: 'power3.inOut',
              overwrite: true,
            });
          }
        },
      });

      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
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
