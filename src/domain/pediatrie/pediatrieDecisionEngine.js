export function isPediatricPatient(patient) {
const service = String(patient?.service || patient?.serviceCode || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

const age = Number(patient?.age);

return (
age < 18 ||
service.includes("pedi") ||
service.includes("neonat") ||
service.includes("enfant")
);
}

export function getPediatricDecision(patient) {
const age = Number(patient?.age);
const service = String(patient?.service || patient?.serviceCode || "").toLowerCase();

if (service.includes("neonat")) {
return {
subject: "Surveillance néonatale",
blockage: "Observation médicale",
orientation: "Retour domicile parents",
targetLabel: "Sortie < 48h",
complexityLabel: "Surveillance",
complexityScore: 3,
};
}

if (patient?.structuredIntake?.social?.precarite) {
return {
subject: "Coordination sociale familiale",
blockage: "Situation sociale à sécuriser",
orientation: "ASE / social",
targetLabel: "Décision à poser",
complexityLabel: "Complexe",
complexityScore: 6,
};
}

return {
subject: "Surveillance clinique pédiatrique",
blockage: "Observation médicale",
orientation: "Retour domicile parents",
targetLabel: "Sortie < 48h",
complexityLabel: age < 3 ? "Surveillance" : "Simple",
complexityScore: age < 3 ? 3 : 1,
};
}
