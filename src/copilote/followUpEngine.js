// src/copilote/followUpEngine.js

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function isPast(dateString) {
if (!dateString) return false;

const time = new Date(dateString).getTime();
if (Number.isNaN(time)) return false;

const today = new Date();
today.setHours(0, 0, 0, 0);

return time < today.getTime();
}

function isToday(dateString) {
if (!dateString) return false;

const date = new Date(dateString);
if (Number.isNaN(date.getTime())) return false;

const today = new Date();

return (
date.getFullYear() === today.getFullYear() &&
date.getMonth() === today.getMonth() &&
date.getDate() === today.getDate()
);
}

function isPendingStatus(status) {
return ["todo", "doing", "blocked"].includes(normalize(status));
}

function buildActionAlert(action, level, label) {
return {
id: `alert_${action.id}_${level}`,
level,
label,
actionId: action.id,
};
}

function buildActionSuggestion(action, label, overrides = {}) {
return {
id: `followup_${action.id}_${Math.random().toString(36).slice(2, 8)}`,
label,
owner: overrides.owner || action.owner || "À définir",
status: "todo",
priority: overrides.priority || "high",
source: "followup",
workflowType: overrides.workflowType || "followup",
dueDate: overrides.dueDate || "",
linkedResourceId: overrides.linkedResourceId || action.linkedResourceId || null,
notes: overrides.notes || action.label || "",
};
}

export function runFollowUpEngine({ patient }) {
const actions = patient?.actionPlan || [];
const alerts = [];
const suggestedActions = [];

actions.forEach((action) => {
const status = normalize(action.status);

if (!isPendingStatus(status)) return;

if (status === "blocked") {
alerts.push(
buildActionAlert(
action,
"high",
`Action bloquée : ${action.label}`
)
);

suggestedActions.push(
buildActionSuggestion(
action,
`Lever le blocage : ${action.label}`,
{
owner: "Coordination",
workflowType: "blocked_resolution",
dueDate: action.dueDate || "",
}
)
);
}

if (action.dueDate && isPast(action.dueDate) && status !== "done") {
alerts.push(
buildActionAlert(
action,
"high",
`Action en retard : ${action.label}`
)
);

suggestedActions.push(
buildActionSuggestion(
action,
`Relancer l'action en retard : ${action.label}`,
{
owner: action.owner || "Équipe",
workflowType: "late_action_relance",
dueDate: action.dueDate,
}
)
);
} else if (action.dueDate && isToday(action.dueDate) && status !== "done") {
alerts.push(
buildActionAlert(
action,
"medium",
`Action à traiter aujourd'hui : ${action.label}`
)
);
}

if (
normalize(action.workflowType).includes("relance") &&
status === "todo" &&
action.dueDate &&
isPast(action.dueDate)
) {
suggestedActions.push(
buildActionSuggestion(
action,
`Escalader la relance non traitée : ${action.label}`,
{
owner: "Coordination",
workflowType: "relance_escalation",
dueDate: action.dueDate,
}
)
);
}
});

const dedupedAlerts = dedupeBy(alerts, (item) => item.label);
const dedupedSuggestions = dedupeBy(
suggestedActions,
(item) => `${item.label}|${item.workflowType}|${item.linkedResourceId || ""}`
);

return {
alerts: dedupedAlerts,
suggestedActions: dedupedSuggestions,
};
}

function dedupeBy(items = [], getKey) {
const seen = new Set();
const output = [];

items.forEach((item) => {
const key = getKey(item);
if (seen.has(key)) return;
seen.add(key);
output.push(item);
});

return output;
}