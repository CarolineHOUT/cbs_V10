export const intakeCategoryTree = [
  {
    id: "entourage",
    label: "Entourage",
    children: [
      { id: "seul", label: "Vit seul" },
      { id: "aucuneAide", label: "Aucune aide" },
    ],
  },
  {
    id: "dependance",
    label: "Dépendance",
    children: [
      { id: "toilette", label: "Toilette" },
      { id: "habillage", label: "Habillage" },
      { id: "alimentation", label: "Alimentation" },
    ],
  },
  {
    id: "securite",
    label: "Sécurité",
    children: [
      { id: "risqueChute", label: "Risque de chute" },
      { id: "troublesCognitifs", label: "Troubles cognitifs" },
      { id: "desorientation", label: "Désorientation" },
    ],
  },
  {
    id: "traitement",
    label: "Traitement",
    children: [
      { id: "observanceFragile", label: "Observance fragile" },
      { id: "oublis", label: "Oublis" },
    ],
  },
  {
    id: "social",
    label: "Social",
    children: [
      { id: "isolementSocial", label: "Isolement social" },
    ],
  },
];