import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import PatientIdentityBar from "./components/PatientIdentityBar";
import { AppShell } from "./components/AppShell";
import { patients } from "./data/patients";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import "./PatientView.css";
import PatientInsightsPanel from "./components/PatientInsightsPanel";
import { getPatientContacts } from "./domain/patient/patientContacts";

const REPORT_PREFIX = "carabbas_staff_report_";
const REPORT_HISTORY_PREFIX = "carabbas_staff_report_history_";
const COPILOT_HANDOFF_PREFIX = "carabbas_staff_handoff_";
const COPILOT_ACTIONS_PREFIX = "carabbas_staff_to_copilot_actions_";
const STAFF_PDF_PREFIX = "carabbas_staff_pdf_export_";
const INCIDENT_UI_PREFIX = "carabbas_incident_ui_";
const CRISIS_STORAGE_KEY = "carabbas_crise_v4";
const CRISIS_ORIGIN_KEY = "carabbas_crise_origin_v1";

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

function safeNode(value, fallback = "Non renseigné") {
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
  const firstFrein = safeArray(patient?.derivedFreins)[0]?.label;
  const firstConsequence = safeArray(patient?.derivedConsequences)[0]?.label;

  return (
    patient?.blockReason ||
    patient?.blocage ||
    firstFrein ||
    firstConsequence ||
    "Non défini"
  );
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
  const complexityLabel = normalizeText(patient?.complexityLabel);
  const complexityScore = Number(patient?.complexityScore || 0);

  return (
    severity.includes("crit") ||
    severity.includes("complex") ||
    complexityLabel.includes("crit") ||
    complexityLabel.includes("complex") ||
    complexityScore >= 9 ||
    safeArray(patient?.history).length > 0 ||
    safeArray(patient?.dynamicBlockages).length > 1
  );
}

function getVulnerabilityCriteria(patient) {
  return safeArray(patient?.vulnerability?.criteria).length > 0
    ? safeArray(patient?.vulnerability?.criteria)
    : safeArray(patient?.vulnerabilityProfiles).map(
        (item) => item?.label || item?.code || item
      );
}

function isVulnerable(patient) {
  return Boolean(patient?.isVulnerable) || getVulnerabilityCriteria(patient).length > 0;
}

