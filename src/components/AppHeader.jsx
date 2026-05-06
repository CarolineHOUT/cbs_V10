import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo-carabbas.png";
import { usePatientSimulation } from "../context/PatientSimulationContext";

function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function getLengthOfStay(patient) {
const entry = patient?.dateEntree || patient?.admissionDate || patient?.entryDate;
if (!entry) return 0;
return Math.max(
0,
Math.floor((Date.now() - new Date(entry).getTime()) / (1000 * 60 * 60 * 24))
);
}

function getSolutionLabel(patient) {
return (
patient?.dischargePlanning?.solutionLabel ||
patient?.solutionLabel ||
patient?.orientation ||
"Aucune"
);
}

function getBlockageLabel(patient) {
return (
patient?.blockReason ||
patient?.blocage ||
patient?.derivedFreins?.[0]?.label ||
patient?.copilotSummary?.block ||
"Non défini"
);
}

function isCrisisTriggerPatient(patient) {
const solution = normalize(getSolutionLabel(patient));
const withoutSolution =
!solution || solution === "aucune" || solution.includes("non defini");

return (
getBlockageLabel(patient) !== "Non défini" &&
withoutSolution &&
getLengthOfStay(patient) >= 7
);
}

function formatRole(role) {
if (role === "DIRECTION") return "Direction";
if (role === "CADRE") return "Cadre";
if (role === "MEDECIN") return "Médecin";
if (role === "IDE") return "IDE";
if (role === "AS") return "AS";
return role || "Utilisateur";
}

function getInitials(user) {
const source = user?.nom || user?.matricule || "U";
return String(source).slice(0, 2).toUpperCase();
}

export default function AppHeader({ subtitle, onLogout, user }) {
const navigate = useNavigate();
const location = useLocation();
const { patientsSimulated = [] } = usePatientSimulation() || {};

const crisisCount = patientsSimulated.filter(isCrisisTriggerPatient).length;

const tabs = [
{ label: "Tableau de bord", path: "/dashboard" },
{ label: "Crise", path: "/crise", danger: true, badge: crisisCount },
];

function isActive(path) {
return location.pathname.startsWith(path);
}

const displayName = user?.nom || user?.matricule || "Utilisateur";
const displayRole = formatRole(user?.role);
const displayService = user?.service ? ` • ${user.service}` : "";

return (
<header style={styles.wrapper}>
<div style={styles.brand}>
<img src={logo} alt="CARABBAS" style={styles.logo} />

<div>
<div style={styles.title}>CARABBAS</div>
<div style={styles.subtitle}>
Coordination et pilotage des parcours patient
</div>
</div>
</div>

<nav style={styles.nav}>
{tabs.map((tab) => {
const active = isActive(tab.path);
const showBadge = Number(tab.badge || 0) > 0;

return (
<button
key={tab.label}
onClick={() => navigate(tab.path)}
style={{
...styles.tab,
...(active ? styles.tabActive : {}),
...(tab.danger ? styles.tabDanger : {}),
...(tab.danger && active ? styles.tabDangerActive : {}),
}}
>
<span>{tab.label}</span>

{showBadge ? (
<span style={styles.badge}>{tab.badge}</span>
) : null}
</button>
);
})}
</nav>

<div style={styles.right}>
<div style={styles.user}>
<div style={styles.avatar}>{getInitials(user)}</div>

<div style={styles.userText}>
<div style={styles.userName}>{displayName}</div>
<div style={styles.userMeta}>
{displayRole}
{displayService}
</div>
</div>
</div>

<button onClick={() => onLogout?.()} style={styles.logout}>
Déconnexion
</button>
</div>
</header>
);
}

const styles = {
wrapper: {
display: "grid",
gridTemplateColumns: "auto 1fr auto",
alignItems: "center",
padding: "12px 20px",
background: "#17376a",
borderBottom: "1px solid rgba(255,255,255,0.08)",
},
brand: {
display: "flex",
alignItems: "center",
gap: 8,
},
title: {
fontSize: 24,
fontWeight: 900,
color: "#ffffff",
letterSpacing: 1,
},
subtitle: {
fontSize: 13,
color: "rgba(255,255,255,0.75)",
},
nav: {
display: "flex",
justifyContent: "center",
gap: 6,
},
tab: {
background: "transparent",
color: "#cbd5f5",
border: "none",
padding: "6px 10px",
borderRadius: 6,
fontSize: 13,
fontWeight: 600,
cursor: "pointer",
display: "inline-flex",
alignItems: "center",
gap: 6,
},
tabActive: {
background: "rgba(255,255,255,0.15)",
color: "#ffffff",
},
tabDanger: {
color: "#fca5a5",
},
tabDangerActive: {
background: "#dc2626",
color: "#ffffff",
},
badge: {
minWidth: 18,
height: 18,
padding: "0 6px",
borderRadius: 999,
background: "#ef4444",
color: "#ffffff",
fontSize: 11,
fontWeight: 900,
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
},
right: {
display: "flex",
alignItems: "center",
gap: 10,
},
user: {
display: "flex",
alignItems: "center",
gap: 8,
padding: "6px 10px",
background: "rgba(255,255,255,0.1)",
borderRadius: 10,
},
avatar: {
width: 28,
height: 28,
borderRadius: "50%",
background: "#ffffff",
color: "#17376a",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: 11,
fontWeight: 900,
},
userText: {
display: "grid",
gap: 1,
},
userName: {
fontSize: 12,
fontWeight: 800,
color: "#ffffff",
},
userMeta: {
fontSize: 11,
color: "#c7d2fe",
},
logout: {
background: "#ffffff",
color: "#17376a",
border: "none",
padding: "8px 12px",
borderRadius: 8,
fontWeight: 800,
cursor: "pointer",
},
logo: {
width: 52,
height: 52,
borderRadius: "50%",
objectFit: "cover",
background: "rgba(255,255,255,0.25)",
padding: 2,
border: "1px solid rgba(255,255,255,0.2)",
},
};