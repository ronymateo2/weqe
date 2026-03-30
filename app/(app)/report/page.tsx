import { ScreenHeader } from "@/components/layout/screen-header";
import { ReportScreen } from "@/components/report/report-screen";

export default function ReportPage() {
  return (
    <section>
      <ScreenHeader
        description="Preparamos un resumen claro para consulta medica y exportacion PDF."
        title="Reporte"
      />
      <ReportScreen />
    </section>
  );
}
