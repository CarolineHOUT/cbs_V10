
import { useMemo, useState } from "react";
import { usePatientSimulation } from "../context/PatientSimulationContext";

/* =========================
   CONFIG
========================= */

const FORM_LINKS = {
  via_trajectoire: "https://trajectoire.sante-ra.fr/Trajectoire/",
  apa: "https://www.pour-les-personnes-agees.gouv.fr/api/v1/file/7e87084a-e7a2-4eb6-a92e-4618b729b936/Formulaire_demande_autonomie_cerfa_16301-01.pdf",
  mdph: "/docs/mdph.pdf",
  aide_exceptionnelle: "https://demarche.numerique.gouv.fr/",
  lettre_ase: "/ase/lettre-liaison",
  instance_ase: "/ase/preparation-instance",
};

const MENU_ITEMS = [
  { id: "situation", label: "Situation" },
  { id: "priorites", label: "À faire maintenant" },
  { id: "coordination", label: "Coordination" },
  { id: "actions", label: "Actions" },
  { id: "activite", label: "Activité" },
  { id: "orientation", label: "Orientation" },
  { id: "ressources", label: "Ressources" },
  { id: "formulaires", label: "Formulaires utiles" },
  { id: "hdj", label: "Sortie sécurisée / HDJ" },
  { id: "suivi", label: "Suivi demandes" },
  { id: "timeline", label: "Timeline" },
  { id: "synthese", label: "Synthèse" },
];

const CHIP_TO_SECTION = {
  "Date cible de sortie": "situation",
  "Date cible": "situation",
  "Séjour": "situation",
  "DMS": "situation",
  "Sortant médicalement": "situation",
  "Demande": "suivi",
  "Refus": "suivi",
  "Relance": "suivi",
  "HDJ": "hdj",
  "EHPAD": "orientation",
  "SMR": "orientation",
  "Coordination": "coordination",
  "Famille": "activite",
  "Urgent": "activite",
  "Action": "actions",
  "Parcours": "timeline",
};

const REFUSAL_REASONS = [
  "Pas de place",
  "Profil non compatible",
  "Refus patient / famille",
  "Délai trop long",
  "Dossier incomplet",
  "Territoire non couvert",
  "Orientation non adaptée",
  "Attente pièce complémentaire",
];

const BLOCK_REASONS = [
  "Attente décision médicale",
  "Attente famille",
  "Attente ressource externe",
  "Problème administratif",
  "Refus patient",
  "Problème social",
  "Protection juridique en attente",
];

const TARGET_STATUSES = ["estimée", "validée"];
const DISCHARGE_TYPES = [
  { value: "simple", label: "Sortie simple" },
  { value: "coordination_legere", label: "Coordination légère" },
  { value: "complexe", label: "Coordination complexe" },
];

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const ACTION_STATUSES = ["À faire", "En cours", "En attente externe", "Bloqué", "Réalisé"];
const EXCHANGE_TYPES = ["Action", "Info", "Famille", "Urgent"];
const EXCHANGE_STATUSES = ["À traiter", "En cours", "En attente de réponse", "Clos"];
const HDJ_FREQUENCY_OPTIONS = ["1 fois / semaine", "2 fois / semaine", "3 fois / semaine", "5 fois / semaine", "Personnalisé"];
const HDJ_DURATION_OPTIONS = ["1 semaine", "2 semaines", "3 semaines", "4 semaines", "6 semaines", "Personnalisé"];
const HDJ_SECRETARIAT_EMAIL = "secretariat.hdj@hopital.fr";

const CATEGORY_TREE = [
  { label: "Médical", children: ["traitement", "douleur", "surveillance", "dénutrition"] },
  { label: "Soins", children: ["pansements complexes", "surveillance IDE", "perfusions", "toilette complexe"] },
  { label: "Social", children: ["isolement", "aidant épuisé", "précarité", "droits sociaux"] },
  { label: "Protection", children: ["ASE", "mesure de protection", "tutelle", "curatelle"] },
  { label: "Orientation", children: ["EHPAD", "SMR", "HDJ", "retour domicile impossible"] },
  { label: "Logement / environnement", children: ["logement inadapté", "escaliers", "matériel", "retour impossible"] },
];

/* pas de mots-clés affichés par défaut */
const DEFAULT_KEYWORDS = [];

const AGENTS_BY_ROLE = {
  medecins: [
    { id: "med1", nom: "Dr Martin", matricule: "MED001", service: "Médecine polyvalente" },
    { id: "med2", nom: "Dr Leclerc", matricule: "MED002", service: "Gériatrie" },
    { id: "med3", nom: "Dr Simon", matricule: "MED003", service: "Médecine polyvalente" },
  ],
  ide: [
    { id: "ide1", nom: "IDE Bernard", matricule: "IDE001", service: "Médecine polyvalente" },
    { id: "ide2", nom: "IDE Leroy", matricule: "IDE002", service: "Gériatrie" },
    { id: "ide3", nom: "IDE Caron", matricule: "IDE003", service: "Médecine polyvalente" },
    { id: "ide4", nom: "IDE Vautrin", matricule: "IDE004", service: "Chirurgie" },
  ],
  cadre: [
    { id: "cad1", nom: "Cadre Dupont", matricule: "CAD001", service: "Médecine polyvalente" },
    { id: "cad2", nom: "Cadre Simon", matricule: "CAD002", service: "Gériatrie" },
    { id: "cad3", nom: "Cadre Levasseur", matricule: "CAD003", service: "Chirurgie" },
  ],
  as: [
    { id: "as1", nom: "AS Petit", matricule: "AS001", service: "Médecine polyvalente" },
    { id: "as2", nom: "AS Morel", matricule: "AS002", service: "Gériatrie" },
    { id: "as3", nom: "AS Blin", matricule: "AS003", service: "Chirurgie" },
  ],
  assistante_sociale: [
    { id: "soc1", nom: "Mme Garnier", matricule: "SOC001", service: "Équipe sociale" },
    { id: "soc2", nom: "Mme Lambert", matricule: "SOC002", service: "Équipe sociale" },
  ],
  secretaire_hdj: [
    { id: "hdj1", nom: "Mme Roussel", matricule: "HDJ001", service: "HDJ" },
    { id: "hdj2", nom: "Mme Baron", matricule: "HDJ002", service: "HDJ" },
  ],
};

const HDJ_ACTS = {
  medical: [
    "Avis médical programmé",
    "Réévaluation clinique",
    "Bilan thérapeutique",
    "Ajustement traitement",
    "Prescription de suivi",
  ],
  soins: [
    "Pansements complexes",
    "Surveillance IDE",
    "Perfusion",
    "Éducation thérapeutique",
    "Surveillance clinique ciblée",
  ],
  social: [
    "Évaluation sociale",
    "Entretien assistante sociale",
    "Aide aux droits",
    "Préparation aides domicile",
    "Soutien social",
  ],
  coordination: [
    "Coordination sociale",
    "Coordination DAC",
    "Organisation sortie",
    "Lien partenaires extérieurs",
    "Concertation pluriprofessionnelle",
  ],
  technique: [
    "Évaluation autonomie",
    "Bilan fonctionnel",
    "Organisation matériel",
    "Soins techniques programmés",
    "Préparation logistique",
  ],
};

const HDJ_LIBRARY = [
  {
    id: "hdj1",
    title: "HDJ soins techniques et coordination",
    keywords: ["pansements complexes", "surveillance IDE", "retour domicile impossible"],
    acts: ["Pansements complexes", "Surveillance IDE", "Coordination sociale"],
    recurrence: "recurrent",
    frequency: "2 fois / semaine",
    days: ["Lundi", "Jeudi"],
    duration: "3 semaines",
    actor: "Dr Martin",
    comment: "Modèle déjà utilisé pour sortie complexe avec besoin IDE.",
  },
  {
    id: "hdj2",
    title: "HDJ autonomie et réévaluation",
    keywords: ["grand âge", "autonomie", "SMR"],
    acts: ["Évaluation autonomie", "Bilan fonctionnel", "Réévaluation clinique"],
    recurrence: "ponctuel",
    frequency: "",
    days: [],
    duration: "1 semaine",
    actor: "Cadre Dupont",
    comment: "Modèle pour arbitrage orientation et autonomie.",
  },
  {
    id: "hdj3",
    title: "HDJ appui social et coordination",
    keywords: ["aidant épuisé", "droits sociaux", "mesure de protection"],
    acts: ["Coordination sociale", "Entretien assistante sociale", "Aide aux droits"],
    recurrence: "recurrent",
    frequency: "1 fois / semaine",
    days: ["Mardi"],
    duration: "4 semaines",
    actor: "Mme Garnier",
    comment: "Modèle orienté coordination sociale complexe.",
  },
];

const RESOURCE_DB = [
  {
    id: "dac_cotentin",
    name: "DAC Cotentin",
    family: "Coordination",
    subType: "DAC",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "DAC Cotentin",
    phone: "02 33 00 00 01",
    email: "dac@cotentin.fr",
    bestTimeToCall: "matin",
    activationMode: "appel",
    formLink: null,
    delay: "48h",
    availableSlots: 5,
    saturation: "orange",
    conditions: "Situations complexes",
    tags: ["coordination", "social", "complexe", "aidants"],
    notes: "Très réactif le matin, bon relais pour cas complexes.",
    recommended: true,
  },
  {
    id: "ssiad_cotentin",
    name: "SSIAD Cotentin",
    family: "Soins",
    subType: "SSIAD",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "Accueil SSIAD",
    phone: "02 33 00 00 10",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "appel",
    formLink: null,
    delay: "5-7 jours",
    availableSlots: 1,
    saturation: "red",
    conditions: "GIR 1-3, dossier médical et évaluation autonomie",
    tags: ["soins", "domicile", "grand age", "toilette", "surveillance"],
    notes: "Liste d’attente fréquente.",
    recommended: false,
  },
  {
    id: "had_normandie",
    name: "HAD Normandie",
    family: "Soins",
    subType: "HAD",
    territory: "Manche",
    zone: "Manche",
    contactPerson: "Coordination HAD",
    phone: "02 33 00 00 11",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "appel",
    formLink: null,
    delay: "24-72h",
    availableSlots: 4,
    saturation: "green",
    conditions: "Prescription médicale obligatoire",
    tags: ["soins lourds", "domicile", "perfusion", "pansement"],
    notes: "Bonne réactivité si dossier complet.",
    recommended: true,
  },
  {
    id: "idel_alma",
    name: "Cabinet IDEL Centre",
    family: "Soins",
    subType: "IDEL",
    territory: "Cherbourg",
    zone: "Cherbourg centre",
    contactPerson: "Cabinet Alma",
    phone: "02 33 00 00 02",
    email: "",
    bestTimeToCall: "matin",
    activationMode: "appel",
    formLink: null,
    delay: "24-48h",
    availableSlots: 3,
    saturation: "green",
    conditions: "Disponible surtout le matin",
    tags: ["soins", "pansement", "surveillance", "domicile", "idel"],
    notes: "Réponse plus simple avant 11h.",
    recommended: true,
  },
  {
    id: "admr_cotentin",
    name: "ADMR Cotentin",
    family: "Aide domicile",
    subType: "SAAD",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "Accueil ADMR",
    phone: "02 33 00 00 03",
    email: "",
    bestTimeToCall: "matin",
    activationMode: "mail",
    formLink: null,
    delay: "5 jours",
    availableSlots: 2,
    saturation: "orange",
    conditions: "Plan APA souvent requis",
    tags: ["autonomie", "aide domicile", "toilette", "repas", "grand age"],
    notes: "Saturé l’été, utile si relais domicile anticipé.",
    recommended: true,
  },
  {
    id: "relais_aidants",
    name: "Plateforme répit aidants",
    family: "Social",
    subType: "Répit",
    territory: "Manche",
    zone: "Manche",
    contactPerson: "Plateforme aidants",
    phone: "02 33 00 00 15",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "appel",
    formLink: null,
    delay: "3 jours",
    availableSlots: 6,
    saturation: "green",
    conditions: "Aidant identifié",
    tags: ["aidant", "répit", "social"],
    notes: "Très utile en épuisement de l’aidant.",
    recommended: false,
  },
  {
    id: "via_smr",
    name: "ViaTrajectoire SMR",
    family: "Orientation",
    subType: "SMR",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "Canal ViaTrajectoire",
    phone: "02 33 00 00 04",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "plateforme",
    formLink: FORM_LINKS.via_trajectoire,
    delay: "72h",
    availableSlots: 2,
    saturation: "orange",
    conditions: "Indication médicale et dossier complet",
    tags: ["smr", "orientation", "rééducation"],
    notes: "Bonne acceptation si dossier complet.",
    recommended: true,
  },
  {
    id: "via_ehpad",
    name: "ViaTrajectoire EHPAD",
    family: "Orientation",
    subType: "EHPAD",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "Canal ViaTrajectoire",
    phone: "02 33 00 00 05",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "plateforme",
    formLink: FORM_LINKS.via_trajectoire,
    delay: "72h",
    availableSlots: 3,
    saturation: "orange",
    conditions: "Dossier ViaTrajectoire complet",
    tags: ["ehpad", "orientation", "hébergement"],
    notes: "Délais longs selon établissements.",
    recommended: true,
  },
  {
    id: "materiel_medical",
    name: "Prestataire matériel médical Cotentin",
    family: "Technique",
    subType: "Matériel",
    territory: "Cotentin",
    zone: "Territoire complet",
    contactPerson: "Plateforme matériel",
    phone: "02 33 00 00 20",
    email: "",
    bestTimeToCall: "journée",
    activationMode: "appel",
    formLink: null,
    delay: "24-48h",
    availableSlots: 8,
    saturation: "green",
    conditions: "Prescription si matériel spécifique",
    tags: ["lit médicalisé", "matériel", "domicile"],
    notes: "Réponse rapide si besoin simple.",
    recommended: true,
  },
  {
    id: "hdj_coordination",
    name: "HDJ coordination polyvalent",
    family: "HDJ",
    subType: "HDJ",
    territory: "Cherbourg",
    zone: "Cherbourg",
    contactPerson: "Secrétariat HDJ",
    phone: "02 33 15 25 35",
    email: HDJ_SECRETARIAT_EMAIL,
    bestTimeToCall: "journée",
    activationMode: "interne",
    formLink: null,
    delay: "24h",
    availableSlots: 6,
    saturation: "green",
    conditions: "Prescription interne",
    tags: ["hdj", "coordination", "soins", "autonomie"],
    notes: "Création sur mesure par actes, secrétariat externe à CARABBAS.",
    recommended: true,
  },
];

