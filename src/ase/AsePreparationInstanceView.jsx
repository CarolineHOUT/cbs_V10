import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { AppShell } from "../components/AppShell";
import { usePatientSimulation } from "../context/PatientSimulationContext";

function safeValue(value, fallback = "") {
return value ?? fallback;
}

const inputStyle = {
minHeight: 38,
borderRadius: 10,
border: "1px solid #d6deea",
padding: "8px 10px",
fontSize: 13,
width: "100%",
boxSizing: "border-box",
background: "#fff",
};

const textareaStyle = {
...inputStyle,
minHeight: 96,
resize: "vertical",
};

const readOnlyStyle = {
...inputStyle,
background: "#f8fafc",
color: "#475569",
};

const cardStyle = {
border: "1px solid #e4ebf5",
borderRadius: 16,
background: "#fff",
padding: 16,
display: "grid",
gap: 14,
};

const grid2 = {
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 14,
};

const grid3 = {
display: "grid",
gridTemplateColumns: "repeat(3, 1fr)",
gap: 14,
};

const primaryBtn = {
minHeight: 38,
borderRadius: 10,
border: "1px solid #17376a",
background: "#17376a",
color: "#fff",
fontSize: 13,
fontWeight: 800,
padding: "0 14px",
cursor: "pointer",
};

const ghostBtn = {
minHeight: 38,
borderRadius: 10,
border: "1px solid #d6deea",
background: "#fff",
color: "#17376a",
fontSize: 13,
fontWeight: 800,
padding: "0 14px",
cursor: "pointer",
};

const chipsWrap = {
display: "flex",
gap: 8,
flexWrap: "wrap",
};

const chipOptionStyle = (active) => ({
border: active ? "1px solid #17376a" : "1px solid #d6deea",
background: active ? "#eef4ff" : "#fff",
color: active ? "#17376a" : "#334155",
borderRadius: 999,
padding: "6px 10px",
fontSize: 12,
fontWeight: 700,
cursor: "pointer",
});

function sectionTitle(title) {
return (
<div
style={{
fontSize: 12,
fontWeight: 900,
color: "#17376a",
textTransform: "uppercase",
letterSpacing: 0.35,
}}
>
{title}
</div>
);
}

function fieldLabel(label) {
return (
<label
style={{
fontSize: 12,
fontWeight: 700,
color: "#475569",
}}
>
{label}
</label>
);
}

