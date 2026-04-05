import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authenticateUser, DEMO_PASSWORD, SEED_USERS } from "./authModel";



const STORAGE_KEY = "cbs-auth-user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [currentUser, setCurrentUser] = useState(() => {
try {
const raw = window.localStorage.getItem(STORAGE_KEY);
return raw ? JSON.parse(raw) : null;
} catch {
return null;
}
});

useEffect(() => {
try {
if (currentUser) {
window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
window.localStorage.setItem("currentUser", JSON.stringify(currentUser));
} else {
window.localStorage.removeItem(STORAGE_KEY);
window.localStorage.removeItem("currentUser");
}
} catch {
// no-op
}
}, [currentUser]);

function login({ matricule, password }) {
const seededUser = authenticateUser(matricule, password);

if (seededUser) {
setCurrentUser(seededUser);
return { ok: true, user: seededUser };
}

const adminUsers = JSON.parse(window.localStorage.getItem("users") || "[]");
const normalized = String(matricule || "").trim().toUpperCase();

const adminUser = adminUsers.find(
(u) => String(u.matricule || "").trim().toUpperCase() === normalized
);

if (adminUser) {
const normalizedAdminUser = {
id: adminUser.matricule,
matricule: adminUser.matricule,
password: adminUser.password || DEMO_PASSWORD,
displayName: adminUser.displayName || adminUser.matricule,
role: String(adminUser.role || "").toLowerCase(),
roleLabel: adminUser.role || "",
serviceCode: adminUser.serviceCode || adminUser.service || "ALL",
serviceLabel:
adminUser.serviceLabel || adminUser.service || "Tous les services",
fullAccess:
String(adminUser.role || "").toUpperCase() === "DIRECTION",
};

setCurrentUser(normalizedAdminUser);
return { ok: true, user: normalizedAdminUser };
}

return { ok: false, message: "Utilisateur inconnu" };
}

function logout() {
setCurrentUser(null);
}

const value = useMemo(
() => ({
currentUser,
isAuthenticated: Boolean(currentUser),
login,
logout,
demoPassword: "Demo@2026",
users: [],
}),
[currentUser]
);

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
const value = useContext(AuthContext);
if (!value) {
throw new Error("useAuth must be used within AuthProvider");
}
return value;
}
