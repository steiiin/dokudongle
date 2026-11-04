import { capitalizeBegin } from "../text";

/**
 * Schreibt nur das erste Zeichen des übergebenen Entwurfs groß.
 */
export function basicCap(draft: string): string {
  return capitalizeBegin(draft)
}