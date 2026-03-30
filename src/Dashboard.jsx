import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import AppHeader from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import { HOSPITAL_SERVICES } from "./data/hospitalServices";

function safeArray(value) {
return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeText(value) {
return String(value || "").toLowerCase().trim();
}

function formatShortDate(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";
return date.toLocaleDateString("fr-FR");
}

function getServiceCapacity(service) {
const config = HOSPITAL_SERVICES.find(
(item) => item.label === service || item.code === service
);
return Number(config?.capacity || 0);
}

function getScopedCapacity(selectedServices) {
const scoped = selectedServices.length
? HOSPITAL_SERVICES.filter(
(item) =>
selectedServices.includes(item.label) ||
selectedServices.includes(item.code)
)
: HOSPITAL_SERVICES;

return scoped.reduce((sum, item) => sum + Number(item.capacity || 0), 0);
}

function getAvailableBeds(totalCapacity, occupancy) {
return Math.max(0, totalCapacity - occupancy);
}

function getAvoidableDays(patient) {
return Number(patient?.avoid || 0);
}

function getLengthOfStay(patient) {
const entry = patient?.dateEntree || patient?.admissionDate;
if (!entry) return 0;
const start = new Date(entry);
const today = new Date();
const diff = Math.floor(
(today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
);
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

function getComplexityScore(patient) {
const rawScore = Number(patient?.complexityScore);
if (Number.isFinite(rawScore) && rawScore > 0) return rawScore;

const label = normalizeText(patient?.complexityLabel);
if (label.includes("crit")) return 8;
if (label.includes("complex")) return 5;
if (label.includes("surveillance")) return 3;
if (label.includes("elev")) return 3;

let fallback = 0;
const severity = normalizeText(patient?.severity || patient?.gravite);
if (severity.includes("crit")) fallback += 4;
if (severity.includes("complex")) fallback += 3;
if (safeArray(patient?.derivedFreins).length > 0) fallback += 2;
if (safeArray(patient?.dynamicBlockages).length > 1) fallback += 2;
if (safeArray(patient?.derivedAlerts).length > 0) fallback += 2;
if (safeArray(patient?.history).length > 0) fallback += 1;
if (patient?.isVulnerable) fallback += 1;
return fallback;
}

function getComplexityLabel(patient) {
const score = getComplexityScore(patient);

if (score >= 8) return "Critique";
if (score >= 5) return "Complexe";
if (score >= 3) return "Surveillance";
return "Standard";
}

function isComplexPatient(patient) {
return getComplexityScore(patient) >= 5;
}

function isMedicalReady(patient) {
return Boolean(
patient?.medicalReady ||
patient?.sortantMedical ||
patient?.medicalReadiness?.isMedicallyReady
);
}

function isVulnerable(patient) {
return (
Boolean(patient?.isVulnerable) ||
safeArray(patient?.vulnerability?.criteria).length > 0 ||
safeArray(patient?.vulnerabilityProfiles).length > 0
);
}

function vulnerabilityCount(patient) {
const criteria = safeArray(patient?.vulnerability?.criteria);
if (criteria.length > 0) return criteria.length;
return safeArray(patient?.vulnerabilityProfiles).length;
}

function getPrimaryDerivedBlockage(patient) {
const derived = safeArray(patient?.derivedFreins);
if (!derived.length) return "";

const first = derived[0];
if (typeof first === "string") return first;
return first?.label || first?.title || first?.code || "";
}

function getPrimaryDynamicBlockage(patient) {
const dynamic = safeArray(patient?.dynamicBlockages);
if (!dynamic.length) return "";

const first = dynamic[0];
if (typeof first === "string") return first;
return first?.label || first?.title || "";
}

function getBlockageLabel(patient) {
return (
getPrimaryDerivedBlockage(patient) ||
getPrimaryDynamicBlockage(patient) ||
patient?.blockReason ||
patient?.blocage ||
"Non défini"
);
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
if (normalizedBlock.includes("retour a domicile")) {
return "Retour domicile non sécurisé";
}
if (normalizedSolution.includes("hdj")) return "HDJ à construire / sécuriser";
if (normalizedSolution.includes("ehpad")) return "Orientation EHPAD à sécuriser";
if (normalizedSolution.includes("smr")) return "Orientation SMR à sécuriser";
if (block && block !== "Non défini") return block;
if (solution && solution !== "Aucune") return `Parcours ${solution}`;
if (isMedicalReady(patient)) return "Sortie à organiser";
if (isVulnerable(patient)) return "Surveillance vulnérabilité";
return "À qualifier";
}

function isNewPatient(patient, consultedIds, highlightPatientId) {
return (
!consultedIds.has(String(patient?.id)) &&
String(patient?.id) !== String(highlightPatientId || "")
);
}

function isRecoverable(patient) {
return (
isMedicalReady(patient) &&
(getAvoidableDays(patient) > 0 ||
Boolean(patient?.dateSortiePrevue) ||
Boolean(patient?.dischargePlanning?.targetDateValidated) ||
Boolean(patient?.dischargePlanning?.targetDateEnvisaged) ||
Boolean(patient?.dischargePlanning?.solutionFound))
);
}

function getDateStatus(date) {
if (!date) return { label: "Non définie", color: "neutral" };

const today = new Date();
const target = new Date(date);
const diff = Math.floor(
(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
);

if (diff < 0) return { label: "Dépassée", color: "red" };
if (diff <= 1) return { label: "Proche", color: "amber" };
return { label: "OK", color: "green" };
}

function getGlobalStatus(patient) {
const solution = getSolutionLabel(patient);
const block = getBlockageLabel(patient);

if (normalizeText(block) !== "non défini" && block) {
return { label: "Bloqué", color: "red" };
}

if (isMedicalReady(patient) && solution && solution !== "Aucune") {
return { label: "Sécurisé", color: "green" };
}

if (isMedicalReady(patient) || isComplexPatient(patient)) {
return { label: "En cours", color: "amber" };
}

return { label: "À qualifier", color: "blue" };
}

function getIncidentHistoryForPatient(patient, incidents = []) {
return safeArray(incidents)
.filter((item) => String(item?.patientId) === String(patient?.id))
.sort((a, b) => {
const ad = new Date(a?.createdAt || a?.declaredAt || 0).getTime();
const bd = new Date(b?.createdAt || b?.declaredAt || 0).getTime();
return bd - ad;
});
}

function getCurrentIncident(patient, incidents = []) {
const history = getIncidentHistoryForPatient(patient, incidents);
return history.find((item) => normalizeText(item?.status) !== "closed") || null;
}

function hasPreviousEscapeIncident(patient, incidents = []) {
const history = getIncidentHistoryForPatient(patient, incidents);
return history.some((item) => normalizeText(item?.status) === "closed");
}

function getIncidentStepLabel(incident) {
const step = normalizeText(incident?.currentStep || incident?.status);

if (step === "declared") return "Déclaré";
if (step === "search_internal") return "Recherche interne";
if (step === "security_alerted") return "Sécurité alertée";
if (step === "extended_search") return "Recherche élargie";
if (step === "director_alerted") return "Direction alertée";
if (step === "found") return "Patient retrouvé";
if (step === "closed") return "Clôturé";

return incident?.currentStep || incident?.status || "En cours";
}

function getRiskLevel(patient, incidents = []) {
const los = getLengthOfStay(patient);
const avoid = getAvoidableDays(patient);
const complexity = getComplexityScore(patient);
const blocked = getBlockageLabel(patient) !== "Non défini";
const vulnerable = isVulnerable(patient);
const activeIncident = Boolean(getCurrentIncident(patient, incidents));
const previousIncident = hasPreviousEscapeIncident(patient, incidents);

if (activeIncident) {
return { label: "Critique", color: "red" };
}

if (
complexity >= 8 ||
(complexity >= 5 && blocked) ||
(los >= 12 && blocked) ||
(isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune")
) {
return { label: "Critique", color: "red" };
}

if (
avoid >= 2 ||
previousIncident ||
vulnerable ||
los >= 10 ||
complexity >= 5
) {
return { label: "Élevé", color: "amber" };
}

if (los >= 7 || complexity >= 3) {
return { label: "Sous surveillance", color: "blue" };
}

return { label: "Faible", color: "green" };
}

function getDominantBlockage(servicePatients) {
const counts = servicePatients.reduce((acc, patient) => {
const label = getBlockageLabel(patient);
acc[label] = (acc[label] || 0) + 1;
return acc;
}, {});

const entries = Object.entries(counts).filter(
([key]) => key && key !== "Non défini"
);
if (!entries.length) return "Aucun dominant";

entries.sort((a, b) => b[1] - a[1]);
return entries[0][0];
}

function getServiceRisk(servicePatients = [], capacity = 0, incidents = []) {
const occupancy = servicePatients.length;
const occupancyRate =
capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

const complexCount = servicePatients.filter(
(p) => getComplexityScore(p) >= 5
).length;
const vulnerableCount = servicePatients.filter(isVulnerable).length;
const activeIncidentCount = servicePatients.filter((p) =>
Boolean(getCurrentIncident(p, incidents))
).length;

if (occupancyRate >= 100 || complexCount >= 5 || activeIncidentCount > 0) {
return { color: "red", label: "Sous tension" };
}

if (occupancyRate >= 80 || vulnerableCount >= 5) {
return { color: "amber", label: "Vigilance" };
}

return { color: "green", label: "Stable" };
}

function statusBadgeStyle(kind = "neutral") {
const styles = {
neutral: {
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
},
blue: {
background: "#eef4ff",
color: "#17376a",
border: "1px solid #d6e4ff",
},
amber: {
background: "#fff8e8",
color: "#a16207",
border: "1px solid #f6df9b",
},
red: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
},
green: {
background: "#effaf3",
color: "#166534",
border: "1px solid #cdebd8",
},
purple: {
background: "#f5f3ff",
color: "#6d28d9",
border: "1px solid #ddd6fe",
},
};

return {
minHeight: 24,
padding: "0 8px",
borderRadius: 999,
display: "inline-flex",
alignItems: "center",
fontSize: 11,
fontWeight: 800,
whiteSpace: "nowrap",
...styles[kind],
};
}

function getKpiStyle(kind = "info") {
if (kind === "critical") {
return {
background: "#fffaf9",
border: "1px solid #f1b3aa",
accent: "#b42318",
shadow: "0 4px 10px rgba(180,35,24,.06)",
};
}
if (kind === "action") {
return {
background: "#fffaf0",
border: "1px solid #f3d089",
accent: "#a16207",
shadow: "0 4px 10px rgba(161,98,7,.06)",
};
}
if (kind === "watch") {
return {
background: "#faf5ff",
border: "1px solid #ddd6fe",
accent: "#6d28d9",
shadow: "0 4px 10px rgba(109,40,217,.06)",
};
}
return {
background: "#f8fbff",
border: "1px solid #dbe3f1",
accent: "#17376a",
shadow: "0 4px 10px rgba(15,23,42,.05)",
};
}

function kpiCard(active, strong = false, kind = "info") {
const tone = getKpiStyle(kind);
return {
border: active ? `2px solid ${tone.accent}` : tone.border,
borderRadius: 16,
background: tone.background,
padding: "14px 14px",
display: "grid",
gap: 6,
cursor: "pointer",
textAlign: "left",
boxShadow: active ? `0 10px 24px rgba(23,55,106,.12)` : tone.shadow,
minHeight: strong ? 108 : 96,
minWidth: 0,
overflow: "hidden",
};
}

function getPatientCardTone(patient, incidents = []) {
const activeIncident = getCurrentIncident(patient, incidents);
const global = getGlobalStatus(patient);

if (activeIncident) {
return {
background: "#fff7f7",
border: "1px solid #f3c7c1",
};
}

if (global.color === "red") {
return {
background: "#fff8f7",
border: "1px solid #f2d2cc",
};
}
if (global.color === "amber") {
return {
background: "#fffdf8",
border: "1px solid #f6e7c3",
};
}
if (global.color === "green") {
return {
background: "#fbfffc",
border: "1px solid #d9efe0",
};
}
return {
background: "#fff",
border: "1px solid #e6ebf2",
};
}

function computeMean(values) {
if (!values.length) return 0;
return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function computeMedian(values) {
if (!values.length) return 0;
const sorted = [...values].sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
return sorted.length % 2 !== 0
? sorted[mid]
: (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeDMSMetrics(patients) {
const los = safeArray(patients)
.map(getLengthOfStay)
.filter((n) => Number.isFinite(n));

return {
mean: computeMean(los).toFixed(1),
median: computeMedian(los).toFixed(1),
};
}

function getMovementCount(patient) {
return safeArray(patient?.mouvements).length;
}

function isUnstablePath(patient) {
return getMovementCount(patient) >= 3;
}

function isStagnation(patient) {
return getLengthOfStay(patient) >= 10 && !isMedicalReady(patient);
}

function isDirectionPriorityPatient(patient, incidents = []) {
return (
isComplexPatient(patient) ||
getLengthOfStay(patient) >= 10 ||
(isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune") ||
Boolean(
getBlockageLabel(patient) && getBlockageLabel(patient) !== "Non défini"
) ||
isVulnerable(patient) ||
Boolean(getCurrentIncident(patient, incidents)) ||
hasPreviousEscapeIncident(patient, incidents)
);
}

function getPatientPriorityScore(patient, incidents = []) {
let score = 0;
const complexity = getComplexityScore(patient);
const los = getLengthOfStay(patient);

score += complexity * 10;
if (getBlockageLabel(patient) !== "Non défini") score += 25;
if (isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune") {
score += 25;
}
if (isVulnerable(patient)) score += 15;
if (los >= 10) score += 20;
if (getAvoidableDays(patient) > 0) score += getAvoidableDays(patient) * 5;
if (Boolean(getCurrentIncident(patient, incidents))) score += 100;
if (hasPreviousEscapeIncident(patient, incidents)) score += 20;
if (isUnstablePath(patient)) score += 10;

return score;
}

function getComplexityBadgeColor(patient) {
const label = getComplexityLabel(patient);
if (label === "Critique") return "red";
if (label === "Complexe") return "amber";
if (label === "Surveillance" || label === "Élevée") return "blue";
return "neutral";
}

function getDMSColor(days) {
if (days >= 12) return "#b42318";
if (days >= 10) return "#a16207";
return "#17376a";
}

export default function Dashboard() {
const simulation = usePatientSimulation();
const { patients, updatePatient } = simulation;
const createIncidentForPatient = simulation.createIncidentForPatient;
const incidents = simulation.incidents || [];

const navigate = useNavigate();
const location = useLocation();

const highlightPatientId = location.state?.highlightPatientId;

const [selectedServices, setSelectedServices] = useState([]);
const [activeFilter, setActiveFilter] = useState("all");
const [consultedIds, setConsultedIds] = useState(() => new Set());
const [mode, setMode] = useState("service");
const [vulnPopoverId, setVulnPopoverId] = useState(null);

const services = useMemo(
() =>
Array.from(
new Set(
safeArray(patients)
.map((patient) => patient?.service)
.filter(Boolean)
)
).sort(),
[patients]
);

const scopedCapacity = useMemo(
() => getScopedCapacity(selectedServices),
[selectedServices]
);

function toggleService(service) {
setSelectedServices((prev) =>
prev.includes(service)
? prev.filter((item) => item !== service)
: [...prev, service]
);
}

function resetServices() {
setSelectedServices([]);
}

function openPatient(patientId, target = "patient") {
setConsultedIds((prev) => {
const next = new Set(prev);
next.add(String(patientId));
return next;
});

if (target === "copilote") {
navigate(`/copilote/${patientId}`);
return;
}

if (target === "staff") {
navigate(`/staff/${patientId}`);
return;
}

navigate(`/patient/${patientId}`);
}

function toggleMedicalReady(patient) {
const nextValue = !isMedicalReady(patient);

if (typeof updatePatient === "function") {
updatePatient(patient.id, {
medicalReady: nextValue,
sortantMedical: nextValue,
medicalReadyAt: nextValue ? new Date().toISOString() : "",
medicalReadiness: {
...(patient?.medicalReadiness || {}),
isMedicallyReady: nextValue,
activatedAt: nextValue ? new Date().toISOString() : "",
},
});
}
}

function toggleVulnerabilityCriterion(patient, criterion) {
if (typeof updatePatient !== "function") return;

const current = safeArray(patient?.vulnerability?.criteria);
const next = current.includes(criterion)
? current.filter((item) => item !== criterion)
: [...current, criterion];

updatePatient(patient.id, {
vulnerability: {
...(patient?.vulnerability || {}),
criteria: next,
updatedAt: new Date().toISOString(),
},
isVulnerable: next.length > 0 || Boolean(patient?.isVulnerable),
});
}

function triggerIncident(patient) {
if (typeof createIncidentForPatient !== "function") return;
const currentIncident = getCurrentIncident(patient, incidents);
if (currentIncident) {
openPatient(patient.id, "patient");
return;
}
createIncidentForPatient(patient);
}

const filteredPatients = useMemo(() => {
const base = safeArray(patients).filter((patient) => {
if (selectedServices.length && !selectedServices.includes(patient?.service)) {
return false;
}

if (activeFilter === "new") {
return isNewPatient(patient, consultedIds, highlightPatientId);
}
if (activeFilter === "complex") return isComplexPatient(patient);
if (activeFilter === "medical") return isMedicalReady(patient);
if (activeFilter === "avoidable") return getAvoidableDays(patient) > 0;
if (activeFilter === "recoverable") return isRecoverable(patient);
if (activeFilter === "dms") return getLengthOfStay(patient) >= 10;
if (activeFilter === "target") return Boolean(getTargetDate(patient));
if (activeFilter === "vulnerable") return isVulnerable(patient);
if (activeFilter === "incident") {
return Boolean(getCurrentIncident(patient, incidents));
}
if (activeFilter === "blockage") {
return (
getBlockageLabel(patient) &&
getBlockageLabel(patient) !== "Non défini"
);
}

return true;
});

return [...base].sort((a, b) => {
if (selectedServices.length !== 1) {
const serviceCompare = String(a?.service || "").localeCompare(
String(b?.service || "")
);
if (serviceCompare !== 0) return serviceCompare;
}

const scoreDiff =
getPatientPriorityScore(b, incidents) -
getPatientPriorityScore(a, incidents);
if (scoreDiff !== 0) return scoreDiff;

return getLengthOfStay(b) - getLengthOfStay(a);
});
}, [
patients,
selectedServices,
activeFilter,
consultedIds,
highlightPatientId,
incidents,
]);

const dmsMetrics = useMemo(
() => computeDMSMetrics(filteredPatients),
[filteredPatients]
);

const totals = {
capacity: `${filteredPatients.length}/${scopedCapacity}`,
remainingBeds: getAvailableBeds(scopedCapacity, filteredPatients.length),
newPatients: filteredPatients.filter((patient) =>
isNewPatient(patient, consultedIds, highlightPatientId)
).length,
complex: filteredPatients.filter(isComplexPatient).length,
medical: filteredPatients.filter(isMedicalReady).length,
avoidableDays: filteredPatients.reduce(
(sum, patient) => sum + getAvoidableDays(patient),
0
),
recoverable: filteredPatients.filter(isRecoverable).length,
dmsExceeded: filteredPatients.filter(
(patient) => getLengthOfStay(patient) >= 10
).length,
targetDefined: filteredPatients.filter((patient) =>
Boolean(getTargetDate(patient))
).length,
vulnerable: filteredPatients.filter(isVulnerable).length,
incidents: filteredPatients.filter((patient) =>
Boolean(getCurrentIncident(patient, incidents))
).length,
};

const actionChips = [
{ key: "new", label: "Nouveaux", count: totals.newPatients, color: "blue" },
{ key: "complex", label: "Complexes", count: totals.complex, color: "amber" },
{ key: "recoverable", label: "Récupérables", count: totals.recoverable, color: "green" },
{ key: "target", label: "Date cible", count: totals.targetDefined, color: "blue" },
{ key: "vulnerable", label: "Vulnérables", count: totals.vulnerable, color: "purple" },
{ key: "incident", label: "Incidents", count: totals.incidents, color: "red" },
];

const directionRows = useMemo(() => {
const scopedServices = selectedServices.length ? selectedServices : services;

return scopedServices
.map((service) => {
const servicePatients = safeArray(patients).filter(
(patient) => patient?.service === service
);

const capacity = getServiceCapacity(service);
const occupancy = servicePatients.length;
const occupancyRate =
capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
const serviceRisk = getServiceRisk(servicePatients, capacity, incidents);

return {
service,
capacity,
occupancy,
occupancyLabel: `${occupancy}/${capacity}`,
availableBeds: getAvailableBeds(capacity, occupancy),
occupancyRate,
complex: servicePatients.filter(isComplexPatient).length,
medical: servicePatients.filter(isMedicalReady).length,
avoidableDays: servicePatients.reduce(
(sum, patient) => sum + getAvoidableDays(patient),
0
),
recoverable: servicePatients.filter(isRecoverable).length,
dmsExceeded: servicePatients.filter(
(patient) => getLengthOfStay(patient) >= 10
).length,
targetDefined: servicePatients.filter((patient) =>
Boolean(getTargetDate(patient))
).length,
vulnerable: servicePatients.filter(isVulnerable).length,
incidents: servicePatients.filter((patient) =>
Boolean(getCurrentIncident(patient, incidents))
).length,
dominantBlockage: getDominantBlockage(servicePatients),
risk: serviceRisk,
};
})
.sort((a, b) => {
const score = (row) =>
(row.risk.color === "red" ? 100 : 0) +
(row.risk.color === "amber" ? 50 : 0) +
row.incidents * 30 +
row.avoidableDays * 2 +
row.dmsExceeded * 3 +
row.complex * 2 +
row.vulnerable;

return score(b) - score(a);
});
}, [patients, selectedServices, services, incidents]);

const directionSummary = useMemo(() => {
const redServices = directionRows.filter(
(row) => row.risk.color === "red"
).length;
const recoverableBeds = directionRows.reduce(
(sum, row) => sum + row.recoverable,
0
);
const dominant = directionRows
.map((row) => row.dominantBlockage)
.filter((item) => item && item !== "Aucun dominant");

const dominantBlock = dominant.length ? dominant[0] : "Aucun dominant";
const criticalPatients = filteredPatients.filter(
(patient) => getRiskLevel(patient, incidents).color === "red"
).length;
const servicesToArbitrate = directionRows.filter(
(row) => row.risk.color === "red" || row.risk.color === "amber"
).length;
const fastExits = filteredPatients.filter(
(patient) =>
isRecoverable(patient) ||
(isMedicalReady(patient) && getTargetDate(patient))
).length;

return {
redServices,
recoverableBeds,
dominantBlock,
criticalPatients,
servicesToArbitrate,
fastExits,
};
}, [directionRows, filteredPatients, incidents]);

const directionPatients = useMemo(() => {
return filteredPatients
.filter((p) => {
if (!isDirectionPriorityPatient(p, incidents)) return false;
if (activeFilter === "new") {
return isNewPatient(p, consultedIds, highlightPatientId);
}
if (activeFilter === "complex") return isComplexPatient(p);
if (activeFilter === "recoverable") return isRecoverable(p);
if (activeFilter === "target") return Boolean(getTargetDate(p));
if (activeFilter === "vulnerable") return isVulnerable(p);
if (activeFilter === "medical") return isMedicalReady(p);
if (activeFilter === "avoidable") return getAvoidableDays(p) > 0;
if (activeFilter === "dms") return getLengthOfStay(p) >= 10;
if (activeFilter === "incident") {
return Boolean(getCurrentIncident(p, incidents));
}
return true;
})
.sort(
(a, b) =>
getPatientPriorityScore(b, incidents) -
getPatientPriorityScore(a, incidents)
)
.slice(0, 12);
}, [
filteredPatients,
activeFilter,
consultedIds,
highlightPatientId,
incidents,
]);

const groupedPatients = useMemo(() => {
const groups = filteredPatients.reduce((acc, patient) => {
const key = patient?.service || "Sans service";
if (!acc[key]) acc[key] = [];
acc[key].push(patient);
return acc;
}, {});

return Object.entries(groups)
.map(([service, items]) => ({
service,
items: [...items].sort(
(a, b) =>
getPatientPriorityScore(b, incidents) -
getPatientPriorityScore(a, incidents)
),
}))
.sort((a, b) => a.service.localeCompare(b.service));
}, [filteredPatients, incidents]);

const kpis =
mode === "direction"
? [
{
key: "all",
label: "Tension capacitaire",
value: totals.capacity,
detail: `${totals.remainingBeds} lit(s) dispo`,
strong: true,
kind: "critical",
},
{
key: "medical",
label: "Sort Med",
value: totals.medical,
detail: "déclencheurs",
kind: "action",
},
{
key: "avoidable",
label: "Jours évitables",
value: `${totals.avoidableDays} j`,
detail: "levier capacitaire",
strong: true,
kind: "critical",
},
{
key: "dms",
label: "DMS ≥ J+10",
value: totals.dmsExceeded,
detail: `moy ${dmsMetrics.mean} / méd ${dmsMetrics.median}`,
kind: "critical",
},
]
: [
{
key: "all",
label: "Capacitaire",
value: totals.capacity,
detail: `${totals.remainingBeds} lit(s) dispo`,
strong: true,
kind: "critical",
},
{
key: "medical",
label: "Sort Med",
value: totals.medical,
detail: "départ évitable",
kind: "action",
},
{
key: "avoidable",
label: "Jours évitables",
value: `${totals.avoidableDays} j`,
detail: "cible terrain",
strong: true,
kind: "critical",
},
{
key: "dms",
label: "DMS ≥ J+10",
value: totals.dmsExceeded,
detail: `moy ${dmsMetrics.mean} / méd ${dmsMetrics.median}`,
kind: "critical",
},
];

return (
<AppShell header={<AppHeader subtitle="Pilotage des parcours patient" />}>
<div
style={{
maxWidth: 1480,
width: "100%",
margin: "0 auto",
display: "grid",
gap: 16,
}}
>
<section className="app-card" style={headerCard}>
<div style={toolbarGrid}>
<div style={{ display: "grid", gap: 6 }}>
<span style={sectionEyebrow}>Vue</span>
<div style={{ display: "flex", gap: 6 }}>
<button
type="button"
className={`app-chip ${mode === "service" ? "blue" : ""}`}
onClick={() => setMode("service")}
>
Service
</button>
<button
type="button"
className={`app-chip ${mode === "direction" ? "blue" : ""}`}
onClick={() => setMode("direction")}
>
Direction
</button>
</div>
</div>

<div style={{ display: "grid", gap: 6 }}>
<span style={sectionEyebrow}>Services</span>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
<button
type="button"
className={`app-chip ${
selectedServices.length === 0 ? "blue" : ""
}`}
onClick={resetServices}
>
Tous
</button>
{services.map((service) => (
<button
key={service}
type="button"
className={`app-chip ${
selectedServices.includes(service) ? "blue" : ""
}`}
onClick={() => toggleService(service)}
>
{service}
</button>
))}
</div>
</div>
</div>

{mode === "direction" ? (
<>
<div style={summaryStrip}>
<span
style={statusBadgeStyle(
directionSummary.redServices > 0 ? "red" : "green"
)}
>
{directionSummary.redServices} service(s) en alerte forte
</span>
<span style={statusBadgeStyle("blue")}>
{directionSummary.recoverableBeds} lit(s) récupérable(s)
</span>
<span style={statusBadgeStyle("amber")}>
Blocage dominant : {directionSummary.dominantBlock}
</span>
</div>

<div style={decisionStrip}>
<span
style={statusBadgeStyle(
directionSummary.criticalPatients > 0 ? "red" : "green"
)}
>
{directionSummary.criticalPatients} patient(s) critiques
</span>
<span
style={statusBadgeStyle(
directionSummary.servicesToArbitrate > 0
? "amber"
: "green"
)}
>
{directionSummary.servicesToArbitrate} service(s) à arbitrer
</span>
<span
style={statusBadgeStyle(
directionSummary.fastExits > 0 ? "green" : "neutral"
)}
>
{directionSummary.fastExits} sortie(s) activable(s)
</span>
</div>
</>
) : null}

<div
style={{
display: "grid",
gridTemplateColumns: `repeat(${kpis.length}, minmax(140px, 1fr))`,
gap: 10,
}}
>
{kpis.map((kpi) => {
const accent = getKpiStyle(kpi.kind).accent;
const valueFontSize =
kpi.key === "all"
? kpi.strong
? 28
: 22
: kpi.strong
? 34
: 24;

return (
<button
key={kpi.key}
type="button"
onClick={() => setActiveFilter(kpi.key)}
style={kpiCard(activeFilter === kpi.key, kpi.strong, kpi.kind)}
>
<span style={kpiEyebrow}>{kpi.label}</span>

<strong
style={{
fontSize: valueFontSize,
color: accent,
lineHeight: 1,
fontWeight: 900,
letterSpacing: "-0.5px",
whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis",
}}
>
{kpi.value}
</strong>

<span style={kpiDetail}>{kpi.detail}</span>
</button>
);
})}
</div>

<div style={chipsRow}>
{actionChips.map((chip) => (
<button
key={chip.key}
type="button"
onClick={() => setActiveFilter(chip.key)}
style={{
...statusBadgeStyle(
activeFilter === chip.key ? chip.color : "neutral"
),
cursor: "pointer",
minHeight: 30,
}}
>
{chip.label} ({chip.count})
</button>
))}
</div>

<div style={filterRow}>
<button
type="button"
className={`app-chip ${activeFilter === "all" ? "blue" : ""}`}
onClick={() => setActiveFilter("all")}
>
Tous
</button>
<button
type="button"
className={`app-chip ${activeFilter === "medical" ? "blue" : ""}`}
onClick={() => setActiveFilter("medical")}
>
Sort Med
</button>
<button
type="button"
className={`app-chip ${
activeFilter === "avoidable" ? "blue" : ""
}`}
onClick={() => setActiveFilter("avoidable")}
>
Jours évitables
</button>
<button
type="button"
className={`app-chip ${activeFilter === "dms" ? "blue" : ""}`}
onClick={() => setActiveFilter("dms")}
>
DMS ≥ J+10
</button>
<button
type="button"
className={`app-chip ${
activeFilter === "blockage" ? "blue" : ""
}`}
onClick={() => setActiveFilter("blockage")}
>
Bloqués
</button>
<button
type="button"
className={`app-chip ${
activeFilter === "incident" ? "blue" : ""
}`}
onClick={() => setActiveFilter("incident")}
>
Incidents
</button>
</div>
</section>

{mode === "direction" ? (
<>
<section className="app-card" style={directionCard}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
flexWrap: "wrap",
}}
>
<strong style={{ color: "#17376a", fontSize: 18 }}>
Pilotage direction par service
</strong>
<span style={{ fontSize: 12, color: "#64748b" }}>
tension · sort med · jours évitables · récupérables · DMS ·
blocage dominant
</span>
</div>

<div style={{ display: "grid", gap: 8 }}>
{directionRows.map((row) => (
<div key={row.service} style={directionRowCard}>
<div style={{ display: "grid", gap: 4 }}>
<strong style={{ color: "#17376a", fontSize: 13 }}>
{row.service}
</strong>
<span style={statusBadgeStyle(row.risk.color)}>
{row.risk.label}
</span>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Capacité</span>
<strong>{row.occupancyLabel}</strong>
<span style={directionMetricSub}>
{row.availableBeds} dispo · {row.occupancyRate}%
</span>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Sort Med</span>
<strong>{row.medical}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Récupérables</span>
<strong>{row.recoverable}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Complexes</span>
<strong>{row.complex}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Jours évitables</span>
<strong
style={
row.avoidableDays > 0 ? avoidableHighlight : undefined
}
>
{row.avoidableDays} j
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>DMS ≥ J+10</span>
<strong
style={
row.dmsExceeded > 0 ? { color: "#a16207" } : undefined
}
>
{row.dmsExceeded}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Dates cibles</span>
<strong>{row.targetDefined}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Vulnérables</span>
<strong
style={
row.vulnerable > 0 ? { color: "#6d28d9" } : undefined
}
>
{row.vulnerable}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Incidents</span>
<strong
style={
row.incidents > 0 ? { color: "#b42318" } : undefined
}
>
{row.incidents}
</strong>
</div>

<div style={{ ...directionMetric, minWidth: 160 }}>
<span style={directionMetricLabel}>Blocage dominant</span>
<strong style={{ fontSize: 12 }}>
{row.dominantBlockage}
</strong>
</div>
</div>
))}
</div>
</section>

<section className="app-card" style={directionCard}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
flexWrap: "wrap",
}}
>
<strong style={{ color: "#17376a", fontSize: 18 }}>
Patients à arbitrer
</strong>
<span style={{ fontSize: 12, color: "#64748b" }}>
complexes · sort med sans solution · DMS élevée · vulnérables
</span>
</div>

<div style={{ display: "grid", gap: 8 }}>
{directionPatients.length === 0 ? (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucun patient prioritaire dans ce périmètre.
</div>
) : (
directionPatients.map((patient) => {
const medicallyReady = isMedicalReady(patient);
const vulnerable = isVulnerable(patient);
const targetDate = getTargetDate(patient);
const targetStatus = getDateStatus(targetDate);
const los = getLengthOfStay(patient);
const currentIncident = getCurrentIncident(patient, incidents);
const previousIncident = hasPreviousEscapeIncident(
patient,
incidents
);
const newPatient = isNewPatient(
patient,
consultedIds,
highlightPatientId
);

return (
<article
key={`dir-${patient.id}`}
style={{
...directionPatientRow,
...getPatientCardTone(patient, incidents),
...(newPatient
? {
boxShadow:
"inset 4px 0 0 #3b82f6, 0 4px 12px rgba(15,23,42,.04)",
}
: {}),
}}
>
<div style={{ display: "grid", gap: 5 }}>
<div
style={{
display: "flex",
gap: 6,
flexWrap: "wrap",
alignItems: "center",
}}
>
<strong style={{ color: "#17376a" }}>
{patient.nom} {patient.prenom}
</strong>

<span
style={statusBadgeStyle(
getComplexityBadgeColor(patient)
)}
>
{getComplexityLabel(patient)}
</span>

{medicallyReady ? (
<span style={statusBadgeStyle("blue")}>
Sort Med
</span>
) : null}

{vulnerable ? (
<span style={statusBadgeStyle("purple")}>
Vulnérable ({vulnerabilityCount(patient)})
</span>
) : null}

{currentIncident ? (
<span style={statusBadgeStyle("red")}>
Incident actif
</span>
) : null}

{!currentIncident && previousIncident ? (
<span style={statusBadgeStyle("amber")}>
Antécédent fugue
</span>
) : null}

{isUnstablePath(patient) ? (
<span style={statusBadgeStyle("amber")}>
Instable
</span>
) : null}

{isStagnation(patient) ? (
<span style={statusBadgeStyle("red")}>
Stagnation
</span>
) : null}

{los >= 10 ? (
<span style={statusBadgeStyle("amber")}>
DMS longue
</span>
) : null}
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
{patient.dateNaissance || "—"} · {patient.age || "—"} ans ·{" "}
{patient.sexe || "—"} · INS {patient.ins || "—"} · IEP{" "}
{patient.iep || "—"}
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
Entrée le{" "}
{formatShortDate(patient.dateEntree || patient.admissionDate)} ·{" "}
{patient.service || "—"} · Chambre {patient.chambre || "—"} · Lit{" "}
{patient.lit || "—"}
</div>
</div>

<div style={{ display: "grid", gap: 4 }}>
<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Sujet :</strong> {getPatientSubject(patient)}
</div>
<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Blocage :</strong> {getBlockageLabel(patient)}
</div>
<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Complexité :</strong> {getComplexityLabel(patient)} · score{" "}
{getComplexityScore(patient)}
</div>
{currentIncident ? (
<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Workflow :</strong> {getIncidentStepLabel(currentIncident)}
</div>
) : null}
</div>

<div
style={{
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
}}
>
<span
style={{
fontWeight: 900,
fontSize: 18,
color: getDMSColor(los),
}}
>
J+{los}
</span>
<span style={statusBadgeStyle(targetStatus.color)}>
Date cible {targetDate ? formatShortDate(targetDate) : "non définie"} ·{" "}
{targetStatus.label}
</span>
</div>

<div style={compactActionRow}>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => openPatient(patient.id, "patient")}
>
Patient
</button>
<button
type="button"
className="app-btn app-btn-primary"
style={compactPrimaryButton}
onClick={() => openPatient(patient.id, "copilote")}
>
Copilote
</button>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => openPatient(patient.id, "staff")}
>
Staff
</button>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => triggerIncident(patient)}
>
{currentIncident ? "Voir incident" : "Disparition"}
</button>
</div>
</article>
);
})
)}
</div>
</section>
</>
) : null}

<section className="app-card" style={listCard}>
{mode === "service"
? groupedPatients.map(({ service, items }) => (
<div key={service} style={{ display: "grid", gap: 8 }}>
<div
style={{
position: "sticky",
top: 0,
zIndex: 2,
background: "#f8fbff",
border: "1px solid #dbe3f1",
borderRadius: 14,
padding: "10px 12px",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
flexWrap: "wrap",
}}
>
<strong style={{ color: "#17376a", fontSize: 15 }}>
{service}
</strong>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={statusBadgeStyle("blue")}>
{items.length} patient(s)
</span>
<span style={statusBadgeStyle("amber")}>
{items.filter(isComplexPatient).length} complexe(s)
</span>
<span style={statusBadgeStyle("red")}>
{
items.filter((p) =>
Boolean(getCurrentIncident(p, incidents))
).length
}{" "}
incident(s)
</span>
</div>
</div>

{items.map((patient) => {
const newPatient = isNewPatient(
patient,
consultedIds,
highlightPatientId
);
const medicallyReady = isMedicalReady(patient);
const avoidableDays = getAvoidableDays(patient);
const targetDate = getTargetDate(patient);
const targetStatus = getDateStatus(targetDate);
const los = getLengthOfStay(patient);
const cardTone = getPatientCardTone(patient, incidents);
const vulnerable = isVulnerable(patient);
const currentIncident = getCurrentIncident(patient, incidents);
const previousIncident = hasPreviousEscapeIncident(
patient,
incidents
);

return (
<article
key={patient.id}
style={{
...patientRowCard,
...cardTone,
...(currentIncident ? { border: "2px solid #f1b3aa" } : {}),
...(los >= 10 && !currentIncident
? { border: "2px solid #f1b3aa" }
: {}),
...(medicallyReady ? { background: "#f8fbff" } : {}),
...(newPatient
? {
boxShadow:
"inset 4px 0 0 #3b82f6, 0 4px 12px rgba(15,23,42,.04)",
}
: {}),
}}
>
<div style={{ display: "grid", gap: 4, position: "relative" }}>
<div
style={{
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
}}
>
<strong style={{ fontSize: 15, color: "#17376a" }}>
{patient.nom} {patient.prenom}
</strong>

<span
style={statusBadgeStyle(
getComplexityBadgeColor(patient)
)}
>
{getComplexityLabel(patient)}
</span>

{medicallyReady ? (
<span style={statusBadgeStyle("blue")}>
Sort Med
</span>
) : null}

{normalizeText(getBlockageLabel(patient)).includes("ase") ? (
<span style={statusBadgeStyle("red")}>ASE</span>
) : null}

{currentIncident ? (
<span style={statusBadgeStyle("red")}>
En cours
</span>
) : null}

{!currentIncident && previousIncident ? (
<span style={statusBadgeStyle("amber")}>
Antécédent
</span>
) : null}

{isUnstablePath(patient) ? (
<span style={statusBadgeStyle("amber")}>
Instable
</span>
) : null}

{isStagnation(patient) ? (
<span style={statusBadgeStyle("red")}>
Stagnation
</span>
) : null}

{los >= 10 ? (
<span style={statusBadgeStyle("amber")}>
DMS longue
</span>
) : null}

<button
type="button"
onClick={() =>
setVulnPopoverId(
vulnPopoverId === patient.id ? null : patient.id
)
}
style={{
...statusBadgeStyle(
vulnerable ? "purple" : "neutral"
),
cursor: "pointer",
background: vulnerable ? "#f5f3ff" : "#fafafc",
}}
>
{vulnerable
? `Vulnérable (${vulnerabilityCount(patient)})`
: "Vulnérable"}
</button>
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
{patient.dateNaissance || "—"} · {patient.age || "—"} ans ·{" "}
{patient.sexe || "—"} · INS {patient.ins || "—"} · IEP{" "}
{patient.iep || "—"}
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
Entrée le{" "}
{formatShortDate(patient.dateEntree || patient.admissionDate)} ·{" "}
{patient.service || "—"} · Chambre {patient.chambre || "—"} · Lit{" "}
{patient.lit || "—"}
</div>

{vulnPopoverId === patient.id ? (
<div style={vulnerabilityPopover}>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 8,
alignItems: "center",
}}
>
<strong
style={{ fontSize: 12, color: "#17376a" }}
>
Critères vulnérabilité
</strong>
<button
type="button"
onClick={() => setVulnPopoverId(null)}
style={popoverCloseBtn}
>
×
</button>
</div>

<div style={{ display: "grid", gap: 6 }}>
{vulnerabilityList.map((item) => {
const checked = safeArray(
patient?.vulnerability?.criteria
).includes(item);
return (
<label
key={item}
style={vulnerabilityCheckboxRow}
>
<input
type="checkbox"
checked={checked}
onChange={() =>
toggleVulnerabilityCriterion(
patient,
item
)
}
/>
<span>{item}</span>
</label>
);
})}
</div>

<div style={{ fontSize: 11, color: "#64748b" }}>
MAJ :{" "}
{patient?.vulnerability?.updatedAt
? formatShortDate(
patient.vulnerability.updatedAt
)
: "—"}
</div>
</div>
) : null}
</div>

<div style={{ display: "grid", gap: 4 }}>
<span style={sectionEyebrow}>Sujet</span>
<div
style={{
fontSize: 13,
color: "#17376a",
fontWeight: 800,
lineHeight: 1.2,
}}
>
{getPatientSubject(patient)}
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
Complexité {getComplexityLabel(patient)} · score{" "}
{getComplexityScore(patient)}
</div>
{currentIncident ? (
<div style={{ fontSize: 12, color: "#64748b" }}>
Workflow incident :{" "}
<strong>{getIncidentStepLabel(currentIncident)}</strong>
</div>
) : null}
</div>

<div style={{ display: "grid", gap: 4 }}>
<span style={sectionEyebrow}>Pilotage</span>

<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Solution :</strong> {getSolutionLabel(patient)}
</div>

<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Blocage :</strong> {getBlockageLabel(patient)}
</div>

<div
style={{
display: "flex",
gap: 8,
flexWrap: "wrap",
fontSize: 12,
color: "#64748b",
alignItems: "center",
}}
>
<span
style={{
fontWeight: 900,
fontSize: 18,
color: getDMSColor(los),
}}
>
J+{los}
</span>
<span style={statusBadgeStyle(targetStatus.color)}>
Date cible{" "}
{targetDate
? formatShortDate(targetDate)
: "non définie"}{" "}
· {targetStatus.label}
</span>
{avoidableDays > 0 ? (
<span style={avoidableHighlight}>
{avoidableDays} j évitables
</span>
) : null}
</div>
</div>

<div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
<div style={compactActionRow}>
<button
type="button"
className="app-btn app-btn-primary"
style={compactPrimaryButton}
onClick={() => openPatient(patient.id, "copilote")}
>
Copilote
</button>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => openPatient(patient.id, "patient")}
>
Patient
</button>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => openPatient(patient.id, "staff")}
>
Staff
</button>
<button
type="button"
className="app-btn app-btn-ghost"
style={compactGhostButton}
onClick={() => triggerIncident(patient)}
>
{currentIncident ? "Voir incident" : "Disparition"}
</button>
</div>

<button
type="button"
style={{
...medicalToggleButton,
...(medicallyReady ? medicalToggleButtonOn : {}),
}}
onClick={() => toggleMedicalReady(patient)}
>
<span style={medicalToggleLabel}>Sort Med</span>
<span
style={{
...miniSwitch,
...(medicallyReady ? miniSwitchOn : {}),
}}
>
<span
style={{
...miniSwitchKnob,
transform: medicallyReady
? "translateX(16px)"
: "translateX(0)",
}}
/>
</span>
</button>
</div>
</article>
);
})}
</div>
))
: null}
</section>
</div>
</AppShell>
);
}

