import { useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { AppShell } from "../components/AppShell";
import CopiloteLayout from "./CopiloteLayout";

export default function CopiloteView() {
const { id } = useParams();

return (
<AppShell header={<AppHeader subtitle="Pilotage des parcours patient" />}>
<CopiloteLayout patientId={id} />
</AppShell>
);
}
