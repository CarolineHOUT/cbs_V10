export default function ArsSidebar({ activeSection, setActiveSection }) {
return (
<aside
style={{
background: "#0f172a",
color: "#fff",
padding: 20,
display: "flex",
flexDirection: "column",
gap: 10,
height: "100vh",
position: "sticky",
top: 0,
alignSelf: "start",
}}
>
<div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>Cockpit ARS</div>

{[
["territoire", "Vue territoriale"],
["sas", "SAS territorial"],
["parcours", "Parcours complexes"],
["etablissements", "Établissements"],
["cellule", "Cellule ARS"],
["stats", "Statistiques"],
].map(([key, label]) => (
<button
key={key}
type="button"
onClick={() => setActiveSection(key)}
style={{
border: "none",
background: activeSection === key ? "#dbeafe" : "rgba(255,255,255,0.06)",
color: activeSection === key ? "#1e3a8a" : "#fff",
borderRadius: 14,
padding: "12px 14px",
textAlign: "left",
fontWeight: 700,
cursor: "pointer",
}}
>
{label}
</button>
))}
</aside>
);
}