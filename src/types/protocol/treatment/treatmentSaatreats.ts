import { selectedSaatreatChips } from '@/data/lists/saatreats'

export class TreatmentSaatreats {
  public selectedIds: string[] = []

  public getBlock(): string {
    const texts = selectedSaatreatChips(this.selectedIds).map(chip => chip.protocolText)
    return texts.length ? `${texts.join('; ')}.` : ''
  }
}
