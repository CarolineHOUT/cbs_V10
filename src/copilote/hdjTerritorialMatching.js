import {
HDJ_TERRITORIAL_NEEDS,
HDJ_TERRITORIAL_OFFERS,
HDJ_TERRITORIAL_PATHWAYS,
} from "../data/hdjTerritorialNetwork";

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function safeArray(value) {
return Array.isArray(value) ? value : [];
}

function uniq(items) {
return Array.from(new Set(safeArray(items).filter(Boolean)));
}

function includesSignal(text, signal) {
const a = normalize(text);
const b = normalize(signal);
return Boolean(a && b && (a.includes(b) || b.includes(a)));
}

function flattenPatientSignals({ patient, activeKeywords, selectedOrientation, hdjForm }) {
const keywordLabels = safeArray(activeKeywords).map((item) =>
typeof item === "string" ? item : item?.label
);

return uniq([
...keywordLabels,
selectedOrientation,
patient?.service,
patient?.orientation,
patient?.solutionLabel,
patient?.copilotSummary?.selectedOrientation,
patient?.copilotSummary?.currentSolution,
patient?.dischargePlanning?.solutionLabel,
patient?.parcoursStatus,
patient?.structuredIntake?.social?.isolementSocial ? "isolement" : "",
patient?.structuredIntake?.social?.precarite ? "précarité" : "",
patient?.structuredIntake?.social?.protectionJuridique ? "protection juridique" : "",
patient?.structuredIntake?.securite?.logementInadapte ? "logement inadapté" : "",
patient?.structuredIntake?.securite?.troublesCognitifs ? "troubles cognitifs" : "",
patient?.structuredIntake?.securite?.desorientation ? "désorientation" : "",
patient?.structuredIntake?.gir?.passageIDE?.oui ? "surveillance IDE" : "",
patient?.structuredIntake?.traitement?.difficulte?.observanceFragile
? "observance fragile"
: "",
...safeArray(hdjForm?.acts),
hdjForm?.objective,
hdjForm?.title,
]);
}

export function computeHDJOpportunityScore({
patient,
activeKeywords = [],
selectedOrientation = "",
hdjForm = {},
lengthOfStay = 0,
isMedicallyReady = false,
targetDate = "",
}) {
const signals = flattenPatientSignals({
patient,
activeKeywords,
selectedOrientation,
hdjForm,
});

let score = 0;
const reasons = [];

const add = (condition, points, reason) => {
if (condition) {
score += points;
reasons.push(reason);
}
};

add(selectedOrientation === "HDJ", 18, "Orientation HDJ déjà envisagée");
add(isMedicallyReady || patient?.dateSortantMedicalement, 18, "Patient sortant médicalement");
add(!targetDate, 10, "Date cible non verrouillée");
add(lengthOfStay >= 7, 10, "Séjour prolongé ou à risque de prolongation");
add(lengthOfStay >= 10, 8, "Seuil J+10 atteint");

const text = signals.join(" ");

add(includesSignal(text, "retour domicile impossible"), 14, "Retour domicile bloqué");
add(includesSignal(text, "retour domicile fragile"), 12, "Retour domicile fragile");
add(includesSignal(text, "surveillance IDE"), 12, "Besoin de surveillance IDE");
add(includesSignal(text, "pansements complexes"), 12, "Soins techniques programmables");
add(includesSignal(text, "perfusion"), 10, "Acte technique ambulatoire possible");
add(includesSignal(text, "perte autonomie"), 10, "Perte d’autonomie");
add(includesSignal(text, "isolement"), 8, "Isolement social");
add(includesSignal(text, "aidant épuisé"), 8, "Aidant épuisé");
add(includesSignal(text, "observance fragile"), 8, "Sécurisation thérapeutique");
add(includesSignal(text, "douleur"), 8, "Réévaluation symptomatique possible");

return {
score: Math.min(score, 100),
level: score >= 75 ? "forte" : score >= 45 ? "modérée" : "faible",
reasons: uniq(reasons).slice(0, 6),
};
}

export function getTerritorialNeedsForPatient(args) {
const signals = flattenPatientSignals(args);
const text = signals.join(" ");

return HDJ_TERRITORIAL_NEEDS.map((need) => {
const matched = safeArray(need.keywords).filter((keyword) =>
includesSignal(text, keyword)
);

return {
...need,
score: matched.length * 10,
matched,
};
})
.filter((need) => need.score > 0)
.sort((a, b) => b.score - a.score);
}

export function getHDJPathwayMatches(args) {
const signals = flattenPatientSignals(args);
const text = signals.join(" ");

return HDJ_TERRITORIAL_PATHWAYS.map((pathway) => {
const matched = safeArray(pathway.triggerKeywords).filter((keyword) =>
includesSignal(text, keyword)
);

let score = matched.length * 14;

if (args.selectedOrientation === "HDJ") score += 10;
if (safeArray(args.hdjForm?.acts).some((act) => pathway.coreActs.some((x) => includesSignal(x, act)))) {
score += 15;
}

return {
pathway,
score,
reasons: uniq(matched),
};
})
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);
}

export function getHDJTerritorialOfferMatches(args) {
const pathwayMatches = getHDJPathwayMatches(args);
const matchedPathwayIds = pathwayMatches.map((item) => item.pathway.id);

return HDJ_TERRITORIAL_OFFERS.map((offer) => {
const supportedMatched = safeArray(offer.supportedPathways).filter((id) =>
matchedPathwayIds.includes(id)
);

const pathwayScore = supportedMatched.reduce((sum, id) => {
const found = pathwayMatches.find((item) => item.pathway.id === id);
return sum + (found?.score || 0);
}, 0);

const matchedPathways = supportedMatched
.map((id) => pathwayMatches.find((item) => item.pathway.id === id)?.pathway)
.filter(Boolean);

const reasons = uniq(
matchedPathways.flatMap((pathway) => pathway.triggerKeywords || [])
).slice(0, 6);

const maturityBonus =
offer.maturity === "existant à documenter"
? 10
: offer.maturity === "existant à consolider"
? 8
: offer.maturity === "à structurer"
? 4
: 0;

return {
offer,
score: Math.min(Math.round(pathwayScore / 2 + maturityBonus), 100),
matchedPathways,
reasons,
};
})
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);
}

export function buildHDJTerritorialDecision(args) {
const opportunity = computeHDJOpportunityScore(args);
const needs = getTerritorialNeedsForPatient(args);
const pathways = getHDJPathwayMatches(args);
const offers = getHDJTerritorialOfferMatches(args);

return {
opportunity,
needs,
pathways,
offers,
bestPathway: pathways[0]?.pathway || null,
bestOffer: offers[0]?.offer || null,
};
}
