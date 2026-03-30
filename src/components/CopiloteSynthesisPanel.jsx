import React, { useEffect, useState } from "react";
import {
SYNTHESIS_TYPES,
buildSynthesisByType,
} from "../copilote/synthesisEngine";

function panelStyle() {
return {
background: "#ffffff",
border: "1px solid #e6ebf2",
borderRadius: 18,
padding: 16,
boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
display: "grid",
gap: 14,
};
}

function titleStyle() {
return {
margin: 0,
fontSize: 16,
fontWeight: 900,
color: "#17376a",
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
minHeight: 36,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "8px 10px",
fontSize: 12,
background: "#ffffff",
color: "#0f172a",
outline: "none",
fontFamily: "inherit",
boxSizing: "border-box",
};
}

function textareaStyle(rows = 12) {
return {
width: "100%",
minHeight: rows * 22,
borderRadius: 12,
border: "1px solid #d6deea",
padding: "10px 12px",
fontSize: 12,
background: "#ffffff",
color: "#0f172a",
outline: "none",
fontFamily: "inherit",
resize: "vertical",
boxSizing: "border-box",
lineHeight: 1.5,
};
}

function buttonStyle(kind = "secondary") {
const map = {
primary: {
background: "#1d4b8f",
color: "#ffffff",
border: "1px solid #1d4b8f",
},
secondary: {
background: "#ffffff",
color: "#17376a",
border: "1px solid #cdd8ea",
},
success: {
background: "#edf8f2",
color: "#237a53",
border: "1px solid #c8e8d3",
},
};

return {
minHeight: 34,
padding: "0 12px",
borderRadius: 10,
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
...(map[kind] || map.secondary),
};
}

function badgeStyle() {
return {
display: "inline-flex",
alignItems: "center",
minHeight: 24,
padding: "0 8px",
borderRadius: 999,
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
fontSize: 11,
fontWeight: 800,
};
}

export default function CopiloteSynthesisPanel({
patient,
decision,
bestResource,
rankedResources = [],
freeCriteria = [],
automaticActions = [],
hdjDraft = null,
synthesisHistory = [],
onSaveSynthesis,
}) {
const [selectedType, setSelectedType] = useState("decision");
const [draftText, setDraftText] = useState("");
const [copyState, setCopyState] = useState("");

useEffect(() => {
const generated = buildSynthesisByType({
type: selectedType,
patient,
decision,
bestResource,
rankedResources,
freeCriteria,
automaticActions,
hdjDraft,
});

setDraftText(generated);
}, [
selectedType,
patient,
decision,
bestResource,
rankedResources,
freeCriteria,
automaticActions,
hdjDraft,
]);

async function handleCopy() {
try {
await navigator.clipboard.writeText(draftText);
setCopyState("Copié");
setTimeout(() => setCopyState(""), 1500);
} catch {
setCopyState("Copie impossible");
setTimeout(() => setCopyState(""), 1500);
}
}

function handleRegenerate() {
const generated = buildSynthesisByType({
type: selectedType,
patient,
decision,
bestResource,
rankedResources,
freeCriteria,
automaticActions,
hdjDraft,
});

setDraftText(generated);
}

function handleSave() {
const payload = {
id: `syn_${Date.now()}`,
type: selectedType,
title:
SYNTHESIS_TYPES.find((item) => item.value === selectedType)?.label ||
"Synthèse",
createdAt: new Date().toISOString(),
content: draftText,
};

onSaveSynthesis?.(payload);
}

return (
<section style={panelStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "center",
flexWrap: "wrap",
}}
>
<h2 style={titleStyle()}>Générateur de synthèse</h2>
<div style={badgeStyle()}>
{synthesisHistory.length} synthèse(s) historisée(s)
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "280px 1fr",
gap: 14,
alignItems: "start",
}}
>
<div style={{ display: "grid", gap: 12 }}>
<div style={{ display: "grid", gap: 6 }}>
<div style={labelStyle()}>Type de synthèse</div>
<select
value={selectedType}
onChange={(e) => setSelectedType(e.target.value)}
style={inputStyle()}
>
{SYNTHESIS_TYPES.map((item) => (
<option key={item.value} value={item.value}>
{item.label}
</option>
))}
</select>
</div>

<div
style={{
border: "1px solid #eef2f7",
borderRadius: 12,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 8,
}}
>
<div style={labelStyle()}>Prévisualisation contexte</div>
<div style={{ fontSize: 12, color: "#475569" }}>
Patient : <strong>{patient?.nom} {patient?.prenom}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569" }}>
Orientation : <strong>{decision?.proposedOrientation || "À définir"}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569" }}>
Ressource : <strong>{bestResource?.label || "Aucune mise en avant"}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569" }}>
Actions : <strong>{automaticActions.length}</strong>
</div>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button type="button" style={buttonStyle("primary")} onClick={handleRegenerate}>
Régénérer
</button>
<button type="button" style={buttonStyle("secondary")} onClick={handleCopy}>
Copier
</button>
<button type="button" style={buttonStyle("success")} onClick={handleSave}>
Historiser
</button>
</div>

{copyState ? (
<div style={{ fontSize: 12, color: "#64748b" }}>{copyState}</div>
) : null}

<div
style={{
border: "1px solid #eef2f7",
borderRadius: 12,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 8,
}}
>
<div style={labelStyle()}>Historique récent</div>
{synthesisHistory.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucune synthèse historisée.
</div>
) : (
synthesisHistory.slice(0, 5).map((item) => (
<button
key={item.id}
type="button"
onClick={() => {
setSelectedType(item.type);
setDraftText(item.content);
}}
style={{
textAlign: "left",
border: "1px solid #eef2f7",
borderRadius: 10,
padding: 10,
background: "#ffffff",
cursor: "pointer",
display: "grid",
gap: 4,
}}
>
<div style={{ fontSize: 12, fontWeight: 800, color: "#17376a" }}>
{item.title}
</div>
<div style={{ fontSize: 11, color: "#64748b" }}>
{item.createdAt?.slice(0, 10)}
</div>
</button>
))
)}
</div>
</div>

<div style={{ display: "grid", gap: 8 }}>
<div style={labelStyle()}>Texte généré</div>
<textarea
value={draftText}
onChange={(e) => setDraftText(e.target.value)}
style={textareaStyle(20)}
/>
</div>
</div>
</section>
);
}