export default function KpiCard({ title, value, color = "#0f172a" }) {
return (
<div style={{ background: "#fff", borderRadius: 18, padding: 20 }}>
<div style={{ color: "#64748b", fontSize: 14 }}>{title}</div>
<div style={{ marginTop: 12, fontSize: 38, fontWeight: 800, color }}>
{value}
</div>
</div>
);
}