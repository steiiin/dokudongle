import DodoQuickieExcretionsBowels from "@/components/quickie-components/DodoQuickieExcretionsBowels.vue"
import DodoQuickieExcretionsUrinary from "@/components/quickie-components/DodoQuickieExcretionsUrinary.vue"
import DodoQuickieOPRST from "@/components/quickie-components/DodoQuickieOPRST.vue"
import DodoQuickieSchwangerschaft from "@/components/quickie-components/DodoQuickieSchwangerschaft.vue"
import DodoQuickieTemplate from "@/components/quickie-components/DodoQuickieTemplate.vue"
import { AssessedValue, OptionalValue } from "@/types/protocol/input"
import { PregnancySpan } from "@/types/protocol/pregnancy"

import { Component, markRaw } from "vue"
import { TEXT_AREA_BLOCK_SOURCES } from "@/data/text-area-blocks"

// ############################################################################

export const QU_SIT_Verlegung = 'verlegung'
export const QU_SIT_Einweisung = 'einweisung'

export const QU_SYM_ExcretionsUrinary = 'excretions_urinary'
export const QU_SYM_ExcretionsBowel = 'excretions_bowel'

export const QU_SYM_OPQRST = 'intern_opqrst'

export const QU_PLER_Schwangerschaft = 'pler_schwangerschaft'

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
  customPlaceholder?: string,
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

export class QuickieExcretionsUrinary extends Quickie
{
  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieExcretionsUrinary))
  }
  public isAvailable(text: string): boolean {
    return !text.includes('Wasserlassen: ')
  }

  public catheterIssues: '' | 'disloziert' | 'gezogen' | 'verstopft' = ''
  public output: string[] = []
  public pain: string[] = []

  public hematuria: '' | 'minimal Blut im Urin' | 'etwas Blut im Urin' | 'viel Blut im Urin' = ''
  public anomalies: string[] = []

}

export class QuickieExcretionsBowels extends Quickie
{
  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieExcretionsBowels))
  }
  public isAvailable(text: string): boolean {
    return !text.includes('Stuhlgang: ')
  }

  public pattern: '' | 'Obstipation' | 'Durchfall' = ''
  public consistency: '' | 'kügelchenförmig' | 'hart' | 'geformt' | 'breiig' | 'wässrig' = ''
  public lastBowel: OptionalValue<string> = OptionalValue.inactive('')
  public bowelSounds: '' | 'normal' | 'vermehrt' | 'vermindert' | 'fehlend' | 'hochgestellt' = ''
  public blood: '' | 'kein Blut' | 'Blut am Klopapier' | 'Blut im Stuhl' | 'Teerstuhl' = ''
  public bowelPain: boolean = false

}

// --------------------------------------------------------

export class QuickieOPQRST extends Quickie
{
  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieOPRST))
  }
  public isAvailable(text: string): boolean {
    return !this.symptom || !text.includes(this.symptom)
  }

  public symptom: string = ''
  public onset: string = ''
  public provocation: string = ''
  public palliation: string = ''
  public radiation: string = ''
  public quality: string = ''
  public severity: string = ''
  public time: string = ''

}

// --------------------------------------------------------

export class QuickieSchwangerschaft extends Quickie
{

  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieSchwangerschaft))
  }
  public isAvailable(text: string): boolean {
    return !text.includes('Schwangerschaft: ')
  }

  public gravida: AssessedValue<number> = AssessedValue.unassessed(1)
  public para: AssessedValue<number> = AssessedValue.unassessed(0)

  public presentation: '' | 'SL'|'BEL'|'QL' = ''
  public amnioticFluid: string = ''
  public childCount: string = ''
  public calculatedTerm: PregnancySpan = new PregnancySpan('1. Trimenon')

}

// ############################################################################

const buildQuickies = (): Record<string, Quickie> => ({
  ...Object.fromEntries(TEXT_AREA_BLOCK_SOURCES
    .filter(source => source.id === QU_SIT_Verlegung || source.id === QU_SIT_Einweisung)
    .map(source => [source.id,
    new QuickieTemplate(source.id, source.id === QU_SIT_Verlegung ? 'Verlegung' : 'Einweisung',
      source.outputs[0].template, source.fields),
  ])),

  [QU_SYM_ExcretionsUrinary]: new QuickieExcretionsUrinary(QU_SYM_ExcretionsUrinary, 'Wasserlassen'),
  [QU_SYM_ExcretionsBowel]: new QuickieExcretionsBowels(QU_SYM_ExcretionsBowel, 'Stuhlgang'),

  [QU_SYM_OPQRST]: new QuickieOPQRST(QU_SYM_OPQRST, 'OPQRST'),

  [QU_PLER_Schwangerschaft]: new QuickieSchwangerschaft(QU_PLER_Schwangerschaft, 'Schwangerschaft'),

})

export const DATA_Quickies: Record<string, Quickie> = buildQuickies()

export function resetQuickies(): void {
  const nextQuickies = buildQuickies()

  for (const key of Object.keys(DATA_Quickies)) {
    delete DATA_Quickies[key]
  }

  Object.assign(DATA_Quickies, nextQuickies)
}
