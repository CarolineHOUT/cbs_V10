import {
  communes,
  territories,
  findTerritoryByCommuneLabel,
} from "../data/territorialResourceCatalog";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function inferTerritoryIdFromPatient(patientIntake) {
  const cityLabel = patientIntake?.territory?.city;
  if (!cityLabel) return "";

  const territory = findTerritoryByCommuneLabel(cityLabel);
  return territory?.id || "";
}

export function inferProfileIdFromPatient(patientIntake) {
  const scenarioType = patientIntake?.scenario?.type;
  const mainNeed = normalize(patientIntake?.territory?.mainNeed);
  const socialSituation = normalize(patientIntake?.socialContext?.socialSituation);
  const autonomy = normalize(patientIntake?.socialContext?.autonomy);
  const vulnerabilities = (patientIntake?.socialContext?.vulnerabilities || []).map(normalize);

  if (scenarioType === "pedia_maternite_ase") {
    return "P_ENFANT_PSY";
  }

  if (scenarioType === "sortie_insu_service") {
    return "P_PSY_ADULTE";
  }

  if (scenarioType === "patient_complexe_sans_solution_sortie") {
    return "P_RETOUR_COMPLEXE";
  }

  if (
    mainNeed.includes("coordination ase") ||
    mainNeed.includes("enfant")
  ) {
    return "P_ENFANT_PSY";
  }

  if (
    mainNeed.includes("maintien à domicile") ||
    autonomy.includes("fragilité fonctionnelle")
  ) {
    return "P_PA_FRAG";
  }

  if (
    vulnerabilities.includes("troubles cognitifs") ||
    vulnerabilities.includes("désorientation") ||
    socialSituation.includes("vit seule")
  ) {
    return "P_RETOUR_COMPLEXE";
  }

  return "P_RETOUR_COMPLEXE";
}

export function inferUrgencyIdFromPatient(patientIntake) {
  const scenarioType = patientIntake?.scenario?.type;
  const dischargeStatus = normalize(patientIntake?.stay?.dischargeStatus);
  const mainBarrier = normalize(patientIntake?.stay?.mainBarrier);

  if (scenarioType === "sortie_insu_service") {
    return "U_J0";
  }

  if (
    dischargeStatus.includes("non sécurisée") ||
    mainBarrier.includes("absence de solution") ||
    mainBarrier.includes("complexe")
  ) {
    return "U_J0";
  }

  if (scenarioType === "pedia_maternite_ase") {
    return "U_72H";
  }

  return "U_72H";
}

export function buildOrientationContextFromPatient(patientIntake) {
  const territoryId = inferTerritoryIdFromPatient(patientIntake);
  const profileId = inferProfileIdFromPatient(patientIntake);
  const urgencyId = inferUrgencyIdFromPatient(patientIntake);

  return {
    territoryId,
    profileId,
    urgencyId,
    labels: {
      territory:
        territories.find((item) => item.id === territoryId)?.label || "",
      commune:
        communes.find(
          (item) => normalize(item.label) === normalize(patientIntake?.territory?.city)
        )?.label || patientIntake?.territory?.city || "",
    },
  };
}