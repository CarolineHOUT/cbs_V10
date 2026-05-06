import { useEffect, useMemo, useState } from "react";

const DEFAULT_ZONES = [
{ id: "zone_chambre", label: "Chambre", minutes: 10, category: "chambre", active: true },
{ id: "zone_sanitaires", label: "Sanitaires", minutes: 8, category: "chambre", active: true },
{ id: "zone_surfaces", label: "Surfaces de contact", minutes: 6, category: "chambre", active: true },
{ id: "zone_sol", label: "Sol", minutes: 6, category: "chambre", active: true },
{ id: "zone_couloir", label: "Couloir", minutes: 5, category: "circulation", active: true },
{ id: "zone_vaisselle", label: "Vaisselle", minutes: 10, category: "logistique", active: true },
{ id: "zone_chambre_garde", label: "Chambre de garde", minutes: 15, category: "annexe", active: true },
];

const DEFAULT_SCENARIOS = [
{
id: "simple_complete",
label: "Sortie chambre simple",
roomType: "simple",
partial: false,
isolation: false,
zones: ["zone_chambre", "zone_sanitaires", "zone_surfaces", "zone_sol"],
},
{
id: "double_complete",
label: "Sortie chambre double complète",
roomType: "double",
partial: false,
isolation: false,
zones: ["zone_chambre", "zone_sanitaires", "zone_surfaces", "zone_sol"],
},
{
id: "double_partial",
label: "Sortie partielle chambre double",
roomType: "double",
partial: true,
isolation: false,
zones: ["zone_chambre", "zone_surfaces", "zone_sol"],
},
{
id: "isolement",
label: "Isolement",
roomType: "all",
partial: false,
isolation: true,
zones: ["zone_chambre", "zone_sanitaires", "zone_surfaces", "zone_sol"],
},
{
id: "vaisselle",
label: "Vaisselle",
roomType: "none",
partial: false,
isolation: false,
zones: ["zone_vaisselle"],
},
{
id: "couloir",
label: "Couloir",
roomType: "none",
partial: false,
isolation: false,
zones: ["zone_couloir"],
},
{
id: "chambre_garde",
label: "Chambre de garde",
roomType: "none",
partial: false,
isolation: false,
zones: ["zone_chambre_garde"],
},
];

const pageSectionStyle = {
display: "grid",
gap: 14,
};

