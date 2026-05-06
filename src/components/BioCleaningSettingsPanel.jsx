import React, { useState } from "react";
import { DEFAULT_BIO_CLEANING_SETTINGS } from "../config/bioCleaningConfig";

export default function BioCleaningSettingsPanel() {
const [durations, setDurations] = useState(
DEFAULT_BIO_CLEANING_SETTINGS.durations
);

function updateDuration(key, value) {
setDurations((prev) => ({
...prev,
[key]: Number(value) || 0,
}));
}

return (
<div style={{ display: "grid", gap: 16 }}>
<div>
<h4 style={{ margin: 0 }}>Durées de bio-nettoyage</h4>
<p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
Paramètres de démonstration modifiables plus tard par rôle.
</p>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
gap: 12,
}}
>
<label style={{ display: "grid", gap: 6 }}>
<span>Standard</span>
<input
type="number"
value={durations.standard}
min={0}
onChange={(e) => updateDuration("standard", e.target.value)}
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span>Renforcé</span>
<input
type="number"
value={durations.renforce}
min={0}
onChange={(e) => updateDuration("renforce", e.target.value)}
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span>Isolement</span>
<input
type="number"
value={durations.isolement}
min={0}
onChange={(e) => updateDuration("isolement", e.target.value)}
/>
</label>

<label style={{ display: "grid", gap: 6 }}>
<span>Partiel</span>
<input
type="number"
value={durations.partiel}
min={0}
onChange={(e) => updateDuration("partiel", e.target.value)}
/>
</label>
</div>
</div>
);
}

