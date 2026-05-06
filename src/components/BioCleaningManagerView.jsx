import { useEffect, useMemo, useState } from "react";
import { getEstimatedCleaningMinutesFromSettings } from "../domain/bioCleaning/getEstimatedCleaningMinutes";
import "../index.css";
import { WORK_CYCLES } from "../domain/bioCleaning/workCycles";

function safeArray(value) {
return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeText(value) {
return String(value || "").toLowerCase().trim();
}

function formatShortTime(value) {
if (!value) return "—";
const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "—";

return date.toLocaleTimeString("fr-FR", {
hour: "2-digit",
minute: "2-digit",
});
}

function formatDayAndTime(value) {
if (!value) return "—";

const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "—";

const now = new Date();

const sameDay =
date.getFullYear() === now.getFullYear() &&
date.getMonth() === now.getMonth() &&
date.getDate() === now.getDate();

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);

const isTomorrow =
date.getFullYear() === tomorrow.getFullYear() &&
date.getMonth() === tomorrow.getMonth() &&
date.getDate() === tomorrow.getDate();

const timePart = date.toLocaleTimeString("fr-FR", {
hour: "2-digit",
minute: "2-digit",
});

if (sameDay) return `aujourd’hui ${timePart}`;
if (isTomorrow) return `demain ${timePart}`;

const datePart = date.toLocaleDateString("fr-FR", {
day: "2-digit",
month: "2-digit",
});




return `${datePart} ${timePart}`;
}

function toDateTimeLocal(value) {
if (!value) return "";
const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "";

const pad = (n) => String(n).padStart(2, "0");

return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
date.getDate()
)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(value, minutes) {
if (!value) return "";
const date = value instanceof Date ? value : new Date(value);
if (Number.isNaN(date.getTime())) return "";
return new Date(date.getTime() + minutes * 60000).toISOString();
}

function isMedicalReady(patient) {
return Boolean(
patient?.medicalReady ||
patient?.sortantMedical ||
patient?.medicalReadiness?.isMedicallyReady ||
patient?.discharge?.medicallyReady ||
patient?.dischargePlanning?.medicallyReady
);
}

function hasHygienePrecaution(patient) {
return Boolean(
patient?.infectionRisk?.isolation || patient?.infectionRisk?.hygieneRisk
);
}

function toggleItem(value, setter) {
setter((prev) =>
prev.includes(value)
? prev.filter((item) => item !== value)
: [...prev, value]
);
}

function getPlannedExitAt(patient) {
return (
patient?.discharge?.effectiveAt ||
patient?.discharge?.plannedAt ||
patient?.copilotState?.dischargePlannedAt ||
(patient?.copilotState?.dischargePlannedDate &&
patient?.copilotState?.dischargePlannedTime
? `${patient.copilotState.dischargePlannedDate}T${patient.copilotState.dischargePlannedTime}:00`
: "") ||
patient?.dateSortiePrevue ||
patient?.dischargePlanning?.targetDateValidated ||
patient?.dischargePlanning?.targetDateEnvisaged ||
""
);
}

function getTaskPriority(patient) {
if (patient?.infectionRisk?.isolation || patient?.infectionRisk?.hygieneRisk) {
return "high";
}
if (isMedicalReady(patient)) return "high";
return "normal";
}

function getPriorityLabel(priority) {
if (priority === "high") return "Haute priorité";
if (priority === "medium") return "Priorité moyenne";
return "Standard";
}

function getStatusLabel(status) {
if (status === "draft") return "À planifier";
if (status === "planned") return "Planifiée";
if (status === "in_progress") return "En cours";
if (status === "done") return "Terminée";
if (status === "blocked") return "Bloquée";
return "—";
}

function getStatusTone(status) {
if (status === "done") return "green";
if (status === "in_progress") return "blue";
if (status === "planned") return "amber";
if (status === "blocked") return "red";
return "neutral";
}

function getAgentStatusLabel(status) {
if (status === "available") return "Disponible";
if (status === "busy") return "Occupé";
if (status === "pause") return "Pause";
if (status === "absent") return "Absent";
return "—";
}

function getAgentStatusTone(status) {
if (status === "available") return "green";
if (status === "busy") return "amber";
if (status === "pause") return "blue";
if (status === "absent") return "red";
return "neutral";
}

function badgeStyle(kind = "neutral") {
const styles = {
neutral: {
background: "#f8fafc",
color: "#475569",
border: "1px solid #e2e8f0",
},
blue: {
background: "#eef4ff",
color: "#17376a",
border: "1px solid #d6e4ff",
},
amber: {
background: "#fff8e8",
color: "#a16207",
border: "1px solid #f6df9b",
},
red: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
},
green: {
background: "#effaf3",
color: "#166534",
border: "1px solid #cdebd8",
},
purple: {
background: "#f5f3ff",
color: "#6d28d9",
border: "1px solid #ddd6fe",
},
};

return {
minHeight: 24,
padding: "0 8px",
borderRadius: 999,
display: "inline-flex",
alignItems: "center",
fontSize: 11,
fontWeight: 800,
whiteSpace: "nowrap",
...styles[kind],
};
}

function inferSectorFromService(service) {
const label = String(service || "").trim();
const normalized = normalizeText(label);

if (!label) return "Sans secteur";
if (normalized.includes("cardio")) return "Cardiologie";
if (normalized.includes("chir")) return "Chirurgie";
if (normalized.includes("médecine") || normalized.includes("medecine"))
return "Médecine";
if (normalized.includes("neuro")) return "Neurologie";
if (normalized.includes("réanimation") || normalized.includes("reanimation"))
return "Réanimation";
if (normalized.includes("oncologie")) return "Oncologie";
if (normalized.includes("pneumo")) return "Pneumologie";
if (normalized.includes("gériatrie") || normalized.includes("geriatrie"))
return "Gériatrie";

return label;
}

