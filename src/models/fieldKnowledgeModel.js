// ===============================
// FIELD KNOWLEDGE MODEL
// Mémoire terrain CARABBAS
// ===============================

// ---------- ENUMS ----------

export const CONTACT_STATUS = {
NEW: "new",
TO_TEST: "to_test",
RELIABLE: "reliable",
VERY_RELIABLE: "very_reliable",
TO_CONFIRM: "to_confirm",
OBSOLETE: "obsolete",
};

export const WORKAROUND_STATUS = {
PROPOSED: "proposed",
TESTED: "tested",
USEFUL: "useful",
VALIDATED: "validated",
LOW_VALUE: "low_value",
OBSOLETE: "obsolete",
};

export const OUTCOME_STATUS = {
SUCCESS: "success",
FAILURE: "failure",
UNKNOWN: "unknown",
};

// ---------- HELPERS ----------

function generateId(prefix) {
return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function now() {
return new Date().toISOString();
}

// ===============================
// CONTACT TERRAIN
// ===============================

export function createFieldContact({
resourceId = "",
label = "",
role = "",
phone = "",
email = "",
preferredTime = "",
territoryKey = "",
notes = "",
addedBy = "Utilisateur CARABBAS",
}) {
return {
id: generateId("contact"),
resourceId,
label,
role,
phone,
email,
preferredTime,
territoryKey,
notes,

status: CONTACT_STATUS.NEW,
reliability: 1,

createdAt: now(),
addedBy,

usageCount: 0,
successCount: 0,
failureCount: 0,
};
}

// Mise à jour usage contact
export function registerContactUsage(contact, outcome = OUTCOME_STATUS.UNKNOWN) {
const updated = { ...contact };

updated.usageCount += 1;

if (outcome === OUTCOME_STATUS.SUCCESS) {
updated.successCount += 1;
}

if (outcome === OUTCOME_STATUS.FAILURE) {
updated.failureCount += 1;
}

updated.reliability = computeContactReliability(updated);

return updated;
}

// Score simple de fiabilité
export function computeContactReliability(contact) {
const total = contact.successCount + contact.failureCount;

if (total === 0) return contact.reliability;

const ratio = contact.successCount / total;

if (ratio > 0.8) return 5;
if (ratio > 0.6) return 4;
if (ratio > 0.4) return 3;
if (ratio > 0.2) return 2;
return 1;
}

// ===============================
// WORKAROUND (SYSTÈME D)
// ===============================

export function createWorkaround({
title = "",
description = "",
contextTags = [],
resourceId = "",
territoryKey = "",
conditions = "",
risks = "",
addedBy = "Utilisateur CARABBAS",
}) {
return {
id: generateId("workaround"),
title,
description,
contextTags,
resourceId,
territoryKey,
conditions,
risks,

status: WORKAROUND_STATUS.PROPOSED,
usefulnessScore: 1,

createdAt: now(),
addedBy,

usageCount: 0,
};
}

// Mise à jour usage workaround
export function registerWorkaroundUsage(workaround) {
return {
...workaround,
usageCount: workaround.usageCount + 1,
usefulnessScore: Math.min(5, workaround.usefulnessScore + 0.2),
};
}

// ===============================
// MATCHING CONTEXTE
// ===============================

// Vérifie si un workaround correspond au contexte
export function matchWorkaroundToContext(workaround, contextTags = []) {
if (!workaround.contextTags || workaround.contextTags.length === 0) return false;

return workaround.contextTags.some((tag) =>
contextTags.includes(tag)
);
}

// Filtrer les workarounds pertinents
export function getRelevantWorkarounds(workarounds, contextTags = []) {
return workarounds
.filter((w) => matchWorkaroundToContext(w, contextTags))
.sort((a, b) => b.usefulnessScore - a.usefulnessScore);
}

// ===============================
// CONTACTS PAR RESSOURCE
// ===============================

export function getContactsForResource(contacts, resourceId) {
return contacts
.filter((c) => c.resourceId === resourceId)
.sort((a, b) => b.reliability - a.reliability);
}

// ===============================
// SYNTHÈSE TERRAIN
// ===============================

export function buildFieldInsights({
contacts = [],
workarounds = [],
contextTags = [],
}) {
const relevantWorkarounds = getRelevantWorkarounds(workarounds, contextTags);

const bestContacts = contacts
.sort((a, b) => b.reliability - a.reliability)
.slice(0, 2);

return {
bestContacts,
relevantWorkarounds,
};
}