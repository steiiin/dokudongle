import type { UnwrapRef } from 'vue'
import { ProtocolCourse, resetProtocol, type Protocol, type ProtocolContext } from '@/types/protocol'
import { TEXT_AREA_BLOCK_SOURCES } from '@/data/blocks/text-area-blocks'
import { protocolValues } from '@/utils/protocol-values'

export const DOKU_GROUPS = [
  { id: 'einsatz', label: 'EINSATZ' },
  { id: 'abcde', label: 'ABCDE' },
  { id: 'sampler', label: 'SAMPLER' },
  { id: 'aufgaben', label: 'AUFGABEN' },
] as const

export type DokuGroupId = typeof DOKU_GROUPS[number]['id']
export type DokuGroup = typeof DOKU_GROUPS[number]

export function visibleDokuGroups(course: ProtocolCourse, context: Pick<ProtocolContext, 'requireABCDE' | 'requireSampler'>): DokuGroup[] {
  return DOKU_GROUPS.filter(group => group.id === 'einsatz' || (
    course !== ProtocolCourse.NEF_VOR_ORT &&
    (group.id === 'abcde' ? context.requireABCDE : group.id === 'sampler' ? context.requireSampler : true)
  ))
}

function groupValues(protocol: UnwrapRef<Protocol>): Record<DokuGroupId, unknown[]> {
  const values: Record<DokuGroupId, unknown[]> = {
    einsatz: [protocol.ident, protocol.course, protocol.flavors, protocol.setting, protocol.situation],
    abcde: [protocol.Xabcde, protocol.xAbcde, protocol.xaBcde, protocol.xabCde, protocol.xabcDe, protocol.xabcdE],
    sampler: [protocol.sampler],
    aufgaben: [protocol.saatreats, protocol.saamed, protocol.treatment, protocol.redflags],
  }

  for (const source of TEXT_AREA_BLOCK_SOURCES) {
    const state = protocol.textAreaBlocks[source.id]
    const { active, ...details } = state
    // Details belong to the group hosting the editor; activation switches belong
    // to the destination textarea (intoxication is edited in D, rendered in PLER).
    const owner = source.id === 'intoxikation' ? 'abcde'
      : source.id === 'verlegung' || source.id === 'einweisung' ? 'einsatz' : 'sampler'
    values[owner].push(details)
    for (const output of source.outputs) {
      const destination = output.target === 'situation' ? 'einsatz'
        : output.target === 'treatment' ? 'aufgaben' : 'sampler'
      values[destination].push(active[output.id] !== false)
    }
  }
  return values
}

// Lazy initialization avoids the protocol classes' existing store import cycle.
let defaultValues: Record<DokuGroupId, string> | undefined

function serializedGroups(protocol: UnwrapRef<Protocol>): Record<DokuGroupId, string> {
  const values = groupValues(protocol)
  return Object.fromEntries(DOKU_GROUPS.map(({ id }) => [id, JSON.stringify(protocolValues(values[id]))])) as Record<DokuGroupId, string>
}

export function editedDokuGroups(protocol: UnwrapRef<Protocol>): Record<DokuGroupId, boolean> {
  defaultValues ??= serializedGroups(resetProtocol())
  const current = serializedGroups(protocol)
  return Object.fromEntries(DOKU_GROUPS.map(({ id }) => [id, current[id] !== defaultValues![id]])) as Record<DokuGroupId, boolean>
}
