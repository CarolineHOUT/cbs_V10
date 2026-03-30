import React, { useMemo, useState } from "react";
import {
HDJ_CATALOG,
HDJ_FREQUENCIES,
HDJ_DURATIONS,
HDJ_PRIORITIES,
HDJ_WEEKDAYS,
createHDJDraftFromTemplate,
toggleHDJWeekday,
buildHDJSecretaryMessage,
addCustomHDJTemplate,
frequencyLabelFromValue,
durationLabelFromValue,
priorityLabelFromValue,
} from "../data/hdjCatalogModel";

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

function eyebrowStyle() {
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

function textareaStyle(rows = 4) {
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
danger: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
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
green: {
background: "#edf8f2",
color: "#237a53",
border: "1px solid #c8e8d3",
},
violet: {
background: "#f5f3ff",
color: "#6d28d9",
border: "1px solid #ddd6fe",
},
};

return {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
minHeight: 24,
padding: "0 8px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
whiteSpace: "nowrap",
...(map[kind] || map.neutral),
};
}

export default function HDJCatalogPanel({
patient,
onSaveDraft,
onSendToSecretariat,
hdjHistory = [],
}) {
const [catalog, setCatalog] = useState(HDJ_CATALOG);
const [selectedTemplateId, setSelectedTemplateId] = useState("");
const [draft, setDraft] = useState(null);
const [secretaryMessage, setSecretaryMessage] = useState("");
const [showCustomForm, setShowCustomForm] = useState(false);

const [customTemplate, setCustomTemplate] = useState({
title: "",
description: "",
indications: "",
tags: "",
targetSecretariat: "",
});

const selectedTemplate = useMemo(() => {
return catalog.find((item) => item.id === selectedTemplateId) || null;
}, [catalog, selectedTemplateId]);

function selectTemplate(template) {
setSelectedTemplateId(template.id);
const nextDraft = createHDJDraftFromTemplate(template, patient);
setDraft(nextDraft);
setSecretaryMessage("");
}

function updateDraftProgramming(field, value) {
setDraft((prev) => {
if (!prev) return prev;
return {
...prev,
programming: {
...prev.programming,
[field]: value,
},
};
});
}

function updateDraftComment(value) {
setDraft((prev) => {
if (!prev) return prev;
return {
...prev,
comment: value,
};
});
}

function handleToggleWeekday(day) {
setDraft((prev) => {
if (!prev) return prev;
return {
...prev,
programming: {
...prev.programming,
weekdays: toggleHDJWeekday(prev.programming?.weekdays || [], day),
},
};
});
}

function handleGenerateSecretaryMessage() {
if (!draft) return;
const message = buildHDJSecretaryMessage({ patient, draft });
setSecretaryMessage(message);
}

function handleSaveDraft() {
if (!draft) return;

const payload = {
...draft,
status: "saved",
savedAt: new Date().toISOString(),
message: secretaryMessage || buildHDJSecretaryMessage({ patient, draft }),
};

onSaveDraft?.(payload);
}

function handleSendToSecretariat() {
if (!draft) return;

const payload = {
...draft,
status: "sent",
sentAt: new Date().toISOString(),
message: secretaryMessage || buildHDJSecretaryMessage({ patient, draft }),
};

onSendToSecretariat?.(payload);
}

function handleAddCustomTemplate() {
const nextCatalog = addCustomHDJTemplate({
existingCatalog: catalog,
title: customTemplate.title,
description: customTemplate.description,
indications: customTemplate.indications
.split(",")
.map((item) => item.trim())
.filter(Boolean),
tags: customTemplate.tags
.split(",")
.map((item) => item.trim())
.filter(Boolean),
defaultActs: [],
targetSecretariat: customTemplate.targetSecretariat || "HDJ à préciser",
});

setCatalog(nextCatalog);
setShowCustomForm(false);
setCustomTemplate({
title: "",
description: "",
indications: "",
tags: "",
targetSecretariat: "",
});
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
<h2 style={titleStyle()}>Carnets HDJ</h2>
<div style={badgeStyle("blue")}>
{hdjHistory.length} HDJ historisé(s)
</div>
</div>

<div style={{ display: "grid", gap: 10 }}>
<div style={eyebrowStyle()}>Propositions de carnets</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
gap: 10,
}}
>
{catalog.map((template) => {
const selected = selectedTemplateId === template.id;

return (
<button
key={template.id}
type="button"
onClick={() => selectTemplate(template)}
style={{
textAlign: "left",
border: selected
? "1px solid #1d4b8f"
: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: selected ? "#eef4ff" : "#fbfcfe",
cursor: "pointer",
display: "grid",
gap: 8,
}}
>
<div style={{ fontSize: 13, fontWeight: 900, color: "#17376a" }}>
{template.title}
</div>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
{template.description}
</div>

<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{(template.tags || []).map((tag) => (
<span key={`${template.id}-${tag}`} style={badgeStyle("violet")}>
{tag}
</span>
))}
</div>
</button>
);
})}
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button
type="button"
style={buttonStyle("secondary")}
onClick={() => setShowCustomForm((prev) => !prev)}
>
{showCustomForm ? "Masquer ajout carnet" : "Ajouter un carnet"}
</button>
</div>

