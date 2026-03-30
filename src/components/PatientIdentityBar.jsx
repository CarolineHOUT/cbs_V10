
import React from "react";

function toneClass(severity) {
  const value = String(severity || "").toLowerCase();
  if (value.includes("crit")) return "red";
  if (value.includes("complex")) return "amber";
  return "blue";
}

function safe(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export default function PatientIdentityBar({ patient, compact = false, actions = null, showNavigation = true }) {
  if (!patient) return null;

  return (
    <section className={`patient-bar ${compact ? "compact" : ""}`}>
      <div className="patient-bar__head">
        <div className="patient-bar__title-wrap">
          <h1 className="patient-bar__title">{patient.nom} {patient.prenom}</h1>
          <span className={`app-chip ${toneClass(patient.severity || patient.gravite)}`}>
            {patient.severity || patient.gravite || "À qualifier"}
          </span>
          {patient.orientation ? <span className="app-chip violet">{patient.orientation}</span> : null}
          {patient.isNewPatient ? <span className="app-chip blue">Nouveau</span> : null}
          {patient.isComplex ? <span className="app-chip amber">Complexe</span> : null}
        </div>
        {(showNavigation || actions) ? <div className="patient-bar__actions">{actions}</div> : null}
      </div>

      <div className="patient-bar__meta-grid">
        <span><strong>Nom</strong> {safe(patient.nom)}</span>
        <span><strong>Prénom</strong> {safe(patient.prenom)}</span>
        <span><strong>Né(e)</strong> {safe(patient.dateNaissance)}</span>
        <span><strong>Âge</strong> {safe(patient.age)}</span>
        <span><strong>INS</strong> {safe(patient.ins)}</span>
        <span><strong>IEP</strong> {safe(patient.iep)}</span>
        <span><strong>Service</strong> {safe(patient.service)}</span>
        <span><strong>Chambre</strong> {safe(patient.chambre)}</span>
        <span><strong>Lit</strong> {safe(patient.lit)}</span>
      </div>
    </section>
  );
}
