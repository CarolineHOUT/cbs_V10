// src/copilote/territorialResources.js

export const TERRITORIAL_RESOURCES = [

// =========================
// 🏠 IDEL (Infirmiers libéraux)
// =========================

{
id: "idel_cherbourg_01",
label: "Cabinet IDEL Martin",
type: "IDEL",
territory: {
territoryKey: "cherbourg",
zones: ["Cherbourg-en-Cotentin", "Tourlaville"]
},
contact: {
phone: "02 33 00 11 22",
email: "idel.martin@cabinet.fr",
address: "Cherbourg"
},
capabilities: [
"pansements",
"injections",
"surveillance",
"prise en charge complexe"
],
tags: [
"domicile",
"soins techniques",
"sortie",
"coordination"
],
access: {
mode: "appel direct",
delay: "24-48h"
},
fieldKnowledge: {
tips: [
"Très réactif le matin",
"Bon relais pour retour domicile rapide"
],
knownIssues: [
"Refus si dépendance très lourde"
]
}
},

{
id: "idel_valognes_01",
label: "Cabinet IDEL Dupont",
type: "IDEL",
territory: {
territoryKey: "valognes",
zones: ["Valognes", "Brix"]
},
contact: {
phone: "02 33 10 22 33",
email: "",
address: "Valognes"
},
capabilities: [
"toilette",
"pansements",
"surveillance"
],
tags: ["domicile", "soins de base"],
access: {
mode: "appel direct",
delay: "48h"
}
},

{
id: "idel_la_hague",
label: "Cabinet IDEL La Hague",
type: "IDEL",
territory: {
territoryKey: "la_hague",
zones: ["La Hague"]
},
contact: {
phone: "02 33 55 66 77",
address: "La Hague"
},
capabilities: ["surveillance", "pansements"],
tags: ["rural", "domicile"],
access: {
mode: "appel direct",
delay: "variable"
}
},

// =========================
// 🏡 SSIAD / SPASAD
// =========================

{
id: "ssiad_cherbourg",
label: "SSIAD Cherbourg",
type: "SSIAD",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 44 55 66"
},
capabilities: [
"toilette",
"surveillance",
"accompagnement dépendance"
],
tags: ["domicile", "personne âgée"],
access: {
mode: "orientation médicale",
delay: "liste attente"
}
},

{
id: "spasad_cotentin",
label: "SPASAD Cotentin",
type: "SPASAD",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 88 77 66"
},
capabilities: [
"aide domicile",
"soins",
"coordination"
],
tags: ["domicile", "global"],
access: {
mode: "coordination",
delay: "variable"
}
},

// =========================
// 🏥 HAD / SMR / HDJ
// =========================

{
id: "had_cotentin",
label: "HAD Cotentin",
type: "HAD",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 99 88 77"
},
capabilities: [
"soins lourds",
"coordination médicale",
"perfusion",
"palliatif"
],
tags: ["domicile", "complexe", "alternatif hospitalisation"],
access: {
mode: "prescription médicale",
delay: "24-72h"
},
fieldKnowledge: {
tips: [
"Très utile pour éviter hospitalisation",
"Bon relais avec IDEL"
]
}
},

{
id: "smr_valognes",
label: "SMR Valognes",
type: "SMR",
territory: {
territoryKey: "valognes"
},
contact: {
phone: "02 33 77 66 55"
},
capabilities: [
"rééducation",
"convalescence",
"suite hospitalisation"
],
tags: ["rééducation", "post-hospitalisation"],
access: {
mode: "ViaTrajectoire",
delay: "variable"
}
},

{
id: "hdj_cherbourg",
label: "HDJ Médecine Cherbourg",
type: "HDJ",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 66 55 44"
},
capabilities: [
"bilan",
"surveillance",
"soins programmés"
],
tags: ["hôpital de jour"],
access: {
mode: "demande interne",
delay: "rapide"
}
},

// =========================
// 👵 EHPAD
// =========================

