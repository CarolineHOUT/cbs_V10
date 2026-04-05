import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePatientSimulation } from "../context/PatientSimulationContext";
import { usePatientIntake } from "../context/PatientIntakeContext";

const SERVICES = [
  { name: "Médecine polyvalente", rooms: ["MP01", "MP02", "MP03", "MP04"], beds: ["A", "B"] },
  { name: "Médecine", rooms: ["101", "102", "103"], beds: ["A", "B"] },
  { name: "Neurologie", rooms: ["201", "202"], beds: ["A", "B"] },
  { name: "Cardiologie", rooms: ["C101", "C102", "C103"], beds: ["A", "B"] },
  { name: "Chirurgie", rooms: ["CH101", "CH102", "CH103", "CH104"], beds: ["A", "B"] },
  { name: "Néphrologie", rooms: ["N101", "N102", "N103"], beds: ["A", "B"] },
  { name: "Maternité", rooms: ["301", "302"], beds: ["1", "2"] },
  { name: "Pédiatrie", rooms: ["P01", "P02", "P03"], beds: ["1", "2"] },
];

const HABITAT_TYPES = ["Appartement", "Maison", "Résidence autonomie", "EHPAD", "Hébergement précaire", "Sans domicile", "Autre"];
const VIGILANCE_OPTIONS = [
  "Difficulté de compréhension",
  "Situation instable",
  "Isolement",
  "Mineur",
  "Mesure de protection",
  "Besoin de surveillance sortie",
];

function calculateAge(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return String(age);
}

