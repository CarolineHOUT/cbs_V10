import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState, useEffect } from "react";
import AppHeader from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import { HOSPITAL_SERVICES } from "./data/hospitalServices";
import { AdminUsers } from "./views/AdminUsers";
import { HOSPITAL_BEDS } from "./data/hospitalBeds";
import { USER_ROLES, canAccessBioCleaningSettings } from "./config/roles";
import SignatureCanvas from "react-signature-canvas";
import BioCleaningSettingsPanel from "./components/BioCleaningSettingsPanel";
import { useAuth } from "./auth/AuthContext";
import { DEFAULT_BIO_CLEANING_SETTINGS } from "./config/bioCleaningConfig";
import BioCleaningSettings from "./components/BioCleaningSettings";
import { getEstimatedCleaningMinutesFromSettings } from "./domain/bioCleaning/getEstimatedCleaningMinutes";
import SettingsPage from "./components/SettingsPage";
import { generateDPIPatients } from "./data/dpiSeedPatients";
import BioCleaningAgentView from "./components/BioCleaningAgentView";
import BioCleaningManagerView from "./components/BioCleaningManagerView";
import {
isPediatricPatient,
getPediatricDecision,
} from "./domain/pediatrie/pediatrieDecisionEngine";
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

function formatDayAndTime(value) {
if (!value) return "—";

const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "—";

const now = new Date();

const sameDay =
date.getFullYear() === now.getFullYear() &&
date.getMonth() === now.getMonth() &&
date.getDate() === now.getDate();

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);

const isTomorrow =
date.getFullYear() === tomorrow.getFullYear() &&
date.getMonth() === tomorrow.getMonth() &&
date.getDate() === tomorrow.getDate();

const timePart = date.toLocaleTimeString("fr-FR", {
hour: "2-digit",
minute: "2-digit",
});

if (sameDay) return `aujourd’hui ${timePart}`;
if (isTomorrow) return `demain ${timePart}`;

const datePart = date.toLocaleDateString("fr-FR", {
day: "2-digit",
month: "2-digit",
});

return `${datePart} ${timePart}`;
}



function getCleaningDuration(patient) {
const risk = patient?.infectionRisk;

if (risk?.isolation) return 90;
if (risk?.hygieneRisk) return 60;
return 30;
}




function isRecoveryWithinHours(recovery, hours) {
  const availableAt =
    recovery?.recoverableCommittedAt ||
    recovery?.recoverableForecastAt ||
    recovery?.confirmedAvailableAt ||
    recovery?.forecastAvailableAt ||
    recovery?.availableAt;

  if (!availableAt) return false;

  const date = new Date(availableAt);
  if (Number.isNaN(date.getTime())) return false;

  const diffHours = (date.getTime() - Date.now()) / (1000 * 60 * 60);

  // Si c'est déjà dépassé, c'est urgent => compte dans < 2h, < 4h, etc.
  return diffHours <= hours && diffHours >= -24;
}
function getBedAvailableAt(patient) {
const discharge = patient?.discharge;

if (!discharge?.plannedAt) return null;

const exitTime = new Date(discharge.plannedAt);
const cleaningMinutes = getCleaningDuration(patient);

return new Date(exitTime.getTime() + cleaningMinutes * 60000);
}

function isBedRecoverable(patient) {
const availableAt = getBedAvailableAt(patient);
if (!availableAt) return false;

const now = new Date();
return availableAt <= new Date(now.getTime() + 4 * 60 * 60000);
}

function normalizePlannedAt(value) {
  if (!value) return "";

  if (typeof value !== "string") return value;

  if (value.includes("T")) return value;

  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return value;

  const [, dd, mm, yyyy, hh, min, ss] = match;

  // 👉 ICI le fix
  const hours = hh || "14";
  const minutes = min || "00";
  const seconds = ss || "00";

  return `${yyyy}-${mm}-${dd}T${hours}:${minutes}:${seconds}`;
}


function createEmptyBedRecovery() {
return {
bedId: "",
patientId: "",
service: "",
chambre: "",
lit: "",

dischargeStatus: "none", // none | planned | effective
cleaningType: "STANDARD", // STANDARD | RENFORCE | ISOLEMENT
estimatedMinutes: 0,

forecastAvailableAt: "",
confirmedAvailableAt: "",
availableAt: "",
confidence: "low", // low | medium | high

recoverableStatus: "none", // none | forecast | committed
recoverableForecastAt: "",
recoverableCommittedAt: "",
recoverableConfidence: "low",

context: {
medicallyReady: false,
dischargeValidated: false,
dischargePlannedAt: "",
dischargeEffectiveAt: "",
isolation: false,
hygieneRisk: false,
partialDischarge: false,
},
};
}
function addMinutesToIso(value, minutes) {
if (!value) return "";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "";
return new Date(date.getTime() + minutes * 60000).toISOString();
}

function getCleaningDurationFromContext(context) {
if (context?.isolation) return 120;
if (context?.hygieneRisk) return 75;
return 45;
}

function getCleaningTypeFromContext(context) {
if (context?.isolation) return "ISOLEMENT";
if (context?.hygieneRisk) return "RENFORCE";
return "STANDARD";
}

function computeAvailabilityStats(recoveries) {
const now = new Date();

const stats = {
availableNow: 0,
availableIn6h: 0,
availableIn12h: 0,
availableIn24h: 0,
availableIn48h: 0,
};

recoveries.forEach((r) => {
if (!r.availableAt) return;

const date = new Date(r.availableAt);
if (Number.isNaN(date.getTime())) return;

const diffHours = (date - now) / (1000 * 60 * 60);

if (diffHours <= 0) stats.availableNow++;
if (diffHours <= 6) stats.availableIn6h++;
if (diffHours <= 12) stats.availableIn12h++;
if (diffHours <= 24) stats.availableIn24h++;
if (diffHours <= 48) stats.availableIn48h++;
});

return stats;
}



function buildBedRecovery(patient, bed, bioCleaningSettings) {

const recovery = createEmptyBedRecovery();

recovery.bedId = bed?.bedId || "";
recovery.patientId = patient?.id || "";
recovery.service = patient?.service || "";
recovery.chambre = patient?.chambre || "";
recovery.lit = patient?.lit || "";

const planning = patient?.dischargePlanning || {};
const discharge = patient?.discharge || {};
const copilot = patient?.copilotState || {};
const copilotPlannedAt =
copilot?.dischargePlannedAt ||
(
copilot?.dischargePlannedDate && copilot?.dischargePlannedTime
? `${copilot.dischargePlannedDate}T${copilot.dischargePlannedTime}:00`
: ""
);

recovery.context.medicallyReady =
!!planning?.medicallyReady ||
!!discharge?.medicallyReady ||
!!patient?.medicalReady ||
!!patient?.sortantMedical ||
!!patient?.medicalReadiness?.isMedicallyReady;

recovery.context.dischargeValidated =
!!planning?.validated ||
!!discharge?.validated ||
copilot?.targetDateStatus === "validée";



recovery.context.dischargeEffectiveAt =
planning?.effectiveAt ||
discharge?.effectiveAt ||
copilot?.dischargeEffectiveAt ||
"";

recovery.context.isolation = !!patient?.infectionRisk?.isolation;
recovery.context.hygieneRisk = !!patient?.infectionRisk?.hygieneRisk;
recovery.context.partialDischarge = !!patient?.partialDischarge;


recovery.cleaningType = getCleaningTypeFromPatient(patient);
recovery.estimatedMinutes = getEstimatedCleaningMinutesFromSettings(
patient,
bioCleaningSettings
);



const rawPlannedAt =
  normalizePlannedAt(copilot?.dischargePlannedAt) ||
  normalizePlannedAt(copilotPlannedAt) ||
  normalizePlannedAt(discharge?.plannedAt) ||
  normalizePlannedAt(planning?.plannedAt) ||
  normalizePlannedAt(planning?.targetDateValidated) ||
  normalizePlannedAt(patient?.dateSortiePrevue) ||
  "";

const plannedAt = rawPlannedAt
? rawPlannedAt.replace(" ", "T")
: "";

recovery.context.dischargePlannedAt = plannedAt;
console.log("PLANNED AT RECOVERY", patient?.nom, plannedAt, patient?.copilotState);



const effectiveAt = normalizePlannedAt(recovery.context.dischargeEffectiveAt);


if (effectiveAt) {
recovery.dischargeStatus = "effective";
recovery.confirmedAvailableAt = addMinutesToIso(effectiveAt, recovery.estimatedMinutes);
recovery.availableAt = recovery.confirmedAvailableAt;
recovery.confidence = "high";

recovery.recoverableStatus = "committed";
recovery.recoverableCommittedAt = recovery.confirmedAvailableAt;
recovery.recoverableConfidence = "high";

return recovery;
}

if (plannedAt) {
recovery.dischargeStatus = "planned";
recovery.forecastAvailableAt = addMinutesToIso(plannedAt, recovery.estimatedMinutes);
recovery.availableAt = recovery.forecastAvailableAt;
recovery.confidence = recovery.context.dischargeValidated ? "medium" : "low";

recovery.recoverableStatus = "forecast";
recovery.recoverableForecastAt = recovery.forecastAvailableAt;
recovery.recoverableConfidence = recovery.confidence;

return recovery;
}

if (recovery.context.medicallyReady) {
recovery.dischargeStatus = "planned";
recovery.confidence = "low";
recovery.recoverableStatus = "forecast";
recovery.recoverableConfidence = "low";
}

return recovery;
}




function getRecoveryState(patient, bed, settings) {
  const recovery = buildBedRecovery(
    patient,
    bed,
    settings?.bioCleaning
  ) || createEmptyBedRecovery();

  if (recovery.dischargeStatus === "effective") {
    return { status: "recoverable", label: "Sortie effectuée" };
  }

  if (
    recovery.dischargeStatus === "planned" &&
    recovery.context?.dischargeValidated
  ) {
    return { status: "recoverable", label: "Sortie validée" };
  }

  if (recovery.dischargeStatus === "planned") {
    return { status: "planned", label: "Sortie prévue" };
  }

  return { status: "occupied", label: "Occupé" };
}

