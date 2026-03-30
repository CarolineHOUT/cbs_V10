import React, { useMemo, useState } from "react";
import { usePatientSimulation } from "../context/PatientSimulationContext";
import { intakeCategoryTree } from "../data/intakeCategoryTree";
import AccordionSection from "./AccordionSection";

const panel = {
border: "1px solid #e6ebf2",
borderRadius: 16,
padding: 14,
background: "#ffffff",
display: "grid",
gap: 14,
};

const tabs = {
display: "flex",
gap: 8,
flexWrap: "wrap",
};

const tab = (active) => ({
height: 32,
padding: "0 12px",
borderRadius: 999,
border: active ? "1px solid #2563eb" : "1px solid #d7dee8",
background: active ? "#eff6ff" : "#ffffff",
color: active ? "#1d4ed8" : "#334155",
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
});

const chip = (active) => ({
padding: "10px",
borderRadius: 12,
border: active ? "1px solid #93c5fd" : "1px solid #e5e7eb",
background: active ? "#eff6ff" : "#ffffff",
fontSize: 12,
fontWeight: active ? 800 : 600,
cursor: "pointer",
textAlign: "left",
});

const summaryWrap = {
border: "1px solid #e6ebf2",
borderRadius: 14,
padding: 12,
background: "#fbfcfe",
display: "grid",
gap: 8,
};

const summaryChips = {
display: "flex",
gap: 8,
flexWrap: "wrap",
};

const summaryChip = {
minHeight: 28,
display: "inline-flex",
alignItems: "center",
padding: "0 10px",
borderRadius: 999,
background: "#eef4ff",
border: "1px solid #d6e4ff",
color: "#1d4b8f",
fontSize: 11,
fontWeight: 800,
};

const categoryGrid = {
display: "flex",
flexWrap: "wrap",
gap: 8,
};

const commandBar = {
border: "1px solid #dbe7ff",
borderRadius: 14,
padding: 12,
background: "#f8fbff",
display: "grid",
gap: 10,
};

const commandRow = {
display: "flex",
gap: 8,
flexWrap: "wrap",
};

const commandButton = (kind = "secondary") => {
const map = {
primary: {
background: "#1d4b8f",
color: "#ffffff",
border: "1px solid #1d4b8f",
},
secondary: {
background: "#ffffff",
color: "#334155",
border: "1px solid #d6deea",
},
danger: {
background: "#fff1f0",
color: "#b42318",
border: "1px solid #f3c7c1",
},
success: {
background: "#edf8f2",
color: "#237a53",
border: "1px solid #c8e8d3",
},
};

return {
minHeight: 30,
padding: "0 10px",
borderRadius: 999,
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
...(map[kind] || map.secondary),
};
};

function flattenSelections(selections = {}) {
const rows = [];

Object.entries(selections || {}).forEach(([domain, categories]) => {
if (!categories || typeof categories !== "object") return;

Object.entries(categories).forEach(([category, items]) => {
if (!Array.isArray(items)) return;

items.forEach((label) => {
rows.push({
domain,
category,
label,
});
});
});
});

return rows;
}

function cloneDomainSelections(sourceDomainSelections = {}) {
const next = {};

Object.entries(sourceDomainSelections || {}).forEach(([category, items]) => {
next[category] = Array.isArray(items) ? [...items] : [];
});

return next;
}

