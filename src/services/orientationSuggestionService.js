import {
  orientationRules,
  getResourcesBySubcategoryAndTerritory,
  getSubcategoryLabel,
  getProfileLabel,
  getUrgencyLabel,
} from "../data/territorialResourceCatalog";

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

export function findMatchingOrientationRule({ profileId, urgencyId }) {
  return (
    orientationRules.find(
      (rule) =>
        normalizeString(rule.profileId) === normalizeString(profileId) &&
        normalizeString(rule.urgencyId) === normalizeString(urgencyId)
    ) || null
  );
}

function buildOrientationSlot(subcategoryId, territoryId, rank) {
  if (!subcategoryId) {
    return {
      rank,
      subcategoryId: "",
      subcategoryLabel: "",
      resources: [],
    };
  }

  const resources = getResourcesBySubcategoryAndTerritory(
    subcategoryId,
    territoryId
  );

  return {
    rank,
    subcategoryId,
    subcategoryLabel: getSubcategoryLabel(subcategoryId),
    resources,
  };
}

export function getOrientationSuggestions({
  territoryId,
  profileId,
  urgencyId,
}) {
  if (!territoryId || !profileId || !urgencyId) {
    return {
      rule: null,
      profileLabel: getProfileLabel(profileId),
      urgencyLabel: getUrgencyLabel(urgencyId),
      suggestions: [],
      warning:
        "Territoire, profil patient et niveau d’urgence sont nécessaires.",
    };
  }

  const rule = findMatchingOrientationRule({ profileId, urgencyId });

  if (!rule) {
    return {
      rule: null,
      profileLabel: getProfileLabel(profileId),
      urgencyLabel: getUrgencyLabel(urgencyId),
      suggestions: [],
      warning: "Aucune règle d’orientation ne correspond à cette situation.",
    };
  }

  const suggestions = [
    buildOrientationSlot(rule.orientation1SubcategoryId, territoryId, 1),
    buildOrientationSlot(rule.orientation2SubcategoryId, territoryId, 2),
    buildOrientationSlot(rule.orientation3SubcategoryId, territoryId, 3),
  ];

  return {
    rule,
    profileLabel: getProfileLabel(profileId),
    urgencyLabel: getUrgencyLabel(urgencyId),
    suggestions,
    warning: "",
  };
}

export function buildOrientationSummary({
  territoryId,
  profileId,
  urgencyId,
}) {
  const result = getOrientationSuggestions({
    territoryId,
    profileId,
    urgencyId,
  });

  if (!result.rule) {
    return {
      ...result,
      summary: "",
    };
  }

  const labels = result.suggestions
    .map((item) => item.subcategoryLabel)
    .filter(Boolean);

  return {
    ...result,
    summary: `Profil ${result.profileLabel} / urgence ${result.urgencyLabel} : ${labels.join(
      " → "
    )}`,
  };
}