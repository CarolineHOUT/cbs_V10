import { useState } from "react";
import logoAccueil from "../assets/logo_accueil.png";
import {
  ShieldCheck,
  Stethoscope,
  Users,
  Building2,
  LockKeyhole,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./LoginView.css";

import { useNavigate } from "react-router-dom";


const roleBlocks = [
  {
    icon: <Building2 size={18} />,
    title: "Direction",
    text: "Vision globale sur l'ensemble des services et des situations suivies.",
  },
  {
    icon: <Users size={18} />,
    title: "Cadres et équipes",
    text: "Accès ciblé sur le périmètre métier du service de rattachement.",
  },
  {
    icon: <Stethoscope size={18} />,
    title: "Profils de soin",
    text: "Parcours sécurisé pour AS, IDE et médecins selon les droits attribués.",
  },
];

export default function LoginView({ onLogin }) {
  const { login, demoPassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    matricule: "",
    password: demoPassword || "",
  });

  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const result = login(form);

    if (!result?.ok) {
      setError(result?.message || "Connexion impossible");
      return;
    }

    setError("");

    if (result?.user) {
      localStorage.setItem("currentUser", JSON.stringify(result.user));

      if (onLogin) {
        onLogin(result.user);
      }

      navigate("/dashboard", { replace: true });
      return;
    }

    setError("Utilisateur non retourné par le login");
  }

  return (
    <div className="carabbas-login-shell">
      <div className="carabbas-login-bg carabbas-login-bg--one" />
      <div className="carabbas-login-bg carabbas-login-bg--two" />

      <div className="carabbas-login-grid">
        <section className="carabbas-brand-panel">
  <div className="carabbas-brand-topline">
    <span className="carabbas-brand-seal">
      <ShieldCheck size={18} />
    </span>
    <span className="carabbas-brand-chip">Plateforme sécurisée</span>
  </div>

  <div className="carabbas-logo-card">
    <img
      src={logoAccueil}
      alt="CARABBAS - Coordination Parcours Patient"
      className="carabbas-login-logo"
    />
  </div>


</section>

        <section className="carabbas-auth-panel">
          <div className="carabbas-auth-header">
            <p className="carabbas-auth-kicker">Espace d'authentification</p>
            <h2>Connexion sécurisée</h2>
            <p>
              Saisissez votre matricule et votre mot de passe pour accéder à
              votre espace CARABBAS.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="carabbas-auth-form">
            <label className="carabbas-field">
              <span>Matricule</span>
              <input
                value={form.matricule}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    matricule: event.target.value,
                  }))
                }
                placeholder="Votre matricule"
                autoComplete="username"
              />
            </label>

            <label className="carabbas-field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </label>

            {error ? <div className="carabbas-auth-error">{error}</div> : null}

            <button type="submit" className="carabbas-submit-btn">
              Se connecter
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}