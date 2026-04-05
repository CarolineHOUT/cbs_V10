import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getHDJSuggestionsFromStructuredIntake } from "../domain/hdj/hdjSuggestionEngine";
import { getOrientationSuggestionsFromPatient } from "./copiloteOrientationEngine";
function formatRelativeTime(dateString) {
if (!dateString) return "";

const date = new Date(dateString);
const now = new Date();
const diffMs = now - date;

const diffMin = Math.floor(diffMs / 60000);
const diffH = Math.floor(diffMs / 3600000);
const diffJ = Math.floor(diffMs / 86400000);

if (diffMin < 1) return "à l’instant";
if (diffMin < 60) return `il y a ${diffMin} min`;
if (diffH < 24) return `il y a ${diffH} h`;
if (diffJ === 1) return "hier";
if (diffJ < 7) return `il y a ${diffJ} j`;

return date.toLocaleDateString();
}


import { usePatientSimulation } from "../context/PatientSimulationContext";
import { resourcesCotentinAnnuaire } from "../contacts/resourcesCotentinAnnuaire";
import { useRef } from "react";
import PatientIdentityBar from "../components/PatientIdentityBar";
import { useNavigate } from "react-router-dom";
/**
* CopiloteLayout
* - Identité patient en lecture seule depuis le DPI / patient
* - Persistance complète via PatientSimulationContext.saveCopilotState
* - Synchronisation ciblée vers la fiche patient via syncCopilotToPatient
* - HAD avec critères bloquants
* - USP avec lien extranet
* - ASE branché sur les vues existantes
* - Activité repensée en centre de vigilance + post-it tracés
*/

/* =========================
CONFIG
========================= */
const KEYWORD_NATURES = ["coordination", "social", "juridique", "soins", "pédiatrie"];


const REFUSAL_REASONS = [
"Refus prestataire",
"Pas de place disponible",
"Critères non remplis",
"Délai incompatible",
"Zone non couverte",
];

const ABANDON_REASONS = [
"Projet patient modifié",
"Solution alternative trouvée",
"Non pertinent",
"Refus patient / famille",
"Critères non remplis",
];
const KEYWORD_EXAMPLES = [
{ label: "retour domicile impossible", nature: "coordination" },
{ label: "surveillance IDE", nature: "coordination" },
{ label: "douleur", nature: "soins" },
{ label: "aidant épuisé", nature: "social" },
{ label: "isolement", nature: "social" },
{ label: "précarité", nature: "social" },
{ label: "protection juridique", nature: "juridique" },
{ label: "tutelle", nature: "juridique" },
{ label: "situation pédiatrique", nature: "pédiatrie" },
];


const FORM_LINKS = {
via_trajectoire: "https://trajectoire.sante-ra.fr/Trajectoire/",
apa: "https://www.pour-les-personnes-agees.gouv.fr/api/v1/file/7e87084a-e7a2-4eb6-a92e-4618b729b936/Formulaire_demande_autonomie_cerfa_16301-01.pdf",
mdph: "/docs/mdph.pdf",
aide_exceptionnelle: "https://demarche.numerique.gouv.fr/",
lettre_ase: "/ase/lettre-liaison",
instance_ase: "/ase/preparation-instance",
usp: "https://extranet.ch-cotentin.fr/preadusp/",
};

const FORM_LABELS = {
via_trajectoire: "ViaTrajectoire",
apa: "APA",
mdph: "MDPH",
aide_exceptionnelle: "Aide exceptionnelle",
lettre_ase: "Lettre ASE",
instance_ase: "Préparation instance ASE",
};

const MENU_ITEMS = [
  { id: "copilot", label: "Vue globale" },
  { id: "orientation", label: "Orientation" },
  { id: "ressources", label: "Ressources" },
  { id: "hdj", label: "HDJ" },
  { id: "demandes", label: "Demandes" },
  { id: "formulaires", label: "Formulaires" },
  { id: "synthese", label: "Synthèse" },
];

const TARGET_STATUSES = ["estimée", "validée"];
const ACTION_STATUSES = ["À faire", "En cours", "En attente externe", "Bloqué", "Réalisé"];
const EXCHANGE_TYPES = ["Action", "Info", "Famille", "Urgent"];
const EXCHANGE_STATUSES = ["À traiter", "En cours", "En attente de réponse", "Clos"];
const HDJ_FREQUENCY_OPTIONS = [
"1 fois / semaine",
"2 fois / semaine",
"3 fois / semaine",
"5 fois / semaine",
"Personnalisé",
];
const HDJ_DURATION_OPTIONS = [
"1 semaine",
"2 semaines",
"3 semaines",
"4 semaines",
"6 semaines",
"Personnalisé",
];
const HDJ_SECRETARIAT_EMAIL = "secretariat.hdj@hopital.fr";
const DMS_THRESHOLD = 10;
const DMS_REMINDER_EVERY_DAYS = 2;
const INITIATED_REMINDER_EVERY_DAYS = 3;
const DOSSIER_SUBTYPES = [
"Demande initiale",
"Révision de droit",
"Dossier déjà en cours",
];



const BLOCK_REASONS = [
"Attente décision médicale",
"Attente famille",
"Attente ressource externe",
"Problème administratif",
"Refus patient",
"Problème social",
"Protection juridique en attente",
];

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const HAD_CRITERIA = [
"Pathologie lourde ou multiple",
"Soins ponctuels complexes",
"Réadaptation au domicile",
"Soins continus",
"Plaies complexes",
"Postchirurgie",
"Infectiologie",
"Neuro-handicap / rééducation",
"Cancérologie",
"Soins palliatifs / fin de vie",
];

const CATEGORY_TREE = [

{ label: "Soins", children: ["traitement", "douleur", "surveillance", "dénutrition", "pansements complexes", "surveillance IDE", "perfusions", "toilette complexe"] },
{ label: "Social", children: ["isolement", "aidant épuisé", "précarité", "droits sociaux"] },
{ label: "Protection", children: ["ASE", "mesure de protection", "tutelle", "curatelle"] },
{ label: "Orientation", children: ["EHPAD", "USP", "SMR", "HDJ", "HAD", "retour domicile impossible"] },
{ label: "Logement / environnement", children: ["logement inadapté", "escaliers", "matériel", "retour impossible"] },
];

const DEFAULT_KEYWORDS = [];

const HDJ_ACTS = {
medical: [
"Avis médical programmé",
"Réévaluation clinique",
"Bilan thérapeutique",
"Ajustement traitement",
"Prescription de suivi",
"Ferinject",
"Kétamine",
"Transfusion",
"HDJ post AVC",
"Ponction d’ascite",
"Perf albumine",
],
soins: [
"Pansements complexes",
"Surveillance IDE",
"Perfusion",
"Éducation thérapeutique",
"Surveillance clinique ciblée",
],
social: [
"Évaluation sociale",
"Entretien assistante sociale",
"Aide aux droits",
"Préparation aides domicile",
"Soutien social",
],
coordination: [
"Coordination sociale",
"Coordination DAC",
"Organisation sortie",
"Lien partenaires extérieurs",
"Concertation pluriprofessionnelle",
],
technique: [
"Évaluation autonomie",
"Bilan fonctionnel",
"Organisation matériel",
"Soins techniques programmés",
"Préparation logistique",
],
};

const HDJ_LIBRARY = [
{
id: "hdj_geriatrie_autonomie",
title: "HDJ gériatrique – autonomie / fragilité",
family: "geriatrie",
triggers: [
"perte autonomie",
"chute",
"difficulté marche",
"patient fragile",
"isolement",
],
objective:
"Sécuriser le retour au domicile par une évaluation gériatrique et fonctionnelle rapide.",
acts: [
"Réévaluation clinique",
"Évaluation autonomie",
"Bilan fonctionnel",
"Évaluation kiné",
"Évaluation ergo",
"Coordination sociale",
],
frequency: "1 fois / semaine",
duration: "4 semaines",
actor: "Gériatre",
alternatives: ["APA", "DAC", "Aide à domicile", "EHPAD"],
},
{
id: "hdj_memoire",
title: "HDJ mémoire – cognition / sécurisation",
family: "cognition",
triggers: [
"troubles cognitifs",
"désorientation",
"confusion",
"trouble comportement",
"refus soins",
],
objective:
"Qualifier les troubles cognitifs et sécuriser l’orientation aval.",
acts: [
"Évaluation cognitive",
"Réévaluation clinique",
"Entretien entourage",
"Évaluation sociale",
"Concertation pluriprofessionnelle",
],
frequency: "1 fois / semaine",
duration: "4 semaines",
actor: "Gériatre / mémoire",
alternatives: ["DAC", "ASE / social", "EHPAD"],
},
{
id: "hdj_therapeutique",
title: "HDJ thérapeutique – adaptation du traitement",
family: "therapeutique",
triggers: [
"observance fragile",
"équilibrage traitement",
"iatrogénie",
"polymédication",
"insuline",
"anticoagulant",
],
objective:
"Poursuivre l’ajustement thérapeutique en ambulatoire sans prolonger l’hospitalisation.",
acts: [
"Bilan thérapeutique",
"Ajustement traitement",
"Éducation thérapeutique",
"Surveillance IDE",
"Réévaluation clinique",
],
frequency: "2 fois / semaine",
duration: "3 semaines",
actor: "Médecin référent / IDE",
alternatives: ["HAD", "Retour domicile IDEL"],
},
{
id: "hdj_medico_social",
title: "HDJ médico-social – coordination de sortie",
family: "social",
triggers: [
"isolement",
"aidant absent",
"aidant épuisé",
"précarité",
"logement inadapté",
"retour impossible",
"refus aide",
],
objective:
"Utiliser le HDJ comme support de coordination pour éviter une hospitalisation prolongée non médicale.",
acts: [
"Évaluation sociale",
"Entretien assistante sociale",
"Aide aux droits",
"Coordination DAC",
"Organisation sortie",
],
frequency: "1 fois / semaine",
duration: "4 semaines",
actor: "Coordination / social",
alternatives: ["DAC", "APA", "Aide à domicile", "ASE / social"],
},
{
id: "hdj_post_hosp",
title: "HDJ post-hospitalisation – surveillance précoce",
family: "post_hospit",
triggers: [
"surveillance",
"réévaluation",
"post aigu",
"décompensation récente",
"risque rechute",
],
objective:
"Permettre une sortie précoce avec surveillance clinique programmée.",
acts: [
"Réévaluation clinique",
"Surveillance clinique ciblée",
"Bilan thérapeutique",
"Coordination sortie",
],
frequency: "1 à 2 fois / semaine",
duration: "2 semaines",
actor: "Médecin du service",
alternatives: ["HAD", "Retour domicile IDEL", "SSR / SMR"],
},
{
id: "hdj_technique",
title: "HDJ technique – soins et actes programmés",
family: "technique",
triggers: [
"pansements complexes",
"soins techniques",
"bilan",
"réévaluation",
"surveillance IDE",
],
objective:
"Regrouper les actes techniques en ambulatoire pour raccourcir le séjour.",
acts: [
"Pansements complexes",
"Surveillance IDE",
"Perfusion",
"Bilans techniques",
"Réévaluation clinique",
],
frequency: "1 à 3 fois / semaine",
duration: "3 semaines",
actor: "IDE / médecin référent",
alternatives: ["HAD", "Retour domicile IDEL"],
},
];

const BUILTIN_RESOURCES = [

];

/* =========================
HELPERS
========================= */

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function safeArray(arr) {
return Array.isArray(arr) ? arr : [];
}

function uniq(arr) {
return Array.from(new Set(safeArray(arr).filter(Boolean)));
}
function getOrientationKeywords(orientation) {
const map = {
usld: ["usld", "long séjour"],
ehpad: ["ehpad", "hebergement"],
ssr: ["ssr", "rééducation", "readaptation"],
had: ["had", "hospitalisation domicile"],
domicile: ["retour domicile", "domicile"],
hdj: ["hdj", "hôpital de jour"],
ime: ["ime"],
mas: ["mas"],
fam: ["fam"],
psy: ["psy", "psychiatrie"],
};

const key = normalize(orientation);

return Object.entries(map)
.filter(([k, keywords]) =>
key.includes(k) ||
keywords.some((kw) => key.includes(kw))
)
.flatMap(([, keywords]) => keywords);
}

function mergeResourceLists(primary = [], external = []) {
const all = [...safeArray(primary), ...safeArray(external)];

return all.map((item, index) => ({
id: item.id || `r_${index}`,
name: item.name || item.label || "Ressource",
family: item.family || item.type || "",
subType: item.subType || item.sousType || item.type || "",
territory: item.territory || item.zone || "",
zone: item.zone || item.territory || "",
contactPerson:
typeof item.contactPerson === "string"
? item.contactPerson
: item.person || item.contact?.name || "",
phone:
item.phone ||
item.telephone ||
item.tel ||
item.contact?.phone ||
"",
email:
item.email ||
item.mail ||
item.contact?.email ||
"",
formLink:
item.formLink ||
item.link ||
item.url ||
item.platform?.url ||
item.sourceUrl ||
"",
delay: item.delay || "",
availableSlots: item.availableSlots || 0,
saturation: item.saturation || "unknown",
conditions: item.conditions || "",
tags: uniq([
...safeArray(item.tags),
...safeArray(item.keywords),
...safeArray(item.categories),
]),
notes: item.notes || item.note || "",
recommended: item.recommended ?? false,
source: item.source || "annuaire",
}));
}
function openExternal(url) {
window.open(url, "_blank", "noopener,noreferrer");
}


function computeRecommendedNextAction(s, hadValidation) {
if (s.selectedOrientation === "HAD" && hadValidation && !hadValidation.eligible) {
return {
label: "Compléter les critères HAD",
sentence: "Sortie HAD envisagée mais critères incomplets.",
section: "section-orientation",
tone: "red",
};
}

if (!s.selectedOrientation) {
return {
label: "Choisir une orientation cible",
sentence: "L’orientation de sortie reste à définir.",
section: "section-orientation",
tone: "amber",
};
}

if (!s.targetDate) {
return {
label: "Définir la date de sortie",
sentence: "La sortie n’a pas encore de date cible.",
section: "section-orientation",
tone: "amber",
};
}

const followupDemand = Object.values(s.resourceFollowUp || {}).find(
(r) => r.status === "followup"
);
if (followupDemand) {
return {
label: `Relancer ${followupDemand.name || "la ressource"}`,
sentence: "Une relance externe est prioritaire.",
section: "section-demandes",
tone: "amber",
};
}

const clarificationDemand = Object.values(s.resourceFollowUp || {}).find(
(r) => r.status === "needs_clarification"
);
if (clarificationDemand) {
return {
label: `Compléter ${followupDemand?.name || clarificationDemand.name || "la demande"}`,
sentence: "Une demande est bloquée par des informations manquantes.",
section: "section-demandes",
tone: "red",
};
}

const overdueAction = (s.actions || []).find(
(a) => isActionOverdue(a) && a.status !== "Réalisé"
);
if (overdueAction) {
return {
label: overdueAction.title,
sentence: "Une action en retard doit être traitée.",
section: "section-actions",
tone: "amber",
};
}

const acceptedDemand = Object.values(s.resourceFollowUp || {}).find(
(r) => r.status === "accepted" || r.status === "programmed"
);
if (acceptedDemand && !s.isDischarged) {
return {
label: "Confirmer l’organisation de sortie",
sentence: "Une solution existe, il faut finaliser l’organisation.",
section: "section-synthese",
tone: "blue",
};
}

return {
label: "Poursuivre le suivi du parcours",
sentence: "Aucune alerte immédiate, suivi standard.",
section: "section-copilot",
tone: "green",
};
}



function computeOrientationSuggestionsFromKeywords(activeKeywords = []) {
const labels = safeArray(activeKeywords).map((item) =>
normalizeKeywordLabel(typeof item === "string" ? item : item?.label)
);

const has = (value) => labels.some((label) => label.includes(normalizeKeywordLabel(value)));

const scores = {
"Retour domicile IDEL": 0,
HAD: 0,
EHPAD: 0,
USLD: 0,
"SSR / SMR": 0,
HDJ: 0,
"USP / Soins palliatifs": 0,
"Aide à domicile": 0,
"ASE / social": 0,
};

if (has("retour domicile impossible")) {
scores["SSR / SMR"] += 4;
scores["EHPAD"] += 3;
scores["USLD"] += 2;
}

if (has("surveillance ide")) {
scores["HAD"] += 3;
scores["Retour domicile IDEL"] += 2;
scores["Aide à domicile"] += 1;
}

if (has("douleur")) {
scores["HAD"] += 2;
scores["HDJ"] += 1;
scores["USP / Soins palliatifs"] += 1;
}

if (has("palliatif") || has("fin de vie")) {
scores["USP / Soins palliatifs"] += 5;
scores["HAD"] += 3;
scores["EHPAD"] += 1;
}

if (has("aidant epuise")) {
scores["ASE / social"] += 2;
scores["Aide à domicile"] += 3;
scores["EHPAD"] += 2;
scores["HAD"] += 1;
}

if (has("isolement")) {
scores["ASE / social"] += 3;
scores["Aide à domicile"] += 2;
scores["EHPAD"] += 2;
}

if (has("precarite")) {
scores["ASE / social"] += 4;
scores["Aide à domicile"] += 1;
}

if (has("protection juridique") || has("tutelle") || has("curatelle")) {
scores["ASE / social"] += 3;
scores["EHPAD"] += 1;
scores["USLD"] += 1;
}

if (has("perte autonomie")) {
scores["EHPAD"] += 3;
scores["USLD"] += 2;
scores["Aide à domicile"] += 2;
scores["SSR / SMR"] += 1;
}

if (has("logement inadapte")) {
scores["ASE / social"] += 2;
scores["EHPAD"] += 2;
scores["SSR / SMR"] += 1;
}

if (has("situation pediatrique")) {
scores["ASE / social"] += 1;
scores["HDJ"] += 1;
}

const ranked = Object.entries(scores)
.map(([label, score]) => ({ label, score }))
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);

return {
ranked,
main: ranked[0]?.label || "",
alternative1: ranked[1]?.label || "",
alternative2: ranked[2]?.label || "",
};
}

