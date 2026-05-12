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
          <article className="rounded-lg border border-[#0A6ED3]/30 bg-black/70 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <header className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-[#0A6ED3]/50 bg-[#0A6ED3]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                  {slide.tag}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {slide.subTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close slide"
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6ED3]"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <h2
              id="slide-panel-title"
              className="font-sans text-3xl font-bold uppercase leading-none tracking-normal text-white drop-shadow-lg sm:text-4xl"
            >
              {slide.title}
            </h2>

            <p className="mt-4 max-w-prose break-words text-sm leading-6 text-gray-200 drop-shadow-sm sm:mt-5 sm:text-base sm:leading-7">
              {slide.summary}
            </p>

            {slide.points?.length > 0 && (
              <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:mt-7 sm:grid-cols-2 sm:gap-5 sm:pt-6">
                {slide.points.map((point) => (
                  <div key={point.label}>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7DB7F0]">
                      {point.label}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-6 text-gray-300">
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {slide.example && (
              <div className="mt-5 border-t border-white/10 pt-4 sm:mt-6 sm:pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  In practice
                </h3>
                <p className="mt-2 break-words text-sm leading-6 text-gray-300">
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
