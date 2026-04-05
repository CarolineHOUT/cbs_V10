export function computeHDJTypology(structuredIntake = {}) {
const dependance = structuredIntake?.dependance || {};
const social = structuredIntake?.social || {};
const entourage = structuredIntake?.entourage || {};
const securite = structuredIntake?.securite || {};
const traitement = structuredIntake?.traitement || {};
const materiel = structuredIntake?.materiel || {};

const aidesTechniques = materiel?.aidesTechniques || {};
const difficulteTraitement = traitement?.difficulte || {};

const autonomieScore = [
dependance?.toilette,
dependance?.habillage,
dependance?.alimentation,
dependance?.eliminationUrinaire,
dependance?.eliminationFecale,
dependance?.mobilisation,
dependance?.gestionTraitement,
].reduce((score, value) => {
if (value === "T") return score + 2;
if (value === "P") return score + 1;
return score;
}, 0);

let autonomie = "autonome";
if (autonomieScore >= 7) autonomie = "dependant";
else if (autonomieScore >= 2) autonomie = "semi_dependant";

let contexteSocial = "retour_simple";
if (
social?.precarite ||
securite?.logementInadapte ||
(entourage?.seul && entourage?.aucuneAide)
) {
contexteSocial = "rupture_parcours";
} else if (
social?.isolementSocial ||
entourage?.aucuneAide ||
entourage?.aidant === false
) {
contexteSocial = "situation_complexe";
} else if (
entourage?.aideADomicile ||
entourage?.aideFamiliale ||
entourage?.aidant
) {
contexteSocial = "retour_avec_aides";
}

let traitementNiveau = "simple";
if (
difficulteTraitement?.observanceFragile ||
difficulteTraitement?.oublis ||
difficulteTraitement?.confusion
) {
traitementNiveau = "surveillance_rapprochee";
}

let cognition = "normale";
if (securite?.troublesCognitifs || securite?.desorientation) {
cognition = securite?.desorientation ? "trouble_severe" : "trouble_leger";
}

let instabilite = "stable";
if (securite?.risqueChute || securite?.refusAide) {
instabilite = "fragile";
}
if (
securite?.troublesCognitifs &&
securite?.desorientation &&
difficulteTraitement?.observanceFragile
) {
instabilite = "instable";
}

let besoinsTechniques = "aucun";
const technicalActsCount = [
aidesTechniques?.canne,
aidesTechniques?.deambulateur,
aidesTechniques?.fauteuil,
aidesTechniques?.litMedicalise,
].filter(Boolean).length;

if (technicalActsCount >= 1) besoinsTechniques = "ponctuel";
if (technicalActsCount >= 2) besoinsTechniques = "structure";

const isolement = Boolean(social?.isolementSocial || entourage?.seul);
const precarite = Boolean(social?.precarite);
const risqueChute = Boolean(securite?.risqueChute);
const traitementComplexe = traitementNiveau !== "simple";
const besoinKine = Boolean(
dependance?.mobilisation === "P" ||
dependance?.mobilisation === "T" ||
aidesTechniques?.canne ||
aidesTechniques?.deambulateur
);
const besoinExamens = besoinsTechniques !== "aucun";

return {
autonomie,
autonomieScore,
contexteSocial,
traitementNiveau,
cognition,
instabilite,
besoinsTechniques,

isolement,
precarite,
risqueChute,
traitementComplexe,
besoinKine,
besoinExamens,

hasDependancePartielle: autonomie === "semi_dependant",
hasDependanceImportante: autonomie === "dependant",
hasTroubleCognitif: cognition !== "normale",
hasInstabilite: instabilite !== "stable",
};
}