function formatShortTime(value) {
if (!value) return "—";

const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "—";

return date.toLocaleTimeString("fr-FR", {
hour: "2-digit",
minute: "2-digit",
});
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
  const value =
    patient?.dateSortantMedicalement ||
    patient?.medicalReadyDate ||
    patient?.sortantMedicalementDate;

  if (!value) return 0;

  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date();

  const diff = today.getTime() - start.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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

function getCleaningLabel(patient) {
if (patient?.infectionRisk?.isolation) return "ISOLEMENT";
if (patient?.infectionRisk?.hygieneRisk) return "RENFORCÉ";
return "STANDARD";
}

function getCleaningLoad(patient) {
if (patient?.infectionRisk?.isolation) return 3;
if (patient?.infectionRisk?.hygieneRisk) return 2;
return 1;
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

function isWithoutSolution(patient) {
const solution = normalizeText(getSolutionLabel(patient));

return (
!solution ||
solution === "aucune" ||
solution.includes("non defini")
);
}

function isCrisisTriggerPatient(patient) {
return (
getBlockageLabel(patient) !== "Non défini" &&
isWithoutSolution(patient) &&
getLengthOfStay(patient) >= 7
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
if (normalizedSolution.includes("ehpad"))
return "Orientation EHPAD à sécuriser";
if (normalizedSolution.includes("smr")) return "Orientation SMR à sécuriser";
if (block && block !== "Non défini") return block;
if (solution && solution !== "Aucune") return `Parcours ${solution}`;
if (isMedicalReady(patient)) return "Sortie à organiser";
if (isVulnerable(patient)) return "Surveillance vulnérabilité";
return "À qualifier";
}

function getCleaningType(patient) {
  if (patient?.infectionRisk?.isolation) {
    const type = patient?.infectionRisk?.type;

    if (type === "air") return "ISO AIR";
    if (type === "contact") return "ISO CONTACT";
    if (type === "gouttelettes") return "ISO GOUT";
    return "IS";
  }

  if (patient?.infectionRisk?.hygieneRisk) {
    return "RENFORCÉ";
  }

  return "STANDARD";
}

function getLengthOfStay(patient) {
const service = String(
patient?.service ||
patient?.serviceCode ||
patient?.unit ||
""
).toLowerCase();

// HDJ = hospitalisation de jour = max 24h
if (service.includes("hdj")) return 0;

const entryDate =
patient?.dateEntree ||
patient?.admissionDate ||
patient?.dateAdmission;

if (!entryDate) return null;

const start = new Date(entryDate);
const today = new Date();

const diff = Math.floor(
(today - start) / (1000 * 60 * 60 * 24)
);

return diff >= 0 ? diff : 0;
}


function getBedExitLabel(patient) {
const raw =
patient?.dischargePlannedAt ||
patient?.dischargeDateTime ||
patient?.dateSortiePrevue ||
(patient?.dischargePlannedDate
? `${patient.dischargePlannedDate}T${patient.dischargePlannedTime || "12:00"}`
: null) ||
(patient?.dischargePlanning?.targetDateEnvisaged
? `${patient.dischargePlanning.targetDateEnvisaged}T${
patient?.dischargePlannedTime || "12:00"
}`
: null) ||
patient?.dischargePlanning?.targetDate ||
patient?.targetDate;

if (!raw) return null;

const exitDate = new Date(raw);
if (Number.isNaN(exitDate.getTime())) return null;

const today = new Date();
const sameDay =
exitDate.getFullYear() === today.getFullYear() &&
exitDate.getMonth() === today.getMonth() &&
exitDate.getDate() === today.getDate();

const time = exitDate.toLocaleTimeString("fr-FR", {
hour: "2-digit",
minute: "2-digit",
});

return sameDay
? `Sortie aujourd’hui ${time}`
: `Sortie ${formatShortDate(exitDate)} ${time}`;
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
Boolean(patient?.dischargePlannedAt) ||

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
if (label === "Surveillance") return "blue";
return "neutral";
}

function getDMSColor(days) {
if (days >= 12) return "#b42318";
if (days >= 10) return "#a16207";
return "#17376a";
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
minHeight: 110,
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

const BED_STATUSES = {
AVAILABLE: "available",
OCCUPIED: "occupied",
BLOCKED: "blocked",
RESERVED: "reserved",
ISOLATION: "isolation",
};

const BED_BLOCK_REASONS = {
REPAIR: "repair",
SCHEDULED_ADMISSION: "scheduled_admission",
ISOLATION: "isolation",
};

const BED_REASON_OPTIONS = [
{ value: BED_BLOCK_REASONS.REPAIR, label: "Réparation" },
{ value: BED_BLOCK_REASONS.SCHEDULED_ADMISSION, label: "Entrée programmée" },
{ value: BED_BLOCK_REASONS.ISOLATION, label: "Précaution / isolement" },
];


const ROOM_ZONES = [
{ id: "patient", label: "Zone patient", priority: 1 },
{ id: "sanitary", label: "Sanitaires", priority: 1 },
{ id: "contact", label: "Surfaces de contact", priority: 2 },
{ id: "furniture", label: "Mobilier", priority: 3 },
{ id: "floor", label: "Sols", priority: 4 },
];

const CLEANING_TYPES = {
standard: { label: "Standard", estimatedMinutes: 30 },
renforce: { label: "Renforcé", estimatedMinutes: 45 },
isolement: { label: "Isolement", estimatedMinutes: 60 },
partiel: { label: "Partiel", estimatedMinutes: 20 },
};



function formatDateTimeLocal(value) {
if (!value) return "";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "";
const pad = (n) => String(n).padStart(2, "0");

return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
date.getDate()
)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTimeDisplay(value) {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";
return date.toLocaleString("fr-FR");
}

function isWithin48Hours(value) {
if (!value) return false;
const date = new Date(value);
if (Number.isNaN(date.getTime())) return false;

const now = Date.now();
const max = now + 48 * 60 * 60 * 1000;

return date.getTime() >= now && date.getTime() <= max;
}

function getCleaningTypeFromPatient(patient) {
if (patient?.infectionRisk?.isolation) return "isolement";
if (patient?.infectionRisk?.hygieneRisk) return "renforce";
if (patient?.partialDischarge) return "partiel";
return "standard";
}




function normalizeBedLabel(value) {
const v = normalizeText(value);

if (!v) return "";
if (v === "p" || v.includes("porte")) return "P";
if (v === "f" || v.includes("fen")) return "F";
if (v === "a") return "P";
if (v === "b") return "F";
if (v === "lit") return "L";
return String(value || "").trim().toUpperCase();
}
function normalizeRoomNumber(room) {
if (!room) return "";

const r = String(room).trim();

// 👉 mapping simple pour ton cas actuel
// (on aligne les chambres 200+ sur les chambres réelles)

const mapping = {
"200": "205",
"201": "205",
"202": "210",
"203": "210",
"204": "302",
"205": "302",
"206": "303",
"207": "303",
"208": "304",
"209": "304",
};

return mapping[r] || r;
}

function getPatientBedMapKey(roomNumber, bedLabel) {
const room = normalizeRoomNumber(roomNumber);
const bed = normalizeBedLabel(bedLabel);

if (!room || !bed) return "";

return `${room}::${bed}`;
}


function buildPatientBedMap(patients = []) {
return safeArray(patients).reduce((acc, patient) => {
const room = String(patient?.chambre || "").trim();
const bed = normalizeBedLabel(patient?.lit);
if (!room || !bed) return acc;
acc[`${room}::${bed}`] = patient;
return acc;
}, {});
}

function buildInitialBedStates(bedConfig = []) {
const output = {};

safeArray(bedConfig).forEach((serviceItem) => {
safeArray(serviceItem?.rooms).forEach((room) => {
safeArray(room?.beds).forEach((bed) => {
output[bed.bedId] = {
status: BED_STATUSES.AVAILABLE,
reason: "",
startAt: "",
endAt: "",
note: "",
updatedAt: "",
history: [],
};
});
});
});

return output;
}

function getBedComputedStatus(bedState, linkedPatient) {
if (linkedPatient) return BED_STATUSES.OCCUPIED;
if (bedState?.status === BED_STATUSES.BLOCKED) return BED_STATUSES.BLOCKED;
if (bedState?.status === BED_STATUSES.RESERVED) return BED_STATUSES.RESERVED;
if (bedState?.status === BED_STATUSES.ISOLATION) return BED_STATUSES.ISOLATION;
return BED_STATUSES.AVAILABLE;
}

function getBedStatusLabel(status) {
if (status === BED_STATUSES.AVAILABLE) return "Disponible";
if (status === BED_STATUSES.OCCUPIED) return "Occupé";
if (status === BED_STATUSES.BLOCKED) return "Bloqué";
if (status === BED_STATUSES.RESERVED) return "Entrée programmée";
if (status === BED_STATUSES.ISOLATION) return "Isolement";
return "Inconnu";
}

function getBedStatusColor(status) {
if (status === BED_STATUSES.AVAILABLE) return "green";
if (status === BED_STATUSES.OCCUPIED) return "neutral";
if (status === BED_STATUSES.BLOCKED) return "red";
if (status === BED_STATUSES.RESERVED) return "blue";
if (status === BED_STATUSES.ISOLATION) return "purple";
return "neutral";
}

function getBedReasonLabel(reason) {
if (reason === BED_BLOCK_REASONS.REPAIR) return "Réparation";
if (reason === BED_BLOCK_REASONS.SCHEDULED_ADMISSION) return "Entrée programmée";
if (reason === BED_BLOCK_REASONS.ISOLATION) return "Précaution / isolement";
return "—";
}

function isBedRecoverableWithin48h(bedState, linkedPatient) {
if (
(bedState?.status === BED_STATUSES.BLOCKED ||
bedState?.status === BED_STATUSES.ISOLATION) &&
isWithin48Hours(bedState?.endAt)
) {
return true;
}

if (linkedPatient) {
const targetDate = getTargetDate(linkedPatient);
if (isWithin48Hours(targetDate)) return true;
}

return false;
}

function isForecastBlockageWithin48h(bedState) {
return (
bedState?.status === BED_STATUSES.RESERVED &&
isWithin48Hours(bedState?.startAt)
);
}

function computeBedMetricsForService(
  serviceItem,
  bedStates,
  patientBedMap,
  bioCleaningSettings
) {
  let totalBeds = 0;
  let availableBeds = 0;
  let occupiedBeds = 0;
  let blockedBeds = 0;
  let reservedBeds = 0;
  let isolationBeds = 0;
  let recoverable2h = 0;
  let recoverable4h = 0;
  let recoverable6h = 0;
  let recoverable12h = 0;
  let recoverable24h = 0;
  let recoverable48h = 0;
  let forecastBlockages48h = 0;
  let bioCleaningLoad = 0;

  safeArray(serviceItem?.rooms).forEach((room) => {
    safeArray(room?.beds).forEach((bed) => {
      totalBeds += 1;

      const key = getPatientBedMapKey(room.roomNumber, bed.label);
    const linkedPatient = patientBedMap[key];

const bedState = bedStates[bed.bedId] || {};
const status = getBedComputedStatus(bedState, linkedPatient);

if (linkedPatient) {
  bioCleaningLoad += getCleaningLoad(linkedPatient);
}

const recoveryDetail = linkedPatient
  ? buildBedRecovery(
      linkedPatient,
      { bedId: bed.bedId },
      bioCleaningSettings
    )
  : null;
      

  

      if (status === BED_STATUSES.AVAILABLE) availableBeds += 1;
      if (status === BED_STATUSES.OCCUPIED) occupiedBeds += 1;
      if (status === BED_STATUSES.BLOCKED) blockedBeds += 1;
      if (status === BED_STATUSES.RESERVED) reservedBeds += 1;
      if (status === BED_STATUSES.ISOLATION) isolationBeds += 1;

      if (recoveryDetail?.recoverableStatus !== "none") {
        if (isRecoveryWithinHours(recoveryDetail, 2)) recoverable2h += 1;
        if (isRecoveryWithinHours(recoveryDetail, 4)) recoverable4h += 1;
        if (isRecoveryWithinHours(recoveryDetail, 6)) recoverable6h += 1;
        if (isRecoveryWithinHours(recoveryDetail, 12)) recoverable12h += 1;
        if (isRecoveryWithinHours(recoveryDetail, 24)) recoverable24h += 1;
        if (isRecoveryWithinHours(recoveryDetail, 48)) recoverable48h += 1;
      }
    });
  });

  return {
    totalBeds,
    availableBeds,
    occupiedBeds,
    blockedBeds,
    reservedBeds,
    isolationBeds,
    recoverable2h,
    recoverable4h,
    recoverable6h,
    recoverable12h,
    recoverable24h,
    recoverable48h,
    forecastBlockages48h,
  };
}

function getBedShortLabel(label, roomType) {
const normalized = normalizeBedLabel(label);
if (roomType === "single" || normalized === "L") return "";
return normalized;
}

function formatShortDateTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard({ user, onLogout }) {
  const currentUserRole = user?.role;


const [view, setView] = useState("dashboard");

const [settings, setSettings] = useState({
rules: {
dmsThreshold: 10,
avoidableDaysTarget: 0,
recoveryWindowHours: 48,
criticalPatientsThreshold: 1,
fastExitThresholdHours: 24,
directionAlertThreshold: 2,
},
bioCleaning: {
zones: [],
scenarios: [],
},
});


const simulation = usePatientSimulation();
const { patients, updatePatient } = simulation;
const resetPatientsFromDPI = simulation.resetPatientsFromDPI;
const createIncidentForPatient = simulation.createIncidentForPatient;
const incidents = simulation.incidents || [];

const navigate = useNavigate();
const location = useLocation();

const highlightPatientId = location.state?.highlightPatientId;

const [selectedServices, setSelectedServices] = useState([]);
const [activeFilter, setActiveFilter] = useState("all");
const [consultedIds, setConsultedIds] = useState(() => new Set());
const [mode, setMode] = useState("service");
const [bioAgents, setBioAgents] = useState(() => {
  
const saved = localStorage.getItem("bioAgents");
return saved ? JSON.parse(saved) : [
{
id: "ag_1",
name: "Sophie Martin",
sector: "Cardiologie",
workCycleId: "matin",
status: "available",
},
{
id: "ag_2",
name: "Karim Benali",
sector: "Cardiologie",
workCycleId: "matin",
status: "available",
},
{
id: "ag_3",
name: "Julie Dupont",
sector: "Chirurgie",
workCycleId: "matin",
status: "available",
},
];
});

const [bioTasks, setBioTasks] = useState(() => {
const saved = localStorage.getItem("bioTasks");
return saved ? JSON.parse(saved) : [];
});

function handleUpdateBioTask(taskId, patch) {
  setBioTasks((prevTasks) => {
    const updatedTasks = prevTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : task
    );

    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (
      updatedTask?.status === "done" &&
      updatedTask?.taskType === "exit" &&
      updatedTask?.patientId &&
      typeof updatePatient === "function"
    ) {
      updatePatient(updatedTask.patientId, {
        lit: null,
        discharged: true,
        discharge: {
          ...(patients.find((p) => p.id === updatedTask.patientId)?.discharge || {}),
          effectiveAt: new Date().toISOString(),
        },
      });
    }

    return updatedTasks;
  });
}

useEffect(() => {
localStorage.setItem("bioAgents", JSON.stringify(bioAgents));
}, [bioAgents]);

useEffect(() => {
localStorage.setItem("bioTasks", JSON.stringify(bioTasks));
}, [bioTasks]);
const [vulnPopoverId, setVulnPopoverId] = useState(null);
const [bioDemoAgentView, setBioDemoAgentView] = useState(false);

const demoBioAgentUser = {
id: "ag_1",
matricule: "ag_1",
nom: "Sophie Martin",
role: "BIO_AGENT",
};
const [vulnerabilityModalPatient, setVulnerabilityModalPatient] = useState(null);
const [vulnerabilityForm, setVulnerabilityForm] = useState({
criteria: [],
consentAccepted: false,
signerType: "patient",
signerName: "",
signedAt: "",
photoDataUrl: "",
photoTakenAt: "",
comment: "",
});
const [vulnerabilityFormError, setVulnerabilityFormError] = useState("");
const [cameraStream, setCameraStream] = useState(null);

const [bedStates, setBedStates] = useState(() =>
buildInitialBedStates(HOSPITAL_BEDS)
);


const signatureRef = useRef(null);
const videoRef = useRef(null);
const [selectedBedMeta, setSelectedBedMeta] = useState(null);
const [bedForm, setBedForm] = useState({
reason: BED_BLOCK_REASONS.REPAIR,
startAt: "",
endAt: "",
note: "",
});
const [bedFormError, setBedFormError] = useState("");

function toggleService(service) {
setSelectedServices((prev) =>
prev.includes(service)
? prev.filter((item) => item !== service)
: [...prev, service]
);
}

const [appSettings, setAppSettings] = useState({
rules: {
dmsThreshold: 10,
avoidableDaysTarget: 0,
recoveryWindowHours: 48,
criticalPatientsThreshold: 1,
fastExitThresholdHours: 24,
directionAlertThreshold: 2,
},
bioCleaning: {
zones: [],
scenarios: [],
},
});

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



function resetServices() {
setSelectedServices([]);
}

function handleResetPatients() {
  alert(typeof resetPatientsFromDPI);
  resetPatientsFromDPI();
  setActiveFilter("all");
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
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

updatePatient(patient.id, {
  medicalReady: nextValue,
  sortantMedical: nextValue,

  medicalReadyAt: nextValue ? now : "",
  medicalReadyDate: nextValue ? today : "",
  dateSortantMedicalement: nextValue ? today : "",
  sortantMedicalementDate: nextValue ? today : "",

  medicalReadiness: {
    ...(patient?.medicalReadiness || {}),
    isMedicallyReady: nextValue,
    activatedAt: nextValue ? now : "",
  },
});
}

function miniStatusButton(active) {
return {
display: "flex",
alignItems: "center",
gap: 6,
padding: "4px 8px",
borderRadius: 10,
border: "1px solid #e2e8f0",
background: active ? "#ffffff" : "transparent",
color: "#334155",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
};
}

function miniInlineSwitch(active, color) {
return {
width: 22,
height: 12,
borderRadius: 999,
background: active ? color : "#cbd5e1",
position: "relative",
display: "inline-block",
transition: "all .2s ease",
};
}

function miniInlineKnob(active) {
return {
width: 8,
height: 8,
borderRadius: "50%",
background: "#fff",
position: "absolute",
top: 2,
left: active ? 12 : 2,
transition: "all .2s ease",
};
}


function updateInfectionRisk(patient, patch) {
if (typeof updatePatient !== "function") return;

updatePatient(patient.id, {
infectionRisk: {
...(patient?.infectionRisk || {
isolation: false,
type: "standard",
pathogen: "",
hygieneRisk: false,
notes: "",
startAt: "",
endAt: "",
}),
...patch,
},

discharge: {
...(patient?.discharge || {
medicallyReady: false,
medicallyReadyAt: "",

validated: false,
validatedAt: "",

plannedAt: "",
effectiveAt: "",

solution: {
type: "",
label: "",
},
}),
},
});
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

function openVulnerabilityModal(patient) {
const currentCriteria = safeArray(patient?.vulnerability?.criteria);
const currentPhoto = patient?.vulnerabilityPhoto || {};

stopCamera();

setVulnerabilityModalPatient(patient);
setVulnerabilityForm({
criteria: currentCriteria,
consentAccepted: Boolean(currentPhoto?.consent?.accepted),
signerType: currentPhoto?.consent?.signerType || "patient",
signerName: currentPhoto?.consent?.signerName || "",
signedAt: currentPhoto?.consent?.signedAt || "",
photoDataUrl: currentPhoto?.lastPhoto?.imageData || "",
photoTakenAt: currentPhoto?.lastPhoto?.createdAt || "",
comment: currentPhoto?.lastPhoto?.comment || "",
});
setVulnerabilityFormError("");

setTimeout(() => {
if (signatureRef.current) {
signatureRef.current.clear();

const existingSignature = currentPhoto?.consent?.signatureImage;
if (existingSignature) {
const img = new Image();
img.onload = () => {
const canvas = signatureRef.current.getCanvas();
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};
img.src = existingSignature;
}
}
}, 0);
}

function closeVulnerabilityModal() {
stopCamera();
setVulnerabilityModalPatient(null);
setVulnerabilityFormError("");
if (signatureRef.current) {
signatureRef.current.clear();
}
}

async function startCamera() {
try {
stopCamera();
setVulnerabilityFormError("");

const stream = await navigator.mediaDevices.getUserMedia({
video: { facingMode: "environment" },
audio: false,
});

setCameraStream(stream);

setTimeout(() => {
if (videoRef.current) {
videoRef.current.srcObject = stream;
videoRef.current.play().catch(() => {});
}
}, 0);
} catch (error) {
setVulnerabilityFormError(
"Impossible d’accéder à la caméra sur cet appareil."
);
}
}

function stopCamera() {
if (videoRef.current?.srcObject) {
videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
videoRef.current.srcObject = null;
}

if (cameraStream) {
cameraStream.getTracks().forEach((track) => track.stop());
setCameraStream(null);
}
}

function capturePhotoFromVideo() {
const videoElement = videoRef.current;
if (!videoElement) return;

const width = videoElement.videoWidth;
const height = videoElement.videoHeight;
if (!width || !height) {
setVulnerabilityFormError("La caméra n’est pas prête.");
return;
}

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");
ctx.drawImage(videoElement, 0, 0, width, height);

const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

setVulnerabilityForm((prev) => ({
...prev,
photoDataUrl: dataUrl,
photoTakenAt: new Date().toISOString(),
}));

stopCamera();
}

function saveVulnerabilityWorkflow() {
if (!vulnerabilityModalPatient || typeof updatePatient !== "function") return;

if (vulnerabilityForm.criteria.length === 0) {
setVulnerabilityFormError("Sélectionne au moins un motif de vulnérabilité.");
return;
}

if (!vulnerabilityForm.consentAccepted) {
setVulnerabilityFormError("Le consentement est obligatoire.");
return;
}

if (!vulnerabilityForm.signerName.trim()) {
setVulnerabilityFormError("Le nom du signataire est obligatoire.");
return;
}

if (!vulnerabilityForm.photoDataUrl) {
setVulnerabilityFormError("La photo est obligatoire.");
return;
}

if (!signatureRef.current || signatureRef.current.isEmpty()) {
setVulnerabilityFormError("La signature est obligatoire.");
return;
}

const signatureImage = signatureRef.current
.getCanvas()
.toDataURL("image/png");

const now = new Date().toISOString();

updatePatient(vulnerabilityModalPatient.id, {
vulnerability: {
...(vulnerabilityModalPatient?.vulnerability || {}),
criteria: vulnerabilityForm.criteria,
updatedAt: now,
},
isVulnerable: vulnerabilityForm.criteria.length > 0,
vulnerabilityPhoto: {
...(vulnerabilityModalPatient?.vulnerabilityPhoto || {}),
hasPhoto: true,
lastPhotoAt: vulnerabilityForm.photoTakenAt || now,
consent: {
accepted: vulnerabilityForm.consentAccepted,
signerType: vulnerabilityForm.signerType,
signerName: vulnerabilityForm.signerName.trim(),
signedAt: vulnerabilityForm.signedAt || now,
signatureImage,
},
lastPhoto: {
imageData: vulnerabilityForm.photoDataUrl,
createdAt: vulnerabilityForm.photoTakenAt || now,
comment: vulnerabilityForm.comment || "",
},
photos: [
...safeArray(vulnerabilityModalPatient?.vulnerabilityPhoto?.photos),
{
id: `photo-${vulnerabilityModalPatient.id}-${Date.now()}`,
imageData: vulnerabilityForm.photoDataUrl,
createdAt: vulnerabilityForm.photoTakenAt || now,
comment: vulnerabilityForm.comment || "",
consent: {
accepted: vulnerabilityForm.consentAccepted,
signerType: vulnerabilityForm.signerType,
signerName: vulnerabilityForm.signerName.trim(),
signedAt: vulnerabilityForm.signedAt || now,
signatureImage,
},
},
],
},
});

closeVulnerabilityModal();
}



function openBedEditor(meta) {
const currentState = bedStates[meta.bedId] || {};

setSelectedBedMeta({
...meta,
currentState,
mode: "summary",
});

setBedForm({
reason: currentState.reason || BED_BLOCK_REASONS.REPAIR,
startAt: formatDateTimeLocal(
currentState.startAt || new Date().toISOString()
),
endAt: formatDateTimeLocal(currentState.endAt || ""),
note: currentState.note || "",
});

setBedFormError("");
}


function closeBedEditor() {
setSelectedBedMeta(null);
setBedFormError("");
}

function saveBedState() {
if (!selectedBedMeta?.bedId) return;

if (!bedForm.reason) {
setBedFormError("Le motif est obligatoire.");
return;
}

if (!bedForm.startAt) {
setBedFormError("La date/heure de début est obligatoire.");
return;
}

if (!bedForm.endAt) {
setBedFormError("La date/heure de fin est obligatoire.");
return;
}

const start = new Date(bedForm.startAt);
const end = new Date(bedForm.endAt);

if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
setBedFormError("Les dates saisies sont invalides.");
return;
}

if (end.getTime() <= start.getTime()) {
setBedFormError("La date/heure de fin doit être postérieure au début.");
return;
}

let status = BED_STATUSES.BLOCKED;
if (bedForm.reason === BED_BLOCK_REASONS.SCHEDULED_ADMISSION) {
status = BED_STATUSES.RESERVED;
}
if (bedForm.reason === BED_BLOCK_REASONS.ISOLATION) {
status = BED_STATUSES.ISOLATION;
}

setBedStates((prev) => {
const current = prev[selectedBedMeta.bedId] || {};





return {
...prev,
[selectedBedMeta.bedId]: {
...current,
status,
reason: bedForm.reason,
startAt: new Date(bedForm.startAt).toISOString(),
endAt: new Date(bedForm.endAt).toISOString(),
note: bedForm.note || "",
updatedAt: new Date().toISOString(),
history: [
...safeArray(current.history),
{
type: "update",
status,
reason: bedForm.reason,
startAt: new Date(bedForm.startAt).toISOString(),
endAt: new Date(bedForm.endAt).toISOString(),
note: bedForm.note || "",
createdAt: new Date().toISOString(),
},
],
},
};
});

closeBedEditor();
}

function releaseBed(bedId) {
setBedStates((prev) => {
const current = prev[bedId] || {};

return {
...prev,
[bedId]: {
...current,
status: BED_STATUSES.AVAILABLE,
reason: "",
startAt: "",
endAt: "",
note: "",
updatedAt: new Date().toISOString(),
history: [
...safeArray(current.history),
{
type: "release",
createdAt: new Date().toISOString(),
},
],
},
};
});

closeBedEditor();
}


const filteredPatients = useMemo(() => {
const base = safeArray(patients).filter((patient) => {
if (
  selectedServices.length &&
  !selectedServices.includes(patient?.serviceCode)
) {
  return false;
}

if (activeFilter === "all") return true;

if (activeFilter === "new") {
return isNewPatient(patient, consultedIds, highlightPatientId);
}

if (activeFilter === "complex") return isComplexPatient(patient);
if (activeFilter === "medical") return isMedicalReady(patient);
if (activeFilter === "avoidable") return getAvoidableDays(patient) > 0;
if (activeFilter === "recoverable") return isBedRecoverable(patient);

if (activeFilter === "availableNow") {
return isPatientAvailableWithinHours(patient, 0.25);
}

if (activeFilter === "available6h") {
return isPatientAvailableWithinHours(patient, 6);
}

if (activeFilter === "available24h") {
return isPatientAvailableWithinHours(patient, 24);
}

if (activeFilter === "available48h") {
return isPatientAvailableWithinHours(patient, 48);
}

if (activeFilter === "dms") return getLengthOfStay(patient) >= 10;
if (activeFilter === "target") return Boolean(getTargetDate(patient));
if (activeFilter === "vulnerable") return isVulnerable(patient);

if (activeFilter === "incident") {
return Boolean(getCurrentIncident(patient, incidents));
}

if (activeFilter === "isolation") {
return patient?.infectionRisk?.isolation;
}

if (activeFilter === "risk") {
return patient?.infectionRisk?.hygieneRisk;
}

if (activeFilter === "blockage") {
return (
getBlockageLabel(patient) &&
getBlockageLabel(patient) !== "Non défini"
);

if (activeFilter === "available2h") {
  return isPatientAvailableWithinHours(patient, 2);
}

if (activeFilter === "available4h") {
  return isPatientAvailableWithinHours(patient, 4);
}

if (activeFilter === "available12h") {
  return isPatientAvailableWithinHours(patient, 12);
}
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

const crisisTriggerPatients = useMemo(() => {
return safeArray(patients).filter(isCrisisTriggerPatient);
}, [patients]);

const crisisAlertLevel =
crisisTriggerPatients.length >= 6
? "red"
: crisisTriggerPatients.length >= 3
? "amber"
: "green";
console.log("patients total =", patients?.length);
console.log("selectedServices =", selectedServices);
console.log("activeFilter =", activeFilter);
console.log("filteredPatients total =", filteredPatients?.length);
console.log("1er patient =", patients?.[0]);
console.log("1er patient filtré =", filteredPatients?.[0]);


const dmsMetrics = useMemo(
() => computeDMSMetrics(patients),
[patients]
);


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

      const availableBeds = getAvailableBeds(capacity, occupancy);

      const complex = servicePatients.filter(isComplexPatient).length;
      const medical = servicePatients.filter(isMedicalReady).length;
      const vulnerable = servicePatients.filter(isVulnerable).length;

      const incidentsCount = servicePatients.filter((patient) =>
        Boolean(getCurrentIncident(patient, incidents))
      ).length;

      const dmsExceeded = servicePatients.filter(
        (patient) => getLengthOfStay(patient) >= 10
      ).length;

      const avoidableDays = servicePatients.reduce(
        (sum, patient) => sum + getAvoidableDays(patient),
        0
      );

      const recoverable = servicePatients.filter(isRecoverable).length;

      const targetDefined = servicePatients.filter((patient) =>
        Boolean(getTargetDate(patient))
      ).length;

      const criticalPatients = servicePatients.filter(
        (patient) => getRiskLevel(patient, incidents).color === "red"
      ).length;

      const fastExits = servicePatients.filter(
        (patient) =>
          isRecoverable(patient) ||
          (isMedicalReady(patient) && Boolean(getTargetDate(patient)))
      ).length;

      const dominantBlockage = getDominantBlockage(servicePatients);

      const tensionScore =
        occupancyRate +
        incidentsCount * 30 +
        criticalPatients * 25 +
        dmsExceeded * 8 +
        complex * 6 +
        vulnerable * 3 -
        availableBeds * 5 -
        fastExits * 4;

      const risk =
        incidentsCount > 0 ||
        occupancyRate >= 100 ||
        criticalPatients > 0
          ? { color: "red", label: "Alerte" }
          : occupancyRate >= 85 || dmsExceeded > 0 || complex >= 3
          ? { color: "amber", label: "Vigilance" }
          : { color: "green", label: "Stable" };

      const actionLabel =
        risk.color === "red"
          ? "Arbitrage direction"
          : fastExits > 0
          ? "Activer sorties"
          : occupancyRate >= 85
          ? "Surveiller tension"
          : "Suivi standard";

      return {
        service,
        capacity,
        occupancy,
        occupancyLabel: `${occupancy}/${capacity}`,
        occupancyRate,
        availableBeds,
        complex,
        medical,
        avoidableDays,
        recoverable,
        dmsExceeded,
        targetDefined,
        vulnerable,
        incidents: incidentsCount,
        criticalPatients,
        fastExits,
        dominantBlockage,
        risk,
        tensionScore,
        actionLabel,
      };
    })
    .sort((a, b) => b.tensionScore - a.tensionScore);
}, [patients, selectedServices, services, incidents]);
const cleanedExitBedsCount = useMemo(() => {
return safeArray(bioTasks).filter(
(task) => task.taskType === "exit" && task.status === "done"
).length;
}, [bioTasks]);

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

const fastExits = safeArray(patients).filter(
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
cleanedExitBeds: cleanedExitBedsCount,
};
}, [directionRows, filteredPatients, patients, incidents, cleanedExitBedsCount]);





const directionPatients = useMemo(() => {
return filteredPatients
.filter((p) => {
if (!isDirectionPriorityPatient(p, incidents)) return false;

const risk = getRiskLevel(p, incidents);
const hasIncident = Boolean(getCurrentIncident(p, incidents));
const los = getLengthOfStay(p);

if (activeFilter === "all") return true;
if (activeFilter === "new") {
return isNewPatient(p, consultedIds, highlightPatientId);
}

if (activeFilter === "critical") return risk.color === "red";
if (activeFilter === "complex") return isComplexPatient(p);
if (activeFilter === "recoverable") return isRecoverable(p);
if (activeFilter === "target") return Boolean(getTargetDate(p));
if (activeFilter === "vulnerable") return isVulnerable(p);
if (activeFilter === "medical") return isMedicalReady(p);
if (activeFilter === "avoidable") return getAvoidableDays(p) > 0;
if (activeFilter === "dms") return los >= 10;
if (activeFilter === "incident") return hasIncident;

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


const patientBedMap = useMemo(() => buildPatientBedMap(patients), [patients]);

// 🔍 DEBUG
console.log("PATIENT SAMPLE", patients[0]);

console.log("PATIENT BED MAP", patientBedMap);

console.log(
"HOSPITAL_BEDS MP1",
HOSPITAL_BEDS.find((s) => s.serviceLabel === "Médecine Polyvalente 1")
);



const filteredBedServices = useMemo(() => {
const scopedServices = selectedServices.length
? HOSPITAL_BEDS.filter((item) =>
selectedServices.includes(item.serviceLabel)
)
: HOSPITAL_BEDS;

return scopedServices.map((serviceItem) => ({
...serviceItem,
metrics: computeBedMetricsForService(
  serviceItem,
  bedStates,
  patientBedMap,
  settings?.bioCleaning
),
}));
}, [selectedServices, bedStates, patientBedMap, settings?.bioCleaning]);

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




function isPatientAvailableWithinHours(patient, hours) {
const recovery = buildBedRecovery(patient, {
bedId: `${patient?.chambre || ""}-${patient?.lit || ""}`,
});

const availableAt =
recovery?.recoverableCommittedAt ||
recovery?.recoverableForecastAt ||
recovery?.availableAt;

if (!availableAt) return false;

const date = new Date(availableAt);
if (Number.isNaN(date.getTime())) return false;

const now = new Date();
const diffHours = (date - now) / (1000 * 60 * 60);

// 🔥 FIX ICI
return diffHours >= 0 && diffHours <= hours;
}


const bedRecoveries = useMemo(() => {
return safeArray(patients).map((patient) =>
buildBedRecovery(patient, {
bedId: `${patient?.chambre || ""}-${patient?.lit || ""}`,
})
);
}, [patients]);


const availabilityStats = useMemo(() => {
return {
availableNow: bedRecoveries.filter((recovery) =>
isRecoveryWithinHours(recovery, 0.25)
).length,
availableIn6h: bedRecoveries.filter((recovery) =>
isRecoveryWithinHours(recovery, 6)
).length,
availableIn24h: bedRecoveries.filter((recovery) =>
isRecoveryWithinHours(recovery, 24)
).length,
availableIn48h: bedRecoveries.filter((recovery) =>
isRecoveryWithinHours(recovery, 48)
).length,
};
}, [bedRecoveries]);


const globalBedMetrics = useMemo(() => {
  return filteredBedServices.reduce(
    (acc, serviceItem) => {
      acc.totalBeds += serviceItem.metrics.totalBeds;
      acc.availableBeds += serviceItem.metrics.availableBeds;
      acc.occupiedBeds += serviceItem.metrics.occupiedBeds;
      acc.blockedBeds += serviceItem.metrics.blockedBeds;
      acc.reservedBeds += serviceItem.metrics.reservedBeds;
      acc.isolationBeds += serviceItem.metrics.isolationBeds;

      acc.recoverable2h += serviceItem.metrics.recoverable2h || 0;
      acc.recoverable4h += serviceItem.metrics.recoverable4h || 0;
      acc.recoverable6h += serviceItem.metrics.recoverable6h || 0;
      acc.recoverable12h += serviceItem.metrics.recoverable12h || 0;
      acc.recoverable24h += serviceItem.metrics.recoverable24h || 0;
      acc.recoverable48h += serviceItem.metrics.recoverable48h || 0;

      acc.forecastBlockages48h += serviceItem.metrics.forecastBlockages48h || 0;
acc.bioCleaningLoad += serviceItem.metrics.bioCleaningLoad || 0;
      return acc;
    },
    {
      totalBeds: 0,
      availableBeds: 0,
      occupiedBeds: 0,
      blockedBeds: 0,
      bioCleaningLoad: 0,
      reservedBeds: 0,
      isolationBeds: 0,

      recoverable2h: 0,
      recoverable4h: 0,
      recoverable6h: 0,
      recoverable12h: 0,
      recoverable24h: 0,
      recoverable48h: 0,

      forecastBlockages48h: 0,
    }
  );
}, [filteredBedServices]);

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
recoverable: filteredBedServices.reduce(
(sum, serviceItem) => sum + (serviceItem.metrics?.recoverable48h || 0),
0
),
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
availableNow: safeArray(filteredPatients).filter((patient) =>
isPatientAvailableWithinHours(patient, 0.25)
).length,

available6h: safeArray(filteredPatients).filter((patient) =>
isPatientAvailableWithinHours(patient, 6)
).length,

available24h: safeArray(filteredPatients).filter((patient) =>
isPatientAvailableWithinHours(patient, 24)
).length,

available48h: safeArray(filteredPatients).filter((patient) =>
isPatientAvailableWithinHours(patient, 48)
).length,


available2h: safeArray(filteredPatients).filter((patient) =>
  isPatientAvailableWithinHours(patient, 2)
).length,

available4h: safeArray(filteredPatients).filter((patient) =>
  isPatientAvailableWithinHours(patient, 4)
).length,

available12h: safeArray(filteredPatients).filter((patient) =>
  isPatientAvailableWithinHours(patient, 12)
).length,
};

const actionChips = [
{ key: "complex", label: "Complexes", count: totals.complex, color: "amber" },
{
key: "availableNow",
label: " Lits dispo immédiat",
count: totals.availableNow,
color: "green",
},
{
key: "available6h",
label: "Lits dispo < 6h",
count: totals.available6h,
color: "amber",
},
{
key: "available24h",
label: "Lits dispo < 24h",
count: totals.available24h,
color: "blue",
},
{
key: "available48h",
label: "Lits récupérables < 48h",
count: totals.available48h,
color: "purple",
},
{
key: "target",
label: "Date cible",
count: totals.targetDefined,
color: "blue",
},
{
key: "vulnerable",
label: "Vulnérables",
count: totals.vulnerable,
color: "purple",
},
{ key: "incident", label: "Incidents", count: totals.incidents, color: "red" },
{
  key: "available2h",
  label: "Lits récupérables < 2h",
  count: totals.available2h,
  color: "red",
},
{
  key: "available4h",
  label: "Lits récupérables < 4h",
  count: totals.available4h,
  color: "amber",
},
{
  key: "available12h",
  label: "Lits récupérables < 12h",
  count: totals.available12h,
  color: "blue",
},
];

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
label: "Sortants médicaux",
value: `${totals.avoidableDays} j`,
detail: "depuis validation médicale",
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

const toolbarGrid = {
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 14,
alignItems: "start",
width: "100%",
minWidth: 0,
};

const totalLoad = safeArray(patients).reduce(
(sum, p) => sum + getCleaningLoad(p),
0
);

const bedRecoveryPreview = safeArray(patients).map((patient) =>
buildBedRecovery(patient, {
bedId: `${patient?.chambre || ""}-${patient?.lit || ""}`,
})
);


// 🔒 ACCÈS EXCLUSIF AGENT BIO
if (user?.role === "BIO_AGENT") {

const cleanedExitBedsCount = useMemo(() => {
return safeArray(bioTasks).filter(
(task) => task.taskType === "exit" && task.status === "done"
).length;
}, [bioTasks]);


return (
<AppShell
header={
<AppHeader
subtitle="Ma tournée bio-nettoyage"
onLogout={onLogout}
user={user}
/>
}
>
<BioCleaningAgentView
user={user}
patients={patients}
bioCleaningSettings={settings?.bioCleaning}
/>
</AppShell>
);
}

return (


<AppShell
header={
<AppHeader
subtitle="Pilotage des parcours patient"
onLogout={onLogout}
user={user}
/>
}
>
<div
style={{
maxWidth: 1480,
width: "100%",
minWidth: 0,
margin: "0 auto",
display: "grid",
gap: 16,
}}
>
<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>



  {user?.role === "DIRECTION" && (
    <button
      type="button"
      className="app-btn app-btn-ghost"
      onClick={() => setView("admin")}
    >
      Gestion des comptes
    </button>
  )}

  {view === "admin" && (
    <button
      type="button"
      className="app-btn app-btn-ghost"
      onClick={() => setView("dashboard")}
    >
      Retour dashboard
    </button>
  )}

</div>

{view === "admin" ? (
<AdminUsers />
) : (
<>

{crisisTriggerPatients.length > 0 ? (
<section
className="app-card"
style={{
border:
crisisAlertLevel === "red"
? "2px solid #fecaca"
: "2px solid #fed7aa",
background:
crisisAlertLevel === "red" ? "#fef2f2" : "#fff7ed",
padding: 16,
borderRadius: 18,
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
flexWrap: "wrap",
}}
>
<div style={{ display: "grid", gap: 4 }}>
<strong
style={{
color: crisisAlertLevel === "red" ? "#991b1b" : "#9a3412",
fontSize: 16,
}}
>
{crisisAlertLevel === "red"
? "Cellule de crise recommandée"
: "Pré-alerte capacitaire"}
</strong>

<span style={{ fontSize: 13, color: "#475569" }}>
{crisisTriggerPatients.length} patient(s) avec blocage, sans solution et DMS ≥ J+7.
</span>
</div>

<button
type="button"
className="app-btn app-btn-primary"
onClick={() => {
localStorage.setItem(
"carabbas_crise_prefill_patient_ids",
JSON.stringify(crisisTriggerPatients.map((p) => p.id))
);

navigate("/crise");
}}
>
Préparer cellule de crise
</button>
</section>
) : null}

<section className="app-card" style={headerCard}>

<div style={{ display: "grid", gap: 12 }}>
<div style={{ display: "grid", gap: 6, width: "100%", minWidth: 0 }}>
<span style={sectionEyebrow}>Vue</span>

<div
className="view-header"
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 12,
width: "100%",
}}
>
<div className="view-tabs">
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

<button
type="button"
className={`app-chip ${mode === "beds" ? "blue" : ""}`}
onClick={() => setMode("beds")}
>
Gestion des lits
</button>

<button
type="button"
className={`app-chip ${mode === "bio" ? "blue" : ""}`}
onClick={() => setMode("bio")}
>
Cadre bio
</button>
<button
  type="button"
  className={`app-chip ${mode === "bio-agent-demo" ? "blue" : ""}`}
  onClick={() => setMode("bio-agent-demo")}
>
  Vue agent bio
</button>
<button
type="button"
className={`app-chip ${mode === "settings" ? "blue" : ""}`}
onClick={() => setMode("settings")}
>
Paramétrage
</button>
</div>

<button
  type="button"
  className="app-chip"
  style={{ marginLeft: "auto" }}
  onClick={handleResetPatients}
>
  Réinitialisation patients
</button>

</div>
</div>




{mode !== "settings" && mode !== "bio" && (
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

{HOSPITAL_SERVICES.map((service) => (
  <button
    key={service.code}
    type="button"
    className={`app-chip ${
      selectedServices.includes(service.code) ? "blue" : ""
    }`}
    onClick={() => toggleService(service.code)}
  >
    {service.label}
  </button>
))}
</div>
</div>
)}

</div>

{mode === "direction" && (
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
{directionSummary.recoverableBeds} lits théoriquement récupérables
</span>

<span style={statusBadgeStyle("green")}>
{directionSummary.cleanedExitBeds} lit(s) prêt(s) après bio-nettoyage
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
{directionSummary.criticalPatients} patient(s) critique(s)
</span>

<span
style={statusBadgeStyle(
directionSummary.servicesToArbitrate > 0 ? "amber" : "green"
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
)}



{mode === "settings" && (
<SettingsPage
value={settings}
onChange={setSettings}
services={services}
/>
)}


{mode === "bio" &&
  (user?.role === "BIO_AGENT" || bioDemoAgentView ? (
    <BioCleaningAgentView
      user={demoBioAgentUser || user}
      tasks={bioTasks} // 🔥 IMPORTANT : PAS de filter ici
      agents={bioAgents}
      onUpdateTask={handleUpdateBioTask}
    />
  ) : (
    <BioCleaningManagerView
      patients={patients}
      services={services}
      bioCleaningSettings={settings?.bioCleaning}
      agents={bioAgents}
      setAgents={setBioAgents}
      tasks={bioTasks}
      setTasks={setBioTasks}
    />
  ))}
{mode === "bio-agent-demo" && (
  <BioCleaningAgentView
    user={demoBioAgentUser}
    tasks={bioTasks.filter(
      (task) => task.assignedAgentId === demoBioAgentUser.id
    )}
    agents={bioAgents}
    onUpdateTask={(taskId, patch) =>
      setBioTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...patch } : task
        )
      )
    }
  />
)}



{mode === "service" || mode === "direction" ? (
<>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
style={kpiCard(
activeFilter === kpi.key,
kpi.strong,
kpi.kind
)}
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
className={`app-chip ${
activeFilter === "medical" ? "blue" : ""
}`}
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

<button
type="button"
className={`app-chip ${activeFilter === "isolation" ? "blue" : ""}`}
onClick={() => setActiveFilter("isolation")}
>
Isol
</button>

<button
type="button"
className={`app-chip ${activeFilter === "risk" ? "blue" : ""}`}
onClick={() => setActiveFilter("risk")}
>
R.Inf
</button>


</div>
</>
) : null}
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
<div style={{ display: "grid", gap: 4 }}>
<strong style={{ color: "#17376a", fontSize: 18 }}>
Pilotage direction par service
</strong>
<span style={{ fontSize: 12, color: "#64748b" }}>
tension capacitaire · patients critiques · sorties activables · blocages
</span>
</div>
</div>

<div style={{ display: "grid", gap: 12 }}>
{directionRows.map((row) => (
<div
key={row.service}
style={{
...directionRowCard,
border:
row.risk.color === "red"
? "1px solid #f1b3aa"
: row.risk.color === "amber"
? "1px solid #f3d089"
: "1px solid #d9efe0",
background:
row.risk.color === "red"
? "#fff8f7"
: row.risk.color === "amber"
? "#fffdf8"
: "#fbfffc",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(220px, 1.4fr) auto",
gap: 12,
alignItems: "start",
}}
>
<div style={{ display: "grid", gap: 6 }}>
<span style={directionMetricLabel}>Service</span>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
<strong style={{ fontSize: 17, color: "#17376a" }}>
{row.service}
</strong>

<span style={statusBadgeStyle(row.risk.color)}>
{row.risk.label}
</span>

<span style={statusBadgeStyle(row.risk.color === "red" ? "red" : "blue")}>
{row.actionLabel || "Suivi standard"}
</span>
</div>

<div style={{ fontSize: 12, color: "#64748b" }}>
Blocage dominant : <strong>{row.dominantBlockage}</strong>
</div>
</div>

<div style={{ textAlign: "right", display: "grid", gap: 2 }}>
<span style={directionMetricLabel}>Occupation</span>
<div style={{ fontSize: 22, fontWeight: 900, color: "#17376a" }}>
{row.occupancyLabel}
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
{row.occupancyRate}% · {row.availableBeds} lit(s) dispo
</div>
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
gap: 10,
}}
>
<div style={directionMetric}>
<span style={directionMetricLabel}>Critiques</span>
<strong style={{ fontSize: 18, color: row.criticalPatients > 0 ? "#b42318" : "#17376a" }}>
{row.criticalPatients || 0}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Sort Med</span>
<strong style={{ fontSize: 18 }}>{row.medical}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Sorties activables</span>
<strong style={{ fontSize: 18, color: row.fastExits > 0 ? "#166534" : "#17376a" }}>
{row.fastExits || 0}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Récupérables</span>
<strong style={{ fontSize: 18 }}>{row.recoverable}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>DMS ≥ J+10</span>
<strong style={{ fontSize: 18, color: row.dmsExceeded > 0 ? "#a16207" : "#17376a" }}>
{row.dmsExceeded}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Jours évitables</span>
<strong style={{ fontSize: 18, color: row.avoidableDays > 0 ? "#b42318" : "#17376a" }}>
{row.avoidableDays}
</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Vulnérables</span>
<strong style={{ fontSize: 18 }}>{row.vulnerable}</strong>
</div>

<div style={directionMetric}>
<span style={directionMetricLabel}>Incidents</span>
<strong style={{ fontSize: 18, color: row.incidents > 0 ? "#b42318" : "#17376a" }}>
{row.incidents}
</strong>
</div>
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
<div style={{ display: "grid", gap: 4 }}>
<strong style={{ color: "#17376a", fontSize: 18 }}>
Patients à arbitrer
</strong>
<span style={{ fontSize: 12, color: "#64748b" }}>
patients critiques · DMS longue · sort med sans solution · vulnérabilité · incident
</span>
</div>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "all" ? "blue" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("all")}
>
Tous
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "critical" ? "red" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("critical")}
>
Critiques
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "medical" ? "blue" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("medical")}
>
Sort Med
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "dms" ? "amber" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("dms")}
>
DMS longue
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "vulnerable" ? "purple" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("vulnerable")}
>
Vulnérables
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "incident" ? "red" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("incident")}
>
Incidents
</button>

<button
type="button"
style={{
...statusBadgeStyle(activeFilter === "avoidable" ? "amber" : "neutral"),
cursor: "pointer",
}}
onClick={() => setActiveFilter("avoidable")}
>
Jours évitables
</button>
</div>

<div style={{ display: "grid", gap: 10 }}>
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
const previousIncident = hasPreviousEscapeIncident(patient, incidents);
const newPatient = isNewPatient(patient, consultedIds, highlightPatientId);
const cleaningType = getCleaningType(patient);
const riskLevel = getRiskLevel(patient, incidents);


return (
<article
key={`dir-${patient.id}`}
style={{
...directionPatientRow,
...getPatientCardTone(patient, incidents),
border:
riskLevel.color === "red"
? "2px solid #f1b3aa"
: "1px solid #e5ebf4",
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

<span style={statusBadgeStyle(riskLevel.color)}>
{riskLevel.label}
</span>

<span style={statusBadgeStyle(getComplexityBadgeColor(patient))}>
{getComplexityLabel(patient)}
</span>

{medicallyReady ? (
<span style={statusBadgeStyle("blue")}>Sort Med</span>
) : null}

{vulnerable ? (
<span style={statusBadgeStyle("purple")}>
Vulnérable ({vulnerabilityCount(patient)})
</span>
) : null}

{currentIncident ? (
<span style={statusBadgeStyle("red")}>Incident actif</span>
) : null}

{!currentIncident && previousIncident ? (
<span style={statusBadgeStyle("amber")}>Antécédent fugue</span>
) : null}

{los >= 10 ? (
<span style={statusBadgeStyle("amber")}>DMS longue</span>
) : null}

<span
style={statusBadgeStyle(
cleaningType === "ISO AIR" ||
cleaningType === "ISO CONTACT" ||
cleaningType === "ISO GOUT" ||
cleaningType === "IS"
? "red"
: cleaningType === "RENFORCÉ"
? "amber"
: "neutral"
)}
>
{cleaningType === "IS" ? "Précautions hygiène" : cleaningType}
</span>
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
<strong>Solution :</strong> {getSolutionLabel(patient)}
</div>

{currentIncident ? (
<div style={{ fontSize: 12, color: "#334155" }}>
<strong>Workflow :</strong>{" "}
{getIncidentStepLabel(currentIncident)}
</div>
) : null}
</div>

<div
style={{
display: "grid",
gap: 6,
alignContent: "center",
}}
>
<div>
  <span
    style={{
      fontWeight: 900,
      fontSize: 22,
      color: getDMSColor(los),
    }}
  >
    J+{los}
  </span>

  {(patient?.medicalReady ||
    patient?.sortantMedical ||
    patient?.medicalReadiness?.isMedicallyReady) && (
    <div
      style={{
        fontWeight: 800,
        fontSize: 13,
        color: "#b91c1c",
        marginTop: 4,
      }}
    >
      {getAvoidableDays(patient)} j évitable
    </div>
  )}
</div>

<span style={statusBadgeStyle(targetStatus.color)}>
Date cible{" "}
{targetDate ? formatShortDate(targetDate) : "non définie"} ·{" "}
{targetStatus.label}
</span>
</div>

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

<div
style={{
display: "flex",
gap: 12,
alignItems: "center",
padding: "6px 10px",
border: "1px solid #e2e8f0",
borderRadius: 12,
background: "#f8fafc",
}}
>
<button
type="button"
onClick={() =>
updateInfectionRisk(patient, {
isolation: !(patient?.infectionRisk?.isolation || false),
type: patient?.infectionRisk?.type || "standard",
startAt: !(patient?.infectionRisk?.isolation || false)
? new Date().toISOString()
: "",
endAt: !(patient?.infectionRisk?.isolation || false)
? ""
: new Date().toISOString(),
})
}
style={miniStatusButton(patient?.infectionRisk?.isolation)}
>
<span>PRECO</span>
<span
style={miniInlineSwitch(
patient?.infectionRisk?.isolation,
"#ef4444"
)}
>
<span
style={miniInlineKnob(patient?.infectionRisk?.isolation)}
/>
</span>
</button>

<button
type="button"
onClick={() =>
updateInfectionRisk(patient, {
hygieneRisk: !(patient?.infectionRisk?.hygieneRisk || false),
})
}
style={miniStatusButton(patient?.infectionRisk?.hygieneRisk)}
>
<span>RI</span>
<span
style={miniInlineSwitch(
patient?.infectionRisk?.hygieneRisk,
"#f59e0b"
)}
>
<span
style={miniInlineKnob(patient?.infectionRisk?.hygieneRisk)}
/>
</span>
</button>
</div>
</div>
</article>
);
})
)}
</div>
</section>

