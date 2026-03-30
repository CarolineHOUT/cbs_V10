export const HDJ_ACTS_BY_FAMILY = {
"Soins / surveillance": [
"Soins infirmiers",
"Pansements complexes",
"Perfusion",
"Injection / traitement programmé",
"Surveillance clinique",
"Surveillance poids / constantes",
"Surveillance glycémique",
"Évaluation douleur",
],
"Bilans / évaluations": [
"Bilan gériatrique",
"Bilan fonctionnel",
"Bilan social",
"Évaluation autonomie",
"Évaluation psychologique",
"Évaluation pédopsy",
"Évaluation nutritionnelle",
"Réévaluation parcours",
],
"Rééducation / réadaptation": [
"Kinésithérapie",
"Orthophonie",
"Ergothérapie",
"Psychomotricité",
"Réentraînement fonctionnel",
],
"Coordination / parcours": [
"Coordination de sortie",
"Coordination ville-hôpital",
"Coordination aidants",
"Coordination sociale",
"Coordination médico-sociale",
],
"Éducation / accompagnement": [
"Éducation thérapeutique",
"Accompagnement observance",
"Accompagnement aidants",
"Soutien parental",
"Préparation retour domicile",
],
"Pédiatrie / maternité": [
"Consultation pédopsy",
"Accompagnement parental renforcé",
"Coordination PMI",
"Coordination réseau périnatalité",
"Suivi mère-enfant",
"Soutien parentalité fragile",
],
};

export const HDJ_RECURRENCES = [
{ value: "ponctuel", label: "Ponctuel" },
{ value: "1x_semaine", label: "1 fois / semaine" },
{ value: "2x_semaine", label: "2 fois / semaine" },
{ value: "3x_semaine", label: "3 fois / semaine" },
{ value: "quotidien_ouvre", label: "Quotidien ouvré" },
{ value: "personnalise", label: "Personnalisé" },
];

export const HDJ_DURATIONS = [
{ value: "1_semaine", label: "1 semaine" },
{ value: "2_semaines", label: "2 semaines" },
{ value: "3_semaines", label: "3 semaines" },
{ value: "1_mois", label: "1 mois" },
{ value: "personnalise", label: "Personnalisée" },
];

export const HDJ_WEEK_DAYS = [
"Lundi",
"Mardi",
"Mercredi",
"Jeudi",
"Vendredi",
"Samedi",
];

export const HDJ_TIME_WINDOWS = [
"Matin",
"Après-midi",
"Journée",
"À confirmer",
];

export function createEmptyHDJDraft(patient) {
return {
id: `hdj_${Date.now()}`,
patientId: patient?.id || "",
createdAt: new Date().toISOString(),
createdBy: "Utilisateur CARABBAS",
contexte: {
categories: [],
subcategories: {},
freinPrincipal: patient?.blockReason || patient?.blocage || "",
orientationPrincipale: patient?.orientation || "",
alternative: "HDJ",
},
actes: [],
programmation: {
dateDebutSouhaitee: "",
frequence: "ponctuel",
recurrenceLabel: "Ponctuel",
duree: "1_semaine",
dureeLabel: "1 semaine",
joursSouhaites: [],
plageHoraire: "À confirmer",
},
commentaire: "",
statut: {
envoi: "a_envoyer",
priorite: "normale",
},
destination: {
type: "secretariat_hdj",
service: "HDJ polyvalent",
},
trace: [
{
date: new Date().toISOString(),
action: "création",
auteur: "Utilisateur CARABBAS",
},
],
};
}

export function buildHDJActEntry(family, label) {
return { famille: family, label };
}

export function toggleHDJAct(list, family, label) {
const exists = list.some(
(item) => item.famille === family && item.label === label
);

if (exists) {
return list.filter(
(item) => !(item.famille === family && item.label === label)
);
}

return [...list, buildHDJActEntry(family, label)];
}

export function actIsSelected(list, family, label) {
return list.some((item) => item.famille === family && item.label === label);
}

export function recurrenceLabelFromValue(value) {
return (
HDJ_RECURRENCES.find((item) => item.value === value)?.label || "Ponctuel"
);
}

export function durationLabelFromValue(value) {
return HDJ_DURATIONS.find((item) => item.value === value)?.label || "1 semaine";
}

export function toggleWeekDay(days, day) {
return days.includes(day)
? days.filter((item) => item !== day)
: [...days, day];
}

