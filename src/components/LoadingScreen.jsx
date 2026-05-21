import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div 
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-bg select-none"
      style={{ background: 'var(--bg)' }}
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center">
        {/* Glowing circular loader */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Inner ring */}
          <div className="absolute inset-0 rounded-full border border-white/5" />
          
          {/* Pulsing glow behind */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Rotating segment */}
          <motion.div
            className="h-16 w-16 rounded-full border-2 border-transparent border-t-primary"
            style={{ borderTopColor: 'var(--accent)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Technical subtitle text */}
        <motion.div 
          className="mt-8 flex flex-col items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.35em] text-white/70"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span>Initializing Engine</span>
          <motion.span 
            className="text-primary font-bold"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Streaming // 3D Tiles
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}
