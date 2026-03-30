export const ORIENTATION_MODEL = {
Social: {
Isolement: {
freins: ["Absence de relais immédiat", "Risque de retour non sécurisé"],
actions: ["Contacter entourage", "Mobiliser assistante sociale", "Évaluer aides mobilisables"],
ressources: ["Service social", "Aides à domicile", "CCAS"],
orientations: ["Domicile accompagné", "Structure sociale adaptée"],
acteurs: ["Assistante sociale", "Cadre"],
},
"Absence aidant": {
freins: ["Sortie non sécurisée", "Relais domicile insuffisant"],
actions: ["Identifier aidant potentiel", "Organiser relais professionnel", "Évaluer plan B"],
ressources: ["Aide à domicile", "SSIAD", "Réseau local aidants"],
orientations: ["Domicile + accompagnement", "EHPAD temporaire"],
acteurs: ["Assistante sociale", "Cadre", "Entourage"],
},
"Refus famille": {
freins: ["Blocage décisionnel", "Absence d’adhésion sortie"],
actions: ["Recontacter famille", "Tracer le refus", "Proposer alternative"],
ressources: ["Médiation sociale", "Service social"],
orientations: ["Alternative institutionnelle", "Maintien temporaire encadré"],
acteurs: ["Cadre", "Médecin", "Assistante sociale"],
},
"Logement inadapté": {
freins: ["Retour domicile impossible", "Sécurité insuffisante"],
actions: ["Évaluer domicile", "Chercher solution transitoire", "Mobiliser adaptation logement"],
ressources: ["Ergothérapeute", "Assistante sociale", "Habitat adapté"],
orientations: ["SMR", "EHPAD temporaire", "Domicile adapté"],
acteurs: ["Assistante sociale", "Ergothérapeute", "Cadre"],
},
Précarité: {
freins: ["Absence de solution stable", "Rupture sociale"],
actions: ["Mobiliser service social", "Identifier hébergement", "Sécuriser droits"],
ressources: ["115 / hébergement", "CCAS", "Assistante sociale"],
orientations: ["Structure sociale adaptée", "Hébergement temporaire"],
acteurs: ["Assistante sociale", "Cadre"],
},
"Violence / risque": {
freins: ["Retour non sécurisé", "Risque pour patient / entourage"],
actions: ["Alerter acteurs adaptés", "Tracer risque", "Chercher solution protégée"],
ressources: ["Protection sociale", "Réseaux spécialisés"],
orientations: ["Structure protégée", "Sortie différée sécurisée"],
acteurs: ["Cadre", "Assistante sociale", "Direction"],
},
"Rupture entourage": {
freins: ["Absence de soutien", "Organisation domicile compromise"],
actions: ["Cartographier entourage réel", "Chercher relais externe", "Requalifier solution de sortie"],
ressources: ["Service social", "Réseau de proximité"],
orientations: ["Domicile encadré", "Institution temporaire"],
acteurs: ["Assistante sociale", "Cadre"],
},
"Besoin accompagnement social": {
freins: ["Coordination sortie insuffisante"],
actions: ["Ouvrir accompagnement social", "Programmer suivi", "Tracer référent"],
ressources: ["Service social", "Dispositifs d’accompagnement"],
orientations: ["Domicile accompagné", "Structure adaptée"],
acteurs: ["Assistante sociale", "Cadre"],
},
},

Juridique: {
"Tutelle / curatelle": {
freins: ["Décision tiers nécessaire"],
actions: ["Contacter protecteur", "Vérifier périmètre décisionnel", "Tracer échanges"],
ressources: ["Mandataire", "Service juridique"],
orientations: ["Selon décision protecteur"],
acteurs: ["Mandataire", "Cadre"],
},
"Consentement impossible": {
freins: ["Validation de sortie complexe"],
actions: ["Identifier représentant", "Tracer incapacité décisionnelle", "Sécuriser cadre de décision"],
ressources: ["Représentant légal", "Cellule éthique / juridique"],
orientations: ["À sécuriser selon cadre légal"],
acteurs: ["Cadre", "Médecin", "Juridique"],
},
"Conflit entourage": {
freins: ["Blocage décisionnel", "Messages contradictoires"],
actions: ["Identifier interlocuteur principal", "Tracer désaccord", "Arbitrer avec équipe"],
ressources: ["Médiation", "Service social", "Juridique"],
orientations: ["Solution sécurisée consensuelle ou arbitrée"],
acteurs: ["Cadre", "Médecin", "Assistante sociale"],
},
"Opposition patient": {
freins: ["Adhésion insuffisante"],
actions: ["Reprise d’information", "Tracer opposition", "Adapter proposition"],
ressources: ["Équipe référente", "Cadre", "Médiation"],
orientations: ["Alternative acceptable"],
acteurs: ["Médecin", "Cadre"],
},
"Protection juridique absente": {
freins: ["Décisions non stabilisées"],
actions: ["Identifier besoin de protection", "Alerter acteurs compétents", "Tracer urgence"],
ressources: ["Service social", "Juridique"],
orientations: ["Selon évolution du dossier"],
acteurs: ["Assistante sociale", "Cadre", "Juridique"],
},
"Décision administrative en attente": {
freins: ["Sortie bloquée par validation externe"],
actions: ["Relancer décision", "Tracer attente", "Préparer solution transitoire"],
ressources: ["Administration", "Réseau externe"],
orientations: ["Solution transitoire / cible selon décision"],
acteurs: ["Cadre", "Administration"],
},
},

"Coordination de soins": {
"Coordination ville-hôpital": {
freins: ["Relais non structurés"],
actions: ["Identifier référent ville", "Transmettre synthèse", "Valider relais"],
ressources: ["Médecin traitant", "IDE libéral", "DAC / coordination"],
orientations: ["Domicile coordonné"],
acteurs: ["IDE", "Cadre", "Médecin"],
},
"Besoin HAD": {
freins: ["Accord / faisabilité à confirmer"],
actions: ["Contacter HAD", "Transmettre éléments", "Prévoir plan B"],
ressources: ["HAD territoriale"],
orientations: ["HAD"],
acteurs: ["Médecin", "Cadre", "Coordination HAD"],
},
"Besoin SMR": {
freins: ["Place / orientation à confirmer"],
actions: ["Rechercher SMR", "Envoyer dossier", "Relancer établissements"],
ressources: ["SMR du territoire"],
orientations: ["SMR"],
acteurs: ["Cadre", "Médecin"],
},
"Soins techniques à organiser": {
freins: ["Sortie impossible sans relais technique"],
actions: ["Lister soins nécessaires", "Trouver relais", "Sécuriser démarrage"],
ressources: ["IDE libéraux", "Prestataires", "HAD"],
orientations: ["Domicile + soins", "HAD"],
acteurs: ["IDE", "Cadre", "Médecin"],
},
"Matériel à mettre en place": {
freins: ["Retour impossible sans équipement"],
actions: ["Commander matériel", "Vérifier livraison", "Tracer installation"],
ressources: ["Prestataires matériel", "Ergo", "HAD"],
orientations: ["Domicile équipé", "Structure temporaire"],
acteurs: ["IDE", "Cadre", "Ergothérapeute"],
},
"Absence IDE": {
freins: ["Soins non couverts à domicile"],
actions: ["Chercher IDE", "Élargir secteur", "Prévoir alternative"],
ressources: ["IDE libéraux", "SSIAD", "HAD"],
orientations: ["Domicile + IDE", "HAD", "Structure"],
acteurs: ["IDE", "Cadre"],
},
"Absence médecin traitant": {
freins: ["Relais médical non identifié"],
actions: ["Identifier médecin relais", "Contacter CPTS / DAC", "Tracer solution retenue"],
ressources: ["Médecin relais", "CPTS", "DAC"],
orientations: ["Domicile coordonné"],
acteurs: ["Cadre", "Médecin"],
},
"Multiplicité intervenants": {
freins: ["Perte d’info", "Coordination fragile"],
actions: ["Désigner pilote", "Lister intervenants", "Programmer points de coordination"],
ressources: ["DAC", "Cadre", "Référent sortie"],
orientations: ["Sortie coordonnée"],
acteurs: ["Cadre", "IDE", "Médecin"],
},
"Organisation complexe": {
freins: ["Plusieurs conditions à aligner"],
actions: ["Hiérarchiser freins", "Nommer responsable", "Fixer échéances"],
ressources: ["Pilotage interne", "Réseau territorial"],
orientations: ["À arbitrer selon levier principal"],
acteurs: ["Cadre", "IDE", "Médecin", "Assistante sociale"],
},
},

"Pédiatrie / Maternité": {
"Retour simple": {
freins: [],
actions: ["Vérifier sécurisation du retour", "Informer entourage"],
ressources: ["Pédiatre / sage-femme", "PMI"],
orientations: ["Domicile simple"],
acteurs: ["Sage-femme", "Pédiatre"],
},
"Retour renforcé": {
freins: ["Besoin d’accompagnement rapproché"],
actions: ["Programmer suivi", "Informer réseau", "Tracer vigilance"],
ressources: ["PMI", "Réseau périnatalité"],
orientations: ["Domicile renforcé"],
acteurs: ["Sage-femme", "PMI", "Cadre"],
},
PMI: {
freins: ["Suivi de terrain à organiser"],
actions: ["Contacter PMI", "Programmer relais"],
ressources: ["PMI"],
orientations: ["Domicile + PMI"],
acteurs: ["PMI", "Sage-femme"],
},
"Accompagnement parental": {
freins: ["Compétences parentales à soutenir"],
actions: ["Identifier besoins parentaux", "Organiser soutien", "Tracer relais"],
ressources: ["PMI", "Réseau parentalité"],
orientations: ["Retour accompagné"],
acteurs: ["PMI", "Assistante sociale"],
},
"Parents en difficulté": {
freins: ["Retour fragile", "Besoin de filet de sécurité"],
actions: ["Mobiliser social", "Évaluer entourage", "Prévoir relais rapproché"],
ressources: ["PMI", "ASE", "Service social"],
orientations: ["Retour renforcé", "Orientation spécialisée"],
acteurs: ["Assistante sociale", "PMI", "ASE"],
},
Signalement: {
freins: ["Situation à risque pour l’enfant"],
actions: ["Tracer signalement", "Coordonner acteurs", "Sécuriser sortie"],
ressources: ["ASE", "Protection enfance"],
orientations: ["Décision protégée"],
acteurs: ["ASE", "Cadre", "Assistante sociale"],
},
ASE: {
freins: ["Décision externe / coordination nécessaire"],
actions: ["Contacter ASE", "Tracer échanges", "Préparer scénario sortie"],
ressources: ["ASE"],
orientations: ["Placement / accueil / retour encadré"],
acteurs: ["ASE", "Assistante sociale", "Cadre"],
},
Placement: {
freins: ["Organisation d’accueil"],
actions: ["Coordonner lieu d’accueil", "Transmettre dossier", "Sécuriser transfert"],
ressources: ["ASE", "Structures accueil"],
orientations: ["Placement"],
acteurs: ["ASE", "Cadre"],
},
"Structure pédopsy": {
freins: ["Besoin orientation spécialisée"],
actions: ["Identifier structure", "Contacter dispositif", "Préparer transmission"],
ressources: ["Pédopsy", "Structures spécialisées"],
orientations: ["Structure pédopsy"],
acteurs: ["Pédopsy", "Cadre"],
},
"CMP / CMPP": {
freins: ["Suivi ambulatoire spécialisé à organiser"],
actions: ["Contacter CMP/CMPP", "Programmer rendez-vous", "Tracer relais"],
ressources: ["CMP", "CMPP"],
orientations: ["Suivi spécialisé"],
acteurs: ["Pédopsy", "Cadre"],
},
"HDJ pédopsy": {
freins: ["Nécessité de prise en charge intermédiaire"],
actions: ["Identifier HDJ", "Transmettre demande", "Coordonner famille"],
ressources: ["HDJ pédopsy"],
orientations: ["HDJ pédopsy"],
acteurs: ["Pédopsy", "Cadre", "Famille"],
},
"Hospitalisation pédopsy": {
freins: ["Besoin d’orientation spécialisée urgente"],
actions: ["Chercher place", "Coordonner transfert", "Informer entourage"],
ressources: ["Pédopsy hospitalière"],
orientations: ["Hospitalisation pédopsy"],
acteurs: ["Pédopsy", "Cadre"],
},
"Maternité vulnérable": {
freins: ["Retour fragile mère / enfant"],
actions: ["Activer réseau périnatal", "Évaluer soutien", "Organiser relais"],
ressources: ["Réseau périnatalité", "PMI", "Sage-femme"],
orientations: ["Retour renforcé"],
acteurs: ["Sage-femme", "PMI", "Assistante sociale"],
},
"Sortie mère-enfant fragile": {
freins: ["Besoin d’appui rapproché au retour"],
actions: ["Organiser suivi", "Sécuriser entourage", "Tracer plan de sortie"],
ressources: ["PMI", "Sage-femme", "Réseau périnatalité"],
orientations: ["Retour renforcé"],
acteurs: ["Sage-femme", "PMI", "Cadre"],
},
"Réseau périnatalité": {
freins: ["Coordination spécialisée à structurer"],
actions: ["Contacter réseau", "Organiser relais", "Tracer référents"],
ressources: ["Réseau périnatalité"],
orientations: ["Retour coordonné"],
acteurs: ["Sage-femme", "Réseau périnatalité"],
},
},

"Autonomie / Gérontologie": {
"Perte d’autonomie": {
freins: ["Retour domicile insuffisamment sécurisé"],
actions: ["Évaluer aides nécessaires", "Chercher relais", "Réévaluer orientation"],
ressources: ["Aides à domicile", "SSIAD", "Ergo"],
orientations: ["Domicile accompagné", "EHPAD", "USLD"],
acteurs: ["Cadre", "Ergothérapeute", "Assistante sociale"],
},
Chute: {
freins: ["Risque de retour non sécurisé"],
actions: ["Sécuriser environnement", "Évaluer aides", "Prévoir relais"],
ressources: ["Ergo", "Aides domicile"],
orientations: ["Domicile adapté", "Structure temporaire"],
acteurs: ["Cadre", "Ergothérapeute"],
},
"Dépendance lourde": {
freins: ["Besoin d’accompagnement important"],
actions: ["Évaluer solution durable", "Mobiliser entourage", "Chercher structure adaptée"],
ressources: ["EHPAD", "USLD", "Aides renforcées"],
orientations: ["EHPAD", "USLD"],
acteurs: ["Cadre", "Assistante sociale", "Entourage"],
},
"Besoin aidant": {
freins: ["Retour impossible sans soutien humain"],
actions: ["Identifier aidant", "Mesurer disponibilité", "Prévoir alternative"],
ressources: ["Réseau aidants", "Aides domicile"],
orientations: ["Domicile + aidant", "Structure"],
acteurs: ["Assistante sociale", "Entourage", "Cadre"],
},
"Épuisement entourage": {
freins: ["Relais familial non tenable"],
actions: ["Évaluer répit", "Chercher alternative", "Tracer niveau d’épuisement"],
ressources: ["Accueil temporaire", "Aides domicile", "EHPAD"],
orientations: ["Répit", "Institution temporaire", "EHPAD"],
acteurs: ["Assistante sociale", "Cadre", "Entourage"],
},
"Besoin EHPAD": {
freins: ["Place / adhésion / délai"],
actions: ["Rechercher EHPAD", "Relancer structures", "Prévoir plan B"],
ressources: ["EHPAD territoriaux"],
orientations: ["EHPAD"],
acteurs: ["Cadre", "Assistante sociale"],
},
"Besoin USLD": {
freins: ["Orientation spécialisée à confirmer"],
actions: ["Identifier USLD", "Transmettre dossier", "Relancer filière"],
ressources: ["USLD"],
orientations: ["USLD"],
acteurs: ["Cadre", "Médecin"],
},
},
};

