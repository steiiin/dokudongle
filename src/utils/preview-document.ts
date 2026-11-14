export interface PreviewConflict {
  id: string
  start: number
  end: number
  baseStart: number
  baseEnd: number
  userText: string
  generatedText: string
}

export interface PreviewDocument {
  baseline: string
  text: string
  conflicts: PreviewConflict[]
  nextConflictId: number
}

interface Edit { start: number; end: number; text: string }
interface MergeEdit extends Edit { side: 'user' | 'generated'; conflict?: PreviewConflict }

export function createPreviewDocument(text: string): PreviewDocument {
  return { baseline: text, text, conflicts: [], nextConflictId: 1 }
}

const tokenize = (text: string): string[] => text.match(/[\p{L}\p{N}\p{M}_]+|\s+|[^\p{L}\p{N}\p{M}_\s]/gu) ?? []

// Myers' shortest edit path. Offsets are UTF-16 offsets, matching textarea selections.
// Bound pathological diffs; a conservative replacement is safer than freezing the editor.
export function textEdits(before: string, after: string, characters = false): Edit[] {
  if (before === after) return []
  const a = characters ? Array.from(before) : tokenize(before)
  const b = characters ? Array.from(after) : tokenize(after)
  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
  let suffix = 0
  while (suffix < a.length - prefix && suffix < b.length - prefix
    && a[a.length - suffix - 1] === b[b.length - suffix - 1]) suffix++
  const left = a.slice(prefix, a.length - suffix)
  const right = b.slice(prefix, b.length - suffix)
  const offset = a.slice(0, prefix).join('').length
  const fallback = () => [{ start: offset, end: offset + left.join('').length, text: right.join('') }]
  if (!left.length || !right.length) return fallback()
  const trace: Map<number, number>[] = []
  const frontier = new Map<number, number>([[1, 0]])
  let work = 0
  for (let distance = 0; distance <= left.length + right.length; distance++) {
    trace.push(new Map(frontier))
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      if (++work > 250_000) return fallback()
      let x = diagonal === -distance || (diagonal !== distance
        && (frontier.get(diagonal - 1) ?? -1) < (frontier.get(diagonal + 1) ?? -1))
        ? frontier.get(diagonal + 1) ?? 0 : (frontier.get(diagonal - 1) ?? 0) + 1
      let y = x - diagonal
      while (x < left.length && y < right.length && left[x] === right[y]) { x++; y++ }
      frontier.set(diagonal, x)
      if (x < left.length || y < right.length) continue
      const operations: { kind: 'equal' | 'delete' | 'insert'; text: string }[] = []
      for (let d = distance; d >= 0; d--) {
        const previous = trace[d]
        const k = x - y
        const previousK = k === -d || (k !== d
          && (previous.get(k - 1) ?? -1) < (previous.get(k + 1) ?? -1)) ? k + 1 : k - 1
        const previousX = previous.get(previousK) ?? 0
        const previousY = previousX - previousK
        while (x > previousX && y > previousY) {
          operations.push({ kind: 'equal', text: left[--x] }); y--
        }
        if (d > 0) {
          if (x === previousX) operations.push({ kind: 'insert', text: right[--y] })
          else operations.push({ kind: 'delete', text: left[--x] })
        }
      }
      const edits: Edit[] = []
      let position = offset
      let pending: Edit | undefined
      for (const operation of operations.reverse()) {
        if (operation.kind === 'equal') {
          if (pending) edits.push(pending)
          pending = undefined
          position += operation.text.length
        } else {
          pending ??= { start: position, end: position, text: '' }
          if (operation.kind === 'insert') pending.text += operation.text
          else { position += operation.text.length; pending.end = position }
        }
      }
      if (pending) edits.push(pending)
      return edits
    }
  }
  return fallback()
}

function overlaps(a: Edit, b: Edit, inclusive = false): boolean {
  if (inclusive) return a.start <= b.end && b.start <= a.end
  if (a.start === a.end && b.start === b.end) return a.start === b.start
  if (a.start === a.end) return a.start > b.start && a.start < b.end
  if (b.start === b.end) return b.start > a.start && b.start < a.end
  return a.start < b.end && b.start < a.end
}

function applyEdits(text: string, edits: Edit[], start = 0, end = text.length): string {
  let cursor = start
  let result = ''
  for (const edit of [...edits].sort((a, b) => a.start - b.start || a.end - b.end)) {
    result += text.slice(cursor, edit.start) + edit.text
    cursor = edit.end
  }
  return result + text.slice(cursor, end)
}

