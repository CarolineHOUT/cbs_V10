import { HOSPITAL_SERVICES } from "./hospitalServices";
import { PATIENT_SCENARIOS } from "./dpiPatientScenarios";
import { deriveFromStructuredIntake } from "../domain/intake/intakeDerivation";


const NOMS = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard",
  "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent",
  "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux",
  "Vincent", "Fournier", "Morel", "Girard", "Mercier", "Dupont",
  "Lambert", "Bonnet", "Francois", "Martinez", "Legrand", "Garnier",
  "Faure", "Rousseau", "Blanc", "Guerin", "Muller", "Henry",
  "Roussel", "Nicolas", "Perrin", "Morin", "Mathieu", "Clement",
];

const PRENOMS_ENFANTS_H = [
  "Léo", "Noé", "Malo", "Eliott", "Nino", "Tom", "Hugo", "Louis",
  "Jules", "Arthur", "Gabriel", "Raphaël", "Lucas", "Nathan"
];

const PRENOMS_ENFANTS_F = [
  "Léa", "Mia", "Rose", "Anna", "Lina", "Lou", "Emma", "Chloé",
  "Alice", "Manon", "Jade", "Inès", "Zoé", "Camille"
];

const PRENOMS_ADULTES_H = [
  "Jean", "Pierre", "Philippe", "Patrick", "Alain", "Michel",
  "Christian", "Laurent", "Thierry", "Olivier", "Nicolas", "David"
];

const PRENOMS_ADULTES_F = [
  "Marie", "Sophie", "Claire", "Nathalie", "Isabelle", "Sandrine",
  "Céline", "Julie", "Aurélie", "Émilie", "Caroline", "Anne"
];
const SEXES = ["H", "F"];

function getFirstName(sexe, age) {
  if (age < 18) {
    return sexe === "F"
      ? random(PRENOMS_ENFANTS_F)
      : random(PRENOMS_ENFANTS_H);
  }

  return sexe === "F"
    ? random(PRENOMS_ADULTES_F)
    : random(PRENOMS_ADULTES_H);
}


function random(arr) {
return arr[Math.floor(Math.random() * arr.length)];
}

