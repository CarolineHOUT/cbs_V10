import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function formatRole(role) {
  if (role === "DIRECTION") return "Direction";
  if (role === "CADRE") return "Cadre";
  if (role === "MEDECIN") return "Médecin";
  if (role === "IDE") return "IDE";
  if (role === "AS") return "AS";
  return role || "Utilisateur";
}

function getInitials(user) {
  const source = user?.nom || user?.matricule || "U";
  return String(source).slice(0, 2).toUpperCase();
}

export default function AppHeader({ subtitle, onLogout, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: "Tableau de bord", path: "/dashboard" },
    { label: "Crise", path: "/crise", danger: true },
  ];

  function isActive(path) {
    return location.pathname.startsWith(path);
  }

  const displayName = user?.nom || user?.matricule || "Utilisateur";
  const displayRole = formatRole(user?.role);
  const displayService = user?.service ? ` • ${user.service}` : "";

  return (
    <header style={styles.wrapper}>
      {/* 🔵 NOM APPLICATION */}
      <div style={styles.brand}>
  <div style={styles.title}>
  <span style={styles.car}>CARABBAS</span>
</div>

        <div style={styles.subtitle}>
          Coordination et pilotage des parcours patient
        </div>
      </div>

      {/* 🧭 NAVIGATION */}
      <nav style={styles.nav}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              style={{
                ...styles.tab,
                ...(active ? styles.tabActive : {}),
                ...(tab.danger ? styles.tabDanger : {}),
                ...(tab.danger && active ? styles.tabDangerActive : {}),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 👤 UTILISATEUR */}
      <div style={styles.right}>
        <div style={styles.user}>
          <div style={styles.avatar}>{getInitials(user)}</div>

          <div style={styles.userText}>
            <div style={styles.userName}>{displayName}</div>
            <div style={styles.userMeta}>
              {displayRole}
              {displayService}
            </div>
          </div>
        </div>

        <button onClick={() => onLogout?.()} style={styles.logout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    padding: "12px 20px",
    background: "#17376a",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  brand: {
    display: "grid",
    gap: 2,
    minWidth: 200,
  },

  title: {
    fontSize: 18,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    letterSpacing: 0.5,
  },

car: {
  color: "#c7d2fe", // plus proche du blanc (plus doux)
  fontWeight: 900,
},
abbas: {
  color: "#ffffff",
  fontWeight: 900,
},

  subtitle: {
    fontSize: 12,
    color: "#c7d2fe",
  },

  nav: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
  },

  tab: {
  background: "transparent",
  color: "#cbd5f5", // plus doux
  border: "none",
  padding: "6px 10px", // 👈 plus compact
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600, // 👈 moins agressif
  cursor: "pointer",
},

  tabActive: {
  background: "rgba(255,255,255,0.15)",
  color: "#ffffff",
},

  tabDanger: {
 color: "#fca5a5", // rouge doux
},

tabDangerActive: {
  background: "rgba(220,38,38,0.2)",
  color: "#ffffff",
},

  tabDangerActive: {
    background: "#dc2626",
    color: "#ffffff",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  user: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#ffffff",
    color: "#17376a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
  },

  userText: {
    display: "grid",
    gap: 1,
  },

  userName: {
    fontSize: 12,
    fontWeight: 800,
    color: "#ffffff",
  },

  userMeta: {
    fontSize: 11,
    color: "#c7d2fe",
  },

  logout: {
    background: "#ffffff",
    color: "#17376a",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
  },
};