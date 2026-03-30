import React, { useEffect, useMemo, useState } from "react";
import {
HDJ_ACTS_CATALOG,
HDJ_FREQUENCIES,
HDJ_DURATIONS,
HDJ_PRIORITIES,
HDJ_WEEKDAYS,
frequencyLabelFromValue,
durationLabelFromValue,
priorityLabelFromValue,
toggleHDJAct,
toggleHDJWeekday,
createEmptyHDJDraft,
buildHDJSecretaryMessage,
} from "../data/hdjActsCatalog";
import AccordionSection from "./AccordionSection";

const FAVORITES_STORAGE_KEY = "carabbas_hdj_favorite_acts";

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
red: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
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

function selectedActRowStyle() {
return {
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: 10,
background: "#ffffff",
display: "grid",
gridTemplateColumns: "1fr auto",
gap: 8,
alignItems: "center",
};
}

function compactActButtonStyle(active) {
return {
minHeight: 30,
padding: "0 10px",
borderRadius: 999,
border: active ? "1px solid #1d4b8f" : "1px solid #d6deea",
background: active ? "#eef4ff" : "#ffffff",
color: active ? "#1d4b8f" : "#334155",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
whiteSpace: "nowrap",
};
}

function smallIconButtonStyle(active = false) {
return {
minWidth: 28,
height: 28,
borderRadius: 999,
border: active ? "1px solid #f6df9b" : "1px solid #d6deea",
background: active ? "#fff8e8" : "#ffffff",
color: active ? "#a16207" : "#64748b",
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
};
}

function normalizeText(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}

function readFavoriteIds() {
try {
const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
if (!raw) return [];
const parsed = JSON.parse(raw);
return Array.isArray(parsed) ? parsed : [];
} catch {
return [];
}
}