export default function CopiloteSituationPanel({ patient }) {
const { updatePatient } = usePatientSimulation();

const intakeSelections = patient?.intakeSelections || {};
const staySelections = patient?.staySelections || {};

const domains = Object.keys(intakeCategoryTree);
const [activeDomain, setActiveDomain] = useState(domains[0] || "");
const [showCheckedOnly, setShowCheckedOnly] = useState(false);

function toggleKeyword(domain, category, keyword) {
const domainData = staySelections[domain] || {};
const categoryData = domainData[category] || [];

const exists = categoryData.includes(keyword);

const updatedCategory = exists
? categoryData.filter((k) => k !== keyword)
: [...categoryData, keyword];

const updated = {
...staySelections,
[domain]: {
...domainData,
[category]: updatedCategory,
},
};

updatePatient(patient.id, { staySelections: updated });
}

function clearDomain(domain) {
const updated = {
...staySelections,
[domain]: {},
};

updatePatient(patient.id, { staySelections: updated });
}

function copyIntakeToStayForDomain(domain) {
const intakeDomain = intakeSelections?.[domain] || {};

const updated = {
...staySelections,
[domain]: cloneDomainSelections(intakeDomain),
};

updatePatient(patient.id, { staySelections: updated });
}

function goToNextDomain() {
const currentIndex = domains.indexOf(activeDomain);
const nextIndex =
currentIndex >= 0 && currentIndex < domains.length - 1 ? currentIndex + 1 : 0;
setActiveDomain(domains[nextIndex] || domains[0] || "");
}

const categories = intakeCategoryTree[activeDomain] || {};

const intakeRows = useMemo(
() => flattenSelections(intakeSelections),
[intakeSelections]
);

const stayRows = useMemo(
() => flattenSelections(staySelections),
[staySelections]
);

const allCheckedRows = useMemo(() => {
return [
...intakeRows.map((row) => ({ ...row, source: "recueil" })),
...stayRows.map((row) => ({ ...row, source: "séjour" })),
];
}, [intakeRows, stayRows]);

const activeCategoryCount = useMemo(() => {
const set = new Set(
allCheckedRows.map((row) => `${row.domain}__${row.category}`)
);
return set.size;
}, [allCheckedRows]);

const activeDomainCheckedCount = useMemo(() => {
return Object.values(staySelections?.[activeDomain] || {}).reduce(
(acc, items) => acc + (Array.isArray(items) ? items.length : 0),
0
);
}, [staySelections, activeDomain]);

const filteredCategories = useMemo(() => {
if (!showCheckedOnly) return categories;

const next = {};

Object.entries(categories).forEach(([category, keywords]) => {
const selectedItems = staySelections?.[activeDomain]?.[category] || [];
if (selectedItems.length > 0) {
next[category] = keywords;
}
});

return next;
}, [categories, showCheckedOnly, staySelections, activeDomain]);

return (
<div style={panel}>
<div style={{ fontWeight: 900, color: "#17376a" }}>
Recueil et évolution de la situation
</div>

<div style={commandBar}>
<div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
Commandes recueil
</div>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
{activeDomainCheckedCount} élément(s) coché(s) dans le domaine actif •{" "}
{allCheckedRows.length} élément(s) coché(s) au total
</div>

<div style={commandRow}>
<button
type="button"
style={commandButton(showCheckedOnly ? "primary" : "secondary")}
onClick={() => setShowCheckedOnly((prev) => !prev)}
>
{showCheckedOnly ? "Voir tout" : "Voir seulement le coché"}
</button>

<button
type="button"
style={commandButton("success")}
onClick={() => copyIntakeToStayForDomain(activeDomain)}
>
Reprendre le recueil initial
</button>

<button
type="button"
style={commandButton("danger")}
onClick={() => clearDomain(activeDomain)}
>
Vider ce domaine
</button>

<button
type="button"
style={commandButton("secondary")}
onClick={goToNextDomain}
>
Domaine suivant
</button>
</div>
</div>

<div style={summaryWrap}>
<div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
Synthèse des cases cochées
</div>

<div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
{activeCategoryCount} catégorie(s) active(s) • {allCheckedRows.length} élément(s) coché(s)
</div>

{allCheckedRows.length === 0 ? (
<div style={{ fontSize: 12, color: "#94a3b8" }}>
Aucun élément coché pour le moment.
</div>
) : (
<div style={summaryChips}>
{allCheckedRows.map((item, index) => (
<span
key={`${item.source}-${item.domain}-${item.category}-${item.label}-${index}`}
style={summaryChip}
title={`${item.source} • ${item.domain} • ${item.category}`}
>
{item.label}
</span>
))}
</div>
)}
</div>

<div style={tabs}>
{domains.map((domain) => {
const domainSelectedCount = Object.values(staySelections?.[domain] || {}).reduce(
(acc, keywords) => acc + (Array.isArray(keywords) ? keywords.length : 0),
0
);

return (
<button
key={domain}
type="button"
style={tab(domain === activeDomain)}
onClick={() => setActiveDomain(domain)}
>
{domain}
{domainSelectedCount > 0 ? ` (${domainSelectedCount})` : ""}
</button>
);
})}
</div>

<div style={{ display: "grid", gap: 10 }}>
{Object.entries(filteredCategories).length === 0 ? (
<div
style={{
border: "1px solid #e6ebf2",
borderRadius: 12,
padding: 12,
background: "#fbfcfe",
fontSize: 12,
color: "#94a3b8",
}}
>
Aucun élément à afficher dans ce mode.
</div>
) : (
Object.entries(filteredCategories).map(([category, keywords]) => {
const selectedItems = staySelections?.[activeDomain]?.[category] || [];
const intakeItems = intakeSelections?.[activeDomain]?.[category] || [];
const selectedCount = selectedItems.length;

return (
<AccordionSection
key={category}
title={category}
subtitle="Cliquer pour afficher les libellés"
badge={`${selectedCount} sélectionné(s)`}
defaultOpen={false}
>
<div style={{ display: "grid", gap: 10 }}>
{intakeItems.length > 0 ? (
<div style={{ fontSize: 11, color: "#64748b" }}>
Recueil initial : {intakeItems.join(" • ")}
</div>
) : null}

<div style={categoryGrid}>
{keywords.map((keyword) => {
const active = selectedItems.includes(keyword);

return (
<button
key={keyword}
type="button"
style={chip(active)}
onClick={() => toggleKeyword(activeDomain, category, keyword)}
>
{keyword}
</button>
);
})}
</div>
</div>
</AccordionSection>
);
})
)}
</div>
</div>
);
}
