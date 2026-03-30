function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function safeArray(value) {
if (!value) return [];
if (Array.isArray(value)) return value;
return [value];
}

function toNumber(value) {
const n = Number(value);
return Number.isFinite(n) ? n : null;
}

function getPatientLat(patient) {
return (
toNumber(patient?.adresse?.latitude) ??
toNumber(patient?.adresse?.lat) ??
toNumber(patient?.territory?.latitude) ??
toNumber(patient?.territory?.lat) ??
49.639
);
}

function getPatientLon(patient) {
return (
toNumber(patient?.adresse?.longitude) ??
toNumber(patient?.adresse?.lon) ??
toNumber(patient?.territory?.longitude) ??
toNumber(patient?.territory?.lon) ??
-1.616
);
}

function getResourceLat(resource) {
return (
toNumber(resource?.latitude) ??
toNumber(resource?.lat) ??
null
);
}

function getResourceLon(resource) {
return (
toNumber(resource?.longitude) ??
toNumber(resource?.lon) ??
null
);
}

function computeDistanceKm(lat1, lon1, lat2, lon2) {
if (
lat1 === null ||
lon1 === null ||
lat2 === null ||
lon2 === null
) {
return null;
}

const R = 6371;
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLon = ((lon2 - lon1) * Math.PI) / 180;

const a =
Math.sin(dLat / 2) ** 2 +
Math.cos((lat1 * Math.PI) / 180) *
Math.cos((lat2 * Math.PI) / 180) *
Math.sin(dLon / 2) ** 2;

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return Math.round(R * c * 10) / 10;
}

function flattenSelections(selections = {}) {
const rows = [];

Object.entries(selections || {}).forEach(([domain, categories]) => {
Object.entries(categories || {}).forEach(([category, items]) => {
safeArray(items).forEach((item) => {
rows.push({
domain,
category,
label: item,
});
});
});
});

return rows;
}

function buildPatientSignals(patient) {
const texts = [];

if (!patient) return [];

texts.push(patient?.orientation);
texts.push(patient?.blockReason);
texts.push(patient?.blocage);
texts.push(patient?.territory?.mainNeed);
texts.push(patient?.territory?.city);
texts.push(patient?.territory?.housingType);
texts.push(patient?.adresse?.city);
texts.push(patient?.adresse?.housingType);
texts.push(patient?.service);

flattenSelections(patient?.intakeSelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});

flattenSelections(patient?.staySelections || {}).forEach((row) => {
texts.push(row.domain, row.category, row.label);
});
safeArray(patient?.freeCriteria).forEach((item) => {
texts.push(typeof item === "string" ? item : item?.label);
});

safeArray(patient?.spiritNotes).forEach((note) => {
texts.push(note?.text);
});

safeArray(patient?.dynamicNeeds).forEach((item) => {
texts.push(item?.label);
});

safeArray(patient?.dynamicCategories).forEach((item) => {
texts.push(item?.label);
texts.push(item?.category);
texts.push(item?.subCategory);

// 🔥 AJOUT CRUCIAL
if (item?.subCategory) {
texts.push(item.subCategory);
}

if (item?.category) {
texts.push(item.category);
}
});

safeArray(patient?.dynamicBlockages).forEach((item) => {
texts.push(item?.label);
});

return texts.map(normalize).filter(Boolean);
}

function matchesQuery(resource, query) {
const q = normalize(query);
if (!q) return true;

const fields = [
resource?.label,
resource?.type,
resource?.domain,
resource?.commune,
resource?.adresse,
resource?.coverage,
resource?.note,
resource?.contactName,
resource?.activationMode,
resource?.delay,
...safeArray(resource?.keywords),
...safeArray(resource?.categories),
...safeArray(resource?.territoryTags),
...safeArray(resource?.publics),
...safeArray(resource?.services),
...safeArray(resource?.documents),
...safeArray(resource?.contactChannels),
...safeArray(resource?.forms).map((item) => item?.label || item),
]
.map(normalize)
.filter(Boolean);

return fields.some((field) => field.includes(q) || q.includes(field));
}

function scoreType(resource, patientSignals) {
const type = normalize(resource?.type);
let score = 0;

const has = (...items) =>
items.some((item) =>
patientSignals.some((signal) => signal.includes(normalize(item)))
);

if (
has("retour domicile", "sortie complexe", "absence de relais") &&
["idel", "ssiad", "had", "aide_domicile", "coordination"].includes(type)
) {
score += 18;
}

if (
has("pansement", "injection", "perfusion", "soins techniques", "nursing") &&
["idel", "had", "ssiad", "hdj"].includes(type)
) {
score += 16;
}

if (
has("social", "droits", "mdph", "apa", "isolement", "précarité", "precarite") &&
["coordination", "pmi", "ase", "aide_domicile", "hebergement_temporaire"].includes(type)
) {
score += 14;
}

if (
has("hebergement", "hébergement", "temporaire", "ehpad", "relais") &&
["ehpad", "hebergement_temporaire"].includes(type)
) {
score += 20;
}

if (
has("enfance", "signalement", "ip", "ase", "crip") &&
["ase", "pmi"].includes(type)
) {
score += 20;
}

return score;
}

function scoreKeywords(resource, patientSignals) {
const keywords = safeArray(resource?.keywords).map(normalize);
let score = 0;

patientSignals.forEach((signal) => {
keywords.forEach((keyword) => {
if (signal.includes(keyword) || keyword.includes(signal)) {
score += 4;
}
});
});

return score;
}

