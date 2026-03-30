export const APP_TABS = [
  { href: "/register", label: "Registrar" },
  { href: "/history", label: "Historial" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/report", label: "Reporte" }
] as const;

export const DROP_EYES = ["left", "right", "both"] as const;
export const TIME_OF_DAY_OPTIONS = [
  { label: "Manana", value: "morning" },
  { label: "Tarde", value: "evening" },
  { label: "Otro", value: "other" }
] as const;

export const TRIGGER_OPTIONS = [
  { id: "screens", label: "Pantallas", value: "screens" },
  { id: "tv", label: "TV", value: "tv" },
  { id: "stress", label: "Estres", value: "stress" },
  { id: "exercise", label: "Ejercicio", value: "exercise" },
  { id: "wind", label: "Viento", value: "climate" },
  { id: "ac", label: "AC", value: "climate" },
  { id: "humidifier", label: "Humidificador", value: "humidifier" },
  { id: "ergonomics", label: "Ergonomia", value: "ergonomics" },
  { id: "other", label: "Otro", value: "other" }
] as const;