function buildTaskLabel(patient) {
if (patient?.partialDischarge) return "Sortie partielle";
if (patient?.infectionRisk?.isolation || patient?.infectionRisk?.hygieneRisk) {
return "Précaution d’hygiène";
}
return "Sortie chambre";
}

function buildDefaultScenarioOptions(bioCleaningSettings) {
  const configured = safeArray(bioCleaningSettings?.scenarios).map((scenario) => ({
    id: scenario?.id || `scenario_${String(scenario?.label || "").toLowerCase()}`,
    label: scenario?.label || "Situation",
  }));

  const hasDaily = configured.some((s) =>
    normalizeText(s.label).includes("quotidien")
  );

  const dailyScenario = {
    id: "daily_room",
    label: "Nettoyage quotidien",
  };

  if (configured.length > 0) {
    return hasDaily ? configured : [dailyScenario, ...configured];
  }

  return [
    dailyScenario,
    { id: "simple_complete", label: "Sortie chambre simple" },
    { id: "double_complete", label: "Sortie chambre double complète" },
    { id: "double_partial", label: "Sortie partielle chambre double" },
    { id: "precaution_hygiene", label: "Précaution d’hygiène" },
    { id: "vaisselle", label: "Vaisselle" },
    { id: "couloir", label: "Couloir" },
    { id: "chambre_garde", label: "Chambre de garde" },
  ];
}

function selectDefaultScenario(patient, scenarioOptions) {
const normalizedLabels = scenarioOptions.map((item) => ({
...item,
normalized: normalizeText(item.label),
}));

if (patient?.infectionRisk?.isolation || patient?.infectionRisk?.hygieneRisk) {
const hygiene =
normalizedLabels.find((item) => item.normalized.includes("hygiène")) ||
normalizedLabels.find((item) => item.normalized.includes("hygiene")) ||
normalizedLabels.find((item) => item.normalized.includes("précaution")) ||
normalizedLabels.find((item) => item.normalized.includes("precaution"));
if (hygiene) return hygiene.id;
}

if (patient?.partialDischarge) {
const partial = normalizedLabels.find((item) =>
item.normalized.includes("partielle")
);
if (partial) return partial.id;
}

const simple =
normalizedLabels.find((item) => item.normalized.includes("simple")) ||
normalizedLabels.find((item) => item.normalized.includes("sortie chambre"));

return simple?.id || scenarioOptions[0]?.id || "";
}

const pageStyle = {
display: "grid",
gap: 14,
};

const headerCard = {
padding: 14,
display: "grid",
gap: 12,
borderRadius: 18,
background: "#fff",
boxShadow: "0 10px 24px rgba(15,23,42,.06)",
};

const cardStyle = {
background: "#fff",
border: "1px solid #e5ebf4",
borderRadius: 18,
padding: 14,
boxShadow: "0 10px 24px rgba(15,23,42,.06)",
};

const compactPanel = {
background: "#f8fbff",
border: "1px solid #dbe3f1",
borderRadius: 16,
padding: 12,
};

const kpiCardStyle = {
border: "1px solid #e5ebf4",
borderRadius: 16,
padding: 12,
background: "#fff",
display: "grid",
gap: 4,
minHeight: 82,
boxShadow: "0 4px 12px rgba(15,23,42,.04)",
};

const sectionEyebrow = {
fontSize: 11,
fontWeight: 800,
color: "#64748b",
textTransform: "uppercase",
};

const smallButton = {
border: "1px solid #d1d5db",
borderRadius: 12,
padding: "8px 12px",
background: "#fff",
cursor: "pointer",
fontSize: 13,
fontWeight: 700,
};

const primaryButton = {
...smallButton,
background: "#17376a",
color: "#fff",
border: "1px solid #17376a",
};

const ghostButton = {
...smallButton,
background: "#f8fafc",
};

const dangerButton = {
...smallButton,
background: "#fff5f5",
color: "#b42318",
border: "1px solid #f3c7c1",
};

const inputStyle = {
width: "100%",
padding: "9px 10px",
borderRadius: 10,
border: "1px solid #d6deea",
fontSize: 13,
background: "#fff",
boxSizing: "border-box",
};

function LoadBar({ minutes, max = 180 }) {
const ratio = Math.max(0, Math.min(100, (minutes / max) * 100));
const color =
minutes >= 120 ? "#b42318" : minutes >= 75 ? "#a16207" : "#166534";
const background =
minutes >= 120 ? "#fff1f0" : minutes >= 75 ? "#fff8e8" : "#effaf3";

return (
<div
style={{
height: 8,
borderRadius: 999,
background,
overflow: "hidden",
border: "1px solid rgba(15,23,42,.05)",
}}
>
<div
style={{
width: `${ratio}%`,
height: "100%",
background: color,
borderRadius: 999,
}}
/>
</div>
);
}

function getRoomNumber(value) {
  const n = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}

function getBedOrder(value) {
  const normalized = normalizeText(value);
  if (normalized === "p") return 1;
  if (normalized === "f") return 2;
  if (normalized === "a") return 1;
  if (normalized === "b") return 2;
  return 9;
}

