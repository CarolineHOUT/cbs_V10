import { getArsDecision } from "./arsDecision";

export default function CoordinationDrawer({
request,
onClose,
onUpdateRequest,
}) {
if (!request) return null;

const decision = getArsDecision(request);


return (
<>
<div
onClick={onClose}
style={{
position: "fixed",
inset: 0,
background: "rgba(15,23,42,0.35)",
zIndex: 999,
}}
/>

<div
style={{
position: "fixed",
top: 0,
right: 0,
width: 420,
height: "100vh",
background: "#ffffff",
boxShadow: "-20px 0 50px rgba(15,23,42,0.25)",
zIndex: 1000,
padding: 24,
overflowY: "auto",
}}
>
<button
type="button"
onClick={onClose}
style={{
border: "none",
background: "#f1f5f9",
borderRadius: 999,
padding: "8px 12px",
fontWeight: 800,
cursor: "pointer",
marginBottom: 20,
}}
>
Fermer
</button>

<h2 style={{ margin: 0, fontSize: 24 }}>Coordination ARS</h2>

<div style={{ color: "#64748b", marginTop: 6 }}>
Fiche territoriale de suivi et d’arbitrage
</div>

<Section title="Situation">
<Info label="Patient" value={request.patientLabel} />
<Info label="Âge" value={`${request.patientAge} ans`} />
<Info label="Service origine" value={request.originService} />
<Info label="Besoin" value={request.need} />
<Info label="Délai" value={`${request.waitingHours}h`} highlight />
</Section>

<Section title="Parcours territorial">
<Info label="Demandeur" value={request.requesterHospital} />
<Info label="Orientation cible" value={request.toHospitalName} />
<Info label="Statut" value={formatStatus(request.status)} />


{request.arsOpened && (
<div
style={{
marginTop: 12,
background: "#dcfce7",
color: "#166534",
padding: "10px 12px",
borderRadius: 12,
fontWeight: 700,
fontSize: 13,
}}
>
Cellule ARS active
</div>
)}


<Info label="Catégorie" value={request.category} />
</Section>

<Section title="Décision ARS proposée">
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
borderRadius: 14,
padding: 14,
fontWeight: 800,
}}
>
{decision.level} · {decision.title}
<div style={{ marginTop: 8, fontWeight: 600 }}>
{decision.action}
</div>
<div style={{ marginTop: 8, fontSize: 13 }}>
Pilote : {decision.owner}
</div>
</div>
</Section>

<Section title="Actions ARS">
<ActionButton
label="Ouvrir cellule territoriale"
primary
onClick={() =>
onUpdateRequest(request.id, {
status: "under_review",
arsOpened: true,
arsOpenedAt: new Date().toISOString(),
})
}
/>

<ActionButton
label="Demander réévaluation établissement"
onClick={() =>
onUpdateRequest(request.id, {
status: "under_review",
})
}
/>

<ActionButton
label="Relancer établissements receveurs"
onClick={() =>
onUpdateRequest(request.id, {
status: "routed",
})
}
/>

<ActionButton
label="Tracer arbitrage ARS"
onClick={() =>
onUpdateRequest(request.id, {
priority: "critical",
status: "no_solution",
})
}
/>
</Section>

<Section title="Journal">
<Timeline text="Demande territoriale enregistrée" />
<Timeline text="Recherche de solution en cours" />
<Timeline text="Analyse ARS disponible" />
</Section>
</div>
</>
);
}

function formatStatus(status) {
switch (status) {
case "under_review":
return "Cellule ARS ouverte";

case "accepted":
return "Accepté";

case "scheduled":
return "Programmé";

case "completed":
return "Terminé";

case "no_solution":
return "Sans solution";

case "refused_no_capacity":
return "Refus capacité";

case "routed":
return "Orientation envoyée";

default:
return status;
}
}


function Section({ title, children }) {
return (
<div style={{ marginTop: 24 }}>
<h3 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h3>
<div style={{ display: "grid", gap: 10 }}>{children}</div>
</div>
);
}

function Info({ label, value, highlight = false }) {
return (
<div
style={{
background: highlight ? "#fef2f2" : "#f8fafc",
border: "1px solid #e2e8f0",
borderRadius: 12,
padding: 12,
}}
>
<div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
{label}
</div>
<div style={{ marginTop: 4, fontWeight: 800 }}>{value || "—"}</div>
</div>
);
}

function ActionButton({ label, primary = false, onClick }) {
return (
<button
type="button"
onClick={onClick}
style={{
border: primary ? "1px solid #dc2626" : "1px solid #cbd5e1",
background: primary ? "#dc2626" : "#fff",
color: primary ? "#fff" : "#0f172a",
borderRadius: 12,
padding: "10px 12px",
fontWeight: 800,
cursor: "pointer",
textAlign: "left",
}}
>
{label}
</button>
);
}


function Timeline({ text }) {
return (
<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
<div
style={{
width: 8,
height: 8,
borderRadius: 999,
background: "#2563eb",
}}
/>
<div style={{ fontSize: 13, color: "#475569" }}>{text}</div>
</div>
);
}
