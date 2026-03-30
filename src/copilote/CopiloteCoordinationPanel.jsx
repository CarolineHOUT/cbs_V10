import React from "react";

function getStatusClass(status) {
switch (status) {
case "Accepté":
return "success";
case "Refusé":
return "danger";
case "En attente":
return "warning";
case "Contacté":
return "info";
default:
return "subtle";
}
}

export default function CopiloteCoordinationPanel({
resources = [],
solicitations = [],
onCall,
onMail,
onRelance,
onAccept,
onReject,
}) {
return (
<div className="copilot-column">
<article className="copilot-card">
<div className="copilot-card-title">Ressources territoriales</div>

<div className="copilot-resource-list">
{resources.length === 0 ? (
<div className="copilot-empty">
Aucune ressource territoriale affichée.
</div>
) : (
resources.map((resource) => (
<div key={resource.id} className="copilot-resource-card">
<div className="copilot-resource-head">
<div>
<div className="copilot-resource-name">{resource.nom}</div>
<div className="copilot-resource-meta">
{resource.type} • {resource.distance || "—"}
</div>
</div>

<span
className={`badge ${getStatusClass(
resource.statut || "Non contacté"
)}`}
>
{resource.statut || "Non contacté"}
</span>
</div>

<div className="copilot-resource-lines">
<div>📞 {resource.phone || "Non renseigné"}</div>
<div>✉ {resource.email || "Non renseigné"}</div>
<div>📍 {resource.address || "Non renseignée"}</div>
<div>⏱ {resource.delai || "—"}</div>
</div>

{resource.note && (
<div className="copilot-resource-note">{resource.note}</div>
)}

<div className="copilot-resource-actions">
<button
type="button"
onClick={() => onCall?.(resource)}
disabled={!resource.phone}
>
Appeler
</button>

<button
type="button"
onClick={() => onMail?.(resource)}
disabled={!resource.email}
>
Email
</button>

<button type="button" onClick={() => onRelance?.(resource)}>
Relancer
</button>

<button type="button" onClick={() => onAccept?.(resource)}>
Accepté
</button>

<button type="button" onClick={() => onReject?.(resource)}>
Refusé
</button>
</div>
</div>
))
)}
</div>
</article>

<article className="copilot-card">
<div className="copilot-card-title">Suivi des demandes</div>

<div className="copilot-table">
<div className="copilot-table-head">
<span>Ressource</span>
<span>Statut</span>
<span>Délai</span>
<span>Relance</span>
</div>

{solicitations.length === 0 ? (
<div className="copilot-empty">
Aucune sollicitation enregistrée.
</div>
) : (
solicitations.map((sollicitation) => (
<div key={sollicitation.id} className="copilot-table-row">
<div>
<strong>{sollicitation.ressource}</strong>
<small>
{sollicitation.type} • {sollicitation.canal}
</small>
{sollicitation.refus && sollicitation.refus !== "—" && (
<small>Motif refus : {sollicitation.refus}</small>
)}
</div>

<div>{sollicitation.statut}</div>
<div>{sollicitation.delai || "—"}</div>
<div>{sollicitation.relance || "—"}</div>
</div>
))
)}
</div>
</article>
</div>
);
}