{
id: "ehpad_cherbourg_01",
label: "EHPAD Les Jardins de Cherbourg",
type: "EHPAD",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 22 33 44"
},
capabilities: [
"hébergement",
"prise en charge dépendance"
],
tags: ["institution", "personne âgée"],
access: {
mode: "ViaTrajectoire",
delay: "variable"
}
},

{
id: "ehpad_valognes",
label: "EHPAD Valognes",
type: "EHPAD",
territory: {
territoryKey: "valognes"
},
contact: {
phone: "02 33 11 22 33"
},
capabilities: ["hébergement"],
tags: ["institution"],
access: {
mode: "ViaTrajectoire"
}
},
// =========================
// 🤝 DAC / COORDINATION / CPTS
// =========================

{
id: "dac_cotentin",
label: "DAC Cotentin",
type: "DAC",
territory: {
territoryKey: "cotentin",
zones: ["Cherbourg", "Valognes", "Carentan", "La Hague", "Les Pieux", "Brix"]
},
contact: {
phone: "02 33 90 10 20",
email: "dac.cotentin@coordination.fr",
address: "Cotentin"
},
capabilities: [
"coordination complexe",
"appui parcours",
"appui maintien domicile",
"concertation pluriprofessionnelle"
],
tags: [
"coordination",
"parcours complexe",
"territoire",
"appui"
],
access: {
mode: "appel direct ou orientation professionnelle",
delay: "24-72h"
},
fieldKnowledge: {
tips: [
"Très utile si plusieurs acteurs à articuler",
"Bon point d'entrée pour situations complexes"
]
}
},

{
id: "cpts_cotentin",
label: "CPTS Cotentin",
type: "CPTS",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 90 30 40",
email: "contact@cpts-cotentin.fr",
address: "Cotentin"
},
capabilities: [
"coordination ville-hôpital",
"orientation professionnels",
"appui parcours"
],
tags: ["coordination", "ville-hopital"],
access: {
mode: "contact coordination",
delay: "variable"
}
},

{
id: "assistante_sociale_hospitaliere_cherbourg",
label: "Assistante sociale hospitalière Cherbourg",
type: "ASSISTANTE_SOCIALE",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 70 10 10",
address: "CH secteur Cherbourg"
},
capabilities: [
"évaluation sociale",
"droits",
"orientation",
"sortie complexe"
],
tags: ["social", "hôpital", "droits"],
access: {
mode: "interne établissement",
delay: "selon disponibilité"
}
},

{
id: "assistante_sociale_hospitaliere_valognes",
label: "Assistante sociale hospitalière Valognes",
type: "ASSISTANTE_SOCIALE",
territory: {
territoryKey: "valognes"
},
contact: {
phone: "02 33 70 20 20",
address: "CH secteur Valognes"
},
capabilities: [
"évaluation sociale",
"droits",
"orientation",
"lien partenaires"
],
tags: ["social", "hôpital"],
access: {
mode: "interne établissement",
delay: "selon disponibilité"
}
},

// =========================
// 🏠 AIDE À DOMICILE / SAAD
// =========================

{
id: "saad_cherbourg",
label: "SAAD secteur Cherbourg",
type: "SAAD",
territory: {
territoryKey: "cherbourg",
zones: ["Cherbourg-en-Cotentin", "Tourlaville"]
},
contact: {
phone: "02 33 40 50 60",
address: "Cherbourg"
},
capabilities: [
"aide toilette",
"aide repas",
"aide courses",
"accompagnement domicile"
],
tags: ["domicile", "aide humaine"],
access: {
mode: "contact direct / dossier aide",
delay: "variable"
}
},

{
id: "saad_valognes",
label: "SAAD secteur Valognes",
type: "SAAD",
territory: {
territoryKey: "valognes",
zones: ["Valognes", "Brix"]
},
contact: {
phone: "02 33 40 60 70",
address: "Valognes"
},
capabilities: [
"aide toilette",
"aide repas",
"accompagnement"
],
tags: ["domicile", "aide humaine"],
access: {
mode: "contact direct",
delay: "variable"
}
},

