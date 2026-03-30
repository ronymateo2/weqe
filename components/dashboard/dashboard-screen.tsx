export function DashboardScreen() {
  return (
    <section className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label">Tendencia</p>
          <div className="rounded-[999px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
            7d / 30d
          </div>
        </div>
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          <div className="mb-4 h-[220px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))]" />
          <p className="text-[13px] text-[var(--text-muted)]">
            Registra al menos 7 dias para ver la tendencia de dolor por zona.
          </p>
        </div>
      </section>

      <section>
        <p className="section-label">Correlacion sueno ↔ dolor</p>
        <p className="mb-3 text-[15px] text-[var(--text-primary)]">
          Cuando duermes menos de 6 horas, el dolor de masetero tiende a ser mayor.
        </p>
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          <div className="mb-4 h-[200px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))]" />
          <p className="mono text-[12px] text-[var(--text-muted)]">r = -0.65 · requiere 14 registros matutinos</p>
        </div>
      </section>

      <section>
        <p className="section-label">Triggers en dolor alto</p>
        <div className="space-y-3 text-[13px] text-[var(--text-muted)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span>Pantallas</span>
            <span className="mono">8 dias</span>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span>Estres</span>
            <span className="mono">5 dias</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Humidificador</span>
            <span className="mono">3 dias</span>
          </div>
        </div>
      </section>
    </section>
  );
}
