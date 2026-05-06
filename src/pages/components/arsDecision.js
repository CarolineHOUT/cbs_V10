export function getArsDecision(req) {
const text = `${req.category || ""} ${req.need || ""} ${req.status || ""}`.toLowerCase();

if ((req.status === "no_solution" || req.status === "Sans solution") && req.waitingHours >= 72) {
return {
level: "Niveau 1",
title: "Arbitrage ARS immédiat",
action: "Ouvrir cellule territoriale et rechercher une solution hors secteur.",
owner: "ARS / Direction parcours",
tone: "red",
};
}

if (text.includes("ase") || text.includes("mineur")) {
return {
level: "Niveau 1",
title: "Protection mineur prioritaire",
action: "Mobiliser ASE, pédopsy et établissement receveur.",
owner: "ARS + Département + pédopsy",
tone: "red",
};
}

if (text.includes("ehpad") || text.includes("usld")) {
return {
level: "Niveau 2",
title: "Aval médico-social bloqué",
action: "Activer recherche territoriale EHPAD/USLD.",
owner: "ARS autonomie / DAC",
tone: "amber",
};
}

if (text.includes("smr")) {
return {
level: "Niveau 2",
title: "Blocage SMR",
action: "Réorienter vers offre SMR disponible.",
owner: "Cellule territoriale SSR/SMR",
tone: "amber",
};
}

if (text.includes("had")) {
return {
level: "Niveau 3",
title: "Validation HAD à accélérer",
action: "Compléter critères HAD et sécuriser la coordination domicile.",
owner: "HAD / service demandeur",
tone: "blue",
};
}

if (text.includes("pédopsy") || text.includes("pedopsy")) {
return {
level: "Niveau 2",
title: "Tension pédopsy",
action: "Prioriser HDJ pédopsy et organiser relais territorial temporaire.",
owner: "Pédopsy territoriale",
tone: "amber",
};
}

if (req.waitingHours >= 48) {
return {
level: "Niveau 2",
title: "Délai critique",
action: "Escalader en SAS territorial.",
owner: "Coordination territoriale",
tone: "amber",
};
}

return {
level: "Niveau 3",
title: "Suivi territorial",
action: "Maintenir le suivi et réévaluer sous 24h.",
owner: "Établissement demandeur",
tone: "blue",
};
}