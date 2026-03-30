const M = {
HAD: "SC_HAD",
IDEL: "SC_IDEL",
SSIAD: "SC_SSIAD",
SPASAD: "SC_SPASAD",
SAAD: "SC_SAAD",
PORTAGE: "SC_PORTAGE",
TELEASS: "SC_TELEASS",
GARDE_DOM: "SC_GARDE_DOM",
ERGO: "SC_ERGO",
EHPAD: "SC_EHPAD",
HEBERG_TEMP: "SC_HEBERG_TEMP",
SMR: "SC_SMR",
RES_AUTONOMIE: "SC_RES_AUTONOMIE",
ACC_JOUR: "SC_ACC_JOUR",
TRANSPORT: "SC_TRANSPORT",
DAC: "SC_DAC",
ASS_SOC: "SC_ASS_SOC",
MDA: "SC_MDA",
ASSOC_AID: "SC_ASSOC_AID",
HEBERG_URG: "SC_HEBERG_URG",
CMP: "SC_CMP",
PMI: "SC_PMI",
SF_DOM: "SC_SF_DOM",
CAMSP: "SC_CAMSP",
SESSAD: "SC_SESSAD",
IME: "SC_IME",
ITEP: "SC_ITEP",
ACC_RELAIS: "SC_ACC_RELAIS",
ASE: "SC_ASE",
PEDOPSY: "SC_PEDOPSY",
ACC_MERE_ENFANT: "SC_ACC_MERE_ENFANT",
};