export default function HDJBuilderPanel({
patient,
hdjHistory = [],
onSaveDraft,
onSendToSecretariat,
}) {
const [draft, setDraft] = useState(() => createEmptyHDJDraft(patient));
const [secretaryMessage, setSecretaryMessage] = useState("");
const [manualActLabel, setManualActLabel] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [favoriteActIds, setFavoriteActIds] = useState(() => readFavoriteIds());

useEffect(() => {
setDraft((prev) => ({
...prev,
patientId: patient?.id || "",
patientLabel: patient
? `${patient.nom || ""} ${patient.prenom || ""}`.trim()
: "",
}));
}, [patient]);

useEffect(() => {
try {
window.localStorage.setItem(
FAVORITES_STORAGE_KEY,
JSON.stringify(favoriteActIds)
);
} catch {
// ignore
}
}, [favoriteActIds]);

const actsByFamily = useMemo(() => {
return HDJ_ACTS_CATALOG.reduce((acc, act) => {
const family = act.family || "Autres";
if (!acc[family]) acc[family] = [];
acc[family].push(act);
return acc;
}, {});
}, []);

const selectedActs = draft.acts || [];

const familyCountMap = useMemo(() => {
const counts = {};
Object.keys(actsByFamily).forEach((family) => {
counts[family] = 0;
});

selectedActs.forEach((selectedAct) => {
const sourceAct = HDJ_ACTS_CATALOG.find((item) => item.id === selectedAct.id);
const family = sourceAct?.family || selectedAct.family || "Autres";
counts[family] = (counts[family] || 0) + 1;
});

return counts;
}, [actsByFamily, selectedActs]);

const filteredActsByFamily = useMemo(() => {
const query = normalizeText(searchTerm);
if (!query) return actsByFamily;

const next = {};

Object.entries(actsByFamily).forEach(([family, acts]) => {
const filtered = acts.filter((act) => {
const haystack = [
act.label,
act.description,
...(act.tags || []),
family,
]
.map(normalizeText)
.join(" ");

return haystack.includes(query);
});

if (filtered.length > 0) {
next[family] = filtered;
}
});

return next;
}, [actsByFamily, searchTerm]);

const favoriteActs = useMemo(() => {
return HDJ_ACTS_CATALOG.filter((act) => favoriteActIds.includes(act.id));
}, [favoriteActIds]);

const mostUsedActs = useMemo(() => {
const counts = {};

(hdjHistory || []).forEach((entry) => {
(entry.acts || []).forEach((act) => {
if (!act?.id) return;
counts[act.id] = (counts[act.id] || 0) + 1;
});
});

return HDJ_ACTS_CATALOG.map((act) => ({
...act,
usageCount: counts[act.id] || 0,
}))
.filter((act) => act.usageCount > 0)
.sort((a, b) => b.usageCount - a.usageCount)
.slice(0, 8);
}, [hdjHistory]);

function updateDraft(field, value) {
setDraft((prev) => ({
...prev,
[field]: value,
}));
}

function updateProgramming(field, value) {
setDraft((prev) => ({
...prev,
programming: {
...prev.programming,
[field]: value,
},
}));
}

function handleToggleAct(act) {
setDraft((prev) => ({
...prev,
acts: toggleHDJAct(prev.acts || [], act),
}));
}

function handleToggleWeekday(day) {
setDraft((prev) => ({
...prev,
programming: {
...prev.programming,
weekdays: toggleHDJWeekday(prev.programming?.weekdays || [], day),
},
}));
}

function handleAddManualAct() {
const label = manualActLabel.trim();
if (!label) return;

const nextAct = {
id: `manual_act_${Date.now()}`,
label,
family: "Actes libres",
description: "",
tags: [],
isManual: true,
};

setDraft((prev) => ({
...prev,
acts: [...(prev.acts || []), nextAct],
}));

setManualActLabel("");
}

function handleUpdateSelectedAct(actId, value) {
setDraft((prev) => ({
...prev,
acts: (prev.acts || []).map((act) =>
act.id === actId ? { ...act, label: value } : act
),
}));
}

function handleRemoveSelectedAct(actId) {
setDraft((prev) => ({
...prev,
acts: (prev.acts || []).filter((act) => act.id !== actId),
}));
}

function handleGenerateSecretaryMessage() {
setSecretaryMessage(buildHDJSecretaryMessage({ patient, draft }));
}

function handleSaveDraft() {
const payload = {
...draft,
status: "saved",
savedAt: new Date().toISOString(),
message: secretaryMessage || buildHDJSecretaryMessage({ patient, draft }),
};
onSaveDraft?.(payload);
}

function handleSendToSecretariat() {
const payload = {
...draft,
status: "sent",
sentAt: new Date().toISOString(),
message: secretaryMessage || buildHDJSecretaryMessage({ patient, draft }),
};
onSendToSecretariat?.(payload);
}

function handleReset() {
setDraft(createEmptyHDJDraft(patient));
setSecretaryMessage("");
setManualActLabel("");
setSearchTerm("");
}

function toggleFavorite(actId) {
setFavoriteActIds((prev) =>
prev.includes(actId)
? prev.filter((id) => id !== actId)
: [actId, ...prev]
);
}

function renderActChip(act, extraBadge = null) {
const active = selectedActs.some((item) => item.id === act.id);
const favorite = favoriteActIds.includes(act.id);

return (
<div
key={act.id}
style={{
display: "inline-flex",
alignItems: "center",
gap: 6,
}}
>
<button
type="button"
onClick={() => handleToggleAct(act)}
style={compactActButtonStyle(active)}
>
{act.label}
</button>

<button
type="button"
onClick={() => toggleFavorite(act.id)}
style={smallIconButtonStyle(favorite)}
title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
>
★
</button>

{extraBadge}
</div>
);
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
<h2 style={titleStyle()}>Programmation HDJ par actes</h2>
<div style={badgeStyle("blue")}>{hdjHistory.length} HDJ historisé(s)</div>
</div>

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
<div style={eyebrowStyle()}>Construction manuelle</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
L’agent sélectionne et programme des actes multiples. Les parcours
seront capitalisés plus tard à partir des usages réels, mais cet écran
reste centré sur les actes.
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "1.1fr 0.9fr",
gap: 14,
alignItems: "start",
}}
>
<div style={{ display: "grid", gap: 10 }}>
<AccordionSection
title="Actes sélectionnés"
subtitle="Actes qui seront programmés dans la demande HDJ"
badge={`${selectedActs.length} acte(s)`}
defaultOpen={false}
>
<div style={{ display: "grid", gap: 10 }}>
<div
style={{
display: "grid",
gridTemplateColumns: "1fr auto",
gap: 8,
alignItems: "center",
}}
>
<input
style={inputStyle()}
value={manualActLabel}
onChange={(e) => setManualActLabel(e.target.value)}
placeholder="Ajouter un acte librement"
/>
<button
type="button"
style={buttonStyle("primary")}
onClick={handleAddManualAct}
>
Ajouter
</button>
</div>

