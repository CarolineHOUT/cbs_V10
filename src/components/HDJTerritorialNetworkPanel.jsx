import React, { useMemo } from "react";
import { getHDJTerritorialOfferMatches } from "../copilote/hdjTerritorialMatching";

function tagStyle() {
  return {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef4ff",
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: 700,
    marginRight: 6,
    marginBottom: 6,
  };
}

function cardStyle() {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: "#ffffff",
  };
}

export default function HDJTerritorialNetworkPanel({
  patient,
  activeKeywords,
  selectedOrientation,
  hdjForm,
  onSelectOffer,
}) {
  const matches = useMemo(() => {
    return getHDJTerritorialMatches({
      patient,
      activeKeywords,
      selectedOrientation,
      hdjForm,
    });
  }, [patient, activeKeywords, selectedOrientation, hdjForm]);

  if (!matches.length) {
    return (
      <div style={{ padding: 12, color: "#64748b" }}>
        Aucune offre HDJ territoriale identifiée.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>
        Réseau HDJ départemental
      </div>

      <div style={{ color: "#64748b", marginBottom: 12 }}>
        Offres compatibles avec le patient
      </div>

      {matches.slice(0, 5).map(({ offer, score, reasons }) => (
        <div key={offer.id} style={cardStyle()}>
          <div style={{ fontWeight: 700 }}>
            {offer.title}
          </div>

          <div style={{ fontSize: 12, color: "#64748b" }}>
            {offer.hospital} — {offer.city}
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>Score :</strong> {score}
          </div>

          <div style={{ marginTop: 6 }}>
            {reasons.slice(0, 5).map((r) => (
              <span key={r} style={tagStyle()}>
                {r}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 6, fontSize: 13 }}>
            {offer.description}
          </div>

          <div style={{ marginTop: 6, fontSize: 12 }}>
            ⏱ Délai moyen : {offer.averageDelayDays} jours
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => onSelectOffer?.(offer)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #1d4ed8",
                background: "#1d4ed8",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Utiliser cet HDJ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}