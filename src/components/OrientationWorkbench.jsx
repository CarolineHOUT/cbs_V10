import { useMemo, useState } from "react";
import {
  patientProfiles,
  urgencyLevels,
  territories,
} from "../data/territorialResourceCatalog";
import OrientationSuggestionPanel from "./OrientationSuggestionPanel";

export default function OrientationWorkbench() {
  const [territoryId, setTerritoryId] = useState("T_NORD");
  const [profileId, setProfileId] = useState("P_RETOUR_COMPLEXE");
  const [urgencyId, setUrgencyId] = useState("U_J0");

  const selectedLabels = useMemo(() => {
    return {
      territory:
        territories.find((item) => item.id === territoryId)?.label || "—",
      profile:
        patientProfiles.find((item) => item.id === profileId)?.label || "—",
      urgency:
        urgencyLevels.find((item) => item.id === urgencyId)?.label || "—",
    };
  }, [territoryId, profileId, urgencyId]);

  return (
    <div
      style={{
        padding: 20,
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Pilotage orientation territoriale</h1>
        <p style={{ marginTop: 8 }}>
          Sélection du territoire, du profil et du niveau d’urgence
        </p>
      </header>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Territoire
            </label>
            <select
              value={territoryId}
              onChange={(e) => setTerritoryId(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #d1d5db",
              }}
            >
              {territories.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Profil patient
            </label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #d1d5db",
              }}
            >
              {patientProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Niveau d’urgence
            </label>
            <select
              value={urgencyId}
              onChange={(e) => setUrgencyId(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #d1d5db",
              }}
            >
              {urgencyLevels.map((urgency) => (
                <option key={urgency.id} value={urgency.id}>
                  {urgency.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f9fafb",
            borderRadius: 12,
            border: "1px solid #ececec",
          }}
        >
          <strong>Configuration active :</strong>{" "}
          {selectedLabels.territory} · {selectedLabels.profile} ·{" "}
          {selectedLabels.urgency}
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
        }}
      >
        <OrientationSuggestionPanel
          territoryId={territoryId}
          profileId={profileId}
          urgencyId={urgencyId}
        />
      </section>
    </div>
  );
}
