export const INTAKE_MAPPING_RULES = [
  {
    id: "isolement-social",

    when: (intake) =>
      intake?.entourage?.seule ||
      intake?.social?.isolementSocial,

    freins: [
      {
        code: "isolement",
        label: "Isolement social",
        severity: "high",
      },
    ],

    consequences: [
      {
        code: "retour_non_securise",
        label: "Retour à domicile non sécurisé",
      },
    ],

    orientations: [
      {
        code: "evaluation_sociale",
        label: "Évaluation sociale",
        priority: 1,
      },
    ],
  },
];