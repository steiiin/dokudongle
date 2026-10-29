import DodoQuickieOPRST from "@/components/quickie-components/DodoQuickieOPRST.vue"
import DodoQuickieTemplate from "@/components/quickie-components/DodoQuickieTemplate.vue"

import { Component, markRaw } from "vue"
import { TEXT_AREA_BLOCK_SOURCES } from "@/data/blocks/text-area-blocks"

// ############################################################################

export const QU_SIT_Verlegung = 'verlegung'
export const QU_SIT_Einweisung = 'einweisung'

export const QU_SYM_OPQRST = 'intern_opqrst'

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

// ############################################################################

const buildQuickies = (): Record<string, Quickie> => ({
  ...Object.fromEntries(TEXT_AREA_BLOCK_SOURCES
    .filter(source => source.id === QU_SIT_Verlegung || source.id === QU_SIT_Einweisung)
    .map(source => [source.id,
    new QuickieTemplate(source.id, source.id === QU_SIT_Verlegung ? 'Verlegung' : 'Einweisung',
      source.outputs[0].template, source.fields),
  ])),

  [QU_SYM_OPQRST]: new QuickieOPQRST(QU_SYM_OPQRST, 'OPQRST'),

})

export const DATA_Quickies: Record<string, Quickie> = buildQuickies()

export function resetQuickies(): void {
  const nextQuickies = buildQuickies()

  for (const key of Object.keys(DATA_Quickies)) {
    delete DATA_Quickies[key]
  }

  Object.assign(DATA_Quickies, nextQuickies)
}
