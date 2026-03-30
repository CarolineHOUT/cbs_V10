import React from "react";
import { useCrisisCenter } from "../context/CrisisCenterContext";

function overlayStyle() {
return {
position: "fixed",
inset: 0,
background: "rgba(15, 23, 42, 0.28)",
zIndex: 1000,
display: "flex",
justifyContent: "flex-end",
};
}

function drawerStyle() {
return {
width: "min(560px, 100vw)",
height: "100vh",
background: "#ffffff",
boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.18)",
display: "grid",
gridTemplateRows: "auto 1fr auto",
};
}

function sectionStyle() {
return {
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 8,
};
}

function labelStyle() {
return {
fontSize: 11,
fontWeight: 800,
color: "#64748b",
textTransform: "uppercase",
letterSpacing: 0.2,
};
}

function inputStyle() {
return {
width: "100%",
minHeight: 38,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "8px 10px",
fontSize: 12,
background: "#ffffff",
outline: "none",
fontFamily: "inherit",
};
}

function buttonStyle(kind = "secondary") {
const map = {
primary: {
background: "#b42318",
color: "#ffffff",
border: "1px solid #b42318",
},
secondary: {
background: "#ffffff",
color: "#17376a",
border: "1px solid #cdd8ea",
},
soft: {
background: "#f8fafc",
color: "#334155",
border: "1px solid #e2e8f0",
},
};

return {
height: 34,
padding: "0 12px",
borderRadius: 10,
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
...map[kind],
};
}

function badgeStyle(kind = "neutral") {
const map = {
neutral: {
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
},
blue: {
background: "#eef4ff",
color: "#1d4b8f",
border: "1px solid #d6e4ff",
},
amber: {
background: "#fff8e8",
color: "#a16207",
border: "1px solid #f6df9b",
},
red: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
},
};

return {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
minHeight: 24,
padding: "0 8px",
borderRadius: 999,
fontSize: 10,
fontWeight: 800,
whiteSpace: "nowrap",
...map[kind],
};
}

export default function CrisisCellDrawer() {
const {
isCrisisOpen,
draft,
setDraft,
addLog,
addParticipant,
toggleParticipant,
closeCrisisCell,
} = useCrisisCenter();

if (!isCrisisOpen) return null;

function updateField(key, value) {
setDraft((prev) => ({
...prev,
[key]: value,
}));
}

function updateAgenda(index, value) {
setDraft((prev) => ({
...prev,
agenda: prev.agenda.map((item, i) => (i === index ? value : item)),
}));
}

function addAgendaItem() {
setDraft((prev) => ({
...prev,
agenda: [...prev.agenda, ""],
}));
}

function addDecision() {
setDraft((prev) => ({
...prev,
decisions: [
...prev.decisions,
{
id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
action: "",
owner: "",
due: "",
status: "À faire",
},
],
}));
}

function updateDecision(id, key, value) {
setDraft((prev) => ({
...prev,
decisions: prev.decisions.map((d) =>
d.id === id ? { ...d, [key]: value } : d
),
}));
}

function removeDecision(id) {
setDraft((prev) => ({
...prev,
decisions: prev.decisions.filter((d) => d.id !== id),
}));
}

function addManualParticipant(role) {
const labelMap = {
direction: "Direction",
parcours: "Responsable parcours patient",
autre_service: "Autre service",
libre: "Participant à compléter",
};

addParticipant({
id: `${role}-${Date.now()}`,
name: labelMap[role] || "Participant",
role:
role === "direction"
? "Direction"
: role === "parcours"
? "Parcours patient"
: role === "autre_service"
? "Autre service"
: "Libre",
selected: true,
});
}

function launchCrisisCell() {
addLog("Cellule de crise lancée");
alert("Cellule de crise lancée.");
closeCrisisCell();
}
function launchCrisisCell() {
addLog("Cellule de crise lancée");
alert("Cellule de crise lancée.");
closeCrisisCell();
}
return (
<div style={overlayStyle()} onClick={closeCrisisCell}>
<div style={drawerStyle()} onClick={(e) => e.stopPropagation()}>
<div
style={{
padding: 16,
borderBottom: "1px solid #e6ebf2",
display: "grid",
gap: 6,
}}
>
<div style={{ fontSize: 18, fontWeight: 900, color: "#991b1b" }}>
Cellule de crise
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
{draft.patient
? `${draft.patient.nom} ${draft.patient.prenom} • ${draft.patient.service}`
: "Sans patient pré-sélectionné"}
</div>

<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{draft.scenarioType ? (
<span style={badgeStyle("red")}>{draft.scenarioType}</span>
) : null}
{draft.patient?.severity || draft.patient?.gravite ? (
<span style={badgeStyle("amber")}>
{draft.patient?.severity || draft.patient?.gravite}
</span>
) : null}
{draft.patient?.orientation ? (
<span style={badgeStyle("blue")}>{draft.patient.orientation}</span>
) : null}
</div>
</div>

<div style={{ overflow: "auto", padding: 16, display: "grid", gap: 12 }}>
<section style={sectionStyle()}>
<div style={labelStyle()}>Contexte</div>

{draft.patient ? (
<div style={{ display: "grid", gap: 4, fontSize: 12, color: "#172554" }}>
<div>
<strong>Patient :</strong> {draft.patient.nom} {draft.patient.prenom}
</div>
<div>
<strong>Service :</strong> {draft.patient.service}
</div>
<div>
<strong>Chambre :</strong> {draft.patient.chambre} • <strong>Lit :</strong>{" "}
{draft.patient.lit}
</div>
<div>
<strong>Frein :</strong>{" "}
{draft.patient.blockReason || draft.patient.blocage || "—"}
</div>
</div>
) : null}

<textarea
style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
value={draft.contextText}
onChange={(e) => updateField("contextText", e.target.value)}
/>
</section>

<section style={sectionStyle()}>
<div style={labelStyle()}>Motifs</div>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{draft.reasonTags.map((tag) => (
<span key={tag} style={badgeStyle("neutral")}>
{tag}
</span>
))}
</div>
</section>

<section style={sectionStyle()}>
<div style={labelStyle()}>Participants proposés</div>

<div style={{ display: "grid", gap: 8 }}>
{draft.participants.map((p) => (
<label
key={p.id}
style={{
display: "grid",
gridTemplateColumns: "auto 1fr auto",
gap: 8,
alignItems: "center",
fontSize: 12,
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: "8px 10px",
background: "#ffffff",
}}
>
<input
type="checkbox"
checked={p.selected}
onChange={() => toggleParticipant(p.id)}
/>
<span style={{ fontWeight: 700, color: "#172554" }}>{p.name}</span>
<span style={{ color: "#64748b" }}>{p.role}</span>
</label>
))}
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
<button
type="button"
style={buttonStyle("soft")}
onClick={() => addManualParticipant("parcours")}
>
+ Responsable parcours patient
</button>
<button
type="button"
style={buttonStyle("soft")}
onClick={() => addManualParticipant("direction")}
>
+ Direction
</button>
<button
type="button"
style={buttonStyle("soft")}
onClick={() => addManualParticipant("autre_service")}
>
+ Autre service
</button>
<button
type="button"
style={buttonStyle("soft")}
onClick={() => addManualParticipant("libre")}
>
+ Participant libre
</button>
</div>
</section>

<section style={sectionStyle()}>
<div style={labelStyle()}>Planification</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
<input
type="date"
style={inputStyle()}
value={draft.date}
onChange={(e) => updateField("date", e.target.value)}
/>
<input
type="time"
style={inputStyle()}
value={draft.time}
onChange={(e) => updateField("time", e.target.value)}
/>
</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
<select
style={inputStyle()}
value={draft.duration}
onChange={(e) => updateField("duration", e.target.value)}
>
<option>15 min</option>
<option>30 min</option>
<option>45 min</option>
<option>60 min</option>
</select>

<select
style={inputStyle()}
value={draft.mode}
onChange={(e) => updateField("mode", e.target.value)}
>
<option>Présentiel</option>
<option>Visio</option>
</select>
</div>
</section>

<section style={sectionStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 8,
}}
>
<div style={labelStyle()}>Ordre du jour</div>
<button type="button" style={buttonStyle("soft")} onClick={addAgendaItem}>
+ Ajouter
</button>
</div>

<div style={{ display: "grid", gap: 8 }}>
{draft.agenda.map((item, index) => (
<input
key={index}
style={inputStyle()}
value={item}
onChange={(e) => updateAgenda(index, e.target.value)}
/>
))}
</div>
</section>

<section style={sectionStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 8,
}}
>
<div style={labelStyle()}>Décisions / actions</div>
<button type="button" style={buttonStyle("soft")} onClick={addDecision}>
+ Ajouter
</button>
</div>