export function buildHDJSecretaryMessage({ patient, draft }) {
const actsText =
draft.actes.length > 0
? draft.actes.map((item) => `- ${item.label}`).join("\n")
: "- Aucun acte sélectionné";

const daysText =
draft.programmation.joursSouhaites.length > 0
? draft.programmation.joursSouhaites.join(", ")
: "Non précisés";

return [
`Demande HDJ – ${patient.nom} ${patient.prenom}`,
``,
`Date souhaitée : ${draft.programmation.dateDebutSouhaitee || "À préciser"}`,
`Fréquence : ${draft.programmation.recurrenceLabel}`,
`Durée : ${draft.programmation.dureeLabel}`,
`Jours souhaités : ${daysText}`,
`Plage horaire : ${draft.programmation.plageHoraire}`,
``,
`Actes demandés`,
actsText,
``,
`Contexte`,
draft.contexte.freinPrincipal || "À préciser",
``,
`Commentaire`,
draft.commentaire || "Aucun commentaire",
].join("\n");
}

export function buildHDJSuggestions({
selectedCategories = [],
selectedSubcategories = {},
patient,
}) {
const suggestions = [];

const hasCategory = (name) => selectedCategories.includes(name);
const hasSub = (category, value) =>
Array.isArray(selectedSubcategories?.[category]) &&
selectedSubcategories[category].includes(value);

if (hasCategory("Coordination de soins")) {
suggestions.push({
title: "HDJ coordination de sortie",
acts: [
{ famille: "Coordination / parcours", label: "Coordination de sortie" },
{ famille: "Bilans / évaluations", label: "Réévaluation parcours" },
],
reason: "Pertinent quand plusieurs relais doivent être sécurisés.",
});
}

if (
hasSub("Coordination de soins", "Soins techniques à organiser") ||
hasSub("Coordination de soins", "Absence IDE")
) {
suggestions.push({
title: "HDJ soins techniques sécurisés",
acts: [
{ famille: "Soins / surveillance", label: "Soins infirmiers" },
{ famille: "Soins / surveillance", label: "Pansements complexes" },
{ famille: "Coordination / parcours", label: "Coordination ville-hôpital" },
],
reason: "Permet de sécuriser une sortie avec relais techniques incomplets.",
});
}

if (
hasCategory("Autonomie / Gérontologie") ||
hasSub("Autonomie / Gérontologie", "Perte d’autonomie")
) {
suggestions.push({
title: "HDJ autonomie / réévaluation",
acts: [
{ famille: "Bilans / évaluations", label: "Évaluation autonomie" },
{ famille: "Rééducation / réadaptation", label: "Ergothérapie" },
{ famille: "Coordination / parcours", label: "Coordination aidants" },
],
reason: "Utile pour préparer un retour avec besoin d’adaptation et de relais.",
});
}

if (
hasCategory("Pédiatrie / Maternité") ||
hasSub("Pédiatrie / Maternité", "Structure pédopsy") ||
hasSub("Pédiatrie / Maternité", "Accompagnement parental")
) {
suggestions.push({
title: "HDJ parentalité / pédopsy",
acts: [
{ famille: "Pédiatrie / maternité", label: "Consultation pédopsy" },
{ famille: "Pédiatrie / maternité", label: "Soutien parentalité fragile" },
{ famille: "Pédiatrie / maternité", label: "Coordination PMI" },
],
reason: "Utile en sortie fragile avec besoin de soutien parental et suivi spécialisé.",
});
}

if (
hasCategory("Social") &&
(hasSub("Social", "Absence aidant") || hasSub("Social", "Isolement"))
) {
suggestions.push({
title: "HDJ coordination sociale renforcée",
acts: [
{ famille: "Bilans / évaluations", label: "Bilan social" },
{ famille: "Coordination / parcours", label: "Coordination sociale" },
{ famille: "Éducation / accompagnement", label: "Accompagnement aidants" },
],
reason: "Permet de construire une sortie plus sécurisée quand l’entourage est fragile.",
});
}

if ((patient?.orientation || "").includes("HAD")) {
suggestions.push({
title: "HDJ relais en attente HAD",
acts: [
{ famille: "Soins / surveillance", label: "Surveillance clinique" },
{ famille: "Coordination / parcours", label: "Coordination de sortie" },
],
reason: "Alternative transitoire quand le relais HAD n’est pas encore stabilisé.",
});
}

return suggestions.slice(0, 4);
}