{
id: "saad_carentan",
label: "SAAD secteur Carentan",
type: "SAAD",
territory: {
territoryKey: "carentan",
zones: ["Carentan", "Saint-Hilaire-Petitville"]
},
contact: {
phone: "02 33 40 70 80",
address: "Carentan"
},
capabilities: [
"aide domicile",
"aide humaine",
"accompagnement quotidien"
],
tags: ["domicile", "carentan"],
access: {
mode: "contact direct",
delay: "variable"
}
},

// =========================
// 👶 PÉDIATRIE / ASE / PMI
// =========================

{
id: "pediatrie_ch_cherbourg",
label: "Pédiatrie CH Cherbourg",
type: "PEDIATRIE",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 45 12 34",
address: "CH Cherbourg"
},
capabilities: [
"avis pédiatrique",
"évaluation enfant",
"coordination hospitalière pédiatrique"
],
tags: ["pédiatrie", "enfant", "hôpital"],
access: {
mode: "avis interne / contact service",
delay: "selon urgence"
}
},

{
id: "ase_manche_nord",
label: "ASE Manche Nord",
type: "ASE",
territory: {
territoryKey: "cotentin",
zones: ["Cherbourg", "Valognes", "Carentan"]
},
contact: {
phone: "02 33 50 60 10",
email: "ase.nord@manche.fr",
address: "Manche Nord"
},
capabilities: [
"protection enfance",
"évaluation situation mineur",
"suivi ASE"
],
tags: ["ase", "protection enfance", "enfant"],
access: {
mode: "saisine / transmission",
delay: "selon gravité"
},
fieldKnowledge: {
tips: [
"À articuler avec documents médicaux et sociaux",
"Tracer précisément la transmission"
]
}
},

{
id: "criip_manche",
label: "Cellule information préoccupante Manche",
type: "CRIP",
territory: {
territoryKey: "manche"
},
contact: {
phone: "02 33 50 70 20",
email: "crip@manche.fr",
address: "Département Manche"
},
capabilities: [
"information préoccupante",
"évaluation enfance en danger"
],
tags: ["crip", "ip", "enfance"],
access: {
mode: "transmission selon procédure",
delay: "selon gravité"
}
},

{
id: "pmi_cotentin",
label: "PMI Cotentin",
type: "PMI",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 50 80 30",
address: "Cotentin"
},
capabilities: [
"suivi mère-enfant",
"appui parentalité",
"prévention"
],
tags: ["pmi", "parentalité", "enfant"],
access: {
mode: "contact territorial",
delay: "variable"
}
},

// =========================
// 🧠 PSY / COGNITION / APPUI
// =========================

{
id: "cmp_cherbourg",
label: "CMP Cherbourg",
type: "CMP",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 60 11 22",
address: "Cherbourg"
},
capabilities: [
"suivi psychiatrique",
"évaluation psychique",
"orientation santé mentale"
],
tags: ["cmp", "psy", "sante mentale"],
access: {
mode: "orientation médicale / contact service",
delay: "variable"
}
},

{
id: "psychologue_hospitalier_cherbourg",
label: "Psychologue hospitalier Cherbourg",
type: "PSYCHOLOGUE",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 61 22 33",
address: "CH Cherbourg"
},
capabilities: [
"entretien psychologique",
"soutien patient",
"soutien aidants"
],
tags: ["psychologue", "soutien"],
access: {
mode: "interne établissement",
delay: "selon disponibilité"
}
},

{
id: "consultation_memoire_cotentin",
label: "Consultation mémoire Cotentin",
type: "CONSULTATION_MEMOIRE",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 62 33 44",
address: "Cotentin"
},
capabilities: [
"évaluation cognitive",
"bilan mémoire",
"orientation gériatrique"
],
tags: ["memoire", "cognition", "geriatrie"],
access: {
mode: "avis médical / orientation",
delay: "variable"
}
},
// =========================
// 🧓 GÉRIATRIE / ACCUEIL DE JOUR / RÉSIDENCE
// =========================

{
id: "accueil_jour_cherbourg",
label: "Accueil de jour gérontologique Cherbourg",
type: "ACCUEIL_DE_JOUR",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 71 10 20",
address: "Cherbourg"
},
capabilities: [
"répit aidants",
"accueil journée",
"évaluation maintien domicile"
],
tags: ["gériatrie", "répit", "jour"],
access: {
mode: "contact direct / orientation",
delay: "variable"
}
},

