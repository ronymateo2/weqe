"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DropIcon,
  PlusIcon,
  NotePencilIcon,
  MoonIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "@/components/layout/mobile-sheet";
import { DropSheet } from "@/components/forms/drop-sheet";
import { SleepSheet } from "@/components/forms/sleep-sheet";
import { ObservationSheet } from "@/components/forms/observation-sheet";
import { ObservationsListSheet } from "@/components/forms/observations-list-sheet";
import { LogOccurrenceSheet } from "@/components/forms/log-occurrence-sheet";
import { HygieneSheet } from "@/components/forms/hygiene-sheet";
import { cn } from "@/lib/utils";
import type { ObservationTypeWithLastOccurrence } from "@/lib/actions/observations";

type Sheet =
  | "drop"
  | "sleep"
  | "obs_list"
  | "obs_log"
  | "obs_new"
  | "hygiene"
  | null;

export function FloatingQuickActions() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedObservation, setSelectedObservation] =
    useState<ObservationTypeWithLastOccurrence | null>(null);

  const isVisible = useMemo(
    () => pathname === "/register" || pathname === "/history",
    [pathname],
  );
  const fabBottomOffsetClass =
    pathname === "/register"
      ? "bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+var(--sticky-cta-height)+16px)]"
      : "bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+24px)]";

  if (!isVisible) return null;

  const closeAll = () => {
    setSheet(null);
    setMenuOpen(false);
    setSelectedObservation(null);
  };

  const savedAndClose = () => {
    window.dispatchEvent(new CustomEvent("history:refresh"));
    closeAll();
  };

  const handleSelectObservation = (obs: ObservationTypeWithLastOccurrence) => {
    setSelectedObservation(obs);
    setSheet("obs_log");
  };

  return (
    <>
      <div className={cn("fixed right-6 z-30", fabBottomOffsetClass)}>
        <div className="flex flex-col items-end gap-3">
          {menuOpen ? (
            <>
              <Button
                className="min-w-[132px] justify-start gap-2"
                variant="subtle"
                onClick={() => setSheet("drop")}
              >
                <DropIcon size={18} />
                Gota
              </Button>
              <Button
                className="min-w-[132px] justify-start gap-2"
                variant="subtle"
                onClick={() => setSheet("sleep")}
              >
                <MoonIcon size={18} />
                Sueno
              </Button>
              <Button
                className="min-w-[132px] justify-start gap-2"
                variant="subtle"
                onClick={() => setSheet("hygiene")}
              >
                <EyeIcon size={18} />
                Higiene
              </Button>
              <Button
                className="min-w-[132px] justify-start gap-2"
                variant="subtle"
                onClick={() => setSheet("obs_list")}
              >
                <NotePencilIcon size={18} />
                Observacion
              </Button>
            </>
          ) : null}
          <button
            aria-label="Acciones rapidas"
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-0 text-[#121008] shadow-[0_4px_20px_rgba(212,162,76,0.35)] transition-transform",
              menuOpen
                ? "rotate-45 bg-[var(--accent-bright)]"
                : "bg-[var(--accent)]",
            )}
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <PlusIcon size={24} />
          </button>
        </div>
      </div>

      <MobileSheet
        description="Registra o actualiza tu sueno de hoy."
        open={sheet === "sleep"}
        title="Sueno de hoy"
        onClose={closeAll}
      >
        <SleepSheet onSaved={savedAndClose} />
      </MobileSheet>

      <MobileSheet
        description="Registra rapidamente una aplicacion sin salir del flujo actual."
        open={sheet === "drop"}
        title="Registrar gota"
        onClose={closeAll}
      >
        <DropSheet onSaved={savedAndClose} />
      </MobileSheet>

      <MobileSheet
        description="Registra tu sesion de higiene palpebral."
        open={sheet === "hygiene"}
        panelClassName="!h-[95svh]"
        title="Higiene Palpebral"
        onClose={closeAll}
      >
        <HygieneSheet onSaved={savedAndClose} />
      </MobileSheet>

      {/* Observation flow: list → log occurrence or create new */}
      <MobileSheet
        description="Selecciona una observacion para registrar una ocurrencia."
        open={sheet === "obs_list"}
        title="Observaciones"
        onClose={closeAll}
      >
        <ObservationsListSheet
          onSelectObservation={handleSelectObservation}
          onCreateNew={() => setSheet("obs_new")}
        />
      </MobileSheet>

      <MobileSheet
        description="Registra cuando ocurre esta observacion."
        open={sheet === "obs_log"}
        title="Registrar ocurrencia"
        onClose={closeAll}
        onBack={() => setSheet("obs_list")}
      >
        {selectedObservation ? (
          <LogOccurrenceSheet
            observation={selectedObservation}
            onSaved={savedAndClose}
          />
        ) : null}
      </MobileSheet>

      <MobileSheet
        description="Registra algo que notaste que aun no es un trigger."
        open={sheet === "obs_new"}
        title="Nueva observacion"
        onClose={closeAll}
      >
        <ObservationSheet
          onSaved={(obs) => {
            setSelectedObservation(obs);
            setSheet("obs_log");
          }}
        />
      </MobileSheet>
    </>
  );
}
