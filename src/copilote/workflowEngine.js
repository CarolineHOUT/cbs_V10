// src/copilote/workflowEngine.js

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function unique(values = []) {
return [...new Set(values.filter(Boolean))];
}

function flattenSelections(selections = {}) {
const rows = [];

Object.entries(selections || {}).forEach(([domain, categories]) => {
if (!categories || typeof categories !== "object") return;

Object.entries(categories).forEach(([category, items]) => {
if (!Array.isArray(items)) return;

items.forEach((label) => {
rows.push({
domain,
category,
label,
});
});
});
});

return rows;
}

function buildPatientSignals(patient) {
const texts = [];

if (patient?.orientation) texts.push(patient.orientation);
if (patient?.service) texts.push(patient.service);
if (patient?.blockReason) texts.push(patient.blockReason);

flattenSelections(patient?.intakeSelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});

flattenSelections(patient?.staySelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});

(patient?.freeCriteria || []).forEach((item) => {
if (typeof item === "string") texts.push(item);
else if (item?.label) texts.push(item.label);
});

(patient?.spiritNotes || []).forEach((note) => {
if (note?.text) texts.push(note.text);
});

return unique(texts.map(normalize));
}

function hasAny(signals = [], values = []) {
return values.some((value) => signals.includes(normalize(value)));
}