</>
) : null}


{mode === "beds" ? (
<>
<section className="app-card" style={directionCard}>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: 10,
}}
>
<div style={kpiCard(false, true, "info")}>
  <span style={kpiEyebrow}>Lits totaux</span>
  <strong style={{ fontSize: 28, color: "#17376a" }}>
    {globalBedMetrics.totalBeds}
  </strong>
</div>

<div style={kpiCard(false, true, "watch")}>
<span style={kpiEyebrow}>Disponibles</span>
<strong style={{ fontSize: 28, color: "#166534" }}>
{globalBedMetrics.availableBeds}
</strong>
</div>

<div style={kpiCard(false, true, "critical")}>
<span style={kpiEyebrow}>Occupés</span>
<strong style={{ fontSize: 28, color: "#475569" }}>
{globalBedMetrics.occupiedBeds}
</strong>
</div>

<div style={kpiCard(false, true, "critical")}>
<span style={kpiEyebrow}>Bloqués</span>
<strong style={{ fontSize: 28, color: "#b42318" }}>
{globalBedMetrics.blockedBeds}
</strong>
</div>

<div style={kpiCard(false, true, "critical")}>
  <span style={kpiEyebrow}>Récupérables &lt; 2h</span>
  <strong style={{ fontSize: 28, color: "#b42318" }}>
    {globalBedMetrics.recoverable2h || 0}
  </strong>
