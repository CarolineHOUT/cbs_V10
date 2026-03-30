import React from "react";
import { useCrisisCenter } from "../context/CrisisCenterContext";

export default function GlobalCrisisLauncher() {
const { openCrisisCell, openCriticalWorkflow } = useCrisisCenter();

return (
<div
style={{
position: "fixed",
right: 16,
bottom: 16,
zIndex: 998,
display: "grid",
gap: 8,
}}
>
<button
type="button"
onClick={() =>
openCriticalWorkflow({
scenarioType: "disparition_inquietante",
source: "global_launcher",
})
}
style={{
height: 42,
padding: "0 14px",
borderRadius: 999,
border: "1px solid #d97706",
background: "#fff7ed",
color: "#9a3412",
fontSize: 12,
fontWeight: 900,
cursor: "pointer",
boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
}}
>
Workflow critique
</button>

<button
type="button"
onClick={() =>
openCrisisCell({
source: "global_launcher",
})
}
style={{
height: 48,
padding: "0 16px",
borderRadius: 999,
border: "1px solid #b42318",
background: "#b42318",
color: "#ffffff",
fontSize: 12,
fontWeight: 900,
cursor: "pointer",
boxShadow: "0 8px 20px rgba(15, 23, 42, 0.16)",
}}
>
Cellule de crise
</button>
</div>
);
}