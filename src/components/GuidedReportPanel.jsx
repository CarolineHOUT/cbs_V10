import React, { useState } from "react";

// ===============================
// STYLES
// ===============================

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

function inputStyle() {
return {
width: "100%",
borderRadius: 10,
border: "1px solid #d6deea",
padding: "10px 12px",
fontSize: 12,
};
}

function textareaStyle() {
return {
width: "100%",
minHeight: 80,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "10px 12px",
fontSize: 12,
resize: "vertical",
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
height: 34,
padding: "0 12px",
borderRadius: 10,
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
...(map[kind] || map.secondary),
};
}

// ===============================
// COMPONENT
// ===============================

export default function GuidedReportPanel({
patient,
decision,
automaticActions = [],
reportHistory = [],
onSaveReport,
}) {
const [open, setOpen] = useState(false);

const [report, setReport] = useState({
title: "Compte rendu de coordination",
decision: decision?.proposedOrientation
? `Orientation ${decision.proposedOrientation} en cours`
: "Orientation à définir",
actions: automaticActions.map((a) => a.label).join("\n"),
responsable: patient?.cadre || "",
echeance: "",
vigilance: patient?.blockReason || "",
notes: "",
});

function update(field, value) {
setReport((prev) => ({ ...prev, [field]: value }));
}

function handleSave() {
const payload = {
id: `report_${Date.now()}`,
createdAt: new Date().toISOString(),
...report,
};

onSaveReport?.(payload);
}

function handlePrint() {
window.print();
}

return (
<section style={panelStyle()}>
{/* HEADER */}
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
}}
>
<h2 style={titleStyle()}>Compte rendu guidé</h2>

<button
style={buttonStyle()}
onClick={() => setOpen((prev) => !prev)}
>
{open ? "Masquer" : "Afficher"}
</button>
</div>

{/* CONTENU */}
{open && (
<>
{/* FORM */}
<div style={{ display: "grid", gap: 10 }}>
<input
style={inputStyle()}
value={report.title}
onChange={(e) => update("title", e.target.value)}
/>

<textarea
style={textareaStyle()}
placeholder="Décision"
value={report.decision}
onChange={(e) => update("decision", e.target.value)}
/>

<textarea
style={textareaStyle()}
placeholder="Actions"
value={report.actions}
onChange={(e) => update("actions", e.target.value)}
/>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
<input
style={inputStyle()}
placeholder="Responsable"
value={report.responsable}
onChange={(e) => update("responsable", e.target.value)}
/>

<input
style={inputStyle()}
placeholder="Échéance"
value={report.echeance}
onChange={(e) => update("echeance", e.target.value)}
/>
</div>

<textarea
style={textareaStyle()}
placeholder="Points de vigilance"
value={report.vigilance}
onChange={(e) => update("vigilance", e.target.value)}
/>

<textarea
style={textareaStyle()}
placeholder="Notes complémentaires"
value={report.notes}
onChange={(e) => update("notes", e.target.value)}
/>
</div>

{/* ACTIONS */}
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button style={buttonStyle("primary")} onClick={handleSave}>
Historiser
</button>

<button style={buttonStyle("secondary")} onClick={handlePrint}>
Export PDF
</button>
</div>

{/* HISTORIQUE */}
<div style={{ display: "grid", gap: 8 }}>
<div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
Historique
</div>

{reportHistory.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun compte rendu
</div>
) : (
reportHistory.slice(0, 5).map((item) => (
<button
key={item.id}
onClick={() => setReport(item)}
style={{
textAlign: "left",
border: "1px solid #eef2f7",
borderRadius: 10,
padding: 10,
background: "#ffffff",
cursor: "pointer",
}}
>
<div style={{ fontWeight: 800 }}>{item.title}</div>
<div style={{ fontSize: 11, color: "#64748b" }}>
{item.createdAt?.slice(0, 10)}
</div>
</button>
))
)}
</div>
</>
)}
</section>
);
}