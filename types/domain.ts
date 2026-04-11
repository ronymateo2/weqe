export type TimeOfDay = "morning" | "evening" | "other" | "trigger";
export type SleepQuality = "muy_malo" | "malo" | "regular" | "bueno" | "excelente";
export type DropEye = "left" | "right" | "both";
export type TriggerType =
  | "climate"
  | "humidifier"
  | "stress"
  | "screens"
  | "tv"
  | "ergonomics"
  | "exercise"
  | "other";

export type CheckInRecord = {
  id: string;
  loggedAt: string;
  timeOfDay: TimeOfDay;
  eyelidPain: number;
  templePain: number;
  masseterPain: number;
  cervicalPain: number;
  orbitalPain: number;
  stressLevel: number;
  sleepHours: number | null;
  sleepQuality: SleepQuality | null;
  triggerType: TriggerType | null;
  notes: string | null;
};

export type DropTypeRecord = {
  id: string;
  name: string;
};

export type DropRecord = {
  id: string;
  loggedAt: string;
  quantity: number;
  eye: DropEye;
  notes: string | null;
  dropType: DropTypeRecord;
};

export type TriggerRecord = {
  id: string;
  loggedAt: string;
  triggerType: TriggerType;
  intensity: 1 | 2 | 3;
  notes: string | null;
};

export type SymptomType =
  | "ardor"
  | "sequedad"
  | "lagrimeo_paradojico"
  | "fotofobia"
  | "vision_borrosa"
  | "sensacion_arena"
  | "picazon"
  | "hinchazon"
  | "enrojecimiento"
  | "dolor_cabeza"
  | "otro";

export type SymptomRecord = {
  id: string;
  loggedAt: string;
  symptomType: string;
  notes: string | null;
};

export type MedicationRecord = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  sort_order: number | null;
};

export type SaveMedicationInput = {
  id?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
};

export type ObservationEye = "right" | "left" | "both" | "none";

export type SaveOccurrenceInput = {
  id: string;
  observationId: string;
  loggedAt: string;
  intensity: number;
  durationMinutes: number | null;
  notes: string;
};

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };
