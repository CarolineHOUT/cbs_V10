export function calculateAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const dob = new Date(birthDate);

  if (Number.isNaN(dob.getTime())) return null;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export const emptyPatientIntake = {
 identity: {
  lastName: "",
  firstName: "",
  birthDate: "",
  age: null,
  sexe: "U",
  ins: "",
  iep: "",
  service: "",
  room: "",
  bed: "",
},

  stay: {
    admissionDate: "",
    generalReason: "",
    unit: "",
    plannedDischargeDate: "",
    dischargeStatus: "",
    mainBarrier: "",
    coordinationRequired: false,
  },

  socialContext: {
    autonomy: "",
    dependency: "",
    vulnerabilities: [],
    psychosocialContext: "",
    socialSituation: "",
    entourage: "",
    trustedPerson: "",
    legalRepresentative: "",
    contactToNotify: "",
  },

  territory: {
    city: "",
    territory: "",
    mainNeed: "",
    secondaryNeed: "",
    proposedOrientation: "",
    suggestedResource: "",
  },

  scenario: {
    type: "",
    specificData: {},
  },
};

export const demoPatientComplex = {
  identity: {
     lastName: "MARTIN",
  firstName: "Jeanne",
  birthDate: "1942-09-14",
  age: calculateAge("1942-09-14"),
  sexe: "F",
  ins: "2 42 09 14 123 456 78",
  iep: "IEP-2026-004582",
  service: "Médecine polyvalente",
  room: "214",
  bed: "B",
},

  stay: {
    admissionDate: "2026-03-18",
    generalReason: "Hospitalisation non programmée",
    unit: "Unité de médecine gériatrique",
    plannedDischargeDate: "2026-03-26",
    dischargeStatus: "Sortie non sécurisée à ce stade",
    mainBarrier: "Absence de solution d'accompagnement immédiate au domicile",
    coordinationRequired: true,
  },

  socialContext: {
    autonomy: "Fragilité fonctionnelle",
    dependency: "Aide partielle pour les actes essentiels",
    vulnerabilities: [
      "Isolement",
      "Fragilité psychologique",
      "Vulnérabilité socio-économique",
    ],
    psychosocialContext:
      "Patiente anxieuse, entourage peu disponible, difficultés de compréhension des relais existants.",
    socialSituation:
      "Vit seule à domicile, logement en étage, réseau de soutien limité.",
    entourage: "Voisine présente ponctuellement, fille vivant à 80 km.",
    trustedPerson: "Claire Martin - fille",
    legalRepresentative: "",
    contactToNotify: "Claire Martin - 06 12 34 56 78",
  },

  territory: {
    city: "Roubaix",
    territory: "Territoire Est",
    mainNeed: "Aide au maintien à domicile",
    secondaryNeed: "Coordination médico-sociale",
    proposedOrientation: "",
    suggestedResource: "",
  },

  scenario: {
    type: "patient_complexe_sans_solution_sortie",
    specificData: {
      tensionLevel: "élevée",
      crisisCellCandidate: true,
    },
  },
};

export const demoPatientVulnerable = {
  identity: {
    lastName: "DUPONT",
    firstName: "Marc",
    birthDate: "1958-01-22",
    age: calculateAge("1958-01-22"),
    ins: "1 58 01 22 987 654 32",
    iep: "IEP-2026-004601",
    service: "Neurologie",
    room: "118",
    bed: "A",
  },

  stay: {
    admissionDate: "2026-03-21",
    generalReason: "Hospitalisation non programmée",
    unit: "Unité neurovasculaire",
    plannedDischargeDate: "",
    dischargeStatus: "Hospitalisation en cours",
    mainBarrier: "Patient vulnérable nécessitant surveillance rapprochée",
    coordinationRequired: true,
  },

  socialContext: {
    autonomy: "Perte ou risque de perte d'autonomie",
    dependency: "Besoin d'accompagnement rapproché",
    vulnerabilities: [
      "Troubles cognitifs",
      "Désorientation",
      "Risque de fugue",
    ],
    psychosocialContext:
      "Patient désorienté par moments, adhésion fluctuante aux consignes.",
    socialSituation:
      "Vit avec son épouse, entourage présent mais pas toujours immédiatement disponible.",
    entourage: "Épouse principale aidante",
    trustedPerson: "Sophie Dupont - épouse",
    legalRepresentative: "",
    contactToNotify: "Sophie Dupont - 06 98 76 54 32",
  },

  territory: {
    city: "Tourcoing",
    territory: "Territoire Nord",
    mainNeed: "Sécurisation du parcours",
    secondaryNeed: "Coordination entourage / service",
    proposedOrientation: "",
    suggestedResource: "",
  },

  scenario: {
    type: "sortie_insu_service",
    specificData: {
      vulnerabilityLevel: "critique",
      immediateAlertRequired: true,
    },
  },
};

