import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { patients as staticPatients } from "./data/patients";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import "./CelluleCriseView.css";


const STORAGE_KEY = "carabbas_crise_v4";
const HISTORY_KEY = "carabbas_crise_v4_history";
const ORIGIN_KEY = "carabbas_crise_origin_v1";
const COPILOT_ACTIONS_PREFIX = "carabbas_staff_to_copilot_actions_";

const STAFF_DIRECTORY = [
{ id: "med1", name: "Dr Martin", role: "Médecin", service: "Médecine polyvalente", keywords: ["medecin", "sortie", "polyvalente"] },
{ id: "med2", name: "Dr Leclerc", role: "Médecin", service: "Gériatrie", keywords: ["medecin", "geriatrie", "grand age"] },
{ id: "med3", name: "Dr Simon", role: "Médecin", service: "Chirurgie", keywords: ["medecin", "chirurgie"] },
{ id: "ide1", name: "IDE Bernard", role: "IDE", service: "Médecine polyvalente", keywords: ["ide", "soins", "polyvalente"] },
{ id: "ide2", name: "IDE Leroy", role: "IDE", service: "Gériatrie", keywords: ["ide", "geriatrie"] },
{ id: "ide3", name: "IDE Caron", role: "IDE", service: "Chirurgie", keywords: ["ide", "chirurgie"] },
{ id: "cad1", name: "Cadre Dupont", role: "Cadre", service: "Médecine polyvalente", keywords: ["cadre", "organisation"] },
{ id: "cad2", name: "Cadre Simon", role: "Cadre", service: "Gériatrie", keywords: ["cadre", "geriatrie"] },
{ id: "as1", name: "AS Petit", role: "AS", service: "Médecine polyvalente", keywords: ["as", "autonomie"] },
{ id: "as2", name: "AS Morel", role: "AS", service: "Gériatrie", keywords: ["as", "geriatrie"] },
{ id: "soc1", name: "Mme Garnier", role: "Assistante sociale", service: "Équipe sociale", keywords: ["social", "logement", "dac", "droits"] },
{ id: "soc2", name: "Mme Lambert", role: "Assistante sociale", service: "Équipe sociale", keywords: ["social", "protection", "famille"] },
{ id: "dac1", name: "DAC Cotentin", role: "DAC", service: "Territoire", keywords: ["dac", "coordination"] },
{ id: "hdj1", name: "Secrétariat HDJ", role: "Secrétariat", service: "HDJ", keywords: ["hdj", "secretariat"] },
];

function safe(value, fallback = "Non renseigné") {
return value === null || value === undefined || value === "" ? fallback : value;
}

function safeArray(value) {
return Array.isArray(value) ? value : value ? [value] : [];
}

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function uniq(values) {
return Array.from(new Set(values.filter(Boolean)));
}

function formatShortDate(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";
return date.toLocaleDateString("fr-FR");
}

