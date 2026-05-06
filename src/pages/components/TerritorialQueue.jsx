export default function TerritorialQueue({
territorialRequests,
onSelectRequest,
title = "File territoriale active",
}) {
const displayedRequests = [...territorialRequests]
.filter((req) => req.arsEscalated || req.arsOpened)
.sort((a, b) => Number(b.arsOpened) - Number(a.arsOpened));

return (
<div style={{ marginTop: 0 }}>
<h2>{title}</h2>

<div
style={{
background: "#fff",
borderRadius: 16,
padding: 16,
border: "1px solid #e5e7eb",
maxHeight: 520,
overflowY: "auto",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "1.6fr 1.4fr 1.8fr 70px 110px",
gap: 10,
padding: "0 0 10px 0",
borderBottom: "2px solid #e2e8f0",
marginBottom: 10,
fontSize: 12,
fontWeight: 800,
color: "#475569",
textTransform: "uppercase",
}}
>
<div>Patient</div>
<div>Établissement</div>
<div>Orientation</div>
<div>Délai</div>
<div>Action</div>
</div>

{displayedRequests.map((req) => (
<div
key={req.id}
style={{
display: "grid",
gridTemplateColumns: "1.6fr 1.4fr 1.8fr 70px 110px",
gap: 10,
padding: "10px 0",
borderBottom: "1px solid #f1f5f9",
alignItems: "center",
borderLeft: req.arsOpened ? "4px solid #dc2626" : "4px solid transparent",
paddingLeft: 10,
}}
>
<div>
<div style={{ fontWeight: 700 }}>{req.patientLabel}</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
{req.patientAge} ans • {req.originService}
</div>
</div>

<div style={{ fontWeight: 600 }}>{req.requesterHospital}</div>

<div>
<div style={{ fontWeight: 600 }}>{req.need}</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
→ {req.toHospitalName}
</div>
</div>

<div
style={{
fontWeight: 700,
color: req.waitingHours > 24 ? "#dc2626" : "#2563eb",
}}
>
{req.waitingHours}h
</div>

<div
style={{
display: "flex",
flexDirection: "column",
gap: 6,
alignItems: "flex-start",
}}
>
<span style={statusBadgeStyle(req)}>
{req.arsOpened ? "Cellule ARS ouverte" : formatStatus(req.status)}
</span>

<button
type="button"
onClick={() => onSelectRequest(req)}
style={
req.priority === "critical" || req.status === "no_solution"
? miniBtnRed
: miniBtn
}
>
{req.priority === "critical" || req.status === "no_solution"
? "Escalade"
: "Traiter"}
</button>
</div>
</div>
))}
</div>
</div>
);
}

const miniBtn = {
border: "1px solid #cbd5e1",
background: "#fff",
borderRadius: 999,
padding: "5px 8px",
fontSize: 11,
fontWeight: 700,
cursor: "pointer",
};

const miniBtnRed = {
...miniBtn,
border: "1px solid #fecaca",
background: "#fef2f2",
color: "#b91c1c",
};

function formatStatus(status) {
switch (status) {
case "under_review":
return "Cellule ARS ouverte";
case "accepted":
case "Accepté":
return "Accepté";
case "scheduled":
case "Programmé":
return "Programmé";
case "completed":
return "Terminé";
case "no_solution":
case "Sans solution":
return "Sans solution";
case "refused_no_capacity":
case "Refus capacité":
return "Refus capacité";
case "routed":
case "Routé":
return "Routé";
default:
return status;
}
}

function statusBadgeStyle(req) {
return {
padding: "4px 7px",
borderRadius: 999,
fontSize: 10,
fontWeight: 700,
width: "fit-content",
whiteSpace: "nowrap",
background: req.arsOpened ? "#fee2e2" : "#e0f2fe",
color: req.arsOpened ? "#991b1b" : "#075985",
};
}
