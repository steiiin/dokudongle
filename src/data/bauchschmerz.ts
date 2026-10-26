import { TextAreaBlock } from '@/types/text-area-block'
import type { BauchschmerzBlockSourceState, BauchschmerzDetails, BauchschmerzRegion } from '@/types/bauchschmerz'
import { concatDoku, prefix } from '@/utils/text'
import { prefixSeit } from '@/utils/prefix/general'

interface BauchschmerzOption {
  label: string
  color: string
  value?: string
  prep?: string
}

export const provocationOptions: readonly BauchschmerzOption[] = [
  { label: 'Atmung',              value: 'tiefer Atmung', color: 'primary', prep: 'bei' },
  { label: 'Bewegung',            color: 'warning', prep: 'bei' },
  { label: 'Erschütterung',       color: 'warning', prep: 'bei' },
  { label: 'Lagewechsel',         color: 'warning', prep: 'bei' },
  { label: 'Belastung',           color: 'success', prep: 'bei' },
  { label: 'Nahrungsaufnahme',    color: 'success', prep: 'nach' },
]

export const palliationOptions: readonly BauchschmerzOption[] = [
  { label: 'Ruhe',      value: 'körperl. Schonung', color: 'primary', prep: 'bei' },
  { label: 'Sitzen',    color: 'warning', prep: 'im' },
  { label: 'Stehen',    color: 'warning', prep: 'im' },
  { label: 'Stuhlgang', color: 'success', prep: 'nach' },
  { label: 'Erbrechen', color: 'success', prep: 'nach' },
]

export const qualityOptions: readonly BauchschmerzOption[] = [
  { label: 'brennend',      color: 'primary' },
  { label: 'stechend',      color: 'primary' },
  { label: 'dumpf',         color: 'success' },
  { label: 'drückend',      color: 'success' },
  { label: 'ziehend',       color: 'success' },
  { label: 'krampfartig',   color: 'warning' },
  { label: 'wellenförmig',  color: 'warning' },
]

export const radiationOptions: readonly BauchschmerzOption[] = [

  { label: 'Flanke re.',      color: 'primary', value: 're. Flanke' },
  { label: 'Flanke li.',      color: 'primary', value: 'li. Flanke' },
  { label: 'Schulter re.',    color: 'primary', value: 're. Schulter' },
  { label: 'Schulter li.',    color: 'primary', value: 'li. Schulter' },

  { label: 'Leiste re.',      color: 'success', value: 're. Leiste' },
  { label: 'Leiste li.',      color: 'success', value: 'li. Leiste' },
  { label: 'Genitalregion',   color: 'success' },

  { label: 'Thorax',          color: 'warning' },

  { label: 'Rücken',          color: 'danger' },
  { label: 'oberer Rücken',   color: 'danger', value: 'oberen Rücken' },
  { label: 'unterer Rücken',  color: 'danger', value: 'unteren Rücken' },
  { label: 'Schulterblätter', color: 'danger', value: 'zwischen die Schulterblätter' },

]

export const timeOptions: readonly BauchschmerzOption[] = [
  { label: 'Erstmalig',       value: 'erstmalig',                    color: 'primary' },
  { label: 'Früher Ähnlich',  value: 'bereits ähnlich aufgetreten',  color: 'warning' },
  { label: 'Früher Milder',   value: 'bereits milder aufgetreten',   color: 'warning' },
  { label: 'Wiederholt',      value: 'bereits mehrfach aufgetreten', color: 'warning' },
  { label: 'Zunehmend',       value: 'stetig zunehmend',    color: 'success' },
  { label: 'Gleichbleibend',  value: 'Intensität konstant', color: 'success' },
]

export const severityOptions = [
  { value: 'minimal', label: 'Minimal (0-1)' },
  { value: 'leicht', label: 'Leicht (2-3)' },
  { value: 'mittel', label: 'Mittel (4-6)' },
  { value: 'stark', label: 'Stark (7-8)' },
  { value: 'maximal', label: 'Maximal (9-10)' },
]

const severityDescriptions = {
  minimal: 'NRS 0-1', leicht: 'NRS 2-3', mittel: 'NRS 4-6', stark: 'NRS 7-8', maximal: 'NRS 9-10',
}

export function createBauchschmerzBlockState(): BauchschmerzBlockSourceState {
  return {
    values: {},
    active: { 'bauchschmerz.symptoms': true },
    details: {
      region: { obli: false, obmi: false, obre: false, mbli: false, mbmi: false, mbre: false,
        ubli: false, ubmi: false, ubre: false },
      onset: '', onspan: '', provocation: [], palliation: [], quality: [],
      radiation: [], severity: '', time: [],
    },
  }
}

function joinWithAnd(values: string[]): string {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} & ${values[values.length - 1]}`
}

function modifiersText(selected: string[], options: readonly BauchschmerzOption[], suffix: string): string {
  const groups: Record<string, string[]> = {}
  for (const entry of options.filter(entry => selected.includes(entry.label))) {
    if (!entry.prep) continue
    ;(groups[entry.prep] ??= []).push(entry.value ?? entry.label)
  }
  const singlePrep = Object.keys(groups).length <= 1
  const segments = Object.entries(groups).map(([prep, values]) =>
    `${prep} ${singlePrep ? joinWithAnd(values) : values.join(', ')}`)
  return segments.length ? `${segments.join(' & ')} ${suffix}` : ''
}

export function renderBauchschmerzRegion(region: BauchschmerzRegion): string {
  return Object.assign(new AbdominalRegion(), region).regionText
}

export function renderBauchschmerzText(details: BauchschmerzDetails): string {
  const selected = (options: readonly BauchschmerzOption[], values: string[]) =>
    options.filter(entry => values.includes(entry.label)).map(entry => entry.value ?? entry.label)
  return prefix('Bauchschmerz:', concatDoku([
    renderBauchschmerzRegion(details.region),
    details.severity ? severityDescriptions[details.severity] : '',
    [prefixSeit(details.onspan), details.onset],
    modifiersText(details.provocation, provocationOptions, 'schlimmer'),
    modifiersText(details.palliation, palliationOptions, 'besser'),
    selected(qualityOptions, details.quality),
    prefix('strahlt aus in', joinWithAnd(selected(radiationOptions, details.radiation))),
    selected(timeOptions, details.time).join(', '),
  ]))
}

/** Only structured details are persisted; the output is computed when rendered. */
export class BauchschmerzTextAreaBlock extends TextAreaBlock {
  constructor() {
    super('bauchschmerz.symptoms', 'bauchschmerz', 'sampler.symptoms.additionalSymptoms',
      '<TEXT>', [{ key: 'TEXT' }], false, 'tertiary')
  }

  override render(state: BauchschmerzBlockSourceState) {
    return super.render({ ...state, values: { TEXT: renderBauchschmerzText(state.details) } })
  }
}

class AbdominalRegion {

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

    if (!this._structured.some(Boolean)) return ''

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

    const regions: Array<string> = []
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

