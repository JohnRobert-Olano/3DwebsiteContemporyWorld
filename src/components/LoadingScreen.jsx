import { Loader } from '@react-three/drei';

export default function LoadingScreen() {
  return (
    <Loader
      containerStyles={{ backgroundColor: 'var(--bg)' }}
      innerStyles={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', width: '300px', height: '2px' }}
      barStyles={{ backgroundColor: 'var(--accent)', height: '2px' }}
      dataStyles={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}
      dataInterpolation={(p) => `Syncing // ${p.toFixed(0)}%`}
    />
  );
}
