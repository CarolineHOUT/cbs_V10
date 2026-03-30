import React from "react";
import { useCrisisCenter } from "../context/CrisisCenterContext";

export default function CriticalWorkflowPanel() {
const {
workflowOpen,
contextData,
closeWorkflow,
openCrisisCell,
} = useCrisisCenter();

// 🔥 SÉCURITÉ ANTI-CRASH
if (!workflowOpen || !contextData) return null;

const patient = contextData?.patient;
const scenarioType = contextData?.scenarioType;

// 🧠 Détermination du type de scénario
function getScenarioLabel() {
if (scenarioType === "disparition_inquietante") {
return "Disparition inquiétante";
}
return "Situation critique";
}

// 📋 Étapes simplifiées (évolutif)
function getSteps() {
if (scenarioType === "disparition_inquietante") {
return [
"Informer l’équipe",
"Recherche dans le service",
"Appel patient",
"Vérification vidéo",
"Prévenir cadre",
"Prévenir administrateur de garde",
];
}

return [
"Analyse situation",
"Coordination équipe",
"Décision médicale",
"Suivi",
];
}

const steps = getSteps();

return (
<div
style={{
position: "fixed",
right: 0,
top: 0,
width: 420,
height: "100vh",
background: "#ffffff",
borderLeft: "1px solid #e2e8f0",
boxShadow: "-10px 0 30px rgba(0,0,0,0.08)",
zIndex: 1000,
display: "flex",
flexDirection: "column",
}}
>
{/* HEADER */}
<div
style={{
padding: 16,
borderBottom: "1px solid #e2e8f0",
background: "#f8fafc",
}}
>
<div style={{ fontSize: 14, fontWeight: 900 }}>
Workflow critique
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
{getScenarioLabel()}
</div>
</div>

{/* PATIENT */}
<div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
<div style={{ fontSize: 13, fontWeight: 800 }}>
{patient?.nom} {patient?.prenom}
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
{patient?.service} • Chambre {patient?.chambre}
</div>
</div>

{/* STEPS */}
<div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
{steps.map((step, index) => (
<div
key={index}
style={{
marginBottom: 10,
padding: 10,
borderRadius: 10,
background: "#f1f5f9",
fontSize: 13,
fontWeight: 600,
}}
>
{index + 1}. {step}
</div>
))}
</div>

{/* ACTIONS */}
<div
style={{
padding: 16,
borderTop: "1px solid #e2e8f0",
display: "flex",
gap: 8,
}}
>
<button
onClick={() => openCrisisCell({ patient })}
style={{
flex: 1,
background: "#e53935",
color: "#fff",
border: "none",
borderRadius: 10,
padding: 10,
fontWeight: 800,
cursor: "pointer",
}}
>
Déclencher cellule de crise
</button>

<button
onClick={closeWorkflow}
style={{
flex: 1,
background: "#e2e8f0",
border: "none",
borderRadius: 10,
padding: 10,
fontWeight: 800,
cursor: "pointer",
}}
>
Fermer
</button>
</div>
</div>
);
}