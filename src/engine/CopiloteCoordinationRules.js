export function getCoordinationActions(patient, selectedSubcategories = []) {
const subs = selectedSubcategories || [];
const actions = [];

function pushAction(type, reason, priority = "Normale") {
actions.push({
id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
type,
reason,
priority,
});
}

// IDEL
if (
subs.some((s) =>
["Pansements complexes", "Perfusions", "Passage infirmier quotidien"].includes(s)
)
) {
pushAction("IDEL", "Soins techniques à domicile", "Haute");
}

// HAD
if (
subs.some((s) =>
["HAD adulte", "HAD pédiatrique", "HAD post-partum"].includes(s)
)
) {
pushAction("HAD", "Organisation de soins complexes coordonnés", "Haute");
}

// SSIAD
if (
subs.some((s) =>
["SSIAD", "Nursing lourd", "Surveillance rapprochée"].includes(s)
)
) {
pushAction("SSIAD", "Besoin d’accompagnement soignant à domicile", "Haute");
}

// Aide à domicile
if (
subs.some((s) =>
[
"Aide à la toilette",
"Aide au lever",
"Aide au coucher",
"Aide aux repas",
"Aide ménagère",
"Aide à domicile jeune mère",
].includes(s)
)
) {
pushAction("Aide à domicile", "Besoin d’aide humaine quotidienne", "Haute");
}

// DAC / CPTS
if (
subs.some((s) =>
["Isolement social", "Précarité", "Absence d’aidants", "Logement inadapté"].includes(s)
)
) {
pushAction("DAC", "Coordination de parcours complexe", "Haute");
pushAction("CPTS", "Relais territorial et coordination de proximité", "Normale");
}

// PMI (⚠️ TON BLOC BUGGÉ ÉTAIT ICI)
if (
patient?.duoProfil === "maternite" &&
subs.some((s) =>
["Suivi PMI", "Suivi PMI nécessaire", "Soutien parental"].includes(s)
)
) {
pushAction("PMI", "Soutien mère-enfant et parentalité", "Haute");
}

return actions;
}