</div>

<div style={kpiCard(false, true, "action")}>
  <span style={kpiEyebrow}>Récupérables &lt; 4h</span>
  <strong style={{ fontSize: 28, color: "#a16207" }}>
    {globalBedMetrics.recoverable4h || 0}
  </strong>
</div>

<div style={kpiCard(false, true, "action")}>
  <span style={kpiEyebrow}>Récupérables &lt; 6h</span>
  <strong style={{ fontSize: 28, color: "#a16207" }}>
    {globalBedMetrics.recoverable6h || 0}
  </strong>
</div>

<div style={kpiCard(false, true, "info")}>
  <span style={kpiEyebrow}>Récupérables &lt; 12h</span>
  <strong style={{ fontSize: 28, color: "#17376a" }}>
    {globalBedMetrics.recoverable12h || 0}
  </strong>
</div>

<div style={kpiCard(false, true, "watch")}>
  <span style={kpiEyebrow}>Récupérables &lt; 24h</span>
  <strong style={{ fontSize: 28, color: "#6d28d9" }}>
    {globalBedMetrics.recoverable24h || 0}
  </strong>

</div>



<div style={kpiCard(false, true, "watch")}>
<span style={kpiEyebrow}>Charge bio-nettoyage</span>
<strong style={{ fontSize: 28, color: "#a16207" }}>
{globalBedMetrics.bioCleaningLoad}
</strong>
</div>

