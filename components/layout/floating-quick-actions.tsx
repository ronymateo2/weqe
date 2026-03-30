"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Droplets, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "@/components/layout/mobile-sheet";
import { DropSheet } from "@/components/forms/drop-sheet";
import { TriggerSheet } from "@/components/forms/trigger-sheet";
import { cn } from "@/lib/utils";

export function FloatingQuickActions() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<"drop" | "trigger" | null>(null);

  const isVisible = useMemo(() => pathname === "/register" || pathname === "/history", [pathname]);
  const fabBottomOffsetClass =
    pathname === "/register"
      ? "bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+var(--sticky-cta-height)+16px)]"
      : "bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+24px)]";

  if (!isVisible) return null;

  const closeAll = () => {
    setSheet(null);
    setMenuOpen(false);
  };

  return (
    <>
      <div className={cn("fixed right-6 z-30", fabBottomOffsetClass)}>
        <div className="flex flex-col items-end gap-3">
          {menuOpen ? (
            <>
              <Button className="min-w-[132px] justify-start gap-2" variant="subtle" onClick={() => setSheet("drop")}>
                <Droplets size={18} />
                Gota
              </Button>
              <Button
                className="min-w-[132px] justify-start gap-2"
                variant="subtle"
                onClick={() => setSheet("trigger")}
              >
                <Zap size={18} />
                Trigger
              </Button>
            </>
          ) : null}
          <button
            aria-label="Acciones rapidas"
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-0 text-[#121008] shadow-[0_4px_20px_rgba(212,162,76,0.35)] transition-transform",
              menuOpen ? "rotate-45 bg-[var(--accent-bright)]" : "bg-[var(--accent)]"
            )}
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <MobileSheet
        description="Registra rapidamente una aplicacion sin salir del flujo actual."
        open={sheet === "drop"}
        title="Registrar gota"
        onClose={closeAll}
      >
        <DropSheet onSaved={closeAll} />
      </MobileSheet>

      <MobileSheet
        description="Captura desencadenantes ambientales o de actividad."
        open={sheet === "trigger"}
        title="Triggers"
        onClose={closeAll}
      >
        <TriggerSheet onSaved={closeAll} />
      </MobileSheet>
    </>
  );
}
