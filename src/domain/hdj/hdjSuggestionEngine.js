import { HDJ_MODELS } from "./hdjModels";
import { computeHDJTypology } from "./hdjTypology";

function matchesTrigger(typology, key, expectedValue) {
return typology?.[key] === expectedValue;
}

export function getHDJSuggestionsFromStructuredIntake(structuredIntake = {}) {
const typology = computeHDJTypology(structuredIntake);

const suggestions = HDJ_MODELS.map((model) => {
const triggers = model?.triggers || {};
const entries = Object.entries(triggers);

let score = 0;
let matchedTriggers = [];

entries.forEach(([key, expectedValue]) => {
if (matchesTrigger(typology, key, expectedValue)) {
score += 1;
matchedTriggers.push(key);
}
});

return {
...model,
score,
matchedTriggers,
typology,
};
})
.filter((model) => model.score > 0)
.sort((a, b) => b.score - a.score);

return {
typology,
suggestions,
recommended: suggestions.filter((item) => item.score >= 1),
stronglyRecommended: suggestions.filter((item) => item.score >= 2),
};
}
