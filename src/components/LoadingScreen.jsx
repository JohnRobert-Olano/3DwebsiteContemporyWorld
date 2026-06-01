import { motion } from 'framer-motion';
import SpinningGlobe from './SpinningGlobe';

export default function LoadingScreen({ warmup } = {}) {
  // While the landmark warm-up is running, count progress; otherwise the globe
  // is still rendering its first view.
  const label = warmup && warmup.total > 0
    ? `Preparing historical epochs ${warmup.done}/${warmup.total}`
    : 'Rendering Earth';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[150] overflow-hidden bg-bg select-none"
      style={{ background: 'var(--bg)' }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <SpinningGlobe />
        <div className="earth-preload-label" role="status" aria-live="polite">
          <span className="earth-preload-label__dot" />
          <span>{label}</span>
        </div>
      </div>
    </motion.div>
  );
}
