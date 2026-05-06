import { TERRITORY_HOSPITALS_MANCHE } from "./resourceRegistry";

const TERRITORIAL_NEEDS = [
{
id: "memoire_cognition",
label: "Troubles cognitifs / mémoire",
keywords: ["alzheimer", "mémoire", "cognition", "trouble cognitif", "désorientation", "confusion"],
pathways: ["hdj_memoire"],
arsAngle: "Structurer un parcours mémoire territorial.",
description: "Patients avec troubles cognitifs, désorientation ou retour domicile fragile.",
},
{
id: "geriatrie_fragilite",
label: "Fragilité gériatrique / autonomie",
keywords: ["fragilité", "perte autonomie", "chute", "marche", "aidant épuisé", "grand âge", "dénutrition"],
pathways: ["hdj_geriatrie", "hdj_fragilite"],
arsAngle: "Vieillissement, maintien à domicile, réduction des réhospitalisations.",
description: "Patients âgés fragiles avec perte d’autonomie ou sortie incertaine.",
},
{
id: "coordination_sortie",
label: "Sortie complexe / médico-social",
keywords: ["retour domicile impossible", "coordination", "dac", "isolement", "aidant", "blocage social", "précarité", "droits sociaux"],
pathways: ["hdj_coordination_sortie", "hdj_social_precarite"],
arsAngle: "Réduire les journées évitables par coordination ambulatoire.",
description: "Patients médicalement sortants mais bloqués par l’organisation aval.",
},
{
id: "soins_techniques",
label: "Soins techniques programmables",
keywords: ["pansement", "plaie", "perfusion", "ferinject", "fer iv", "transfusion", "ponction ascite", "ponction pleurale"],
pathways: ["hdj_technique", "hdj_ferinject", "hdj_transfusion", "hdj_ascite", "hdj_pansements"],
arsAngle: "Transformer des actes hospitaliers répétitifs en ambulatoire.",
description: "Actes trop lourds pour la ville mais évitables en hospitalisation complète.",
},
{
id: "pediatrie_psy_crise",
label: "Enfant / ado en crise psychique",
keywords: ["enfant", "ado", "adolescent", "pédiatrie", "psy", "pédopsy", "crise", "angoisse", "dépression", "scarification", "phobie scolaire", "trouble comportement"],
pathways: ["hdj_pedopsy_crise", "hdj_pedopsy_transition"],
arsAngle: "Réduire les hospitalisations pédiatriques inadaptées faute de relais pédopsychiatrique.",
description: "Enfants/adolescents hospitalisés en pédiatrie par défaut alors que le besoin principal est pédopsychiatrique.",
},
{
id: "pediatrie_sociale",
label: "Pédiatrie sociale / protection",
keywords: ["ase", "pmi", "protection", "carence", "violence", "rupture familiale", "parentalité", "information préoccupante", "crip"],
pathways: ["hdj_pediatrie_sociale"],
arsAngle: "Structurer une réponse sanitaire-sociale enfant/famille.",
description: "Enfants vulnérables nécessitant coordination ASE/PMI/famille.",
},
{
id: "pediatrie_neurodev",
label: "Pédiatrie neurodéveloppement",
keywords: ["autisme", "tdah", "trouble neurodéveloppement", "retard développement", "comportement", "scolarité"],
pathways: ["hdj_pediatrie_neurodev"],
arsAngle: "Réduire l’errance diagnostique et coordonner les bilans enfants.",
description: "Enfants avec troubles du développement, comportement ou scolarité.",
},
];

