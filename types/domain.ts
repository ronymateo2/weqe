export type TimeOfDay = "morning" | "evening" | "other";
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
  overallPain: number;
  sleepHours: number | null;
  sleepQuality: number | null;
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

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
