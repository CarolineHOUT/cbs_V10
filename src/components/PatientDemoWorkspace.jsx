import { useNavigate } from "react-router-dom";
import PatientIntakeForm from "./PatientIntakeForm";
import PatientSummaryCard from "./PatientSummaryCard";
import IntakeCategorySelector from "./IntakeCategorySelector";

function headerChipStyle(active = false) {
return {
height: 32,
padding: "0 14px",
borderRadius: 999,
border: active
? "1px solid rgba(255,255,255,0.7)"
: "1px solid rgba(255,255,255,0.2)",
background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
color: "#ffffff",
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
};
}

function pageStyle() {
return {
minHeight: "100vh",
background: "linear-gradient(180deg, #f6f9fc 0%, #eef4fb 100%)",
padding: 16,
boxSizing: "border-box",
};
}

function containerStyle() {
return {
maxWidth: 1380,
margin: "0 auto",
display: "grid",
gap: 12,
};
}

function panelStyle() {
return {
background: "rgba(255,255,255,0.97)",
border: "1px solid #e5edf6",
borderRadius: 18,
padding: 14,
boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};
}

function sectionTitleStyle() {
return {
margin: 0,
fontSize: 18,
fontWeight: 900,
color: "#17376a",
};
}

function sectionSubtitleStyle() {
return {
margin: "4px 0 0 0",
fontSize: 13,
color: "#6b7a90",
};
}

function Header() {
const navigate = useNavigate();

return (
<div
style={{
background:
"linear-gradient(135deg, #0b1220 0%, #17376a 60%, #2563eb 100%)",
color: "#fff",
padding: "12px 16px",
borderRadius: 14,
boxShadow: "0 8px 20px rgba(37, 99, 235, 0.15)",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "auto 1fr auto",
alignItems: "center",
gap: 10,
}}
>
<div>
<div
style={{
fontSize: 18,
fontWeight: 900,
marginBottom: 2,
}}
>
CARABBAS
</div>

<div
style={{
fontSize: 13,
fontWeight: 600,
opacity: 0.9,
}}
>
Recueil simulé • Alimentation des vues métier
</div>
</div>

<div
style={{
display: "flex",
gap: 6,
flexWrap: "wrap",
justifyContent: "center",
}}
>
<button
type="button"
onClick={() => navigate("/")}
style={headerChipStyle(true)}
>
Recueil
</button>

<button
type="button"
onClick={() => navigate("/dashboard")}
style={headerChipStyle(false)}
>
Tableau de bord
</button>

<button
type="button"
onClick={() => navigate("/patient")}
style={headerChipStyle(false)}
>
Vue patient
</button>

<button
type="button"
onClick={() => navigate("/copilote")}
style={headerChipStyle(false)}
>
Copilote
</button>
</div>

<div />
</div>
</div>
);
}

function SectionHeader({ title, subtitle }) {
return (
<div style={{ marginBottom: 10 }}>
<h3 style={sectionTitleStyle()}>{title}</h3>
{subtitle ? <p style={sectionSubtitleStyle()}>{subtitle}</p> : null}
</div>
);
}

export default function UnifiedDemoWorkspace() {
return (
<div style={pageStyle()}>
<div style={containerStyle()}>
<Header />

<div
style={{
display: "grid",
gridTemplateColumns: "1.2fr 0.8fr",
gap: 12,
alignItems: "start",
}}
>
<div style={panelStyle()}>
<SectionHeader
title="Recueil patient"
subtitle="Identité complète et saisie simulée"
/>
<PatientIntakeForm />
</div>

<div style={panelStyle()}>
<SectionHeader
title="Synthèse patient"
subtitle="Lecture directe des données"
/>
<PatientSummaryCard />
</div>
</div>

<div style={panelStyle()}>
<SectionHeader
title="Recueil métier structuré"
subtitle="Sélection des besoins et contraintes"
/>
<IntakeCategorySelector />
</div>
</div>
</div>
);
}