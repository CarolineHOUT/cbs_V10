import React, {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useState,
} from "react";

import { resourcesCotentin } from "../contacts/resourcesCotentin";
import { generateDPIPatients } from "../data/dpiSeedPatients";
import { deriveFromStructuredIntake } from "../domain/intake/intakeDerivation";
import {
createEscapeIncident,
addAction,
} from "../domain/incident/escapeIncidentModel";

export const PatientSimulationContext = createContext(null);

const PATIENTS_STORAGE_KEY = "carabbas_patients_simules_v1";
const RESOURCES_STORAGE_KEY = "carabbas_resources_locales_v1";
const INCIDENTS_STORAGE_KEY = "carabbas_escape_incidents_v1";

function normalizeText(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function safeArray(value) {
if (!value) return [];
if (Array.isArray(value)) return value;
return [value];
}

function mergeProfiles(autoProfiles = [], manualProfiles = []) {
const merged = [...safeArray(autoProfiles), ...safeArray(manualProfiles)];
const seen = new Set();

return merged.filter((item) => {
const key = item?.code || item?.label;
if (!key || seen.has(key)) return false;
seen.add(key);
return true;
});
}

function readJsonStorage(key, fallback) {
try {
const raw = window.localStorage.getItem(key);
if (!raw) return fallback;
const parsed = JSON.parse(raw);
return parsed ?? fallback;
} catch (error) {
console.error(`Erreur lecture localStorage pour ${key}`, error);
return fallback;
}
}

function writeJsonStorage(key, value) {
try {
window.localStorage.setItem(key, JSON.stringify(value));
} catch (error) {
console.error(`Erreur écriture localStorage pour ${key}`, error);
}
}

function mergeDeep(base = {}, patch = {}) {
const output = { ...base };

Object.keys(patch || {}).forEach((key) => {
const baseValue = base?.[key];
const patchValue = patch?.[key];

const isBaseObject =
baseValue && typeof baseValue === "object" && !Array.isArray(baseValue);
const isPatchObject =
patchValue && typeof patchValue === "object" && !Array.isArray(patchValue);

if (isBaseObject && isPatchObject) {
output[key] = mergeDeep(baseValue, patchValue);
} else {
output[key] = patchValue;
}
});

return output;
}

function buildDefaultIncidentWorkflow(patient = {}) {
return {
contextTags: [],
vulnerabilityTags: [],
dangerTags: [],
descriptionTags: [],
freeDescription: "",
lastSeenLocation: patient?.service || "",
lastSeenAt: "",
clothingDetails: "",
internalZones: [],
extendedZones: [],
familyContacted: false,
patientReachedByPhone: false,
securityAlerted: false,
directorAlerted: false,
policeConsidered: false,
found: false,
foundLocation: "",
finalComment: "",
};
}

function normalizeIncident(rawIncident = {}) {
return {
...rawIncident,
patientId: rawIncident?.patientId || "",
status: rawIncident?.status || "declared",
currentStep: rawIncident?.currentStep || "declared",
declaredAt:
rawIncident?.declaredAt ||
rawIncident?.createdAt ||
new Date().toISOString(),
declaredBy: rawIncident?.declaredBy || "Utilisateur courant",
workflow: {
...buildDefaultIncidentWorkflow(),
...(rawIncident?.workflow || {}),
contextTags: safeArray(rawIncident?.workflow?.contextTags),
vulnerabilityTags: safeArray(rawIncident?.workflow?.vulnerabilityTags),
dangerTags: safeArray(rawIncident?.workflow?.dangerTags),
descriptionTags: safeArray(rawIncident?.workflow?.descriptionTags),
internalZones: safeArray(rawIncident?.workflow?.internalZones),
extendedZones: safeArray(rawIncident?.workflow?.extendedZones),
},
incidentLog: safeArray(rawIncident?.incidentLog),
outcome: rawIncident?.outcome || null,
closedAt: rawIncident?.closedAt || "",
};
}

export const emptyStructuredIntake = {
entourage: {
seul: false,
enFamille: false,
enInstitution: false,
aidant: false,
aucuneAide: false,
aideADomicile: false,
aideFamiliale: false,
commentaire: "",
},

gir: {
gir: "",
repas: {
portage: false,
telealarme: false,
repasMamy: false,
},
passageIDE: {
oui: false,
non: false,
frequence: "",
nomInfirmier: "",
numero: "",
},
pharmacie: {
preparateur: "",
nomPharmacie: "",
pilulier: false,
vrac: false,
},
kine: {
oui: false,
non: false,
typePriseEnCharge: "",
nomKine: "",
},
},

traitement: {
observePar: {
patient: false,
famille: false,
autre: false,
},
modePreparation: {
pilulier: false,
vrac: false,
mixte: false,
inconnu: false,
},
difficulte: {
oublis: false,
confusion: false,
refus: false,
observanceFragile: false,
},
commentaire: "",
},

dependance: {
toilette: "",
habillage: "",
alimentation: "",
eliminationUrinaire: "",
eliminationFecale: "",
mobilisation: "",
gestionTraitement: "",
commentaire: "",
},

securite: {
risqueChute: false,
isolement: false,
troublesCognitifs: false,
desorientation: false,
refusAide: false,
logementInadapte: false,
commentaire: "",
},

materiel: {
protheses: {
auditives: false,
dentaires: false,
lunettes: false,
autre: false,
},
aidesTechniques: {
canne: false,
deambulateur: false,
fauteuil: false,
litMedicalise: false,
autre: false,
},
commentaire: "",
},

social: {
personneConfiance: "",
personneAPrevenir: "",
protectionJuridique: "",
isolementSocial: false,
precarite: false,
commentaire: "",
},

commentairesGeneraux: "",
};

function mergeUniqueActions(existing = [], incoming = []) {
const current = Array.isArray(existing) ? existing : [];
const additions = Array.isArray(incoming) ? incoming : [];

const seen = new Set(
current.map((item) =>
normalizeText(
`${item.label || ""}|${item.typeDemande || item.workflowType || ""}|${
item.linkedResourceId || ""
}`
)
)
);

const safeIncoming = additions.filter(Boolean).map((item, index) => ({
id: item.id || `action_${Date.now()}_${index}`,
label: item.label || "Action",
responsable: item.responsable || item.owner || "À définir",
status: item.status || item.statut || "a_faire",
statut: item.statut || item.status || "a_faire",
priorite: item.priorite || item.priority || "standard",
source: item.source || "manuel",
echeance: item.echeance || item.dueDate || "",
dueDate: item.dueDate || item.echeance || "",
prochaineRelance: item.prochaineRelance || item.nextReminderAt || "",
nextReminderAt: item.nextReminderAt || item.prochaineRelance || "",
typeDemande: item.typeDemande || item.workflowType || "",
workflowType: item.workflowType || item.typeDemande || "",
linkedResourceId: item.linkedResourceId || null,
notes: item.notes || "",
dernierCommentaire: item.dernierCommentaire || item.lastComment || "",
lastComment: item.lastComment || item.dernierCommentaire || "",
motifRefus: item.motifRefus || item.refusalReason || "",
refusalReason: item.refusalReason || item.motifRefus || "",
motifAnnulation: item.motifAnnulation || item.cancellationReason || "",
cancellationReason: item.cancellationReason || item.motifAnnulation || "",
createdAt: item.createdAt || new Date().toISOString(),
updatedAt: item.updatedAt || "",
}));

const merged = [...current];

safeIncoming.forEach((item) => {
const key = normalizeText(
`${item.label || ""}|${item.typeDemande || item.workflowType || ""}|${
item.linkedResourceId || ""
}`
);

if (!seen.has(key)) {
seen.add(key);
merged.push(item);
}
});

return merged;
}

function computeResponseDelayHours(contactedAt, respondedAt) {
if (!contactedAt || !respondedAt) return null;

const start = new Date(contactedAt).getTime();
const end = new Date(respondedAt).getTime();

if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

return Math.round((end - start) / (1000 * 60 * 60));
}

function buildPatient(rawPatient = {}) {
const structuredIntake = mergeDeep(
emptyStructuredIntake,
rawPatient?.structuredIntake || {}
);

const manualVulnerabilityProfiles = safeArray(
rawPatient?.manualVulnerabilityProfiles
);

const baseDerived =
rawPatient?.derivedCategories ||
rawPatient?.derivedKeywords ||
rawPatient?.derivedOrientations ||
rawPatient?.matchedRuleIds ||
rawPatient?.derivedFreins ||
rawPatient?.derivedConsequences ||
rawPatient?.derivedAlerts ||
rawPatient?.vulnerabilityProfiles ||
rawPatient?.autoVulnerabilityProfiles ||
rawPatient?.isVulnerable
? {
derivedCategories: safeArray(rawPatient?.derivedCategories),
derivedKeywords: safeArray(rawPatient?.derivedKeywords),
derivedOrientations: safeArray(rawPatient?.derivedOrientations),
matchedRuleIds: safeArray(rawPatient?.matchedRuleIds),
derivedFreins: safeArray(rawPatient?.derivedFreins),
derivedConsequences: safeArray(rawPatient?.derivedConsequences),
derivedAlerts: safeArray(rawPatient?.derivedAlerts),
complexityScore: rawPatient?.complexityScore ?? 0,
complexityLabel: rawPatient?.complexityLabel || "standard",
autoVulnerabilityProfiles: safeArray(
rawPatient?.autoVulnerabilityProfiles ||
rawPatient?.vulnerabilityProfiles
),
}
: deriveFromStructuredIntake(structuredIntake);

const autoVulnerabilityProfiles = safeArray(
baseDerived?.autoVulnerabilityProfiles || baseDerived?.vulnerabilityProfiles
);

const vulnerability = {
...(rawPatient?.vulnerability || {}),
criteria: safeArray(rawPatient?.vulnerability?.criteria),
measures: safeArray(rawPatient?.vulnerability?.measures),
actions: safeArray(rawPatient?.vulnerability?.actions),
updatedAt: rawPatient?.vulnerability?.updatedAt || "",
updatedBy: rawPatient?.vulnerability?.updatedBy || "",
evaluator: rawPatient?.vulnerability?.evaluator || "",
author: rawPatient?.vulnerability?.author || "",
};

const manualCriteriaProfiles = vulnerability.criteria.map((item, index) => ({
code: `manual_criterion_${index}_${normalizeText(item)}`,
label: item,
source: "manual-criteria",
}));

const vulnerabilityProfiles = mergeProfiles(
autoVulnerabilityProfiles,
[...manualVulnerabilityProfiles, ...manualCriteriaProfiles]
);

const derived = {
...baseDerived,
autoVulnerabilityProfiles,
vulnerabilityProfiles,
isVulnerable:
vulnerabilityProfiles.length > 0 || vulnerability.criteria.length > 0,
};

return {
id: rawPatient?.id || `sim_${Date.now()}`,
nom: rawPatient?.nom || "",
prenom: rawPatient?.prenom || "",
dateNaissance: rawPatient?.dateNaissance || "",
age: rawPatient?.age || "",
ins: rawPatient?.ins || "",
iep: rawPatient?.iep || "",
service: rawPatient?.service || "",
chambre: rawPatient?.chambre || "",
lit: rawPatient?.lit || "",
orientation: rawPatient?.orientation || "",
blockReason: rawPatient?.blockReason || "",
blocage: rawPatient?.blocage || "",
severity: rawPatient?.severity || "Standard",
gravite: rawPatient?.gravite || rawPatient?.severity || "Standard",
dateEntree:
rawPatient?.dateEntree || new Date().toISOString().slice(0, 10),
dateSortiePrevue: rawPatient?.dateSortiePrevue || "",

medicalReady: Boolean(
rawPatient?.medicalReady ||
rawPatient?.sortantMedical ||
rawPatient?.medicalReadiness?.isMedicallyReady
),
sortantMedical: Boolean(
rawPatient?.sortantMedical ||
rawPatient?.medicalReady ||
rawPatient?.medicalReadiness?.isMedicallyReady
),
medicalReadyAt: rawPatient?.medicalReadyAt || "",
medicalReadiness: {
...(rawPatient?.medicalReadiness || {}),
isMedicallyReady: Boolean(
rawPatient?.medicalReadiness?.isMedicallyReady ||
rawPatient?.medicalReady ||
rawPatient?.sortantMedical
),
activatedAt:
rawPatient?.medicalReadiness?.activatedAt ||
rawPatient?.medicalReadyAt ||
"",
},

territory: rawPatient?.territory || {},
adresse: rawPatient?.adresse || {},

intakeSelections: rawPatient?.intakeSelections || {},
staySelections: rawPatient?.staySelections || {},
freeCriteria: safeArray(rawPatient?.freeCriteria),

structuredIntake,
vulnerability,

derivedCategories: derived.derivedCategories,
derivedKeywords: derived.derivedKeywords,
derivedOrientations: derived.derivedOrientations,
matchedRuleIds: derived.matchedRuleIds,
derivedFreins: derived.derivedFreins || [],
derivedConsequences: derived.derivedConsequences || [],
derivedAlerts: derived.derivedAlerts || [],
complexityScore: derived.complexityScore ?? 0,
complexityLabel: derived.complexityLabel || "standard",
autoVulnerabilityProfiles: derived.autoVulnerabilityProfiles || [],
manualVulnerabilityProfiles,
vulnerabilityProfiles: derived.vulnerabilityProfiles || [],
isVulnerable:
derived.isVulnerable ||
safeArray(rawPatient?.vulnerability?.criteria).length > 0 ||
false,

dynamicNeeds: safeArray(rawPatient?.dynamicNeeds),
dynamicCategories: safeArray(rawPatient?.dynamicCategories),
dynamicBlockages: safeArray(rawPatient?.dynamicBlockages),

actionPlan: safeArray(rawPatient?.actionPlan),
hdjHistory: safeArray(rawPatient?.hdjHistory),
resourceFollowUp: safeArray(rawPatient?.resourceFollowUp),
spiritNotes: safeArray(rawPatient?.spiritNotes).map((note) => ({
...note,
replies: safeArray(note?.replies),
})),
history: safeArray(rawPatient?.history),
categories: safeArray(rawPatient?.categories),
personneConfiance: rawPatient?.personneConfiance || "",
personneAPrevenir: rawPatient?.personneAPrevenir || "",
medecin: rawPatient?.medecin || "",
ide: rawPatient?.ide || "",
cadre: rawPatient?.cadre || "",
as: rawPatient?.as || "",
source: rawPatient?.source || "SIMULATION",
createdAt: rawPatient?.createdAt || new Date().toISOString(),
updatedAt: rawPatient?.updatedAt || "",
};
}

export function PatientSimulationProvider({ children }) {
const [patientsState, setPatientsState] = useState(() => {
const stored = readJsonStorage(PATIENTS_STORAGE_KEY, null);

if (stored && stored.length > 0) {
return stored.map(buildPatient);
}

return generateDPIPatients().map(buildPatient);
});

const [incidentsState, setIncidentsState] = useState(() => {
const stored = readJsonStorage(INCIDENTS_STORAGE_KEY, []);
return safeArray(stored).map(normalizeIncident);
});

const [resourcesState, setResourcesState] = useState(() => {
const stored = readJsonStorage(RESOURCES_STORAGE_KEY, null);
if (stored && Array.isArray(stored) && stored.length > 0) {
return stored;
}
return resourcesCotentin;
});

const createIncidentForPatient = useCallback((patient) => {
const incident = normalizeIncident({
...createEscapeIncident({
patient,
declaredBy: "Utilisateur courant",
}),
patientId: patient?.id,
declaredAt: new Date().toISOString(),
currentStep: "declared",
workflow: buildDefaultIncidentWorkflow(patient),
incidentLog: [
{
id: `evt_${Date.now()}`,
at: new Date().toISOString(),
type: "incident_declared",
label: "Disparition déclarée",
role: "workflow",
by: "Utilisateur courant",
},
],
});

setIncidentsState((prev) => [...prev, incident]);
return incident;
}, []);

const addIncidentAction = useCallback((incidentId, action) => {
setIncidentsState((prev) =>
prev.map((inc) => {
if (String(inc.id) !== String(incidentId)) return inc;
return normalizeIncident(addAction(inc, action));
})
);
}, []);

const updateIncidentWorkflow = useCallback(
(incidentId, patch, by = "Utilisateur courant") => {
setIncidentsState((prev) =>
prev.map((incident) => {
if (String(incident.id) !== String(incidentId)) return incident;

const nextWorkflow = mergeDeep(incident.workflow || {}, patch || {});

return normalizeIncident({
...incident,
workflow: nextWorkflow,
incidentLog: [
...safeArray(incident.incidentLog),
{
id: `evt_${Date.now()}`,
at: new Date().toISOString(),
type: "workflow_updated",
label: "Workflow incident mis à jour",
role: "workflow",
by,
payload: patch,
},
],
});
})
);
},
[]
);

const setIncidentStep = useCallback(
(incidentId, step, by = "Utilisateur courant") => {
setIncidentsState((prev) =>
prev.map((incident) => {
if (String(incident.id) !== String(incidentId)) return incident;

return normalizeIncident({
...incident,
currentStep: step,
status: step === "closed" ? "closed" : step,
incidentLog: [
...safeArray(incident.incidentLog),
{
id: `evt_${Date.now()}`,
at: new Date().toISOString(),
type: "step_changed",
label: `Étape → ${step}`,
role: "workflow",
by,
payload: { step },
},
],
});
})
);
},
[]
);

const updateIncidentStatus = useCallback(
(incidentId, status, by = "Utilisateur courant") => {
setIncidentsState((prev) =>
prev.map((incident) => {
if (String(incident.id) !== String(incidentId)) return incident;

return normalizeIncident({
...incident,
status,
incidentLog: [
...safeArray(incident.incidentLog),
{
id: `evt_${Date.now()}`,
at: new Date().toISOString(),
type: "status_changed",
label: `Changement de statut → ${status}`,
role: "workflow",
by,
payload: { status },
},
],
});
})
);
},
[]
);

const getIncidentsByPatientId = useCallback(
(patientId) =>
safeArray(incidentsState)
.filter((incident) => String(incident.patientId) === String(patientId))
.sort((a, b) => {
const aTime = new Date(a?.declaredAt || a?.createdAt || 0).getTime();
const bTime = new Date(b?.declaredAt || b?.createdAt || 0).getTime();
return bTime - aTime;
}),
[incidentsState]
);

const getActiveIncidentByPatientId = useCallback(
(patientId) =>
getIncidentsByPatientId(patientId).find(
(incident) => String(incident.status) !== "closed"
) || null,
[getIncidentsByPatientId]
);

const closeIncidentForPatient = useCallback(
(incidentId, by = "Utilisateur courant", outcome = {}) => {
setIncidentsState((prev) =>
prev.map((incident) => {
if (String(incident.id) !== String(incidentId)) return incident;

return normalizeIncident({
...incident,
status: "closed",
currentStep: "closed",
closedAt: new Date().toISOString(),
workflow: {
...(incident.workflow || {}),
found: outcome.found ?? incident?.workflow?.found ?? null,
foundLocation:
outcome.foundLocation || incident?.workflow?.foundLocation || "",
finalComment:
outcome.comment ||
incident?.workflow?.finalComment ||
outcome.finalStatus ||
"",
},
outcome: {
found: outcome.found ?? null,
foundAt: outcome.foundAt || new Date().toISOString(),
foundLocation: outcome.foundLocation || "",
finalStatus: outcome.finalStatus || "Incident clôturé",
comment: outcome.comment || "",
},
incidentLog: [
...safeArray(incident.incidentLog),
{
id: `evt_${Date.now()}`,
at: new Date().toISOString(),
type: "incident_closed",
label: "Incident clôturé",
role: "workflow",
by,
payload: outcome,
},
],
});
})
);
},
[]
);

useEffect(() => {
writeJsonStorage(PATIENTS_STORAGE_KEY, patientsState);
}, [patientsState]);

useEffect(() => {
writeJsonStorage(RESOURCES_STORAGE_KEY, resourcesState);
}, [resourcesState]);

useEffect(() => {
writeJsonStorage(INCIDENTS_STORAGE_KEY, incidentsState);
}, [incidentsState]);

const getPatientById = useCallback(
(patientId) => {
return (
patientsState.find(
(patient) => String(patient.id) === String(patientId)
) || null
);
},
[patientsState]
);

const addSimulatedPatient = useCallback((rawPatient) => {
const nextPatient = buildPatient(rawPatient);
const newId = nextPatient.id;

setPatientsState((prev) => {
const withoutSame = prev.filter(
(patient) => String(patient.id) !== String(newId)
);
return [nextPatient, ...withoutSame];
});

return newId;
}, []);

const updatePatient = useCallback((patientId, patch) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextPatch =
typeof patch === "function" ? patch(patient) : patch || {};

return buildPatient({
...patient,
...nextPatch,
updatedAt: new Date().toISOString(),
});
})
);
}, []);

