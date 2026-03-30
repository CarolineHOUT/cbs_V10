// src/copilote/synthesisEngine.js

// ===============================
// SYNTHESIS ENGINE
// Génération de synthèses CARABBAS
// ===============================

function safe(value, fallback = "Non renseigné") {
if (value === null || value === undefined || value === "") return fallback;
return value;
}

function formatList(items = [], emptyText = "Aucun élément") {
if (!Array.isArray(items) || items.length === 0) return emptyText;
return items.join(", ");
}

function normalizeFreeCriteria(freeCriteria = []) {
return freeCriteria
.filter(Boolean)
.map((item) => {
if (typeof item === "string") return item;
return item.label || "";
})
.filter(Boolean);
}

function formatActionLines(actions = []) {
if (!Array.isArray(actions) || actions.length === 0) {
return "Aucune action structurée pour le moment.";
}

return actions
.map((action, index) => {
const owner = safe(action.owner, "Responsable à préciser");
const dueDate = safe(action.dueDate, "Échéance à préciser");
const status = safe(action.status, "todo");
return `${index + 1}. ${action.label} — Responsable : ${owner} — Échéance : ${dueDate} — Statut : ${status}`;
})
.join("\n");
}

function buildPatientIntro(patient) {
return [
`Patient : ${safe(patient?.nom, "")} ${safe(patient?.prenom, "")}`.trim(),
`Date de naissance : ${safe(patient?.dateNaissance)}`,
`Service : ${safe(patient?.service)}`,
`Chambre / lit : ${safe(patient?.chambre)} / ${safe(patient?.lit)}`,
`Date d'entrée : ${safe(patient?.dateEntree)}`,
].join("\n");
}

function buildSituationBlock(patient, decision = {}, freeCriteria = []) {
const criteria = normalizeFreeCriteria(freeCriteria);

const lines = [
`Blocage principal : ${safe(patient?.blockReason || patient?.blocage)}`,
`Orientation proposée : ${safe(decision?.proposedOrientation, "À définir")}`,
`Niveau de confiance : ${safe(decision?.confidence, "non précisé")}`,
];

if (decision?.explanation) {
lines.push(`Argumentaire : ${decision.explanation}`);
}

if (criteria.length > 0) {
lines.push(`Éléments terrain ajoutés : ${criteria.join(", ")}`);
}

return lines.join("\n");
}

function buildResourceBlock(bestResource, rankedResources = []) {
const alternatives = Array.isArray(rankedResources)
? rankedResources.slice(1, 4).map((r) => r.label)
: [];

if (!bestResource) {
return [
"Ressource prioritaire : aucune ressource évidente identifiée à ce stade.",
alternatives.length > 0
? `Alternatives potentielles : ${alternatives.join(", ")}`
: "Alternatives potentielles : aucune pour le moment.",
].join("\n");
}

return [
`Ressource prioritaire : ${bestResource.label}`,
`Type : ${safe(bestResource.type)}`,
`Score copilote : ${safe(bestResource.copilotScore, "non calculé")}`,
`Accès : ${safe(bestResource.accessMode, "non précisé")}`,
alternatives.length > 0
? `Alternatives : ${alternatives.join(", ")}`
: "Alternatives : aucune mise en avant pour le moment.",
].join("\n");
}

function buildActorsBlock(patient) {
return [
`Médecin : ${safe(patient?.medecin)}`,
`IDE : ${safe(patient?.ide)}`,
`Cadre : ${safe(patient?.cadre)}`,
`AS : ${safe(patient?.as)}`,
].join("\n");
}

// ===============================
// 1. SYNTHÈSE DÉCISIONNELLE
// ===============================

export function buildDecisionSynthesis({
patient,
decision,
bestResource,
rankedResources = [],
freeCriteria = [],
automaticActions = [],
}) {
return [
"SYNTHÈSE DÉCISIONNELLE",
"",
buildPatientIntro(patient),
"",
"Situation",
buildSituationBlock(patient, decision, freeCriteria),
"",
"Ressources",
buildResourceBlock(bestResource, rankedResources),
"",
"Plan d’action immédiat",
formatActionLines(automaticActions),
"",
"Acteurs",
buildActorsBlock(patient),
].join("\n");
}

// ===============================
// 2. SYNTHÈSE TRANSMISSION / STAFF
// ===============================

