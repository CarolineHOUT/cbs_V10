import { TERRITORY_MAPPING } from "./territoriesModel";

function normalize(value) {
return (value || "").toString().trim().toLowerCase();
}

export function getPatientTerritory(patientAddress) {
if (!patientAddress) return null;

if (
patientAddress.territoryKey &&
TERRITORY_MAPPING[patientAddress.territoryKey]
) {
return {
key: patientAddress.territoryKey,
...TERRITORY_MAPPING[patientAddress.territoryKey],
};
}

const postalCode = normalize(patientAddress.postalCode);

const found = Object.entries(TERRITORY_MAPPING).find(([, territory]) =>
(territory.postalCodes || []).some(
(code) => normalize(code) === postalCode
)
);

if (!found) return null;

const [key, territory] = found;
return { key, ...territory };
}

export function getAllowedTerritoryKeys(
patientAddress,
perimeter = "patient_sector"
) {
const patientTerritory = getPatientTerritory(patientAddress);

if (!patientTerritory) {
return perimeter === "department" ? Object.keys(TERRITORY_MAPPING) : [];
}

if (perimeter === "patient_sector") {
return [patientTerritory.key];
}

if (perimeter === "extended_sector") {
return [patientTerritory.key, ...(patientTerritory.neighbours || [])];
}

if (perimeter === "department") {
return Object.keys(TERRITORY_MAPPING);
}

return [patientTerritory.key];
}

export function matchesTerritory(
resource,
patientAddress,
perimeter = "patient_sector"
) {
if (!resource || !patientAddress) return false;

const territory = resource.territory || {};
const allowedTerritoryKeys = getAllowedTerritoryKeys(
patientAddress,
perimeter
);

const primaryTerritoryKeys = territory.primaryTerritoryKeys || [];
const secondaryTerritoryKeys = territory.secondaryTerritoryKeys || [];
const primaryPostalCodes = (territory.primaryPostalCodes || []).map(normalize);
const secondaryPostalCodes = (territory.secondaryPostalCodes || []).map(
normalize
);
const communes = (territory.communes || []).map(normalize);

const patientPostalCode = normalize(patientAddress.postalCode);
const patientCity = normalize(patientAddress.city);

if (
primaryTerritoryKeys.some((key) => allowedTerritoryKeys.includes(key)) ||
secondaryTerritoryKeys.some((key) => allowedTerritoryKeys.includes(key))
) {
return true;
}

if (
primaryPostalCodes.includes(patientPostalCode) ||
secondaryPostalCodes.includes(patientPostalCode)
) {
return true;
}

if (communes.includes(patientCity)) {
return true;
}

if (perimeter === "department" && territory.acceptsOutOfSector) {
return true;
}

return false;
}

export function matchesSituation(
resource,
selectedCategories = [],
selectedSubcategories = {}
) {
if (!resource) return false;

const resourceCategory = resource.category || "";
const resourceSubcategories = resource.subcategories || [];
const selectedSubValues = Object.values(selectedSubcategories).flat();

const noSituationSelected =
selectedCategories.length === 0 && selectedSubValues.length === 0;

if (noSituationSelected) return true;

const categoryMatch =
!resourceCategory || selectedCategories.includes(resourceCategory);

const subcategoryMatch =
resourceSubcategories.length === 0 ||
resourceSubcategories.some((item) => selectedSubValues.includes(item));

return categoryMatch || subcategoryMatch;
}

export function getResourcePriority(resource, patientAddress) {
if (!resource || !patientAddress) return 0;

const territory = resource.territory || {};
const patientTerritory = getPatientTerritory(patientAddress);
const patientPostalCode = normalize(patientAddress.postalCode);
const patientCity = normalize(patientAddress.city);

const primaryTerritoryKeys = territory.primaryTerritoryKeys || [];
const secondaryTerritoryKeys = territory.secondaryTerritoryKeys || [];
const primaryPostalCodes = (territory.primaryPostalCodes || []).map(normalize);
const secondaryPostalCodes = (territory.secondaryPostalCodes || []).map(
normalize
);
const communes = (territory.communes || []).map(normalize);

if (
(patientTerritory &&
primaryTerritoryKeys.includes(patientTerritory.key)) ||
primaryPostalCodes.includes(patientPostalCode) ||
communes.includes(patientCity)
) {
return 3;
}

if (
(patientTerritory &&
secondaryTerritoryKeys.includes(patientTerritory.key)) ||
secondaryPostalCodes.includes(patientPostalCode)
) {
return 2;
}

if (territory.acceptsOutOfSector) {
return 1;
}

return 0;
}

export function getRelevantResources({
resources = [],
patientAddress,
selectedCategories = [],
selectedSubcategories = {},
perimeter = "patient_sector",
}) {
return resources
.filter((resource) => {
const territoryOk = matchesTerritory(resource, patientAddress, perimeter);
const situationOk = matchesSituation(
resource,
selectedCategories,
selectedSubcategories
);

return territoryOk && situationOk;
})
.sort((a, b) => {
const priorityDiff =
getResourcePriority(b, patientAddress) -
getResourcePriority(a, patientAddress);

if (priorityDiff !== 0) return priorityDiff;

return (a.label || "").localeCompare(b.label || "");
});
}

export function splitResourcesByScope(resources = [], patientAddress) {
const onSector = [];
const nearSector = [];
const extended = [];

resources.forEach((resource) => {
const score = getResourcePriority(resource, patientAddress);

if (score === 3) onSector.push(resource);
else if (score === 2) nearSector.push(resource);
else extended.push(resource);
});

return {
onSector,
nearSector,
extended,
};
}