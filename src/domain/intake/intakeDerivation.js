import { INTAKE_MAPPING_RULES } from "./intakeMapping";

function uniqBy(items = [], key = "code") {
  const seen = new Set();

  return items.filter((item) => {
    const value = item?.[key] || JSON.stringify(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function normalizeSeverity(items = []) {
  return items.map((item) => ({
    severity: "medium",
    ...item,
  }));
}

function buildAlertFromFrein(frein) {
  if (!frein) return null;

  if (frein.severity === "high" || frein.severity === "critical") {
    return {
      code: `alert_${frein.code}`,
      label: frein.label,
      level: frein.severity === "critical" ? "critical" : "warning",
      source: "intake",
    };
  }

  return null;
}

function computeComplexityScore({
  freins = [],
  consequences = [],
  orientations = [],
}) {
  let score = 0;

  score += freins.length * 3;
  score += consequences.length * 2;
  score += orientations.length;

  freins.forEach((frein) => {
    if (frein?.severity === "high") score += 2;
    if (frein?.severity === "critical") score += 4;
  });

  return score;
}

function resolveComplexityLabel(score) {
  if (score >= 16) return "critique";
  if (score >= 9) return "complexe";
  return "standard";
}

function deriveVulnerabilityProfiles(
  structuredIntake = {},
  derivedFreins = [],
  derivedConsequences = []
) {
  const profiles = [];

  const addProfile = (code, label, level = "medium") => {
    if (!profiles.some((item) => item.code === code)) {
      profiles.push({ code, label, level });
    }
  };

  if (
    structuredIntake?.social?.isolementSocial === true ||
    structuredIntake?.entourage?.seul === true
  ) {
    addProfile("isolement_social", "Isolement social", "high");
  }

  if (structuredIntake?.entourage?.aucuneAide === true) {
    addProfile("absence_relais", "Absence de relais / aidant", "high");
  }

  if (
    ["P", "T"].includes(structuredIntake?.dependance?.toilette) ||
    ["P", "T"].includes(structuredIntake?.dependance?.habillage) ||
    ["P", "T"].includes(structuredIntake?.dependance?.alimentation) ||
    ["P", "T"].includes(structuredIntake?.dependance?.mobilisation)
  ) {
    addProfile("perte_autonomie", "Perte d'autonomie", "high");
  }

  if (
    structuredIntake?.securite?.troublesCognitifs === true ||
    structuredIntake?.securite?.desorientation === true
  ) {
    addProfile("troubles_cognitifs", "Troubles cognitifs", "high");
  }

  if (structuredIntake?.securite?.risqueChute === true) {
    addProfile("risque_chute", "Risque de chute", "medium");
  }

  if (
    structuredIntake?.traitement?.difficulte?.observanceFragile === true ||
    structuredIntake?.traitement?.difficulte?.oublis === true ||
    structuredIntake?.traitement?.difficulte?.confusion === true
  ) {
    addProfile("observance_fragile", "Observance fragile", "medium");
  }

  const hasRiskFrein = derivedFreins.some((frein) =>
    ["isolement", "perte_autonomie", "troubles_cognitifs"].includes(frein.code)
  );

  const hasRiskConsequence = derivedConsequences.some((item) =>
    ["retour_non_securise", "sortie_haut_risque"].includes(item.code)
  );

  if (hasRiskFrein || hasRiskConsequence) {
    addProfile("sortie_a_risque", "Sortie à risque", "high");
  }

  return profiles;
}

export function deriveFromStructuredIntake(structuredIntake = {}) {
  const matchedRules = INTAKE_MAPPING_RULES.filter((rule) =>
    typeof rule.when === "function" ? rule.when(structuredIntake) : false
  );

  const derivedCategories = uniqBy(
    matchedRules.flatMap((rule) => rule.categories || []),
    "code"
  );

  const derivedKeywords = uniqBy(
    matchedRules.flatMap((rule) => rule.keywords || []),
    "code"
  );

  const derivedFreins = uniqBy(
    normalizeSeverity(matchedRules.flatMap((rule) => rule.freins || [])),
    "code"
  );

  const derivedConsequences = uniqBy(
    matchedRules.flatMap((rule) => rule.consequences || []),
    "code"
  );

  const derivedOrientations = uniqBy(
    matchedRules
      .flatMap((rule) => rule.orientations || [])
      .sort((a, b) => (a.priority || 99) - (b.priority || 99)),
    "code"
  );

  const derivedAlerts = uniqBy(
    derivedFreins.map(buildAlertFromFrein).filter(Boolean),
    "code"
  );

  const matchedRuleIds = matchedRules.map((rule) => rule.id);

  const complexityScore = computeComplexityScore({
    freins: derivedFreins,
    consequences: derivedConsequences,
    orientations: derivedOrientations,
  });

  const complexityLabel = resolveComplexityLabel(complexityScore);

  const vulnerabilityProfiles = deriveVulnerabilityProfiles(
    structuredIntake,
    derivedFreins,
    derivedConsequences
  );

  const isVulnerable = vulnerabilityProfiles.length > 0;

  return {
    derivedCategories,
    derivedKeywords,
    derivedFreins,
    derivedConsequences,
    derivedOrientations,
    derivedAlerts,
    matchedRuleIds,
    complexityScore,
    complexityLabel,
    vulnerabilityProfiles,
    isVulnerable,
  };
}