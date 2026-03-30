// ==========================
// MAPPING MOTS-CLÉS -> SOUS-CATÉGORIES
// ==========================
export function getSubcategoriesFromKeywords(keywords = []) {
const map = {
retour_domicile: ["Retour à domicile avec aides"],
aide_domicile: ["Aide à domicile"],
idel: ["IDEL"],
ssiad: ["SSIAD"],
had: ["HAD"],
dac: ["DAC"],
cpts: ["CPTS"],
mdph: ["MDPH"],
apa: ["APA"],
ase: ["ASE"],
smr: ["Orientation SMR"],
ehpad: ["Orientation EHPAD"],
place_aval: ["Place aval"],
soutien_parental: ["Soutien parental"],
pediatrie: ["Pédiatrie"],
hdj: ["HDJ"],
teleassistance: ["Téléassistance"],
portage_repas: ["Portage repas"],
};

return [...new Set(keywords.flatMap((k) => map[k] || []))];
}

// ==========================
// CATÉGORIE PAR DÉFAUT
// ==========================
export function getDefaultCategoryFromPatient(patient) {
const kws = patient?.duoKeywords || [];

if (kws.includes("ase") || kws.includes("soutien_parental") || kws.includes("pediatrie")) {
return "Pédiatrie / ASE";
}

if (
kws.includes("smr") ||
kws.includes("ehpad") ||
kws.includes("retour_domicile") ||
kws.includes("aide_domicile") ||
kws.includes("idel") ||
kws.includes("ssiad") ||
kws.includes("had")
) {
return "Retour / Aval";
}

if (kws.includes("mdph") || kws.includes("apa")) {
return "Droits / Dossiers";
}

return "Retour / Aval";
}

// ==========================
// SOUS-CATÉGORIES INITIALES
// ==========================
export function getInitialSelectedSubcategories(patient) {
const subs = [];

if (patient?.blockReason?.includes("SMR") || patient?.blocage?.includes("SMR")) {
subs.push("Orientation SMR");
}

if (patient?.blockReason?.includes("EHPAD") || patient?.blocage?.includes("EHPAD")) {
subs.push("Orientation EHPAD");
}

const fromKeywords = getSubcategoriesFromKeywords(patient?.duoKeywords || []);

return [...new Set([...subs, ...fromKeywords])];
}

// ==========================
// COMPLEXITÉ
// ==========================
export function computePatientComplexity(patient, subs = []) {
let score = 0;

if ((patient?.age || 0) >= 80) score += 2;
if (subs.includes("SSIAD")) score += 2;
if (subs.includes("HAD")) score += 2;
if (subs.includes("MDPH")) score += 2;
if (subs.includes("Aide à domicile")) score += 1;
if (subs.includes("Orientation SMR")) score += 2;
if (subs.includes("Orientation EHPAD")) score += 2;

if (score >= 6) return "Critique";
if (score >= 3) return "Complexe";
return "Standard";
}

// ==========================
// ORIENTATION
// ==========================
export function computeOrientation(patient, subs = []) {
const age = patient?.age || 0;

const hasHeavyCare =
subs.includes("SSIAD") ||
subs.includes("HAD") ||
subs.includes("Aide à domicile") ||
subs.includes("IDEL");

if (subs.includes("Orientation SMR")) {
return "SMR";
}

if (subs.includes("Orientation EHPAD")) {
return age >= 55 ? "EHPAD" : "Domicile";
}

if (age >= 75 && hasHeavyCare) {
return "EHPAD";
}

if (age >= 55 && hasHeavyCare && subs.includes("Place aval")) {
return "EHPAD précoce";
}

return "Domicile";
}

// ==========================
// PLAN DÉCISIONNEL
// ==========================
export function buildDecisionPlanFromPatient(patient, subs = []) {
const orientation = computeOrientation(patient, subs);
const complexity = computePatientComplexity(patient, subs);

let planA = "Retour à domicile simple";
let planB = "Surveillance et coordination standard";
let risk = "Faible";

if (orientation === "SMR") {
planA = "Orientation SMR via Trajectoire";
planB = "Maintien hospitalisation avec relance aval";
risk = "Risque de prolongation si place non obtenue";
} else if (orientation === "EHPAD" || orientation === "EHPAD précoce") {
planA = "Orientation EHPAD via Trajectoire";
planB = "Retour domicile sécurisé renforcé si refus / délai";
risk = "Risque élevé si dépendance sans solution";
} else if (subs.includes("Aide à domicile") || subs.includes("IDEL")) {
planA = "Retour à domicile accompagné avec aides humaines";
planB = "Renfort coordination territoriale / DAC / CPTS";
risk = "Risque modéré si aides non mises en place";
}

if (complexity === "Critique") {
risk = "Risque élevé de rupture de parcours";
}

return { planA, planB, risk, orientation, complexity };
}

