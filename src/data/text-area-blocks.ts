import { TextAreaBlock, type TextAreaBlockField, type TextAreaBlockSourceState } from '@/types/text-area-block'

export interface TextAreaBlockSource {
  id: 'verlegung' | 'einweisung'
  fields: TextAreaBlockField[]
  outputs: TextAreaBlock[]
}

const verlegungFields: TextAreaBlockField[] = [
  { key: 'START', color: 'warning', customPlaceholder: 'z.B. FKH Coswig' },
  { key: 'ZIEL', color: 'success', customPlaceholder: 'z.B. FKH Coswig' },
]
const einweisungFields: TextAreaBlockField[] = [
  { key: 'ARZT', color: 'success', customPlaceholder: 'z.B. HA Wegner' },
  { key: 'ZIEL', color: 'warning', customPlaceholder: 'z.B. FKH Coswig' },
  { key: 'KRANKHEIT', color: 'primary', customPlaceholder: 'z.B. Thrombose' },
]

export const TEXT_AREA_BLOCK_SOURCES: readonly TextAreaBlockSource[] = [
  {
    id: 'verlegung', fields: verlegungFields,
    outputs: [new TextAreaBlock('verlegung.situation', 'verlegung', 'situation',
      'Verlegung von <START> nach <ZIEL>.\n', verlegungFields, false, 'primary')],
  },
  {
    id: 'einweisung', fields: einweisungFields,
    outputs: [new TextAreaBlock('einweisung.situation', 'einweisung', 'situation',
      'Einweisung <ARZT> nach <ZIEL> wg. <KRANKHEIT>.\n', einweisungFields, false, 'tertiary')],
  },
]

export function createTextAreaBlockSourceState(source: TextAreaBlockSource): TextAreaBlockSourceState {
  return {
    values: Object.fromEntries(source.fields.map(field => [field.key, ''])),
    active: Object.fromEntries(source.outputs.map(output => [output.id, true])),
  }
}

export function createTextAreaBlockState(): Record<string, TextAreaBlockSourceState> {
  return Object.fromEntries(TEXT_AREA_BLOCK_SOURCES.map(source => [source.id, createTextAreaBlockSourceState(source)]))
}

export function resolveTextAreaBlocks(protocol: {
  flavors: { verlegung: boolean; einweisung: boolean }
  textAreaBlocks: Record<string, TextAreaBlockSourceState>
}) {
  return TEXT_AREA_BLOCK_SOURCES.filter(source => protocol.flavors[source.id]).flatMap(source =>
    source.outputs.flatMap(output => {
      const block = output.render(protocol.textAreaBlocks[source.id])
      return block ? [block] : []
    }))
}
