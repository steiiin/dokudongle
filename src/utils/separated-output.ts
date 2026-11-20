import { textEdits } from '@/utils/preview-document'

export const OUTPUT_BLOCKS = {
  setting: 'Umgebung',
  situation: 'Situation',
  abcde: 'ABCDE',
  sampler: 'S/A/M/PLER',
  contacts: 'Angehörigenkontakte',
  representation: 'Vertretung',
  measures: 'Maßnahmen+Einwilligung',
  course: 'Verlauf',
  explanation: 'Aufklärung',
} as const

export type OutputBlockId = keyof typeof OUTPUT_BLOCKS
export interface OutputGroup { id: string; name: string; blocks: OutputBlockId[] }
export interface OutputSettings { version: 1; enabled: boolean; groups: OutputGroup[] }
export interface OutputSpan { block: OutputBlockId; start: number; end: number }
export interface GeneratedOutput { text: string; spans: OutputSpan[] }
export interface OutputGroupText extends OutputGroup { text: string }
export interface OutputProgress { revision: string; sentGroupIds: string[] }

export function defaultOutputSettings(): OutputSettings {
  return {
    version: 1, enabled: false,
    groups: [
      { id: 'anamnesis', name: 'ANAMNESE', blocks: ['setting', 'situation', 'abcde', 'sampler', 'contacts', 'representation'] },
      { id: 'measures', name: 'MAẞNAHMEN', blocks: ['measures', 'explanation'] },
      { id: 'course', name: 'VERLAUF', blocks: ['course'] },
    ],
  }
}

export function validOutputGroups(groups: OutputGroup[]): boolean {
  const names = groups.map(group => group.name.trim().toLocaleUpperCase('de-DE'))
  const blocks = groups.flatMap(group => group.blocks)
  return groups.length > 0 && names.every(Boolean) && new Set(names).size === names.length
    && groups.every(group => Boolean(group.id)) && new Set(groups.map(group => group.id)).size === groups.length
    && blocks.length === Object.keys(OUTPUT_BLOCKS).length
    && new Set(blocks).size === blocks.length && blocks.every(block => Object.hasOwn(OUTPUT_BLOCKS, block))
}

export function hydrateOutputSettings(value: unknown): OutputSettings {
  if (!value || typeof value !== 'object') return defaultOutputSettings()
  const candidate = value as OutputSettings
  if (candidate.version !== 1 || typeof candidate.enabled !== 'boolean' || !Array.isArray(candidate.groups)
    || !candidate.groups.every(group => group && typeof group.id === 'string' && typeof group.name === 'string'
      && Array.isArray(group.blocks)) || !validOutputGroups(candidate.groups)) return defaultOutputSettings()
  return { version: 1, enabled: candidate.enabled, groups: candidate.groups.map(group => ({
    id: group.id, name: group.name.trim(), blocks: [...group.blocks],
  })) }
}

/** Build the legacy text and ownership together, retaining its exact separators. */
export function outputFromFragments(fragments: { block: OutputBlockId; text: string }[]): GeneratedOutput {
  const raw = fragments.map(fragment => fragment.text).join('')
  const leading = raw.length - raw.trimStart().length
  const text = raw.trim()
  let offset = -leading
  const spans = fragments.flatMap(fragment => {
    const start = Math.max(0, offset)
    offset += fragment.text.length
    const end = Math.min(text.length, offset)
    return end > start ? [{ block: fragment.block, start, end }] : []
  })
  return { text, spans }
}

/** Project the effective preview, never regenerating or dropping a user's edits. */
export function projectOutputBlocks(generated: GeneratedOutput, edited: string): Record<OutputBlockId, string> {
  const result = Object.fromEntries(Object.keys(OUTPUT_BLOCKS).map(id => [id, ''])) as Record<OutputBlockId, string>
  const appendUnchanged = (start: number, end: number) => {
    for (const span of generated.spans) {
      const from = Math.max(start, span.start)
      const to = Math.min(end, span.end)
      if (to > from) result[span.block] += generated.text.slice(from, to)
    }
  }
  let cursor = 0
  for (const edit of textEdits(generated.text, edited)) {
    appendUnchanged(cursor, edit.start)
    // At an insertion boundary prefer the preceding span. Replacements belong
    // to the first span they actually replace, including cross-block edits.
    const owner = edit.start === edit.end
      ? generated.spans.find(span => span.start < edit.start && span.end >= edit.start)
      : generated.spans.find(span => span.end > edit.start && span.start < edit.end)
    const block = owner?.block ?? generated.spans[0]?.block ?? 'situation'
    result[block] += edit.text
    cursor = edit.end
  }
  appendUnchanged(cursor, generated.text.length)
  return result
}

export function assembleOutputGroups(groups: OutputGroup[], generated: GeneratedOutput, edited: string): OutputGroupText[] {
  const blocks = projectOutputBlocks(generated, edited)
  return groups.map(group => ({ ...group, text: group.blocks.map(id => blocks[id].trim()).filter(Boolean).join('\n\n') }))
}

export type OutputRow = { kind: 'group'; groupId: string } | { kind: 'block'; block: OutputBlockId }
export function outputRows(groups: OutputGroup[]): OutputRow[] {
  return groups.flatMap(group => [
    { kind: 'group', groupId: group.id } as OutputRow,
    ...group.blocks.map(block => ({ kind: 'block', block }) as OutputRow),
  ])
}

/** A single reorder surface supports cross-group drops without nested drag zones. */
export function reorderOutputGroups(groups: OutputGroup[], from: number, to: number): OutputGroup[] {
  const next = groups.map(group => ({ ...group, blocks: [...group.blocks] }))
  const rows = outputRows(next)
  const source = rows[from]
  if (!source || !rows[to] || from === to) return next
  if (source.kind === 'group') {
    const sourceIndex = next.findIndex(group => group.id === source.groupId)
    let targetIndex = 0
    for (let i = 0; i <= to; i++) if (rows[i].kind === 'group') targetIndex++
    const [group] = next.splice(sourceIndex, 1)
    next.splice(targetIndex - 1, 0, group)
    return next
  }
  rows.splice(from, 1)
  rows.splice(Math.max(1, to), 0, source)
  next.forEach(group => { group.blocks = [] })
  let current = next[0]
  for (const row of rows) {
    if (row.kind === 'group') current = next.find(group => group.id === row.groupId)!
    else current.blocks.push(row.block)
  }
  return next
}

export function removeOutputGroup(groups: OutputGroup[], id: string): OutputGroup[] {
  if (groups.length <= 1) return groups
  const next = groups.map(group => ({ ...group, blocks: [...group.blocks] }))
  const index = next.findIndex(group => group.id === id)
  if (index < 0) return next
  const [removed] = next.splice(index, 1)
  next[Math.max(0, index - 1)].blocks.push(...removed.blocks)
  return next
}
