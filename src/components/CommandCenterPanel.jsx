import React from "react";

function badge(kind = "neutral") {
const map = {
blue: { background: "#eef4ff", color: "#1d4b8f" },
red: { background: "#fff1f0", color: "#b42318" },
amber: { background: "#fff8e8", color: "#a16207" },
green: { background: "#edf8f2", color: "#237a53" },
violet: { background: "#f5f3ff", color: "#6d28d9" },
neutral: { background: "#f8fafc", color: "#475569" },
};

return {
padding: "4px 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
...map[kind],
};
}

function noteKind(level) {
if (level === "urgent") return "red";
if (level === "important") return "amber";
return "neutral";
}

function tinyButton() {
return {
height: 28,
padding: "0 8px",
borderRadius: 8,
border: "1px solid #1d4b8f",
background: "#ffffff",
color: "#1d4b8f",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
};
}

export default function CommandCenterPanel({
bestResource,
collective = [],
actions = [],
documents = [],
suggestHDJ = false,
priorityNotes = [],
unreadNotesCount = 0,
onCreateActionFromNote,
}) {
return (
<div
style={{
border: "1px solid #dbe7ff",
background: "#f8fbff",
borderRadius: 16,
padding: 14,
display: "grid",
gap: 12,
}}
>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 8,
alignItems: "center",
flexWrap: "wrap",
}}
>
<div style={{ fontSize: 13, fontWeight: 900, color: "#17376a" }}>
À faire maintenant
</div>

{unreadNotesCount > 0 ? (
<span style={badge("violet")}>
{unreadNotesCount} note(s) non lue(s)
</span>
) : null}
</div>

{priorityNotes.length > 0 ? (
<div
style={{
border: "1px solid #eef2f7",
borderRadius: 10,
padding: 10,
background: "#ffffff",
display: "grid",
gap: 8,
}}
>
<div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
Notes prioritaires
</div>

<div style={{ display: "grid", gap: 6 }}>
{priorityNotes.slice(0, 3).map((note) => (
<div
key={note.id}
style={{
display: "grid",
gap: 6,
border: "1px solid #eef2f7",
borderRadius: 8,
padding: 8,
background: "#fbfcfe",
}}
>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
<span style={badge(noteKind(note.level))}>
{note.level || "normal"}
</span>
{!note.isRead ? <span style={badge("violet")}>nouveau</span> : null}
</div>

<div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.4 }}>
{note.text}
</div>

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 8,
alignItems: "center",
flexWrap: "wrap",
}}
>
<div style={{ fontSize: 11, color: "#64748b" }}>
{note.author || "Agent"}
</div>

<button
type="button"
style={tinyButton()}
onClick={() => onCreateActionFromNote?.(note)}
>
Créer action
</button>
</div>
</div>
))}
</div>
</div>
) : null}

{bestResource && (
<div style={{ display: "grid", gap: 4 }}>
<div style={{ fontSize: 13, fontWeight: 800 }}>
{bestResource.label}
</div>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
<span style={badge("blue")}>{bestResource.type}</span>
<span style={badge("green")}>
score {bestResource.copilotScore}
</span>
</div>
</div>
)}

{collective.length > 0 && (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{collective.map((c) => (
<span key={c.id} style={badge("violet")}>
{c.label}
</span>
))}
</div>
)}

{actions.length > 0 && (
<div style={{ display: "grid", gap: 4 }}>
{actions.slice(0, 3).map((a) => (
<div
key={a.id}
style={{
fontSize: 12,
padding: "6px 8px",
borderRadius: 8,
background: "#ffffff",
border: "1px solid #e6ebf2",
}}
>
{a.label}
</div>
))}
</div>
)}

{documents.length > 0 && (
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{documents.slice(0, 3).map((doc) => (
<span key={doc.id} style={badge("amber")}>
{doc.label}
</span>
))}
</div>
)}

{suggestHDJ && <div style={badge("green")}>HDJ à envisager</div>}
</div>
);
}