function getDailyCleaningTaskForPatient(patient, bioCleaningSettings, scenarioOptions) {
  const sector = inferSectorFromService(patient?.service);

  const dailyScenario =
    scenarioOptions.find((s) => normalizeText(s.label).includes("quotidien")) ||
    scenarioOptions.find((s) => normalizeText(s.label).includes("journalier"));

  return {
    id: `bio-daily-${patient.id}`,
    patientId: patient.id,
    taskType: "daily",
    patientName: `${patient?.nom || ""} ${patient?.prenom || ""}`.trim(),
    sector,
    service: patient?.service || "Sans service",
    room: patient?.chambre || "—",
    bed: patient?.lit || "—",
    plannedExitAt: "",
    scenarioId: dailyScenario?.id || "daily_room",
    estimatedMinutes: hasHygienePrecaution(patient) ? 25 : 15,
    plannedStartAt: "",
    plannedEndAt: "",
    hygienePrecaution: hasHygienePrecaution(patient),
    priority: hasHygienePrecaution(patient) ? "medium" : "normal",
    assignedAgentId: "",
    agentId: "",
    status: "draft",
  };
}

export default function BioCleaningManagerView({
patients = [],
services = [],
bioCleaningSettings,
agents,
setAgents,
tasks,
setTasks,
}) {

    



function getWorkCycleLabel(cycleId) {
const cycle = WORK_CYCLES.find((c) => c.id === cycleId);

if (!cycle) return "Non défini";

return cycle.label || `${cycle.start} - ${cycle.end}`;
}
const scenarioOptions = useMemo(
() => buildDefaultScenarioOptions(bioCleaningSettings),
[bioCleaningSettings]
);

const [selectedServices, setSelectedServices] = useState([]);


const [tableFilter, setTableFilter] = useState("all");



const generatedTasks = useMemo(() => {
  const output = [];

  safeArray(patients).forEach((patient) => {
    const plannedExitAt = getPlannedExitAt(patient);
    const sector = inferSectorFromService(patient?.service);

    const hasExitCleaning = Boolean(
      plannedExitAt ||
      isMedicalReady(patient) ||
      patient?.discharge?.effectiveAt ||
      patient?.discharge?.plannedAt
    );

    if (hasExitCleaning) {
      const estimatedMinutes = getEstimatedCleaningMinutesFromSettings(
        patient,
        bioCleaningSettings
      );

      output.push({
        id: `bio-exit-${patient.id}`,
        patientId: patient.id,
        taskType: "exit",
        patientName: `${patient?.nom || ""} ${patient?.prenom || ""}`.trim(),
        sector,
        service: patient?.service || "Sans service",
        room: patient?.chambre || "—",
        bed: patient?.lit || "—",
        plannedExitAt,
        scenarioId: selectDefaultScenario(patient, scenarioOptions),
        estimatedMinutes,
        plannedStartAt: plannedExitAt || "",
        plannedEndAt: plannedExitAt ? addMinutes(plannedExitAt, estimatedMinutes) : "",
        hygienePrecaution: hasHygienePrecaution(patient),
        priority: getTaskPriority(patient),
        assignedAgentId: "",
        agentId: "",
        status: "draft",
      });
    }
if (!hasExitCleaning) {
  output.push(
    getDailyCleaningTaskForPatient(patient, bioCleaningSettings, scenarioOptions)
  );
}
  });

  return output.sort((a, b) => {
    const typeScore = (task) =>
      task.taskType === "exit" ? 0 : task.hygienePrecaution ? 1 : 2;

    const scoreDiff = typeScore(a) - typeScore(b);
    if (scoreDiff !== 0) return scoreDiff;

    const timeA = new Date(a.plannedStartAt || a.plannedExitAt || 0).getTime();
    const timeB = new Date(b.plannedStartAt || b.plannedExitAt || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;

    const roomDiff = getRoomNumber(a.room) - getRoomNumber(b.room);
    if (roomDiff !== 0) return roomDiff;

    return getBedOrder(a.bed) - getBedOrder(b.bed);
  });
}, [patients, bioCleaningSettings, scenarioOptions]);


useEffect(() => {
  setTasks((prev) => {
    const previousById = new Map(safeArray(prev).map((task) => [task.id, task]));

    return generatedTasks.map((task) => {
      const previous = previousById.get(task.id);

      if (!previous) return task;

      return {
        ...task,
        assignedAgentId: previous.assignedAgentId || "",
        agentId: previous.agentId || previous.assignedAgentId || "",
        status: previous.status || task.status,
        plannedStartAt: previous.plannedStartAt || task.plannedStartAt,
        plannedEndAt: previous.plannedEndAt || task.plannedEndAt,
        estimatedMinutes: previous.estimatedMinutes || task.estimatedMinutes,
        scenarioId: previous.scenarioId || task.scenarioId,
      };
    });
  });
}, [generatedTasks, setTasks]);

const [showPrintPreview, setShowPrintPreview] = useState(false);
const [printMode, setPrintMode] = useState("agent");
const [printSelectedAgents, setPrintSelectedAgents] = useState([]);
const [printSelectedServices, setPrintSelectedServices] = useState([]);



const sectorOptions = useMemo(() => {
const values = Array.from(
new Set(tasks.map((task) => task.sector).filter(Boolean))
).sort();
return values;
}, [tasks]);

const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
    if (
      selectedServices.length > 0 &&
      !selectedServices.includes(task.service)
    ) {
      return false;
    }

    if (tableFilter === "draft") return task.status === "draft";
    if (tableFilter === "planned") return task.status === "planned";
    if (tableFilter === "ph") return task.hygienePrecaution;
    if (tableFilter === "unassigned") return !task.assignedAgentId;

    return true;
  });
}, [tasks, selectedServices, tableFilter]);