{showCustomForm ? (
<div
style={{
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 10,
}}
>
<div style={eyebrowStyle()}>Nouveau carnet personnalisé</div>

<input
style={inputStyle()}
placeholder="Titre du carnet"
value={customTemplate.title}
onChange={(e) =>
setCustomTemplate((prev) => ({ ...prev, title: e.target.value }))
}
/>

<textarea
style={textareaStyle(4)}
placeholder="Description"
value={customTemplate.description}
onChange={(e) =>
setCustomTemplate((prev) => ({
...prev,
description: e.target.value,
}))
}
/>

<input
style={inputStyle()}
placeholder="Indications (séparées par des virgules)"
value={customTemplate.indications}
onChange={(e) =>
setCustomTemplate((prev) => ({
...prev,
indications: e.target.value,
}))
}
/>

<input
style={inputStyle()}
placeholder="Tags (séparés par des virgules)"
value={customTemplate.tags}
onChange={(e) =>
setCustomTemplate((prev) => ({ ...prev, tags: e.target.value }))
}
/>

<input
style={inputStyle()}
placeholder="Secrétariat cible"
value={customTemplate.targetSecretariat}
onChange={(e) =>
setCustomTemplate((prev) => ({
...prev,
targetSecretariat: e.target.value,
}))
}
/>

<div>
<button
type="button"
style={buttonStyle("primary")}
onClick={handleAddCustomTemplate}
>
Enregistrer le carnet
</button>
</div>
</div>
) : null}
</div>

{draft ? (
<div style={{ display: "grid", gap: 14 }}>
<div
style={{
border: "1px solid #dbe7ff",
borderRadius: 14,
padding: 12,
background: "#f8fbff",
display: "grid",
gap: 8,
}}
>
<div style={eyebrowStyle()}>Carnet sélectionné</div>
<div style={{ fontSize: 15, fontWeight: 900, color: "#17376a" }}>
{draft.title}
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
{draft.description}
</div>

{Array.isArray(draft.acts) && draft.acts.length > 0 ? (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{draft.acts.map((item, index) => (
<span key={`${item.label}-${index}`} style={badgeStyle("blue")}>
{item.label}
</span>
))}
</div>
) : (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun acte prédéfini pour ce carnet.
</div>
)}
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 14,
alignItems: "start",
}}
>
<div
style={{
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 10,
}}
>
<div style={eyebrowStyle()}>Programmation</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Date souhaitée de début
</div>
<input
type="date"
style={inputStyle()}
value={draft.programming?.startDate || ""}
onChange={(e) =>
updateDraftProgramming("startDate", e.target.value)
}
/>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Fréquence
</div>
<select
style={inputStyle()}
value={draft.programming?.frequency || "weekly"}
onChange={(e) =>
updateDraftProgramming("frequency", e.target.value)
}
>
{HDJ_FREQUENCIES.map((item) => (
<option key={item.value} value={item.value}>
{item.label}
</option>
))}
</select>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Durée
</div>
<select
style={inputStyle()}
value={draft.programming?.duration || "2_weeks"}
onChange={(e) =>
updateDraftProgramming("duration", e.target.value)
}
>
{HDJ_DURATIONS.map((item) => (
<option key={item.value} value={item.value}>
{item.label}
</option>
))}
</select>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Priorité
</div>
<select
style={inputStyle()}
value={draft.programming?.priority || "normale"}
onChange={(e) =>
updateDraftProgramming("priority", e.target.value)
}
>
{HDJ_PRIORITIES.map((item) => (
<option key={item.value} value={item.value}>
{item.label}
</option>
))}
</select>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
Jours souhaités
</div>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{HDJ_WEEKDAYS.map((day) => {
const active = draft.programming?.weekdays?.includes(day);

return (
<button
key={day}
type="button"
onClick={() => handleToggleWeekday(day)}
style={{
minHeight: 30,
padding: "0 10px",
borderRadius: 999,
border: active
? "1px solid #1d4b8f"
: "1px solid #d6deea",
background: active ? "#eef4ff" : "#ffffff",
color: active ? "#1d4b8f" : "#334155",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
}}
>
{day}
</button>
);
})}
</div>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Commentaire
</div>
<textarea
style={textareaStyle(4)}
value={draft.comment || ""}
onChange={(e) => updateDraftComment(e.target.value)}
placeholder="Objectif du carnet, contexte, précisions organisationnelles..."
/>
</div>
</div>

