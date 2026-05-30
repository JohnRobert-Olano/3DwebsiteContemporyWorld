import { motion } from 'framer-motion';
import SpinningGlobe from './SpinningGlobe';

export default function LoadingScreen() {
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
          <span>Rendering Earth</span>
        </div>
      </div>
    </motion.div>
  );
}