/* =========================
   HELPERS
========================= */

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function tagStyle(kind = "neutral") {
  const map = {
    neutral: { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
    blue: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    green: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    amber: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    red: { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" },
    purple: { background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" },
  };

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    padding: "0 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    ...map[kind],
  };
}

function scoreResource(resource, keywords) {
  const haystack = normalize(
    [resource.name, resource.family, resource.subType, resource.territory, ...(resource.tags || [])].join(" ")
  );

  let score = 0;
  keywords.forEach((k) => {
    if (haystack.includes(normalize(k))) score += 10;
  });
  if (resource.recommended) score += 8;
  if ((resource.availableSlots || 0) > 0) score += 4;
  if (resource.saturation === "green") score += 6;
  if (resource.saturation === "red") score -= 4;
  return score;
}

function computeTimeline({ dischargeType, hasQualification, hasCoordination, hasRequests, hasSolution, isPlanned, isDischarged }) {
  if (dischargeType === "simple") {
    const steps = [
      { label: "Recueil", done: true },
      { label: "Qualification", done: hasQualification },
      { label: "Solution", done: hasSolution },
      { label: "Sortie planifiée", done: isPlanned },
      { label: "Sortie réalisée", done: isDischarged },
    ];
    const current = steps.findIndex((s) => !s.done);
    return {
      steps,
      current: current === -1 ? steps.length - 1 : current,
      percent: Math.round((steps.filter((s) => s.done).length / steps.length) * 100),
    };
  }

  const steps = [
    { label: "Recueil", done: true },
    { label: "Qualification", done: hasQualification },
    { label: "Coordination", done: hasCoordination },
    { label: "Demandes", done: hasRequests },
    { label: "Solution", done: hasSolution },
    { label: "Sortie planifiée", done: isPlanned },
    { label: "Sortie réalisée", done: isDischarged },
  ];

  const current = steps.findIndex((s) => !s.done);
  return {
    steps,
    current: current === -1 ? steps.length - 1 : current,
    percent: Math.round((steps.filter((s) => s.done).length / steps.length) * 100),
  };
}

function computeComplexity({ keywords, actions, resourceFollowUp, dischargeType, exchanges }) {
  if (dischargeType === "simple") {
    const heavySignals =
      keywords.length > 0 ||
      actions.some((a) => a.status !== "Réalisé") ||
      Object.keys(resourceFollowUp).length > 0 ||
      exchanges.some((e) => e.type === "Urgent");
    if (!heavySignals) return { label: "Faible", color: "green", score: 5 };
  }

  let score = 0;
  score += keywords.length * 3;
  score += actions.filter((a) => a.status === "Bloqué").length * 8;
  score += Object.values(resourceFollowUp).filter((r) => r.status === "refused").length * 10;
  score += exchanges.filter((e) => e.type === "Urgent" && e.status !== "Clos").length * 8;

  if (keywords.some((k) => normalize(k).includes("protection"))) score += 12;
  if (keywords.some((k) => normalize(k).includes("ase"))) score += 12;
  if (keywords.some((k) => normalize(k).includes("retour domicile impossible"))) score += 12;
  if (keywords.some((k) => normalize(k).includes("grand age"))) score += 8;

  if (score < 20) return { label: "Faible", color: "green", score };
  if (score < 40) return { label: "Modérée", color: "blue", score };
  if (score < 60) return { label: "Élevée", color: "amber", score };
  return { label: "Critique", color: "red", score };
}

function findSimilarHdjModels(keywords) {
  return HDJ_LIBRARY.map((model) => {
    const commonKeywords = model.keywords.filter((k) =>
      keywords.map(normalize).includes(normalize(k))
    );
    return {
      ...model,
      similarity: commonKeywords.length,
      commonKeywords,
    };
  })
    .filter((m) => m.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity);
}

function getStatusBadge(status) {
  if (status === "accepted") return { label: "Acceptée", color: "green" };
  if (status === "refused") return { label: "Refusée", color: "red" };
  if (status === "waiting") return { label: "En attente", color: "amber" };
  if (status === "relaunched") return { label: "Relancée", color: "blue" };
  if (status === "draft") return { label: "Proposée", color: "neutral" };
  if (status === "called_today") return { label: "Appel aujourd’hui", color: "blue" };
  if (status === "received") return { label: "Reçu", color: "blue" };
  if (status === "programmed") return { label: "Programmé", color: "green" };
  if (status === "needs_clarification") return { label: "À compléter", color: "amber" };
  return { label: "À solliciter", color: "neutral" };
}

function daysBetween(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function getSaturationColor(level) {
  if (level === "green") return "green";
  if (level === "orange") return "amber";
  if (level === "red") return "red";
  return "neutral";
}

function scrollToSection(setActiveSection, sectionId) {
  setActiveSection(sectionId);
  window.requestAnimationFrame(() => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      const stickyOffset = 92;
      const rect = el.getBoundingClientRect();
      const y = rect.top + window.scrollY - stickyOffset;
      window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" });
      el.style.boxShadow = "0 0 0 3px #c7d7ff";
      setTimeout(() => {
        el.style.boxShadow = "none";
      }, 1200);
    }
  });
}

function inferSectionFromAlert(label = "") {
  const normalized = normalize(label);
  const entry = Object.entries(CHIP_TO_SECTION).find(([key]) =>
    normalized.includes(normalize(key))
  );
  return entry ? entry[1] : "situation";
}

function computeNextStep(item) {
  if (!item) return "Proposer une ressource";
  if (item.status === "draft") return "Activer la ressource";
  if (item.status === "called_today") return "Tracer l’appel du jour";
  if (item.status === "waiting") return "Attendre ou relancer";
  if (item.status === "relaunched") return "Attendre le retour";
  if (item.status === "refused") return "Réorienter";
  if (item.status === "accepted") return "Confirmer la prise en charge";
  if (item.status === "received") return "Attendre programmation";
  if (item.status === "needs_clarification") return "Compléter la demande";
  if (item.status === "programmed") return "Confirmer au patient / service";
  return "Mettre à jour";
}

function getExchangeTypeColor(type) {
  if (type === "Urgent") return "red";
  if (type === "Famille") return "purple";
  if (type === "Action") return "amber";
  return "blue";
}

function isActionOverdue(action) {
  return action.dueDate && action.status !== "Réalisé" && daysBetween(action.dueDate, new Date()) > 0;
}

function computeHdjSummary(hdjForm) {
  const actsLabel = hdjForm.acts.length > 0 ? hdjForm.acts.join(", ") : "aucun acte";
  if (hdjForm.recurrence === "ponctuel") {
    return `HDJ ponctuel : ${hdjForm.customSessions || 1} séance(s) – actes : ${actsLabel}`;
  }
  if (hdjForm.frequency === "Personnalisé") {
    const days = hdjForm.days.length ? hdjForm.days.join(", ") : "jours non précisés";
    return `HDJ personnalisé : ${days} pendant ${hdjForm.durationCustom || hdjForm.duration || "durée non précisée"} – actes : ${actsLabel}`;
  }
  return `HDJ ${hdjForm.frequency || "fréquence non précisée"} pendant ${hdjForm.durationCustom || hdjForm.duration || "durée non précisée"} – actes : ${actsLabel}`;
}

function buildHdjMail({ patient, currentLocation, coordination, targetDate, hdjForm }) {
  return [
    `Objet : Demande HDJ - ${patient?.nom || "Patient"} ${patient?.prenom || ""} - sortie ${targetDate || "non définie"}`,
    "",
    `Patient : ${patient?.nom || "—"} ${patient?.prenom || "—"}`,
    `Âge : ${patient?.age || "—"} ans`,
    `Service : ${currentLocation.service || patient?.service || "—"}`,
    `Chambre / lit : ${currentLocation.chambre || patient?.chambre || "—"} / ${currentLocation.lit || patient?.lit || "—"}`,
    `Médecin référent : ${coordination.medecin || "Non renseigné"}`,
    `Référent coordination : ${coordination.responsableActuel || coordination.cadre || coordination.medecin || "Non renseigné"}`,
    `Date cible de sortie : ${targetDate || "Non définie"}`,
    "",
    "Contexte / objectif :",
    hdjForm.objective || "Non renseigné",
    "",
    "Schéma demandé :",
    computeHdjSummary(hdjForm),
    "",
    "Actes demandés :",
    hdjForm.acts.length ? `- ${hdjForm.acts.join("\n- ")}` : "- Aucun acte renseigné",
    "",
    "Commentaires :",
    hdjForm.comment || "Aucun commentaire",
  ].join("\n");
}

function buildSynthesisExport({ patient, quickSummary, strategyPlan, currentLocation, coordination, targetDate, lengthOfStay, alerts, decisions }) {
  return [
    `Patient : ${patient?.nom || "—"} ${patient?.prenom || "—"}`,
    `Service : ${currentLocation.service || patient?.service || "—"} / Chambre ${currentLocation.chambre || patient?.chambre || "—"} / Lit ${currentLocation.lit || patient?.lit || "—"}`,
    `Date cible de sortie : ${targetDate || "Non définie"}`,
    `Séjour : J+${lengthOfStay}`,
    "",
    `Situation : ${quickSummary.situation}`,
    `Blocage principal : ${quickSummary.block}`,
    `Stratégie principale : ${strategyPlan.main || quickSummary.strategy || "Non définie"}`,
    `Plan B : ${strategyPlan.alternative1 || "Non défini"}`,
    `Plan C : ${strategyPlan.alternative2 || "Non défini"}`,
    `Prochaine action : ${quickSummary.nextAction}`,
    `Responsable : ${quickSummary.owner}`,
    "",
    "Alertes :",
    ...(alerts.length ? alerts.map((a) => `- ${a.label}`) : ["- Aucune alerte"]),
    "",
    "Décisions récentes :",
    ...(decisions.length ? decisions.slice(0, 8).map((d) => `- ${formatDateTime(d.date)} · ${d.text}`) : ["- Aucune décision tracée"]),
    "",
    `Médecin référent : ${coordination.medecin || "Non renseigné"}`,
    `Cadre : ${coordination.cadre || "Non renseigné"}`,
  ].join("\n");
}

function inferActionDomain({ title = "", comment = "" }) {
  const text = normalize(`${title} ${comment}`);
  if (text.includes("famille") || text.includes("aidant") || text.includes("apa") || text.includes("mdph") || text.includes("social")) return "Social";
  if (text.includes("ide") || text.includes("pansement") || text.includes("soin") || text.includes("surveillance")) return "Coordination IDE";
  return "Médical";
}

function buildContextualForms(keywords) {
  const normalized = keywords.map(normalize);
  const has = (value) => normalized.some((k) => k.includes(normalize(value)));
  const result = [];

  if (has("smr")) result.push("via_trajectoire");
  if (has("ehpad")) result.push("via_trajectoire");
  if (has("autonomie") || has("aide domicile") || has("grand age")) result.push("apa");
  if (has("mdph") || has("protection") || has("tutelle") || has("curatelle")) result.push("mdph");
  if (has("ase")) result.push("lettre_ase", "instance_ase");
  if (has("precarite") || has("droits sociaux")) result.push("aide_exceptionnelle");

  return uniq(result);
}

/* =========================
   STYLES
========================= */

const styles = {
  page: { padding: 16 },
  shell: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 },
  sidebar: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
    height: "fit-content",
    display: "grid",
    gap: 10,
    position: "sticky",
    top: 12,
  },
  sidebarTitle: { fontSize: 16, fontWeight: 900, color: "#17376a" },
  sideButton: {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    fontWeight: 700,
  },
  sideButtonActive: { background: "#eef4ff", border: "1px solid #c7d7ff" },
  main: { display: "grid", gap: 16 },
  headerCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
    display: "grid",
    gap: 14,
  },
  headerTop: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  patientName: { fontSize: 18, fontWeight: 900, color: "#111827" },
  patientMeta: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  headerBadges: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" },
  clickableChip: { border: "none", cursor: "pointer" },
  keywordWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
  keywordChip: {
    minHeight: 28,
    borderRadius: 999,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "0 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  keywordChipActive: { background: "#1d4ed8", color: "#fff", border: "1px solid #1d4ed8" },
  progressOuter: { height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" },
  progressInner: { height: "100%", background: "#17376a", borderRadius: 999 },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
    display: "grid",
    gap: 14,
    transition: "box-shadow 0.2s ease",
  },
  cardTitle: { fontSize: 18, fontWeight: 900, color: "#17376a" },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" },
  cardSubTitle: { fontSize: 13, fontWeight: 800, color: "#374151" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  fieldBlock: { display: "grid", gap: 8 },
  label: { fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "capitalize" },
  select: { minHeight: 40, borderRadius: 10, border: "1px solid #d1d5db", padding: "0 10px", background: "#fff" },
  selectSmall: { minHeight: 36, borderRadius: 10, border: "1px solid #d1d5db", padding: "0 10px", background: "#fff" },
  input: { minHeight: 40, borderRadius: 10, border: "1px solid #d1d5db", padding: "0 10px", background: "#fff" },
  inputSmall: { minHeight: 36, borderRadius: 10, border: "1px solid #d1d5db", padding: "0 10px", background: "#fff" },
  textarea: { minHeight: 90, borderRadius: 10, border: "1px solid #d1d5db", padding: 10, background: "#fff", resize: "vertical" },
  primaryBtn: {
    minHeight: 38,
    borderRadius: 10,
    border: "1px solid #17376a",
    background: "#17376a",
    color: "#fff",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryBtn: {
    minHeight: 34,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  ghostBtn: {
    minHeight: 34,
    borderRadius: 10,
    border: "1px dashed #94a3b8",
    background: "#fff",
    color: "#334155",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  stack: { display: "grid", gap: 12 },
  postit: {
    border: "1px solid #fcd34d",
    background: "#fef9c3",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 10,
  },
  postitTitle: { fontWeight: 900, color: "#111827" },
  rowWrap: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  toggleRow: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 },
  smallNote: { fontSize: 12, color: "#6b7280" },
  exchangeCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 8,
    background: "#fafafa",
  },
  exchangeHead: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" },
  reply: { fontSize: 12, color: "#374151", paddingLeft: 12 },
  categoryCard: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, display: "grid", gap: 10 },
  categoryTitle: { border: "none", background: "transparent", textAlign: "left", fontWeight: 900, color: "#111827", cursor: "pointer", padding: 0 },
  formRow: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  formName: { fontWeight: 800, color: "#111827" },
  hdjBox: {
    border: "1px solid #c7d7ff",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 12,
    background: "#f8fbff",
  },
  groupTitle: { fontSize: 13, fontWeight: 900, textTransform: "capitalize", color: "#17376a" },
  resourceCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 8,
    background: "#fafafa",
  },
  timelineRow: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" },
  timelineItem: { display: "grid", gap: 6, justifyItems: "center", minWidth: 80 },
  timelineDot: { width: 18, height: 18, borderRadius: "50%" },
  timelineLabel: { fontSize: 12, color: "#374151", textAlign: "center" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  infoBox: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, display: "grid", gap: 6 },
  infoLabel: { fontSize: 12, color: "#6b7280", fontWeight: 700 },
  infoValue: { fontSize: 14, fontWeight: 800, color: "#111827" },
  historyBox: { border: "1px dashed #d1d5db", borderRadius: 12, padding: 12, display: "grid", gap: 6 },
  summaryBox: { border: "1px solid #bfdbfe", borderRadius: 14, padding: 14, background: "#f8fbff", display: "grid", gap: 6 },
  actionPill: {
    minHeight: 32,
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  sectionBanner: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    borderRadius: 14,
    padding: 12,
    display: "grid",
    gap: 8,
  },
};

