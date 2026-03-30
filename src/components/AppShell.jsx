export function AppShell({ header, children, sidebar = null, hero = null }) {
  return (
    <div className="app-shell">
      <div className="app-shell__header">{header}</div>
      <main className="app-shell__body">
        {hero ? <section className="app-shell__hero">{hero}</section> : null}
        <div className={`app-shell__content${sidebar ? ' has-sidebar' : ''}`}>
          <div className="app-shell__main">{children}</div>
          {sidebar ? <aside className="app-shell__sidebar">{sidebar}</aside> : null}
        </div>
      </main>
    </div>
  );
}

export function PageSection({ title, subtitle, actions = null, children }) {
  return (
    <section className="app-card page-section">
      <div className="page-section__header">
        <div>
          <h2 className="app-section-title">{title}</h2>
          {subtitle ? <p className="app-muted page-section__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-section__actions">{actions}</div> : null}
      </div>
      <div className="page-section__body">{children}</div>
    </section>
  );
}
