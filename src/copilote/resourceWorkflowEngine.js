function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function addDays(days) {
return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
.toISOString()
.slice(0, 10);
}

function buildAction(label, overrides = {}) {
return {
id: overrides.id || `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
label,
responsable: overrides.responsable || "À définir",
status: overrides.status || "a_faire",
statut: overrides.statut || overrides.status || "a_faire",
priorite: overrides.priorite || "standard",
source: overrides.source || "workflow",
echeance: overrides.echeance || "",
dueDate: overrides.echeance || "",
prochaineRelance: overrides.prochaineRelance || "",
nextReminderAt: overrides.prochaineRelance || "",
typeDemande: overrides.typeDemande || "",
workflowType: overrides.typeDemande || "",
notes: overrides.notes || "",
linkedResourceId: overrides.linkedResourceId || null,
};
}

export function buildWorkflowFromResource({ resource, patient }) {
if (!resource) {
return {
actions: [],
forms: [],
platform: null,
followUp: null,
contactCard: null,
};
}

const type = normalize(resource.type);
const actions = [];

actions.push(
buildAction(`Contacter ${resource.label}`, {
responsable: "Coordination / secrétariat",
priorite: "haute",
echeance: addDays(1),
typeDemande: `contact_${type.replace(/\s+/g, "_")}`,
linkedResourceId: resource.id,
notes: resource.note || "",
})
);

if (type === "had") {
actions.push(
buildAction("Préparer le dossier médical et la demande HAD", {
responsable: "Médecin / IDE",
priorite: "haute",
echeance: addDays(1),
typeDemande: "demande_had",
linkedResourceId: resource.id,
})
);
}

if (type === "ssiad") {
actions.push(
buildAction("Préparer les éléments de soins et d’autonomie", {
responsable: "IDE / AS",
priorite: "haute",
echeance: addDays(1),
typeDemande: "contact_ssiad",
linkedResourceId: resource.id,
})
);
}

if (type === "aide a domicile") {
actions.push(
buildAction("Vérifier les besoins d’aide humaine au domicile", {
responsable: "AS / équipe",
priorite: "standard",
echeance: addDays(2),
typeDemande: "contact_aide_domicile",
linkedResourceId: resource.id,
})
);
}

if (type === "hebergement temporaire" || type === "ehpad") {
actions.push(
buildAction("Préparer la demande d’hébergement", {
responsable: "AS / secrétariat",
priorite: "haute",
echeance: addDays(1),
typeDemande: "demande_hebergement_temporaire",
linkedResourceId: resource.id,
})
);
}

return {
actions,
forms: [],
platform: resource.platform || null,
followUp: {
workflowType: `suivi_${type.replace(/\s+/g, "_")}`,
notes: resource.note || "",
},
contactCard: {
name: resource.label,
phone: resource.contact?.phone || "",
email: resource.contact?.email || "",
postalAddress: resource.contact?.address || "",
territory: Array.isArray(resource.territory)
? resource.territory.join(", ")
: resource.territory || "",
note: resource.note || "",
},
};
}
