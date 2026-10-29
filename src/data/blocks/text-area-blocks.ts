import { TextAreaBlock, type TextAreaBlockField, type TextAreaBlockSourceState } from '@/types/blocks/text-area-block'
import type { SchwangerschaftBlockSourceState } from '@/types/blocks/schwangerschaft'
import { createSchwangerschaftBlockState, SchwangerschaftTextAreaBlock } from '@/data/blocks/schwangerschaft'
import type { SchwindelBlockSourceState } from '@/types/blocks/schwindel'
import { createSchwindelBlockState, SchwindelTextAreaBlock } from '@/data/blocks/schwindel'
import type { BauchschmerzBlockSourceState } from '@/types/blocks/bauchschmerz'
import { createBauchschmerzBlockState, BauchschmerzTextAreaBlock } from '@/data/blocks/bauchschmerz'
import type { ExcretionsBowelsBlockSourceState, ExcretionsUrinaryBlockSourceState } from '@/types/blocks/excretions'
import {
  createExcretionsBowelsBlockState, createExcretionsUrinaryBlockState,
  ExcretionsBowelsTextAreaBlock, ExcretionsUrinaryTextAreaBlock,
} from '@/data/blocks/excretions'

export type TextAreaBlockState = Record<string, TextAreaBlockSourceState> & {
  schwangerschaft: SchwangerschaftBlockSourceState
  schwindel: SchwindelBlockSourceState
  excretions_bowel: ExcretionsBowelsBlockSourceState
  excretions_urinary: ExcretionsUrinaryBlockSourceState
  bauchschmerz: BauchschmerzBlockSourceState
}

interface BlockSourceProtocol {
  flavors: { verlegung: boolean; einweisung: boolean }
  xabcDe: { dizziness: 'kein' | 'ungerichteter' | 'gerichteter' }
  xabcdE: {
    pregnancy: { isAssessed: boolean; value: boolean }
    abdominal: { isAssessed: boolean; value: { pain: 'keine' | 'leichte' | '' | 'starke' } }
    excretions: { isAssessed: boolean; value: { bowelAbnormalities: boolean; urinaryAbnormalities: boolean } }
  }
  textAreaBlocks: TextAreaBlockState
}

export interface TextAreaBlockSource {
  id: string
  fields: TextAreaBlockField[]
  outputs: TextAreaBlock[]
  isAvailable: (protocol: BlockSourceProtocol) => boolean
  createState?: () => TextAreaBlockSourceState
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
    isAvailable: protocol => protocol.flavors.verlegung,
    outputs: [new TextAreaBlock('verlegung.situation', 'verlegung', 'situation',
      'Verlegung von <START> nach <ZIEL>.\n', verlegungFields, false, 'primary')],
  },
  {
    id: 'einweisung', fields: einweisungFields,
    isAvailable: protocol => protocol.flavors.einweisung,
    outputs: [new TextAreaBlock('einweisung.situation', 'einweisung', 'situation',
      'Einweisung <ARZT> nach <ZIEL> wg. <KRANKHEIT>.\n', einweisungFields, false, 'tertiary')],
  },
  {
    id: 'schwindel', fields: [],
    isAvailable: protocol => protocol.xabcDe.dizziness === 'gerichteter',
    createState: createSchwindelBlockState,
    outputs: [new SchwindelTextAreaBlock()],
  },
  {
    id: 'excretions_bowel', fields: [],
    isAvailable: protocol => protocol.xabcdE.excretions.isAssessed && protocol.xabcdE.excretions.value.bowelAbnormalities,
    createState: createExcretionsBowelsBlockState,
    outputs: [new ExcretionsBowelsTextAreaBlock()],
  },
  {
    id: 'excretions_urinary', fields: [],
    isAvailable: protocol => protocol.xabcdE.excretions.isAssessed && protocol.xabcdE.excretions.value.urinaryAbnormalities,
    createState: createExcretionsUrinaryBlockState,
    outputs: [new ExcretionsUrinaryTextAreaBlock()],
  },
  {
    id: 'bauchschmerz', fields: [],
    isAvailable: protocol => protocol.xabcdE.abdominal.isAssessed && protocol.xabcdE.abdominal.value.pain !== 'keine',
    createState: createBauchschmerzBlockState,
    outputs: [new BauchschmerzTextAreaBlock()],
  },
  {
    id: 'schwangerschaft', fields: [],
    isAvailable: protocol => protocol.xabcdE.pregnancy.isAssessed && protocol.xabcdE.pregnancy.value,
    createState: createSchwangerschaftBlockState,
    outputs: [new SchwangerschaftTextAreaBlock()],
  },
]

export function createTextAreaBlockSourceState(source: TextAreaBlockSource): TextAreaBlockSourceState {
  if (source.createState) return source.createState()
  return {
    values: Object.fromEntries(source.fields.map(field => [field.key, ''])),
    active: Object.fromEntries(source.outputs.map(output => [output.id, true])),
  }
}

export function createTextAreaBlockState(): TextAreaBlockState {
  return Object.fromEntries(TEXT_AREA_BLOCK_SOURCES.map(source => [source.id, createTextAreaBlockSourceState(source)])) as TextAreaBlockState
}

export function resolveTextAreaBlocks(protocol: BlockSourceProtocol) {
  return TEXT_AREA_BLOCK_SOURCES.filter(source => source.isAvailable(protocol)).flatMap(source =>
    source.outputs.flatMap(output => {
      const block = output.render(protocol.textAreaBlocks[source.id])
      return block ? [block] : []
    }))
}