const headerCard = {
padding: 14,
display: "grid",
gap: 12,
borderRadius: 18,
background: "#fff",
boxShadow: "0 10px 24px rgba(15,23,42,.06)",
};

const directionCard = {
padding: 14,
display: "grid",
gap: 10,
borderRadius: 18,
background: "#fff",
boxShadow: "0 10px 24px rgba(15,23,42,.06)",
};

const listCard = {
padding: 10,
display: "grid",
gap: 14,
borderRadius: 18,
background: "#fff",
boxShadow: "0 10px 24px rgba(15,23,42,.06)",
};

const toolbarGrid = {
display: "grid",
gridTemplateColumns: "auto 1fr",
gap: 14,
alignItems: "start",
};

const summaryStrip = {
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
};

const decisionStrip = {
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
padding: 10,
borderRadius: 12,
background: "#fff8e8",
border: "1px solid #f6df9b",
};

const sectionEyebrow = {
fontSize: 11,
fontWeight: 800,
color: "#64748b",
textTransform: "uppercase",
};

const kpiEyebrow = {
fontSize: 11,
color: "#64748b",
fontWeight: 800,
textTransform: "uppercase",
lineHeight: 1.1,
};

const kpiDetail = {
fontSize: 12,
color: "#64748b",
lineHeight: 1.15,
};

