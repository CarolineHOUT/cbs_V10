import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { usePatientSimulation } from "../context/PatientSimulationContext";
import { canAccessPatient } from "./access";

export default function ScopedPatientRoute({ children }) {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { getPatientById } = usePatientSimulation();
  const patient = getPatientById(id);

  if (!patient) {
    return <Navigate to="/dashboard" replace state={{ accessError: "Patient introuvable." }} />;
  }

  if (!canAccessPatient(currentUser, patient)) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          accessError: `Accès refusé : ce patient appartient au service ${patient.service || "non renseigné"}.`,
        }}
      />
    );
  }

  return children;
}