import React, { useMemo, useState } from "react";
import { usePatientIntake } from "../context/PatientIntakeContext";
import { intakeCategoryTree } from "../data/intakeCategoryTree";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferPopulation(service, age) {
  const s = normalize(service);
  const n = Number(age || 0);
  if (s.includes("pedia") || s.includes("pediatr") || (n > 0 && n < 18)) return "Pédiatrie";
  if (s.includes("mater") || s.includes("obstet") || s.includes("sage")) return "Maternité";
  return "Adultes";
}

function ensureWorkflowKeywords(tree, population) {
  if (population !== "Pédiatrie") return tree;
  const next = { ...tree };
  const social = [...(next.Social || [])];
  if (!social.includes("Enfant pris en charge ASE")) social.unshift("Enfant pris en charge ASE");
  next.Social = social;
  return next;
}

function buildHints(categoryLabel, selectedLabels) {
  const labels = (selectedLabels || []).map((item) => normalize(item));
  const hints = [];
  if (labels.some((item) => item.includes("pansement") || item.includes("perfusion") || item.includes("surveillance"))) {
    hints.push("Oriente HDJ / IDEL / soins techniques");
  }
  if (labels.some((item) => item.includes("apa") || item.includes("mdph") || item.includes("pch") || item.includes("droits"))) {
    hints.push("Déclenche les formulaires administratifs utiles");
  }
  if (labels.some((item) => item.includes("logement") || item.includes("precar") || item.includes("isolement") || item.includes("aidant"))) {
    hints.push("Renforce la coordination sociale");
  }
  if (labels.some((item) => item.includes("ase") || item.includes("protection") || item.includes("information preoccupante"))) {
    hints.push("Peut déclencher le workflow ASE");
  }
  if (!hints.length) hints.push(`${categoryLabel} alimente la décision de sortie`);
  return hints;
}

