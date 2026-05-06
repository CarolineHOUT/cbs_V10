function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function isDAC(label) {
return label === "DAC" || label === "DAC / coordination";
}

function pushReason(bucket, label, reason, points = 1) {
if (!bucket[label]) {
bucket[label] = { label, score: 0, reasons: [], actions: [], forms: [] };
}

bucket[label].score += points;

if (reason && !bucket[label].reasons.includes(reason)) {
bucket[label].reasons.push(reason);
}
}

function pushAction(bucket, label, action) {
if (!bucket[label]) return;
if (action && !bucket[label].actions.includes(action)) {
bucket[label].actions.push(action);
}
}

function pushForm(bucket, label, formKey) {
if (!bucket[label]) return;
if (formKey && !bucket[label].forms.includes(formKey)) {
bucket[label].forms.push(formKey);
}
}

export function getOrientationSuggestionsFromPatient(patient) {
const structured = patient?.structuredIntake || {};
const social = structured?.social || {};
const securite = structured?.securite || {};
const traitement = structured?.traitement || {};
const dependance = structured?.dependance || {};
const gir = structured?.gir || {};
const clinical = structured?.clinical || {};

const service = normalize(patient?.service);
const isPediatric =
patient?.age < 18 ||
service.includes("pediatr") ||
service.includes("enfant");

const bucket = {};

const perteAutonomie = Boolean(
dependance?.mobilisation ||
dependance?.toilette ||
dependance?.alimentation
);

const surveillanceIDE = Boolean(gir?.passageIDE?.oui);
const isolement = Boolean(social?.isolementSocial);
const precarite = Boolean(social?.precarite);
const protectionJuridique = Boolean(social?.protectionJuridique);
const refusAide = Boolean(securite?.refusAide);
const logementInadapte = Boolean(securite?.logementInadapte);
const troublesCognitifs = Boolean(
securite?.troublesCognitifs || securite?.desorientation
);
const observanceFragile = Boolean(
traitement?.difficulte?.observanceFragile ||
traitement?.difficulte?.oublis
);

const troublePsyEnfant = Boolean(
clinical?.troubleComportement ||
clinical?.souffrancePsychique ||
clinical?.malEtre
);

const troubleNeuroDev = Boolean(
clinical?.retardDeveloppement || clinical?.troubleNeuroDev
);

const vraiBlocageCoordination = Boolean(
logementInadapte ||
refusAide ||
(isolement && precarite) ||
social?.droitsNonOuverts ||
social?.ruptureParcours ||
social?.blocageSocial
);

// =====================
// PÉDIATRIE PRIORITAIRE
// =====================
if (isPediatric) {
if (protectionJuridique || social?.informationPreoccupante || social?.crip) {
pushReason(bucket, "ASE / PMI", "protection enfant / situation sociale", 8);
pushAction(bucket, "ASE / PMI", "Évaluer la situation ASE / PMI");
pushForm(bucket, "ASE / PMI", "lettre_ase");
}

if (troublePsyEnfant) {
pushReason(bucket, "CMPEA / pédopsy", "souffrance psychique enfant", 7);
pushReason(bucket, "HDJ pédopsy", "besoin de relais pédopsy structuré", 6);
pushAction(bucket, "CMPEA / pédopsy", "Demander une évaluation pédopsy");
pushAction(bucket, "HDJ pédopsy", "Évaluer une prise en charge de jour");
}

if (troubleNeuroDev) {
pushReason(bucket, "CAMSP", "trouble neurodéveloppemental", 7);
pushAction(bucket, "CAMSP", "Orienter vers bilan développemental");
}

if (vraiBlocageCoordination) {
pushReason(bucket, "Équipe mobile enfant", "blocage de parcours enfant", 4);
pushAction(bucket, "Équipe mobile enfant", "Coordonner les acteurs enfant/famille");
}

if (!Object.keys(bucket).length) {
pushReason(bucket, "ASE / PMI", "situation pédiatrique à qualifier", 3);
}
}

// =====================
// ADULTE / GÉRIATRIE
// =====================
if (!isPediatric) {
if (perteAutonomie) {
pushReason(bucket, "APA", "perte autonomie", 4);
pushReason(bucket, "Aide à domicile", "besoin d'aides au domicile", 4);
pushReason(bucket, "HDJ", "évaluation autonomie", 2);
pushReason(bucket, "EHPAD", "dépendance à réévaluer", 2);

pushAction(bucket, "APA", "Ouvrir une demande APA");
pushAction(bucket, "Aide à domicile", "Évaluer les aides humaines nécessaires");
pushAction(bucket, "HDJ", "Évaluer la pertinence d'un HDJ gériatrique");
pushForm(bucket, "APA", "apa");
}

if (surveillanceIDE) {
pushReason(bucket, "Retour domicile IDEL", "surveillance IDE", 4);
pushReason(bucket, "HAD", "soins coordonnés à domicile", 3);
pushReason(bucket, "HDJ", "surveillance programmée", 2);

pushAction(bucket, "Retour domicile IDEL", "Organiser le relais IDEL");
pushAction(bucket, "HAD", "Vérifier l'éligibilité HAD");
pushAction(bucket, "HDJ", "Construire un parcours HDJ si surveillance séquencée");
}

if (isolement) {
pushReason(bucket, "Aide à domicile", "soutien au maintien à domicile", 3);
pushReason(bucket, "Aide sociale adulte", "évaluation sociale", 3);
pushReason(bucket, "APA", "besoin d'appui au domicile", 2);

pushAction(bucket, "Aide sociale adulte", "Demander une évaluation sociale");
pushAction(bucket, "Aide à domicile", "Rechercher un plan d'aides");
}

if (precarite) {
pushReason(bucket, "Aide sociale adulte", "précarité", 5);
pushReason(bucket, "Aide à domicile", "sécurisation du retour", 1);

pushAction(bucket, "Aide sociale adulte", "Mobiliser l'assistante sociale");
pushForm(bucket, "Aide sociale adulte", "aide_exceptionnelle");
}

if (protectionJuridique) {
pushReason(bucket, "Aide sociale adulte", "protection juridique", 5);
pushReason(bucket, "EHPAD", "orientation à encadrer", 1);

pushAction(bucket, "Aide sociale adulte", "Évaluer la mesure de protection");
pushForm(bucket, "Aide sociale adulte", "mdph");
}

if (refusAide) {
pushReason(bucket, "Aide sociale adulte", "adhésion fragile", 3);
pushReason(bucket, "HDJ", "travail progressif d'adhésion", 1);

pushAction(bucket, "Aide sociale adulte", "Travailler l'adhésion patient / entourage");
}

if (logementInadapte) {
pushReason(bucket, "Aide sociale adulte", "évaluation habitat", 4);
pushReason(bucket, "SSR / SMR", "retour impossible en l'état", 2);
pushReason(bucket, "EHPAD", "maintien au domicile compromis", 2);

pushAction(bucket, "Aide sociale adulte", "Évaluer les solutions habitat");
}

if (troublesCognitifs) {
pushReason(bucket, "HDJ", "troubles cognitifs", 4);
pushReason(bucket, "EHPAD", "sécurisation nécessaire", 2);
pushReason(bucket, "Aide sociale adulte", "besoin d'appui entourage", 2);

pushAction(bucket, "HDJ", "Évaluer un HDJ mémoire / gériatrique");
}

if (observanceFragile) {
pushReason(bucket, "HDJ", "réévaluation thérapeutique", 4);
pushReason(bucket, "HAD", "surveillance thérapeutique", 2);
pushReason(bucket, "Retour domicile IDEL", "sécurisation traitement", 2);

pushAction(bucket, "HDJ", "Évaluer un HDJ thérapeutique");
pushAction(bucket, "HAD", "Vérifier si besoin de suivi intensif");
}

// DAC uniquement en appui, pas en orientation par défaut
if (vraiBlocageCoordination) {
pushReason(bucket, "DAC / coordination", "blocage de parcours complexe", 2);
pushAction(bucket, "DAC / coordination", "Solliciter le DAC en appui");
}
}

const ranked = Object.values(bucket)
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);

const primaryItem =
ranked.find((item) => !isDAC(item.label)) || ranked[0];

const alternatives = ranked
.filter((item) => item.label !== primaryItem?.label)
.map((item) => item.label);

return {
ranked,
primary: primaryItem?.label || "",
alternative1: alternatives[0] || "",
alternative2: alternatives[1] || "",
reasons: primaryItem?.reasons || [],
actions: primaryItem?.actions || [],
forms: primaryItem?.forms || [],
};
}