function formatShortDateTime(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";
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

function isVulnerable(patient) {
return safeArray(patient?.vulnerability?.criteria).length > 0;
}

function getPriority(patient) {
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

function getIdentityVigilance(patient) {
const hasName = Boolean(patient?.nom && patient?.prenom);
const hasBirth = Boolean(patient?.dateNaissance);
const hasIns = Boolean(patient?.ins);
const hasIep = Boolean(patient?.iep);
const score = [hasName, hasBirth, hasIns, hasIep].filter(Boolean).length;

if (score === 4) return { label: "OK", color: "green" };
if (score >= 2) return { label: "À vérifier", color: "amber" };
return { label: "Incomplète", color: "red" };
}

function getPatientKeywords(patient) {
const tags = [];
const block = normalize(getBlockageLabel(patient));
const solution = normalize(getSolutionLabel(patient));

if (isMedicalReady(patient)) tags.push("sort med");
if (!getTargetDate(patient)) tags.push("sans date cible");
if (getSolutionLabel(patient) === "Aucune") tags.push("sans solution");
if (isVulnerable(patient)) tags.push("vulnérable");

if (block.includes("logement")) tags.push("logement");
if (block.includes("dac")) tags.push("dac");
if (block.includes("ase")) tags.push("ase");
if (block.includes("social")) tags.push("social");
if (block.includes("famille")) tags.push("famille");
if (block.includes("protection")) tags.push("protection");

if (solution.includes("smr")) tags.push("smr");
if (solution.includes("ehpad")) tags.push("ehpad");
if (solution.includes("hdj")) tags.push("hdj");
if (solution.includes("domicile")) tags.push("domicile");

safeArray(patient?.vulnerability?.criteria).forEach((item) => tags.push(String(item)));
return uniq(tags).slice(0, 6);
}

function readJson(key, fallback) {
if (typeof window === "undefined") return fallback;
try {
const raw = window.localStorage.getItem(key);
return raw ? JSON.parse(raw) : fallback;
} catch {
return fallback;
}
}

function writeJson(key, value) {
if (typeof window === "undefined") return;
window.localStorage.setItem(key, JSON.stringify(value));
}

function clearJson(key) {
if (typeof window === "undefined") return;
window.localStorage.removeItem(key);
}

function searchDirectory(query) {
const q = normalize(query);
if (!q) return STAFF_DIRECTORY;
return STAFF_DIRECTORY.filter((staff) => {
const hay = normalize([staff.name, staff.role, staff.service, ...(staff.keywords || [])].join(" "));
return hay.includes(q);
});
}

function collectAutoParticipants(selectedPatients) {
const services = uniq(selectedPatients.map((p) => p?.service));
return STAFF_DIRECTORY.filter((staff) => {
const staffService = normalize(staff.service);
return (
services.some((service) => normalize(service) === staffService) ||
staffService === "equipe sociale" ||
staffService === "territoire" ||
staffService === "hdj"
);
}).map((staff) => ({
...staff,
selected: true,
confirmed: false,
addedManually: false,
source: "auto",
}));
}

function buildConvocation({ crisis, selectedPatients, participants }) {
return [
`Cellule de crise – ${crisis.title || "Sorties complexes"}`,
"",
`Date : ${crisis.scheduledDate ? formatShortDate(crisis.scheduledDate) : "À définir"}`,
`Heure : ${crisis.scheduledTime || "À définir"}`,
`Durée : ${crisis.duration || "À définir"}`,
`Lieu : ${crisis.location || "À définir"}`,
`Animateur : ${crisis.facilitator || "À définir"}`,
`Objectif : ${crisis.objective || "À définir"}`,
"",
`Patients : ${selectedPatients.length}`,
`Intervenants : ${participants.filter((p) => p.selected).length}`,
"",
"Patients concernés :",
...(selectedPatients.length
? selectedPatients.map((patient) => {
const tags = getPatientKeywords(patient).join(", ");
return `- ${safe(patient.nom, "Nom")} ${safe(patient.prenom, "")} · ${safe(patient.service, "Service")} · J+${getLengthOfStay(patient)} · ${getBlockageLabel(patient)}${tags ? ` · ${tags}` : ""}`;
})
: ["- Aucun patient sélectionné"]),
].join("\n");
}

function Badge({ color = "neutral", children }) {
return <span className={`cc-badge ${color}`}>{children}</span>;
}

function SectionCard({ title, subtitle, actions, children, hero = false }) {
return (
<section className={`cc-card ${hero ? "cc-card--hero" : ""}`}>
<div className="cc-card__head">
<div>
<h2 className="cc-card__title">{title}</h2>
{subtitle ? <p className="cc-card__subtitle">{subtitle}</p> : null}
</div>
{actions ? <div className="cc-card__actions">{actions}</div> : null}
</div>
{children}
</section>
);
}

function DecisionModal({ open, onClose, selectedPatients, draft, setDraft, onSave }) {
if (!open) return null;

return (
<div className="cc-modal-backdrop" onClick={onClose}>
<div className="cc-modal" onClick={(e) => e.stopPropagation()}>
<div className="cc-modal__head">
<h3>Ajouter une décision</h3>
<button type="button" className="cc-link-btn" onClick={onClose}>Fermer</button>
</div>

<div className="cc-form-grid">
<label className="cc-field cc-field--full">
<span>Patient concerné</span>
<select className="cc-input" value={draft.patientId} onChange={(e) => setDraft((p) => ({ ...p, patientId: e.target.value }))}>
<option value="">Global cellule</option>
{selectedPatients.map((patient) => (
<option key={patient.id} value={patient.id}>
{safe(patient.nom)} {safe(patient.prenom, "")}
</option>
))}
</select>
</label>

<label className="cc-field cc-field--full">
<span>Décision</span>
<textarea className="cc-textarea cc-textarea--sm" value={draft.text} onChange={(e) => setDraft((p) => ({ ...p, text: e.target.value }))} />
</label>

<label className="cc-field">
<span>Porteur</span>
<input className="cc-input" value={draft.owner} onChange={(e) => setDraft((p) => ({ ...p, owner: e.target.value }))} />
</label>

<label className="cc-field">
<span>Échéance</span>
<input type="date" className="cc-input" value={draft.dueDate} onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))} />
</label>

<label className="cc-field">
<span>Destination</span>
<select className="cc-input" value={draft.destination} onChange={(e) => setDraft((p) => ({ ...p, destination: e.target.value }))}>
<option>Copilote</option>
<option>Staff</option>
<option>Fiche patient</option>
<option>Cellule uniquement</option>
</select>
</label>

<label className="cc-field">
<span>Statut</span>
<select className="cc-input" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
<option>À dispatcher</option>
<option>Envoyée</option>
<option>En cours</option>
<option>Réalisée</option>
<option>Bloquée</option>
</select>
</label>
</div>

<div className="cc-modal__actions">
<button type="button" className="cc-btn ghost" onClick={onClose}>Annuler</button>
<button type="button" className="cc-btn primary" onClick={onSave}>Ajouter</button>
</div>
</div>
</div>
);
}

