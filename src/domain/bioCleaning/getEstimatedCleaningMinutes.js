export function computeScenarioTotalMinutes(scenario, zones) {
const baseMinutes = (scenario?.zones || []).reduce((sum, zoneId) => {
const zone = zones.find((z) => z.id === zoneId && z.active);
return sum + (zone?.minutes || 0);
}, 0);

return Math.round(baseMinutes * (scenario?.multiplier || 1));
}

export function resolveBioCleaningScenario(patient, scenarios = []) {
const isIsolation = Boolean(patient?.infectionRisk?.isolation);
const isPartial = Boolean(patient?.partialDischarge);
const roomType =
patient?.roomType === "double" || patient?.bedroomType === "double"
? "double"
: "simple";

return (
scenarios.find((scenario) => {
const roomMatches =
scenario.roomType === "all" ||
scenario.roomType === roomType ||
scenario.roomType === "none";

const partialMatches = Boolean(scenario.partial) === isPartial;
const isolationMatches = Boolean(scenario.isolation) === isIsolation;

return roomMatches && partialMatches && isolationMatches;
}) || null
);
}

export function getEstimatedCleaningMinutesFromSettings(
patient,
settings
) {
const zones = settings?.zones || [];
const scenarios = settings?.scenarios || [];

const scenario = resolveBioCleaningScenario(patient, scenarios);

if (!scenario) {
return 30;
}

return computeScenarioTotalMinutes(scenario, zones);
}