// ==========================
// SUGGESTIONS
// ==========================
export function buildSuggestionsFromSubcategories(subs = [], patient) {
const suggestions = [];

if (subs.includes("Aide à domicile")) {
suggestions.push("Prévoir un accompagnement humain renforcé au domicile.");
}

if (subs.includes("IDEL")) {
suggestions.push("Identifier un cabinet IDEL du secteur et initier le contact.");
}

if (subs.includes("SSIAD")) {
suggestions.push("Évaluer la pertinence d’un SSIAD pour le suivi infirmier structuré.");
}

if (subs.includes("HAD")) {
suggestions.push("Évaluer une HAD si besoin de soins techniques coordonnés.");
}

if (subs.includes("MDPH")) {
suggestions.push("Préparer le dossier MDPH si handicap / perte d’autonomie durable.");
}

if (subs.includes("APA")) {
suggestions.push("Initier une demande APA pour soutien au domicile.");
}

if (subs.includes("Orientation SMR")) {
suggestions.push("Saisir une demande SMR dans Trajectoire.");
}

if (subs.includes("Orientation EHPAD")) {
suggestions.push("Saisir une demande EHPAD dans Trajectoire.");
}

if (subs.includes("ASE")) {
suggestions.push("Activer le circuit ASE / CRIP si besoin de protection de l’enfant.");
}

if ((patient?.age || 0) >= 55 && subs.includes("Place aval")) {
suggestions.push("Réévaluer régulièrement la stratégie aval selon l’autonomie et les aidants.");
}

return [...new Set(suggestions)];
}

// ==========================
// HDJ
// ==========================
export function buildHDJSuggestion(patient, subs = []) {
if (subs.includes("HDJ")) {
return {
title: "HDJ de réévaluation / coordination",
acts: ["Bilan clinique", "Réévaluation sociale", "Coordination parcours"],
frequency: "Ponctuel / à discuter",
};
}

if (patient?.service === "Oncologie") {
return {
title: "HDJ de suivi oncologique",
acts: ["Évaluation clinique", "Soins programmés", "Coordination sortie"],
frequency: "Selon protocole",
};
}

return null;
}

// ==========================
// EHPAD SUGGESTION
// ==========================
export function shouldSuggestEHPAD(patient, selectedSubcategories = []) {
if (!patient) return false;

const age = patient.age || 0;
if (age < 55) return false;

const hasSevereNeed =
selectedSubcategories.includes("Aide à domicile") ||
selectedSubcategories.includes("SSIAD") ||
selectedSubcategories.includes("HAD") ||
selectedSubcategories.includes("Place aval");

return hasSevereNeed;
}

// ==========================
// WORKFLOW SMART
// ==========================
export function buildSmartWorkflow(patient, subs = []) {
const items = [];
const orientation = computeOrientation(patient, subs);

if (orientation.includes("SMR")) {
items.push({
title: "Demande Trajectoire SMR",
type: "orientation",
status: "À lancer",
});
}

if (orientation.includes("EHPAD")) {
items.push({
title: "Demande Trajectoire EHPAD",
type: "orientation",
status: "À lancer",
});
}

if (subs.includes("IDEL")) {
items.push({
title: "Contacter IDEL",
type: "coordination",
status: "À lancer",
});
}

if (subs.includes("Aide à domicile")) {
items.push({
title: "Mettre en place aide à domicile",
type: "coordination",
status: "À lancer",
});
}

if (subs.includes("SSIAD")) {
items.push({
title: "Contacter SSIAD",
type: "coordination",
status: "À lancer",
});
}

if (subs.includes("HAD")) {
items.push({
title: "Contacter HAD",
type: "coordination",
status: "À lancer",
});
}

if (subs.includes("MDPH")) {
items.push({
title: "Préparer dossier MDPH",
type: "dossier-officiel",
status: "À lancer",
});
}

if (subs.includes("APA")) {
items.push({
title: "Préparer dossier APA",
type: "dossier-officiel",
status: "À lancer",
});
}

return items;
}