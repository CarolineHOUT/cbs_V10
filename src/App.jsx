import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginView from "./views/LoginView";
import Dashboard from "./Dashboard";
import PatientView from "./PatientView";
import CopiloteView from "./copilote/CopiloteView";
import UnifiedDemoWorkspace from "./components/UnifiedDemoWorkspace";
import CelluleCriseView from "./CelluleCriseView";
import IncidentView from "./IncidentViewTemp";
import "./app.css";

function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginView onLogin={handleLogin} />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth user={user}>
            <Dashboard user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/patient/:id"
        element={
          <RequireAuth user={user}>
            <PatientView user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/copilote/:id"
        element={
          <RequireAuth user={user}>
            <CopiloteView user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/crise"
        element={
          <RequireAuth user={user}>
            <CelluleCriseView user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/incident/:id"
        element={
          <RequireAuth user={user}>
            <IncidentView user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />

      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}