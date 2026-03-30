import { useMemo, useState } from "react";
import { searchNearbyResources } from "./fakeGeoApi";

export default function GeoSearchPanel({
patient,
territory,
keywords = [],
onCreateRequest,
}) {
const [radiusKm, setRadiusKm] = useState(10);

const results = useMemo(() => {
return searchNearbyResources({
city: patient?.city || territory || "",
radiusKm,
keywords,
});
}, [patient, territory, radiusKm, keywords]);

return (
<div
style={{
marginTop: 16,
padding: 16,
background: "white",
border: "1px solid #d9e1ec",
borderRadius: 12,
}}
>
<h2>Ressources autour du lieu de vie</h2>

<div style={{ marginTop: 8 }}>
<strong>Ville :</strong> {patient?.city || "—"}
</div>

<div style={{ marginTop: 8 }}>
<strong>Territoire sélectionné :</strong> {territory || "—"}
</div>

<div style={{ marginTop: 10 }}>
<label>
<strong>Rayon : {radiusKm} km</strong>
</label>
<input
type="range"
min="5"
max="30"
step="5"
value={radiusKm}
onChange={(e) => setRadiusKm(Number(e.target.value))}
style={{ marginLeft: 10 }}
/>
</div>

<div style={{ marginTop: 10 }}>
<strong>Filtres actifs :</strong>{" "}
{keywords.length ? keywords.join(", ") : "aucun"}
</div>

<div style={{ marginTop: 16 }}>
{results.length === 0 ? (
<p>Aucune ressource trouvée.</p>
) : (
results.map((r) => (
<div
key={r.id}
style={{
marginTop: 8,
padding: 10,
border: "1px solid #e5e7eb",
borderRadius: 10,
background: "#fafafa",
}}
>
<div style={{ fontWeight: 700 }}>{r.name}</div>
<div>Type : {r.type}</div>
<div>Ville : {r.city}</div>
<div>Distance : {r.distanceKm} km</div>
<div>Temps estimé : {r.travelMinutes} min</div>
<div>Statut : {r.status}</div>

<button
style={{ marginTop: 8 }}
onClick={() => onCreateRequest?.(r)}
>
Créer une demande
</button>
</div>
))
)}
</div>
</div>
);
}