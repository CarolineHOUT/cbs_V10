import { resourcesByType } from "../data/resourcesData";

export default function TerritoryResourcePanel({
resourceType,
onAddToWorkflow,
}) {
const resources = resourcesByType[resourceType] || [];

return (
<div>
{resources.length === 0 ? (
<p>Aucune ressource trouvée</p>
) : (
resources.map((r, i) => (
<div
key={i}
style={{
padding: 12,
borderBottom: "1px solid #eee",
}}
>
<div style={{ fontWeight: 600 }}>{r.name}</div>
{r.city && <div>{r.city}</div>}
<div style={{ color: "#2563eb" }}>{r.phone}</div>

<button
onClick={() =>
onAddToWorkflow(
"Contacter " + r.name,
"Téléphone : " + r.phone
)
}
>
Ajouter au workflow
</button>
</div>
))
)}
</div>
);
}