function scoreSubCategories(resource, patientSignals) {
const resourceType = normalize(resource?.type);

const tokens = [
resourceType,
normalize(resource?.domain),
normalize(resource?.coverage),
...safeArray(resource?.keywords).map(normalize),
...safeArray(resource?.categories).map(normalize),
...safeArray(resource?.territoryTags).map(normalize),
...safeArray(resource?.services).map(normalize),
...safeArray(resource?.forms).map((item) => normalize(item?.label || item)),
].filter(Boolean);

let score = 0;

patientSignals.forEach((signal) => {
const s = normalize(signal);

tokens.forEach((token) => {
if (!token) return;

if (s === token) {
score += 25;
return;
}

if (s.includes(token) || token.includes(s)) {
score += 8;
}
});

if (s === "idel" && resourceType === "idel") score += 40;
if (s === "ssiad" && resourceType === "ssiad") score += 40;
if (s === "had" && resourceType === "had") score += 40;
if (s === "hdj" && resourceType === "hdj") score += 40;
if (s === "smr" && resourceType === "smr") score += 40;
if (s === "ehpad" && resourceType === "ehpad") score += 40;
if (s.includes("hebergement") && resourceType === "hebergement_temporaire") score += 30;
if (s.includes("aide a domicile") && resourceType === "aide_domicile") score += 35;
if (s.includes("coordination") && resourceType === "coordination") score += 30;
if (s === "ase" && resourceType === "ase") score += 40;
if (s === "pmi" && resourceType === "pmi") score += 40;
});

return score;
}


function scoreRichResource(resource, patientSignals) {
const tokens = [
normalize(resource?.domain),
normalize(resource?.coverage),
normalize(resource?.delay),
normalize(resource?.activationMode),
...safeArray(resource?.services).map(normalize),
...safeArray(resource?.publics).map(normalize),
...safeArray(resource?.territoryTags).map(normalize),
...safeArray(resource?.documents).map(normalize),
...safeArray(resource?.forms).map((item) => normalize(item?.label || item)),
...safeArray(resource?.contactChannels).map(normalize),
].filter(Boolean);

let score = 0;
patientSignals.forEach((signal) => {
  tokens.forEach((token) => {
    if (!signal || !token) return;
    if (signal === token) score += 16;
    else if (signal.includes(token) || token.includes(signal)) score += 6;
  });
});

if (resource?.forms?.length) score += 4;
if (resource?.contactChannels?.length >= 2) score += 3;
if (resource?.services?.length >= 3) score += 4;
return score;
}

function scoreDistance(distanceKm) {
if (typeof distanceKm !== "number") return 0;
if (distanceKm <= 2) return 20;
if (distanceKm <= 5) return 15;
if (distanceKm <= 10) return 10;
if (distanceKm <= 20) return 5;
return 0;
}
function scoreResource(resource, patient, query) {
const patientSignals = buildPatientSignals(patient);
const patientLat = getPatientLat(patient);
const patientLon = getPatientLon(patient);
const resourceLat = getResourceLat(resource);
const resourceLon = getResourceLon(resource);

const distanceKm = computeDistanceKm(
patientLat,
patientLon,
resourceLat,
resourceLon
);

const resourceType = normalize(resource?.type);

const forcedTypes = safeArray(patientSignals)
.map((s) => normalize(s))
.filter((s) =>
[
"idel",
"ssiad",
"had",
"hdj",
"smr",
"ehpad",
"pmi",
"ase"
].includes(s)
);

if (forcedTypes.length > 0) {
if (forcedTypes.includes(resourceType)) {
return {
...resource,
distanceKm,
searchScore: 10000, // 💥 ULTRA PRIORITÉ
};
} else {
return {
...resource,
distanceKm,
searchScore: -10000, // ❌ EXCLUSION
};
}
}

if (forcedTypes.length > 0) {
return {
...resource,
distanceKm,
searchScore: forcedTypes.includes(resourceType) ? 1000 : -1000,
};
}

let score = 0;

if (matchesQuery(resource, query)) score += 30;
score += scoreType(resource, patientSignals);
score += scoreKeywords(resource, patientSignals);
score += scoreSubCategories(resource, patientSignals);
score += scoreRichResource(resource, patientSignals);
score += scoreDistance(distanceKm);

return {
...resource,
distanceKm,
searchScore: score,
};
}

function sortByScore(a, b) {
if ((b.searchScore || 0) !== (a.searchScore || 0)) {
return (b.searchScore || 0) - (a.searchScore || 0);
}

const aHasDistance = typeof a.distanceKm === "number";
const bHasDistance = typeof b.distanceKm === "number";

if (aHasDistance && !bHasDistance) return -1;
if (!aHasDistance && bHasDistance) return 1;

if (aHasDistance && bHasDistance && a.distanceKm !== b.distanceKm) {
return a.distanceKm - b.distanceKm;
}

return String(a.label || "").localeCompare(String(b.label || ""), "fr");
}

export function searchResources(resources = [], query = "", patient = null) {
return safeArray(resources)
.filter((resource) => matchesQuery(resource, query))
.map((resource) => scoreResource(resource, patient, query))
.sort(sortByScore);
}

export function suggestResources(resources = [], patient = null, limit = 6) {
return safeArray(resources)
.map((resource) => scoreResource(resource, patient, ""))
.sort(sortByScore)
.slice(0, limit);
}

export function suggestResourcesFromSpiritNote({
resources = [],
note = null,
patient = null,
limit = 5,
}) {
const query = note?.text || "";
return searchResources(resources, query, patient).slice(0, limit);
}