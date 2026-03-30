function nowIso() {
  return new Date().toISOString();
}

function createHistoryEntry(label) {
  return {
    id: `learning_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: nowIso(),
    label,
  };
}

function createDefaultLearningState(contact = {}) {
  return {
    contactId: contact.id || "",
    acceptedCount: 0,
    refusedCount: 0,
    pendingCount: 0,
    noResponseCount: 0,
    totalInteractions: 0,
    score: 0,
    lastStatus: "unknown",
    lastUpdatedAt: "",
    history: [],
  };
}

function clampScore(value) {
  if (value > 100) return 100;
  if (value < 0) return 0;
  return value;
}

function normalizeState(state, contact = {}) {
  const base = createDefaultLearningState(contact);
  const next = {
    ...base,
    ...(state || {}),
  };

  next.score = clampScore(Number(next.score || 0));
  next.acceptedCount = Number(next.acceptedCount || 0);
  next.refusedCount = Number(next.refusedCount || 0);
  next.pendingCount = Number(next.pendingCount || 0);
  next.noResponseCount = Number(next.noResponseCount || 0);
  next.totalInteractions = Number(next.totalInteractions || 0);
  next.history = Array.isArray(next.history) ? next.history : [];

  return next;
}

function appendHistory(state, label) {
  return {
    ...state,
    lastUpdatedAt: nowIso(),
    history: [createHistoryEntry(label), ...(state.history || [])],
  };
}

export function ensureLearningMap(contacts = [], currentMap = {}) {
  return (contacts || []).reduce((acc, contact) => {
    acc[contact.id] = normalizeState(currentMap?.[contact.id], contact);
    return acc;
  }, {});
}

export function registerAccepted(state, delta = 12) {
  const current = normalizeState(state);
  const next = {
    ...current,
    acceptedCount: current.acceptedCount + 1,
    totalInteractions: current.totalInteractions + 1,
    lastStatus: "accepte",
    score: clampScore(current.score + Number(delta || 0)),
  };

  return appendHistory(next, "Contact accepté");
}

export function registerRefused(state) {
  const current = normalizeState(state);
  const next = {
    ...current,
    refusedCount: current.refusedCount + 1,
    totalInteractions: current.totalInteractions + 1,
    lastStatus: "refuse",
    score: clampScore(current.score - 10),
  };

  return appendHistory(next, "Contact refusé");
}

export function registerPending(state) {
  const current = normalizeState(state);
  const next = {
    ...current,
    pendingCount: current.pendingCount + 1,
    totalInteractions: current.totalInteractions + 1,
    lastStatus: "en_attente",
    score: clampScore(current.score + 1),
  };

  return appendHistory(next, "Contact en attente");
}

export function registerNoResponse(state) {
  const current = normalizeState(state);
  const next = {
    ...current,
    noResponseCount: current.noResponseCount + 1,
    totalInteractions: current.totalInteractions + 1,
    lastStatus: "message_laisse",
    score: clampScore(current.score - 4),
  };

  return appendHistory(next, "Message laissé / pas de réponse");
}

export function getLearningScore(state) {
  return normalizeState(state).score;
}

export function getLearningLabel(state) {
  const score = getLearningScore(state);

  if (score >= 70) return "Très fiable";
  if (score >= 50) return "Fiable";
  if (score >= 30) return "Plutôt fiable";
  if (score >= 15) return "Peu fiable";
  return "À qualifier";
}