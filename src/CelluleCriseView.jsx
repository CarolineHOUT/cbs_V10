import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { patients as staticPatients } from "./data/patients";
import { usePatientSimulation } from "./context/PatientSimulationContext";
import "./CelluleCriseView.css";

const STORAGE_KEY = "carabbas_crise_v5";
const HISTORY_KEY = "carabbas_crise_v5_history";
const ORIGIN_KEY = "carabbas_crise_origin_v1";
const COPILOT_ACTIONS_PREFIX = "carabbas_staff_to_copilot_actions_";

const STAFF_DIRECTORY = [
  {
    id: "med1",
    name: "Dr Abbas",
    email: "ch.carabas@gmail.com",
    role: "Médecin",
    service: "Médecine polyvalente",
    keywords: ["medecin", "sortie", "polyvalente"],
  },
  {
    id: "med2",
    name: "Dr Leclerc",
    email: "ch.carabas@gmail.com",
    role: "Médecin",
    service: "Gériatrie",
    keywords: ["medecin", "geriatrie", "grand age"],
  },
  {
    id: "med3",
    name: "Dr Simon",
    email: "ch.carabas@gmail.com",
    role: "Médecin",
    service: "Chirurgie",
    keywords: ["medecin", "chirurgie"],
  },
  {
    id: "ide1",
    name: "IDE Bernard",
    email: "ch.carabas@gmail.com",
    role: "IDE",
    service: "Médecine polyvalente",
    keywords: ["ide", "soins", "polyvalente"],
  },
  {
    id: "ide2",
    name: "IDE Leroy",
    email: "ch.carabas@gmail.com",
    role: "IDE",
    service: "Gériatrie",
    keywords: ["ide", "geriatrie"],
  },
  {
    id: "cad1",
    name: "Cadre Dupont",
    email: "ch.carabas@gmail.com",
    role: "Cadre",
    service: "Médecine polyvalente",
    keywords: ["cadre", "organisation"],
  },
  {
    id: "soc1",
    name: "Mme Garnier",
    email: "ch.carabas@gmail.com",
    role: "Assistante sociale",
    service: "Équipe sociale",
    keywords: ["social", "logement", "dac", "droits"],
  },
  {
    id: "dac1",
    name: "DAC Cotentin",
    email: "ch.carabas@gmail.com",
    role: "DAC",
    service: "Territoire",
    keywords: ["dac", "coordination"],
  },
  {
    id: "hdj1",
    name: "Secrétariat HDJ",
    email: "ch.carabas@gmail.com",
    role: "Secrétariat",
    service: "HDJ",
    keywords: ["hdj", "secretariat"],
  },
];

function safe(value, fallback = "Non renseigné") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function safeArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

function formatShortDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