function PatientCard({
patient,
selected,
onToggle,
navigate,
openPatientId,
setOpenPatientId,
}) {
const priority = getPriority(patient);
const ident = getIdentityVigilance(patient);
const isOpen = openPatientId === patient.id;

return (
<div className={`cc-patient-row ${selected ? "is-selected" : ""}`}>
<div
className="cc-patient-row__main"
onClick={() => setOpenPatientId(isOpen ? null : patient.id)}
>
<div className="cc-patient-row__cell cc-patient-row__cell--check">
<input
type="checkbox"
checked={selected}
onChange={() => onToggle(patient.id)}
onClick={(e) => e.stopPropagation()}
/>
</div>

<div className="cc-patient-row__cell cc-patient-row__cell--name">
{safe(patient.nom)} {safe(patient.prenom, "")}
</div>

<div className="cc-patient-row__cell">{safe(patient.service, "—")}</div>

<div className="cc-patient-row__cell">{safe(patient.chambre, "—")}</div>

<div className="cc-patient-row__cell">{safe(patient.lit, "—")}</div>

<div className="cc-patient-row__cell">J+{getLengthOfStay(patient)}</div>

<div className="cc-patient-row__cell">
<Badge color={ident.color}>Identito {ident.label}</Badge>
</div>

<div className="cc-patient-row__cell">
<Badge color={priority.color}>{priority.label}</Badge>
</div>

<div className="cc-patient-row__cell cc-patient-row__cell--block">
{getBlockageLabel(patient)}
</div>
</div>

{isOpen && (
<div className="cc-patient-row__details">
<div className="cc-patient-row__details-grid">
<div><strong>Date de naissance :</strong> {safe(patient.dateNaissance, "—")}</div>
<div><strong>IEP :</strong> {safe(patient.iep, "—")}</div>
<div><strong>INS :</strong> {safe(patient.ins, "—")}</div>
<div><strong>Solution :</strong> {safe(getSolutionLabel(patient), "—")}</div>
</div>

<div className="cc-card__actions">
<button type="button" className="cc-link-btn" onClick={() => navigate(`/patient/${patient.id}`)}>
Fiche patient
</button>
<button type="button" className="cc-link-btn" onClick={() => navigate(`/patient/${patient.id}?tab=staff`)}>
Staff
</button>
<button type="button" className="cc-link-btn" onClick={() => navigate(`/copilote/${patient.id}`)}>
Copilote
</button>
</div>
</div>
)}
</div>
);

}