const chipsRow = {
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
};

const filterRow = {
display: "flex",
gap: 6,
flexWrap: "wrap",
paddingTop: 8,
borderTop: "1px solid #eef2f7",
};

const directionRowCard = {
display: "grid",
gridTemplateColumns: "1.1fr repeat(9, minmax(0, 1fr)) 1.4fr",
gap: 10,
alignItems: "center",
border: "1px solid #e5ebf4",
borderRadius: 14,
padding: 12,
background: "#fff",
boxShadow: "0 4px 12px rgba(15,23,42,.04)",
};

const directionMetric = {
display: "grid",
gap: 2,
};

const directionMetricLabel = {
fontSize: 11,
color: "#64748b",
textTransform: "uppercase",
fontWeight: 800,
};

const directionMetricSub = {
fontSize: 11,
color: "#64748b",
};

const avoidableHighlight = {
color: "#b42318",
fontWeight: 800,
};

const compactPrimaryButton = {
padding: "5px 10px",
fontSize: 12,
};

const compactGhostButton = {
padding: "5px 10px",
fontSize: 12,
};

const compactActionRow = {
display: "flex",
gap: 6,
flexWrap: "wrap",
justifyContent: "flex-end",
};

const medicalToggleButton = {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 8,
minHeight: 30,
borderRadius: 10,
border: "1px solid #d6deea",
background: "#fff",
color: "#17376a",
fontSize: 12,
fontWeight: 800,
padding: "0 10px",
cursor: "pointer",
minWidth: 110,
};

