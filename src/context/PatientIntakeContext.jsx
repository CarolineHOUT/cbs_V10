import { createContext, useContext, useMemo, useState } from "react";
import { emptyStructuredIntake } from "./PatientSimulationContext";

const PatientIntakeContext = createContext(null);

const initialPatient = {
  identity: {
    lastName: "",
    firstName: "",
    birthDate: "",
    age: "",
    sexe: "U",
    ins: "",
    iep: "",
    service: "",
    room: "",
    bed: "",
    personneConfiance: "",
    personneAPrevenir: "",
    mesureProtection: "",
    vigilance: "",
  },
  stay: {},
  socialContext: {},
  territory: {
    city: "",
    postalCode: "",
    street: "",
    housingType: "",
    mainNeed: "",
  },
  scenario: {
    type: "",
    specificData: {},
  },
  intakeSelections: {},
  structuredIntake: emptyStructuredIntake,
};

function setDeepValue(obj, path, value) {
  const keys = Array.isArray(path) ? path : String(path).split(".");
  const clone = { ...obj };
  let cursor = clone;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    cursor[key] = {
      ...(cursor[key] || {}),
    };
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return clone;
}

export function PatientIntakeProvider({ children }) {
  const [patientIntake, setPatientIntake] = useState(initialPatient);

  const updateField = (section, field, value) => {
    setPatientIntake((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const updateStructuredIntake = (path, value) => {
    setPatientIntake((prev) => ({
      ...prev,
      structuredIntake: setDeepValue(
        prev.structuredIntake || emptyStructuredIntake,
        path,
        value
      ),
    }));
  };

  const loadDemoPatient = () => {
    setPatientIntake({
      ...initialPatient,
      identity: {
        ...initialPatient.identity,
        lastName: "MARTIN",
        firstName: "Jeanne",
        birthDate: "1942-09-14",
        age: 81,
        sexe: "F",
        service: "Médecine",
        room: "214",
        bed: "B",
      },
      territory: {
        ...initialPatient.territory,
        city: "Cherbourg-en-Cotentin",
      },
    });
  };

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

  const resetPatientIntake = () => {
    setPatientIntake(initialPatient);
  };

  const value = useMemo(
    () => ({
      patientIntake,
      updateField,
      updateStructuredIntake,
      loadDemoPatient,
      toggleKeyword,
      resetPatientIntake,
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