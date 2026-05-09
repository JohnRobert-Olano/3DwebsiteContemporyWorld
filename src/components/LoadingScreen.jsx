import { Loader } from '@react-three/drei';

export default function LoadingScreen() {
  return (
    <Loader
      containerStyles={{ backgroundColor: 'var(--color-dark)' }}
      innerStyles={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', width: '300px' }}
      barStyles={{ backgroundColor: 'var(--color-primary)', height: '4px' }}
      dataStyles={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
    />
  );
}
