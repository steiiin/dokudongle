import { onHigh, onNormal, textIf } from "@/utils/filter"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { prefixAbdominalPain, prefixAbdominalPeristalsis, prefixDefecation } from "@/utils/prefix/exposure"
import { ProtocolContext } from "@/types/protocol"
import { AssessedValue, OptionalValue } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx(): ProtocolContext { return useDokuStore().context }
function isNonVerbal(): boolean { return getCtx().isNonVerbal }

// ############################################################################

export class ExposureEmisis {

  public incidences: '' | 'einmalig erbrochen' | 'mehrfach erbrochen' | 'anhaltendes Erbrechen'
  public abnormalities: '' | 'schaumig' | 'gallig' | 'kaffeesatzartig' | 'blutig'

  constructor()
  {
    this.incidences = ''
    this.abnormalities = ''
  }

  get needTreatment(): boolean {
    return this.incidences != ''
  }

  get text(): string
  {
    if (!this.needTreatment) { return onHigh('kein Erbrechen') }
    return this.incidences + (this.abnormalities != '' ? ` (${this.abnormalities})` : '')
  }

  get state(): string
  {
    return this.needTreatment
      ? this.text
      : 'kein Erbrechen'
  }

}

export class ExposureUrinary {

  public output: '' | 'verringert' | 'Harnverhalt' | 'vermehrt'
  public abnormalities: Array<'blutig' | 'flockig' | 'dunkel' | 'übelriechend'>
  public catheterType: '' | 'ISK' | 'transurethraler DK' | 'suprapubischer DK' | 'Nierenkatheter'
  public catheterIssues: '' | 'disloziert' | 'gezogen' | 'verstopft'

  constructor()
  {
    this.output = ''
    this.abnormalities = []
    this.catheterType = ''
    this.catheterIssues = ''
  }

  get needTreatment(): boolean {
    return this.output == 'Harnverhalt'
      || this.catheterIssues == 'verstopft'
      || this.catheterIssues == 'disloziert'
  }

  get catheterText(): string {
    return concatDoku([[ this.catheterType, this.catheterIssues ]], false)
  }

  get text(): string {

    const abnormalitiesSegment = (this.abnormalities.length>0)
      ? `Urin ${this.abnormalities.join(', ')}`
      : ''

    let outputSegment = '';
    if (this.output === 'Harnverhalt') outputSegment = 'Harnverhalt';
    else if (this.output === 'verringert' || this.output === 'vermehrt')
      outputSegment = `Ausfuhr ${this.output}`;

    return concatDoku([[ abnormalitiesSegment, outputSegment ]], false)

  }

}

export class ExposureAbdominal {

  public guarding: '' | 'leichte' | 'starke'
  public pain: 'keine' | 'leichte' | '' | 'starke'
  public peristalsis: '' | 'spärlich'|'fehlend'|'hochgestellt'

  constructor()
  {
    this.guarding = ''
    this.pain = 'keine'
    this.peristalsis = ''
  }

  get text(): string {

    const parts: string[] = []

    // Abdomen iO
    if (this.guarding == ''
      && this.pain == 'keine'
      && this.peristalsis == '')
    { return `Abdomen weich${isNonVerbal() ? '' : '/schmerzfrei'}` }

    // Schmerzen
    if (!isNonVerbal())
    {
      if (this.pain != 'keine') {
        parts.push(`${this.pain} Schmerzen`)
      } else {
        parts.push('schmerzfrei')
      }
    }

    // Abwehrspannung
    if (this.guarding != '')
    {
      parts.push(`${this.guarding} Abwehrspannung`)
    }
    else
    {
      parts.push('weich')
    }

    // Peristaltik
    if (this.peristalsis != '') {
      parts.push(`DG ${this.peristalsis}`)
    }

    return `Abdomen ${parts.map(e=>e.trim()).filter(e=>e).join('; ')}`

  }

}

// ############################################################################

export class AbcdeExposure {

  public bodyTemperature: number

