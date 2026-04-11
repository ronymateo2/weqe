"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { saveObservationAction } from "@/lib/actions/observations";
import { queueObservation } from "@/lib/offline/observations-queue";
import { cn } from "@/lib/utils";
import type { ObservationEye, ActionState } from "@/types/domain";

const EYE_OPTIONS = [
  { label: "OD", value: "right" },
  { label: "OI", value: "left" },
  { label: "AO", value: "both" },
  { label: "Ninguno", value: "none" },
] as const satisfies readonly { label: string; value: ObservationEye }[];

const MAX_CHARS = 300;
const MAX_TITLE = 80;

type ObservationSheetProps = {
  onSaved: () => void;
};

export function ObservationSheet({ onSaved }: ObservationSheetProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [eye, setEye] = useState<ObservationEye>("none");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const canSave = title.trim().length > 0 && !isPending;
  const charsLeft = MAX_CHARS - notes.length;

  const handleSave = () => {
    const id = crypto.randomUUID();
    const input = { id, title: title.trim(), notes: notes.trim(), eye };

    startTransition(async () => {
      if (!navigator.onLine) {
        await queueObservation(input);
        setState({ status: "success", message: "Guardado localmente, se sincronizara cuando haya conexion." });
        onSaved();
        return;
      }

      const result = await saveObservationAction(input);

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
      <div className="space-y-5 pb-4">
        {state.status !== "idle" && state.message ? (
          <StatusBanner
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}

        <div className="space-y-2">
          <p className="section-label">Titulo</p>
          <input
            className={cn(
              "w-full rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3",
              "text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
              "h-[48px]"
            )}
            maxLength={MAX_TITLE}
            placeholder="Ej: Sensibilidad a gotas frias"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="section-label">Detalles (opcional)</p>
          <div className="relative">
            <textarea
              className={cn(
                "w-full resize-none rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3",
                "text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
                "min-h-[96px]"
              )}
              maxLength={MAX_CHARS}
              placeholder="Que observaste? Por ejemplo: mas sensibilidad a gotas frias..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span
              className={cn(
                "absolute bottom-3 right-4 text-[11px] tabular-nums",
                charsLeft < 30
                  ? "text-[var(--pain-high)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              {notes.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        <SegmentedControl
          label="Ojo afectado"
          options={EYE_OPTIONS}
          value={eye}
          onChange={setEye}
        />
      </div>

      <div
        className="sticky bottom-0 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
        style={{
          background:
            "linear-gradient(to top, rgba(18,16,8,1) 60%, rgba(18,16,8,0))",
        }}
      >
        <Button
          className="w-full"
          disabled={!canSave}
          type="button"
          onClick={handleSave}
        >
          {isPending ? "Guardando..." : "Guardar observacion"}
        </Button>
      </div>
    </>
  );
}
