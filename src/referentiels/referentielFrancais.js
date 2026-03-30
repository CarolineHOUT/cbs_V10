export const STATUTS_ACTION = [
{ code: "a_faire", label: "À faire" },
{ code: "en_attente", label: "En attente" },
{ code: "termine", label: "Terminé" },
{ code: "bloque", label: "Bloqué" },
{ code: "annule", label: "Annulé" },
{ code: "refuse", label: "Refusé" },
];

export const STATUTS_DEMANDE = [
{ code: "a_creer", label: "À créer" },
{ code: "envoye", label: "Envoyé" },
{ code: "en_attente", label: "En attente" },
{ code: "accepte", label: "Accepté" },
{ code: "refuse", label: "Refusé" },
{ code: "annule", label: "Annulé" },
{ code: "clos", label: "Clos" },
];

export const PRIORITES = [
{ code: "haute", label: "Haute" },
{ code: "standard", label: "Standard" },
{ code: "basse", label: "Basse" },
];

export const MOTIFS_REFUS = [
"Refus du patient",
"Refus de l’entourage",
"Refus du secteur",
"Capacité insuffisante",
"Dossier incomplet",
"Critères non remplis",
"Orientation non pertinente",
"Absence de réponse",
"Pas de place disponible",
"Autre",
];

export const MOTIFS_ANNULATION = [
"Doublon",
"Erreur de demande",
"Changement d’orientation",
"Demande devenue inutile",
"Patient sorti",
"Solution trouvée autrement",
"Autre",
];

export const BADGES_PERTINENCE = [
{ code: "prioritaire", label: "Prioritaire" },
{ code: "pertinent", label: "Pertinent" },
{ code: "secondaire", label: "Secondaire" },
];

export const LIBELLES_UI = {
solutionPrincipale: "Solution principale",
alternatives: "Alternatives",
contactPrioritaire: "Contact prioritaire",
coordonnees: "Coordonnées",
demande: "Demande",
suivi: "Suivi",
prochaineRelance: "Prochaine relance",
derniereMiseAJour: "Dernière mise à jour",
responsable: "Responsable",
priorite: "Priorité",
echeance: "Échéance",
typeDemande: "Type de demande",
motifRefus: "Motif de refus",
motifAnnulation: "Motif d’annulation",
commentaire: "Commentaire",
notes: "Notes",
formulairesUtiles: "Formulaires utiles",
solutionsTerrain: "Solutions terrain",
collectifRecommande: "Collectif recommandé",
rechercheRessources: "Recherche de ressources",
hdjPropose: "HDJ proposé",
};

export const CATEGORIES_METIER = [
"Domicile",
"Soins",
"Social",
"Autonomie",
"Hébergement",
"Coordination",
"Enfance",
"Administratif",
];

export const SOUS_CATEGORIES_METIER = {
Domicile: [
"Retour domicile",
"Absence de relais",
"Aide humaine",
"Logement inadapté",
"Isolement",
],
Soins: [
"Nursing lourd",
"Pansement",
"Injection",
"Perfusion",
"Surveillance",
],
Social: [
"Précarité",
"Droits",
"APA",
"MDPH",
"PCH",
"Mesure de protection",
],
Autonomie: [
"Perte d’autonomie",
"Aide à la toilette",
"Lever / coucher",
"Repas",
"Téléassistance",
],
Hébergement: [
"Hébergement temporaire",
"EHPAD",
"Résidence autonomie",
"Solution de répit",
],
Coordination: [
"Sortie complexe",
"Multi-acteurs",
"Relance",
"Suivi de demande",
],
Enfance: [
"Signalement",
"Information préoccupante",
"PMI",
"ASE",
"CRIP",
],
Administratif: [
"Formulaire social",
"Formulaire autonomie",
"Formulaire handicap",
"Plateforme",
],
};
