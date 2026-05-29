import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Three.js airplane that flies the shipping route. Rendered into a transparent,
// always-mounted r3f canvas overlaid on the delivery map (pointer-events: none so
// it never blocks the map or the modal close). Lazy-loaded by the delivery game
// so three only ships when this cover is opened. Used ONLY here.
const DURATION_MS = 1700;

// Low-poly top-down airliner built from primitives - no external model asset.
function PlaneModel() {
  return (
    <group>
      {/* fuselage */}
      <mesh>
        <boxGeometry args={[2, 0.34, 0.4]} />
        <meshStandardMaterial color="#f5f9ff" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* nose cone (points +x) */}
      <mesh position={[1.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.19, 0.55, 18]} />
        <meshStandardMaterial color="#f5f9ff" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* main wings */}
      <mesh>
        <boxGeometry args={[0.66, 2.3, 0.1]} />
        <meshStandardMaterial color="#2b86d9" roughness={0.45} />
      </mesh>
      {/* tailplane */}
      <mesh position={[-0.82, 0, 0]}>
        <boxGeometry args={[0.42, 1.05, 0.08]} />
        <meshStandardMaterial color="#2b86d9" roughness={0.45} />
      </mesh>
      {/* vertical stabilizer */}
      <mesh position={[-0.9, 0, 0.24]}>
        <boxGeometry args={[0.42, 0.08, 0.52]} />
        <meshStandardMaterial color="#ef5b43" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Plane({ from, to, routeKey, shipping, reducedMotion }) {
  const ref = useRef(null);
  const startRef = useRef(null);

  // Restart the flight whenever a new shipment begins.
  useEffect(() => {
    startRef.current = null;
  }, [routeKey]);

  useFrame((state) => {
    const group = ref.current;
    if (!group) return;

    const { width, height } = state.size;
    // percent (y down) -> orthographic world pixels (origin centered, y up)
    const fx = (from.x / 100) * width - width / 2;
    const fy = height / 2 - (from.y / 100) * height;
    const tx = (to.x / 100) * width - width / 2;
    const ty = height / 2 - (to.y / 100) * height;

    group.scale.setScalar(Math.min(width, height) * 0.03);
    group.rotation.z = Math.atan2(ty - fy, tx - fx); // nose toward destination

    if (!shipping) {
      group.visible = false;
      return;
    }
    group.visible = true;

    if (reducedMotion) {
      group.position.set(tx, ty, 0);
      return;
    }

    if (startRef.current == null) startRef.current = state.clock.elapsedTime;
    const t = Math.min(1, ((state.clock.elapsedTime - startRef.current) * 1000) / DURATION_MS);
    group.position.set(fx + (tx - fx) * t, fy + (ty - fy) * t, 0);
  });

  return (
    <group ref={ref} visible={false}>
      <PlaneModel />
    </group>
  );
}

export default function DeliveryPlane({ from, to, phase, routeKey, reducedMotion }) {
  const shipping = phase === 'shipping';

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 100], near: 0.1, far: 1000, zoom: 1 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 6, 8]} intensity={1.15} />
      <Plane
        from={from}
        to={to}
        routeKey={routeKey}
        shipping={shipping}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
