import { BrowserRouter, Routes, Route } from "react-router-dom";
import UnifiedDemoWorkspace from "./components/UnifiedDemoWorkspace";
import Dashboard from "./Dashboard";
import PatientView from "./PatientView";
import CopiloteView from "./copilote/CopiloteView";
import AseLettreLiaisonView from "./ase/AseLettreLiaisonView";
import AsePreparationInstanceView from "./ase/AsePreparationInstanceView";
import CelluleCriseView from "./CelluleCriseView";
import { PatientSimulationProvider } from "./context/PatientSimulationContext";
import IncidentView from "./IncidentViewTemp";

function App() {
  return (
    <PatientSimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UnifiedDemoWorkspace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patient/:id" element={<PatientView />} />
          <Route path="/copilote/:id" element={<CopiloteView />} />
          <Route path="/crise" element={<CelluleCriseView />} />
          <Route path="/incident/:id" element={<IncidentView />} />

          {/* 🔥 AJOUT ASE */}
          <Route path="/ase/lettre-liaison" element={<AseLettreLiaisonView />} />
          <Route
            path="/ase/preparation-instance"
            element={<AsePreparationInstanceView />}
          />
        </Routes>
      </BrowserRouter>
    </PatientSimulationProvider>
  );
}

export default App;

