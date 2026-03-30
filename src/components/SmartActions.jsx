import React from "react";

export default function SmartActions({ suggestions = [] }) {
  return (
    <div>
      <h3>Actions rapides</h3>

      {["Appeler famille", "Relancer", "Envoyer demande"].map((a, i) => (
        <button key={i} style={{ marginRight: 8 }}>{a}</button>
      ))}

      <h4>Suggestions</h4>
      {suggestions.map((s, i) => (
        <button key={i} style={{ marginRight: 8 }}>{s}</button>
      ))}
    </div>
  );
}
