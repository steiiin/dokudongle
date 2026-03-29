import { capitalizeBegin } from "../text";

export const correctMedName = (draft: string): string => {
  let text = draft.trim();

  // Normalize to lowercase first
  text = text.toLowerCase();

  // Apply replacements (order matters: fkh before kh)
  const replacements: Array<[RegExp, string]> = [
    [/\bass\b/gi, "ASS"],
    [/\bmcp\b/gi, "MCP"],
    [/\bnitro\b/gi, "Nitro-Spray"],
  ]
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text
    .split(/\s+/)
    .map(w => capitalizeBegin(w, 2))
    .join(" ");
}