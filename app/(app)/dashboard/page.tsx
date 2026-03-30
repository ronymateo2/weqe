import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { ScreenHeader } from "@/components/layout/screen-header";

export default function DashboardPage() {
  return (
    <section>
      <ScreenHeader
        description="Las correlaciones importan mas que las entradas aisladas. Aqui veremos patrones de dolor, sueno y triggers."
        title="Dashboard"
      />
      <DashboardScreen />
    </section>
  );
}
