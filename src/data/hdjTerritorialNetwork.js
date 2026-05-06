// src/data/hdjTerritorialNetwork.js

export const HDJ_TERRITORIAL_NEEDS = [
{
id: "hdj_ch_cotentin_geriatrie_autonomie",
hospital: "CH Cotentin",
city: "Cherbourg-en-Cotentin",
territory: "Nord Cotentin",
title: "HDJ gériatrie – autonomie / fragilité",
family: "geriatrie",

description:
"Évaluation gériatrique, autonomie, fragilité et sécurisation du retour à domicile.",

patientProfiles: [
"personne âgée fragile",
"perte d’autonomie",
"retour domicile fragile",
"chutes",
"isolement",
"aidant épuisé",
],

acts: [
"évaluation gériatrique",
"bilan autonomie",
"évaluation kiné",
"évaluation ergo",
"coordination sociale",
"préparation retour domicile",
],

acceptedNeeds: [
"sécurisation sortie",
"évaluation globale",
"coordination retour domicile",
"aide à l’orientation",
],

exclusions: [
"urgence vitale",
"instabilité clinique",
"besoin de surveillance continue",
],

tags: [
"autonomie",
"fragilité",
"gériatrie",
"retour domicile",
"isolement",
"social",
],

averageDelayDays: 5,
availabilityStatus: "a_verifier",

contact: {
service: "Secrétariat HDJ gériatrie",
phone: "",
email: "",
},

documentsRequired: [
"courrier médical",
"traitements en cours",
"compte-rendu d’hospitalisation",
],
},

{
id: "hdj_ch_cotentin_soins_techniques",
hospital: "CH Cotentin",
city: "Cherbourg-en-Cotentin",
territory: "Nord Cotentin",
title: "HDJ soins techniques transitoires",
family: "technique",

description:
"Prise en charge ambulatoire de soins techniques programmés en relais ou en attente d’organisation extérieure.",

patientProfiles: [
"patient sortant avec soins techniques",
"attente relais IDEL",
"pansements complexes",
"surveillance IDE",
],

acts: [
"pansements complexes",
"surveillance IDE",
"perfusion",
"réévaluation clinique",
"coordination relais extérieur",
],

acceptedNeeds: [
"soins programmés",
"relais temporaire",
"sécurisation de sortie",
],

exclusions: [
"surveillance continue",
"décompensation aiguë",
"besoin hospitalisation complète",
],

tags: [
"soins",
"pansement",
"perfusion",
"surveillance IDE",
"IDEL",
"technique",
],

averageDelayDays: 3,
availabilityStatus: "a_verifier",

contact: {
service: "Secrétariat HDJ soins",
phone: "",
email: "",
},

documentsRequired: [
"prescription médicale",
"protocole de soins",
"traitements en cours",
],
},

{
id: "hdj_saint_lo_coordination_sociale",
hospital: "CH Saint-Lô",
city: "Saint-Lô",
territory: "Centre Manche",
title: "HDJ coordination médico-sociale",
family: "social",

description:
"HDJ orienté coordination sociale, droits, aidants, logement et sécurisation du parcours.",

patientProfiles: [
"précarité",
"aidant épuisé",
"isolement",
"droits sociaux non ouverts",
"retour domicile impossible",
],

acts: [
"évaluation sociale",
"entretien assistante sociale",
"coordination DAC",
"aide aux droits",
"organisation aides domicile",
],

acceptedNeeds: [
"coordination sociale",
"sécurisation retour domicile",
"préparation aides",
"orientation médico-sociale",
],

exclusions: [
"urgence sociale immédiate sans stabilité médicale",
"danger immédiat nécessitant mesure de protection urgente",
],

tags: [
"social",
"précarité",
"aidant épuisé",
"isolement",
"droits",
"DAC",
"domicile",
],

averageDelayDays: 7,
availabilityStatus: "a_verifier",

contact: {
service: "Coordination HDJ médico-social",
phone: "",
email: "",
},

documentsRequired: [
"synthèse sociale",
"courrier médical",
"situation familiale",
],
},

{
id: "hdj_avranches_therapeutique",
hospital: "CH Avranches-Granville",
city: "Avranches",
territory: "Sud Manche",
title: "HDJ thérapeutique – adaptation traitement",
family: "therapeutique",

description:
"Suivi ambulatoire pour adaptation thérapeutique, surveillance clinique et éducation thérapeutique.",

patientProfiles: [
"observance fragile",
"polymédication",
"iatrogénie",
"équilibrage traitement",
"risque de réhospitalisation",
],

acts: [
"bilan thérapeutique",
"ajustement traitement",
"éducation thérapeutique",
"surveillance clinique",
"réévaluation médicale",
],

acceptedNeeds: [
"adaptation thérapeutique",
"surveillance post-hospitalisation",
"sécurisation traitement",
],

exclusions: [
"patient instable",
"surveillance continue",
"urgence médicale",
],

tags: [
"traitement",
"observance",
"iatrogénie",
"surveillance",
"post-hospitalisation",
],

averageDelayDays: 6,
availabilityStatus: "a_verifier",

contact: {
service: "Secrétariat HDJ thérapeutique",
phone: "",
email: "",
},

documentsRequired: [
"ordonnance",
"courrier médical",
"biologie récente si disponible",
],
},

{
id: "hdj_coutances_pediatrie_coordination",
hospital: "CH Coutances",
city: "Coutances",
territory: "Centre Manche",
title: "HDJ pédiatrie – coordination / parentalité",
family: "pediatrie",

description:
"Parcours pédiatrique ambulatoire pour situations de coordination, parentalité fragile, lien PMI / ASE / pédopsy.",

patientProfiles: [
"situation pédiatrique",
"parentalité fragile",
"besoin PMI",
"besoin ASE",
"coordination pédopsy",
],

acts: [
"évaluation pluridisciplinaire",
"coordination PMI",
"lien ASE",
"entretien famille",
"synthèse d’orientation",
],

acceptedNeeds: [
"coordination pédiatrique",
"soutien parentalité",
"sécurisation parcours enfant",
],

exclusions: [
"urgence pédiatrique",
"danger immédiat",
"instabilité clinique",
],

tags: [
"pédiatrie",
"PMI",
"ASE",
"parentalité",
"famille",
"coordination",
],

averageDelayDays: 8,
availabilityStatus: "a_verifier",

contact: {
service: "Secrétariat HDJ pédiatrie",
phone: "",
email: "",
},

documentsRequired: [
"courrier médical",
"éléments sociaux",
"coordonnées représentants légaux",
],
},
];

export const HDJ_AVAILABILITY_LABELS = {
disponible: "Disponible",
tension: "En tension",
sature: "Saturé",
a_verifier: "À vérifier",
};

// ===============================
// OFFRES TERRITORIALES (HDJ réels par établissement)
// ===============================
export const HDJ_TERRITORIAL_OFFERS = [];

// ===============================
// PARCOURS STRUCTURÉS (logique intelligente)
// ===============================
export const HDJ_TERRITORIAL_PATHWAYS = [];