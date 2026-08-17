import type { AutocorrectService } from './AutocorrectService'
import type { SnippetService } from './SnippetService'
import type { TextLearningService } from './TextLearningService'
import type { TextContext, TextSuggestion } from './types'
import { normalizeKey, wordAtCursor, wordsBefore } from './text'

const recencyScore = (timestamp: number): number => {
  const age = Math.max(0, Date.now() - timestamp)
  return 2 * Math.exp(-age / (30 * 24 * 60 * 60 * 1000))
}

export class SuggestionService {
  constructor(
    private readonly autocorrect: AutocorrectService,
    private readonly snippets: SnippetService,
    private readonly learning: TextLearningService,
  ) {}

  async getSuggestions(context: TextContext): Promise<TextSuggestion[]> {
    const snippetSuggestions = this.snippets.getSuggestions(context.text, context.cursor)
    if (snippetSuggestions.length > 0 || this.snippets.getActiveQuery(context.text, context.cursor)) {
      return snippetSuggestions.slice(0, 5)
    }

    const currentRange = wordAtCursor(context.text, context.cursor)
    const currentWord = currentRange?.word ?? ''
    const history = wordsBefore(context.text, currentRange?.start ?? context.cursor, 5)
    const suggestions: TextSuggestion[] = []

    if (currentRange && currentWord.length >= 2) {
      const spelling = await this.autocorrect.getSpellingCandidates(currentWord)
      for (const [index, candidate] of spelling.entries()) {
        suggestions.push({
          id: `spelling:${normalizeKey(candidate.replacement)}`,
          label: candidate.replacement,
          replacement: candidate.replacement,
          type: 'word',
          source: 'spelling',
          score: 8 - index * 0.25,
          start: currentRange.start,
          end: currentRange.end,
        })
      }

      for (const candidate of this.learning.getWordCandidates(currentWord, context.contextId)) {
        suggestions.push({
          id: `learned:${normalizeKey(candidate.word)}`,
          label: candidate.word,
          replacement: candidate.word,
          type: 'word',
          source: 'learned',
          score: 3 + 2 * Math.log1p(candidate.contextCount) + Math.log1p(candidate.globalCount) + recencyScore(candidate.lastUsedAt),
          start: currentRange.start,
          end: currentRange.end,
        })
      }

      for (const word of this.autocorrect.getMedicalWords()) {
        if (!normalizeKey(word).startsWith(normalizeKey(currentWord)) || normalizeKey(word) === normalizeKey(currentWord)) continue
        suggestions.push({
          id: `medical:${normalizeKey(word)}`,
          label: word,
          replacement: word,
          type: 'word',
          source: 'medical',
          score: 5,
          start: currentRange.start,
          end: currentRange.end,
        })
      }
    }
    else {
      const previousWord = history.at(-1)
      if (previousWord) {
        for (const candidate of this.learning.getNextWordCandidates(previousWord, context.contextId)) {
          suggestions.push({
            id: `next:${normalizeKey(candidate.word)}`,
            label: candidate.word,
            replacement: candidate.word,
            type: 'word',
            source: 'learned',
            score: 4 * Math.log1p(candidate.contextCount) + 3 * Math.log1p(candidate.globalCount) + recencyScore(candidate.lastUsedAt),
            start: context.cursor,
            end: context.cursor,
          })
        }
      }

      for (const candidate of this.learning.getPhraseCompletions(history, context.contextId)) {
        suggestions.push({
          id: `phrase:${normalizeKey(candidate.replacement)}`,
          label: candidate.replacement,
          replacement: candidate.replacement,
          type: 'phrase',
          source: 'learned',
          score: 3 * Math.log1p(candidate.contextCount) + 2 * Math.log1p(candidate.globalCount) + recencyScore(candidate.lastUsedAt),
          start: context.cursor,
          end: context.cursor,
        })
      }
    }

    const deduplicated = new Map<string, TextSuggestion>()
    for (const suggestion of suggestions) {
      const key = `${suggestion.start}:${suggestion.end}:${normalizeKey(suggestion.replacement)}`
      const existing = deduplicated.get(key)
      if (!existing || suggestion.score > existing.score) deduplicated.set(key, suggestion)
    }
    return [...deduplicated.values()]
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'de'))
      .slice(0, 5)
  }
}
