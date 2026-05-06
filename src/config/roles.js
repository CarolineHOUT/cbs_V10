export const USER_ROLES = {
DIRECTION: "direction",
CADRE: "cadre",
CADRE_BIO: "cadre_bio",
ADMIN: "admin",
AGENT: "agent",
BIO: "bio",
};



export function canAccessBioCleaningSettings(role) {
return ["direction", "cadre", "cadre_bio", "admin"].includes(
String(role || "").toLowerCase()
);
}
