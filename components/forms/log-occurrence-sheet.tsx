"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { saveOccurrenceAction } from "@/lib/actions/observations";
import { queueOccurrence } from "@/lib/offline/occurrences-queue";
import { painColor, painGradient } from "@/lib/pain";
import { cn } from "@/lib/utils";
import type { ObservationTypeWithLastOccurrence } from "@/lib/actions/observations";
import type { ActionState } from "@/types/domain";

const MAX_NOTES = 300;

type Props = {
  observation: ObservationTypeWithLastOccurrence;
  onSaved: () => void;
};

export function LogOccurrenceSheet({ observation, onSaved }: Props) {
  const [intensity, setIntensity] = useState(5);
  const [durationRaw, setDurationRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const durationMinutes = durationRaw === "" ? null : Math.max(1, Math.min(1440, parseInt(durationRaw, 10) || 0));
  const charsLeft = MAX_NOTES - notes.length;

  const handleSave = () => {
    const id = crypto.randomUUID();
    const loggedAt = new Date().toISOString();
    const input = {
      id,
      observationId: observation.id,
      loggedAt,
      intensity,
      durationMinutes,
      notes: notes.trim(),
    };

    startTransition(async () => {
      if (!navigator.onLine) {
        await queueOccurrence(input);
        setState({ status: "success", message: "Guardado localmente, se sincronizara cuando haya conexion." });
        onSaved();
        return;
      }

      const result = await saveOccurrenceAction(input);

      if (!result.ok) {
        setState({ status: "error", message: result.message });
        return;
      }

      setState({ status: "success", message: result.message });
      onSaved();
    });
  };

  return (
    <>
      <div className="space-y-6 pb-4">
        {state.status !== "idle" && state.message ? (
          <StatusBanner
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}

        {/* Observation name */}
        <p className="text-[13px] text-[var(--text-muted)]">{observation.title}</p>

        {/* Intensity */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <p className="section-label">Nivel de intensidad</p>
            <span
              className="mono text-[32px] font-light leading-none"
              style={{ color: painColor(intensity) }}
            >
              {intensity}
              <span className="text-[16px] text-[var(--text-muted)]">/10</span>
            </span>
          </div>
          <input
            aria-label="Intensidad"
            aria-valuemax={10}
            aria-valuemin={1}
            aria-valuenow={intensity}
            className="pain-range"
            max={10}
            min={1}
            style={{
              "--track-bg": painGradient(intensity),
              "--thumb-color": painColor(intensity),
            } as React.CSSProperties}
            type="range"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
          <div className="flex justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Leve</span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Moderado</span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Severo</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <p className="section-label">
            Duracion{" "}
            <span className="normal-case text-[11px] font-normal text-[var(--text-muted)]">(opcional)</span>
          </p>
          <div className="flex items-center gap-3">
            <input
              className={cn(
                "w-24 rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3",
                "mono text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
                "h-[48px] text-center"
              )}
              inputMode="numeric"
              max={1440}
              min={1}
              placeholder="—"
              type="number"
              value={durationRaw}
              onChange={(e) => setDurationRaw(e.target.value)}
            />
            <span className="text-[14px] text-[var(--text-muted)]">minutos</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="section-label">
            Notas{" "}
            <span className="normal-case text-[11px] font-normal text-[var(--text-muted)]">(opcional)</span>
          </p>
          <div className="relative">
            <textarea
              className={cn(
                "w-full resize-none rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3",
                "text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
                "min-h-[80px]"
              )}
              maxLength={MAX_NOTES}
              placeholder="Ej: Paso justo despues de poner las gotas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span
              className={cn(
                "absolute bottom-3 right-4 text-[11px] tabular-nums",
                charsLeft < 30 ? "text-[var(--pain-high)]" : "text-[var(--text-muted)]"
              )}
            >
              {notes.length}/{MAX_NOTES}
            </span>
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
        style={{
          background: "linear-gradient(to top, rgba(18,16,8,1) 60%, rgba(18,16,8,0))",
        }}
      >
        <Button
          className="w-full"
          disabled={isPending}
          type="button"
          onClick={handleSave}
        >
          {isPending ? "Guardando..." : "Confirmar registro"}
        </Button>
      </div>
    </>
  );
}
