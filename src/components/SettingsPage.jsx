import { useEffect, useMemo, useState } from "react";
import BioCleaningSettings from "./BioCleaningSettings";

const DEFAULT_RULES = {
dmsThreshold: 10,
avoidableDaysTarget: 0,
recoveryWindowHours: 48,
criticalPatientsThreshold: 1,
fastExitThresholdHours: 24,
directionAlertThreshold: 2,
};


const pageGrid = {
display: "grid",
gap: 14,
};

const cardStyle = {
background: "#ffffff",
border: "1px solid #e5e7eb",
borderRadius: 18,
padding: 18,
boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const compactHeaderStyle = {
background: "#ffffff",
border: "1px solid #e5e7eb",
borderRadius: 18,
padding: 18,
boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
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

const chipBase = {
border: "1px solid #cbd5e1",
borderRadius: 999,
padding: "8px 13px",
background: "#fff",
cursor: "pointer",
fontSize: 13,
fontWeight: 700,
};

const smallButton = {
border: "1px solid #d1d5db",
borderRadius: 12,
padding: "8px 12px",
background: "#fff",
cursor: "pointer",
fontSize: 13,
fontWeight: 700,
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

const subtlePanel = {
background: "#f8fafc",
border: "1px solid #e2e8f0",
borderRadius: 16,
padding: 14,
};

function formatHours(value) {
return `${value} h`;
}

function kpiCardStyle(tint) {
const themes = {
blue: {
background: "#eff6ff",
border: "1px solid #bfdbfe",
value: "#1d4ed8",
},
green: {
background: "#ecfdf5",
border: "1px solid #bbf7d0",
value: "#15803d",
},
amber: {
background: "#fffbeb",
border: "1px solid #fde68a",
value: "#b45309",
},
violet: {
background: "#f5f3ff",
border: "1px solid #ddd6fe",
value: "#6d28d9",
},
};

const theme = themes[tint] || themes.blue;

return {
background: theme.background,
border: theme.border,
borderRadius: 16,
padding: 14,
minHeight: 88,
display: "grid",
alignContent: "space-between",
};
}

function rulesEqual(a, b) {
return JSON.stringify(a) === JSON.stringify(b);
}


const DEFAULT_BIO_CLEANING = {
zones: [
{ id: "zone_chambre", label: "Chambre", minutes: 10, category: "chambre", active: true },
{ id: "zone_sanitaires", label: "Sanitaires", minutes: 8, category: "chambre", active: true },
{ id: "zone_surfaces", label: "Surfaces de contact", minutes: 6, category: "chambre", active: true },
{ id: "zone_sol", label: "Sol", minutes: 6, category: "chambre", active: true },
{ id: "zone_couloir", label: "Couloir", minutes: 5, category: "circulation", active: true },
{ id: "zone_vaisselle", label: "Vaisselle", minutes: 10, category: "logistique", active: true },
{ id: "zone_chambre_garde", label: "Chambre de garde", minutes: 15, category: "annexe", active: true },
],
scenarios: [
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
],
};


export default function SettingsPage({ value, onChange, services = [] }) {
const rules = value?.rules || DEFAULT_RULES;
const bioCleaningSettings = value?.bioCleaning || DEFAULT_BIO_CLEANING;

const serviceOptions = useMemo(() => {
return services
.map((service) => ({
id: service,
label: service,
}))
.sort((a, b) => a.label.localeCompare(b.label, "fr"));
}, [services]);

const [scopeMode, setScopeMode] = useState("global");
const [selectedService, setSelectedService] = useState(
serviceOptions[0]?.id || ""
);
const [settingsTab, setSettingsTab] = useState("pilotage");
const [lastSavedSnapshot, setLastSavedSnapshot] = useState({
rules: DEFAULT_RULES,
bioCleaning: DEFAULT_BIO_CLEANING,
});

useEffect(() => {
if (!selectedService && serviceOptions[0]?.id) {
setSelectedService(serviceOptions[0].id);
}
}, [serviceOptions, selectedService]);

useEffect(() => {
if (
lastSavedSnapshot.rules === DEFAULT_RULES &&
lastSavedSnapshot.bioCleaning === DEFAULT_BIO_CLEANING &&
value
) {
setLastSavedSnapshot({
rules,
bioCleaning: bioCleaningSettings,
});
}
}, [value, rules, bioCleaningSettings, lastSavedSnapshot]);

function updateRules(patch) {
if (typeof onChange !== "function") return;

onChange({
...value,
rules: {
...rules,
...patch,
},
bioCleaning: bioCleaningSettings,
});
}

function updateBioCleaning(nextBioCleaning) {
if (typeof onChange !== "function") return;

onChange({
...value,
rules,
bioCleaning: nextBioCleaning,
});
}

function resetRulesOnly() {
if (typeof onChange !== "function") return;

onChange({
...value,
rules: DEFAULT_RULES,
bioCleaning: bioCleaningSettings,
});
}

function resetAllSettings() {
if (typeof onChange !== "function") return;

onChange({
...value,
rules: DEFAULT_RULES,
bioCleaning: DEFAULT_BIO_CLEANING,
});
}

function saveSettings() {
console.log("SETTINGS PAGE", {
scopeMode,
selectedService,
rules,
bioCleaningSettings,
});

setLastSavedSnapshot({
rules,
bioCleaning: bioCleaningSettings,
});

alert("Paramétrage prêt à être sauvegardé.");
}

const scopeLabel = useMemo(() => {
if (scopeMode === "global") return "Paramétrage global";
return `Paramétrage service · ${selectedService || "Service"}`;
}, [scopeMode, selectedService]);

const scenarioCount = bioCleaningSettings?.scenarios?.length || 0;
const zoneCount = bioCleaningSettings?.zones?.length || 0;
const activeZoneCount =
bioCleaningSettings?.zones?.filter((zone) => zone.active).length || 0;

const hasUnsavedChanges = useMemo(() => {
return !(
rulesEqual(rules, lastSavedSnapshot.rules) &&
rulesEqual(bioCleaningSettings, lastSavedSnapshot.bioCleaning)
);
}, [rules, bioCleaningSettings, lastSavedSnapshot]);

return (
<div style={pageGrid}>

<section style={compactHeaderStyle}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: 16,
flexWrap: "wrap",
marginBottom: 12,
}}
>
<div style={{ maxWidth: 760 }}>

<div>
<div
style={{
fontSize: 11,
color: "#64748b",
fontWeight: 600,
textTransform: "uppercase",
letterSpacing: "0.04em",
}}
>
Configuration métier
</div>

<div
style={{
fontSize: 18,
fontWeight: 700,
lineHeight: 1.2,
marginTop: 2,
}}
>
Paramétrage CARABBAS
</div>
</div>


<div style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
padding: "10px 12px",
borderBottom: "1px solid #e5e7eb",
marginBottom: 10
}}>

<div>

</div>




</div>
</div>

<div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
<div
style={{
display: "inline-flex",
alignItems: "center",
padding: "6px 10px",
borderRadius: 999,
background: hasUnsavedChanges ? "#fef3c7" : "#dcfce7",
color: hasUnsavedChanges ? "#b45309" : "#15803d",
fontSize: 12,
fontWeight: 700,
}}
>
{hasUnsavedChanges
? "Modifications non enregistrées"
: "Tout est enregistré"}
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button type="button" style={smallButton} onClick={resetRulesOnly}>
Réinitialiser les règles
</button>

<button type="button" style={smallButton} onClick={resetAllSettings}>
Réinitialiser tout
</button>

<button type="button" style={primaryButton} onClick={saveSettings}>
Enregistrer
</button>
</div>
</div>
</div>

<div
style={{
display: "flex",
gap: 10,
flexWrap: "wrap",
alignItems: "center",
paddingTop: 12,
borderTop: "1px solid #e5e7eb",
}}
>
<button
type="button"
style={{
...chipBase,
background: scopeMode === "global" ? "#1d4ed8" : "#fff",
color: scopeMode === "global" ? "#fff" : "#0f172a",
borderColor: scopeMode === "global" ? "#1d4ed8" : "#cbd5e1",
}}
onClick={() => setScopeMode("global")}
>
Global
</button>

<button
type="button"
style={{
...chipBase,
background: scopeMode === "service" ? "#1d4ed8" : "#fff",
color: scopeMode === "service" ? "#fff" : "#0f172a",
borderColor: scopeMode === "service" ? "#1d4ed8" : "#cbd5e1",
}}
onClick={() => setScopeMode("service")}
>
Par service
</button>

{scopeMode === "service" && (
<div style={{ minWidth: 260 }}>
<select
style={inputStyle}
value={selectedService}
onChange={(e) => setSelectedService(e.target.value)}
>
{serviceOptions.map((service) => (
<option key={service.id} value={service.id}>
{service.label}
</option>
))}
</select>
</div>
)}
</div>
</section>

<section
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 12,
}}
>
<div style={kpiCardStyle("blue")}>
<div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
Portée active
</div>
<div
style={{
fontSize: 18,
fontWeight: 800,
color: "#1d4ed8",
lineHeight: 1.2,
}}
>
{scopeLabel}
</div>
</div>

