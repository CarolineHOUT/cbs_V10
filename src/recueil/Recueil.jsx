import React, { useState } from "react";

export default function Recueil({ patient }) {
  const [open, setOpen] = useState(null);

  const selected = patient.categories.flatMap(c =>
    c.keywords.filter(k => k.selected)
  );

  return (
    <div style={box}>
      <h3>Recueil</h3>

      <div style={grid}>
        <input placeholder="Nom" defaultValue={patient.nom}/>
        <input placeholder="Prénom" defaultValue={patient.prenom}/>
        <input placeholder="Date de naissance" defaultValue={patient.dateNaissance}/>
        <input placeholder="Âge" defaultValue={patient.age}/>
        <div>
          <button>H</button>
          <button>F</button>
        </div>
      </div>

      <div>
        {selected.map(k => (
          <span key={k.id} style={chipSel}>{k.label}</span>
        ))}
      </div>

      {patient.categories.map(c => (
        <div key={c.id}>
          <div onClick={()=>setOpen(c.id)} style={title}>{c.label}</div>
          {open === c.id && (
            <div>
              {c.keywords.map(k => (
                <span key={k.id} style={k.selected?chipSel:chip}>{k.label}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const box={border:"1px solid #ddd",padding:12}
const grid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}
const chip={border:"1px solid #ccc",padding:"4px 8px",margin:4}
const chipSel={...chip,background:"#dfefff"}
const title={fontWeight:600,cursor:"pointer"}
