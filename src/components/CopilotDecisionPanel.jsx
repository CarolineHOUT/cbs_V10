import React from "react";

export default function CopilotDecisionPanel({ patient }) {
  return (
    <div style={{padding:12}}>
      <div><b>Où j’en suis</b></div>
      <div>Statut : {patient.status || "à définir"}</div>
      <div>Blocage : {patient.blockage || "aucun"}</div>

      <div style={{marginTop:10}}><b>Actions</b></div>
      <div>Contacter ressource</div>
      <div>Construire solution</div>

      <div style={{marginTop:10}}><b>Solutions</b></div>
      <div>{patient.dischargePlanning?.solutionLabel || "Aucune"}</div>
    </div>
  );
}
