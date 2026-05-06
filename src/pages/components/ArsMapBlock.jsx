
import React from "react";
import mancheMap from "../../assets/manche-map.png";
export default function ArsMapBlock() {
const [selectedSite, setSelectedSite] = React.useState(null);
const [activeFilter, setActiveFilter] = React.useState("Tous");

const allSites = [
{
name: "CHPC Cherbourg",
label: "Urgences / MCO",
top: "17%",
left: "39%",
tension: 2,
category: "SSR / SMR",
},
{
name: "Valognes",
label: "Site CHPC",
top: "31%",
left: "44%",
tension: 1,
category: "Gériatrie",
},
{
name: "Carentan",
label: "Proximité",
top: "49%",
left: "29%",
tension: 1,
category: "Gériatrie",
},
{
name: "Saint-Lô",
label: "Pivot Centre-Manche",
top: "60%",
left: "78%",
tension: 4,
category: "SSR / SMR",
},
{
name: "Bon Sauveur",
label: "Pédopsy",
top: "59%",
left: "55%",
tension: 5,
critical: true,
category: "Pédopsy",
},
{
name: "Coutances",
label: "Côte Ouest",
top: "69%",
left: "33%",
tension: 2,
category: "Sans solution",
},
{
name: "Granville",
label: "Sud-Manche",
top: "84%",
left: "30%",
tension: 3,
category: "SSR / SMR",
},
{
name: "Avranches",
label: "Sud-Manche",
top: "87%",
left: "47%",
tension: 4,
category: "Sans solution",
},
{
name: "Saint-Hilaire",
label: "Sud-Manche",
top: "82%",
left: "63%",
tension: 3,
category: "Gériatrie",
},
];

const sites =
activeFilter === "Tous"
? allSites
: allSites.filter((site) => site.category === activeFilter);

const criticalSites = sites.filter((s) => s.tension >= 4).length;
const totalTension = sites.reduce((acc, s) => acc + s.tension, 0);

const tensionColor = (value) => {
if (value >= 4) return "#ef4444";
if (value >= 2) return "#f97316";
return "#22c55e";
};

return (
<div
style={{
background: "#0f172a",
borderRadius: 24,
padding: 10,
overflow: "hidden",
boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
}}
>
<div style={{ color: "#fff", marginBottom: 18 }}>
<div style={{ fontSize: 28, fontWeight: 900 }}>
Cartographie territoriale Manche
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
{["Tous", "Pédopsy", "Gériatrie", "SSR / SMR", "Sans solution"].map((filter) => (
<button
key={filter}
type="button"
onClick={() => setActiveFilter(filter)}
style={{
border:
activeFilter === filter
? "1px solid #bfdbfe"
: "1px solid rgba(255,255,255,0.12)",
background:
activeFilter === filter
? "#dbeafe"
: "rgba(255,255,255,0.08)",
color: activeFilter === filter ? "#1e3a8a" : "#e2e8f0",
borderRadius: 999,
padding: "7px 11px",
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
}}
>
{filter}
</button>
))}
</div>

<div style={{ color: "#cbd5e1", marginTop: 6 }}>
Visualisation des tensions territoriales et parcours sans solution
</div>
</div>

<div
style={{
position: "relative",
width: 560,
height: 520,
maxWidth: "100%",
minWidth: 500,
margin: "0 auto",
borderRadius: 22,
overflow: "hidden",
background: "#f8fafc",
}}
>
<img
src={mancheMap}
alt="Carte Manche"
style={{
width: "100%",
height: "100%",
display: "block",
opacity: 0.94,
}}
/>

{sites.map((site) => (
<div
key={site.name}
className="site-node"
onClick={() => setSelectedSite(site)}
style={{
position: "absolute",
top: site.top,
left: site.left,
transform: "translate(-50%, -50%)",
zIndex: 5,
cursor: "pointer",
}}
>
<div
style={{
width: site.critical ? 42 : 30,
height: site.critical ? 42 : 30,
borderRadius: 999,
background: tensionColor(site.tension),
border: "4px solid white",
display: "flex",
alignItems: "center",
justifyContent: "center",
color: "#fff",
fontWeight: 900,
fontSize: 14,
boxShadow: `0 0 0 10px ${tensionColor(site.tension)}33`,
animation: site.critical ? "pulse 2s infinite" : "none",
}}
>
{site.tension}
</div>

<div
className="site-label"
style={{
marginTop: 8,
background: "rgba(255,255,255,0.96)",
opacity: 1,
transform: "translateY(0px)",
fontSize: 11,
borderRadius: 14,
padding: "5px 7px",
minWidth: 80,
textAlign: "center",
boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
}}
>
<div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
{site.name}
</div>

<div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
{site.label}
</div>
</div>
</div>
))}

{selectedSite && (
<div
style={{
position: "absolute",
left: 14,
bottom: 14,
width: 220,
background: "rgba(15,23,42,0.94)",
color: "#fff",
borderRadius: 18,
padding: 14,
boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
zIndex: 50,
backdropFilter: "blur(10px)",
border: "1px solid rgba(255,255,255,0.08)",
}}
>
<div style={{ fontSize: 16, fontWeight: 900 }}>{selectedSite.name}</div>
<div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>
{selectedSite.label}
</div>
<div style={{ marginTop: 12 }}>Tension : {selectedSite.tension}/5</div>
</div>
)}
</div>

<div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
<div style={mapStatCard}>
<div style={mapStatValue}>{sites.length}</div>
<div style={mapStatLabel}>sites visibles</div>
</div>

<div style={mapStatCard}>
<div style={mapStatValue}>{criticalSites}</div>
<div style={mapStatLabel}>sites critiques</div>
</div>

<div style={mapStatCard}>
<div style={mapStatValue}>{totalTension}</div>
<div style={mapStatLabel}>score tension</div>
</div>
</div>

<style>
{`
.site-node:hover .site-label {
opacity: 1 !important;
transform: translateY(0px) !important;
}

@keyframes pulse {
0% {
transform: scale(1);
box-shadow: 0 0 0 0 rgba(239,68,68,0.7);
}

70% {
transform: scale(1.08);
box-shadow: 0 0 0 18px rgba(239,68,68,0);
}

100% {
transform: scale(1);
box-shadow: 0 0 0 0 rgba(239,68,68,0);
}
}
`}
</style>
</div>
);
}
const mapStatCard = {
background: "rgba(255,255,255,0.08)",
border: "1px solid rgba(255,255,255,0.12)",
borderRadius: 16,
padding: "10px 14px",
minWidth: 110,
};

const mapStatValue = {
color: "#fff",
fontWeight: 900,
fontSize: 22,
};

const mapStatLabel = {
color: "#cbd5e1",
fontSize: 12,
marginTop: 4,
};
