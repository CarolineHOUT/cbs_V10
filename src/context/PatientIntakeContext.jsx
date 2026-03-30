import { createContext, useContext, useMemo, useState } from "react";

const PatientIntakeContext = createContext(null);

const initialPatient = {
  identity: {
    lastName: "",
    firstName: "",
    birthDate: "",
    age: "",
    ins: "",
    iep: "",
    service: "",
    room: "",
    bed: "",
  },
  stay: {},
  socialContext: {},
  territory: {
    city: "",
  },
  scenario: {
    type: "",
    specificData: {},
  },
  intakeSelections: {}, // 🔥 AJOUT IMPORTANT
};

export function PatientIntakeProvider({ children }) {
  const [patientIntake, setPatientIntake] = useState(initialPatient);

  const updateField = (section, field, value) => {
    setPatientIntake((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const loadDemoPatient = () => {
    setPatientIntake({
      ...initialPatient,
      identity: {
        lastName: "MARTIN",
        firstName: "Jeanne",
        birthDate: "1942-09-14",
        age: 81,
        service: "Médecine",
        room: "214",
        bed: "B",
      },
      territory: {
        city: "Cherbourg-en-Cotentin",
      },
    });
  };

  // 🔥 LOGIQUE DE SÉLECTION
  const toggleKeyword = (domain, category, keyword) => {
    setPatientIntake((prev) => {
      const current = prev.intakeSelections || {};
      const domainData = current[domain] || {};
      const categoryData = domainData[category] || [];

      const exists = categoryData.includes(keyword);

      const updatedCategory = exists
        ? categoryData.filter((k) => k !== keyword)
        : [...categoryData, keyword];

      return {
        ...prev,
        intakeSelections: {
          ...current,
          [domain]: {
            ...domainData,
            [category]: updatedCategory,
          },
        },
      };
    });
  };

  const value = useMemo(
    () => ({
      patientIntake,
      updateField,
      loadDemoPatient,
      toggleKeyword, // 🔥 exposé ici
    }),
    [patientIntake]
  );

  return (
    <PatientIntakeContext.Provider value={value}>
      {children}
    </PatientIntakeContext.Provider>
  );
}

export function usePatientIntake() {
  const context = useContext(PatientIntakeContext);
  if (!context) {
    throw new Error("usePatientIntake must be used inside provider");
  }
  return context;
}