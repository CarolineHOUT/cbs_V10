import { HOSPITAL_SERVICES } from "./hospitalServices";
import { PATIENT_SCENARIOS } from "./dpiPatientScenarios";
import { deriveFromStructuredIntake } from "../domain/intake/intakeDerivation";

const NOMS = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit"];
const PRENOMS = ["Jean", "Marie", "Paul", "Luc", "Sophie", "Claire"];
const SEXES = ["H", "F"];

function randomDateOfBirth() {
  const year = 1925 + Math.floor(Math.random() * 60); // 1925–1985
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;

  return new Date(year, month, day);
}

function calculateAge(date) {
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function randomINS() {
  return "INS" + Math.floor(Math.random() * 1000000000);
}

function randomIEP() {
  return "IEP" + Math.floor(Math.random() * 100000);
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandomScenario() {
  const pool = PATIENT_SCENARIOS.flatMap((s) => Array(s.weight).fill(s));
  return random(pool);
}

function generatePatient(service, index) {
  const scenario = weightedRandomScenario();
  const structuredIntake = scenario.intake;
  const derived = deriveFromStructuredIntake(structuredIntake);
  const birthDate = randomDateOfBirth();
  const sexe = random(SEXES);

  return {
    id: `dpi_${service.code}_${index}`,
    nom: random(NOMS),
    prenom: random(PRENOMS),
    dateNaissance: birthDate.toISOString().slice(0, 10),
    age: calculateAge(birthDate),
    sexe,
    ins: randomINS(),
    iep: randomIEP(),
    service: service.label,
    serviceCode: service.code,
    chambre: String(200 + index),
    lit: "A",
    source: "DPI",
    structuredIntake,

    // mapping déjà appliqué
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
    const occupancy =
      service.code === "MPV1" ||
      service.code === "MPV3" ||
      service.code === "USP"
        ? 0.9
        : 0.7;

    const count = Math.floor(service.capacity * occupancy);

    for (let i = 0; i < count; i += 1) {
      patients.push(generatePatient(service, i));
    }
  });

  return patients;
}