export const ORIENTATION_CATEGORIES = Object.keys(ORIENTATION_MODEL);

export function getSubcategories(category) {
if (!category || !ORIENTATION_MODEL[category]) return [];
return Object.keys(ORIENTATION_MODEL[category]);
}

export function getMultiplePayloads(selectedSubcategoriesByCategory = {}) {
const payloads = [];

Object.entries(selectedSubcategoriesByCategory).forEach(([category, subcategories]) => {
(subcategories || []).forEach((subcategory) => {
const payload = ORIENTATION_MODEL?.[category]?.[subcategory];
if (payload) {
payloads.push({
category,
subcategory,
...payload,
});
}
});
});

return payloads;
}

export function aggregatePayloads(selectedSubcategoriesByCategory = {}) {
const payloads = getMultiplePayloads(selectedSubcategoriesByCategory);
const unique = (arr) => [...new Set(arr.filter(Boolean))];

return {
payloads,
freins: unique(payloads.flatMap((item) => item.freins || [])),
actions: unique(payloads.flatMap((item) => item.actions || [])),
ressources: unique(payloads.flatMap((item) => item.ressources || [])),
orientations: unique(payloads.flatMap((item) => item.orientations || [])),
acteurs: unique(payloads.flatMap((item) => item.acteurs || [])),
};
}