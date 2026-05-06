import React, { useMemo, useState } from "react";
import { buildHDJTerritorialDecision } from "../copilote/hdjTerritorialIntelligence";

const styles = {
shell: {
border: "1px solid #dbe4f0",
borderRadius: 22,
padding: 16,
background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
display: "grid",
gap: 14,
},
header: {
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "flex-start",
},
title: {
fontSize: 20,
fontWeight: 900,
color: "#0f172a",
},
subtitle: {
fontSize: 13,
color: "#64748b",
marginTop: 4,
},
scoreBox: {
minWidth: 120,
borderRadius: 18,
padding: 12,
background: "#17376a",
color: "white",
textAlign: "center",
},
score: {
fontSize: 30,
fontWeight: 900,
lineHeight: 1,
},
tabs: {
display: "flex",
flexWrap: "wrap",
gap: 8,
},
tab: {
border: "1px solid #dbe4f0",
borderRadius: 999,
padding: "8px 12px",
background: "white",
cursor: "pointer",
fontWeight: 800,
fontSize: 12,
},
tabActive: {
background: "#eef4ff",
color: "#17376a",
border: "1px solid #bfd3ff",
},
grid2: {
display: "grid",
gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
gap: 12,
},
card: {
border: "1px solid #e2e8f0",
borderRadius: 18,
padding: 14,
background: "#ffffff",
},
cardTitle: {
fontWeight: 900,
color: "#0f172a",
marginBottom: 6,
},
small: {
color: "#64748b",
fontSize: 13,
lineHeight: 1.4,
},
chipWrap: {
display: "flex",
flexWrap: "wrap",
gap: 6,
marginTop: 8,
},
chip: {
borderRadius: 999,
background: "#eef4ff",
color: "#1d4ed8",
border: "1px solid #bfdbfe",
padding: "5px 9px",
fontSize: 11,
fontWeight: 800,
},
amberChip: {
background: "#fef3c7",
color: "#92400e",
border: "1px solid #fde68a",
},
greenChip: {
background: "#dcfce7",
color: "#166534",
border: "1px solid #bbf7d0",
},
button: {
border: "1px solid #17376a",
background: "#17376a",
color: "white",
borderRadius: 12,
padding: "9px 12px",
fontWeight: 900,
cursor: "pointer",
},
secondaryButton: {
border: "1px solid #dbe4f0",
background: "white",
color: "#17376a",
borderRadius: 12,
padding: "9px 12px",
fontWeight: 900,
cursor: "pointer",
},
};