export function reconcilePreview(document: PreviewDocument | null, generated: string): PreviewDocument {
  if (!document) return createPreviewDocument(generated)
  if (document.baseline === generated) return document
  const base = document.baseline
  // Restore the retained user alternatives before diffing. No-op generated edits keep
  // unresolved conflicts visible even when subsequent generation changes another passage.
  const intended = applyEdits(document.text, document.conflicts.map(conflict => ({
    start: conflict.start, end: conflict.end, text: conflict.userText,
  })))
  const edits: MergeEdit[] = [
    ...textEdits(base, intended).map(edit => ({ ...edit, side: 'user' as const })),
    ...textEdits(base, generated).map(edit => ({ ...edit, side: 'generated' as const })),
    ...document.conflicts.map(conflict => ({
      start: conflict.baseStart, end: conflict.baseEnd,
      text: base.slice(conflict.baseStart, conflict.baseEnd), side: 'generated' as const, conflict,
    })),
  ].sort((a, b) => a.start - b.start || a.end - b.end)
  const groups: MergeEdit[][] = []
  for (const edit of edits) {
    const matching = groups.filter(group => group.some(other => overlaps(edit, other,
      !!(edit.conflict && edit.start === edit.end || other.conflict && other.start === other.end))))
    const combined = [...matching.flat(), edit]
    for (const group of matching) groups.splice(groups.indexOf(group), 1)
    groups.push(combined)
  }
  groups.sort((a, b) => Math.min(...a.map(e => e.start)) - Math.min(...b.map(e => e.start)))
  let text = ''
  let cursor = 0
  let generatedOffset = 0
  let nextConflictId = document.nextConflictId
  const conflicts: PreviewConflict[] = []
  for (const group of groups) {
    const start = Math.min(...group.map(edit => edit.start))
    const end = Math.max(...group.map(edit => edit.end))
    text += base.slice(cursor, start)
    generatedOffset += start - cursor
    const userEdits = group.filter(edit => edit.side === 'user')
    const generatedEdits = group.filter(edit => edit.side === 'generated' && !edit.conflict)
    const userText = applyEdits(base, userEdits, start, end)
    const generatedText = applyEdits(base, generatedEdits, start, end)
    const hasGeneratedChange = group.some(edit => edit.side === 'generated')
    const replacement = hasGeneratedChange ? generatedText : userText
    if (userEdits.length && hasGeneratedChange && userText !== generatedText) {
      const previous = group.find(edit => edit.conflict)?.conflict
      conflicts.push({
        id: previous?.id ?? `conflict-${nextConflictId++}`,
        start: text.length, end: text.length + generatedText.length,
        baseStart: generatedOffset, baseEnd: generatedOffset + generatedText.length,
        userText, generatedText,
      })
    }
    text += replacement
    generatedOffset += generatedText.length
    cursor = end
  }
  text += base.slice(cursor)
  return { baseline: generated, text, conflicts, nextConflictId }
}

export function editPreview(document: PreviewDocument, text: string): PreviewDocument {
  if (text === document.text) return document
  const edits = textEdits(document.text, text, true)
  const conflicts = document.conflicts.flatMap(conflict => {
    const range = { start: conflict.start, end: conflict.end, text: '' }
    if (edits.some(edit => overlaps(edit, range, conflict.start === conflict.end))) return []
    const shift = edits.filter(edit => edit.end <= conflict.start)
      .reduce((sum, edit) => sum + edit.text.length - (edit.end - edit.start), 0)
    return [{ ...conflict, start: conflict.start + shift, end: conflict.end + shift }]
  })
  return { ...document, text, conflicts }
}

export function resolvePreviewConflict(document: PreviewDocument, id: string, choice: 'user' | 'generated'): PreviewDocument {
  const conflict = document.conflicts.find(item => item.id === id)
  if (!conflict) return document
  const without = { ...document, conflicts: document.conflicts.filter(item => item.id !== id) }
  return choice === 'generated' ? without : editPreview(without,
    document.text.slice(0, conflict.start) + conflict.userText + document.text.slice(conflict.end))
}

export function hasPreviewEdits(document: PreviewDocument | null): boolean {
  return !!document && (document.text !== document.baseline || document.conflicts.length > 0)
}

export function hydratePreview(input: unknown): PreviewDocument | null {
  if (!input || typeof input !== 'object') return null
  const value = input as PreviewDocument
  if (typeof value.baseline !== 'string' || typeof value.text !== 'string') return null
  const ids = new Set<string>()
  let lastEnd = 0
  let lastBaseEnd = 0
  const conflicts = Array.isArray(value.conflicts) ? value.conflicts.filter(conflict => {
    if (!conflict || typeof conflict.id !== 'string' || ids.has(conflict.id)
      || typeof conflict.userText !== 'string' || typeof conflict.generatedText !== 'string'
      || ![conflict.start, conflict.end, conflict.baseStart, conflict.baseEnd].every(Number.isInteger)
      || conflict.start < lastEnd || conflict.end < conflict.start || conflict.end > value.text.length
      || conflict.baseStart < lastBaseEnd || conflict.baseEnd < conflict.baseStart || conflict.baseEnd > value.baseline.length
      || value.text.slice(conflict.start, conflict.end) !== conflict.generatedText
      || value.baseline.slice(conflict.baseStart, conflict.baseEnd) !== conflict.generatedText) return false
    ids.add(conflict.id)
    lastEnd = conflict.end
    lastBaseEnd = conflict.baseEnd
    return true
  }).map(conflict => ({ ...conflict })) : []
  const highestId = Math.max(0, ...conflicts.map(conflict => Number(conflict.id.replace(/^conflict-/, '')) || 0))
  return {
    baseline: value.baseline, text: value.text, conflicts,
    nextConflictId: Math.max(highestId + 1, Number.isSafeInteger(value.nextConflictId) ? value.nextConflictId : 1),
  }
}
