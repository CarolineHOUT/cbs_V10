import React, { useMemo } from "react";

const COLONNES = [
{ cle: "a_faire", label: "À faire" },
{ cle: "en_attente", label: "En attente" },
{ cle: "termine", label: "Terminé" },
{ cle: "bloque", label: "Bloqué" },
];

function formatDate(value) {
if (!value) return "—";
const d = new Date(value);
if (Number.isNaN(d.getTime())) return value;
return d.toLocaleDateString("fr-FR");
}

function normalizeStatut(statut) {
if (statut === "todo") return "a_faire";
if (statut === "waiting") return "en_attente";
if (statut === "done") return "termine";
if (statut === "blocked") return "bloque";
if (statut === "cancelled") return "annule";
if (statut === "refused") return "refuse";
return statut || "a_faire";
}

function bucketStatut(statut) {
const s = normalizeStatut(statut);
if (s === "annule") return null; // on masque
if (s === "refuse") return "bloque";
return s;
}

function buildPatchBase() {
return { updatedAt: new Date().toISOString() };
}

function columnStyle() {
return {
background: "#f8fafc",
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 10,
display: "grid",
gap: 8,
minHeight: 220,
};
}

function rowCardStyle() {
return {
background: "#ffffff",
border: "1px solid #e2e8f0",
borderRadius: 12,
padding: 10,
display: "grid",
gap: 8,
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
color: "#334155",
border: "1px solid #d6deea",
},
waiting: {
background: "#fff8e8",
color: "#a16207",
border: "1px solid #f6df9b",
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
grey: {
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
},
};

return {
height: 28,
padding: "0 8px",
borderRadius: 8,
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
...(map[kind] || map.secondary),
};
}

function pillStyle(kind = "neutral") {
const map = {
neutral: {
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
},
red: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
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
};

return {
minHeight: 22,
padding: "0 8px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
whiteSpace: "nowrap",
...(map[kind] || map.neutral),
};
}

function priorityKind(priorite) {
if (priorite === "haute" || priorite === "urgent" || priorite === "high") {
return "red";
}
return "neutral";
}

export default function ActionKanbanBoard({ actions = [], onUpdate, patientId }) {
const grouped = useMemo(() => {
const initial = {
a_faire: [],
en_attente: [],
termine: [],
bloque: [],
};

(actions || []).forEach((action) => {
const bucket = bucketStatut(action.status || action.statut);
if (!bucket) return;
initial[bucket].push(action);
});

return initial;
}, [actions]);

return (
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
gap: 12,
alignItems: "start",
}}
>
{COLONNES.map((column) => {
const colActions = grouped[column.cle] || [];

return (
<div key={column.cle} style={columnStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 8,
}}
>
<div style={{ fontSize: 13, fontWeight: 900, color: "#17376a" }}>
{column.label}
</div>
<span style={pillStyle("neutral")}>{colActions.length}</span>
</div>

{colActions.length === 0 ? (
<div style={{ fontSize: 11, color: "#64748b" }}>Aucune action</div>
) : (
colActions.map((action) => {
const priorite = action.priorite || action.priority || "standard";
const echeance = action.echeance || action.dueDate || "";
const relance = action.prochaineRelance || action.nextReminderAt || "";
const commentaire =
action.dernierCommentaire || action.lastComment || action.notes || "";
const motifRefus = action.motifRefus || action.refusalReason || "";
const motifAnnulation =
action.motifAnnulation || action.cancellationReason || "";

return (
<div key={action.id} style={rowCardStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "start",
gap: 8,
}}
>
<div
style={{
fontSize: 13,
fontWeight: 800,
color: "#172554",
lineHeight: 1.35,
}}
>
{action.label || "Action"}
</div>

<span style={pillStyle(priorityKind(priorite))}>{priorite}</span>
</div>

<div style={{ fontSize: 11, color: "#64748b" }}>
👤 {action.responsable || action.owner || "Responsable non défini"}
</div>

<div style={{ fontSize: 11, color: "#64748b" }}>
📅 {formatDate(echeance)}
{relance ? ` · Relance ${formatDate(relance)}` : ""}
</div>

{motifRefus ? (
<div style={{ fontSize: 11, color: "#b42318" }}>
❌ {motifRefus}
</div>
) : null}

{motifAnnulation ? (
<div style={{ fontSize: 11, color: "#64748b" }}>
⛔ {motifAnnulation}
</div>
) : null}

{commentaire && !motifRefus && !motifAnnulation ? (
<div style={{ fontSize: 11, color: "#64748b" }}>{commentaire}</div>
) : null}

<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{column.cle !== "a_faire" ? (
<button
type="button"
style={buttonStyle("secondary")}
onClick={() =>
onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "a_faire",
statut: "a_faire",
})
}
>
À faire
</button>
) : null}

{column.cle !== "en_attente" ? (
<button
type="button"
style={buttonStyle("waiting")}
onClick={() =>
onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "en_attente",
statut: "en_attente",
})
}
>
En attente
</button>
) : null}

{column.cle !== "termine" ? (
<button
type="button"
style={buttonStyle("success")}
onClick={() =>
onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "termine",
statut: "termine",
})
}
>
Terminer
</button>
) : null}

{column.cle !== "bloque" ? (
<button
type="button"
style={buttonStyle("danger")}
onClick={() =>
onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "bloque",
statut: "bloque",
})
}
>
Bloquer
</button>
) : null}

<button
type="button"
style={buttonStyle("grey")}
onClick={() => {
const nextDate = window.prompt(
"Date de relance (AAAA-MM-JJ) ?",
relance || ""
);
if (nextDate === null) return;

onUpdate(patientId, action.id, {
...buildPatchBase(),
prochaineRelance: nextDate || "",
nextReminderAt: nextDate || "",
});
}}
>
Relance
</button>

<button
type="button"
style={buttonStyle("secondary")}
onClick={() => {
const reason = window.prompt("Motif d’annulation ?");
if (reason === null) return;

onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "annule",
statut: "annule",
motifAnnulation: reason || "Annulé",
cancellationReason: reason || "Annulé",
dernierCommentaire: reason || "Action annulée",
lastComment: reason || "Action annulée",
});
}}
>
Annuler
</button>

<button
type="button"
style={buttonStyle("danger")}
onClick={() => {
const reason = window.prompt("Motif de refus ?");
if (reason === null) return;

onUpdate(patientId, action.id, {
...buildPatchBase(),
status: "refuse",
statut: "refuse",
motifRefus: reason || "Refus",
refusalReason: reason || "Refus",
dernierCommentaire: reason || "Refus",
lastComment: reason || "Refus",
});
}}
>
Refus
</button>
</div>
</div>
);
})
)}
</div>
);
})}
</div>
);
}
