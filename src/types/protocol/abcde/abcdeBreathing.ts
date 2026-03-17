import { ProtocolVerbosity } from "@/types/protocol"
import { AssessedValue, unassessed } from "../input"

import { useDokuStore } from "@/store/doku"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { onHigh, onNormal, textIf } from "@/utils/filter"
function getCtx() { return useDokuStore().context }

export interface BreathingMech {
  frequency: '' | 'Bradypnoe' | 'Tachypnoe'
  depth: '' | 'Flach' | 'Vertieft'
  pattern: '' | 'Biotsche Atmung' | 'Cheyne-Stokes-Atmung' | 'Kußmaul-Atmung' | 'Hyperventilation'
}

export interface BreathingAuscultation {
  wheezing: '' | 'bds.' | 're.' | 'li.'
  crackles: '' | 'bds.' | 're.' | 'li.'
  dimished: '' | 'bds.' | 're.' | 'li.'
}

export class AbcdeBreathing {

  public breathlessness: 'keine' | 'leichte' | '' | 'schwere'
  public hasHypoxia: boolean

  public mechanics: BreathingMech
  public useAccessoryMuscles: boolean
  public hasRetractions: boolean

  public auscultation: AssessedValue<BreathingAuscultation>

  public isParadoxical: boolean
  public hasJugularVenousDistension: boolean
  public hasEmphysema: boolean
  public hasTrachealDeviation: boolean

  public treatment: string

  // #####################################################################

  constructor()
  {
    this.breathlessness = 'keine'
    this.hasHypoxia = false

    this.mechanics = { frequency: '', depth: '', pattern: '' }
    this.useAccessoryMuscles = false
    this.hasRetractions = false

    this.auscultation = unassessed({ wheezing: '', crackles: '', dimished: '' })

    this.isParadoxical = false
    this.hasJugularVenousDistension = false
    this.hasEmphysema = false
    this.hasTrachealDeviation = false

    this.treatment = ''
  }

  // #####################################################################

  get needTreatment(): boolean {
    return this.breathlessness != 'keine'
      || this.hasHypoxia
      || this.mechanics.frequency != ''
      || this.mechanics.depth != ''
      || this.mechanics.pattern != ''
      || this.useAccessoryMuscles
      || this.hasRetractions
      || (this.auscultation.assessed &&
          (
            this.auscultation.value.wheezing != ''
            || this.auscultation.value.crackles != ''
            || this.auscultation.value.dimished != ''
          ))
      || this.isParadoxical
      || this.hasJugularVenousDistension
      || this.hasEmphysema
      || this.hasTrachealDeviation
  }

  // #####################################################################

  get hasDyspnoe(): boolean { return this.breathlessness != 'keine' }

  get dyspnoeText(): string { return `${this.breathlessness} Luftnot` }

  ///////////////////////////////////////////////

  get normalBreathing(): boolean {
    return (
      !this.hasDyspnoe
      && !this.hasHypoxia
      && this.mechanics.frequency == ''
      && this.mechanics.depth == ''
      && this.mechanics.pattern == ''
      && !this.useAccessoryMuscles
      && !this.hasRetractions
      && !this.isParadoxical
      && !this.hasJugularVenousDistension
      && !this.hasEmphysema
      && !this.hasTrachealDeviation
    )
  }

  get breathingDescription(): string {
    if (this.normalBreathing) { return 'normal' }
    return this.breathingText
  }

  get breathingText(): string {

    if (this.normalBreathing) {
      return getCtx().isLow ? 'Atmung normal' : 'Atmung iO (Freq./Tiefe/Form)'
    }

    let freqDesc = this.mechanics.frequency == '' ? 'Freq. iO' : this.mechanics.frequency
    let depthDesc = this.mechanics.depth == '' ? 'Tiefe iO' : this.mechanics.depth
    if (this.mechanics.pattern != '') {
      freqDesc = ''
      depthDesc = ''
    }

    return concatDoku([
      [ freqDesc, depthDesc ],
      this.mechanics.pattern,
    ], false)

  }

  ///////////////////////////////////////////////

  get normalAuscultation(): boolean {
    return (
      this.auscultation.value.wheezing == ''
      && this.auscultation.value.crackles == ''
      && this.auscultation.value.dimished == ''
    )
  }

  get auscultationDescription(): string {
    if (!this.auscultation.assessed) { return 'Nicht Abgehört' }
    return this.auscultationText
  }

  get auscultationText(): string {
    if (!this.auscultation.assessed) { return '' }
    if (this.normalAuscultation) { return onNormal('Ausk. unauffällig') }
    const wheezingText = textIf(`Giemen ${this.auscultation.value.wheezing}`, this.auscultation.value.wheezing != '')
    const cracklesText = textIf(`RGs ${this.auscultation.value.crackles}`, this.auscultation.value.crackles != '')
    const dimishedText = textIf(`Abgeschwächt ${this.auscultation.value.dimished}`, this.auscultation.value.dimished != '')
    return concatDoku([ wheezingText, cracklesText, dimishedText ], false)
  }

  ///////////////////////////////////////////////

  get thoraxDescription(): string {
    if (!this.useAccessoryMuscles
      && !this.hasRetractions
      && !this.isParadoxical
      && !this.hasJugularVenousDistension
      && !this.hasEmphysema
      && !this.hasTrachealDeviation
    ) { return 'normal' }
    return concatDoku([
      textIf('Einsatz AHM', this.useAccessoryMuscles),
      textIf('Einziehungen', this.hasRetractions),
      textIf('paradoxe Atmung', this.isParadoxical),
      textIf('Halsvenenstauung', this.hasJugularVenousDistension),
      textIf('subkutanes Emphysem', this.hasEmphysema),
      textIf('Trachea verschoben', this.hasTrachealDeviation),
    ])
  }

  get thoraxText(): string {
    return concatDoku([
      [
        textIf('Einsatz AHM', this.useAccessoryMuscles),
        this.hasRetractions
          ? 'Einziehungen'
          : textIf('keine Einziehungen', getCtx().isHigh && this.hasDyspnoe),
        textIf('paradoxe Atmung', this.isParadoxical)
      ],
      this.hasJugularVenousDistension
        ? 'Halsvenenstauung'
        : onHigh('keine Halsvenenstauung'),
      textIf('subkutanes Emphysem', this.hasEmphysema),
      textIf('Trachea verschoben', this.hasTrachealDeviation),
    ])
  }

  // #####################################################################

  public generateText(): string
  {

    const isBreathing = getCtx().isBreathing
    const isNonVerbal = getCtx().isNonVerbal

    const assessedLine: string = breakDoku(prefix('B:', capitalizeBegin(concatDoku([
      textIf('Apnoe', !isBreathing),
      textIf(
        textIf(
          this.normalBreathing
            ? 'keine Luftnot'
            : this.dyspnoeText,
        isBreathing),
      !isNonVerbal),
      textIf(this.breathingText, isBreathing),
      textIf(this.auscultationText, isBreathing),
      textIf('Hypoxie', this.hasHypoxia),
      this.thoraxText,
    ]))))

    const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

    return breakDoku([ assessedLine, treatmentLine ])

  }

}