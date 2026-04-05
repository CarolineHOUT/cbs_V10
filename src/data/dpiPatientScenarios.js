export const PATIENT_SCENARIOS = [
  {
    id: "retour_simple",
    weight: 3,
    intake: {
      contacts: {
        personneConfiance: {
          nom: "Dupont",
          prenom: "Marie",
          telephone: "06 12 34 56 78",
          adresse: "12 rue des Fleurs",
          lien: "Fille",
        },
        personneAPrevenir: {
          nom: "Martin",
          prenom: "Paul",
          telephone: "06 98 76 54 32",
          adresse: "8 avenue de la Gare",
          lien: "Fils",
        },
      },
      entourage: { seul: false, enFamille: true, aidant: true, aideFamiliale: true },
      dependance: { toilette: "A", habillage: "A", alimentation: "A", mobilisation: "A" },
      social: {
        personneConfiance: "Marie Dupont",
        personneAPrevenir: "Paul Martin",
        isolementSocial: false,
      },
      securite: {},
      traitement: {},
      materiel: {},
    },
  },

  {
    id: "isolement_social",
    weight: 3,
    intake: {
      contacts: {
        personneConfiance: {
          nom: "Leroy",
          prenom: "Anne",
          telephone: "07 11 22 33 44",
          adresse: "5 rue du Port",
          lien: "Épouse",
        },
        personneAPrevenir: {
          nom: "Bernard",
          prenom: "Luc",
          telephone: "07 55 66 77 88",
          adresse: "19 rue Centrale",
          lien: "Frère",
        },
      },
      entourage: { seul: true, aucuneAide: true },
      dependance: { gestionTraitement: "P" },
      social: {
        personneConfiance: "Anne Leroy",
        personneAPrevenir: "Luc Bernard",
        isolementSocial: true,
      },
      securite: { isolement: true },
      traitement: { difficulte: { oublis: true } },
      materiel: {},
    },
  },

  {
    id: "perte_autonomie",
    weight: 2,
    intake: {
      contacts: {
        personneConfiance: {
          nom: "Petit",
          prenom: "Claire",
          telephone: "06 21 43 65 87",
          adresse: "3 impasse des Mimosas",
          lien: "Fille",
        },
        personneAPrevenir: {
          nom: "Robert",
          prenom: "Jean",
          telephone: "06 89 45 23 10",
          adresse: "22 rue Victor Hugo",
          lien: "Neveu",
        },
      },
      entourage: { enFamille: true, aidant: true, aideADomicile: true },
      dependance: { toilette: "P", habillage: "P", mobilisation: "P" },
      social: {
        personneConfiance: "Claire Petit",
        personneAPrevenir: "Jean Robert",
      },
      securite: { risqueChute: true },
      traitement: {},
      materiel: { aidesTechniques: { deambulateur: true } },
    },
  },

  {
    id: "troubles_cognitifs",
    weight: 2,
    intake: {
      contacts: {
        personneConfiance: {
          nom: "Moreau",
          prenom: "Sophie",
          telephone: "06 44 55 66 77",
          adresse: "10 rue des Lilas",
          lien: "Fille",
        },
        personneAPrevenir: {
          nom: "Garcia",
          prenom: "Luis",
          telephone: "07 88 99 00 11",
          adresse: "45 rue du Centre",
          lien: "Gendre",
        },
      },
      entourage: { enFamille: true, aidant: true },
      dependance: { toilette: "P", gestionTraitement: "T" },
      social: {
        personneConfiance: "Sophie Moreau",
        personneAPrevenir: "Luis Garcia",
      },
      securite: { troublesCognitifs: true, desorientation: true },
      traitement: { difficulte: { confusion: true } },
      materiel: { aidesTechniques: { deambulateur: true } },
    },
  },

  {
    id: "situation_complexe",
    weight: 2,
    intake: {
      contacts: {
        personneConfiance: {
          nom: "Durand",
          prenom: "Michel",
          telephone: "06 33 22 11 00",
          adresse: "7 rue du Stade",
          lien: "Frère",
        },
        personneAPrevenir: {
          nom: "Roux",
          prenom: "Isabelle",
          telephone: "07 22 33 44 55",
          adresse: "14 avenue Victor Hugo",
          lien: "Sœur",
        },
      },
      entourage: { seul: true, aucuneAide: true },
      dependance: { toilette: "T", mobilisation: "T" },
      social: {
        personneConfiance: "Michel Durand",
        personneAPrevenir: "Isabelle Roux",
        isolementSocial: true,
      },
      securite: {
        troublesCognitifs: true,
        desorientation: true,
        logementInadapte: true,
      },
      traitement: { difficulte: { confusion: true } },
      materiel: { aidesTechniques: { fauteuil: true } },
    },
  },
];