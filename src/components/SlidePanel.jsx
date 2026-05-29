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
          className="fixed right-4 top-24 z-40 w-[min(92vw,28rem)] max-h-[calc(100dvh-8rem)] overflow-auto pointer-events-auto sm:right-6 lg:right-10"
          aria-labelledby="slide-panel-title"
        >
          <article className="rounded-[6px] border border-white/[0.12] bg-bg/[0.72] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.52)] backdrop-blur-2xl sm:p-8">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
                  {slide.tag}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                  {slide.subTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close slide"
                className="shrink-0 cursor-pointer rounded-full border border-white/[0.12] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </header>

            <h2
              id="slide-panel-title"
              className="font-display text-4xl font-semibold uppercase leading-[0.95] tracking-normal text-white sm:text-5xl"
            >
              {slide.title}
            </h2>

            <p className="mt-6 max-w-prose text-sm leading-relaxed text-gray-300 sm:text-base">
              {slide.summary}
            </p>

            {slide.points?.length > 0 && (
              <div className="mt-8 grid gap-6 border-t border-white/5 pt-6 sm:grid-cols-2 sm:gap-8">
                {slide.points.map((point) => (
                  <div key={point.label} className="border-l border-primary/40 pl-4">
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
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
                <div className="mb-2">
                   <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
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
