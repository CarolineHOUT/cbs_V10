
import { useMemo, useState } from "react";

function buildDecisionHints(category) {
  const selectedLabels = (category.keywords || [])
    .filter((keyword) => keyword.selected)
    .map((keyword) => String(keyword.label || "").toLowerCase());

  const hints = [];
  if (selectedLabels.some((label) => label.includes("pansement") || label.includes("perfusion") || label.includes("surveillance"))) hints.push("HDJ soins");
  if (selectedLabels.some((label) => label.includes("social") || label.includes("isolement") || label.includes("aidant") || label.includes("logement"))) hints.push("Alerte sociale");
  if (selectedLabels.some((label) => label.includes("coordination") || label.includes("mdph") || label.includes("apa") || label.includes("protection"))) hints.push("Formulaire / coordination");
  return hints.length ? hints : ["Qualification à explorer"];
}

export default function QualificationPanel({
  categories,
  expandedCategoryId,
  statusOptions = [],
  onToggleCategory,
  onAddCategory,
  onAddKeyword,
  onToggleKeyword,
  onUpdateStatus,
}) {
  const [newCategory, setNewCategory] = useState("");
  const [drafts, setDrafts] = useState({});
  const compactCategories = useMemo(() => categories || [], [categories]);

  function submitCategory() {
    const nextValue = newCategory.trim();
    if (!nextValue) return;
    onAddCategory(nextValue);
    setNewCategory("");
  }

  return (
    <section style={panel}>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Recueil</div>
          <h2 style={title}>Domaines et signaux</h2>
        </div>
        <div style={inlineAddWrap}>
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Nouvelle catégorie"
            style={compactInput}
          />
          <button type="button" onClick={submitCategory} style={ghostBtn}>Ajouter</button>
        </div>
      </div>

      <div style={chipRail}>
        {compactCategories.map((category) => {
          const selectedCount = (category.keywords || []).filter((keyword) => keyword.selected).length;
          const isExpanded = expandedCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggleCategory(isExpanded ? null : category.id)}
              style={categoryChip(isExpanded)}
            >
              <span>{category.name}</span>
              <span style={countChip}>{selectedCount}</span>
              <span style={microStatus}>{category.status || "à explorer"}</span>
              <span style={{ fontSize: 10 }}>{isExpanded ? "▾" : "▸"}</span>
            </button>
          );
        })}
      </div>

      {compactCategories.map((category) => {
        if (expandedCategoryId !== category.id) return null;
        const hints = buildDecisionHints(category);
        const draftValue = drafts[category.id] || "";

        return (
          <div key={category.id} style={expandedPanel}>
            <div style={expandedTopRow}>
              <div style={expandedTitle}>{category.name}</div>
              <select
                value={category.status || "à explorer"}
                onChange={(event) => onUpdateStatus(category.id, event.target.value)}
                style={compactSelect}
              >
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div style={subEyebrow}>Mots-clés</div>
            <div style={keywordWrap}>
              {(category.keywords || []).map((keyword) => (
                <button
                  key={keyword.id}
                  type="button"
                  onClick={() => onToggleKeyword(category.id, keyword.id)}
                  style={keywordChip(keyword.selected)}
                >
                  {keyword.label}
                </button>
              ))}
              <div style={inlineKeywordAdd}>
                <input
                  value={draftValue}
                  onChange={(event) => setDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))}
                  placeholder="+ mot-clé"
                  style={miniInput}
                />
                <button
                  type="button"
                  style={ghostBtn}
                  onClick={() => {
                    onAddKeyword(category.id, draftValue);
                    setDrafts((prev) => ({ ...prev, [category.id]: "" }));
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={impactRow}>
              <span style={impactLabel}>Impact</span>
              <div style={impactHints}>
                {hints.map((hint) => <span key={hint} style={impactHintChip}>{hint}</span>)}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

const panel = { background: "#ffffff", border: "1px solid #dbe4f0", borderRadius: 14, padding: 12, display: "grid", gap: 10 };
const headerRow = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start", flexWrap: "wrap" };
const eyebrow = { fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 };
const title = { margin: 0, fontSize: 16, fontWeight: 900, color: "#17376a" };
const inlineAddWrap = { display: "flex", gap: 6, alignItems: "center" };
const compactInput = { height: 30, borderRadius: 999, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12, minWidth: 170 };
const ghostBtn = { height: 30, padding: "0 10px", borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const chipRail = { display: "flex", flexWrap: "wrap", gap: 8 };
function categoryChip(active) {
  return {
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: active ? "1px solid #bfd2f3" : "1px solid #dbe4f0",
    background: active ? "#f7fbff" : "#ffffff",
    color: "#17376a",
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  };
}
const countChip = { minWidth: 18, height: 18, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#edf2ff", color: "#3156a3", fontSize: 10, fontWeight: 800 };
const microStatus = { fontSize: 10, color: "#7c8aa2" };
const expandedPanel = { display: "grid", gap: 8, border: "1px solid #e7edf7", borderRadius: 12, background: "#fbfdff", padding: 10 };
const expandedTopRow = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" };
const expandedTitle = { fontSize: 14, fontWeight: 900, color: "#17376a" };
const compactSelect = { height: 28, borderRadius: 999, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12 };
const subEyebrow = { fontSize: 11, fontWeight: 700, color: "#68778c" };
const keywordWrap = { display: "flex", flexWrap: "wrap", gap: 8 };
function keywordChip(active) {
  return {
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: active ? "1px solid #93c5fd" : "1px solid #d6deea",
    background: active ? "#eef6ff" : "#ffffff",
    color: active ? "#1d4b8f" : "#334155",
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  };
}
const inlineKeywordAdd = { display: "flex", gap: 6, alignItems: "center" };
const miniInput = { height: 28, borderRadius: 999, border: "1px solid #d6deea", padding: "0 10px", fontSize: 12, width: 120 };
const impactRow = { display: "grid", gap: 6 };
const impactLabel = { fontSize: 11, fontWeight: 800, color: "#68778c" };
const impactHints = { display: "flex", gap: 6, flexWrap: "wrap" };
const impactHintChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, border: "1px solid #ddd6fe", background: "#f5f3ff", color: "#6d28d9", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
