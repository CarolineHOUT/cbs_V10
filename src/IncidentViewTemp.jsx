import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import PatientIdentityBar from "./components/PatientIdentityBar";
import { AppShell } from "./components/AppShell";
import { patients } from "./data/patients";
import { usePatientSimulation } from "./context/PatientSimulationContext";

const INCIDENT_UI_PREFIX = "carabbas_incident_ui_";
const INCIDENT_EXPORT_PREFIX = "carabbas_incident_export_";

const CONTEXT_OPTIONS = [
"Disparition constatée dans le service",
"Patient absent de la chambre",
"Patient absent après examen",
"Patient absent après visite",
"Patient vu pour la dernière fois dans l’unité",
];

const VULNERABILITY_OPTIONS = [
"Troubles cognitifs",
"Désorientation",
"Risque de chute",
"Patient fragile",
"Patient dépendant",
"Mineur",
"Majeur protégé",
"Propos suicidaires",
"Errance / fugue antérieure",
];

const DANGER_SELF_OPTIONS = [
"Risque suicidaire",
"Danger médical immédiat",
"Traitement indispensable non pris",
"Risque de chute grave",
"Oxygène / matériel nécessaire",
"Confusion sévère",
];

const DANGER_OTHERS_OPTIONS = [
"Agressivité possible",
"Comportement imprévisible",
"Conflit avec tiers",
"Mise en danger d’autrui",
];

const DANGER_CONTEXT_OPTIONS = [
"Patient désorienté dehors",
"Patient vulnérable la nuit",
"Météo défavorable",
"Zone routière proche",
"Risque fugue active",
];

const DESCRIPTION_PHYSICAL_OPTIONS = [
"Taille petite",
"Taille moyenne",
"Grande taille",
"Corpulence fine",
"Corpulence moyenne",
"Corpulence forte",
"Cheveux courts",
"Cheveux longs",
"Cheveux gris",
"Lunettes",
"Barbe",
];

const DESCRIPTION_MOBILITY_OPTIONS = [
"Fauteuil roulant",
"Déambulateur",
"Canne",
"Marche lente",
"Marche rapide",
"Désorienté",
"Agité",
"Calme",
];

const DESCRIPTION_CLOTHING_OPTIONS = [
"Vêtements clairs",
"Vêtements foncés",
"Pyjama",
"Blouse / tenue hôpital",
"Chaussures fermées",
"Pantoufles",
];

const INTERNAL_SEARCH_ZONES = [
"Chambre",
"Sanitaires",
"Couloir du service",
"Salle d’attente",
"Office / espaces communs",
"Ascenseurs",
"Escaliers",
"Plateau technique proche",
];

const SECURITY_CAMERAS = [
"Caméra entrée principale",
"Caméra couloir principal",
"Caméra ascenseur",
"Caméra hall",
"Caméra parking",
"Caméra sortie urgences",
];

const SECURITY_EXITS = [
"Sortie A",
"Sortie B",
"Sortie C",
"Sortie urgences",
"Porte parking",
"Porte livraison",
];

const SECURITY_EXTERNALS = [
"Parking",
"Jardin",
"Rue immédiate",
"Abords établissement",
"Arrêt bus / transport proche",
];

const SECURITY_SUSPICIOUS = [
"Patient vu à l’extérieur",
"Départ seul observé",
"Interaction avec tiers",
"Comportement inhabituel",
"Aucune image exploitable",
];

const DIRECTION_DECISIONS = [
"Poursuite recherches internes",
"Renfort sécurité",
"Alerte forces de l’ordre",
"Information direction élargie",
"Maintien coordination service / sécurité",
];

function safe(value, fallback = "Non renseigné") {
return value === null || value === undefined || value === "" ? fallback : value;
}

function safeArray(value) {
return Array.isArray(value) ? value : value ? [value] : [];
}

function formatShortDateTime(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return safe(value);
return date.toLocaleString("fr-FR");
}

function readJsonStorage(key, fallback) {
if (typeof window === "undefined") return fallback;
try {
const raw = window.localStorage.getItem(key);
return raw ? JSON.parse(raw) : fallback;
} catch {
return fallback;
}
}

function writeJsonStorage(key, value) {
if (typeof window === "undefined") return;
window.localStorage.setItem(key, JSON.stringify(value));
}

