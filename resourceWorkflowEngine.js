// src/copilote/resourceWorkflowEngine.js

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function buildId(prefix) {
return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(days) {
return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
.toISOString()
.slice(0, 10);
}

function buildPatientSignals(patient) {
const values = [];

if (patient?.orientation) values.push(patient.orientation);
if (patient?.service) values.push(patient.service);
if (patient?.blockReason) values.push(patient.blockReason);

Object.values(patient?.intakeSelections || {}).forEach((domain) => {
Object.values(domain || {}).forEach((items) => {
(items || []).forEach((item) => values.push(item));
});
});

Object.values(patient?.staySelections || {}).forEach((domain) => {
Object.values(domain || {}).forEach((items) => {
(items || []).forEach((item) => values.push(item));
});
});

(patient?.freeCriteria || []).forEach((item) => {
if (typeof item === "string") values.push(item);
else if (item?.label) values.push(item.label);
});

(patient?.spiritNotes || []).forEach((note) => {
if (note?.text) values.push(note.text);
});

return values.map(normalize);
}

function hasSignal(signals, candidates) {
return candidates.some((candidate) => signals.includes(normalize(candidate)));
}

function action(label, overrides = {}) {
return {
id: overrides.id || buildId("resource_action"),
label,
owner: overrides.owner || "À définir",
status: overrides.status || "todo",
priority: overrides.priority || "standard",
source: overrides.source || "resource_workflow",
workflowType: overrides.workflowType || "resource_workflow",
dueDate: overrides.dueDate || "",
linkedResourceId: overrides.linkedResourceId || null,
notes: overrides.notes || "",
};
}

function buildGenericActions(resource) {
return [
action(`Contacter ${resource.label}`, {
owner: "Secrétariat / coordination",
priority: "high",
workflowType: "resource_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action(`Tracer le retour de ${resource.label}`, {
owner: "Équipe",
priority: "standard",
workflowType: "resource_feedback",
dueDate: addDays(2),
linkedResourceId: resource.id,
}),
];
}

function buildIDELActions(resource, patient, signals) {
const actions = [
action(`Contacter ${resource.label} pour évaluer la faisabilité du relais`, {
owner: "Secrétariat",
priority: "high",
workflowType: "idel_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Vérifier ordonnance, soins prescrits et date de relais", {
owner: "IDE",
priority: "high",
workflowType: "idel_prescription_check",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];

if (hasSignal(signals, ["sortie", "retour domicile", "sortie complexe"])) {
actions.push(
action("Sécuriser la date de sortie avec les relais IDEL", {
owner: "IDE / coordination",
priority: "high",
workflowType: "idel_discharge_coordination",
dueDate: addDays(1),
linkedResourceId: resource.id,
})
);
}

if (hasSignal(signals, ["pansement", "injection", "perfusion", "surveillance"])) {
actions.push(
action("Transmettre les éléments techniques utiles au relais IDEL", {
owner: "IDE",
priority: "high",
workflowType: "idel_technical_handover",
dueDate: addDays(1),
linkedResourceId: resource.id,
})
);
}

return actions;
}

function buildSSIADActions(resource, signals) {
const actions = [
action(`Contacter ${resource.label} pour évaluation d'admission`, {
owner: "Secrétariat / coordination",
priority: "high",
workflowType: "ssiad_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Préparer les éléments cliniques et sociaux pour la demande SSIAD", {
owner: "IDE / AS",
priority: "high",
workflowType: "ssiad_file",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];

if (hasSignal(signals, ["dependance", "autonomie", "personne agee"])) {
actions.push(
action("Vérifier les besoins d'aide humaine et de soins au domicile", {
owner: "IDE / AS",
priority: "standard",
workflowType: "ssiad_needs_review",
dueDate: addDays(2),
linkedResourceId: resource.id,
})
);
}

return actions;
}

function buildSAADActions(resource) {
return [
action(`Contacter ${resource.label} pour organiser l'aide à domicile`, {
owner: "AS / secrétariat",
priority: "high",
workflowType: "saad_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Vérifier les besoins concrets : toilette, repas, courses, présence", {
owner: "AS / équipe",
priority: "standard",
workflowType: "saad_needs_review",
dueDate: addDays(2),
linkedResourceId: resource.id,
}),
];
}

function buildDACActions(resource) {
return [
action(`Solliciter ${resource.label} comme appui de coordination`, {
owner: "Coordination",
priority: "high",
workflowType: "dac_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Préparer la synthèse clinique et sociale pour l'appui DAC", {
owner: "IDE / AS",
priority: "high",
workflowType: "dac_summary",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];
}

function buildHADActions(resource, signals) {
const actions = [
action(`Contacter ${resource.label} pour évaluation HAD`, {
owner: "Médecin / secrétariat",
priority: "high",
workflowType: "had_contact",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Vérifier prescription, critères cliniques et accord médical", {
owner: "Médecin / IDE",
priority: "high",
workflowType: "had_medical_review",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];

if (hasSignal(signals, ["perfusion", "soins techniques", "palliatif"])) {
actions.push(
action("Préparer les éléments techniques pour l'admission HAD", {
owner: "IDE",
priority: "high",
workflowType: "had_technical_prep",
dueDate: addDays(1),
linkedResourceId: resource.id,
})
);
}

return actions;
}

function buildHDJActions(resource, signals) {
const actions = [
action(`Vérifier la pertinence du recours à ${resource.label}`, {
owner: "IDE / médecin",
priority: "high",
workflowType: "hdj_review",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Préparer une demande HDJ par actes si validation", {
owner: "IDE / secrétariat",
priority: "high",
workflowType: "hdj_request",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];

if (hasSignal(signals, ["surveillance", "pansement", "injection", "coordination"])) {
actions.push(
action("Lister les actes HDJ nécessaires", {
owner: "IDE / équipe",
priority: "standard",
workflowType: "hdj_acts_list",
dueDate: addDays(1),
linkedResourceId: resource.id,
})
);
}

return actions;
}

function buildEHPADActions(resource) {
return [
action(`Créer / suivre la demande vers ${resource.label}`, {
owner: "AS / secrétariat",
priority: "high",
workflowType: "ehpad_request",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Préparer le dossier social / hébergement associé", {
owner: "AS",
priority: "high",
workflowType: "ehpad_social_file",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];
}

function buildSMRActions(resource) {
return [
action(`Initier l'orientation vers ${resource.label}`, {
owner: "Médecin / secrétariat",
priority: "high",
workflowType: "smr_request",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Préparer les éléments médicaux et rééducatifs pour le dossier", {
owner: "Médecin / kiné / IDE",
priority: "high",
workflowType: "smr_file",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];
}

function buildSocialFormActions(resource) {
return [
action(`Ouvrir le dossier ${resource.label}`, {
owner: "AS",
priority: "high",
workflowType: "social_form_opening",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
action("Vérifier les pièces justificatives nécessaires", {
owner: "AS / patient / entourage",
priority: "standard",
workflowType: "social_form_documents",
dueDate: addDays(2),
linkedResourceId: resource.id,
}),
];
}

function buildASEActions(resource) {
return [
action(`Activer le circuit ${resource.label}`, {
owner: "Médecin / cadre",
priority: "high",
workflowType: "ase_resource_opening",
dueDate: addDays(0),
linkedResourceId: resource.id,
}),
action("Préparer les documents et tracer la transmission", {
owner: "Médecin / AS / équipe",
priority: "high",
workflowType: "ase_resource_documents",
dueDate: addDays(1),
linkedResourceId: resource.id,
}),
];
}

function actionsByType(resource, patient) {
const signals = buildPatientSignals(patient);
const type = normalize(resource?.type);

if (type === "idel") return buildIDELActions(resource, patient, signals);
if (type === "ssiad") return buildSSIADActions(resource, signals);
if (type === "saad") return buildSAADActions(resource);
if (type === "dac") return buildDACActions(resource);
if (type === "had") return buildHADActions(resource, signals);
if (type === "hdj") return buildHDJActions(resource, signals);
if (type === "ehpad") return buildEHPADActions(resource);
if (type === "smr") return buildSMRActions(resource);
if (type === "formulaire_social") return buildSocialFormActions(resource);
if (type === "formulaire_ase") return buildASEActions(resource);
if (type === "ase" || type === "crip" || type === "pmi" || type === "pediatrie") {
return buildASEActions(resource);
}

return buildGenericActions(resource);
}

function dedupeActions(actions = []) {
const seen = new Set();

return actions.filter((item) => {
const key = normalize(
`${item.label}|${item.workflowType}|${item.linkedResourceId || ""}`
);
if (seen.has(key)) return false;
seen.add(key);
return true;
});
}

export function buildWorkflowFromResource({ resource, patient }) {
if (!resource) {
return {
actions: [],
alert: null,
};
}

const actions = dedupeActions(actionsByType(resource, patient));

return {
actions,
alert: {
id: buildId("resource_alert"),
level: "medium",
label: `Workflow prêt pour ${resource.label}`,
},
};
}