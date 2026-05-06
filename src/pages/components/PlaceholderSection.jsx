export default function PlaceholderSection({ title, text }) {
return (
<div
style={{
background: "#fff",
borderRadius: 18,
padding: 24,
border: "1px solid #e5e7eb",
}}
>
<h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
<p style={{ color: "#64748b", marginTop: 8 }}>{text}</p>
</div>
);
}