function buildSecurityBrief(incidentUi) {
return [
incidentUi.securityCameras?.length
? `Caméras : ${incidentUi.securityCameras.join(" • ")}`
: null,
incidentUi.securityExits?.length
? `Sorties : ${incidentUi.securityExits.join(" • ")}`
: null,
incidentUi.securityExternals?.length
? `Extérieurs : ${incidentUi.securityExternals.join(" • ")}`
: null,
incidentUi.securitySuspicious?.length
? `Éléments notables : ${incidentUi.securitySuspicious.join(" • ")}`
: null,
incidentUi.securityNotes ? `Notes : ${incidentUi.securityNotes}` : null,
]
.filter(Boolean)
.join(" | ");
}

function buildIncidentPrintableHtml({ patient, incident, incidentUi, currentStatus, elapsedMinutes }) {
const description = [
...safeArray(incidentUi.descriptionPhysicalTags),
...safeArray(incidentUi.descriptionMobilityTags),
...safeArray(incidentUi.descriptionClothingTags),
incidentUi.freeDescription || "",
]
.filter(Boolean)
.join(" • ");

return `
<html>
<head>
<title>Rapport incident disparition</title>
<style>
@page { size: A4; margin: 16mm; }
body { font-family: Arial, sans-serif; color: #111827; }
h1 { margin: 0 0 12px; color: #17376a; }
h2 { margin: 20px 0 8px; color: #17376a; font-size: 16px; }
.block { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.label { font-weight: 700; color: #475569; margin-bottom: 6px; }
</style>
</head>
<body>
<h1>Rapport incident disparition</h1>

<div class="block">
<div><strong>Patient :</strong> ${safe(patient?.nom, "—")} ${safe(patient?.prenom, "")}</div>
<div><strong>Service :</strong> ${safe(patient?.service, "—")} · <strong>Chambre :</strong> ${safe(patient?.chambre, "—")} · <strong>Lit :</strong> ${safe(patient?.lit, "—")}</div>
<div><strong>Statut :</strong> ${safe(currentStatus?.label, "—")}</div>
<div><strong>Temps écoulé :</strong> ${elapsedMinutes !== null ? `${elapsedMinutes} min` : "—"}</div>
<div><strong>Dernier lieu vu :</strong> ${safe(incidentUi?.lastSeenLocation, "—")}</div>
<div><strong>Dernière heure connue :</strong> ${formatShortDateTime(incidentUi?.lastSeenAt)}</div>
</div>

<h2>Contexte</h2>
<div class="grid">
<div class="block"><div class="label">Contexte</div>${safeArray(incidentUi?.contextTags).join(" • ") || "Non précisé"}</div>
<div class="block"><div class="label">Vulnérabilité</div>${safeArray(incidentUi?.vulnerabilityTags).join(" • ") || "Non précisée"}</div>
<div class="block"><div class="label">Danger pour lui-même</div>${safeArray(incidentUi?.dangerSelfTags).join(" • ") || "Non précisé"}</div>
<div class="block"><div class="label">Danger pour autrui</div>${safeArray(incidentUi?.dangerOthersTags).join(" • ") || "Non précisé"}</div>
<div class="block"><div class="label">Danger contextuel</div>${safeArray(incidentUi?.dangerContextTags).join(" • ") || "Non précisé"}</div>
<div class="block"><div class="label">Description utile</div>${description || "Non précisée"}</div>
</div>

<h2>Recherches service</h2>
<div class="block">${safeArray(incidentUi?.internalZones).join(" • ") || "Aucune zone tracée"}</div>

<h2>PC sécurité</h2>
<div class="block">${buildSecurityBrief(incidentUi) || "Aucun compte rendu sécurité"}</div>

<h2>Décision direction</h2>
<div class="block">
${safeArray(incidentUi?.directionDecisions).join(" • ") || "Aucune décision direction tracée"}
${incidentUi?.directionNotes ? `<br/><br/><strong>Notes :</strong> ${incidentUi.directionNotes}` : ""}
</div>

<h2>Journal partagé</h2>
<div class="block">
${
safeArray(incident?.incidentLog).length
? safeArray(incident.incidentLog)
.map(
(evt) =>
`<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;">
<strong>${formatShortDateTime(evt.at)}</strong> — ${safe(evt.label)} (${safe(evt.by)})
</div>`
)
.join("")
: "Aucun événement tracé"
}
</div>

<h2>Clôture</h2>
<div class="block">
<div><strong>Lieu de retrouvaille / issue :</strong> ${safe(incidentUi?.foundLocation, "Non renseigné")}</div>
<div><strong>Commentaire final :</strong> ${safe(incidentUi?.finalComment, "Non renseigné")}</div>
</div>
</body>
</html>
`;
}