{selectedActs.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun acte sélectionné pour le moment.
</div>
) : (
<div style={{ display: "grid", gap: 8 }}>
{selectedActs.map((act) => (
<div key={act.id} style={selectedActRowStyle()}>
<input
style={inputStyle()}
value={act.label || ""}
onChange={(e) =>
handleUpdateSelectedAct(act.id, e.target.value)
}
/>

<button
type="button"
style={buttonStyle("danger")}
onClick={() => handleRemoveSelectedAct(act.id)}
>
Supprimer
</button>
</div>
))}
</div>
)}
</div>
</AccordionSection>

<AccordionSection
title="Recherche d’acte"
subtitle="Trouver rapidement un acte dans la bibliothèque"
badge={searchTerm ? "Filtré" : "Global"}
defaultOpen={false}
>
<div style={{ display: "grid", gap: 10 }}>
<input
style={inputStyle()}
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
placeholder="Rechercher un acte, un mot-clé, une famille..."
/>

<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{Object.keys(filteredActsByFamily).length === 0 ? (
<span style={badgeStyle("neutral")}>Aucun résultat</span>
) : (
Object.values(filteredActsByFamily)
.flat()
.slice(0, 20)
.map((act) => renderActChip(act))
)}
</div>
</div>
</AccordionSection>

<AccordionSection
title="Actes favoris"
subtitle="Tes actes favoris pour aller plus vite"
badge={`${favoriteActs.length}`}
defaultOpen={false}
>
{favoriteActs.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun favori enregistré pour le moment.
</div>
) : (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{favoriteActs.map((act) => renderActChip(act))}
</div>
)}
</AccordionSection>

<AccordionSection
title="Actes les plus utilisés"
subtitle="Basé sur l’historique HDJ de ce patient"
badge={`${mostUsedActs.length}`}
defaultOpen={false}
>
{mostUsedActs.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Pas encore assez d’historique pour calculer les actes les plus utilisés.
</div>
) : (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{mostUsedActs.map((act) =>
renderActChip(
act,
<span style={badgeStyle("amber")}>{act.usageCount}</span>
)
)}
</div>
)}
</AccordionSection>

<div style={{ display: "grid", gap: 10 }}>
<div style={eyebrowStyle()}>Bibliothèque d’actes</div>

{Object.entries(filteredActsByFamily).map(([family, acts]) => (
<AccordionSection
key={family}
title={family}
subtitle={`${acts.length} acte(s) disponible(s)`}
badge={`${familyCountMap[family] || 0} sélectionné(s)`}
defaultOpen={false}
>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{acts.map((act) => renderActChip(act))}
</div>
</AccordionSection>
))}

{Object.keys(filteredActsByFamily).length === 0 ? (
<div
style={{
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: 12,
background: "#fbfcfe",
fontSize: 12,
color: "#94a3b8",
}}
>
Aucun acte ne correspond à la recherche.
</div>
) : null}
</div>
</div>

