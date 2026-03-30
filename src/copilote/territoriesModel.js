export const SEARCH_PERIMETERS = [
{
value: "patient_sector",
label: "Secteur patient",
description: "Ressources strictement du territoire du patient",
priority: 1,
},
{
value: "extended_sector",
label: "Secteur élargi",
description: "Territoires adjacents au secteur patient",
priority: 2,
},
{
value: "department",
label: "Département",
description: "Toutes les ressources du département",
priority: 3,
},
];

export const TERRITORY_MAPPING = {
cotentin_nord: {
label: "Cotentin Nord",
postalCodes: ["50100", "50470", "50110"],
neighbours: ["cotentin_centre"],
},
cotentin_centre: {
label: "Cotentin Centre",
postalCodes: ["50700", "50310", "50260"],
neighbours: ["cotentin_nord", "cotentin_sud"],
},
cotentin_sud: {
label: "Cotentin Sud",
postalCodes: ["50270", "50580"],
neighbours: ["cotentin_centre"],
},
};