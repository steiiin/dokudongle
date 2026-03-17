import { useDokuStore } from "@/store/doku"
import { OptionalValue } from "../input"
import { onHigh, onNormal, textIf } from "@/utils/filter"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { ProtocolContext } from "@/types/protocol"

function getCtx(): ProtocolContext { return useDokuStore().context }
function isNonVerbal(): boolean { return getCtx().isNonVerbal }

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
  public pain: OptionalValue<string>
  public peristalsis: OptionalValue<string>

  constructor()
  {
    this.guarding = ''
    this.pain = OptionalValue.inactive('')
    this.peristalsis = OptionalValue.inactive('')
  }

}

export class AbcdeExposure {

  public bodyTemperature: number

  public nausea: boolean
  public emesis: ExposureEmisis

  public bowelAbnormalities: OptionalValue<string>
  public urinary: ExposureUrinary
  public urinaryIncontinence: boolean

  public abdominal: ExposureAbdominal

  public treatment: string

  // #####################################################################

  constructor()
  {
    this.bodyTemperature = 36.5
    this.nausea = false
    this.emesis = new ExposureEmisis()
    this.bowelAbnormalities = OptionalValue.inactive('')
    this.urinary = new ExposureUrinary()
    this.urinaryIncontinence = false
    this.abdominal = new ExposureAbdominal()
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

    const catheterSegment = this.urinary.catheterText
    const incontinenceSegment = textIf('eingenässt', this.urinaryIncontinence)
    const urinarySegment = this.urinary.text

    let bowelSegment = (this.bowelAbnormalities.active)
      ? prefix('Stuhlgang:', this.bowelAbnormalities.value)
      : onNormal('Stuhlgang oB')


    const hasCatheter = catheterSegment.length > 0;
    const hasIncontinence = incontinenceSegment.length > 0;
    const hasUrinarySegment = urinarySegment.length > 0;
    const isBowelNormal = bowelSegment === 'Stuhlgang o.B.';

    // 1) all good
    if (!hasCatheter && !hasIncontinence && !hasUrinarySegment && isBowelNormal) {
      return onNormal('Wasserlassen/Stuhlgang o.B.')
    }

    // 2) only incontinence, else good
    if (!hasCatheter && hasIncontinence && !hasUrinarySegment && isBowelNormal) {
      return 'eingenässt, sonst Wasserlassen/Stuhlgang o.B.'
    }

    // 3) all good, but with catheter
    if (hasCatheter && !hasIncontinence && !hasUrinarySegment && isBowelNormal) {
      return concatDoku([catheterSegment, (this.urinary.catheterIssues != '' ? 'sonst ' : '') + 'Wasserlassen/Stuhlgang o.B.'])
    }

    // --- generic cases ---
    return concatDoku([
      catheterSegment,
      incontinenceSegment,
      this.urinary.text,
      bowelSegment,
    ]);

  }

  get abdominalText(): string {

    const parts: string[] = [];

    // All Good
    if (
      this.abdominal.guarding == ''
      && !this.abdominal.pain.active
      && !this.abdominal.peristalsis.active
    ) {
      if (getCtx().isLow) { return '' }
      else { return `Abdomen weich${isNonVerbal() ? '' : '/schmerzfrei'}` }
    }

    // Pain
    if (!isNonVerbal())
    {
      if (this.abdominal.pain.active) {
        parts.push(prefix('Abdomen:', this.abdominal.pain.value))
      } else {
        parts.push('schmerzfrei')
      }
    }

    // Guarding
    if (this.abdominal.guarding != '')
    {
      parts.push(`${this.abdominal.guarding} Abwehrspannung`)
    }
    else
    {
      onNormal('weich')
    }

    // Peristalsis
    if (this.abdominal.peristalsis.active) {
      parts.push(prefix('Peristaltik:', this.abdominal.peristalsis.value))
    }

    return `Abdomen ${parts.join('; ')}`

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
      this.excretionsText,
      this.abdominalText,
    ]))))

    const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

    return breakDoku([ assessedLine, treatmentLine ])

  }

}