<div style={kpiCardStyle("violet")}>
<div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
Situations configurées
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#6d28d9" }}>
{scenarioCount}
</div>
</div>

<div style={kpiCardStyle("green")}>
<div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
Zones actives
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#15803d" }}>
{activeZoneCount}
</div>
</div>

<div style={kpiCardStyle("amber")}>
<div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
Bibliothèque de zones
</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#b45309" }}>
{zoneCount}
</div>
</div>
</section>

<section style={cardStyle}>
<div
style={{
display: "flex",
gap: 10,
flexWrap: "wrap",
marginBottom: 16,
}}
>
<button
type="button"
style={{
...chipBase,
background: settingsTab === "pilotage" ? "#0f172a" : "#fff",
color: settingsTab === "pilotage" ? "#fff" : "#0f172a",
borderColor: settingsTab === "pilotage" ? "#0f172a" : "#cbd5e1",
}}
onClick={() => setSettingsTab("pilotage")}
>
Pilotage
</button>

<button
type="button"
style={{
...chipBase,
background: settingsTab === "bio" ? "#0f172a" : "#fff",
color: settingsTab === "bio" ? "#fff" : "#0f172a",
borderColor: settingsTab === "bio" ? "#0f172a" : "#cbd5e1",
}}
onClick={() => setSettingsTab("bio")}
>
Bio-nettoyage
</button>
</div>

