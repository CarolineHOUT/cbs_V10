import { createContext, useContext, useState } from "react";

const CrisisCenterContext = createContext();

export function CrisisCenterProvider({ children }) {
const [crisisOpen, setCrisisOpen] = useState(false);
const [workflowOpen, setWorkflowOpen] = useState(false);
const [contextData, setContextData] = useState(null);

const openCrisisCell = (data) => {
setContextData(data);
setCrisisOpen(true);
};

const closeCrisisCell = () => {
setCrisisOpen(false);
setContextData(null);
};

const openCriticalWorkflow = (data) => {
setContextData(data);
setWorkflowOpen(true);
};

const closeWorkflow = () => {
setWorkflowOpen(false);
setContextData(null);
};

return (
<CrisisCenterContext.Provider
value={{
crisisOpen,
workflowOpen,
contextData,
openCrisisCell,
closeCrisisCell,
openCriticalWorkflow,
closeWorkflow,
}}
>
{children}
</CrisisCenterContext.Provider>
);
}

export function useCrisisCenter() {
return useContext(CrisisCenterContext);
}
