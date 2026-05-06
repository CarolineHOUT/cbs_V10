

import ArsSidebar from "../components/ArsSidebar.jsx";
import ArsMapBlock from "../components/ArsMapBlock.jsx";
import SasTerritorial from "../components/SasTerritorial.jsx";
import TerritorialQueue from "../components/TerritorialQueue.jsx";
import HospitalsTension from "../components/HospitalsTension.jsx";
import KpiGrid from "../components/KpiGrid.jsx";
import PlaceholderSection from "../components/PlaceholderSection.jsx";
import CoordinationDrawer from "../components/CoordinationDrawer.jsx";
import React, { useEffect, useMemo, useState } from "react";

export default function ArsTerritorialDashboard({ territorialRequests = [] }) {
const [activeSection, setActiveSection] = useState("territoire");
const [requests, setRequests] = useState(() => {
const saved = localStorage.getItem("arsRequests");
return saved ? JSON.parse(saved) : territorialRequests;
});

useEffect(() => {
localStorage.setItem("arsRequests", JSON.stringify(requests));
}, [requests]);
const [selectedRequest, setSelectedRequest] = useState(null);

const updateRequest = (id, patch) => {
setRequests((prev) =>
prev.map((req) => (req.id === id ? { ...req, ...patch } : req))
);

setSelectedRequest((prev) =>
prev?.id === id ? { ...prev, ...patch } : prev
);
};

const metrics = useMemo(() => {
const total = requests.length;

return {
total,
active: requests.filter((r) =>
["sent_to_sas", "sas_received", "qualified", "routed", "under_review"].includes(r.status)
).length,
noSolution: requests.filter((r) => r.status === "no_solution").length,
critical: requests.filter((r) => r.priority === "critical").length,
accepted: requests.filter((r) =>
["accepted", "scheduled", "completed"].includes(r.status)
).length,
refused: requests.filter((r) =>
["refused_no_capacity", "refused_not_eligible"].includes(r.status)
).length,
};
}, [requests]);

const hospitals = useMemo(() => {
const map = {};

requests.forEach((request) => {
const hospital =
request.toHospitalName || request.requesterHospital || "Non attribué";

if (!map[hospital]) {
map[hospital] = {
hospital,
total: 0,
critical: 0,
noSolution: 0,
accepted: 0,
refused: 0,
};
}

map[hospital].total += 1;
if (request.priority === "critical") map[hospital].critical += 1;
if (request.status === "no_solution") map[hospital].noSolution += 1;
if (["accepted", "scheduled", "completed"].includes(request.status)) map[hospital].accepted += 1;
if (["refused_no_capacity", "refused_not_eligible"].includes(request.status)) map[hospital].refused += 1;
});

return Object.values(map).sort((a, b) => b.critical - a.critical);
}, [requests]);

const criticalRequests = requests.filter(
(r) =>
r.priority === "critical" ||
r.status === "no_solution" ||
r.arsOpened
);

return (
<div
style={{
display: "grid",
gridTemplateColumns: "220px minmax(0, 1fr)",
minHeight: "100vh",
background: "#f8fafc",
}}
>
<ArsSidebar
activeSection={activeSection}
setActiveSection={setActiveSection}
/>

<main style={{ padding: 24, overflowY: "auto", minWidth: 0 }}>
<Header />

<KpiGrid metrics={metrics} />

{activeSection === "territoire" && (
<div style={{ display: "grid", gap: 24 }}>
<ArsMapBlock />

<TerritorialQueue
title="File critique ARS"
territorialRequests={criticalRequests}
onSelectRequest={setSelectedRequest}
/>
</div>
)}

{activeSection === "sas" && (
<SasTerritorial territorialRequests={requests} />
)}

{activeSection === "parcours" && (
<TerritorialQueue
territorialRequests={requests}
onSelectRequest={setSelectedRequest}
/>
)}

{activeSection === "etablissements" && (
<HospitalsTension hospitals={hospitals} />
)}

{activeSection === "cellule" && (
<PlaceholderSection
title="Cellule ARS"
text="Décisions territoriales, arbitrages, relances et journal de coordination."
/>
)}

{activeSection === "stats" && (
<PlaceholderSection
title="Statistiques"
text="Tendances, délais moyens, saturation par filière et taux de refus."
/>
)}
</main>

<CoordinationDrawer
request={selectedRequest}
onClose={() => setSelectedRequest(null)}
onUpdateRequest={updateRequest}
/>
</div>
);
}

function Header() {
return (
<div style={{ marginBottom: 20 }}>
<div style={{ fontSize: 34, fontWeight: 800 }}>
Cockpit territorial ARS
</div>

<div style={{ color: "#64748b", marginTop: 6 }}>
Pilotage régional des parcours complexes et HDJ
</div>
</div>
);
}
