import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import PatientIdentityBar from "./components/PatientIdentityBar";
import { AppShell } from "./components/AppShell";
import { patients } from "./data/patients";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import "./PatientView.css";
import PatientInsightsPanel from "./components/PatientInsightsPanel";

const REPORT_PREFIX = "carabbas_staff_report_";
const REPORT_HISTORY_PREFIX = "carabbas_staff_report_history_";
const COPILOT_HANDOFF_PREFIX = "carabbas_staff_handoff_";
const COPILOT_ACTIONS_PREFIX = "carabbas_staff_to_copilot_actions_";
const STAFF_PDF_PREFIX = "carabbas_staff_pdf_export_";
const INCIDENT_UI_PREFIX = "carabbas_incident_ui_";

const DISAPPEARANCE_CONTEXT_OPTIONS = [
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

const MEDICAL_DANGER_OPTIONS = [
"Danger pour lui-même",
"Danger pour les autres",
"Risque suicidaire",
"Risque de confusion sévère",
"Risque de chute grave",
"Traitement indispensable non pris",
"Oxygène / matériel nécessaire",
"Risque médical immédiat",
];

const DESCRIPTION_CRITERIA_OPTIONS = [
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
"Fauteuil roulant",
"Déambulateur",
"Canne",
"Marche lente",
"Marche rapide",
"Désorienté",
"Agité",
"Calme",
"Vêtements clairs",
"Vêtements foncés",
"Pyjama",
"Blouse / tenue d’hôpital",
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

const EXTENDED_SEARCH_ZONES = [
"Hall principal",
"Accueil",
"Parking",
"Abords immédiats",
"Autres services",
"PC sécurité",
"Caméras / vidéos",
"Extérieurs",
];

function safe(value, fallback = "Non renseigné") {
return value === null || value === undefined || value === "" ? fallback : value;
}

function safeArray(value) {
return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeText(value) {
return String(value || "").toLowerCase();
}

function formatShortDate(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return safe(value);
return date.toLocaleDateString("fr-FR");
}

function formatShortDateTime(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return safe(value);
return date.toLocaleString("fr-FR");
}

function getLengthOfStay(patient) {
const entry = patient?.dateEntree || patient?.admissionDate;
if (!entry) return 0;
const start = new Date(entry);
const today = new Date();
const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
return Math.max(0, diff);
}

function getTargetDate(patient) {
return (
patient?.dateSortiePrevue ||
patient?.dischargePlanning?.targetDateValidated ||
patient?.dischargePlanning?.targetDateEnvisaged ||
""
);
}

function getSolutionLabel(patient) {
return (
patient?.dischargePlanning?.solutionLabel ||
patient?.solutionLabel ||
patient?.orientation ||
"Aucune"
);
}

function getBlockageLabel(patient) {
return patient?.blockReason || patient?.blocage || "Non défini";
}

function isMedicalReady(patient) {
return Boolean(
patient?.medicalReady ||
patient?.sortantMedical ||
patient?.medicalReadiness?.isMedicallyReady
);
}

function isComplexPatient(patient) {
const severity = normalizeText(patient?.severity || patient?.gravite);
return (
severity.includes("crit") ||
severity.includes("complex") ||
safeArray(patient?.history).length > 0 ||
safeArray(patient?.dynamicBlockages).length > 1
);
}

function isVulnerable(patient) {
return Boolean(patient?.isVulnerable) || safeArray(patient?.vulnerability?.criteria).length > 0;
}

function getPatientSubject(patient) {
const block = getBlockageLabel(patient);
const solution = getSolutionLabel(patient);
const normalizedBlock = normalizeText(block);
const normalizedSolution = normalizeText(solution);

if (normalizedBlock.includes("logement")) return "Sortie bloquée logement";
if (normalizedBlock.includes("ase")) return "ASE à sécuriser";
if (normalizedBlock.includes("dac")) return "Attente retour DAC";
if (normalizedBlock.includes("idel")) return "Retour domicile IDEL";
if (normalizedSolution.includes("hdj")) return "HDJ à construire / sécuriser";
if (normalizedSolution.includes("ehpad")) return "Orientation EHPAD à sécuriser";
if (normalizedSolution.includes("smr")) return "Orientation SMR à sécuriser";
if (block && block !== "Non défini") return block;
if (solution && solution !== "Aucune") return `Parcours ${solution}`;
if (isMedicalReady(patient)) return "Sortie à organiser";
if (isVulnerable(patient)) return "Surveillance vulnérabilité";
return "À qualifier";
}

function getRiskLevel(patient) {
const los = getLengthOfStay(patient);
const complex = isComplexPatient(patient);
const blocked = getBlockageLabel(patient) !== "Non défini";

if (complex && los >= 12 && blocked) return { label: "Critique", color: "red" };
if ((los >= 10 && blocked) || (complex && blocked)) return { label: "Élevé", color: "amber" };
if (los >= 7 || complex || isVulnerable(patient)) return { label: "Sous surveillance", color: "blue" };
return { label: "Faible", color: "green" };
}

function getStaffPriority(patient) {
let score = 0;
const los = getLengthOfStay(patient);
if (los >= 10) score += 3;
if (getBlockageLabel(patient) !== "Non défini") score += 3;
if (!getTargetDate(patient)) score += 2;
if (isVulnerable(patient)) score += 2;
if (isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune") score += 3;

if (score >= 8) return { score, label: "Critique", color: "red" };
if (score >= 5) return { score, label: "Élevée", color: "amber" };
if (score >= 3) return { score, label: "Sous surveillance", color: "blue" };
return { score, label: "Faible", color: "green" };
}

function getMovementDuration(start, end) {
if (!start) return "—";
const startDate = new Date(start);
const endDate = end ? new Date(end) : new Date();
if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "—";
const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
return `${Math.max(0, diff)} j`;
}

function getMovements(patient) {
const movements = safeArray(patient?.mouvements);
if (movements.length) return movements;

return [
{
id: "current_service",
service: patient?.service || "Service non renseigné",
dateEntree: patient?.dateEntree || patient?.admissionDate || "",
dateSortie: null,
},
];
}

function getLongestMovement(movements) {
if (!movements.length) return null;
return [...movements]
.map((m) => ({
...m,
durationDays: parseInt(getMovementDuration(m.dateEntree, m.dateSortie), 10) || 0,
}))
.sort((a, b) => b.durationDays - a.durationDays)[0];
}

function getTimeSince(dateLike) {
if (!dateLike) return "Non renseigné";
const d = new Date(dateLike);
if (Number.isNaN(d.getTime())) return "Non renseigné";
const now = new Date();
const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
if (diffDays <= 0) return "Aujourd’hui";
if (diffDays === 1) return "Il y a 1 jour";
return `Il y a ${diffDays} jours`;
}

function getDecisionStatus(patient) {
if (patient?.dischargePlanning?.targetDateValidated) return { label: "Validé", color: "green" };
if (getTargetDate(patient) || getSolutionLabel(patient) !== "Aucune") return { label: "À confirmer", color: "amber" };
return { label: "En cours", color: "blue" };
}

function getDateStatus(date) {
if (!date) return { label: "Non définie", color: "neutral" };
const today = new Date();
const target = new Date(date);
const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
if (diff < 0) return { label: "Dépassée", color: "red" };
if (diff <= 1) return { label: "Proche", color: "amber" };
return { label: "OK", color: "green" };
}

function buildStaffAutoSummary(patient) {
const risk = getStaffPriority(patient);
const subject = getPatientSubject(patient);
const targetDate = getTargetDate(patient);
const solution = getSolutionLabel(patient);
const blockage = getBlockageLabel(patient);

return {
situation: subject,
objectif:
solution !== "Aucune"
? `Sécuriser ${solution}`
: isMedicalReady(patient)
? "Trouver une solution d’aval"
: "Qualifier la stratégie de sortie",
decision:
blockage !== "Non défini"
? `Arbitrer / lever ${blockage}`
: solution !== "Aucune"
? `Confirmer ${solution}`
: "Décision staff à poser",
urgence: risk.label,
dateCible: targetDate ? formatShortDate(targetDate) : "Sans date",
};
}

function buildSmartSuggestions(patient, report) {
const suggestions = [];
const solution = getSolutionLabel(patient);
const blockage = getBlockageLabel(patient);
const targetDate = getTargetDate(patient);

if (!targetDate) suggestions.push("Poser une date cible staff avant fin de réunion.");
if (isMedicalReady(patient) && solution === "Aucune") suggestions.push("Créer une action copilote pour sécuriser une solution d’aval.");
if (blockage !== "Non défini") suggestions.push(`Créer une action de levée du blocage : ${blockage}.`);
if (isVulnerable(patient)) suggestions.push("Prévoir une vigilance renforcée dans le staff et la synthèse.");
if (!report.actions?.trim()) suggestions.push("Formuler une décision staff explicite à transmettre au copilote.");
if (!report.objectifs?.trim()) suggestions.push("Préciser l’objectif de sortie / coordination.");
return suggestions.slice(0, 5);
}

function buildServiceIndicators(currentPatient, allPatients) {
const serviceName = currentPatient?.service;
const servicePatients = allPatients.filter((p) => p?.service === serviceName);
return {
total: servicePatients.length,
critical: servicePatients.filter((p) => getStaffPriority(p).color === "red").length,
withoutTargetDate: servicePatients.filter((p) => !getTargetDate(p)).length,
vulnerable: servicePatients.filter((p) => isVulnerable(p)).length,
medicallyReadyWithoutSolution: servicePatients.filter((p) => isMedicalReady(p) && getSolutionLabel(p) === "Aucune").length,
};
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

function readReport(patientId) {
if (!patientId || typeof window === "undefined") return null;
try {
const raw = window.localStorage.getItem(`${REPORT_PREFIX}${patientId}`);
return raw ? JSON.parse(raw) : null;
} catch {
return null;
}
}

function writeReport(patientId, value) {
if (!patientId || typeof window === "undefined") return;
window.localStorage.setItem(`${REPORT_PREFIX}${patientId}`, JSON.stringify(value));
}

function readReportHistory(patientId) {
if (!patientId || typeof window === "undefined") return [];
try {
const raw = window.localStorage.getItem(`${REPORT_HISTORY_PREFIX}${patientId}`);
return raw ? JSON.parse(raw) : [];
} catch {
return [];
}
}

function writeReportHistory(patientId, value) {
if (!patientId || typeof window === "undefined") return;
window.localStorage.setItem(`${REPORT_HISTORY_PREFIX}${patientId}`, JSON.stringify(value));
}

function writeCopilotHandoff(patientId, value) {
if (!patientId || typeof window === "undefined") return;
window.localStorage.setItem(`${COPILOT_HANDOFF_PREFIX}${patientId}`, JSON.stringify(value));
}

function appendCopilotAction(patientId, action) {
if (!patientId || typeof window === "undefined") return [];
try {
const key = `${COPILOT_ACTIONS_PREFIX}${patientId}`;
const raw = window.localStorage.getItem(key);
const current = raw ? JSON.parse(raw) : [];
const next = [action, ...current];
window.localStorage.setItem(key, JSON.stringify(next));
return next;
} catch {
return [];
}
}

function writeStaffPdfExport(patientId, payload) {
if (!patientId || typeof window === "undefined") return;
window.localStorage.setItem(`${STAFF_PDF_PREFIX}${patientId}`, JSON.stringify(payload));
}

function getBadgeColor(item) {
if (item.id === "alertes" && Number(item.badge) > 0) return "badge-red";
if (item.id === "parcours") return "badge-blue";
if (item.id === "vulnerabilite" && Number(item.badge) > 0) return "badge-purple";
if (item.id === "sortie" && item.badge === "Sans date") return "badge-amber";
if (item.id === "staff" && item.badge === "Brouillon") return "badge-neutral";
if (item.id === "staff" && item.badge === "Historisé") return "badge-green";
if (item.id === "plan" && Number(item.badge) > 0) return "badge-blue";
if (item.id === "synthese") return "badge-blue";
return "badge-neutral";
}

function buildPrintableStaffHtml({ patient, report, savedAt, autoSummary, nextReview, priority }) {
return `
<html>
<head>
<title>Export staff</title>
<style>
@page { size: A4; margin: 16mm; }
body { font-family: Arial, sans-serif; color: #111827; }
h1 { margin: 0 0 12px; color: #17376a; }
h2 { margin: 20px 0 8px; color: #17376a; font-size: 17px; }
.meta, .block { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.label { font-weight: 700; color: #475569; margin-bottom: 6px; }
.chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eef4ff; color: #17376a; font-size: 11px; font-weight: 700; }
</style>
</head>
<body>
<h1>Export staff patient</h1>
<div class="meta">
<div><strong>Patient :</strong> ${safe(patient?.nom, "—")} ${safe(patient?.prenom, "")}</div>
<div><strong>Date de naissance :</strong> ${safe(patient?.dateNaissance, "—")}</div>
<div><strong>Service :</strong> ${safe(patient?.service, "—")} · <strong>Chambre :</strong> ${safe(patient?.chambre, "—")} · <strong>Lit :</strong> ${safe(patient?.lit, "—")}</div>
<div><strong>Historisé le :</strong> ${savedAt ? formatShortDateTime(savedAt) : "Non historisé"} · <span class="chip">Priorité ${safe(priority?.label, "—")}</span></div>
</div>

<h2>Résumé automatique</h2>
<div class="grid">
<div class="block"><div class="label">Sujet</div>${safe(autoSummary?.situation, "—")}</div>
<div class="block"><div class="label">Objectif recommandé</div>${safe(autoSummary?.objectif, "—")}</div>
<div class="block"><div class="label">Décision attendue</div>${safe(autoSummary?.decision, "—")}</div>
<div class="block"><div class="label">Date cible</div>${safe(autoSummary?.dateCible, "—")}</div>
</div>

<h2>Synthèse staff validée</h2>
<div class="block"><div class="label">Synthèse</div>${safe(report?.infos, "Non renseignée")}</div>
<div class="block"><div class="label">Objectif</div>${safe(report?.objectifs, "Non renseigné")}</div>
<div class="block"><div class="label">Décision</div>${safe(report?.actions, "Non renseignée")}</div>
<div class="block"><div class="label">Vigilance</div>${safe(report?.vigilances, "Non renseignée")}</div>

<h2>Prochain jalon</h2>
<div class="grid">
<div class="block"><div class="label">Date de revue</div>${safe(nextReview?.date ? formatShortDate(nextReview.date) : "", "Non définie")}</div>
<div class="block"><div class="label">Responsable</div>${safe(nextReview?.owner, "Non défini")}</div>
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
className="app-chip"
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

function SectionCard({ title, subtitle, actions, children, className = "", style = {} }) {
return (
<section
className={`pv-card ${className}`.trim()}
style={{
border: "1px solid #e5e7eb",
borderRadius: 20,
background: "#ffffff",
boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
...style,
}}
>
<div className="pv-section-head">
<div>
<h2 className="pv-title">{title}</h2>
{subtitle ? <p className="pv-subcopy">{subtitle}</p> : null}
</div>
{actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
</div>
{children}
</section>
);
}

function InfoGrid({ items, columns = 4 }) {
return (
<div className="pv-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
{items.map((item) => (
<div
key={item.label}
className="pv-item"
style={{
border: "1px solid #edf2f7",
background: "#fcfdff",
borderRadius: 16,
padding: 14,
minHeight: 92,
}}
>
<div className="pv-label">{item.label}</div>
<div className="pv-value">{safe(item.value)}</div>
</div>
))}
</div>
);
}

function ChipToggleGroup({ options, values, onToggle, color = "blue" }) {
return (
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{options.map((item) => {
const active = values.includes(item);
const activeStyles = {
blue: { background: "#eaf2ff", border: "1px solid #bfd3ff", color: "#17376a" },
red: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" },
purple: { background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#6d28d9" },
amber: { background: "#fff8e8", border: "1px solid #f6df9b", color: "#a16207" },
green: { background: "#effaf3", border: "1px solid #cdebd8", color: "#166534" },
};
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

function IncidentChecklist({ title, subtitle, items, values, onToggle, color = "blue" }) {
return (
<div
style={{
border: "1px solid #edf2f7",
background: "#fbfcfe",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ marginBottom: 10 }}>
<div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{title}</div>
{subtitle ? (
<div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{subtitle}</div>
) : null}
</div>
<ChipToggleGroup options={items} values={values} onToggle={onToggle} color={color} />
</div>
);
}

function StaffEditor({
value,
onChange,
onSave,
savedAt,
compact,
onPrint,
onTransmit,
transmittedAt,
onPushAction,
projectionMode,
onToggleProjection,
autoSummary,
priority,
nextReview,
onChangeNextReview,
suggestions,
syncEnabled,
onToggleSync,
autoSyncAt,
}) {
const sections = [
["infos", "Informations utiles de staff"],
["objectifs", "Objectifs de sortie / coordination"],
["actions", "Actions décidées"],
["vigilances", "Points de vigilance"],
];

return (
<>
<SectionCard
title="Aide à la décision"
subtitle="Résumé automatique pour démarrer rapidement le staff."
actions={
<>
<StatusChip color={priority.color}>Priorité {priority.label}</StatusChip>
<StatusChip color={autoSummary.dateCible === "Sans date" ? "amber" : "blue"}>
Date cible {autoSummary.dateCible}
</StatusChip>
</>
}
>
<div className="pv-auto-summary">
<div className="pv-auto-summary__row"><strong>Sujet :</strong> {autoSummary.situation}</div>
<div className="pv-auto-summary__row"><strong>Objectif recommandé :</strong> {autoSummary.objectif}</div>
<div className="pv-auto-summary__row"><strong>Décision attendue :</strong> {autoSummary.decision}</div>
<div className="pv-auto-summary__row"><strong>Urgence :</strong> {autoSummary.urgence}</div>
</div>
</SectionCard>

<SectionCard title="Suggestions intelligentes" subtitle="Aides automatiques sans remplacer la décision des soignants.">
<div className="pv-list">
{suggestions.length === 0 ? (
<div className="pv-list-item pv-muted">Aucune suggestion prioritaire.</div>
) : (
suggestions.map((item) => (
<div key={item} className="pv-list-item">
<div className="pv-list-item__title">{item}</div>
</div>
))
)}
</div>
</SectionCard>

<SectionCard
title="Mode staff"
subtitle="Ce qui est décidé ici doit pouvoir être repris ensuite par le copilote."
actions={
<>
{savedAt ? <StatusChip color="green">Enregistré le {new Date(savedAt).toLocaleDateString("fr-FR")}</StatusChip> : null}
{transmittedAt ? <StatusChip color="blue">Transmis au copilote le {new Date(transmittedAt).toLocaleDateString("fr-FR")}</StatusChip> : null}
{autoSyncAt ? <StatusChip color="purple">Synchronisé auto le {new Date(autoSyncAt).toLocaleDateString("fr-FR")}</StatusChip> : null}
<button type="button" className="pv-btn ghost" onClick={onToggleProjection}>
{projectionMode ? "Quitter projection" : "Mode projection"}
</button>
<button type="button" className="pv-btn ghost" onClick={onPrint}>
Exporter PDF
</button>
<button type="button" className="pv-btn ghost" onClick={onTransmit}>
Envoyer au copilote
</button>
<button type="button" className={`pv-btn ${syncEnabled ? "primary" : "ghost"}`} onClick={onToggleSync}>
{syncEnabled ? "Sync auto active" : "Activer sync auto"}
</button>
<button type="button" className="pv-btn primary" onClick={onSave}>
Historiser
</button>
</>
}
>
<div className="pv-staff-summary">
<div className="pv-staff-summary__title">Synthèse staff validée</div>
<div className="pv-staff-summary__body">
{value.objectifs || value.actions || value.vigilances || value.infos
? [value.objectifs, value.actions, value.vigilances].filter(Boolean).slice(0, 3).join(" • ")
: "Aucune synthèse staff rédigée."}
</div>
</div>

<div className="pv-next-review">
<div className="pv-next-review__title">Prochain jalon staff</div>
<div className="pv-next-review__fields">
<label className="pv-field-inline">
<span className="pv-label">Date de revue</span>
<input type="date" className="pv-input" value={nextReview.date} onChange={(e) => onChangeNextReview("date", e.target.value)} />
</label>
<label className="pv-field-inline">
<span className="pv-label">Responsable</span>
<input type="text" className="pv-input" value={nextReview.owner} onChange={(e) => onChangeNextReview("owner", e.target.value)} placeholder="Nom du porteur" />
</label>
</div>
</div>

{projectionMode ? (
<div className="pv-projection">
<div className="pv-projection__line"><strong>Synthèse :</strong> {value.infos || autoSummary.situation || "Non renseignée"}</div>
<div className="pv-projection__line"><strong>Objectif :</strong> {value.objectifs || autoSummary.objectif || "Non renseigné"}</div>
<div className="pv-projection__line"><strong>Décision :</strong> {value.actions || autoSummary.decision || "Non renseignée"}</div>
<div className="pv-projection__line"><strong>Vigilance :</strong> {value.vigilances || "Non renseignée"}</div>
</div>
) : (
<>
{!compact ? (
<div className="pv-staff-grid">
{sections.map(([key, label]) => (
<label key={key} className="pv-field-block">
<span className="pv-label">{label}</span>
<textarea className="pv-textarea" value={value[key] || ""} onChange={(e) => onChange(key, e.target.value)} placeholder={label} />
</label>
))}
</div>
) : null}

<div className="pv-staff-actions">
<button type="button" className="pv-btn primary" onClick={onPushAction}>
Transformer la décision staff en action copilote
</button>
</div>
</>
)}
</SectionCard>
</>
);
}

function TimelineCard({ patient }) {
const movements = getMovements(patient);
const longest = getLongestMovement(movements);

return (
<SectionCard
title="Parcours hospitalier"
subtitle="DMS globale et détail du temps passé dans chaque service."
actions={
<>
<StatusChip color="blue">Entrée le {formatShortDate(patient.dateEntree || patient.admissionDate)}</StatusChip>
<StatusChip color={getLengthOfStay(patient) >= 10 ? "red" : "blue"}>J+{getLengthOfStay(patient)}</StatusChip>
{movements.length >= 3 ? <StatusChip color="amber">🔁 Parcours instable</StatusChip> : null}
</>
}
>
<div className="pv-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: 12 }}>
<div className="pv-item"><div className="pv-label">Service actuel</div><div className="pv-value">{safe(patient.service)}</div></div>
<div className="pv-item"><div className="pv-label">Nombre de transferts</div><div className="pv-value">{Math.max(0, movements.length - 1)}</div></div>
<div className="pv-item"><div className="pv-label">Séjour le plus long</div><div className="pv-value">{longest ? `${safe(longest.service)} · ${longest.durationDays} j` : "—"}</div></div>
</div>

<div className="pv-timeline">
{movements.map((movement, index) => {
const current = !movement.dateSortie;
return (
<div key={movement.id || `${movement.service}-${index}`} className={`pv-timeline-item ${current ? "is-current" : ""}`}>
<div className="pv-timeline-item__marker" />
<div className="pv-timeline-item__content">
<div className="pv-list-item__title">
{safe(movement.service, "Service non renseigné")} {current ? <StatusChip color="green">Actuel</StatusChip> : null}
</div>
<div className="pv-list-item__meta">
Du {formatShortDate(movement.dateEntree)} au {movement.dateSortie ? formatShortDate(movement.dateSortie) : "aujourd’hui"} · {getMovementDuration(movement.dateEntree, movement.dateSortie)}
</div>
</div>
</div>
);
})}
</div>
</SectionCard>
);
}

function VulnerabilityCard({ patient }) {
const criteria =
safeArray(patient?.vulnerability?.criteria).length > 0
? safeArray(patient?.vulnerability?.criteria)
: safeArray(patient?.vulnerabilityProfiles).map((item) => item?.label || item?.code || item);
const updatedAt = patient?.vulnerability?.updatedAt || patient?.updatedAt;
const lastEvaluator =
patient?.vulnerability?.updatedBy ||
patient?.vulnerability?.evaluator ||
patient?.vulnerability?.author ||
"Non renseigné";
const measures = safeArray(patient?.vulnerability?.measures || patient?.vulnerability?.actions);

return (
<SectionCard
title="Vulnérabilité"
subtitle="Critères de vigilance, traçabilité et conduite à tenir."
actions={
<>
<StatusChip color={criteria.length ? "purple" : "neutral"}>
{criteria.length ? `Vulnérable (${criteria.length})` : "Aucun critère"}
</StatusChip>
{updatedAt ? <StatusChip color="neutral">MAJ {formatShortDate(updatedAt)}</StatusChip> : null}
</>
}
>
<div className="pv-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: 12 }}>
<div className="pv-item"><div className="pv-label">Niveau de vigilance</div><div className="pv-value">{criteria.length >= 3 ? "Renforcé" : criteria.length ? "Actif" : "Absent"}</div></div>
<div className="pv-item"><div className="pv-label">Dernier évaluateur</div><div className="pv-value">{safe(lastEvaluator)}</div></div>
<div className="pv-item"><div className="pv-label">Dernière mise à jour</div><div className="pv-value">{formatShortDateTime(updatedAt)}</div></div>
</div>
<PatientInsightsPanel patient={patient} />
{criteria.length === 0 ? (
<div className="pv-list-item pv-muted">Aucun critère de vulnérabilité enregistré.</div>
) : (
<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
{criteria.map((criterion) => (
<StatusChip key={String(criterion)} color="purple">{criterion}</StatusChip>
))}
</div>
)}

<div className="pv-list">
{measures.length === 0 ? (
<div className="pv-list-item pv-muted">Aucune mesure tracée.</div>
) : (
measures.map((measure, index) => (
<div key={measure.id || `${measure}-${index}`} className="pv-list-item">
<div className="pv-list-item__title">{measure.label || measure.title || measure}</div>
<div className="pv-list-item__meta">{measure.status || measure.notes || "Mesure en cours"}</div>
</div>
))
)}
</div>
</SectionCard>
);
}

function ListCard({ title, subtitle, emptyLabel, items }) {
return (
<SectionCard title={title} subtitle={subtitle}>
<div className="pv-list">
{items.length === 0 ? (
<div className="pv-list-item pv-muted">{emptyLabel}</div>
) : (
items.map((item, index) => (
<div key={item.id || item.resourceId || item.title || index} className="pv-list-item">
<div className="pv-list-item__title">{item.label || item.title || item.resourceId || `Élément ${index + 1}`}</div>
<div className="pv-list-item__meta">{item.owner || item.responsable || item.targetSecretariat || item.status || item.statut || item.notes || "—"}</div>
</div>
))
)}
</div>
</SectionCard>
);
}

export default function PatientView() {
const navigate = useNavigate();
const { id } = useParams();

const simulation = usePatientSimulation();

const createIncidentForPatient = simulation.createIncidentForPatient;
const addIncidentAction = simulation.addIncidentAction || (() => {});
const updateIncidentStatus = simulation.updateIncidentStatus || (() => {});
const closeIncidentForPatient = simulation.closeIncidentForPatient || (() => {});
const incidents = simulation.incidents || [];
const getPatientById = simulation.getPatientById;
const updatePatient = simulation.updatePatient;
const patientsSimulated = simulation.patientsSimulated || [];

const patient = useMemo(() => {
const simulated = getPatientById(id);
if (simulated) return simulated;
return patients.find((p) => String(p.id) === String(id)) || null;
}, [getPatientById, id]);

const incident = useMemo(() => {
if (!patient) return null;
return incidents.find((i) => String(i.patientId) === String(patient.id)) || null;
}, [incidents, patient]);

const allPatients = useMemo(() => {
return Array.isArray(patientsSimulated) && patientsSimulated.length
? patientsSimulated
: patients;
}, [patientsSimulated]);

const [activeSection, setActiveSection] = useState("synthese");
const [report, setReport] = useState({
infos: "",
objectifs: "",
actions: "",
vigilances: "",
});
const [savedAt, setSavedAt] = useState("");
const [staffReadMode, setStaffReadMode] = useState(false);
const [staffHistory, setStaffHistory] = useState([]);
const [transmittedAt, setTransmittedAt] = useState("");
const [projectionMode, setProjectionMode] = useState(false);
const [nextReview, setNextReview] = useState({ date: "", owner: "" });
const [copilotPushAt, setCopilotPushAt] = useState("");
const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
const [autoSyncAt, setAutoSyncAt] = useState("");

const [incidentUi, setIncidentUi] = useState({
contextTags: [],
vulnerabilityTags: [],
dangerTags: [],
descriptionTags: [],
freeDescription: "",
lastSeenLocation: "",
lastSeenAt: "",
clothingDetails: "",
internalZones: [],
extendedZones: [],
familyContacted: false,
patientReachedByPhone: false,
securityAlerted: false,
directorAlerted: false,
policeConsidered: false,
found: false,
foundLocation: "",
finalComment: "",
});

useEffect(() => {
if (!patient) return;
const stored = readReport(patient.id);
const history = readReportHistory(patient.id);
const autoSummary = buildStaffAutoSummary(patient);
setStaffHistory(history);

if (stored?.report) {
setReport(stored.report);
setSavedAt(stored.savedAt || "");
setTransmittedAt(stored.transmittedAt || "");
setNextReview(stored.nextReview || { date: "", owner: "" });
setCopilotPushAt(stored.copilotPushAt || "");
setAutoSyncEnabled(stored.autoSyncEnabled !== false);
setAutoSyncAt(stored.autoSyncAt || "");
} else {
setReport({
infos: patient.blockReason || patient.blocage || autoSummary.situation || "",
objectifs: autoSummary.objectif || "",
actions: "",
vigilances: patient.blocage || "",
});
setSavedAt("");
setTransmittedAt("");
setNextReview({ date: "", owner: "" });
setCopilotPushAt("");
setAutoSyncEnabled(true);
setAutoSyncAt("");
}
}, [patient]);

useEffect(() => {
if (!patient) return;
const key = `${INCIDENT_UI_PREFIX}${patient.id}`;
const stored = readJsonStorage(key, null);
if (stored) {
setIncidentUi({
contextTags: safeArray(stored.contextTags),
vulnerabilityTags: safeArray(stored.vulnerabilityTags),
dangerTags: safeArray(stored.dangerTags),
descriptionTags: safeArray(stored.descriptionTags),
freeDescription: stored.freeDescription || "",
lastSeenLocation: stored.lastSeenLocation || "",
lastSeenAt: stored.lastSeenAt || "",
clothingDetails: stored.clothingDetails || "",
internalZones: safeArray(stored.internalZones),
extendedZones: safeArray(stored.extendedZones),
familyContacted: Boolean(stored.familyContacted),
patientReachedByPhone: Boolean(stored.patientReachedByPhone),
securityAlerted: Boolean(stored.securityAlerted),
directorAlerted: Boolean(stored.directorAlerted),
policeConsidered: Boolean(stored.policeConsidered),
found: Boolean(stored.found),
foundLocation: stored.foundLocation || "",
finalComment: stored.finalComment || "",
});
} else {
setIncidentUi({
contextTags: [],
vulnerabilityTags: [],
dangerTags: [],
descriptionTags: [],
freeDescription: "",
lastSeenLocation: patient?.service || "",
lastSeenAt: "",
clothingDetails: "",
internalZones: [],
extendedZones: [],
familyContacted: false,
patientReachedByPhone: false,
securityAlerted: false,
directorAlerted: false,
policeConsidered: false,
found: false,
foundLocation: "",
finalComment: "",
});
}
}, [patient]);

useEffect(() => {
if (!patient) return;
writeJsonStorage(`${INCIDENT_UI_PREFIX}${patient.id}`, incidentUi);
}, [incidentUi, patient]);

if (!patient) return <div style={{ padding: 16 }}>Patient introuvable</div>;

const autoSummary = buildStaffAutoSummary(patient);
const priority = getStaffPriority(patient);
const suggestions = buildSmartSuggestions(patient, report);
const serviceIndicators = buildServiceIndicators(patient, allPatients);

const persistCurrentReport = (overrides = {}) => {
writeReport(patient.id, {
report,
savedAt,
transmittedAt,
nextReview,
copilotPushAt,
autoSyncEnabled,
autoSyncAt,
...overrides,
});
};

const performAutoSync = (dateIso) => {
const actionText = (report.actions || autoSummary.decision || "").trim();
const payload = {
patientId: patient.id,
patientName: `${safe(patient.nom, "")} ${safe(patient.prenom, "")}`.trim(),
transmittedAt: dateIso,
summary: report,
nextReview,
priority,
auto: true,
};
writeCopilotHandoff(patient.id, payload);

if (actionText) {
appendCopilotAction(patient.id, {
id: `autosync_${Date.now()}`,
source: "staff-auto-sync",
title: actionText,
owner: nextReview.owner || patient.medecin || "",
dueDate: nextReview.date || getTargetDate(patient) || "",
patientId: patient.id,
patientName: payload.patientName,
createdAt: dateIso,
status: "À faire",
context: {
infos: report.infos,
objectifs: report.objectifs,
vigilances: report.vigilances,
},
});
setCopilotPushAt(dateIso);
}

setTransmittedAt(dateIso);
setAutoSyncAt(dateIso);
persistCurrentReport({
transmittedAt: dateIso,
autoSyncAt: dateIso,
copilotPushAt: actionText ? dateIso : copilotPushAt,
});
};

const saveReport = () => {
const now = new Date().toISOString();
const payload = {
report,
savedAt: now,
transmittedAt,
nextReview,
copilotPushAt,
autoSyncEnabled,
autoSyncAt,
};
writeReport(patient.id, payload);
setSavedAt(now);

const historyEntry = {
id: `staff_${Date.now()}`,
savedAt: now,
report,
transmittedAt,
nextReview,
copilotPushAt,
autoSyncEnabled,
autoSyncAt,
};
const nextHistory = [historyEntry, ...staffHistory];
setStaffHistory(nextHistory);
writeReportHistory(patient.id, nextHistory);

if (typeof updatePatient === "function") {
updatePatient(patient.id, {
staffGuidedReport: report,
blockReason: report.vigilances || patient.blockReason,
});
}

if (autoSyncEnabled) {
performAutoSync(now);
}
};

const exportStaffPdf = () => {
const payload = {
patientId: patient.id,
exportedAt: new Date().toISOString(),
report,
autoSummary,
nextReview,
priority,
};
writeStaffPdfExport(patient.id, payload);
const html = buildPrintableStaffHtml({
patient,
report,
savedAt,
autoSummary,
nextReview,
priority,
});
const popup = window.open("", "_blank", "width=960,height=760");
if (!popup) return;
popup.document.write(html);
popup.document.close();
popup.focus();
popup.print();
};

const transmitToCopilot = () => {
const payload = {
patientId: patient.id,
patientName: `${safe(patient.nom, "")} ${safe(patient.prenom, "")}`.trim(),
transmittedAt: new Date().toISOString(),
summary: report,
nextReview,
priority,
};
writeCopilotHandoff(patient.id, payload);
setTransmittedAt(payload.transmittedAt);
persistCurrentReport({ transmittedAt: payload.transmittedAt });
};

const pushDecisionToCopilotAction = () => {
const actionText = (report.actions || autoSummary.decision || "").trim();
if (!actionText) return;

const action = {
id: `staff_action_${Date.now()}`,
source: "staff",
title: actionText,
owner: nextReview.owner || patient.medecin || "",
dueDate: nextReview.date || getTargetDate(patient) || "",
patientId: patient.id,
patientName: `${safe(patient.nom, "")} ${safe(patient.prenom, "")}`.trim(),
createdAt: new Date().toISOString(),
context: {
infos: report.infos,
objectifs: report.objectifs,
vigilances: report.vigilances,
},
status: "À faire",
};

appendCopilotAction(patient.id, action);
const pushedAt = action.createdAt;
setCopilotPushAt(pushedAt);
persistCurrentReport({ copilotPushAt: pushedAt });
};

const handleSectionChange = (sectionId) => {
setActiveSection(sectionId);
requestAnimationFrame(() => {
const main = document.querySelector(".pv-main");
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

const launchIncident = () => {
createIncidentForPatient(patient);
setActiveSection("incident");
};

const markInternalSearch = () => {
addIncidentAction(incident.id, {
label: "Recherche interne service",
role: "service",
by: "Service",
status: "done",
context: {
zones: incidentUi.internalZones,
},
});
};

const markPhoneCall = () => {
setUiField("patientReachedByPhone", true);
addIncidentAction(incident.id, {
label: "Appel patient",
role: "service",
by: "Service",
status: "done",
});
};

const markFamilyContact = () => {
setUiField("familyContacted", true);
addIncidentAction(incident.id, {
label: "Personne de confiance / entourage contacté",
role: "service",
by: "Service",
status: "done",
});
};

const alertSecurity = () => {
setUiField("securityAlerted", true);
updateIncidentStatus(incident.id, "security_investigation", "PC sécurité");
addIncidentAction(incident.id, {
label: "PC sécurité alerté",
role: "security",
by: "Service",
status: "done",
context: {
extendedZones: incidentUi.extendedZones,
},
});
};

const alertDirector = () => {
setUiField("directorAlerted", true);
updateIncidentStatus(incident.id, "director_decision", "Directeur de garde");
addIncidentAction(incident.id, {
label: "Directeur de garde alerté",
role: "direction",
by: "Service",
status: "done",
});
};

const closeIncident = () => {
setUiField("found", true);
closeIncidentForPatient(incident.id, "Service", {
found: true,
foundAt: new Date().toISOString(),
foundLocation: incidentUi.foundLocation || "Établissement",
finalStatus: "Patient retrouvé",
comment: incidentUi.finalComment || "",
});
};

const summaryDescription = [
...incidentUi.descriptionTags,
incidentUi.clothingDetails ? `Tenue : ${incidentUi.clothingDetails}` : null,
incidentUi.freeDescription ? incidentUi.freeDescription : null,
]
.filter(Boolean)
.join(" • ");

const targetDate = getTargetDate(patient);
const targetStatus = getDateStatus(targetDate);
const decisionStatus = getDecisionStatus(patient);
const risk = getRiskLevel(patient);
const los = getLengthOfStay(patient);
const planItems = Array.isArray(patient.actionPlan) ? patient.actionPlan : [];
const blockedActions = planItems.filter((item) => normalizeText(item.status || item.statut).includes("blo"));
const doneActions = planItems.filter((item) => normalizeText(item.status || item.statut).includes("fait") || normalizeText(item.status || item.statut).includes("réalis"));
const inProgressActions = planItems.filter((item) => normalizeText(item.status || item.statut).includes("cours"));
const nextOwner =
planItems.find((item) => !normalizeText(item.status || item.statut).includes("fait") && !normalizeText(item.status || item.statut).includes("réalis"))?.owner ||
planItems.find((item) => !normalizeText(item.status || item.statut).includes("fait") && !normalizeText(item.status || item.statut).includes("réalis"))?.responsable ||
patient.medecin ||
"À définir";
const nextDeadline =
planItems.find((item) => item.dueDate)?.dueDate ||
patient?.dateSortiePrevue ||
targetDate ||
"";
const lastUpdate =
patient?.updatedAt ||
patient?.lastUpdatedAt ||
patient?.vulnerability?.updatedAt ||
savedAt ||
"";

const alerts = [
los >= 10 ? { color: "red", text: "DMS longue" } : null,
!targetDate ? { color: "amber", text: "Pas de date cible" } : null,
isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune" ? { color: "red", text: "Sort Med sans solution" } : null,
isVulnerable(patient) ? { color: "purple", text: "Vulnérabilité active" } : null,
getMovements(patient).length >= 3 ? { color: "amber", text: "Parcours instable" } : null,
incident ? { color: "red", text: "Incident disparition en cours" } : null,
].filter(Boolean);

const incidentBadge =
incident?.status === "closed"
? "Clôturé"
: incident
? "En cours"
: "";

const menuItems = [
{ id: "synthese", label: "Synthèse", badge: risk.label },
{ id: "incident", label: "Incident", badge: incidentBadge },
{ id: "maintenant", label: "À faire maintenant", badge: nextDeadline ? "À poser" : "" },
{ id: "sortie", label: "Pilotage sortie", badge: targetDate ? formatShortDate(targetDate) : "Sans date" },
{ id: "alertes", label: "Alertes", badge: String(alerts.length) },
{ id: "parcours", label: "Parcours", badge: `J+${los}` },
{
id: "vulnerabilite",
label: "Vulnérabilité",
badge: isVulnerable(patient)
? String(safeArray(patient?.vulnerability?.criteria).length || safeArray(patient?.vulnerabilityProfiles).length)
: "",
},
{ id: "coordonnees", label: "Coordonnées" },
{ id: "staff", label: "Staff", badge: savedAt ? "Historisé" : "Brouillon" },
{ id: "plan", label: "Plan d’action", badge: String(inProgressActions.length + blockedActions.length) },
{ id: "ressources", label: "Ressources", badge: String(Array.isArray(patient.resourceFollowUp) ? patient.resourceFollowUp.length : 0) },
{ id: "documents", label: "Documents", badge: String(safeArray(patient.documents || patient.forms || patient.formulaires).length) },
];

return (
<AppShell header={<AppHeader subtitle="Vue patient" />}>
<div
className="pv-page"
style={{
background:
"linear-gradient(180deg, rgba(245,248,255,1) 0%, rgba(249,250,252,1) 100%)",
minHeight: "100%",
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
className="pv-btn danger"
onClick={launchIncident}
style={{
boxShadow: "0 8px 18px rgba(185, 28, 28, 0.12)",
}}
>
🚨 Déclarer disparition
</button>

<button
type="button"
className="pv-btn ghost"
onClick={() => handleSectionChange("staff")}
>
Aller au staff
</button>

<button
type="button"
className="pv-btn primary"
onClick={() => navigate(`/copilote/${patient.id}`)}
>
Ouvrir copilote
</button>
</>
}
/>
</div>

{incident ? (
<SectionCard
title="Disparition / sortie à l’insu"
subtitle="Pilotage terrain structuré pour le service, le PC sécurité et le directeur de garde."
style={{
marginBottom: 18,
border: "1px solid #fecaca",
background: "linear-gradient(180deg, #fff8f8 0%, #fff1f2 100%)",
}}
actions={
<>
<StatusChip color={incident.status === "closed" ? "green" : "red"}>
{incident.status === "closed" ? "Incident clôturé" : `Statut ${incident.status}`}
</StatusChip>
<StatusChip color="amber">
Dernière vue {incidentUi.lastSeenLocation || patient.service || "à préciser"}
</StatusChip>
</>
}
>
<div
style={{
display: "grid",
gridTemplateColumns: "1.2fr 1fr",
gap: 16,
alignItems: "start",
}}
>
<div style={{ display: "grid", gap: 16 }}>
<IncidentChecklist
title="Contexte de disparition"
subtitle="Permet de cadrer rapidement la situation initiale."
items={DISAPPEARANCE_CONTEXT_OPTIONS}
values={incidentUi.contextTags}
onToggle={(value) => toggleUiTag("contextTags", value)}
color="blue"
/>

<IncidentChecklist
title="Vulnérabilité / fragilité"
subtitle="Éléments utiles pour prioriser les recherches."
items={VULNERABILITY_OPTIONS}
values={incidentUi.vulnerabilityTags}
onToggle={(value) => toggleUiTag("vulnerabilityTags", value)}
color="purple"
/>

<IncidentChecklist
title="Dangerosité / risque médical"
subtitle="À transmettre clairement au PC sécurité et au décideur."
items={MEDICAL_DANGER_OPTIONS}
values={incidentUi.dangerTags}
onToggle={(value) => toggleUiTag("dangerTags", value)}
color="red"
/>

<IncidentChecklist
title="Description utile"
subtitle="Description simple, rapide, exploitable par les recherches."
items={DESCRIPTION_CRITERIA_OPTIONS}
values={incidentUi.descriptionTags}
onToggle={(value) => toggleUiTag("descriptionTags", value)}
color="green"
/>

<div
style={{
border: "1px solid #edf2f7",
background: "#fbfcfe",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
<label style={{ display: "grid", gap: 6 }}>
<span className="pv-label">Dernier lieu vu</span>
<input
className="pv-input"
value={incidentUi.lastSeenLocation}
onChange={(e) => setUiField("lastSeenLocation", e.target.value)}
placeholder="Ex : chambre 200 / couloir / hall"
/>
</label>
<label style={{ display: "grid", gap: 6 }}>
<span className="pv-label">Dernière heure connue</span>
<input
type="datetime-local"
className="pv-input"
value={incidentUi.lastSeenAt}
onChange={(e) => setUiField("lastSeenAt", e.target.value)}
/>
</label>
</div>

<label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
<span className="pv-label">Tenue / éléments distinctifs</span>
<input
className="pv-input"
value={incidentUi.clothingDetails}
onChange={(e) => setUiField("clothingDetails", e.target.value)}
placeholder="Ex : pyjama bleu, lunettes, pantoufles"
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span className="pv-label">Description libre complémentaire</span>
<textarea
className="pv-textarea"
value={incidentUi.freeDescription}
onChange={(e) => setUiField("freeDescription", e.target.value)}
placeholder="Description utile pour la sécurité, sans texte long inutile."
/>
</label>
</div>

<div
style={{
border: "1px solid #e5e7eb",
background: "#ffffff",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
Synthèse opérationnelle transmise
</div>
<div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
<strong>Contexte :</strong> {incidentUi.contextTags.join(" • ") || "Non précisé"}
<br />
<strong>Vulnérabilité :</strong> {incidentUi.vulnerabilityTags.join(" • ") || "Non précisée"}
<br />
<strong>Danger :</strong> {incidentUi.dangerTags.join(" • ") || "Non précisé"}
<br />
<strong>Description :</strong> {summaryDescription || "Non précisée"}
</div>
</div>
</div>

<div style={{ display: "grid", gap: 16 }}>
<IncidentChecklist
title="Recherche interne"
subtitle="Check rapide des zones de proximité."
items={INTERNAL_SEARCH_ZONES}
values={incidentUi.internalZones}
onToggle={(value) => toggleUiTag("internalZones", value)}
color="blue"
/>

<IncidentChecklist
title="Recherche élargie / sécurité"
subtitle="Zones ou axes à valider avec le PC sécurité."
items={EXTENDED_SEARCH_ZONES}
values={incidentUi.extendedZones}
onToggle={(value) => toggleUiTag("extendedZones", value)}
color="amber"
/>

<div
style={{
border: "1px solid #edf2f7",
background: "#fbfcfe",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
Actions immédiates
</div>

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

<button type="button" className="pv-btn ghost" onClick={alertSecurity}>
🛡️ Alerter PC sécurité
</button>

<button type="button" className="pv-btn ghost" onClick={alertDirector}>
👨‍⚖️ Alerter directeur de garde
</button>

<label
style={{
display: "flex",
alignItems: "center",
gap: 10,
fontSize: 13,
color: "#334155",
paddingTop: 6,
}}
>
<input
type="checkbox"
checked={incidentUi.policeConsidered}
onChange={(e) => setUiField("policeConsidered", e.target.checked)}
/>
Forces de l’ordre envisagées / à discuter
</label>
</div>
</div>

<div
style={{
border: "1px solid #edf2f7",
background: "#ffffff",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
Issue / clôture
</div>

<div style={{ display: "grid", gap: 12 }}>
<label style={{ display: "grid", gap: 6 }}>
<span className="pv-label">Lieu de retrouvaille / issue</span>
<input
className="pv-input"
value={incidentUi.foundLocation}
onChange={(e) => setUiField("foundLocation", e.target.value)}
placeholder="Ex : établissement, parking, domicile, voie publique"
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span className="pv-label">Commentaire final</span>
<textarea
className="pv-textarea"
value={incidentUi.finalComment}
onChange={(e) => setUiField("finalComment", e.target.value)}
placeholder="Synthèse courte de l’issue."
/>
</label>

<button type="button" className="pv-btn primary" onClick={closeIncident}>
✅ Clôturer l’incident
</button>
</div>
</div>

<div
style={{
border: "1px solid #e5e7eb",
background: "#ffffff",
borderRadius: 18,
padding: 16,
}}
>
<div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
Journal horodaté
</div>

<div style={{ fontSize: 13 }}>
{safeArray(incident.incidentLog).map((evt) => (
<div
key={evt.id}
style={{
padding: "8px 0",
borderBottom: "1px solid #f1f5f9",
color: "#334155",
}}
>
<strong>{new Date(evt.at).toLocaleTimeString()}</strong> — {evt.label} ({evt.by})
</div>
))}
</div>
</div>
</div>
</div>
</SectionCard>
) : null}

<div
style={{
display: "grid",
gridTemplateColumns: "280px 1fr",
gap: 18,
alignItems: "start",
}}
>
<aside
className="pv-sidebar"
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
className="pv-sidebar__title"
style={{
padding: "8px 10px 14px",
fontSize: 12,
letterSpacing: ".08em",
textTransform: "uppercase",
color: "#64748b",
}}
>
Vue patient
</div>

{menuItems.map((item) => (
<button
key={item.id}
type="button"
onClick={() => handleSectionChange(item.id)}
className={`pv-side-btn ${activeSection === item.id ? "is-active" : ""}`}
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
}}
>
<span className="pv-side-btn__label">{item.label}</span>
{item.badge ? (
<span
className={`pv-side-btn__badge ${getBadgeColor(item)}`}
style={{
borderRadius: 999,
padding: "4px 8px",
fontSize: 11,
fontWeight: 800,
}}
>
{item.badge}
</span>
) : null}
</button>
))}
</aside>

<main className="pv-main" style={{ display: "grid", gap: 18 }}>
{activeSection === "synthese" ? (
<div className="pv-section-anchor">
<SectionCard
title="Synthèse"
subtitle="Vue d’ensemble synthétique pour compréhension rapide avant détail."
style={{
background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "1.2fr 1fr 1fr",
gap: 14,
marginBottom: 16,
}}
>
<div
style={{
borderRadius: 20,
padding: 18,
background: "linear-gradient(135deg, #17376a 0%, #2452a4 100%)",
color: "#ffffff",
boxShadow: "0 14px 28px rgba(23, 55, 106, 0.22)",
}}
>
<div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Sujet prioritaire</div>
<div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
{getPatientSubject(patient)}
</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>
{safe(patient.service)}
</span>
<span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>
J+{los}
</span>
<span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>
{risk.label}
</span>
</div>
</div>

<div
style={{
borderRadius: 20,
padding: 18,
border: "1px solid #e5e7eb",
background: "#ffffff",
}}
>
<div className="pv-label">Statut décision</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
{decisionStatus.label}
</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
Blocage : {getBlockageLabel(patient)}
</div>
</div>

<div
style={{
borderRadius: 20,
padding: 18,
border: "1px solid #e5e7eb",
background: "#ffffff",
}}
>
<div className="pv-label">Date cible</div>
<div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
{targetDate ? formatShortDate(targetDate) : "—"}
</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
{targetDate ? targetStatus.label : "Non définie"}
</div>
</div>
</div>

<div className="pv-synthese-stack">
<InfoGrid
columns={3}
items={[
{ label: "Sujet", value: getPatientSubject(patient) },
{ label: "Statut décision", value: decisionStatus.label },
{ label: "Dernière mise à jour", value: formatShortDateTime(lastUpdate) },
{ label: "Solution", value: getSolutionLabel(patient) },
{ label: "Blocage principal", value: getBlockageLabel(patient) },
{ label: "Date cible", value: `${formatShortDate(targetDate)}${targetDate ? ` · ${targetStatus.label}` : ""}` },
{ label: "DMS", value: `J+${los}` },
{ label: "Service", value: safe(patient.service) },
{ label: "Dernière action utile", value: getTimeSince(lastUpdate) },
]}
/>

<SectionCard title="Indicateurs du service" subtitle="Vision macro du service autour du patient courant." className="pv-card--nested">
<InfoGrid
columns={5}
items={[
{ label: "Patients service", value: serviceIndicators.total },
{ label: "Critiques", value: serviceIndicators.critical },
{ label: "Sans date cible", value: serviceIndicators.withoutTargetDate },
{ label: "Vulnérables", value: serviceIndicators.vulnerable },
{ label: "Sort Med sans solution", value: serviceIndicators.medicallyReadyWithoutSolution },
]}
/>
</SectionCard>

<SectionCard title="Synthèse staff" subtitle="Version courte de ce qui sera présenté ou repris en staff." className="pv-card--nested">
<div className="pv-staff-read">
<div className="pv-staff-read__line"><strong>Synthèse :</strong> {report.infos || "À définir"}</div>
<div className="pv-staff-read__line"><strong>Objectif :</strong> {report.objectifs || "À définir"}</div>
<div className="pv-staff-read__line"><strong>Décision :</strong> {report.actions || "Non renseignée"}</div>
<div className="pv-staff-read__line"><strong>Vigilance :</strong> {report.vigilances || "Non renseignée"}</div>
</div>
</SectionCard>

<SectionCard title="Plan d’action résumé" subtitle="Lecture courte sans empiéter sur le copilote." className="pv-card--nested">
<InfoGrid
columns={3}
items={[
{ label: "En cours", value: inProgressActions.length || 0 },
{ label: "Bloquées", value: blockedActions.length || 0 },
{ label: "Faites", value: doneActions.length || 0 },
]}
/>
</SectionCard>
</div>
</SectionCard>
</div>
) : null}

{activeSection === "incident" ? (
<div className="pv-section-anchor">
{incident ? (
<SectionCard
title="Pilotage disparition"
subtitle="Vue focalisée incident pour les actions terrain."
>
<div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
Utilise le bloc incident en haut de page pour piloter la description, les recherches,
l’alerte sécurité et la clôture.
</div>
</SectionCard>
) : (
<SectionCard
title="Incident"
subtitle="Aucun incident actif pour ce patient."
actions={
<button type="button" className="pv-btn danger" onClick={launchIncident}>
🚨 Déclarer disparition
</button>
}
>
<div style={{ fontSize: 14, color: "#64748b" }}>
Lance un incident pour afficher le workflow complet service / sécurité / direction.
</div>
</SectionCard>
)}
</div>
) : null}

{activeSection === "maintenant" ? (
<div className="pv-section-anchor">
<SectionCard
title="Quoi faire maintenant"
subtitle="Orientation de lecture et de décision. Le pilotage détaillé reste dans le copilote."
actions={
<>
<StatusChip color="amber">Porteur : {safe(nextOwner)}</StatusChip>
<StatusChip color={nextDeadline ? "blue" : "neutral"}>
Échéance : {nextDeadline ? formatShortDate(nextDeadline) : "à poser"}
</StatusChip>
</>
}
>
<div className="pv-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
<div className="pv-item"><div className="pv-label">Décision attendue</div><div className="pv-value">{getBlockageLabel(patient) !== "Non défini" ? `Arbitrer / lever ${getBlockageLabel(patient)}` : safe(getSolutionLabel(patient), "À arbitrer")}</div></div>
<div className="pv-item"><div className="pv-label">Prochain jalon</div><div className="pv-value">{nextDeadline ? `Point attendu avant le ${formatShortDate(nextDeadline)}` : "Poser une échéance"}</div></div>
</div>
<div className="pv-inline-note">Le suivi opérationnel détaillé des actions reste dans le copilote.</div>
</SectionCard>
</div>
) : null}

{activeSection === "sortie" ? (
<div className="pv-section-anchor">
<SectionCard
title="Pilotage de sortie"
subtitle="Vision condensée du statut de sortie."
actions={
<>
<StatusChip color={targetDate ? targetStatus.color : "neutral"}>Date cible {targetDate ? formatShortDate(targetDate) : "non définie"}</StatusChip>
<StatusChip color={decisionStatus.color}>{decisionStatus.label}</StatusChip>
<StatusChip color={isMedicalReady(patient) ? "blue" : "neutral"}>{isMedicalReady(patient) ? "Sort Med" : "Non Sort Med"}</StatusChip>
</>
}
>
<InfoGrid
columns={2}
items={[
{ label: "Solution actuelle", value: getSolutionLabel(patient) },
{ label: "Blocage principal", value: getBlockageLabel(patient) },
{ label: "Date cible", value: formatShortDate(targetDate) },
{ label: "Date validée", value: patient?.dischargePlanning?.targetDateValidated ? "Oui" : "Non" },
{ label: "Récupérable", value: isMedicalReady(patient) && (targetDate || patient?.dischargePlanning?.solutionFound) ? "Oui" : "Non" },
{ label: "Sort Med", value: isMedicalReady(patient) ? "Oui" : "Non" },
]}
/>
</SectionCard>
</div>
) : null}

{activeSection === "alertes" ? (
<div className="pv-section-anchor">
<SectionCard title="Alertes" subtitle="Signaux triés par priorité.">
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{alerts.sort((a, b) => {
const weight = { red: 3, amber: 2, purple: 2, blue: 1, green: 0, neutral: 0 };
return (weight[b.color] || 0) - (weight[a.color] || 0);
}).map((alert, index) => (
<StatusChip key={`${alert.text}-${index}`} color={alert.color}>{alert.text}</StatusChip>
))}
{alerts.length === 0 ? <StatusChip color="green">Aucune alerte majeure</StatusChip> : null}
</div>
</SectionCard>
</div>
) : null}

{activeSection === "parcours" ? <div className="pv-section-anchor"><TimelineCard patient={patient} /></div> : null}
{activeSection === "vulnerabilite" ? <div className="pv-section-anchor"><VulnerabilityCard patient={patient} /></div> : null}

{activeSection === "coordonnees" ? (
<div className="pv-section-anchor">
<SectionCard title="Coordonnées et relais" subtitle="Professionnels et contacts utiles.">
<InfoGrid
columns={2}
items={[
{ label: "Personne de confiance", value: patient.personneConfiance },
{ label: "À prévenir", value: patient.personneAPrevenir },
{ label: "Médecin", value: patient.medecin },
{ label: "IDE", value: patient.ide },
{ label: "Cadre", value: patient.cadre },
{ label: "AS", value: patient.as },
]}
/>
</SectionCard>
<SectionCard title="Repères de vie" subtitle="Contexte personnel et éléments de vie.">
<InfoGrid
columns={2}
items={[
{ label: "Ville", value: patient.city || patient.ville || patient.adresse?.city },
{ label: "Adresse", value: `${patient.adresse?.street || ""} ${patient.adresse?.postalCode || ""} ${patient.adresse?.city || ""}`.trim() },
{ label: "Contexte", value: patient.status || patient.statut },
{ label: "Gravité", value: patient.gravite || patient.severity },
]}
/>
</SectionCard>
</div>
) : null}

{activeSection === "staff" ? (
<div className="pv-section-anchor">
<SectionCard
title="Lecture staff"
subtitle="Version synthétique pour staff, sans empiéter sur le copilote."
actions={
<button type="button" className="pv-btn ghost" onClick={() => setStaffReadMode((prev) => !prev)}>
{staffReadMode ? "Afficher l’édition complète" : "Mode lecture staff"}
</button>
}
>
<div className="pv-staff-read">
<div className="pv-staff-read__line"><strong>Synthèse :</strong> {report.infos || autoSummary.situation || "Non renseignée"}</div>
<div className="pv-staff-read__line"><strong>Objectif :</strong> {report.objectifs || autoSummary.objectif || "Non renseigné"}</div>
<div className="pv-staff-read__line"><strong>Décision :</strong> {report.actions || autoSummary.decision || "Non renseignée"}</div>
<div className="pv-staff-read__line"><strong>Vigilance :</strong> {report.vigilances || "Non renseignée"}</div>
</div>
</SectionCard>

<StaffEditor
value={report}
onChange={(field, nextValue) => setReport((prev) => ({ ...prev, [field]: nextValue }))}
onSave={saveReport}
savedAt={savedAt}
compact={staffReadMode}
onPrint={exportStaffPdf}
onTransmit={transmitToCopilot}
transmittedAt={transmittedAt}
onPushAction={pushDecisionToCopilotAction}
projectionMode={projectionMode}
onToggleProjection={() => setProjectionMode((prev) => !prev)}
autoSummary={autoSummary}
priority={priority}
nextReview={nextReview}
onChangeNextReview={(field, value) => setNextReview((prev) => ({ ...prev, [field]: value }))}
suggestions={suggestions}
syncEnabled={autoSyncEnabled}
onToggleSync={() => {
const next = !autoSyncEnabled;
setAutoSyncEnabled(next);
persistCurrentReport({ autoSyncEnabled: next });
}}
autoSyncAt={autoSyncAt}
/>

<SectionCard title="Historique des synthèses staff" subtitle="Traçabilité des versions historisées.">
<div className="pv-list">
{staffHistory.length === 0 ? (
<div className="pv-list-item pv-muted">Aucune synthèse staff historisée.</div>
) : (
staffHistory.map((entry) => (
<div key={entry.id} className="pv-list-item">
<div className="pv-list-item__title">Synthèse du {formatShortDateTime(entry.savedAt)}</div>
<div className="pv-list-item__meta">
{[entry.report?.infos, entry.report?.objectifs, entry.report?.actions, entry.report?.vigilances].filter(Boolean).slice(0, 2).join(" • ") || "Version historisée"}
</div>
</div>
))
)}
</div>
{copilotPushAt ? <div className="pv-inline-note">Dernière action envoyée au copilote : {formatShortDateTime(copilotPushAt)}</div> : null}
</SectionCard>
</div>
) : null}

{activeSection === "plan" ? (
<div className="pv-section-anchor">
<SectionCard title="Plan d’action" subtitle="Lecture seule. Le pilotage détaillé reste dans le copilote.">
<div className="pv-action-columns">
<div>
<div className="pv-action-columns__title">En cours</div>
<div className="pv-list">
{inProgressActions.length === 0 ? <div className="pv-list-item pv-muted">Aucune</div> : inProgressActions.map((item, index) => (
<div key={item.id || `ip-${index}`} className="pv-list-item">
<div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
<div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "En cours"}</div>
</div>
))}
</div>
</div>
<div>
<div className="pv-action-columns__title">Bloquées</div>
<div className="pv-list">
{blockedActions.length === 0 ? <div className="pv-list-item pv-muted">Aucune</div> : blockedActions.map((item, index) => (
<div key={item.id || `bl-${index}`} className="pv-list-item">
<div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
<div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "Bloqué"}</div>
</div>
))}
</div>
</div>
<div>
<div className="pv-action-columns__title">Faites</div>
<div className="pv-list">
{doneActions.length === 0 ? <div className="pv-list-item pv-muted">Aucune</div> : doneActions.map((item, index) => (
<div key={item.id || `do-${index}`} className="pv-list-item">
<div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
<div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "Fait"}</div>
</div>
))}
</div>
</div>
</div>
</SectionCard>
</div>
) : null}

{activeSection === "ressources" ? (
<div className="pv-section-anchor">
<ListCard title="Suivi des ressources" subtitle="Demandes et relais déjà activés." emptyLabel="Aucun suivi enregistré" items={Array.isArray(patient.resourceFollowUp) ? patient.resourceFollowUp : []} />
<ListCard title="Historique HDJ" subtitle="Séquences programmées ou passées." emptyLabel="Aucune séquence HDJ" items={Array.isArray(patient.hdjHistory) ? patient.hdjHistory : []} />
</div>
) : null}

{activeSection === "documents" ? (
<div className="pv-section-anchor">
<ListCard title="Documents / formulaires liés" subtitle="Demandes ou dossiers associés au parcours." emptyLabel="Aucun document associé" items={safeArray(patient.documents || patient.forms || patient.formulaires)} />
</div>
) : null}
</main>
</div>

<button type="button" className="pv-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Remonter en haut">
↑
</button>
</div>
</AppShell>
);
}