const agentLoads = useMemo(() => {
const loads = {};
agents.forEach((agent) => {
loads[agent.id] = 0;
});

tasks.forEach((task) => {
if (task.assignedAgentId) {
loads[task.assignedAgentId] =
(loads[task.assignedAgentId] || 0) + Number(task.estimatedMinutes || 0);
}
});

return loads;
}, [tasks, agents]);

const tasksByAgent = useMemo(() => {
const map = {};
agents.forEach((agent) => {
map[agent.id] = [];
});

tasks.forEach((task) => {
if (task.assignedAgentId) {
if (!map[task.assignedAgentId]) map[task.assignedAgentId] = [];
map[task.assignedAgentId].push(task);
}
});

Object.keys(map).forEach((agentId) => {
map[agentId] = [...map[agentId]].sort((a, b) => {
const at = new Date(a.plannedStartAt || 0).getTime();
const bt = new Date(b.plannedStartAt || 0).getTime();
return at - bt;
});
});

return map;
}, [tasks, agents]);

const totalMinutes = filteredTasks.reduce(
(sum, task) => sum + Number(task.estimatedMinutes || 0),
0
);
const exitCleaningCount = filteredTasks.filter(
  (task) => task.taskType === "exit"
).length;

const dailyRoomCount = new Set(
  filteredTasks
    .filter((task) => task.taskType === "daily")
    .map((task) => `${task.service}-${task.room}`)
).size;

const hygieneCount = filteredTasks.filter((task) => task.hygienePrecaution).length;
const unassignedCount = filteredTasks.filter((task) => !task.assignedAgentId).length;
const plannedCount = filteredTasks.filter((task) => task.status === "planned").length;
const availableAgents = agents.filter((agent) => agent.status === "available").length;



const planningRows = useMemo(() => {
return [...filteredTasks].sort((a, b) => {
const at = new Date(a.plannedStartAt || 0).getTime();
const bt = new Date(b.plannedStartAt || 0).getTime();
return at - bt;
});
}, [filteredTasks]);



function getScenarioLabel(scenarioId) {
return (
scenarioOptions.find((item) => item.id === scenarioId)?.label ||
"Situation"
);
}

function updateTask(taskId, patch) {
setTasks((prev) =>
prev.map((task) => {
if (task.id !== taskId) return task;

const next = { ...task, ...patch };

if (
Object.prototype.hasOwnProperty.call(patch, "plannedStartAt") &&
next.plannedStartAt
) {
next.plannedEndAt = addMinutes(next.plannedStartAt, next.estimatedMinutes);
}

if (
Object.prototype.hasOwnProperty.call(patch, "estimatedMinutes") &&
next.plannedStartAt
) {
next.plannedEndAt = addMinutes(next.plannedStartAt, next.estimatedMinutes);
}

return next;
})
);
}

function updateScenario(taskId, scenarioId) {
setTasks((prev) =>
prev.map((task) => {
if (task.id !== taskId) return task;

return {
...task,
scenarioId,
};
})
);
}

function assignAgent(taskId, agentId) {
setTasks((prev) =>
prev.map((task) =>
task.id === taskId
? {
...task,
agentId,
assignedAgentId: agentId,
status: agentId ? "planned" : "draft",
}
: task
)
);
}


function handlePrint() {
window.print();
}

function togglePrintItem(value, setter) {
setter((prev) =>
prev.includes(value)
? prev.filter((item) => item !== value)
: [...prev, value]
);
}

