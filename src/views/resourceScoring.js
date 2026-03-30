export function scoreResource(resource, context = {}) {
const {
patient,
selectedCategories = [],
selectedSubcategories = {},
recueilTargets = [],
} = context;

let score = 0;

const resourceType = String(resource?.type || "").toLowerCase();
const resourceLabel = String(resource?.label || "").toLowerCase();
const resourceAccessMode = String(resource?.accessMode || "").toLowerCase();
const resourceSubCategory =
resource?.sous_categorie_id ||
resource?.subcategoryId ||
resource?.subcategory ||
resource?.resourceTypeId ||
"";

const patientService = String(patient?.service || "").toLowerCase();
const patientOrientation = String(patient?.orientation || "").toLowerCase();
const patientBlockReason = String(
patient?.blockReason || patient?.blocage || ""
).toLowerCase();

const patientTerritoryKey = String(
patient?.adresse?.territoryKey || ""
).toLowerCase();

const resourceTerritoryKey = String(
resource?.territory?.territoryKey ||
resource?.territoryKey ||
resource?.territoire_id ||
""
).toLowerCase();

const patientCity = String(patient?.adresse?.city || "").toLowerCase();
const resourceAddress = String(resource?.contact?.address || "").toLowerCase();

const flatSubcategories = Object.values(selectedSubcategories).flat();

function includesOneOf(text, items = []) {
return items.some((item) => text.includes(String(item).toLowerCase()));
}

function addIf(condition, value) {
if (condition) score += value;
}

function penalizeIf(condition, value) {
if (condition) score -= value;
}

// 1. Match exact recueil -> sous-catégorie ressource
addIf(
Array.isArray(recueilTargets) &&
recueilTargets.length > 0 &&
recueilTargets.includes(resourceSubCategory),
8
);

// 2. Bonus si la ressource semble sémantiquement cohérente avec les sous-catégories cochées
addIf(
includesOneOf(resourceLabel, flatSubcategories) ||
includesOneOf(resourceType, flatSubcategories),
3
);

// 3. Bonus territoire exact
addIf(
patientTerritoryKey &&
resourceTerritoryKey &&
patientTerritoryKey === resourceTerritoryKey,
5
);

// 4. Bonus ville retrouvée dans l'adresse
addIf(patientCity && resourceAddress.includes(patientCity), 2);

// 5. Bonus accès direct
addIf(resourceAccessMode === "direct", 2);
addIf(resourceAccessMode === "mixte", 1);

// 6. Catégories métier -> bonus par famille de ressources
const hasAdultes = selectedCategories.includes("Adultes");
const hasPedia = selectedCategories.includes("Pédiatrie");
const hasMaternite = selectedCategories.includes("Maternité");

if (hasAdultes) {
addIf(
includesOneOf(resourceSubCategory, [
"SC_HAD",
"SC_IDEL",
"SC_SSIAD",
"SC_SPASAD",
"SC_EHPAD",
"SC_SMR",
"SC_DAC",
"SC_ASS_SOC",
]),
2
);
}

if (hasPedia) {
addIf(
includesOneOf(resourceSubCategory, [
"SC_CAMSP",
"SC_SESSAD",
"SC_IME",
"SC_ITEP",
"SC_PMI",
"SC_ASE",
"SC_PEDOPSY",
"SC_HAD",
]),
3
);
}

if (hasMaternite) {
addIf(
includesOneOf(resourceSubCategory, [
"SC_PMI",
"SC_SF_DOM",
"SC_HAD",
"SC_ACC_MERE_ENFANT",
"SC_HEBERG_URG",
]),
3
);
}

// 7. Blocage patient -> ressources plus pertinentes
addIf(
patientBlockReason.includes("had") &&
includesOneOf(resourceSubCategory, ["SC_HAD"]),
5
);

addIf(
patientBlockReason.includes("ehpad") &&
includesOneOf(resourceSubCategory, ["SC_EHPAD"]),
5
);

addIf(
patientBlockReason.includes("smr") &&
includesOneOf(resourceSubCategory, ["SC_SMR"]),
5
);

addIf(
patientBlockReason.includes("logement") &&
includesOneOf(resourceSubCategory, ["SC_HEBERG_URG", "SC_ASS_SOC"]),
4
);

addIf(
patientBlockReason.includes("coordination") &&
includesOneOf(resourceSubCategory, ["SC_DAC"]),
4
);

addIf(
patientBlockReason.includes("refus") &&
includesOneOf(resourceSubCategory, ["SC_DAC", "SC_IDEL", "SC_SAAD"]),
2
);

// 8. Orientation patient
addIf(
patientOrientation.includes("domicile") &&
includesOneOf(resourceSubCategory, [
"SC_SAAD",
"SC_SSIAD",
"SC_SPASAD",
"SC_IDEL",
"SC_HAD",
"SC_DAC",
]),
3
);

addIf(
patientOrientation.includes("ase") &&
includesOneOf(resourceSubCategory, ["SC_ASE"]),
4
);

// 9. Service patient
addIf(
patientService.includes("maternité") &&
includesOneOf(resourceSubCategory, ["SC_PMI", "SC_SF_DOM"]),
3
);

addIf(
patientService.includes("pédiatrie") &&
includesOneOf(resourceSubCategory, [
"SC_CAMSP",
"SC_SESSAD",
"SC_PEDOPSY",
"SC_PMI",
]),
3
);

// 10. Malus simples si ressource hors sujet apparent
penalizeIf(
Array.isArray(recueilTargets) &&
recueilTargets.length > 0 &&
resourceSubCategory &&
!recueilTargets.includes(resourceSubCategory),
2
);

// 11. Saturation / difficulté d’accès si présent dans la donnée
const saturation = String(
resource?.saturation_estimee || resource?.saturation || ""
).toLowerCase();

const prescriptionRequired = Boolean(
resource?.prescription_requise || resource?.prescriptionRequired
);

penalizeIf(
saturation.includes("élevée") ||
saturation.includes("elevee") ||
saturation.includes("haute") ||
saturation.includes("satur"),
3
);

penalizeIf(prescriptionRequired, 1);

// 12. Priorité appel si présente
const priorityCall = Number(
resource?.priorite_appel ?? resource?.priorityCall ?? NaN
);

if (!Number.isNaN(priorityCall)) {
if (priorityCall === 1) score += 2;
if (priorityCall >= 4) score -= 1;
}

return score;
}