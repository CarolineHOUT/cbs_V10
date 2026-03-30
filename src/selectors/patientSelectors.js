function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function normalizeLabel(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getPatientDisplayName(patient) {
  if (!patient) return "Aucun patient";
  const firstName = patient.prenom || patient.firstName || "";
  const lastName = patient.nom || patient.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || patient.id || "Patient sans nom";
}

export function getPatientSeverity(patient) {
  return patient?.gravite || patient?.severity || "Standard";
}

export function getPatientOutstandingActions(patient) {
  return toArray(patient?.actionPlan).filter((action) => {
    const status = action?.status || action?.statut;
    return !["done", "termine", "closed", "accepte"].includes(normalizeLabel(status));
  }).length;
}

export function buildPatientMetrics(patients = [], crisis = {}) {
  const safePatients = toArray(patients);
  const total = safePatients.length;
  const critical = safePatients.filter(
    (patient) => normalizeLabel(getPatientSeverity(patient)) === "critique"
  ).length;
  const withFollowUp = safePatients.filter(
    (patient) => toArray(patient?.resourceFollowUp).length > 0
  ).length;
  const pendingActions = safePatients.reduce(
    (sum, patient) => sum + getPatientOutstandingActions(patient),
    0
  );

  return [
    {
      label: "Patients suivis",
      value: total,
      tone: "blue",
      detail: total > 0 ? `${withFollowUp} avec suivi ressource` : "Démarrer un recueil",
    },
    {
      label: "Situations critiques",
      value: critical,
      tone: critical > 0 ? "red" : "green",
      detail: critical > 0 ? "À prioriser dans le pilotage" : "Aucune alerte forte",
    },
    {
      label: "Actions en attente",
      value: pendingActions,
      tone: pendingActions > 0 ? "amber" : "green",
      detail: pendingActions > 0 ? "Relances et décisions à suivre" : "Backlog maîtrisé",
    },
    {
      label: "Cellule de crise",
      value: crisis?.crisisOpen ? "Ouverte" : "Inactive",
      tone: crisis?.crisisOpen ? "violet" : "blue",
      detail: crisis?.contextData?.title || "Activation à la demande",
    },
  ];
}

export function buildIntakeCompletion(patientIntake = {}) {
  const identity = patientIntake?.identity || {};
  const territory = patientIntake?.territory || {};
  const selectedKeywords = Object.values(patientIntake?.intakeSelections || {}).reduce(
    (sum, categories) =>
      sum +
      Object.values(categories || {}).reduce(
        (categorySum, keywords) => categorySum + toArray(keywords).length,
        0
      ),
    0
  );

  const checks = [
    Boolean(identity.lastName),
    Boolean(identity.firstName),
    Boolean(identity.birthDate || identity.age),
    Boolean(identity.service),
    Boolean(territory.city),
    selectedKeywords > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const progress = Math.round((completed / checks.length) * 100);

  return {
    progress,
    selectedKeywords,
    summary: `${completed}/${checks.length} blocs renseignés`,
  };
}
