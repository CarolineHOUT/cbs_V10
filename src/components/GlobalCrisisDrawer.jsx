import React, { useMemo, useState } from "react";
import { useCrisisCenter } from "../context/CrisisCenterContext";
import { usePatientSimulation } from "../context/PatientSimulationContext";
import { patients as defaultPatients } from "../data/patients";

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SERVICE_AGENTS = {
  "Médecine": ["Dr Martin", "IDE Dupont", "AS Leroy", "Cadre Simon"],
  "Médecine polyvalente": ["Dr Martin", "IDE Dupont", "AS Leroy", "Cadre Simon"],
  "Chirurgie": ["Dr Petit", "IDE Roux", "AS Garnier", "Cadre Morel"],
  "Pédiatrie": ["Dr Bernard", "IDE Colin", "AS Noël", "Cadre Pires"],
  "Maternité": ["Dr Valette", "IDE Lenoir", "AS Hebert", "Cadre Joly"],
  "Neurologie": ["Dr Fabre", "IDE Lamy", "AS Clerc", "Cadre Vidal"],
};

const GLOBAL_AGENTS = ["Claire Leroy", "Marc Durand", "Julie Simon", "Paul Moreau"];

export default function GlobalCrisisDrawer() {
  const { crisisOpen, closeCrisisCell, contextData } = useCrisisCenter();
  const { patients = [] } = usePatientSimulation();
  const mergedPatients = useMemo(() => uniqueById([...(patients || []), ...defaultPatients]), [patients]);
  const [selectedIds, setSelectedIds] = useState(() => []);
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState([]);

  React.useEffect(() => {
    if (!crisisOpen) return;
    const patientFromContext = contextData?.patient?.id ? [String(contextData.patient.id)] : [];
    setSelectedIds(patientFromContext);
    setDate("");
    setParticipants([]);
  }, [crisisOpen, contextData]);

  const selectedPatients = useMemo(
    () => mergedPatients.filter((patient) => selectedIds.includes(String(patient.id))),
    [mergedPatients, selectedIds]
  );

  const serviceParticipants = useMemo(() => {
    const serviceSet = new Set(selectedPatients.map((item) => item.service).filter(Boolean));
    const names = [];
    serviceSet.forEach((service) => {
      (SERVICE_AGENTS[service] || []).forEach((name) => names.push(name));
    });
    return [...new Set(names)];
  }, [selectedPatients]);

  if (!crisisOpen) return null;

  function togglePatient(id) {
    setSelectedIds((prev) => (prev.includes(String(id)) ? prev.filter((item) => item !== String(id)) : [...prev, String(id)]));
  }

  function toggleParticipant(label) {
    setParticipants((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  }

  return (
    <div className="crisis-overlay" onClick={closeCrisisCell}>
      <aside className="crisis-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="crisis-drawer__header">
          <div>
            <div className="crisis-drawer__eyebrow">Cellule de crise</div>
            <h2>Déclenchement nominatif</h2>
            <p>Participants du service concerné puis acteurs transverses, avec notification CARABBAS et mail.</p>
          </div>
          <button type="button" className="app-btn app-btn-ghost" onClick={closeCrisisCell}>Fermer</button>
        </div>

        <div className="crisis-drawer__body">
          <section className="crisis-card">
            <div className="crisis-card__title">Patients concernés</div>
            <div className="crisis-list">
              {mergedPatients.slice(0, 12).map((patient) => {
                const active = selectedIds.includes(String(patient.id));
                return (
                  <button key={patient.id} type="button" className={`crisis-patient ${active ? "active" : ""}`} onClick={() => togglePatient(patient.id)}>
                    <div>
                      <strong>{patient.nom} {patient.prenom}</strong>
                      <span>{patient.service || "Service non renseigné"}</span>
                    </div>
                    <span className={`app-chip ${String(patient.severity || patient.gravite || "").toLowerCase().includes("crit") ? "red" : "blue"}`}>
                      {patient.severity || patient.gravite || "À qualifier"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="crisis-card">
            <div className="crisis-card__title">Filtres suggérés</div>
            <div className="crisis-chip-grid">
              {["> 7 jours sans solution", "Sortie proche sans solution", "Blocages actifs", "Patients sans action"].map((item) => (
                <span key={item} className="app-chip amber">{item}</span>
              ))}
            </div>
          </section>

          <section className="crisis-card">
            <div className="crisis-card__title">Agents du service</div>
            <div className="crisis-chip-grid">
              {serviceParticipants.length ? serviceParticipants.map((item) => (
                <button key={item} type="button" className={`crisis-toggle ${participants.includes(item) ? "active" : ""}`} onClick={() => toggleParticipant(item)}>{item}</button>
              )) : <span className="app-muted">Sélectionner un patient pour proposer les agents du service.</span>}
            </div>
          </section>

          <section className="crisis-card">
            <div className="crisis-card__title">Acteurs transverses</div>
            <div className="crisis-chip-grid">
              {GLOBAL_AGENTS.map((item) => (
                <button key={item} type="button" className={`crisis-toggle ${participants.includes(item) ? "active" : ""}`} onClick={() => toggleParticipant(item)}>{item}</button>
              ))}
            </div>
          </section>

          <section className="crisis-card">
            <div className="crisis-card__title">Date retenue</div>
            <input className="copilot-input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="app-muted" style={{ marginTop: 8 }}>Notification CARABBAS + mail envoyés lors du lancement.</div>
          </section>
        </div>

        <div className="crisis-drawer__footer">
          <div className="app-muted">{selectedIds.length} patient(s) • {participants.length} participant(s)</div>
          <button type="button" className="app-btn app-btn-primary" onClick={closeCrisisCell}>Notifier et lancer</button>
        </div>
      </aside>
    </div>
  );
}
