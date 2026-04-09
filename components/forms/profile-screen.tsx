"use client";

import { useMemo, useState, useTransition } from "react";
import {
  TrashIcon,
  DotsSixVerticalIcon,
  PlusIcon,
  ClockIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "@/components/layout/mobile-sheet";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import {
  saveMedicationAction,
  deleteMedicationAction,
  reorderMedicationsAction,
} from "@/lib/actions/medications";
import { updateTimezoneAction } from "@/lib/actions/user-settings";
import type { ActionState, MedicationRecord } from "@/types/domain";

type ProfileScreenProps = {
  user: { name: string | null; email: string | null };
  initialMedications: MedicationRecord[];
  initialErrorMessage?: string;
  initialTimezone: string;
};

type FormState = {
  name: string;
  dosage: string;
  frequency: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  dosage: "",
  frequency: "",
  notes: "",
};

// ─── Sortable medication row ─────────────────────────────────────────────────

type MedRowProps = {
  med: MedicationRecord;
  isOnly: boolean;
  confirmingDelete: boolean;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
};

function SortableMedRow({
  med,
  isOnly,
  confirmingDelete,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: MedRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: med.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  const detail = [med.dosage, med.frequency].filter(Boolean).join(" · ");

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "border-b border-[var(--border)] px-4 last:border-b-0",
        isDragging
          ? "bg-[var(--surface-el)] opacity-90 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "bg-transparent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {confirmingDelete ? (
        <div className="flex min-h-12 items-center gap-3 py-2">
          <span className="flex-1 text-[13px] text-[var(--text-muted)]">
            ¿Eliminar este medicamento?
          </span>
          <button
            type="button"
            onClick={onDeleteConfirm}
            className="min-h-[36px] rounded-[8px] bg-[var(--error)] px-3 text-[12px] font-medium text-white"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={onDeleteCancel}
            className="min-h-[36px] rounded-[8px] border border-[var(--border)] px-3 text-[12px] font-medium text-[var(--text-muted)]"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex min-h-12 items-start gap-2 py-3">
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <span className="text-[15px] text-[var(--text-primary)] leading-tight">
              {med.name}
            </span>
            {detail ? (
              <span className="mono text-[11px] text-[var(--text-muted)] leading-tight">
                {detail}
              </span>
            ) : null}
            {med.notes ? (
              <span className="text-[12px] text-[var(--text-faint)] leading-tight mt-0.5">
                {med.notes}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onDeleteRequest}
              aria-label={`Eliminar ${med.name}`}
              className="flex min-h-12 w-10 items-center justify-center text-[var(--text-faint)] hover:text-[var(--error)] transition-colors"
            >
              <TrashIcon size={16} />
            </button>
            {!isOnly && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label={`Reordenar ${med.name}`}
                className="flex min-h-12 w-10 cursor-grab items-center justify-center text-[var(--text-faint)] active:cursor-grabbing"
              >
                <DotsSixVerticalIcon size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ProfileScreen({
  user,
  initialMedications,
  initialErrorMessage,
  initialTimezone,
}: ProfileScreenProps) {
  // ── Medications state ──
  const [medications, setMedications] = useState(initialMedications);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [state, setState] = useState<ActionState>(
    initialErrorMessage
      ? { status: "error", message: initialErrorMessage }
      : { status: "idle" },
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Timezone state ──
  const [timezone, setTimezone] = useState(initialTimezone);
  const [tzSheetOpen, setTzSheetOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState("");
  const [tzPending, startTzTransition] = useTransition();

  const allTimezones = useMemo<string[]>(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [];
    }
  }, []);

  const filteredTimezones = useMemo(() => {
    if (!tzSearch.trim()) return allTimezones;
    const q = tzSearch.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [allTimezones, tzSearch]);

  const handleTimezoneSelect = (tz: string) => {
    startTzTransition(async () => {
      const result = await updateTimezoneAction(tz);
      if (result.ok) {
        setTimezone(tz);
        setTzSheetOpen(false);
        setTzSearch("");
      }
    });
  };

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const persistOrder = (items: MedicationRecord[]) => {
    reorderMedicationsAction({ ids: items.map((m) => m.id) }).catch(() => {});
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = medications.findIndex((m) => m.id === active.id);
    const newIndex = medications.findIndex((m) => m.id === over.id);
    const next = arrayMove(medications, oldIndex, newIndex);
    setMedications(next);
    persistOrder(next);
  };

  const openSheet = () => {
    setForm(EMPTY_FORM);
    setState({ status: "idle" });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleAdd = () => {
    startTransition(async () => {
      const result = await saveMedicationAction({
        name: form.name,
        dosage: form.dosage || undefined,
        frequency: form.frequency || undefined,
        notes: form.notes || undefined,
      });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message,
      });

      if (!result.ok || !result.medication) return;

      setMedications((prev) => [...prev, result.medication!]);
      setSheetOpen(false);
      setForm(EMPTY_FORM);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteMedicationAction(id);
      setState({
        status: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) {
        setMedications((prev) => prev.filter((m) => m.id !== id));
        setDeletingId(null);
      }
    });
  };

  return (
    <>
      <div className="space-y-8">
        {state.status !== "idle" && state.message && !sheetOpen ? (
          <StatusBanner
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}

        {/* ── Información ── */}
        <section className="space-y-3">
          <p className="section-label">Información</p>
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
            {user.name ? (
              <div className="flex min-h-12 items-center border-b border-[var(--border)] px-4">
                <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-faint)]">
                  Nombre
                </span>
                <span className="text-[15px] text-[var(--text-primary)]">
                  {user.name}
                </span>
              </div>
            ) : null}
            {user.email ? (
              <div className="flex min-h-12 items-center px-4">
                <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-faint)]">
                  Email
                </span>
                <span className="mono truncate text-[13px] text-[var(--text-muted)]">
                  {user.email}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Configuración ── */}
        <section className="space-y-3">
          <p className="section-label">Configuración</p>
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
            <div className="flex min-h-[72px] items-center gap-3 px-4">
              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent-dim)]">
                <ClockIcon size={16} color="var(--accent)" weight="fill" />
              </div>
              {/* Label + value */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-faint)]">
                  Zona Horaria
                </span>
                <span className="mono truncate text-[14px] text-[var(--text-primary)]">
                  {timezone}
                </span>
              </div>
              {/* Edit button */}
              <button
                type="button"
                onClick={() => {
                  setTzSearch("");
                  setTzSheetOpen(true);
                }}
                aria-label="Cambiar zona horaria"
                disabled={tzPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-el)] text-[var(--text-faint)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
              >
                <PencilSimpleIcon size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Medicamentos ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-label mb-0">Medicamentos</p>
            <button
              type="button"
              onClick={openSheet}
              aria-label="Agregar medicamento"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-el)] text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-dim)]"
            >
              <PlusIcon size={12} weight="bold" />
            </button>
          </div>

          {medications.length === 0 ? (
            <button
              type="button"
              onClick={openSheet}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] text-[13px] text-[var(--text-faint)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <PlusIcon size={14} weight="bold" />
              Agregar primer medicamento
            </button>
          ) : (
            <>
              {medications.length > 1 && (
                <p className="text-[12px] text-[var(--text-muted)]">
                  Mantén presionado para reordenar.
                </p>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={medications.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
                    {medications.map((med) => (
                      <SortableMedRow
                        key={med.id}
                        med={med}
                        isOnly={medications.length === 1}
                        confirmingDelete={deletingId === med.id}
                        onDeleteRequest={() => setDeletingId(med.id)}
                        onDeleteCancel={() => setDeletingId(null)}
                        onDeleteConfirm={() => handleDelete(med.id)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </>
          )}
        </section>
      </div>

      {/* ── Add medication sheet ── */}
      <MobileSheet
        open={sheetOpen}
        title="Nuevo medicamento"
        description="Guarda un medicamento en tu perfil."
        onClose={closeSheet}
      >
        <div className="space-y-3">
          {state.status === "error" && state.message ? (
            <StatusBanner message={state.message} tone="error" />
          ) : null}
          <TextInput
            placeholder="Nombre (ej. Ciclosporina 0.1%)"
            value={form.name}
            autoFocus
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextInput
            placeholder="Dosis (ej. 1 gota)"
            value={form.dosage}
            onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
          />
          <TextInput
            placeholder="Frecuencia (ej. 2 veces al día)"
            value={form.frequency}
            onChange={(e) =>
              setForm((f) => ({ ...f, frequency: e.target.value }))
            }
          />
          <TextInput
            placeholder="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <Button
            className="w-full"
            disabled={isPending || !form.name.trim()}
            type="button"
            onClick={handleAdd}
          >
            {isPending ? "Guardando..." : "Agregar medicamento"}
          </Button>
        </div>
      </MobileSheet>

      {/* ── Timezone picker sheet ── */}
      <MobileSheet
        open={tzSheetOpen}
        title="Zona horaria"
        description="Selecciona tu zona horaria local."
        onClose={() => {
          setTzSheetOpen(false);
          setTzSearch("");
        }}
      >
        <div className="flex flex-col gap-3">
          <TextInput
            placeholder="Buscar (ej. Bogota, Mexico_City…)"
            value={tzSearch}
            autoFocus
            onChange={(e) => setTzSearch(e.target.value)}
          />
          <ul className="max-h-[45vh] overflow-y-auto rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
            {filteredTimezones.length === 0 ? (
              <li className="flex min-h-12 items-center px-4 text-[13px] text-[var(--text-faint)]">
                Sin resultados
              </li>
            ) : (
              filteredTimezones.map((tz) => {
                const isActive = tz === timezone;
                return (
                  <li
                    key={tz}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <button
                      type="button"
                      disabled={tzPending}
                      onClick={() => handleTimezoneSelect(tz)}
                      className="flex min-h-12 w-full items-center px-4 text-left transition-colors disabled:opacity-40"
                      style={{
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-primary)",
                      }}
                    >
                      <span
                        className={`mono text-[13px] ${isActive ? "font-medium" : ""}`}
                      >
                        {tz}
                      </span>
                      {isActive && (
                        <span className="ml-auto text-[11px] font-medium text-[var(--accent)]">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </MobileSheet>
    </>
  );
}
