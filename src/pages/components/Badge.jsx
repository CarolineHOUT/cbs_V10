export default function Badge({ label, bg, color }) {
return (
<div
style={{
background: bg,
color,
padding: "6px 10px",
borderRadius: 999,
fontWeight: 700,
fontSize: 13,
}}
>
{label}
</div>
);
}