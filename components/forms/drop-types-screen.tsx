"use client";

import { useState, useTransition, useEffect } from "react";
import { get, set } from "idb-keyval";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { saveDropTypeAction } from "@/lib/actions/drops";
import { applyDropTypeOrder, DROP_TYPES_ORDER_KEY } from "@/lib/hooks/use-drop-types";
import type { ActionState, DropTypeRecord } from "@/types/domain";

const CACHE_KEY = "neuroeye_drop_types";

type DropTypesScreenProps = {
  initialDropTypes: DropTypeRecord[];
  initialErrorMessage?: string;
};

function DragHandle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="4" y="3" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="4" y="7" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="9" y="7" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="4" y="11" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="9" y="11" width="3" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}

function SortableItem({ dropType, isOnly }: { dropType: DropTypeRecord; isOnly: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dropType.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "flex min-h-12 items-center border-b border-[var(--border)] px-4 text-[15px] text-[var(--text-primary)] last:border-b-0",
        isDragging
          ? "bg-[var(--surface-el)] opacity-90 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex-1 py-3">{dropType.name}</span>
      {!isOnly && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${dropType.name}`}
          className="flex min-h-12 w-10 shrink-0 cursor-grab items-center justify-center text-[var(--text-faint)] active:cursor-grabbing"
        >
          <DragHandle />
        </button>
      )}
    </li>
  );
}

export function DropTypesScreen({ initialDropTypes, initialErrorMessage }: DropTypesScreenProps) {
  const [dropTypes, setDropTypes] = useState(initialDropTypes);
  const [dropName, setDropName] = useState("");
  const [state, setState] = useState<ActionState>(
    initialErrorMessage
      ? { status: "error", message: initialErrorMessage }
      : { status: "idle" }
  );
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Apply saved order on mount
  useEffect(() => {
    get<string[]>(DROP_TYPES_ORDER_KEY)
      .then((savedOrder) => {
        if (savedOrder?.length) {
          setDropTypes((prev) => applyDropTypeOrder(prev, savedOrder));
        }
      })
      .catch(() => {});
  }, []);

  const persistOrder = (items: DropTypeRecord[]) => {
    set(DROP_TYPES_ORDER_KEY, items.map((item) => item.id)).catch((err) => {
      console.warn("Failed to save drop type order", err);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDropTypes((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      persistOrder(next);
      return next;
    });
  };

  const saveDropType = () => {
    startTransition(async () => {
      const result = await saveDropTypeAction({ name: dropName });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message
      });

      if (!result.ok || !result.dropType) {
        return;
      }

      const savedDropType = result.dropType;

      // Preserve current order, append new items at end
      const nextDropTypes = (() => {
        const withoutCurrent = dropTypes.filter((item) => item.id !== savedDropType.id);
        return [...withoutCurrent, savedDropType];
      })();

      setDropTypes(nextDropTypes);
      setDropName("");

      try {
        await set(CACHE_KEY, nextDropTypes);
        persistOrder(nextDropTypes);
      } catch (err) {
        console.warn("Failed to update drop types cache", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      {state.status !== "idle" && state.message ? (
        <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
      ) : null}

      <section className="space-y-3">
        <p className="section-label">Nueva gota</p>
        <TextInput
          placeholder="Nombre de la gota (ej. systane ultra)"
          value={dropName}
          onChange={(event) => setDropName(event.target.value)}
        />
        <Button className="w-full" disabled={isPending || !dropName.trim()} type="button" onClick={saveDropType}>
          {isPending ? "Guardando..." : "Guardar tipo de gota"}
        </Button>
      </section>

      <section className="space-y-3">
        <p className="section-label">Gotas guardadas</p>
        {dropTypes.length === 0 ? (
          <StatusBanner message="Todavia no registras gotas frecuentes." tone="info" />
        ) : (
          <>
            {dropTypes.length > 1 && (
              <p className="text-[12px] text-[var(--text-muted)]">
                Mantén presionado el icono para reordenar — la primera aparece primero al registrar.
              </p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={dropTypes.map((dt) => dt.id)} strategy={verticalListSortingStrategy}>
                <ul className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
                  {dropTypes.map((dropType) => (
                    <SortableItem key={dropType.id} dropType={dropType} isOnly={dropTypes.length === 1} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        )}
      </section>

      <Link
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[999px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-el)]"
        href="/register"
      >
        Volver a Registrar
      </Link>
    </div>
  );
}
