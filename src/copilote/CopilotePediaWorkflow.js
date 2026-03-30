export const COPILOTE_PEDIA_WORKFLOW_STATUSES = [
{ value: "DRAFT", label: "Brouillon" },
{ value: "ANALYSIS_READY", label: "Analyse prête" },
{ value: "VALIDATED", label: "Validé" },
{ value: "BROADCASTED", label: "Diffusé" },
{ value: "CLAIMED", label: "Pris en charge" },
{ value: "IN_PROGRESS", label: "En cours" },
{ value: "READY_FOR_MEETING", label: "Prêt réunion" },
{ value: "CLOSED", label: "Clôturé" },
];

export const COPILOTE_PEDIA_ORIENTATIONS = [
{ value: "ASE", label: "ASE" },
{ value: "PEDOPSY", label: "Pédopsy" },
{ value: "PMI", label: "PMI" },
{ value: "PERINATALITE", label: "Réseau périnatalité" },
{ value: "DOUBLE", label: "ASE + Pédopsy" },
];

export const COPILOTE_PEDIA_STEP_STATUSES = [
{ value: "a_faire", label: "À faire" },
{ value: "en_cours", label: "En cours" },
{ value: "fait", label: "Fait" },
{ value: "non_applicable", label: "Non applicable" },
];

export function createCopilotePediaDefaultSteps() {
return [
{
id: "pre_analyse",
label: "Pré-analyse de la situation enfant / famille",
actor: "Médecin / IDE",
role: "Repérage",
status: "a_faire",
condition: "",
},
{
id: "evaluation_sociale",
label: "Évaluation sociale",
actor: "Assistant social",
role: "Analyse",
status: "a_faire",
condition: "Si vulnérabilité sociale / familiale",
},
{
id: "evaluation_psychique",
label: "Évaluation psychique / pédopsy",
actor: "Médecin",
role: "Analyse",
status: "a_faire",
condition: "Si besoin pédopsy / santé mentale",
},
{
id: "concertation_pluri",
label: "Concertation pluridisciplinaire",
actor: "Cadre",
role: "Coordination",
status: "a_faire",
condition: "",
},
{
id: "validation_senior",
label: "Validation senior / décision d’orientation",
actor: "Senior médical",
role: "Validation",
status: "a_faire",
condition: "",
},
{
id: "formulaire_medical",
label: "Préparation du formulaire médical",
actor: "Médecin",
role: "Rédaction",
status: "a_faire",
condition: "",
},
{
id: "formulaire_externe",
label: "Préparation du formulaire externe ASE / pédopsy / PMI",
actor: "Assistant social / Cadre",
role: "Rédaction",
status: "a_faire",
condition: "Selon orientation retenue",
},
{
id: "diffusion",
label: "Diffusion sécurisée aux destinataires",
actor: "Cadre / Secrétariat",
role: "Transmission",
status: "a_faire",
condition: "",
},
{
id: "prise_en_charge_externe",
label: "Prise en charge par le partenaire externe",
actor: "Partenaire externe",
role: "Claim",
status: "a_faire",
condition: "",
},
{
id: "preparation_reunion",
label: "Préparation du point / réunion / staff",
actor: "Cadre",
role: "Pilotage",
status: "a_faire",
condition: "Si point de coordination nécessaire",
},
{
id: "information_famille",
label: "Information famille / représentants",
actor: "IDE / Médecin",
role: "Communication",
status: "a_faire",
condition: "Selon cadre légal et décision médicale",
},
{
id: "cloture",
label: "Clôture et traçabilité finale",
actor: "Cadre",
role: "Clôture",
status: "a_faire",
condition: "",
},
];
}

export function createEmptyCopilotePediaWorkflow() {
return {
orientation: "",
status: "DRAFT",

formMedical: {
created: false,
sent: false,
sentAt: "",
link: "",
note: "",
},

formExternal: {
created: false,
sent: false,
sentAt: "",
link: "",
note: "",
},

recipients: [],
recipientsText: "",
claimedBy: "",
broadcastChannel: "",
broadcastedAt: "",
meetingDate: "",
note: "",

steps: createCopilotePediaDefaultSteps(),
history: [],
};
}

function addCopilotePediaHistory(state, label) {
return {
...state,
history: [
{
id: `copilote_pedia_${Date.now()}_${Math.random()
.toString(36)
.slice(2, 7)}`,
at: new Date().toISOString(),
label,
},
...(state.history || []),
],
};
}

export function updateCopilotePediaField(
state,
field,
value,
historyLabel = ""
) {
const next = {
...state,
[field]: value,
};

return historyLabel ? addCopilotePediaHistory(next, historyLabel) : next;
}

export function updateCopilotePediaForm(
state,
formKey,
updates,
historyLabel = ""
) {
const next = {
...state,
[formKey]: {
...state[formKey],
...updates,
},
};

return historyLabel ? addCopilotePediaHistory(next, historyLabel) : next;
}

export function updateCopilotePediaStep(state, stepId, newStatus) {
return addCopilotePediaHistory(
{
...state,
steps: (state.steps || []).map((step) =>
step.id === stepId ? { ...step, status: newStatus } : step
),
},
`Étape mise à jour : ${stepId} → ${newStatus}`
);
}

export function getCopilotePediaProgress(state) {
const steps = state?.steps || [];
if (steps.length === 0) return 0;

const relevantSteps = steps.filter(
(step) => step.status !== "non_applicable"
);
if (relevantSteps.length === 0) return 0;

const done = relevantSteps.filter((step) => step.status === "fait").length;
return Math.round((done / relevantSteps.length) * 100);
}

export function getCopilotePediaStatusLabel(status) {
return (
COPILOTE_PEDIA_WORKFLOW_STATUSES.find((item) => item.value === status)
?.label || status
);
}

export function getCopilotePediaOrientationLabel(value) {
return (
COPILOTE_PEDIA_ORIENTATIONS.find((item) => item.value === value)?.label ||
value
);
}
