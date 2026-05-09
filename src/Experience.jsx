import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { Environment, Float, PresentationControls } from '@react-three/drei';

const Experience = forwardRef((props, ref) => {
  const modelGroup = useRef();

  // Expose the group reference so we can animate its rotation, position, and scale
  useImperativeHandle(ref, () => ({
    get group() {
      return modelGroup.current;
    }
  }));

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#E8C56A" />
      
      {/* 
        This is the main group that GSAP will target for scroll animations.
        PresentationControls or Float can be used for idle animations, 
        but we want the parent group to be controlled by GSAP.
      */}
      <group ref={modelGroup} position={[0, 0, 0]}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {/* High-quality placeholder sphere with a gold material */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1.5, 64, 64]} />
            <meshStandardMaterial 
              color="#FFD700" 
              metalness={0.8} 
              roughness={0.2} 
              envMapIntensity={1}
            />
          </mesh>
        </Float>
      </group>
    </>
  );
});

export default Experience;
