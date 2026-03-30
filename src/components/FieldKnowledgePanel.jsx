import { useState } from "react";
import {
createFieldContact,
createWorkaround,
} from "../models/fieldKnowledgeModel";

// ===============================
// STYLE
// ===============================

const panel = {
border: "1px solid #e6ebf2",
borderRadius: 16,
padding: 14,
background: "#fbfdff",
display: "grid",
gap: 12,
};

const title = {
fontSize: 14,
fontWeight: 900,
color: "#17376a",
};

const section = {
display: "grid",
gap: 8,
};

const row = {
display: "flex",
gap: 8,
flexWrap: "wrap",
};

const input = {
height: 34,
borderRadius: 8,
border: "1px solid #d6deea",
padding: "0 8px",
fontSize: 12,
};

const textarea = {
borderRadius: 8,
border: "1px solid #d6deea",
padding: 8,
fontSize: 12,
};

const button = {
height: 30,
padding: "0 10px",
borderRadius: 8,
border: "1px solid #1d4b8f",
background: "#1d4b8f",
color: "#fff",
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
};

const chip = {
padding: "6px 10px",
borderRadius: 999,
background: "#eef4ff",
border: "1px solid #d6e4ff",
fontSize: 11,
fontWeight: 700,
};

// ===============================
// COMPONENT
// ===============================

export default function FieldKnowledgePanel({
resourceId,
contacts = [],
workarounds = [],
onAddContact,
onAddWorkaround,
}) {
const [showContactForm, setShowContactForm] = useState(false);
const [showWorkaroundForm, setShowWorkaroundForm] = useState(false);

const [contactForm, setContactForm] = useState({
label: "",
role: "",
phone: "",
notes: "",
});

const [workaroundForm, setWorkaroundForm] = useState({
title: "",
description: "",
tags: "",
});

// ===============================
// ACTIONS
// ===============================

function handleAddContact() {
const newContact = createFieldContact({
resourceId,
label: contactForm.label,
role: contactForm.role,
phone: contactForm.phone,
notes: contactForm.notes,
});

onAddContact?.(newContact);

setContactForm({ label: "", role: "", phone: "", notes: "" });
setShowContactForm(false);
}

function handleAddWorkaround() {
const newWorkaround = createWorkaround({
resourceId,
title: workaroundForm.title,
description: workaroundForm.description,
contextTags: workaroundForm.tags.split(",").map((t) => t.trim()),
});

onAddWorkaround?.(newWorkaround);

setWorkaroundForm({ title: "", description: "", tags: "" });
setShowWorkaroundForm(false);
}

// ===============================
// RENDER
// ===============================

return (
<div style={panel}>
<div style={title}>Mémoire terrain</div>

{/* CONTACTS */}
<div style={section}>
<div style={{ fontWeight: 800 }}>Contacts terrain</div>

{contacts.length === 0 && (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucun contact ajouté
</div>
)}

{contacts.map((c) => (
<div key={c.id} style={chip}>
{c.label} • {c.role} {c.phone && `• ${c.phone}`}
</div>
))}

<button onClick={() => setShowContactForm(!showContactForm)} style={button}>
+ Ajouter contact
</button>

{showContactForm && (
<div style={section}>
<div style={row}>
<input
style={input}
placeholder="Nom"
value={contactForm.label}
onChange={(e) =>
setContactForm((p) => ({ ...p, label: e.target.value }))
}
/>
<input
style={input}
placeholder="Rôle"
value={contactForm.role}
onChange={(e) =>
setContactForm((p) => ({ ...p, role: e.target.value }))
}
/>
<input
style={input}
placeholder="Téléphone"
value={contactForm.phone}
onChange={(e) =>
setContactForm((p) => ({ ...p, phone: e.target.value }))
}
/>
</div>

<textarea
style={textarea}
placeholder="Notes terrain"
value={contactForm.notes}
onChange={(e) =>
setContactForm((p) => ({ ...p, notes: e.target.value }))
}
/>

<button onClick={handleAddContact} style={button}>
Valider
</button>
</div>
)}
</div>

{/* WORKAROUNDS */}
<div style={section}>
<div style={{ fontWeight: 800 }}>Solutions terrain</div>

{workarounds.length === 0 && (
<div style={{ fontSize: 12, color: "#64748b" }}>
Aucune solution proposée
</div>
)}

{workarounds.map((w) => (
<div key={w.id} style={chip}>
{w.title}
</div>
))}

<button onClick={() => setShowWorkaroundForm(!showWorkaroundForm)} style={button}>
+ Ajouter solution
</button>

{showWorkaroundForm && (
<div style={section}>
<input
style={input}
placeholder="Titre"
value={workaroundForm.title}
onChange={(e) =>
setWorkaroundForm((p) => ({ ...p, title: e.target.value }))
}
/>

<textarea
style={textarea}
placeholder="Description"
value={workaroundForm.description}
onChange={(e) =>
setWorkaroundForm((p) => ({
...p,
description: e.target.value,
}))
}
/>

<input
style={input}
placeholder="Tags (ex: HAD, domicile, IDEL)"
value={workaroundForm.tags}
onChange={(e) =>
setWorkaroundForm((p) => ({ ...p, tags: e.target.value }))
}
/>

<button onClick={handleAddWorkaround} style={button}>
Valider
</button>
</div>
)}
</div>
</div>
);
}