const PATHWAYS = [
{
id: "hdj_memoire",
title: "HDJ mémoire – cognition / sécurisation",
promise: "Qualifier les troubles cognitifs et sécuriser le retour à domicile.",
rhythm: { frequency: "1 jour/semaine", duration: "6 semaines" },
coreActs: ["Bilan cognitif", "Évaluation gériatrique", "Entretien entourage", "Évaluation sociale"],
expectedImpact: ["Sortie plus sûre", "Orientation mémoire structurée"],
},
{
id: "hdj_geriatrie",
title: "HDJ gériatrie – autonomie / fragilité",
promise: "Préserver l’autonomie et éviter une hospitalisation prolongée.",
rhythm: { frequency: "1 jour/semaine", duration: "4 semaines" },
coreActs: ["Évaluation gériatrique", "Bilan fonctionnel", "Évaluation autonomie", "Coordination sociale"],
expectedImpact: ["Réduction DMS", "Retour domicile sécurisé"],
},
{
id: "hdj_fragilite",
title: "HDJ fragilité – personne âgée complexe",
promise: "Éviter les hospitalisations répétées des patients âgés fragiles.",
rhythm: { frequency: "1 à 2 jours/semaine", duration: "4 semaines" },
coreActs: ["Repérage fragilité", "Bilan marche/chute", "Nutrition", "Plan domicile"],
expectedImpact: ["Prévention dépendance", "Maintien domicile"],
},
{
id: "hdj_coordination_sortie",
title: "HDJ coordination et sortie sécurisée",
promise: "Transformer une sortie bloquée en parcours ambulatoire coordonné.",
rhythm: { frequency: "1 jour/semaine", duration: "3 à 4 semaines" },
coreActs: ["Coordination DAC", "Évaluation sociale", "Entretien aidant", "Organisation retour domicile"],
expectedImpact: ["Journées évitables réduites"],
},
{
id: "hdj_social_precarite",
title: "HDJ social – précarité / rupture domicile",
promise: "Traiter les freins sociaux de sortie sans maintenir en hospitalisation complète.",
rhythm: { frequency: "1 jour/semaine", duration: "3 semaines" },
coreActs: ["Évaluation sociale", "Aide aux droits", "Coordination partenaires", "Plan d’aide"],
expectedImpact: ["Sorties débloquées"],
},
{
id: "hdj_ferinject",
title: "HDJ Ferinject / fer IV",
promise: "Corriger rapidement une anémie ferriprive sans hospitalisation.",
rhythm: { frequency: "ponctuel", duration: "1 à 3 séances" },
coreActs: ["Perfusion fer IV", "Surveillance IDE", "Bilan biologique"],
expectedImpact: ["Hospitalisation évitée"],
},
{
id: "hdj_transfusion",
title: "HDJ transfusion sanguine",
promise: "Réaliser transfusions sécurisées en ambulatoire.",
rhythm: { frequency: "ponctuel ou répété", duration: "selon besoin" },
coreActs: ["Transfusion", "Surveillance IDE", "Bilan pré/post transfusion"],
expectedImpact: ["Évite hospitalisation complète"],
},
{
id: "hdj_ascite",
title: "HDJ ponction ascite / pleurale",
promise: "Soulager rapidement sans hospitalisation complète.",
rhythm: { frequency: "ponctuel ou répétitif", duration: "selon récidive" },
coreActs: ["Ponction ascite", "Ponction pleurale", "Surveillance post-geste"],
expectedImpact: ["Moins de passages urgences"],
},
{
id: "hdj_pansements",
title: "HDJ plaies complexes / cicatrisation",
promise: "Prendre en charge des plaies lourdes en ambulatoire.",
rhythm: { frequency: "2 à 3 fois/semaine", duration: "plusieurs semaines" },
coreActs: ["Pansements complexes", "Évaluation plaie", "Nutrition", "Coordination IDEL"],
expectedImpact: ["Évite hospitalisation longue"],
},
{
id: "hdj_pedopsy_crise",
title: "HDJ pédopsychiatrie – crise / régulation",
promise: "Alternative ciblée à l’hospitalisation pédiatrique inadaptée.",
rhythm: { frequency: "2 à 3 jours/semaine", duration: "2 à 4 semaines" },
coreActs: ["Entretien pédopsy", "Observation comportement", "Travail parental", "Coordination école"],
expectedImpact: ["Libération lits pédiatrie"],
},
{
id: "hdj_pedopsy_transition",
title: "HDJ pédopsy transition après crise",
promise: "Éviter la rupture entre urgences, pédiatrie, CMP et famille.",
rhythm: { frequency: "1 à 2 jours/semaine", duration: "4 semaines" },
coreActs: ["Suivi pédopsy rapproché", "Lien CMP", "Travail famille", "Plan de sécurité"],
expectedImpact: ["Moins de réhospitalisations pédiatriques"],
},
{
id: "hdj_pediatrie_sociale",
title: "HDJ pédiatrie sociale – protection / coordination",
promise: "Coordonner l’évaluation médico-sociale d’un enfant vulnérable.",
rhythm: { frequency: "1 jour/semaine", duration: "4 semaines" },
coreActs: ["Évaluation pédiatrique", "Entretien famille", "Lien ASE / PMI", "Coordination école / social"],
expectedImpact: ["Décision plus rapide", "Parcours enfant sécurisé"],
},
{
id: "hdj_pediatrie_neurodev",
title: "HDJ pédiatrie neurodéveloppement",
promise: "Regrouper les bilans et réduire l’errance diagnostique.",
rhythm: { frequency: "1 jour/semaine", duration: "6 semaines" },
coreActs: ["Bilan neurodéveloppement", "Observation comportement", "Entretien parents", "Lien scolaire"],
expectedImpact: ["Diagnostic accéléré"],
},
];