const medicalToggleButtonOn = {
background: "#eef4ff",
border: "1px solid #cfe0ff",
};

const medicalToggleLabel = {
whiteSpace: "nowrap",
};

const miniSwitch = {
width: 34,
height: 18,
borderRadius: 999,
background: "#e2e8f0",
padding: 2,
display: "inline-flex",
alignItems: "center",
transition: "all 0.15s ease",
};

const miniSwitchOn = {
background: "#17376a",
};

const miniSwitchKnob = {
width: 14,
height: 14,
borderRadius: "50%",
background: "#fff",
transition: "transform 0.15s ease",
};

const patientRowCard = {
display: "grid",
gridTemplateColumns: "1.65fr 1.15fr 1.45fr auto",
gap: 10,
padding: 10,
borderRadius: 16,
alignItems: "center",
boxShadow: "0 4px 12px rgba(15,23,42,.04)",
};

const directionPatientRow = {
display: "grid",
gridTemplateColumns: "1.7fr 1.4fr 1.2fr auto",
gap: 12,
padding: 12,
borderRadius: 16,
alignItems: "center",
boxShadow: "0 4px 12px rgba(15,23,42,.04)",
};

const vulnerabilityPopover = {
position: "absolute",
top: 56,
left: 0,
width: 290,
background: "#fff",
border: "1px solid #e2e8f0",
borderRadius: 12,
padding: 10,
zIndex: 20,
boxShadow: "0 12px 28px rgba(15,23,42,.16)",
display: "grid",
gap: 8,
};

const vulnerabilityCheckboxRow = {
display: "flex",
gap: 8,
alignItems: "center",
fontSize: 12,
color: "#334155",
};

const popoverCloseBtn = {
border: "none",
background: "transparent",
color: "#64748b",
cursor: "pointer",
fontSize: 18,
lineHeight: 1,
padding: 0,
};

const vulnerabilityList = [
"Trouble cognitif suspecté",
"Trouble psychique suspecté",
"Emprise / psychotrope",
"État général altéré",
"Mineur",
"Majeur protégé",
"Propos suicidaires",
];