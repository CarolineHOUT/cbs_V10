import React from "react";

export default function PatientTimeline({ patient }) {
const events = [];

(patient.actionPlan || []).forEach((a) =>
events.push({ label: a.label, date: a.dueDate })
);

(patient.hdjHistory || []).forEach((h) =>
events.push({ label: h.title, date: h.savedAt })
);

return (
<div>
{events.map((e, i) => (
<div key={i} style={{ marginBottom: 8 }}>
<strong>{e.label}</strong>
<div>{e.date}</div>
</div>
))}
</div>
);
}
