import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { routeControlPoint, bezierPoint, bezierTangent } from '../../lib/games/route';

// Three.js airliner that flies the curved shipping route. Rendered into a
// transparent, always-mounted r3f canvas overlaid on the delivery map
// (pointer-events:none so it never blocks the map or the modal close). Lazy-
// loaded by the delivery game so three only ships when this cover is opened.
//
// The plane is a cohesive procedural mesh (lathed fuselage + extruded swept
// wings/tail/fin) - no box/cone primitives form the silhouette, and no external
// model asset. Nose points +X; wings span Y; the fin rises +Z toward the camera.

// Swept, symmetric wing planform (chord on X, span on Y), extruded thin on Z.
function wingShape(span, leadRoot, leadTip, trailTip, trailRoot) {
  const s = new THREE.Shape();
  s.moveTo(leadRoot, 0);
  s.lineTo(leadTip, span);
  s.lineTo(trailTip, span);
  s.lineTo(trailRoot, 0);
  s.lineTo(trailTip, -span);
  s.lineTo(leadTip, -span);
  s.closePath();
  return s;
}

function finShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0);
  s.lineTo(-1.02, 0);
  s.lineTo(-0.98, 0.5);
  s.lineTo(-0.76, 0.12);
  s.closePath();
  return s;
}

const EXTRUDE = (depth, bevel) => ({
  depth,
  bevelEnabled: true,
  bevelThickness: bevel,
  bevelSize: bevel,
  bevelSegments: 1,
  curveSegments: 6,
});

function PlaneModel() {
  const geoms = useMemo(() => {
    const fuselagePts = [
      [0.02, -1.05], [0.1, -0.8], [0.17, -0.45], [0.21, -0.05],
      [0.21, 0.35], [0.17, 0.7], [0.09, 0.98], [0.02, 1.2],
    ].map(([r, h]) => new THREE.Vector2(r, h));

    return {
      fuselage: new THREE.LatheGeometry(fuselagePts, 22),
      wing: new THREE.ExtrudeGeometry(wingShape(1.15, 0.2, -0.12, -0.4, -0.5), EXTRUDE(0.07, 0.02)),
      tail: new THREE.ExtrudeGeometry(wingShape(0.5, -0.7, -0.82, -1.0, -1.02), EXTRUDE(0.06, 0.015)),
      fin: new THREE.ExtrudeGeometry(finShape(), EXTRUDE(0.05, 0.012)),
    };
  }, []);

  // R3F auto-disposes these attached geometries when the canvas unmounts; no
  // manual disposal (which would double-dispose under React StrictMode).

  return (
    <group>
      {/* fuselage: lathe tube laid along X, nose at +X */}
      <mesh geometry={geoms.fuselage} rotation={[0, 0, -Math.PI / 2]}>
        <meshStandardMaterial color="#dbe3ee" metalness={0.66} roughness={0.3} />
      </mesh>
      {/* main wing */}
      <mesh geometry={geoms.wing} position={[0, 0, -0.035]}>
        <meshStandardMaterial color="#aebfce" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* horizontal stabilizer */}
      <mesh geometry={geoms.tail} position={[0, 0, -0.03]}>
        <meshStandardMaterial color="#aebfce" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* vertical fin standing toward the camera (+Z), cyan accent */}
      <mesh geometry={geoms.fin} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#22b8d8" metalness={0.5} roughness={0.34} emissive="#0b3a46" emissiveIntensity={0.5} />
      </mesh>
      {/* nav lights (small emissive spheres - detail, not silhouette) */}
      <mesh position={[-0.12, 1.15, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#2fe3ff" emissive="#2fe3ff" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[-0.12, -1.15, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#ff5a45" emissive="#ff5a45" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[-1.02, 0, 0.07]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#ffb020" emissive="#ff9500" emissiveIntensity={1.7} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Plane({ from, to, routeKey, phase, reducedMotion, travelMs }) {
  const yawRef = useRef(null); // position + heading
  const rollRef = useRef(null); // banking
  const startRef = useRef(null);
  const invalidate = useThree((s) => s.invalidate);

  const cp = useMemo(() => routeControlPoint(from, to), [from, to]);

  // Restart the flight clock whenever a new shipment begins; nudge a render so
  // the reduced-motion (demand) frameloop repaints on route/phase changes.
  useEffect(() => {
    startRef.current = null;
    invalidate();
  }, [routeKey, phase, invalidate]);

  useFrame((state) => {
    const yaw = yawRef.current;
    const roll = rollRef.current;
    if (!yaw || !roll) return;

    if (phase === 'idle') {
      yaw.visible = false;
      return;
    }
    yaw.visible = true;

    const { width, height } = state.size;
    const px = (p) => ({ x: (p.x / 100) * width - width / 2, y: height / 2 - (p.y / 100) * height });
    const a = px(from);
    const c = px(cp);
    const b = px(to);

    yaw.scale.setScalar(Math.min(width, height) * 0.05);

    // Progress along the curve: full arc while shipping, parked at destination
    // once the result is in (or immediately under reduced motion).
    let t = 1;
    if (phase === 'shipping' && !reducedMotion) {
      if (startRef.current == null) startRef.current = state.clock.elapsedTime;
      t = Math.min(1, ((state.clock.elapsedTime - startRef.current) * 1000) / travelMs);
      if (t < 1) invalidate();
    }

    const pos = bezierPoint(a, c, b, t);
    const tan = bezierTangent(a, c, b, t);
    yaw.position.set(pos.x, pos.y, 0);
    yaw.rotation.z = Math.atan2(tan.y, tan.x);

    // Bank into the turn: signed curvature of the quadratic, eased in/out so the
    // plane rolls level at departure and arrival.
    const acc = { x: 2 * (b.x - 2 * c.x + a.x), y: 2 * (b.y - 2 * c.y + a.y) };
    const speed = Math.hypot(tan.x, tan.y) || 1;
    const curvature = (tan.x * acc.y - tan.y * acc.x) / (speed * speed * speed);
    const bank = THREE.MathUtils.clamp(curvature * width * 0.5, -0.5, 0.5);
    roll.rotation.x = bank * Math.sin(Math.PI * t);
  });

  return (
    <group ref={yawRef} visible={false}>
      <group ref={rollRef}>
        <PlaneModel />
      </group>
    </group>
  );
}

export default function DeliveryPlane({ from, to, phase, routeKey, reducedMotion, travelMs = 1800 }) {
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
      <directionalLight position={[3, 6, 8]} intensity={1.25} />
      <directionalLight position={[-5, -2, 4]} intensity={0.4} color="#5fd0ff" />
      <Plane
        from={from}
        to={to}
        routeKey={routeKey}
        phase={phase}
        reducedMotion={reducedMotion}
        travelMs={travelMs}
      />
    </Canvas>
  );
}