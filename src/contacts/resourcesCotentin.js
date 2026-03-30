import { resourceKnowledgeBase } from "./resourceKnowledgeBase";

const legacyResources = [
// =========================
// IDEL (Infirmiers libéraux)
// =========================
{
id: "idel_1",
label: "Cabinet IDEL Dupont",
type: "IDEL",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.639,
longitude: -1.616,
lat: 49.639,
lon: -1.616,
phone: "02 33 00 00 01",
email: "",
note: "Soins infirmiers à domicile.",
keywords: ["idel", "infirmier", "pansement", "injection", "domicile"],
categories: ["Soins", "Domicile"],
},
{
id: "idel_2",
label: "Cabinet IDEL Martin",
type: "IDEL",
commune: "Équeurdreville-Hainneville",
adresse: "Équeurdreville-Hainneville",
latitude: 49.648,
longitude: -1.653,
lat: 49.648,
lon: -1.653,
phone: "02 33 00 00 02",
email: "",
note: "Soins à domicile et suivi infirmier.",
keywords: ["idel", "soins domicile", "suivi"],
categories: ["Soins"],
},
{
id: "idel_3",
label: "Cabinet IDEL Leblanc",
type: "IDEL",
commune: "Tourlaville",
adresse: "Tourlaville",
latitude: 49.643,
longitude: -1.579,
lat: 49.643,
lon: -1.579,
phone: "02 33 00 00 03",
email: "",
note: "Soins infirmiers et nursing.",
keywords: ["idel", "infirmier", "nursing"],
categories: ["Soins"],
},

// =========================
// SSIAD
// =========================
{
id: "ssiad_1",
label: "SSIAD Soins et Santé Cherbourg",
type: "SSIAD",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.64,
longitude: -1.62,
lat: 49.64,
lon: -1.62,
phone: "02 33 53 69 57",
email: "",
note: "Soins infirmiers à domicile pour personnes âgées ou dépendantes.",
keywords: ["ssiad", "soins domicile", "personne âgée", "personne agee"],
categories: ["Soins", "Domicile"],
},

// =========================
// HAD
// =========================
{
id: "had_1",
label: "HAD CHPC Cherbourg",
type: "HAD",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.63,
longitude: -1.61,
lat: 49.63,
lon: -1.61,
phone: "02 33 20 70 00",
email: "",
note: "Hospitalisation à domicile pour soins complexes.",
keywords: ["had", "hospitalisation domicile", "soins lourds"],
categories: ["Soins"],
},

// =========================
// AIDE À DOMICILE
// =========================
{
id: "aide_1",
label: "UNA Manche - Aide à domicile",
type: "AIDE_DOMICILE",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.64,
longitude: -1.61,
lat: 49.64,
lon: -1.61,
phone: "02 33 00 00 10",
email: "",
note: "Aide à domicile, accompagnement, repas, ménage.",
keywords: ["aide domicile", "ménage", "menage", "repas", "accompagnement"],
categories: ["Social", "Domicile"],
},
{
id: "aide_2",
label: "ADMR Cotentin",
type: "AIDE_DOMICILE",
commune: "Valognes",
adresse: "Valognes",
latitude: 49.509,
longitude: -1.471,
lat: 49.509,
lon: -1.471,
phone: "02 33 00 00 11",
email: "",
note: "Aide à domicile, toilette, repas, accompagnement.",
keywords: ["aide domicile", "toilette", "repas"],
categories: ["Social"],
},

// =========================
// EHPAD / HÉBERGEMENT
// =========================
{
id: "ehpad_1",
label: "EHPAD Le Gros Hêtre",
type: "EHPAD",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.638,
longitude: -1.615,
lat: 49.638,
lon: -1.615,
phone: "02 33 00 00 20",
email: "",
note: "Hébergement et accueil temporaire.",
keywords: ["ehpad", "hébergement", "hebergement", "temporaire"],
categories: ["Hébergement"],
},
{
id: "hebergement_1",
label: "Résidence autonomie Les Mimosas",
type: "HEBERGEMENT_TEMPORAIRE",
commune: "La Glacerie",
adresse: "La Glacerie",
latitude: 49.605,
longitude: -1.58,
lat: 49.605,
lon: -1.58,
phone: "02 33 00 00 21",
email: "",
note: "Hébergement temporaire et relais.",
keywords: ["hébergement temporaire", "hebergement temporaire", "relais", "urgence"],
categories: ["Hébergement", "Social"],
},

// =========================
// SOCIAL
// =========================
{
id: "social_1",
label: "DAC Manche",
type: "COORDINATION",
commune: "Manche",
adresse: "Manche",
latitude: 49.1,
longitude: -1.2,
lat: 49.1,
lon: -1.2,
phone: "02 33 00 00 30",
email: "",
note: "Coordination des situations complexes.",
keywords: ["dac", "coordination", "complexité", "complexite"],
categories: ["Coordination"],
},
{
id: "social_2",
label: "PMI Manche",
type: "PMI",
commune: "Manche",
adresse: "Manche",
latitude: 49.1,
longitude: -1.2,
lat: 49.1,
lon: -1.2,
phone: "02 33 00 00 31",
email: "",
note: "Protection maternelle et infantile.",
keywords: ["pmi", "enfant", "famille"],
categories: ["Social"],
},
{
id: "social_3",
label: "ASE / CRIP Manche",
type: "ASE",
commune: "Manche",
adresse: "Manche",
latitude: 49.1,
longitude: -1.2,
lat: 49.1,
lon: -1.2,
phone: "02 33 00 00 32",
email: "",
note: "Protection de l’enfance et recueil des informations préoccupantes.",
keywords: ["ase", "protection enfant", "crip"],
categories: ["Social"],
},

// =========================
// STRUCTURES MÉDICALES
// =========================
{
id: "smr_1",
label: "SMR CHPC",
type: "SMR",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.63,
longitude: -1.61,
lat: 49.63,
lon: -1.61,
phone: "02 33 00 00 40",
email: "",
note: "Soins médicaux et de réadaptation.",
keywords: ["smr", "rééducation", "reeducation"],
categories: ["Soins"],
},

// =========================
// SOLUTIONS TERRAIN
// =========================
{
id: "terrain_1",
label: "Voisinage / famille relais",
type: "SOLUTION_TERRAIN",
commune: "Local",
adresse: "Local",
latitude: 49.63,
longitude: -1.61,
lat: 49.63,
lon: -1.61,
phone: "",
email: "",
note: "Relais familial ou voisinage mobilisable.",
keywords: ["solution terrain", "famille", "voisin"],
categories: ["Terrain"],
},
{
id: "terrain_2",
label: "Aide ponctuelle mairie",
type: "SOLUTION_TERRAIN",
commune: "Cherbourg-en-Cotentin",
adresse: "Cherbourg-en-Cotentin",
latitude: 49.64,
longitude: -1.61,
lat: 49.64,
lon: -1.61,
phone: "",
email: "",
note: "Soutien local ou relais ponctuel.",
keywords: ["mairie", "urgence sociale"],
categories: ["Terrain"],
},
];

const merged = [...legacyResources, ...resourceKnowledgeBase];
const seen = new Set();

export const resourcesCotentin = merged.filter((item) => {
  const key = String(item.id || item.label || "");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
