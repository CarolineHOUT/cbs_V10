export const PROVIDER_REQUEST_STATUSES = [
{ value: "DRAFT", label: "Brouillon" },
{ value: "BROADCASTED", label: "Diffusée" },
{ value: "CLAIMED", label: "Prise en charge" },
{ value: "IN_PROGRESS", label: "En cours" },
{ value: "READY_FOR_MEETING", label: "Prête pour réunion" },
{ value: "CLOSED", label: "Clôturée" },
];

export const PROVIDER_REQUEST_CHANNELS = [
{ value: "mssante", label: "MSSanté" },
{ value: "email_securise", label: "Email sécurisé" },
{ value: "portail_carabbas", label: "Portail CARABBAS" },
{ value: "telephone", label: "Téléphone" },
];

export function createEmptyProviderRequest(resource) {
return {
resourceId: resource.id,
status: "DRAFT",
structureName: resource.label || "",
channel: "",
initiatedBy: "",
claimedBy: "",
broadcastedAt: "",
claimedAt: "",
meetingDate: "",
note: "",
history: [],
};
}

export function ensureProviderRequestMap(resources = [], existingMap = {}) {
const next = { ...existingMap };

resources.forEach((resource) => {
if (!next[resource.id]) {
next[resource.id] = createEmptyProviderRequest(resource);
}
});

return next;
}

function addProviderHistoryEntry(state, label) {
return {
...state,
history: [
{
id: `provider_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
at: new Date().toISOString(),
label,
},
...(state.history || []),
],
};
}

export function updateProviderStatus(state, status) {
const label =
PROVIDER_REQUEST_STATUSES.find((item) => item.value === status)?.label || status;

return addProviderHistoryEntry(
{
...state,
status,
},
`Statut demande : ${label}`
);
}

export function updateProviderChannel(state, channel) {
const label =
PROVIDER_REQUEST_CHANNELS.find((item) => item.value === channel)?.label || channel;

return addProviderHistoryEntry(
{
...state,
channel,
},
`Canal sélectionné : ${label || "non précisé"}`
);
}

export function updateProviderField(state, field, value, historyLabel = "") {
const next = {
...state,
[field]: value,
};

if (!historyLabel) return next;

return addProviderHistoryEntry(next, historyLabel);
}