function calculateAge(date) {
const diff = Date.now() - date.getTime();
return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function randomDateOfBirth() {
const year = 1925 + Math.floor(Math.random() * 60);
const month = Math.floor(Math.random() * 12);
const day = Math.floor(Math.random() * 28) + 1;
return new Date(year, month, day);
}

function randomDateOfBirthForService(service) {
const code = String(service?.code || "");
const currentYear = new Date().getFullYear();

if (code === "PEDIA" || code === "HDJ_PEDIA") {
const age = 1 + Math.floor(Math.random() * 17);
return new Date(
currentYear - age,
Math.floor(Math.random() * 12),
Math.floor(Math.random() * 28) + 1
);
}

if (code.startsWith("NEONAT")) {
const today = new Date();
const daysAgo = Math.floor(Math.random() * 180);
return new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

if (
code === "ALZHEIMER" ||
code === "GERIA_HC" ||
code === "SMR1" ||
code === "SMR2" ||
code === "SMR3"
) {
const age = 70 + Math.floor(Math.random() * 25);
return new Date(
currentYear - age,
Math.floor(Math.random() * 12),
Math.floor(Math.random() * 28) + 1
);
}

if (code === "GYNECO" || code === "OBST3" || code === "OBS4") {
const age = 20 + Math.floor(Math.random() * 25);
return new Date(
currentYear - age,
Math.floor(Math.random() * 12),
Math.floor(Math.random() * 28) + 1
);
}

return randomDateOfBirth();
}

function randomINS() {
return "INS" + Math.floor(Math.random() * 1000000000);
}

function randomIEP() {
return "IEP" + Math.floor(Math.random() * 100000);
}

function weightedRandomScenario() {
const pool = PATIENT_SCENARIOS.flatMap((s) => Array(s.weight).fill(s));
return random(pool);
}

function createBaseStructuredIntake() {
return {
entourage: {
seul: false,
enFamille: false,
enInstitution: false,
aidant: false,
aucuneAide: false,
aideADomicile: false,
aideFamiliale: false,
commentaire: "",
},
gir: {
gir: "",
repas: {
portage: false,
telealarme: false,
repasMamy: false,
},
passageIDE: {
oui: false,
non: false,
frequence: "",
nomInfirmier: "",
numero: "",
},
pharmacie: {
preparateur: "",
nomPharmacie: "",
pilulier: false,
vrac: false,
},
kine: {
oui: false,
non: false,
typePriseEnCharge: "",
nomKine: "",
},
},
traitement: {
observePar: {
patient: false,
famille: false,
autre: false,
},
modePreparation: {
pilulier: false,
vrac: false,
mixte: false,
inconnu: false,
},
difficulte: {
oublis: false,
confusion: false,
refus: false,
observanceFragile: false,
},
commentaire: "",
},
dependance: {
toilette: "",
habillage: "",
alimentation: "",
eliminationUrinaire: "",
eliminationFecale: "",
mobilisation: "",
gestionTraitement: "",
commentaire: "",
},
securite: {
risqueChute: false,
isolement: false,
troublesCognitifs: false,
desorientation: false,
refusAide: false,
logementInadapte: false,
commentaire: "",
},
materiel: {
protheses: {
auditives: false,
dentaires: false,
lunettes: false,
autre: false,
},
aidesTechniques: {
canne: false,
deambulateur: false,
fauteuil: false,
litMedicalise: false,
autre: false,
},
commentaire: "",
},
social: {
personneConfiance: "",
personneAPrevenir: "",
protectionJuridique: "",
isolementSocial: false,
precarite: false,
commentaire: "",
},
commentairesGeneraux: "",
};
}

function buildStructuredIntakeForService(service, age) {
const code = String(service?.code || "");

if (code === "PEDIA" || code === "HDJ_PEDIA") {
return {
...createBaseStructuredIntake(),
entourage: {
seul: false,
enFamille: true,
enInstitution: false,
aidant: true,
aucuneAide: false,
aideADomicile: false,
aideFamiliale: true,
commentaire: "Présence parentale / représentant légal.",
},
social: {
personneConfiance: "",
personneAPrevenir: "Parent / représentant légal",
protectionJuridique: "Autorité parentale",
isolementSocial: false,
precarite: false,
commentaire: "Recueil pédiatrique adapté à l’âge.",
},
securite: {
risqueChute: false,
isolement: false,
troublesCognitifs: false,
desorientation: false,
refusAide: false,
logementInadapte: false,
commentaire: "Surveillance adaptée à l’enfant.",
},
dependance: {
toilette: "Aide parentale",
habillage: "Aide parentale",
alimentation: age < 6 ? "Aide complète" : "Partielle",
eliminationUrinaire: "Selon âge",
eliminationFecale: "Selon âge",
mobilisation: "Adaptée à l’âge",
gestionTraitement: "Parents / soignants",
commentaire: "Autonomie évaluée selon l’âge.",
},
commentairesGeneraux: "Patient mineur : décisions avec les parents.",
};
}

if (code.startsWith("NEONAT")) {
return {
...createBaseStructuredIntake(),
entourage: {
seul: false,
enFamille: true,
enInstitution: false,
aidant: true,
aucuneAide: false,
aideADomicile: false,
aideFamiliale: true,
commentaire: "Parents identifiés.",
},
social: {
personneConfiance: "",
personneAPrevenir: "Parents",
protectionJuridique: "Autorité parentale",
isolementSocial: false,
precarite: false,
commentaire: "Nouveau-né : recueil centré parents / soins néonataux.",
},
dependance: {
toilette: "Complète",
habillage: "Complète",
alimentation: "Biberon / allaitement",
eliminationUrinaire: "Couches",
eliminationFecale: "Couches",
mobilisation: "Nouveau-né",
gestionTraitement: "Soignants",
commentaire: "Dépendance totale liée à l’âge.",
},
securite: {
risqueChute: false,
isolement: false,
troublesCognitifs: false,
desorientation: false,
refusAide: false,
logementInadapte: false,
commentaire: "Surveillance néonatale.",
},
commentairesGeneraux: "Patient nouveau-né.",
};
}

if (code === "GYNECO" || code === "OBST3" || code === "OBS4") {
return {
...createBaseStructuredIntake(),
entourage: {
seul: false,
enFamille: true,
enInstitution: false,
aidant: true,
aucuneAide: false,
aideADomicile: false,
aideFamiliale: true,
commentaire: "Entourage familial identifié.",
},
social: {
personneConfiance: "Conjoint / proche",
personneAPrevenir: "Conjoint / proche",
protectionJuridique: "",
isolementSocial: false,
precarite: false,
commentaire: "Recueil adapté gynécologie / obstétrique.",
},
commentairesGeneraux:
code === "GYNECO"
? "Patiente suivie en gynécologie."
: "Patiente suivie en obstétrique.",
};
}

if (
code === "ALZHEIMER" ||
code === "GERIA_HC" ||
code === "SMR1" ||
code === "SMR2" ||
code === "SMR3"
) {
return weightedRandomScenario().intake;
}

return weightedRandomScenario().intake;
}

function getSexForService(service) {
const code = String(service?.code || "");

if (code === "GYNECO" || code === "OBST3" || code === "OBS4") {
return "F";
}

return random(SEXES);
}

function randomAdmissionDateForService(service) {
  const code = String(service?.code || "");
  const today = new Date();

  let maxDaysAgo = 12;

  if (code.startsWith("NEONAT")) maxDaysAgo = 20;
  if (code === "REA") maxDaysAgo = 18;
  if (code.includes("HDJ")) maxDaysAgo = 1;
  if (code === "ALZHEIMER" || code.startsWith("SMR")) maxDaysAgo = 45;
  if (code === "GERIA_HC") maxDaysAgo = 30;

  const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1;
  today.setDate(today.getDate() - daysAgo);

  return today.toISOString().slice(0, 10);
}

function randomMedicalReadyDateForService(service, admissionDate) {
  const code = String(service?.code || "");

  // Pas pertinent pour l’HDJ / ambulatoire
  if (code.includes("HDJ")) return "";

  const admission = new Date(admissionDate);
  if (Number.isNaN(admission.getTime())) return "";

  const today = new Date();
  const daysSinceAdmission = Math.floor(
    (today.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Si séjour trop récent, pas encore sortant
  if (daysSinceAdmission < 2) return "";

  let probability = 0.25;

  if (code.startsWith("SMR")) probability = 0.45;
  if (code === "GERIA_HC" || code === "ALZHEIMER") probability = 0.4;
  if (code === "MIMI_HC" || code === "MPC_HC" || code.startsWith("MPV")) {
    probability = 0.35;
  }
  if (code === "REA" || code.includes("SI") || code.includes("REA")) {
    probability = 0.08;
  }
  if (code === "PEDIA") probability = 0.3;
  if (code.startsWith("NEONAT")) probability = 0.12;
  if (code === "OBST3" || code === "OBS4" || code === "GYNECO") {
    probability = 0.25;
  }

  if (Math.random() > probability) return "";

  const minDaysBeforeReady = code.startsWith("SMR") ? 5 : 2;
  const maxReadyOffset = Math.max(minDaysBeforeReady, daysSinceAdmission - 1);

  const readyOffset =
    minDaysBeforeReady +
    Math.floor(Math.random() * Math.max(1, maxReadyOffset - minDaysBeforeReady + 1));

  const readyDate = new Date(admission);
  readyDate.setDate(admission.getDate() + readyOffset);

  if (readyDate > today) return "";

  return readyDate.toISOString().slice(0, 10);
}


function generatePatient(service, index) {
const birthDate = randomDateOfBirthForService(service);
const age = calculateAge(birthDate);
const admissionDate = randomAdmissionDateForService(service);
const medicalReadyDate = "";
const sexe = getSexForService(service);
const structuredIntake = buildStructuredIntakeForService(service, age);
const derived = deriveFromStructuredIntake(structuredIntake);



const paddedIndex = String(index + 1).padStart(3, "0");

return {
id: `dpi_${service.code}_${paddedIndex}`,
nom: random(NOMS),
prenom: getFirstName(sexe, age),
dateNaissance: birthDate.toISOString().slice(0, 10),

age,
sexe,

dateEntree: admissionDate,
admissionDate,
entryDate: admissionDate,

medicalReadyDate,
dateSortantMedicalement: medicalReadyDate,

ins: randomINS(),
iep: randomIEP(),

service: service.label,
serviceCode: service.code,

chambre: String(200 + index),
lit: "A",

source: "DPI",
structuredIntake,

derivedCategories: derived.derivedCategories,
derivedKeywords: derived.derivedKeywords,
derivedOrientations: derived.derivedOrientations,
derivedFreins: derived.derivedFreins,
derivedConsequences: derived.derivedConsequences,
derivedAlerts: derived.derivedAlerts,

complexityScore: derived.complexityScore,
complexityLabel: derived.complexityLabel,
};
}

export function generateDPIPatients() {
const patients = [];

HOSPITAL_SERVICES.forEach((service) => {
const occupancy = 0.7;
const count = Math.max(1, Math.floor(service.capacity * occupancy));

for (let i = 0; i < count; i += 1) {
patients.push(generatePatient(service, patients.length));
}
});

return patients;
}
