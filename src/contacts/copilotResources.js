import {
officialForms50,
coordinationContacts50,
aseContacts50,
} from "./territoryContacts";

function normalizeType(type) {
const value = String(type || "").toUpperCase();

if (value === "AIDE À DOMICILE" || value === "AIDE A DOMICILE") return "SAAD";
return value;
}

const coordinationResources = coordinationContacts50.map((contact) => ({
id: contact.id,
label: contact.name,
type: normalizeType(contact.type),
tags: [
contact.type,
contact.territory,
contact.note,
"coordination",
"cotentin",
"manche",
].filter(Boolean),
capabilities: [
contact.note,
contact.type,
"coordination",
].filter(Boolean),
territory: {
territoryKey:
String(contact.territory || "").toLowerCase().includes("cherbourg") ||
String(contact.territory || "").toLowerCase().includes("valognes") ||
String(contact.territory || "").toLowerCase().includes("nord manche")
? "cotentin_nord"
: "manche",
label: contact.territory || "Manche",
},
usageCount: 8,
contact: {
phone: contact.phone || "",
email: contact.email || "",
},
note: contact.note || "",
source: "territory-contacts-50",
}));

const formsResources = Object.values(officialForms50).map((form) => ({
id: form.id,
label: form.label,
type:
form.id === "ase-50"
? "FORMULAIRE_ASE"
: form.id.includes("mdph")
? "FORMULAIRE_SOCIAL"
: "FORMULAIRE_SOCIAL",
tags: [
form.authority,
form.note,
form.label,
form.type,
"manche",
"50",
].filter(Boolean),
capabilities: [
form.note,
form.authority,
"formulaire",
"dossier officiel",
].filter(Boolean),
territory: {
territoryKey: "manche",
label: "Département de la Manche",
},
usageCount: 10,
officialUrl: form.officialUrl || "",
authority: form.authority || "",
note: form.note || "",
source: "official-forms-50",
}));

const aseCircuitResource = {
id: "ase-crip-manche",
label: aseContacts50.name,
type: "CRIP",
tags: [
"ase",
"crip",
"information préoccupante",
"enfant en danger",
"protection enfance",
"manche",
],
capabilities: [
"signalement",
"protection enfance",
"recueil information préoccupante",
"coordination ASE",
],
territory: {
territoryKey: "manche",
label: "Département de la Manche",
},
usageCount: 12,
contact: {
phone: aseContacts50.phone || "",
emergencyPhone: aseContacts50.emergencyPhone || "",
postalAddress: aseContacts50.postalAddress || "",
},
note: "Circuit départemental ASE / CRIP Manche",
source: "ase-contacts-50",
};

export const COPILOT_RESOURCES = [
...coordinationResources,
...formsResources,
aseCircuitResource,
];