export const RECUEIL_TO_RESOURCE_MAPPING = {
Adultes: {
"Soins lourds": {
"Nursing lourd": [M.HAD, M.SSIAD],
"Nursing renforcé": [M.HAD, M.SSIAD],
"Aide totale": [M.SSIAD, M.SAAD],
"Aide partielle": [M.SSIAD, M.SAAD],
"Mobilisation à 2": [M.HAD, M.SSIAD],
"Transfert lit-fauteuil": [M.SSIAD, M.SAAD],
"Prévention d’escarres": [M.HAD, M.IDEL, M.SSIAD],
"Pansements complexes": [M.HAD, M.IDEL],
Perfusions: [M.HAD, M.IDEL],
Oxygénothérapie: [M.HAD, M.IDEL],
"Ventilation non invasive": [M.HAD],
"Alimentation entérale": [M.HAD],
"Alimentation parentérale": [M.HAD],
"Troubles cognitifs sévères": [M.DAC, M.SSIAD, M.EHPAD],
"Surveillance rapprochée": [M.HAD, M.DAC],
},

"Aides à domicile": {
"Aide humaine renforcée": [M.SAAD, M.SPASAD],
"Aide à la toilette": [M.SAAD, M.SPASAD],
"Aide au lever": [M.SAAD, M.SPASAD],
"Aide au coucher": [M.SAAD, M.SPASAD],
"Aide aux repas": [M.SAAD, M.PORTAGE],
"Aide ménagère": [M.SAAD],
"Portage de repas": [M.PORTAGE],
Téléassistance: [M.TELEASS],
"Garde à domicile": [M.GARDE_DOM],
"Passage infirmier quotidien": [M.IDEL, M.HAD],
Ergothérapie: [M.ERGO],
},

"Solutions d’aval": {
"Retour à domicile avec aides": [M.SAAD, M.SSIAD, M.SPASAD, M.DAC],
"HAD adulte": [M.HAD],
SSIAD: [M.SSIAD],
SPASAD: [M.SPASAD],
EHPAD: [M.EHPAD],
"Hébergement temporaire": [M.HEBERG_TEMP],
SSR: [M.SMR],
"Résidence autonomie": [M.RES_AUTONOMIE],
"Accueil de jour": [M.ACC_JOUR],
"Transport sanitaire": [M.TRANSPORT],
},

Social: {
"Isolement social": [M.ASS_SOC, M.DAC, M.ASSOC_AID],
Précarité: [M.ASS_SOC, M.DAC, M.HEBERG_URG],
Vulnérabilité: [M.ASS_SOC, M.DAC],
"Difficultés financières": [M.ASS_SOC, M.MDA],
"Logement inadapté": [M.ASS_SOC, M.DAC],
"Absence d’aidants": [M.DAC, M.ASSOC_AID],
"Aidant épuisé": [M.DAC, M.ASSOC_AID, M.MDA],
"Rupture familiale": [M.ASS_SOC, M.DAC],
"Violence intrafamiliale": [M.ASS_SOC, M.CMP],
"Protection juridique": [M.ASS_SOC, M.MDA],
Tutelle: [M.MDA],
Curatelle: [M.MDA],
"Mesure d’accompagnement social": [M.ASS_SOC],
"Démarches administratives": [M.ASS_SOC, M.MDA],
"Ouverture de droits": [M.ASS_SOC, M.MDA],
AAH: [M.MDA],
APA: [M.MDA],
PCH: [M.MDA],
"Hébergement d’urgence": [M.HEBERG_URG],
"Accès aux soins difficile": [M.DAC, M.ASS_SOC],
"Rupture de droits sociaux": [M.ASS_SOC, M.MDA],
"Absence de couverture sociale": [M.ASS_SOC, M.MDA],
"Situation de rue": [M.HEBERG_URG, M.ASS_SOC],
Addictions: [M.CMP, M.DAC],
"Troubles psychiatriques non suivis": [M.CMP, M.DAC],
"Besoin d’accompagnement social renforcé": [M.ASS_SOC, M.DAC],
},
},

Pédiatrie: {
Soins: {
"Nursing pédiatrique": [M.HAD, M.IDEL],
"Soins techniques pédiatriques": [M.HAD, M.IDEL],
"Surveillance rapprochée enfant": [M.HAD, M.DAC],
"Troubles de l’alimentation": [M.HAD, M.CAMSP],
"Sonde nasogastrique": [M.HAD],
"Oxygénothérapie pédiatrique": [M.HAD],
"Mobilisation avec aide parentale": [M.DAC, M.SESSAD],
"Enfant polyhandicapé": [M.CAMSP, M.SESSAD, M.DAC],
"Enfant dépendant": [M.CAMSP, M.SESSAD, M.DAC],
},

Aides: {
"Soutien parental": [M.DAC, M.PMI, M.ASSOC_AID],
"Aide éducative": [M.SESSAD, M.CAMSP],
"Intervention à domicile pédiatrique": [M.HAD, M.IDEL, M.SESSAD],
"Répit parental": [M.ACC_RELAIS, M.ASSOC_AID],
"Coordination PMI": [M.PMI],
},

"Solutions d’aval": {
"Retour à domicile accompagné": [M.DAC, M.PMI, M.HAD],
"HAD pédiatrique": [M.HAD],
"IDEL pédiatrique": [M.IDEL],
CAMSP: [M.CAMSP],
SESSAD: [M.SESSAD],
IME: [M.IME],
ITEP: [M.ITEP],
"Accueil relais enfant": [M.ACC_RELAIS],
"Transport pédiatrique": [M.TRANSPORT],
},

Social: {
"Situation familiale complexe": [M.ASS_SOC, M.DAC, M.ASE],
"Soutien parental": [M.PMI, M.ASS_SOC, M.ASSOC_AID],
"Famille isolée": [M.ASS_SOC, M.DAC],
"Précarité familiale": [M.ASS_SOC, M.HEBERG_URG],
"Protection de l’enfance": [M.ASE, M.ASS_SOC],
ASE: [M.ASE],
"Information préoccupante": [M.ASE],
"Enfant vulnérable": [M.ASE, M.ASS_SOC],
"Handicap de l’enfant": [M.MDA, M.CAMSP, M.SESSAD],
AEEH: [M.MDA],
"Difficultés éducatives": [M.SESSAD, M.ITEP, M.ASE],
"Absence de relais parental": [M.ASS_SOC, M.ASE],
"Logement précaire": [M.ASS_SOC, M.HEBERG_URG],
"Violence intrafamiliale": [M.ASE, M.ASS_SOC],
"Soutien psychologique familial": [M.PEDOPSY, M.CMP],
},
},

Maternité: {
Soins: {
"Nursing post-partum": [M.SF_DOM, M.HAD],
"Aide à la mobilité": [M.SAAD, M.HAD],
"Aide à l’hygiène": [M.SAAD, M.HAD],
"Surveillance post-césarienne": [M.HAD, M.SF_DOM],
"Allaitement accompagné": [M.PMI, M.SF_DOM],
"Douleurs post-opératoires": [M.HAD, M.SF_DOM],
"Fatigue maternelle importante": [M.SF_DOM, M.SAAD],
},

Aides: {
"Aide à domicile jeune mère": [M.SAAD],
"Soutien parental": [M.PMI, M.ASSOC_AID],
"Aide aux soins du nouveau-né": [M.PMI, M.SF_DOM],
"Aide aux repas": [M.SAAD, M.PORTAGE],
"Aide aux tâches quotidiennes": [M.SAAD],
},

"Solutions d’aval": {
"Retour à domicile avec sage-femme": [M.SF_DOM],
"HAD post-partum": [M.HAD],
"Suivi PMI": [M.PMI],
"Aide à domicile parentale": [M.SAAD],
"Accueil mère-enfant": [M.ACC_MERE_ENFANT],
"Hébergement d’urgence famille": [M.HEBERG_URG],
"Transport mère-enfant": [M.TRANSPORT],
},

Social: {
"Vulnérabilité maternelle": [M.ASS_SOC, M.PMI],
"Précarité périnatale": [M.ASS_SOC, M.PMI, M.HEBERG_URG],
"Logement précaire": [M.ASS_SOC, M.HEBERG_URG],
"Violence conjugale": [M.ASS_SOC],
"Dépression post-partum": [M.PEDOPSY, M.CMP, M.PMI],
"Soutien à la parentalité": [M.PMI, M.ASSOC_AID],
"Absence de réseau familial": [M.ASS_SOC, M.PMI],
"Difficultés administratives": [M.ASS_SOC, M.MDA],
"Suivi PMI nécessaire": [M.PMI],
"Hébergement d’urgence famille": [M.HEBERG_URG],
"Fragilité du lien parent-enfant": [M.PMI, M.PEDOPSY],
},
},
};