  public nausea: boolean
  public emesis: ExposureEmisis

  public hasAssessedExcretions: boolean
  public bowelAbnormalities: OptionalValue<string>
  public urinary: ExposureUrinary
  public urinaryIncontinence: boolean

  public abdominal: AssessedValue<ExposureAbdominal>

  public treatment: string

  // #####################################################################

  constructor()
  {
    this.bodyTemperature = 36.5
    this.nausea = false
    this.emesis = new ExposureEmisis()
    this.hasAssessedExcretions = false
    this.bowelAbnormalities = OptionalValue.inactive('')
    this.urinary = new ExposureUrinary()
    this.urinaryIncontinence = false
    this.abdominal = AssessedValue.unassessed(new ExposureAbdominal())
    this.treatment = ''
  }

  // #####################################################################

  get needTreatment(): boolean {
    return (this.bodyTemperature <= 35 || this.bodyTemperature >= 37.5)
      || this.emesis.needTreatment
      || this.urinary.needTreatment
      || this.nausea
      || this.urinaryIncontinence
  }

  // #####################################################################

  get temperatureText(): string
  {
    if (this.bodyTemperature <= 35 && this.bodyTemperature > 32) { return 'milde Hypothermie' }
    else if (this.bodyTemperature <= 32 && this.bodyTemperature > 28) { return 'Hypothermie' }
    else if (this.bodyTemperature <= 28) { return 'schwere Hypothermie' }
    else if (this.bodyTemperature >= 37.5 && this.bodyTemperature < 38.0) { return 'Temp. erhöht' }
    else if (this.bodyTemperature >= 38.0) { return 'Fieber' }
    else { return 'Temp. iO' }
  }

  ///////////////////////////////////////////////

  get excretionsText(): string
  {

    const _catheter = this.urinary.catheterText
    const _incontinence = textIf('eingenässt', this.urinaryIncontinence)
    const _urinary = this.urinary.text

    let _bowel = (this.bowelAbnormalities.active)
      ? prefixDefecation(this.bowelAbnormalities.value)
      : 'Stuhlgang o.B.'

    const hasCatheter = _catheter.length > 0;
    const hasIncontinence = _incontinence.length > 0;
    const hasUrinary = _urinary.length > 0;
    const isBowelNormal = _bowel === 'Stuhlgang o.B.';

    // 1) all good
    if (!hasCatheter && !hasIncontinence && !hasUrinary && isBowelNormal) {
      return 'Wasserlassen/Stuhlgang o.B.'
    }

    // 2) only incontinence, else good
    if (!hasCatheter && hasIncontinence && !hasUrinary && isBowelNormal) {
      return 'eingenässt, sonst Wasserlassen/Stuhlgang o.B.'
    }

    // 3) all good, but with catheter
    if (hasCatheter && !hasIncontinence && !hasUrinary && isBowelNormal) {
      return concatDoku([_catheter, (this.urinary.catheterIssues != '' ? 'sonst ' : '') + 'Wasserlassen/Stuhlgang o.B.'])
    }

    // --- generic cases ---
    return concatDoku([
      _catheter,
      _incontinence,
      this.urinary.text,
      _bowel,
    ]);

  }

  get abdominalState(): string {

    if (!this.abdominal.isAssessed) { return 'nicht untersucht' }
    else { return this.abdominalText }

  }

  get abdominalText(): string {

    if (!this.abdominal.isAssessed) { return '' }
    else { return this.abdominal.value.text }

  }

  // #####################################################################

  public generateText(): string
  {

    const assessedLine: string = breakDoku(prefix('E:', capitalizeBegin(concatDoku([
      this.temperatureText,
      [
        textIf(
          this.nausea ? 'Übelkeit' : onNormal('keine Übelkeit'),
          !isNonVerbal()
        ),
        this.emesis.text
      ],
      textIf(this.excretionsText, this.hasAssessedExcretions),
      this.abdominalText,
    ]))))

    const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

    return breakDoku([ assessedLine, treatmentLine ])

  }

}