const OFFERS = [
{
id: "territoire_hdj_pedopsy_crise",
title: "HDJ pédopsychiatrie territoriale – crise enfant / ado",
hospital: "Réseau pédopsy Manche",
city: "Multi-sites",
territory: "Départemental",
strategicLevel: "à créer",
isVirtual: true,
territorialTension: "critique",
coverage: ["Nord Cotentin", "Centre Manche", "Sud Manche"],
tags: ["pédopsy", "crise", "ado", "anxiété", "scarification", "phobie scolaire", "pédiatrie saturée"],
pathways: ["hdj_pedopsy_crise", "hdj_pedopsy_transition"],
delayLabel: "À créer prioritairement",
maturity: "Manque territorial majeur",
note: "Offre manquante majeure pour éviter les hospitalisations pédiatriques inadaptées faute de relais pédopsy.",
actsAvailable: ["Entretien pédopsy", "Observation comportement", "Travail parental", "Coordination école / CMP"],
frequency: "2 à 3 jours/semaine",
duration: "2 à 4 semaines",
},
{
id: "territoire_hdj_pediatrie_sociale",
title: "HDJ pédiatrie sociale – ASE / PMI / famille",
hospital: "Réseau pédiatrie sociale Manche",
city: "Multi-sites",
territory: "Départemental",
strategicLevel: "innovation territoriale",
isVirtual: true,
territorialTension: "élevée",
coverage: ["Départemental"],
tags: ["ase", "pmi", "protection", "famille", "parentalité", "information préoccupante", "crip"],
pathways: ["hdj_pediatrie_sociale"],
delayLabel: "À créer",
maturity: "Offre cible",
note: "Réponse médico-sociale structurée pour enfants vulnérables et familles complexes.",
actsAvailable: ["Évaluation pédiatrique", "Entretien famille", "Lien ASE", "Coordination école / social"],
frequency: "1 jour/semaine",
duration: "4 semaines",
},
{
id: "territoire_hdj_neurodev",
title: "HDJ neurodéveloppement enfant",
hospital: "Réseau enfant Manche",
city: "Multi-sites",
territory: "Départemental",
strategicLevel: "à créer",
isVirtual: true,
territorialTension: "élevée",
coverage: ["Départemental"],
tags: ["autisme", "tdah", "trouble neurodéveloppement", "scolarité", "comportement"],
pathways: ["hdj_pediatrie_neurodev"],
delayLabel: "À créer / expérimenter",
maturity: "Offre cible",
note: "Réduire l’errance diagnostique et concentrer les bilans enfant/famille/école.",
actsAvailable: ["Bilan neurodéveloppement", "Observation comportement", "Entretien parents", "Lien scolaire"],
frequency: "1 jour/semaine",
duration: "6 semaines",
},
];

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function getKeywordText(activeKeywords = [], patient = {}) {
return [
...activeKeywords.map((item) =>
typeof item === "string" ? item : item?.label
),
patient?.service,
patient?.pathologie,
patient?.diagnostic,
patient?.motifHospitalisation,
patient?.orientation,
patient?.solutionLabel,
]
.filter(Boolean)
.map(normalize)
.join(" ");
}

function buildHospitalOffersFromRegistry() {
return (TERRITORY_HOSPITALS_MANCHE || []).flatMap((hospital) =>
(hospital.hdj || []).map((hdjItem) => {
const hdj =
typeof hdjItem === "string"
? {
type: hdjItem,
tags: [hdjItem],
pathways: [],
}
: hdjItem;

return {
id: `${hospital.id}_${normalize(hdj.type).replaceAll(" ", "_")}`,
title: `HDJ ${hdj.type}`,
hospital: hospital.name,
city: hospital.city,
territory: hospital.territory,
strategicLevel: hdj.strategicLevel || "à vérifier",
territorialTension: hdj.territorialTension || "à vérifier",
coverage: hospital.coverage || [hospital.territory],
tags: hdj.tags || [],
pathways: hdj.pathways || [],
delayLabel: hdj.delayLabel || "À vérifier",
maturity: hdj.maturity || "À vérifier",
note: hdj.note || `Offre HDJ ${hdj.type} proposée par ${hospital.name}.`,
actsAvailable: hdj.actsAvailable || [],
frequency: hdj.frequency || "",
duration: hdj.duration || "",
contact: hospital.phone || "",
email: hospital.email || "",
isFromRegistry: true,
};
})
);
}

