import { capitalizeBegin } from "../text";

export const correctAnatomy = (draft: string): string => {
  let text = draft.trim();

  // Normalize to lowercase first
  text = text.toLowerCase();

  // Apply replacements (order matters: fkh before kh)
  const replacements: Array<[RegExp, string]> = [
    [/\bli\b/gi, "li."],
    [/\bre\b/gi, "re."],
    [/\bbds\b/gi, "bds."],
  ]
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text
    .split(/\s+/)
    .map(w => capitalizeBegin(w, 2))
    .join(" ");
}