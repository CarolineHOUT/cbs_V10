import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

const NATURES = {
  info: { label: "Info", tone: "blue" },
  action: { label: "Action", tone: "green" },
  urgent: { label: "Urgent", tone: "red" },
  famille: { label: "Famille", tone: "violet" },
  blocage: { label: "Blocage", tone: "amber" },
};

function chipClass(nature) {
  const tone = NATURES[nature]?.tone || "blue";
  return `app-chip ${tone}`;
}

export default function SpiritPanel({
  patientId,
  notes = [],
  onAddNote,
  onReplyToNote,
  onMarkRead,
  onCreateActionFromNote,
}) {
  const [text, setText] = useState("");
  const [nature, setNature] = useState("info");
  const [notify, setNotify] = useState("");
  const [filter, setFilter] = useState("all");
  const [replyById, setReplyById] = useState({});

  const unreadCount = useMemo(() => (notes || []).filter((note) => !note.isRead).length, [notes]);
  const filteredNotes = useMemo(() => {
    const source = Array.isArray(notes) ? notes : [];
    if (filter === "unread") return source.filter((note) => !note.isRead);
    if (filter === "urgent") return source.filter((note) => (note.nature || note.level) === "urgent");
    if (filter === "action") return source.filter((note) => (note.nature || note.level) === "action");
    if (filter === "famille") return source.filter((note) => (note.nature || note.level) === "famille");
    return source;
  }, [notes, filter]);

  function handleAdd() {
    if (!text.trim()) return;
    const notifyList = notify
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onAddNote?.(patientId, {
      id: `note_${Date.now()}`,
      text: text.trim(),
      nature,
      level: nature,
      notify: notifyList,
      date: new Date().toISOString(),
      author: "Agent",
      isRead: false,
      replies: [],
    });
    setText("");
    setNature("info");
    setNotify("");
  }

  function handleReply(noteId) {
    const value = (replyById[noteId] || "").trim();
    if (!value) return;
    onReplyToNote?.(patientId, noteId, {
      text: value,
      nature: "info",
      author: "Agent",
      date: new Date().toISOString(),
    });
    setReplyById((prev) => ({ ...prev, [noteId]: "" }));
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={card()}>
        <div style={headerRow()}>
          <div>
            <div style={eyebrow()}>Notes collaboratives</div>
            <div style={title()}>Info, action, urgent, famille</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className={chipClass(unreadCount ? "urgent" : "info")}>{unreadCount} non lue(s)</span>
            <button type="button" className="app-btn app-btn-soft" onClick={() => onMarkRead?.(patientId)}>Tout marquer lu</button>
          </div>
        </div>

        <div style={composerGrid()}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Noter un fait, une action, un retour famille, un point urgent…"
            style={textarea()}
          />
          <div style={inlineGrid()}>
            <select value={nature} onChange={(e) => setNature(e.target.value)} style={input()}>
              {Object.entries(NATURES).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
            <input
              value={notify}
              onChange={(e) => setNotify(e.target.value)}
              style={input()}
              placeholder="Notifier : IDE, AS, cadre…"
            />
            <button type="button" className="app-btn app-btn-primary" onClick={handleAdd}>Ajouter</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["all", "Toutes"],
          ["unread", "Non lues"],
          ["urgent", "Urgent"],
          ["action", "Action"],
          ["famille", "Famille"],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`app-btn ${filter === key ? "app-btn-primary" : "app-btn-soft"}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filteredNotes.length === 0 ? <div style={empty()}>Aucune note pour le moment.</div> : null}
        {filteredNotes.map((note) => {
          const noteNature = note.nature || note.level || "info";
          const replies = Array.isArray(note.replies) ? note.replies : [];
          return (
            <article key={note.id} style={noteCard(!note.isRead)}>
              <div style={headerRow()}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className={chipClass(noteNature)}>{NATURES[noteNature]?.label || "Info"}</span>
                  {note.notify?.length ? <span className="app-chip">Notif. {note.notify.join(", ")}</span> : null}
                </div>
                <div style={meta()}>{note.author || "Agent"} • {formatDate(note.date)}</div>
              </div>
              <div style={body()}>{note.text}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="app-btn app-btn-soft" onClick={() => onCreateActionFromNote?.(note, "standard")}>Créer action</button>
                <button type="button" className="app-btn app-btn-soft" onClick={() => onCreateActionFromNote?.(note, "relance")}>Relance</button>
                <button type="button" className="app-btn app-btn-soft" onClick={() => onCreateActionFromNote?.(note, "blocage")}>Blocage</button>
              </div>

              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {replies.map((reply) => (
                  <div key={reply.id} style={replyCard()}>
                    <div style={meta()}>{reply.author || "Agent"} • {formatDate(reply.date)}</div>
                    <div style={{ fontSize: 13, color: "#334155" }}>{reply.text}</div>
                  </div>
                ))}
                <div style={inlineGrid()}>
                  <input
                    style={input()}
                    value={replyById[note.id] || ""}
                    onChange={(e) => setReplyById((prev) => ({ ...prev, [note.id]: e.target.value }))}
                    placeholder="Répondre à cette note…"
                  />
                  <button type="button" className="app-btn app-btn-soft" onClick={() => handleReply(note.id)}>Répondre</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function card() { return { border: "1px solid #e7edf5", borderRadius: 14, background: "#fff", padding: 12, display: "grid", gap: 10 }; }
function noteCard(unread) { return { border: `1px solid ${unread ? "#d6e4ff" : "#e7edf5"}`, borderRadius: 14, background: unread ? "#f8fbff" : "#fff", padding: 12, display: "grid", gap: 10 }; }
function replyCard() { return { borderLeft: "3px solid #d6e4ff", background: "#f8fafc", borderRadius: 10, padding: "8px 10px", display: "grid", gap: 4 }; }
function headerRow() { return { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }; }
function composerGrid() { return { display: "grid", gap: 8 }; }
function inlineGrid() { return { display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }; }
function eyebrow() { return { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }; }
function title() { return { fontSize: 16, fontWeight: 900, color: "#17376a" }; }
function meta() { return { fontSize: 11, color: "#64748b" }; }
function body() { return { fontSize: 13, color: "#0f172a", lineHeight: 1.5 }; }
function input() { return { width: "100%", minHeight: 36, borderRadius: 10, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12, boxSizing: "border-box" }; }
function textarea() { return { width: "100%", minHeight: 84, borderRadius: 12, border: "1px solid #d6deea", padding: "10px 12px", fontSize: 12, boxSizing: "border-box", resize: "vertical" }; }
function empty() { return { border: "1px dashed #d6deea", borderRadius: 14, padding: 14, background: "#fff", fontSize: 13, color: "#64748b" }; }
