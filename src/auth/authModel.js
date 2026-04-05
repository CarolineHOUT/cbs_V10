import { HOSPITAL_SERVICES } from "../data/hospitalServices";

const DEFAULT_PASSWORD = "Demo@2026";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function createUser({ matricule, role, serviceCode, serviceLabel, fullAccess = false, displayName }) {
  return {
    id: matricule,
    matricule,
    password: DEFAULT_PASSWORD,
    role,
    roleLabel: role,
    serviceCode: serviceCode || "ALL",
    serviceLabel: serviceLabel || "Tous les services",
    fullAccess,
    displayName,
  };
}

export function buildSeedUsers() {
  const users = [
    createUser({
      matricule: "DIR001",
      role: "direction",
      displayName: "Compte Direction",
      fullAccess: true,
    }),
  ];

  HOSPITAL_SERVICES.forEach((service) => {
    const suffix = slugify(service.code || service.label).slice(0, 10);

    users.push(
      createUser({
        matricule: `CAD${suffix}`,
        role: "cadre",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `Cadre ${service.label}`,
      }),
      createUser({
        matricule: `AS1${suffix}`,
        role: "as",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `AS 1 ${service.label}`,
      }),
      createUser({
        matricule: `AS2${suffix}`,
        role: "as",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `AS 2 ${service.label}`,
      }),
      createUser({
        matricule: `IDE1${suffix}`,
        role: "ide",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `IDE 1 ${service.label}`,
      }),
      createUser({
        matricule: `IDE2${suffix}`,
        role: "ide",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `IDE 2 ${service.label}`,
      }),
      createUser({
        matricule: `MED1${suffix}`,
        role: "medecin",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `Médecin 1 ${service.label}`,
      }),
      createUser({
        matricule: `MED2${suffix}`,
        role: "medecin",
        serviceCode: service.code,
        serviceLabel: service.label,
        displayName: `Médecin 2 ${service.label}`,
      })
    );
  });

  return users;
}

export const SEED_USERS = buildSeedUsers();
export const DEMO_PASSWORD = DEFAULT_PASSWORD;

export function normalizeLogin(value) {
  return String(value || "").trim().toUpperCase();
}

export function authenticateUser(matricule, password) {
  const normalized = normalizeLogin(matricule);
  return (
    SEED_USERS.find(
      (user) =>
        normalizeLogin(user.matricule) === normalized && user.password === password
    ) || null
  );
}

export function getUserScopeServices(user) {
  if (!user) return [];
  if (user.fullAccess || user.role === "direction") return [];
  return [user.serviceLabel];
}

export function isDirection(user) {
  return Boolean(user?.fullAccess || user?.role === "direction");
}
