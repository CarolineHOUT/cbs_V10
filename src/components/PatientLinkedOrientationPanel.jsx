import { usePatientIntake } from "../context/PatientIntakeContext";

function inferOrientation(patient) {
  const city = patient.territory.city;
  const need = (patient.territory.mainNeed || "").toLowerCase();

  let territory = "—";
  if (city.includes("Cherbourg")) territory = "Nord Cotentin";
  else if (city.includes("Saint-Lô")) territory = "Centre Manche";
  else if (city.includes("Avranches")) territory = "Sud Manche";

  let orientation = "—";

  if (need.includes("domicile")) {
    orientation = "Aide à domicile + IDEL + DAC";
  } else if (need.includes("coordination")) {
    orientation = "DAC + service social";
  } else {
    orientation = "Évaluation médico-sociale";
  }

  return { territory, orientation };
}

export default function PatientLinkedOrientationPanel() {
  const { patientIntake } = usePatientIntake();

  const result = inferOrientation(patientIntake);

  return (
    <div style={{ padding: 20, borderTop: "1px solid #ddd" }}>
      <h2>Orientation proposée</h2>

      <div>
        <strong>Commune :</strong> {patientIntake.territory.city || "—"}
      </div>

      <div>
        <strong>Territoire :</strong> {result.territory}
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Orientation :</strong> {result.orientation}
      </div>
    </div>
  );
}