export const demoPatientPediaASE = {
  identity: {
    lastName: "BERNARD",
    firstName: "Lina",
    birthDate: "2020-06-03",
    age: calculateAge("2020-06-03"),
    ins: "2 20 06 03 111 222 33",
    iep: "IEP-2026-004733",
    service: "Pédiatrie",
    room: "P12",
    bed: "1",
  },

  stay: {
    admissionDate: "2026-03-20",
    generalReason: "Admission hospitalière non programmée",
    unit: "Pédiatrie générale",
    plannedDischargeDate: "2026-03-24",
    dischargeStatus: "Sortie à coordonner",
    mainBarrier: "Coordination médico-sociale requise",
    coordinationRequired: true,
  },

  socialContext: {
    autonomy: "Évaluation de l'autonomie nécessaire",
    dependency: "Dépendance liée à l'âge",
    vulnerabilities: [
      "Contexte psycho-social",
      "Fragilité familiale",
    ],
    psychosocialContext:
      "Besoin de coordination avec les acteurs de l'enfance pour sécuriser la suite du parcours.",
    socialSituation:
      "Contexte familial nécessitant un échange structuré avec les partenaires concernés.",
    entourage: "Mère présente, situation à préciser",
    trustedPerson: "",
    legalRepresentative: "Représentant légal à confirmer",
    contactToNotify: "Contact hospitalier à définir",
  },

  territory: {
    city: "Lille",
    territory: "Territoire Centre",
    mainNeed: "Coordination ASE",
    secondaryNeed: "Préparation de sortie",
    proposedOrientation: "",
    suggestedResource: "",
  },

  scenario: {
    type: "pedia_maternite_ase",
    specificData: {
      duoViewEligible: true,
      hospitalFormRequired: true,
    },
  },
};
export const emptyStructuredIntake = {
  entourage: {
    seul: false,
    enFamille: false,
    enInstitution: false,
    aidant: false,
    aucuneAide: false,
    aideADomicile: false,
    aideFamiliale: false,
    commentaire: "",
  },

  gir: {
    gir: "",
    repas: {
      portage: false,
      telealarme: false,
      repasMamy: false,
    },
    passageIDE: {
      oui: false,
      non: false,
      frequence: "",
      nomInfirmier: "",
      numero: "",
    },
    pharmacie: {
      preparateur: "",
      nomPharmacie: "",
      pilulier: false,
      vrac: false,
    },
    kine: {
      oui: false,
      non: false,
      typePriseEnCharge: "",
      nomKine: "",
    },
  },

  traitement: {
    observePar: {
      patient: false,
      famille: false,
      autre: false,
    },
    modePreparation: {
      pilulier: false,
      vrac: false,
      mixte: false,
      inconnu: false,
    },
    difficulte: {
      oublis: false,
      confusion: false,
      refus: false,
      observanceFragile: false,
    },
    commentaire: "",
  },

  dependance: {
    toilette: "",
    habillage: "",
    alimentation: "",
    eliminationUrinaire: "",
    eliminationFecale: "",
    mobilisation: "",
    gestionTraitement: "",
    niveaux: ["A", "P", "T"], // A = autonome, P = partiel, T = total
    commentaire: "",
  },

  securite: {
    risqueChute: false,
    isolement: false,
    troublesCognitifs: false,
    desorientation: false,
    refusAide: false,
    logementInadapte: false,
    commentaire: "",
  },

  materiel: {
    protheses: {
      auditives: false,
      dentaires: false,
      lunettes: false,
      autre: false,
    },
    aidesTechniques: {
      canne: false,
      deambulateur: false,
      fauteuil: false,
      litMedicalise: false,
      autre: false,
    },
    commentaire: "",
  },

  social: {
    personneConfiance: "",
    personneAPrevenir: "",
    protectionJuridique: "",
    isolementSocial: false,
    precarite: false,
    commentaire: "",
  },

  commentairesGeneraux: "",
};
export const demoPatients = [
  demoPatientComplex,
  demoPatientVulnerable,
  demoPatientPediaASE,
];