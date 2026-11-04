import { assessmentActive, assessmentDefaults } from '../assessment'
import { assessedText, onHigh, onNormal, textIf } from "@/utils/filter"
import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { AssessedValue } from "../input"

import { useDokuStore } from "@/store/doku"

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

export class ExposureExcretions {

  public catheterType: '' | 'ISK' | 'transurethraler DK' | 'suprapubischer DK' | 'Nierenkatheter' = ''
  public urinaryAbnormalities: boolean = false
  public bowelAbnormalities: boolean = false

  get needTreatment(): boolean {
    return this.urinaryAbnormalities || this.bowelAbnormalities
  }

  get state(): string
  {

    const _catheter = this.catheterType
    const _abnormalities =
    ({
      'false,false': 'Wasserlassen/Stuhlgang o.B.',
      'false,true': 'Wasserlassen path./Stuhlgang o.B.',
      'true,false': 'Wasserlassen o.B./Stuhlgang path.',
      'true,true': 'Wasserlassen/Stuhlgang path.'
    } as const)[`${this.bowelAbnormalities},${this.urinaryAbnormalities}`];

    return [ _catheter, _abnormalities ].filter(e=>e).join(', ')

  }

  get text(): string
  {

    const _catheter = this.catheterType
    const _abnormalities =
    ({
      'false,false': 'Wasserlassen/Stuhlgang o.B.',
      'false,true': 'Stuhlgang o.B.',
      'true,false': 'Wasserlassen o.B.',
      'true,true': ''
    } as const)[`${this.bowelAbnormalities},${this.urinaryAbnormalities}`];

    return [ _catheter, _abnormalities ].filter(e=>e).join(', ')

  }


  // get excretionsText(): string
  // {

  //   const _catheter = this.urinary.catheterText
  //   const _incontinence = textIf('eingenässt', this.urinaryIncontinence)
  //   const _urinary = this.urinary.text

  //   let _bowel = (this.bowelAbnormalities.active)
  //     ? prefixDefecation(this.bowelAbnormalities.value)
  //     : 'Stuhlgang o.B.'

  //   const hasCatheter = _catheter.length > 0;
  //   const hasIncontinence = _incontinence.length > 0;
  //   const hasUrinary = _urinary.length > 0;
  //   const isBowelNormal = _bowel === 'Stuhlgang o.B.';

  //   // 1) Alles unauffällig
  //   if (!hasCatheter && !hasIncontinence && !hasUrinary && isBowelNormal) {
  //     return 'Wasserlassen/Stuhlgang o.B.'
  //   }

  //   // 2) Nur Inkontinenz, sonst unauffällig
  //   if (!hasCatheter && hasIncontinence && !hasUrinary && isBowelNormal) {
  //     return 'eingenässt, sonst Wasserlassen/Stuhlgang o.B.'
  //   }

  //   // 3) Alles unauffällig, aber mit Katheter
  //   if (hasCatheter && !hasIncontinence && !hasUrinary && isBowelNormal) {
  //     return concatDoku([_catheter, (this.urinary.catheterIssues != '' ? 'sonst ' : '') + 'Wasserlassen/Stuhlgang o.B.'])
  //   }

  //   // --- Allgemeine Fälle ---
  //   return concatDoku([
  //     _catheter,
  //     _incontinence,
  //     this.urinary.text,
  //     _bowel,
  //   ]);

  // }


}

export class ExposureAbdominal {

  public assessment = assessmentDefaults('pain')

  isExamined(field: keyof typeof this.assessment): boolean {
    return assessmentActive(this.assessment[field], useDokuStore().doku)
  }

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
      && (!this.isExamined('pain') || this.pain == 'keine')
      && this.peristalsis == '')
    { return `Abdomen weich${this.isExamined('pain') ? '/schmerzfrei' : ''}` }

    // Schmerzen
    if (this.isExamined('pain'))
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

  public assessment = assessmentDefaults('nausea')

  isExamined(field: keyof typeof this.assessment): boolean {
    return assessmentActive(this.assessment[field], useDokuStore().doku)
  }

  public bodyTemperature: number

  public nausea: boolean
  public emesis: ExposureEmisis

  public excretions: AssessedValue<ExposureExcretions>
  public urinaryIncontinence: boolean

  public abdominal: AssessedValue<ExposureAbdominal>
  public pregnancy: AssessedValue<boolean>

  // #####################################################################

  constructor()
  {
    this.bodyTemperature = 36.5
    this.nausea = false
    this.emesis = new ExposureEmisis()
    this.excretions = AssessedValue.unassessed(new ExposureExcretions())
    this.urinaryIncontinence = false
    this.abdominal = AssessedValue.unassessed(new ExposureAbdominal())
    this.pregnancy = AssessedValue.unassessed(true)
  }

  // #####################################################################

  get needTreatment(): boolean {
    return (this.bodyTemperature <= 35 || this.bodyTemperature >= 37.5)
      || this.emesis.needTreatment
      || (this.excretions.isAssessed && this.excretions.value.needTreatment)
      || (this.isExamined('nausea') && this.nausea)
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

  get abdominalState(): string {

    if (!this.abdominal.isAssessed) { return 'nicht untersucht' }
    else { return this.abdominalText }

  }

  get abdominalText(): string {

    if (!this.abdominal.isAssessed) { return '' }
    else { return this.abdominal.value.text }

  }

  get excretionsState(): string {
    if (this.excretions.isAssessed) {
      return this.excretions.value.state
    } else {
      return 'nicht untersucht'
    }
  }

  // #####################################################################

  public generateText(): string
  {

    const assessedLine: string = breakDoku(prefix('E:', capitalizeBegin(concatDoku([
      this.temperatureText,
      [
        textIf(
          this.nausea ? 'Übelkeit' : onNormal('keine Übelkeit'),
          this.isExamined('nausea')
        ),
        this.emesis.text
      ],
      textIf(this.excretions.value.text, this.excretions.isAssessed),
      textIf('eingenässt', this.urinaryIncontinence),
      this.abdominalText,
      assessedText(this.pregnancy, 'Schwangerschaft', 'Schwangerschaft ausgeschlossen'),
    ]))))

    return assessedLine

  }

}
