function normalize(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function pushReason(bucket, label, reason, points = 1) {
if (!bucket[label]) {
bucket[label] = {
label,
score: 0,
reasons: [],
actions: [],
forms: [],
};
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

// Autonomie / dépendance
if (perteAutonomie) {
pushReason(bucket, "APA", "perte autonomie", 4);
pushReason(bucket, "DAC", "coordination autonomie", 3);
pushReason(bucket, "Aide à domicile", "besoin d'aides au domicile", 4);
pushReason(bucket, "HDJ", "évaluation autonomie", 2);
pushReason(bucket, "EHPAD", "dépendance à réévaluer", 2);

pushAction(bucket, "APA", "Ouvrir une demande APA");
pushAction(bucket, "DAC", "Solliciter le DAC");
pushAction(bucket, "Aide à domicile", "Évaluer les aides humaines nécessaires");
pushAction(bucket, "HDJ", "Évaluer la pertinence d'un HDJ gériatrique");

pushForm(bucket, "APA", "apa");
}

// Surveillance IDE / soins
if (surveillanceIDE) {
pushReason(bucket, "Retour domicile IDEL", "surveillance IDE", 4);
pushReason(bucket, "HAD", "soins coordonnés à domicile", 3);
pushReason(bucket, "HDJ", "surveillance programmée", 2);

pushAction(bucket, "Retour domicile IDEL", "Organiser le relais IDEL");
pushAction(bucket, "HAD", "Vérifier l'éligibilité HAD");
pushAction(bucket, "HDJ", "Construire un parcours HDJ si surveillance séquencée");
}

// Isolement / rupture sociale
if (isolement) {
pushReason(bucket, "DAC", "isolement social", 4);
pushReason(bucket, "Aide à domicile", "soutien au maintien à domicile", 3);
pushReason(bucket, "ASE / social", "évaluation sociale", 4);
pushReason(bucket, "APA", "besoin d'appui au domicile", 2);
pushReason(bucket, "HDJ", "appui médico-social", 1);

pushAction(bucket, "DAC", "Déclencher une coordination DAC");
pushAction(bucket, "ASE / social", "Demander une évaluation sociale");
pushAction(bucket, "Aide à domicile", "Rechercher un plan d'aides");
}

// Précarité
if (precarite) {
pushReason(bucket, "ASE / social", "précarité", 5);
pushReason(bucket, "DAC", "coordination sociale complexe", 2);
pushReason(bucket, "Aide à domicile", "sécurisation du retour", 1);

pushAction(bucket, "ASE / social", "Mobiliser l'assistante sociale");
pushAction(bucket, "DAC", "Coordonner les acteurs du territoire");
pushForm(bucket, "ASE / social", "aide_exceptionnelle");
}

// Protection juridique
if (protectionJuridique) {
pushReason(bucket, "ASE / social", "protection juridique", 5);
pushReason(bucket, "DAC", "situation complexe", 2);
pushReason(bucket, "EHPAD", "orientation à encadrer", 1);

pushAction(bucket, "ASE / social", "Évaluer la mesure de protection");
pushForm(bucket, "ASE / social", "mdph");
}

// Refus d'aide
if (refusAide) {
pushReason(bucket, "DAC", "refus aide", 3);
pushReason(bucket, "ASE / social", "adhésion fragile", 3);
pushReason(bucket, "HDJ", "travail progressif d'adhésion", 1);

pushAction(bucket, "DAC", "Prévoir une coordination renforcée");
pushAction(bucket, "ASE / social", "Travailler l'adhésion patient / entourage");
}

// Logement inadapté
if (logementInadapte) {
pushReason(bucket, "DAC", "logement inadapté", 4);
pushReason(bucket, "ASE / social", "évaluation habitat", 4);
pushReason(bucket, "SSR / SMR", "retour impossible en l'état", 2);
pushReason(bucket, "EHPAD", "maintien au domicile compromis", 2);

pushAction(bucket, "DAC", "Coordonner une évaluation du domicile");
pushAction(bucket, "ASE / social", "Évaluer les solutions habitat");
}

// Cognitif
if (troublesCognitifs) {
pushReason(bucket, "HDJ", "troubles cognitifs", 4);
pushReason(bucket, "DAC", "coordination complexe", 3);
pushReason(bucket, "EHPAD", "sécurisation nécessaire", 2);
pushReason(bucket, "ASE / social", "besoin d'appui entourage", 2);

pushAction(bucket, "HDJ", "Évaluer un HDJ mémoire / gériatrique");
pushAction(bucket, "DAC", "Coordonner les intervenants");
}

// Traitement / observance
if (observanceFragile) {
pushReason(bucket, "HDJ", "réévaluation thérapeutique", 4);
pushReason(bucket, "HAD", "surveillance thérapeutique", 2);
pushReason(bucket, "Retour domicile IDEL", "sécurisation traitement", 2);

pushAction(bucket, "HDJ", "Évaluer un HDJ thérapeutique");
pushAction(bucket, "HAD", "Vérifier si besoin de suivi intensif");
}

const ranked = Object.values(bucket)
.filter((item) => item.score > 0)
.sort((a, b) => b.score - a.score);

return {
ranked,
primary: ranked[0]?.label || "",
alternative1: ranked[1]?.label || "",
alternative2: ranked[2]?.label || "",
reasons: ranked[0]?.reasons || [],
actions: ranked[0]?.actions || [],
forms: ranked[0]?.forms || [],
};
}