<div style={{ display: "grid", gap: 8 }}>
{draft.decisions.map((decision) => (
<div
key={decision.id}
style={{
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: 10,
background: "#ffffff",
display: "grid",
gap: 8,
}}
>
<input
style={inputStyle()}
placeholder="Action"
value={decision.action}
onChange={(e) =>
updateDecision(decision.id, "action", e.target.value)
}
/>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
<input
style={inputStyle()}
placeholder="Responsable"
value={decision.owner}
onChange={(e) =>
updateDecision(decision.id, "owner", e.target.value)
}
/>
<input
style={inputStyle()}
placeholder="Échéance"
value={decision.due}
onChange={(e) =>
updateDecision(decision.id, "due", e.target.value)
}
/>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "1fr auto",
gap: 8,
alignItems: "center",
}}
>
<select
style={inputStyle()}
value={decision.status}
onChange={(e) =>
updateDecision(decision.id, "status", e.target.value)
}
>
<option>À faire</option>
<option>En cours</option>
<option>Fait</option>
</select>

<button
type="button"
style={buttonStyle("secondary")}
onClick={() => removeDecision(decision.id)}
>
Retirer
</button>
</div>
</div>
))}
</div>
</section>

<section style={sectionStyle()}>
<div style={labelStyle()}>Historique rapide</div>
<div style={{ display: "grid", gap: 4 }}>
{draft.logs.length === 0 ? (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucun historique.
</div>
) : (
draft.logs.map((log) => (
<div key={log.id} style={{ fontSize: 12, color: "#475569" }}>
{log.time} — {log.text}
</div>
))
)}
</div>
</section>
</div>

<div
style={{
padding: 16,
borderTop: "1px solid #e6ebf2",
display: "flex",
justifyContent: "space-between",
gap: 10,
}}
>
<button
type="button"
style={buttonStyle("secondary")}
onClick={closeCrisisCell}
>
Annuler
</button>

<button
type="button"
style={buttonStyle("primary")}
onClick={launchCrisisCell}
>
Lancer la cellule de crise
</button>
</div>
</div>
</div>
);
}