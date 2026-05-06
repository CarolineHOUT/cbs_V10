
import KpiCard from "./KpiCard"

export default function KpiGrid({ metrics }) {
return (
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
gap: 16,
marginBottom: 24,
}}
>
<KpiCard title="Demandes territoriales" value={metrics.total} />
<KpiCard title="Demandes actives" value={metrics.active} color="#2563eb" />
<KpiCard title="Patients sans solution" value={metrics.noSolution} color="#dc2626" />
<KpiCard title="Situations critiques" value={metrics.critical} color="#ea580c" />
<KpiCard title="Acceptées" value={metrics.accepted} color="#059669" />
<KpiCard title="Refusées" value={metrics.refused} color="#7c2d12" />
</div>
);
}