function StatusChip({ color = "neutral", children }) {
const styles = {
neutral: { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
blue: { background: "#eef4ff", color: "#17376a", border: "1px solid #d6e4ff" },
amber: { background: "#fff8e8", color: "#a16207", border: "1px solid #f6df9b" },
red: { background: "#fff1f0", color: "#b42318", border: "1px solid #f3c7c1" },
green: { background: "#effaf3", color: "#166534", border: "1px solid #cdebd8" },
purple: { background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe" },
};

return (
<span
style={{
...styles[color],
minHeight: 26,
padding: "0 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
display: "inline-flex",
alignItems: "center",
}}
>
{children}
</span>
);
}

function SectionCard({ title, subtitle, actions, children, style = {} }) {
return (
<section
style={{
border: "1px solid #e5e7eb",
borderRadius: 20,
background: "#ffffff",
boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
padding: 18,
...style,
}}
>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "flex-start",
marginBottom: 14,
flexWrap: "wrap",
}}
>
<div>
<h2 style={{ margin: 0, fontSize: 20, color: "#17376a" }}>{title}</h2>
{subtitle ? (
<p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>{subtitle}</p>
) : null}
</div>
{actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
</div>
{children}
</section>
);
}

function ChipToggleGroup({ options, values, onToggle, color = "blue" }) {
const activeStyles = {
blue: { background: "#eaf2ff", border: "1px solid #bfd3ff", color: "#17376a" },
red: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" },
purple: { background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#6d28d9" },
amber: { background: "#fff8e8", border: "1px solid #f6df9b", color: "#a16207" },
green: { background: "#effaf3", border: "1px solid #cdebd8", color: "#166534" },
};

return (
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{options.map((item) => {
const active = safeArray(values).includes(item);
return (
<button
key={item}
type="button"
onClick={() => onToggle(item)}
style={{
borderRadius: 999,
padding: "8px 12px",
fontSize: 12,
fontWeight: 700,
cursor: "pointer",
transition: "all .15s ease",
border: active ? activeStyles[color].border : "1px solid #dbe4f0",
background: active ? activeStyles[color].background : "#ffffff",
color: active ? activeStyles[color].color : "#334155",
}}
>
{item}
</button>
);
})}
</div>
);
}

function InfoBox({ label, value }) {
return (
<div
style={{
border: "1px solid #edf2f7",
background: "#fcfdff",
borderRadius: 16,
padding: 14,
minHeight: 92,
}}
>
<div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{label}</div>
<div style={{ fontSize: 15, color: "#0f172a", fontWeight: 700 }}>{safe(value)}</div>
</div>
);
}

export default function IncidentView() {
const navigate = useNavigate();
const { id } = useParams();
const simulation = usePatientSimulation();

const createIncidentForPatient = simulation.createIncidentForPatient;
const addIncidentAction = simulation.addIncidentAction || (() => {});
const updateIncidentStatus = simulation.updateIncidentStatus || (() => {});
const closeIncidentForPatient = simulation.closeIncidentForPatient || (() => {});
const getPatientById = simulation.getPatientById;
const incidents = simulation.incidents || [];

const patient = useMemo(() => {
const simulated = typeof getPatientById === "function" ? getPatientById(id) : null;
if (simulated) return simulated;
return patients.find((p) => String(p.id) === String(id)) || null;
}, [getPatientById, id]);

const incident = useMemo(() => {
if (!patient) return null;
return incidents.find(
(i) =>
String(i.patientId) === String(patient.id) &&
String(i.status) !== "closed"
) || null;
}, [incidents, patient]);

const [activeSection, setActiveSection] = useState("synthese");
const [incidentUi, setIncidentUi] = useState({
contextTags: [],
vulnerabilityTags: [],
dangerSelfTags: [],
dangerOthersTags: [],
dangerContextTags: [],
descriptionPhysicalTags: [],
descriptionMobilityTags: [],
descriptionClothingTags: [],
freeDescription: "",
lastSeenLocation: "",
lastSeenAt: "",

internalZones: [],
familyContacted: false,
patientReachedByPhone: false,

securityCameras: [],
securityExits: [],
securityExternals: [],
securitySuspicious: [],
securityNotes: "",

directionDecisions: [],
directionNotes: "",
policeConsidered: false,

foundLocation: "",
finalComment: "",
});

useEffect(() => {
if (!patient) return;
const stored = readJsonStorage(`${INCIDENT_UI_PREFIX}${patient.id}`, null);
if (stored) {
setIncidentUi((prev) => ({
...prev,
...stored,
}));
} else {
setIncidentUi((prev) => ({
...prev,
lastSeenLocation: patient?.service || "",
}));
}
}, [patient]);

useEffect(() => {
if (!patient) return;
writeJsonStorage(`${INCIDENT_UI_PREFIX}${patient.id}`, incidentUi);
}, [incidentUi, patient]);

const menuItems = [
{ id: "synthese", label: "Synthèse" },
{ id: "contexte", label: "Contexte" },
{ id: "service", label: "Service" },
{ id: "security", label: "PC sécurité" },
{ id: "direction", label: "Direction" },
{ id: "journal", label: "Journal" },
{ id: "cloture", label: "Clôture" },
];

const handleSectionChange = (sectionId) => {
setActiveSection(sectionId);
requestAnimationFrame(() => {
const main = document.querySelector(".incident-main");
if (main) {
main.scrollTo({ top: 0, behavior: "smooth" });
} else {
window.scrollTo({ top: 0, behavior: "smooth" });
}
});
};

const toggleUiTag = (field, value) => {
setIncidentUi((prev) => {
const current = safeArray(prev[field]);
const exists = current.includes(value);
return {
...prev,
[field]: exists ? current.filter((item) => item !== value) : [...current, value],
};
});
};

const setUiField = (field, value) => {
setIncidentUi((prev) => ({ ...prev, [field]: value }));
};

const openIncident = () => {
if (!patient || !createIncidentForPatient) return;
try {
createIncidentForPatient(patient);
} catch {
createIncidentForPatient(patient.id);
}
};

const markInternalSearch = () => {
if (!incident) return;
addIncidentAction(incident.id, {
label: "Recherche interne service",
by: "Service",
role: "service",
at: new Date().toISOString(),
status: "done",
context: { zones: incidentUi.internalZones },
});
updateIncidentStatus(incident.id, "internal_search", "Service");
};

const markPhoneCall = () => {
if (!incident) return;
setUiField("patientReachedByPhone", true);
addIncidentAction(incident.id, {
label: "Appel patient",
by: "Service",
role: "service",
at: new Date().toISOString(),
status: "done",
});
};

const markFamilyContact = () => {
if (!incident) return;
setUiField("familyContacted", true);
addIncidentAction(incident.id, {
label: "Personne de confiance / entourage contacté",
by: "Service",
role: "service",
at: new Date().toISOString(),
status: "done",
});
};

const validateSecurityChecks = () => {
if (!incident) return;
const brief = buildSecurityBrief(incidentUi);
addIncidentAction(incident.id, {
label: "Vérifications PC sécurité",
by: "PC sécurité",
role: "security",
at: new Date().toISOString(),
status: "done",
securityBrief: brief,
});
updateIncidentStatus(incident.id, "security_investigation", "PC sécurité");
};

const alertDirector = () => {
if (!incident) return;
addIncidentAction(incident.id, {
label: "Directeur de garde alerté",
by: "PC sécurité",
role: "direction",
at: new Date().toISOString(),
status: "done",
});
updateIncidentStatus(incident.id, "director_decision", "Directeur de garde");
};

const validateDirectionDecision = () => {
if (!incident) return;
addIncidentAction(incident.id, {
label: "Décision direction tracée",
by: "Direction",
role: "direction",
at: new Date().toISOString(),
status: "done",
context: {
decisions: incidentUi.directionDecisions,
notes: incidentUi.directionNotes,
policeConsidered: incidentUi.policeConsidered,
},
});
};

const closeIncident = () => {
if (!incident || !patient) return;

closeIncidentForPatient(incident.id, "Service", {
found: true,
foundAt: new Date().toISOString(),
foundLocation: incidentUi.foundLocation || "Établissement",
finalComment: incidentUi.finalComment || "",
});

const closeIncident = () => {
if (!incident || !patient) return;

closeIncidentForPatient(incident.id, "Service", {
found: true,
foundAt: new Date().toISOString(),
foundLocation: incidentUi.foundLocation || "Établissement",
finalComment: incidentUi.finalComment || "",
});

navigate(`/patient/${patient.id}`);
};

setActiveSection("synthese");
const reportPayload = buildIncidentReportPayload({
patient,
incident,
incidentUi,
});

// 🔴 SAUVEGARDE DU RAPPORT (clé du système)
writeJsonStorage(`incident_report_${incident.id}`, {
...reportPayload,
closedAt: new Date().toISOString(),
exportedAt: new Date().toISOString(),
});

// 🔴 CLOTURE INCIDENT
closeIncidentForPatient(incident.id, "Service", {
found: true,
foundAt: new Date().toISOString(),
foundLocation: incidentUi.foundLocation || "Établissement",
finalComment: incidentUi.finalComment || "",
});

setActiveSection("synthese");
};

const exportIncidentReport = () => {
if (!patient) return;
const html = buildIncidentPrintableHtml({
patient,
incident,
incidentUi,
currentStatus,
elapsedMinutes,
});

writeJsonStorage(`${INCIDENT_EXPORT_PREFIX}${patient.id}`, {
exportedAt: new Date().toISOString(),
incidentUi,
incident,
});

const popup = window.open("", "_blank", "width=980,height=760");
if (!popup) return;
popup.document.write(html);
popup.document.close();
popup.focus();
popup.print();
};

if (!patient) {
return (
<AppShell header={<AppHeader subtitle="Vue incident disparition" />}>
<div style={{ padding: 16 }}>Patient introuvable.</div>
</AppShell>
);
}

const statusMap = {
created: { label: "Disparition déclarée", color: "red" },
internal_search: { label: "Recherche interne", color: "amber" },
security_investigation: { label: "Sécurité en cours", color: "amber" },
director_decision: { label: "Décision direction", color: "blue" },
closed: { label: "Clôturé", color: "green" },
};

const currentStatus = statusMap[incident?.status] || {
label: incident?.status || "Inconnu",
color: "neutral",
};

const elapsedMinutes = incident?.createdAt
? Math.floor((Date.now() - new Date(incident.createdAt)) / 60000)
: null;

const patientCalledDone = safeArray(incident?.incidentLog).some((evt) =>
String(evt?.label || "").toLowerCase().includes("appel patient")
);

const internalSearchDone = safeArray(incident?.incidentLog).some((evt) =>
String(evt?.label || "").toLowerCase().includes("recherche interne")
);

const securityAlertDone = safeArray(incident?.incidentLog).some((evt) => {
const label = String(evt?.label || "").toLowerCase();
return label.includes("sécurité") || label.includes("pc sécurité");
});

const directorAlertDone = safeArray(incident?.incidentLog).some((evt) =>
String(evt?.label || "").toLowerCase().includes("directeur")
);

const descriptionSummary = [
...safeArray(incidentUi.descriptionPhysicalTags),
...safeArray(incidentUi.descriptionMobilityTags),
...safeArray(incidentUi.descriptionClothingTags),
incidentUi.freeDescription || "",
]
.filter(Boolean)
.join(" • ");

return (
<AppShell header={<AppHeader subtitle="Vue incident disparition" />}>
<div
className="pv-page"
style={{
background: "linear-gradient(180deg, rgba(245,248,255,1) 0%, rgba(249,250,252,1) 100%)",
minHeight: "100%",
padding: 16,
}}
>
<div
style={{
borderRadius: 24,
border: "1px solid #dbe4f0",
background: "linear-gradient(135deg, #ffffff 0%, #f7faff 100%)",
boxShadow: "0 16px 40px rgba(15, 23, 42, 0.07)",
padding: 12,
marginBottom: 18,
}}
>
<PatientIdentityBar
patient={patient}
actions={
<>
<button
type="button"
className="pv-btn ghost"
onClick={() => navigate(`/patient/${patient.id}`)}
>
Retour fiche patient
</button>

{!incident ? (
<button type="button" className="pv-btn danger" onClick={openIncident}>
🚨 Déclarer disparition
</button>
) : (
<button type="button" className="pv-btn ghost" onClick={exportIncidentReport}>
Exporter rapport
</button>
)}
</>
}
/>
</div>

{!incident ? (
<SectionCard
title="Aucun incident actif"
subtitle="Déclare une disparition pour ouvrir la vue métier service / PC sécurité / direction."
>
<button type="button" className="pv-btn primary" onClick={openIncident}>
Ouvrir un incident
</button>
</SectionCard>
) : (
<div
style={{
display: "grid",
gridTemplateColumns: "260px 1fr",
gap: 18,
alignItems: "start",
}}
>
<aside
style={{
position: "sticky",
top: 12,
border: "1px solid #dbe4f0",
borderRadius: 22,
background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
padding: 12,
}}
>
<div
style={{
padding: "8px 10px 14px",
fontSize: 12,
letterSpacing: ".08em",
textTransform: "uppercase",
color: "#64748b",
}}
>
Incident
</div>

{menuItems.map((item) => (
<button
key={item.id}
type="button"
onClick={() => handleSectionChange(item.id)}
style={{
width: "100%",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
borderRadius: 16,
border: activeSection === item.id ? "1px solid #bfd3ff" : "1px solid #edf2f7",
background: activeSection === item.id ? "#eef4ff" : "#ffffff",
color: activeSection === item.id ? "#17376a" : "#0f172a",
fontWeight: 700,
padding: "12px 14px",
marginBottom: 8,
cursor: "pointer",
textAlign: "left",
}}
>
<span>{item.label}</span>
</button>
))}
</aside>

<main className="incident-main" style={{ display: "grid", gap: 18 }}>
{activeSection === "synthese" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Synthèse incident"
subtitle="Vue rapide partagée entre service, PC sécurité et direction."
actions={
<>
<StatusChip color={currentStatus.color}>{currentStatus.label}</StatusChip>
<StatusChip color="amber">
{elapsedMinutes !== null ? `${elapsedMinutes} min` : "Temps non connu"}
</StatusChip>
</>
}
>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
gap: 12,
}}
>
<InfoBox label="Statut" value={currentStatus.label} />
<InfoBox
label="Temps écoulé"
value={elapsedMinutes !== null ? `${elapsedMinutes} min` : "—"}
/>
<InfoBox
label="Dernier lieu vu"
value={incidentUi.lastSeenLocation || patient?.service || "Non renseigné"}
/>
<InfoBox
label="Dernière heure connue"
value={
incidentUi.lastSeenAt
? formatShortDateTime(incidentUi.lastSeenAt)
: "Non renseignée"
}
/>
<InfoBox label="PC sécurité" value={securityAlertDone ? "Alerté" : "Non alerté"} />
<InfoBox label="Direction" value={directorAlertDone ? "Alertée" : "Non alertée"} />
</div>
</SectionCard>

<SectionCard
title="Résumé transmis"
subtitle="Lecture simple et rapide de la situation."
>
<div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }}>
<div>
<strong>Contexte :</strong>{" "}
{safeArray(incidentUi.contextTags).join(" • ") || "Non précisé"}
</div>
<div>
<strong>Vulnérabilité :</strong>{" "}
{safeArray(incidentUi.vulnerabilityTags).join(" • ") || "Non précisée"}
</div>
<div>
<strong>Danger :</strong>{" "}
{[
...safeArray(incidentUi.dangerSelfTags),
...safeArray(incidentUi.dangerOthersTags),
...safeArray(incidentUi.dangerContextTags),
].join(" • ") || "Non précisé"}
</div>
<div>
<strong>Description :</strong> {descriptionSummary || "Non précisée"}
</div>
</div>
</SectionCard>

<SectionCard
title="Vigilances immédiates"
subtitle="Ce qui manque encore dans la prise en charge."
>
<div style={{ display: "grid", gap: 8, fontSize: 14, color: "#334155" }}>
<div>{patientCalledDone ? "✅ Patient appelé" : "⚠️ Patient non appelé"}</div>
<div>
{internalSearchDone
? "✅ Recherche interne tracée"
: "⚠️ Recherche interne non tracée"}
</div>
<div>
{securityAlertDone
? "✅ PC sécurité alerté"
: "⚠️ PC sécurité non alerté"}
</div>
<div>
{directorAlertDone
? "✅ Directeur de garde alerté"
: "⚠️ Directeur de garde non alerté"}
</div>
</div>
</SectionCard>
</div>
)}

{activeSection === "contexte" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Contexte de disparition"
subtitle="Contexte, vulnérabilité, dangerosité et description utile."
>
<ChipToggleGroup
options={CONTEXT_OPTIONS}
values={incidentUi.contextTags}
onToggle={(value) => toggleUiTag("contextTags", value)}
color="blue"
/>
</SectionCard>

<SectionCard
title="Vulnérabilité / fragilité"
subtitle="Éléments utiles pour prioriser les recherches."
>
<ChipToggleGroup
options={VULNERABILITY_OPTIONS}
values={incidentUi.vulnerabilityTags}
onToggle={(value) => toggleUiTag("vulnerabilityTags", value)}
color="purple"
/>
</SectionCard>

<SectionCard
title="Danger pour lui-même"
subtitle="Risque immédiat pour le patient."
>
<ChipToggleGroup
options={DANGER_SELF_OPTIONS}
values={incidentUi.dangerSelfTags}
onToggle={(value) => toggleUiTag("dangerSelfTags", value)}
color="red"
/>
</SectionCard>

<SectionCard
title="Danger pour autrui"
subtitle="Risque environnemental ou relationnel."
>
<ChipToggleGroup
options={DANGER_OTHERS_OPTIONS}
values={incidentUi.dangerOthersTags}
onToggle={(value) => toggleUiTag("dangerOthersTags", value)}
color="red"
/>
</SectionCard>

<SectionCard
title="Danger contextuel"
subtitle="Éléments aggravants autour de la disparition."
>
<ChipToggleGroup
options={DANGER_CONTEXT_OPTIONS}
values={incidentUi.dangerContextTags}
onToggle={(value) => toggleUiTag("dangerContextTags", value)}
color="amber"
/>
</SectionCard>

<SectionCard
title="Description physique utile"
subtitle="Description simple et exploitable."
>
<ChipToggleGroup
options={DESCRIPTION_PHYSICAL_OPTIONS}
values={incidentUi.descriptionPhysicalTags}
onToggle={(value) => toggleUiTag("descriptionPhysicalTags", value)}
color="green"
/>
</SectionCard>

<SectionCard title="Mobilité / comportement">
<ChipToggleGroup
options={DESCRIPTION_MOBILITY_OPTIONS}
values={incidentUi.descriptionMobilityTags}
onToggle={(value) => toggleUiTag("descriptionMobilityTags", value)}
color="green"
/>
</SectionCard>

<SectionCard title="Tenue / vêtements">
<ChipToggleGroup
options={DESCRIPTION_CLOTHING_OPTIONS}
values={incidentUi.descriptionClothingTags}
onToggle={(value) => toggleUiTag("descriptionClothingTags", value)}
color="green"
/>
</SectionCard>

<SectionCard title="Derniers repères connus">
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<label style={{ display: "grid", gap: 6 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Dernier lieu vu
</span>
<input
value={incidentUi.lastSeenLocation}
onChange={(e) => setUiField("lastSeenLocation", e.target.value)}
placeholder="Ex : chambre 202 / couloir / hall"
style={{
minHeight: 40,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: "0 12px",
}}
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Dernière heure connue
</span>
<input
type="datetime-local"
value={incidentUi.lastSeenAt}
onChange={(e) => setUiField("lastSeenAt", e.target.value)}
style={{
minHeight: 40,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: "0 12px",
}}
/>
</label>
</div>

<label style={{ display: "grid", gap: 6, marginTop: 12 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Description libre complémentaire
</span>
<textarea
value={incidentUi.freeDescription}
onChange={(e) => setUiField("freeDescription", e.target.value)}
placeholder="Description utile pour les recherches"
style={{
minHeight: 100,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: 12,
}}
/>
</label>
</SectionCard>
</div>
)}

{activeSection === "service" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Recherche interne service"
subtitle="Zones immédiates vérifiées par le service."
>
<ChipToggleGroup
options={INTERNAL_SEARCH_ZONES}
values={incidentUi.internalZones}
onToggle={(value) => toggleUiTag("internalZones", value)}
color="blue"
/>
</SectionCard>

<SectionCard
title="Actions service"
subtitle="Traçabilité des actions immédiates."
>
<div style={{ display: "grid", gap: 10 }}>
<button type="button" className="pv-btn ghost" onClick={markInternalSearch}>
🔍 Valider recherche interne
</button>

<button type="button" className="pv-btn ghost" onClick={markPhoneCall}>
📞 Patient appelé
</button>

<button type="button" className="pv-btn ghost" onClick={markFamilyContact}>
👥 Personne de confiance / entourage contacté
</button>
</div>
</SectionCard>

<SectionCard title="État service">
<div style={{ display: "grid", gap: 8, fontSize: 14, color: "#334155" }}>
<div>{patientCalledDone ? "✅ Patient appelé" : "⚠️ Appel patient non tracé"}</div>
<div>
{internalSearchDone
? "✅ Recherche interne tracée"
: "⚠️ Recherche interne non tracée"}
</div>
<div>
{incidentUi.familyContacted
? "✅ Entourage contacté"
: "⚠️ Entourage non tracé"}
</div>
</div>
</SectionCard>
</div>
)}

{activeSection === "security" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Caméras vérifiées"
subtitle="Ce qui a été relu par le PC sécurité."
>
<ChipToggleGroup
options={SECURITY_CAMERAS}
values={incidentUi.securityCameras}
onToggle={(value) => toggleUiTag("securityCameras", value)}
color="amber"
/>
</SectionCard>

<SectionCard title="Sorties vérifiées">
<ChipToggleGroup
options={SECURITY_EXITS}
values={incidentUi.securityExits}
onToggle={(value) => toggleUiTag("securityExits", value)}
color="amber"
/>
</SectionCard>

<SectionCard title="Zones extérieures vérifiées">
<ChipToggleGroup
options={SECURITY_EXTERNALS}
values={incidentUi.securityExternals}
onToggle={(value) => toggleUiTag("securityExternals", value)}
color="amber"
/>
</SectionCard>

<SectionCard title="Éléments suspects / utiles">
<ChipToggleGroup
options={SECURITY_SUSPICIOUS}
values={incidentUi.securitySuspicious}
onToggle={(value) => toggleUiTag("securitySuspicious", value)}
color="red"
/>
</SectionCard>

<SectionCard
title="Compte rendu sécurité"
subtitle="Résumé lisible par le service et la direction."
>
<textarea
value={incidentUi.securityNotes}
onChange={(e) => setUiField("securityNotes", e.target.value)}
placeholder="Résumé clair des vérifications effectuées…"
style={{
width: "100%",
minHeight: 100,
borderRadius: 12,
border: "1px solid #e5e7eb",
padding: 12,
}}
/>
</SectionCard>

<SectionCard
title="Synthèse sécurité visible par tous"
subtitle="Ce bloc sera repris dans le journal partagé."
>
<div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }}>
{buildSecurityBrief(incidentUi) || "Aucun compte rendu sécurité"}
</div>
</SectionCard>

<button type="button" className="pv-btn primary" onClick={validateSecurityChecks}>
Valider les vérifications sécurité
</button>
</div>
)}

