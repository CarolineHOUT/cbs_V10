import { usePatientIntake } from "../context/PatientIntakeContext";

const mutedText = "#667085";
const titleColor = "#17376a";
const borderColor = "#e6ebf2";

function cardBlockStyle() {
return {
border: `1px solid ${borderColor}`,
borderRadius: 14,
background: "#ffffff",
padding: 14,
marginBottom: 12,
};
}

function sectionTitleStyle() {
return {
margin: 0,
fontSize: 14,
fontWeight: 900,
color: titleColor,
};
}

function chipStyle() {
return {
display: "inline-flex",
alignItems: "center",
height: 28,
padding: "0 10px",
borderRadius: 999,
background: "#eef4ff",
border: "1px solid #cfe0ff",
color: "#1d4ed8",
fontSize: 12,
fontWeight: 800,
};
}

function identityHeroStyle() {
return {
borderRadius: 16,
padding: 16,
background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
border: "1px solid #dbe8fb",
marginBottom: 14,
};
}

function rowStyle() {
return {
display: "grid",
gridTemplateColumns: "140px 1fr",
gap: 12,
padding: "8px 0",
borderBottom: "1px solid #eef2f6",
fontSize: 14,
};
}

function labelStyle() {
return {
fontWeight: 700,
color: "#344054",
};
}

function valueStyle() {
return {
color: "#111827",
};
}

function miniStatStyle() {
return {
border: "1px solid #e8eef7",
borderRadius: 12,
padding: 12,
background: "#fbfcfe",
};
}

function MiniStat({ label, value }) {
return (
<div style={miniStatStyle()}>
<div
style={{
fontSize: 11,
fontWeight: 800,
textTransform: "uppercase",
letterSpacing: "0.04em",
color: mutedText,
marginBottom: 6,
}}
>
{label}
</div>
<div
style={{
fontSize: 16,
fontWeight: 900,
color: "#111827",
}}
>
{value || "—"}
</div>
</div>
);
}

function Row({ label, value }) {
return (
<div style={rowStyle()}>
<div style={labelStyle()}>{label}</div>
<div style={valueStyle()}>{value || "—"}</div>
</div>
);
}

export default function PatientSummaryCard() {
const { patientIntake } = usePatientIntake();
const { identity, territory, scenario } = patientIntake;

const patientFullName = `${identity.lastName || ""} ${identity.firstName || ""}`.trim();

return (
<div>
<div style={identityHeroStyle()}>
<div
style={{
display: "flex",
justifyContent: "space-between",
gap: 12,
alignItems: "flex-start",
flexWrap: "wrap",
}}
>
<div>
<div
style={{
fontSize: 12,
fontWeight: 800,
textTransform: "uppercase",
letterSpacing: "0.05em",
color: mutedText,
marginBottom: 6,
}}
>
Patient chargé
</div>

<div
style={{
fontSize: 22,
fontWeight: 900,
color: "#0f172a",
lineHeight: 1.1,
marginBottom: 6,
}}
>
{patientFullName || "Patient non renseigné"}
</div>

<div
style={{
fontSize: 13,
color: mutedText,
}}
>
{identity.birthDate || "Date de naissance non renseignée"}
</div>
</div>

<div style={chipStyle()}>
{scenario?.type || "Recueil simulé"}
</div>
</div>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 10,
marginBottom: 14,
}}
>
<MiniStat label="Service" value={identity.service} />
<MiniStat label="Âge" value={identity.age} />
<MiniStat label="Chambre" value={identity.room} />
<MiniStat label="Lit" value={identity.bed} />
</div>

<div style={cardBlockStyle()}>
<h4 style={sectionTitleStyle()}>Identité administrative</h4>

<div style={{ marginTop: 10 }}>
<Row label="Nom" value={identity.lastName} />
<Row label="Prénom" value={identity.firstName} />
<Row label="Date de naissance" value={identity.birthDate} />
<Row label="Âge" value={identity.age} />
<Row label="INS" value={identity.ins} />
<Row label="IEP" value={identity.iep} />
</div>
</div>

<div style={cardBlockStyle()}>
<h4 style={sectionTitleStyle()}>Localisation hospitalière</h4>

<div style={{ marginTop: 10 }}>
<Row label="Service" value={identity.service} />
<Row label="Chambre" value={identity.room} />
<Row label="Lit" value={identity.bed} />
</div>
</div>

<div style={cardBlockStyle()}>
<h4 style={sectionTitleStyle()}>Contexte de démonstration</h4>

<div style={{ marginTop: 10 }}>
<Row label="Commune" value={territory?.city} />
<Row label="Scénario" value={scenario?.type} />
</div>
</div>
</div>
);
}