{settingsTab === "pilotage" && (
<div style={{ display: "grid", gap: 16 }}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: 16,
flexWrap: "wrap",
}}
>
<div>
<h3 style={{ margin: "0 0 6px" }}>Règles de pilotage</h3>
<p style={{ margin: 0, color: "#6b7280", maxWidth: 760 }}>
Ces règles pilotent les seuils métiers visibles dans les
autres vues.
</p>
</div>

<div
style={{
padding: "7px 11px",
borderRadius: 999,
background: "#eff6ff",
color: "#1d4ed8",
fontSize: 12,
fontWeight: 700,
}}
>
{scopeMode === "global"
? "Appliqué globalement"
: "Surcharge par service"}
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 14,
}}
>
<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Seuil DMS ≥ J+
</div>
<input
type="number"
style={inputStyle}
value={rules.dmsThreshold}
onChange={(e) =>
updateRules({
dmsThreshold: Number(e.target.value),
})
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Cible jours évitables
</div>
<input
type="number"
style={inputStyle}
value={rules.avoidableDaysTarget}
onChange={(e) =>
updateRules({
avoidableDaysTarget: Number(e.target.value),
})
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Fenêtre lits récupérables (heures)
</div>
<input
type="number"
style={inputStyle}
value={rules.recoveryWindowHours}
onChange={(e) =>
updateRules({
recoveryWindowHours: Number(e.target.value),
})
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Seuil patients critiques
</div>
<input
type="number"
style={inputStyle}
value={rules.criticalPatientsThreshold}
onChange={(e) =>
updateRules({
criticalPatientsThreshold: Number(e.target.value),
})
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Sortie activable rapide (heures)
</div>
<input
type="number"
style={inputStyle}
value={rules.fastExitThresholdHours}
onChange={(e) =>
updateRules({
fastExitThresholdHours: Number(e.target.value),
})
}
/>
</label>

<label>
<div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
Seuil alerte direction
</div>
<input
type="number"
style={inputStyle}
value={rules.directionAlertThreshold}
onChange={(e) =>
updateRules({
directionAlertThreshold: Number(e.target.value),
})
}
/>
</label>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 12,
}}
>
<div style={subtlePanel}>
<div
style={{
fontSize: 12,
color: "#64748b",
marginBottom: 6,
textTransform: "uppercase",
letterSpacing: "0.03em",
fontWeight: 700,
}}
>
Résumé
</div>
<div style={{ display: "grid", gap: 6, color: "#334155" }}>
<div>DMS d’alerte à partir de J+{rules.dmsThreshold}</div>
<div>Fenêtre récupération : {formatHours(rules.recoveryWindowHours)}</div>
<div>Sortie rapide : {formatHours(rules.fastExitThresholdHours)}</div>
</div>
</div>

<div style={subtlePanel}>
<div
style={{
fontSize: 12,
color: "#64748b",
marginBottom: 6,
textTransform: "uppercase",
letterSpacing: "0.03em",
fontWeight: 700,
}}
>
Impact métier
</div>
<div style={{ display: "grid", gap: 6, color: "#334155" }}>
<div>Patients critiques : seuil {rules.criticalPatientsThreshold}</div>
<div>Jours évitables cible : {rules.avoidableDaysTarget}</div>
<div>Alerte direction : {rules.directionAlertThreshold}</div>
</div>
</div>
</div>
</div>
)}

{settingsTab === "bio" && (
<div style={{ display: "grid", gap: 16 }}>
<div>
<h3 style={{ margin: "0 0 6px" }}>Bio-nettoyage</h3>
<p style={{ margin: 0, color: "#6b7280", maxWidth: 760 }}>
Paramètre les situations de nettoyage utilisées pour estimer la
remise en disponibilité des lits, chambres et zones annexes.
</p>
</div>




<BioCleaningSettings
value={bioCleaningSettings}
onChange={updateBioCleaning}
/>
</div>
)}
</section>
</div>
);
}
