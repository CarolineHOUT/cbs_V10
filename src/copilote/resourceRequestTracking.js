export const REQUEST_STATUSES = [
{ value: "a_creer", label: "À créer" },
{ value: "a_contacter", label: "À contacter" },
{ value: "en_cours", label: "En cours" },
{ value: "envoyee", label: "Envoyée" },
{ value: "en_attente", label: "En attente" },
{ value: "acceptee", label: "Acceptée" },
{ value: "refusee", label: "Refusée" },
{ value: "cloturee", label: "Clôturée" },
];

export const REFUSAL_REASONS = [
{ value: "refus_prestataire", label: "Refus prestataire" },
{ value: "refus_patient", label: "Refus patient" },
{ value: "refus_entourage", label: "Refus entourage" },
{ value: "hors_secteur", label: "Hors secteur" },
{ value: "absence_place", label: "Absence de place" },
{ value: "dossier_incomplet", label: "Dossier incomplet" },
{ value: "delai_incompatible", label: "Délai incompatible" },
{ value: "besoin_non_couvert", label: "Besoin non couvert" },
{ value: "autre", label: "Autre" },
];

export function createEmptyRequestState(resource) {
return {
resourceId: resource.id,
status: "a_creer",
refusalReason: "",
refusalComment: "",
lastContactAt: "",
nextFollowUpAt: "",
note: "",
history: [],
};
}

export function ensureRequestStateMap(resources = [], existingMap = {}) {
const next = { ...existingMap };

resources.forEach((resource) => {
if (!next[resource.id]) {
next[resource.id] = createEmptyRequestState(resource);
}
});

return next;
}

export function addRequestHistoryEntry(requestState, actionLabel) {
return {
...requestState,
history: [
{
id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
at: new Date().toISOString(),
label: actionLabel,
},
...(requestState.history || []),
],
};
}

export function updateRequestStatus(requestState, status) {
const label =
REQUEST_STATUSES.find((item) => item.value === status)?.label || status;

return addRequestHistoryEntry(
{
...requestState,
status,
},
`Statut mis à jour : ${label}`
);
}

export function applyRequestRefusal(
requestState,
refusalReason,
refusalComment = ""
) {
const reasonLabel =
REFUSAL_REASONS.find((item) => item.value === refusalReason)?.label ||
refusalReason ||
"Refus";

return addRequestHistoryEntry(
{
...requestState,
status: "refusee",
refusalReason,
refusalComment,
},
`Refus enregistré : ${reasonLabel}`
);
}

export function updateLastContact(requestState, dateValue) {
return addRequestHistoryEntry(
{
...requestState,
lastContactAt: dateValue,
},
`Dernier contact : ${dateValue || "non précisé"}`
);
}

export function updateNextFollowUp(requestState, dateValue) {
return addRequestHistoryEntry(
{
...requestState,
nextFollowUpAt: dateValue,
},
`Relance prévue : ${dateValue || "non précisée"}`
);
}

export function updateRequestNote(requestState, note) {
return {
...requestState,
note,
};
}