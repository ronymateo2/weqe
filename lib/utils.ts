import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function hasEnvValue(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}