<div style={kpiCard(false, true, "watch")}>
<span style={kpiEyebrow}>Blocages prévus &lt; 48h</span>
<strong style={{ fontSize: 28, color: "#6d28d9" }}>
{globalBedMetrics.forecastBlockages48h}
</strong>
</div>



</div>
</section>






{filteredBedServices.map((serviceItem) => (
<section
key={serviceItem.serviceCode}
className="app-card"
style={directionCard}
>
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
{serviceItem.serviceLabel}
</strong>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={statusBadgeStyle("green")}>
{serviceItem.metrics.availableBeds} dispo
</span>
<span style={statusBadgeStyle("neutral")}>
{serviceItem.metrics.occupiedBeds} occupé(s)
</span>
<span style={statusBadgeStyle("red")}>
{serviceItem.metrics.blockedBeds} bloqué(s)
</span>
<span style={statusBadgeStyle("blue")}>
{serviceItem.metrics.reservedBeds} entrée(s) programmée(s)
</span>
<span style={statusBadgeStyle("red")}>
  {serviceItem.metrics.recoverable2h || 0} &lt; 2h
</span>

<span style={statusBadgeStyle("amber")}>
  {serviceItem.metrics.recoverable4h || 0} &lt; 4h
</span>

<span style={statusBadgeStyle("amber")}>
  {serviceItem.metrics.recoverable6h || 0} &lt; 6h
</span>

<span style={statusBadgeStyle("blue")}>
  {serviceItem.metrics.recoverable12h || 0} &lt; 12h
</span>

<span style={statusBadgeStyle("purple")}>
  {serviceItem.metrics.recoverable24h || 0} &lt; 24h
</span>

<span style={statusBadgeStyle("amber")}>
  {serviceItem.metrics.recoverable48h || 0} &lt; 48h
</span>
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
gap: 6,
}}
>
{safeArray(serviceItem.rooms).flatMap((room) =>
  safeArray(room.beds).map((bed) => {
    const key = getPatientBedMapKey(room.roomNumber, bed.label);
    const linkedPatient = patientBedMap[key];
    if (linkedPatient?.nom === "Martin" && linkedPatient?.prenom === "Paul") {
console.log("MARTIN PAUL", linkedPatient);
}
    const bedState = bedStates[bed.bedId] || {};
    const status = getBedComputedStatus(bedState, linkedPatient);
    const shortLabel = getBedShortLabel(bed.label, room.roomType);

    const recovery = linkedPatient
      ? buildBedRecovery(linkedPatient, { bedId: bed.bedId }, settings?.bioCleaning)
      : null;

    const isFree = !linkedPatient;
    const isCommitted = recovery?.recoverableStatus === "committed";
    const patient = linkedPatient;

const los = patient ? getLengthOfStay(patient) : null;
const targetDate = patient
? patient.dateSortiePrevue || patient.targetDate
: null;

const cleaningType = patient ? getCleaningType(patient) : null;
const cleaningDuration =
cleaningType === "RENFORCÉ"
? "45 min"
: cleaningType === "ISO AIR" ||
cleaningType === "ISO CONTACT" ||
cleaningType === "ISO GOUT"
? "60 min"
: "30 min";

    const isForecast = recovery?.recoverableStatus === "forecast";
    const isValidated = recovery?.context?.dischargeValidated;
    const isRecoverable = isCommitted || isForecast;

    const when =
  recovery?.recoverableCommittedAt ||
  recovery?.confirmedAvailableAt;

    const diffMinutes = when
      ? Math.round((new Date(when).getTime() - Date.now()) / 60000)
      : null;

    const isUrgent =
      diffMinutes !== null &&
      diffMinutes >= 0 &&
      diffMinutes <= 120 &&
      isRecoverable;

    const badgeColor = isFree
      ? "green"
      : isCommitted && isValidated
      ? "green"
      : isCommitted
      ? "green"
      : isForecast
      ? "amber"
      : status === BED_STATUSES.BLOCKED
      ? "red"
      : status === BED_STATUSES.RESERVED
      ? "blue"
      : "neutral";

    const badgeLabel = isFree
      ? "Disponible"
      : isCommitted && isValidated
      ? "Sortie validée"
      : isCommitted
      ? "Bientôt dispo"
      : isForecast
      ? "Sortie prévue"
      : status === BED_STATUSES.BLOCKED
      ? "Bloqué"
      : status === BED_STATUSES.RESERVED
      ? "Entrée prévue"
      : "Occupé";

    const cardBackground =
      status === BED_STATUSES.BLOCKED
        ? "#fff7f7"
        : status === BED_STATUSES.RESERVED
        ? "#eef4ff"
        : isFree
        ? "#f7fcf8"
        : isCommitted
        ? "#f0fdf4"
        : isForecast
        ? "#fff7ed"
        : "#f8fafc";

    const cardBorderColor =
      isUrgent
        ? "#f59e0b"
        : status === BED_STATUSES.BLOCKED
        ? "#f1b3aa"
        : status === BED_STATUSES.RESERVED
        ? "#cfe0ff"
        : isFree
        ? "#cdebd8"
        : isCommitted
        ? "#bbf7d0"
        : isForecast
        ? "#fed7aa"
        : "#e2e8f0";

    const cleaningMinutes = recovery?.estimatedMinutes || 0;

    const hygieneLabel =
      recovery?.cleaningType === "isolement"
        ? "Précautions hygiène"
        : CLEANING_TYPES[recovery?.cleaningType]?.label || "Standard";

    const patientFullName = linkedPatient
      ? `${linkedPatient.nom || ""} ${linkedPatient.prenom || ""}`.trim()
      : "";

    return (
      <button
        key={bed.bedId}
        type="button"
        onClick={() =>
          openBedEditor({
            bedId: bed.bedId,
            serviceCode: serviceItem.serviceCode,
            serviceLabel: serviceItem.serviceLabel,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            bedLabel: bed.label,
            linkedPatient,
          })
        }
        style={{
          border: `1px solid ${cardBorderColor}`,
          borderRadius: 12,
          padding: 10,
          minHeight: 118,
          cursor: "pointer",
          textAlign: "left",
          background: cardBackground,
          boxShadow: isUrgent
            ? "0 0 0 2px rgba(245,158,11,.35), 0 8px 18px rgba(161,98,7,.12)"
            : isRecoverable
            ? "0 6px 16px rgba(161,98,7,.08)"
            : "0 3px 10px rgba(15,23,42,.03)",
        }}
        title={`Chambre ${room.roomNumber}${shortLabel ? ` · ${shortLabel}` : ""}`}
      >
       <div style={{ display: "grid", gap: 4 }}>
<div style={{ fontWeight: 700, fontSize: 13 }}>
{room.roomNumber}
{shortLabel}
</div>


{linkedPatient ? (
<>
<div style={{ fontWeight: 600, fontSize: 12 }}>
{linkedPatient.nom} {linkedPatient.prenom}
</div>

<div style={{ fontSize: 11, color: "#475569" }}>
  {getLengthOfStay(linkedPatient) !== null ? (
    <div style={{ fontSize: 11, color: "#475569" }}>
      J+{getLengthOfStay(linkedPatient)}
    </div>
  ) : null}

  {getBedExitLabel(linkedPatient) ? (
    <> · {getBedExitLabel(linkedPatient)}</>
  ) : null}

    {isMedicalReady(linkedPatient) && (
    <div
      style={{
        fontSize: 11,
        color: "#b91c1c",
        fontWeight: 800,
        marginTop: 2,
      }}
    >
      {getAvoidableDays(linkedPatient)} j évitable
    </div>
  )}
</div>


<div style={{ fontSize: 11, color: "#334155" }}>
🧼 {getCleaningType(linkedPatient) || "Standard"} ·{" "}
{getCleaningType(linkedPatient) === "RENFORCÉ"
? "45 min"
: getCleaningType(linkedPatient)?.startsWith("ISO")
? "60 min"
: "30 min"}
</div>
      {when ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: isRecoverable ? "#a16207" : "#64748b",
          }}
        >
          🕒 Dispo chambre {formatDayAndTime(when)}
        </div>
      ) : null}
</>

) : (
<div style={{ display: "grid", gap: 2 }}>
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      color:
        status === BED_STATUSES.AVAILABLE
          ? "#16a34a"
          : status === BED_STATUSES.RESERVED
          ? "#1d4ed8"
          : status === BED_STATUSES.BLOCKED
          ? "#b42318"
          : "#64748b",
    }}
  >
    {getBedStatusLabel(status)}
  </div>

  {bedState?.startAt && bedState?.endAt ? (
    <div style={{ fontSize: 10, color: "#64748b" }}>
      {status === BED_STATUSES.BLOCKED
        ? `du ${formatShortDateTime(bedState.startAt)} au ${formatShortDateTime(
            bedState.endAt
          )}`
        : status === BED_STATUSES.RESERVED
        ? `entrée le ${formatShortDateTime(bedState.startAt)}`
        : ""}
    </div>
  ) : null}
</div>
)}
</div>


      </button>
    );
  })
)}
</div>
</section>
))}
</>
) : null}



