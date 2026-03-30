export function useCopiloteDerivedState({ actions, exchanges, resourceFollowUp }) {
  const activity = buildActivity(actions, exchanges, resourceFollowUp);
  const notifications = buildNotifications(activity);
  const suggestions = buildSuggestions(actions);

  return { activity, notifications, suggestions };
}

function buildActivity(actions, exchanges, resourceFollowUp) {
  const act = [];

  actions.forEach(a => {
    act.push({
      type: "Action",
      label: a.label,
      date: a.createdAt || ""
    });
  });

  exchanges.forEach(e => {
    act.push({
      type: e.type || "Info",
      label: e.text,
      date: e.createdAt || ""
    });
  });

  Object.keys(resourceFollowUp || {}).forEach(key => {
    act.push({
      type: "Ressource",
      label: key,
      date: ""
    });
  });

  return act.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function buildNotifications(activity) {
  return activity.filter(a =>
    a.type === "Urgent" ||
    a.label?.toLowerCase().includes("attente")
  );
}

function buildSuggestions(actions) {
  const list = [];

  if (!actions.length) list.push("Créer première action");

  return list;
}