function getLengthOfStay(patient) {
  const entry = patient?.dateEntree || patient?.admissionDate || patient?.entryDate;
  if (!entry) return 0;
  const start = new Date(entry);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getAvoidableDays(patient) {
  const value =
    patient?.dateSortantMedicalement ||
    patient?.medicalReadyDate ||
    patient?.sortantMedicalementDate;

  if (!value) return 0;

  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date();
  const diff = today.getTime() - start.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getTargetDate(patient) {
  return (
    patient?.dateSortiePrevue ||
    patient?.dischargePlanning?.targetDateValidated ||
    patient?.dischargePlanning?.targetDateEnvisaged ||
    ""
  );
}

function getSolutionLabel(patient) {
  return (
    patient?.dischargePlanning?.solutionLabel ||
    patient?.solutionLabel ||
    patient?.orientation ||
    "Aucune"
  );
}

function getBlockageLabel(patient) {
  return (
    patient?.blockReason ||
    patient?.blocage ||
    patient?.derivedFreins?.[0]?.label ||
    patient?.copilotSummary?.block ||
    "Non défini"
  );
}

function isMedicalReady(patient) {
  return Boolean(patient?.dateSortantMedicalement);
}

function isVulnerable(patient) {
  return (
    safeArray(patient?.vulnerability?.criteria).length > 0 ||
    safeArray(patient?.vulnerabilityProfiles).length > 0 ||
    Boolean(patient?.isVulnerable)
  );
}

function isWithoutSolution(patient) {
  const solution = normalize(getSolutionLabel(patient));
  return (
    !solution ||
    solution === "aucune" ||
    solution === "non definie" ||
    solution.includes("non defini")
  );
}

function isHDJPatient(patient) {
const service = String(
patient?.service ||
patient?.serviceCode ||
patient?.unit ||
""
).toLowerCase();

return service.includes("hdj");
}

function isBlocked(patient) {
const block = getBlockageLabel(patient);
return Boolean(block && block !== "Non défini");
}

function isBlockedNoSolutionDms7(patient) {
if (isHDJPatient(patient)) return false;

return (
isBlocked(patient) &&
isWithoutSolution(patient) &&
getLengthOfStay(patient) >= 7
);
}


function getCrisisTriggerPatients(patients = []) {
  return safeArray(patients).filter(isBlockedNoSolutionDms7);
}

function getCrisisAlertLevel(patients = []) {
  const triggerPatients = getCrisisTriggerPatients(patients);
  const count = triggerPatients.length;

  if (count >= 6) {
    return {
      level: "red",
      label: "Cellule de crise recommandée",
      message: `${count} patients bloqués sans solution avec DMS ≥ 7 jours.`,
      count,
      patients: triggerPatients,
    };
  }

  if (count >= 3) {
    return {
      level: "amber",
      label: "Pré-alerte capacitaire",
      message: `${count} patients bloqués sans solution avec DMS ≥ 7 jours.`,
      count,
      patients: triggerPatients,
    };
  }

  return {
    level: "green",
    label: "Pas d’alerte crise",
    message: "Aucun seuil critique atteint.",
    count,
    patients: triggerPatients,
  };
}

function getPriority(patient) {
  let score = 0;

  const los = getLengthOfStay(patient);
  const hasBlockage = isBlocked(patient);
  const noSolution = isWithoutSolution(patient);
  const noTargetDate = !getTargetDate(patient);
  const medicalReady = isMedicalReady(patient);
  const vulnerable = isVulnerable(patient);
  const blockedNoSolutionDms7 = isBlockedNoSolutionDms7(patient);

  if (medicalReady && noSolution) score += 4;
  if (hasBlockage) score += 3;
  if (blockedNoSolutionDms7) score += 5;

  if (los >= 30) score += 3;
  else if (los >= 15) score += 2;
  else if (los >= 7) score += 1;

  if (noTargetDate) score += 1;
  if (vulnerable) score += 1;

  if (score >= 8) return { score, label: "Critique", color: "red" };
  if (score >= 5) return { score, label: "À arbitrer", color: "amber" };
  if (score >= 3) return { score, label: "À suivre", color: "blue" };

  return { score, label: "Simple suivi", color: "green" };
}

function getIdentityVigilance(patient) {
  const checks = [
    Boolean(patient?.nom && patient?.prenom),
    Boolean(patient?.dateNaissance),
    Boolean(patient?.ins),
    Boolean(patient?.iep),
  ];

  const score = checks.filter(Boolean).length;

  if (score === 4) return { label: "OK", color: "green" };
  if (score >= 2) return { label: "À vérifier", color: "amber" };
  return { label: "Incomplète", color: "red" };
}

function getPatientKeywords(patient) {
  const tags = [];
  const block = normalize(getBlockageLabel(patient));
  const solution = normalize(getSolutionLabel(patient));

  if (isMedicalReady(patient)) tags.push("sort med");
  if (!getTargetDate(patient)) tags.push("sans date cible");
  if (isWithoutSolution(patient)) tags.push("sans solution");
  if (isVulnerable(patient)) tags.push("vulnérable");
  if (isBlockedNoSolutionDms7(patient)) tags.push("blocage J7");

  if (block.includes("logement")) tags.push("logement");
  if (block.includes("dac")) tags.push("dac");
  if (block.includes("ase")) tags.push("ase");
  if (block.includes("social")) tags.push("social");
  if (block.includes("famille")) tags.push("famille");
  if (block.includes("protection")) tags.push("protection");

  if (solution.includes("smr")) tags.push("smr");
  if (solution.includes("ehpad")) tags.push("ehpad");
  if (solution.includes("hdj")) tags.push("hdj");
  if (solution.includes("domicile")) tags.push("domicile");

  safeArray(patient?.vulnerability?.criteria).forEach((item) => tags.push(String(item)));

  return uniq(tags).slice(0, 8);
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearJson(key) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function searchDirectory(query) {
  const q = normalize(query);
  if (!q) return STAFF_DIRECTORY;

  return STAFF_DIRECTORY.filter((staff) => {
    const hay = normalize(
      [staff.name, staff.email, staff.role, staff.service, ...(staff.keywords || [])].join(" ")
    );
    return hay.includes(q);
  });
}

function collectAutoParticipants(selectedPatients) {
  const services = uniq(selectedPatients.map((p) => p?.service));

  return STAFF_DIRECTORY.filter((staff) => {
    const staffService = normalize(staff.service);

    return (
      services.some((service) => normalize(service) === staffService) ||
      staffService === "equipe sociale" ||
      staffService === "territoire" ||
      staffService === "hdj"
    );
  }).map((staff) => ({
    ...staff,
    selected: true,
    confirmed: false,
    addedManually: false,
    source: "auto",
  }));
}

function buildConvocation({ crisis, selectedPatients, participants }) {
  const selectedParticipants = participants.filter((p) => p.selected);

  return [
    `Cellule de crise – ${crisis.title || "Sorties complexes"}`,
    "",
    `Date : ${crisis.scheduledDate ? formatShortDate(crisis.scheduledDate) : "À définir"}`,
    `Heure : ${crisis.scheduledTime || "À définir"}`,
    `Durée : ${crisis.duration || "À définir"}`,
    `Lieu : ${crisis.location || "À définir"}`,
    `Animateur : ${crisis.facilitator || "À définir"}`,
    `Objectif : ${crisis.objective || "À définir"}`,
    "",
    `Patients : ${selectedPatients.length}`,
    `Intervenants : ${selectedParticipants.length}`,
    "",
    "Intervenants :",
    ...(selectedParticipants.length
      ? selectedParticipants.map(
          (p) => `- ${p.name} · ${p.role} · ${p.service} · ${p.email || "email absent"}`
        )
      : ["- Aucun intervenant sélectionné"]),
    "",
    "Patients concernés :",
    ...(selectedPatients.length
      ? selectedPatients.map((patient) => {
          const tags = getPatientKeywords(patient).join(", ");
          return `- ${safe(patient.nom, "Nom")} ${safe(patient.prenom, "")} · ${safe(
            patient.service,
            "Service"
          )} · J+${getLengthOfStay(patient)} · ${getBlockageLabel(patient)}${
            tags ? ` · ${tags}` : ""
          }`;
        })
      : ["- Aucun patient sélectionné"]),
  ].join("\n");
}

function Badge({ color = "neutral", children }) {
  return <span className={`cc-badge ${color}`}>{children}</span>;
}

function SectionCard({ title, subtitle, actions, children, hero = false }) {
  return (
    <section className={`cc-card ${hero ? "cc-card--hero" : ""}`}>
      <div className="cc-card__head">
        <div>
          {title ? <h2 className="cc-card__title">{title}</h2> : null}
          {subtitle ? <p className="cc-card__subtitle">{subtitle}</p> : null}
        </div>

        {actions ? <div className="cc-card__actions">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}

function DecisionModal({ open, onClose, selectedPatients, draft, setDraft, onSave }) {
  if (!open) return null;

  return (
    <div className="cc-modal-backdrop" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cc-modal__head">
          <h3>Ajouter une décision</h3>
          <button type="button" className="cc-link-btn" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="cc-form-grid">
          <label className="cc-field cc-field--full">
            <span>Patient concerné</span>
            <select
              className="cc-input"
              value={draft.patientId}
              onChange={(e) => setDraft((p) => ({ ...p, patientId: e.target.value }))}
            >
              <option value="">Global cellule</option>
              {selectedPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {safe(patient.nom)} {safe(patient.prenom, "")}
                </option>
              ))}
            </select>
          </label>

          <label className="cc-field cc-field--full">
            <span>Décision</span>
            <textarea
              className="cc-textarea cc-textarea--sm"
              value={draft.text}
              onChange={(e) => setDraft((p) => ({ ...p, text: e.target.value }))}
            />
          </label>

          <label className="cc-field">
            <span>Porteur</span>
            <input
              className="cc-input"
              value={draft.owner}
              onChange={(e) => setDraft((p) => ({ ...p, owner: e.target.value }))}
            />
          </label>

          <label className="cc-field">
            <span>Échéance</span>
            <input
              type="date"
              className="cc-input"
              value={draft.dueDate}
              onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))}
            />
          </label>

          <label className="cc-field">
            <span>Destination</span>
            <select
              className="cc-input"
              value={draft.destination}
              onChange={(e) => setDraft((p) => ({ ...p, destination: e.target.value }))}
            >
              <option>Copilote</option>
              <option>Staff</option>
              <option>Fiche patient</option>
              <option>Cellule uniquement</option>
            </select>
          </label>

          <label className="cc-field">
            <span>Statut</span>
            <select
              className="cc-input"
              value={draft.status}
              onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
            >
              <option>À dispatcher</option>
              <option>Envoyée</option>
              <option>En cours</option>
              <option>Réalisée</option>
              <option>Bloquée</option>
            </select>
          </label>
        </div>

        <div className="cc-modal__actions">
          <button type="button" className="cc-btn ghost" onClick={onClose}>
            Annuler
          </button>

          <button type="button" className="cc-btn primary" onClick={onSave}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientCard({ patient, selected, onToggle, navigate, openPatientId, setOpenPatientId }) {
  const priority = getPriority(patient);
  const isOpen = openPatientId === patient.id;
  const avoidableDays = getAvoidableDays(patient);

  return (
    <div className={`cc-patient-row ${selected ? "is-selected" : ""}`}>
      <div
        className="cc-patient-row__main"
        onClick={() => setOpenPatientId(isOpen ? null : patient.id)}
      >
        <div className="cc-patient-row__cell cc-patient-row__cell--check">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(patient.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="cc-patient-row__cell cc-patient-row__cell--name">
          {safe(patient.nom)} {safe(patient.prenom, "")}
        </div>

        <div className="cc-patient-row__cell">{safe(patient.service, "—")}</div>
        <div className="cc-patient-row__cell">{safe(patient.chambre, "—")}</div>
        <div className="cc-patient-row__cell">{safe(patient.lit, "—")}</div>

        <div className="cc-patient-row__cell">
          J+{getLengthOfStay(patient)}
          {isMedicalReady(patient) ? (
            <div className="cc-small cc-avoidable-inline">{avoidableDays} j évitable</div>
          ) : null}
        </div>

        <div className="cc-patient-row__cell">
          <Badge color={priority.color}>
            {priority.label} · score {priority.score}
          </Badge>
        </div>

        <div className="cc-patient-row__cell cc-patient-row__cell--block">
          {getBlockageLabel(patient)}
        </div>
      </div>

      {isOpen && (
        <div className="cc-patient-row__details compact">
          <div>
            <strong>Né(e) le</strong> {safe(patient.dateNaissance, "—")}
          </div>
          <div>
            <strong>IEP</strong> {safe(patient.iep, "—")}
          </div>
          <div>
            <strong>INS</strong> {safe(patient.ins, "—")}
          </div>
          <div>
            <strong>Solution</strong> {getSolutionLabel(patient)}
          </div>
          <div>
            <strong>Date cible</strong> {getTargetDate(patient) ? formatShortDate(getTargetDate(patient)) : "—"}
          </div>

          <div className="cc-patient-row__details-actions">
            <button type="button" className="cc-link-btn" onClick={() => navigate(`/patient/${patient.id}`)}>
              Fiche
            </button>
            <button type="button" className="cc-link-btn" onClick={() => navigate(`/patient/${patient.id}?tab=staff`)}>
              Staff
            </button>
            <button type="button" className="cc-link-btn" onClick={() => navigate(`/copilote/${patient.id}`)}>
              Copilote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function CelluleCriseView() {
const navigate = useNavigate();
const { patientsSimulated = [] } = usePatientSimulation() || {};

const allPatients = useMemo(() => {
return safeArray(patientsSimulated).filter((patient) => patient?.id);
}, [patientsSimulated]);
const [activeTab, setActiveTab] = useState("patients");

const [crisis, setCrisis] = useState({
title: "Cellule de crise – Sorties complexes",
status: "Brouillon",
meetingStatus: "non_planifiée",
scheduledDate: "",
scheduledTime: "",
duration: "30 min",
location: "Salle de staff",
facilitator: "",
objective: "Arbitrer les situations complexes et sorties bloquées",
selectedPatientIds: [],
calendarEventId: "",
gmailMessageId: "",
gmailDraftId: "",
});

const [filters, setFilters] = useState({
service: "",
patientId: "",
onlyCritical: false,
withoutSolution: false,
longStay: false,
vulnerable: false,
search: "",
});

const [participants, setParticipants] = useState([]);
const [openPatientId, setOpenPatientId] = useState(null);
const [staffSearch, setStaffSearch] = useState("");
const [history, setHistory] = useState([]);
const [versions, setVersions] = useState([]);
const [decisions, setDecisions] = useState([]);
const [showDecisionModal, setShowDecisionModal] = useState(false);
const [agendaMailLoading, setAgendaMailLoading] = useState(false);

const [decisionDraft, setDecisionDraft] = useState({
patientId: "",
text: "",
owner: "",
dueDate: "",
destination: "Copilote",
status: "À dispatcher",
});

useEffect(() => {
const stored = readJson(STORAGE_KEY, null);
const storedHistory = readJson(HISTORY_KEY, []);

if (stored) {
setCrisis((prev) => ({
...prev,
...(stored.crisis || {}),
}));

setParticipants(stored.participants || []);
setDecisions(stored.decisions || []);
setVersions(stored.versions || []);
}

const prefillIds = readJson(
"carabbas_crise_prefill_patient_ids",
[]
);

if (prefillIds.length > 0) {
setCrisis((prev) => ({
...prev,
selectedPatientIds: uniq(prefillIds),
}));

clearJson("carabbas_crise_prefill_patient_ids");
}

setHistory(storedHistory);
}, []);


const selectedPatients = useMemo(
() => allPatients.filter((p) => crisis.selectedPatientIds.includes(p.id)),
[allPatients, crisis.selectedPatientIds]
);

useEffect(() => {
const auto = collectAutoParticipants(selectedPatients);

setParticipants((prev) => {
const manual = prev.filter((p) => p.addedManually);
const map = new Map();

auto.forEach((p) => {
const existing = prev.find((x) => x.id === p.id);

map.set(p.id, {
...p,
selected: existing?.selected ?? true,
confirmed: existing?.confirmed ?? false,
});
});

manual.forEach((p) => map.set(p.id, p));

return Array.from(map.values());
});
}, [selectedPatients]);

useEffect(() => {
writeJson(STORAGE_KEY, { crisis, participants, decisions, versions });
}, [crisis, participants, decisions, versions]);

function addHistory(label) {
const entry = {
id: `hist_${Date.now()}`,
label,
createdAt: new Date().toISOString(),
};

const next = [entry, ...history];
setHistory(next);
writeJson(HISTORY_KEY, next);
}

function createVersion(label, comment) {
const entry = {
id: `ver_${Date.now()}`,
label,
comment,
createdAt: new Date().toISOString(),
snapshot: { crisis, participants, decisions },
};

setVersions((prev) => [entry, ...prev]);
}

const serviceOptions = useMemo(
() =>
uniq(allPatients.map((p) => safe(p.service, "")).filter(Boolean)).sort((a, b) =>
a.localeCompare(b)
),
[allPatients]
);

const filteredPatients = useMemo(() => {
return allPatients
.filter((patient) => {
if (filters.service && safe(patient.service, "") !== filters.service) return false;
if (filters.patientId && String(patient.id) !== String(filters.patientId)) return false;
if (filters.onlyCritical && getPriority(patient).label !== "Critique") return false;
if (filters.withoutSolution && !isWithoutSolution(patient)) return false;
if (filters.longStay && getLengthOfStay(patient) < 7) return false;
if (filters.vulnerable && !isVulnerable(patient)) return false;

if (filters.search) {
const hay = normalize(
[
patient.nom,
patient.prenom,
patient.dateNaissance,
patient.iep,
patient.ins,
patient.service,
patient.chambre,
patient.lit,
getBlockageLabel(patient),
getSolutionLabel(patient),
...getPatientKeywords(patient),
].join(" ")
);

if (!hay.includes(normalize(filters.search))) return false;
}

return true;
})
.sort((a, b) => getPriority(b).score - getPriority(a).score);
}, [allPatients, filters]);

const crisisAlert = useMemo(
() => getCrisisAlertLevel(allPatients),
[allPatients]
);

const preparedPatients = useMemo(
() =>
selectedPatients
.map((patient) => ({
patient,
priority: getPriority(patient),
ident: getIdentityVigilance(patient),
tags: getPatientKeywords(patient),
}))
.sort((a, b) => b.priority.score - a.priority.score),
[selectedPatients]
);

const suggestedStaff = useMemo(
() =>
searchDirectory(staffSearch).filter(
(staff) => !participants.some((p) => p.id === staff.id)
),
[staffSearch, participants]
);

const summary = useMemo(() => {
const critical = selectedPatients.filter(
(p) => getPriority(p).label === "Critique"
).length;

const noSolution = selectedPatients.filter(isWithoutSolution).length;
const noDate = selectedPatients.filter((p) => !getTargetDate(p)).length;
const blockedNoSolutionDms7 =
selectedPatients.filter(isBlockedNoSolutionDms7).length;

const avoidableDays = selectedPatients.reduce(
(sum, patient) => sum + getAvoidableDays(patient),
0
);

const medicalReady = selectedPatients.filter(isMedicalReady).length;

const blockageCounts = {};

selectedPatients.forEach((p) => {
const block = getBlockageLabel(p);
if (block && block !== "Non défini") {
blockageCounts[block] = (blockageCounts[block] || 0) + 1;
}
});

const dominantBlockage =
Object.entries(blockageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
"Aucun blocage dominant";

return {
critical,
noSolution,
noDate,
blockedNoSolutionDms7,
avoidableDays,
medicalReady,
dominantBlockage,
};
}, [selectedPatients]);

const tension = useMemo(() => {
if (summary.blockedNoSolutionDms7 >= 6) return { label: "Critique", color: "red" };
if (summary.critical >= 3) return { label: "Critique", color: "red" };
if (summary.blockedNoSolutionDms7 >= 3) return { label: "Élevée", color: "amber" };
if (summary.critical >= 1 || selectedPatients.length >= 5) {
return { label: "Élevée", color: "amber" };
}
if (selectedPatients.length >= 2) return { label: "Modérée", color: "blue" };
return { label: "Faible", color: "green" };
}, [summary.critical, summary.blockedNoSolutionDms7, selectedPatients.length]);

function togglePatient(patientId) {
setCrisis((prev) => ({
...prev,
selectedPatientIds: prev.selectedPatientIds.includes(patientId)
? prev.selectedPatientIds.filter((id) => id !== patientId)
: [...prev.selectedPatientIds, patientId],
}));

addHistory("Sélection patients mise à jour");
}

function addStaffMember(staff) {
setParticipants((prev) => [
{
...staff,
selected: true,
confirmed: false,
addedManually: true,
source: "manuel",
},
...prev,
]);

setStaffSearch("");
addHistory(`Intervenant ajouté : ${staff.name}`);
}

function toggleParticipant(id, field = "selected") {
setParticipants((prev) =>
prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p))
);

addHistory("Liste intervenants mise à jour");
}

function pushDecisionToCopilot(decision) {
if (!decision.patientId) return;

const key = `${COPILOT_ACTIONS_PREFIX}${decision.patientId}`;
const existing = readJson(key, []);

const next = [
{
id: `crise_${decision.id}`,
label: decision.text,
title: decision.text,
owner: decision.owner,
dueDate: decision.dueDate,
status: "À faire",
source: "cellule_crise",
createdAt: new Date().toISOString(),
},
...existing,
];

writeJson(key, next);
}

function addDecision() {
if (!decisionDraft.text.trim()) return;

const patient = allPatients.find(
(p) => String(p.id) === String(decisionDraft.patientId)
);

const entry = {
id: `dec_${Date.now()}`,
...decisionDraft,
patientLabel: patient
? `${safe(patient.nom)} ${safe(patient.prenom, "")}`
: "Global cellule",
createdAt: new Date().toISOString(),
};

setDecisions((prev) => [entry, ...prev]);

if (entry.destination === "Copilote") pushDecisionToCopilot(entry);

setDecisionDraft({
patientId: "",
text: "",
owner: "",
dueDate: "",
destination: "Copilote",
status: "À dispatcher",
});

setShowDecisionModal(false);
addHistory("Décision de cellule ajoutée");
}

function copyConvocation() {
const text = buildConvocation({ crisis, selectedPatients, participants });

if (navigator?.clipboard?.writeText) {
navigator.clipboard.writeText(text);
} else {
window.prompt("Copier la convocation :", text);
}

addHistory("Convocation copiée");
}

async function notifyCrisisByMail(alertData) {
const patientsConcerned = safeArray(alertData?.patients);

const recipients = [
"direction@hopital.fr",
"cadres@hopital.fr",
"medecins@hopital.fr",
];

const subject = `[CARABBAS] ${alertData.label}`;

const body = [
alertData.message,
"",
"Patients concernés :",
...patientsConcerned.map(
(patient) =>
`- ${patient.nom} ${patient.prenom} · ${patient.service} · J+${getLengthOfStay(
patient
)} · ${getBlockageLabel(patient)} · Solution : ${getSolutionLabel(patient)}`
),
"",
"Action proposée : préparation d’une cellule de crise capacitaire.",
].join("\n");

try {
const response = await fetch("http://localhost:3001/api/crisis/notify-alert", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
to: recipients,
subject,
body,
alert: alertData,
}),
});

if (!response.ok) {
throw new Error("Erreur notification mail");
}

alert("Notification envoyée.");
addHistory("Alerte crise notifiée par mail");
} catch (error) {
console.error(error);

if (navigator?.clipboard?.writeText) {
navigator.clipboard.writeText(
`À: ${recipients.join(", ")}\nObjet: ${subject}\n\n${body}`
);
}

alert("Mail non envoyé automatiquement. Le contenu a été copié.");
}
}

async function createRealAgendaAndMail() {
if (!crisis.scheduledDate || !crisis.scheduledTime) {
alert("Renseigne une date et une heure avant de créer l’événement.");
return;
}

const selectedParticipants = participants.filter((p) => p.selected);
const missingEmails = selectedParticipants.filter((p) => !p.email);

if (selectedParticipants.length === 0) {
alert("Sélectionne au moins un intervenant.");
return;
}

if (missingEmails.length > 0) {
alert(
`Certains intervenants n’ont pas d’email : ${missingEmails
.map((p) => p.name)
.join(", ")}`
);
return;
}

setAgendaMailLoading(true);

try {
const response = await fetch("http://localhost:3001/api/crisis/create-meeting", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
crisis,
selectedPatients,
participants: selectedParticipants,
convocationText: buildConvocation({
crisis,
selectedPatients,
participants: selectedParticipants,
}),
}),
});

if (!response.ok) {
throw new Error("Erreur API");
}

const result = await response.json();

setCrisis((prev) => ({
...prev,
status: "Planifiée",
meetingStatus: "agenda_mail_envoyes",
calendarEventId: result.calendarEventId || "",
gmailMessageId: result.gmailMessageId || "",
gmailDraftId: result.gmailDraftId || "",
validatedAt: new Date().toISOString(),
}));

createVersion(
"Réunion créée",
"Événement agenda créé et convocation Gmail envoyée."
);

addHistory("Réunion Agenda créée et convocation Gmail envoyée.");
alert("Réunion créée et convocation envoyée.");
} catch (error) {
console.error(error);
alert("Impossible de créer la réunion Agenda / Gmail.");
addHistory("Erreur création Agenda / Gmail");
} finally {
setAgendaMailLoading(false);
}
}

function printPreparation() {
window.print();
addHistory("Synthèse imprimée");
}

function validateAndReturn() {
const now = new Date().toISOString();

const nextCrisis = {
...crisis,
status: "Planifiée",
validatedAt: now,
};

setCrisis(nextCrisis);
writeJson(STORAGE_KEY, { crisis: nextCrisis, participants, decisions, versions });
addHistory("Cellule validée");

const origin = readJson(ORIGIN_KEY, null);

if (origin?.returnTo) {
clearJson(ORIGIN_KEY);
navigate(origin.returnTo);
return;
}

navigate("/dashboard");
}

const menuWithBadges = [
{ id: "patients", label: "Patients", badge: String(filteredPatients.length) },
{ id: "synthese", label: "Synthèse", badge: String(selectedPatients.length) },
{ id: "decisions", label: "Décisions", badge: String(decisions.length) },
{
id: "intervenants",
label: "Intervenants",
badge: String(participants.filter((p) => p.selected).length),
},
{
id: "organisation",
label: "Organisation",
badge: crisis.scheduledDate ? formatShortDate(crisis.scheduledDate) : "",
},
{ id: "historique", label: "Historique", badge: String(history.length) },
];

return (
<AppShell header={<AppHeader />}>
<div className="cc-page">
<div className="cc-layout">
<aside className="cc-sidebar">
<div className="cc-sidebar__title">Cellule de crise</div>

{menuWithBadges.map((item) => (
<button
key={item.id}
type="button"
className={`cc-sidebar-item ${activeTab === item.id ? "active" : ""}`}
onClick={() => setActiveTab(item.id)}
>
<span className="cc-sidebar-item__label">{item.label}</span>
{item.badge ? (
<span className="cc-sidebar-item__badge">{item.badge}</span>
) : null}
</button>
))}
</aside>

<main className="cc-main">

{crisisAlert.level !== "green" ? (
<div
style={{
display: "grid",
gridTemplateColumns: "1fr auto",
gap: 14,
alignItems: "center",
padding: "14px 16px",
marginBottom: 16,
borderRadius: 18,
background: "#fff7f7",
border: "1px solid #fecaca",
boxShadow: "0 8px 20px rgba(15,23,42,.06)",
}}
>
<div style={{ display: "grid", gap: 4 }}>
<div
style={{
display: "flex",
gap: 8,
alignItems: "center",
flexWrap: "wrap",
}}
>
<span
style={{
background: "#dc2626",
color: "#fff",
fontSize: 11,
fontWeight: 900,
padding: "4px 8px",
borderRadius: 999,
}}
>
CRISE
</span>

<strong style={{ color: "#17376a", fontSize: 16 }}>
Cellule de crise recommandée
</strong>
</div>

<div style={{ color: "#475569", fontSize: 13 }}>
{crisisAlert.count} patient(s) avec blocage, sans solution et DMS ≥ J+7.
</div>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button
type="button"
className="cc-btn primary"
onClick={() => {
setCrisis((prev) => ({
...prev,
selectedPatientIds: uniq([
...prev.selectedPatientIds,
...crisisAlert.patients.map((p) => p.id),
]),
}));
setActiveTab("synthese");
}}
>
Préparer
</button>

<button
type="button"
className="cc-btn ghost"
onClick={() => notifyCrisisByMail(crisisAlert)}
>
Notifier
</button>
</div>
</div>
) : null}


<SectionCard
actions={
<div className="cc-hero-actions">
<div className="cc-hero-status">
<Badge
color={
crisis.status === "Clôturée"
? "green"
: crisis.status === "Planifiée"
? "blue"
: "neutral"
}
>
{crisis.status}
</Badge>

<Badge color={tension.color}>Tension {tension.label}</Badge>
</div>

<div className="cc-hero-buttons">
<button type="button" className="cc-btn ghost" onClick={copyConvocation}>
Copier convocation
</button>

<button type="button" className="cc-btn ghost" onClick={printPreparation}>
Imprimer
</button>

<button
type="button"
className="cc-btn primary"
onClick={createRealAgendaAndMail}
disabled={agendaMailLoading}
>
{agendaMailLoading ? "Création..." : "Envoyer"}
</button>

<button
type="button"
className="cc-btn ghost"
onClick={() => {
createVersion("Sauvegarde manuelle", "Version enregistrée manuellement");
addHistory("Version créée");
}}
>
Créer version
</button>

<button type="button" className="cc-btn primary" onClick={validateAndReturn}>
✓ Valider
</button>
</div>
</div>
}
>
<div className="cc-kpis">
<div className="cc-kpi">
<span>Patients</span>
<strong>{selectedPatients.length}</strong>
</div>

<div className="cc-kpi">
<span>Intervenants</span>
<strong>{participants.filter((p) => p.selected).length}</strong>
</div>

<div className="cc-kpi">
<span>Critiques</span>
<strong>{summary.critical}</strong>
</div>

<div className="cc-kpi">
<span>Sans solution</span>
<strong>{summary.noSolution}</strong>
</div>

<div className="cc-kpi">
<span>Blocage J7 sans solution</span>
<strong>{summary.blockedNoSolutionDms7}</strong>
</div>

<div className="cc-kpi">
<span>Sortants médicaux</span>
<strong>{summary.medicalReady}</strong>
</div>

<div className="cc-kpi">
<span>Jours évitables</span>
<strong>{summary.avoidableDays} j</strong>
</div>

<div className="cc-kpi">
<span>Sans date</span>
<strong>{summary.noDate}</strong>
</div>

<div className="cc-kpi">
<span>Blocage dominant</span>
<strong>{summary.dominantBlockage}</strong>
</div>
</div>
</SectionCard>

{activeTab === "synthese" ? (
<SectionCard title="Synthèse préparatoire" subtitle="Lecture rapide avant arbitrage.">
{selectedPatients.length === 0 && (
<div className="cc-empty">
👉 Sélectionnez des patients dans l’onglet "Patients" pour préparer la cellule de crise.
</div>
)}

<div className="cc-summary-grid">
<div className="cc-summary-box">
<span>Critiques</span>
<strong>{summary.critical}</strong>
</div>

<div className="cc-summary-box">
<span>Sans solution</span>
<strong>{summary.noSolution}</strong>
</div>

<div className="cc-summary-box">
<span>Blocage J7 sans solution</span>
<strong>{summary.blockedNoSolutionDms7}</strong>
</div>

<div className="cc-summary-box">
<span>Jours évitables</span>
<strong>{summary.avoidableDays} j</strong>
</div>

<div className="cc-summary-box">
<span>Blocage dominant</span>
<strong>{summary.dominantBlockage}</strong>
</div>

<div className="cc-summary-box">
<span>Agenda</span>
<strong>{crisis.calendarEventId ? "Créé" : "Non créé"}</strong>
</div>

<div className="cc-summary-box">
<span>Gmail</span>
<strong>{crisis.gmailMessageId ? "Envoyé" : "Non envoyé"}</strong>
</div>
</div>

<div className="cc-patient-table-head">
<div></div>
<div>Patient</div>
<div>Service</div>
<div>Chambre</div>
<div>Lit</div>
<div>Séjour</div>
<div>Niveau de tension</div>
<div>Motif / blocage</div>
</div>

<div className="cc-list">
{preparedPatients.length === 0 ? (
<div className="cc-empty">Aucun patient sélectionné.</div>
) : (
preparedPatients.map(({ patient, priority, ident, tags }) => (
<div key={patient.id} className="cc-prep-card">
<div className="cc-prep-card__head">
<div>
<strong>
{safe(patient.nom)} {safe(patient.prenom, "")}
</strong>
<div className="cc-small">
{safe(patient.service, "Service")} · J+
{getLengthOfStay(patient)}
{isMedicalReady(patient)
? ` · ${getAvoidableDays(patient)} j évitable`
: ""}
</div>
</div>

<Badge color={priority.color}>{priority.label}</Badge>
</div>

<div className="cc-inline-badges">
<Badge color={ident.color}>Identito {ident.label}</Badge>

{isBlockedNoSolutionDms7(patient) ? (
<Badge color="red">Blocage J7 sans solution</Badge>
) : null}

{getTargetDate(patient) ? (
<Badge color="blue">
Date {formatShortDate(getTargetDate(patient))}
</Badge>
) : (
<Badge color="amber">Sans date</Badge>
)}

{isMedicalReady(patient) ? (
<Badge color="red">
Sort med · {getAvoidableDays(patient)} j
</Badge>
) : null}
</div>

<div className="cc-small">
<strong>Blocage :</strong> {getBlockageLabel(patient)}
</div>

<div className="cc-small">
<strong>Solution :</strong> {getSolutionLabel(patient)}
</div>

<div className="cc-small">
<strong>Décision attendue :</strong>{" "}
{getBlockageLabel(patient) !== "Non défini"
? `Arbitrer / lever ${getBlockageLabel(patient)}`
: "Décision à poser"}
</div>

<div className="cc-tags">
{tags.map((tag) => (
<span key={tag} className="cc-tag">
{tag}
</span>
))}
</div>
</div>
))
)}
</div>
</SectionCard>
) : null}

{activeTab === "patients" ? (
<SectionCard title="Patients" subtitle="Filtrage par service, patient et recherche intelligente.">
<div className="cc-filters-bar">
<div className="cc-filter search">
<input
className="cc-input"
placeholder="🔍 Rechercher patient, INS, service..."
value={filters.search}
onChange={(e) =>
setFilters((p) => ({ ...p, search: e.target.value }))
}
/>
</div>

<div className="cc-filter">
<select
className="cc-input"
value={filters.service}
onChange={(e) =>
setFilters((p) => ({ ...p, service: e.target.value }))
}
>
<option value="">Tous services</option>
{serviceOptions.map((s) => (
<option key={s} value={s}>
{s}
</option>
))}
</select>
</div>

<div className="cc-filter">
<select
className="cc-input"
value={filters.patientId}
onChange={(e) =>
setFilters((p) => ({ ...p, patientId: e.target.value }))
}
>
<option value="">Tous patients</option>
{allPatients.map((p) => (
<option key={p.id} value={p.id}>
{p.nom} {p.prenom}
</option>
))}
</select>
</div>

<div className="cc-filter toggles">
<label>
<input
type="checkbox"
checked={filters.onlyCritical}
onChange={() =>
setFilters((p) => ({
...p,
onlyCritical: !p.onlyCritical,
}))
}
/>{" "}
Critiques
</label>

<label>
<input
type="checkbox"
checked={filters.withoutSolution}
onChange={() =>
setFilters((p) => ({
...p,
withoutSolution: !p.withoutSolution,
}))
}
/>{" "}
Sans solution
</label>

<label>
<input
type="checkbox"
checked={filters.longStay}
onChange={() =>
setFilters((p) => ({ ...p, longStay: !p.longStay }))
}
/>{" "}
DMS ≥ 7
</label>

<label>
<input
type="checkbox"
checked={filters.vulnerable}
onChange={() =>
setFilters((p) => ({
...p,
vulnerable: !p.vulnerable,
}))
}
/>{" "}
Vulnérables
</label>
</div>
</div>

<div className="cc-selection-bar">
<div>
<strong>{selectedPatients.length} patient(s) sélectionné(s)</strong>
<span>Choisissez les patients à arbitrer avant de préparer la synthèse.</span>
</div>

<button
type="button"
className="cc-btn primary"
disabled={selectedPatients.length === 0}
onClick={() => {
setActiveTab("synthese");
window.scrollTo({ top: 0, behavior: "smooth" });
}}
>
Préparer la synthèse
</button>
</div>

<div className="cc-list">
{filteredPatients.length === 0 ? (
<div className="cc-empty">Aucun patient trouvé avec ces filtres.</div>
) : (
filteredPatients.map((patient) => (
<PatientCard
key={patient.id}
patient={patient}
selected={crisis.selectedPatientIds.includes(patient.id)}
onToggle={togglePatient}
navigate={navigate}
openPatientId={openPatientId}
setOpenPatientId={setOpenPatientId}
/>
))
)}
</div>
</SectionCard>
) : null}

{activeTab === "intervenants" ? (
<SectionCard title="Intervenants" subtitle="Recherche intelligente et sélection rapide.">
<input
className="cc-input"
placeholder="Rechercher un soignant, rôle, service..."
value={staffSearch}
onChange={(e) => setStaffSearch(e.target.value)}
/>

<div className="cc-search-results">
{suggestedStaff.slice(0, 8).map((staff) => (
<button
key={staff.id}
type="button"
className="cc-staff-option"
onClick={() => addStaffMember(staff)}
>
<strong>{staff.name}</strong>
<span>
{staff.role} · {staff.service} · {staff.email || "email absent"}
</span>
</button>
))}
</div>

<div className="cc-list">
{participants.length === 0 ? (
<div className="cc-empty">Aucun intervenant sélectionné.</div>
) : (
participants.map((participant) => (
<div key={participant.id} className="cc-participant-card">
<div className="cc-prep-card__head">
<div>
<strong>{participant.name}</strong>
<div className="cc-small">
{participant.role} · {safe(participant.service, "—")}
</div>
<div className="cc-small">
{participant.email || "Email non renseigné"}
</div>
</div>

<Badge color={participant.addedManually ? "purple" : "blue"}>
{participant.addedManually ? "Manuel" : "Auto"}
</Badge>
</div>

<div className="cc-card__actions">
<label className="cc-toggle">
<input
type="checkbox"
checked={participant.selected}
onChange={() => toggleParticipant(participant.id, "selected")}
/>
Sélectionné
</label>

<label className="cc-toggle">
<input
type="checkbox"
checked={participant.confirmed}
onChange={() => toggleParticipant(participant.id, "confirmed")}
/>
Confirmé
</label>
</div>
</div>
))
)}
</div>
</SectionCard>
) : null}

{activeTab === "organisation" ? (
<SectionCard title="Organisation" subtitle="Préparer la réunion, la convocation et le pilotage.">
<div className="cc-inline-badges">
<Badge color={crisis.calendarEventId ? "green" : "neutral"}>
Agenda {crisis.calendarEventId ? "créé" : "non créé"}
</Badge>

<Badge color={crisis.gmailMessageId ? "green" : "neutral"}>
Gmail {crisis.gmailMessageId ? "envoyé" : "non envoyé"}
</Badge>
</div>

<div className="cc-form-grid">
<label className="cc-field">
<span>Date</span>
<input
className="cc-input"
type="date"
value={crisis.scheduledDate}
onChange={(e) =>
setCrisis((p) => ({ ...p, scheduledDate: e.target.value }))
}
/>
</label>

<label className="cc-field">
<span>Heure</span>
<input
className="cc-input"
type="time"
value={crisis.scheduledTime}
onChange={(e) =>
setCrisis((p) => ({ ...p, scheduledTime: e.target.value }))
}
/>
</label>

<label className="cc-field">
<span>Durée</span>
<input
className="cc-input"
value={crisis.duration}
onChange={(e) =>
setCrisis((p) => ({ ...p, duration: e.target.value }))
}
/>
</label>

<label className="cc-field">
<span>Lieu</span>
<input
className="cc-input"
value={crisis.location}
onChange={(e) =>
setCrisis((p) => ({ ...p, location: e.target.value }))
}
/>
</label>

<label className="cc-field">
<span>Animateur</span>
<input
className="cc-input"
value={crisis.facilitator}
onChange={(e) =>
setCrisis((p) => ({ ...p, facilitator: e.target.value }))
}
/>
</label>

<label className="cc-field cc-field--full">
<span>Objectif</span>
<input
className="cc-input"
value={crisis.objective}
onChange={(e) =>
setCrisis((p) => ({ ...p, objective: e.target.value }))
}
/>
</label>
</div>

<div className="cc-card__actions">
<button
type="button"
className="cc-btn ghost"
onClick={() => {
setCrisis((p) => ({ ...p, status: "Planifiée" }));
addHistory("Cellule planifiée");
}}
>
Planifier
</button>

<button
type="button"
className="cc-btn primary"
onClick={createRealAgendaAndMail}
disabled={agendaMailLoading}
>
{agendaMailLoading ? "Création..." : "Mail"}
</button>

<button
type="button"
className="cc-btn ghost"
onClick={() => {
setCrisis((p) => ({ ...p, status: "En cours" }));
addHistory("Cellule démarrée");
}}
>
Démarrer
</button>

<button
type="button"
className="cc-btn primary"
onClick={() => {
setCrisis((p) => ({ ...p, status: "Clôturée" }));
addHistory("Cellule clôturée");
}}
>
Clôturer
</button>
</div>
</SectionCard>
) : null}

{activeTab === "decisions" ? (
<SectionCard
title="Décisions"
subtitle="Décisions centralisées et lien avec le copilote."
actions={
<button
type="button"
className="cc-btn primary"
onClick={() => setShowDecisionModal(true)}
>
+ Ajouter décision
</button>
}
>
<div className="cc-list">
{decisions.length === 0 ? (
<div className="cc-empty">Aucune décision.</div>
) : (
decisions.map((decision) => (
<div key={decision.id} className="cc-decision-card">
<div className="cc-prep-card__head">
<strong>{decision.text}</strong>
<Badge
color={
normalize(decision.status).includes("real")
? "green"
: normalize(decision.status).includes("bloq")
? "red"
: "amber"
}
>
{decision.status}
</Badge>
</div>

<div className="cc-small">Patient : {decision.patientLabel}</div>
<div className="cc-small">
Porteur : {safe(decision.owner, "À définir")}
</div>
<div className="cc-small">
Échéance :{" "}
{decision.dueDate ? formatShortDate(decision.dueDate) : "À définir"}
</div>
<div className="cc-small">Destination : {decision.destination}</div>

{decision.patientId ? (
<div className="cc-card__actions">
<button
type="button"
className="cc-link-btn"
onClick={() => navigate(`/copilote/${decision.patientId}`)}
>
Ouvrir Copilote
</button>
</div>
) : null}
</div>
))
)}
</div>
</SectionCard>
) : null}

{activeTab === "historique" ? (
<SectionCard title="Historique" subtitle="Traçabilité et versions.">
<div className="cc-list">
{history.length === 0 ? (
<div className="cc-empty">Aucune activité.</div>
) : (
history.map((item) => (
<div key={item.id} className="cc-log-row">
<div className="cc-small">
<strong>{item.label}</strong>
</div>
<div className="cc-small">
{formatShortDateTime(item.createdAt)}
</div>
</div>
))
)}
</div>

{versions.length > 0 ? (
<div className="cc-version-block">
<div className="cc-card__title-sm">Versions</div>
<div className="cc-list">
{versions.map((version) => (
<div key={version.id} className="cc-log-row">
<div className="cc-small">
<strong>{version.label}</strong>
</div>
<div className="cc-small">
{formatShortDateTime(version.createdAt)}
</div>
</div>
))}
</div>
</div>
) : null}
</SectionCard>
) : null}
</main>
</div>

<DecisionModal
open={showDecisionModal}
onClose={() => setShowDecisionModal(false)}
selectedPatients={selectedPatients}
draft={decisionDraft}
setDraft={setDecisionDraft}
onSave={addDecision}
/>
</div>
</AppShell>
);
}