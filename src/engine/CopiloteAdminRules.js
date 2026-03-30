export function getOfficialDossiersForPatient(patient, selectedSubcategories = []) {
const age = Number(patient?.age || 0);
const subs = selectedSubcategories || [];
const dossiers = [];

const hasAutonomyNeed =
age >= 60 &&
subs.some((s) =>
[
"Aide à la toilette",
"Aide au lever",
"Aide au coucher",
"Aide aux repas",
"Aide ménagère",
"Téléassistance",
"Retour à domicile avec aides",
"Absence d’aidants",
].includes(s)
);

const hasDisabilityNeed =
subs.some((s) =>
[
"Nursing lourd",
"Surveillance rapprochée",
"Troubles cognitifs sévères",
"Logement inadapté",
"Transport sanitaire",
].includes(s)
) || patient?.duoCriteria?.includes("soins_lourds");

const hasChildProtectionNeed =
patient?.duoProfil === "pediatrie" &&
subs.some((s) =>
[
"Situation familiale complexe",
"Famille isolée",
"Précarité familiale",
"Absence de relais parental",
"Protection de l’enfance",
].includes(s)
);

if (hasAutonomyNeed) {
dossiers.push({
key: "apa",
label: "APA",
reason: "Perte d’autonomie / besoin d’aide humaine à domicile",
priority: "Haute",
});
}

if (hasDisabilityNeed) {
dossiers.push({
key: "mdph",
label: "MDPH",
reason: "Besoin durable de compensation / handicap / aides techniques",
priority: "Haute",
});
}

if (hasChildProtectionNeed) {
dossiers.push({
key: "ase",
label: "ASE / CRIP",
reason: "Vulnérabilité pédiatrique et besoin de protection / évaluation",
priority: "Critique",
});
}

return dossiers;
}