<div style={{ display: "grid", gap: 12 }}>
<AccordionSection
title="Programmation"
subtitle="Paramètres de la demande HDJ"
badge="Actif"
defaultOpen={false}
>
<div style={{ display: "grid", gap: 10 }}>
<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Intitulé de la demande
</div>
<input
style={inputStyle()}
value={draft.title || ""}
onChange={(e) => updateDraft("title", e.target.value)}
placeholder="Ex : Demande HDJ par actes"
/>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Secrétariat cible
</div>
<input
style={inputStyle()}
value={draft.targetSecretariat || ""}
onChange={(e) => updateDraft("targetSecretariat", e.target.value)}
placeholder="Ex : HDJ coordination"
/>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Date souhaitée de début
</div>
<input
type="date"
style={inputStyle()}
value={draft.programming?.startDate || ""}
onChange={(e) => updateProgramming("startDate", e.target.value)}
/>
</div>

<div>
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
Fréquence
</div>
<select
style={inputStyle()}
value={draft.programming?.frequency || "weekly"}
onChange={(e) => updateProgramming("frequency", e.target.value)}
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
onChange={(e) => updateProgramming("duration", e.target.value)}
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
onChange={(e) => updateProgramming("priority", e.target.value)}
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
border: active ? "1px solid #1d4b8f" : "1px solid #d6deea",
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
onChange={(e) => updateDraft("comment", e.target.value)}
placeholder="Objectif clinique, contexte, précision organisationnelle..."
/>
</div>
</div>
</AccordionSection>

<AccordionSection
title="Résumé"
subtitle="Vue synthétique de la demande"
badge={`${selectedActs.length} acte(s)`}
defaultOpen={false}
>
<div style={{ display: "grid", gap: 10 }}>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Actes programmés : <strong>{selectedActs.length}</strong>
</div>

<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{selectedActs.length === 0 ? (
<span style={badgeStyle("neutral")}>Aucun acte sélectionné</span>
) : (
selectedActs.map((act) => (
<span key={act.id} style={badgeStyle("blue")}>
{act.label}
</span>
))
)}
</div>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Début souhaité : <strong>{draft.programming?.startDate || "À préciser"}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Fréquence : <strong>{frequencyLabelFromValue(draft.programming?.frequency)}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Durée : <strong>{durationLabelFromValue(draft.programming?.duration)}</strong>
</div>
<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
Priorité : <strong>{priorityLabelFromValue(draft.programming?.priority)}</strong>
</div>
</div>
</AccordionSection>
</div>
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

<button
type="button"
style={buttonStyle("danger")}
onClick={handleReset}
>
Réinitialiser
</button>
</div>

{secretaryMessage ? (
<AccordionSection
title="Message prêt à envoyer"
subtitle="Prévisualisation du message secrétariat"
badge="Export"
defaultOpen={false}
>
<textarea readOnly value={secretaryMessage} style={textareaStyle(12)} />
</AccordionSection>
) : null}

<AccordionSection
title="Historique HDJ"
subtitle="Dernières demandes enregistrées pour ce patient"
badge={`${hdjHistory.length}`}
defaultOpen={false}
>
{hdjHistory.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun HDJ historisé pour le moment.
</div>
) : (
<div style={{ display: "grid", gap: 8 }}>
{hdjHistory.slice(0, 5).map((item) => (
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
{item.savedAt?.slice(0, 10) || item.sentAt?.slice(0, 10) || "Date inconnue"}
</div>
<div style={{ fontSize: 11, color: "#475569" }}>
{frequencyLabelFromValue(item.programming?.frequency)} •{" "}
{durationLabelFromValue(item.programming?.duration)}
</div>
</div>
))}
</div>
)}
</AccordionSection>
</section>
);
}