{activeSection === "direction" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Direction"
subtitle="Décision et consignes tracées."
>
<ChipToggleGroup
options={DIRECTION_DECISIONS}
values={incidentUi.directionDecisions}
onToggle={(value) => toggleUiTag("directionDecisions", value)}
color="purple"
/>

<label style={{ display: "grid", gap: 6, marginTop: 14 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Notes direction
</span>
<textarea
value={incidentUi.directionNotes}
onChange={(e) => setUiField("directionNotes", e.target.value)}
placeholder="Arbitrage, consignes, suites à donner..."
style={{
minHeight: 100,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: 12,
}}
/>
</label>

<label
style={{
display: "flex",
alignItems: "center",
gap: 10,
fontSize: 13,
color: "#334155",
marginTop: 12,
}}
>
<input
type="checkbox"
checked={incidentUi.policeConsidered}
onChange={(e) => setUiField("policeConsidered", e.target.checked)}
/>
Forces de l’ordre envisagées / à discuter
</label>
</SectionCard>

<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
<button type="button" className="pv-btn ghost" onClick={alertDirector}>
Alerter directeur de garde
</button>
<button type="button" className="pv-btn primary" onClick={validateDirectionDecision}>
Valider décision direction
</button>
</div>
</div>
)}

{activeSection === "journal" && (
<SectionCard
title="Journal partagé"
subtitle="Horodatage commun service / sécurité / direction."
>
<div style={{ display: "grid", gap: 0 }}>
{safeArray(incident?.incidentLog).length === 0 ? (
<div style={{ fontSize: 14, color: "#64748b" }}>Aucun événement tracé.</div>
) : (
safeArray(incident.incidentLog).map((evt) => (
<div
key={evt.id || `${evt.at}-${evt.label}`}
style={{
display: "grid",
gridTemplateColumns: "180px 140px 1fr",
gap: 12,
padding: "12px 0",
borderBottom: "1px solid #f1f5f9",
fontSize: 14,
color: "#334155",
}}
>
<div style={{ fontWeight: 700 }}>{formatShortDateTime(evt.at)}</div>
<div>{safe(evt.by, "—")}</div>
<div>{safe(evt.label, "—")}</div>
</div>
))
)}
</div>
</SectionCard>
)}

{activeSection === "cloture" && (
<div style={{ display: "grid", gap: 16 }}>
<SectionCard
title="Issue / clôture"
subtitle="Clôture propre et exportable de l’incident."
>
<div style={{ display: "grid", gap: 12 }}>
<label style={{ display: "grid", gap: 6 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Lieu de retrouvaille / issue
</span>
<input
value={incidentUi.foundLocation}
onChange={(e) => setUiField("foundLocation", e.target.value)}
placeholder="Ex : établissement, parking, domicile, voie publique"
style={{
minHeight: 40,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: "0 12px",
}}
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
Commentaire final
</span>
<textarea
value={incidentUi.finalComment}
onChange={(e) => setUiField("finalComment", e.target.value)}
placeholder="Synthèse courte de l’issue."
style={{
minHeight: 100,
borderRadius: 12,
border: "1px solid #dbe4f0",
padding: 12,
}}
/>
</label>
</div>
</SectionCard>

<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
<button type="button" className="pv-btn primary" onClick={closeIncident}>
✅ Clôturer l’incident
</button>
<button type="button" className="pv-btn ghost" onClick={exportIncidentReport}>
Exporter rapport
</button>
</div>
</div>
)}
</main>
</div>
)}
</div>
</AppShell>
);
}