const cardStyle = {
background: "#ffffff",
border: "1px solid #e5e7eb",
borderRadius: 18,
padding: 16,
boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const headerCompact = {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
padding: "12px 16px",
borderBottom: "1px solid #e5e7eb",
background: "#fff",
};

const subtleCardStyle = {
background: "#f8fafc",
border: "1px solid #e2e8f0",
borderRadius: 16,
padding: 14,
};

const inputStyle = {
width: "100%",
padding: "10px 12px",
borderRadius: 12,
border: "1px solid #d1d5db",
fontSize: 14,
background: "#fff",
boxSizing: "border-box",
};

const smallButton = {
border: "1px solid #d1d5db",
borderRadius: 12,
padding: "8px 12px",
background: "#fff",
cursor: "pointer",
fontSize: 13,
fontWeight: 600,
};

const primaryButton = {
...smallButton,
background: "#1d4ed8",
color: "#fff",
border: "1px solid #1d4ed8",
};

const ghostButton = {
...smallButton,
background: "#f8fafc",
};

const dangerButton = {
border: "1px solid #fecaca",
borderRadius: 12,
padding: "8px 12px",
background: "#fff5f5",
color: "#b91c1c",
cursor: "pointer",
fontSize: 13,
fontWeight: 600,
};

const totalBadgeStyle = {
padding: "10px 14px",
borderRadius: 12,
background: "#eff6ff",
color: "#1d4ed8",
fontWeight: 800,
fontSize: 18,
minWidth: 96,
textAlign: "center",
boxShadow: "inset 0 0 0 1px #bfdbfe",
};

const categoryMeta = {
chambre: { label: "Chambre", background: "#dbeafe", color: "#1d4ed8" },
circulation: { label: "Circulation", background: "#fef3c7", color: "#b45309" },
logistique: { label: "Logistique", background: "#dcfce7", color: "#15803d" },
annexe: { label: "Annexe", background: "#ede9fe", color: "#6d28d9" },
};

function makeId(prefix = "item") {
return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatMinutes(value) {
return `${value} min`;
}

function roomTypeLabel(roomType) {
if (roomType === "simple") return "Simple";
if (roomType === "double") return "Double";
if (roomType === "all") return "Toutes chambres";
if (roomType === "none") return "Sans chambre";
return roomType;
}

function getScenarioVariant(scenario) {
if (scenario.isolation) return "Isolement";
if (scenario.partial) return "Partiel";
return "Complet";
}

function buildScenarioSubtitle(scenario) {
const parts = [roomTypeLabel(scenario.roomType)];
if (scenario.roomType !== "none") {
parts.push(getScenarioVariant(scenario));
} else if (scenario.isolation) {
parts.push("Isolement");
}
if (scenario.isolation && scenario.roomType !== "none") {
parts.push("Précautions renforcées");
}
return parts.join(" · ");
}

function badgeStyle(background, color = "#0f172a") {
return {
display: "inline-flex",
alignItems: "center",
gap: 6,
padding: "5px 10px",
borderRadius: 999,
background,
color,
fontSize: 12,
fontWeight: 700,
border: "1px solid rgba(15, 23, 42, 0.06)",
};
}

export default function BioCleaningSettings({ value, onChange }) {
const [zones, setZones] = useState(
value?.zones?.length ? value.zones : DEFAULT_ZONES
);
const [scenarios, setScenarios] = useState(
value?.scenarios?.length ? value.scenarios : DEFAULT_SCENARIOS
);

const [newZone, setNewZone] = useState({
label: "",
minutes: 5,
category: "chambre",
});

const [newScenario, setNewScenario] = useState({
label: "",
roomType: "simple",
partial: false,
isolation: false,
zones: [],
});

const [expandedScenarioId, setExpandedScenarioId] = useState(
DEFAULT_SCENARIOS[0]?.id || null
);

useEffect(() => {
if (typeof onChange === "function") {
onChange({ zones, scenarios });
}
}, [zones, scenarios, onChange]);

const sortedZones = useMemo(() => {
return [...zones].sort((a, b) => {
if (a.active !== b.active) return a.active ? -1 : 1;
return a.label.localeCompare(b.label, "fr");
});
}, [zones]);

const activeZones = useMemo(
() => sortedZones.filter((zone) => zone.active),
[sortedZones]
);

const zoneCountByCategory = useMemo(() => {
return zones.reduce((acc, zone) => {
acc[zone.category] = (acc[zone.category] || 0) + 1;
return acc;
}, {});
}, [zones]);

const scenarioSummaries = useMemo(() => {
return scenarios.map((scenario) => {
const selectedZones = scenario.zones
.map((zoneId) => zones.find((z) => z.id === zoneId))
.filter(Boolean);

const totalMinutes = selectedZones.reduce(
(sum, zone) => sum + (zone?.minutes || 0),
0
);

return {
...scenario,
selectedZones,
totalMinutes,
};
});
}, [scenarios, zones]);

const totalActiveZonesMinutes = useMemo(() => {
return activeZones.reduce((sum, zone) => sum + zone.minutes, 0);
}, [activeZones]);

function updateZone(zoneId, patch) {
setZones((prev) =>
prev.map((zone) => (zone.id === zoneId ? { ...zone, ...patch } : zone))
);
}

function removeZone(zoneId) {
setZones((prev) => prev.filter((zone) => zone.id !== zoneId));
setScenarios((prev) =>
prev.map((scenario) => ({
...scenario,
zones: scenario.zones.filter((id) => id !== zoneId),
}))
);
}

function addZone() {
const label = String(newZone.label || "").trim();
const minutes = Number(newZone.minutes);

if (!label) return;

setZones((prev) => [
...prev,
{
id: makeId("zone"),
label,
minutes: Number.isFinite(minutes) ? minutes : 0,
category: newZone.category || "chambre",
active: true,
},
]);

setNewZone({
label: "",
minutes: 5,
category: "chambre",
});
}

function updateScenario(scenarioId, patch) {
setScenarios((prev) =>
prev.map((scenario) =>
scenario.id === scenarioId ? { ...scenario, ...patch } : scenario
)
);
}

function toggleScenarioZone(scenarioId, zoneId) {
setScenarios((prev) =>
prev.map((scenario) => {
if (scenario.id !== scenarioId) return scenario;
const hasZone = scenario.zones.includes(zoneId);
return {
...scenario,
zones: hasZone
? scenario.zones.filter((id) => id !== zoneId)
: [...scenario.zones, zoneId],
};
})
);
}

function removeScenario(scenarioId) {
setScenarios((prev) => prev.filter((scenario) => scenario.id !== scenarioId));
if (expandedScenarioId === scenarioId) {
setExpandedScenarioId(null);
}
}

function addScenario() {
const label = String(newScenario.label || "").trim();
if (!label) return;

const id = makeId("scenario");

setScenarios((prev) => [
...prev,
{
id,
label,
roomType: newScenario.roomType,
partial: Boolean(newScenario.partial),
isolation: Boolean(newScenario.isolation),
zones: newScenario.zones,
},
]);

setExpandedScenarioId(id);

setNewScenario({
label: "",
roomType: "simple",
partial: false,
isolation: false,
zones: [],
});
}

function toggleNewScenarioZone(zoneId) {
setNewScenario((prev) => {
const hasZone = prev.zones.includes(zoneId);
return {
...prev,
zones: hasZone
? prev.zones.filter((id) => id !== zoneId)
: [...prev.zones, zoneId],
};
});
}

return (
<div style={pageSectionStyle}>
<section
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 12,
}}
>
<div style={subtleCardStyle}>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
Situations configurées
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#6d28d9" }}>
{scenarioSummaries.length}
</div>
</div>

<div style={subtleCardStyle}>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
Zones actives
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#15803d" }}>
{activeZones.length}
</div>
</div>

<div style={subtleCardStyle}>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
Temps standard cumulé
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>
{formatMinutes(totalActiveZonesMinutes)}
</div>
</div>

<div style={subtleCardStyle}>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
Bibliothèque de zones
</div>
<div style={{ display: "grid", gap: 4, color: "#334155", fontSize: 14 }}>
{Object.entries(zoneCountByCategory).map(([category, count]) => (
<div key={category}>
{categoryMeta[category]?.label || category} : <strong>{count}</strong>
</div>
))}
</div>
</div>
</section>

<section style={cardStyle}>

<div style={headerCompact}>
<div>
<h3 style={{ margin: "0 0 4px" }}>Situations de bio-nettoyage</h3>
<p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
Configure les cas métier utilisés sur le terrain.
</p>
</div>

<button
type="button"
style={ghostButton}
onClick={() => {
setZones(DEFAULT_ZONES);
setScenarios(DEFAULT_SCENARIOS);
setExpandedScenarioId(DEFAULT_SCENARIOS[0]?.id || null);
}}
>
Réinitialiser
</button>
</div>

<div style={{ ...subtleCardStyle, marginBottom: 14 }}>
<div
style={{
display: "grid",
gridTemplateColumns:
"minmax(240px, 2fr) minmax(150px, 170px) auto auto auto",
gap: 10,
alignItems: "center",
}}
>
<input
style={inputStyle}
value={newScenario.label}
onChange={(e) =>
setNewScenario((prev) => ({ ...prev, label: e.target.value }))
}
placeholder="Nouvelle situation"
/>

<select
style={inputStyle}
value={newScenario.roomType}
onChange={(e) =>
setNewScenario((prev) => ({ ...prev, roomType: e.target.value }))
}
>
<option value="simple">Simple</option>
<option value="double">Double</option>
<option value="all">Toutes</option>
<option value="none">Sans chambre</option>
</select>

<label
style={{
display: "flex",
gap: 6,
alignItems: "center",
fontSize: 13,
color: "#334155",
}}
>
<input
type="checkbox"
checked={newScenario.partial}
onChange={(e) =>
setNewScenario((prev) => ({
...prev,
partial: e.target.checked,
}))
}
/>
Partiel
</label>

<label
style={{
display: "flex",
gap: 6,
alignItems: "center",
fontSize: 13,
color: "#334155",
}}
>
<input
type="checkbox"
checked={newScenario.isolation}
onChange={(e) =>
setNewScenario((prev) => ({
...prev,
isolation: e.target.checked,
}))
}
/>
Isolement
</label>

<button type="button" style={primaryButton} onClick={addScenario}>
Ajouter
</button>
</div>

<div style={{ marginTop: 12 }}>
<div
style={{
marginBottom: 8,
fontSize: 13,
fontWeight: 700,
color: "#334155",
}}
>
Zones incluses
</div>

<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
{activeZones.map((zone) => {
const selected = newScenario.zones.includes(zone.id);
const meta = categoryMeta[zone.category] || categoryMeta.chambre;

return (
<button
key={zone.id}
type="button"
onClick={() => toggleNewScenarioZone(zone.id)}
style={{
...smallButton,
background: selected ? meta.background : "#fff",
borderColor: selected ? meta.color : "#d1d5db",
color: selected ? meta.color : "#334155",
fontWeight: selected ? 700 : 500,
}}
>
{selected ? "✓ " : ""}
{zone.label} · {formatMinutes(zone.minutes)}
</button>
);
})}
</div>
</div>
</div>

<div style={{ display: "grid", gap: 10 }}>
{scenarioSummaries.map((scenario) => {
const expanded = expandedScenarioId === scenario.id;

return (
<div
key={scenario.id}
style={{
border: "1px solid #e5e7eb",
borderRadius: 16,
background: "#fff",
overflow: "hidden",
}}
>
<div
style={{
padding: 14,
display: "grid",
gridTemplateColumns: "1.8fr 1.2fr auto",
alignItems: "center",
gap: 12,
}}
>
<div style={{ minWidth: 0 }}>
<input
style={{
...inputStyle,
fontWeight: 700,
marginBottom: 6,
}}
value={scenario.label}
onChange={(e) =>
updateScenario(scenario.id, { label: e.target.value })
}
/>

<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
<span style={badgeStyle("#eef2ff", "#3730a3")}>
{roomTypeLabel(scenario.roomType)}
</span>

<span
style={badgeStyle(
scenario.partial ? "#fef3c7" : "#dcfce7",
scenario.partial ? "#b45309" : "#15803d"
)}
>
{scenario.partial ? "Partiel" : "Complet"}
</span>

{scenario.isolation && (
<span style={badgeStyle("#fee2e2", "#b91c1c")}>
Isolement
</span>
)}
</div>

<div style={{ fontSize: 12, color: "#64748b" }}>
{buildScenarioSubtitle(scenario)}
</div>
</div>

<div style={{ minWidth: 0 }}>
<div
style={{
fontSize: 12,
fontWeight: 700,
color: "#64748b",
marginBottom: 6,
}}
>
Zones
</div>

<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
{scenario.selectedZones.map((zone) => {
const meta = categoryMeta[zone.category] || categoryMeta.chambre;

return (
<span
key={zone.id}
style={badgeStyle(meta.background, meta.color)}
>
{zone.label}
</span>
);
})}
</div>
</div>

<div
style={{
display: "flex",
alignItems: "center",
gap: 8,
justifyContent: "flex-end",
flexWrap: "wrap",
}}
>
<div style={totalBadgeStyle}>{formatMinutes(scenario.totalMinutes)}</div>

<button
type="button"
style={ghostButton}
onClick={() =>
setExpandedScenarioId((prev) =>
prev === scenario.id ? null : scenario.id
)
}
>
{expanded ? "Masquer" : "Détail"}
</button>

<button
type="button"
style={dangerButton}
onClick={() => removeScenario(scenario.id)}
>
Supprimer
</button>
</div>
</div>

{expanded && (
<div
style={{
borderTop: "1px solid #e5e7eb",
background: "#f8fafc",
padding: 14,
display: "grid",
gap: 12,
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(180px, 220px) auto auto",
gap: 12,
alignItems: "center",
}}
>
<label>
<div
style={{
marginBottom: 6,
fontSize: 13,
fontWeight: 700,
color: "#334155",
}}
>
Type de chambre
</div>
<select
style={inputStyle}
value={scenario.roomType}
onChange={(e) =>
updateScenario(scenario.id, {
roomType: e.target.value,
})
}
>
<option value="simple">Simple</option>
<option value="double">Double</option>
<option value="all">Toutes</option>
<option value="none">Sans chambre</option>
</select>
</label>

<label
style={{
display: "flex",
gap: 8,
alignItems: "center",
minHeight: 42,
fontSize: 14,
marginTop: 20,
}}
>
<input
type="checkbox"
checked={scenario.partial}
onChange={(e) =>
updateScenario(scenario.id, {
partial: e.target.checked,
})
}
/>
Partiel
</label>

<label
style={{
display: "flex",
gap: 8,
alignItems: "center",
minHeight: 42,
fontSize: 14,
marginTop: 20,
}}
>
<input
type="checkbox"
checked={scenario.isolation}
onChange={(e) =>
updateScenario(scenario.id, {
isolation: e.target.checked,
})
}
/>
Isolement
</label>
</div>

<div>
<div
style={{
marginBottom: 8,
fontSize: 13,
fontWeight: 700,
color: "#334155",
}}
>
Zones de la situation
</div>

<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
{activeZones.map((zone) => {
const selected = scenario.zones.includes(zone.id);
const meta =
categoryMeta[zone.category] || categoryMeta.chambre;

return (
<button
key={zone.id}
type="button"
onClick={() => toggleScenarioZone(scenario.id, zone.id)}
style={{
...smallButton,
background: selected ? meta.background : "#fff",
borderColor: selected ? meta.color : "#d1d5db",
color: selected ? meta.color : "#334155",
fontWeight: selected ? 700 : 500,
}}
>
{selected ? "✓ " : ""}
{zone.label} · {formatMinutes(zone.minutes)}
</button>
);
})}
</div>
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 16,
alignItems: "center",
flexWrap: "wrap",
}}
>
<div style={{ fontSize: 13, color: "#475569" }}>
{scenario.selectedZones.length} zones · {scenario.totalMinutes} min
</div>

<div
style={{
fontWeight: 800,
color: "#1d4ed8",
fontSize: 15,
}}
>
Total estimé : {formatMinutes(scenario.totalMinutes)}
</div>
</div>
</div>
)}
</div>
);
})}
</div>
</section>