{
id: "residence_autonomie_valognes",
label: "Résidence autonomie Valognes",
type: "RESIDENCE_AUTONOMIE",
territory: {
territoryKey: "valognes"
},
contact: {
phone: "02 33 71 20 30",
address: "Valognes"
},
capabilities: [
"hébergement semi-autonome",
"cadre sécurisé",
"appui maintien autonomie"
],
tags: ["résidence autonomie", "logement", "personne âgée"],
access: {
mode: "dossier / orientation",
delay: "variable"
}
},

// =========================
// 🦿 RÉÉDUCATION / AIDES TECHNIQUES
// =========================

{
id: "kine_cherbourg_01",
label: "Cabinet Kiné Cherbourg Centre",
type: "KINE",
territory: {
territoryKey: "cherbourg"
},
contact: {
phone: "02 33 72 10 10",
address: "Cherbourg"
},
capabilities: [
"rééducation",
"mobilité",
"retour domicile"
],
tags: ["kiné", "rééducation", "domicile"],
access: {
mode: "prescription / appel direct",
delay: "variable"
}
},

{
id: "ergo_cotentin",
label: "Ergothérapeute secteur Cotentin",
type: "ERGOTHERAPIE",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 72 20 20",
address: "Cotentin"
},
capabilities: [
"évaluation autonomie",
"adaptation domicile",
"préconisations aides techniques"
],
tags: ["ergo", "autonomie", "domicile"],
access: {
mode: "orientation / contact",
delay: "variable"
}
},

{
id: "prestataire_aides_techniques_cotentin",
label: "Prestataire aides techniques Cotentin",
type: "AIDES_TECHNIQUES",
territory: {
territoryKey: "cotentin"
},
contact: {
phone: "02 33 72 30 30",
address: "Cotentin"
},
capabilities: [
"lit médicalisé",
"fauteuil",
"matériel domicile",
"installation rapide"
],
tags: ["matériel", "aides techniques", "domicile"],
access: {
mode: "prescription / commande",
delay: "24-72h"
}
},

// =========================
// 📄 FORMULAIRES SOCIAUX / ORIENTATION
// =========================

{
id: "formulaire_apa",
label: "Dossier APA",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "Département Manche"
},
capabilities: [
"allocation personnalisée autonomie",
"aide dépendance",
"maintien domicile"
],
tags: [
"formulaire",
"social",
"apa",
"personne âgée",
"dépendance"
],
access: {
mode: "dossier administratif",
delay: "instruction départementale"
},
fieldKnowledge: {
tips: [
"Souvent indispensable pour consolider le maintien à domicile",
"Prévoir pièces justificatives et évaluation"
],
knownIssues: [
"Délais administratifs parfois longs"
]
}
},

{
id: "formulaire_pch",
label: "Dossier PCH",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "MDPH Manche"
},
capabilities: [
"prestation compensation handicap",
"aides humaines",
"aides techniques"
],
tags: [
"formulaire",
"social",
"pch",
"handicap",
"mdph"
],
access: {
mode: "dossier MDPH",
delay: "instruction MDPH"
}
},

{
id: "formulaire_mdph",
label: "Dossier MDPH",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "MDPH Manche"
},
capabilities: [
"reconnaissance handicap",
"orientation",
"prestations handicap"
],
tags: [
"formulaire",
"mdph",
"handicap",
"orientation"
],
access: {
mode: "dossier administratif",
delay: "variable"
}
},

{
id: "formulaire_aide_menagere",
label: "Demande aide ménagère",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "CCAS / caisse / organisme financeur"
},
capabilities: [
"aide domicile",
"soutien quotidien",
"maintien domicile"
],
tags: [
"formulaire",
"social",
"aide ménagère",
"domicile"
],
access: {
mode: "dossier administratif",
delay: "variable"
}
},