export default function AsePreparationInstanceView() {
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const patientId = searchParams.get("patientId");

const { getPatientById } = usePatientSimulation();

const patient = useMemo(() => {
return patientId ? getPatientById(patientId) : null;
}, [getPatientById, patientId]);

const [form, setForm] = useState({
structureRepondante: "",
agentNom: "",
agentPrenom: "",
dateSaisie: new Date().toISOString().slice(0, 10),
autoriteParentale: "",
droitsVisite: "",
lieuAccueil: "",
compteRendu: "",
acteursImpliques: [],
canalEnvoiPrestataire: "Portail CARABBAS",
prestataireNom: "",
prestataireContact: "",
statut: "Brouillon",
dateEnvoiPrestataire: "",
commentaireSuivi: "",
});

function updateField(field, value) {
setForm((prev) => ({ ...prev, [field]: value }));
}

function toggleArrayValue(field, value) {
setForm((prev) => {
const current = prev[field] || [];
const exists = current.includes(value);
return {
...prev,
[field]: exists
? current.filter((item) => item !== value)
: [...current, value],
};
});
}

function saveDraft() {
alert("Préparation d’instance ASE enregistrée en brouillon.");
}

function markReady() {
setForm((prev) => ({ ...prev, statut: "Prêt à envoyer" }));
alert("Préparation d’instance ASE marquée prête à envoyer.");
}

function sendToProvider() {
setForm((prev) => ({
...prev,
statut: "Envoyé au prestataire",
dateEnvoiPrestataire: new Date().toISOString().slice(0, 10),
}));
alert("Préparation d’instance ASE envoyée au prestataire.");
}

return (
<AppShell header={<AppHeader subtitle="ASE · Préparation d’instance" />}>
<div
style={{
maxWidth: 1280,
margin: "0 auto",
width: "100%",
display: "grid",
gap: 12,
}}
>
<section
style={{
border: "1px solid #dbe7ff",
borderRadius: 16,
background: "#fff",
padding: 16,
display: "grid",
gap: 6,
}}
>
<div style={{ fontSize: 18, fontWeight: 900, color: "#17376a" }}>
Préparation d’instance ASE
</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
Document orienté prestataire, avec suivi d’envoi et traçabilité.
</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<span style={statusChip(form.statut)}>{form.statut}</span>
{patient ? (
<span style={neutralChip}>
Patient · {patient.nom} {patient.prenom}
</span>
) : null}
</div>
</section>

<section style={cardStyle}>
{sectionTitle("Identité et cadre de saisie")}

<div style={grid3}>
<div>
{fieldLabel("INS")}
<input value={safeValue(patient?.ins)} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Prénom enfant")}
<input value={safeValue(patient?.prenom)} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Nom enfant")}
<input value={safeValue(patient?.nom)} readOnly style={readOnlyStyle} />
</div>
</div>

<div style={grid3}>
<div>
{fieldLabel("Structure répondante")}
<input
value={form.structureRepondante}
onChange={(e) => updateField("structureRepondante", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Nom agent")}
<input
value={form.agentNom}
onChange={(e) => updateField("agentNom", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Prénom agent")}
<input
value={form.agentPrenom}
onChange={(e) => updateField("agentPrenom", e.target.value)}
style={inputStyle}
/>
</div>
</div>

<div style={grid3}>
<div>
{fieldLabel("Date de saisie")}
<input value={form.dateSaisie} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Autorité parentale")}
<input
value={form.autoriteParentale}
onChange={(e) => updateField("autoriteParentale", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Droits de visite")}
<input
value={form.droitsVisite}
onChange={(e) => updateField("droitsVisite", e.target.value)}
style={inputStyle}
/>
</div>
</div>
</section>

<section style={cardStyle}>
{sectionTitle("Contenu de l'instance")}

<div style={grid2}>
<div>
{fieldLabel("Lieu d'accueil")}
<input
value={form.lieuAccueil}
onChange={(e) => updateField("lieuAccueil", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Acteurs impliqués")}
<div style={chipsWrap}>
{[
"ASE",
"Équipe hospitalière",
"Pédopsychiatrie",
"Prestataire",
"Structures territoriales",
"Établissement scolaire",
].map((item) => (
<button
key={item}
type="button"
style={chipOptionStyle(form.acteursImpliques.includes(item))}
onClick={() => toggleArrayValue("acteursImpliques", item)}
>
{item}
</button>
))}
</div>
</div>
</div>

<div>
{fieldLabel("Compte rendu structuré")}
<textarea
value={form.compteRendu}
onChange={(e) => updateField("compteRendu", e.target.value)}
style={textareaStyle}
/>
</div>
</section>

<section style={cardStyle}>
{sectionTitle("Envoi au prestataire et suivi")}

<div style={grid3}>
<div>
{fieldLabel("Nom du prestataire")}
<input
value={form.prestataireNom}
onChange={(e) => updateField("prestataireNom", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Contact prestataire")}
<input
value={form.prestataireContact}
onChange={(e) => updateField("prestataireContact", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Canal d'envoi")}
<select
value={form.canalEnvoiPrestataire}
onChange={(e) => updateField("canalEnvoiPrestataire", e.target.value)}
style={inputStyle}
>
<option>Portail CARABBAS</option>
<option>Email sécurisé</option>
<option>MSSanté</option>
</select>
</div>
</div>

<div style={grid2}>
<div>
{fieldLabel("Date d'envoi au prestataire")}
<input value={form.dateEnvoiPrestataire} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Commentaire de suivi")}
<textarea
value={form.commentaireSuivi}
onChange={(e) => updateField("commentaireSuivi", e.target.value)}
style={textareaStyle}
/>
</div>
</div>
</section>

<section
style={{
...cardStyle,
display: "flex",
justifyContent: "space-between",
alignItems: "center",
flexWrap: "wrap",
gap: 12,
}}
>
<button type="button" style={ghostBtn} onClick={() => navigate(-1)}>
Retour
</button>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button type="button" style={ghostBtn} onClick={saveDraft}>
Enregistrer brouillon
</button>
<button type="button" style={ghostBtn} onClick={markReady}>
Marquer prêt à envoyer
</button>
<button type="button" style={primaryBtn} onClick={sendToProvider}>
Envoyer au prestataire
</button>
</div>
</section>
</div>
</AppShell>
);
}

const neutralChip = {
minHeight: 26,
padding: "0 10px",
borderRadius: 999,
display: "inline-flex",
alignItems: "center",
fontSize: 11,
fontWeight: 800,
background: "#fff",
border: "1px solid #dbe4f0",
color: "#334155",
};

function statusChip(status) {
const tones = {
Brouillon: { background: "#fff", border: "1px solid #dbe4f0", color: "#334155" },
"Prêt à envoyer": { background: "#fff8e8", border: "1px solid #f6df9b", color: "#a16207" },
"Envoyé au prestataire": { background: "#edf8f2", border: "1px solid #c8e8d3", color: "#237a53" },
};

return {
minHeight: 26,
padding: "0 10px",
borderRadius: 999,
display: "inline-flex",
alignItems: "center",
fontSize: 11,
fontWeight: 800,
...(tones[status] || tones.Brouillon),
};
}