function normalizeKeywordLabel(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function uniqKeywordObjects(items = []) {
const seen = new Set();

return safeArray(items).filter((item) => {
const key = normalizeKeywordLabel(item?.label);
if (!key || seen.has(key)) return false;
seen.add(key);
return true;
});
}

function buildSharedPatientPayload({
quickSummary,
targetDate,
targetDateStatus,
selectedOrientation,
orientationPlanB,
orientationPlanC,
currentSolution,
coordination,
actions,
resourceFollowUp,
coordinationStatus,
hadEligibility,
hdjForm,
hdjStatus,
decisionLog,
}) {
const resolvedOrientation = currentSolution || selectedOrientation || "";

return {
orientation: resolvedOrientation,
solutionLabel: resolvedOrientation,
dateSortiePrevue: targetDate || "",

dischargePlanning: {
solutionLabel: resolvedOrientation,
targetDateEnvisaged:
targetDateStatus !== "validée" ? targetDate || "" : "",
targetDateValidated:
targetDateStatus === "validée" ? targetDate || "" : "",
targetDateStatus: targetDateStatus || "estimée",
planB: orientationPlanB || "",
planC: orientationPlanC || "",
},

copilotSummary: {
situation: quickSummary?.situation || "",
block: quickSummary?.block || "",
strategy: quickSummary?.strategy || "",
nextAction: quickSummary?.nextAction || "",
owner: quickSummary?.owner || "",

currentSolution: resolvedOrientation,
targetDate: targetDate || "",
targetDateStatus: targetDateStatus || "estimée",

selectedOrientation: selectedOrientation || "",
orientationPlanB: orientationPlanB || "",
orientationPlanC: orientationPlanC || "",

coordinationStatus: coordinationStatus || "",
responsableActuel: coordination?.responsableActuel || "",

hadEligibility: hadEligibility || null,
hdjStatus: hdjStatus || "",
hdjTitle: hdjForm?.title || "",
},

parcoursStatus: coordinationStatus || quickSummary?.situation || "",

nextAction: quickSummary?.nextAction
? {
label: quickSummary.nextAction,
owner: quickSummary?.owner || "",
updatedAt: new Date().toISOString(),
}
: null,

actionPlan: safeArray(actions),
resourceFollowUp: Object.values(resourceFollowUp || {}),
decisionLog: safeArray(decisionLog),
};
}

function daysBetween(a, b) {
if (!a || !b) return 0;
const start = new Date(a);
const end = new Date(b);
return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(value) {
if (!value) return "—";
return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
if (!value) return "—";
return new Date(value).toLocaleString("fr-FR");
}

function tagStyle(kind = "neutral") {
const map = {
neutral: { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
blue: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
green: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
amber: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
red: { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" },
purple: { background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" },
};

return {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
minHeight: 24,
padding: "0 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
...map[kind],
};
}

function scoreResource(resource, keywords) {
const haystack = normalize(
[
resource.name,
resource.family,
resource.subType,
resource.territory,
resource.zone,
resource.contactPerson,
...(resource.tags || []),
].join(" ")
);

let score = 0;
safeArray(keywords).forEach((k) => {
if (haystack.includes(normalize(k))) score += 10;
});
if (resource.recommended) score += 8;
if ((resource.availableSlots || 0) > 0) score += 4;
if (resource.saturation === "green") score += 6;
if (resource.saturation === "red") score -= 4;
return score;
}

function getAvailabilityBadge(resource) {
const raw = resource?.saturation || "unknown";
const tone = raw === "green" ? "green" : raw === "orange" ? "amber" : raw === "red" ? "red" : "blue";

return {
tone,
label:
raw === "green"
? "Disponibilité bonne"
: raw === "orange"
? "Tension modérée"
: raw === "red"
? "Saturé"
: "À vérifier",
};
}

function getFollowMeta(demand) {
const status = demand?.status || "draft";
const mapping = {
draft: { label: "À initier", tone: "blue" },
sent: { label: "Demande envoyée", tone: "blue" },
waiting: { label: "En attente de retour", tone: "amber" },
followup: { label: "À relancer", tone: "red" },
accepted: { label: "Acceptée", tone: "green" },
refused: { label: "Refusée", tone: "red" },
closed: { label: "Clôturée", tone: "neutral" },
received: { label: "Retour reçu", tone: "blue" },
programmed: { label: "Programmé", tone: "green" },
needs_clarification: { label: "À compléter", tone: "amber" },
};
return mapping[status] || mapping.draft;
}

function computeNextStep(item) {
if (!item) return "Proposer une ressource";
if (item.status === "draft") return "Activer la ressource";
if (item.status === "sent") return "Tracer l’envoi";
if (item.status === "waiting") return "Attendre ou relancer";
if (item.status === "followup") return "Attendre le retour";
if (item.status === "refused") return "Réorienter";
if (item.status === "accepted") return "Confirmer la prise en charge";
if (item.status === "received") return "Attendre programmation";
if (item.status === "needs_clarification") return "Compléter la demande";
if (item.status === "programmed") return "Confirmer au patient / service";
if (item.status === "closed") return "Aucune";
return "Mettre à jour";
}

function inferActionDomain({ title = "", comment = "" }) {
const text = normalize(`${title} ${comment}`);
if (
text.includes("famille") ||
text.includes("aidant") ||
text.includes("apa") ||
text.includes("mdph") ||
text.includes("social") ||
text.includes("ase")
) {
return "Social";
}
if (
text.includes("ide") ||
text.includes("pansement") ||
text.includes("soin") ||
text.includes("surveillance") ||
text.includes("perfusion")
) {
return "Coordination IDE";
}
return "Médical";
}

function isActionOverdue(action) {
return Boolean(
action?.dueDate &&
action?.status !== "Réalisé" &&
daysBetween(action.dueDate, new Date()) > 0
);
}

function formatActorName(author = "") {
const parts = String(author || "").split(" ");
if (parts.length < 2) return author;
const role = parts[0];
const firstName = parts[1];
const lastInitial = parts[2]?.charAt(0) || "";
return `${role} ${firstName} ${lastInitial}.`;
}


function getPlanBOptions(orientation) {
switch (orientation) {
case "USP / Soins palliatifs":
return ["HAD", "EHPAD", "SSR / SMR", "Retour domicile IDEL"];
case "EHPAD":
return ["USLD", "HAD", "SSR / SMR", "Aide à domicile"];
case "HAD":
return ["Retour domicile IDEL", "Aide à domicile", "SSR / SMR"];
case "SSR / SMR":
return ["EHPAD", "USLD", "Retour domicile IDEL"];
case "USLD":
return ["EHPAD", "SSR / SMR", "HAD"];
case "Retour domicile IDEL":
return ["HAD", "Aide à domicile", "SSR / SMR"];
default:
return ["HAD", "EHPAD", "SSR / SMR", "Aide à domicile"];
}
}

function getPlanCOptions(orientation) {
switch (orientation) {
case "USP / Soins palliatifs":
return ["Aide à domicile", "ASE / social", "Hébergement temporaire"];
case "EHPAD":
return ["Retour domicile IDEL", "Aide à domicile", "ASE / social"];
case "HAD":
return ["ASE / social", "Aide à domicile", "Retour domicile IDEL"];
default:
return ["Retour domicile IDEL", "Aide à domicile", "ASE / social", "Hébergement temporaire"];
}
}

function buildContextualForms(keywords) {
const normalized = safeArray(keywords).map(normalize);
const has = (value) => normalized.some((k) => k.includes(normalize(value)));
const result = [];

if (has("smr")) result.push("via_trajectoire");
if (has("ehpad")) result.push("via_trajectoire");
if (has("autonomie") || has("aide domicile") || has("grand age")) result.push("apa");
if (has("mdph") || has("protection") || has("tutelle") || has("curatelle")) result.push("mdph");
if (has("ase")) result.push("lettre_ase", "instance_ase");
if (has("precarite") || has("droits sociaux")) result.push("aide_exceptionnelle");

return uniq(result);
}

function findSimilarHdjModels(keywords) {
const safeKeywords = safeArray(keywords).map(normalize);

return safeArray(HDJ_LIBRARY)
.map((model) => {
const modelKeywords = safeArray(model.triggers || model.keywords).map(normalize);

const commonKeywords = modelKeywords.filter((k) =>
safeKeywords.some((kw) => kw.includes(k) || k.includes(kw))
);

return {
...model,
similarity: commonKeywords.length,
commonKeywords,
};
})
.filter((m) => m.similarity > 0)
.sort((a, b) => b.similarity - a.similarity);
}

function computeComplexity({ keywords, actions, resourceFollowUp, dischargeType, exchanges }) {
if (dischargeType === "simple") {
const heavySignals =
safeArray(keywords).length > 0 ||
safeArray(actions).some((a) => a.status !== "Réalisé") ||
Object.keys(resourceFollowUp || {}).length > 0 ||
safeArray(exchanges).some((e) => e.type === "Urgent");
if (!heavySignals) return { label: "Faible", color: "green", score: 5 };
}

let score = 0;
score += safeArray(keywords).length * 3;
score += safeArray(actions).filter((a) => a.status === "Bloqué").length * 8;
score += Object.values(resourceFollowUp || {}).filter((r) => r.status === "refused").length * 10;
score += safeArray(exchanges).filter((e) => e.type === "Urgent" && e.status !== "Clos").length * 8;

if (safeArray(keywords).some((k) => normalize(k).includes("protection"))) score += 12;
if (safeArray(keywords).some((k) => normalize(k).includes("ase"))) score += 12;
if (safeArray(keywords).some((k) => normalize(k).includes("retour domicile impossible"))) score += 12;
if (safeArray(keywords).some((k) => normalize(k).includes("grand age"))) score += 8;

if (score < 20) return { label: "Faible", color: "green", score };
if (score < 40) return { label: "Modérée", color: "blue", score };
if (score < 60) return { label: "Élevée", color: "amber", score };
return { label: "Critique", color: "red", score };
}

function computeHdjSummary(hdjForm) {
const actsLabel = safeArray(hdjForm?.acts).length > 0 ? hdjForm.acts.join(", ") : "aucun acte";
if (hdjForm?.recurrence === "ponctuel") {
return `HDJ ponctuel : ${hdjForm?.customSessions || 1} séance(s) – actes : ${actsLabel}`;
}
if (hdjForm?.frequency === "Personnalisé") {
const days = safeArray(hdjForm?.days).length ? hdjForm.days.join(", ") : "jours non précisés";
return `HDJ personnalisé : ${days} pendant ${hdjForm?.durationCustom || hdjForm?.duration || "durée non précisée"} – actes : ${actsLabel}`;
}
return `HDJ ${hdjForm?.frequency || "fréquence non précisée"} pendant ${hdjForm?.durationCustom || hdjForm?.duration || "durée non précisée"} – actes : ${actsLabel}`;
}

function buildHdjMail({ patient, currentLocation, coordination, targetDate, hdjForm }) {
return [
`Objet : Demande HDJ - ${patient?.nom || "Patient"} ${patient?.prenom || ""} - sortie ${targetDate || "non définie"}`,
"",
`Patient : ${patient?.nom || "—"} ${patient?.prenom || "—"}`,
`Âge : ${patient?.age || "—"} ans`,
`Service : ${currentLocation?.service || patient?.service || "—"}`,
`Chambre / lit : ${currentLocation?.chambre || patient?.chambre || "—"} / ${currentLocation?.lit || patient?.lit || "—"}`,
`Médecin référent : ${coordination?.medecin || "Non renseigné"}`,
`Référent coordination : ${coordination?.responsableActuel || coordination?.cadre || coordination?.medecin || "Non renseigné"}`,
`Date cible de sortie : ${targetDate || "Non définie"}`,
"",
"Contexte / objectif :",
hdjForm?.objective || "Non renseigné",
"",
"Schéma demandé :",
computeHdjSummary(hdjForm),
"",
"Actes demandés :",
safeArray(hdjForm?.acts).length ? `- ${hdjForm.acts.join("\n- ")}` : "- Aucun acte renseigné",
"",
"Commentaires :",
hdjForm?.comment || "Aucun commentaire",
].join("\n");
}

function buildSynthesisExport({
patient,
quickSummary,
strategyPlan,
currentLocation,
coordination,
targetDate,
lengthOfStay,
alerts,
decisions,
}) {
return [
`Patient : ${patient?.nom || "—"} ${patient?.prenom || "—"}`,
`Service : ${currentLocation?.service || patient?.service || "—"} / Chambre ${currentLocation?.chambre || patient?.chambre || "—"} / Lit ${currentLocation?.lit || patient?.lit || "—"}`,
`Date cible de sortie : ${targetDate || "Non définie"}`,
`Séjour : J+${lengthOfStay}`,
"",
`Situation : ${quickSummary?.situation || "—"}`,
`Blocage principal : ${quickSummary?.block || "—"}`,
`Stratégie principale : ${strategyPlan?.main || quickSummary?.strategy || "Non définie"}`,
`Plan B : ${strategyPlan?.alternative1 || "Non défini"}`,
`Plan C : ${strategyPlan?.alternative2 || "Non défini"}`,
`Prochaine action : ${quickSummary?.nextAction || "—"}`,
`Responsable : ${quickSummary?.owner || "—"}`,
"",
"Alertes :",
...(safeArray(alerts).length ? alerts.map((a) => `- ${a.label}`) : ["- Aucune alerte"]),
"",
"Décisions récentes :",
...(safeArray(decisions).length
? decisions.slice(0, 8).map((d) => `- ${formatDateTime(d.date)} · ${d.text}`)
: ["- Aucune décision tracée"]),
"",


`Médecin référent : ${coordination?.medecin || "Non renseigné"}`,
`Cadre : ${coordination?.cadre || "Non renseigné"}`,
].join("\n");
}

function validateHADSelection(hadEligibility) {
const checkedItems = safeArray(hadEligibility?.checkedItems);

if (checkedItems.length === 0) {
return {
eligible: false,
message: "Aucun critère HAD coché : dossier non exploitable.",
tone: "red",
};
}

return {
eligible: true,
message: "Critère(s) HAD présent(s) : dossier acceptable.",
tone: "green",
};
}
function buildSuggestedKeywordsFromPatient(patient) {
const suggestions = [];
const intake = patient?.structuredIntake || {};

if (intake?.social?.isolementSocial) {
suggestions.push({ label: "isolement", nature: "social", source: "recueil" });
}

if (intake?.social?.precarite) {
suggestions.push({ label: "précarité", nature: "social", source: "recueil" });
}

if (intake?.social?.protectionJuridique) {
suggestions.push({ label: "protection juridique", nature: "juridique", source: "recueil" });
}

if (intake?.securite?.troublesCognitifs || intake?.securite?.desorientation) {
suggestions.push({ label: "surveillance", nature: "coordination", source: "recueil" });
}

if (intake?.securite?.refusAide) {
suggestions.push({ label: "refus aide", nature: "coordination", source: "recueil" });
}

if (intake?.securite?.logementInadapte) {
suggestions.push({ label: "logement inadapté", nature: "social", source: "recueil" });
}

if (intake?.gir?.passageIDE?.oui) {
suggestions.push({ label: "surveillance IDE", nature: "coordination", source: "recueil" });
}

if (
intake?.traitement?.difficulte?.observanceFragile ||
intake?.traitement?.difficulte?.oublis
) {
suggestions.push({ label: "observance fragile", nature: "coordination", source: "recueil" });
}

if (
intake?.dependance?.mobilisation ||
intake?.dependance?.toilette ||
intake?.dependance?.alimentation
) {
suggestions.push({ label: "perte autonomie", nature: "social", source: "recueil" });
}

if (
normalize(patient?.service || "").includes("pedi") ||
normalize(patient?.service || "").includes("enfant")
) {
suggestions.push({ label: "situation pédiatrique", nature: "pediatrie", source: "recueil" });
}

return uniqKeywordObjects(suggestions).map((item, index) => ({
id: `suggested_kw_${index}_${normalizeKeywordLabel(item.label)}`,
...item,
}));
}
function getInitialOrientationFromPatient(patient) {
const structured = patient?.structuredIntake || {};

if (patient?.copilotSummary?.selectedOrientation) {
return patient.copilotSummary.selectedOrientation;
}

if (patient?.dischargePlanning?.solutionLabel) {
return patient.dischargePlanning.solutionLabel;
}

if (patient?.solutionLabel) {
return patient.solutionLabel;
}

if (patient?.orientation) {
return patient.orientation;
}

if (patient?.derivedOrientations?.[0]?.label) {
return patient.derivedOrientations[0].label;
}

if (structured?.social?.isolementSocial && structured?.securite?.logementInadapte) {
return "ASE / social";
}

if (structured?.gir?.passageIDE?.oui) {
return "Retour domicile IDEL";
}

if (structured?.social?.protectionJuridique) {
return "ASE / social";
}

if (
structured?.securite?.troublesCognitifs ||
structured?.securite?.desorientation
) {
return "HDJ";
}

return "";
}




function buildDefaultCopilotState(patient = {}) {
const orientationSuggestions = getOrientationSuggestionsFromPatient(patient);
const initialOrientation = getInitialOrientationFromPatient(patient);
const initialFrein = patient?.derivedFreins?.[0]?.label || "";
const initialConsequence = patient?.derivedConsequences?.[0]?.label || "";

return {
activeSection: "copilot",

coordinationStatus:
patient?.copilotSummary?.coordinationStatus ||
patient?.parcoursStatus ||
initialFrein ||
"",

selectedOrientation:
patient?.copilotSummary?.selectedOrientation ||
patient?.dischargePlanning?.solutionLabel ||
patient?.solutionLabel ||
patient?.orientation ||
orientationSuggestions.primary ||
initialOrientation ||
"",

targetDate:
patient?.copilotSummary?.targetDate ||
patient?.dischargePlanning?.targetDateValidated ||
patient?.dischargePlanning?.targetDateEnvisaged ||
"",

targetDateStatus:
patient?.copilotSummary?.targetDateStatus ||
(patient?.dischargePlanning?.targetDateValidated
? "validée"
: patient?.dischargePlanning?.targetDateEnvisaged
? "estimée"
: "estimée"),

orientationPlanB:
patient?.copilotSummary?.orientationPlanB ||
patient?.dischargePlanning?.planB ||
"",

orientationPlanC:
patient?.copilotSummary?.orientationPlanC ||
patient?.dischargePlanning?.planC ||
"",

currentSolutionOverride:
patient?.copilotSummary?.currentSolution ||
patient?.dischargePlanning?.solutionLabel ||
patient?.solutionLabel ||
patient?.orientation ||
orientationSuggestions.primary ||
initialOrientation ||
"",

strategyPlan: {
main:
patient?.copilotSummary?.strategy ||
patient?.dischargePlanning?.solutionLabel ||
orientationSuggestions.primary ||
initialOrientation ||
initialConsequence ||
"",
alternative1:
patient?.copilotSummary?.orientationPlanB ||
orientationSuggestions.alternative1 ||
"",
alternative2:
patient?.copilotSummary?.orientationPlanC ||
orientationSuggestions.alternative2 ||
"",
},

dischargeType: "simple",
isMedicallyReady: false,
isDischarged: false,
medicalReadyDate: "",

commune: patient?.commune || patient?.ville || "",

actions: safeArray(patient?.copilotState?.actions),
exchanges: safeArray(patient?.copilotState?.exchanges),
demandes: safeArray(patient?.copilotState?.demandes),

resourceFollowUp:
patient?.copilotState?.resourceFollowUp &&
typeof patient.copilotState.resourceFollowUp === "object"
? patient.copilotState.resourceFollowUp
: {},

resourceHistory:
patient?.copilotState?.resourceHistory &&
typeof patient.copilotState.resourceHistory === "object"
? patient.copilotState.resourceHistory
: {},

formsState:
patient?.copilotState?.formsState &&
typeof patient.copilotState.formsState === "object"
? patient.copilotState.formsState
: {},

decisionLog: safeArray(patient?.copilotState?.decisionLog),

coordination:
patient?.copilotState?.coordination &&
typeof patient.copilotState.coordination === "object"
? patient.copilotState.coordination
: {
responsableActuel: "",
cadre: "",
medecin: "",
},

hadEligibility:
patient?.copilotState?.hadEligibility &&
typeof patient.copilotState.hadEligibility === "object"
? patient.copilotState.hadEligibility
: {
checkedItems: [],
clinicalJustification: "",
eligible: false,
validatedAt: "",
validatedBy: "",
},

hdjStatus: patient?.copilotState?.hdjStatus || "draft",
showHdjForm: Boolean(patient?.copilotState?.showHdjForm),
hdjMailPreviewOpen: Boolean(patient?.copilotState?.hdjMailPreviewOpen),
hdjSendLog: safeArray(patient?.copilotState?.hdjSendLog),

hdjForm:
patient?.copilotState?.hdjForm &&
typeof patient.copilotState.hdjForm === "object"
? patient.copilotState.hdjForm
: {
title: "",
actor: "",
objective: "",
recurrence: "ponctuel",
frequency: "",
frequencyCustom: "",
days: [],
duration: "",
durationCustom: "",
customSessions: 1,
comment: "",
acts: [],
},

resourceSearch: "",
customActInput: "",
pendingRefusalResourceId: "",
pendingRefusalReason: "",
newKeyword: "",
newKeywordForm: {
label: "",
nature: "",
},

keywordsState: {
suggested: buildSuggestedKeywordsFromPatient(patient),
selected: [],
custom: [],
},

keywords: DEFAULT_KEYWORDS,

categoriesState: CATEGORY_TREE.map((cat) => ({
...cat,
selected: false,
selectedChildren: [],
})),
};
}

function getDefaultPlanB(orientation) {
return getPlanBOptions(orientation)?.[0] || "";
}

function getDefaultPlanC(orientation) {
return getPlanCOptions(orientation)?.[0] || "";
}

function buildAutoDecisionLogEntry(label, actor) {
return {
id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
text: label,
date: new Date().toISOString(),
author: actor || "Utilisateur",
};
}

function shouldTriggerRepeatingReminder(startDate, lastReminderAt, thresholdDays, everyDays) {
if (!startDate) return false;
const now = new Date();
const elapsedDays = daysBetween(startDate, now);
if (elapsedDays < thresholdDays) return false;
if (!lastReminderAt) return true;
return daysBetween(lastReminderAt, now) >= everyDays;
}

 
/* =========================
UI HELPERS
========================= */

function IdentityInfoCard({ label, value }) {
return (
<div style={styles.identityInfoCard}>
<div style={styles.identityInfoLabel}>{label}</div>
<div style={styles.identityInfoValue}>{value || "—"}</div>
</div>
);
}

/* =========================
COMPONENT
========================= */

export default function CopiloteLayout({ patientId }) {
  const navigate = useNavigate();
const location = useLocation();




  // =========================================================
  // 1) SOURCES / CONTEXTE
  // =========================================================
    
  
  const {
    getPatientById,
    saveCopilotState,
    syncCopilotToPatient,
    resources,
  } = usePatientSimulation();

  const patient = getPatientById(patientId);
  console.log("COPILOT PATIENT", patient);
console.log("COPILOT SUMMARY", patient?.copilotSummary);
console.log("DISCHARGE PLANNING", patient?.dischargePlanning);
console.log("STRUCTURED INTAKE", patient?.structuredIntake);
console.log("DERIVED FREINS", patient?.derivedFreins);
console.log("DERIVED CONSEQUENCES", patient?.derivedConsequences);
console.log("NEXT ACTION", patient?.nextAction);

const orientationEngine = useMemo(() => {
return getOrientationSuggestionsFromPatient(patient);
}, [patient]);

const hdjRecommendation = useMemo(() => {
return getHDJSuggestionsFromStructuredIntake(
patient?.structuredIntake || {}
);
}, [patient]);
 

const entryDate = patient?.dateEntree || "2026-03-28";
const avoidableDays = patient?.joursEvitables || 0;
function formatDateShort(date) {
if (!date) return "—";
const d = new Date(date);
return d.toLocaleDateString("fr-FR");
}
const orientationRef = useRef(null);
const demandeRef = useRef(null);
const actionRef = useRef(null);

  // =========================================================
  // 2) DONNÉES DÉRIVÉES DE BASE
  // =========================================================
  const mergedResources = useMemo(
    () => mergeResourceLists(resourcesCotentinAnnuaire, resources),
    [resources]
  );
const savedUser = JSON.parse(localStorage.getItem("currentUser"));

const currentUser = {
name: savedUser?.displayName || savedUser?.matricule || "Utilisateur",
role: savedUser?.role || "inconnu",
};

const serviceAgents = useMemo(() => {
const raw =
safeArray(patient?.serviceAgents) ||
safeArray(patient?.agentsService) ||
safeArray(patient?.staff) ||
[];
const names = raw
.map((item) =>
typeof item === "string"
? item
: item?.name || item?.nom || item?.displayName || ""
)
.filter(Boolean);

return uniq([
currentUser.name,
...names,
]).map((name, index) => ({
id: `agent_${index}`,
name,
}));
}, [patient, currentUser.name]);

const serviceDoctors = useMemo(() => {
const raw =
safeArray(patient?.serviceDoctors) ||
safeArray(patient?.medecinsService) ||
safeArray(patient?.doctors) ||
[];
const names = raw
.map((item) =>
typeof item === "string"
? item
: item?.name || item?.nom || item?.displayName || ""
)
.filter(Boolean);

return uniq(names).map((name, index) => ({
id: `doctor_${index}`,
name,
}));
}, [patient]);

  
const initialCopilotState = useMemo(() => {
const base = buildDefaultCopilotState(patient || {});
const saved = patient?.copilotState || {};

return {
...base,
...saved,

activeSection: saved.activeSection || base.activeSection || "copilot",

actions: safeArray(saved.actions ?? base.actions),
exchanges: safeArray(saved.exchanges ?? base.exchanges),
demandes: safeArray(saved.demandes ?? base.demandes),

resourceFollowUp:
saved.resourceFollowUp && typeof saved.resourceFollowUp === "object"
? saved.resourceFollowUp
: base.resourceFollowUp,

resourceHistory:
saved.resourceHistory && typeof saved.resourceHistory === "object"
? saved.resourceHistory
: base.resourceHistory,

formsState:
saved.formsState && typeof saved.formsState === "object"
? saved.formsState
: {
apa: { status: "À faire", subtype: "", dossierRequired: true },
mdph: { status: "À faire", subtype: "", dossierRequired: true },
},

decisionLog: safeArray(saved.decisionLog ?? base.decisionLog),

coordination:
saved.coordination && typeof saved.coordination === "object"
? saved.coordination
: {
responsableActuel: "",
cadre: "",
medecin: "",
},

hadEligibility:
saved.hadEligibility && typeof saved.hadEligibility === "object"
? saved.hadEligibility
: {
checkedItems: [],
clinicalJustification: "",
eligible: false,
validatedAt: "",
validatedBy: "",
},

hdjStatus: saved.hdjStatus || "draft",
showHdjForm: Boolean(saved.showHdjForm),
hdjMailPreviewOpen: Boolean(saved.hdjMailPreviewOpen),
hdjSendLog: safeArray(saved.hdjSendLog ?? base.hdjSendLog),

hdjForm:
saved.hdjForm && typeof saved.hdjForm === "object"
? saved.hdjForm
: {
title: "",
actor: "",
objective: "",
recurrence: "ponctuel",
frequency: "",
frequencyCustom: "",
days: [],
duration: "",
durationCustom: "",
customSessions: 1,
comment: "",
acts: [],
requestedDate: "",
validatedAt: "",
validatedBy: "",
},

resourceSearch: "",
customActInput: "",
pendingRefusalResourceId: "",
pendingRefusalReason: "",
pendingAbandonResourceId: "",
pendingAbandonReason: "",
lastDmsReminderAt: saved.lastDmsReminderAt || "",
newKeyword: "",
newKeywordForm: {
label: "",
nature: "",
},
};
}, [patient]);




  // =========================================================
  // 3) STATE LOCAL
  // =========================================================
  const [state, setState] = useState(initialCopilotState);
  const [showPostitComposer, setShowPostitComposer] = useState(false);

const [newPostit, setNewPostit] = useState({
type: "Info",
text: "",
});
const [showPostits, setShowPostits] = useState(true);
useEffect(() => {
if (!currentUser?.name) return;

setState((prev) => {
if (prev?.coordination?.responsableActuel) return prev;

return {
...prev,
coordination: {
...(prev.coordination || {}),
responsableActuel: currentUser.name,
},
};
});
}, [currentUser?.name]);












   // 🔽 TRI DES DEMANDES (workflow)
const sortedDemandes = [...(state.demandes || [])].sort((a, b) => {
if (a.status === "waiting" && b.status !== "waiting") return -1;
if (a.status !== "waiting" && b.status === "waiting") return 1;
return 0;
});


const demandesCritiques = safeArray(sortedDemandes).filter(
(d) => d.status === "waiting"
);
const [isEditingDecision, setIsEditingDecision] = useState(false);


  // =========================================================
  // 4) FONCTIONS UTILITAIRES MÉTIER
  // =========================================================
 
function computeQuickSummary(s) {
  const overdueAction = safeArray(s.actions).find(
    (a) => isActionOverdue(a) && a.status !== "Réalisé"
  );

  const blockedAction = safeArray(s.actions).find(
    (a) => a.status === "Bloqué"
  );

  const followupDemand = Object.values(s.resourceFollowUp || {}).find(
    (r) => r.status === "followup"
  );

  const refusedDemand = Object.values(s.resourceFollowUp || {}).find(
    (r) => r.status === "refused"
  );

  const waitingClarificationDemand = Object.values(s.resourceFollowUp || {}).find(
    (r) => r.status === "needs_clarification"
  );

  const hadInvalid =
    s.selectedOrientation === "HAD" &&
    !validateHADSelection(s.hadEligibility).eligible;

  const nextAction =
    overdueAction?.title ||
    blockedAction?.title ||
    followupDemand?.name ||
    waitingClarificationDemand?.name ||
    safeArray(s.actions).find((a) => a.status !== "Réalisé")?.title ||
    "Aucune action";

  let block = "Aucun blocage majeur identifié";
  let tone = "green";

  if (blockedAction?.blockReason) {
    block = blockedAction.blockReason;
    tone = "red";
  } else if (!s.selectedOrientation) {
    block = "Orientation non définie";
    tone = "red";
  } else if (s.isMedicallyReady && !s.targetDate) {
    block = "Sortant médicalement sans date cible";
    tone = "red";
  } else if (hadInvalid) {
    block = "Critères HAD incomplets";
    tone = "red";
  } else if (refusedDemand && !s.orientationPlanB) {
    block = `Refus sans alternative : ${refusedDemand.name || "ressource"}`;
    tone = "red";
  } else if (waitingClarificationDemand) {
    block = `Dossier à compléter : ${waitingClarificationDemand.name || "ressource"}`;
    tone = "amber";
  } else if (followupDemand) {
    block = `Relance en attente : ${followupDemand.name || "ressource"}`;
    tone = "amber";
  } else if (!s.targetDate) {
    block = "Date cible non définie";
    tone = "amber";
  }

  return {
    situation:
      s.coordinationStatus ||
      s.selectedOrientation ||
      "Situation en cours d’évaluation",
    block,
    tone,
    nextAction,
    owner: s.coordination?.responsableActuel || "",
    strategy: s.strategyPlan?.main || s.selectedOrientation || "",
    sentence:
      overdueAction
        ? "Une action en retard doit être traitée."
        : blockedAction
        ? "Une action bloquée ralentit le parcours."
        : followupDemand
        ? "Une relance externe est attendue."
        : waitingClarificationDemand
        ? "Une demande doit être complétée."
        : !s.selectedOrientation
        ? "L’orientation de sortie reste à définir."
        
        : "",
  };
}

  const syncKeywordsToLegacy = useCallback((nextKeywordsState) => {
    const merged = uniqKeywordObjects([
      ...safeArray(nextKeywordsState?.selected),
      ...safeArray(nextKeywordsState?.custom),
    ]);

    return merged.map((item) => item.label);
  }, []);
  function pushResourceHistory(prev, resourceId, entry) {
const currentHistory = prev.resourceHistory || {};
const resourceEntries = currentHistory[resourceId] || [];

return {
...currentHistory,
[resourceId]: [
{
at: new Date().toISOString(),
...entry,
},
...resourceEntries,
],
};
}


  // =========================================================
  // 5) CALLBACKS DE BASE
  // =========================================================
  const updateState = useCallback((patch) => {
    setState((prev) => {
      const nextPatch = typeof patch === "function" ? patch(prev) : patch;
      return { ...prev, ...nextPatch };
    });
  }, []);

  const persistCopilot = useCallback(
    (patch) => {
      if (!patient?.id) return;

      setState((prev) => {
        const nextPatch = typeof patch === "function" ? patch(prev) : patch || {};
        const next = { ...prev, ...nextPatch };

        const sharedPayload = buildSharedPatientPayload({
          quickSummary: computeQuickSummary(next),
          targetDate: next.targetDate,
          targetDateStatus: next.targetDateStatus,
          selectedOrientation: next.selectedOrientation,
          orientationPlanB: next.orientationPlanB,
          orientationPlanC: next.orientationPlanC,
          currentSolution: next.currentSolutionOverride || next.selectedOrientation,
          coordination: next.coordination,
          actions: next.actions,
          resourceFollowUp: next.resourceFollowUp,
          coordinationStatus: next.coordinationStatus,
          hadEligibility: next.hadEligibility,
          hdjForm: next.hdjForm,
hdjStatus: next.hdjStatus,
decisionLog: next.decisionLog,
        });

        queueMicrotask(() => {
          saveCopilotState(patient.id, next);
          syncCopilotToPatient(patient.id, sharedPayload);
        });

        return next;
      });
    },
    [patient?.id, saveCopilotState, syncCopilotToPatient]
  );



const activeKeywords = useMemo(() => {
return uniqKeywordObjects([
...safeArray(state.keywordsState?.selected),
...safeArray(state.keywordsState?.custom),
]);
}, [state.keywordsState]);

const activeKeywordLabels = useMemo(() => {
return activeKeywords.map((item) => item.label);
}, [activeKeywords]);

const suggestedKeywords = useMemo(() => {
return uniqKeywordObjects(state.keywordsState?.suggested || []);
}, [state.keywordsState]);

  const orientationSuggestions = useMemo(() => {
    return computeOrientationSuggestionsFromKeywords(activeKeywords);
  }, [activeKeywords]);

  // =========================================================
// 7) AUTRES DONNÉES DÉRIVÉES
// =========================================================
const lengthOfStay = useMemo(() => {
const admissionDate = patient?.dateEntree || patient?.admissionDate || "";
return admissionDate
? Math.max(0, daysBetween(admissionDate, new Date()))
: 0;
}, [patient]);

const quickSummary = useMemo(() => computeQuickSummary(state), [state]);

const currentSolution =
state.currentSolutionOverride ||
state.selectedOrientation ||
patient?.copilotSummary?.currentSolution ||
"";

const isPlanned = useMemo(
() =>
Boolean(state.targetDate) &&
state.targetDateStatus === "validée" &&
Boolean(currentSolution),
[state.targetDate, state.targetDateStatus, currentSolution]
);

const hadValidation = useMemo(() => {
if (state.selectedOrientation !== "HAD") return null;
return validateHADSelection(state.hadEligibility);
}, [state.selectedOrientation, state.hadEligibility]);

const recommendedNextAction = useMemo(
() => computeRecommendedNextAction(state, hadValidation),
[state, hadValidation]
);

const complexity = useMemo(
() =>
computeComplexity({
keywords: activeKeywordLabels || [],
actions: state.actions || [],
resourceFollowUp: state.resourceFollowUp || {},
dischargeType: state.dischargeType,
exchanges: state.exchanges || [],
}),
[
activeKeywordLabels,
state.actions,
state.resourceFollowUp,
state.dischargeType,
state.exchanges,
]
);

const contextualForms = useMemo(
() =>
buildContextualForms([
...(activeKeywordLabels || []),
...getOrientationKeywords(state.selectedOrientation),
]),
[activeKeywordLabels, state.selectedOrientation]
);

const visibleResources = useMemo(() => {
const keywords = [
...(activeKeywordLabels || []),
...getOrientationKeywords(state.selectedOrientation),
];

const search = normalize(state.resourceSearch || "");

return (mergedResources || [])
.map((r) => ({ ...r, score: scoreResource(r, keywords) }))
.filter((r) => {
if (!search) return true;
const text = normalize(
[
r.name,
r.family,
r.subType,
r.territory,
r.zone,
r.contactPerson,
...(r.tags || []),
].join(" ")
);
return text.includes(search);
})
.sort((a, b) => b.score - a.score);
}, [
mergedResources,
state.resourceSearch,
activeKeywordLabels,
state.selectedOrientation,
]);

const resourcesToShow =
state.activeSection === "ressources"
? visibleResources
: visibleResources.slice(0, 3);

const orientationPreviewResources = useMemo(() => {
if (!state.selectedOrientation) return [];
return visibleResources.slice(0, 3);
}, [state.selectedOrientation, visibleResources]);

const similarHdj = useMemo(() => {
const matched = findSimilarHdjModels(activeKeywordLabels || []);

if (matched.length > 0) return matched;

// fallback 👉 toujours afficher des modèles
return safeArray(HDJ_LIBRARY).slice(0, 3);
}, [activeKeywordLabels]);
const demandCounters = useMemo(
() => ({
relancer: Object.values(state.resourceFollowUp || {}).filter(
(r) => r.status === "followup"
).length,
attente: Object.values(state.resourceFollowUp || {}).filter(
(r) => r.status === "waiting" || r.status === "sent"
).length,
acceptees: Object.values(state.resourceFollowUp || {}).filter(
(r) => r.status === "accepted"
).length,
}),
[state.resourceFollowUp]
);

const alerts = useMemo(() => {
const result = [];

if (lengthOfStay >= 10) result.push({ label: "Alerte J+10 séjour" });
if (lengthOfStay > DMS_THRESHOLD) result.push({ label: "DMS dépassée" });
if (!state.targetDate) result.push({ label: "Date cible non définie" });
if (state.isMedicallyReady && !state.targetDate) {
result.push({ label: "Sortant médicalement sans date cible" });
}

if (
state.selectedOrientation === "HAD" &&
hadValidation &&
!hadValidation.eligible
) {
result.push({ label: "HAD non éligible en l’état" });
}

Object.values(state.resourceFollowUp || {}).forEach((demand) => {
if (demand.status === "followup") {
result.push({ label: `Relancer ${demand.name || "une ressource"}` });
}
if (demand.status === "refused") {
result.push({ label: `Refus reçu : ${demand.name || "ressource"}` });
}
});

(state.exchanges || []).forEach((exchange) => {
const text = exchange?.text || "";

if (exchange?.type === "Urgent" && exchange?.status !== "Clos") {
result.push({ label: `Urgent : ${text.slice(0, 50)}` });
}
if (!exchange?.read) {
result.push({ label: `Note non lue : ${text.slice(0, 50)}` });
}
});

(state.actions || []).forEach((action) => {
if (isActionOverdue(action)) {
result.push({ label: `Action en retard : ${action.title}` });
}
if (action.status === "Bloqué") {
result.push({ label: `Action bloquée : ${action.title}` });
}
});

return result.slice(0, 12);
}, [state, lengthOfStay, hadValidation]);


const prioritiesNow = useMemo(() => {
const overdueActions = (state.actions || [])
.filter((a) => a.status !== "Réalisé" && isActionOverdue(a))
.map((a) => ({
id: `priority_action_${a.id}`,
label: `Faire maintenant : ${a.title}`,
section: "actions",
tone: "red",
}));

const relances = Object.entries(state.resourceFollowUp || {})
.filter(([, r]) => r.status === "followup")
.map(([resourceId, r]) => ({
id: `priority_resource_${resourceId}`,
label: `Relancer : ${r.name || resourceId}`,
section: "demandes",
tone: "amber",
}));

const unreadNotes = (state.exchanges || [])
.filter((e) => !e.read || e.status === "À traiter" || e.type === "Urgent")
.map((e) => ({
id: `priority_exchange_${e.id}`,
label: `${e.type} : ${(e.text || "").slice(0, 60)}`,
section: "activite",
tone: e.type === "Urgent" ? "red" : "blue",
}));

const suggestions = [];

if (!state.targetDate) {
suggestions.push({
id: "suggestion_target_date",
label: "Définir une date cible de sortie",
section: "copilot",
tone: "blue",
});
}

if (!state.selectedOrientation) {
suggestions.push({
id: "suggestion_orientation",
label: "Choisir une orientation cible",
section: "orientation",
tone: "blue",
});
}

if (
state.selectedOrientation === "HAD" &&
hadValidation &&
!hadValidation.eligible
) {
suggestions.push({
id: "suggestion_had",
label: "Compléter les critères HAD",
section: "orientation",
tone: "red",
});
}

return [...overdueActions, ...relances, ...unreadNotes, ...suggestions].slice(0, 8);
}, [
state.actions,
state.resourceFollowUp,
state.exchanges,
state.targetDate,
state.selectedOrientation,
hadValidation,
]);

const computeTopPriority = (s) => {
if (
s.selectedOrientation === "HAD" &&
!validateHADSelection(s.hadEligibility).eligible
) {
return {
label: "Compléter les critères HAD",
section: "section-orientation",
sentence: "Sortie HAD envisagée mais critères incomplets",
};
}

const pendingCount = Object.values(s.resourceFollowUp || {}).filter(
(r) =>
["draft", "sent", "waiting", "followup", "needs_clarification"].includes(
r.status
)
).length;

if (pendingCount > 0) {
return {
label: "Traiter les demandes en attente",
section: "section-demandes",
sentence: `${pendingCount} demandes en attente de réponse`,
};
}

const pendingDemand = Object.values(s.resourceFollowUp || {}).find(
(r) => ["needs_clarification", "refused"].includes(r.status)
);

if (pendingDemand) {
return {
label: "Traiter une demande en attente",
section: "section-demandes",
sentence: "Une demande nécessite clarification ou est refusée",
};
}

const overdueAction = (s.actions || []).find(
(a) => isActionOverdue(a) && a.status !== "Réalisé"
);

if (overdueAction) {
return {
label: "Mettre à jour une action en retard",
section: "section-actions",
sentence: "Une action est en retard et doit être mise à jour",
};
}

return null;
};

const computeAnticipations = (s) => {
  const items = [];

  const pendingCount = Object.values(s.resourceFollowUp || {}).filter((r) =>
    ["draft", "sent", "waiting", "followup", "needs_clarification"].includes(r.status)
  ).length;

  const overdueCount = safeArray(s.actions).filter(
    (a) => isActionOverdue(a) && a.status !== "Réalisé"
  ).length;

  const hasSocialSignal = safeArray(activeKeywordLabels).some((k) =>
    ["isolement", "aidant épuisé", "précarité", "protection juridique", "tutelle"].some(
      (x) => normalize(k).includes(normalize(x))
    )
  );

  if (!s.targetDate) {
    items.push({
      label: "Définir une date cible de sortie",
      section: "section-copilot",
    });
  }

  if (!s.selectedOrientation) {
    items.push({
      label: "Valider une orientation cible",
      section: "section-orientation",
    });
  }

  if (s.selectedOrientation === "HAD") {
    if (!validateHADSelection(s.hadEligibility).eligible) {
      items.push({
        label: "Compléter les critères HAD",
        section: "section-orientation",
      });
    }

    items.push({
      label: "Anticiper l’organisation du domicile",
      section: "section-ressources",
    });
  }

  if (s.selectedOrientation === "EHPAD") {
    items.push({
      label: "Anticiper la recherche de place EHPAD",
      section: "section-ressources",
    });

    items.push({
      label: "Préparer le dossier d’admission",
      section: "section-demandes",
    });
  }

  if (s.selectedOrientation === "SSR / SMR") {
    items.push({
      label: "Lancer la recherche SSR / SMR",
      section: "section-ressources",
    });

    items.push({
      label: "Anticiper transport et délai de place",
      section: "section-demandes",
    });
  }

  if (s.selectedOrientation === "HDJ") {
    items.push({
      label: "Structurer le parcours HDJ",
      section: "section-hdj",
    });

    items.push({
      label: "Préparer l’envoi au secrétariat",
      section: "section-hdj",
    });
  }

  if (
    s.selectedOrientation === "Retour domicile IDEL" ||
    s.selectedOrientation === "Aide à domicile"
  ) {
    items.push({
      label: "Anticiper les aides au retour domicile",
      section: "section-ressources",
    });
  }

  if (pendingCount > 0) {
    items.push({
      label: `Surveiller ${pendingCount} demande(s) externe(s)`,
      section: "section-demandes",
    });
  }

  if (overdueCount > 0) {
    items.push({
      label: `${overdueCount} action(s) à remettre à jour`,
      section: "section-actions",
    });
  }

  if (hasSocialSignal) {
    items.push({
      label: "Anticiper les besoins sociaux / aidants",
      section: "section-copilot",
    });
  }

  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  }).slice(0, 3);
};
const topPriority = useMemo(() => computeTopPriority(state), [state]);
const anticipations = useMemo(() => computeAnticipations(state), [state]);
  // =========================================================
  // 9) NAVIGATION / UI HELPERS
  // =========================================================
const openPatientView = () => {
if (!patient?.id) return;
navigate(`/patient/${patient.id}`);
};

  const goTo = (path) => {
    if (typeof navigate === "function") {
      navigate(path);
      return;
    }
    window.location.href = path;
  };

 const scrollToSection = (sectionId, ref = null) => {
persistCopilot({ activeSection: sectionId.replace("section-", "") });

window.requestAnimationFrame(() => {
const target =
ref?.current || document.getElementById(sectionId);

if (target) {
const rect = target.getBoundingClientRect();
const y = rect.top + window.scrollY - 92;
window.scrollTo({
top: Math.max(y, 0),
behavior: "smooth",
});
}
});
};

  // =========================================================
  // 10) HANDLERS ACTIONS / RESSOURCES / KEYWORDS / FORMULAIRES
  // =========================================================
  const addActionInline = (action) => {
    persistCopilot((prev) => ({
      actions: [
        {
          id: `act_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "À faire",
          priority: "Normale",
          actorRole: inferActionDomain(action),
          domain: inferActionDomain(action),
          nextStep: "Démarrer l’action",
          createdBy: "Utilisateur connecté",
          lastUpdatedBy: "Utilisateur connecté",
          ...action,
        },
        ...prev.actions,
      ],
    }));
  };

  const updateActionInline = (id, patch) => {
    persistCopilot((prev) => ({
      actions: prev.actions.map((a) => {
        if (a.id !== id) return a;
        const next = {
          ...a,
          ...patch,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: "Utilisateur connecté",
        };
        if (next.status === "Réalisé" && !next.doneAt) {
          next.doneAt = new Date().toISOString();
        }
        if (next.status === "Bloqué" && !next.blockReason) {
          next.blockReason = BLOCK_REASONS[0];
        }
        return next;
      }),
    }));
  };

  const updateResource = (resourceId, patch) => {
    persistCopilot((prev) => ({
      resourceFollowUp: {
        ...prev.resourceFollowUp,
        [resourceId]: {
...(prev.resourceFollowUp?.[resourceId] || {}),
...patch,

history: [
...((prev.resourceFollowUp?.[resourceId]?.history) || []),
{
label: patch.status || "Mise à jour",
reason: patch.reason || "",
at: new Date().toISOString(),
by: currentUser.name,
role: currentUser.role,
},
],

updatedAt: new Date().toISOString(),
}
      },
    }));
  };

  const toggleKeyword = (keyword) => {
    persistCopilot((prev) => ({
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter((k) => k !== keyword)
        : [...prev.keywords, keyword],
    }));
  };

  const addKeywordInline = () => {
    const clean = String(state.newKeyword || "").trim();
    if (!clean) return;

    persistCopilot((prev) => ({
      keywords: uniq([...(prev.keywords || []), clean]),
      newKeyword: "",
    }));
  };

  const toggleCategory = (label) => {
    persistCopilot((prev) => ({
      categoriesState: prev.categoriesState.map((c) =>
        c.label === label ? { ...c, selected: !c.selected } : c
      ),
    }));
  };

  const toggleSubCategory = (parentLabel, child) => {
    persistCopilot((prev) => ({
      categoriesState: prev.categoriesState.map((c) => {
        if (c.label !== parentLabel) return c;
        const exists = c.selectedChildren.includes(child);
        const nextChildren = exists
          ? c.selectedChildren.filter((x) => x !== child)
          : [...c.selectedChildren, child];
        return { ...c, selected: true, selectedChildren: nextChildren };
      }),
      keywords: prev.keywords.includes(child)
        ? prev.keywords.filter((k) => k !== child)
        : [...prev.keywords, child],
    }));
  };

  const handleOrientationSelect = (orientation) => {
const orientationKeywords = getOrientationKeywords(orientation);
const nextPlanB = getDefaultPlanB(orientation);
const nextPlanC = getDefaultPlanC(orientation);

persistCopilot((prev) => ({
selectedOrientation: orientation,
orientationPlanB: nextPlanB,
orientationPlanC: nextPlanC,
currentSolutionOverride: orientation,
keywords: uniq([...(prev.keywords || []), ...orientationKeywords]),
hadEligibility:
orientation === "HAD"
? prev.hadEligibility
: {
checkedItems: [],
clinicalJustification: "",
eligible: false,
validatedAt: "",
validatedBy: "",
},
decisionLog: [
buildAutoDecisionLogEntry(
`Orientation retenue : ${orientation}${nextPlanB ? ` · Plan B : ${nextPlanB}` : ""}${nextPlanC ? ` · Plan C : ${nextPlanC}` : ""}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}));
};



  const saveRefusal = () => {
    const resourceId = state.pendingRefusalResourceId;
    if (!resourceId) return;

    updateResource(resourceId, {
      status: "refused",
      refusalReason: state.pendingRefusalReason,
      nextStep: "Réorienter",
    });

    persistCopilot({
      pendingRefusalResourceId: "",
      pendingRefusalReason: REFUSAL_REASONS[0],
    });
  };

  const openFormSmart = (formKey) => {
    if (formKey === "lettre_ase") {
      persistCopilot((prev) => ({
        formsState: {
          ...prev.formsState,
          lettre_ase: {
            status: "En cours",
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      goTo(FORM_LINKS.lettre_ase);
      return;
    }

    if (formKey === "instance_ase") {
      persistCopilot((prev) => ({
        formsState: {
          ...prev.formsState,
          instance_ase: {
            status: "En cours",
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      goTo(FORM_LINKS.instance_ase);
      return;
    }

    const link = FORM_LINKS[formKey];
    if (link?.startsWith("http")) {
      openExternal(link);
      return;
    }
    if (link) {
      goTo(link);
    }
  };

  const markFormStatus = (key, status) => {
    persistCopilot((prev) => ({
      formsState: {
        ...prev.formsState,
        [key]: {
          ...(prev.formsState?.[key] || {}),
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const toggleSuggestedKeyword = (keywordItem) => {
    persistCopilot((prev) => {
      const currentSelected = safeArray(prev.keywordsState?.selected);

      const exists = currentSelected.some(
        (item) =>
          normalizeKeywordLabel(item.label) === normalizeKeywordLabel(keywordItem.label)
      );

      const nextSelected = exists
        ? currentSelected.filter(
            (item) =>
              normalizeKeywordLabel(item.label) !==
              normalizeKeywordLabel(keywordItem.label)
          )
        : [
            ...currentSelected,
            {
              id: keywordItem.id || `selected_${Date.now()}`,
              label: keywordItem.label,
              nature: keywordItem.nature,
              source: keywordItem.source || "recueil",
            },
          ];

      const nextKeywordsState = {
        ...(prev.keywordsState || {}),
        suggested: safeArray(prev.keywordsState?.suggested),
        selected: nextSelected,
        custom: safeArray(prev.keywordsState?.custom),
      };

      return {
        keywordsState: nextKeywordsState,
        keywords: syncKeywordsToLegacy(nextKeywordsState),
      };
    });
  };

  const removeActiveKeyword = (keywordLabel) => {
    persistCopilot((prev) => {
      const nextKeywordsState = {
        ...(prev.keywordsState || {}),
        suggested: safeArray(prev.keywordsState?.suggested),
        selected: safeArray(prev.keywordsState?.selected).filter(
          (item) =>
            normalizeKeywordLabel(item.label) !== normalizeKeywordLabel(keywordLabel)
        ),
        custom: safeArray(prev.keywordsState?.custom).filter(
          (item) =>
            normalizeKeywordLabel(item.label) !== normalizeKeywordLabel(keywordLabel)
        ),
      };

      return {
        keywordsState: nextKeywordsState,
        keywords: syncKeywordsToLegacy(nextKeywordsState),
      };
    });
  };

  const addCustomKeyword = () => {
    const label = String(state.newKeywordForm?.label || "").trim();
    const nature = String(state.newKeywordForm?.nature || "").trim();

    if (!label) return;
    if (!nature) {
      alert("La nature du mot-clé est obligatoire.");
      return;
    }

    const exists = uniqKeywordObjects([
      ...safeArray(state.keywordsState?.suggested),
      ...safeArray(state.keywordsState?.selected),
      ...safeArray(state.keywordsState?.custom),
    ]).some(
      (item) => normalizeKeywordLabel(item.label) === normalizeKeywordLabel(label)
    );

    if (exists) {
      alert("Ce mot-clé existe déjà.");
      return;
    }

    persistCopilot((prev) => {
      const nextKeywordsState = {
        ...(prev.keywordsState || {}),
        suggested: safeArray(prev.keywordsState?.suggested),
        selected: safeArray(prev.keywordsState?.selected),
        custom: [
          ...safeArray(prev.keywordsState?.custom),
          {
            id: `custom_kw_${Date.now()}`,
            label,
            nature,
            source: "manuel",
          },
        ],
      };

      return {
        keywordsState: nextKeywordsState,
        keywords: syncKeywordsToLegacy(nextKeywordsState),
        newKeywordForm: {
          label: "",
          nature: "",
        },
      };
    });
  };
const groupedSuggestedKeywords = useMemo(() => {
const groups = {};
suggestedKeywords.forEach((item) => {
const key = item.nature || "autre";
if (!groups[key]) groups[key] = [];
groups[key].push(item);
});
return groups;
}, [suggestedKeywords]);

const groupedActiveKeywords = useMemo(() => {
const groups = {};
activeKeywords.forEach((item) => {
const key = item.nature || "autre";
if (!groups[key]) groups[key] = [];
groups[key].push(item);
});
return groups;
}, [activeKeywords]);
  const exportSynthesis = () => {
    const content = buildSynthesisExport({
      patient,
      quickSummary,
      strategyPlan: state.strategyPlan,
      currentLocation: state.currentLocation,
      coordination: state.coordination,
      targetDate: state.targetDate,
      lengthOfStay,
      alerts,
      decisions: state.decisionLog,
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
      alert("Synthèse copiée dans le presse-papiers.");
      return;
    }

    window.prompt("Copier la synthèse :", content);
  };
const menuCounters = useMemo(() => {
  const activeResources = Object.values(state.resourceFollowUp || {}).filter(
    (r) => r.status && r.status !== "closed"
  ).length;

  const pendingDemandes = Object.values(state.resourceFollowUp || {}).filter((r) =>
    ["draft", "sent", "waiting", "followup", "needs_clarification", "received", "programmed"].includes(r.status)
  ).length;

  const activeActions = safeArray(state.actions).filter(
    (a) => a.status !== "Réalisé"
  ).length;

  const vigilanceCount = safeArray(state.exchanges).filter(
    (e) =>
      e?.read === false ||
      e?.status === "À traiter" ||
      e?.status === "En attente de réponse" ||
      e?.type === "Urgent"
  ).length;

  const formsTodo = safeArray(contextualForms).filter((key) => {
    const status = state.formsState?.[key]?.status || "À faire";
    return status !== "Envoyé";
  }).length;

  return {
    copilot: 0,
    orientation: state.selectedOrientation ? 0 : 1,
    ressources: activeResources,
    demandes: pendingDemandes,
    actions: activeActions,
    activite: vigilanceCount,
    formulaires: formsTodo,
    synthese: state.decisionLog?.length || 0,
  };
}, [
  state.resourceFollowUp,
  state.actions,
  state.exchanges,
  state.formsState,
  state.selectedOrientation,
  state.decisionLog,
  contextualForms,
]);
  // =========================================================
  // 11) GARDE
  // =========================================================
  if (!patient) {
    return <div>Patient introuvable.</div>;
  }

  // =========================================================

  // 12) RENDER

  // =========================================================
// ===== helper couleur post-it =====
const getPostitStyleByType = (type) => {
switch (type) {
case "Urgent":
return {
background: "#fee2e2",
border: "1px solid #fca5a5",
};
case "Action":
return {
background: "#fef3c7",
border: "1px solid #fcd34d",
};
case "Famille":
return {
background: "#ede9fe",
border: "1px solid #c4b5fd",
};
case "Info":
default:
return {
background: "#fef08a",
border: "1px solid #facc15",
};
}
};
const getPostitsStyleByType = (type) => {
switch (type) {
case "Urgent":
return {
background: "#fee2e2",
border: "1px solid #fca5a5",
color: "#991b1b",
};
case "Action":
return {
background: "#dbeafe",
border: "1px solid #93c5fd",
color: "#1e3a8a",
};
case "Info":
default:
return {
background: "#fef9c3",
border: "1px solid #fde68a",
color: "#854d0e",
};
}
};

const visiblePostits = safeArray(state.exchanges).filter(
  (item) => item?.isOpen !== false
);

const postitNotificationsCount = safeArray(state.exchanges).filter(
  (item) =>
    item?.read === false ||
    item?.status === "À traiter" ||
    item?.status === "En attente de réponse"
).length;

const addPostitToActivity = () => {
  const cleanText = String(newPostit.text || "").trim();
  if (!cleanText) return;

  persistCopilot((prev) => ({
    exchanges: [
      {
        id: `exchange_${Date.now()}`,
        type: newPostit.type || "Info",
        text: cleanText,
        author: currentUser.name || "Utilisateur",
        role: currentUser.role || "",
        status:
          newPostit.type === "Urgent"
            ? "À traiter"
            : newPostit.type === "Action"
            ? "En cours"
            : "À traiter",
        read: false,
        isOpen: true,
        isMinimized: false,
        createdAt: new Date().toISOString(),
      },
      ...safeArray(prev.exchanges),
    ],
  }));

  setNewPostit({ type: "Info", text: "" });
  setShowPostitComposer(false);
};

const togglePostitOpen = (id) => {
  persistCopilot((prev) => ({
    exchanges: safeArray(prev.exchanges).map((item) =>
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ),
  }));
};

const togglePostitMinimized = (id) => {
  persistCopilot((prev) => ({
    exchanges: safeArray(prev.exchanges).map((item) =>
      item.id === id ? { ...item, isMinimized: !item.isMinimized } : item
    ),
  }));
};

const markPostitAsRead = (id) => {
  persistCopilot((prev) => ({
    exchanges: safeArray(prev.exchanges).map((item) =>
      item.id === id ? { ...item, read: true } : item
    ),
  }));
};

const movePostitToStatus = (id, nextStatus) => {
  persistCopilot((prev) => ({
    exchanges: safeArray(prev.exchanges).map((item) =>
      item.id === id
        ? {
            ...item,
            status: nextStatus,
            read: true,
            updatedAt: new Date().toISOString(),
          }
        : item
    ),
  }));
};
const addHdjAct = useCallback(() => {
const clean = String(state.customActInput || "").trim();
if (!clean) return;

persistCopilot((prev) => ({
hdjForm: {
...(prev.hdjForm || {}),
acts: (prev.hdjForm?.acts || []).includes(clean)
? prev.hdjForm?.acts || []
: [...(prev.hdjForm?.acts || []), clean],
},
customActInput: "",
}));
}, [state.customActInput, persistCopilot]);
const handlePreviewHdj = useCallback(() => {
persistCopilot({
hdjMailPreviewOpen: !state.hdjMailPreviewOpen,
activeSection: "hdj",
showHdjForm: true,
});
}, [state.hdjMailPreviewOpen, persistCopilot]);

const updateHdjForm = useCallback((patch) => {
persistCopilot((prev) => ({
hdjForm: {
...(prev.hdjForm || {}),
...patch,
},
}));
}, [persistCopilot]);

const removeHdjAct = useCallback((actToRemove) => {
persistCopilot((prev) => ({
hdjForm: {
...(prev.hdjForm || {}),
acts: (prev.hdjForm?.acts || []).filter((act) => act !== actToRemove),
},
}));
}, [persistCopilot]);

const handleApplyHdjModel = useCallback((model) => {
persistCopilot((prev) => ({
activeSection: "hdj",
showHdjForm: true,
hdjForm: {
...(prev.hdjForm || {}),
title: model.title || model.label || "",
actor: model.actor || "",
objective: model.objective || model.comment || "",
recurrence: model.recurrence || "ponctuel",
frequency: model.frequency || "",
frequencyCustom: "",
days: model.days || [],
duration: model.duration || "",
durationCustom: "",
customSessions: model.customSessions || 1,
comment: model.comment || "",
acts: model.acts || [],
requestedDate: prev.hdjForm?.requestedDate || "",
},
}));
}, [persistCopilot]);

const handlePrintHdj = useCallback(() => {
const html = `
<html>
<head>
<title>Parcours HDJ</title>
<style>
body {
font-family: Arial, sans-serif;
margin: 0;
padding: 32px;
background: #f8fbff;
color: #0f172a;
}
.page {
max-width: 900px;
margin: 0 auto;
background: #ffffff;
border: 1px solid #dbe4f0;
border-radius: 18px;
overflow: hidden;
}
.header {
background: linear-gradient(135deg, #17376a 0%, #1d4ed8 100%);
color: white;
padding: 24px 28px;
}
.header h1 {
margin: 0 0 6px 0;
font-size: 26px;
}
.header p {
margin: 0;
opacity: 0.95;
font-size: 14px;
}
.content {
padding: 24px 28px 30px;
}
.grid {
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 14px;
margin-bottom: 20px;
}
.card {
border: 1px solid #e2e8f0;
border-radius: 14px;
padding: 14px;
background: #f8fafc;
}
.label {
font-size: 11px;
text-transform: uppercase;
letter-spacing: .04em;
color: #64748b;
font-weight: 700;
margin-bottom: 4px;
}
.value {
font-size: 15px;
font-weight: 700;
color: #111827;
}
.section-title {
font-size: 16px;
font-weight: 800;
color: #17376a;
margin: 22px 0 10px;
}
.box {
border: 1px solid #dbe4f0;
border-radius: 14px;
padding: 16px;
background: white;
margin-bottom: 14px;
line-height: 1.5;
}
.chips {
margin-top: 8px;
}
.chip {
display: inline-block;
margin: 4px 6px 0 0;
padding: 6px 10px;
border-radius: 999px;
background: #eef4ff;
color: #17376a;
border: 1px solid #c7d7ff;
font-size: 12px;
font-weight: 700;
}
.footer {
margin-top: 24px;
font-size: 12px;
color: #64748b;
text-align: right;
}
</style>
</head>
<body>
<div class="page">
<div class="header">
<h1>Parcours HDJ</h1>
<p>Support de transmission secrétariat - CarAbbaS</p>
</div>

<div class="content">
<div class="grid">
<div class="card">
<div class="label">Patient</div>
<div class="value">${patient?.nom || ""} ${patient?.prenom || ""}</div>
</div>
<div class="card">
<div class="label">Date de naissance</div>
<div class="value">${patient?.dateNaissance ? formatShortDate(patient.dateNaissance) : "—"}</div>
</div>
<div class="card">
<div class="label">IEP</div>
<div class="value">${patient?.iep || patient?.IPP || patient?.identifiant || "—"}</div>
</div>
<div class="card">
<div class="label">Service</div>
<div class="value">${state.currentLocation?.service || patient?.service || "—"}</div>
</div>
<div class="card">
<div class="label">Chambre / lit</div>
<div class="value">${state.currentLocation?.chambre || patient?.chambre || "—"} / ${state.currentLocation?.lit || patient?.lit || "—"}</div>
</div>
<div class="card">
<div class="label">Date souhaitée HDJ</div>
<div class="value">${state.hdjForm?.requestedDate ? formatShortDate(state.hdjForm.requestedDate) : "—"}</div>
</div>
</div>

<div class="section-title">Organisation demandée</div>
<div class="box">
<div><strong>Titre :</strong> ${state.hdjForm?.title || "—"}</div>
<div><strong>Acteur porteur :</strong> ${state.hdjForm?.actor || "—"}</div>
<div><strong>Récurrence :</strong> ${state.hdjForm?.recurrence || "—"}</div>
<div><strong>Fréquence :</strong> ${state.hdjForm?.frequency || state.hdjForm?.frequencyCustom || "—"}</div>
<div><strong>Durée :</strong> ${state.hdjForm?.duration || state.hdjForm?.durationCustom || "—"}</div>
<div><strong>Nombre de séances :</strong> ${state.hdjForm?.customSessions || 1}</div>
${
state.hdjForm?.recurrence === "recurrent" && (state.hdjForm?.days || []).length > 0
? `<div><strong>Jours :</strong> ${(state.hdjForm?.days || []).join(", ")}</div>`
: ""
}
</div>

<div class="section-title">Objectif / contexte</div>
<div class="box">
${state.hdjForm?.objective || "Non renseigné"}
</div>

<div class="section-title">Actes retenus</div>
<div class="box">
${
(state.hdjForm?.acts || []).length > 0
? `<div class="chips">${(state.hdjForm?.acts || [])
.map((act) => `<span class="chip">${act}</span>`)
.join("")}</div>`
: "Aucun acte renseigné"
}
</div>
<div style={styles.hdjSelectedActsBox}>
  <div style={styles.hdjActsGroupTitle}>Actes retenus</div>

  <div style={styles.keywordWrap}>
    {(state.hdjForm?.acts || []).length === 0 ? (
      <div style={{ color: "#64748b" }}>
        Aucun acte sélectionné
      </div>
    ) : (
      state.hdjForm.acts.map((act) => (
        <span key={act} style={styles.hdjActChipActive}>
          {act}
        </span>
      ))
    )}
  </div>
</div>
<div class="section-title">Commentaire</div>
<div class="box">
${state.hdjForm?.comment || "Aucun commentaire"}
</div>

<div class="section-title">Résumé automatique</div>
<div class="box">
${computeHdjSummary(state.hdjForm)}
</div>

<div class="footer">
Document généré le ${formatDateTime(new Date().toISOString())}
</div>
</div>
</div>
</body>
</html>
`;

const popup = window.open("", "_blank", "width=1000,height=800");
if (!popup) return;

popup.document.write(html);
popup.document.close();
popup.focus();
popup.print();
}, [patient, state, computeHdjSummary]);

const handleDownloadHdjPdf = useCallback(() => {
const html = `
<html>
<head>
<title>Parcours HDJ</title>
<style>
body {
font-family: Arial, sans-serif;
margin: 0;
padding: 32px;
background: #f8fbff;
color: #0f172a;
}
.page {
max-width: 900px;
margin: 0 auto;
background: #ffffff;
border: 1px solid #dbe4f0;
border-radius: 18px;
overflow: hidden;
}
.header {
background: linear-gradient(135deg, #17376a 0%, #1d4ed8 100%);
color: white;
padding: 24px 28px;
}
.header h1 {
margin: 0 0 6px 0;
font-size: 26px;
}
.header p {
margin: 0;
opacity: 0.95;
font-size: 14px;
}
.content {
padding: 24px 28px 30px;
}
.grid {
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 14px;
margin-bottom: 20px;
}
.card {
border: 1px solid #e2e8f0;
border-radius: 14px;
padding: 14px;
background: #f8fafc;
}
.label {
font-size: 11px;
text-transform: uppercase;
letter-spacing: .04em;
color: #64748b;
font-weight: 700;
margin-bottom: 4px;
}
.value {
font-size: 15px;
font-weight: 700;
color: #111827;
}
.section-title {
font-size: 16px;
font-weight: 800;
color: #17376a;
margin: 22px 0 10px;
}
.box {
border: 1px solid #dbe4f0;
border-radius: 14px;
padding: 16px;
background: white;
margin-bottom: 14px;
line-height: 1.5;
}
.chips {
margin-top: 8px;
}
.chip {
display: inline-block;
margin: 4px 6px 0 0;
padding: 6px 10px;
border-radius: 999px;
background: #eef4ff;
color: #17376a;
border: 1px solid #c7d7ff;
font-size: 12px;
font-weight: 700;
}
.footer {
margin-top: 24px;
font-size: 12px;
color: #64748b;
text-align: right;
}
</style>
</head>
<body>
<div class="page">
<div class="header">
<h1>Parcours HDJ</h1>
<p>Support secrétariat - CarAbbaS</p>
</div>

<div class="content">
<div class="grid">
<div class="card">
<div class="label">Patient</div>
<div class="value">${patient?.nom || ""} ${patient?.prenom || ""}</div>
</div>
<div class="card">
<div class="label">Date de naissance</div>
<div class="value">${patient?.dateNaissance ? formatShortDate(patient.dateNaissance) : "—"}</div>
</div>
<div class="card">
<div class="label">IEP</div>
<div class="value">${patient?.iep || patient?.IPP || patient?.identifiant || "—"}</div>
</div>
<div class="card">
<div class="label">Service</div>
<div class="value">${state.currentLocation?.service || patient?.service || "—"}</div>
</div>
<div class="card">
<div class="label">Chambre / lit</div>
<div class="value">${state.currentLocation?.chambre || patient?.chambre || "—"} / ${state.currentLocation?.lit || patient?.lit || "—"}</div>
</div>
<div class="card">
<div class="label">Date souhaitée HDJ</div>
<div class="value">${state.hdjForm?.requestedDate ? formatShortDate(state.hdjForm.requestedDate) : "—"}</div>
</div>
</div>

<div class="section-title">Organisation demandée</div>
<div class="box">
<div><strong>Titre :</strong> ${state.hdjForm?.title || "—"}</div>
<div><strong>Acteur porteur :</strong> ${state.hdjForm?.actor || "—"}</div>
<div><strong>Récurrence :</strong> ${state.hdjForm?.recurrence || "—"}</div>
<div><strong>Fréquence :</strong> ${state.hdjForm?.frequency || state.hdjForm?.frequencyCustom || "—"}</div>
<div><strong>Durée :</strong> ${state.hdjForm?.duration || state.hdjForm?.durationCustom || "—"}</div>
<div><strong>Nombre de séances :</strong> ${state.hdjForm?.customSessions || 1}</div>
${
state.hdjForm?.recurrence === "recurrent" && (state.hdjForm?.days || []).length > 0
? `<div><strong>Jours :</strong> ${(state.hdjForm?.days || []).join(", ")}</div>`
: ""
}
</div>

<div class="section-title">Objectif / contexte</div>
<div class="box">
${state.hdjForm?.objective || "Non renseigné"}
</div>

<div class="section-title">Actes retenus</div>
<div class="box">
${
(state.hdjForm?.acts || []).length > 0
? `<div class="chips">${(state.hdjForm?.acts || [])
.map((act) => `<span class="chip">${act}</span>`)
.join("")}</div>`
: "Aucun acte renseigné"
}
</div>

<div class="section-title">Commentaire</div>
<div class="box">
${state.hdjForm?.comment || "Aucun commentaire"}
</div>

<div class="section-title">Résumé automatique</div>
<div class="box">
${computeHdjSummary(state.hdjForm)}
</div>

<div class="footer">
Document généré le ${formatDateTime(new Date().toISOString())}
</div>
</div>
</div>
</body>
</html>
`;

const blob = new Blob([html], { type: "text/html;charset=utf-8" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `parcours_hdj_${patient?.nom || "patient"}_${patient?.prenom || ""}.html`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

setTimeout(() => URL.revokeObjectURL(url), 1000);
}, [patient, state]);


const getOrientationPriority = (orientation) => {
  switch (orientation) {
    case "EHPAD":
      return "Priorité : recherche de place et dossier d’admission";
    case "SSR / SMR":
      return "Priorité : recherche de place et délai de transfert";
    case "HAD":
      return "Priorité : validation des critères et coordination domicile";
    case "HDJ":
      return "Priorité : structuration du parcours et secrétariat";
    case "Retour domicile IDEL":
    case "Aide à domicile":
      return "Priorité : organisation du retour à domicile";
    default:
      return null;
  }
};


const getResourceUiStatus = (resourceId) => {
  const follow = state.resourceFollowUp?.[resourceId];
  const status = follow?.status || "none";

  switch (status) {
    case "draft":
      return { label: "À initier", tone: "blue" };
    case "sent":
    case "waiting":
      return { label: "En attente", tone: "amber" };
    case "followup":
      return { label: "À relancer", tone: "red" };
    case "accepted":
    case "programmed":
      return { label: "Validé", tone: "green" };
    case "refused":
      return { label: "Refusé", tone: "red" };
    case "needs_clarification":
      return { label: "À compléter", tone: "amber" };
    default:
      return { label: "Disponible", tone: "neutral" };
  }
};

  useEffect(() => {
    if (state.activeSection === "copilot") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.activeSection]);
  return (

     <div style={styles.page}>
<div style={styles.identityWrapper}>
<PatientIdentityBar
patient={patient}
actions={
<>
<button type="button" style={styles.secondaryBtn} onClick={openPatientView}>
Ouvrir vue patient
</button>

<button
type="button"
style={styles.secondaryBtn}
onClick={() => scrollToSection("section-actions")}
>
Aller aux actions
</button>

<button
type="button"
style={styles.primaryBtn}
onClick={() => scrollToSection("section-synthese")}
>
Voir la synthèse
</button>
</>
}
/>


</div>

      <div style={styles.shell}>

        
      <aside
className="pv-sidebar"
style={{
position: "sticky",
top: 84,
alignSelf: "start",
height: "calc(100vh - 96px)",
overflowY: "auto",
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
Copilote de coordination
</div>

{MENU_ITEMS.map((item) => {
const count = menuCounters[item.id] || 0;

return (
<button
key={item.id}
type="button"
onClick={() => scrollToSection(`section-${item.id}`)}
className={`pv-side-btn ${state.activeSection === item.id ? "is-active" : ""}`}
style={{
width: "100%",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
borderRadius: 16,
border: state.activeSection === item.id ? "1px solid #bfd3ff" : "1px solid #edf2f7",
background: state.activeSection === item.id ? "#eef4ff" : "#ffffff",
color: state.activeSection === item.id ? "#17376a" : "#0f172a",
fontWeight: 700,
padding: "12px 14px",
marginBottom: 8,
cursor: "pointer",
}}
>
<span className="pv-side-btn__label">{item.label}</span>

{count > 0 ? (
<span
className={`pv-side-btn__badge ${
item.id === "activite"
? "badge-amber"
: item.id === "actions"
? "badge-red"
: item.id === "demandes"
? "badge-amber"
: "badge-blue"
}`}
style={{
borderRadius: 999,
padding: "4px 8px",
fontSize: 11,
fontWeight: 800,
}}
>
{count}
</span>
) : null}
</button>
);
})}
</aside>



        <main style={styles.main}>

   
{/* =========================

          COPILOT TOP

          ========================= */}

          <section

            id="section-copilot"

            style={{

              display: state.activeSection === "copilot" ? "grid" : "none",

              ...styles.card,

            }}

          >

          <div style={styles.sectionHeaderBlock}>
<div>
<div style={styles.cardTitle}>Vue globale</div>
<div style={styles.smallNote}>Lecture rapide de la situation actuelle</div>
</div>

<div style={styles.pathSentence}>
{quickSummary.sentence}
</div>

<div style={styles.rowWrap}>
<span style={tagStyle("blue")}>
{currentSolution || quickSummary.situation || "Orientation à définir"}
</span>
<span style={tagStyle(complexity.color)}>
Complexité {complexity.label}
</span>
</div>
</div>

<div style={styles.careHeaderRow}>

<div style={styles.careSelectCard}>
<div style={styles.careSelectLabel}>Pilote du parcours</div>

<select
value={state.coordination?.responsableActuel || currentUser.name || ""}
onChange={(e) =>
persistCopilot((prev) => ({
coordination: {
...(prev.coordination || {}),
responsableActuel: e.target.value,
},
decisionLog: [
buildAutoDecisionLogEntry(
`Pilote du parcours : ${e.target.value}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}))
}
style={styles.careSelectInput}
>


<option value="">Sélectionner</option>
{serviceAgents.map((agent) => (
<option key={agent.id} value={agent.name}>
{agent.name}
</option>
))}
</select>
</div>



<div style={styles.careSelectCard}>
<div style={styles.careSelectLabel}>Médecin référent</div>
<select
value={state.coordination?.medecin || ""}
onChange={(e) =>
persistCopilot((prev) => ({
coordination: {
...(prev.coordination || {}),
medecin: e.target.value,
},
decisionLog: [
buildAutoDecisionLogEntry(
`Médecin référent : ${e.target.value}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}))
}
style={styles.careSelectInput}
>
<option value="">Sélectionner</option>
{serviceDoctors.map((doctor) => (
<option key={doctor.id} value={doctor.name}>
{doctor.name}
</option>
))}
</select>
</div>

<div style={styles.careItem}>
<span style={styles.careLabel}>Entrée</span>
<span style={styles.careValue}>{formatDateShort(entryDate)}</span>
</div>

<div style={styles.careItem}>
<span style={styles.careLabel}>Séjour</span>
<span style={styles.careValue}>J+{lengthOfStay}</span>
</div>

<div style={styles.careItem}>
<span style={styles.careLabel}>Jours évitables</span>
<span style={styles.careValue}>
{avoidableDays > 0 ? `${avoidableDays} j` : "—"}
</span>
</div>

<div style={styles.careItem}>
<span style={styles.careLabel}>Service</span>
<span style={styles.careValue}>{patient.service || "—"}</span>
</div>
</div>


<div style={styles.grid2}>
<div

style={{
...styles.infoCard,
...styles.alertCard,
...(quickSummary.tone === "red"
? styles.alertCardRed
: quickSummary.tone === "amber"
? styles.alertCardAmber
: styles.alertCardGreen),
}}
>
<div style={styles.blockTitle}>Blocage principal</div>
<div style={styles.alertMainText}>
{quickSummary.block || "Aucun identifié"}
</div>
</div>

<div style={{ ...styles.infoCard, ...styles.priorityCard }}>
<div style={styles.cardSubTitle}>À faire maintenant</div>



{recommendedNextAction?.sentence && (
<div style={styles.prioritySentence}>
{recommendedNextAction.sentence}
</div>
)}

{recommendedNextAction ? (
<button
type="button"
onClick={() => {
if (recommendedNextAction.section === "section-orientation") {
scrollToSection("section-orientation", orientationRef);
} else if (recommendedNextAction.section === "section-demandes") {
scrollToSection("section-demandes", demandeRef);
} else if (recommendedNextAction.section === "section-actions") {
scrollToSection("section-actions", actionRef);
} else {
scrollToSection(recommendedNextAction.section);
}
}}
style={styles.priorityButton}
>
{recommendedNextAction.label}
</button>
) : (
<div style={styles.smallNote}>Aucune priorité immédiate.</div>
)}
</div>


<div style={styles.infoCard}>
<div style={styles.cardSubTitle}>À anticiper</div>

{anticipations.length > 0 ? (
<div style={styles.stackXs}>
{anticipations.map((item, index) => (
<button
key={`${item.label}_${index}`}
type="button"
onClick={() => {
if (item.section === "section-orientation") {
scrollToSection("section-orientation", orientationRef);
} else if (item.section === "section-demandes") {
scrollToSection("section-demandes", demandeRef);
} else if (item.section === "section-actions") {
scrollToSection("section-actions", actionRef);
} else {
scrollToSection(item.section);
}
}}
style={styles.anticipationButton}
>
{item.label}
</button>
))}
</div>
) : (
<div style={styles.smallNote}>Aucun point à anticiper.</div>
)}
</div>

<div style={styles.infoCard}>
<div style={styles.cardHeader}>
<div style={styles.cardSubTitle}>Post-its</div>


</div>


{visiblePostits.length === 0 ? (
  <div style={styles.smallNote}>Aucun post-it actif.</div>
) : (
  visiblePostits.map((e) => (
    <div
      key={e.id}
      style={{
        ...styles.inlinePostit,
        ...getPostitsStyleByType(e.type),
      }}
    >
      <div style={styles.postitHeader}>
        <strong>{e.type}</strong>

        <div style={styles.rowWrap}>
          {!e.read ? <span style={styles.postitNotifDot} /> : null}

          <button
            type="button"
            style={styles.postitActionBtn}
            onClick={() => togglePostitMinimized(e.id)}
          >
            {e.isMinimized ? "+" : "–"}
          </button>

          <button
            type="button"
            style={styles.postitActionBtn}
            onClick={() => togglePostitOpen(e.id)}
          >
            ×
          </button>
        </div>
      </div>

      {!e.isMinimized ? (
        <>
          <div
            style={styles.postitText}
            onClick={() => markPostitAsRead(e.id)}
          >
            {e.text}
          </div>

          <div style={styles.postitMeta}>
            {e.author}
            {e.createdAt ? ` · ${formatRelativeTime(e.createdAt)}` : ""}
          </div>

          <div style={styles.rowWrap}>
            <div style={styles.postitChip}>{e.status}</div>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => movePostitToStatus(e.id, "À traiter")}
            >
              À traiter
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => movePostitToStatus(e.id, "En cours")}
            >
              En cours
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => movePostitToStatus(e.id, "En attente de réponse")}
            >
              En attente
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => movePostitToStatus(e.id, "Clos")}
            >
              Clos
            </button>
          </div>
        </>
      ) : null}
    </div>
  ))
)}
</div>
</div>

<div style={styles.infoCard}>
<div style={styles.cardSubTitle}>Suivi du parcours</div>
<div style={styles.smallNote}>Lecture rapide de l’état du parcours</div>

<div style={styles.copilotStatsGrid}>
<div style={styles.copilotStatBox}>
<div style={styles.copilotStatLabel}>Actions en cours</div>
<div style={styles.copilotStatValue}>
{safeArray(state.actions).filter((a) => a.status !== "Réalisé").length}
</div>
</div>

<div style={styles.copilotStatBox}>
<div style={styles.copilotStatLabel}>Demandes en attente</div>
<div style={styles.copilotStatValue}>
{Object.values(state.resourceFollowUp || {}).filter((r) =>
["draft", "sent", "waiting", "followup", "needs_clarification", "received", "programmed"].includes(r.status)
).length}
</div>
</div>

<div style={styles.copilotStatBox}>
<div style={styles.copilotStatLabel}>Niveau de complexité</div>
<div style={styles.copilotStatValue}>{complexity.label}</div>
</div>

<div style={styles.copilotStatBox}>
<div style={styles.copilotStatLabel}>Durée de séjour</div>
<div style={styles.copilotStatValue}>J+{lengthOfStay}</div>
</div>
</div>
</div>

<div style={styles.decisionQualificationGrid}>
{!isEditingDecision ? (
<div style={styles.infoCard}>
<div style={styles.cardHeader}>
  <div style={styles.cardSubTitle}>Décision de sortie</div>
  <button
    type="button"
    style={styles.secondaryBtn}
    onClick={() => setIsEditingDecision(true)}
  >
    Modifier
  </button>
</div>


<div style={styles.decisionHero}>
  <div style={styles.decisionHeroLabel}>Orientation retenue</div>
  <div style={styles.decisionHeroValue}>
    {state.currentSolutionOverride ||
      state.selectedOrientation ||
      patient?.copilotSummary?.currentSolution ||
      patient?.dischargePlanning?.solutionLabel ||
      patient?.solutionLabel ||
      "Non définie"}
  </div>
</div>


{/* 🔽 Suggestion Copilot */}

{orientationEngine?.primary && (
  <div style={styles.copilotSuggestionBox}>
    <div style={styles.copilotSuggestionLabel}>Suggestion du Copilot</div>

    <div style={styles.copilotSuggestionMain}>
      {orientationEngine.primary}
    </div>

    {orientationEngine.reasons?.length > 0 && (
      <div style={styles.rowWrap}>
        {orientationEngine.reasons.map((reason) => (
          <span
            key={reason}
            style={{
              display: "inline-block",
              background: "#eef2ff",
              color: "#3730a3",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {reason}
          </span>
        ))}
      </div>
    )}

    {(orientationEngine.alternative1 || orientationEngine.alternative2) && (
      <div style={styles.copilotSuggestionAlt}>
        Alternatives :{" "}
        {[orientationEngine.alternative1, orientationEngine.alternative2]
          .filter(Boolean)
          .join(" · ")}
      </div>
    )}
  </div>
)}

<div style={styles.decisionMetaCompactGrid}>
<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Date cible</div>
<div>
{state.targetDate
? formatShortDate(state.targetDate)
: patient?.copilotSummary?.targetDate
? formatShortDate(patient.copilotSummary.targetDate)
: patient?.dischargePlanning?.targetDateValidated
? formatShortDate(patient.dischargePlanning.targetDateValidated)
: patient?.dischargePlanning?.targetDateEnvisaged
? formatShortDate(patient.dischargePlanning.targetDateEnvisaged)
: "Non définie"}
</div>
</div>

<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Statut date cible</div>
<div>
{state.targetDateStatus ||
patient?.copilotSummary?.targetDateStatus ||
patient?.dischargePlanning?.targetDateStatus ||
"À définir"}
</div>
</div>

<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Sortant médicalement</div>
<div>{state.isMedicallyReady ? "Oui" : "Non"}</div>
</div>

<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Responsable</div>
<div>
{state.coordination?.responsableActuel ||
patient?.copilotSummary?.responsableActuel ||
patient?.nextAction?.owner ||
"Non renseigné"}
</div>
</div>
</div>


</div>

) : (
<div style={styles.infoCard}>
<div style={styles.cardSubTitle}>Modifier la décision</div>

<div style={styles.grid3}>
<div style={styles.fieldBlock}>
<label style={styles.label}>Type de sortie</label>
<select
value={state.dischargeType}
onChange={(e) => persistCopilot({ dischargeType: e.target.value })}
style={styles.selectSmall}
>
<option value="simple">Sortie simple</option>
<option value="coordination_legere">Coordination légère</option>
<option value="complexe">Coordination complexe</option>
</select>
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Date cible de sortie</label>
<input
type="date"
value={state.targetDate}
onChange={(e) => persistCopilot({ targetDate: e.target.value })}
style={styles.inputSmall}
/>
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Statut date cible</label>
<select
value={state.targetDateStatus}
onChange={(e) => persistCopilot({ targetDateStatus: e.target.value })}
style={styles.selectSmall}
>
{TARGET_STATUSES.map((status) => (
<option key={status} value={status}>
{status}
</option>
))}
</select>
</div>
</div>

<label style={styles.rowWrap}>
<input
type="checkbox"
checked={state.isMedicallyReady}
onChange={(e) =>
persistCopilot({
isMedicallyReady: e.target.checked,
medicalReadyDate: e.target.checked
? new Date().toISOString().slice(0, 10)
: "",
})
}
/>
<span>Sortant médicalement</span>
</label>

<div style={styles.rowWrap}>
<button
type="button"
style={styles.primaryBtn}
onClick={() => setIsEditingDecision(false)}
>
Enregistrer
</button>

<button
type="button"
style={styles.secondaryBtn}
onClick={() => setIsEditingDecision(false)}
>
Annuler
</button>
</div>
</div>
)}

<div style={styles.infoCard}>
  <div style={styles.cardHeader}>
    <div style={styles.cardSubTitle}>Qualification</div>
    <div style={styles.cardHeaderSpacer} />
  </div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Mots-clés suggérés par le recueil</label>

{suggestedKeywords.length === 0 ? (
<div style={styles.smallNote}>Aucune suggestion automatique.</div>
) : (
<div style={styles.stack}>
{Object.entries(groupedSuggestedKeywords).map(([nature, items]) => (
<div key={nature} style={styles.fieldBlock}>
<div style={styles.groupTitle}>{nature}</div>
<div style={styles.keywordWrap}>
{items.map((item) => {
const active = activeKeywords.some(
(kw) =>
normalizeKeywordLabel(kw.label) === normalizeKeywordLabel(item.label)
);

return (
<button
key={item.id}
type="button"
onClick={() => toggleSuggestedKeyword(item)}
style={{
...styles.keywordChip,
...(active ? styles.keywordChipActive : {}),
}}
>
{item.label}
</button>
);
})}
</div>
</div>
))}
</div>
)}
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Mots-clés actifs</label>
<div style={{ marginTop: 4 }}></div>

{activeKeywords.length === 0 ? (
<div style={styles.smallNote}>Aucun mot-clé actif.</div>
) : (
<div style={styles.stack}>
{Object.entries(groupedActiveKeywords).map(([nature, items]) => (
<div key={nature} style={styles.fieldBlock}>
<div style={styles.groupTitle}>{nature}</div>
<div style={styles.keywordWrap}>
{items.map((item) => (
<button
key={item.id}
type="button"
onClick={() => removeActiveKeyword(item.label)}
style={{ ...styles.keywordChip, ...styles.keywordChipActive }}
>
{item.label}
</button>
))}
</div>
</div>
))}
</div>
)}
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Ajouter un mot-clé</label>

<div style={styles.grid3}>
<input
value={state.newKeywordForm?.label || ""}
onChange={(e) =>
persistCopilot({
newKeywordForm: {
...(state.newKeywordForm || {}),
label: e.target.value,
},
})
}
placeholder="Ex : aidant épuisé"
style={styles.inputSmall}
/>

<select
value={state.newKeywordForm?.nature || ""}
onChange={(e) =>
persistCopilot({
newKeywordForm: {
...(state.newKeywordForm || {}),
nature: e.target.value,
},
})
}
style={styles.selectSmall}
>
<option value="">Nature obligatoire</option>
{KEYWORD_NATURES.map((nature) => (
<option key={nature} value={nature}>
{nature}
</option>
))}
</select>

<button
type="button"
onClick={addCustomKeyword}
style={styles.secondaryBtn}
>
Ajouter
</button>
</div>
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>Exemples utiles</label>
<div style={styles.keywordWrap}>
{KEYWORD_EXAMPLES.map((item, index) => (
<button
key={`${item.label}_${index}`}
type="button"
onClick={() =>
persistCopilot({
newKeywordForm: {
label: item.label,
nature: item.nature,
},
})
}
style={styles.keywordChip}
>
{item.label} · {item.nature}
</button>
))}
</div>
</div>
</div>
</div>

</section>


{/* =========================
ORIENTATION
========================= */}
<section
  id="section-orientation"
  style={{
    display: state.activeSection === "orientation" ? "grid" : "none",
    ...styles.card,
  }}
>
  <div style={styles.cardHeader}>
    <div style={styles.cardTitle}>Orientation</div>
    {state.selectedOrientation ? (
      <span style={tagStyle("blue")}>{state.selectedOrientation}</span>
    ) : (
      <span style={tagStyle("amber")}>À définir</span>
    )}
  </div>

  <div style={styles.sectionBanner}>
    <div style={styles.cardSubTitle}>Choisir une orientation cible</div>

    <div style={styles.orientationChipWrap}>
      {[
        "Retour domicile IDEL",
        "HAD",
        "EHPAD",
        "USLD",
        "SSR / SMR",
        "HDJ",
        "USP / Soins palliatifs",
        "Aide à domicile",
        "ASE / social",
      ].map((item) => (
        <button
          ref={item === "HAD" ? orientationRef : null}
          key={item}
          type="button"
          style={{
            ...styles.orientationChip,
            ...(state.selectedOrientation === item
              ? styles.orientationChipActive
              : {}),
          }}
          onClick={() => handleOrientationSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  </div>

  {state.selectedOrientation === "HDJ" ? (
    <div style={styles.sectionBanner}>
      <div style={styles.cardSubTitle}>Orientation HDJ retenue</div>

      <div style={styles.smallNote}>
        Construire un parcours HDJ sur mesure pour sécuriser une sortie plus
        précoce et éviter une hospitalisation prolongée.
      </div>

      <div style={styles.rowWrap}>
        <button
          type="button"
          style={styles.primaryBtn}
          onClick={() => {
            persistCopilot({
              showHdjForm: true,
              activeSection: "hdj",
            });

            setTimeout(() => {
              const el = document.getElementById("section-hdj");
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 92;
                window.scrollTo({
                  top: Math.max(y, 0),
                  behavior: "smooth",
                });
              }
            }, 0);
          }}
        >
          Construire le parcours HDJ
        </button>
      </div>
    </div>
  ) : null}

  {state.selectedOrientation === "HAD" ? (
    <div style={styles.infoCard}>
      <div style={styles.cardSubTitle}>Critères HAD</div>

      <div style={styles.keywordWrap}>
        {HAD_CRITERIA.map((criterion) => {
          const active = safeArray(state.hadEligibility?.checkedItems).includes(
            criterion
          );

          return (
            <button
              key={criterion}
              type="button"
              onClick={() => {
                const current = safeArray(state.hadEligibility?.checkedItems);
                const nextChecked = active
                  ? current.filter((item) => item !== criterion)
                  : [...current, criterion];

                persistCopilot({
                  hadEligibility: {
                    ...state.hadEligibility,
                    checkedItems: nextChecked,
                    eligible: nextChecked.length > 0,
                  },
                });
              }}
              style={{
                ...styles.keywordChip,
                ...(active ? styles.keywordChipActive : {}),
              }}
            >
              {criterion}
            </button>
          );
        })}
      </div>

      <div style={styles.rowWrap}>
        <span style={tagStyle(hadValidation?.tone || "red")}>
          {hadValidation?.message || "Évaluation HAD en attente"}
        </span>

        <a
          href="https://trajectoire.sante-ra.fr/Trajectoire/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.linkBtn}
        >
          Ouvrir ViaTrajectoire
        </a>
      </div>
    </div>
  ) : null}

  {state.selectedOrientation ? (
    <div style={styles.grid2}>
      <div style={styles.infoCard}>
        <div style={styles.cardSubTitle}>Décision retenue</div>

<div style={styles.infoCard}>
<div style={styles.cardSubTitle}>Dossiers administratifs</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>APA</label>
<div style={styles.keywordWrap}>
{DOSSIER_SUBTYPES.map((item) => {
const active = state.formsState?.apa?.subtype === item;
return (
<button
key={`apa_${item}`}
type="button"
onClick={() =>
persistCopilot((prev) => ({
formsState: {
...(prev.formsState || {}),
apa: {
...(prev.formsState?.apa || {}),
status: "En cours",
subtype: item,
updatedAt: new Date().toISOString(),
},
},
decisionLog: [
buildAutoDecisionLogEntry(
`APA : ${item}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}))
}
style={{
...styles.keywordChip,
...(active ? styles.keywordChipActive : {}),
}}
>
{item}
</button>
);
})}
</div>
</div>

<div style={styles.fieldBlock}>
<label style={styles.label}>MDPH</label>
<div style={styles.keywordWrap}>
{DOSSIER_SUBTYPES.map((item) => {
const active = state.formsState?.mdph?.subtype === item;
return (
<button
key={`mdph_${item}`}
type="button"
onClick={() =>
persistCopilot((prev) => ({
formsState: {
...(prev.formsState || {}),
mdph: {
...(prev.formsState?.mdph || {}),
status: "En cours",
subtype: item,
updatedAt: new Date().toISOString(),
},
},
decisionLog: [
buildAutoDecisionLogEntry(
`MDPH : ${item}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}))
}
style={{
...styles.keywordChip,
...(active ? styles.keywordChipActive : {}),
}}
>
{item}
</button>
);
})}
</div>
</div>
</div>



        <div style={styles.orientationMain}>{state.selectedOrientation}</div>

        <div style={styles.fieldBlock}>
          <label style={styles.label}>Plan B</label>
          
<div style={styles.keywordWrap}>
{getPlanBOptions(state.selectedOrientation).map((option) => {
const active = state.orientationPlanB === option;

return (
<button
key={option}
type="button"
onClick={() => persistCopilot({ orientationPlanB: option })}
style={{
...styles.keywordChip,
...(active ? styles.keywordChipActive : {}),
}}
>
{option}
</button>
);
})}
</div>

        </div>

        <div style={styles.fieldBlock}>
          <label style={styles.label}>Plan C</label>
          



<div style={styles.keywordWrap}>
{getPlanCOptions(state.selectedOrientation).map((option) => {
const active = state.orientationPlanC === option;

return (
<button
key={option}
type="button"
onClick={() => persistCopilot({ orientationPlanC: option })}
style={{
...styles.keywordChip,
...(active ? styles.keywordChipActive : {}),
}}
>
{option}
</button>
);
})}
</div>


        </div>

        <div style={styles.rowWrap}>
          <button
            type="button"
            style={styles.primaryBtn}
            onClick={() => scrollToSection("section-ressources")}
          >
            Voir les ressources
          </button>

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => scrollToSection("section-demandes")}
          >
            Gérer les demandes
          </button>
        </div>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.cardSubTitle}>Ressources suggérées</div>

        {state.selectedOrientation && (
  <div style={styles.orientationPriorityBox}>
    {getOrientationPriority(state.selectedOrientation)}
  </div>
)}

        {orientationPreviewResources.length === 0 &&
        !["EHPAD", "SSR / SMR", "HAD"].includes(state.selectedOrientation) ? (
          <div style={styles.smallNote}>
            Aucune ressource suggérée pour cette orientation.
          </div>
        ) : (
          <div style={styles.stack}>
  
             {orientationPreviewResources.map((r, index) => {
  const uiStatus = getResourceUiStatus(r.id);

  return (
    <div
      key={r.id}
      style={{
        ...styles.previewRow,
        ...(index === 0 ? styles.previewRowHighlight : {}),
      }}
    >
      <div>
        <div style={styles.previewTopRow}>
          <div style={styles.previewTitle}>{r.name}</div>
          <span style={tagStyle(uiStatus.tone)}>{uiStatus.label}</span>
        </div>

        <div style={styles.smallNote}>
          {r.family} · {r.subType}
        </div>
      </div>

      <div style={styles.rowWrap}>
        <button
          type="button"
          style={styles.secondaryBtn}
          onClick={() =>
updateResource(r.id, {
...(state.resourceFollowUp?.[r.id] || {}),
name: r.name,
status: "sent",
owner: currentUser.name,
initiatedAt: new Date().toISOString(),
lastReminderAt: "",
})
}
        >
          Initier
        </button>

        {r.formLink ? (
          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => openExternal(r.formLink)}
          >
            Ouvrir
          </button>
        ) : null}
      </div>
    </div>
  );
})}

            {state.selectedOrientation === "EHPAD" && (
              <div style={styles.previewRow}>
                <div>
                  <div style={styles.previewTitle}>ViaTrajectoire</div>
                  <div style={styles.smallNote}>
                    Recherche de places EHPAD et orientation grand âge.
                  </div>
                </div>

                <div style={styles.rowWrap}>
                  <a
                    href="https://trajectoire.sante-ra.fr/Trajectoire/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.linkBtn}
                  >
                    Ouvrir
                  </a>
                </div>
              </div>
            )}

            {state.selectedOrientation === "SSR / SMR" && (
              <div style={styles.previewRow}>
                <div>
                  <div style={styles.previewTitle}>ViaTrajectoire</div>
                  <div style={styles.smallNote}>
                    Recherche de places SSR / SMR et organisation de
                    rééducation.
                  </div>
                </div>

                <div style={styles.rowWrap}>
                  <a
                    href="https://trajectoire.sante-ra.fr/Trajectoire/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.linkBtn}
                  >
                    Ouvrir
                  </a>
                </div>
              </div>
            )}

            {state.selectedOrientation === "HAD" && (
              <div style={styles.previewRow}>
                <div>
                  <div style={styles.previewTitle}>ViaTrajectoire</div>
                  <div style={styles.smallNote}>
                    Accès HAD via ViaTrajectoire en complément des critères
                    d’éligibilité.
                  </div>
                </div>

                <div style={styles.rowWrap}>
                  <a
                    href="https://trajectoire.sante-ra.fr/Trajectoire/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.linkBtn}
                  >
                    Ouvrir
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={styles.rowWrap}>
          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => scrollToSection("section-ressources")}
          >
            Voir plus
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div style={styles.smallNote}>
      Sélectionne d’abord une orientation pour afficher les ressources utiles.
    </div>
  )}

  {state.selectedOrientation === "USP / Soins palliatifs" ? (
    <div style={styles.sectionBanner}>
      <div style={styles.cardSubTitle}>Accès USP</div>
      <div style={styles.rowWrap}>
        <button
          type="button"
          style={styles.primaryBtn}
          onClick={() => openExternal(FORM_LINKS.usp)}
        >
          Ouvrir dossier USP
        </button>
      </div>
    </div>
  ) : null}
</section>
  
{/* =========================
RESSOURCES
========================= */}
<section
id="section-ressources"
style={{
display: state.activeSection === "ressources" ? "grid" : "none",
...styles.card,
}}
>
<div style={styles.cardHeader}>
<div style={styles.cardTitle}>Ressources & parcours de sortie</div>

<div style={styles.rowWrap}>
<span style={styles.badge}>{demandCounters.relancer} à relancer</span>
<span style={styles.badge}>{demandCounters.attente} en attente</span>
<span style={styles.badge}>{demandCounters.acceptees} acceptées</span>
</div>
</div>

<input
placeholder="Recherche ressource / territoire / mot-clé"
value={state.resourceSearch}
onChange={(e) => persistCopilot({ resourceSearch: e.target.value })}
style={styles.input}
/>

{state.resourceSearch ? (
<div style={styles.smallNote}>Recherche actuelle : {state.resourceSearch}</div>
) : null}

<div
style={{
...styles.stack,
}}
>
{resourcesToShow.map((r) => {
const demand = state.resourceFollowUp?.[r.id];
const followMeta = getFollowMeta(demand);
const availability = getAvailabilityBadge(r);

return (

<div key={r.id} style={styles.resourceCard}>
<div style={styles.exchangeHead}>
<div>
<div style={styles.postitTitle}>{r.name}</div>
<div style={styles.smallNote}>
{r.family} · {r.subType} · {r.territory}
</div>
</div>

<div style={styles.rowWrap}>
<span style={tagStyle(followMeta.tone)}>{followMeta.label}</span>
<span style={tagStyle(availability.tone)}>{availability.label}</span>
</div>
</div>

<div style={styles.smallNote}>
{r.contactPerson || "Contact non renseigné"} · {r.phone || "Téléphone non renseigné"}
{r.email ? ` · ${r.email}` : ""}
</div>

<div style={styles.grid3}>
<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Conditions</div>
<div>{r.conditions || "—"}</div>
</div>

<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Délai</div>
<div>{r.delay || "—"}</div>
</div>

<div style={styles.infoMiniCard}>
<div style={styles.infoLabel}>Référent</div>
<div>{demand?.owner || "Non attribué"}</div>
</div>
</div>

<div style={styles.rowWrap}>
<button
type="button"
onClick={() =>
updateResource(r.id, {
...(state.resourceFollowUp?.[r.id] || {}),
name: r.name,
status: "draft",
})
}
style={styles.secondaryBtn}
>
Initier
</button>

{r.formLink ? (
<button
type="button"
onClick={() => openExternal(r.formLink)}
style={styles.secondaryBtn}
>
{r.id === "usp_valognes" ? "Ouvrir dossier USP" : "Ouvrir"}
</button>
) : null}
</div>
</div>
);
})}
</div>
</section>




{/* =========================
HDJ
==============================*/}
<section
  id="section-hdj"
  style={{
    display:
      state.activeSection === "hdj" || state.selectedOrientation === "HDJ"
        ? "grid"
        : "none",
    ...styles.card,
  }}
>
  <div style={styles.cardHeader}>
    <div style={styles.cardTitle}>Parcours HDJ</div>
    <div style={styles.rowWrap}>
      <span style={tagStyle("blue")}>Orientation HDJ</span>
      <span
        style={tagStyle(
          state.hdjStatus === "programmed"
? "green"
: state.hdjStatus === "received"
? "blue"
: state.hdjStatus === "validated"
? "green"
: "amber"
        )}
      >
        {state.hdjStatus || "draft"}
      </span>
    </div>
  </div>

  <div style={styles.sectionBanner}>
    <div style={styles.cardSubTitle}>Construire un parcours HDJ sur mesure</div>
    <div style={styles.smallNote}>
      Définir les objectifs, les actes, la fréquence, la date souhaitée et
      préparer un support propre pour le secrétariat.
    </div>
  </div>

  <div style={styles.rowWrap}>
    <button
      type="button"
      onClick={() =>
        persistCopilot({
          showHdjForm: !state.showHdjForm,
          activeSection: "hdj",
        })
      }
      style={styles.secondaryBtn}
    >
      {state.showHdjForm
        ? "Masquer le formulaire HDJ"
        : "Ouvrir le formulaire HDJ"}
    </button>
  </div>

  {similarHdj.length > 0 && (
    <div style={styles.infoCard}>
      <div style={styles.cardSubTitle}>Modèles HDJ suggérés</div>

      <div style={styles.stack}>
        {similarHdj.slice(0, 3).map((model) => (
          <button
            key={model.id}
            type="button"
            style={{ ...styles.formRow, cursor: "pointer" }}
            onClick={() => handleApplyHdjModel(model)}
          >
            <div>
              <div style={{ fontWeight: 800 }}>
                {model.title || model.label}
              </div>
              <div style={styles.smallNote}>
                {model.commonKeywords?.length > 0
                  ? `Mots-clés communs : ${model.commonKeywords.join(", ")}`
                  : "Modèle HDJ disponible"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )}

  {state.showHdjForm ? (
    <div style={styles.infoCard}>
      <div style={styles.hdjFormHeader}>
        <div>
          <div style={styles.cardSubTitle}>Construire un HDJ</div>
          <div style={styles.smallNote}>
            Définir le parcours, la fréquence, les actes et la date souhaitée.
          </div>
        </div>

        <span style={tagStyle("blue")}>
          {(state.hdjForm?.acts || []).length} acte(s) retenu(s)
        </span>
      </div>

      <div style={styles.hdjHero}>
        <div style={styles.hdjHeroMain}>
          <div style={styles.hdjHeroTitle}>
            {state.hdjForm?.title || "HDJ à définir"}
          </div>

          <div style={styles.hdjHeroMeta}>
            {state.hdjForm?.actor || "Acteur non défini"} ·{" "}
            {state.hdjForm?.frequency || "Fréquence"} ·{" "}
            {state.hdjForm?.duration || "Durée"}
          </div>
        </div>

        <div style={styles.hdjHeroBadge}>
          {(state.hdjForm?.acts || []).length} acte(s)
        </div>
      </div>

      <div style={styles.hdjSectionBox}>
        <div>
          <div style={styles.hdjSectionTitle}>Paramètres du parcours</div>
          <div style={styles.smallNote}>
            Renseigner les informations de cadrage du HDJ.
          </div>
        </div>

        <div style={styles.hdjFieldsGrid}>
          <div style={styles.fieldBlock}>
            <label style={styles.label}>Titre</label>
            <input
              value={state.hdjForm?.title || ""}
              onChange={(e) => updateHdjForm({ title: e.target.value })}
              style={styles.inputSmall}
              placeholder="Ex : HDJ gériatrique – autonomie"
            />
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Acteur porteur</label>
            <input
              value={state.hdjForm?.actor || ""}
              onChange={(e) => updateHdjForm({ actor: e.target.value })}
              style={styles.inputSmall}
              placeholder="Ex : Gériatre"
            />
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Date souhaitée</label>
            <input
              type="date"
              value={state.hdjForm?.requestedDate || ""}
              onChange={(e) =>
                updateHdjForm({ requestedDate: e.target.value })
              }
              style={styles.inputSmall}
            />
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Récurrence</label>
            <select
              value={state.hdjForm?.recurrence || "ponctuel"}
              onChange={(e) => updateHdjForm({ recurrence: e.target.value })}
              style={styles.selectSmall}
            >
              <option value="ponctuel">Ponctuel</option>
              <option value="recurrent">Récurrent</option>
            </select>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Fréquence</label>
            <select
              value={state.hdjForm?.frequency || ""}
              onChange={(e) => updateHdjForm({ frequency: e.target.value })}
              style={styles.selectSmall}
            >
              <option value="">Choisir</option>
              {HDJ_FREQUENCY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Durée</label>
            <select
              value={state.hdjForm?.duration || ""}
              onChange={(e) => updateHdjForm({ duration: e.target.value })}
              style={styles.selectSmall}
            >
              <option value="">Choisir</option>
              {HDJ_DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {state.hdjForm?.recurrence === "ponctuel" ? (
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Nombre de séances</label>
              <input
                type="number"
                min="1"
                value={state.hdjForm?.customSessions || 1}
                onChange={(e) =>
                  updateHdjForm({
                    customSessions: Number(e.target.value || 1),
                  })
                }
                style={styles.inputSmall}
              />
            </div>
          ) : null}

          {state.hdjForm?.frequency === "Personnalisé" ? (
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Fréquence personnalisée</label>
              <input
                value={state.hdjForm?.frequencyCustom || ""}
                onChange={(e) =>
                  updateHdjForm({ frequencyCustom: e.target.value })
                }
                style={styles.inputSmall}
                placeholder="Ex : 4 séances sur 2 semaines"
              />
            </div>
          ) : null}

          {state.hdjForm?.duration === "Personnalisé" ? (
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Durée personnalisée</label>
              <input
                value={state.hdjForm?.durationCustom || ""}
                onChange={(e) =>
                  updateHdjForm({ durationCustom: e.target.value })
                }
                style={styles.inputSmall}
                placeholder="Ex : 10 séances"
              />
            </div>
          ) : null}
        </div>

        {state.hdjForm?.recurrence === "recurrent" ? (
          <div style={styles.fieldBlock}>
            <label style={styles.label}>Jours</label>
            <div style={styles.keywordWrap}>
              {DAYS.map((day) => {
                const active = (state.hdjForm?.days || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const nextDays = active
                        ? (state.hdjForm?.days || []).filter((d) => d !== day)
                        : [...(state.hdjForm?.days || []), day];
                      updateHdjForm({ days: nextDays });
                    }}
                    style={{
                      ...styles.keywordChip,
                      ...(active ? styles.keywordChipActive : {}),
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div style={styles.fieldBlock}>
          <label style={styles.label}>Objectif / contexte</label>
          <textarea
            value={state.hdjForm?.objective || ""}
            onChange={(e) => updateHdjForm({ objective: e.target.value })}
            style={styles.hdjTextarea}
            placeholder="Préciser l’objectif du parcours HDJ"
          />
        </div>
      </div>

      <div style={styles.hdjSectionBox}>
        <div style={styles.hdjSectionTitle}>Actes proposés</div>

        <div style={styles.hdjActsGrid}>
          {Object.entries(HDJ_ACTS).map(([group, acts]) => (
            <div key={group} style={styles.hdjActsCategoryCard}>
              <div style={styles.hdjActsGroupTitle}>{group}</div>

              <div style={styles.keywordWrap}>
                {acts.map((act) => {
                  const active = (state.hdjForm?.acts || []).includes(act);

                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => {
                        const nextActs = active
                          ? (state.hdjForm?.acts || []).filter(
                              (a) => a !== act
                            )
                          : [...(state.hdjForm?.acts || []), act];

                        updateHdjForm({ acts: nextActs });
                      }}
                      style={{
                        ...styles.hdjActChip,
                        ...(active ? styles.hdjActChipActive : {}),
                      }}
                    >
                      {act}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.hdjSelectedActsBox}>
          <div style={styles.hdjActsGroupTitle}>Actes retenus</div>

          <div style={styles.keywordWrap}>
            {(state.hdjForm?.acts || []).length === 0 ? (
              <div style={{ color: "#64748b" }}>Aucun acte sélectionné</div>
            ) : (
              state.hdjForm.acts.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => removeHdjAct(act)}
                  style={{ ...styles.hdjActChip, ...styles.hdjActChipActive }}
                >
                  {act} ×
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={styles.hdjSectionBox}>
        <div style={styles.hdjSectionTitle}>Personnalisation</div>

        <div style={styles.fieldBlock}>
          <label style={styles.label}>Ajouter un acte libre</label>
          <div style={styles.rowWrap}>
            <input
              value={state.customActInput || ""}
              onChange={(e) =>
                persistCopilot({ customActInput: e.target.value })
              }
              style={styles.inputSmall}
              placeholder="Ex : bilan douleur, ECG..."
            />
            <button
              type="button"
              onClick={addHdjAct}
              style={styles.ghostBtn}
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div style={styles.fieldBlock}>
          <label style={styles.label}>Commentaire</label>
          <textarea
            value={state.hdjForm?.comment || ""}
            onChange={(e) => updateHdjForm({ comment: e.target.value })}
            style={styles.hdjTextareaSmall}
          />
        </div>
      </div>

      <div style={styles.summaryBoxLight}>
        <strong>Résumé automatique :</strong>
        <div>{computeHdjSummary(state.hdjForm)}</div>
      </div>

      <div style={styles.hdjFooterBar}>
        <div style={styles.rowWrap}>
          <button
            type="button"
            onClick={handlePreviewHdj}
            style={styles.secondaryBtn}
          >
            {state.hdjMailPreviewOpen ? "Masquer l’aperçu" : "Prévisualiser"}
          </button>

          <button
            type="button"
            onClick={handlePrintHdj}
            style={styles.secondaryBtn}
          >
            Imprimer
          </button>

          <button
            type="button"
            onClick={handleDownloadHdjPdf}
            style={styles.secondaryBtn}
          >
            Télécharger
          </button>
        </div>

        <div style={styles.rowWrap}>
          <button
            type="button"
            onClick={() => persistCopilot({ hdjStatus: "followup" })}
            style={styles.secondaryBtn}
          >
            Relancer
          </button>

          <button
            type="button"
            onClick={() => persistCopilot({ hdjStatus: "received" })}
            style={styles.secondaryBtn}
          >
            Reçu
          </button>

          <button
            type="button"
            onClick={() => persistCopilot({ hdjStatus: "programmed" })}
            style={styles.secondaryBtn}
          >
            Programmé
          </button>


<button
type="button"
onClick={() => {
if (!state.hdjForm?.objective?.trim()) {
alert("Objectif HDJ manquant");
return;
}
if (!state.hdjForm?.actor?.trim()) {
alert("Acteur porteur HDJ manquant");
return;
}
if (!state.hdjForm?.requestedDate) {
alert("Date souhaitée manquante");
return;
}
if ((state.hdjForm?.acts || []).length === 0) {
alert("Au moins un acte HDJ est obligatoire");
return;
}

persistCopilot((prev) => ({
hdjStatus: "validated",
hdjForm: {
...(prev.hdjForm || {}),
validatedAt: new Date().toISOString(),
validatedBy: currentUser.name,
},
decisionLog: [
buildAutoDecisionLogEntry(
`HDJ validé : ${(prev.hdjForm?.title || "HDJ")}`,
currentUser.name
),
...safeArray(prev.decisionLog),
],
}));

alert("HDJ validé et synchronisé.");
}}
style={styles.primaryBtn}
>
Valider le HDJ
</button>



          <button
            type="button"
            onClick={() => {
              if (!state.hdjForm?.objective?.trim()) {
                alert("Objectif HDJ manquant");
                return;
              }
              if (!state.hdjForm?.actor?.trim()) {
                alert("Acteur porteur HDJ manquant");
                return;
              }
              if (!state.hdjForm?.requestedDate) {
                alert("Date souhaitée manquante");
                return;
              }
              if ((state.hdjForm?.acts || []).length === 0) {
                alert("Au moins un acte HDJ est obligatoire");
                return;
              }

              const mailText = buildHdjMail({
                patient,
                currentLocation: state.currentLocation,
                coordination: state.coordination,
                targetDate: state.targetDate,
                hdjForm: state.hdjForm,
              });

              persistCopilot((prev) => ({
                hdjSendLog: [
                  {
                    id: `hdj_mail_${Date.now()}`,
                    to: HDJ_SECRETARIAT_EMAIL,
                    sentAt: new Date().toISOString(),
                    body: mailText,
                  },
                  ...(prev.hdjSendLog || []),
                ],
                hdjStatus: "waiting",
                hdjMailPreviewOpen: true,
              }));

              alert("Synthèse HDJ préparée pour le secrétariat.");
            }}
            style={styles.primaryBtn}
          >
            Envoyer au secrétariat
          </button>
        </div>
      </div>

      {state.hdjMailPreviewOpen ? (
        <div style={styles.historyBox}>
          <div style={styles.infoLabel}>
            Synthèse secrétariat HDJ ({HDJ_SECRETARIAT_EMAIL})
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {buildHdjMail({
              patient,
              currentLocation: state.currentLocation,
              coordination: state.coordination,
              targetDate: state.targetDate,
              hdjForm: state.hdjForm,
            })}
          </pre>
        </div>
      ) : null}

      {(state.hdjSendLog || []).length > 0 ? (
        <div style={styles.historyBox}>
          <div style={styles.infoLabel}>Historique envois HDJ</div>
          {(state.hdjSendLog || []).map((mail) => (
            <div key={mail.id} style={styles.smallNote}>
              {formatDateTime(mail.sentAt)} · envoyé à {mail.to}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ) : null}
</section>


{/* =========================
DEMANDES EXTERNES
========================= */}
<section
id="section-demandes"
style={{
display: state.activeSection === "demandes" ? "grid" : "none",
...styles.card,
}}
>

<div style={styles.cardHeader}>
<div style={styles.cardTitle}>Demandes externes</div>
<div style={styles.rowWrap}>
<span style={styles.badge}>{demandCounters.relancer} à relancer</span>
<span style={styles.badge}>{demandCounters.attente} en attente</span>
<span style={styles.badge}>{demandCounters.acceptees} acceptées</span>
</div>
</div>

{Object.keys(state.resourceFollowUp || {}).length === 0 ? (
<div style={styles.smallNote}>Aucune demande tracée pour le moment.</div>
) : (
<div style={styles.stack}>
{Object.entries(state.resourceFollowUp)
.sort(([, a], [, b]) => {
const priorityOrder = {
followup: 0,
needs_clarification: 1,
waiting: 2,
sent: 3,
received: 4,
programmed: 5,
accepted: 6,
refused: 7,
closed: 8,
draft: 9,
};
return (priorityOrder[a?.status] ?? 99) - (priorityOrder[b?.status] ?? 99);
})
.map(([resourceId, demand]) => {
const resource = mergedResources.find((r) => r.id === resourceId);
const followMeta = getFollowMeta(demand);
const historyItems = state.resourceHistory?.[resourceId] || [];
const isExpanded = state.expandedHistory?.[resourceId] || false;


return (
<div key={resourceId} style={styles.workflowCard}>
<div style={styles.workflowHeader}>
<div>
<div style={styles.workflowTitle}>
{resource?.name || demand?.name || resourceId}
</div>
<div style={styles.smallNote}>
{resource?.family || "Ressource"}
</div>
</div>

<span style={tagStyle(followMeta.tone)}>
{followMeta.label}
</span>
</div>

<div style={styles.workflowSentence}>
  {historyItems.length > 0 && (
<div style={styles.historyBlock}>
<div style={styles.historyTitle}>Historique</div>

<div style={styles.historyList}>
{(isExpanded ? historyItems : historyItems.slice(0, 3)).map((item, index) => (
<div key={index} style={styles.historyItem}>
<span style={styles.historyItemLabel}>{item.label}</span>

{item.reason ? (
<span style={styles.historyItemReason}> — {item.reason}</span>
) : null}

<div style={styles.historyItemMeta}>
{formatRelativeTime(item.at)}
{item.by ? ` · ${item.by}${item.role ? ` (${item.role})` : ""}` : ""}

</div>
</div>
))}
</div>

{historyItems.length > 3 && (
<div
style={styles.historyToggle}
onClick={() =>
setState((prev) => ({
...prev,
expandedHistory: {
...prev.expandedHistory,
[resourceId]: !prev.expandedHistory?.[resourceId],
},
}))
}
>
{isExpanded ? "Voir moins" : "Voir plus"}
</div>
)}
</div>
)}

{demand?.status === "followup" && "Relance à faire maintenant"}
{demand?.status === "needs_clarification" && "Informations à compléter"}
{demand?.status === "waiting" && "En attente de réponse"}
{demand?.status === "sent" && "Demande envoyée"}
{demand?.status === "accepted" && "Acceptée"}
{demand?.status === "refused" && "Refusée"}
{demand?.status === "abandoned" && "Abandonnée"}
{(!demand?.status || demand?.status === "draft") && "À initier"}
{demand?.status === "refused" && demand?.refusalReason && (
<div style={styles.motifInline}>
 {demand.refusalReason}
</div>
)}

{demand?.status === "abandoned" && demand?.abandonReason && (
<div style={styles.motifInline}>
Abandon : {demand.abandonReason}
</div>
)}
</div>


 
<div style={styles.workflowActions}>
<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
resourceFollowUp: {
...prev.resourceFollowUp,
[resourceId]: {
...(prev.resourceFollowUp?.[resourceId] || {}),
...demand,
status: "followup",
},
},
resourceHistory: pushResourceHistory(prev, resourceId, {
type: "followup",
label: "Relance",
by: "Utilisateur",
}),
}))
}
style={{
...styles.secondaryBtn,
...(demand?.status === "followup" ? styles.primaryBtn : {}),
}}
>
Relancer
</button>

<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
resourceFollowUp: {
...prev.resourceFollowUp,
[resourceId]: {
...(prev.resourceFollowUp?.[resourceId] || {}),
...demand,
status: "waiting",
},
},
resourceHistory: pushResourceHistory(prev, resourceId, {
type: "waiting",
label: "Passée en attente",
by: "Utilisateur",
}),
}))
}
style={{
...styles.secondaryBtn,
...(demand?.status === "waiting" ? styles.waitingBtnActive : {}),
}}
>
Attente
</button>

<button
onClick={() =>
setState((prev) => ({
...prev,
resourceFollowUp: {
...prev.resourceFollowUp,
[resourceId]: {
...(prev.resourceFollowUp?.[resourceId] || {}),
...demand,
status: "accepted",
},
},
resourceHistory: pushResourceHistory(prev, resourceId, {
type: "accepted",
label: "Acceptée",
by: "Utilisateur",
}),
}))
}
style={{
...styles.secondaryBtn,
...(demand?.status === "accepted" ? styles.acceptedBtnActive : {}),
}}
>
Accepter
</button>

<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
pendingRefusalResourceId: resourceId,
pendingRefusalReason: demand?.refusalReason || REFUSAL_REASONS[0],
}))
}
style={{
...styles.secondaryBtn,
...(demand?.status === "refused" ? styles.refusalBtnActive : {}),
}}
>
Refus
</button>

<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
pendingAbandonResourceId: resourceId,
pendingAbandonReason: demand?.abandonReason || ABANDON_REASONS[0],
}))
}
style={{
...styles.secondaryBtn,
...(demand?.status === "abandoned" ? styles.abandonBtnActive : {}),
}}
>
Abandonner
</button>
</div>
</div>
);
})}
</div>
)}

{state.pendingAbandonResourceId ? (
<div style={styles.modalOverlay}>
<div style={styles.modal}>
<div style={styles.modalTitle}>Motif d’abandon</div>

<select
value={state.pendingAbandonReason}
onChange={(e) =>
setState((prev) => ({
...prev,
pendingAbandonReason: e.target.value,
}))
}
style={styles.select}
>
{ABANDON_REASONS.map((r) => (
<option key={r} value={r}>
{r}
</option>
))}
</select>

<div style={styles.modalActions}>
<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
pendingAbandonResourceId: null,
}))
}
style={styles.secondaryBtn}
>
Annuler
</button>

<button
type="button"
onClick={() => {
setState((prev) => ({
...prev,
resourceFollowUp: {
...prev.resourceFollowUp,
[prev.pendingAbandonResourceId]: {
...(prev.resourceFollowUp?.[prev.pendingAbandonResourceId] || {}),
status: "abandoned",
abandonReason: prev.pendingAbandonReason,
},
},
pendingAbandonResourceId: null,
}));
}}
style={styles.primaryBtn}
>
Confirmer abandon
</button>
</div>
</div>
</div>
) : null}

{state.pendingRefusalResourceId ? (
<div style={styles.modalOverlay}>
<div style={styles.modal}>
<div style={styles.modalTitle}>
Motif du refus prestataire
</div>

<select
value={state.pendingRefusalReason}
onChange={(e) =>
setState((prev) => ({
...prev,
pendingRefusalReason: e.target.value,
}))
}
style={styles.select}
>
{REFUSAL_REASONS.map((r) => (
<option key={r} value={r}>
{r}
</option>
))}
</select>

<div style={styles.modalActions}>
<button
type="button"
onClick={() =>
setState((prev) => ({
...prev,
pendingRefusalResourceId: null,
}))
}
style={styles.secondaryBtn}
>
Annuler
</button>

<button
type="button"
disabled={!state.pendingRefusalReason}
onClick={() => {
setState((prev) => ({
...prev,
resourceFollowUp: {
...prev.resourceFollowUp,
[prev.pendingRefusalResourceId]: {
...(prev.resourceFollowUp?.[prev.pendingRefusalResourceId] || {}),
status: "refused",
refusalReason: prev.pendingRefusalReason,
},
},
resourceHistory: pushResourceHistory(prev, prev.pendingRefusalResourceId, {
type: "refused",
label: "Refusée",
reason: prev.pendingRefusalReason,
by: "Utilisateur",
}),
pendingRefusalResourceId: null,
}));
}}
style={{
...styles.primaryBtn,
opacity: !state.pendingRefusalReason ? 0.5 : 1,
cursor: !state.pendingRefusalReason ? "not-allowed" : "pointer",
}}
>
Confirmer refus
</button>
</div>
</div>
</div>
) : null}
</section>



{/* =========================
SYNTHESE + HDJ
========================= */}
<section
id="section-synthese"
style={{
display: state.activeSection === "synthese" ? "grid" : "none",
...styles.card,
}}
>
<div style={styles.cardHeader}>
<div style={styles.cardTitle}>Synthèse</div>
<button type="button" onClick={exportSynthesis} style={styles.secondaryBtn}>
Copier la synthèse
</button>
</div>

<div style={styles.summaryBox}>
<div><strong>Situation :</strong> {quickSummary.situation || "—"}</div>
<div><strong>Blocage principal :</strong> {quickSummary.block || "—"}</div>
<div><strong>Stratégie :</strong> {quickSummary.strategy || state.selectedOrientation || "—"}</div>
<div><strong>Prochaine action :</strong> {quickSummary.nextAction || "—"}</div>
<div><strong>Pilotage :</strong> {quickSummary.owner || state.coordination?.responsableActuel || "—"}</div>
<div><strong>Date cible :</strong> {state.targetDate ? formatShortDate(state.targetDate) : "Non définie"}</div>
<div><strong>Orientation :</strong> {state.selectedOrientation || "À définir"}</div>
<div><strong>Plan B :</strong> {state.orientationPlanB || "—"}</div>
<div><strong>Plan C :</strong> {state.orientationPlanC || "—"}</div>
</div>

<div style={styles.sectionBanner}>
<div style={styles.cardSubTitle}>Décisions</div>

<textarea
value={state.decisionDraft}
onChange={(e) => persistCopilot({ decisionDraft: e.target.value })}
style={styles.textarea}
placeholder="Tracer une décision de coordination..."
/>

<div style={styles.rowWrap}>
<button
type="button"
style={styles.primaryBtn}
onClick={() => {
const clean = String(state.decisionDraft || "").trim();
if (!clean) return;

persistCopilot((prev) => ({
decisionLog: [
{
id: `dec_${Date.now()}`,
text: clean,
date: new Date().toISOString(),
},
...prev.decisionLog,
],
decisionDraft: "",
}));
}}
>
Ajouter la décision
</button>
</div>

{state.decisionLog.length > 0 ? (
<div style={styles.historyBox}>
{state.decisionLog.map((decision) => (
<div key={decision.id} style={styles.smallNote}>
{formatDateTime(decision.date)} · {decision.text}
</div>
))}
</div>
) : (
<div style={styles.smallNote}>Aucune décision tracée.</div>
)}
</div>
</section>
<button
  type="button"
  style={styles.postitFab}
  onClick={() => setShowPostitComposer(true)}
>
  {postitNotificationsCount > 0 ? `+ ${postitNotificationsCount}` : "+"}
</button>

{showPostitComposer && (
<div style={styles.postitComposer}>
<select
value={newPostit.type}
onChange={(e) =>
setNewPostit((prev) => ({ ...prev, type: e.target.value }))
}
style={styles.selectSmall}
>
<option value="Info">Info</option>
<option value="Urgent">Urgent</option>
<option value="Action">Action</option>
<option value="Famille">Famille</option>
</select>

<textarea
placeholder="Écrire un post-it..."
value={newPostit.text}
onChange={(e) =>
setNewPostit((prev) => ({ ...prev, text: e.target.value }))
}
style={styles.textarea}
/>

<div style={styles.rowWrap}>
<button
type="button"
style={styles.secondaryBtn}
onClick={() => setShowPostitComposer(false)}
>
Annuler
</button>

<button
type="button"
style={styles.primaryBtn}
onClick={addPostitToActivity}
>
Ajouter
</button>
</div>
</div>
)}
</main>
</div>
</div>
);
}

/* =========================
STYLES
========================= */

const styles = {
page: {
padding: 16,
background: "linear-gradient(180deg, rgba(245,248,255,1) 0%, rgba(249,250,252,1) 100%)",
minHeight: "100%",
},
identityFullWidth: {
width: "100%",
marginBotton: 24,
},


careSelectCard: {
background: "#ffffff",
border: "1px solid #e2e8f0",
borderRadius: 14,
padding: "10px 12px",
display: "grid",
gap: 4,
minWidth: 200,
},

careSelectLabel: {
fontSize: 11,
color: "#64748b",
fontWeight: 700,
textTransform: "uppercase",
},

careSelectInput: {
minHeight: 36,
borderRadius: 10,
border: "1px solid #dbe4f0",
background: "#f8fbff",
fontWeight: 600,
padding: "0 8px",
},


identityWrapper: {
width: "100%",
marginBottom: 24,
paddingBottom: 8,
borderBottom: "1px solid #e2e8f0",
},
page: {
width: "100%",
padding: 16,
boxSizing: "border-box",
},
identityInner: {
maxWidth: 1200,
margin: "0 auto",
padding: "12px 16px",
},
page: {
  width: "100",
},
identityFullWidth: {
width: "100%",
padding: "0 16px",
boxSizing: "border-box",
},
decisionQualificationGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  alignItems: "start",
},


infoCard: {
  background: "#f8fafc",
  border: "1px solid #e4ebf3",
  borderRadius: 16,
  padding: 16,
  display: "grid",
  gap: 10,
  alignContent: "start",
},

cardHeaderSpacer: {
  width: 96,
  height: 1,
},

previewTopRow: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
},

previewRowHighlight: {
  border: "2px solid #3b82f6",
  background: "#eff6ff",
},

orientationPriorityBox: {
  marginTop: 8,
  marginBottom: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  color: "#075985",
  fontWeight: 700,
  fontSize: 13,
},

orientationPriorityBox: {
  marginTop: 8,
  marginBottom: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  color: "#075985",
  fontWeight: 700,
  fontSize: 13,
},

anticipationButton: {
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  color: "#17376a",
  padding: "0 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  width: "100%",
},
linkBtn: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 34,
  borderRadius: 10,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "0 12px",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 12,
},

hdjFormHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
},

hdjHero: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: "16px 18px",
  borderRadius: 16,
  background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
  border: "1px solid #dbeafe",
},

hdjHeroMain: {
  display: "grid",
  gap: 4,
},

hdjHeroTitle: {
  fontSize: 22,
  fontWeight: 900,
  color: "#17376a",
},

hdjHeroMeta: {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 600,
},

hdjHeroBadge: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
},

hdjSectionBox: {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 14,
},



hdjFieldsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
  alignItems: "start",
},


hdjActsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
},

hdjActsCategoryCard: {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  backgroundColor: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  gap: 8,
},

hdjActsGroupTitle: {
  fontSize: 13,
  fontWeight: 700,
  color: "#1e293b",
  marginBottom: 4,
  textTransform: "capitalize",
},

hdjActChip: {
  height: 28,
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  padding: "0 10px",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
},

hdjActChipActive: {
  background: "#dbeafe",
  borderColor: "#93c5fd",
  color: "#1e3a8a",
},

hdjSelectedActsBox: {
  marginTop: 12,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#eef2ff",
  border: "1px solid #c7d2fe",
},

hdjTextarea: {
  minHeight: 96,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  padding: 10,
  background: "#fff",
  resize: "vertical",
  width: "100%",
},

hdjTextareaSmall: {
  minHeight: 84,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  padding: 10,
  background: "#fff",
  resize: "vertical",
  width: "100%",
},

summaryBoxLight: {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 12,
  padding: 10,
  fontSize: 12,
  color: "#475569",
},

hdjFooterBar: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
},

hdjSelectedActsBox: {
  marginTop: 12,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#eef2ff",
  border: "1px solid #c7d2fe",
},

hdjActsCategoryCard: {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  backgroundColor: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  gap: 8,
},

hdjActsGroupTitle: {
  fontSize: 13,
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: 4,
  textTransform: "capitalize",
},

hdjActsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
},

hdjHero: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: "16px 18px",
  borderRadius: 16,
  background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
  border: "1px solid #dbeafe",
},

hdjHeroMain: {
  display: "grid",
  gap: 4,
},

hdjHeroTitle: {
  fontSize: 22,
  fontWeight: 900,
  color: "#17376a",
},

hdjHeroMeta: {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 600,
},

hdjHeroBadge: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
},

hdjFieldsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
},

hdjFieldCard: {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 8,
},

hdjActsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
},

hdjActsCategoryCard: {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 10,
},

hdjActsGroupTitle: {
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  textTransform: "capitalize",
},

hdjActsGroup: {
  display: "grid",
  gap: 6,
},

fieldBlock: {
  display: "grid",
  gap: 8,
},

label: {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  letterSpacing: "0.01em",
},

hdjActsGroupTitle: {
  fontSize: 12,
  fontWeight: 800,
  color: "#475569",
  textTransform: "capitalize",
},

hdjActChip: {
  height: 28,
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  padding: "0 10px",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
},

hdjActChipActive: {
  background: "#dbeafe",
  borderColor: "#93c5fd",
  color: "#1e3a8a",
},

hdjFormHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
},

hdjSectionBox: {
  border: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderRadius: 18,
  padding: 20,
  display: "grid",
  gap: 18,
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
},

hdjSectionTitle: {
  fontSize: 16,
  fontWeight: 900,
  color: "#17376a",
  marginBottom: 2,
},
label: {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 4,
},

infoLabel: {
  fontSize: 10,
  color: "#64748b",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
},

infoMiniValue: {
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
},

decisionMetaCompactGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
},

copilotSuggestionBox: {
  background: "#f8fafc",
border: "1px dashed #e2e8f0",
  borderRadius: 12,
  padding: "12px 16px",
  display: "grid",
  gap: 8,
},


copilotSuggestionMain: {
   fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.1,
},


copilotSuggestionLabel: {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
},

copilotSuggestionMain: {
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
},

copilotSuggestionAlt: {
  fontSize: 13,
  color: "#475569",
  fontWeight: 600,
},

decisionHero: {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 6,
},

decisionHeroLabel: {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
},

decisionHeroValue: {
  fontSize: 28,
  fontWeight: 900,
  color: "#17376a",
  lineHeight: 1.1,
},

keywordChip: {
  height: 24,
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  padding: "0 8px",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
},

mainSingle: {
display: "grid",
gap: 16,
},

contentWithSidebar: {
display: "grid",
gridTemplateColumns: "260px 1fr",
gap: 16,
alignItems: "start",
},

sidebarUnderIdentity: {
position: "sticky",
top: 16,
alignSelf: "start",
maxHeight: "calc(100vh - 32px)",
overflowY: "auto",
border: "1px solid #dbe4f0",
borderRadius: 22,
background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
padding: 12,
},


postitContainer: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
},

cardHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
},

addBtn: {
width: 26,
height: 26,
borderRadius: "50%",
border: "none",
background: "#ffd54f",
fontWeight: "bold",
cursor: "pointer",
},
cardHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
},

addBtn: {
width: 26,
height: 26,
borderRadius: "50%",
border: "none",
background: "#ffd54f",
fontWeight: "bold",
cursor: "pointer",
},

cardHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
},

addBtn: {
width: 26,
height: 26,
borderRadius: "50%",
border: "none",
background: "#ffd54f",
fontWeight: "bold",
cursor: "pointer",
},

grid2: {
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 16,
},
postitSection: {
marginTop: 12,
display: "flex",
justifyContent: "center", // 🔥 centre horizontal
alignItems: "center",
flexWrap: "wrap",
gap: 12,
},

inlinePostit: {
  width: "100%",
  minHeight: "150px",
  padding: "16px",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  gap: 10,
},

postitMiniChip: {
minHeight: 40,
borderRadius: 999,
padding: "0 10px",
display: "inline-flex",
alignItems: "center",
boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
pointerEvents: "auto",
},

postitMiniButton: {
border: "none",
background: "transparent",
display: "inline-flex",
alignItems: "center",
gap: 8,
fontWeight: 800,
cursor: "pointer",
padding: 0,
},

postitNotifDot: {
width: 8,
height: 8,
borderRadius: "50%",
background: "#ef4444",
display: "inline-block",
},


postitFab: {
position: "fixed",
right: 20,
bottom: 20,
zIndex: 10002,
width: 44,
height: 44,
borderRadius: "50%",
border: "none",
background: "#facc15",
color: "#111827",
fontSize: 24,
fontWeight: 900,
cursor: "pointer",
boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
},

postitComposer: {
position: "fixed",
right: 20,
bottom: 76,
width: 280,
zIndex: 10003,
background: "#ffffff",
border: "1px solid #e5e7eb",
borderRadius: 14,
padding: 12,
display: "grid",
gap: 10,
boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
},

floatingLayer: {
position: 'fixed',
bottom: 20,
right: 20,
display: 'flex',
flexDirection: 'column',
gap: 12,
zIndex: 9999,
pointerEvents: 'none',
},

floatingPostit: {
width: 220,
borderRadius: 16,
padding: 12,
display: "grid",
gap: 8,
pointerEvents: 'auto',
},

postitHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 8,
},

postitActionBtn: {
width: 28,
height: 28,
borderRadius: "50%",
border: "none",
background: "rgba(255,255,255,0.7)",
cursor: "pointer",
fontWeight: 900,
},

postitText: {
fontSize: 16,
lineHeight: 1.35,
fontWeight: 700,
color: "#1f2937",
},

postitMeta: {
fontSize: 12,
color: "#6b7280",
},

postitChip: {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  minHeight: 24,
  padding: "0 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.65)",
  fontSize: 11,
  fontWeight: 800,
},


motifInline: {
fontSize: 12,
color: "#6b7280",
marginTop: 2,
},

chipRefusal: {
background: "#fee2e2",
color: "#991b1b",
padding: "4px 10px",
borderRadius: 12,
fontSize: 12,
display: "inline-block",
marginTop: 6,
},

chipAbandon: {
background: "#e5e7eb",
color: "#374151",
padding: "4px 10px",
borderRadius: 12,
fontSize: 12,
display: "inline-block",
marginTop: 6,
},

waitingBtnActive: {
background: "#fef3c7",
borderColor: "#f59e0b",
color: "#92400e",
fontWeight: 800,
},

acceptedBtnActive: {
background: "#dcfce7",
borderColor: "#22c55e",
color: "#166534",
fontWeight: 800,
},

refusalBtnActive: {
background: "#fee2e2",
borderColor: "#dc2626",
color: "#991b1b",
fontWeight: 800,
},

modalOverlay: {
position: "fixed",
top: 0,
left: 0,
right: 0,
bottom: 0,
backgroundColor: "rgba(0,0,0,0.4)",
display: "flex",
alignItems: "center",
justifyContent: "center",
zIndex: 9999,
},
modal: {
background: "#fff",
padding: 20,
borderRadius: 8,
minWidth: 300,
boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
},


refusalChip: {
display: "inline-flex",
alignItems: "center",
minHeight: 28,
padding: "0 10px",
borderRadius: 999,
background: "#fff1f2",
border: "1px solid #fecdd3",
color: "#be123c",
fontSize: 12,
fontWeight: 800,
},

abandonChip: {
display: "inline-flex",
alignItems: "center",
minHeight: 28,
padding: "0 10px",
borderRadius: 999,
background: "#f8fafc",
border: "1px solid #cbd5e1",
color: "#334155",
fontSize: 12,
fontWeight: 800,
},


workflowCard: {
border: "1px solid #e2e8f0",
borderRadius: 16,
background: "#ffffff",
padding: 14,
display: "grid",
gap: 12,
},

workflowHeader: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
},

workflowTitle: {
fontSize: 15,
fontWeight: 800,
},

workflowSentence: {
fontSize: 13,
color: "#475569",
},

workflowActions: {
display: "flex",
gap: 8,
},


workflowCard: {
border: "1px solid #e2e8f0",
borderRadius: 16,
background: "#ffffff",
padding: 14,
display: "grid",
gap: 12,
},

workflowHeader: {
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "center",
flexWrap: "wrap",
},

workflowTitle: {
fontSize: 15,
fontWeight: 800,
color: "#0f172a",
},

workflowSentence: {
fontSize: 13,
lineHeight: 1.45,
color: "#334155",
fontWeight: 600,
},

workflowMetaRow: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
gap: 10,
},

workflowMetaItem: {
border: "1px solid #edf2f7",
borderRadius: 12,
background: "#f8fafc",
padding: 10,
display: "grid",
gap: 4,
},

workflowActions: {
display: "flex",
gap: 8,
flexWrap: "wrap",
},

blockTitle: {
fontSize: 13,
fontWeight: 900,
textTransform: "uppercase",
letterSpacing: "0.04em",
color: "#065f46",
},

careHeaderRow: {
display: "grid",
gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 2fr",
gap: 12,
alignItems: "stretch", // 🔥 important
},

careItem: {
display: "flex",
flexDirection: "column",
minWidth: 120,
},

careLabel: {
fontSize: 11,
color: "#64748b",
},

careValue: {
fontSize: 14,
fontWeight: 600,
color: "#0f172a",
},

style: {
position: "sticky",
top: 84,
alignSelf: "start",
maxHeight: "calc(100vh - 96px)",
overflowY: "auto",
border: "1px solid #dbe4f0",
borderRadius: 22,
background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
padding: 12,
},





anticipationCard: {
border: "1px solid #e6edf5",
background: "#f8fafc",
},


sectionHeaderBlock: {
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: 12,
flexWrap: "wrap",
},

summaryStrip: {
display: "grid",
gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
gap: 12,
},

summaryStripItem: {
border: "1px solid #e5ebf2",
borderRadius: 12,
background: "#f8fafc",
padding: 12,
display: "grid",
gap: 6,
},

summaryStripValue: {
fontSize: 14,
fontWeight: 800,
color: "#17376a",
},

alertCard: {
borderRadius: 18,
padding: 18,
display: "grid",
gap: 10,
minHeight: 120,
},

alertCardRed: {
background: "#fff1f2",
border: "1px solid #fecdd3",
},

alertCardAmber: {
background: "#fff8e8",
border: "1px solid #f6df9b",
},

alertCardGreen: {
background: "#ecfdf5",
border: "1px solid #6ee7b7",
},

alertMainText: {
fontSize: 16,
lineHeight: 1.4,
fontWeight: 800,
color: "#111827",
},



decisionMetaGrid: {
display: "grid",
gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
gap: 10,
},

decisionMain: {
fontSize: 20,
fontWeight: 700,
marginBottom: 8,
},

decisionMeta: {
display: "flex",
gap: 20,
fontSize: 13,
marginBottom: 12,
},

metaLabel: {
display: "block",
color: "#6b7280",
fontSize: 11,
},

blockText: {
color: "#b91c1c",
fontWeight: 600,
},

stackXs: {
display: "grid",
gap: 8,
},

anticipationButton: {
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#17376a",
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  justifyContent: "flex-start",
  display: "flex",
  alignItems: "center",
  transition: "all 0.15s ease",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
},
anticipationButtonHover: {
background: "#f1f5f9",
},

actionText: {
color: "#1d4ed8",
fontWeight: 600,
},

secondaryBtn: {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
},
menuCounter: {
minWidth: 22,
height: 22,
borderRadius: 999,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
padding: "0 6px",
fontSize: 11,
fontWeight: 900,
border: "1px solid transparent",
},

menuCounterBlue: {
background: "#dbeafe",
color: "#1d4ed8",
border: "1px solid #bfdbfe",
},

menuCounterAmber: {
background: "#fef3c7",
color: "#92400e",
border: "1px solid #fde68a",
},

menuCounterRed: {
background: "#fee2e2",
color: "#b91c1c",
border: "1px solid #fecaca",
},
identityCommuneRowClean: {
display: "flex",
alignItems: "center",
gap: 10,
marginTop: 6,
},

alert: {
padding: "10px 12px",
borderRadius: 10,
fontWeight: 600,
},

alertRed: {
background: "#fee2e2",
color: "#991b1b",
},

alertAmber: {
background: "#fef3c7",
color: "#92400e",
},

alertGreen: {
background: "#dcfce7",
color: "#166534",
},

identityCommuneLabelClean: {
fontSize: 12,
fontWeight: 700,
color: "#6b7280",
minWidth: 70,
},

inputInlineClean: {
minHeight: 30,
borderRadius: 8,
border: "1px solid #d1d5db",
padding: "0 10px",
background: "#fff",
minWidth: 220,
fontSize: 13,
},
identityRow: {
display: "flex",
flexWrap: "wrap",
gap: 12,
alignItems: "center",
fontSize: 13,
background: "#f8fafc",
padding: "8px 12px",
borderRadius: 12,
border: "1px solid #e5e7eb",
},

identityNameCompact: {
fontWeight: 900,
fontSize: 15,
color: "#111827",
},

identityCommuneInlineLabel: {
fontSize: 12,
fontWeight: 800,
color: "#374151",
},

inputInlineCompact: {
minHeight: 28,
borderRadius: 8,
border: "1px solid #d1d5db",
padding: "0 8px",
background: "#fff",
minWidth: 180,
},

priorityBoxCompact: {
border: "1px solid #dbeafe",
background: "#f8fbff",
borderRadius: 12,
padding: 10,
display: "grid",
gap: 6,
},
identityBar: {
borderRadius: 20,
border: "1px solid #dbe4f0",
background: "#ffffff",
boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
padding: 14,
display: "grid",
gap: 10,
},

identityHeaderRow: {
display: "flex",
justifyContent: "space-between",
gap: 16,
alignItems: "center",
flexWrap: "wrap",
},

identityNameInline: {
fontSize: 20,
fontWeight: 900,
color: "#111827",
},

identityInlineGrid: {
display: "grid",
gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
gap: 10,
},

identityCommuneRow: {
display: "flex",
gap: 10,
alignItems: "center",
flexWrap: "wrap",
},

identityCommuneLabel: {
fontSize: 12,
fontWeight: 800,
color: "#374151",
textTransform: "uppercase",
},

inputInline: {
minHeight: 32,
borderRadius: 8,
border: "1px solid #d1d5db",
padding: "0 10px",
background: "#fff",
minWidth: 220,
},

compactStatusRow: {
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
padding: "2px 0",
},

alertBox: {
border: "1px solid #fecaca",
background: "#fff1f2",
color: "#9f1239",
borderRadius: 12,
padding: 12,
fontWeight: 700,
},

priorityBox: {
border: "1px solid #dbeafe",
background: "#f8fbff",
borderRadius: 12,
padding: 12,
display: "grid",
gap: 8,
},

priorityLabel: {
fontSize: 12,
fontWeight: 800,
color: "#1e3a8a",
textTransform: "uppercase",
},

priorityCard: {
borderRadius: 18,
padding: 18,
display: "grid",
gap: 12,
minHeight: 120,
background: "#eef4ff",
border: "1px solid #c7d7ff",
boxShadow: "0 10px 24px rgba(23, 55, 106, 0.08)",
},

prioritySentence: {
fontSize: 13,
lineHeight: 1.4,
color: "#334155",
fontWeight: 600,
},

priorityButton: {
minHeight: 48,
borderRadius: 14,
border: "1px solid #17376a",
background: "#17376a",
color: "#ffffff",
padding: "0 16px",
fontSize: 15,
fontWeight: 800,
cursor: "pointer",
boxShadow: "0 10px 20px rgba(23, 55, 106, 0.18)",
},

shell: {
display: "grid",
gridTemplateColumns: "260px 1fr",
gap: 16,
alignItems: "start",
},


sidebarTitle: {
fontSize: 16,
fontWeight: 900,
color: "#17376a",
},

sideButton: {
minHeight: 42,
borderRadius: 12,
border: "1px solid #e5e7eb",
background: "#fff",
cursor: "pointer",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
padding: "0 12px",
fontWeight: 700,
},

sideButtonActive: {
background: "#eef4ff",
border: "1px solid #c7d7ff",
},

main: {
display: "grid",
gap: 16,
},

identityShell: {
borderRadius: 24,
border: "1px solid #dbe4f0",
background: "linear-gradient(135deg, #ffffff 0%, #f7faff 100%)",
boxShadow: "0 16px 40px rgba(15, 23, 42, 0.07)",
padding: 18,
display: "grid",
gap: 14,
},

identityTopRow: {
display: "flex",
justifyContent: "space-between",
gap: 16,
alignItems: "flex-start",
flexWrap: "wrap",
},

identityName: {
fontSize: 22,
fontWeight: 900,
color: "#111827",
},

identityGrid: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
gap: 12,
},

identityInfoCard: {
background: "#f8fafc",
border: "1px solid #e2e8f0",
borderRadius: 14,
padding: 12,
display: "grid",
gap: 4,
},

identityInfoLabel: {
fontSize: 11,
color: "#64748b",
fontWeight: 700,
textTransform: "uppercase",
letterSpacing: 0.3,
},

identityInfoValue: {
fontSize: 14,
fontWeight: 800,
color: "#0f172a",
},

card: {
border: "1px solid #dfe7f1",
borderRadius: 16,
padding: 16,
background: "#fff",
display: "grid",
gap: 14,
boxShadow: "none",
},
cardTitle: {
fontSize: 17,
fontWeight: 900,
color: "#17376a",
},


cardSubTitle: {
fontSize: 13,
fontWeight: 800,
color: "#374151",
},

cardHeader: {
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "center",
flexWrap: "wrap",
},

situationBar: {
borderRadius: 16,
border: "1px solid #dbeafe",
background: "#eff6ff",
padding: 16,
display: "grid",
gap: 6,
},

situationMain: {
fontSize: 20,
fontWeight: 800,
color: "#0f172a",
},

priorityStrip: {
borderRadius: 16,
border: "1px solid #e2e8f0",
background: "#f8fafc",
padding: 16,
display: "grid",
gap: 10,
},

copilotStatsGrid: {
display: "grid",
gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
gap: 12,
},



copilotStatBox: {
background: "#f8fafc",
border: "1px solid #e5ebf2",
borderRadius: 12,
padding: 12,
display: "grid",
gap: 6,
},

copilotStatLabel: {
fontSize: 12,
color: "#64748b",
fontWeight: 700,
textTransform: "uppercase",
},

copilotStatValue: {
fontSize: 20, // au lieu de 14-16
fontWeight: 900,
color: "#17376a",
},

grid2: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
gap: 12,
},

grid3: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 12,
},

fieldBlock: {
gap: 4,
marginBottom: 8,
},

label: {
fontSize: 12,
fontWeight: 800,
color: "#374151",
},

select: {
minHeight: 40,
borderRadius: 10,
border: "1px solid #d1d5db",
padding: "0 10px",
background: "#fff",
},

selectSmall: {
minHeight: 36,
borderRadius: 10,
border: "1px solid #d1d5db",
padding: "0 10px",
background: "#fff",
},

input: {
minHeight: 40,
borderRadius: 10,
border: "1px solid #d1d5db",
padding: "0 10px",
background: "#fff",
},


inputSmall: {
  minHeight: 44,
  borderRadius: 14,
  border: "1px solid #d6dde8",
  padding: "0 14px",
  background: "#ffffff",
  width: "100%",
  fontSize: 15,
  color: "#0f172a",
  outline: "none",
  transition: "all 0.15s ease",
},

inputSmallFocus: {
  border: "1px solid #3b82f6",
  boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
},

selectSmall: {
  minHeight: 44,
  borderRadius: 14,
  border: "1px solid #d6dde8",
  padding: "0 14px",
  background: "#ffffff",
  width: "100%",
  fontSize: 15,
  color: "#0f172a",
},

hdjTextarea: {
  minHeight: 140,
  borderRadius: 16,
  border: "1px solid #d6dde8",
  padding: 14,
  background: "#ffffff",
  resize: "vertical",
  width: "100%",
  fontSize: 15,
  lineHeight: 1.45,
  color: "#0f172a",
},

textareaSmall: {
minHeight: 64,
borderRadius: 8,
border: "1px solid #cbd5e1",
padding: "8px 10px",
fontSize: 13,
background: "#fff",
resize: "vertical",
},

primaryBtn: {
  height: 42,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  fontWeight: 700,
  padding: "0 16px",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(37,99,235,0.25)",
  transition: "all 0.15s ease",
},



ghostBtn: {
minHeight: 34,
borderRadius: 10,
border: "1px dashed #94a3b8",
background: "#fff",
color: "#334155",
padding: "0 12px",
cursor: "pointer",
fontWeight: 700,
},

stack: {
display: "grid",
gap: 12,
},

rowWrap: {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
},

smallNote: {
  fontSize: 12,
  color: "#94a3b8",
  fontStyle: "italic",
},

sectionBanner: {
border: "1px solid #dbeafe",
background: "#eff6ff",
borderRadius: 14,
padding: 12,
display: "grid",
gap: 8,
},

infoCard: {
background: "#f8fafc",
border: "1px solid #e4ebf3",
borderRadius: 16,
padding: 16,
display: "grid",
gap: 10,
},

infoMiniCard: {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  display: "grid",
  gap: 4,
  minHeight: 64,
},


infoMiniValue: {
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.2,
},


infoLabel: {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
},

summaryBox: {
border: "1px solid #bfdbfe",
borderRadius: 14,
padding: 14,
background: "#f8fbff",
display: "grid",
gap: 6,
},

historyBox: {
border: "1px dashed #d1d5db",
borderRadius: 12,
padding: 12,
display: "grid",
gap: 6,
},

actionPill: {
minHeight: 32,
borderRadius: 999,
border: "1px solid #d1d5db",
background: "#fff",
padding: "0 12px",
cursor: "pointer",
fontWeight: 700,
},

postit: {
border: "1px solid #fcd34d",
background: "#fef9c3",
borderRadius: 14,
padding: 14,
display: "grid",
gap: 10,
},

postitTitle: {
fontWeight: 900,
color: "#111827",
},

exchangeCard: {
border: "1px solid #e5e7eb",
borderRadius: 14,
padding: 14,
display: "grid",
gap: 8,
background: "#fafafa",
},

exchangeHead: {
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "center",
flexWrap: "wrap",
},

categoryCard: {
border: "1px solid #e5e7eb",
borderRadius: 14,
padding: 12,
display: "grid",
gap: 10,
},

categoryTitle: {
border: "none",
background: "transparent",
textAlign: "left",
fontWeight: 900,
color: "#111827",
cursor: "pointer",
padding: 0,
},

keywordWrap: {
display: "flex",
gap: 8,
flexWrap: "wrap",
},

keywordChip: {
minHeight: 24,
borderRadius: 999,
border: "1px solid #dbeafe",
background: "#eff6ff",
color: "#1d4ed8",
padding: "0 8px",
cursor: "pointer",
fontSize: 11,
fontWeight: 700,
},

keywordChipActive: {
  background: "#e0f2fe",
  borderColor: "#7dd3fc",
  color: "#0369a1",
},

formRow: {
border: "1px solid #e5e7eb",
borderRadius: 14,
padding: 12,
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "center",
flexWrap: "wrap",
background: "#fff",
},

keywordChipMuted: {
  height: 22,
  borderRadius: 999,
  border: "1px dashed #e2e8f0",
  background: "#ffffff",
  color: "#64748b",
  padding: "0 6px",
  cursor: "pointer",
  fontSize: 10,
},

formName: {
fontWeight: 800,
color: "#111827",
},

badge: {
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
minHeight: 24,
padding: "0 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
background: "#eef2ff",
color: "#3730a3",
border: "1px solid #c7d2fe",
},

timelineRow: {
display: "flex",
gap: 18,
flexWrap: "wrap",
alignItems: "flex-start",
},

timelineItem: {
display: "grid",
gap: 6,
justifyItems: "center",
minWidth: 80,
},

timelineDot: {
width: 18,
height: 18,
borderRadius: "50%",
},

timelineLabel: {
fontSize: 12,
color: "#374151",
textAlign: "center",
},

orientationMain: {
fontSize: 18,
fontWeight: 800,
color: "#0f172a",
},

resourceCard: {
border: "1px solid #e5e7eb",
borderRadius: 14,
padding: 14,
display: "grid",
gap: 8,
background: "#fafafa",
},

hdjBox: {
border: "1px solid #c7d7ff",
borderRadius: 16,
padding: 14,
display: "grid",
gap: 12,
background: "#f8fbff",
},

groupTitle: {
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
  textTransform: "capitalize",
  marginBottom: 2,
},


orientationChipWrap: {
display: "flex",
gap: 8,
flexWrap: "wrap",
},

orientationChip: {
minHeight: 32,
borderRadius: 999,
border: "1px solid #dbeafe",
background: "#eff6ff",
color: "#1d4ed8",
padding: "0 12px",
cursor: "pointer",
fontSize: 12,
fontWeight: 700,
},

orientationChipActive: {
background: "#1d4ed8",
color: "#fff",
border: "1px solid #1d4ed8",
},

previewRow: {
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 10,
display: "flex",
justifyContent: "space-between",
gap: 10,
alignItems: "center",
flexWrap: "wrap",
background: "#fff",
},

previewTitle: {
fontWeight: 800,
color: "#111827",
},
};
