export const HDJ_MODELS = [
// 🧓 GERIATRIE
{
id: "hdj_geriatrie_global",
title: "HDJ gériatrique - évaluation globale",
triggers: {
autonomie: "dependant",
},
acts: ["Bilan gériatrique", "Kiné", "Ergo", "Évaluation sociale"],
frequency: "2x/semaine",
duration: "4 semaines",
},

{
id: "hdj_perte_autonomie",
title: "HDJ réadaptation autonomie",
triggers: {
autonomie: "semi_dependant",
},
acts: ["Kiné", "Ergo", "Réentraînement fonctionnel"],
frequency: "2x/semaine",
duration: "4 semaines",
},

// 🏠 SOCIAL
{
id: "hdj_isolement",
title: "HDJ coordination médico-sociale",
triggers: {
isolement: true,
},
acts: ["Assistante sociale", "Coordination domicile", "Évaluation aides"],
frequency: "ponctuel",
duration: "1 à 3 séances",
},

{
id: "hdj_precarite",
title: "HDJ accompagnement précarité",
triggers: {
precarite: true,
},
acts: ["Assistante sociale", "Accès aux droits", "Coordination"],
frequency: "ponctuel",
duration: "court",
},

// 💊 TRAITEMENT
{
id: "hdj_traitement",
title: "HDJ sécurisation traitement",
triggers: {
traitementComplexe: true,
},
acts: ["Conciliation médicamenteuse", "Pharmacien", "IDE"],
frequency: "ponctuel",
duration: "2 séances",
},

{
id: "hdj_education",
title: "HDJ éducation thérapeutique",
triggers: {
traitementNiveau: "surveillance_rapprochee",
},
acts: ["Éducation thérapeutique", "IDE", "Médecin"],
frequency: "séquentiel",
duration: "3 semaines",
},

// 🧠 COGNITIF
{
id: "hdj_cognitif_leger",
title: "HDJ troubles cognitifs - évaluation",
triggers: {
cognition: "trouble_leger",
},
acts: ["Bilan neuro", "Gériatre", "Psychologue"],
frequency: "1x/semaine",
duration: "6 semaines",
},

{
id: "hdj_cognitif_severe",
title: "HDJ mémoire - prise en charge renforcée",
triggers: {
cognition: "trouble_severe",
},
acts: ["Gériatre", "IDE", "Psychologue", "Coordination"],
frequency: "1 à 2x/semaine",
duration: "8 semaines",
},

// 🩺 INSTABILITÉ
{
id: "hdj_post_hospit",
title: "HDJ surveillance post-hospitalisation",
triggers: {
instabilite: "fragile",
},
acts: ["Consultation", "Biologie", "Adaptation traitement"],
frequency: "1x/semaine",
duration: "3 semaines",
},

{
id: "hdj_instable",
title: "HDJ suivi rapproché médical",
triggers: {
instabilite: "instable",
},
acts: ["Médecin", "IDE", "Surveillance clinique"],
frequency: "2x/semaine",
duration: "4 semaines",
},

// 🫁 REEDUCATION
{
id: "hdj_kine",
title: "HDJ rééducation fonctionnelle",
triggers: {
besoinKine: true,
},
acts: ["Kiné", "Ergo", "Réentraînement"],
frequency: "2 à 3x/semaine",
duration: "6 semaines",
},

// 🧪 TECHNIQUE
{
id: "hdj_bilan",
title: "HDJ bilan technique regroupé",
triggers: {
besoinExamens: true,
},
acts: ["Biologie", "Imagerie", "Consultations"],
frequency: "ponctuel",
duration: "1 journée",
},

// 🔥 COMPLEXE (multi facteurs)
{
id: "hdj_complexe",
title: "HDJ parcours coordonné complexe",
triggers: {
autonomie: "dependant",
isolement: true,
},
acts: [
"Coordination pluridisciplinaire",
"Gériatre",
"Assistante sociale",
"Kiné",
"IDE",
],
frequency: "2 à 3x/semaine",
duration: "8 semaines",
},
];