/* =========================
   COMPOSANT PRINCIPAL
========================= */

export default function CopiloteLayout({ patientId, onOpenPatientView, patientViewUrl }) {
  const { getPatientById, patientsSimulated } = usePatientSimulation();

  const patient = useMemo(() => {
    if (typeof getPatientById === "function" && patientId) {
      return getPatientById(patientId);
    }
    return patientsSimulated?.[0] || null;
  }, [getPatientById, patientId, patientsSimulated]);

  const [activeSection, setActiveSection] = useState("situation");
  const [strategyPlan, setStrategyPlan] = useState({
    main: "",
    alternative1: "",
    alternative2: "",
  });
  const [decisionDraft, setDecisionDraft] = useState("");
  const [decisionLog, setDecisionLog] = useState([]);
  const [isDischarged, setIsDischarged] = useState(false);
  const [hdjRelevance, setHdjRelevance] = useState("a_evaluer");

  const [coordination, setCoordination] = useState({
    medecin: "",
    ide: [],
    cadre: "",
    as: [],
    assistante_sociale: "",
    secretaire_hdj: "",
    responsableActuel: "",
  });

  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS);
  const [newKeyword, setNewKeyword] = useState("");

  const [categoriesState, setCategoriesState] = useState(
    CATEGORY_TREE.map((cat) => ({
      ...cat,
      selected: false,
      selectedChildren: [],
    }))
  );

  const [dischargeType, setDischargeType] = useState("complexe");
  const [isMedicallyReady, setIsMedicallyReady] = useState(false);
  const [medicalReadyDate, setMedicalReadyDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetDateStatus, setTargetDateStatus] = useState("estimée");

  const [currentLocation, setCurrentLocation] = useState({
    service: patient?.service || "",
    chambre: patient?.chambre || "",
    lit: patient?.lit || "",
  });
  const [locationHistory, setLocationHistory] = useState([]);

  const [newAction, setNewAction] = useState({
    title: "",
    actor: "",
    dueDate: "",
    status: "À faire",
    priority: "Normale",
    comment: "",
  });

  const [actions, setActions] = useState([
    {
      id: "act_1",
      title: "Vérifier la stratégie de sortie",
      status: "À faire",
      priority: "Urgente",
      dueDate: "",
      actor: "",
      actorRole: "Médical",
      doneAt: "",
      history: [],
      blockReason: "",
      comment: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextStep: "Démarrer l’action",
      createdBy: "Utilisateur connecté",
      lastUpdatedBy: "Utilisateur connecté",
      domain: "Médical",
    },
    {
      id: "act_2",
      title: "Qualifier l’orientation aval",
      status: "En cours",
      priority: "Prioritaire",
      dueDate: "",
      actor: "",
      actorRole: "Coordination IDE",
      doneAt: "",
      history: [],
      blockReason: "",
      comment: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextStep: "Finaliser l’orientation cible",
      createdBy: "Utilisateur connecté",
      lastUpdatedBy: "Utilisateur connecté",
      domain: "Coordination IDE",
    },
  ]);

  const [newExchange, setNewExchange] = useState({
    type: "Info",
    text: "",
    status: "À traiter",
    target: "",
    urgency: "Normale",
  });

  const [replyDrafts, setReplyDrafts] = useState({});

  const [exchanges, setExchanges] = useState([
    {
      id: "ex_1",
      type: "Info",
      author: "IDE Bernard",
      actorRole: "IDE",
      text: "Patient toujours sans solution d’aval identifiée.",
      createdAt: new Date().toISOString(),
      status: "À traiter",
      target: "",
      urgency: "Normale",
      replies: [],
      read: false,
    },
  ]);

  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceFollowUp, setResourceFollowUp] = useState({});
  const [pendingRefusalResourceId, setPendingRefusalResourceId] = useState("");
  const [pendingRefusalReason, setPendingRefusalReason] = useState(REFUSAL_REASONS[0]);

  const [formsState, setFormsState] = useState({
    via_trajectoire: { status: "À faire", updatedAt: "" },
    apa: { status: "À faire", updatedAt: "" },
    mdph: { status: "À faire", updatedAt: "" },
    aide_exceptionnelle: { status: "À faire", updatedAt: "" },
    lettre_ase: { status: "À faire", updatedAt: "" },
    instance_ase: { status: "À faire", updatedAt: "" },
  });

  const [showHdjForm, setShowHdjForm] = useState(false);
  const [hdjMailPreviewOpen, setHdjMailPreviewOpen] = useState(false);
  const [customActInput, setCustomActInput] = useState("");
  const [hdjSendLog, setHdjSendLog] = useState([]);
  const [hdjStatus, setHdjStatus] = useState("draft");
  const [hdjForm, setHdjForm] = useState({
    title: "HDJ soins techniques",
    objective: "",
    actor: "",
    recurrence: "ponctuel",
    frequency: "",
    frequencyCustom: "",
    duration: "",
    durationCustom: "",
    days: [],
    customSessions: 1,
    comment: "",
    acts: [],
  });

  const admissionDate = patient?.dateEntree || patient?.admissionDate || "";
  const lengthOfStay = admissionDate ? Math.max(0, daysBetween(admissionDate, new Date())) : 0;
  const DMS_THRESHOLD = 12;

  function openPatientView() {
    if (typeof onOpenPatientView === "function") {
      onOpenPatientView(patient);
      return;
    }
    const target = patientViewUrl || `/patient/${patient?.id || patientId || ""}`;
    window.location.href = target;
  }

  function updateLocation(field, value) {
    setLocationHistory((prev) => [
      ...prev,
      {
        ...currentLocation,
        changedAt: new Date().toISOString(),
      },
    ]);
    setCurrentLocation((prev) => ({ ...prev, [field]: value }));
  }

  function toggleKeyword(keyword) {
    setKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }

  function addKeywordInline() {
    const clean = newKeyword.trim();
    if (!clean) return;
    setKeywords((prev) => uniq([...prev, clean]));
    setNewKeyword("");
  }

  function toggleCategory(label) {
    setCategoriesState((prev) =>
      prev.map((c) => (c.label === label ? { ...c, selected: !c.selected } : c))
    );
  }

  function toggleSubCategory(parentLabel, child) {
    setCategoriesState((prev) =>
      prev.map((c) => {
        if (c.label !== parentLabel) return c;
        const exists = c.selectedChildren.includes(child);
        const nextChildren = exists
          ? c.selectedChildren.filter((x) => x !== child)
          : [...c.selectedChildren, child];
        return {
          ...c,
          selected: true,
          selectedChildren: nextChildren,
        };
      })
    );

    setKeywords((prev) => {
      const exists = prev.includes(child);
      return exists ? prev.filter((k) => k !== child) : [...prev, child];
    });
  }

  function addActionInline(preset = null) {
    const payload = preset
      ? {
          title: preset.title,
          actor: "",
          dueDate: targetDate || "",
          status: "À faire",
          priority: preset.priority || "Normale",
          comment: preset.comment || "",
          actorRole: preset.actorRole || "Coordination IDE",
        }
      : { ...newAction, actorRole: inferActionDomain(newAction) };

    if (!payload.title.trim()) return alert("Le titre de l’action est obligatoire.");

    setActions((prev) => [
      {
        id: `act_${Date.now()}`,
        title: payload.title.trim(),
        status: payload.status,
        priority: payload.priority,
        dueDate: payload.dueDate,
        actor: payload.actor,
        actorRole: payload.actorRole || inferActionDomain(payload),
        doneAt: "",
        history: [
          {
            type: "create",
            actor: payload.actor || "Utilisateur connecté",
            date: new Date().toISOString(),
            comment: payload.comment || "Action créée",
          },
        ],
        blockReason: "",
        comment: payload.comment || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextStep: payload.status === "À faire" ? "Démarrer l’action" : "Poursuivre l’action",
        createdBy: "Utilisateur connecté",
        lastUpdatedBy: "Utilisateur connecté",
        domain: payload.actorRole || inferActionDomain(payload),
      },
      ...prev,
    ]);

    setNewAction({
      title: "",
      actor: "",
      dueDate: "",
      status: "À faire",
      priority: "Normale",
      comment: "",
    });
  }

  function updateAction(id, patch) {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patch, updatedAt: new Date().toISOString(), lastUpdatedBy: "Utilisateur connecté" };

        if (patch.status === "Bloqué" && !next.blockReason) {
          next.blockReason = BLOCK_REASONS[0];
        }

        if (patch.status === "Réalisé" && !a.doneAt) {
          next.doneAt = new Date().toISOString();
          next.history = [
            ...(a.history || []),
            {
              type: "done",
              actor: patch.actor || a.actor || "Utilisateur connecté",
              date: new Date().toISOString(),
              comment: patch.comment || "Action réalisée",
            },
          ];
          next.nextStep = "Aucune";
        } else if (patch.status && patch.status !== "Réalisé") {
          next.nextStep =
            patch.status === "Bloqué"
              ? "Lever le blocage"
              : patch.status === "En attente externe"
                ? "Attendre retour externe"
                : patch.status === "En cours"
                  ? "Poursuivre l’action"
                  : "Démarrer l’action";
        }

        return next;
      })
    );
  }

  function addExchange() {
    if (!newExchange.text.trim()) return;
    setExchanges((prev) => [
      {
        id: `ex_${Date.now()}`,
        type: newExchange.type,
        author: "Utilisateur connecté",
        actorRole: "Coordination",
        text: newExchange.text.trim(),
        createdAt: new Date().toISOString(),
        status: newExchange.status,
        target: newExchange.target,
        urgency: newExchange.urgency,
        replies: [],
        read: false,
      },
      ...prev,
    ]);
    setNewExchange({
      type: "Info",
      text: "",
      status: "À traiter",
      target: "",
      urgency: "Normale",
    });
  }

  function replyToExchange(exchangeId) {
    const text = (replyDrafts[exchangeId] || "").trim();
    if (!text) return;

    setExchanges((prev) =>
      prev.map((e) =>
        e.id === exchangeId
          ? {
              ...e,
              read: true,
              status: e.status === "Clos" ? "Clos" : "En cours",
              replies: [
                ...(e.replies || []),
                {
                  id: `rep_${Date.now()}`,
                  author: "Utilisateur connecté",
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : e
      )
    );
    setReplyDrafts((prev) => ({ ...prev, [exchangeId]: "" }));
  }

  function convertExchangeToAction(exchange) {
    setNewAction({
      title: exchange.text,
      actor: "",
      dueDate: targetDate || "",
      status: "À faire",
      priority: exchange.type === "Urgent" ? "Urgente" : "Normale",
      comment: `Issue de l’activité ${exchange.type.toLowerCase()}`,
    });
    scrollToSection(setActiveSection, "actions");
  }

  function createOrUpdateDemand(resource, status, refusalReason = "") {
    setResourceFollowUp((prev) => {
      const existing = prev[resource.id] || {};
      const updated = {
        ...existing,
        id: resource.id,
        name: resource.name,
        status,
        createdAt: existing.createdAt || new Date().toISOString(),
        sentAt:
          status === "waiting" || status === "accepted" || status === "relaunched" || status === "received" || status === "programmed"
            ? existing.sentAt || new Date().toISOString()
            : existing.sentAt || "",
        refusalReason,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [resource.id]: {
          ...updated,
          nextStep: computeNextStep(updated),
        },
      };
    });
  }

  function updateResourceStatus(resource, status) {
    if (status === "refused") {
      setPendingRefusalResourceId(resource.id);
      setPendingRefusalReason(REFUSAL_REASONS[0]);
      return;
    }
    createOrUpdateDemand(resource, status);

    if (status === "called_today") {
      addActionInline({
        title: `Appeler ${resource.name} aujourd’hui`,
        priority: "Prioritaire",
        actorRole: resource.family === "Social" ? "Social" : resource.family === "Soins" ? "Coordination IDE" : "Médical",
      });
    }
  }

  function saveRefusal() {
    const resource = RESOURCE_DB.find((r) => r.id === pendingRefusalResourceId);
    if (!resource) return;
    createOrUpdateDemand(resource, "refused", pendingRefusalReason);
    setPendingRefusalResourceId("");
  }

  function openForm(key) {
    const link = FORM_LINKS[key];
    if (typeof link === "string" && link.startsWith("http")) {
      openExternal(link);
    }

    setFormsState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: prev[key]?.status === "À faire" ? "En cours" : prev[key]?.status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function markFormStatus(key, status) {
    setFormsState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function addDecision(text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    setDecisionLog((prev) => [
      {
        id: `dec_${Date.now()}`,
        text: clean,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setDecisionDraft("");
  }

  function exportSynthesis() {
    const content = buildSynthesisExport({
      patient,
      quickSummary,
      strategyPlan,
      currentLocation,
      coordination,
      targetDate,
      lengthOfStay,
      alerts,
      decisions: decisionLog,
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
      alert("Synthèse copiée dans le presse-papiers.");
      return;
    }

    window.prompt("Copier la synthèse :", content);
  }

  function toggleHdjAct(act) {
    setHdjForm((prev) => ({
      ...prev,
      acts: prev.acts.includes(act)
        ? prev.acts.filter((a) => a !== act)
        : [...prev.acts, act],
    }));
  }

  function addCustomAct() {
    const clean = customActInput.trim();
    if (!clean) return;
    setHdjForm((prev) => ({
      ...prev,
      acts: prev.acts.includes(clean) ? prev.acts : [...prev.acts, clean],
    }));
    setCustomActInput("");
  }

  function toggleHdjDay(day) {
    setHdjForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  }

  function applyHdjModel(model) {
    setShowHdjForm(true);
    setHdjRelevance("oui");
    setHdjForm({
      title: model.title,
      objective: model.comment || "",
      actor: model.actor || "",
      recurrence: model.recurrence || "ponctuel",
      frequency: model.frequency || "",
      frequencyCustom: "",
      days: model.days || [],
      duration: model.duration || "",
      durationCustom: "",
      customSessions: 1,
      comment: model.comment || "",
      acts: model.acts || [],
    });
  }

  function validateHdjBeforeSend() {
    if (!hdjForm.objective.trim()) return "Objectif HDJ manquant";
    if (!hdjForm.actor) return "Acteur porteur HDJ manquant";
    if (hdjForm.acts.length === 0) return "Au moins un acte HDJ est obligatoire";
    if (hdjForm.recurrence === "recurrent" && !hdjForm.frequency) return "Fréquence HDJ manquante";
    if (hdjForm.frequency === "Personnalisé" && !hdjForm.frequencyCustom.trim()) return "Fréquence personnalisée manquante";
    if (!hdjForm.duration && !hdjForm.durationCustom.trim()) return "Durée HDJ manquante";
    return "";
  }

  function sendHdjMail() {
    const error = validateHdjBeforeSend();
    if (error) {
      alert(error);
      return;
    }

    const mailText = buildHdjMail({
      patient,
      currentLocation,
      coordination,
      targetDate,
      hdjForm,
    });

    setHdjSendLog((prev) => [
      {
        id: `hdj_mail_${Date.now()}`,
        to: HDJ_SECRETARIAT_EMAIL,
        sentAt: new Date().toISOString(),
        body: mailText,
      },
      ...prev,
    ]);
    setHdjStatus("waiting");
    setHdjMailPreviewOpen(true);
    alert("Synthèse HDJ préparée pour le secrétariat.");
  }

  const visibleResources = useMemo(() => {
    return RESOURCE_DB
      .map((r) => ({ ...r, score: scoreResource(r, keywords) }))
      .filter((r) =>
        normalize([r.name, r.family, r.subType, r.territory, ...(r.tags || [])].join(" ")).includes(
          normalize(resourceSearch)
        )
      )
      .sort((a, b) => b.score - a.score);
  }, [resourceSearch, keywords]);

  const similarHdj = useMemo(() => findSimilarHdjModels(keywords), [keywords]);

  const actualSolutionFound = useMemo(() => {
    return Boolean(patient?.solutionLabel) || Object.values(resourceFollowUp).some((r) => r.status === "accepted") || hdjStatus === "programmed";
  }, [patient?.solutionLabel, resourceFollowUp, hdjStatus]);

  const isPlanned = useMemo(() => {
    return Boolean(targetDate) && targetDateStatus === "validée" && actualSolutionFound;
  }, [targetDate, targetDateStatus, actualSolutionFound]);

  const timelineState = useMemo(() => {
    const hasQualification = Boolean(patient?.blockReason || patient?.blocage) || keywords.length > 0 || categoriesState.some((c) => c.selectedChildren.length > 0);
    const hasCoordination =
      actions.some((a) => ["En cours", "En attente externe", "Réalisé", "Bloqué"].includes(a.status)) ||
      exchanges.some((e) => e.type === "Action" || e.type === "Urgent");
    const hasRequests = Object.values(resourceFollowUp).some((r) => ["waiting", "accepted", "relaunched", "received", "programmed", "called_today"].includes(r.status));

    return computeTimeline({
      dischargeType,
      hasQualification,
      hasCoordination,
      hasRequests,
      hasSolution: actualSolutionFound,
      isPlanned,
      isDischarged,
    });
  }, [patient, keywords, categoriesState, actions, exchanges, resourceFollowUp, dischargeType, actualSolutionFound, isPlanned, isDischarged]);

  const complexity = useMemo(
    () => computeComplexity({ keywords, actions, resourceFollowUp, dischargeType, exchanges }),
    [keywords, actions, resourceFollowUp, dischargeType, exchanges]
  );

  const derivedStatus = useMemo(() => {
    if (isDischarged) return "Sortie réalisée";
    if (isPlanned) return "Sortie planifiée";
    if (actualSolutionFound) return "Solution trouvée";
    if (Object.values(resourceFollowUp).some((r) => ["waiting", "accepted", "relaunched", "received", "called_today"].includes(r.status))) {
      return "Demandes en cours";
    }
    if (keywords.length > 0 || categoriesState.some((c) => c.selectedChildren.length > 0)) {
      return "Orientation en cours";
    }
    return "À sécuriser";
  }, [isDischarged, isPlanned, actualSolutionFound, resourceFollowUp, keywords.length, categoriesState]);

  const currentSolution = useMemo(() => {
    if (patient?.solutionLabel) return patient.solutionLabel;
    if (Object.values(resourceFollowUp).some((r) => r.status === "accepted")) {
      const accepted = Object.values(resourceFollowUp).find((r) => r.status === "accepted");
      return accepted?.name || "Solution acceptée";
    }
    if (hdjStatus === "programmed") return "HDJ programmé";
    if (keywords.some((k) => normalize(k).includes("ehpad"))) return "Orientation EHPAD en cours";
    if (keywords.some((k) => normalize(k).includes("smr"))) return "Orientation SMR en cours";
    if (keywords.some((k) => normalize(k).includes("hdj"))) return "Proposition HDJ à évaluer";
    if (keywords.some((k) => normalize(k).includes("retour domicile impossible"))) return "Arbitrage domicile / aval";
    return "À définir";
  }, [patient?.solutionLabel, resourceFollowUp, hdjStatus, keywords]);

  const demandAlerts = useMemo(() => {
    const items = [];

    Object.values(resourceFollowUp).forEach((demand) => {
      const name = demand.name || "Demande";
      if (demand.createdAt && !demand.sentAt && demand.status !== "called_today") {
        const age = daysBetween(demand.createdAt, new Date());
        if (age >= 5) items.push({ type: "danger", label: `${name} non activée > 5 jours` });
        else if (age >= 3) items.push({ type: "warning", label: `${name} non activée > 3 jours` });
      }

      if (demand.sentAt && !["accepted", "refused", "programmed"].includes(demand.status)) {
        const age = daysBetween(demand.sentAt, new Date());
        if (age >= 5) items.push({ type: "danger", label: `${name} sans retour > 5 jours` });
        else if (age >= 3) items.push({ type: "warning", label: `${name} sans retour > 3 jours` });
      }
    });

    return items;
  }, [resourceFollowUp]);

  const actionAlerts = useMemo(() => {
    const items = [];
    actions.forEach((action) => {
      if (!action.dueDate) items.push({ type: "warning", label: `Action sans échéance : ${action.title}` });
      if (isActionOverdue(action)) items.push({ type: "danger", label: `Action en retard : ${action.title}` });
      if (action.status === "Bloqué") items.push({ type: "danger", label: `Action bloquée : ${action.title}` });
    });
    return items;
  }, [actions]);

  const exchangeAlerts = useMemo(() => {
    const items = [];
    exchanges.forEach((exchange) => {
      if (exchange.type === "Urgent" && exchange.status !== "Clos") {
        items.push({ type: "danger", label: `Urgent : ${exchange.text.slice(0, 40)}` });
      }
      if (!exchange.read) {
        items.push({ type: "warning", label: `Activité non lue : ${exchange.text.slice(0, 30)}` });
      }
      if ((exchange.type === "Famille" || exchange.type === "Urgent") && exchange.replies.length === 0 && exchange.status !== "Clos") {
        items.push({ type: "warning", label: `Réponse attendue : ${exchange.text.slice(0, 30)}` });
      }
    });
    return items;
  }, [exchanges]);

  const inconsistencyAlerts = useMemo(() => {
    const list = [];
    if (dischargeType === "simple" && Object.keys(resourceFollowUp).length > 0) {
      list.push({ type: "warning", label: "Sortie simple avec ressources actives" });
    }
    if (dischargeType === "simple" && hdjForm.acts.length > 0) {
      list.push({ type: "warning", label: "Sortie simple avec HDJ en cours" });
    }
    if (isMedicallyReady && !targetDate) {
      list.push({ type: "warning", label: "Sortant médicalement sans date cible de sortie" });
    }
    if (keywords.some((k) => ["EHPAD", "SMR", "HDJ"].includes(k)) && Object.keys(resourceFollowUp).length === 0 && hdjStatus === "draft") {
      list.push({ type: "warning", label: "Orientation sans ressource activée" });
    }
    if (Object.values(resourceFollowUp).some((r) => r.status === "refused") &&
        !Object.values(resourceFollowUp).some((r) => ["draft", "waiting", "relaunched", "accepted", "programmed", "called_today"].includes(r.status))) {
      list.push({ type: "danger", label: "Refus sans nouvelle piste" });
    }
    if (lengthOfStay >= DMS_THRESHOLD && currentSolution === "À définir") {
      list.push({ type: "danger", label: "DMS dépassée sans solution claire" });
    }
    if (showHdjForm && hdjStatus === "draft" && hdjForm.acts.length > 0 && hdjSendLog.length === 0) {
      list.push({ type: "warning", label: "HDJ construit mais non envoyé" });
    }
    return list;
  }, [dischargeType, resourceFollowUp, hdjForm.acts.length, isMedicallyReady, targetDate, keywords, lengthOfStay, currentSolution, showHdjForm, hdjStatus, hdjSendLog.length]);

  const dossierCompleteness = useMemo(() => {
    const missing = [];
    if (!targetDate) missing.push("Date cible de sortie");
    if (keywords.length === 0 && !currentSolution) missing.push("Orientation / solution");
    if (showHdjForm && hdjForm.acts.length > 0 && hdjSendLog.length === 0) missing.push("Envoi HDJ");
    return missing;
  }, [targetDate, keywords.length, currentSolution, showHdjForm, hdjForm.acts.length, hdjSendLog.length]);

  const alerts = useMemo(() => {
    const list = [];

    if (targetDate) {
      const diff = daysBetween(new Date(), new Date(targetDate));
      if (diff <= 2 && diff >= 0) list.push({ type: "warning", label: "Date cible de sortie proche" });
      if (diff < 0) list.push({ type: "danger", label: "Date cible de sortie dépassée" });
    }

    if (lengthOfStay >= 10) list.push({ type: "warning", label: "Alerte J+10 séjour" });
    if (lengthOfStay >= DMS_THRESHOLD) list.push({ type: "danger", label: "Dépassement DMS" });

    if (Object.values(resourceFollowUp).some((r) => r.status === "refused")) {
      list.push({ type: "danger", label: "Refus ressource reçu" });
    }

    return [...list, ...demandAlerts, ...actionAlerts, ...exchangeAlerts, ...inconsistencyAlerts];
  }, [targetDate, lengthOfStay, resourceFollowUp, demandAlerts, actionAlerts, exchangeAlerts, inconsistencyAlerts]);

  const sortedActions = useMemo(() => {
    const rank = {
      "Bloqué": 0,
      "En attente externe": 1,
      "En cours": 2,
      "À faire": 3,
      "Réalisé": 4,
    };
    return [...actions].sort((a, b) => {
      const aOver = isActionOverdue(a) ? -1 : 0;
      const bOver = isActionOverdue(b) ? -1 : 0;
      if (aOver !== bOver) return aOver - bOver;
      return rank[a.status] - rank[b.status];
    });
  }, [actions]);

  const currentPriorities = useMemo(() => {
    const urgentAlerts = alerts.filter((a) => a.type === "danger").slice(0, 10);
    const overdueActions = sortedActions.filter((a) => isActionOverdue(a)).map((a) => ({
      type: "danger",
      label: `Faire maintenant : ${a.title}`,
      section: "actions",
    }));
    const pendingDemands = Object.values(resourceFollowUp)
      .filter((d) => d.nextStep && d.status !== "accepted" && d.status !== "programmed")
      .slice(0, 5)
      .map((d) => ({
        type: d.status === "refused" ? "danger" : "warning",
        label: `${d.name} : ${d.nextStep}`,
        section: "suivi",
      }));
    return [...urgentAlerts.map((x) => ({ ...x, section: inferSectionFromAlert(x.label) })), ...overdueActions, ...pendingDemands].slice(0, 12);
  }, [alerts, sortedActions, resourceFollowUp]);

  const quickSummary = useMemo(() => {
    const block = patient?.blockReason || patient?.blocage || (alerts[0]?.label || "Aucun blocage majeur identifié");
    const nextAction =
      currentPriorities[0]?.label ||
      sortedActions.find((a) => a.status !== "Réalisé")?.title ||
      "Aucune action prioritaire";
    const owner = sortedActions.find((a) => a.status !== "Réalisé")?.lastUpdatedBy || "Équipe";

    return {
      situation: derivedStatus,
      block,
      strategy: strategyPlan.main || currentSolution,
      nextAction,
      owner,
    };
  }, [patient, alerts, currentPriorities, sortedActions, derivedStatus, currentSolution, strategyPlan.main]);

  const hdjSummary = useMemo(() => computeHdjSummary(hdjForm), [hdjForm]);

  const hdjMailPreview = useMemo(() => buildHdjMail({
    patient,
    currentLocation,
    coordination,
    targetDate,
    hdjForm,
  }), [patient, currentLocation, coordination, targetDate, hdjForm]);

  const groupedActionDomains = useMemo(() => {
    const groups = { "Médical": [], "Social": [], "Coordination IDE": [] };
    sortedActions.forEach((action) => {
      const key = action.domain || inferActionDomain(action);
      if (!groups[key]) groups[key] = [];
      groups[key].push(action);
    });
    return groups;
  }, [sortedActions]);

  const activityFeed = useMemo(() => {
    const actionItems = actions.map((a) => ({
      id: `feed_${a.id}`,
      date: a.updatedAt || a.createdAt,
      text: `Action · ${a.title} · ${a.status}`,
      actor: a.lastUpdatedBy || a.createdBy || "Utilisateur connecté",
      kind: "action",
    }));
    const exchangeItems = exchanges.map((e) => ({
      id: `feed_${e.id}`,
      date: e.createdAt,
      text: `Activité ${e.type} · ${e.text}`,
      actor: e.author || "Utilisateur connecté",
      kind: "activity",
      unread: !e.read,
    }));
    return [...actionItems, ...exchangeItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12);
  }, [actions, exchanges]);

  const contextualForms = useMemo(() => buildContextualForms(keywords), [keywords]);

  if (!patient) {
    return <div style={{ padding: 16 }}>Aucun patient sélectionné.</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Copilote de coordination</div>

          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(setActiveSection, item.id)}
              style={{
                ...styles.sideButton,
                ...(activeSection === item.id ? styles.sideButtonActive : {}),
              }}
            >
              <span>{item.label}</span>
              {item.id === "actions" ? (
                <span style={tagStyle("red")}>{actions.filter((a) => a.status !== "Réalisé").length}</span>
              ) : null}
              {item.id === "orientation" ? (
                <span style={tagStyle("blue")}>{categoriesState.filter((c) => c.selected || c.selectedChildren.length > 0).length}</span>
              ) : null}
              {item.id === "hdj" ? <span style={tagStyle("blue")}>{similarHdj.length}</span> : null}
              {item.id === "ressources" ? <span style={tagStyle("blue")}>{visibleResources.length}</span> : null}
              {item.id === "priorites" ? <span style={tagStyle("red")}>{currentPriorities.length}</span> : null}
              {item.id === "activite" ? <span style={tagStyle("amber")}>{exchanges.filter((e) => !e.read).length}</span> : null}
            </button>
          ))}
        </aside>

        <main style={styles.main}>
          <section style={styles.headerCard}>
            <div style={styles.headerTop}>
              <div>
                <div style={styles.patientName}>
                  {patient.nom} {patient.prenom}
                </div>
                <div style={styles.patientMeta}>
                  {patient?.dateNaissance || "Date inconnue"} · {patient?.age || "—"} ans · INS {patient?.ins || "—"} · IEP {patient?.iep || "—"} · {currentLocation.service || patient?.service || "Service non renseigné"} · Chambre {currentLocation.chambre || patient?.chambre || "—"} · Lit {currentLocation.lit || patient?.lit || "—"}
                </div>
              </div>

              <div style={styles.rowWrap}>
                <button type="button" onClick={openPatientView} style={styles.primaryBtn}>
                  Voir fiche patient
                </button>
              </div>

              <div style={styles.headerBadges}>
                <button type="button" onClick={() => scrollToSection(setActiveSection, "situation")} style={{ ...tagStyle("blue"), ...styles.clickableChip }}>
                  {derivedStatus}
                </button>
                <button type="button" onClick={() => scrollToSection(setActiveSection, "orientation")} style={{ ...tagStyle("neutral"), ...styles.clickableChip }}>
                  {currentSolution}
                </button>
                <button type="button" onClick={() => scrollToSection(setActiveSection, "situation")} style={{ ...tagStyle("amber"), ...styles.clickableChip }}>
                  Date cible de sortie {targetDate ? formatShortDate(targetDate) : "non définie"}
                </button>
                <button type="button" onClick={() => scrollToSection(setActiveSection, "situation")} style={{ ...tagStyle("neutral"), ...styles.clickableChip }}>
                  Séjour J+{lengthOfStay}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(setActiveSection, "situation")}
                  style={{
                    ...tagStyle(lengthOfStay > DMS_THRESHOLD ? "red" : lengthOfStay >= 10 ? "amber" : "green"),
                    ...styles.clickableChip,
                  }}
                >
                  DMS {lengthOfStay > DMS_THRESHOLD ? "dépassée" : lengthOfStay >= 10 ? "proche" : "OK"}
                </button>
                <button type="button" onClick={() => scrollToSection(setActiveSection, "timeline")} style={{ ...tagStyle(complexity.color), ...styles.clickableChip }}>
                  Complexité {complexity.label}
                </button>
              </div>
            </div>

            <div style={styles.summaryBox}>
              <div><strong>Situation :</strong> {quickSummary.situation}</div>
              <div><strong>Blocage principal :</strong> {quickSummary.block}</div>
              <div><strong>Stratégie :</strong> {quickSummary.strategy}</div>
              <div><strong>Prochaine action :</strong> {quickSummary.nextAction}</div>
              <div><strong>Pilotage actuel :</strong> {quickSummary.owner}</div>
            </div>

            <div style={styles.keywordWrap}>
              {uniq(keywords).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => scrollToSection(setActiveSection, "orientation")}
                  style={styles.keywordChip}
                >
                  {k}
                </button>
              ))}
            </div>

            {alerts.length > 0 ? (
              <div style={styles.keywordWrap}>
                {alerts.map((a, i) => (
                  <button
                    key={`${a.label}-${i}`}
                    type="button"
                    onClick={() => scrollToSection(setActiveSection, inferSectionFromAlert(a.label))}
                    style={{
                      ...tagStyle(a.type === "danger" ? "red" : a.type === "warning" ? "amber" : "blue"),
                      ...styles.clickableChip,
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div style={styles.progressOuter}>
              <div style={{ ...styles.progressInner, width: `${timelineState.percent}%` }} />
            </div>
          </section>

          <section id="section-priorites" style={{ display: activeSection === "priorites" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>À faire maintenant</div>
            {currentPriorities.length === 0 ? (
              <div style={styles.smallNote}>Aucune priorité immédiate.</div>
            ) : (
              <div style={styles.stack}>
                {currentPriorities.map((item, idx) => (
                  <button
                    key={`${item.label}-${idx}`}
                    type="button"
                    onClick={() => scrollToSection(setActiveSection, item.section || inferSectionFromAlert(item.label))}
                    style={{
                      ...styles.formRow,
                      cursor: "pointer",
                      textAlign: "left",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={tagStyle(item.type === "danger" ? "red" : "amber")}>
                      {item.type === "danger" ? "Urgent" : "À faire"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section id="section-situation" style={{ display: activeSection === "situation" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Situation</div>

            <div style={styles.timelineRow}>
              {timelineState.steps.map((step, i) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => {
                    const targetSection =
                      step.label === "Demandes" ? "suivi" :
                      step.label === "Coordination" ? "coordination" :
                      step.label === "Solution" ? "orientation" :
                      step.label === "Sortie planifiée" ? "situation" :
                      "situation";
                    scrollToSection(setActiveSection, targetSection);
                  }}
                  style={{ border: "none", background: "transparent", cursor: "pointer", ...styles.timelineItem }}
                >
                  <div
                    style={{
                      ...styles.timelineDot,
                      background: step.done ? "#16a34a" : i === timelineState.current ? "#f59e0b" : "#d1d5db",
                    }}
                  />
                  <div style={styles.timelineLabel}>{step.label}</div>
                </button>
              ))}
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Type de sortie</div>
                <select value={dischargeType} onChange={(e) => setDischargeType(e.target.value)} style={styles.selectSmall}>
                  {DISCHARGE_TYPES.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Sortant médicalement</div>
                <div style={styles.rowWrap}>
                  <label style={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={isMedicallyReady}
                      onChange={(e) => setIsMedicallyReady(e.target.checked)}
                    />
                    <span>{isMedicallyReady ? "Oui" : "Non"}</span>
                  </label>
                </div>
                {isMedicallyReady ? (
                  <input
                    type="date"
                    value={medicalReadyDate}
                    onChange={(e) => setMedicalReadyDate(e.target.value)}
                    style={styles.inputSmall}
                  />
                ) : null}
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Date cible de sortie</div>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={styles.inputSmall}
                />
                <select
                  value={targetDateStatus}
                  onChange={(e) => setTargetDateStatus(e.target.value)}
                  style={styles.selectSmall}
                >
                  {TARGET_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Séjour</div>
                <div style={styles.infoValue}>J + {lengthOfStay}</div>
                <div style={styles.smallNote}>Seuil DMS : {DMS_THRESHOLD} jours</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Blocage principal</div>
                <div style={styles.infoValue}>{patient?.blockReason || patient?.blocage || "Non renseigné"}</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Solution en cours</div>
                <div style={styles.infoValue}>{currentSolution}</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Pilotage actuel</div>
                <div style={styles.infoValue}>{quickSummary.owner}</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Localisation actuelle</div>
                <div style={styles.infoValue}>
                  {currentLocation.service || patient?.service || "—"} · Chambre {currentLocation.chambre || patient?.chambre || "—"} · Lit {currentLocation.lit || patient?.lit || "—"}
                </div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Sortie réellement faite</div>
                <label style={styles.toggleRow}>
                  <input type="checkbox" checked={isDischarged} onChange={(e) => setIsDischarged(e.target.checked)} />
                  <span>{isDischarged ? "Oui" : "Non"}</span>
                </label>
              </div>
            </div>

            <div style={styles.rowWrap}>
              <select
                value={currentLocation.service}
                onChange={(e) => updateLocation("service", e.target.value)}
                style={styles.selectSmall}
              >
                <option value="">Service</option>
                {uniq([
                  patient?.service,
                  ...AGENTS_BY_ROLE.medecins.map((x) => x.service),
                  ...AGENTS_BY_ROLE.ide.map((x) => x.service),
                  ...AGENTS_BY_ROLE.cadre.map((x) => x.service),
                  ...AGENTS_BY_ROLE.as.map((x) => x.service),
                ]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <input
                value={currentLocation.chambre}
                onChange={(e) => updateLocation("chambre", e.target.value)}
                placeholder="Chambre"
                style={styles.inputSmall}
              />

              <input
                value={currentLocation.lit}
                onChange={(e) => updateLocation("lit", e.target.value)}
                placeholder="Lit"
                style={styles.inputSmall}
              />
            </div>

            {locationHistory.length > 0 ? (
              <div style={styles.historyBox}>
                <div style={styles.infoLabel}>Historique service / chambre / lit</div>
                {locationHistory.slice(-5).reverse().map((h, i) => (
                  <div key={`${h.changedAt}-${i}`} style={styles.smallNote}>
                    {new Date(h.changedAt).toLocaleString()} · {h.service || "—"} · Chambre {h.chambre || "—"} · Lit {h.lit || "—"}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="section-coordination" style={{ display: activeSection === "coordination" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Coordination</div>

            <div style={styles.sectionBanner}>
              <div style={styles.cardSubTitle}>Logique terrain</div>
              <div style={styles.smallNote}>
                Les agents se connectent avec leur compte. La coordination affiche donc surtout les dernières actions, les tâches en cours
                et les reprises éventuelles, plutôt qu’une saisie manuelle des noms.
              </div>
            </div>

            <div style={styles.grid3}>
              {Object.entries(groupedActionDomains).map(([domain, items]) => (
                <div key={domain} style={styles.infoBox}>
                  <div style={styles.infoLabel}>{domain}</div>
                  <div style={styles.infoValue}>{items.filter((x) => x.status !== "Réalisé").length} en cours / à faire</div>
                  <div style={styles.smallNote}>
                    Dernière action : {items[0] ? `${items[0].title} · ${formatDateTime(items[0].updatedAt)}` : "Aucune"}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.historyBox}>
              <div style={styles.infoLabel}>Dernières actions tracées</div>
              {activityFeed.length === 0 ? (
                <div style={styles.smallNote}>Aucune activité récente.</div>
              ) : (
                activityFeed.slice(0, 8).map((item) => (
                  <div key={item.id} style={styles.smallNote}>
                    {formatDateTime(item.date)} · {item.actor} · {item.text}
                  </div>
                ))
              )}
            </div>

            <div style={styles.historyBox}>
              <div style={styles.infoLabel}>Reprises / relais</div>
              {actions.filter((a) => (a.history || []).length > 1).length === 0 ? (
                <div style={styles.smallNote}>Aucune reprise tracée pour le moment.</div>
              ) : (
                actions
                  .filter((a) => (a.history || []).length > 1)
                  .map((a) => (
                    <div key={a.id} style={styles.smallNote}>
                      {a.title} · reprise / mise à jour par {a.lastUpdatedBy || "Utilisateur connecté"} le {formatDateTime(a.updatedAt)}
                    </div>
                  ))
              )}
            </div>
          </section>

          <section id="section-actions" style={{ display: activeSection === "actions" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Actions</div>
              <span style={tagStyle("blue")}>Usage terrain simplifié</span>
            </div>

            <div style={styles.sectionBanner}>
              <div style={styles.cardSubTitle}>Actions rapides</div>
              <div style={styles.rowWrap}>
                <button type="button" onClick={() => addActionInline({ title: "Appeler la famille", priority: "Prioritaire", actorRole: "Social" })} style={styles.secondaryBtn}>Appeler famille</button>
                <button type="button" onClick={() => addActionInline({ title: "Relancer une ressource", priority: "Prioritaire", actorRole: "Coordination IDE" })} style={styles.secondaryBtn}>Relancer ressource</button>
                <button type="button" onClick={() => addActionInline({ title: "Compléter un dossier", priority: "Normale", actorRole: "Médical" })} style={styles.secondaryBtn}>Compléter dossier</button>
                <button type="button" onClick={() => addActionInline({ title: "Préparer la sortie", priority: "Urgente", actorRole: "Coordination IDE" })} style={styles.secondaryBtn}>Préparer sortie</button>
              </div>
            </div>

            <div style={styles.grid3}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Nouvelle action</label>
                <input value={newAction.title} onChange={(e) => setNewAction((p) => ({ ...p, title: e.target.value }))} style={styles.inputSmall} placeholder="Ex : vérifier l’orientation" />
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Échéance</label>
                <input type="date" value={newAction.dueDate} onChange={(e) => setNewAction((p) => ({ ...p, dueDate: e.target.value }))} style={styles.inputSmall} />
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Priorité</label>
                <select value={newAction.priority} onChange={(e) => setNewAction((p) => ({ ...p, priority: e.target.value }))} style={styles.selectSmall}>
                  {["Normale", "Prioritaire", "Urgente"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.rowWrap}>
              <button type="button" onClick={() => addActionInline()} style={styles.primaryBtn}>Ajouter l’action</button>
            </div>

            <div style={styles.stack}>
              {sortedActions.map((a) => (
                <div key={a.id} style={styles.postit}>
                  <div style={styles.exchangeHead}>
                    <div>
                      <div style={styles.postitTitle}>{a.title}</div>
                      <div style={styles.smallNote}>{a.domain || inferActionDomain(a)} · {a.priority}</div>
                    </div>
                    <div style={styles.rowWrap}>
                      <span style={tagStyle(a.status === "Réalisé" ? "green" : a.status === "Bloqué" ? "red" : a.status === "En attente externe" ? "amber" : "blue")}>
                        {a.status}
                      </span>
                      {isActionOverdue(a) ? <span style={tagStyle("red")}>En retard</span> : null}
                    </div>
                  </div>

                  <div style={styles.rowWrap}>
                    {ACTION_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateAction(a.id, { status })}
                        style={{
                          ...styles.actionPill,
                          ...(a.status === status ? { border: "1px solid #17376a", background: "#eef4ff" } : {}),
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <div style={styles.rowWrap}>
                    <button type="button" onClick={() => updateAction(a.id, { dueDate: new Date().toISOString().slice(0, 10) })} style={styles.secondaryBtn}>
                      Aujourd’hui
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        updateAction(a.id, { dueDate: tomorrow.toISOString().slice(0, 10) });
                      }}
                      style={styles.secondaryBtn}
                    >
                      Demain
                    </button>
                    <button type="button" onClick={() => updateAction(a.id, { dueDate: targetDate || "" })} style={styles.secondaryBtn}>
                      Date cible
                    </button>
                  </div>

                  <div style={styles.smallNote}>
                    Échéance : {a.dueDate ? formatShortDate(a.dueDate) : "non définie"} · Prochaine action : {a.nextStep || "—"}
                  </div>

                  {a.status === "Bloqué" ? (
                    <select value={a.blockReason || BLOCK_REASONS[0]} onChange={(e) => updateAction(a.id, { blockReason: e.target.value })} style={styles.selectSmall}>
                      {BLOCK_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                    </select>
                  ) : null}

                  {a.doneAt ? (
                    <div style={styles.smallNote}>
                      ✔ {a.lastUpdatedBy || "Utilisateur connecté"} le {formatDateTime(a.doneAt)}
                    </div>
                  ) : (
                    <div style={styles.smallNote}>
                      Créée : {formatDateTime(a.createdAt)} · MAJ : {formatDateTime(a.updatedAt)} · par {a.lastUpdatedBy || "Utilisateur connecté"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section id="section-activite" style={{ display: activeSection === "activite" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Activité</div>
              <span style={tagStyle("purple")}>Info / Famille / Urgent / Action</span>
            </div>

            <div style={styles.grid3}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Type</label>
                <div style={styles.keywordWrap}>
                  {EXCHANGE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewExchange((p) => ({ ...p, type: t }))}
                      style={{ ...styles.keywordChip, ...(newExchange.type === t ? styles.keywordChipActive : {}) }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Statut</label>
                <select value={newExchange.status} onChange={(e) => setNewExchange((p) => ({ ...p, status: e.target.value }))} style={styles.selectSmall}>
                  {EXCHANGE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Destinataire / cible</label>
                <input value={newExchange.target} onChange={(e) => setNewExchange((p) => ({ ...p, target: e.target.value }))} style={styles.inputSmall} placeholder="Ex : famille / médecin / IDE / AS" />
              </div>
            </div>

            <textarea
              value={newExchange.text}
              onChange={(e) => setNewExchange((p) => ({ ...p, text: e.target.value }))}
              style={styles.textarea}
              placeholder="Ajouter une activité, une info à transmettre, un message à dire à la famille..."
            />

            <div style={styles.rowWrap}>
              <button type="button" onClick={addExchange} style={styles.primaryBtn}>Ajouter l’activité</button>
            </div>

            <div style={styles.stack}>
              {exchanges.map((e) => (
                <div key={e.id} style={styles.exchangeCard}>
                  <div style={styles.exchangeHead}>
                    <strong>{e.author}</strong>
                    <div style={styles.rowWrap}>
                      {!e.read ? <span style={tagStyle("red")}>Non lu</span> : null}
                      <span style={tagStyle(getExchangeTypeColor(e.type))}>{e.type}</span>
                      <span style={tagStyle(e.status === "Clos" ? "green" : e.status === "En attente de réponse" ? "amber" : "blue")}>{e.status}</span>
                    </div>
                  </div>

                  <div style={styles.smallNote}>
                    {e.actorRole} · {formatDateTime(e.createdAt)} {e.target ? `· cible : ${e.target}` : ""}
                  </div>
                  <div>{e.text}</div>

                  <div style={styles.rowWrap}>
                    <button type="button" onClick={() => setExchanges((prev) => prev.map((x) => x.id === e.id ? { ...x, read: true } : x))} style={styles.secondaryBtn}>
                      Marquer lu
                    </button>
                    <select value={e.status} onChange={(evt) => setExchanges((prev) => prev.map((x) => x.id === e.id ? { ...x, status: evt.target.value, read: true } : x))} style={styles.selectSmall}>
                      {EXCHANGE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    {(e.type === "Action" || e.type === "Urgent") ? (
                      <button type="button" onClick={() => convertExchangeToAction(e)} style={styles.secondaryBtn}>
                        Transformer en action
                      </button>
                    ) : null}
                  </div>

                  <div style={styles.rowWrap}>
                    <input
                      value={replyDrafts[e.id] || ""}
                      onChange={(evt) => setReplyDrafts((prev) => ({ ...prev, [e.id]: evt.target.value }))}
                      style={styles.inputSmall}
                      placeholder="Réponse..."
                    />
                    <button type="button" onClick={() => replyToExchange(e.id)} style={styles.secondaryBtn}>
                      Répondre
                    </button>
                  </div>

                  {e.replies.map((r) => (
                    <div key={r.id} style={styles.reply}>
                      ↳ {r.author} · {formatDateTime(r.createdAt)} · {r.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section id="section-orientation" style={{ display: activeSection === "orientation" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Orientation</div>

            <div style={styles.sectionBanner}>
              <div style={styles.cardSubTitle}>Hypothèse d’orientation</div>
              <div style={styles.smallNote}>
                Coche les éléments utiles au cas patient. Tu peux aussi ajouter un mot-clé libre si la situation est atypique.
              </div>
            </div>

            <div style={styles.rowWrap}>
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeywordInline();
                  }
                }}
                placeholder="Ajouter un mot-clé libre"
                style={styles.inputSmall}
              />
              <button type="button" onClick={addKeywordInline} style={styles.secondaryBtn}>Ajouter</button>
            </div>

            <div style={styles.stack}>
              {categoriesState.map((cat) => (
                <div key={cat.label} style={styles.categoryCard}>
                  <button type="button" onClick={() => toggleCategory(cat.label)} style={styles.categoryTitle}>
                    {cat.label}
                  </button>

                  <div style={styles.keywordWrap}>
                    {cat.children.map((child) => {
                      const active = cat.selectedChildren.includes(child);
                      return (
                        <button
                          key={child}
                          type="button"
                          onClick={() => toggleSubCategory(cat.label, child)}
                          style={{ ...styles.keywordChip, ...(active ? styles.keywordChipActive : {}) }}
                        >
                          {child}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="section-ressources" style={{ display: activeSection === "ressources" && dischargeType !== "simple" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Ressources</div>

            <input
              placeholder="Recherche"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              style={styles.input}
            />

            <div style={styles.stack}>
              {visibleResources.map((r) => {
                const badge = getStatusBadge(resourceFollowUp[r.id]?.status);
                const demand = resourceFollowUp[r.id];
                return (
                  <div key={r.id} style={styles.resourceCard}>
                    <div style={styles.exchangeHead}>
                      <strong>{r.name}</strong>
                      <div style={styles.rowWrap}>
                        <span style={tagStyle(badge.color)}>{badge.label}</span>
                        <span style={tagStyle(getSaturationColor(r.saturation))}>
                          Saturation {r.saturation || "non renseignée"}
                        </span>
                      </div>
                    </div>

                    <div style={styles.smallNote}>
                      {r.family} · {r.subType} · {r.territory}
                    </div>
                    <div style={styles.smallNote}>
                      {r.contactPerson} · {r.phone || "Téléphone non renseigné"}
                    </div>
                    <div style={styles.smallNote}>Conditions : {r.conditions || "—"}</div>
                    <div style={styles.smallNote}>Délai : {r.delay || "—"}</div>
                    <div style={styles.smallNote}>{r.notes}</div>

                    {demand ? (
                      <div style={styles.smallNote}>
                        Créée : {formatShortDate(demand.createdAt)} · Envoyée : {formatShortDate(demand.sentAt)} · MAJ : {formatShortDate(demand.updatedAt)} · Prochaine étape : {demand.nextStep || "—"}
                      </div>
                    ) : null}

                    <div style={styles.rowWrap}>
                      <button type="button" onClick={() => createOrUpdateDemand(r, "draft")} style={styles.secondaryBtn}>
                        Proposer
                      </button>
                      <button type="button" onClick={() => updateResourceStatus(r, "waiting")} style={styles.secondaryBtn}>
                        Activer
                      </button>
                      <button type="button" onClick={() => updateResourceStatus(r, "called_today")} style={styles.secondaryBtn}>
                        Appeler aujourd’hui
                      </button>
                      <button type="button" onClick={() => createOrUpdateDemand(r, "relaunched")} style={styles.secondaryBtn}>
                        Relancer
                      </button>
                      <button type="button" onClick={() => updateResourceStatus(r, "accepted")} style={styles.secondaryBtn}>
                        Accepté
                      </button>
                      <button type="button" onClick={() => updateResourceStatus(r, "refused")} style={styles.secondaryBtn}>
                        Refus
                      </button>
                      {r.formLink ? (
                        <button type="button" onClick={() => openExternal(r.formLink)} style={styles.secondaryBtn}>
                          Ouvrir
                        </button>
                      ) : null}
                    </div>

                    {resourceFollowUp[r.id]?.refusalReason ? (
                      <div style={{ ...styles.smallNote, color: "#b91c1c", fontWeight: 700 }}>
                        Motif : {resourceFollowUp[r.id].refusalReason}
                      </div>
                    ) : null}

                    {pendingRefusalResourceId === r.id ? (
                      <div style={styles.rowWrap}>
                        <select value={pendingRefusalReason} onChange={(e) => setPendingRefusalReason(e.target.value)} style={styles.selectSmall}>
                          {REFUSAL_REASONS.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                        <button type="button" onClick={saveRefusal} style={styles.primaryBtn}>
                          Valider refus
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section id="section-formulaires" style={{ display: activeSection === "formulaires" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Formulaires utiles</div>

            {contextualForms.length === 0 ? (
              <div style={styles.smallNote}>Aucun formulaire recommandé pour le moment selon l’orientation en cours.</div>
            ) : (
              <div style={styles.stack}>
                {contextualForms.map((f) => (
                  <div key={f} style={styles.formRow}>
                    <div style={styles.formName}>{f}</div>
                    <div style={styles.rowWrap}>
                      <button type="button" onClick={() => openForm(f)} style={styles.secondaryBtn}>
                        Ouvrir
                      </button>
                      <select value={formsState[f]?.status || "À faire"} onChange={(e) => markFormStatus(f, e.target.value)} style={styles.selectSmall}>
                        <option>À faire</option>
                        <option>En cours</option>
                        <option>Envoyé</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="section-hdj" style={{ display: activeSection === "hdj" && dischargeType !== "simple" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Sortie sécurisée / HDJ</div>
              <div style={styles.rowWrap}>
                <button type="button" onClick={() => setShowHdjForm(true)} style={styles.primaryBtn}>
                  Nouveau HDJ
                </button>
                <span style={tagStyle(getStatusBadge(hdjStatus).color)}>{getStatusBadge(hdjStatus).label}</span>
              </div>
            </div>

            <div style={styles.sectionBanner}>
              <div style={styles.cardSubTitle}>HDJ pertinent ?</div>
              <div style={styles.rowWrap}>
                {[
                  { value: "oui", label: "Oui" },
                  { value: "non", label: "Non" },
                  { value: "a_evaluer", label: "À évaluer" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setHdjRelevance(item.value)}
                    style={{ ...styles.keywordChip, ...(hdjRelevance === item.value ? styles.keywordChipActive : {}) }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.stack}>
              {similarHdj.map((m) => (
                <div key={m.id} style={styles.exchangeCard}>
                  <div style={styles.exchangeHead}>
                    <strong>{m.title}</strong>
                    <span style={tagStyle("blue")}>{m.similarity} similarité</span>
                  </div>
                  <div style={styles.smallNote}>{m.comment}</div>
                  <div style={styles.keywordWrap}>
                    {m.commonKeywords.map((k) => (
                      <span key={k} style={tagStyle("amber")}>{k}</span>
                    ))}
                  </div>
                  <button type="button" onClick={() => applyHdjModel(m)} style={styles.secondaryBtn}>
                    Utiliser
                  </button>
                </div>
              ))}
            </div>

            {showHdjForm && hdjRelevance !== "non" ? (
              <div style={styles.hdjBox}>
                <div style={styles.grid3}>
                  <div style={styles.fieldBlock}>
                    <label style={styles.label}>Titre</label>
                    <input value={hdjForm.title} onChange={(e) => setHdjForm((p) => ({ ...p, title: e.target.value }))} style={styles.input} placeholder="Titre HDJ" />
                  </div>

                  <div style={styles.fieldBlock}>
                    <label style={styles.label}>Acteur porteur</label>
                    <select value={hdjForm.actor} onChange={(e) => setHdjForm((p) => ({ ...p, actor: e.target.value }))} style={styles.selectSmall}>
                      <option value="">Acteur porteur</option>
                      {Object.values(AGENTS_BY_ROLE).flat().map((agent) => (
                        <option key={agent.id} value={agent.nom}>{agent.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.fieldBlock}>
                    <label style={styles.label}>Récurrence</label>
                    <select value={hdjForm.recurrence} onChange={(e) => setHdjForm((p) => ({ ...p, recurrence: e.target.value }))} style={styles.selectSmall}>
                      <option value="ponctuel">Ponctuel</option>
                      <option value="recurrent">Récurrent</option>
                    </select>
                  </div>

                  <div style={styles.fieldBlock}>
                    <label style={styles.label}>Fréquence</label>
                    <select value={hdjForm.frequency} onChange={(e) => setHdjForm((p) => ({ ...p, frequency: e.target.value }))} style={styles.selectSmall}>
                      <option value="">Choisir</option>
                      {HDJ_FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  {hdjForm.frequency === "Personnalisé" ? (
                    <div style={styles.fieldBlock}>
                      <label style={styles.label}>Fréquence personnalisée</label>
                      <input value={hdjForm.frequencyCustom} onChange={(e) => setHdjForm((p) => ({ ...p, frequencyCustom: e.target.value }))} style={styles.inputSmall} placeholder="Ex : 4 séances sur 2 semaines" />
                    </div>
                  ) : null}

                  <div style={styles.fieldBlock}>
                    <label style={styles.label}>Durée</label>
                    <select value={hdjForm.duration} onChange={(e) => setHdjForm((p) => ({ ...p, duration: e.target.value }))} style={styles.selectSmall}>
                      <option value="">Choisir</option>
                      {HDJ_DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {hdjForm.duration === "Personnalisé" ? (
                    <div style={styles.fieldBlock}>
                      <label style={styles.label}>Durée personnalisée</label>
                      <input value={hdjForm.durationCustom} onChange={(e) => setHdjForm((p) => ({ ...p, durationCustom: e.target.value }))} style={styles.inputSmall} placeholder="Ex : 10 séances" />
                    </div>
                  ) : null}

                  {hdjForm.recurrence === "ponctuel" ? (
                    <div style={styles.fieldBlock}>
                      <label style={styles.label}>Nombre de séances</label>
                      <input type="number" min="1" value={hdjForm.customSessions} onChange={(e) => setHdjForm((p) => ({ ...p, customSessions: Number(e.target.value || 1) }))} style={styles.inputSmall} />
                    </div>
                  ) : null}
                </div>

                <textarea
                  value={hdjForm.objective}
                  onChange={(e) => setHdjForm((p) => ({ ...p, objective: e.target.value }))}
                  style={styles.textarea}
                  placeholder="Objectif / contexte de la demande HDJ"
                />

                {hdjForm.recurrence === "recurrent" ? (
                  <div style={styles.keywordWrap}>
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleHdjDay(day)}
                        style={{ ...styles.keywordChip, ...(hdjForm.days.includes(day) ? styles.keywordChipActive : {}) }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                ) : null}

                {Object.entries(HDJ_ACTS).map(([group, acts]) => (
                  <div key={group} style={styles.fieldBlock}>
                    <div style={styles.groupTitle}>{group}</div>
                    <div style={styles.keywordWrap}>
                      {acts.map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => toggleHdjAct(act)}
                          style={{ ...styles.keywordChip, ...(hdjForm.acts.includes(act) ? styles.keywordChipActive : {}) }}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={styles.rowWrap}>
                  <input value={customActInput} onChange={(e) => setCustomActInput(e.target.value)} style={styles.inputSmall} placeholder="Ajouter un acte libre" />
                  <button type="button" onClick={addCustomAct} style={styles.ghostBtn}>+ Ajouter acte</button>
                </div>

                <textarea
                  value={hdjForm.comment}
                  onChange={(e) => setHdjForm((p) => ({ ...p, comment: e.target.value }))}
                  style={styles.textarea}
                  placeholder="Commentaires complémentaires"
                />

                <div style={styles.summaryBox}>
                  <strong>Résumé automatique :</strong>
                  <div>{hdjSummary}</div>
                </div>

                <div style={styles.rowWrap}>
                  <button type="button" onClick={() => setHdjMailPreviewOpen((v) => !v)} style={styles.secondaryBtn}>
                    {hdjMailPreviewOpen ? "Masquer la synthèse" : "Prévisualiser la synthèse"}
                  </button>
                  <button type="button" onClick={sendHdjMail} style={styles.primaryBtn}>
                    Envoyer au secrétariat
                  </button>
                  <button type="button" onClick={() => setHdjStatus("relaunched")} style={styles.secondaryBtn}>
                    Relancer secrétariat
                  </button>
                  <button type="button" onClick={() => setHdjStatus("received")} style={styles.secondaryBtn}>
                    Reçu par secrétariat
                  </button>
                  <button type="button" onClick={() => setHdjStatus("programmed")} style={styles.secondaryBtn}>
                    Programmé
                  </button>
                </div>

                {hdjMailPreviewOpen ? (
                  <div style={styles.historyBox}>
                    <div style={styles.infoLabel}>Synthèse mail secrétariat HDJ ({HDJ_SECRETARIAT_EMAIL})</div>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{hdjMailPreview}</pre>
                  </div>
                ) : null}

                {hdjSendLog.length > 0 ? (
                  <div style={styles.historyBox}>
                    <div style={styles.infoLabel}>Historique envoi HDJ</div>
                    {hdjSendLog.map((mail) => (
                      <div key={mail.id} style={styles.smallNote}>
                        {formatDateTime(mail.sentAt)} · envoyé à {mail.to}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section id="section-suivi" style={{ display: activeSection === "suivi" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Suivi demandes</div>

            <div style={styles.stack}>
              {Object.values(resourceFollowUp).length === 0 ? (
                <div style={styles.smallNote}>Aucune demande suivie.</div>
              ) : (
                Object.values(resourceFollowUp).map((item) => (
                  <div key={item.id} style={styles.formRow}>
                    <div>
                      <div style={styles.formName}>{item.name}</div>
                      <div style={styles.smallNote}>
                        Statut : {item.status} · Créée : {formatShortDate(item.createdAt)} · Envoyée : {formatShortDate(item.sentAt)}
                      </div>
                      <div style={styles.smallNote}>
                        Dernière mise à jour : {formatShortDate(item.updatedAt)} · Prochaine étape : {item.nextStep || "—"}
                      </div>
                      {item.refusalReason ? (
                        <div style={{ ...styles.smallNote, color: "#b91c1c" }}>
                          {item.refusalReason}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="section-timeline" style={{ display: activeSection === "timeline" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardTitle}>Timeline</div>

            <div style={styles.timelineRow}>
              {timelineState.steps.map((step, i) => (
                <div key={step.label} style={styles.timelineItem}>
                  <div
                    style={{
                      ...styles.timelineDot,
                      background: step.done ? "#16a34a" : i === timelineState.current ? "#f59e0b" : "#d1d5db",
                    }}
                  />
                  <div style={styles.timelineLabel}>{step.label}</div>
                </div>
              ))}
            </div>

            <div style={styles.smallNote}>Progression : {timelineState.percent}%</div>
          </section>

          <section id="section-synthese" style={{ display: activeSection === "synthese" ? "grid" : "none", ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Synthèse</div>
              <button type="button" onClick={exportSynthesis} style={styles.secondaryBtn}>
                Copier la synthèse
              </button>
            </div>

            <div style={styles.summaryBox}>
              <div><strong>Situation :</strong> {quickSummary.situation}</div>
              <div><strong>Blocage principal :</strong> {quickSummary.block}</div>
              <div><strong>Stratégie :</strong> {quickSummary.strategy}</div>
              <div><strong>Prochaine action :</strong> {quickSummary.nextAction}</div>
              <div><strong>Pilotage :</strong> {quickSummary.owner}</div>
            </div>

            <div style={styles.grid3}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Stratégie principale</label>
                <input value={strategyPlan.main} onChange={(e) => setStrategyPlan((p) => ({ ...p, main: e.target.value }))} style={styles.inputSmall} placeholder="Ex : retour domicile" />
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Plan B</label>
                <input value={strategyPlan.alternative1} onChange={(e) => setStrategyPlan((p) => ({ ...p, alternative1: e.target.value }))} style={styles.inputSmall} placeholder="Ex : HDJ" />
              </div>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Plan C</label>
                <input value={strategyPlan.alternative2} onChange={(e) => setStrategyPlan((p) => ({ ...p, alternative2: e.target.value }))} style={styles.inputSmall} placeholder="Ex : SMR / EHPAD" />
              </div>
            </div>

            <div style={styles.historyBox}>
              <div style={styles.infoLabel}>Ce qu’il manque pour avancer</div>
              {dossierCompleteness.length === 0 ? (
                <div style={styles.smallNote}>Dossier suffisamment renseigné.</div>
              ) : (
                dossierCompleteness.map((item) => (
                  <div key={item} style={styles.smallNote}>- {item}</div>
                ))
              )}
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Journal des décisions</label>
              <div style={styles.rowWrap}>
                <input value={decisionDraft} onChange={(e) => setDecisionDraft(e.target.value)} style={styles.inputSmall} placeholder="Ex : bascule plan B HDJ après refus EHPAD" />
                <button type="button" onClick={() => addDecision(decisionDraft)} style={styles.primaryBtn}>
                  Ajouter la décision
                </button>
              </div>
            </div>

            <div style={styles.historyBox}>
              <div style={styles.infoLabel}>Décisions récentes</div>
              {decisionLog.length === 0 ? (
                <div style={styles.smallNote}>Aucune décision tracée.</div>
              ) : (
                decisionLog.map((d) => (
                  <div key={d.id} style={styles.smallNote}>
                    {formatDateTime(d.date)} · {d.text}
                  </div>
                ))
              )}
            </div>

            <div style={styles.historyBox}>
              <div style={styles.infoLabel}>Derniers événements</div>
              {sortedActions.slice(0, 3).map((a) => (
                <div key={a.id} style={styles.smallNote}>
                  Action · {a.title} · {a.status} · {formatDateTime(a.updatedAt)}
                </div>
              ))}
              {Object.values(resourceFollowUp).slice(0, 3).map((d) => (
                <div key={d.id} style={styles.smallNote}>
                  Demande · {d.name} · {d.status} · {formatDateTime(d.updatedAt)}
                </div>
              ))}
              {exchanges.slice(0, 3).map((e) => (
                <div key={e.id} style={styles.smallNote}>
                  Activité {e.type} · {e.text.slice(0, 60)} · {formatDateTime(e.createdAt)}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