const toggleManualVulnerabilityProfile = useCallback((patientId, profile) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const autoProfiles = safeArray(patient.autoVulnerabilityProfiles);
const autoCodes = new Set(autoProfiles.map((item) => item.code));

if (autoCodes.has(profile.code)) {
return patient;
}

const currentManual = safeArray(patient.manualVulnerabilityProfiles);
const exists = currentManual.some((item) => item.code === profile.code);

const nextManual = exists
? currentManual.filter((item) => item.code !== profile.code)
: [...currentManual, profile];

const nextMerged = mergeProfiles(autoProfiles, nextManual);

return {
...patient,
manualVulnerabilityProfiles: nextManual,
vulnerabilityProfiles: nextMerged,
isVulnerable: nextMerged.length > 0,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const updateStructuredIntake = useCallback((patientId, patch) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const currentStructuredIntake = mergeDeep(
emptyStructuredIntake,
patient?.structuredIntake || {}
);

const incomingPatch =
typeof patch === "function"
? patch(currentStructuredIntake)
: patch || {};

const nextStructuredIntake = mergeDeep(
currentStructuredIntake,
incomingPatch
);

const derived = deriveFromStructuredIntake(nextStructuredIntake);

const autoVulnerabilityProfiles = safeArray(
derived.vulnerabilityProfiles
);
const manualVulnerabilityProfiles = safeArray(
patient.manualVulnerabilityProfiles
);
const vulnerabilityProfiles = mergeProfiles(
autoVulnerabilityProfiles,
manualVulnerabilityProfiles
);

return {
...patient,
structuredIntake: nextStructuredIntake,
derivedCategories: derived.derivedCategories,
derivedKeywords: derived.derivedKeywords,
derivedOrientations: derived.derivedOrientations,
matchedRuleIds: derived.matchedRuleIds,
derivedFreins: derived.derivedFreins,
derivedConsequences: derived.derivedConsequences,
derivedAlerts: derived.derivedAlerts,
complexityScore: derived.complexityScore,
complexityLabel: derived.complexityLabel,
autoVulnerabilityProfiles,
manualVulnerabilityProfiles,
vulnerabilityProfiles,
isVulnerable:
vulnerabilityProfiles.length > 0 ||
safeArray(patient?.vulnerability?.criteria).length > 0,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const recomputeDerivedData = useCallback((patientId) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const derived = deriveFromStructuredIntake(
patient?.structuredIntake || emptyStructuredIntake
);

const autoVulnerabilityProfiles = safeArray(
derived.vulnerabilityProfiles
);
const manualVulnerabilityProfiles = safeArray(
patient.manualVulnerabilityProfiles
);
const vulnerabilityProfiles = mergeProfiles(
autoVulnerabilityProfiles,
manualVulnerabilityProfiles
);

return {
...patient,
derivedCategories: derived.derivedCategories,
derivedKeywords: derived.derivedKeywords,
derivedOrientations: derived.derivedOrientations,
matchedRuleIds: derived.matchedRuleIds,
derivedFreins: derived.derivedFreins,
derivedConsequences: derived.derivedConsequences,
derivedAlerts: derived.derivedAlerts,
complexityScore: derived.complexityScore,
complexityLabel: derived.complexityLabel,
autoVulnerabilityProfiles,
manualVulnerabilityProfiles,
vulnerabilityProfiles,
isVulnerable:
vulnerabilityProfiles.length > 0 ||
safeArray(patient?.vulnerability?.criteria).length > 0,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const deletePatient = useCallback((patientId) => {
setPatientsState((prev) =>
prev.filter((patient) => String(patient.id) !== String(patientId))
);
}, []);

const clearAllPatients = useCallback(() => {
setPatientsState([]);
}, []);

const addCategory = useCallback((patientId, payload) => {
const categoryLabel =
typeof payload === "string" ? payload : payload?.category || "";
const subCategoryLabel =
typeof payload === "string" ? "" : payload?.subCategory || "";

if (!String(categoryLabel || "").trim()) return;

setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextItem = {
id: `cat_${Date.now()}`,
category: String(categoryLabel).trim(),
subCategory: String(subCategoryLabel || "").trim(),
label: String(categoryLabel).trim(),
source: "terrain",
createdAt: new Date().toISOString(),
};

return {
...patient,
dynamicCategories: [...safeArray(patient.dynamicCategories), nextItem],
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addActionsToPatient = useCallback((patientId, actions) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
actionPlan: mergeUniqueActions(patient.actionPlan, actions),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const updateAction = useCallback((patientId, actionId, patch) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextActionPlan = safeArray(patient.actionPlan).map((action) => {
if (String(action.id) !== String(actionId)) return action;

const nextPatch =
typeof patch === "function" ? patch(action) : patch || {};

return {
...action,
...nextPatch,
updatedAt: new Date().toISOString(),
};
});

return {
...patient,
actionPlan: nextActionPlan,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addActionComment = useCallback((patientId, actionId, comment) => {
if (!comment) return;

setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextActionPlan = safeArray(patient.actionPlan).map((action) => {
if (String(action.id) !== String(actionId)) return action;

return {
...action,
dernierCommentaire: comment,
lastComment: comment,
updatedAt: new Date().toISOString(),
};
});

return {
...patient,
actionPlan: nextActionPlan,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const scheduleActionReminder = useCallback((patientId, actionId, nextDate) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextActionPlan = safeArray(patient.actionPlan).map((action) => {
if (String(action.id) !== String(actionId)) return action;

return {
...action,
prochaineRelance: nextDate || "",
nextReminderAt: nextDate || "",
updatedAt: new Date().toISOString(),
};
});

return {
...patient,
actionPlan: nextActionPlan,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addHDJToPatient = useCallback((patientId, hdjItem) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextItem = {
id: hdjItem?.id || `hdj_${Date.now()}`,
title: hdjItem?.title || "Demande HDJ",
acts: safeArray(hdjItem?.acts),
programming: hdjItem?.programming || {},
targetSecretariat: hdjItem?.targetSecretariat || "",
comment: hdjItem?.comment || "",
status: hdjItem?.status || "draft",
createdAt: hdjItem?.createdAt || new Date().toISOString(),
savedAt: hdjItem?.savedAt || "",
sentAt: hdjItem?.sentAt || "",
message: hdjItem?.message || "",
};

return {
...patient,
hdjHistory: [nextItem, ...safeArray(patient.hdjHistory)],
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const upsertResourceFollowUp = useCallback((patientId, resourceId, patch) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const current = safeArray(patient.resourceFollowUp);
const existing = current.find(
(item) => String(item.resourceId) === String(resourceId)
);

const nextPatch =
typeof patch === "function" ? patch(existing) : patch || {};

const merged = {
resourceId,
resourceLabel: existing?.resourceLabel || "",
workflowType: existing?.workflowType || "",
assignedTo: existing?.assignedTo || "",
platformName: existing?.platformName || "",
platformUrl: existing?.platformUrl || "",
notes: existing?.notes || "",
status: existing?.status || existing?.statut || "a_creer",
statut: existing?.statut || existing?.status || "a_creer",
contactedAt: existing?.contactedAt || existing?.dateEnvoi || "",
dateEnvoi: existing?.dateEnvoi || existing?.contactedAt || "",
respondedAt: existing?.respondedAt || existing?.dateReponse || "",
dateReponse: existing?.dateReponse || existing?.respondedAt || "",
nextFollowUpAt:
existing?.nextFollowUpAt || existing?.prochaineRelance || "",
prochaineRelance:
existing?.prochaineRelance || existing?.nextFollowUpAt || "",
refusalReason: existing?.refusalReason || existing?.motifRefus || "",
motifRefus: existing?.motifRefus || existing?.refusalReason || "",
cancellationReason:
existing?.cancellationReason || existing?.motifAnnulation || "",
motifAnnulation:
existing?.motifAnnulation || existing?.cancellationReason || "",
lastComment: existing?.lastComment || existing?.commentaire || "",
commentaire: existing?.commentaire || existing?.lastComment || "",
responseDelayHours: existing?.responseDelayHours ?? null,
updatedAt: new Date().toISOString(),
...nextPatch,
};

merged.statut = merged.status || merged.statut || "a_creer";
merged.dateEnvoi = merged.contactedAt || merged.dateEnvoi || "";
merged.dateReponse = merged.respondedAt || merged.dateReponse || "";
merged.prochaineRelance =
merged.nextFollowUpAt || merged.prochaineRelance || "";
merged.motifRefus = merged.refusalReason || merged.motifRefus || "";
merged.motifAnnulation =
merged.cancellationReason || merged.motifAnnulation || "";
merged.commentaire = merged.lastComment || merged.commentaire || "";

merged.responseDelayHours = computeResponseDelayHours(
merged.contactedAt,
merged.respondedAt
);

const nextFollowUp = existing
? current.map((item) =>
String(item.resourceId) === String(resourceId) ? merged : item
)
: [merged, ...current];

return {
...patient,
resourceFollowUp: nextFollowUp,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const updateResourceFollowUp = useCallback(
(patientId, resourceId, patch) => {
upsertResourceFollowUp(patientId, resourceId, patch);
},
[upsertResourceFollowUp]
);

const addResourceFollowUpEvent = useCallback(
(patientId, resourceId, comment) => {
if (!comment) return;

upsertResourceFollowUp(patientId, resourceId, (existing) => ({
...existing,
lastComment: comment,
commentaire: comment,
}));
},
[upsertResourceFollowUp]
);

const scheduleResourceReminder = useCallback(
(patientId, resourceId, nextDate) => {
upsertResourceFollowUp(patientId, resourceId, {
nextFollowUpAt: nextDate || "",
prochaineRelance: nextDate || "",
});
},
[upsertResourceFollowUp]
);

const markResourceRequestSent = useCallback(
(patientId, resourceId) => {
upsertResourceFollowUp(patientId, resourceId, {
status: "envoye",
statut: "envoye",
contactedAt: new Date().toISOString(),
dateEnvoi: new Date().toISOString(),
});
},
[upsertResourceFollowUp]
);

const markResourceResponseReceived = useCallback(
(patientId, resourceId, comment = "") => {
upsertResourceFollowUp(patientId, resourceId, {
status: "accepte",
statut: "accepte",
respondedAt: new Date().toISOString(),
dateReponse: new Date().toISOString(),
lastComment: comment,
commentaire: comment,
});
},
[upsertResourceFollowUp]
);

const markResourceRefused = useCallback(
(patientId, resourceId, reason = "") => {
upsertResourceFollowUp(patientId, resourceId, {
status: "refuse",
statut: "refuse",
respondedAt: new Date().toISOString(),
dateReponse: new Date().toISOString(),
refusalReason: reason || "Refus",
motifRefus: reason || "Refus",
lastComment: reason || "Refus",
commentaire: reason || "Refus",
});
},
[upsertResourceFollowUp]
);

const addNeed = useCallback((patientId, label) => {
if (!label || !String(label).trim()) return;

setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextItem = {
id: `need_${Date.now()}`,
label: String(label).trim(),
statut: "actif",
source: "terrain",
createdAt: new Date().toISOString(),
updatedAt: "",
};

return {
...patient,
dynamicNeeds: [...safeArray(patient.dynamicNeeds), nextItem],
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const removeNeed = useCallback((patientId, needId) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
dynamicNeeds: safeArray(patient.dynamicNeeds).filter(
(item) => String(item.id) !== String(needId)
),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const removeCategory = useCallback((patientId, categoryId) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
dynamicCategories: safeArray(patient.dynamicCategories).filter(
(item) => String(item.id) !== String(categoryId)
),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addBlockage = useCallback((patientId, label) => {
if (!label || !String(label).trim()) return;

setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextItem = {
id: `bloc_${Date.now()}`,
label: String(label).trim(),
source: "terrain",
createdAt: new Date().toISOString(),
updatedAt: "",
};

return {
...patient,
dynamicBlockages: [...safeArray(patient.dynamicBlockages), nextItem],
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const removeBlockage = useCallback((patientId, blockageId) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
dynamicBlockages: safeArray(patient.dynamicBlockages).filter(
(item) => String(item.id) !== String(blockageId)
),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addSpiritNote = useCallback((patientId, note) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

const nextNote = {
id: note?.id || `spirit_${Date.now()}`,
text: note?.text || "",
author: note?.author || "Agent",
date: note?.date || new Date().toISOString(),
isRead: note?.isRead ?? false,
level: note?.level || "normal",
nature: note?.nature || note?.level || "info",
notify: safeArray(note?.notify),
replies: safeArray(note?.replies),
};

return {
...patient,
spiritNotes: [nextNote, ...safeArray(patient.spiritNotes)],
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const replyToSpiritNote = useCallback((patientId, noteId, reply) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
spiritNotes: safeArray(patient.spiritNotes).map((note) => {
if (String(note.id) !== String(noteId)) return note;

const nextReply = {
id: reply?.id || `reply_${Date.now()}`,
text: reply?.text || "",
author: reply?.author || "Agent",
date: reply?.date || new Date().toISOString(),
nature: reply?.nature || "info",
};

return {
...note,
replies: [nextReply, ...safeArray(note.replies)],
isRead: false,
};
}),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const markSpiritNotesRead = useCallback((patientId) => {
setPatientsState((prev) =>
prev.map((patient) => {
if (String(patient.id) !== String(patientId)) return patient;

return {
...patient,
spiritNotes: safeArray(patient.spiritNotes).map((note) => ({
...note,
isRead: true,
})),
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const addTerrainResource = useCallback((resource) => {
const nextResource = {
id: resource?.id || `terrain_${Date.now()}`,
label: resource?.label || "Solution terrain",
type: resource?.type || "Autre",
territory: safeArray(resource?.territory),
categories: safeArray(resource?.categories),
keywords: safeArray(resource?.keywords),
contact: resource?.contact || {},
platform: resource?.platform || null,
note: resource?.note || "",
source: resource?.source || "terrain",
createdAt: resource?.createdAt || new Date().toISOString(),
};

setResourcesState((prev) => [nextResource, ...safeArray(prev)]);
return nextResource.id;
}, []);

const updateTerrainResource = useCallback((resourceId, patch) => {
setResourcesState((prev) =>
safeArray(prev).map((resource) => {
if (String(resource.id) !== String(resourceId)) return resource;

const nextPatch =
typeof patch === "function" ? patch(resource) : patch || {};

return {
...resource,
...nextPatch,
updatedAt: new Date().toISOString(),
};
})
);
}, []);

const resetResourcesToDefault = useCallback(() => {
setResourcesState(resourcesCotentin);
}, []);

const value = useMemo(
() => ({
patients: patientsState,
patientsSimulated: patientsState,
resources: resourcesState,
setResources: setResourcesState,

incidents: incidentsState,
createIncidentForPatient,
addIncidentAction,
updateIncidentWorkflow,
setIncidentStep,
updateIncidentStatus,
closeIncidentForPatient,
getIncidentsByPatientId,
getActiveIncidentByPatientId,

getPatientById,
addSimulatedPatient,
updatePatient,
updateStructuredIntake,
recomputeDerivedData,
toggleManualVulnerabilityProfile,
deletePatient,
clearAllPatients,

addActionsToPatient,
updateAction,
addActionComment,
scheduleActionReminder,

addHDJToPatient,

upsertResourceFollowUp,
updateResourceFollowUp,
addResourceFollowUpEvent,
scheduleResourceReminder,
markResourceRequestSent,
markResourceResponseReceived,
markResourceRefused,

addSpiritNote,
replyToSpiritNote,
markSpiritNotesRead,
addNeed,
removeNeed,
addCategory,
removeCategory,
addBlockage,
removeBlockage,
addTerrainResource,
updateTerrainResource,
resetResourcesToDefault,
}),
[
patientsState,
resourcesState,
incidentsState,
createIncidentForPatient,
addIncidentAction,
updateIncidentWorkflow,
setIncidentStep,
updateIncidentStatus,
closeIncidentForPatient,
getIncidentsByPatientId,
getActiveIncidentByPatientId,
getPatientById,
addSimulatedPatient,
updatePatient,
updateStructuredIntake,
recomputeDerivedData,
toggleManualVulnerabilityProfile,
deletePatient,
clearAllPatients,
addActionsToPatient,
updateAction,
addActionComment,
scheduleActionReminder,
addHDJToPatient,
upsertResourceFollowUp,
updateResourceFollowUp,
addResourceFollowUpEvent,
scheduleResourceReminder,
markResourceRequestSent,
markResourceResponseReceived,
markResourceRefused,
addSpiritNote,
replyToSpiritNote,
markSpiritNotesRead,
addNeed,
removeNeed,
addCategory,
removeCategory,
addBlockage,
removeBlockage,
addTerrainResource,
updateTerrainResource,
resetResourcesToDefault,
]
);

return (
<PatientSimulationContext.Provider value={value}>
{children}
</PatientSimulationContext.Provider>
);
}

export function usePatientSimulation() {
const context = useContext(PatientSimulationContext);

if (!context) {
throw new Error(
"usePatientSimulation must be used within a PatientSimulationProvider"
);
}

return context;
}
