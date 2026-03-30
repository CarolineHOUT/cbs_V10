import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import { PatientIntakeProvider } from "./context/PatientIntakeContext";
import { PatientSimulationProvider } from "./context/PatientSimulationContext";
import { CrisisCenterProvider } from "./context/CrisisCenterContext";

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
<PatientSimulationProvider>
<PatientIntakeProvider>
<CrisisCenterProvider>
<App />
</CrisisCenterProvider>
</PatientIntakeProvider>
</PatientSimulationProvider>
</React.StrictMode>
);