export default function CelluleCriseView() {
const navigate = useNavigate();
const { patientsSimulated = [] } = usePatientSimulation() || {};

const allPatients = useMemo(() => {
const combined = [...safeArray(patientsSimulated), ...safeArray(staticPatients)];
const seen = new Map();
combined.forEach((patient) => {
if (!patient?.id) return;
if (!seen.has(String(patient.id))) seen.set(String(patient.id), patient);
});
return Array.from(seen.values());
}, [patientsSimulated]);

const [activeTab, setActiveTab] = useState("synthese");
const [crisis, setCrisis] = useState({
title: "Cellule de crise – Sorties complexes",
status: "Brouillon",
scheduledDate: "",
scheduledTime: "",
duration: "30 min",
location: "Salle de staff",
facilitator: "",
objective: "Arbitrer les situations complexes et sorties bloquées",
selectedPatientIds: [],
});

const [filters, setFilters] = useState({
service: "",
patientId: "",
onlyCritical: false,
withoutSolution: false,
longStay: false,
vulnerable: false,
search: "",
});

const [participants, setParticipants] = useState([]);
const [openPatientId, setOpenPatientId] = useState(null);
const [staffSearch, setStaffSearch] = useState("");
const [history, setHistory] = useState([]);
const [versions, setVersions] = useState([]);
const [decisions, setDecisions] = useState([]);
const [showDecisionModal, setShowDecisionModal] = useState(false);
const [decisionDraft, setDecisionDraft] = useState({
patientId: "",
text: "",
owner: "",
dueDate: "",
destination: "Copilote",
status: "À dispatcher",
});

useEffect(() => {
const stored = readJson(STORAGE_KEY, null);
const storedHistory = readJson(HISTORY_KEY, []);
if (stored) {
setCrisis(stored.crisis || {
title: "Cellule de crise – Sorties complexes",
status: "Brouillon",
scheduledDate: "",
scheduledTime: "",
duration: "30 min",
location: "Salle de staff",
facilitator: "",
objective: "Arbitrer les situations complexes et sorties bloquées",
selectedPatientIds: [],
});
setParticipants(stored.participants || []);
setDecisions(stored.decisions || []);
setVersions(stored.versions || []);
}
setHistory(storedHistory);
}, []);

const selectedPatients = useMemo(
() => allPatients.filter((p) => crisis.selectedPatientIds.includes(p.id)),
[allPatients, crisis.selectedPatientIds]
);

useEffect(() => {
const auto = collectAutoParticipants(selectedPatients);
setParticipants((prev) => {
const manual = prev.filter((p) => p.addedManually);
const map = new Map();

auto.forEach((p) => {
const existing = prev.find((x) => x.id === p.id);
map.set(p.id, {
...p,
selected: existing?.selected ?? true,
confirmed: existing?.confirmed ?? false,
});
});

manual.forEach((p) => map.set(p.id, p));
return Array.from(map.values());
});
}, [selectedPatients]);

useEffect(() => {
writeJson(STORAGE_KEY, { crisis, participants, decisions, versions });
}, [crisis, participants, decisions, versions]);

function addHistory(label) {
const entry = {
id: `hist_${Date.now()}`,
label,
createdAt: new Date().toISOString(),
};
const next = [entry, ...history];
setHistory(next);
writeJson(HISTORY_KEY, next);
}

function createVersion(label, comment) {
const entry = {
id: `ver_${Date.now()}`,
label,
comment,
createdAt: new Date().toISOString(),
snapshot: { crisis, participants, decisions },
};
setVersions((prev) => [entry, ...prev]);
}

const serviceOptions = useMemo(
() => uniq(allPatients.map((p) => safe(p.service, "")).filter(Boolean)).sort((a, b) => a.localeCompare(b)),
[allPatients]
);

const filteredPatients = useMemo(() => {
return allPatients
.filter((patient) => {
if (filters.service && safe(patient.service, "") !== filters.service) return false;
if (filters.patientId && String(patient.id) !== String(filters.patientId)) return false;
if (filters.onlyCritical && getPriority(patient).label !== "Critique") return false;
if (filters.withoutSolution && getSolutionLabel(patient) !== "Aucune") return false;
if (filters.longStay && getLengthOfStay(patient) < 10) return false;
if (filters.vulnerable && !isVulnerable(patient)) return false;

if (filters.search) {
const hay = normalize([
patient.nom,
patient.prenom,
patient.dateNaissance,
patient.iep,
patient.ins,
patient.service,
patient.chambre,
patient.lit,
getBlockageLabel(patient),
getSolutionLabel(patient),
...getPatientKeywords(patient),
].join(" "));
if (!hay.includes(normalize(filters.search))) return false;
}

return true;
})
.sort((a, b) => getPriority(b).score - getPriority(a).score);
}, [allPatients, filters]);

const preparedPatients = useMemo(
() =>
selectedPatients
.map((patient) => ({
patient,
priority: getPriority(patient),
ident: getIdentityVigilance(patient),
tags: getPatientKeywords(patient),
}))
.sort((a, b) => b.priority.score - a.priority.score),
[selectedPatients]
);

const suggestedStaff = useMemo(
() => searchDirectory(staffSearch).filter((staff) => !participants.some((p) => p.id === staff.id)),
[staffSearch, participants]
);

const summary = useMemo(() => {
const critical = selectedPatients.filter((p) => getPriority(p).label === "Critique").length;
const noSolution = selectedPatients.filter((p) => getSolutionLabel(p) === "Aucune").length;
const noDate = selectedPatients.filter((p) => !getTargetDate(p)).length;
const blockageCounts = {};

selectedPatients.forEach((p) => {
const block = getBlockageLabel(p);
if (block && block !== "Non défini") blockageCounts[block] = (blockageCounts[block] || 0) + 1;
});

const dominantBlockage =
Object.entries(blockageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Aucun blocage dominant";

return { critical, noSolution, noDate, dominantBlockage };
}, [selectedPatients]);

const tension = useMemo(() => {
if (summary.critical >= 3) return { label: "Critique", color: "red" };
if (summary.critical >= 1 || selectedPatients.length >= 5) return { label: "Élevée", color: "amber" };
if (selectedPatients.length >= 2) return { label: "Modérée", color: "blue" };
return { label: "Faible", color: "green" };
}, [summary.critical, selectedPatients.length]);

function togglePatient(patientId) {
setCrisis((prev) => ({
...prev,
selectedPatientIds: prev.selectedPatientIds.includes(patientId)
? prev.selectedPatientIds.filter((id) => id !== patientId)
: [...prev.selectedPatientIds, patientId],
}));
addHistory("Sélection patients mise à jour");
}

function addStaffMember(staff) {
setParticipants((prev) => [
{
...staff,
selected: true,
confirmed: false,
addedManually: true,
source: "manuel",
},
...prev,
]);
setStaffSearch("");
addHistory(`Intervenant ajouté : ${staff.name}`);
}

function toggleParticipant(id, field = "selected") {
setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p)));
addHistory("Liste intervenants mise à jour");
}