const printableTasks = useMemo(() => {
  return planningRows
    .filter((task) => {
      if (
        printSelectedServices.length > 0 &&
        !printSelectedServices.includes(task.service)
      ) {
        return false;
      }

      if (
        printSelectedAgents.length > 0 &&
        !printSelectedAgents.includes(task.assignedAgentId)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const at = new Date(a.plannedStartAt || a.plannedExitAt || 0).getTime();
      const bt = new Date(b.plannedStartAt || b.plannedExitAt || 0).getTime();
      return at - bt;
    });
}, [planningRows, printSelectedServices, printSelectedAgents]);

const printableTasksByAgent = useMemo(() => {
return agents
.map((agent) => ({
agent,
tasks: printableTasks.filter((task) => task.assignedAgentId === agent.id),
}))
.filter((row) => row.tasks.length > 0);
}, [agents, printableTasks]);

function printBioPlanning() {
setShowPrintPreview(true);
setTimeout(() => window.print(), 100);
}
function handleAutoAssign() {
  const availableAgentPool = safeArray(agents).filter(
    (agent) => agent.status === "available"
  );

  if (availableAgentPool.length === 0) return;

  const agentLoad = {};
  availableAgentPool.forEach((agent) => {
    agentLoad[agent.id] = 0;
  });

  const sortedTasks = [...tasks]
    .filter((task) => task.status !== "done")
    .sort((a, b) => {
      const priorityScore = (task) => {
        if (task.hygienePrecaution) return 0;
        if (task.taskType === "exit") return 1;
        return 2;
      };

      const priorityDiff = priorityScore(a) - priorityScore(b);
      if (priorityDiff !== 0) return priorityDiff;

      const timeA = new Date(a.plannedStartAt || a.plannedExitAt || 0).getTime();
      const timeB = new Date(b.plannedStartAt || b.plannedExitAt || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const roomDiff = getRoomNumber(a.room) - getRoomNumber(b.room);
      if (roomDiff !== 0) return roomDiff;

      return getBedOrder(a.bed) - getBedOrder(b.bed);
    });

  const updatedById = new Map();

  sortedTasks.forEach((task) => {
    const sectorAgents = availableAgentPool.filter(
      (agent) => agent.sector === task.sector || agent.sector === "Tous"
    );

    const pool = sectorAgents.length > 0 ? sectorAgents : availableAgentPool;

    const bestAgent = pool.reduce((best, agent) =>
      agentLoad[agent.id] < agentLoad[best.id] ? agent : best
    );

    agentLoad[bestAgent.id] += Number(task.estimatedMinutes || 0);

    updatedById.set(task.id, {
      ...task,
      assignedAgentId: bestAgent.id,
      agentId: bestAgent.id,
      status: "planned",
    });
  });

  setTasks((prev) =>
    prev.map((task) => updatedById.get(task.id) || task)
  );
}


return (
<div style={pageStyle}>
<section style={headerCard}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "flex-start",
gap: 12,
flexWrap: "wrap",
}}
>
<div style={{ display: "grid", gap: 4 }}>
<span style={sectionEyebrow}>Cadre bio-nettoyage</span>
<strong style={{ fontSize: 18, color: "#17376a" }}>
Organisation des tournées
</strong>
<span style={{ fontSize: 12, color: "#64748b", maxWidth: 880 }}>
Les tâches sont générées depuis les patients, leurs chambres, leurs lits et
leurs départs. Le cadre choisit le scénario, l’horaire de passage,
l’agent et édite le planning.
</span>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button type="button" style={ghostButton} onClick={handlePrint}>
Imprimer le planning
</button>
</div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  }}
></div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  }}
>
  <div style={{ ...kpiCardStyle, background: "#fff7ed" }}>
    <span style={sectionEyebrow}>Sorties à nettoyer</span>
    <strong style={{ fontSize: 40, color: "#a16207", lineHeight: 1 }}>
      {exitCleaningCount}
    </strong>
    <span style={{ fontSize: 12, color: "#64748b" }}>
      après départ patient
    </span>
  </div>

  <div style={{ ...kpiCardStyle, background: "#f8fbff" }}>
    <span style={sectionEyebrow}>Chambres à nettoyer</span>
    <strong style={{ fontSize: 40, color: "#17376a", lineHeight: 1 }}>
      {dailyRoomCount}
    </strong>
    <span style={{ fontSize: 12, color: "#64748b" }}>
      entretien quotidien
    </span>
  </div>

  <div style={{ ...kpiCardStyle, background: "#fff8e8" }}>
    <span style={sectionEyebrow}>À affecter</span>
    <strong style={{ fontSize: 40, color: "#a16207", lineHeight: 1 }}>
      {unassignedCount}
    </strong>
    <span style={{ fontSize: 12, color: "#64748b" }}>
      tâches sans agent
    </span>
  </div>

  <div style={{ ...kpiCardStyle, background: "#fff1f0" }}>
    <span style={sectionEyebrow}>Précautions hygiène</span>
    <strong style={{ fontSize: 40, color: "#b42318", lineHeight: 1 }}>
      {hygieneCount}
    </strong>
    <span style={{ fontSize: 12, color: "#64748b" }}>
      passages renforcés
    </span>
  </div>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
  <span style={badgeStyle("neutral")}>
    {filteredTasks.length} tâche(s)
  </span>

  <span style={badgeStyle("green")}>
    {plannedCount} planifiée(s)
  </span>

  <span style={badgeStyle("blue")}>
    {availableAgents} agent(s) disponible(s)
  </span>

  <span style={badgeStyle("neutral")}>
    {totalMinutes} min estimées
  </span>
</div>
</section>
<section style={cardStyle}>
  <div style={{ display: "grid", gap: 12 }}>
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>
        Services
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            ...smallButton,
            background: selectedServices.length === 0 ? "#17376a" : "#fff",
            color: selectedServices.length === 0 ? "#fff" : "#334155",
            borderColor: selectedServices.length === 0 ? "#17376a" : "#d1d5db",
          }}
          onClick={() => setSelectedServices([])}
        >
          Tous les services
        </button>

        {safeArray(services).map((service) => (
          <button
            key={service}
            type="button"
            style={{
              ...smallButton,
              background: selectedServices.includes(service) ? "#17376a" : "#fff",
              color: selectedServices.includes(service) ? "#fff" : "#334155",
              borderColor: selectedServices.includes(service) ? "#17376a" : "#d1d5db",
            }}
            onClick={() => toggleItem(service, setSelectedServices)}
          >
            {service}
          </button>
        ))}
      </div>
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        style={{
          ...smallButton,
          background: tableFilter === "all" ? "#17376a" : "#fff",
          color: tableFilter === "all" ? "#fff" : "#334155",
          borderColor: tableFilter === "all" ? "#17376a" : "#d1d5db",
        }}
        onClick={() => setTableFilter("all")}
      >
        Toutes
      </button>

      <button
        type="button"
        style={{
          ...smallButton,
          background: tableFilter === "unassigned" ? "#17376a" : "#fff",
          color: tableFilter === "unassigned" ? "#fff" : "#334155",
          borderColor: tableFilter === "unassigned" ? "#17376a" : "#d1d5db",
        }}
        onClick={() => setTableFilter("unassigned")}
      >
        Non affectées
      </button>

      <button
        type="button"
        style={{
          ...smallButton,
          background: tableFilter === "ph" ? "#17376a" : "#fff",
          color: tableFilter === "ph" ? "#fff" : "#334155",
          borderColor: tableFilter === "ph" ? "#17376a" : "#d1d5db",
        }}
        onClick={() => setTableFilter("ph")}
      >
        Précautions hygiène
      </button>

      <button
        type="button"
        style={{
          ...smallButton,
          background: tableFilter === "planned" ? "#17376a" : "#fff",
          color: tableFilter === "planned" ? "#fff" : "#334155",
          borderColor: tableFilter === "planned" ? "#17376a" : "#d1d5db",
        }}
        onClick={() => setTableFilter("planned")}
      >
        Planifiées
      </button>
    </div>
  </div>
