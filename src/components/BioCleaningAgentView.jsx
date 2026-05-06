import React, { useMemo, useState } from "react";

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status) {
  if (status === "done") return "Terminée";
  if (status === "in_progress") return "En cours";
  return "À faire";
}

function getStatusTone(status) {
  if (status === "done") return "green";
  if (status === "in_progress") return "blue";
  return "amber";
}

function badgeStyle(kind = "neutral") {
  const styles = {
    neutral: { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
    blue: { background: "#eef4ff", color: "#17376a", border: "1px solid #d6e4ff" },
    amber: { background: "#fff8e8", color: "#a16207", border: "1px solid #f6df9b" },
    red: { background: "#fff1f0", color: "#b42318", border: "1px solid #f3c7c1" },
    green: { background: "#effaf3", color: "#166534", border: "1px solid #cdebd8" },
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

function getTaskTypeLabel(task) {
  return task?.taskType === "exit" ? "Sortie patient" : "Nettoyage quotidien";
}

function getTaskTypeTone(task) {
  return task?.taskType === "exit" ? "amber" : "green";
}

function getPhInstructions(task) {
  if (task?.hygienePrecaution || task?.isolation || task?.precautions) {
    return [
      "Appliquer les précautions hygiène indiquées.",
      "Respecter le circuit propre / sale.",
      "Désinfecter les points de contact.",
      "Tracer la tâche une fois terminée.",
    ];
  }

  return [
    "Respecter le protocole standard de bio-nettoyage.",
    "Nettoyer du plus propre vers le plus sale.",
    "Désinfecter les points de contact.",
    "Tracer la tâche une fois terminée.",
  ];
}

const DEFAULT_ZONES = [
  "Poignées / interrupteurs",
  "Table adaptable",
  "Lit / barrières",
  "Sanitaires",
  "Sol",
];

export default function BioCleaningAgentView({
  user,
  tasks = [],
  onUpdateTask,
}) {
  const [openTaskId, setOpenTaskId] = useState("");
  const [activeTab, setActiveTab] = useState("todo");
  const [checkedZones, setCheckedZones] = useState({});

  const myTasks = useMemo(() => {
    const id = String(user?.id || user?.matricule || "");

    return tasks
      .filter((task) => String(task.assignedAgentId || task.agentId || "") === id)
      .sort((a, b) => {
        const timeA = new Date(a.plannedStartAt || a.scheduledAt || 0).getTime();
        const timeB = new Date(b.plannedStartAt || b.scheduledAt || 0).getTime();

        if (timeA !== timeB) return timeA - timeB;

        const roomA = Number.parseInt(String(a.room || a.chambre || "9999"), 10);
        const roomB = Number.parseInt(String(b.room || b.chambre || "9999"), 10);

        return roomA - roomB;
      });
  }, [tasks, user]);

  const todoTasks = myTasks.filter(
    (task) =>
      !task.status ||
      task.status === "draft" ||
      task.status === "planned" ||
      task.status === "todo"
  );

  const progressTasks = myTasks.filter((task) => task.status === "in_progress");
  const doneTasks = myTasks.filter((task) => task.status === "done");

  const filteredTasks = useMemo(() => {
    if (activeTab === "done") return doneTasks;
    if (activeTab === "progress") return progressTasks;
    return todoTasks;
  }, [activeTab, todoTasks, progressTasks, doneTasks]);

  const totalMinutes = myTasks.reduce(
    (sum, task) => sum + Number(task.estimatedMinutes || 0),
    0
  );

  const doneCount = doneTasks.length;
  const progressPercent = Math.round((doneCount / (myTasks.length || 1)) * 100);

  function toggleZone(taskId, zone) {
    setCheckedZones((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [zone]: !prev[taskId]?.[zone],
      },
    }));
  }

  function handleStart(task) {
    onUpdateTask?.(task.id, {
      status: "in_progress",
      startedAt: new Date().toISOString(),
    });
  }

  function handleDone(task) {
    onUpdateTask?.(task.id, {
      status: "done",
      doneAt: new Date().toISOString(),
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div style={styles.wrapper}>
      <style>{printCss}</style>

      <section style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.eyebrow}>Agent bio-nettoyage</div>
            <h2 style={styles.title}>Ma tournée</h2>
            <div style={styles.subtitle}>
              {user?.nom || user?.name || "Agent"} · {myTasks.length} tâche(s)
            </div>
          </div>

          <div style={styles.progressBox}>
            <strong>{progressPercent}%</strong>
            <span>terminé</span>
          </div>
        </div>

        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.eyebrow}>À faire</span>
            <strong style={{ color: "#a16207" }}>{todoTasks.length}</strong>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.eyebrow}>En cours</span>
            <strong style={{ color: "#17376a" }}>{progressTasks.length}</strong>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.eyebrow}>Terminées</span>
            <strong style={{ color: "#166534" }}>{doneTasks.length}</strong>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.eyebrow}>Charge</span>
            <strong style={{ color: "#17376a" }}>{totalMinutes} min</strong>
          </div>
        </div>
      </section>

      <section style={styles.toolbar} className="no-print">
        <button
          type="button"
          style={tabStyle(activeTab === "todo")}
          onClick={() => setActiveTab("todo")}
        >
          À faire
        </button>

        <button
          type="button"
          style={tabStyle(activeTab === "progress")}
          onClick={() => setActiveTab("progress")}
        >
          En cours
        </button>

        <button
          type="button"
          style={tabStyle(activeTab === "done")}
          onClick={() => setActiveTab("done")}
        >
          Terminées
        </button>

        <button type="button" style={styles.printButton} onClick={handlePrint}>
          Imprimer
        </button>
      </section>

      {filteredTasks.length === 0 ? (
        <div style={styles.empty}>Aucune tâche dans cet onglet.</div>
      ) : (
        <section style={styles.list}>
          {filteredTasks.map((task, index) => {
            const isOpen = openTaskId === task.id;
            const zones = task.zones || DEFAULT_ZONES;
            const instructions = getPhInstructions(task);

            return (
              <article
                key={task.id}
                style={{
                  ...styles.taskCard,
                  background: task.hygienePrecaution
                    ? "#fff7f7"
                    : task.taskType === "exit"
                    ? "#fff7ed"
                    : "#f8fbff",
                  borderColor: task.hygienePrecaution
                    ? "#f3c7c1"
                    : task.taskType === "exit"
                    ? "#fed7aa"
                    : "#dbe3f1",
                }}
              >
                <div style={styles.taskHeader}>
                  <div style={styles.rank}>#{index + 1}</div>

                  <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                    <strong style={styles.room}>
                      {formatTime(task.plannedStartAt)} · Chambre {task.room}
                      {task.bed ? ` · Lit ${task.bed}` : ""}
                    </strong>

                    <div style={styles.meta}>
                      {task.service || "Service non renseigné"} ·{" "}
                      {task.patientName || "Patient non renseigné"}
                    </div>

                    <div style={styles.badgeRow}>
                      <span style={badgeStyle(getTaskTypeTone(task))}>
                        {getTaskTypeLabel(task)}
                      </span>

                      <span style={badgeStyle(getStatusTone(task.status))}>
                        {getStatusLabel(task.status)}
                      </span>

                      <span style={badgeStyle("blue")}>
                        {task.estimatedMinutes || 0} min
                      </span>

                      {task.hygienePrecaution ? (
                        <span style={badgeStyle("red")}>
                          Précautions hygiène
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={styles.actions} className="no-print">
                  <button
                    type="button"
                    style={btnGhost}
                    onClick={() => setOpenTaskId(isOpen ? "" : task.id)}
                  >
                    {isOpen ? "Masquer" : "Détail"}
                  </button>

                  {task.status !== "in_progress" && task.status !== "done" ? (
                    <button
                      type="button"
                      style={btnPrimary}
                      onClick={() => handleStart(task)}
                    >
                      Commencer
                    </button>
                  ) : null}

                  {task.status === "in_progress" ? (
                    <button
                      type="button"
                      style={btnSuccess}
                      onClick={() => handleDone(task)}
                    >
                      Terminer
                    </button>
                  ) : null}
                </div>

                {isOpen ? (
                  <div style={styles.detail}>
                    <div style={styles.detailSection}>
                      <h4 style={styles.sectionTitle}>Zones à traiter</h4>

                      <div style={styles.checklist}>
                        {zones.map((zone) => (
                          <label key={zone} style={styles.checkItem}>
                            <input
                              type="checkbox"
                              checked={!!checkedZones[task.id]?.[zone]}
                              onChange={() => toggleZone(task.id, zone)}
                            />
                            <span>{zone}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={styles.detailSection}>
                      <h4 style={styles.sectionTitle}>Consignes</h4>

                      <ul style={styles.instructions}>
                        {instructions.map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ul>
                    </div>

                    {task.status === "done" ? (
                      <div style={styles.doneInfo}>
                        Terminée à {formatTime(task.doneAt)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: 14,
    maxWidth: 980,
    margin: "0 auto",
    width: "100%",
    minWidth: 0,
  },

  headerCard: {
    background: "#fff",
    border: "1px solid #e5ebf4",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gap: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    fontSize: 24,
    color: "#17376a",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  progressBox: {
    minWidth: 110,
    borderRadius: 16,
    padding: 12,
    background: "#f8fbff",
    border: "1px solid #dbe3f1",
    display: "grid",
    gap: 2,
    textAlign: "right",
    color: "#17376a",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },

  kpiCard: {
    border: "1px solid #e5ebf4",
    borderRadius: 16,
    padding: 12,
    background: "#f8fafc",
    display: "grid",
    gap: 4,
  },

  toolbar: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  printButton: {
    marginLeft: "auto",
    border: "1px solid #17376a",
    color: "#17376a",
    background: "#fff",
    padding: "8px 12px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  empty: {
    padding: 18,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    textAlign: "center",
  },

  list: {
    display: "grid",
    gap: 10,
  },

  taskCard: {
    border: "1px solid #e5ebf4",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 12,
    boxShadow: "0 8px 20px rgba(15,23,42,.05)",
  },

  taskHeader: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 10,
    alignItems: "start",
  },

  rank: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "#17376a",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 900,
  },

  room: {
    color: "#17376a",
    fontSize: 16,
  },

  meta: {
    fontSize: 12,
    color: "#64748b",
  },

  badgeRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  detail: {
    display: "grid",
    gap: 10,
    paddingTop: 10,
    borderTop: "1px solid #e2e8f0",
  },

  detailSection: {
    background: "rgba(255,255,255,.75)",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
  },

  sectionTitle: {
    margin: "0 0 8px",
    color: "#17376a",
    fontSize: 14,
  },

  checklist: {
    display: "grid",
    gap: 8,
  },

  checkItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#334155",
  },

  instructions: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: "#334155",
  },

  doneInfo: {
    fontSize: 12,
    color: "#166534",
    fontWeight: 800,
  },
};

function tabStyle(active) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: active ? "1px solid #17376a" : "1px solid #dbe3f1",
    background: active ? "#17376a" : "#fff",
    color: active ? "#fff" : "#17376a",
    fontWeight: 800,
    cursor: "pointer",
  };
}

const btnPrimary = {
  background: "#17376a",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const btnSuccess = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost = {
  background: "#fff",
  border: "1px solid #dbe3f1",
  color: "#17376a",
  padding: "8px 12px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const printCss = `
@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: white !important;
  }

  #root {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
  }

  button {
    display: none !important;
  }

  div, article, section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

`;