import { useState } from "react";

export default function SocialRequestForm({ patient, onSubmit, onClose }) {
const [form, setForm] = useState({
type: "Aide sociale",
urgence: "normale",
commentaire: "",
droits: false,
logement: false,
isolement: false,
protection: false,
});

function updateField(key, value) {
setForm((prev) => ({ ...prev, [key]: value }));
}

function handleSubmit() {
const payload = {
...form,
patientId: patient.id,
patientNom: `${patient.nom} ${patient.prenom}`,
createdAt: new Date().toLocaleString("fr-FR"),
};

onSubmit(payload);
onClose();
}

return (
<div
style={{
position: "fixed",
top: 50,
left: "50%",
transform: "translateX(-50%)",
width: 420,
maxWidth: "90vw",
background: "white",
padding: 20,
border: "1px solid #ccc",
borderRadius: 12,
zIndex: 1000,
boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
}}
>
<h3>Demande sociale</h3>

<div>
<label>Urgence :</label>
<select
value={form.urgence}
onChange={(e) => updateField("urgence", e.target.value)}
style={{ marginLeft: 10 }}
>
<option value="normale">Normale</option>
<option value="haute">Haute</option>
<option value="critique">Critique</option>
</select>
</div>

<div style={{ marginTop: 12 }}>
<label>
<input
type="checkbox"
checked={form.droits}
onChange={(e) => updateField("droits", e.target.checked)}
/>
Ouverture de droits
</label>
</div>

<div>
<label>
<input
type="checkbox"
checked={form.logement}
onChange={(e) => updateField("logement", e.target.checked)}
/>
Problème logement
</label>
</div>

<div>
<label>
<input
type="checkbox"
checked={form.isolement}
onChange={(e) => updateField("isolement", e.target.checked)}
/>
Isolement social
</label>
</div>

<div>
<label>
<input
type="checkbox"
checked={form.protection}
onChange={(e) => updateField("protection", e.target.checked)}
/>
Protection / mesure sociale
</label>
</div>

<div style={{ marginTop: 10 }}>
<textarea
placeholder="Commentaire..."
value={form.commentaire}
onChange={(e) => updateField("commentaire", e.target.value)}
style={{ width: "100%", minHeight: 90 }}
/>
</div>

<div style={{ marginTop: 10 }}>
<button onClick={handleSubmit}>Envoyer</button>
<button onClick={onClose} style={{ marginLeft: 10 }}>
Annuler
</button>
</div>
</div>
);
}