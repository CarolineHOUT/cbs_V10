export const INTAKE_MAPPING_RULES = [
  {
    id: "isolement-social",

    when: (intake) =>
      intake?.entourage?.seul === true ||
      intake?.social?.isolementSocial === true,

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

  {
    id: "absence-relais",

    when: (intake) =>
      intake?.entourage?.aucuneAide === true,

    freins: [
      {
        code: "absence_relais",
        label: "Absence de relais",
        severity: "high",
      },
    ],

    consequences: [
      {
        code: "retour_fragile",
        label: "Retour fragile sans soutien",
      },
    ],

    orientations: [
      {
        code: "coordination_domicile",
        label: "Coordination du retour à domicile",
        priority: 2,
      },
    ],
  },

  {
    id: "perte-autonomie",

    when: (intake) =>
      ["P", "T"].includes(intake?.dependance?.toilette) ||
      ["P", "T"].includes(intake?.dependance?.habillage) ||
      ["P", "T"].includes(intake?.dependance?.alimentation) ||
      ["P", "T"].includes(intake?.dependance?.mobilisation),

    freins: [
      {
        code: "perte_autonomie",
        label: "Perte d'autonomie",
        severity: "high",
      },
    ],

    consequences: [
      {
        code: "besoin_aides",
        label: "Besoin d'aides au quotidien",
      },
    ],

    orientations: [
      {
        code: "evaluation_autonomie",
        label: "Évaluation de l'autonomie",
        priority: 1,
      },
      {
        code: "organisation_aides",
        label: "Organisation des aides",
        priority: 2,
      },
    ],
  },

  {
    id: "troubles-cognitifs",

    when: (intake) =>
      intake?.securite?.troublesCognitifs === true ||
      intake?.securite?.desorientation === true,

    freins: [
      {
        code: "troubles_cognitifs",
        label: "Troubles cognitifs",
        severity: "high",
      },
    ],

    consequences: [
      {
        code: "risque_errance",
        label: "Risque d'errance ou de désorganisation",
      },
    ],

    orientations: [
      {
        code: "evaluation_cognitive",
        label: "Évaluation cognitive",
        priority: 1,
      },
      {
        code: "securisation_sortie",
        label: "Sécurisation de la sortie",
        priority: 2,
      },
    ],
  },

  {
    id: "risque-chute",

    when: (intake) =>
      intake?.securite?.risqueChute === true,

    freins: [
      {
        code: "risque_chute",
        label: "Risque de chute",
        severity: "medium",
      },
    ],

    consequences: [
      {
        code: "retour_a_amenager",
        label: "Retour nécessitant aménagement",
      },
    ],

    orientations: [
      {
        code: "prevention_chute",
        label: "Prévention du risque de chute",
        priority: 2,
      },
    ],
  },

  {
    id: "observance-fragile",

    when: (intake) =>
      intake?.traitement?.difficulte?.observanceFragile === true ||
      intake?.traitement?.difficulte?.oublis === true ||
      intake?.traitement?.difficulte?.confusion === true,

    freins: [
      {
        code: "observance_fragile",
        label: "Observance fragile",
        severity: "medium",
      },
    ],

    consequences: [
      {
        code: "risque_rupture_traitement",
        label: "Risque de rupture de traitement",
      },
    ],

    orientations: [
      {
        code: "conciliation_traitement",
        label: "Sécurisation du traitement",
        priority: 2,
      },
    ],
  },

  {
    id: "precarite-sociale",

    when: (intake) =>
      intake?.social?.precarite === true,

    freins: [
      {
        code: "precarite",
        label: "Précarité sociale",
        severity: "high",
      },
    ],

    consequences: [
      {
        code: "retour_instable",
        label: "Retour instable",
      },
    ],

    orientations: [
      {
        code: "accompagnement_social",
        label: "Accompagnement social renforcé",
        priority: 1,
      },
    ],
  },

  {
    id: "situation-complexe",

    when: (intake) =>
      (
        ["P", "T"].includes(intake?.dependance?.toilette) ||
        ["P", "T"].includes(intake?.dependance?.habillage) ||
        ["P", "T"].includes(intake?.dependance?.mobilisation)
      ) &&
      (
        intake?.social?.isolementSocial === true ||
        intake?.entourage?.aucuneAide === true ||
        intake?.securite?.troublesCognitifs === true
      ),

    freins: [
      {
        code: "situation_complexe",
        label: "Situation complexe",
        severity: "critical",
      },
    ],

    consequences: [
      {
        code: "sortie_haut_risque",
        label: "Sortie à haut risque",
      },
    ],

    orientations: [
      {
        code: "concertation_pluridisciplinaire",
        label: "Concertation pluridisciplinaire",
        priority: 1,
      },
    ],
  },
];