</section>

<section style={cardStyle}>
  <div style={{ display: "grid", gap: 12 }}>
    <div>
      <strong style={{ color: "#17376a", fontSize: 16 }}>
        Affectation des agents
      </strong>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
        Chaque agent est rattaché à un service et à un shift.
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {agents.map((agent) => (
        <div key={agent.id} style={compactPanel}>
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ color: "#17376a" }}>{agent.name}</strong>

            <select
              value={agent.sector || "Tous"}
              onChange={(e) =>
                setAgents((prev) =>
                  prev.map((item) =>
                    item.id === agent.id
                      ? { ...item, sector: e.target.value }
                      : item
                  )
                )
              }
              style={inputStyle}
            >
              <option value="Tous">Tous services</option>
              {safeArray(services).map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <select
              value={agent.workCycleId || "matin"}
              onChange={(e) =>
                setAgents((prev) =>
                  prev.map((item) =>
                    item.id === agent.id
                      ? { ...item, workCycleId: e.target.value }
                      : item
                  )
                )
              }
              style={inputStyle}
            >
              {WORK_CYCLES.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.label || `${cycle.start} - ${cycle.end}`}
                </option>
              ))}
            </select>

            <select
              value={agent.status}
              onChange={(e) =>
                setAgents((prev) =>
                  prev.map((item) =>
                    item.id === agent.id
                      ? { ...item, status: e.target.value }
                      : item
                  )
                )
              }
              style={inputStyle}
            >
              <option value="available">Disponible</option>
              <option value="busy">Occupé</option>
              <option value="pause">Pause</option>
              <option value="absent">Absent</option>
            </select>

            <div style={{ display: "grid", gap: 5 }}>
              <span
                style={{
                  ...badgeStyle(
                    agentLoads[agent.id] >= 120
                      ? "red"
                      : agentLoads[agent.id] >= 75
                      ? "amber"
                      : "green"
                  ),
                  width: "fit-content",
                }}
              >
                Charge : {agentLoads[agent.id] || 0} min
              </span>
              <LoadBar minutes={agentLoads[agent.id] || 0} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

<section style={cardStyle} className="no-print">
  <div style={{ display: "grid", gap: 12 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div>
        <strong style={{ color: "#17376a", fontSize: 16 }}>
          Préparer l’impression
        </strong>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          Sélectionne un ou plusieurs agents.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            ...smallButton,
            background: printMode === "agent" ? "#17376a" : "#fff",
            color: printMode === "agent" ? "#fff" : "#334155",
            borderColor: printMode === "agent" ? "#17376a" : "#d1d5db",
          }}
          onClick={() => setPrintMode("agent")}
        >
          Feuilles agents
        </button>

        <button
          type="button"
          style={{
            ...smallButton,
            background: printMode === "cadre" ? "#17376a" : "#fff",
            color: printMode === "cadre" ? "#fff" : "#334155",
            borderColor: printMode === "cadre" ? "#17376a" : "#d1d5db",
          }}
          onClick={() => setPrintMode("cadre")}
        >
          Tableau cadre
        </button>

        <button type="button" style={primaryButton} onClick={printBioPlanning}>
          Imprimer
        </button>

        <button type="button" style={primaryButton} onClick={handleAutoAssign}>
          Optimiser tournées
        </button>
      </div>
    </div>

    <div style={{ display: "grid", gap: 8 }}>
      <div style={fieldLabel}>Agents</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            ...smallButton,
            background: printSelectedAgents.length === 0 ? "#17376a" : "#fff",
            color: printSelectedAgents.length === 0 ? "#fff" : "#334155",
            borderColor:
              printSelectedAgents.length === 0 ? "#17376a" : "#d1d5db",
          }}
          onClick={() => setPrintSelectedAgents([])}
        >
          Tous agents
        </button>

        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            style={{
              ...smallButton,
              background: printSelectedAgents.includes(agent.id)
                ? "#17376a"
                : "#fff",
              color: printSelectedAgents.includes(agent.id)
                ? "#fff"
                : "#334155",
              borderColor: printSelectedAgents.includes(agent.id)
                ? "#17376a"
                : "#d1d5db",
            }}
            onClick={() => togglePrintItem(agent.id, setPrintSelectedAgents)}
          >
            {agent.name}
          </button>
        ))}
      </div>
    </div>
  </div>
</section>

