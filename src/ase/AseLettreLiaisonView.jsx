import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { AppShell } from "../components/AppShell";
import { usePatientSimulation } from "../context/PatientSimulationContext";

function safeValue(value, fallback = "") {
return value ?? fallback;
}

function computeAge(dateNaissance) {
if (!dateNaissance) return "";
const birth = new Date(dateNaissance);
if (Number.isNaN(birth.getTime())) return "";
const today = new Date();
let age = today.getFullYear() - birth.getFullYear();
const m = today.getMonth() - birth.getMonth();
if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
age -= 1;
}
return age;
}

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
minHeight: 88,
resize: "vertical",
};

const readOnlyStyle = {
...inputStyle,
background: "#f8fafc",
color: "#475569",
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

export default function AseLettreLiaisonView() {
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const patientId = searchParams.get("patientId");

const { getPatientById } = usePatientSimulation();

const patient = useMemo(() => {
return patientId ? getPatientById(patientId) : null;
}, [getPatientById, patientId]);

const [form, setForm] = useState({
motifMedicalGeneral: [],
contexteMedicoSocial: [],
autonomieDependance: [],
pathologieLongCours: [],
vulnerabilitePsychosociale: [],
situationSociale: [],
continuiteParcours: [],
coordinationInterInstitutionnelle: [],
initiateurDemande: "",
cadreSante: "",
secretariat: "",
observationsNonMedicales: "",
dateSouhaiteeReunion: "",
diffusionCanal: "Portail CARABBAS",
diffusionDestinataires: [],
statut: "Brouillon",
});

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

function updateField(field, value) {
setForm((prev) => ({ ...prev, [field]: value }));
}

function saveDraft() {
alert("Brouillon Lettre de liaison ASE enregistré.");
}

function markReady() {
setForm((prev) => ({ ...prev, statut: "Prêt à diffuser" }));
alert("Lettre de liaison ASE marquée comme prête à diffuser.");
}

function send() {
setForm((prev) => ({ ...prev, statut: "Diffusée" }));
alert("Lettre de liaison ASE diffusée.");
}

const age = patient?.age || computeAge(patient?.dateNaissance);

return (
<AppShell header={<AppHeader subtitle="ASE · Lettre de liaison" />}>
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
Lettre de liaison ASE
</div>
<div style={{ fontSize: 13, color: "#64748b" }}>
Document hospitalier de liaison, structuré et diffusable selon les circuits autorisés.
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
{sectionTitle("Identité enfant / dossier")}

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

<div style={grid4}>
<div>
{fieldLabel("Date de naissance")}
<input value={safeValue(patient?.dateNaissance)} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Âge")}
<input value={safeValue(age)} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("Date d'entrée")}
<input value={safeValue(patient?.dateEntree)} readOnly style={readOnlyStyle} />
</div>
<div>
{fieldLabel("IPP / IEP (lecture seule interne)")}
<input value={safeValue(patient?.iep)} readOnly style={readOnlyStyle} />
</div>
</div>
</section>

<section style={cardStyle}>
{sectionTitle("Contenu structuré de la lettre")}
<ChecklistField
title="Motif médical général"
values={[
"Hospitalisation récente",
"Suivi pédiatrique à organiser",
"Situation de vulnérabilité globale",
"Sortie à sécuriser",
]}
selected={form.motifMedicalGeneral}
onToggle={(value) => toggleArrayValue("motifMedicalGeneral", value)}
/>

<ChecklistField
title="Contexte médico-social"
values={[
"Coordination sociale requise",
"Environnement familial fragile",
"Mesure ASE en cours",
"Multiplicité d'intervenants",
]}
selected={form.contexteMedicoSocial}
onToggle={(value) => toggleArrayValue("contexteMedicoSocial", value)}
/>

<ChecklistField
title="Autonomie / dépendance"
values={[
"Autonomie préservée",
"Aide partielle requise",
"Aide complète requise",
"Surveillance rapprochée",
]}
selected={form.autonomieDependance}
onToggle={(value) => toggleArrayValue("autonomieDependance", value)}
/>

<ChecklistField
title="Pathologie au long cours (non détaillée)"
values={[
"Pathologie chronique connue",
"Suivi spécialisé en cours",
"Surveillance régulière requise",
]}
selected={form.pathologieLongCours}
onToggle={(value) => toggleArrayValue("pathologieLongCours", value)}
/>

<ChecklistField
title="Vulnérabilité psychosociale"
values={[
"Isolement",
"Précarité",
"Fragilité parentale",
"Contexte psycho-social complexe",
]}
selected={form.vulnerabilitePsychosociale}
onToggle={(value) => toggleArrayValue("vulnerabilitePsychosociale", value)}
/>

<ChecklistField
title="Situation sociale / conditions de vie"
values={[
"Logement instable",
"Difficultés matérielles",
"Besoin d'accompagnement social",
"Continuité des aides à organiser",
]}
selected={form.situationSociale}
onToggle={(value) => toggleArrayValue("situationSociale", value)}
/>

<ChecklistField
title="Continuité de parcours / sortie"
values={[
"Coordination de sortie à anticiper",
"Relais ambulatoire à structurer",
"Rendez-vous à organiser",
"Parcours à sécuriser",
]}
selected={form.continuiteParcours}
onToggle={(value) => toggleArrayValue("continuiteParcours", value)}
/>

<ChecklistField
title="Coordination inter-institutionnelle"
values={[
"ASE",
"Pédopsychiatrie",
"Établissement scolaire",
"Structures territoriales",
"Centres sociaux",
]}
selected={form.coordinationInterInstitutionnelle}
onToggle={(value) => toggleArrayValue("coordinationInterInstitutionnelle", value)}
/>
</section>

<section style={cardStyle}>
{sectionTitle("Pilotage et diffusion")}

<div style={grid3}>
<div>
{fieldLabel("Initiateur de la demande")}
<input
value={form.initiateurDemande}
onChange={(e) => updateField("initiateurDemande", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Cadre de santé")}
<input
value={form.cadreSante}
onChange={(e) => updateField("cadreSante", e.target.value)}
style={inputStyle}
/>
</div>
<div>
{fieldLabel("Secrétariat")}
<input
value={form.secretariat}
onChange={(e) => updateField("secretariat", e.target.value)}
style={inputStyle}
/>
</div>
</div>

<div style={grid2}>
<div>
{fieldLabel("Observations non médicales")}
<textarea
value={form.observationsNonMedicales}
onChange={(e) => updateField("observationsNonMedicales", e.target.value)}
style={textareaStyle}
/>
</div>

<div style={{ display: "grid", gap: 12 }}>
<div>
{fieldLabel("Date souhaitée de réunion")}
<input
type="date"
value={form.dateSouhaiteeReunion}
onChange={(e) => updateField("dateSouhaiteeReunion", e.target.value)}
style={inputStyle}
/>
</div>

<div>
{fieldLabel("Canal de diffusion")}
<select
value={form.diffusionCanal}
onChange={(e) => updateField("diffusionCanal", e.target.value)}
style={inputStyle}
>
<option>MSSanté</option>
<option>Email sécurisé</option>
<option>Portail CARABBAS</option>
</select>
</div>

<div>
{fieldLabel("Destinataires")}
<div style={chipsWrap}>
{[
"Centres sociaux",
"Services ASE",
"Pédopsychiatrie",
"Structures territoriales",
].map((item) => (
<button
key={item}
type="button"
style={chipOptionStyle(form.diffusionDestinataires.includes(item))}
onClick={() => toggleArrayValue("diffusionDestinataires", item)}
>
{item}
</button>
))}
</div>
</div>
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
Marquer prêt à diffuser
</button>
<button type="button" style={primaryBtn} onClick={send}>
Diffuser
</button>
</div>
</section>
</div>
</AppShell>
);
}

function ChecklistField({ title, values, selected, onToggle }) {
return (
<div style={{ display: "grid", gap: 8 }}>
<div style={{ fontSize: 13, fontWeight: 800, color: "#17376a" }}>{title}</div>
<div style={chipsWrap}>
{values.map((item) => (
<button
key={item}
type="button"
style={chipOptionStyle(selected.includes(item))}
onClick={() => onToggle(item)}
>
{item}
</button>
))}
</div>
</div>
);
}

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

const grid4 = {
display: "grid",
gridTemplateColumns: "repeat(4, 1fr)",
gap: 14,
};

const chipsWrap = {
display: "flex",
gap: 8,
flexWrap: "wrap",
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
"Prêt à diffuser": { background: "#fff8e8", border: "1px solid #f6df9b", color: "#a16207" },
Diffusée: { background: "#edf8f2", border: "1px solid #c8e8d3", color: "#237a53" },
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
