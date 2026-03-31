import { OptionInput } from "@/components/DodoInputSelect.vue"
import DodoQuickieAbdomonalPain from "@/components/quickie-components/DodoQuickieAbdomonalPain.vue"
import DodoQuickieTemplate from "@/components/quickie-components/DodoQuickieTemplate.vue"
import { basicCap } from "@/utils/autocorrect/basic"
import { correctDoc, correctHospital } from "@/utils/autocorrect/locations"
import { Component, markRaw } from "vue"

// ############################################################################

export const PH_Verlegung = 'verlegung'
export const PH_Einweisung = 'einweisung'

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
    return new RegExp(templatePattern, 'm').test(text)
  }
}

// --------------------------------------------------------

export class QuickieAbdominalPain extends Quickie
{
  constructor(public key: string, public label: string) {
    super(key, label, markRaw(DodoQuickieAbdomonalPain))
  }
  public isAvailable(text: string): boolean {
    return true
  }
}

// ############################################################################

export const DATA_Quickies: Record<string, Quickie> = {
  [PH_Verlegung]: new QuickieTemplate(PH_Verlegung,
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

  [PH_Einweisung]: new QuickieTemplate(PH_Einweisung,
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

}