function pushDecisionToCopilot(decision) {
if (!decision.patientId) return;
const key = `${COPILOT_ACTIONS_PREFIX}${decision.patientId}`;
const existing = readJson(key, []);
const next = [
{
id: `crise_${decision.id}`,
label: decision.text,
title: decision.text,
owner: decision.owner,
dueDate: decision.dueDate,
status: "À faire",
source: "cellule_crise",
createdAt: new Date().toISOString(),
},
...existing,
];
writeJson(key, next);
}

function addDecision() {
if (!decisionDraft.text.trim()) return;

const patient = allPatients.find((p) => String(p.id) === String(decisionDraft.patientId));
const entry = {
id: `dec_${Date.now()}`,
...decisionDraft,
patientLabel: patient ? `${safe(patient.nom)} ${safe(patient.prenom, "")}` : "Global cellule",
createdAt: new Date().toISOString(),
};

setDecisions((prev) => [entry, ...prev]);
if (entry.destination === "Copilote") pushDecisionToCopilot(entry);

setDecisionDraft({
patientId: "",
text: "",
owner: "",
dueDate: "",
destination: "Copilote",
status: "À dispatcher",
});
setShowDecisionModal(false);
addHistory("Décision de cellule ajoutée");
}

function copyConvocation() {
const text = buildConvocation({ crisis, selectedPatients, participants });
if (navigator?.clipboard?.writeText) {
navigator.clipboard.writeText(text);
} else {
window.prompt("Copier la convocation :", text);
}
addHistory("Convocation copiée");
}

function printPreparation() {
window.print();
addHistory("Synthèse imprimée");
}

function validateAndReturn() {
const now = new Date().toISOString();

const nextCrisis = {
...crisis,
status: "Planifiée",
validatedAt: now,
};

setCrisis(nextCrisis);
writeJson(STORAGE_KEY, { crisis: nextCrisis, participants, decisions, versions });
addHistory("Cellule validée");

const origin = readJson(ORIGIN_KEY, null);
if (origin?.returnTo) {
clearJson(ORIGIN_KEY);
navigate(origin.returnTo);
return;
}

navigate("/dashboard");
}

const menuWithBadges = [
{ id: "synthese", label: "Synthèse", badge: String(selectedPatients.length) },
{ id: "patients", label: "Patients", badge: String(filteredPatients.length) },
{ id: "intervenants", label: "Intervenants", badge: String(participants.filter((p) => p.selected).length) },
{ id: "organisation", label: "Organisation", badge: crisis.scheduledDate ? formatShortDate(crisis.scheduledDate) : "" },
{ id: "decisions", label: "Décisions", badge: String(decisions.length) },
{ id: "historique", label: "Historique", badge: String(history.length) },
];

