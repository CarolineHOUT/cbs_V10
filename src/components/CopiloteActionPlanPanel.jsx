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

function badgeStyle(kind = "neutral") {
const map = {
neutral: { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
blue: { background: "#eef4ff", color: "#1d4b8f", border: "1px solid #d6e4ff" },
amber: { background: "#fff8e8", color: "#a16207", border: "1px solid #f6df9b" },
red: { background: "#fff1f0", color: "#b42318", border: "1px solid #f3c7c1" },
green: { background: "#edf8f2", color: "#237a53", border: "1px solid #c8e8d3" },
};

return {
padding: "4px 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
...(map[kind] || map.neutral),
};
}

function buttonStyle() {
return {
height: 30,
padding: "0 10px",
borderRadius: 8,
border: "1px solid #cdd8ea",
background: "#ffffff",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
};
}

function inputStyle() {
return {
height: 32,
borderRadius: 8,
border: "1px solid #d6deea",
padding: "0 8px",
fontSize: 12,
};
}

// ===============================
// COMPONENT
// ===============================

export default function CopiloteActionPlanPanel({
actions = [],
onUpdateAction,
onAddAction,
}) {
const [newAction, setNewAction] = useState("");

function handleAdd() {
if (!newAction.trim()) return;

onAddAction?.({
id: `manual_${Date.now()}`,
label: newAction,
owner: "",
dueDate: "",
status: "todo",
source: "manual",
});

setNewAction("");
}

function update(id, field, value) {
onUpdateAction?.(id, field, value);
}

function statusKind(status) {
if (status === "done") return "green";
if (status === "in_progress") return "blue";
if (status === "blocked") return "red";
return "amber";
}

return (
<section style={panelStyle()}>
<h2 style={titleStyle()}>Plan d’action</h2>

{/* LISTE ACTIONS */}
<div style={{ display: "grid", gap: 10 }}>
{actions.length === 0 && (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucune action définie
</div>
)}

{actions.map((action) => (
<div
key={action.id}
style={{
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: 10,
background: "#fbfcfe",
display: "grid",
gap: 6,
}}
>
<div style={{ fontSize: 13, fontWeight: 800 }}>
{action.label}
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={badgeStyle(statusKind(action.status))}>
{action.status}
</span>

{action.source === "copilote" && (
<span style={badgeStyle("blue")}>auto</span>
)}
</div>

{/* EDIT */}
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
<input
style={inputStyle()}
placeholder="Responsable"
value={action.owner || ""}
onChange={(e) =>
update(action.id, "owner", e.target.value)
}
/>

<input
type="date"
style={inputStyle()}
value={action.dueDate || ""}
onChange={(e) =>
update(action.id, "dueDate", e.target.value)
}
/>

<select
style={inputStyle()}
value={action.status}
onChange={(e) =>
update(action.id, "status", e.target.value)
}
>
<option value="todo">À faire</option>
<option value="in_progress">En cours</option>
<option value="done">Fait</option>
<option value="blocked">Bloqué</option>
</select>
</div>
</div>
))}
</div>

{/* AJOUT MANUEL */}
<div style={{ display: "flex", gap: 8 }}>
<input
style={{ ...inputStyle(), flex: 1 }}
placeholder="Ajouter une action terrain..."
value={newAction}
onChange={(e) => setNewAction(e.target.value)}
/>

<button style={buttonStyle()} onClick={handleAdd}>
Ajouter
</button>
</div>
</section>
);
}