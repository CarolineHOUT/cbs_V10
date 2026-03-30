const fakeResourcesDb = [
{
id: "1",
name: "SSIAD Cotentin",
type: "domicile",
city: "cherbourg",
distanceKm: 7,
travelMinutes: 14,
keywords: ["SSIAD", "Nursing lourd", "Surveillance rapprochée"],
status: "Disponible",
},
{
id: "2",
name: "HAD Pédiatrique Cotentin",
type: "had",
city: "carentan",
distanceKm: 8,
travelMinutes: 16,
keywords: ["HAD pédiatrique", "Soins techniques pédiatriques"],
status: "Disponible",
},
{
id: "3",
name: "Assistante sociale secteur",
type: "social",
city: "cherbourg",
distanceKm: 5,
travelMinutes: 10,
keywords: ["Isolement social", "Ouverture de droits", "Précarité"],
status: "Disponible",
},
{
id: "4",
name: "PMI Nord Cotentin",
type: "social",
city: "cherbourg",
distanceKm: 6,
travelMinutes: 12,
keywords: ["Suivi PMI", "Suivi PMI nécessaire", "Soutien parental"],
status: "Disponible",
},
{
id: "5",
name: "Accueil de jour Valognes",
type: "aval",
city: "valognes",
distanceKm: 18,
travelMinutes: 26,
keywords: ["Accueil de jour", "Troubles cognitifs sévères"],
status: "Disponible",
},
{
id: "6",
name: "Transport sanitaire Nord Manche",
type: "transport",
city: "cherbourg",
distanceKm: 9,
travelMinutes: 15,
keywords: ["Transport sanitaire", "Transport pédiatrique"],
status: "Disponible",
},
{
id: "7",
name: "HDJ Cardiologie Cotentin",
type: "hdj",
city: "cherbourg",
distanceKm: 11,
travelMinutes: 18,
keywords: ["HDJ cardiologie", "ECG", "Consultation cardiologie"],
status: "Disponible",
},
{
id: "8",
name: "Aide à domicile Manche Nord",
type: "domicile",
city: "equeurdreville-hainneville",
distanceKm: 4,
travelMinutes: 9,
keywords: ["Aide ménagère", "Aide à la toilette", "Téléassistance"],
status: "Disponible",
},
];

export function searchNearbyResources({ radiusKm = 20, keywords = [] }) {
const normalizedKeywords = keywords.map((k) => String(k).toLowerCase());

return fakeResourcesDb
.filter((r) => {
if (r.distanceKm > radiusKm) return false;
if (normalizedKeywords.length === 0) return true;

const haystack = [r.name, ...(r.keywords || [])].join(" ").toLowerCase();
return normalizedKeywords.some((kw) => haystack.includes(kw));
})
.sort((a, b) => a.distanceKm - b.distanceKm);
}