// src/data/hdjCatalogModel.js

export const HDJ_CATALOG = [
{
id: "hdj_coordination_complexe",
title: "Carnet HDJ coordination de parcours complexe",
family: "coordination",
description:
"Carnet destiné aux situations de sortie complexe avec besoin de coordination rapprochée.",
indications: [
"Retour domicile complexe",
"Multiplicité d’acteurs",
"Besoin de sécurisation rapide",
],
tags: ["coordination", "sortie complexe", "transitoire"],
defaultActs: [
{ family: "Coordination", label: "Évaluation initiale" },
{ family: "Coordination", label: "Point coordination IDE / AS / médecin" },
{ family: "Suivi", label: "Réévaluation hebdomadaire" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat: "HDJ coordination",
},
{
id: "hdj_soins_techniques",
title: "Carnet HDJ soins techniques transitoires",
family: "technique",
description:
"Carnet dédié aux soins techniques temporaires en attente d’un relais extérieur.",
indications: [
"Pansements complexes",
"Attente relais IDEL",
"Surveillance technique",
],
tags: ["technique", "pansement", "IDEL", "transitoire"],
defaultActs: [
{ family: "Soins", label: "Soins techniques programmés" },
{ family: "Coordination", label: "Préparation relais extérieur" },
{ family: "Suivi", label: "Point clinique hebdomadaire" },
],
defaultProgramming: {
startDate: "",
frequency: "2_per_week",
duration: "2_weeks",
weekdays: [],
priority: "haute",
},
targetSecretariat: "HDJ soins",
},
{
id: "hdj_retour_domicile_fragile",
title: "Carnet HDJ retour domicile fragile",
family: "domicile",
description:
"Carnet de sécurisation du retour domicile pour patient fragile ou isolement important.",
indications: ["Isolement", "Fragilité globale", "Entourage limité"],
tags: ["domicile", "fragilité", "isolement"],
defaultActs: [
{ family: "Évaluation", label: "Bilan de retour domicile" },
{ family: "Coordination", label: "Vérification des relais" },
{ family: "Suivi", label: "Réévaluation adaptation domicile" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "4_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat: "HDJ parcours",
},
{
id: "hdj_autonomie_dependance",
title: "Carnet HDJ évaluation autonomie / dépendance",
family: "evaluation",
description:
"Carnet d’évaluation de l’autonomie et d’aide à l’orientation secondaire.",
indications: [
"Perte d’autonomie",
"Doute sur le retour domicile",
"Besoin d’orientation",
],
tags: ["autonomie", "dépendance", "orientation"],
defaultActs: [
{ family: "Évaluation", label: "Évaluation fonctionnelle" },
{ family: "Social", label: "Évaluation sociale" },
{ family: "Coordination", label: "Synthèse d’orientation" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat: "HDJ évaluation",
},
{
id: "hdj_social_medicosocial",
title: "Carnet HDJ social / médico-social",
family: "social",
description:
"Carnet orienté précarité, logement, droits et coordination médico-sociale.",
indications: [
"Problème de logement",
"Précarité",
"Droits non ouverts",
],
tags: ["social", "logement", "droits", "médico-social"],
defaultActs: [
{ family: "Social", label: "Point assistante sociale" },
{ family: "Coordination", label: "Mobilisation partenaires" },
{ family: "Suivi", label: "Réévaluation plan social" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "4_weeks",
weekdays: [],
priority: "haute",
},
targetSecretariat: "HDJ social",
},
{
id: "hdj_attente_solution_externe",
title: "Carnet HDJ relais en attente de solution externe",
family: "transitoire",
description:
"Carnet transitoire pendant l’attente d’une solution externe ou institutionnelle.",
indications: [
"Attente SMR",
"Attente EHPAD",
"Relais externe indisponible",
],
tags: ["transitoire", "attente", "SMR", "EHPAD"],
defaultActs: [
{ family: "Coordination", label: "Point de situation hebdomadaire" },
{ family: "Suivi", label: "Maintien du lien de parcours" },
{ family: "Orientation", label: "Révision de la stratégie si délai" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "4_weeks",
weekdays: [],
priority: "haute",
},
targetSecretariat: "HDJ coordination",
},
{
id: "hdj_pediatrie_parentalite",
title: "Carnet HDJ pédiatrie / parentalité",
family: "pedia",
description:
"Carnet pour situations pédiatriques ou de parentalité nécessitant coordination pluridisciplinaire.",
indications: [
"Parentalité fragile",
"Besoin PMI / ASE / pédopsy",
"Coordination pluri-acteurs",
],
tags: ["pédiatrie", "parentalité", "ASE", "PMI", "pédopsy"],
defaultActs: [
{ family: "Évaluation", label: "Évaluation pluridisciplinaire" },
{ family: "Coordination", label: "Lien avec partenaires externes" },
{ family: "Suivi", label: "Point de situation programmé" },
],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "haute",
},
targetSecretariat: "HDJ pédiatrie",
},
{
id: "hdj_sur_mesure",
title: "Carnet HDJ sur mesure",
family: "custom",
description:
"Carnet libre à composer selon le besoin spécifique du patient.",
indications: ["Situation atypique", "Besoin de personnalisation"],
tags: ["sur mesure"],
defaultActs: [],
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat: "HDJ à préciser",
},
];

export const HDJ_FREQUENCIES = [
{ value: "one_shot", label: "Ponctuel" },
{ value: "weekly", label: "1 fois par semaine" },
{ value: "2_per_week", label: "2 fois par semaine" },
{ value: "3_per_week", label: "3 fois par semaine" },
{ value: "biweekly", label: "Tous les 15 jours" },
];

export const HDJ_DURATIONS = [
{ value: "1_week", label: "1 semaine" },
{ value: "2_weeks", label: "2 semaines" },
{ value: "4_weeks", label: "4 semaines" },
{ value: "8_weeks", label: "8 semaines" },
];

export const HDJ_PRIORITIES = [
{ value: "normale", label: "Normale" },
{ value: "haute", label: "Haute" },
{ value: "urgente", label: "Urgente" },
];

export const HDJ_WEEKDAYS = [
"Lundi",
"Mardi",
"Mercredi",
"Jeudi",
"Vendredi",
];

export function frequencyLabelFromValue(value) {
return (
HDJ_FREQUENCIES.find((item) => item.value === value)?.label || value || ""
);
}

export function durationLabelFromValue(value) {
return (
HDJ_DURATIONS.find((item) => item.value === value)?.label || value || ""
);
}

export function priorityLabelFromValue(value) {
return (
HDJ_PRIORITIES.find((item) => item.value === value)?.label || value || ""
);
}

export function createHDJDraftFromTemplate(template, patient = null) {
if (!template) return null;

return {
id: `hdj_draft_${Date.now()}`,
templateId: template.id,
title: template.title,
family: template.family,
description: template.description,
patientId: patient?.id || "",
patientLabel: patient
? `${patient.nom || ""} ${patient.prenom || ""}`.trim()
: "",
acts: Array.isArray(template.defaultActs) ? [...template.defaultActs] : [],
programming: {
startDate: template.defaultProgramming?.startDate || "",
frequency: template.defaultProgramming?.frequency || "weekly",
duration: template.defaultProgramming?.duration || "2_weeks",
weekdays: Array.isArray(template.defaultProgramming?.weekdays)
? [...template.defaultProgramming.weekdays]
: [],
priority: template.defaultProgramming?.priority || "normale",
},
targetSecretariat: template.targetSecretariat || "",
comment: "",
status: "draft",
createdAt: new Date().toISOString(),
};
}

export function toggleHDJWeekday(weekdays = [], day) {
if (weekdays.includes(day)) {
return weekdays.filter((item) => item !== day);
}
return [...weekdays, day];
}

export function buildHDJSecretaryMessage({ patient, draft }) {
if (!draft) return "";

const patientLine = patient
? `${patient.nom || ""} ${patient.prenom || ""}`.trim()
: draft.patientLabel || "Patient non renseigné";

const actsText =
Array.isArray(draft.acts) && draft.acts.length > 0
? draft.acts.map((item) => item.label).join(", ")
: "Actes à préciser";

const weekdaysText =
Array.isArray(draft.programming?.weekdays) &&
draft.programming.weekdays.length > 0
? draft.programming.weekdays.join(", ")
: "Non précisés";

return [
"Demande de programmation HDJ",
"",
`Patient : ${patientLine}`,
`Carnet sélectionné : ${draft.title || "Non renseigné"}`,
`Début souhaité : ${draft.programming?.startDate || "À préciser"}`,
`Fréquence : ${frequencyLabelFromValue(draft.programming?.frequency)}`,
`Durée : ${durationLabelFromValue(draft.programming?.duration)}`,
`Jours souhaités : ${weekdaysText}`,
`Priorité : ${priorityLabelFromValue(draft.programming?.priority)}`,
`Secrétariat cible : ${draft.targetSecretariat || "À préciser"}`,
`Actes retenus : ${actsText}`,
draft.comment ? `Commentaire : ${draft.comment}` : "",
]
.filter(Boolean)
.join("\n");
}

export function addCustomHDJTemplate({
existingCatalog = [],
title = "",
description = "",
indications = [],
tags = [],
defaultActs = [],
targetSecretariat = "HDJ à préciser",
}) {
const template = {
id: `hdj_custom_${Date.now()}`,
title: title || "Carnet HDJ personnalisé",
family: "custom",
description,
indications,
tags,
defaultActs,
defaultProgramming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat,
};

return [template, ...existingCatalog];
}