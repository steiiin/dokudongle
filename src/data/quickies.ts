import { OptionInput } from "@/components/DodoInputSelect.vue"
import DodoQuickieAbdomonalPain from "@/components/quickie-components/DodoQuickieAbdomonalPain.vue"
import DodoQuickieTemplate from "@/components/quickie-components/DodoQuickieTemplate.vue"
import { OptionalValue } from "@/types/protocol/input"
import { basicCap } from "@/utils/autocorrect/basic"
import { correctDoc, correctHospital } from "@/utils/autocorrect/locations"
import { concatDoku } from "@/utils/text"
import { Component, markRaw } from "vue"

// ############################################################################

export const QU_Verlegung = 'verlegung'
export const QU_Einweisung = 'einweisung'

export const QU_AbdominalPain = 'abdominal_pain'

// ############################################################################

export const OP_Hospitals = [ 'KH Radebeul', 'KH Meißen', 'KH Riesa' ]

// ############################################################################

export abstract class Quickie
{
  constructor(
    public key: string,
    public label: string,
    public component: Component,
  ){}
  abstract isAvailable(text: string): boolean
}

// --------------------------------------------------------

export type QuickieTemplateField = {
  key: string, color?: string,
  allowOptions?: boolean, allowCustom?: boolean,
  options?: Array<OptionInput>,
  customLabel?: string, customPlaceholder?: string,
  autocorrectFn?: (draft: string) => string,
}

export class QuickieTemplate extends Quickie
{
  constructor(public key: string, public label: string,
    public template: string,
    public fields: QuickieTemplateField[] ) {
    super(key, label, markRaw(DodoQuickieTemplate))
  }
  public isAvailable(text: string): boolean {
    const templatePattern = this.fields.reduce((pattern, field) => {
      return pattern.replaceAll(`<${field.key}>`, '(.+?)')
    }, this.template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return !(new RegExp(templatePattern, 'm').test(text))
  }
}

// --------------------------------------------------------

export class QuickieAbdominalPainRegion {

  public obli: boolean = false    // Oberbauch li
  public obmi: boolean = false    // Oberbauch mittig
  public obre: boolean = false    // Oberbauch re
  public mbli: boolean = false    // Flanke li
  public mbmi: boolean = false    // Nabelregion
  public mbre: boolean = false    // Flanke re
  public ubli: boolean = false    // Unterbauch li
  public ubmi: boolean = false    // Unterbauch mittig
  public ubre: boolean = false    // Unterbauch re

  private get _structured(): Array<boolean> {
    return [
      this.obli /*0*/, this.obmi /*1*/, this.obre /*2*/,
      this.mbli /*3*/, this.mbmi /*4*/, this.mbre /*5*/,
      this.ubli /*6*/, this.ubmi /*7*/, this.ubre /*8*/,
    ]
  }

  private testStruct(
    testMandatory: number[][]|number[],
    testForbidden: number[],
    testAtLeast: number[]
  ): boolean {

    const structured = this._structured

    // normalisieren
    testMandatory = typeof testMandatory[0] === "number"
      ? [testMandatory as number[]]
      : testMandatory as number[][]

    // Forbidden: alle müssen false sein
    const forbiddenOk = testForbidden.every(i => structured[i] === false)
    if (!forbiddenOk) return false

    // AtLeast: mindestens einer muss true sein
    const atLeastOk =
      testAtLeast.length === 0 ||
      testAtLeast.some(i => structured[i] === true)

    if (!atLeastOk) return false

    // Mandatory: mindestens eine Gruppe komplett erfüllt
    const mandatoryOk =
      testMandatory.length === 0 ||
      testMandatory.some(group =>
        group.every(i => structured[i] === true)
      )

    return mandatoryOk
  }

  private only(test: Array<number>): boolean
  {
    return this._structured.every((v,i) => test.includes(i) ? v === true : v === false)
  }

  private get onlyLeft(): boolean { return this.testStruct([0,6],[1,4,7,2,5,8],[]) }
  private get onlyRight(): boolean { return this.testStruct([2,8],[0,3,6,1,4,7],[]) }
  private get onlyUpper(): boolean { return this.testStruct([0,2],[3,4,5,6,7,8],[]) }
  private get onlyBottom(): boolean { return this.testStruct([6,8],[0,1,2,3,4,5],[]) }
  private get onlyCenter(): boolean { return this.only([4]) }

  private get onlyQuadUpLeft(): boolean {
    return this.testStruct([[0,1],[0,3],[1,3],[0,4]],[2,5,6,7,8],[])
  }
  private get onlyQuadUpRight(): boolean {
    return this.testStruct([[1,2],[2,5],[4,2],[1,5]],[0,3,6,7,8],[])
  }
  private get onlyQuadBottomLeft(): boolean {
    return this.testStruct([[3,6],[6,7],[3,7],[6,4]],[0,1,2,5,8],[])
  }
  private get onlyQuadBottomRight(): boolean {
    return this.testStruct([[5,8],[7,8],[7,5],[4,8]],[0,3,6,1,2],[])
  }

  private get diffLeft(): boolean {
    return this.testStruct([0,3,6], [2,5,8], [1,4,7])
        || this.testStruct([0,3,7], [2,5,8], [])
        || this.testStruct([3,6,1], [2,5,8], [])
  }
  private get diffRight(): boolean {
    return this.testStruct([2,5,8], [0,3,6], [1,4,7])
        || this.testStruct([2,5,7], [0,3,6], [])
        || this.testStruct([5,8,1], [0,3,6], [])
  }
  private get diffUpper(): boolean {
    return this.testStruct([0,1,2], [6,7,8], [3,4,5])
        || this.testStruct([0,1,5], [6,7,8], [])
        || this.testStruct([1,2,3], [6,7,8], [])
  }
  private get diffBottom(): boolean {
    return this.testStruct([6,7,8], [0,1,2], [3,4,5])
        || this.testStruct([6,7,5], [0,1,2], [])
        || this.testStruct([7,8,3], [0,1,2], [])
  }