function buildId(prefix) {
return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWorkflowAction(label, overrides = {}) {
return {
id: overrides.id || buildId("wf"),
label,
owner: overrides.owner || "À définir",
status: overrides.status || "todo",
priority: overrides.priority || "standard",
source: overrides.source || "workflow",
dueDate: overrides.dueDate || "",
workflowType: overrides.workflowType || "general",
linkedResourceId: overrides.linkedResourceId || null,
notes: overrides.notes || "",
};
}

function hoursSince(dateString) {
if (!dateString) return null;

const time = new Date(dateString).getTime();
if (Number.isNaN(time)) return null;

return Math.floor((Date.now() - time) / (1000 * 60 * 60));
}

function addDays(days) {
return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
.toISOString()
.slice(0, 10);
}

function buildRefusalWorkflow(patient) {
const refusals = (patient?.resourceFollowUp || []).filter(
(item) => item.status === "refused"
);

return refusals.flatMap((refusal) => {
const actions = [];

actions.push(
createWorkflowAction("Tracer le motif de refus et l'impact sur le parcours", {
owner: "IDE / AS",
priority: "high",
workflowType: "refusal_trace",
linkedResourceId: refusal.resourceId,
notes: refusal.refusalReason || "",
dueDate: addDays(1),
})
);

actions.push(
createWorkflowAction("Identifier et solliciter une ressource alternative", {
owner: "Secrétariat / coordination",
priority: "high",
workflowType: "refusal_alternative",
linkedResourceId: refusal.resourceId,
dueDate: addDays(1),
})
);

return actions;
});
}

function buildPendingWorkflow(patient) {
const followUps = patient?.resourceFollowUp || [];

return followUps.flatMap((item) => {
const elapsed = hoursSince(item.contactedAt);
const actions = [];

if (item.status === "pending" || item.status === "no_response") {
actions.push(
createWorkflowAction("Programmer une relance de la ressource", {
owner: "Secrétariat",
priority: elapsed !== null && elapsed >= 48 ? "high" : "standard",
workflowType: "resource_relance",
linkedResourceId: item.resourceId,
dueDate: addDays(1),
notes:
elapsed !== null
? `Sans réponse depuis ${elapsed} h`
: "Date de contact non tracée",
})
);
}

if (elapsed !== null && elapsed >= 72) {
actions.push(
createWorkflowAction("Escalader l'absence de réponse et rechercher une alternative", {
owner: "IDE / coordination",
priority: "high",
workflowType: "resource_escalation",
linkedResourceId: item.resourceId,
dueDate: addDays(1),
notes: `Aucune réponse depuis ${elapsed} h`,
})
);
}

return actions;
});
}

function buildHDJWorkflow(patient, engineResult) {
const signals = buildPatientSignals(patient);

const shouldSuggest =
engineResult?.suggestHDJ ||
hasAny(signals, [
"soins techniques",
"pansement",
"surveillance",
"perfusion",
"coordination",
"retour domicile",
"sortie complexe",
"absence relai",
]);

if (!shouldSuggest) return [];

return [
createWorkflowAction("Évaluer le HDJ comme levier de prise en charge", {
owner: "IDE / médecin",
priority: "high",
workflowType: "hdj_assessment",
dueDate: addDays(1),
}),
createWorkflowAction("Préparer une demande HDJ par actes si validation clinique", {
owner: "IDE / secrétariat",
priority: "high",
workflowType: "hdj_preparation",
dueDate: addDays(2),
}),
];
}

function buildASEWorkflow(patient) {
const signals = buildPatientSignals(patient);

const detected = hasAny(signals, [
"ase",
"information préoccupante",
"ip",
"signalement",
"danger enfant",
"enfance",
"parentalite",
"protection enfance",
]);

if (!detected) return [];

return [
createWorkflowAction("Ouvrir le circuit ASE / pédiatrie", {
owner: "Médecin / cadre",
priority: "high",
workflowType: "ase_opening",
dueDate: addDays(0),
}),
createWorkflowAction("Rassembler les documents ASE / IP nécessaires", {
owner: "Médecin / AS",
priority: "high",
workflowType: "ase_documents",
dueDate: addDays(1),
}),
createWorkflowAction("Tracer la transmission et organiser le suivi ASE", {
owner: "Équipe",
priority: "high",
workflowType: "ase_followup",
dueDate: addDays(1),
}),
];
}

function buildSocialWorkflow(patient) {
const signals = buildPatientSignals(patient);
const actions = [];

if (
hasAny(signals, [
"social",
"droits",
"apa",
"pch",
"mdph",
"hebergement",
"obligation alimentaire",
"mesure protection",
])
) {
actions.push(
createWorkflowAction("Vérifier les droits sociaux et les dossiers à ouvrir", {
owner: "Assistante sociale",
priority: "high",
workflowType: "social_rights_review",
dueDate: addDays(1),
})
);
}

if (
hasAny(signals, [
"ehpad",
"hebergement",
"institution",
"impossibilite retour domicile",
])
) {
actions.push(
createWorkflowAction("Préparer le dossier d'orientation / hébergement", {
owner: "AS / secrétariat",
priority: "high",
workflowType: "orientation_file",
dueDate: addDays(1),
})
);
}

if (
hasAny(signals, [
"mdph",
"handicap",
"aides techniques",
"compensation",
])
) {
actions.push(
createWorkflowAction("Évaluer l'ouverture d'un dossier MDPH / PCH", {
owner: "AS / équipe",
priority: "standard",
workflowType: "mdph_review",
dueDate: addDays(3),
})
);
}

return actions;
}

function buildDischargeWorkflow(patient) {
const signals = buildPatientSignals(patient);

if (
!hasAny(signals, [
"sortie",
"retour domicile",
"sortie complexe",
"domicile",
"absence relai",
])
) {
return [];
}

return [
createWorkflowAction("Vérifier la checklist de sortie complexe", {
owner: "IDE / coordination",
priority: "high",
workflowType: "complex_discharge_checklist",
dueDate: addDays(1),
}),
createWorkflowAction("Sécuriser les relais avant sortie", {
owner: "IDE / AS / secrétariat",
priority: "high",
workflowType: "discharge_relays",
dueDate: addDays(1),
}),
];
}

function buildCollectiveWorkflow(engineResult) {
const collective = engineResult?.collective || [];
if (!collective.length) return [];

return [
createWorkflowAction("Coordonner le collectif proposé autour du patient", {
owner: "IDE / AS",
priority: "standard",
workflowType: "collective_coordination",
dueDate: addDays(1),
notes: collective.map((item) => item.label).join(", "),
}),
];
}

function buildSpiritNotesWorkflow(patient) {
const notes = patient?.spiritNotes || [];

return notes.flatMap((note) => {
const text = normalize(note?.text);
if (!text) return [];

const actions = [];

if (
text.includes("refus") ||
text.includes("refuse") ||
text.includes("refusee")
) {
actions.push(
createWorkflowAction("Traiter un refus signalé dans une note terrain", {
owner: "IDE / AS",
priority: note.level === "urgent" ? "high" : "standard",
workflowType: "spirit_refusal_followup",
dueDate: addDays(1),
notes: note.text,
})
);
}

if (
text.includes("pas de reponse") ||
text.includes("aucune reponse") ||
text.includes("sans reponse") ||
text.includes("relancer")
) {
actions.push(
createWorkflowAction("Relancer une situation signalée dans les notes terrain", {
owner: "Secrétariat / coordination",
priority: "high",
workflowType: "spirit_relance_followup",
dueDate: addDays(1),
notes: note.text,
})
);
}

if (
text.includes("bloque") ||
text.includes("blocage") ||
text.includes("sature") ||
text.includes("impossible")
) {
actions.push(
createWorkflowAction("Analyser un blocage remonté par l'équipe", {
owner: "Coordination",
priority: "high",
workflowType: "spirit_blocking_issue",
dueDate: addDays(1),
notes: note.text,
})
);
}

if (
note.level === "urgent" &&
!text.includes("refus") &&
!text.includes("pas de reponse") &&
!text.includes("bloque")
) {
actions.push(
createWorkflowAction("Traiter une note urgente de coordination", {
owner: "Équipe",
priority: "high",
workflowType: "spirit_urgent_note",
dueDate: addDays(0),
notes: note.text,
})
);
}

return actions;
});
}

function dedupeActions(actions = []) {
const seen = new Set();

return actions.filter((action) => {
const key = normalize(
`${action.label}|${action.workflowType}|${action.linkedResourceId || ""}|${action.notes || ""}`
);

if (seen.has(key)) return false;
seen.add(key);
return true;
});
}

function buildAlerts(actions = [], patient) {
const alerts = [];
const followUps = patient?.resourceFollowUp || [];
const notes = patient?.spiritNotes || [];

if (actions.some((item) => item.workflowType === "ase_opening")) {
alerts.push({
id: "alert_ase",
level: "high",
label: "Circuit ASE / pédiatrie à ouvrir",
});
}

if (actions.some((item) => item.workflowType === "hdj_assessment")) {
alerts.push({
id: "alert_hdj",
level: "medium",
label: "HDJ à évaluer comme levier",
});
}

if (actions.some((item) => item.workflowType === "refusal_alternative")) {
alerts.push({
id: "alert_refusal",
level: "high",
label: "Refus ressource : alternative à organiser",
});
}

if (actions.some((item) => item.workflowType === "resource_relance")) {
alerts.push({
id: "alert_relance",
level: "medium",
label: "Relance ressource à programmer",
});
}

if (actions.some((item) => item.workflowType === "complex_discharge_checklist")) {
alerts.push({
id: "alert_discharge",
level: "high",
label: "Sortie complexe à sécuriser",
});
}

if (
followUps.some((item) => {
const elapsed = hoursSince(item.contactedAt);
return elapsed !== null && elapsed >= 72 && item.status !== "accepted";
})
) {
alerts.push({
id: "alert_delay",
level: "high",
label: "Absence de réponse prolongée sur une ou plusieurs ressources",
});
}

if (notes.some((note) => note.level === "urgent" && !note.isRead)) {
alerts.push({
id: "alert_spirit_urgent",
level: "high",
label: "Note terrain urgente non lue",
});
}

return alerts;
}

export function runWorkflowEngine({ patient, engineResult }) {
const actions = [
...buildRefusalWorkflow(patient),
...buildPendingWorkflow(patient),
...buildHDJWorkflow(patient, engineResult),
...buildASEWorkflow(patient),
...buildSocialWorkflow(patient),
...buildDischargeWorkflow(patient),
...buildCollectiveWorkflow(engineResult),
...buildSpiritNotesWorkflow(patient),
];

const suggestedWorkflowActions = dedupeActions(actions);
const alerts = buildAlerts(suggestedWorkflowActions, patient);

return {
suggestedWorkflowActions,
alerts,
};
}
