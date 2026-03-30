import PatientIntakeForm from "../views/PatientIntakeForm";
import IntakeCategorySelector from "./IntakeCategorySelector";
import AppHeader from "./AppHeader";
import { AppShell, PageSection } from "./AppShell";

export default function UnifiedDemoWorkspace() {
  return (
    <AppShell header={<AppHeader subtitle="Recueil simulé" />}>
      <div className="intake-two-columns">
        <PageSection title="Identité et vigilance">
          <PatientIntakeForm />
        </PageSection>

        <PageSection title="Domaines et signaux">
          <IntakeCategorySelector />
        </PageSection>
      </div>
    </AppShell>
  );
}