  private get crossH(): boolean {
    return this.testStruct([3,4,5],[0,1,2,6,7,8],[])
  }
  private get crossHUpp(): boolean {
    return this.testStruct([3,4,5],[6,7,8],[0,1,2])
  }
  private get crossHBot(): boolean {
    return this.testStruct([3,4,5],[0,1,2],[6,7,8])
  }
  private get crossV(): boolean {
    return this.testStruct([1,4,7],[0,3,6,2,5,8],[])
  }

  private get eachRowColumn(): boolean {
    return (this._structured.some((v,i) => [0,1,2].includes(i) ? v===true : false))
      && (this._structured.some((v,i) => [3,4,5].includes(i) ? v===true : false))
      && (this._structured.some((v,i) => [6,7,8].includes(i) ? v===true : false))
  }

  get regionText(): string
  {

    if (this.onlyLeft) { return 'linksseitig' }
    if (this.onlyRight) { return 'rechtsseitig' }
    if (this.onlyUpper) { return 'OB' }
    if (this.onlyBottom) { return 'UB' }
    if (this.onlyCenter) { return 'Nabelregion' }

    if (this.diffLeft) { return 'diffus linksseitig' }
    if (this.diffRight) { return 'diffus rechtsseitig' }
    if (this.diffUpper) { return 'diffus OB' }
    if (this.diffBottom) { return 'diffus UB' }

    if (this.onlyQuadUpLeft) { return 'diffus oben/li.' }
    if (this.onlyQuadUpRight) { return 'diffus oben/re.' }
    if (this.onlyQuadBottomLeft) { return 'diffus unten/li.' }
    if (this.onlyQuadBottomRight) { return 'diffus unten/re.' }

    if (this.crossH) { return 'Mittelbauch' }
    if (this.crossHUpp) { return 'diffus OB' }
    if (this.crossHBot) { return 'diffus UB' }
    if (this.crossV) { return 'Mittellinie' }

    if (this.only([3,4])) { return 'Nabel linksbetont' }
    if (this.only([1,4])) { return 'Nabel+Richtung OB ' }
    if (this.only([4,5])) { return 'Nabel rechtsbetont' }
    if (this.only([4,7])) { return 'Nabel+Richtung UB' }

    if (this.eachRowColumn) { return 'diffus' }

    let regions: Array<string> = []
    if (this.obli) { regions.push('OB li.') }
    if (this.obmi) { regions.push('epigastr.') }
    if (this.obre) { regions.push('OB re.') }
    if (this.mbli) { regions.push('Flanke li.') }
    if (this.mbmi) { regions.push('Nabelregion') }
    if (this.mbre) { regions.push('Flanke re.') }
    if (this.ubli) { regions.push('UB li') }
    if (this.ubmi) { regions.push('unterhalb Nabel') }
    if (this.ubre) { regions.push('UB re.') }
    return regions.length<=2&&regions.length>0 ? regions.join(', ') : 'diffus'

  }

}

export class QuickieAbdominalPain extends Quickie
{
  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieAbdomonalPain))
  }
  public isAvailable(text: string): boolean {
    return !text.includes('Bauchschmerz: ')
  }

  public region: QuickieAbdominalPainRegion = new QuickieAbdominalPainRegion()

  public onset: 'plötzlicher Beginn' | 'schleichender Beginn' = 'plötzlicher Beginn'
  public onspan: '' | 'seit Stunden' | 'seit Tagen' | 'seit Wochen' | 'gestern' | string = ''

  public provocation: string[] = []
  public palliation: string[] = []
  public quality: string[] = []
  public radiation: string[] = []
  public severity: 'minimal'|'leicht'|'mittel'|'stark'|'maximal' = 'mittel'
  public time: string[] = []

}

// ############################################################################

export const DATA_Quickies: Record<string, Quickie> = {
  [QU_Verlegung]: new QuickieTemplate(QU_Verlegung,
    'Verlegung', 'Verlegung von <START> nach <ZIEL>.\n',
    [
      {
        key: 'START', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: OP_Hospitals,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital,
      },
      {
        key: 'ZIEL', color: 'success',
        allowOptions: true, allowCustom: true,
        options: OP_Hospitals,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital,
      },
    ]
  ),

  [QU_Einweisung]: new QuickieTemplate(QU_Einweisung,
    'Einweisung', 'Einweisung <ARZT> nach <ZIEL> wg. <KRANKHEIT>.\n',
    [
      {
        key: 'ARZT', color: 'success',
        allowOptions: false, allowCustom: true,
        customLabel: 'Wer?', customPlaceholder: 'z.B. HA Wegner',
        autocorrectFn: correctDoc,
      },
      {
        key: 'ZIEL', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: OP_Hospitals,
        customLabel: 'Wohin?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital,
      },
      {
        key: 'KRANKHEIT', color: 'primary',
        allowOptions: false, allowCustom: true,
        customLabel: 'Was?', customPlaceholder: 'z.B. Thrombose',
        autocorrectFn: basicCap,
      }
    ],
  ),

  [QU_AbdominalPain]: new QuickieAbdominalPain(QU_AbdominalPain, 'Bauchschmerz'),

}
