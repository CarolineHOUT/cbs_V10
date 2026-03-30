import React from "react";

function getBadgeStyle(label) {
  if (label === "critique") {
    return {
      background: "#fff1f0",
      color: "#cf1322",
      border: "1px solid #ffa39e",
    };
  }

  if (label === "complexe") {
    return {
      background: "#fff7e6",
      color: "#d46b08",
      border: "1px solid #ffd591",
    };
  }

  return {
    background: "#f6ffed",
    color: "#389e0d",
    border: "1px solid #b7eb8f",
  };
}

function sectionStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  };
}

function titleStyle() {
  return {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  };
}

function chipStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 13,
    color: "#334155",
    fontWeight: 500,
  };
}

function renderList(items = [], emptyLabel = "Aucune donnée") {
  if (!items.length) {
    return <div style={{ color: "#64748b", fontSize: 14 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <span key={item.code || item.label} style={chipStyle()}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function PatientInsightsPanel({ patient }) {
  if (!patient) return null;

  const complexityLabel = patient?.complexityLabel || "standard";
  const vulnerabilityProfiles = Array.isArray(patient?.vulnerabilityProfiles)
    ? patient.vulnerabilityProfiles
    : [];

  return (
    <section style={sectionStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={titleStyle()}>Analyse copilote</h3>
          <div style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
            Synthèse métier dérivée du recueil structuré.
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            textTransform: "capitalize",
            ...getBadgeStyle(complexityLabel),
          }}
        >
          Niveau {complexityLabel}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Freins
          </div>
          {renderList(patient?.derivedFreins || [], "Aucun frein détecté")}
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Conséquences
          </div>
          {renderList(
            patient?.derivedConsequences || [],
            "Aucune conséquence détectée"
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Orientations proposées
          </div>
          {renderList(
            patient?.derivedOrientations || [],
            "Aucune orientation proposée"
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Profils de vulnérabilité
          </div>
          {renderList(
            vulnerabilityProfiles,
            "Aucun profil de vulnérabilité"
          )}
        </div>
      </div>
    </section>
  );
}