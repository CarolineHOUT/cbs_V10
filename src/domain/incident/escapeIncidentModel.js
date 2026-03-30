// 🔹 création ID simple
function uid(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// 🔹 horodatage
function now() {
  return new Date().toISOString();
}

// 🔹 structure initiale
export function createEscapeIncident({ patient, declaredBy }) {
  return {
    id: uid("inc"),
    patientId: patient.id,

    status: "declared",
    startedAt: now(),
    closedAt: null,

    declaration: {
      declaredBy,
      service: patient.service,
      room: patient.chambre,
      discoveredAt: now(),

      vulnerabilityProfiles: patient.vulnerabilityProfiles || [],
      isVulnerable: patient.isVulnerable || false,

      description: {
        clothing: [],
        mobility: [],
        mentalState: [],
        lastSeenLocation: "",
        lastSeenAt: now(),
      },
    },

    actions: [],
    decisions: [],
    notifications: [],

    incidentLog: [
      createEvent({
        type: "incident_declared",
        label: "Incident déclaré",
        role: "service",
        by: declaredBy,
      }),
    ],

    outcome: {
      found: null,
      foundAt: null,
      foundLocation: null,
      finalStatus: null,
    },
  };
}

// 🔹 événement standard
export function createEvent({
  type,
  label,
  role,
  by,
  payload = {},
}) {
  return {
    id: uid("evt"),
    at: now(),
    type,
    label,
    role,
    by,
    payload,
  };
}

// 🔹 ajouter un événement
export function addIncidentEvent(incident, event) {
  return {
    ...incident,
    incidentLog: [...incident.incidentLog, event],
  };
}

// 🔹 changer statut (avec traçabilité)
export function updateIncidentStatus(incident, status, by, role) {
  const event = createEvent({
    type: "status_changed",
    label: `Changement de statut → ${status}`,
    role,
    by,
    payload: { status },
  });

  return {
    ...incident,
    status,
    incidentLog: [...incident.incidentLog, event],
  };
}

// 🔹 ajouter action
export function addAction(incident, action) {
  const event = createEvent({
    type: "action",
    label: action.label,
    role: action.role,
    by: action.by,
    payload: action,
  });

  return {
    ...incident,
    actions: [...incident.actions, action],
    incidentLog: [...incident.incidentLog, event],
  };
}

// 🔹 ajouter décision
export function addDecision(incident, decision) {
  const event = createEvent({
    type: "decision",
    label: decision.label,
    role: decision.role,
    by: decision.by,
    payload: decision,
  });

  return {
    ...incident,
    decisions: [...incident.decisions, decision],
    incidentLog: [...incident.incidentLog, event],
  };
}

// 🔹 clôture
export function closeIncident(incident, outcome, by, role) {
  const event = createEvent({
    type: "incident_closed",
    label: "Incident clôturé",
    role,
    by,
    payload: outcome,
  });

  return {
    ...incident,
    status: "closed",
    closedAt: now(),
    outcome,
    incidentLog: [...incident.incidentLog, event],
  };
}