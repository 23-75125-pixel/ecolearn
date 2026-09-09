import { clsx, type ClassValue } from "clsx";

/**
 * Thin wrapper around clsx. Deliberately not pulling in tailwind-merge on
 * top of it — this project doesn't yet have conflicting-utility class
 * collisions that would need it, and it's an easy dependency to add later
 * if that changes.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
