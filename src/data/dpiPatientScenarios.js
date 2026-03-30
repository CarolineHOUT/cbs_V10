export const PATIENT_SCENARIOS = [
  {
    id: "retour_simple",
    weight: 3,
    intake: {
      entourage: { seule: false },
      dependance: { toilette: "A" },
    },
  },

  {
    id: "isolement_social",
    weight: 2,
    intake: {
      entourage: { seule: true },
      social: { isolementSocial: true },
    },
  },

  {
    id: "perte_autonomie",
    weight: 2,
    intake: {
      dependance: { toilette: "P", habillage: "P" },
    },
  },

  {
    id: "observance_fragile",
    weight: 2,
    intake: {
      traitement: {
        difficulte: { observanceFragile: true },
      },
    },
  },

  {
    id: "troubles_cognitifs",
    weight: 2,
    intake: {
      securite: {
        troublesCognitifs: true,
        desorientation: true,
      },
    },
  },

  {
    id: "risque_chute",
    weight: 2,
    intake: {
      securite: { risqueChute: true },
    },
  },

  {
    id: "situation_complexe",
    weight: 1,
    intake: {
      entourage: { seule: true },
      dependance: { toilette: "T" },
      securite: { risqueChute: true },
      traitement: {
        difficulte: { observanceFragile: true },
      },
    },
  },
];