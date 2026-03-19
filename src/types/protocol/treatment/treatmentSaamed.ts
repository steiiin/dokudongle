import { capitalizeBegin } from "@/utils/text";
import { SAA_MEDICATION_INDICATION, SAA_MEDICATION, ConsentMedTask } from "@/data/meds"

export class TreatmentSaamed {

  public medTasks: Array<ConsentMedTask>

  constructor() {
    this.medTasks = []
  }

  private getMedName(medId: string): string {
    return SAA_MEDICATION[medId]?.Name ?? capitalizeBegin(medId)
  }
  private getIndicationName(indicationid: string): string {
    return SAA_MEDICATION_INDICATION[indicationid]?.Name ?? capitalizeBegin(indicationid)
  }

  public getBlock(): string {

    const tasks = this.medTasks
    if (!tasks || tasks.length === 0) return "";

    // 1) Indication order in first-occurrence order
    const indicationOrder: string[] = [];
    const seenIndications = new Set<string>();
    for (const t of tasks) {
      if (!seenIndications.has(t.MedIndication)) {
        seenIndications.add(t.MedIndication);
        indicationOrder.push(t.MedIndication);
      }
    }

    // 2) Count meds across all tasks (for "(Indikation)" suffix on dose items)
    const medCounts = new Map<string, number>();
    for (const t of tasks) {
      medCounts.set(t.MedId, (medCounts.get(t.MedId) ?? 0) + 1);
    }

    // 3) Build SAA header lines
    const saaLines: string[] = [];

    for (const indId of indicationOrder) {
      const group = tasks.filter(t => t.MedIndication === indId);

      // 3a) Cave lines: each task with contraText gets its own SAA line
      const caveTasks = group.filter(t => capitalizeBegin(t.contraText).length > 0);
      for (const t of caveTasks) {
        saaLines.push(
          `SAA ${this.getMedName(t.MedId)} (${this.getIndicationName(indId)}); cave: ${capitalizeBegin(t.contraText)};`
        );
      }

      // 3b) Bundle the remaining meds (contraText empty)
      const bundleTasks = group.filter(t => capitalizeBegin(t.contraText).length === 0);

      // Dedupe med IDs in order of appearance within this indication group
      const bundleMedIds: string[] = [];
      const seenMedIds = new Set<string>();
      for (const t of bundleTasks) {
        if (!seenMedIds.has(t.MedId)) {
          seenMedIds.add(t.MedId);
          bundleMedIds.push(t.MedId);
        }
      }

      if (bundleMedIds.length > 0) {
        const medsJoined = bundleMedIds.map(this.getMedName).join("+");
        saaLines.push(`SAA ${medsJoined} (${this.getIndicationName(indId)});`);
      }
    }

    // 4) Global KI line
    const allContraOk = tasks.every(t => t.contraOk === true);
    const shouldCheckContra = tasks.some(t =>
      SAA_MEDICATION[t.MedId]?.requiresContraCheck?.has(t.MedIndication)
    );
    const kiLine = allContraOk
      ? (shouldCheckContra ? "keine Unverträglichkeit; kein Hinweis auf relevante KI:" : "")
      : "sonst keine Hinweise auf relevante KI oder Unverträglichkeit:";

    // 5) Dose lines per indication
    const doseLines: string[] = [];

    for (const indId of indicationOrder) {
      const group = tasks.filter(t => t.MedIndication === indId);

      const parts: string[] = [];
      for (const t of group) {
        const medName = this.getMedName(t.MedId);
        const dose = t.dosageText;

        // If med occurs more than once across tasks, append the indication
        const needsIndSuffix = (medCounts.get(t.MedId) ?? 0) > 1;
        const indSuffix = needsIndSuffix ? ` (${this.getIndicationName(indId)})` : "";

        const note = capitalizeBegin(t.noteText);
        const noteSuffix = note.length > 0 ? `, ${note}` : "";

        // If dosageText is empty, fall back to med default dosage (optional convenience)
        const finalDose = dose.length > 0 ? dose : (SAA_MEDICATION[t.MedId]?.defaultDosage ?? "");
        const defaultHint = SAA_MEDICATION[t.MedId]?.defaultHint ?? "";
        const hintSuffix = defaultHint.length > 0 ? `\n${defaultHint}` : "";

        parts.push(`${medName} ${finalDose}${indSuffix}${noteSuffix}${hintSuffix}`);
      }

      if (parts.length > 0) {
        // End each indication dose line with ';' (your style)
        doseLines.push(parts.join("; ") + ";");
      }
    }

    // 6) Assemble final text
    return [
      ...saaLines,
      ...(kiLine ? [kiLine] : []),
      ...doseLines,
    ].join("\n");

  }

}
