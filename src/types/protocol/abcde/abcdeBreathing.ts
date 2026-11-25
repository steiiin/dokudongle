import { auscultationText, emptyAuscultation, hasAuscultationFindings, type BreathingAuscultation } from './auscultation'
export type { BreathingAuscultation } from './auscultation'
import { assessmentActive, assessmentDefaults } from '../assessment'
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { assessedText, textDef, textIf } from "@/utils/filter"
import { AssessedValue, ProtocolStateValue, PSV } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

export interface BreathingMech {
  frequency: '' | 'Bradypnoe' | 'Tachypnoe'
  depth: '' | 'Flach' | 'Vertieft'
  pattern: '' | 'Biotsche Atmung' | 'Cheyne-Stokes-Atmung' | 'Kußmaul-Atmung' | 'Hyperventilation'
}

// ############################################################################

export class AbcdeBreathing {

  public assessment = assessmentDefaults('breathlessness')

  isExamined(field: keyof typeof this.assessment): boolean {
    return assessmentActive(this.assessment[field], useDokuStore().doku)
  }

  public breathlessness: 'keine' | 'leichte' | '' | 'schwere'
  public hasHypoxia: boolean
  public mechanics: BreathingMech

  public auscultation: AssessedValue<BreathingAuscultation>

  public accessoryMuscles: AssessedValue<boolean>
  public retractions: AssessedValue<boolean>
  public paradoxical: AssessedValue<boolean>
  public jugularVenousDistension: AssessedValue<boolean>
  public emphysema: AssessedValue<boolean>

  // #####################################################################

  constructor()
  {
    this.breathlessness = 'keine'
    this.hasHypoxia = false

    this.mechanics = { frequency: '', depth: '', pattern: '' }
    this.auscultation = AssessedValue.unassessed(emptyAuscultation())

    this.accessoryMuscles = AssessedValue.unassessed(false)
    this.retractions = AssessedValue.unassessed(false)
    this.paradoxical = AssessedValue.unassessed(false)
    this.jugularVenousDistension = AssessedValue.unassessed(false)
    this.emphysema = AssessedValue.unassessed(false)

  }

  // #####################################################################

  get needTreatment(): boolean {
    return (this.isExamined('breathlessness') && this.breathlessness != 'keine')
      || this.hasHypoxia
      || this.mechanics.frequency != ''
      || this.mechanics.depth != ''
      || this.mechanics.pattern != ''
      || this.accessoryMuscles.matches(true)
      || this.retractions.matches(true)
      || (this.auscultation.assessed && hasAuscultationFindings(this.auscultation.value))
      || this.paradoxical.matches(true)
      || this.jugularVenousDistension.matches(true)
      || this.emphysema.matches(true)
  }

  // #####################################################################

  get hasDyspnoe(): boolean { return this.isExamined('breathlessness') && this.breathlessness != 'keine' }

  get dyspnoeText(): string { return `${this.breathlessness} Luftnot` }

  ///////////////////////////////////////////////

  get normalBreathing(): boolean {
    return (
      !this.hasDyspnoe
      && !this.hasHypoxia
      && this.mechanics.frequency == ''
      && this.mechanics.depth == ''
      && this.mechanics.pattern == ''
      && !this.accessoryMuscles.matches(true)
      && !this.retractions.matches(true)
      && !this.paradoxical.matches(true)
      && !this.jugularVenousDistension.matches(true)
      && !this.emphysema.matches(true)
    )
  }

  get breathingPSV(): ProtocolStateValue
  {
    if (this.normalBreathing)
    {
      return PSV(
        'normal',
        getCtx().isLow
          ? 'Atmung normal'
          : 'Atmung iO (Freq./Tiefe/Form)'
      )
    }

    if (this.mechanics.pattern != '')
    {
      return PSV(this.mechanics.pattern)
    }

    const _frequency = textDef('Freq. iO', this.mechanics.frequency)
    const _depth = textDef('Tiefe iO', this.mechanics.depth)

    const protocolText = concatDoku([ _frequency, _depth ], false)
    const isNormal = !this.mechanics.frequency && !this.mechanics.depth

    return PSV(
      isNormal ? 'normal' : protocolText,
      protocolText
    )

  }

  get breathingState(): string {
    return this.breathingPSV.modalState
  }

  get breathingText(): string {
    return this.breathingPSV.protocolText
  }

  ///////////////////////////////////////////////

  public resetAuscultation(): void {
    this.auscultation.value = emptyAuscultation()
  }

  get normalAuscultation(): boolean {
    return this.auscultation.assessed && this.auscultation.value.normalVolume && this.auscultation.value.noAddedSounds
  }

  get auscultationPSV(): ProtocolStateValue {
    if (!this.auscultation.isAssessed) return PSV('nicht abgehört', '')
    if (this.normalAuscultation) return PSV('unauffällig', 'Ausk. unauffällig')
    const text = auscultationText(this.auscultation.value)
    return text ? PSV(text) : PSV('Keine Angaben', '')
  }

  get auscultationState(): string {
    return this.auscultationPSV.modalState
  }

  get auscultationText(): string {
    return this.auscultationPSV.protocolText
  }

  ///////////////////////////////////////////////

  get thoraxText(): string {
    return concatDoku([
      [
        assessedText(this.accessoryMuscles, 'Einsatz AHM', 'kein Einsatz AHM'),
        assessedText(this.retractions, 'Einziehungen', 'keine Einziehungen'),
        assessedText(this.paradoxical, 'paradoxe Atmung', 'keine paradoxe Atmung'),
      ],
      assessedText(this.jugularVenousDistension, 'Halsvenenstauung', 'keine Halsvenenstauung'),
      assessedText(this.emphysema, 'subkutanes Emphysem', 'kein subkutanes Emphysem'),
    ])
  }

  // #####################################################################

  public generateText(): string
  {

    const isBreathing = getCtx().isBreathing

    const assessedLine: string = breakDoku(prefix('B:', capitalizeBegin(concatDoku([
      textIf('Apnoe', !isBreathing),
      textIf(
        textIf(
          this.normalBreathing
            ? 'keine Luftnot'
            : this.dyspnoeText,
        isBreathing),
      this.isExamined('breathlessness')),
      textIf(this.breathingText, isBreathing),
      textIf(this.auscultationText, isBreathing),
      textIf('Hypoxie', this.hasHypoxia),
      this.thoraxText,
    ]))))

    return assessedLine

  }

}
