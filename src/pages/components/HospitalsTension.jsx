
import Badge from "./Badge";
export default function HospitalsTension({ hospitals }) {
return (
<div style={{ background: "#fff", borderRadius: 18, padding: 20 }}>
<div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>
Tension territoriale établissements
</div>

<div style={{ display: "grid", gap: 14 }}>
{hospitals.map((item) => (
<div
key={item.hospital}
style={{
border: "1px solid #e2e8f0",
borderRadius: 14,
padding: 16,
background: item.critical >= 5 ? "#fef2f2" : "#ffffff",
}}
>
<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
<div>
<div style={{ fontWeight: 700, fontSize: 17 }}>{item.hospital}</div>
<div style={{ color: "#64748b", marginTop: 4 }}>
{item.total} demandes territoriales
</div>
</div>

<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
<Badge label={`${item.critical} critiques`} bg="#fff7ed" color="#c2410c" />
<Badge label={`${item.noSolution} sans solution`} bg="#fef2f2" color="#dc2626" />
<Badge label={`${item.accepted} acceptées`} bg="#ecfdf5" color="#047857" />
<Badge label={`${item.refused} refus`} bg="#f8fafc" color="#475569" />
</div>
</div>
</div>
))}
</div>
</div>
);
}