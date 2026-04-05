import { isDirection, getUserScopeServices } from "./authModel";

export function canAccessPatient(user, patient) {
  if (!user || !patient) return false;
  if (isDirection(user)) return true;

  const allowedServices = getUserScopeServices(user);
  return allowedServices.includes(patient.service);
}