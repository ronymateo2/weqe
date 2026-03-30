import { DashboardCorrelationChart, DashboardTrendChart } from "@/components/dashboard/dashboard-charts";
import { StatusBanner } from "@/components/ui/status-banner";
import type { DashboardDataResult } from "@/lib/actions/dashboard";
import type { TriggerType } from "@/types/domain";

type DashboardScreenProps = {
  dashboardData: DashboardDataResult;
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  climate: "Clima",
  humidifier: "Humidificador",
  stress: "Estres",
  screens: "Pantallas",
  tv: "TV",
  ergonomics: "Ergonomia",
  exercise: "Ejercicio",
  other: "Otro"
};

function formatAverage(value: number | null) {
  if (value === null) {
    return "--";
  }

  return value.toFixed(1);
}

export function DashboardScreen({ dashboardData }: DashboardScreenProps) {
  if (!dashboardData.ok) {
    return (
      <section className="space-y-6">
        <StatusBanner message={dashboardData.message} tone="error" />
      </section>
    );
  }

  const hasTrendData = dashboardData.trend.daysWithData > 0;
  const hasCorrelationChart = dashboardData.correlation.sampleSize >= dashboardData.correlation.minimumRequired;
  const hasTriggerStats = dashboardData.highPainTriggerStats.length > 0;

  return (
    <section className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label">Tendencia</p>
          <div className="rounded-[999px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--text-muted)] mono">
            7d {formatAverage(dashboardData.trend.average7d)} / 30d {formatAverage(dashboardData.trend.average30d)}
          </div>
        </div>
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          {hasTrendData ? (
            <DashboardTrendChart trendPoints={dashboardData.trend.points} />
          ) : (
            <div className="mb-4 h-[220px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))]" />
          )}
          <p className="text-[13px] text-[var(--text-muted)]">
            {hasTrendData
              ? `Datos en ${dashboardData.trend.daysWithData} dias dentro de la ventana de 30 dias.`
              : "Registra al menos 1 dia para activar la tendencia de dolor por zona."}
          </p>
        </div>
      </section>

      <section>
        <p className="section-label">Correlacion sueno ↔ dolor</p>
        <p className="mb-3 text-[15px] text-[var(--text-primary)]">{dashboardData.correlation.insight}</p>
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          {hasCorrelationChart ? (
            <DashboardCorrelationChart correlationPoints={dashboardData.correlation.points} />
          ) : (
            <div className="mb-4 h-[200px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))]" />
          )}
          <p className="mono text-[12px] text-[var(--text-muted)]">
            {dashboardData.correlation.spearman !== null
              ? `rho = ${dashboardData.correlation.spearman.toFixed(3)}`
              : "rho = --"}{" "}
            · n = {dashboardData.correlation.sampleSize} · minimo {dashboardData.correlation.minimumRequired}
          </p>
        </div>
      </section>

      <section>
        <p className="section-label">Triggers en dolor alto</p>
        {hasTriggerStats ? (
          <div className="space-y-3 text-[13px] text-[var(--text-muted)]">
            {dashboardData.highPainTriggerStats.map((item, index) => (
              <div
                key={item.triggerType}
                className={index < dashboardData.highPainTriggerStats.length - 1 ? "flex items-center justify-between border-b border-[var(--border)] pb-3" : "flex items-center justify-between"}
              >
                <span>{TRIGGER_LABELS[item.triggerType]}</span>
                <span className="mono">{item.days} dias</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            Aun no hay coincidencias de triggers en dias de dolor alto (general 7-10).
          </p>
        )}
      </section>
    </section>
  );
}
