export const COPILOTE_PROVIDER_STATUSES = [
{ value: "a_creer", label: "À créer" },
{ value: "a_contacter", label: "À contacter" },
{ value: "diffusee", label: "Diffusée" },
{ value: "prise_en_charge", label: "Prise en charge" },
{ value: "en_cours", label: "En cours" },
{ value: "en_attente", label: "En attente" },
{ value: "acceptee", label: "Acceptée" },
{ value: "refusee", label: "Refusée" },
{ value: "cloturee", label: "Clôturée" },
];

export const COPILOTE_PROVIDER_CHANNELS = [
{ value: "telephone", label: "Téléphone" },
{ value: "mail", label: "Mail" },
{ value: "mssante", label: "MSSanté" },
{ value: "trajectoire", label: "ViaTrajectoire" },
{ value: "portail", label: "Portail" },
{ value: "autre", label: "Autre" },
];

export const COPILOTE_PROVIDER_REFUSAL_REASONS = [
{ value: "absence_place", label: "Absence de place" },
{ value: "hors_secteur", label: "Hors secteur" },
{ value: "dossier_incomplet", label: "Dossier incomplet" },
{ value: "delai_incompatible", label: "Délai incompatible" },
{ value: "refus_prestataire", label: "Refus prestataire" },
{ value: "refus_patient", label: "Refus patient" },
{ value: "refus_entourage", label: "Refus entourage" },
{ value: "besoin_non_couvert", label: "Besoin non couvert" },
{ value: "autre", label: "Autre" },
];

export function createEmptyCopiloteProviderRequest(resource) {
return {
resourceId: resource.id,
structureName: resource.label || "",
status: "a_creer",
channel: "",
initiatedBy: "",
handledBy: "",
sentAt: "",
answeredAt: "",
nextFollowUpAt: "",
refusalReason: "",
refusalComment: "",
note: "",
history: [],
};
}

export function ensureCopiloteProviderRequestMap(resources = [], existingMap = {}) {
const next = { ...existingMap };

resources.forEach((resource) => {
if (!next[resource.id]) {
next[resource.id] = createEmptyCopiloteProviderRequest(resource);
}
});

return next;
}

function addHistory(state, label) {
return {
...state,
history: [
{
id: `provider_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
at: new Date().toISOString(),
label,
},
...(state.history || []),
],
};
}

export function updateCopiloteProviderStatus(state, value) {
const label =
COPILOTE_PROVIDER_STATUSES.find((item) => item.value === value)?.label || value;

return addHistory(
{
...state,
status: value,
},
`Statut : ${label}`
);
}

export function updateCopiloteProviderChannel(state, value) {
const label =
COPILOTE_PROVIDER_CHANNELS.find((item) => item.value === value)?.label || value;

return addHistory(
{
...state,
channel: value,
},
`Canal : ${label}`
);
}

export function updateCopiloteProviderField(
state,
field,
value,
historyLabel = ""
) {
const next = {
...state,
[field]: value,
};

return historyLabel ? addHistory(next, historyLabel) : next;
}

export function applyCopiloteProviderRefusal(
state,
refusalReason,
refusalComment = ""
) {
const label =
COPILOTE_PROVIDER_REFUSAL_REASONS.find((item) => item.value === refusalReason)
?.label || refusalReason || "Refus";

return addHistory(
{
...state,
status: "refusee",
refusalReason,
refusalComment,
},
`Refus : ${label}`
);
}