export default function HDJTerritorialCommandCenter({
patient,
activeKeywords = [],
selectedOrientation = "",
hdjForm = {},
lengthOfStay = 0,
isMedicallyReady = false,
targetDate = "",
onApplyPathway,
onSelectOffer,
}) {
const [tab, setTab] = useState("patient");

const decision = useMemo(
() =>
buildHDJTerritorialDecision({
patient,
activeKeywords,
selectedOrientation,
hdjForm,
lengthOfStay,
isMedicallyReady,
targetDate,
}),
[
patient,
activeKeywords,
selectedOrientation,
hdjForm,
lengthOfStay,
isMedicallyReady,
targetDate,
]
);

const { opportunity, needs, pathways, offers } = decision;
console.log("KEYWORDS HDJ", activeKeywords);
console.log("HDJ OPPORTUNITY", opportunity);


{opportunity && (
<div style={styles.infoCard}>
<div style={styles.cardTitle}>Pourquoi penser HDJ ?</div>
{opportunity.reasons?.length > 0 && (
<div>
{opportunity.reasons.map((r, i) => (
<span key={i} style={styles.tag}>{r}</span>
))}
</div>
)}

<div style={styles.small}>
Mots-clés détectés :
{activeKeywords.map((k, i) => (
<span key={i} style={styles.tag}>{k}</span>
))}
</div>

{offers.length > 0 && (
<div style={styles.infoCard}>
<div style={styles.cardSubtitle}>Offres recommandées</div>

{offers.map((o, i) => (
<div key={i}>
{o.offer.label}
</div>
))}
</div>
)}

{opportunity.score > 0 ? (
<div style={styles.small}>
{opportunity.reasons?.length > 0
? opportunity.reasons.join(" • ")
: "Le patient présente des critères compatibles avec un parcours HDJ"}
</div>
) : (
<div style={styles.smallNote}>
Aucun signal fort détecté (option secondaire possible)
</div>
)}
</div>
)}



return (
<div style={styles.shell}>
<div style={styles.header}>
<div>
<div style={styles.title}>Régulation intelligente HDJ territoriale</div>
<div style={styles.subtitle}>
Transformer les besoins réels du territoire en parcours HDJ actionnables.
</div>
</div>

<div style={styles.scoreBox}>
<div style={styles.score}>{opportunity.score}</div>
<div style={{ fontSize: 12, fontWeight: 800 }}>
Opportunité {opportunity.level}
</div>
</div>
</div>

<div style={styles.tabs}>
{[
["patient", "Patient"],
["parcours", "Parcours HDJ"],
["offres", "Offres par CH"],
["territoire", "Lecture ARS"],
].map(([id, label]) => (
<button
key={id}
type="button"
onClick={() => setTab(id)}
style={{
...styles.tab,
...(tab === id ? styles.tabActive : {}),
}}
>
{label}
</button>
))}
</div>

{tab === "patient" && (
<div style={styles.grid2}>
<div style={styles.card}>
<div style={styles.cardTitle}>Pourquoi penser HDJ ?</div>
{opportunity.reasons.length ? (
<div style={styles.chipWrap}>
{opportunity.reasons.map((reason) => (
<span key={reason} style={styles.chip}>
{reason}
</span>
))}
</div>
) : (
<div style={styles.small}>
Aucun signal fort détecté. Le HDJ peut rester une option secondaire.
</div>
)}
</div>

<div style={styles.card}>
<div style={styles.cardTitle}>Besoins territoriaux concernés</div>
{needs.length ? (
needs.slice(0, 3).map((need) => (
<div key={need.id} style={{ marginBottom: 10 }}>
<div style={{ fontWeight: 800 }}>{need.label}</div>
<div style={styles.small}>{need.description}</div>
<div style={styles.chipWrap}>
{need.matched.slice(0, 4).map((m) => (
<span key={m} style={{ ...styles.chip, ...styles.greenChip }}>
{m}
</span>
))}
</div>
</div>
))
) : (
<div style={styles.small}>Aucun besoin territorial prioritaire reconnu.</div>
)}
</div>
</div>
)}

{tab === "parcours" && (
<div style={{ display: "grid", gap: 10 }}>
{pathways.length ? (
pathways.slice(0, 5).map(({ pathway, score, reasons }) => (
<div key={pathway.id} style={styles.card}>
<div style={styles.header}>
<div>
<div style={styles.cardTitle}>{pathway.title}</div>
<div style={styles.small}>{pathway.promise}</div>
</div>
<span style={{ ...styles.chip, ...styles.amberChip }}>Score {score}</span>
</div>

<div style={styles.chipWrap}>
{reasons.slice(0, 6).map((reason) => (
<span key={reason} style={styles.chip}>
{reason}
</span>
))}
</div>

<div style={{ marginTop: 10, ...styles.small }}>
<strong>Rythme :</strong> {pathway.rhythm.frequency} ·{" "}
{pathway.rhythm.duration}
</div>

<div style={styles.chipWrap}>
{pathway.coreActs.slice(0, 6).map((act) => (
<span key={act} style={{ ...styles.chip, ...styles.greenChip }}>
{act}
</span>
))}
</div>

<div style={{ marginTop: 10 }}>
<button
type="button"
style={styles.button}
onClick={() => onApplyPathway?.(pathway)}
>
Appliquer ce parcours
</button>
</div>
</div>
))
) : (
<div style={styles.card}>
<div style={styles.small}>Aucun parcours HDJ territorial compatible.</div>
</div>
)}
</div>
)}

{tab === "offres" && (
<div style={{ display: "grid", gap: 10 }}>
{offers.length ? (
offers.slice(0, 6).map(({ offer, score, matchedPathways }) => (
<div key={offer.id} style={styles.card}>
<div style={styles.header}>
<div>
<div style={styles.cardTitle}>{offer.title}</div>
<div style={styles.small}>
{offer.hospital} · {offer.city} · {offer.territory}
</div>
</div>
<span style={styles.chip}>Compatibilité {score}</span>
</div>

<div style={styles.small}>{offer.note}</div>

<div style={styles.chipWrap}>
<span style={{ ...styles.chip, ...styles.amberChip }}>
{offer.maturity}
</span>
<span style={styles.chip}>{offer.delayLabel}</span>
{offer.tags.slice(0, 5).map((tag) => (
<span key={tag} style={styles.chip}>
{tag}
</span>
))}
</div>

<div style={{ marginTop: 10, ...styles.small }}>
<strong>Parcours couverts :</strong>{" "}
{matchedPathways.map((p) => p.title).join(" · ")}
</div>

<div style={{ marginTop: 10 }}>
<button
type="button"
style={styles.button}
onClick={() => onSelectOffer?.(offer)}
>
Préparer une demande vers ce CH
</button>
</div>
</div>
))
) : (
<div style={styles.card}>
<div style={styles.small}>Aucune offre territoriale compatible.</div>
</div>
)}
</div>
)}

{tab === "territoire" && (
<div style={styles.grid2}>
{needs.slice(0, 6).map((need) => (
<div key={need.id} style={styles.card}>
<div style={styles.cardTitle}>{need.label}</div>
<div style={styles.small}>{need.arsAngle}</div>
<div style={{ marginTop: 8, ...styles.small }}>{need.description}</div>
</div>
))}

<div style={styles.card}>
<div style={styles.cardTitle}>Message ARS</div>
<div style={styles.small}>
Ce module ne crée pas un annuaire supplémentaire : il transforme les
besoins patients repérés dans les services en parcours HDJ territoriaux,
comparables, traçables et pilotables.
</div>
</div>
</div>
)}
</div>
);
}