{mode !== "beds" ? (
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
const pediatric = isPediatricPatient(patient)
? getPediatricDecision(patient)
: null;

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

const currentIncident = getCurrentIncident(
patient,
incidents
);

const previousIncident =
hasPreviousEscapeIncident(
patient,
incidents
);

const riskLevel =
getRiskLevel(patient, incidents) || {
color: "neutral",
label: "Risque non défini",
};

return (

<article
key={patient.id}
style={{
...patientRowCard,
...cardTone,

// 🔴 PRIORITÉ VISUELLE RISQUE
background:
riskLevel.color === "red"
? "#fff5f5"
: riskLevel.color === "amber"
? "#fffaf0"
: "#fff",

border:
riskLevel.color === "red"
? "2px solid #f1b3aa"
: los >= 10 && !currentIncident
? "2px solid #f1b3aa"
: "1px solid #e5ebf4",

...(medicallyReady
? { background: "#f0f8ff" } // léger bleu sortie médicale
: {}),

...(newPatient
? {
boxShadow:
"inset 4px 0 0 #3b82f6, 0 4px 12px rgba(15,23,42,.04)",
}
: {}),
}}

>
<div
style={{ display: "grid", gap: 4, position: "relative" }}
>
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

{normalizeText(getBlockageLabel(patient)).includes(
"ase"
) ? (
<span style={statusBadgeStyle("red")}>ASE</span>
) : null}

{currentIncident ? (
<span style={statusBadgeStyle("red")}>En cours</span>
) : null}

{!currentIncident && previousIncident ? (
<span style={statusBadgeStyle("amber")}>
Antécédent
</span>
) : null}

{vulnerable ? (
<button
type="button"
onClick={() => openVulnerabilityModal(patient)}
style={{
...statusBadgeStyle("purple"),
cursor: "pointer",
}}
>
Vulnérable ({vulnerabilityCount(patient)})
</button>
) : (
<button
type="button"
onClick={() => openVulnerabilityModal(patient)}
style={{
...statusBadgeStyle("neutral"),
cursor: "pointer",
background: "#fafafc",
}}
>
Vulnérable
</button>
)}

{los >= 10 ? (
<span style={statusBadgeStyle("amber")}>
DMS longue
</span>
) : null}
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
{patient.dateNaissance || "—"} · {patient.age || "—"} ans
· {patient.sexe || "—"} · INS {patient.ins || "—"} · IEP{" "}
{patient.iep || "—"}
</div>

<div style={{ fontSize: 12, color: "#475569" }}>
Entrée le{" "}
{formatShortDate(
patient.dateEntree || patient.admissionDate
)}{" "}
· {patient.service || "—"} · Chambre {patient.chambre || "—"} · Lit{" "}
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
{isMedicalReady(patient) && getBedAvailableAt(patient) ? (
<span style={statusBadgeStyle("green")}>
Lit dispo ~ {formatShortTime(getBedAvailableAt(patient))}
</span>
) : null}
{isMedicalReady(patient) ? (
  <span style={avoidableHighlight}>
    {avoidableDays} j évitable{avoidableDays > 1 ? "s" : ""}
  </span>
) : null}
</div>
</div>

<div
style={{ display: "grid", gap: 6, justifyItems: "end" }}
>

<div
style={{
display: "grid",
gap: 8,
justifyItems: "end",
}}
>
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

<div
style={{
display: "flex",
gap: 12,
alignItems: "center",
padding: "6px 10px",
border: "1px solid #e2e8f0",
borderRadius: 12,
background: "#f8fafc",
}}
>


<button
type="button"
onClick={() => toggleMedicalReady(patient)}
style={miniStatusButton(medicallyReady)}
>
<span>SM</span>
<span style={miniInlineSwitch(medicallyReady, "#3b82f6")}>
<span style={miniInlineKnob(medicallyReady)} />
</span>
</button>

<button
type="button"
onClick={() =>
updateInfectionRisk(patient, {
isolation: !(patient?.infectionRisk?.isolation || false),
})
}
style={miniStatusButton(patient?.infectionRisk?.isolation)}
>
<span>PRECO</span>
<span
style={miniInlineSwitch(
patient?.infectionRisk?.isolation,
"#ef4444"
)}
>
<span
style={miniInlineKnob(patient?.infectionRisk?.isolation)}
/>
</span>
</button>

<button
type="button"
onClick={() =>
updateInfectionRisk(patient, {
hygieneRisk: !(patient?.infectionRisk?.hygieneRisk || false),
})
}
style={miniStatusButton(patient?.infectionRisk?.hygieneRisk)}
>
<span>RI</span>
<span
style={miniInlineSwitch(
patient?.infectionRisk?.hygieneRisk,
"#f59e0b"
)}
>
<span
style={miniInlineKnob(patient?.infectionRisk?.hygieneRisk)}
/>
</span>
</button>
</div>
</div>



</div>
</article>
);
})}
</div>
))
: null}
</section>
) : null}
</>
)}