return (
<AppShell header={<AppHeader />}>
<div className="cc-page">
<div className="cc-layout">
<aside className="cc-sidebar">
<div className="cc-sidebar__title">Cellule de crise</div>
{menuWithBadges.map((item) => (
<button
key={item.id}
type="button"
className={`cc-sidebar-item ${activeTab === item.id ? "active" : ""}`}
onClick={() => setActiveTab(item.id)}
>
<span className="cc-sidebar-item__label">{item.label}</span>
{item.badge ? <span className="cc-sidebar-item__badge">{item.badge}</span> : null}
</button>
))}
</aside>

<main className="cc-main">
<SectionCard
hero
title="Cellule de crise"
subtitle="Pilotage collectif des situations complexes"
actions={
<>
<button
type="button"
className="cc-btn ghost"
onClick={() => navigate("/dashboard")}
>
← Retour dashboard
</button>

<Badge
color={
crisis.status === "Clôturée"
? "green"
: crisis.status === "Planifiée"
? "blue"
: "neutral"
}
>
{crisis.status}
</Badge>

<button
type="button"
className="cc-btn ghost"
onClick={copyConvocation}
>
Copier convocation
</button>

<button
type="button"
className="cc-btn ghost"
onClick={printPreparation}
>
Imprimer
</button>

<button
type="button"
className="cc-btn ghost"
onClick={() => {
createVersion("Sauvegarde manuelle", "Version enregistrée manuellement");
addHistory("Version créée");
}}
>
Créer version
</button>

<button
type="button"
className="cc-btn primary"
onClick={validateAndReturn}
>
✔ Valider
</button>
</>
}

>
<div className="cc-kpis">
<div className="cc-kpi"><span>Patients</span><strong>{selectedPatients.length}</strong></div>
<div className="cc-kpi"><span>Intervenants</span><strong>{participants.filter((p) => p.selected).length}</strong></div>
<div className="cc-kpi"><span>Critiques</span><strong>{summary.critical}</strong></div>
<div className="cc-kpi"><span>Sans solution</span><strong>{summary.noSolution}</strong></div>
<div className="cc-kpi"><span>Sans date</span><strong>{summary.noDate}</strong></div>
<div className="cc-kpi"><span>Blocage dominant</span><strong>{summary.dominantBlockage}</strong></div>
</div>
</SectionCard>

{activeTab === "synthese" && (
<SectionCard title="Synthèse préparatoire" subtitle="Lecture rapide avant arbitrage.">
<div className="cc-summary-grid">
<div className="cc-summary-box"><span>Critiques</span><strong>{summary.critical}</strong></div>
<div className="cc-summary-box"><span>Sans solution</span><strong>{summary.noSolution}</strong></div>
<div className="cc-summary-box"><span>Blocage dominant</span><strong>{summary.dominantBlockage}</strong></div>
</div>
<div className="cc-patient-table-head">
<div></div>
<div>Patient</div>
<div>Service</div>
<div>Chambre</div>
<div>Lit</div>
<div>Séjour</div>
<div>Identito</div>
<div>Priorité</div>
<div>Blocage</div>
</div>
<div className="cc-list">
{preparedPatients.length === 0 ? (
<div className="cc-empty">Aucun patient sélectionné.</div>
) : (
preparedPatients.map(({ patient, priority, ident, tags }) => (
<div key={patient.id} className="cc-prep-card">
<div className="cc-prep-card__head">
<div>
<strong>{safe(patient.nom)} {safe(patient.prenom, "")}</strong>
<div className="cc-small">{safe(patient.service, "Service")} · J+{getLengthOfStay(patient)}</div>
</div>
<Badge color={priority.color}>{priority.label}</Badge>
</div>
<div className="cc-inline-badges">
<Badge color={ident.color}>Identito {ident.label}</Badge>
{getTargetDate(patient) ? <Badge color="blue">Date {formatShortDate(getTargetDate(patient))}</Badge> : <Badge color="amber">Sans date</Badge>}
</div>
<div className="cc-small"><strong>Blocage :</strong> {getBlockageLabel(patient)}</div>
<div className="cc-small"><strong>Décision attendue :</strong> {getBlockageLabel(patient) !== "Non défini" ? `Arbitrer / lever ${getBlockageLabel(patient)}` : "Décision à poser"}</div>
<div className="cc-tags">
{tags.map((tag) => <span key={tag} className="cc-tag">{tag}</span>)}
</div>
</div>
))
)}
</div>
</SectionCard>
)}

{activeTab === "patients" && (
<SectionCard title="Patients" subtitle="Filtrage par service, patient et recherche intelligente.">
<div className="cc-filters-bar">

<div className="cc-filter search">
<input
className="cc-input"
placeholder="🔍 Rechercher patient, INS, service..."
value={filters.search}
onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
/>
</div>

<div className="cc-filter">
<select
className="cc-input"
value={filters.service}
onChange={(e) => setFilters((p) => ({ ...p, service: e.target.value }))}
>
<option value="">Tous services</option>
{serviceOptions.map((s) => (
<option key={s} value={s}>{s}</option>
))}
</select>
</div>

<div className="cc-filter">
<select
className="cc-input"
value={filters.patientId}
onChange={(e) => setFilters((p) => ({ ...p, patientId: e.target.value }))}
>
<option value="">Tous patients</option>
{allPatients.map((p) => (
<option key={p.id} value={p.id}>
{p.nom} {p.prenom}
</option>
))}
</select>
</div>

<div className="cc-filter toggles">
<label><input type="checkbox" checked={filters.onlyCritical} onChange={() => setFilters(p => ({...p, onlyCritical: !p.onlyCritical}))}/> Critiques</label>
<label><input type="checkbox" checked={filters.withoutSolution} onChange={() => setFilters(p => ({...p, withoutSolution: !p.withoutSolution}))}/> Sans solution</label>
<label><input type="checkbox" checked={filters.longStay} onChange={() => setFilters(p => ({...p, longStay: !p.longStay}))}/> DMS</label>
<label><input type="checkbox" checked={filters.vulnerable} onChange={() => setFilters(p => ({...p, vulnerable: !p.vulnerable}))}/> Vulnérables</label>
</div>

</div>
<div className="cc-list">
{filteredPatients.length === 0 ? (
<div className="cc-empty">Aucun patient trouvé avec ces filtres.</div>
) : (
filteredPatients.map((patient) => (
<PatientCard
key={patient.id}
patient={patient}
selected={crisis.selectedPatientIds.includes(patient.id)}
onToggle={togglePatient}
navigate={navigate}
openPatientId={openPatientId}
setOpenPatientId={setOpenPatientId}
/>
))
)}
</div>
</SectionCard>
)}

{activeTab === "intervenants" && (
<SectionCard title="Intervenants" subtitle="Recherche intelligente et sélection rapide des personnes disposant d’un accès CarAbbaS.">
<input
className="cc-input"
placeholder="Rechercher un soignant, rôle, service..."
value={staffSearch}
onChange={(e) => setStaffSearch(e.target.value)}
/>

<div className="cc-search-results">
{suggestedStaff.slice(0, 8).map((staff) => (
<button key={staff.id} type="button" className="cc-staff-option" onClick={() => addStaffMember(staff)}>
<strong>{staff.name}</strong>
<span>{staff.role} · {staff.service}</span>
</button>
))}
</div>

<div className="cc-list">
{participants.length === 0 ? (
<div className="cc-empty">Aucun intervenant sélectionné.</div>
) : (
participants.map((participant) => (
<div key={participant.id} className="cc-participant-card">
<div className="cc-prep-card__head">
<div>
<strong>{participant.name}</strong>
<div className="cc-small">{participant.role} · {safe(participant.service, "—")}</div>
</div>
<Badge color={participant.addedManually ? "purple" : "blue"}>
{participant.addedManually ? "Manuel" : "Auto"}
</Badge>
</div>

<div className="cc-card__actions">
<label className="cc-toggle">
<input type="checkbox" checked={participant.selected} onChange={() => toggleParticipant(participant.id, "selected")} />
Sélectionné
</label>
<label className="cc-toggle">
<input type="checkbox" checked={participant.confirmed} onChange={() => toggleParticipant(participant.id, "confirmed")} />
Confirmé
</label>
</div>
</div>
))
)}
</div>
</SectionCard>
)}

{activeTab === "organisation" && (
<SectionCard title="Organisation" subtitle="Préparer la réunion, la convocation et le pilotage.">
<div className="cc-form-grid">
<label className="cc-field">
<span>Date</span>
<input className="cc-input" type="date" value={crisis.scheduledDate} onChange={(e) => setCrisis((p) => ({ ...p, scheduledDate: e.target.value }))} />
</label>

<label className="cc-field">
<span>Heure</span>
<input className="cc-input" type="time" value={crisis.scheduledTime} onChange={(e) => setCrisis((p) => ({ ...p, scheduledTime: e.target.value }))} />
</label>

<label className="cc-field">
<span>Durée</span>
<input className="cc-input" value={crisis.duration} onChange={(e) => setCrisis((p) => ({ ...p, duration: e.target.value }))} />
</label>

<label className="cc-field">
<span>Lieu</span>
<input className="cc-input" value={crisis.location} onChange={(e) => setCrisis((p) => ({ ...p, location: e.target.value }))} />
</label>

<label className="cc-field">
<span>Animateur</span>
<input className="cc-input" value={crisis.facilitator} onChange={(e) => setCrisis((p) => ({ ...p, facilitator: e.target.value }))} />
</label>

<label className="cc-field cc-field--full">
<span>Objectif</span>
<input className="cc-input" value={crisis.objective} onChange={(e) => setCrisis((p) => ({ ...p, objective: e.target.value }))} />
</label>
</div>

<div className="cc-card__actions">
<button type="button" className="cc-btn ghost" onClick={() => { setCrisis((p) => ({ ...p, status: "Planifiée" })); addHistory("Cellule planifiée"); }}>
Planifier
</button>
<button type="button" className="cc-btn ghost" onClick={() => { setCrisis((p) => ({ ...p, status: "En cours" })); addHistory("Cellule démarrée"); }}>
Démarrer
</button>
<button type="button" className="cc-btn primary" onClick={() => { setCrisis((p) => ({ ...p, status: "Clôturée" })); addHistory("Cellule clôturée"); }}>
Clôturer
</button>
</div>
</SectionCard>
)}

{activeTab === "decisions" && (
<SectionCard
title="Décisions"
subtitle="Décisions centralisées et lien avec le copilote."
actions={
<button type="button" className="cc-btn primary" onClick={() => setShowDecisionModal(true)}>
+ Ajouter décision
</button>
}
>
<div className="cc-list">
{decisions.length === 0 ? (
<div className="cc-empty">Aucune décision.</div>
) : (
decisions.map((decision) => (
<div key={decision.id} className="cc-decision-card">
<div className="cc-prep-card__head">
<strong>{decision.text}</strong>
<Badge color={normalize(decision.status).includes("real") ? "green" : normalize(decision.status).includes("bloq") ? "red" : "amber"}>
{decision.status}
</Badge>
</div>
<div className="cc-small">Patient : {decision.patientLabel}</div>
<div className="cc-small">Porteur : {safe(decision.owner, "À définir")}</div>
<div className="cc-small">Échéance : {decision.dueDate ? formatShortDate(decision.dueDate) : "À définir"}</div>
<div className="cc-small">Destination : {decision.destination}</div>
{decision.patientId ? (
<div className="cc-card__actions">
<button type="button" className="cc-link-btn" onClick={() => navigate(`/copilote/${decision.patientId}`)}>
Ouvrir Copilote
</button>
</div>
) : null}
</div>
))
)}
</div>
</SectionCard>
)}

{activeTab === "historique" && (
<SectionCard title="Historique" subtitle="Traçabilité et versions.">
<div className="cc-list">
{history.length === 0 ? (
<div className="cc-empty">Aucune activité.</div>
) : (
history.map((item) => (
<div key={item.id} className="cc-log-row">
<div className="cc-small"><strong>{item.label}</strong></div>
<div className="cc-small">{formatShortDateTime(item.createdAt)}</div>
</div>
))
)}
</div>

{versions.length > 0 ? (
<div className="cc-version-block">
<div className="cc-card__title-sm">Versions</div>
<div className="cc-list">
{versions.map((version) => (
<div key={version.id} className="cc-log-row">
<div className="cc-small"><strong>{version.label}</strong></div>
<div className="cc-small">{formatShortDateTime(version.createdAt)}</div>
</div>
))}
</div>
</div>
) : null}
</SectionCard>
)}
</main>
</div>

<DecisionModal
open={showDecisionModal}
onClose={() => setShowDecisionModal(false)}
selectedPatients={selectedPatients}
draft={decisionDraft}
setDraft={setDecisionDraft}
onSave={addDecision}
/>
</div>
</AppShell>

);
}