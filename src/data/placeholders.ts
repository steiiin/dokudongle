import { OptionInput } from "@/components/DodoInputSelect.vue"
import { basicCap } from "@/utils/autocorrect/basic"

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

export const INPUT_TEXTAREA_PLACEHOLDERS: Record<string, PlaceholderTemplate> = {
  verlegung: {
    key: 'verlegung',
    label: 'Verlegung',
    template: 'Verlegung von <START> nach <ZIEL>.',
    fields: [
      {
        key: 'START', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: [ 'KH Radebeul', 'KH Meißen' ],
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
      },
      {
        key: 'ZIEL', color: 'success',
        autocorrectFn: basicCap,
      },
    ],
  },
}
