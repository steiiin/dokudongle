import { OptionInput } from "@/components/DodoInputSelect.vue"
import { basicCap } from "@/utils/autocorrect/basic"
import { correctDoc, correctHospital } from "@/utils/autocorrect/locations"

// ############################################################################

export const PH_Verlegung = 'verlegung'
export const PH_Einweisung = 'einweisung'

// ############################################################################

export const OP_Hospitals = [ 'KH Radebeul', 'KH Meißen', 'KH Riesa' ]

// ############################################################################

export type PlaceholderTemplateField = {
  key: string, color?: string,
  allowOptions?: boolean, allowCustom?: boolean,
  options?: Array<OptionInput>,
  customLabel?: string, customPlaceholder?: string,
  autocorrectFn?: (draft: string) => string,
}

export type PlaceholderTemplate = {
  key: string
  label: string
  template: string
  avoidDuplicates?: boolean
  fields: PlaceholderTemplateField[]
}

// ############################################################################

export const INPUT_TEXTAREA_PLACEHOLDERS: Record<string, PlaceholderTemplate> = {
  [PH_Verlegung]: {
    key: PH_Verlegung, label: 'Verlegung',
    template: 'Verlegung von <START> nach <ZIEL>.\n',
    avoidDuplicates: true,
    fields: [
      {
        key: 'START', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: OP_Hospitals,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital
      },
      {
        key: 'ZIEL', color: 'success',
        allowOptions: true, allowCustom: true,
        options: OP_Hospitals,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital
      },
    ],
  },
  [PH_Einweisung]: {
    key: PH_Einweisung, label: 'Einweisung',
    template: 'Einweisung <ARZT> nach <ZIEL> wg. <KRANKHEIT>.\n',
    avoidDuplicates: true,
    fields: [
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
  },
}
