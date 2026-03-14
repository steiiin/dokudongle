import { capitalizeBegin } from "../text";

/**
 * Capitalises only the first character of the provided draft.
 */
export function basicCap(draft: string): string {
  return capitalizeBegin(draft)
}