{
id: "formulaire_obligation_alimentaire",
label: "Dossier obligation alimentaire",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "Département / structure d’accueil"
},
capabilities: [
"évaluation participation financière",
"instruction hébergement"
],
tags: [
"formulaire",
"social",
"obligation alimentaire",
"ehpad"
],
access: {
mode: "dossier administratif",
delay: "variable"
}
},

{
id: "formulaire_aide_sociale_hebergement",
label: "Demande aide sociale hébergement",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "Département Manche"
},
capabilities: [
"hébergement",
"ehpad",
"prise en charge financière"
],
tags: [
"formulaire",
"social",
"hébergement",
"ehpad",
"ash"
],
access: {
mode: "dossier départemental",
delay: "instruction départementale"
},
fieldKnowledge: {
tips: [
"À anticiper tôt quand la solution institutionnelle se profile",
"Souvent bloquant si incomplet"
]
}
},

{
id: "formulaire_mesure_protection",
label: "Demande mesure de protection",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "manche"
},
contact: {
address: "Juge / greffe / circuit social"
},
capabilities: [
"protection juridique",
"tutelle",
"curatelle"
],
tags: [
"formulaire",
"protection",
"juridique",
"tutelle",
"curatelle"
],
access: {
mode: "évaluation + dossier",
delay: "variable"
}
},

{
id: "formulaire_signalement_ase",
label: "Trame signalement ASE / IP",
type: "FORMULAIRE_ASE",
territory: {
territoryKey: "manche"
},
contact: {
address: "ASE / CRIP Manche"
},
capabilities: [
"information préoccupante",
"transmission ASE",
"protection enfance"
],
tags: [
"formulaire",
"ase",
"ip",
"enfance",
"signalement"
],
access: {
mode: "procédure interne / transmission",
delay: "selon gravité"
}
},

{
id: "formulaire_compte_rendu_social",
label: "Trame compte rendu social",
type: "FORMULAIRE_SOCIAL",
territory: {
territoryKey: "cotentin"
},
contact: {
address: "Interne établissement"
},
capabilities: [
"synthèse sociale",
"transmission équipe",
"orientation"
],
tags: [
"trame",
"social",
"compte rendu",
"transmission"
],
access: {
mode: "interne",
delay: "immédiat"
}
},

{
id: "formulaire_dossier_sortie_complexe",
label: "Checklist sortie complexe",
type: "FORMULAIRE_COORDINATION",
territory: {
territoryKey: "cotentin"
},
contact: {
address: "Interne établissement"
},
capabilities: [
"coordination sortie",
"sécurisation relais",
"vérification dossier"
],
tags: [
"checklist",
"sortie",
"coordination",
"domicile"
],
access: {
mode: "interne",
delay: "immédiat"
}
},

// =========================
// 🧭 ORIENTATION / OUTILS
// =========================

{
id: "outil_viatrajectoire_ehpad",
label: "ViaTrajectoire EHPAD",
type: "OUTIL_ORIENTATION",
territory: {
territoryKey: "national"
},
contact: {
address: "Plateforme nationale"
},
capabilities: [
"orientation ehpad",
"demande institution",
"suivi demandes"
],
tags: [
"outil",
"viatrajectoire",
"ehpad",
"orientation"
],
access: {
mode: "plateforme",
delay: "immédiat"
}
},

{
id: "outil_viatrajectoire_smr",
label: "ViaTrajectoire SMR",
type: "OUTIL_ORIENTATION",
territory: {
territoryKey: "national"
},
contact: {
address: "Plateforme nationale"
},
capabilities: [
"orientation smr",
"suite hospitalisation",
"rééducation"
],
tags: [
"outil",
"viatrajectoire",
"smr",
"orientation"
],
access: {
mode: "plateforme",
delay: "immédiat"
}
},

{
id: "outil_annuaire_social_local",
label: "Annuaire social local Cotentin",
type: "OUTIL_ORIENTATION",
territory: {
territoryKey: "cotentin"
},
contact: {
address: "Territoire Cotentin"
},
capabilities: [
"repérage partenaires",
"ressources sociales",
"orientation locale"
],
tags: [
"outil",
"annuaire",
"social",
"territoire"
],
access: {
mode: "consultation",
delay: "immédiat"
}
}
];
