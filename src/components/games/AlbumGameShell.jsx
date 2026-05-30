export default function AlbumGameShell({ project, gameMeta, children }) {
  return (
    <div
      className="album-game-shell"
      style={{ '--game-accent': gameMeta.accent }}
    >
      <aside className="album-game-identity">
        <div className="album-game-cover">
          <img
            src={project.image}
            alt={`${project.title} album cover`}
            draggable={false}
          />
        </div>
        <div className="album-game-identity-copy">
          <p className="album-game-eyebrow">
            <span aria-hidden="true" />
            Playable cover
          </p>
          <h3>
            {project.title}
          </h3>
          <p className="album-game-role">
            {project.role}
          </p>
          <p className="album-game-premise">
            {gameMeta.premise}
          </p>
          <p className="album-game-context">
            {gameMeta.contextNote}
          </p>
        </div>
      </aside>
      <section className="album-game-scroll">
        {children}
      </section>
    </div>
  );
}
