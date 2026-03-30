import { HDJ_ACTS_CATALOG } from "../data/hdjActsCatalog";

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}

function includesOne(texts = [], candidates = []) {
return candidates.some((candidate) =>
texts.some((text) => normalize(text).includes(normalize(candidate)))
);
}

function collectPatientSignals(patient) {
const texts = [];

if (patient?.blockReason) texts.push(patient.blockReason);
if (patient?.orientation) texts.push(patient.orientation);
if (patient?.service) texts.push(patient.service);

const intakeSelections = patient?.intakeSelections || {};
const staySelections = patient?.staySelections || {};

[intakeSelections, staySelections].forEach((source) => {
Object.values(source || {}).forEach((domainValue) => {
if (!domainValue || typeof domainValue !== "object") return;

Object.values(domainValue).forEach((keywords) => {
if (!Array.isArray(keywords)) return;
keywords.forEach((keyword) => texts.push(keyword));
});
});
});

(patient?.freeCriteria || []).forEach((item) => {
if (typeof item === "string") texts.push(item);
else if (item?.label) texts.push(item.label);
});

return texts;
}

function pickActsByIds(ids = []) {
return HDJ_ACTS_CATALOG.filter((act) => ids.includes(act.id));
}

export function suggestHDJActs(patient) {
const signals = collectPatientSignals(patient);
const ids = new Set();

if (
includesOne(signals, [
"retour domicile complexe",
"coordination",
"absence relai",
"solution transitoire",
])
) {
ids.add("act_eval_initiale");
ids.add("act_coordination_parcours");
ids.add("act_relais_domicile");
ids.add("act_reevaluation_hebdo");
}

if (
includesOne(signals, [
"isolement",
"aidant absent",
"droits",
"logement",
"précarité",
"social",
])
) {
ids.add("act_bilan_social");
ids.add("act_coordination_parcours");
ids.add("act_partenaires_externes");
}

if (
includesOne(signals, [
"soins techniques",
"pansements",
"perfusion",
"surveillance",
"technique",
])
) {
ids.add("act_bilan_infirmier");
ids.add("act_soins_techniques");
ids.add("act_surveillance_clinique");
}

if (
includesOne(signals, [
"autonomie",
"dépendance",
"perte autonomie",
"retour impossible",
])
) {
ids.add("act_autonomie");
ids.add("act_orientation_secondaire");
}

if (
includesOne(signals, [
"parentalité",
"pédiatrie",
"enfant",
])
) {
ids.add("act_parentalite");
ids.add("act_reunion_situation");
}

if (ids.size === 0) {
ids.add("act_eval_initiale");
ids.add("act_coordination_parcours");
}

return pickActsByIds(Array.from(ids));
}