</div>

{vulnerabilityModalPatient ? (
<div
style={{
position: "fixed",
inset: 0,
background: "rgba(0,0,0,0.4)",
display: "flex",
alignItems: "center",
justifyContent: "center",
zIndex: 2000,
padding: 16,
}}
onClick={closeVulnerabilityModal}
>
<div
style={{
background: "#fff",
padding: 20,
borderRadius: 12,
width: "100%",
maxWidth: 700,
maxHeight: "90vh",
overflowY: "auto",
display: "grid",
gap: 14,
}}
onClick={(e) => e.stopPropagation()}
>
<h3 style={{ color: "#17376a", margin: 0 }}>
Vulnérabilité patient
</h3>

<p style={{ margin: 0 }}>
<strong>
{vulnerabilityModalPatient.nom} {vulnerabilityModalPatient.prenom}
</strong>
</p>

<div style={{ display: "grid", gap: 6 }}>
<strong style={{ fontSize: 12, color: "#17376a" }}>
Critères de vulnérabilité
</strong>

{vulnerabilityList.map((item) => {
const checked = vulnerabilityForm.criteria.includes(item);




return (
<label
key={item}
style={{
display: "flex",
gap: 8,
alignItems: "center",
fontSize: 13,
color: "#334155",
}}
>
<input
type="checkbox"
checked={checked}
onChange={() =>
setVulnerabilityForm((prev) => ({
...prev,
criteria: checked
? prev.criteria.filter((entry) => entry !== item)
: [...prev.criteria, item],
}))
}
/>
<span>{item}</span>
</label>
);
})}
</div>

<div
style={{
display: "grid",
gap: 8,
padding: 12,
borderRadius: 10,
background: "#f8fbff",
border: "1px solid #dbe7f5",
}}
>
<strong style={{ fontSize: 12, color: "#17376a" }}>
Consentement photo
</strong>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
J’autorise la prise et l’enregistrement de ma photographie dans le dossier
patient pour faciliter mon identification et la sécurisation de ma prise
en charge.
</div>

<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
<input
type="checkbox"
checked={vulnerabilityForm.consentAccepted}
onChange={(e) =>
setVulnerabilityForm((prev) => ({
...prev,
consentAccepted: e.target.checked,
}))
}
/>
<span>Consentement recueilli</span>
</label>

<select
value={vulnerabilityForm.signerType}
onChange={(e) =>
setVulnerabilityForm((prev) => ({
...prev,
signerType: e.target.value,
}))
}
style={bedFormInput}
>
<option value="patient">Patient</option>
<option value="representant_legal">Représentant légal</option>
</select>

<input
type="text"
placeholder="Nom du signataire"
value={vulnerabilityForm.signerName}
onChange={(e) =>
setVulnerabilityForm((prev) => ({
...prev,
signerName: e.target.value,
}))
}
style={bedFormInput}
/>
</div>

<div style={{ display: "grid", gap: 8, width: "100%", minWidth: 0 }}>
<strong style={{ fontSize: 12, color: "#17376a" }}>
Signature
</strong>

<div
style={{
border: "1px solid #d6deea",
borderRadius: 10,
overflow: "hidden",
width: "100%",
maxWidth: 520,
background: "#fff",
}}
>
<SignatureCanvas
ref={signatureRef}
canvasProps={{
width: 520,
height: 160,
style: {
display: "block",
width: "100%",
height: 160,
background: "#fff",
},
}}
/>
</div>

<div style={{ display: "flex", gap: 8 }}>
<button
type="button"
className="app-btn app-btn-ghost"
onClick={() => signatureRef.current?.clear()}
>
Effacer la signature
</button>
</div>
</div>

<div style={{ display: "grid", gap: 8, width: "100%", minWidth: 0 }}>
<strong style={{ fontSize: 12, color: "#17376a" }}>
Photo patient
</strong>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button
type="button"
className="app-btn app-btn-ghost"
onClick={startCamera}
>
Ouvrir la caméra
</button>

{cameraStream ? (
<button
type="button"
className="app-btn app-btn-primary"
onClick={capturePhotoFromVideo}
>
Capturer la photo
</button>
) : null}

{cameraStream ? (
<button
type="button"
className="app-btn app-btn-ghost"
onClick={stopCamera}
>
Fermer la caméra
</button>
) : null}
</div>

{cameraStream ? (
<video
ref={videoRef}
autoPlay
playsInline
muted
style={{
width: "100%",
maxWidth: 360,
borderRadius: 10,
border: "1px solid #d6deea",
background: "#000",
}}
/>
) : null}

<div style={{ fontSize: 12, color: "#64748b" }}>
Ou importer une photo depuis l’appareil
</div>

<input
type="file"
accept="image/*"
capture="environment"
onChange={(e) => {
const file = e.target.files?.[0];
if (!file) return;

const reader = new FileReader();
reader.onload = () => {
setVulnerabilityForm((prev) => ({
...prev,
photoDataUrl: reader.result,
photoTakenAt: new Date().toISOString(),
}));
};
reader.readAsDataURL(file);
}}
/>

{vulnerabilityForm.photoDataUrl ? (
<img
src={vulnerabilityForm.photoDataUrl}
alt="Prévisualisation patient"
style={{
width: 140,
height: 140,
objectFit: "cover",
borderRadius: 10,
border: "1px solid #d6deea",
}}
/>
) : null}
</div>

<div style={{ display: "grid", gap: 8, width: "100%", minWidth: 0 }}>
<strong style={{ fontSize: 12, color: "#17376a" }}>
Commentaire
</strong>

<textarea
value={vulnerabilityForm.comment}
onChange={(e) =>
setVulnerabilityForm((prev) => ({
...prev,
comment: e.target.value,
}))
}
rows={3}
style={{
width: "100%",
borderRadius: 10,
border: "1px solid #d6deea",
padding: "8px 10px",
fontSize: 14,
color: "#17376a",
background: "#fff",
resize: "vertical",
}}
placeholder="Commentaire facultatif"
/>
</div>

{vulnerabilityFormError ? (
<div style={{ color: "#b42318", fontSize: 12 }}>
{vulnerabilityFormError}
</div>
) : null}

<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
<button
type="button"
className="app-btn app-btn-ghost"
onClick={closeVulnerabilityModal}
>
Annuler
</button>

<button
type="button"
className="app-btn app-btn-primary"
onClick={saveVulnerabilityWorkflow}
>
Enregistrer
</button>
</div>

</div>
</div>
) : null}