function uniq(items) {
return [...new Set(items.filter(Boolean))];
}

export function getResourceTargetsFromSelections(selectedSubcategories = {}) {
const targets = [];

Object.entries(selectedSubcategories).forEach(([domain, keywords]) => {
const domainMap = RECUEIL_TO_RESOURCE_MAPPING[domain];
if (!domainMap || !Array.isArray(keywords)) return;

Object.entries(domainMap).forEach(([groupName, groupMap]) => {
keywords.forEach((keyword) => {
if (groupMap[keyword]) {
targets.push(...groupMap[keyword]);
}
});
});
});

return uniq(targets);
}

export function matchesRecueilToResource({
selectedSubcategories = {},
resource,
}) {
const targets = getResourceTargetsFromSelections(selectedSubcategories);
if (targets.length === 0) return true;

const resourceSubCategory =
resource?.sous_categorie_id ||
resource?.subcategoryId ||
resource?.subcategory ||
resource?.resourceTypeId ||
"";

return targets.includes(resourceSubCategory);
}

export function explainResourceMatch({
selectedSubcategories = {},
resource,
}) {
const explanations = [];

Object.entries(selectedSubcategories).forEach(([domain, keywords]) => {
const domainMap = RECUEIL_TO_RESOURCE_MAPPING[domain];
if (!domainMap || !Array.isArray(keywords)) return;

Object.entries(domainMap).forEach(([groupName, groupMap]) => {
keywords.forEach((keyword) => {
const targets = groupMap[keyword] || [];
const resourceSubCategory =
resource?.sous_categorie_id ||
resource?.subcategoryId ||
resource?.subcategory ||
resource?.resourceTypeId ||
"";

if (targets.includes(resourceSubCategory)) {
explanations.push(`${domain} • ${groupName} • ${keyword}`);
}
});
});
});

return uniq(explanations);
}