<div
style={{
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 10,
}}
>
<div style={eyebrowStyle()}>Résumé de programmation</div>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Début souhaité :{" "}
<strong>{draft.programming?.startDate || "À préciser"}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Fréquence :{" "}
<strong>{frequencyLabelFromValue(draft.programming?.frequency)}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Durée :{" "}
<strong>{durationLabelFromValue(draft.programming?.duration)}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Priorité :{" "}
<strong>{priorityLabelFromValue(draft.programming?.priority)}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Jours :{" "}
<strong>
{draft.programming?.weekdays?.length > 0
? draft.programming.weekdays.join(", ")
: "Non précisés"}
</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Secrétariat cible :{" "}
<strong>{draft.targetSecretariat || "À préciser"}</strong>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button
type="button"
style={buttonStyle("secondary")}
onClick={handleGenerateSecretaryMessage}
>
Générer message secrétariat
</button>

<button
type="button"
style={buttonStyle("primary")}
onClick={handleSaveDraft}
>
Enregistrer brouillon
</button>

<button
type="button"
style={buttonStyle("success")}
onClick={handleSendToSecretariat}
>
Envoyer au secrétariat
</button>
</div>
</div>
</div>

{secretaryMessage ? (
<div
style={{
border: "1px solid #dbe7ff",
borderRadius: 14,
padding: 12,
background: "#eef4ff",
display: "grid",
gap: 8,
}}
>
<div style={eyebrowStyle()}>Message prêt à envoyer</div>
<textarea readOnly value={secretaryMessage} style={textareaStyle(12)} />
</div>
) : null}

<div
style={{
border: "1px solid #eef2f7",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 8,
}}
>
<div style={eyebrowStyle()}>Historique HDJ</div>

{hdjHistory.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun HDJ historisé pour le moment.
</div>
) : (
hdjHistory.slice(0, 5).map((item) => (
<div
key={item.id}
style={{
border: "1px solid #eef2f7",
borderRadius: 10,
padding: 10,
background: "#ffffff",
display: "grid",
gap: 4,
}}
>
<div style={{ fontSize: 12, fontWeight: 800, color: "#17376a" }}>
{item.title}
</div>
<div style={{ fontSize: 11, color: "#64748b" }}>
{item.savedAt?.slice(0, 10) ||
item.sentAt?.slice(0, 10) ||
"Date inconnue"}
</div>
<div style={{ fontSize: 11, color: "#475569" }}>
{frequencyLabelFromValue(item.programming?.frequency)} •{" "}
{durationLabelFromValue(item.programming?.duration)}
</div>
</div>
))
)}
</div>
</div>
) : null}
</section>
);
}