export function buildHDJTerritorialDecision({
patient,
activeKeywords = [],
}) {
const text = getKeywordText(activeKeywords, patient);

const age = Number(patient?.age || 0);
const service = normalize(patient?.service || "");

const isPediatric =
(age > 0 && age < 18) ||
service.includes("pediatr") ||
service.includes("enfant");

const isOlderAdult = age >= 75;

const hasStrongGeriatricNeed =
text.includes("fragilite") ||
text.includes("chute") ||
text.includes("perte autonomie") ||
text.includes("dependance") ||
text.includes("gir") ||
text.includes("aidant epuise");
const isNeuro =
service.includes("neuro") ||
text.includes("neuro") ||
text.includes("cognition") ||
text.includes("memoire") ||
text.includes("trouble cognitif") ||
text.includes("desorientation") ||
text.includes("alzheimer");

const isOfferPediatric = (offer) => {
const offerText = normalize([
offer.title,
offer.hospital,
offer.territory,
...(offer.tags || []),
...(offer.pathways || []),
].join(" "));
// Exclure la gériatrie si pas âge gériatrique ni besoin gériatrique fort
if (
!isPediatric &&
offerText.includes("geriatr") &&
!isOlderAdult &&
!hasStrongGeriatricNeed
) {
return null;
}

return (
offerText.includes("pediatr") ||
offerText.includes("pedopsy") ||
offerText.includes("enfant") ||
offerText.includes("ado") ||
offerText.includes("ase") ||
offerText.includes("pmi")
);
};

const isOfferOlderAdult = (offer) => {
const offerText = normalize([
offer.title,
...(offer.tags || []),
...(offer.pathways || []),
].join(" "));

return (
offerText.includes("geriatr") ||
offerText.includes("memoire") ||
offerText.includes("fragilite") ||
offerText.includes("autonomie") ||
offerText.includes("cognition")
);


};

const matchedNeeds = TERRITORIAL_NEEDS.map((need) => {
const matched = need.keywords.filter((k) =>
text.includes(normalize(k))
);

return { ...need, matched };
}).filter((n) => {
if (isPediatric) return n.matched.length > 0;
return (
n.matched.length > 0 &&
!n.id?.includes("pediatrie") &&
!n.id?.includes("pediatrie_") &&
!n.id?.includes("pediatr")
);
});

const pathways = PATHWAYS.map((p) => {
const pathwayText = normalize([
p.id,
p.title,
...(p.coreActs || []),
...(p.expectedImpact || []),
].join(" "));

if (
!isPediatric &&
pathwayText.includes("geriatr") &&
!isOlderAdult &&
!hasStrongGeriatricNeed
) {
return null;
}

if (!isPediatric && (
pathwayText.includes("pediatr") ||
pathwayText.includes("pedopsy") ||
pathwayText.includes("enfant") ||
pathwayText.includes("ado") ||
pathwayText.includes("ase") ||
pathwayText.includes("pmi")
)) {
return null;
}

if (isPediatric && (
pathwayText.includes("geriatr") ||
pathwayText.includes("memoire") ||
pathwayText.includes("alzheimer")
)) {
return null;
}

const relatedNeeds = matchedNeeds.filter((n) =>
n.pathways.includes(p.id)
);

let score = relatedNeeds.length * 30;

if (!isPediatric && isNeuro && (
pathwayText.includes("memoire") ||
pathwayText.includes("cognition") ||
pathwayText.includes("geriatr") ||
pathwayText.includes("reeducation") ||
pathwayText.includes("post-hospitalisation")
)) {
score += 20;
}

if (!isPediatric && isOlderAdult && (
pathwayText.includes("geriatr") ||
pathwayText.includes("memoire") ||
pathwayText.includes("fragilite") ||
pathwayText.includes("autonomie")
)) {
score += 15;
}

return {
pathway: p,
score,
reasons: relatedNeeds.flatMap((n) => n.matched),
};
})
.filter(Boolean)
.filter((p) => p.score > 0)
.sort((a, b) => b.score - a.score);

const allOffers = [
...OFFERS,
...buildHospitalOffersFromRegistry(),
];

const offers = allOffers
.map((offer) => {
if (!isPediatric && isOfferPediatric(offer)) {
return null;
}

if (isPediatric && isOfferOlderAdult(offer)) {
return null;
}

const matchedPathways = pathways
.filter((p) => (offer.pathways || []).includes(p.pathway.id))
.map((p) => p.pathway);

const matchedTags = (offer.tags || []).filter((tag) =>
text.includes(normalize(tag))
);

let score =
matchedPathways.length * 30 +
matchedTags.length * 10 +
(offer.strategicLevel === "existant" ? 10 : 0) +
(offer.territorialTension === "critique" ? 15 : 0) +
(offer.territorialTension === "élevée" ? 10 : 0);

const offerText = normalize([
offer.title,
offer.hospital,
offer.territory,
...(offer.tags || []),
...(offer.pathways || []),
].join(" "));

// Cohérence service ↔ offre HDJ
const serviceRules = [
{
service: ["neuro"],
bonus: ["memoire", "cognition", "neuro", "reeducation", "post"],
malus: ["pedopsy", "pediatr", "enfant", "ado"],
},
{
service: ["geriatr", "medecine"],
bonus: ["geriatr", "fragilite", "autonomie", "memoire", "polyvalent"],
malus: ["pedopsy", "pediatr", "enfant", "ado"],
},
{
service: ["onco", "cancero"],
bonus: ["oncologie", "chimiotherapie", "support", "douleur", "nutrition"],
malus: ["pedopsy", "pediatr", "geriatrie sociale"],
},
{
service: ["cardio"],
bonus: ["cardio", "insuffisance cardiaque", "therapeutique"],
malus: ["pedopsy", "pediatr", "enfant"],
},
{
service: ["pneumo", "respiratoire"],
bonus: ["respiratoire", "bpco", "oxygene"],
malus: ["pedopsy", "pediatr", "enfant"],
},
{
service: ["psy"],
bonus: ["psy", "crise", "transition"],
malus: ["geriatr", "memoire", "oncologie"],
},
{
service: ["pediatr", "enfant"],
bonus: ["pediatr", "pedopsy", "enfant", "ado", "camsp", "neurodeveloppement", "ase", "pmi"],
malus: ["geriatr", "memoire", "alzheimer", "oncologie adulte"],
},
];

serviceRules.forEach((rule) => {
const serviceMatches = rule.service.some((s) => service.includes(s));

if (!serviceMatches) return;

if (rule.bonus.some((word) => offerText.includes(normalize(word)))) {
score += 25;
}

if (rule.malus.some((word) => offerText.includes(normalize(word)))) {
score -= 30;
}
});

// Cohérence mots-clés ↔ offre HDJ
const keywordRules = [
{
keywords: ["memoire", "trouble cognitif", "desorientation", "alzheimer", "confusion"],
bonus: ["memoire", "cognition"],
},
{
keywords: ["chute", "fragilite", "perte autonomie", "marche", "denutrition"],
bonus: ["geriatr", "fragilite", "autonomie", "reeducation"],
},
{
keywords: ["douleur", "nutrition", "fatigue", "cancer", "chimio"],
bonus: ["support", "douleur", "nutrition", "oncologie", "chimiotherapie"],
},
{
keywords: ["bpco", "dyspnee", "oxygene", "respiratoire"],
bonus: ["respiratoire", "bpco"],
},
{
keywords: ["iatrogenie", "polymedication", "observance", "traitement"],
bonus: ["therapeutique", "medecine"],
},
{
keywords: ["ado", "angoisse", "scarification", "phobie scolaire", "trouble comportement"],
bonus: ["pedopsy", "ado", "crise", "transition"],
},
{
keywords: ["retard developpement", "neurodeveloppement", "autisme", "tdah"],
bonus: ["camsp", "neurodeveloppement"],
},
];

keywordRules.forEach((rule) => {
const keywordMatches = rule.keywords.some((kw) => text.includes(normalize(kw)));

if (!keywordMatches) return;

if (rule.bonus.some((word) => offerText.includes(normalize(word)))) {
score += 25;
}
});


if (!isPediatric && isNeuro && (
offerText.includes("memoire") ||
offerText.includes("cognition") ||
offerText.includes("geriatr") ||
offerText.includes("reeducation") ||
offerText.includes("post")
)) {
score += 20;
}

if (!isPediatric && isOlderAdult && isOfferOlderAdult(offer)) {
score += 15;
}

return {
offer,
score,
matchedPathways,
};
})
.filter(Boolean)
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);

const score = Math.min(100, matchedNeeds.length * 25);

return {
opportunity: {
score,
level: score >= 60 ? "forte" : score >= 25 ? "modérée" : "faible",
reasons: matchedNeeds.map((n) => n.label),
},
needs: matchedNeeds,
pathways,
offers,
};
}

export function findSimilarHdjModels(labels = []) {
if (!labels.length) return [];

// ⚠️ limite immédiate
const library = HDJ_LIBRARY.slice(0, 50);

return library.filter(model => {
const txt = normalizeKeywordLabel([
model.title,
...(model.commonKeywords || [])
].join(" "));

return labels.some(l => txt.includes(normalizeKeywordLabel(l)));
});
}




