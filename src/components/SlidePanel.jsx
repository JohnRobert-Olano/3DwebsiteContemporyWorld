import { motion, AnimatePresence } from 'framer-motion';

export default function SlidePanel({ open, onClose, slide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="slide-panel"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 48 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-4 top-24 z-40 w-[min(92vw,28rem)] max-h-[calc(100vh-8rem)] overflow-auto pointer-events-auto sm:right-6 lg:right-10"
          aria-labelledby="slide-panel-title"
        >
          <article className="tech-border bg-black/60 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary">
                  {slide.tag}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                  {slide.subTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close slide"
                className="shrink-0 cursor-pointer rounded border border-white/5 p-1.5 text-muted transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <h2
              id="slide-panel-title"
              className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-5xl"
            >
              {slide.title}
            </h2>

            <p className="mt-6 max-w-prose text-sm leading-relaxed text-gray-300 sm:text-base">
              {slide.summary}
            </p>

            {slide.points?.length > 0 && (
              <div className="mt-8 grid gap-6 border-t border-white/5 pt-6 sm:grid-cols-2 sm:gap-8">
                {slide.points.map((point) => (
                  <div key={point.label} className="border-l border-primary/30 pl-4">
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                      {point.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {slide.example && (
              <div className="mt-8 border-t border-white/5 pt-6">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-1 bg-primary rounded-full" />
                   <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                     Context
                   </h3>
                </div>
                <p className="text-sm italic leading-relaxed text-gray-400">
                  {slide.example}
                </p>
              </div>
            )}
          </article>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
