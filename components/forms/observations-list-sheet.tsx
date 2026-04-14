"use client";

import { useEffect, useState } from "react";
import { Plus, NotePencil } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getObservationTypesAction } from "@/lib/actions/observations";
import { painColor } from "@/lib/pain";
import { OBS_EYE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ObservationTypeWithLastOccurrence } from "@/lib/actions/observations";
import type { ObservationEye } from "@/types/domain";

type Props = {
  onSelectObservation: (obs: ObservationTypeWithLastOccurrence) => void;
  onCreateNew: () => void;
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function EyePill({ eye }: { eye: ObservationEye }) {
  if (eye === "none") return null;
  const label = OBS_EYE_LABELS[eye];
  return (
    <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
      {label}
    </span>
  );
}

function IntensityBadge({ intensity }: { intensity: number }) {
  return (
    <span
      className="mono text-[13px] font-medium tabular-nums"
      style={{ color: painColor(intensity) }}
    >
      {intensity}/10
    </span>
  );
}

function ObservationRow({
  obs,
  onTap,
}: {
  obs: ObservationTypeWithLastOccurrence;
  onTap: () => void;
}) {
  return (
    <button
      className={cn(
        "flex min-h-[64px] w-full items-center gap-3 rounded-[14px]",
        "border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3",
        "text-left active:opacity-80 transition-opacity"
      )}
      type="button"
      onClick={onTap}
    >
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-[var(--text-primary)]">
            {obs.title}
          </span>
          <EyePill eye={obs.eye} />
        </div>
        {obs.lastOccurrence ? (
          <span className="text-[12px] text-[var(--text-muted)]">
            {timeAgo(obs.lastOccurrence.loggedAt)}
          </span>
        ) : (
          <span className="text-[12px] text-[var(--text-muted)]">Sin registros</span>
        )}
      </div>
      {obs.lastOccurrence ? (
        <IntensityBadge intensity={obs.lastOccurrence.intensity} />
      ) : null}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex min-h-[64px] w-full items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ObservationsListSheet({ onSelectObservation, onCreateNew }: Props) {
  const [types, setTypes] = useState<ObservationTypeWithLastOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getObservationTypesAction().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTypes(result.types);
      } else {
        setError(result.message ?? "Error al cargar observaciones.");
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="space-y-3 pb-4">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : error ? (
          <p className="text-center text-[13px] text-[var(--pain-high)]">{error}</p>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <NotePencil size={32} className="text-[var(--text-muted)]" />
            <p className="text-[14px] text-[var(--text-muted)]">
              No tienes observaciones creadas.{"\n"}Crea una para comenzar a registrar ocurrencias.
            </p>
          </div>
        ) : (
          types.map((obs) => (
            <ObservationRow
              key={obs.id}
              obs={obs}
              onTap={() => onSelectObservation(obs)}
            />
          ))
        )}
      </div>

      <div
        className="sticky bottom-0 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
        style={{
          background: "linear-gradient(to top, rgba(18,16,8,1) 60%, rgba(18,16,8,0))",
        }}
      >
        <Button
          className="w-full gap-2"
          type="button"
          onClick={onCreateNew}
        >
          <Plus size={18} />
          Nueva observacion
        </Button>
      </div>
    </>
  );
}
