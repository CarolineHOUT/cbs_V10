import { duoCategories } from "./duoCategories";

function chipStyle(selected) {
return {
minHeight: 34,
padding: "0 12px",
borderRadius: 999,
border: selected ? "1px solid #224a93" : "1px solid #d6deea",
background: selected ? "#224a93" : "#ffffff",
color: selected ? "#ffffff" : "#334155",
fontSize: 12,
fontWeight: 700,
cursor: "pointer",
};
}

export default function DuoSubcategorySelector({
selectedCategory,
setSelectedCategory,
selectedSubcategories,
setSelectedSubcategories,
}) {
function toggleItem(item) {
setSelectedSubcategories((prev) =>
prev.includes(item)
? prev.filter((x) => x !== item)
: [...prev, item]
);
}

const activeCategory =
duoCategories.find((cat) => cat.key === selectedCategory) || duoCategories[0];

return (
<div
style={{
background: "#ffffff",
border: "1px solid #dde5ef",
borderRadius: 16,
padding: 16,
boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
}}
>
<h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#16345f" }}>
Catégories DUO
</h2>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
{duoCategories.map((category) => (
<button
key={category.key}
onClick={() => setSelectedCategory(category.key)}
style={{
...chipStyle(selectedCategory === category.key),
minHeight: 36,
}}
>
{category.label}
</button>
))}
</div>

<div style={{ marginTop: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: "#667085", marginBottom: 8 }}>
Mots-clés / sous-catégories
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{activeCategory.items.map((item) => {
const selected = selectedSubcategories.includes(item);
return (
<button
key={item}
onClick={() => toggleItem(item)}
style={chipStyle(selected)}
>
{item}
</button>
);
})}
</div>
</div>
</div>
);
}