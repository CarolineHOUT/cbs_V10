import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/tokens.css";
import { PatientIntakeProvider } from "./context/PatientIntakeContext";
import { PatientSimulationProvider } from "./context/PatientSimulationContext";
import { CrisisCenterProvider } from "./context/CrisisCenterContext";
import { AuthProvider } from "./auth/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PatientSimulationProvider>
          <PatientIntakeProvider>
            <CrisisCenterProvider>
              <App />
            </CrisisCenterProvider>
          </PatientIntakeProvider>
        </PatientSimulationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);