// src/data/hdjActsCatalog.js

export const HDJ_ACTS_CATALOG = [
// =========================
// INFIRMIER / CLINIQUE
// =========================
{
id: "act_bilan_infirmier",
family: "Infirmier / Clinique",
label: "Bilan infirmier",
description: "Évaluation infirmière initiale ou de suivi.",
tags: ["IDE", "bilan"],
},
{
id: "act_surveillance_clinique",
family: "Infirmier / Clinique",
label: "Surveillance clinique",
description: "Surveillance ciblée de l’état clinique.",
tags: ["surveillance", "clinique"],
},
{
id: "act_constantes",
family: "Infirmier / Clinique",
label: "Surveillance des constantes",
description: "Mesure et suivi des paramètres vitaux.",
tags: ["constantes", "surveillance"],
},
{
id: "act_pansement_simple",
family: "Infirmier / Clinique",
label: "Pansement simple",
description: "Réalisation ou réfection de pansement simple.",
tags: ["pansement", "soin"],
},
{
id: "act_pansement_complexe",
family: "Infirmier / Clinique",
label: "Pansement complexe",
description: "Réalisation ou réfection de pansement complexe.",
tags: ["pansement", "complexe"],
},
{
id: "act_perfusion",
family: "Infirmier / Clinique",
label: "Surveillance perfusion",
description: "Surveillance ou gestion d’une perfusion.",
tags: ["perfusion", "surveillance"],
},
{
id: "act_traitement",
family: "Infirmier / Clinique",
label: "Administration de traitement",
description: "Administration programmée d’un traitement.",
tags: ["traitement", "administration"],
},
{
id: "act_prelevement",
family: "Infirmier / Clinique",
label: "Prélèvement biologique",
description: "Réalisation de prélèvements prescrits.",
tags: ["prélèvement", "biologie"],
},
{
id: "act_education_therapeutique",
family: "Infirmier / Clinique",
label: "Éducation thérapeutique infirmière",
description: "Accompagnement du patient sur ses soins ou traitements.",
tags: ["éducation", "traitement"],
},

// =========================
// MÉDICAL
// =========================
{
id: "act_consultation_medicale",
family: "Médical",
label: "Consultation médicale",
description: "Consultation médicale dans le cadre du HDJ.",
tags: ["consultation", "médecin"],
},
{
id: "act_reevaluation_medicale",
family: "Médical",
label: "Réévaluation médicale",
description: "Réévaluation ciblée de la situation clinique.",
tags: ["réévaluation", "médical"],
},
{
id: "act_adaptation_therapeutique",
family: "Médical",
label: "Adaptation thérapeutique",
description: "Révision ou ajustement du traitement.",
tags: ["thérapeutique", "traitement"],
},
{
id: "act_avis_medical",
family: "Médical",
label: "Avis médical ciblé",
description: "Avis médical sur un point spécifique de la prise en charge.",
tags: ["avis", "médical"],
},
{
id: "act_entretien_medical_synthese",
family: "Médical",
label: "Entretien médical de synthèse",
description: "Temps de synthèse médicale avec le patient.",
tags: ["synthèse", "entretien"],
},

// =========================
// SOCIAL
// =========================
{
id: "act_entretien_social",
family: "Social",
label: "Entretien social",
description: "Entretien avec l’assistante sociale ou référent social.",
tags: ["social", "entretien"],
},
{
id: "act_evaluation_sociale",
family: "Social",
label: "Évaluation sociale",
description: "Évaluation de la situation sociale globale.",
tags: ["social", "évaluation"],
},
{
id: "act_ouverture_droits",
family: "Social",
label: "Ouverture / reprise de droits",
description: "Travail sur les droits sociaux et aides possibles.",
tags: ["droits", "administratif"],
},
{
id: "act_dossier_social",
family: "Social",
label: "Mise à jour dossier social",
description: "Constitution ou actualisation des éléments sociaux.",
tags: ["dossier", "social"],
},
{
id: "act_entretien_aidants",
family: "Social",
label: "Entretien entourage / aidants",
description: "Temps d’échange avec les proches ou aidants.",
tags: ["aidants", "entourage"],
},

// =========================
// AUTONOMIE / RÉÉDUCATION
// =========================
{
id: "act_evaluation_autonomie",
family: "Autonomie / Rééducation",
label: "Évaluation autonomie",
description: "Évaluation de l’autonomie dans les actes de la vie quotidienne.",
tags: ["autonomie", "évaluation"],
},
{
id: "act_evaluation_mobilite",
family: "Autonomie / Rééducation",
label: "Évaluation mobilité",
description: "Évaluation des déplacements et transferts.",
tags: ["mobilité", "évaluation"],
},
{
id: "act_risque_chute",
family: "Autonomie / Rééducation",
label: "Évaluation risque de chute",
description: "Repérage et analyse du risque de chute.",
tags: ["chute", "risque"],
},
{
id: "act_bilan_ergo",
family: "Autonomie / Rééducation",
label: "Bilan ergothérapie",
description: "Évaluation ergothérapique ciblée.",
tags: ["ergothérapie", "bilan"],
},
{
id: "act_bilan_kine",
family: "Autonomie / Rééducation",
label: "Bilan kinésithérapie",
description: "Évaluation kinésithérapique ciblée.",
tags: ["kiné", "bilan"],
},
{
id: "act_aides_techniques",
family: "Autonomie / Rééducation",
label: "Essai aides techniques",
description: "Essai ou ajustement d’aides techniques.",
tags: ["aides techniques", "essai"],
},

// =========================
// COORDINATION (ACTES CONCRETS)
// =========================
{
id: "act_appel_idel",
family: "Coordination",
label: "Appel IDEL",
description: "Contact avec IDEL pour relais ou faisabilité.",
tags: ["IDEL", "appel"],
},
{
id: "act_appel_ssiad",
family: "Coordination",
label: "Appel SSIAD",
description: "Contact avec SSIAD pour relais ou admission.",
tags: ["SSIAD", "appel"],
},
{
id: "act_appel_saad",
family: "Coordination",
label: "Appel SAAD",
description: "Contact avec SAAD pour mise en place ou ajustement.",
tags: ["SAAD", "appel"],
},
{
id: "act_appel_had",
family: "Coordination",
label: "Appel HAD",
description: "Contact avec HAD pour évaluation de faisabilité.",
tags: ["HAD", "appel"],
},
{
id: "act_contact_partenaire",
family: "Coordination",
label: "Contact partenaire externe",
description: "Prise de contact avec une structure ou partenaire externe.",
tags: ["partenaire", "contact"],
},
{
id: "act_reunion_pluri",
family: "Coordination",
label: "Réunion pluriprofessionnelle",
description: "Temps d’échange entre professionnels autour du patient.",
tags: ["réunion", "pluri-pro"],
},
{
id: "act_entretien_famille",
family: "Coordination",
label: "Entretien de coordination avec la famille",
description: "Entretien avec la famille autour de l’organisation de la prise en charge.",
tags: ["famille", "coordination"],
},
{
id: "act_point_equipe",
family: "Coordination",
label: "Point de coordination équipe",
description: "Point d’équipe sur l’avancement des relais et besoins.",
tags: ["équipe", "coordination"],
},
{
id: "act_preparation_dossier_orientation",
family: "Coordination",
label: "Préparation dossier orientation",
description: "Préparation concrète d’un dossier de demande ou d’orientation.",
tags: ["dossier", "orientation"],
},
{
id: "act_relance_structure",
family: "Coordination",
label: "Relance structure sollicitée",
description: "Relance d’une structure en attente de réponse.",
tags: ["relance", "structure"],
},

// =========================
// PÉDIATRIE / FAMILLE
// =========================
{
id: "act_entretien_parentalite",
family: "Pédiatrie / Famille",
label: "Entretien parentalité",
description: "Entretien autour de la parentalité et de l’organisation familiale.",
tags: ["parentalité", "entretien"],
},
{
id: "act_coordination_famille_partenaires",
family: "Pédiatrie / Famille",
label: "Coordination famille / partenaires",
description: "Coordination avec la famille et les partenaires concernés.",
tags: ["famille", "partenaires"],
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
return HDJ_FREQUENCIES.find((item) => item.value === value)?.label || value || "";
}

export function durationLabelFromValue(value) {
return HDJ_DURATIONS.find((item) => item.value === value)?.label || value || "";
}

export function priorityLabelFromValue(value) {
return HDJ_PRIORITIES.find((item) => item.value === value)?.label || value || "";
}

export function toggleHDJAct(acts = [], act) {
const exists = acts.some((item) => item.id === act.id);
if (exists) {
return acts.filter((item) => item.id !== act.id);
}
return [...acts, act];
}

export function toggleHDJWeekday(weekdays = [], day) {
if (weekdays.includes(day)) {
return weekdays.filter((item) => item !== day);
}
return [...weekdays, day];
}

export function createEmptyHDJDraft(patient = null) {
const id = String(Date.now());

return {
id: `hdj_draft_${id}`,
title: "Demande HDJ par actes",
patientId: patient?.id || "",
patientLabel: patient
? `${patient.nom || ""} ${patient.prenom || ""}`.trim()
: "",
acts: [],
programming: {
startDate: "",
frequency: "weekly",
duration: "2_weeks",
weekdays: [],
priority: "normale",
},
targetSecretariat: "HDJ à préciser",
comment: "",
status: "draft",
createdAt: new Date().toISOString(),
};
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
`Intitulé : ${draft.title || "Demande HDJ par actes"}`,
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