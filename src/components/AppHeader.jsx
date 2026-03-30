import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AppHeader({ subtitle }) {
const navigate = useNavigate();
const location = useLocation();

const tabs = [
{ label: "Recueil", path: "/" },
{ label: "Tableau de bord", path: "/dashboard" },
{ label: "Crise", path: "/crise", danger: true },
];

function isActive(path) {
if (path === "/") return location.pathname === "/";
return location.pathname.startsWith(path);
}

return (
<div style={styles.wrapper}>
{/* LEFT */}
<div style={styles.left}>
<div style={styles.title}>CARABBAS</div>
<div style={styles.subtitle}>
{subtitle || "Pilotage des parcours patient"}
</div>
</div>

{/* NAV */}
<div style={styles.nav}>
{tabs.map((tab) => {
const active = isActive(tab.path);

return (
<button
key={tab.label}
onClick={() => navigate(tab.path)}
style={{
...styles.tab,
...(active ? styles.tabActive : {}),
...(tab.danger ? styles.tabDanger : {}),
...(tab.danger && active ? styles.tabDangerActive : {}),
}}
>
{tab.label}
</button>
);
})}
</div>
</div>
);
}

const styles = {
wrapper: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
padding: "10px 16px",
background: "#17376a",
borderBottom: "1px solid #0f2a52",
},

left: {
display: "grid",
gap: 2,
},

title: {
fontSize: 16,
fontWeight: 900,
color: "#ffffff",
letterSpacing: 0.5,
},

subtitle: {
fontSize: 12,
color: "#c7d2fe",
fontWeight: 500,
},

nav: {
display: "flex",
gap: 6,
flexWrap: "wrap",
},

tab: {
border: "1px solid transparent",
background: "transparent",
color: "#e2e8f0",
padding: "6px 10px",
borderRadius: 8,
fontSize: 12,
fontWeight: 700,
cursor: "pointer",
transition: "all 0.15s ease",
},

tabActive: {
background: "#ffffff",
color: "#17376a",
border: "1px solid #ffffff",
},

tabDanger: {
color: "#fca5a5",
},

tabDangerActive: {
background: "#dc2626",
color: "#ffffff",
border: "1px solid #dc2626",
},
};
