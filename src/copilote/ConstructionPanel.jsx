import { useMemo, useState } from "react";
import HDJBuilderPanel from "../components/HDJBuilderPanel";

export default function ConstructionPanel({
  patient,
  summaryLine,
  priorityActions = [],
  planItems,
  notes,
  hdjSuggestions = [],
  forms = [],
  workflows = [],
  activeKeywords = [],
  statusBlock = {},
  onAddManualPlanItem,
  onRemovePlanItem,
  onAddNote,
}) {
  const [noteType, setNoteType] = useState("Info");
  const [noteText, setNoteText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const headerLine = useMemo(() => summaryLine || "Sortie à sécuriser", [summaryLine]);

  function handleAddNote() {
    if (!noteText.trim()) return;
    onAddNote(noteType, noteText.trim());
    setNoteText("");
  }

  return (
    <>
      <section style={panel}>
        <div>
          <div style={eyebrow}>Copilote</div>
          <h2 style={title}>Où j'en suis, quoi faire, quels supports utiliser</h2>
        </div>

        <div style={compactSummary}>⚠ {headerLine}</div>

        <div style={twoColCompact}>
          <div style={card}>
            <div style={sectionTitle}>Où j'en suis</div>
            <div style={statusRow}><strong>Solution</strong><span>{statusBlock.solution || "Aucune solution"}</span></div>
            <div style={statusRow}><strong>Statut</strong><span>{statusBlock.status || "À sécuriser"}</span></div>
            <div style={statusRow}><strong>Dernière action</strong><span>{statusBlock.lastAction || "Aucune trace"}</span></div>
            <div style={statusRow}><strong>Blocage</strong><span>{statusBlock.blockage || "Aucun blocage saisi"}</span></div>
            <div style={statusRow}><strong>Reste à faire</strong><span>{statusBlock.remaining || "À préciser"}</span></div>
          </div>

          <div style={card}>
            <div style={cardTop}>
              <div style={sectionTitle}>Actions prioritaires</div>
              <button style={ghostBtn} onClick={onAddManualPlanItem}>+ action</button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {priorityActions.length ? (
                priorityActions.map((action) => (
                  <div key={action.id} style={actionRow}>
                    <span style={actionLabel}>{action.label}</span>
                    <button style={tinyPrimaryBtn}>{action.cta || "Ouvrir"}</button>
                  </div>
                ))
              ) : (
                <div style={emptyState}>Aucune action prioritaire pour le moment.</div>
              )}
            </div>
          </div>
        </div>

        {activeKeywords.length ? (
          <div style={card}>
            <div style={sectionTitle}>Mots-clés actifs du recueil</div>
            <div style={suggestionRail}>
              {activeKeywords.map((keyword) => (
                <span key={keyword} style={keywordChip}>{keyword}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div style={card}>
          <div style={cardTop}>
            <div style={sectionTitle}>Parcours et solutions retenues</div>
            <button style={tinyPrimaryBtn} onClick={() => setIsDrawerOpen(true)}>Construire un HDJ ▸</button>
          </div>
          <div style={suggestionRail}>
            {hdjSuggestions.map((suggestion) => (
              <span key={suggestion} style={suggestionChip}>{suggestion}</span>
            ))}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {planItems.length === 0 ? (
              <div style={emptyState}>Aucune solution engagée au parcours pour le moment.</div>
            ) : (
              planItems.map((item) => (
                <div key={item.id} style={planRow}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={planLabel}>{item.label}</div>
                    <div style={planMeta}>{item.type} · {item.action}</div>
                  </div>
                  <button style={tinyDangerBtn} onClick={() => onRemovePlanItem(item.id)}>Retirer</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={twoColCompact}>
          <div style={card}>
            <div style={sectionTitle}>Formulaires remontés par les mots-clés</div>
            <div style={{ display: "grid", gap: 6 }}>
              {forms.length ? forms.map((form) => (
                <div key={form.id} style={lineBlock}>
                  <div>
                    <div style={planLabel}>{form.label}</div>
                    <div style={planMeta}>{form.recipient || form.category || form.type}</div>
                  </div>
                  <a href={form.url} target="_blank" rel="noreferrer" style={linkButton}>Ouvrir</a>
                </div>
              )) : <div style={emptyState}>Aucun formulaire remonté pour les mots-clés actifs.</div>}
            </div>
          </div>

          <div style={card}>
            <div style={sectionTitle}>Workflows actifs</div>
            <div style={{ display: "grid", gap: 6 }}>
              {workflows.length ? workflows.map((workflow) => (
                <div key={workflow.id} style={lineBlock}>
                  <div>
                    <div style={planLabel}>{workflow.label}</div>
                    <div style={planMeta}>{workflow.status}</div>
                  </div>
                  {workflow.cta ? <button style={tinyBtn}>{workflow.cta}</button> : null}
                </div>
              )) : <div style={emptyState}>Aucun workflow actif.</div>}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={sectionTitle}>Notes de pilotage</div>
          <div style={noteComposer}>
            <select value={noteType} onChange={(event) => setNoteType(event.target.value)} style={compactInput}>
              <option>Info</option>
              <option>Urgent</option>
              <option>Action</option>
              <option>Famille</option>
            </select>
            <input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Ajouter une note utile" style={{ ...compactInput, minWidth: 0 }} />
            <button style={tinyPrimaryBtn} onClick={handleAddNote}>Ajouter</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {notes.length ? notes.map((note) => (
              <div key={note.id} style={noteRow}>
                <span style={noteBadge(note.type)}>{note.type}</span>
                <span style={noteTextStyle}>{note.text}</span>
              </div>
            )) : <div style={emptyState}>Aucune note ajoutée.</div>}
          </div>
        </div>
      </section>

      {isDrawerOpen ? (
        <div style={drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <aside style={drawerPanel} onClick={(event) => event.stopPropagation()}>
            <div style={drawerHeader}>
              <div>
                <div style={eyebrow}>HDJ sur mesure</div>
                <h3 style={{ ...title, fontSize: 15 }}>Construire un HDJ de parcours</h3>
                <div style={drawerMeta}>{patient?.prenom} {patient?.nom} · {patient?.service || "Service"} · solution de parcours</div>
              </div>
              <button style={closeBtn} onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>
            <HDJBuilderPanel patient={patient} compact />
          </aside>
        </div>
      ) : null}
    </>
  );
}

const panel = { background: "#fff", border: "1px solid #dbe4f0", borderRadius: 12, padding: 10, display: "grid", gap: 8 };
const eyebrow = { fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 };
const title = { margin: 0, fontSize: 15, fontWeight: 900, color: "#17376a" };
const compactSummary = { fontSize: 12, fontWeight: 700, color: "#243b63", borderRadius: 999, border: "1px solid #e3ebf7", background: "#f8fbff", padding: "6px 10px" };
const twoColCompact = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 };
const card = { border: "1px solid #e4ebf5", borderRadius: 10, padding: 8, display: "grid", gap: 6 };
const cardTop = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" };
const sectionTitle = { fontSize: 13, fontWeight: 900, color: "#17376a" };
const statusRow = { display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", gap: 8, fontSize: 12, color: "#334155" };
const actionRow = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center", border: "1px solid #edf2f8", borderRadius: 10, padding: "6px 8px", background: "#fbfdff" };
const actionLabel = { fontSize: 12, fontWeight: 700, color: "#17376a" };
const suggestionRail = { display: "flex", gap: 6, flexWrap: "wrap" };
const suggestionChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, border: "1px solid #ddd6fe", background: "#f5f3ff", color: "#6d28d9", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
const keywordChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, border: "1px solid #d6e4ff", background: "#eef4ff", color: "#1d4b8f", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
const planRow = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center", border: "1px solid #edf2f8", borderRadius: 10, padding: "6px 8px", background: "#fbfdff" };
const lineBlock = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center", border: "1px solid #edf2f8", borderRadius: 10, padding: "6px 8px", background: "#fbfdff" };
const planLabel = { fontWeight: 800, color: "#17376a", fontSize: 12 };
const planMeta = { fontSize: 11, color: "#64748b" };
const noteComposer = { display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 8 };
const compactInput = { height: 28, borderRadius: 10, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12 };
const tinyPrimaryBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #17376a", background: "#17376a", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const ghostBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const tinyBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const linkButton = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #d6e4ff", background: "#eef4ff", color: "#1d4b8f", fontSize: 11, fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" };
const tinyDangerBtn = { height: 26, padding: "0 8px", borderRadius: 999, border: "1px solid #f3c7c1", background: "#fff1f0", color: "#b42318", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const noteRow = { display: "flex", alignItems: "center", gap: 8 };
const noteTextStyle = { fontSize: 12, color: "#334155" };
const emptyState = { border: "1px dashed #d2dceb", borderRadius: 10, padding: 8, fontSize: 12, color: "#64748b" };
function noteBadge(type) {
  const map = {
    Urgent: { background: "#fff1f0", color: "#b42318", border: "#f3c7c1" },
    Info: { background: "#eef4ff", color: "#1d4b8f", border: "#d6e4ff" },
    Action: { background: "#edf8f2", color: "#237a53", border: "#c8e8d3" },
    Famille: { background: "#fff8e8", color: "#a16207", border: "#f6df9b" },
  };
  const c = map[type] || map.Info;
  return { minHeight: 22, padding: "0 8px", borderRadius: 999, border: `1px solid ${c.border}`, background: c.background, color: c.color, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
}
const drawerOverlay = { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.34)", display: "flex", justifyContent: "flex-end", zIndex: 120 };
const drawerPanel = { width: "min(760px, 92vw)", height: "100%", background: "#f8fbff", padding: 12, overflowY: "auto", boxShadow: "-16px 0 48px rgba(15, 23, 42, 0.24)", display: "grid", alignContent: "start", gap: 10 };
const drawerHeader = { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 };
const drawerMeta = { fontSize: 12, color: "#64748b" };
const closeBtn = { width: 30, height: 30, borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 15, fontWeight: 800, cursor: "pointer" };
