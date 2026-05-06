import { getArsDecision } from "./arsDecision";

export default function SasTerritorial({ territorialRequests }) {
return (
<div
style={{
background: "#fff7ed",
border: "2px solid #fdba74",
borderRadius: 18,
padding: 20,
}}
>
<div style={{ fontSize: 22, fontWeight: 800, color: "#c2410c", marginBottom: 18 }}>
🚨 SAS territorial — situations en tension
</div>

<div style={{ display: "grid", gap: 14 }}>
{territorialRequests
.filter((r) => r.priority === "critical" || r.status === "no_solution" || r.waitingHours >= 24)
.sort((a, b) => b.waitingHours - a.waitingHours)
.map((req) => {
const decision = getArsDecision(req);

return (
<div
key={req.id}
style={{
background: "#ffffff",
borderRadius: 14,
padding: "12px 14px",
border: "1px solid #fed7aa",
display: "grid",
gridTemplateColumns: "1.5fr 1.4fr 90px",
gap: 12,
alignItems: "center",
}}
>
<div>
<div style={{ fontWeight: 700 }}>{req.patientLabel}</div>

<div
style={{
marginTop: 6,
display: "inline-block",
background: "#eff6ff",
color: "#1d4ed8",
padding: "4px 10px",
borderRadius: 999,
fontSize: 12,
fontWeight: 700,
}}
>
{req.category}
</div>

<div style={{ marginTop: 6, color: "#7c2d12", fontSize: 14 }}>
{req.requesterHospital} → {req.toHospitalName}
</div>

<div style={{ marginTop: 4, fontSize: 13, color: "#9a3412" }}>{req.need}</div>
</div>

<div
style={{
background:
decision.tone === "red"
? "#fee2e2"
: decision.tone === "amber"
? "#fef3c7"
: "#dbeafe",
color:
decision.tone === "red"
? "#991b1b"
: decision.tone === "amber"
? "#92400e"
: "#1e40af",
padding: "8px 10px",
borderRadius: 12,
fontSize: 12,
fontWeight: 700,
}}
>
{decision.level} · {decision.title}
<div style={{ marginTop: 4, fontWeight: 600 }}>{decision.action}</div>
<div style={{ marginTop: 4, fontSize: 12 }}>Pilote : {decision.owner}</div>
</div>

<div style={{ textAlign: "right" }}>
<div
style={{
fontSize: 30,
fontWeight: 800,
color: req.waitingHours >= 48 ? "#dc2626" : "#ea580c",
}}
>
{req.waitingHours}h
</div>

<div style={{ marginTop: 6, fontWeight: 700, fontSize: 13, color: "#b91c1c" }}>
{req.status}
</div>

{req.waitingHours >= 48 && (
<div
style={{
marginTop: 10,
background: "#fee2e2",
color: "#991b1b",
padding: "6px 10px",
borderRadius: 999,
fontSize: 12,
fontWeight: 800,
}}
>
Escalade ARS
</div>
)}
</div>
</div>
);
})}
</div>
</div>
);
}