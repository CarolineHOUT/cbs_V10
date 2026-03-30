
export const RESOURCE_CONTACTS = [
{
id: "ide_valognes_centre",
parentResourceId: "ide_liberal_cotentin",
label: "Cabinet IDE Valognes Centre",
phone: "02 33 00 00 11",
email: "cabinet.valognes@ide-cotentin.fr",
address: "Valognes",
communes: ["Valognes"],
postalCodes: ["50700"],
territoryKeys: ["cotentin_nord"],

indications: [
"Pansements",
"Injections",
"Surveillance clinique",
],

constraints: ["Pas de tournée soir"],

displayRules: {
minAge: 18,
maxAge: null,
requiredCategories: ["Coordination de soins", "Autonomie / Gérontologie"],
excludedCategories: ["Pédiatrie / Maternité"],
requiredSubcategories: ["Absence IDE", "Soins techniques à organiser"],
},
},

{
id: "ide_cherbourg",
parentResourceId: "ide_liberal_cotentin",
label: "Cabinet IDE Cherbourg",
phone: "02 33 00 00 12",
email: "cherbourg@ide-cotentin.fr",
address: "Cherbourg",
communes: ["Cherbourg-en-Cotentin"],
postalCodes: ["50100"],
territoryKeys: ["cotentin_nord"],

indications: [
"Soins infirmiers",
"Retour domicile",
],

constraints: [],

displayRules: {
minAge: 18,
maxAge: null,
requiredCategories: ["Coordination de soins"],
excludedCategories: ["Pédiatrie / Maternité"],
requiredSubcategories: ["Absence IDE"],
},
},
];

// ------------------------
// 🔧 LOGIQUE DE FILTRAGE
// ------------------------

function normalize(value) {
return (value || "").toString().toLowerCase();
}

function matchesContactTerritory(contact, patientAddress) {
if (!contact || !patientAddress) return false;

const postal = normalize(patientAddress.postalCode);
const city = normalize(patientAddress.city);

return (
(contact.postalCodes || []).map(normalize).includes(postal) ||
(contact.communes || []).map(normalize).includes(city)
);
}

function matchesContactSituation(
contact,
selectedCategories = [],
selectedSubcategories = {},
patient = null
) {
const rules = contact.displayRules || {};
const selectedSubValues = Object.values(selectedSubcategories).flat();

// 🔹 âge (STRICT)
if (rules.minAge !== null && rules.minAge !== undefined) {
if ((patient?.age || 0) < rules.minAge) return false;
}

if (rules.maxAge !== null && rules.maxAge !== undefined) {
if ((patient?.age || 0) > rules.maxAge) return false;
}

// 🔹 catégories (SOUPLE)
if ((rules.requiredCategories || []).length > 0) {
const ok = rules.requiredCategories.some((c) =>
selectedCategories.includes(c)
);

if (!ok && selectedCategories.length > 0) {
// on laisse passer
}
}

// 🔹 exclusions (STRICT)
if ((rules.excludedCategories || []).length > 0) {
const excluded = rules.excludedCategories.some((c) =>
selectedCategories.includes(c)
);
if (excluded) return false;
}

// 🔹 sous-catégories (SOUPLE)
if ((rules.requiredSubcategories || []).length > 0) {
const ok = rules.requiredSubcategories.some((s) =>
selectedSubValues.includes(s)
);

if (!ok && selectedSubValues.length > 0) {
// on laisse passer
}
}

return true;
}

// ------------------------
// 🎯 FONCTION PRINCIPALE
// ------------------------

export function getContactsForResource({
resourceId,
patientAddress,
selectedCategories = [],
selectedSubcategories = {},
patient = null,
}) {
return RESOURCE_CONTACTS.filter((contact) => {
if (contact.parentResourceId !== resourceId) return false;

const territoryOk = matchesContactTerritory(contact, patientAddress);
const situationOk = matchesContactSituation(
contact,
selectedCategories,
selectedSubcategories,
patient
);

return territoryOk && situationOk;
});
}