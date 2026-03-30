import {
  patientProfiles,
  urgencyLevels,
  territories,
} from "../data/territorialResourceCatalog";
import { buildOrientationSummary } from "../services/orientationSuggestionService";

function Section({ title, children }) {
  return (
    <section
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function ResourceCard({ resource }) {
  return (
    <div
      style={{
        border: "1px solid #ececec",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        background: "#fafafa",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{resource.name}</div>
      <div><strong>Type :</strong> {resource.structureType || "—"}</div>
      <div><strong>Couverture :</strong> {resource.coverage || "—"}</div>
      <div><strong>Public :</strong> {resource.target || "—"}</div>
      <div><strong>Prise en charge :</strong> {resource.careType || "—"}</div>
      <div><strong>Téléphone :</strong> {resource.phone || "—"}</div>
      <div><strong>Orientation directe :</strong> {resource.directOrientation || "—"}</div>
      <div><strong>Prescription :</strong> {resource.prescriptionRequired || "—"}</div>
      <div><strong>Commentaire :</strong> {resource.fieldComment || "—"}</div>
    </div>
  );
}

export default function OrientationSuggestionPanel({
  territoryId = "T_NORD",
  profileId = "P_RETOUR_COMPLEXE",
  urgencyId = "U_J0",
}) {
  const result = buildOrientationSummary({
    territoryId,
    profileId,
    urgencyId,
  });

  const territoryLabel =
    territories.find((item) => item.id === territoryId)?.label || "—";

  const profileLabel =
    patientProfiles.find((item) => item.id === profileId)?.label || "—";

  const urgencyLabel =
    urgencyLevels.find((item) => item.id === urgencyId)?.label || "—";

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Suggestions d’orientation</h1>

      <Section title="Contexte d’analyse">
        <div><strong>Territoire :</strong> {territoryLabel}</div>
        <div><strong>Profil patient :</strong> {profileLabel}</div>
        <div><strong>Niveau d’urgence :</strong> {urgencyLabel}</div>
      </Section>

      {result.warning ? (
        <Section title="Résultat">
          <div>{result.warning}</div>
        </Section>
      ) : (
        <>
          <Section title="Règle appliquée">
            <div><strong>Déclencheur :</strong> {result.rule?.trigger || "—"}</div>
            <div><strong>Commentaire :</strong> {result.rule?.comment || "—"}</div>
            <div style={{ marginTop: 8 }}>
              <strong>Synthèse :</strong> {result.summary || "—"}
            </div>
          </Section>

          {result.suggestions.map((suggestion) => (
            <Section
              key={`${suggestion.rank}-${suggestion.subcategoryId}`}
              title={`Orientation ${suggestion.rank} — ${suggestion.subcategoryLabel || "Non définie"}`}
            >
              {suggestion.resources.length === 0 ? (
                <div>Aucune ressource trouvée pour cette orientation.</div>
              ) : (
                suggestion.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))
              )}
            </Section>
          ))}
        </>
      )}
    </div>
  );
}