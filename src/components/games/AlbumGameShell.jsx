export default function AlbumGameShell({ project, gameMeta, children }) {
  return (
    <div
      className="album-game-shell grid max-h-[calc(100dvh-4rem)] min-h-0 w-full overflow-y-auto lg:grid-cols-[minmax(230px,320px)_minmax(0,1fr)] lg:overflow-hidden"
      style={{ '--game-accent': gameMeta.accent }}
    >
      <aside className="border-b border-white/10 bg-[#111111]/96 p-4 pt-14 sm:p-5 sm:pt-16 lg:min-h-0 lg:border-b-0 lg:border-r lg:p-6">
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1">
          <div className="relative aspect-square overflow-hidden rounded-[4px] border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.45)] ring-1 ring-[var(--game-accent)]/25">
            <img
              src={project.image}
              alt={`${project.title} album cover`}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              <span className="inline-block h-px w-5 bg-[var(--game-accent)]" aria-hidden="true" />
              Playable cover
            </p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-normal text-white">
              {project.title}
            </h3>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
              {project.role}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              {gameMeta.premise}
            </p>
            <p className="mt-4 border-l border-[var(--game-accent)] pl-3 text-xs leading-relaxed text-white/50">
              {gameMeta.contextNote}
            </p>
          </div>
        </div>
      </aside>
      <section className="album-game-scroll min-h-0 overflow-visible p-4 sm:p-5 lg:overflow-y-auto lg:p-6">
        {children}
      </section>
    </div>
  );
}