<section style={cardStyle}>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 16,
alignItems: "flex-start",
flexWrap: "wrap",
marginBottom: 14,
}}
>
<div>
<h3 style={{ margin: "0 0 6px" }}>Bibliothèque des zones</h3>
<p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
Référentiel des zones nettoyables utilisables dans les situations.
</p>
</div>
</div>

<div style={{ ...subtleCardStyle, marginBottom: 14 }}>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(260px, 2fr) 110px 170px auto",
gap: 10,
alignItems: "end",
}}
>
<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Nouvelle zone
</div>
<input
style={inputStyle}
value={newZone.label}
onChange={(e) =>
setNewZone((prev) => ({ ...prev, label: e.target.value }))
}
placeholder="Ex : Office, Couloir, Salle d’attente"
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Minutes
</div>
<input
style={inputStyle}
type="number"
min="0"
value={newZone.minutes}
onChange={(e) =>
setNewZone((prev) => ({
...prev,
minutes: Number(e.target.value),
}))
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Catégorie
</div>
<select
style={inputStyle}
value={newZone.category}
onChange={(e) =>
setNewZone((prev) => ({ ...prev, category: e.target.value }))
}
>
<option value="chambre">Chambre</option>
<option value="circulation">Circulation</option>
<option value="logistique">Logistique</option>
<option value="annexe">Annexe</option>
</select>
</label>

<button type="button" style={primaryButton} onClick={addZone}>
Ajouter
</button>
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
gap: 10,
}}
>
{sortedZones.map((zone) => {
const meta = categoryMeta[zone.category] || categoryMeta.chambre;

return (
<div
key={zone.id}
style={{
...subtleCardStyle,
opacity: zone.active ? 1 : 0.6,
display: "flex",
flexDirection: "column",
gap: 10,
}}
>
<input
style={{ ...inputStyle, fontWeight: 700 }}
value={zone.label}
onChange={(e) =>
updateZone(zone.id, { label: e.target.value })
}
/>

<div
style={{
display: "grid",
gridTemplateColumns: "90px 1fr",
gap: 10,
alignItems: "center",
}}
>
<input
style={inputStyle}
type="number"
min="0"
value={zone.minutes}
onChange={(e) =>
updateZone(zone.id, { minutes: Number(e.target.value) })
}
/>

<select
style={inputStyle}
value={zone.category}
onChange={(e) =>
updateZone(zone.id, { category: e.target.value })
}
>
<option value="chambre">Chambre</option>
<option value="circulation">Circulation</option>
<option value="logistique">Logistique</option>
<option value="annexe">Annexe</option>
</select>
</div>

<div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
<span style={badgeStyle(meta.background, meta.color)}>
{meta.label}
</span>

<span
style={badgeStyle(
zone.active ? "#dcfce7" : "#e5e7eb",
zone.active ? "#15803d" : "#475569"
)}
>
{zone.active ? "Active" : "Inactive"}
</span>
</div>

<div style={{ display: "flex", gap: 8, marginTop: 2 }}>
<button
type="button"
style={ghostButton}
onClick={() => updateZone(zone.id, { active: !zone.active })}
>
{zone.active ? "Désactiver" : "Activer"}
</button>

<button
type="button"
style={dangerButton}
onClick={() => removeZone(zone.id)}
>
Supprimer
</button>
</div>
</div>
);
})}
</div>
</section>

<section style={cardStyle}>
<h3 style={{ margin: "0 0 8px" }}>Aperçu rapide</h3>
<p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 14 }}>
Vue synthétique des durées actuellement paramétrées.
</p>

<div style={{ display: "grid", gap: 8 }}>
{scenarioSummaries.map((scenario) => (
<div
key={scenario.id}
style={{
display: "flex",
justifyContent: "space-between",
gap: 16,
padding: "12px 14px",
border: "1px solid #e5e7eb",
borderRadius: 12,
background: "#fff",
}}
>
<div>
<div style={{ fontWeight: 700 }}>{scenario.label}</div>
<div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
{buildScenarioSubtitle(scenario)}
</div>
</div>

<div style={{ fontWeight: 800, color: "#1d4ed8" }}>
{formatMinutes(scenario.totalMinutes)}
</div>
</div>
))}
</div>
</section>
</div>
);
}