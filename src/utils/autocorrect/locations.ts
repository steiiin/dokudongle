import { capitalizeBegin } from "../text"

export const correctHospital = (draft: string): string => {
  let text = draft.trim();

  // Normalize to lowercase first
  text = text.toLowerCase();

  // Apply replacements (order matters: fkh before kh)
  const replacements: Array<[RegExp, string]> = [
    [/\bfkh\b/gi, "FKH"],
    [/\bkh\b/gi, "KH"],
    [/\buni\b/gi, "Uniklinik"],
    [/\bdd\b/gi, "Dresden"],
    [/\bmei\b/gi, "Meißen"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text
    .split(/\s+/)
    .map(capitalizeBegin)
    .join(" ");
}