<section style={cardStyle}>
  <div style={{ display: "grid", gap: 12 }}>
    <div>
      <strong style={{ color: "#17376a", fontSize: 16 }}>
        Planning cadre bio-nettoyage
      </strong>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
        Sorties patient, nettoyages quotidiens et précautions hygiène.
      </div>
    </div>

    {planningRows.length === 0 ? (
      <div style={compactPanel}>
        <strong style={{ color: "#17376a" }}>Aucune tâche à afficher</strong>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          Aucun nettoyage dans ce périmètre.
        </div>
      </div>
    ) : (
      <div style={{ display: "grid", gap: 12 }}>
        {planningRows.map((task) => {
        const compatibleAgents = agents;

          return (
            <div
              key={task.id}
              style={{
                border: `1px solid ${
                  task.hygienePrecaution
                    ? "#f3c7c1"
                    : task.taskType === "exit"
                    ? "#fed7aa"
                    : "#dbe3f1"
                }`,
                borderRadius: 18,
                padding: 14,
                background: task.hygienePrecaution
                  ? "#fff7f7"
                  : task.taskType === "exit"
                  ? "#fff7ed"
                  : "#f8fbff",
                display: "grid",
                gap: 12,
                boxShadow: "0 8px 20px rgba(15,23,42,.06)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(260px, 1.2fr) minmax(120px, auto)",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <strong style={{ color: "#17376a", fontSize: 15 }}>
                      Chambre {task.room} · Lit {task.bed}
                    </strong>

                    <span
                      style={badgeStyle(
                        task.taskType === "exit" ? "amber" : "green"
                      )}
                    >
                      {task.taskType === "exit"
                        ? "Sortie patient"
                        : "Nettoyage quotidien"}
                    </span>

                    {task.hygienePrecaution ? (
                      <span style={badgeStyle("red")}>
                        Précautions hygiène
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#334155",
                      fontWeight: 800,
                    }}
                  >
                    {task.patientName || "Chambre sans patient"}
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {task.service}
                    {task.taskType === "exit"
                      ? ` · Départ : ${formatDayAndTime(task.plannedExitAt)}`
                      : " · Passage quotidien"}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                  <span style={badgeStyle(getStatusTone(task.status))}>
                    {getStatusLabel(task.status)}
                  </span>
                  <span style={badgeStyle(task.hygienePrecaution ? "red" : "blue")}>
                    {task.estimatedMinutes} min
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(170px, 0.9fr) 90px minmax(220px, 1.2fr) minmax(220px, 1.1fr) minmax(130px, 0.8fr)",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <label>
                  <div style={fieldLabel}>Horaire de passage</div>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocal(task.plannedStartAt)}
                    onChange={(e) =>
                      updateTask(task.id, {
                        plannedStartAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "",
                      })
                    }
                    style={inputStyle}
                  />
                  <div style={fieldHelp}>
                    Fin estimée : {formatShortTime(task.plannedEndAt)}
                  </div>
                </label>

                <label>
                  <div style={fieldLabel}>Durée</div>
                  <input
                    type="number"
                    min="0"
                    value={task.estimatedMinutes}
                    onChange={(e) =>
                      updateTask(task.id, {
                        estimatedMinutes: Number(e.target.value),
                      })
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={fieldLabel}>Scénario</div>
                  <select
                    value={task.scenarioId}
                    onChange={(e) => updateScenario(task.id, e.target.value)}
                    style={inputStyle}
                  >
                    {scenarioOptions.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div style={fieldLabel}>Agent</div>
                  <select
                    value={task.assignedAgentId || ""}
                    onChange={(e) => {
                      const agentId = e.target.value;

                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === task.id
                            ? {
                                ...t,
                                assignedAgentId: agentId,
                                agentId,
                                status: agentId ? "planned" : "draft",
                              }
                            : t
                        )
                      );
                    }}
                    style={inputStyle}
                  >
                    <option value="">Non affecté</option>

                    {compatibleAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div style={fieldLabel}>Statut</div>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      updateTask(task.id, {
                        status: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="draft">À planifier</option>
                    <option value="planned">Planifiée</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminée</option>
                    <option value="blocked">Bloquée</option>
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</section>

<section style={cardStyle}>
  <div style={{ display: "grid", gap: 12 }}>
    <div>
      <strong style={{ color: "#17376a", fontSize: 16 }}>
        Tournées agents
      </strong>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
        Vue distribuable aux agents, triée par horaire et chambre.
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12,
      }}
    >
      {agents.map((agent) => {
        const agentTasks = safeArray(tasksByAgent[agent.id]);

        return (
          <div
            key={agent.id}
            style={{
              ...compactPanel,
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div style={{ display: "grid", gap: 2 }}>
                <strong style={{ color: "#17376a" }}>{agent.name}</strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {agent.sector || "Tous services"} ·{" "}
                  {getWorkCycleLabel(agent.workCycleId)}
                </span>
              </div>

              <span style={badgeStyle(getAgentStatusTone(agent.status))}>
                {getAgentStatusLabel(agent.status)}
              </span>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  ...badgeStyle(
                    agentLoads[agent.id] >= 120
                      ? "red"
                      : agentLoads[agent.id] >= 75
                      ? "amber"
                      : "green"
                  ),
                  width: "fit-content",
                }}
              >
                {agentLoads[agent.id] || 0} min
              </span>
              <LoadBar minutes={agentLoads[agent.id] || 0} />
            </div>

            {agentTasks.length === 0 ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Aucune tâche affectée.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {agentTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      border: "1px solid #e5ebf4",
                      borderRadius: 12,
                      padding: 10,
                      background: "#fff",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <strong style={{ color: "#17376a", fontSize: 13 }}>
                        {formatShortTime(task.plannedStartAt)}
                      </strong>
                      <span
                        style={badgeStyle(
                          task.taskType === "exit" ? "amber" : "green"
                        )}
                      >
                        {task.taskType === "exit" ? "Sortie" : "Quotidien"}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#334155" }}>
                      {task.service} · Chambre {task.room} · Lit {task.bed}
                    </div>

                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {getScenarioLabel(task.scenarioId)} ·{" "}
                      {task.estimatedMinutes} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</section>

<section id="bio-print-area">
  <div style={printHeaderStyle}>
    <h1 style={{ margin: 0, color: "#17376a", fontSize: 20 }}>
      Planning bio-nettoyage
    </h1>
    <div style={{ fontSize: 12, color: "#475569" }}>
      Édition du {new Date().toLocaleDateString("fr-FR")} ·{" "}
      {new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  </div>

  {printMode === "cadre" ? (
    <div>
      <h2 style={printSectionTitle}>Tableau cadre</h2>

      <table style={printTableStyle}>
        <thead>
          <tr>
            <th style={printThStyle}>Heure</th>
            <th style={printThStyle}>Service</th>
            <th style={printThStyle}>Chambre</th>
            <th style={printThStyle}>Lit</th>
            <th style={printThStyle}>Patient</th>
            <th style={printThStyle}>Scénario</th>
            <th style={printThStyle}>Durée</th>
            <th style={printThStyle}>PH</th>
            <th style={printThStyle}>Agent</th>
            <th style={printThStyle}>Statut</th>
          </tr>
        </thead>

        <tbody>
          {printableTasks.map((task) => {
            const agent = agents.find(
              (item) => item.id === task.assignedAgentId
            );

            return (
              <tr key={`print-cadre-${task.id}`}>
                <td style={printTdStyle}>
                  {formatShortTime(task.plannedStartAt)}
                </td>
                <td style={printTdStyle}>{task.service}</td>
                <td style={printTdStyle}>{task.room}</td>
                <td style={printTdStyle}>{task.bed}</td>
                <td style={printTdStyle}>{task.patientName}</td>
                <td style={printTdStyle}>{getScenarioLabel(task.scenarioId)}</td>
                <td style={printTdStyle}>{task.estimatedMinutes} min</td>
                <td style={printTdStyle}>
                  {task.hygienePrecaution ? "Oui" : "Non"}
                </td>
                <td style={printTdStyle}>{agent?.name || "Non affecté"}</td>
                <td style={printTdStyle}>{getStatusLabel(task.status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <div>
      {printableTasksByAgent.length === 0 ? (
        <div style={{ fontSize: 13, color: "#475569" }}>
          Aucune tournée agent à imprimer.
        </div>
      ) : (
        printableTasksByAgent.map(({ agent, tasks }) => (
          <div key={`print-agent-${agent.id}`} style={printAgentBlockStyle}>
            <h2 style={printSectionTitle}>Tournée – {agent.name}</h2>

            <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
              Service : {agent.sector || "Tous services"} · Cycle :{" "}
              {getWorkCycleLabel(agent.workCycleId)} · Charge :{" "}
              {tasks.reduce(
                (sum, task) => sum + Number(task.estimatedMinutes || 0),
                0
              )}{" "}
              min
            </div>

            <table style={printTableStyle}>
              <thead>
                <tr>
                  <th style={printThStyle}>Heure</th>
                  <th style={printThStyle}>Service</th>
                  <th style={printThStyle}>Chambre</th>
                  <th style={printThStyle}>Lit</th>
                  <th style={printThStyle}>Scénario</th>
                  <th style={printThStyle}>Durée</th>
                  <th style={printThStyle}>PH</th>
                  <th style={printThStyle}>Statut</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={`print-agent-task-${task.id}`}>
                    <td style={printTdStyle}>
                      {formatShortTime(task.plannedStartAt)}
                    </td>
                    <td style={printTdStyle}>{task.service}</td>
                    <td style={printTdStyle}>{task.room}</td>
                    <td style={printTdStyle}>{task.bed}</td>
                    <td style={printTdStyle}>
                      {getScenarioLabel(task.scenarioId)}
                    </td>
                    <td style={printTdStyle}>{task.estimatedMinutes} min</td>
                    <td style={printTdStyle}>
                      {task.hygienePrecaution ? "Oui" : "Non"}
                    </td>
                    <td style={printTdStyle}>{getStatusLabel(task.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )}
</section>

</div>
);
}

const thStyle = {
textAlign: "left",
padding: "10px 12px",
fontSize: 12,
fontWeight: 800,
color: "#475569",
borderBottom: "1px solid #e5ebf4",
whiteSpace: "nowrap",
};

const tdStyle = {
padding: "10px 12px",
borderBottom: "1px solid #eef2f7",
verticalAlign: "top",
color: "#334155",
};

const tdStyleStrong = {
...tdStyle,
fontWeight: 700,
color: "#17376a",
};

const emptyCellStyle = {
padding: "18px 12px",
textAlign: "center",
color: "#64748b",
};

const tableInputStyle = {
width: "100%",
minHeight: 36,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "6px 8px",
fontSize: 12,
color: "#17376a",
background: "#fff",
boxSizing: "border-box",
};

const tableSelectStyle = {
width: "100%",
minHeight: 36,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "6px 8px",
fontSize: 12,
color: "#17376a",
background: "#fff",
boxSizing: "border-box",
};

const miniThStyle = {
textAlign: "left",
padding: "8px 10px",
fontSize: 11,
fontWeight: 800,
color: "#64748b",
borderBottom: "1px solid #e5ebf4",
whiteSpace: "nowrap",
};

const miniTdStyle = {
padding: "8px 10px",
borderBottom: "1px solid #eef2f7",
color: "#334155",
whiteSpace: "nowrap",
};

const fieldLabel = {
marginBottom: 6,
fontSize: 12,
fontWeight: 800,
color: "#475569",
};

const fieldHelp = {
marginTop: 4,
fontSize: 11,
color: "#64748b",
};

const printHeaderStyle = {
display: "grid",
gap: 4,
marginBottom: 14,
};

const printSectionTitle = {
color: "#17376a",
fontSize: 16,
margin: "12px 0 8px",
};

const printTableStyle = {
width: "100%",
borderCollapse: "collapse",
fontSize: 11,
};

const printThStyle = {
border: "1px solid #cbd5e1",
padding: "6px 7px",
background: "#eef4ff",
color: "#17376a",
textAlign: "left",
fontWeight: 800,
};

const printTdStyle = {
border: "1px solid #cbd5e1",
padding: "6px 7px",
color: "#111827",
verticalAlign: "top",
};

const printAgentBlockStyle = {
pageBreakInside: "avoid",
marginBottom: 18,
};
