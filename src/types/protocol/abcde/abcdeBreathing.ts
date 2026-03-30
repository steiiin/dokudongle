import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { onHigh, onNormal, textDef, textIf } from "@/utils/filter"
import { AssessedValue, ProtocolStateValue, PSV } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

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

// ############################################################################

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

    this.auscultation = AssessedValue.unassessed({ wheezing: '', crackles: '', dimished: '' })

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

  get normalAuscultation(): boolean {
    return (
      this.auscultation.value.wheezing == ''
      && this.auscultation.value.crackles == ''
      && this.auscultation.value.dimished == ''
    )
  }

  get auscultationPSV(): ProtocolStateValue {

    if (!this.auscultation.isAssessed) { return PSV('nicht abgehört', '') }

    if (this.auscultation.value.wheezing == ''
        && this.auscultation.value.crackles == ''
        && this.auscultation.value.dimished == '') {
      return PSV('unauffällig', onNormal('Ausk. unauffällig')) }

    const _wheezing = textIf(`Giemen ${this.auscultation.value.wheezing}`, !!this.auscultation.value.wheezing)
    const _crackles = textIf(`RGs ${this.auscultation.value.crackles}`, !!this.auscultation.value.crackles)
    const _dimished = textIf(`Abgeschwächt ${this.auscultation.value.dimished}`, !!this.auscultation.value.dimished)

    return PSV(concatDoku([ _wheezing, _crackles, _dimished ], false))

  }

  get auscultationState(): string {
    return this.auscultationPSV.modalState
  }

  get auscultationText(): string {
    return this.auscultationPSV.protocolText
  }

  ///////////////////////////////////////////////

  get thoraxState(): string {

    if (!this.useAccessoryMuscles
        && !this.hasRetractions
        && !this.isParadoxical
        && !this.hasJugularVenousDistension
        && !this.hasEmphysema
        && !this.hasTrachealDeviation
    ) { return 'unauffällig' }

    return concatDoku([
      textIf('Einsatz AHM', this.useAccessoryMuscles),
      textIf('Einziehungen', this.hasRetractions),
      textIf('paradoxe Atmung', this.isParadoxical),
      textIf('Halsvenenstauung', this.hasJugularVenousDistension),
      textIf('subkutanes Emphysem', this.hasEmphysema),
      textIf('Trachea verschoben', this.hasTrachealDeviation),
    ], false)

  }

  get thoraxText(): string {

    return concatDoku([
      [
        textIf('Einsatz AHM', this.useAccessoryMuscles),
        this.hasRetractions
          ? 'Einziehungen'
          : textIf('keine Einziehungen', (getCtx().isHigh && this.hasDyspnoe) || getCtx().isPediatric),
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