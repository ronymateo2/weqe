import { ScreenHeader } from "@/components/layout/screen-header";
import { HistoryScreen } from "@/components/history/history-screen";

export default function HistoryPage() {
  return (
    <section>
      <ScreenHeader
        description="El historial agrupa check-ins, gotas y triggers por dia para revisar contexto clinico rapido."
        title="Historial"
      />
      <HistoryScreen />
    </section>
  );
}