function Field({ label, children }) {
  return (
    <label style={fieldWrap}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const SEX_OPTIONS = [
  { value: "F", label: "Femme" },
  { value: "H", label: "Homme" },
  { value: "U", label: "Non renseigné" },
];


function buildSeverity(patientIntake) {
  const service = String(patientIntake?.identity?.service || "").toLowerCase();
  const vigilance = String(patientIntake?.identity?.vigilance || "").toLowerCase();
  if (service.includes("pédiatr") || vigilance.includes("surveillance") || vigilance.includes("protection")) return "Critique";
  return "À définir";
}

export default function PatientIntakeForm() {
  const navigate = useNavigate();
  const { addSimulatedPatient } = usePatientSimulation();
  const { patientIntake, updateField, updateStructuredIntake } = usePatientIntake();

  const identity = patientIntake?.identity || {};
  const territory = patientIntake?.territory || {};
  const selectedService = useMemo(() => SERVICES.find((s) => s.name === identity.service) || null, [identity.service]);

  function updateIdentity(field, value) {
    updateField("identity", field, value);
  }

  function updateTerritory(field, value) {
    updateField("territory", field, value);
  }

  function updateBirthDate(value) {
    updateField("identity", "birthDate", value);
    updateField("identity", "age", calculateAge(value));
  }

  function updateService(value) {
    updateField("identity", "service", value);
    updateField("identity", "room", "");
    updateField("identity", "bed", "");
  }

function handleCreatePatient() {
  const id = Date.now().toString();
  const severity = buildSeverity(patientIntake);

 const structuredIntake = patientIntake?.structuredIntake || {};

  const newPatient = {
    id,
    id,
   id,
  nom: identity.lastName?.trim() || "Nom",
  prenom: identity.firstName?.trim() || "Prénom",
  dateNaissance: identity.birthDate || "",
  age: identity.age || calculateAge(identity.birthDate || ""),
  sexe: identity.sexe || "U",
  ins: identity.ins || "",
  iep: identity.iep || "",
  service: identity.service || "",
  chambre: identity.room || "",
  lit: identity.bed || "",
    dateEntree: new Date().toISOString().slice(0, 10),
    dateSortiePrevue: "",
    orientation: "À définir",
    severity,
    gravite: severity,
    blockReason: territory?.mainNeed || "À définir",
    blocage: territory?.mainNeed || "",

    structuredIntake,

    intakeSelections: patientIntake?.intakeSelections || {},

    dynamicNeeds: territory?.mainNeed
      ? [
          {
            id: `need_${Date.now()}`,
            label: territory.mainNeed,
            statut: "actif",
            source: "recueil",
          },
        ]
      : [],

    dynamicCategories: [],
    dynamicBlockages: [],
    actionPlan: [],
    hdjHistory: [],
    resourceFollowUp: [],
    spiritNotes: [],
    history: [],
    incidentHistory: [],

    personneConfiance: {
      nom: identity.personneConfiance || "",
      prenom: "",
      telephone: "",
      lien: "",
    },

    personneAPrevenir: {
      nom: identity.personneAPrevenir || "",
      prenom: "",
      telephone: "",
      lien: "",
    },

    mesureProtection: identity.mesureProtection || "",
    source: "SIMULATION",
    createdAt: new Date().toISOString(),

    territory: {
      city: territory?.city || "Cherbourg-en-Cotentin",
      postalCode: territory?.postalCode || "50100",
      street: territory?.street || "",
      housingType: territory?.housingType || "",
      mainNeed: territory?.mainNeed || "",
    },

    adresse: {
      city: territory?.city || "Cherbourg-en-Cotentin",
      postalCode: territory?.postalCode || "50100",
      street: territory?.street || "",
      housingType: territory?.housingType || "",
    },

    vigilance: identity.vigilance || "",
  };

  addSimulatedPatient(newPatient);
  navigate("/dashboard", { state: { highlightPatientId: id } });
}

return (
  <div style={wrap}>
    <div style={formColumns}>
      <section style={panelStyle}>
        <h3 style={sectionTitle}>Identité patient</h3>

        <div style={grid2}>
          <Field label="Nom">
            <input
              style={input}
              placeholder="Nom"
              value={identity.lastName || ""}
              onChange={(e) => updateIdentity("lastName", e.target.value)}
            />
          </Field>

          <Field label="Prénom">
            <input
              style={input}
              placeholder="Prénom"
              value={identity.firstName || ""}
              onChange={(e) => updateIdentity("firstName", e.target.value)}
            />
          </Field>
        </div>

        <div style={grid3}>
          <div style={grid4}>
  <Field label="Date de naissance">
    <input
      type="date"
      style={input}
      value={identity.birthDate || ""}
      onChange={(e) => updateBirthDate(e.target.value)}
    />
  </Field>

  <Field label="Âge">
    <input
      style={input}
      value={identity.age || ""}
      readOnly
      placeholder="Âge auto"
    />
  </Field>

  <Field label="Sexe">
    <select
      style={input}
      value={identity.sexe || "U"}
      onChange={(e) => updateIdentity("sexe", e.target.value)}
    >
      {SEX_OPTIONS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  </Field>

  <Field label="INS">
    <input
      style={input}
      placeholder="INS"
      value={identity.ins || ""}
      onChange={(e) => updateIdentity("ins", e.target.value)}
    />
  </Field>
</div>
        </div>

        <div style={grid2}>
          <Field label="IEP">
            <input
              style={input}
              placeholder="IEP"
              value={identity.iep || ""}
              onChange={(e) => updateIdentity("iep", e.target.value)}
            />
          </Field>

          <Field label="Service">
            <select
              style={input}
              value={identity.service || ""}
              onChange={(e) => updateService(e.target.value)}
            >
              <option value="">Sélectionner</option>
              {SERVICES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={grid2}>
          <Field label="Chambre">
            <select
              style={input}
              value={identity.room || ""}
              onChange={(e) => updateIdentity("room", e.target.value)}
              disabled={!selectedService}
            >
              <option value="">Sélectionner</option>
              {(selectedService?.rooms || []).map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Lit">
            <select
              style={input}
              value={identity.bed || ""}
              onChange={(e) => updateIdentity("bed", e.target.value)}
              disabled={!selectedService}
            >
              <option value="">Sélectionner</option>
              {(selectedService?.beds || []).map((bed) => (
                <option key={bed} value={bed}>
                  {bed}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={grid2}>
          <Field label="Personne de confiance">
            <input
              style={input}
              placeholder="Nom / coordonnées"
              value={identity.personneConfiance || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateIdentity("personneConfiance", value);
                updateStructuredIntake("social.personneConfiance", value);
              }}
            />
          </Field>

          <Field label="Personne à prévenir">
            <input
              style={input}
              placeholder="Nom / coordonnées"
              value={identity.personneAPrevenir || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateIdentity("personneAPrevenir", value);
                updateStructuredIntake("social.personneAPrevenir", value);
              }}
            />
          </Field>
        </div>

        <div style={grid2}>
          <Field label="Tutelle / curatelle">
            <input
              style={input}
              placeholder="Mesure de protection"
              value={identity.mesureProtection || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateIdentity("mesureProtection", value);
                updateStructuredIntake("social.protectionJuridique", value);
              }}
            />
          </Field>

          <Field label="Vigilance">
            <select
              style={input}
              value={identity.vigilance || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateIdentity("vigilance", value);
                updateStructuredIntake("social.isolementSocial", value === "Isolement");
                updateStructuredIntake("securite.isolement", value === "Isolement");
                updateStructuredIntake(
                  "securite.troublesCognitifs",
                  value === "Difficulté de compréhension"
                );
                updateStructuredIntake("securite.commentaire", value);
              }}
            >
              <option value="">Sélectionner</option>
              {VIGILANCE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={sectionTitle}>Repères utiles</h3>

        <div style={grid2}>
          <Field label="Adresse">
            <input
              style={input}
              placeholder="Adresse"
              value={territory.street || ""}
              onChange={(e) => updateTerritory("street", e.target.value)}
            />
          </Field>

          <Field label="Ville">
            <input
              style={input}
              placeholder="Ville"
              value={territory.city || ""}
              onChange={(e) => updateTerritory("city", e.target.value)}
            />
          </Field>
        </div>

        <div style={grid3}>
          <Field label="Code postal">
            <input
              style={input}
              placeholder="Code postal"
              value={territory.postalCode || ""}
              onChange={(e) => updateTerritory("postalCode", e.target.value)}
            />
          </Field>

          <Field label="Type d'habitat">
            <select
              style={input}
              value={territory.housingType || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateTerritory("housingType", value);
                updateStructuredIntake(
                  "social.precarite",
                  value === "Hébergement précaire" || value === "Sans domicile"
                );
                updateStructuredIntake(
                  "entourage.enInstitution",
                  value === "EHPAD" || value === "Résidence autonomie"
                );
              }}
            >
              <option value="">Sélectionner</option>
              {HABITAT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Besoin principal">
            <input
              style={input}
              placeholder="Ex : sortie à sécuriser"
              value={territory.mainNeed || ""}
              onChange={(e) => {
                const value = e.target.value;
                updateTerritory("mainNeed", value);
                updateStructuredIntake("commentairesGeneraux", value);
              }}
            />
          </Field>
        </div>

        <div style={hintBlock}>
          <div style={hintTitle}>À retenir</div>
          <ul style={hintList}>
            <li>Cette vue sert seulement à préparer la simulation avant le DPI.</li>
            <li>Les critères sélectionnés à droite déclencheront les ressources du copilote.</li>
            <li>En pédiatrie, on garde le socle adulte et on ajoute les besoins spécifiques de l’enfant.</li>
          </ul>
        </div>
      </section>
    </div>

    <button type="button" style={floatingButton} onClick={handleCreatePatient}>
      Créer le patient
    </button>
  </div>
);
}

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const wrap = { display: "grid", gap: 16 };
const formColumns = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" };
const panelStyle = { display: "grid", gap: 14, minHeight: 560, padding: 16, borderRadius: 16, border: "1px solid #dbe3f1", background: "#fff" };
const sectionTitle = { margin: 0, fontSize: 16, fontWeight: 900, color: "#17376a" };
const fieldWrap = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.2 };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
const input = { width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid #d6deea", padding: "10px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box" };
const hintBlock = { border: "1px solid #e6ebf2", borderRadius: 14, background: "#fbfcfe", padding: 14, display: "grid", gap: 8, alignContent: "start" };
const hintTitle = { fontSize: 12, fontWeight: 900, color: "#17376a", textTransform: "uppercase", letterSpacing: 0.2 };
const hintList = { margin: 0, paddingLeft: 18, color: "#475569", fontSize: 13, lineHeight: 1.5 };
const floatingButton = { position: "fixed", right: 24, bottom: 24, height: 50, padding: "0 18px", borderRadius: 999, border: "1px solid #1d4b8f", background: "#1d4b8f", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 14px 28px rgba(29, 75, 143, 0.22)", zIndex: 30 };
