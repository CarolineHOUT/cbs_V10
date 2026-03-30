function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function safeArray(value) {
if (!value) return [];
if (Array.isArray(value)) return value;
return [value];
}

function flattenSelections(selections = {}) {
const rows = [];

Object.entries(selections || {}).forEach(([domain, categories]) => {
Object.entries(categories || {}).forEach(([category, items]) => {
safeArray(items).forEach((label) => {
rows.push({ domain, category, label });
});
});
});

return rows;
}

function buildPatientSignals(patient) {
const texts = [];

if (!patient) return [];

texts.push(patient.orientation);
texts.push(patient.blockReason);
texts.push(patient.blocage);
texts.push(patient?.territory?.mainNeed);
texts.push(patient?.territory?.city);
texts.push(patient?.territory?.housingType);
texts.push(patient?.adresse?.city);
texts.push(patient?.adresse?.housingType);
texts.push(patient?.service);

flattenSelections(patient?.intakeSelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});

flattenSelections(patient?.staySelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});

safeArray(patient?.freeCriteria).forEach((item) => {
texts.push(typeof item === "string" ? item : item?.label);
});

safeArray(patient?.spiritNotes).forEach((note) => {
texts.push(note?.text);
});

return texts.map(normalize).filter(Boolean);
}

function matchKeywords(resource, patientSignals) {
const keywords = safeArray(resource?.keywords).map(normalize);
let score = 0;

keywords.forEach((keyword) => {
if (
patientSignals.some(
(signal) => signal.includes(keyword) || keyword.includes(signal)
)
) {
score += 2;
}
});

return score;
}

function matchCategories(resource, patientSignals) {
const categories = safeArray(resource?.categories).map(normalize);
let score = 0;

categories.forEach((category) => {
if (
patientSignals.some(
(signal) => signal.includes(category) || category.includes(signal)
)
) {
score += 3;
}
});

return score;
}

function matchTerritory(resource, patient) {
const city = normalize(patient?.territory?.city || patient?.adresse?.city);
if (!city) return 0;

const territories = safeArray(resource?.territory).map(normalize);

if (territories.includes("cotentin")) return 1;

if (territories.some((territory) => city.includes(territory) || territory.includes(city))) {
return 3;
}

return 0;
}

function typeBoost(resource, patientSignals) {
const type = normalize(resource?.type);
let score = 0;

const has = (...items) =>
items.some((item) =>
patientSignals.some((signal) => signal.includes(normalize(item)))
);

if (
has("retour domicile", "absence de relais", "sortie complexe") &&
["had", "ssiad", "aide a domicile", "dac", "idel"].includes(type)
) {
score += 4;
}

if (
has("nursing lourd", "pansement", "injection", "perfusion", "surveillance") &&
["had", "ssiad", "idel", "hdj"].includes(type)
) {
score += 4;
}

if (
has("précarité", "precarite", "droits", "mdph", "apa", "mesure de protection") &&
[
"assistante sociale",
"dac",
"formulaire social",
"formulaire autonomie",
"formulaire handicap",
].includes(type)
) {
score += 4;
}

if (
has("hébergement temporaire", "hebergement temporaire", "répit", "repit") &&
["hebergement temporaire", "ehpad"].includes(type)
) {
score += 4;
}

if (
has("danger", "enfance", "signalement", "information préoccupante", "information preoccupante") &&
["ase", "crip", "pmi"].includes(type)
) {
score += 5;
}

return score;
}

function computeResourceScore(resource, patientSignals, patient) {
return (
matchKeywords(resource, patientSignals) +
matchCategories(resource, patientSignals) +
matchTerritory(resource, patient) +
typeBoost(resource, patientSignals)
);
}

function explainWhy(bestResource, patientSignals = []) {
if (!bestResource) return [];

const has = (...items) =>
items.some((item) =>
patientSignals.some((signal) => signal.includes(normalize(item)))
);

const reasons = [];

if (has("retour domicile", "sortie complexe", "absence de relais")) {
reasons.push("Retour à domicile à organiser");
}

if (has("nursing lourd", "pansement", "injection", "perfusion", "surveillance")) {
reasons.push("Besoin de soins techniques ou renforcés");
}

if (has("précarité", "droits", "mdph", "apa", "mesure de protection")) {
reasons.push("Besoin d’appui social ou administratif");
}

if (has("isolement", "aidant absent", "aidant épuisé", "aidant epuise")) {
reasons.push("Relais de proximité à sécuriser");
}

if (has("hébergement temporaire", "hebergement temporaire", "répit", "repit")) {
reasons.push("Besoin d’une solution d’hébergement transitoire");
}

return reasons.slice(0, 3);
}

function inferOrientation(bestResource) {
if (!bestResource) {
return {
proposedOrientation: "À préciser",
confidence: "low",
};
}

const type = normalize(bestResource.type);

if (type === "had") {
return {
proposedOrientation: "Prise en charge HAD",
confidence: "high",
};
}

if (type === "ssiad") {
return {
proposedOrientation: "Retour domicile avec SSIAD",
confidence: "high",
};
}

if (type === "aide a domicile") {
return {
proposedOrientation: "Retour domicile avec aide à domicile",
confidence: "medium",
};
}

if (type === "hebergement temporaire") {
return {
proposedOrientation: "Orientation vers hébergement temporaire",
confidence: "high",
};
}

if (type === "assistante sociale" || type === "dac") {
return {
proposedOrientation: "Coordination renforcée",
confidence: "medium",
};
}

return {
proposedOrientation: bestResource.label,
confidence: "medium",
};
}

function buildDecisionSummary(bestResource, reasons = []) {
if (!bestResource) {
return "Aucune solution prioritaire n’a été identifiée pour le moment.";
}

if (reasons.length === 0) {
return `${bestResource.label} est proposée en priorité.`;
}

return `${bestResource.label} est proposée en priorité : ${reasons.join(", ")}.`;
}

function buildAutomaticActions(bestResource) {
if (!bestResource) return [];

return [
{
id: `auto_${Date.now()}`,
label: `Contacter ${bestResource.label}`,
responsable: "Coordination / secrétariat",
status: "a_faire",
statut: "a_faire",
priorite: "haute",
source: "copilote",
typeDemande: `demande_${normalize(bestResource.type).replace(/\s+/g, "_")}`,
notes: bestResource.note || "",
linkedResourceId: bestResource.id,
},
];
}

export function runCopilotEngine({ patient, resources = [] }) {
const patientSignals = buildPatientSignals(patient);

const rankedResources = (resources || [])
.map((resource) => ({
...resource,
score: computeResourceScore(resource, patientSignals, patient),
}))
.filter((resource) => resource.score > 0)
.sort((a, b) => b.score - a.score);

const bestResource = rankedResources[0] || null;
const collective = rankedResources.slice(1, 3);
const alternativesAfterRefusal = rankedResources.slice(1, 3);
const reasons = explainWhy(bestResource, patientSignals);
const orientationDecision = inferOrientation(bestResource);
const automaticActions = buildAutomaticActions(bestResource);
const decisionSummary = buildDecisionSummary(bestResource, reasons);

const suggestHDJ = patientSignals.some((signal) =>
[
"surveillance",
"pansement",
"injection",
"perfusion",
"coordination",
].some((item) => signal.includes(normalize(item)))
);

return {
rankedResources,
bestResource,
collective,
alternativesAfterRefusal,
automaticActions,
reasons,
suggestHDJ,
orientationDecision,
decisionSummary,
};
}