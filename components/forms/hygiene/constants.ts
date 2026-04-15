// ─── Types ────────────────────────────────────────────────────────────────────

export type View = "main" | "calibrating" | "victorias" | "servo";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FRICTION_LEVELS = [
  {
    val: 0,
    label: "FLUJO\nTOTAL",
    desc: "Hábito automático, sin resistencia.",
  },
  {
    val: 1,
    label: "MUY\nPOCA",
    desc: "Mínima fricción. El servo apenas trabajó.",
  },
  {
    val: 2,
    label: "MODERADA",
    desc: "Fricción moderada. El servo trabaja con normalidad.",
  },
  {
    val: 3,
    label: "NOTABLE",
    desc: "Resistencia notable. Señal de corrección significativa.",
  },
  {
    val: 4,
    label: "ALTA",
    desc: "Alta resistencia. Señal valiosa para el sistema.",
  },
  {
    val: 5,
    label: "MÁXIMA",
    desc: "Máxima corrección. El servo tiene material de trabajo.",
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function identityLabel(n: number): string {
  if (n === 0) return "Despertando";
  if (n <= 4) return "Activando";
  if (n <= 9) return "Constante";
  if (n <= 14) return "Disciplinado";
  if (n <= 19) return "Consolidado";
  return "Automatizado";
}
