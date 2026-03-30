export const availableCategories = [
"Organisation de sortie",
"Structures / orientation",
"Domicile / aides",
"Freins à la sortie",
"Pédiatrie / ASE",
"Coordination / crise",
];

export const availableSubcategories = [
"HAD",
"SSIAD",
"IDEL",
"EHPAD",
"HDJ",
"Aide à domicile",
"Transport",
"Logement",
"Refus structure",
"Refus patient",
"Entourage",
"ASE",
];

export function buildInitialTaxonomy(patient) {
const keywords = Array.isArray(patient?.duoKeywords) ? patient.duoKeywords : [];
const subcategories = [];

if (patient?.orientation) subcategories.push(patient.orientation);
if (patient?.blockReason?.includes("HAD")) subcategories.push("HAD");
if (patient?.blockReason?.includes("EHPAD")) subcategories.push("EHPAD");
if (patient?.blockReason?.includes("SMR")) subcategories.push("Structures / orientation");
if (keywords.includes("idel")) subcategories.push("IDEL");
if (keywords.includes("ssiad")) subcategories.push("SSIAD");
if (keywords.includes("ase")) subcategories.push("ASE");
if (keywords.includes("logement")) subcategories.push("Logement");

return {
categorie:
patient?.service === "Pédiatrie"
? "Pédiatrie / ASE"
: "Organisation de sortie",
sousCategories: [...new Set(subcategories.filter(Boolean))],
motsCles: keywords.length ? keywords : ["coordination"],
};
}