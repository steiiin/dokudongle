import { OptionInput } from "@/components/DodoInputSelect.vue"
import { basicCap } from "@/utils/autocorrect/basic"
import { correctHospital } from "@/utils/autocorrect/locations"

// ############################################################################

export const PH_VERLEGUNG = 'verlegung'

// ############################################################################

export const OP_HOSPITALS = [ 'KH Radebeul', 'KH Meißen', 'KH Riesa' ]

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
  fields: PlaceholderTemplateField[]
}

// ############################################################################

export const INPUT_TEXTAREA_PLACEHOLDERS: Record<string, PlaceholderTemplate> = {
  [PH_VERLEGUNG]: {
    key: PH_VERLEGUNG,
    label: 'Verlegung',
    template: 'Verlegung von <START> nach <ZIEL>.',
    fields: [
      {
        key: 'START', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: OP_HOSPITALS,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital
      },
      {
        key: 'ZIEL', color: 'success',
        allowOptions: true, allowCustom: true,
        options: OP_HOSPITALS,
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
        autocorrectFn: correctHospital
      },
    ],
  },
}