export default function IntakeCategorySelector() {
  const { patientIntake, updateField } = usePatientIntake();
  const intakeSelections = patientIntake?.intakeSelections || {};
  const identity = patientIntake?.identity || {};
  const population = inferPopulation(identity.service, identity.age);

  const tree = useMemo(() => {
    const source = intakeCategoryTree[population] || intakeCategoryTree.Adultes || {};
    return ensureWorkflowKeywords(source, population);
  }, [population]);

  const categoryEntries = useMemo(() => Object.entries(tree), [tree]);
  const [openCategory, setOpenCategory] = useState(categoryEntries?.[0]?.[0] || "");
  const [drafts, setDrafts] = useState({});

  function selectedItemsFor(category) {
    return intakeSelections?.Parcours?.[category] || [];
  }

  function toggleKeyword(category, keyword) {
    const current = intakeSelections?.Parcours || {};
    const currentItems = current[category] || [];
    const nextItems = currentItems.includes(keyword)
      ? currentItems.filter((item) => item !== keyword)
      : [...currentItems, keyword];
    updateField("intakeSelections", "Parcours", { ...current, [category]: nextItems });
  }

  function addKeyword(category) {
    const value = String(drafts[category] || "").trim();
    if (!value) return;
    const current = intakeSelections?.Parcours || {};
    const currentItems = current[category] || [];
    if (currentItems.includes(value)) return;
    updateField("intakeSelections", "Parcours", { ...current, [category]: [...currentItems, value] });
    setDrafts((prev) => ({ ...prev, [category]: "" }));
  }

  const selectedFlat = useMemo(
    () =>
      categoryEntries.flatMap(([category]) =>
        (selectedItemsFor(category) || []).map((label) => ({ category, label }))
      ),
    [categoryEntries, intakeSelections]
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <section style={summaryCard}>
        <div style={headerRow}>
          <div>
            <div style={title}>Recueil DUO</div>
            <div style={subtitle}>Toutes les catégories métier sont conservées. Les mots-clés choisis remontent ensuite dans le copilote.</div>
          </div>
          <span style={populationBadge}>{population}</span>
        </div>
        <div style={selectedWrap}>
          {selectedFlat.length ? (
            selectedFlat.map((item, index) => (
              <span key={`${item.category}-${item.label}-${index}`} style={selectedChip}>
                {item.label}
              </span>
            ))
          ) : (
            <span style={emptyText}>Aucun mot-clé sélectionné.</span>
          )}
        </div>
      </section>

      <section style={summaryCard}>
        <div style={chipRail}>
          {categoryEntries.map(([category]) => {
            const selected = selectedItemsFor(category);
            const open = openCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setOpenCategory(open ? "" : category)}
                style={categoryChip(open)}
              >
                <span>{category}</span>
                <span style={countChip}>{selected.length}</span>
                <span style={chevron}>{open ? "▾" : "▸"}</span>
              </button>
            );
          })}
        </div>

        {categoryEntries.map(([category, keywords]) => {
          if (openCategory !== category) return null;
          const selected = selectedItemsFor(category);
          const hints = buildHints(category, selected);
          return (
            <div key={category} style={expandedPanel}>
              <div style={expandedHeader}>
                <div style={expandedTitle}>{category}</div>
                <div style={categoryMeta}>{selected.length} mot{selected.length > 1 ? "s" : ""}-clé actif{selected.length > 1 ? "s" : ""}</div>
              </div>
              <div style={keywordWrap}>
                {keywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => toggleKeyword(category, keyword)}
                    style={keywordChip(selected.includes(keyword))}
                  >
                    {keyword}
                  </button>
                ))}
                <div style={inlineAddWrap}>
                  <input
                    value={drafts[category] || ""}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [category]: event.target.value }))}
                    placeholder="Ajouter un mot-clé"
                    style={miniInput}
                  />
                  <button type="button" onClick={() => addKeyword(category)} style={miniBtn}>Ajouter</button>
                </div>
              </div>
              <div style={impactRow}>
                {hints.map((hint) => (
                  <span key={hint} style={impactChip}>{hint}</span>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

const summaryCard = {
  border: "1px solid #dde5f0",
  borderRadius: 12,
  background: "#fff",
  padding: 10,
  display: "grid",
  gap: 8,
};
const headerRow = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start", flexWrap: "wrap" };
const title = { fontSize: 14, fontWeight: 900, color: "#17376a" };
const subtitle = { fontSize: 12, color: "#66758c", maxWidth: 760 };
const populationBadge = { minHeight: 22, padding: "0 8px", borderRadius: 999, background: "#f3f7ff", color: "#3156a3", border: "1px solid #d6e4ff", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
const selectedWrap = { display: "flex", flexWrap: "wrap", gap: 6 };
const selectedChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, border: "1px solid #d6e4ff", background: "#eef4ff", color: "#1d4b8f", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center" };
const emptyText = { fontSize: 12, color: "#94a3b8" };
const chipRail = { display: "flex", gap: 8, flexWrap: "wrap" };
const chevron = { fontSize: 10, color: "#475569" };
function categoryChip(active) {
  return {
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: active ? "1px solid #9fc0ff" : "1px solid #dbe4f0",
    background: active ? "#f6f9ff" : "#fff",
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
const expandedPanel = { display: "grid", gap: 8, borderTop: "1px solid #eef2f7", paddingTop: 8 };
const expandedHeader = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" };
const expandedTitle = { fontSize: 13, fontWeight: 900, color: "#17376a" };
const categoryMeta = { fontSize: 11, color: "#64748b" };
const keywordWrap = { display: "flex", gap: 6, flexWrap: "wrap" };
function keywordChip(active) {
  return {
    minHeight: 26,
    padding: "0 8px",
    borderRadius: 999,
    border: active ? "1px solid #93c5fd" : "1px solid #d6deea",
    background: active ? "#eef6ff" : "#fff",
    color: active ? "#1d4b8f" : "#334155",
    fontSize: 11,
    fontWeight: active ? 800 : 700,
    cursor: "pointer",
  };
}
const inlineAddWrap = { display: "flex", gap: 6, alignItems: "center" };
const miniInput = { height: 26, borderRadius: 999, border: "1px solid #d6deea", padding: "0 10px", fontSize: 11, width: 148 };
const miniBtn = { height: 26, padding: "0 10px", borderRadius: 999, border: "1px solid #d6deea", background: "#fff", color: "#17376a", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const impactRow = { display: "flex", gap: 6, flexWrap: "wrap" };
const impactChip = { minHeight: 22, padding: "0 8px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 11, display: "inline-flex", alignItems: "center" };
