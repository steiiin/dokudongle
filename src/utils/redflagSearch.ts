export interface RedflagSearchEntry {
  readonly id: string
  readonly name: string
  readonly name_alt?: string
  readonly parentName?: string
  readonly parentNameAlt?: string
  readonly category?: string
  readonly requirements?: string
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function normalizeRedflagSearch(value: string): string {
  return normalizeSearchText(value)
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')
}

// Distanz nach optimaler Zeichenfolgenausrichtung: Einfügungen, Löschungen, Ersetzungen
// und Vertauschungen benachbarter Zeichen. Ganze Wörter vergleichen, niemals verstreute Buchstaben.
function wordDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let previousPrevious: number[] = []
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        current[j] = Math.min(current[j], previousPrevious[j - 2] + 1)
      }
    }
    previousPrevious = previous
    previous = current
  }
  return previous[b.length]
}

type Match = readonly [kind: number, edits: number, unmatched: number]
type Rank = readonly [field: number, ...match: Match]

function compareRank(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

function matchField(query: string, words: readonly string[], value: string): Match | undefined {
  const target = normalizeRedflagSearch(value)
  if (!target) return undefined
  const unmatched = Math.max(0, target.length - query.length)
  if (target === query) return [0, 0, unmatched]
  if (target.startsWith(query)) return [1, 0, unmatched]
  if (target.includes(query)) return [2, 0, unmatched]

  const targetWords = normalizeSearchText(value).split(' ').map(word => ({ word, folded: normalizeRedflagSearch(word) }))
  let edits = 0
  for (const word of words) {
    const folded = normalizeRedflagSearch(word)
    if (targetWords.some(candidate => candidate.folded.includes(folded))) continue
    const limit = word.length <= 3 ? 0 : word.length <= 7 ? 1 : 2
    if (!limit) return undefined
    let best = limit + 1
    for (const candidate of targetWords) {
      // Auch die ursprüngliche Schreibweise beibehalten: Die Normalisierung von „oe“ in „synkpoe“
      // würde sonst aus einer einzigen Vertauschung zwei Änderungen machen.
      best = Math.min(best, wordDistance(word, candidate.word, limit), wordDistance(folded, candidate.folded, limit))
    }
    if (best > limit) return undefined
    edits += best
  }
  return [edits ? 4 : 3, edits, unmatched]
}

/** Jedes Suchwort muss innerhalb desselben Feldes passen; Titel haben stets Vorrang vor Metadaten. */
export function searchRedflagEntries<T extends RedflagSearchEntry>(entries: readonly T[], search: string): T[] {
  const query = normalizeRedflagSearch(search)
  if (!query) return [...entries]
  const words = normalizeSearchText(search).split(' ')
  const matches: { entry: T; rank: Rank }[] = []
  for (const entry of entries) {
    const fields = [
      [entry.name, entry.name_alt],
      [entry.parentName, entry.parentNameAlt],
      [entry.category],
      [entry.requirements],
    ]
    let best: Rank | undefined
    for (let tier = 0; tier < fields.length; tier++) {
      for (const value of fields[tier]) {
        if (!value) continue
        const match = matchField(query, words, value)
        if (!match) continue
        const rank: Rank = [tier, ...match]
        if (!best || compareRank(rank, best) < 0) best = rank
      }
      if (best) break
    }
    if (best) matches.push({ entry, rank: best })
  }
  return matches.sort((a, b) => compareRank(a.rank, b.rank)
    || a.entry.name.localeCompare(b.entry.name, 'de')
    || a.entry.id.localeCompare(b.entry.id, 'de'))
    .map(({ entry }) => entry)
}
