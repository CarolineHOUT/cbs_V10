export function getPatientContacts(patient) {
  const personneConfiance = {
    nom:
      patient?.structuredIntake?.contacts?.personneConfiance?.nom ||
      patient?.personneConfiance?.nom ||
      patient?.structuredIntake?.social?.personneConfiance ||
      (typeof patient?.personneConfiance === "string" ? patient.personneConfiance : "") ||
      "",
    prenom:
      patient?.structuredIntake?.contacts?.personneConfiance?.prenom ||
      patient?.personneConfiance?.prenom ||
      "",
    telephone:
      patient?.structuredIntake?.contacts?.personneConfiance?.telephone ||
      patient?.personneConfiance?.telephone ||
      patient?.personneConfiance?.tel ||
      "",
    adresse:
      patient?.structuredIntake?.contacts?.personneConfiance?.adresse ||
      patient?.personneConfiance?.adresse ||
      "",
    lien:
      patient?.structuredIntake?.contacts?.personneConfiance?.lien ||
      patient?.personneConfiance?.lien ||
      "",
  };

  const personneAPrevenir = {
    nom:
      patient?.structuredIntake?.contacts?.personneAPrevenir?.nom ||
      patient?.personneAPrevenir?.nom ||
      patient?.structuredIntake?.social?.personneAPrevenir ||
      (typeof patient?.personneAPrevenir === "string" ? patient.personneAPrevenir : "") ||
      "",
    prenom:
      patient?.structuredIntake?.contacts?.personneAPrevenir?.prenom ||
      patient?.personneAPrevenir?.prenom ||
      "",
    telephone:
      patient?.structuredIntake?.contacts?.personneAPrevenir?.telephone ||
      patient?.personneAPrevenir?.telephone ||
      patient?.personneAPrevenir?.tel ||
      "",
    adresse:
      patient?.structuredIntake?.contacts?.personneAPrevenir?.adresse ||
      patient?.personneAPrevenir?.adresse ||
      "",
    lien:
      patient?.structuredIntake?.contacts?.personneAPrevenir?.lien ||
      patient?.personneAPrevenir?.lien ||
      "",
  };
const protectionJuridique = {
  type:
    patient?.structuredIntake?.social?.protectionJuridique ||
    patient?.protectionJuridique ||
    "",

  representant:
    patient?.structuredIntake?.social?.representantLegal ||
    patient?.representantLegal ||
    "",

  telephone:
    patient?.structuredIntake?.social?.telephoneRepresentant ||
    patient?.structuredIntake?.social?.telRepresentant ||
    patient?.representantLegal?.telephone ||
    patient?.tuteur?.telephone ||
    "",
};
  return { personneConfiance, personneAPrevenir };
}