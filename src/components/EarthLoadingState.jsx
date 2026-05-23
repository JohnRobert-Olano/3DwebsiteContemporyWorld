export default function EarthLoadingState({ className = '', label = 'Preparing 3D Earth' }) {
  return (
    <div className={`earth-preload-shell ${className}`} aria-hidden="true">
      <div className="earth-preload-orbit">
        <div className="earth-preload-glow" />
        <div className="earth-preload-globe">
          <span className="earth-preload-cloud earth-preload-cloud--one" />
          <span className="earth-preload-cloud earth-preload-cloud--two" />
        </div>
      </div>
      {label && (
        <div className="earth-preload-label">
          <span className="earth-preload-label__dot" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
