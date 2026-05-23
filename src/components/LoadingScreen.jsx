import EarthLoadingState from './EarthLoadingState';

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[150] overflow-hidden bg-bg select-none"
      style={{ background: 'var(--bg)' }}
      aria-hidden="true"
    >
      <EarthLoadingState label="Preparing 3D Earth" />
    </div>
  );
}
