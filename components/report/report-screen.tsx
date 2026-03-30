import { Button } from "@/components/ui/button";

export function ReportScreen() {
  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">Resumen del periodo</p>
        <div className="space-y-6 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-5">
          <div>
            <p className="screen-title text-[17px]">45 registros</p>
            <p className="screen-subtitle text-[13px]">1 mar — 29 mar 2026</p>
          </div>

          <div>
            <p className="section-label">Dolor promedio</p>
            <p className="mono text-[36px] font-light">4.2 / 10</p>
          </div>

          <div>
            <p className="section-label">Sueno promedio</p>
            <p className="text-[15px] text-[var(--text-primary)]">6.1h · calidad 5.8 / 10</p>
          </div>

          <div>
            <p className="section-label">Correlacion sueno ↔ dolor</p>
            <p className="mono text-[22px] font-light">r = -0.61</p>
            <p className="screen-subtitle text-[13px]">Moderada. Se destacara en la portada del PDF.</p>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled type="button">
        Necesitas al menos 14 dias de datos
      </Button>
    </section>
  );
}