function getPatientSubject(patient) {
  const block = getBlockageLabel(patient);
  const solution = getSolutionLabel(patient);
  const normalizedBlock = normalizeText(block);
  const normalizedSolution = normalizeText(solution);

  const firstFrein = safeArray(patient?.derivedFreins)[0]?.label;
  const firstConsequence = safeArray(patient?.derivedConsequences)[0]?.label;

  if (firstFrein) return firstFrein;
  if (firstConsequence) return firstConsequence;

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
  const complexityScore = Number(patient?.complexityScore || 0);

  if (los >= 10) score += 3;
  if (getBlockageLabel(patient) !== "Non défini") score += 3;
  if (!getTargetDate(patient)) score += 2;
  if (isVulnerable(patient)) score += 2;
  if (isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune") score += 3;
  if (complexityScore >= 9) score += 3;
  else if (complexityScore >= 4) score += 2;
  else if (complexityScore > 0) score += 1;

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
  const solution = getSolutionLabel(patient);
  const targetDate = getTargetDate(patient);
  const isValidated = Boolean(patient?.dischargePlanning?.targetDateValidated);
  const firstOrientation = safeArray(patient?.derivedOrientations)[0]?.label;

  if (isValidated) {
    return { label: "Validé", color: "green" };
  }

  if (solution === "Aucune" && firstOrientation) {
    return { label: `À orienter : ${firstOrientation}`, color: "amber" };
  }

  if (solution === "Aucune") {
    return { label: "Décision à poser", color: "red" };
  }

  if (!targetDate) {
    return { label: "Date à poser", color: "amber" };
  }

  return { label: "À confirmer", color: "blue" };
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
  const firstOrientation = safeArray(patient?.derivedOrientations)[0]?.label;

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
        ? `Lever ${blockage}${firstOrientation ? ` → orienter vers ${firstOrientation}` : ""}`
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
  if (isMedicalReady(patient) && solution === "Aucune")
    suggestions.push("Créer une action copilote pour sécuriser une solution d’aval.");
  if (blockage !== "Non défini")
    suggestions.push(`Créer une action de levée du blocage : ${blockage}.`);
  if (isVulnerable(patient)) suggestions.push("Prévoir une vigilance renforcée dans le staff et la synthèse.");
  if (!report.actions?.trim()) suggestions.push("Formuler une décision staff explicite à transmettre au copilote.");
  if (!report.objectifs?.trim()) suggestions.push("Préciser l’objectif de sortie / coordination.");
  return suggestions.slice(0, 5);
}

function getRecueilItems(patient) {
  const structured = patient?.structuredIntake || {};

  const entourage = [];
  if (structured?.entourage?.seul) entourage.push("Vit seul");
  if (structured?.entourage?.enFamille) entourage.push("Vie en famille");
  if (structured?.entourage?.enInstitution) entourage.push("Vie en institution");
  if (structured?.entourage?.aidant) entourage.push("Aidant présent");
  if (structured?.entourage?.aucuneAide) entourage.push("Aucune aide");
  if (structured?.entourage?.aideADomicile) entourage.push("Aide à domicile");
  if (structured?.entourage?.aideFamiliale) entourage.push("Aide familiale");

  const securite = [];
  if (structured?.securite?.risqueChute) securite.push("Risque de chute");
  if (structured?.securite?.isolement) securite.push("Isolement");
  if (structured?.securite?.troublesCognitifs) securite.push("Troubles cognitifs");
  if (structured?.securite?.desorientation) securite.push("Désorientation");
  if (structured?.securite?.refusAide) securite.push("Refus d’aide");
  if (structured?.securite?.logementInadapte) securite.push("Logement inadapté");

  const aidesTechniques = [];
  if (structured?.materiel?.aidesTechniques?.canne) aidesTechniques.push("Canne");
  if (structured?.materiel?.aidesTechniques?.deambulateur) aidesTechniques.push("Déambulateur");
  if (structured?.materiel?.aidesTechniques?.fauteuil) aidesTechniques.push("Fauteuil");
  if (structured?.materiel?.aidesTechniques?.litMedicalise) aidesTechniques.push("Lit médicalisé");

  return [
    { label: "Entourage", value: entourage.length ? entourage.join(" · ") : "Non renseigné" },
    { label: "Sécurité / fragilité", value: securite.length ? securite.join(" · ") : "Non renseigné" },
    { label: "Mobilité / matériel", value: aidesTechniques.length ? aidesTechniques.join(" · ") : "Non renseigné" },
    { label: "GIR", value: structured?.gir?.gir || "Non renseigné" },
    { label: "Protection juridique", value: structured?.social?.protectionJuridique || "Non renseigné" },
    { label: "Isolement social", value: structured?.social?.isolementSocial ? "Oui" : "Non" },
  ];
}

function getAutoAnalysisItems(patient) {
  const analysis = [];

  analysis.push({
    label: "Vulnérabilité",
    value: isVulnerable(patient) ? "Patient vulnérable" : "Pas de vulnérabilité majeure détectée",
  });

  analysis.push({
    label: "Complexité",
    value: isComplexPatient(patient) ? "Parcours complexe" : "Parcours standard",
  });

  analysis.push({ label: "Blocage principal", value: getBlockageLabel(patient) });
  analysis.push({ label: "Orientation probable", value: getSolutionLabel(patient) });
  analysis.push({ label: "Risque DMS", value: getRiskLevel(patient).label });
  analysis.push({ label: "Action prioritaire", value: buildStaffAutoSummary(patient).decision });

  return analysis;
}

function getDecisionItems(patient) {
  const targetDate = getTargetDate(patient);
  const decisionStatus = getDecisionStatus(patient);

  return [
    {
      label: "Orientation principale",
      value:
        getSolutionLabel(patient) === "Aucune" ? (
          <StatusChip color="red">⚠️ Décision à poser</StatusChip>
        ) : (
          getSolutionLabel(patient)
        ),
    },
    {
      label: "Blocage",
      value:
        getBlockageLabel(patient) === "Non défini" ? (
          <StatusChip color="amber">⚠️ Blocage à qualifier</StatusChip>
        ) : (
          getBlockageLabel(patient)
        ),
    },
    {
      label: "Date cible",
      value: targetDate ? formatShortDate(targetDate) : <StatusChip color="amber">⚠️ Date à poser</StatusChip>,
    },
    { label: "Statut décision", value: decisionStatus.label },
    { label: "Sortant médicalement", value: isMedicalReady(patient) ? "Oui" : "Non" },
    { label: "Sujet prioritaire", value: getPatientSubject(patient) },
  ];
}

function getImmediateActions(patient) {
  const actions = [];

  if (getSolutionLabel(patient) === "Aucune") actions.push("Définir une orientation de sortie");
  if (getBlockageLabel(patient) === "Non défini") actions.push("Qualifier le blocage principal");
  if (!getTargetDate(patient)) actions.push("Poser une date cible de sortie");
  if (isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune") {
    actions.push("Trouver une solution d’aval rapidement");
  }

  return actions;
}

function buildServiceIndicators(currentPatient, allPatients) {
  const serviceName = currentPatient?.service;
  const servicePatients = allPatients.filter((p) => p?.service === serviceName);
  return {
    total: servicePatients.length,
    critical: servicePatients.filter((p) => getStaffPriority(p).color === "red").length,
    withoutTargetDate: servicePatients.filter((p) => !getTargetDate(p)).length,
    vulnerable: servicePatients.filter((p) => isVulnerable(p)).length,
    medicallyReadyWithoutSolution: servicePatients.filter(
      (p) => isMedicalReady(p) && getSolutionLabel(p) === "Aucune"
    ).length,
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

function appendPatientIncidentHistory(patientId, incidentRecord) {
  const key = `patient_incident_history_${patientId}`;
  const current = readJsonStorage(key, []);
  const next = [incidentRecord, ...safeArray(current)];
  writeJsonStorage(key, next);
}

function readPatientLastIncident(patientId) {
  return readJsonStorage(`patient_last_incident_${patientId}`, null);
}

function readPatientIncidentHistory(patientId) {
  return readJsonStorage(`patient_incident_history_${patientId}`, []);
}

function readCrisis() {
  return readJsonStorage(CRISIS_STORAGE_KEY, null);
}

function writeCrisisOrigin(payload) {
  writeJsonStorage(CRISIS_ORIGIN_KEY, payload);
}

function getPatientCrisisInfo(patientId) {
  const crisisData = readCrisis();
  if (!crisisData?.crisis) return null;

  const selectedIds = Array.isArray(crisisData.crisis.selectedPatientIds)
    ? crisisData.crisis.selectedPatientIds.map(String)
    : [];

  if (!selectedIds.includes(String(patientId))) return null;

  const relatedDecisions = Array.isArray(crisisData.decisions)
    ? crisisData.decisions.filter((d) => String(d.patientId) === String(patientId))
    : [];

  return {
    title: crisisData.crisis.title || "Cellule de crise",
    status: crisisData.crisis.status || "Brouillon",
    scheduledDate: crisisData.crisis.scheduledDate || "",
    scheduledTime: crisisData.crisis.scheduledTime || "",
    location: crisisData.crisis.location || "",
    objective: crisisData.crisis.objective || "",
    relatedDecisions,
  };
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
  if (item.id === "vulnerabilite" && item.badge === "Critique") return "badge-red";
  if (item.id === "vulnerabilite" && Number(item.badge) > 0) return "badge-purple";
  if (item.id === "sortie" && item.badge === "Sans date") return "badge-amber";
  if (item.id === "staff" && item.badge === "Brouillon") return "badge-neutral";
  if (item.id === "staff" && item.badge === "Historisé") return "badge-green";
  if (item.id === "plan" && Number(item.badge) > 0) return "badge-blue";
  if (item.id === "synthese") return "badge-blue";
  if (item.id === "contact" && item.badge === "Incomplets") return "badge-amber";
  return "badge-neutral";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
<div><strong>Patient :</strong> ${escapeHtml(safe(patient?.nom, "—"))} ${escapeHtml(safe(patient?.prenom, ""))}</div>
<div><strong>Date de naissance :</strong> ${escapeHtml(safe(patient?.dateNaissance, "—"))}</div>
<div><strong>Service :</strong> ${escapeHtml(safe(patient?.service, "—"))} · <strong>Chambre :</strong> ${escapeHtml(safe(patient?.chambre, "—"))} · <strong>Lit :</strong> ${escapeHtml(safe(patient?.lit, "—"))}</div>
<div><strong>Historisé le :</strong> ${savedAt ? escapeHtml(formatShortDateTime(savedAt)) : "Non historisé"} · <span class="chip">Priorité ${escapeHtml(safe(priority?.label, "—"))}</span></div>
</div>

<h2>Résumé automatique</h2>
<div class="grid">
<div class="block"><div class="label">Sujet</div>${escapeHtml(safe(autoSummary?.situation, "—"))}</div>
<div class="block"><div class="label">Objectif recommandé</div>${escapeHtml(safe(autoSummary?.objectif, "—"))}</div>
<div class="block"><div class="label">Décision attendue</div>${escapeHtml(safe(autoSummary?.decision, "—"))}</div>
<div class="block"><div class="label">Date cible</div>${escapeHtml(safe(autoSummary?.dateCible, "—"))}</div>
</div>

<h2>Synthèse staff validée</h2>
<div class="block"><div class="label">Synthèse</div>${escapeHtml(safe(report?.infos, "Non renseignée"))}</div>
<div class="block"><div class="label">Objectif</div>${escapeHtml(safe(report?.objectifs, "Non renseigné"))}</div>
<div class="block"><div class="label">Décision</div>${escapeHtml(safe(report?.actions, "Non renseignée"))}</div>
<div class="block"><div class="label">Vigilance</div>${escapeHtml(safe(report?.vigilances, "Non renseignée"))}</div>

<h2>Prochain jalon</h2>
<div class="grid">
<div class="block"><div class="label">Date de revue</div>${escapeHtml(safe(nextReview?.date ? formatShortDate(nextReview.date) : "", "Non définie"))}</div>
<div class="block"><div class="label">Responsable</div>${escapeHtml(safe(nextReview?.owner, "Non défini"))}</div>
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
          <div className="pv-value">{safeNode(item.value)}</div>
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
        {subtitle ? <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{subtitle}</div> : null}
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
            <button type="button" className="pv-btn ghost" onClick={onPrint}>Exporter PDF</button>
            <button type="button" className="pv-btn ghost" onClick={onTransmit}>Envoyer au copilote</button>
            <button type="button" className={`pv-btn ${syncEnabled ? "primary" : "ghost"}`} onClick={onToggleSync}>
              {syncEnabled ? "Sync auto active" : "Activer sync auto"}
            </button>
            <button type="button" className="pv-btn primary" onClick={onSave}>Historiser</button>
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

function VulnerabilitySummaryCard({ patient, onOpen }) {
  const criteria = getVulnerabilityCriteria(patient);
  const updatedAt = patient?.vulnerability?.updatedAt || patient?.updatedAt;
  const level = criteria.length >= 3 ? "Critique" : criteria.length ? "Active" : "Aucune";
  const color = criteria.length >= 3 ? "red" : criteria.length ? "purple" : "neutral";

  return (
    <SectionCard
      title="Vulnérabilité"
      subtitle="Signal compact sur la fiche patient. Le détail complet est disponible dans l’onglet dédié."
      actions={
        <>
          <StatusChip color={color}>{level}</StatusChip>
          {criteria.length ? <StatusChip color="purple">{criteria.length} critère{criteria.length > 1 ? "s" : ""}</StatusChip> : null}
          <button type="button" className="pv-btn ghost" onClick={onOpen}>Ouvrir le détail</button>
        </>
      }
    >
      <div className="pv-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div className="pv-item">
          <div className="pv-label">Statut</div>
          <div className="pv-value">{criteria.length ? "Patient concerné" : "Aucun signal actif"}</div>
        </div>
        <div className="pv-item">
          <div className="pv-label">Dernière mise à jour</div>
          <div className="pv-value">{formatShortDateTime(updatedAt)}</div>
        </div>
        <div className="pv-item">
          <div className="pv-label">Critères visibles</div>
          <div className="pv-value">{criteria.length ? criteria.slice(0, 2).join(" · ") : "Aucun"}</div>
        </div>
      </div>
    </SectionCard>
  );
}

function VulnerabilityCard({ patient }) {
  const criteria = getVulnerabilityCriteria(patient);
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
          <StatusChip color={criteria.length >= 3 ? "red" : criteria.length ? "purple" : "neutral"}>
            {criteria.length >= 3 ? "Niveau critique" : criteria.length ? `Vulnérable (${criteria.length})` : "Aucun critère"}
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
            <StatusChip key={String(criterion)} color={criteria.length >= 3 ? "red" : "purple"}>{criterion}</StatusChip>
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
            <div key={item.id || item.resourceId || item.title || item.label || index} className="pv-list-item">
              <div className="pv-list-item__title">{item.label || item.title || item.name || item.resourceId || `Élément ${index + 1}`}</div>
              <div className="pv-list-item__meta">
                {item.owner ||
                  item.responsable ||
                  item.targetSecretariat ||
                  item.status ||
                  item.statut ||
                  item.notes ||
                  item.description ||
                  item.type ||
                  "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

function VulnerabilityPhotoCard({ patient }) {
  const vulnerabilityPhoto = patient?.vulnerabilityPhoto || {};
  const consent = vulnerabilityPhoto?.consent || {};
  const lastPhoto = vulnerabilityPhoto?.lastPhoto || {};
  const photos = safeArray(vulnerabilityPhoto?.photos);

  const hasPhoto = Boolean(lastPhoto?.imageData);
  const hasSignature = Boolean(consent?.signatureImage);

  return (
    <SectionCard title="Photo et consentement" subtitle="Traçabilité de la photo patient et du consentement associé.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 14 }}>
        <div className="pv-item">
          <div className="pv-label">Consentement</div>
          <div className="pv-value">{consent?.accepted ? "Recueilli" : "Non recueilli"}</div>
        </div>

        <div className="pv-item">
          <div className="pv-label">Signataire</div>
          <div className="pv-value">{safe(consent?.signerName)}</div>
        </div>

        <div className="pv-item">
          <div className="pv-label">Type signataire</div>
          <div className="pv-value">{safe(consent?.signerType)}</div>
        </div>

        <div className="pv-item">
          <div className="pv-label">Date signature</div>
          <div className="pv-value">{formatShortDateTime(consent?.signedAt)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Dernière photo</div>

          {hasPhoto ? (
            <img
              src={lastPhoto.imageData}
              alt="Photo patient"
              style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}
            />
          ) : (
            <div className="pv-list-item pv-muted">Aucune photo enregistrée.</div>
          )}

          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Prise le : {formatShortDateTime(lastPhoto?.createdAt)}</div>

          {lastPhoto?.comment ? (
            <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>Commentaire : {lastPhoto.comment}</div>
          ) : null}
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Signature</div>

          {hasSignature ? (
            <img
              src={consent.signatureImage}
              alt="Signature consentement"
              style={{ width: 240, maxWidth: "100%", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 8 }}
            />
          ) : (
            <div className="pv-list-item pv-muted">Aucune signature enregistrée.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Historique photo</div>

        <div className="pv-list">
          {photos.length === 0 ? (
            <div className="pv-list-item pv-muted">Aucun historique photo.</div>
          ) : (
            photos
              .slice()
              .reverse()
              .map((photo, index) => (
                <div
                  key={photo.id || `photo-${index}`}
                  className="pv-list-item"
                  style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "start" }}
                >
                  <img
                    src={photo.imageData}
                    alt={`Historique photo ${index + 1}`}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />

                  <div>
                    <div className="pv-list-item__title">Photo du {formatShortDateTime(photo?.createdAt)}</div>
                    <div className="pv-list-item__meta">{photo?.comment || "Sans commentaire"}</div>
                    <div className="pv-list-item__meta">Signataire : {safe(photo?.consent?.signerName)}</div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function AlertsBar({ alerts }) {
  if (!alerts.length) return null;
  return (
    <SectionCard title="Alertes de parcours" subtitle="Signaux rapides à visualiser avant d’entrer dans le détail.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {alerts.map((alert) => (
          <StatusChip key={alert.text} color={alert.color}>{alert.text}</StatusChip>
        ))}
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

  const patientCrisisInfo = useMemo(() => {
    if (!patient?.id) return null;
    return getPatientCrisisInfo(patient.id);
  }, [patient]);

  const {
    personneConfiance = {},
    personneAPrevenir = {},
    protectionJuridique = {},
  } = getPatientContacts(patient || {}) || {};

  const incident = useMemo(() => {
    if (!patient?.id) return null;
    return (
      incidents.find(
        (i) =>
          String(i.patientId) === String(patient.id) &&
          String(i.status || "").toLowerCase() !== "closed"
      ) || null
    );
  }, [incidents, patient?.id]);

  const allPatients = useMemo(() => {
    return Array.isArray(patientsSimulated) && patientsSimulated.length ? patientsSimulated : patients;
  }, [patientsSimulated]);

  const [activeSection, setActiveSection] = useState("synthese");
  const [report, setReport] = useState({ infos: "", objectifs: "", actions: "", vigilances: "" });
  const [savedAt, setSavedAt] = useState("");
  const [staffReadMode, setStaffReadMode] = useState(false);
  const [staffHistory, setStaffHistory] = useState([]);
  const [transmittedAt, setTransmittedAt] = useState("");
  const [projectionMode, setProjectionMode] = useState(false);
  const [nextReview, setNextReview] = useState({ date: "", owner: "" });
  const [copilotPushAt, setCopilotPushAt] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoSyncAt, setAutoSyncAt] = useState("");
  const [lastClosedIncident, setLastClosedIncident] = useState(null);
  const [incidentHistoryStored, setIncidentHistoryStored] = useState([]);

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
    if (!patient?.id) return;

    const last = readPatientLastIncident(patient.id);
    const history = readPatientIncidentHistory(patient.id);

    setLastClosedIncident(last);
    setIncidentHistoryStored(safeArray(history));
  }, [patient?.id]);

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
  const immediateActions = getImmediateActions(patient);
  const recueilItems = getRecueilItems(patient);
  const autoAnalysisItems = getAutoAnalysisItems(patient);
  const decisionItems = getDecisionItems(patient);
  const vulnerabilityCriteria = getVulnerabilityCriteria(patient);
  const vulnerabilityLevel = vulnerabilityCriteria.length >= 3 ? "Critique" : vulnerabilityCriteria.length ? String(vulnerabilityCriteria.length) : "";

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
    const html = buildPrintableStaffHtml({ patient, report, savedAt, autoSummary, nextReview, priority });
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
  const doneActions = planItems.filter(
    (item) =>
      normalizeText(item.status || item.statut).includes("fait") ||
      normalizeText(item.status || item.statut).includes("réalis")
  );
  const inProgressActions = planItems.filter((item) => normalizeText(item.status || item.statut).includes("cours"));
  const nextOwner =
    planItems.find(
      (item) =>
        !normalizeText(item.status || item.statut).includes("fait") &&
        !normalizeText(item.status || item.statut).includes("réalis")
    )?.owner ||
    planItems.find(
      (item) =>
        !normalizeText(item.status || item.statut).includes("fait") &&
        !normalizeText(item.status || item.statut).includes("réalis")
    )?.responsable ||
    patient.medecin ||
    "À définir";
  const nextDeadline =
    planItems.find((item) => item.dueDate)?.dueDate || patient?.dateSortiePrevue || targetDate || "";
  const lastUpdate = patient?.updatedAt || patient?.lastUpdatedAt || patient?.vulnerability?.updatedAt || savedAt || "";

  const alerts = [
    los >= 10 ? { color: "red", text: "DMS longue" } : null,
    !targetDate ? { color: "amber", text: "Pas de date cible" } : null,
    isMedicalReady(patient) && getSolutionLabel(patient) === "Aucune" ? { color: "red", text: "Sort Med sans solution" } : null,
    isVulnerable(patient)
      ? { color: vulnerabilityCriteria.length >= 3 ? "red" : "purple", text: vulnerabilityCriteria.length >= 3 ? "Vulnérabilité critique" : "Vulnérabilité active" }
      : null,
    getMovements(patient).length >= 3 ? { color: "amber", text: "Parcours instable" } : null,
    incident ? { color: "red", text: "Incident disparition en cours" } : null,
    immediateActions.length > 0 ? { color: "blue", text: `${immediateActions.length} action${immediateActions.length > 1 ? "s" : ""} immédiate${immediateActions.length > 1 ? "s" : ""}` } : null,
  ].filter(Boolean);

  const incidentBadge = incident ? "En cours" : "";

  const contactCompletenessScore = [
    Boolean([personneConfiance.prenom, personneConfiance.nom].filter(Boolean).join(" ")),
    Boolean(personneConfiance.telephone),
    Boolean([personneAPrevenir.prenom, personneAPrevenir.nom].filter(Boolean).join(" ")),
    Boolean(personneAPrevenir.telephone),
    Boolean(protectionJuridique.type),
  ].filter(Boolean).length;

  const contactsBadge = contactCompletenessScore >= 4 ? "OK" : contactCompletenessScore >= 1 ? "Incomplets" : "À renseigner";

  const menuItems = [
    { id: "synthese", label: "Synthèse", badge: risk.label },
    { id: "vulnerabilite", label: "Vulnérabilité", badge: vulnerabilityLevel },
    { id: "contact", label: "Contacts utiles", badge: contactsBadge },
    { id: "incident", label: "Incident", badge: incidentBadge },
    { id: "staff", label: "Staff", badge: savedAt ? "Historisé" : "Brouillon" },
    { id: "plan", label: "Plan d’action", badge: String(inProgressActions.length + blockedActions.length) },
    { id: "ressources", label: "Ressources", badge: String(Array.isArray(patient.resourceFollowUp) ? patient.resourceFollowUp.length : 0) },
    { id: "documents", label: "Documents", badge: String(safeArray(patient.documents || patient.forms || patient.formulaires).length) },
  ];

  const statusMap = {
    created: { label: "Disparition déclarée", color: "red" },
    internal_search: { label: "Recherche interne", color: "amber" },
    security_investigation: { label: "Sécurité en cours", color: "amber" },
    director_decision: { label: "Décision direction", color: "blue" },
    closed: { label: "Clôturé", color: "green" },
  };

  const currentStatus = statusMap[incident?.status] || { label: incident?.status || "Inconnu", color: "neutral" };
  const elapsedMinutes = incident?.createdAt ? Math.floor((Date.now() - new Date(incident.createdAt)) / 60000) : null;
  const incidentLabels = safeArray(incident?.incidentLog).map((evt) => String(evt?.label || "").toLowerCase());

  const patientCalledDone = incidentLabels.some((label) => label.includes("appel patient"));
  const internalSearchDone = incidentLabels.some((label) => label.includes("recherche interne"));
  const securityAlertDone = incidentLabels.some((label) => label.includes("sécurité"));
  const directorAlertDone = incidentLabels.some((label) => label.includes("directeur"));
  const serviceStepDone = patientCalledDone || internalSearchDone;
  const securityStepDone = securityAlertDone;
  const directionStepDone = directorAlertDone;
  const closureStepDone = incident?.status === "closed";

  return (
    <AppShell header={<AppHeader subtitle="Vue patient" />}>
      <div
        className="pv-page"
        style={{
          background: "linear-gradient(180deg, rgba(245,248,255,1) 0%, rgba(249,250,252,1) 100%)",
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
                {patient?.vulnerabilityPhoto?.lastPhoto?.imageData ? <StatusChip color="blue">📷 Photo</StatusChip> : null}
                {patient?.vulnerabilityPhoto?.consent?.accepted ? <StatusChip color="green">✍️ Consentement</StatusChip> : null}
                {isVulnerable(patient) ? (
                  <button type="button" className="pv-btn ghost" onClick={() => handleSectionChange("vulnerabilite")}>
                    {vulnerabilityCriteria.length >= 3 ? "🔴 Vulnérabilité critique" : `🟣 Vulnérabilité (${vulnerabilityCriteria.length})`}
                  </button>
                ) : null}

                {incident ? (
                  <button type="button" className="pv-btn danger" onClick={() => navigate(`/incident/${patient.id}`)}>
                    🚨 Ouvrir disparition
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pv-btn danger"
                    onClick={() => {
                      createIncidentForPatient(patient);
                      navigate(`/incident/${patient.id}`);
                    }}
                  >
                    🚨 Déclarer disparition
                  </button>
                )}

                <button type="button" className="pv-btn ghost" onClick={() => handleSectionChange("staff")}>
                  Aller au staff
                </button>

                <button type="button" className="pv-btn primary" onClick={() => navigate(`/copilote/${patient.id}`)}>
                  Ouvrir copilote
                </button>
              </>
            }
          />
        </div>

        {patientCrisisInfo && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 800, color: "#9a3412" }}>⚠️ Patient concerné par une cellule de crise</div>
            <div style={{ fontSize: 13, color: "#7c2d12" }}>{patientCrisisInfo.title}</div>
            <div style={{ fontSize: 13, color: "#7c2d12" }}>
              Statut : {patientCrisisInfo.status}
              {patientCrisisInfo.scheduledDate ? ` · ${formatShortDate(patientCrisisInfo.scheduledDate)}` : ""}
              {patientCrisisInfo.scheduledTime ? ` · ${patientCrisisInfo.scheduledTime}` : ""}
            </div>
            {patientCrisisInfo.objective ? (
              <div style={{ fontSize: 13, color: "#7c2d12" }}>Objectif : {patientCrisisInfo.objective}</div>
            ) : null}
            {patientCrisisInfo.relatedDecisions?.length > 0 ? (
              <div style={{ fontSize: 13, color: "#7c2d12" }}>Décisions liées : {patientCrisisInfo.relatedDecisions.length}</div>
            ) : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="pv-btn ghost" onClick={() => navigate("/crise")}>
                Ouvrir la cellule de crise
              </button>
            </div>
          </div>
        )}

        {incident && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700 }}>🚨 Incident en cours</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>
              Disparition en cours
              {incident.createdAt && !Number.isNaN(new Date(incident.createdAt).getTime())
                ? ` — déclenchée à ${new Date(incident.createdAt).toLocaleTimeString()}`
                : ""}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18, alignItems: "start" }}>
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
              style={{ padding: "8px 10px 14px", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748b" }}
            >
              Vue patient
            </div>

            {menuItems.map((item) => {
              const isCriticalVulnerability = item.id === "vulnerabilite" && vulnerabilityCriteria.length >= 3;
              return (
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
                    border: activeSection === item.id ? "1px solid #bfd3ff" : isCriticalVulnerability ? "1px solid #f3c7c1" : "1px solid #edf2f7",
                    background: activeSection === item.id ? "#eef4ff" : isCriticalVulnerability ? "#fff7f7" : "#ffffff",
                    color: activeSection === item.id ? "#17376a" : isCriticalVulnerability ? "#991b1b" : "#0f172a",
                    fontWeight: 700,
                    padding: "12px 14px",
                    marginBottom: 8,
                    cursor: "pointer",
                    boxShadow: isCriticalVulnerability ? "inset 0 0 0 1px rgba(185, 28, 28, 0.04)" : "none",
                  }}
                >
                  <span className="pv-side-btn__label">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`pv-side-btn__badge ${getBadgeColor(item)}`}
                      style={{ borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 800 }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </aside>

          <main className="pv-main" style={{ display: "grid", gap: 18 }}>
            {activeSection === "synthese" ? (
              <div className="pv-section-anchor">
                <AlertsBar alerts={alerts} />

                <SectionCard title="Données du recueil" subtitle="Informations issues du recueil DPI / terrain" className="pv-card--nested">
                  <InfoGrid columns={3} items={recueilItems} />
                </SectionCard>

                <SectionCard
                  title="Synthèse"
                  subtitle="Vue d’ensemble synthétique pour compréhension rapide avant détail."
                  style={{ background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
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
                      <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>{getPatientSubject(patient)}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>{safe(patient.service)}</span>
                        <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>J+{los}</span>
                        <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>{patient?.complexityLabel || risk.label}</span>
                        <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 12, fontWeight: 700 }}>score {patient?.complexityScore ?? 0}</span>
                      </div>
                    </div>

                    <div style={{ borderRadius: 20, padding: 18, border: "1px solid #e5e7eb", background: "#ffffff" }}>
                      <div className="pv-label">Statut décision</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{decisionStatus.label}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>Blocage : {getBlockageLabel(patient)}</div>
                    </div>

                    <div style={{ borderRadius: 20, padding: 18, border: "1px solid #e5e7eb", background: "#ffffff" }}>
                      <div className="pv-label">Date cible de sortie</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{targetDate ? formatShortDate(targetDate) : "—"}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{targetDate ? targetStatus.label : "Non définie"}</div>
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
                        {
                          label: "Date cible",
                          value: `${formatShortDate(targetDate)}${targetDate ? ` · ${targetStatus.label}` : ""}`,
                        },
                        { label: "DMS", value: `J+${los}` },
                        { label: "Service", value: safe(patient.service) },
                        { label: "Dernière action utile", value: getTimeSince(lastUpdate) },
                      ]}
                    />

                    <SectionCard title="Analyse automatique" subtitle="Lecture générée à partir des données disponibles" className="pv-card--nested">
                      <InfoGrid columns={3} items={autoAnalysisItems} />
                    </SectionCard>

                    <SectionCard title="Décision de sortie" subtitle="Lecture claire de la décision en cours" className="pv-card--nested">
                      <InfoGrid columns={3} items={decisionItems} />
                    </SectionCard>

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

                    <VulnerabilitySummaryCard patient={patient} onOpen={() => handleSectionChange("vulnerabilite")} />

                    <SectionCard title="Actions immédiates" subtitle="Ce qui mérite une attention rapide dès l’ouverture de la fiche." className="pv-card--nested">
                      <div className="pv-list">
                        {immediateActions.length === 0 ? (
                          <div className="pv-list-item pv-muted">Aucune action immédiate identifiée.</div>
                        ) : (
                          immediateActions.map((item) => (
                            <div key={item} className="pv-list-item">
                              <div className="pv-list-item__title">{item}</div>
                            </div>
                          ))
                        )}
                      </div>
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

            {activeSection === "vulnerabilite" ? (
              <div className="pv-section-anchor">
                <VulnerabilityCard patient={patient} />
                <VulnerabilityPhotoCard patient={patient} />
              </div>
            ) : null}

            {activeSection === "contact" ? (
              <div className="pv-section-anchor">
                <SectionCard title="Contacts utiles" subtitle="Informations issues du DPI et sécurisées même si les données sont partielles.">
                  <InfoGrid
                    columns={2}
                    items={[
                      {
                        label: "Personne de confiance",
                        value: [personneConfiance.prenom, personneConfiance.nom].filter(Boolean).join(" ") || "Non renseigné",
                      },
                      { label: "Téléphone confiance", value: personneConfiance.telephone || "Non renseigné" },
                      { label: "Adresse confiance", value: personneConfiance.adresse || "Non renseignée" },
                      { label: "Lien confiance", value: personneConfiance.lien || "Non renseigné" },
                      {
                        label: "Personne à prévenir",
                        value: [personneAPrevenir.prenom, personneAPrevenir.nom].filter(Boolean).join(" ") || "Non renseigné",
                      },
                      { label: "Téléphone à prévenir", value: personneAPrevenir.telephone || "Non renseigné" },
                      { label: "Adresse à prévenir", value: personneAPrevenir.adresse || "Non renseignée" },
                      { label: "Lien à prévenir", value: personneAPrevenir.lien || "Non renseigné" },
                      { label: "Protection juridique", value: protectionJuridique.type || "Non renseignée" },
                      { label: "Représentant légal", value: protectionJuridique.representant || "Non renseigné" },
                      { label: "Téléphone représentant légal", value: protectionJuridique.telephone || "Non renseigné" },
                      {
                        label: "État du dossier contact",
                        value:
                          contactsBadge === "OK" ? (
                            <StatusChip color="green">Complet</StatusChip>
                          ) : contactsBadge === "Incomplets" ? (
                            <StatusChip color="amber">Partiel</StatusChip>
                          ) : (
                            <StatusChip color="red">À renseigner</StatusChip>
                          ),
                      },
                    ]}
                  />
                </SectionCard>
              </div>
            ) : null}

            {activeSection === "incident" ? (
              <div className="pv-section-anchor">
                <SectionCard
                  title="Incident"
                  subtitle="La gestion détaillée de disparition est séparée de la fiche patient."
                  actions={
                    incident ? (
                      <button type="button" className="pv-btn danger" onClick={() => navigate(`/incident/${patient.id}`)}>
                        Ouvrir la vue disparition
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="pv-btn danger"
                        onClick={() => {
                          createIncidentForPatient(patient);
                          navigate(`/incident/${patient.id}`);
                        }}
                      >
                        Déclarer disparition
                      </button>
                    )
                  }
                >
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
                      La fiche patient reste centrée sur la synthèse clinique et le pilotage du parcours. La gestion opérationnelle de disparition se fait dans une vue dédiée.
                    </div>

                    {incident ? (
                      <div
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff7f7",
                          borderRadius: 16,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ fontWeight: 800, color: "#991b1b" }}>Incident actif</div>
                        <div style={{ fontSize: 13, color: "#334155" }}>Statut : {currentStatus.label}</div>
                        <div style={{ fontSize: 13, color: "#334155" }}>Créé le : {incident.createdAt ? formatShortDateTime(incident.createdAt) : "—"}</div>
                        <div style={{ fontSize: 13, color: "#334155" }}>Durée écoulée : {elapsedMinutes !== null ? `${elapsedMinutes} min` : "—"}</div>
                        <div style={{ fontSize: 13, color: "#334155" }}>Actions tracées : {safeArray(incident.incidentLog).length}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <StatusChip color={serviceStepDone ? "green" : "amber"}>Service {serviceStepDone ? "fait" : "à faire"}</StatusChip>
                          <StatusChip color={securityStepDone ? "green" : "amber"}>Sécurité {securityStepDone ? "faite" : "en attente"}</StatusChip>
                          <StatusChip color={directionStepDone ? "green" : "amber"}>Direction {directionStepDone ? "faite" : "en attente"}</StatusChip>
                          {closureStepDone ? <StatusChip color="green">Clôturé</StatusChip> : null}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: "#64748b" }}>Aucun incident actif pour ce patient.</div>
                    )}
                  </div>
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
                            {[entry.report?.infos, entry.report?.objectifs, entry.report?.actions, entry.report?.vigilances]
                              .filter(Boolean)
                              .slice(0, 2)
                              .join(" • ") || "Version historisée"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {copilotPushAt ? (
                    <div className="pv-inline-note">Dernière action envoyée au copilote : {formatShortDateTime(copilotPushAt)}</div>
                  ) : null}
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
                        {inProgressActions.length === 0 ? (
                          <div className="pv-list-item pv-muted">Aucune</div>
                        ) : (
                          inProgressActions.map((item, index) => (
                            <div key={item.id || `ip-${index}`} className="pv-list-item">
                              <div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
                              <div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "En cours"}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="pv-action-columns__title">Bloquées</div>
                      <div className="pv-list">
                        {blockedActions.length === 0 ? (
                          <div className="pv-list-item pv-muted">Aucune</div>
                        ) : (
                          blockedActions.map((item, index) => (
                            <div key={item.id || `bl-${index}`} className="pv-list-item">
                              <div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
                              <div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "Bloqué"}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="pv-action-columns__title">Faites</div>
                      <div className="pv-list">
                        {doneActions.length === 0 ? (
                          <div className="pv-list-item pv-muted">Aucune</div>
                        ) : (
                          doneActions.map((item, index) => (
                            <div key={item.id || `do-${index}`} className="pv-list-item">
                              <div className="pv-list-item__title">{item.label || item.title || `Action ${index + 1}`}</div>
                              <div className="pv-list-item__meta">{item.owner || item.responsable || item.status || item.statut || "Fait"}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeSection === "ressources" ? (
              <div className="pv-section-anchor">
                <ListCard
                  title="Suivi des ressources"
                  subtitle="Demandes et relais déjà activés."
                  emptyLabel="Aucun suivi enregistré"
                  items={Array.isArray(patient.resourceFollowUp) ? patient.resourceFollowUp : []}
                />
                <ListCard
                  title="Historique HDJ"
                  subtitle="Séquences programmées ou passées."
                  emptyLabel="Aucune séquence HDJ"
                  items={Array.isArray(patient.hdjHistory) ? patient.hdjHistory : []}
                />
              </div>
            ) : null}

            {activeSection === "documents" ? (
              <div className="pv-section-anchor">
                <ListCard
                  title="Documents"
                  subtitle="Documents, formulaires et pièces disponibles pour ce patient."
                  emptyLabel="Aucun document enregistré"
                  items={safeArray(patient.documents || patient.forms || patient.formulaires)}
                />
              </div>
            ) : null}
          </main>
        </div>

        <button
          type="button"
          className="pv-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Remonter en haut"
        >
          ↑
        </button>
      </div>
    </AppShell>
  );
}
