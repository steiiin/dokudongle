import { OptionInput } from "@/components/DodoInputSelect.vue"

export type PlaceholderTemplateField = {
  key: string, label: string, color?: string,
  allowOptions?: boolean, allowCustom?: boolean,
  options?: Array<OptionInput>,
  customLabel?: string, customPlaceholder?: string,
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
    template: 'Verlegung von <VonKrankenhaus> nach <ZielKrankenhaus>.',
    fields: [
      {
        key: 'VonKrankenhaus', label: 'Von Krankenhaus', color: 'warning',
        allowOptions: true, allowCustom: true,
        options: [ 'KH Radebeul', 'KH Meißen' ],
        customLabel: 'Welches?', customPlaceholder: 'z.B. FKH Coswig',
      },
      {
        key: 'ZielKrankenhaus', label: 'Ziel Krankenhaus', color: 'success',
      },
    ],
  },
}
