import React from "react";

export function AppShell({ header, children, sidebar = null, hero = null }) {
const isMobile = window.innerWidth <= 768;

return (
<div
className="app-shell"
style={{
width: "100%",
minHeight: "100vh",
background: "#f8fbff",
overflowX: "hidden",
}}
>
{header ? (
<div className="app-shell__header">
{header}
</div>
) : null}

<main
className="app-shell__body"
style={{
width: "100%",
maxWidth: 1480,
margin: "0 auto",
padding: isMobile ? 10 : 16,
boxSizing: "border-box",
display: "grid",
gap: 16,
}}
>
{hero ? (
<section className="app-shell__hero">
{hero}
</section>
) : null}

<div
className={`app-shell__content${sidebar ? " has-sidebar" : ""}`}
style={{
display: "grid",
gridTemplateColumns:
isMobile || !sidebar ? "minmax(0, 1fr)" : "minmax(0, 1fr) 320px",
gap: 16,
alignItems: "start",
width: "100%",
minWidth: 0,
}}
>
<div
className="app-shell__main"
style={{
minWidth: 0,
width: "100%",
}}
>
{children}
</div>

{sidebar ? (
<aside
className="app-shell__sidebar"
style={{
minWidth: 0,
width: "100%",
}}
>
{sidebar}
</aside>
) : null}
</div>
</main>
</div>
);
}

export function PageSection({ title, subtitle, actions = null, children }) {
const isMobile = window.innerWidth <= 768;

return (
<section
className="app-card page-section"
style={{
width: "100%",
boxSizing: "border-box",
minWidth: 0,
}}
>
<div
className="page-section__header"
style={{
display: "flex",
justifyContent: "space-between",
alignItems: isMobile ? "stretch" : "flex-start",
flexDirection: isMobile ? "column" : "row",
gap: 12,
flexWrap: "wrap",
}}
>
<div style={{ minWidth: 0 }}>
<h2 className="app-section-title">{title}</h2>
{subtitle ? (
<p className="app-muted page-section__subtitle">{subtitle}</p>
) : null}
</div>

{actions ? (
<div
className="page-section__actions"
style={{
display: "flex",
gap: 8,
flexWrap: "wrap",
width: isMobile ? "100%" : "auto",
}}
>
{actions}
</div>
) : null}
</div>

<div
className="page-section__body"
style={{
minWidth: 0,
width: "100%",
}}
>
{children}
</div>
</section>
);
}
