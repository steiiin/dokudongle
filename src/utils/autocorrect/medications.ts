import { capitalizeBegin } from "../text";

export const correctMedName = (draft: string): string => {
  let text = draft.trim();

  // Normalize to lowercase first
  text = text.toLowerCase();

  const replacements: Array<[RegExp, string]> = [
    [/\bass(\d+)?\b/gi, "ASS$1"],
    [/\bmcp(\d+)?\b/gi, "MCP$1"],
    [/\bnitro\b/gi, "Nitro-Spray"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text
    .split(/\s+/)
    .map(w => capitalizeBegin(w, 2))
    .join(" ");
};