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

export const SLEEP_QUALITY_OPTIONS = [
  { label: "Muy malo", value: "muy_malo" },
  { label: "Malo", value: "malo" },
  { label: "Regular", value: "regular" },
  { label: "Bueno", value: "bueno" },
  { label: "Excelente", value: "excelente" }
] as const;

export const SYMPTOM_OPTIONS = [
  { id: "ardor", label: "Ardor", value: "ardor" },
  { id: "sequedad", label: "Sequedad", value: "sequedad" },
  { id: "lagrimeo_paradojico", label: "Lagrimeo paradojico", value: "lagrimeo_paradojico" },
  { id: "fotofobia", label: "Fotofobia", value: "fotofobia" },
  { id: "vision_borrosa", label: "Vision borrosa", value: "vision_borrosa" },
  { id: "sensacion_arena", label: "Sensacion de arena", value: "sensacion_arena" },
  { id: "picazon", label: "Picazon", value: "picazon" },
  { id: "hinchazon", label: "Hinchazon", value: "hinchazon" },
  { id: "enrojecimiento", label: "Enrojecimiento", value: "enrojecimiento" },
  { id: "dolor_cabeza", label: "Dolor de cabeza", value: "dolor_cabeza" }
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
