import { Droplets, Moon, Zap } from "lucide-react";
import { StatusBanner } from "@/components/ui/status-banner";

export function HistoryScreen() {
  return (
    <section className="space-y-8">
      <StatusBanner
        message="Aun no tienes registros. Ve a Registrar para empezar y cuando guardes veremos aqui check-ins, gotas y triggers agrupados por dia."
        tone="info"
      />

      <div className="space-y-6">
        <div>
          <p className="section-label">Hoy</p>
          <div className="space-y-3">
            <article className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Check-in rapido</span>
                <span className="mono text-[11px] text-[var(--text-muted)]">08:30</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px] text-[var(--text-muted)]">
                <span>Parpados 3</span>
                <span>Sienes 2</span>
                <span>Masetero 4</span>
                <span>General 4</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                <Moon size={14} />
                6.5h de sueno
              </div>
            </article>

            <article className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Droplets size={14} />
                Systane Ultra, 2 gotas, ambos ojos
              </div>
            </article>

            <article className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4 text-[13px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Zap size={14} />
                Pantallas 2, Estres 1
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
