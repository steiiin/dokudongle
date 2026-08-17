import locations from '@/assets/snippets/locations.json'
import type { SnippetSuggestion, TextSnippet } from './types'
import { normalizeKey } from './text'

interface ActiveSnippetQuery {
  trigger: string
  query: string
  start: number
  end: number
}

export class SnippetService {
  constructor(private readonly snippets: TextSnippet[] = locations) {}

  getActiveQuery(text: string, cursor: number): ActiveSnippetQuery | null {
    const prefix = text.slice(0, cursor)
    const triggers = [...new Set(this.snippets.map(snippet => snippet.trigger))]
      .sort((a, b) => b.length - a.length)

    for (const trigger of triggers) {
      const index = prefix.lastIndexOf(trigger)
      if (index < 0) continue
      const before = index === 0 ? '' : prefix[index - 1]
      if (before && /[\p{L}\p{M}\p{N}_]/u.test(before)) continue
      const query = prefix.slice(index + trigger.length)
      if (/\s|[.,;:!?]/u.test(query)) continue
      return { trigger, query, start: index, end: cursor }
    }
    return null
  }

  getSuggestions(text: string, cursor: number): SnippetSuggestion[] {
    const active = this.getActiveQuery(text, cursor)
    if (!active) return []
    const query = normalizeKey(active.query)

    return this.snippets
      .filter(snippet => snippet.trigger === active.trigger)
      .map(snippet => {
        const fields = [snippet.label, snippet.replacement, ...(snippet.keywords ?? [])].map(normalizeKey)
        const prefixMatch = fields.some(field => field.startsWith(query))
        const wordPrefixMatch = fields.some(field => field.split(/\s+/u).some(word => word.startsWith(query)))
        const substringMatch = fields.some(field => field.includes(query))
        const score = query === '' ? 70 : prefixMatch ? 100 : wordPrefixMatch ? 90 : substringMatch ? 80 : 0
        return { snippet, score }
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.snippet.label.localeCompare(b.snippet.label, 'de'))
      .map(({ snippet, score }) => ({
        id: `snippet:${snippet.id}`,
        snippetId: snippet.id,
        label: snippet.label,
        replacement: snippet.replacement,
        type: 'snippet' as const,
        score,
        start: active.start,
        end: active.end,
      }))
  }
}