{selectedBedMeta ? (


  
<div style={bedModalOverlay} onClick={closeBedEditor}>
<div style={bedModalCard} onClick={(e) => e.stopPropagation()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "flex-start",
}}
>
<div style={{ display: "grid", gap: 4 }}>
<strong style={{ color: "#17376a", fontSize: 18 }}>
{selectedBedMeta.serviceLabel}
</strong>
<div style={{ fontSize: 13, color: "#475569" }}>
Chambre {selectedBedMeta.roomNumber}
{getBedShortLabel(
selectedBedMeta.bedLabel,
selectedBedMeta.roomType
)
? ` · ${getBedShortLabel(
selectedBedMeta.bedLabel,
selectedBedMeta.roomType
)}`
: ""}
</div>
{selectedBedMeta.linkedPatient ? (
<div style={{ fontSize: 12, color: "#334155" }}>
Occupé par {selectedBedMeta.linkedPatient.nom}{" "}
{selectedBedMeta.linkedPatient.prenom}
</div>
) : (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucun patient affecté
</div>
)}
</div>

<button
type="button"
onClick={closeBedEditor}
style={popoverCloseBtn}
>
×
</button>
</div>
{selectedBedMeta?.linkedPatient ? (
  <div
    style={{
      display: "grid",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      background: "#f8fbff",
      border: "1px solid #dbe7f5",
    }}
  >
    <strong style={{ color: "#17376a" }}>Infos lit occupé</strong>

    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <div>
        <strong>Patient :</strong>{" "}
        {selectedBedMeta.linkedPatient.nom} {selectedBedMeta.linkedPatient.prenom}
      </div>

      <div>
        <strong>Sortie prévue :</strong>{" "}
        {getBedExitLabel(selectedBedMeta.linkedPatient) || "Non renseignée"}
      </div>

      <div>
        <strong>Bio-nettoyage :</strong>{" "}
        {getCleaningType(selectedBedMeta.linkedPatient)} ·{" "}
        {getCleaningType(selectedBedMeta.linkedPatient) === "RENFORCÉ"
          ? "45 min"
          : getCleaningType(selectedBedMeta.linkedPatient)?.startsWith("ISO")
          ? "60 min"
          : "30 min"}
      </div>
    </div>
  </div>
) : null}
<div
style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 12,
}}
>
{!selectedBedMeta?.linkedPatient ? (
  <div
    style={{
      display: "grid",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
    }}
  >
    <strong style={{ color: "#17376a" }}>État du lit</strong>

    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <div>
        <strong>Statut :</strong>{" "}
        {getBedStatusLabel(bedStates[selectedBedMeta.bedId]?.status)}
      </div>

      <div>
        <strong>Motif :</strong>{" "}
        {getBedReasonLabel(bedStates[selectedBedMeta.bedId]?.reason) || "Aucun"}
      </div>

      <div>
        <strong>Période :</strong>{" "}
        {bedStates[selectedBedMeta.bedId]?.startAt
          ? `${formatDateTimeDisplay(
              bedStates[selectedBedMeta.bedId]?.startAt
            )} → ${formatDateTimeDisplay(
              bedStates[selectedBedMeta.bedId]?.endAt
            )}`
          : "Non définie"}
      </div>

      <div style={{ fontWeight: 600, color: "#16a34a" }}>
        {bedStates[selectedBedMeta.bedId]?.status === "AVAILABLE"
          ? "🟢 Lit immédiatement mobilisable"
          : "🔴 Lit indisponible"}
      </div>
    </div>
  </div>
) : null}



<div style={bedFormField}>
<label style={bedFormLabel}>Motif</label>
<select
value={bedForm.reason}
onChange={(e) =>
setBedForm((prev) => ({ ...prev, reason: e.target.value }))
}
style={bedFormInput}
disabled={Boolean(selectedBedMeta.linkedPatient)}
>
{BED_REASON_OPTIONS.map((option) => (
<option key={option.value} value={option.value}>
{option.label}
</option>
))}
</select>
</div>

<div style={bedFormField}>
<label style={bedFormLabel}>Début</label>
<input
type="datetime-local"
value={bedForm.startAt}
onChange={(e) =>
setBedForm((prev) => ({ ...prev, startAt: e.target.value }))
}
style={bedFormInput}
disabled={Boolean(selectedBedMeta.linkedPatient)}
/>
</div>

<div style={bedFormField}>
<label style={bedFormLabel}>Fin</label>
<input
type="datetime-local"
value={bedForm.endAt}
onChange={(e) =>
setBedForm((prev) => ({ ...prev, endAt: e.target.value }))
}
style={bedFormInput}
disabled={Boolean(selectedBedMeta.linkedPatient)}
/>
</div>

<div style={bedFormField}>
<label style={bedFormLabel}>Note</label>
<input
type="text"
value={bedForm.note}
onChange={(e) =>
setBedForm((prev) => ({ ...prev, note: e.target.value }))
}
style={bedFormInput}
placeholder="Commentaire"
disabled={Boolean(selectedBedMeta.linkedPatient)}
/>
</div>
</div>

{selectedBedMeta?.linkedPatient ? (
<div
style={{
fontSize: 12,
color: "#64748b",
background: "#f8fafc",
border: "1px solid #e2e8f0",
borderRadius: 10,
padding: 10,
}}
>
Ce lit est actuellement occupé. Son statut est piloté par
l’affectation patient.
</div>
) : null}

{bedFormError ? (
<div style={{ color: "#b42318", fontSize: 12 }}>{bedFormError}</div>
) : null}

{selectedBedMeta && !selectedBedMeta.linkedPatient ? (
<div
style={{
display: "grid",
gap: 6,
fontSize: 12,
color: "#475569",
borderTop: "1px solid #eef2f7",
paddingTop: 12,
}}
>
<div>
<strong>Dernière période :</strong>{" "}
{bedStates[selectedBedMeta.bedId]?.startAt
? `${formatDateTimeDisplay(
bedStates[selectedBedMeta.bedId]?.startAt
)} → ${formatDateTimeDisplay(
bedStates[selectedBedMeta.bedId]?.endAt
)}`
: "—"}
</div>
<div>
<strong>Dernier motif :</strong>{" "}
{getBedReasonLabel(bedStates[selectedBedMeta.bedId]?.reason)}
</div>
</div>
) : null}

<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 8,
flexWrap: "wrap",
}}
>
<div>
{!selectedBedMeta.linkedPatient &&
bedStates[selectedBedMeta.bedId]?.status !== BED_STATUSES.AVAILABLE ? (
<button
type="button"
className="app-btn app-btn-ghost"
onClick={() => releaseBed(selectedBedMeta.bedId)}
>
Libérer le lit
</button>
) : null}
</div>

<div style={{ display: "flex", gap: 8 }}>
<button
type="button"
className="app-btn app-btn-ghost"
onClick={closeBedEditor}
>
Annuler
</button>
{!selectedBedMeta.linkedPatient ? (
<button
type="button"
className="app-btn app-btn-primary"
onClick={saveBedState}
>
Enregistrer
</button>
) : null}
</div>
</div>
</div>
</div>
) : null}
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
  gap: 10,
  border: "1px solid #e5ebf4",
  borderRadius: 16,
  padding: 12,
  background: "#fff",
  boxShadow: "0 4px 12px rgba(15,23,42,.04)",
};

const directionMetric = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const directionMetricLabel = {
  fontSize: 11,
  color: "#64748b",
  textTransform: "uppercase",
  fontWeight: 800,
  lineHeight: 1.1,
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
gridTemplateColumns: "minmax(320px, 1.8fr) minmax(220px, 1.3fr) minmax(180px, 1fr) auto",
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

const bedModalOverlay = {
position: "fixed",
inset: 0,
background: "rgba(15,23,42,.32)",
display: "flex",
alignItems: "center",
justifyContent: "center",
zIndex: 1000,
padding: 20,
};

const bedModalCard = {
width: "100%",
maxWidth: 680,
background: "#fff",
borderRadius: 18,
padding: 18,
display: "grid",
gap: 14,
boxShadow: "0 24px 64px rgba(15,23,42,.20)",
};

const bedFormField = {
display: "grid",
gap: 6,
};

const bedFormLabel = {
fontSize: 12,
fontWeight: 800,
color: "#475569",
textTransform: "uppercase",
};

const bedFormInput = {
width: "100%",
minHeight: 40,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "8px 10px",
fontSize: 14,
color: "#17376a",
background: "#fff",
};