export function buildStaffSynthesis({
patient,
decision,
bestResource,
freeCriteria = [],
automaticActions = [],
}) {
const criteria = normalizeFreeCriteria(freeCriteria);

return [
"SYNTHÈSE TRANSMISSION / STAFF",
"",
`${safe(patient?.nom, "")} ${safe(patient?.prenom, "")}`.trim(),
`Hospitalisation en ${safe(patient?.service)} depuis le ${safe(patient?.dateEntree)}.`,
`Frein principal : ${safe(patient?.blockReason || patient?.blocage)}.`,
`Orientation proposée à ce stade : ${safe(decision?.proposedOrientation, "À définir")}.`,
decision?.explanation ? `Argumentaire : ${decision.explanation}` : "",
bestResource?.label
? `Ressource prioritaire identifiée : ${bestResource.label}.`
: "Aucune ressource prioritaire clairement identifiée à ce stade.",
criteria.length > 0
? `Éléments terrain ajoutés : ${criteria.join(", ")}.`
: "",
automaticActions.length > 0
? `Action prioritaire : ${automaticActions[0]?.label || "À préciser"}.`
: "Action prioritaire : à préciser.",
]
.filter(Boolean)
.join("\n");
}

// ===============================
// 3. SYNTHÈSE DEMANDE EXTERNE
// ===============================

export function buildExternalRequestSynthesis({
patient,
decision,
bestResource,
freeCriteria = [],
}) {
const criteria = normalizeFreeCriteria(freeCriteria);

return [
"SYNTHÈSE DEMANDE EXTERNE",
"",
`Patient actuellement hospitalisé en ${safe(patient?.service)}.`,
`Situation nécessitant une orientation vers ${safe(
decision?.proposedOrientation,
"une solution à définir"
)}.`,
`Frein principal : ${safe(patient?.blockReason || patient?.blocage)}.`,
decision?.explanation ? `Motifs de l’orientation : ${decision.explanation}` : "",
bestResource?.label
? `Ressource ou structure ciblée : ${bestResource.label}.`
: "",
criteria.length > 0
? `Éléments complémentaires issus du terrain : ${criteria.join(", ")}.`
: "",
"Merci d’étudier la faisabilité de cette orientation et de préciser les conditions de mise en œuvre.",
]
.filter(Boolean)
.join("\n");
}

// ===============================
// 4. SYNTHÈSE HDJ
// ===============================

export function buildHDJSynthesis({
patient,
decision,
hdjDraft,
freeCriteria = [],
}) {
const criteria = normalizeFreeCriteria(freeCriteria);
const acts = Array.isArray(hdjDraft?.actes)
? hdjDraft.actes.map((item) => item.label)
: [];

return [
"SYNTHÈSE HDJ",
"",
`Patient : ${safe(patient?.nom, "")} ${safe(patient?.prenom, "")}`.trim(),
`Contexte : ${safe(patient?.blockReason || patient?.blocage)}.`,
`Orientation générale : ${safe(decision?.proposedOrientation, "À définir")}.`,
criteria.length > 0
? `Éléments terrain : ${criteria.join(", ")}.`
: "",
acts.length > 0 ? `Actes HDJ prévus : ${acts.join(", ")}.` : "Actes HDJ à préciser.",
hdjDraft?.programmation?.frequence
? `Fréquence : ${hdjDraft.programmation.frequence}.`
: "",
hdjDraft?.programmation?.duree
? `Durée : ${hdjDraft.programmation.duree}.`
: "",
hdjDraft?.commentaire ? `Commentaire : ${hdjDraft.commentaire}` : "",
]
.filter(Boolean)
.join("\n");
}

// ===============================
// DISPATCHER
// ===============================

export const SYNTHESIS_TYPES = [
{ value: "decision", label: "Décisionnelle" },
{ value: "staff", label: "Transmission / staff" },
{ value: "external", label: "Demande externe" },
{ value: "hdj", label: "HDJ" },
];

export function buildSynthesisByType({
type,
patient,
decision,
bestResource,
rankedResources = [],
freeCriteria = [],
automaticActions = [],
hdjDraft = null,
}) {
if (type === "staff") {
return buildStaffSynthesis({
patient,
decision,
bestResource,
freeCriteria,
automaticActions,
});
}

if (type === "external") {
return buildExternalRequestSynthesis({
patient,
decision,
bestResource,
freeCriteria,
});
}

if (type === "hdj") {
return buildHDJSynthesis({
patient,
decision,
hdjDraft,
freeCriteria,
});
}

return buildDecisionSynthesis({
patient,
decision,
bestResource,
rankedResources,
freeCriteria,
automaticActions,
});
}