import { beforeAll, describe, expect, test, vi } from 'vitest'
import { ConservativeCorrectionPolicy } from '@/services/text-assist/CorrectionPolicy'
import { SnippetService } from '@/services/text-assist/SnippetService'
import { TextAssistService } from '@/services/text-assist/TextAssistService'
import { TextLearningService } from '@/services/text-assist/TextLearningService'
import { emptyTextAssistState, type TextAssistStateRepositoryLike } from '@/services/text-assist/persistence'
import { isCompletionDelimiter, wordAroundCursor } from '@/services/text-assist/text'
import type { TextAssistPersistedState, TextInputChange, TextInputSnapshot, TextMutation } from '@/services/text-assist/types'

class MemoryRepository implements TextAssistStateRepositoryLike {
  state: TextAssistPersistedState = emptyTextAssistState()
  saveNow = vi.fn(async () => undefined)
  scheduleSave = vi.fn()
  async initialize() { return this.state }
  getState() { return this.state }
}

const snapshot = (text: string, cursor = text.length, isComposing = false): TextInputSnapshot => ({
  text,
  selectionStart: cursor,
  selectionEnd: cursor,
  isComposing,
})

const change = (
  sessionId: string,
  beforeText: string,
  afterText: string,
  cursor = afterText.length,
  isComposing = false,
): TextInputChange => ({
  sessionId,
  contextId: 'situation',
  before: snapshot(beforeText, beforeText.length, isComposing),
  after: snapshot(afterText, cursor, isComposing),
  inputType: 'insertText',
  data: afterText[cursor - 1] ?? null,
})

const applyMutation = (text: string, mutation: TextMutation): string =>
  text.slice(0, mutation.start) + mutation.replacement + text.slice(mutation.end)

describe('conservative correction policy', () => {
  const policy = new ConservativeCorrectionPolicy()

  test('rejects equal-distance ambiguous candidates', () => {
    expect(policy.choose('Schmerzne', ['Schmerze', 'Schmerzen', 'Schmerzte'])).toBeNull()
  })

  test('allows one preferred medical candidate to resolve a tie', () => {
    const preferred = new Set(['schmerzen'])
    expect(policy.choose('Schmerzne', ['Schmerze', 'Schmerzen', 'Schmerzte'], preferred)?.replacement).toBe('Schmerzen')
  })

  test('accepts one case-only candidate with full confidence', () => {
    expect(policy.choose('krankenhaus', ['Krankenhaus', '-krankenhaus'])).toEqual({
      original: 'krankenhaus',
      replacement: 'Krankenhaus',
      confidence: 1,
    })
  })

  test('rejects ambiguous case-only candidates', () => {
    expect(policy.choose('beispiel', ['Beispiel', 'BEISPIEL'])).toBeNull()
  })
})

describe('typing word boundaries', () => {
  test('finds the complete word around the caret, including multiline and joined words', () => {
    expect(wordAroundCursor('Alpha\nNot-Arzt Ende', 8)).toEqual({
      word: 'Not-Arzt',
      start: 6,
      end: 14,
    })
    expect(wordAroundCursor('Alpha\nNot-Arzt Ende', 13)?.word).toBe('Not-Arzt')
    expect(wordAroundCursor('Alpha, Ende', 6)).toBeNull()
  })

  test('treats whitespace and Unicode punctuation as completion delimiters but not word joiners', () => {
    for (const delimiter of [' ', '\n', '.', ',', ';', ':', '!', '?', ')', '„', '𐄀']) {
      expect(isCompletionDelimiter(delimiter)).toBe(true)
    }
    for (const joiner of ['-', "'", '’']) {
      expect(isCompletionDelimiter(joiner)).toBe(false)
    }
    expect(isCompletionDelimiter('a')).toBe(false)
  })
})

describe('text assist integration', () => {
  const repository = new MemoryRepository()
  const service = new TextAssistService(repository)

  beforeAll(async () => {
    await service.initialize()
  })

  test('corrects German and medical typos only after a delimiter', async () => {
    const pain = await service.processInput(change('pain', 'Patient Schmerzne', 'Patient Schmerzne '))
    expect(pain.mutation).toMatchObject({ replacement: 'Schmerzen', cursor: 18 })
    expect(applyMutation('Patient Schmerzne ', pain.mutation!)).toBe('Patient Schmerzen ')

    const tachy = await service.processInput(change('tachy', 'Tachykardje', 'Tachykardje '))
    expect(tachy.mutation?.replacement).toBe('Tachykardie')

    const valid = await service.processInput(change('valid', 'Tachykardie', 'Tachykardie '))
    expect(valid.mutation).toBeUndefined()
  })

  test('capitalizes unambiguous German nouns and compounds after a delimiter', async () => {
    for (const [typed, expected] of [
      ['krankenhaus', 'Krankenhaus'],
      ['rettungsdienst', 'Rettungsdienst'],
      ['patient', 'Patient'],
      ['pATIENT', 'Patient'],
    ]) {
      const update = await service.processInput(change(`case-${typed}`, typed, `${typed} `))
      expect(update.mutation).toMatchObject({ replacement: expected, cursor: expected.length + 1 })
      expect(applyMutation(`${typed} `, update.mutation!)).toBe(`${expected} `)
    }

    const punctuation = await service.processInput(change(
      'case-punctuation',
      'krankenhaus Rest',
      'krankenhaus, Rest',
      12,
    ))
    expect(punctuation.mutation).toMatchObject({ start: 0, end: 11, replacement: 'Krankenhaus', cursor: 12 })
    expect(applyMutation('krankenhaus, Rest', punctuation.mutation!)).toBe('Krankenhaus, Rest')
  })

  test('leaves valid ambiguous lowercase and uppercase forms unchanged', async () => {
    const lowercase = await service.processInput(change('ambiguous-lower', 'morgen', 'morgen '))
    expect(lowercase.mutation).toBeUndefined()

    const uppercase = await service.processInput(change('valid-uppercase', 'KRANKENHAUS', 'KRANKENHAUS '))
    expect(uppercase.mutation).toBeUndefined()
  })

  test('offers capitalized compound spelling while the word is being typed', async () => {
    const suggestions = await service.getSuggestions(
      'compound-suggestion',
      'situation',
      snapshot('krankenhaus'),
    )
    expect(suggestions[0]).toMatchObject({ replacement: 'Krankenhaus', source: 'spelling' })
  })

  test('preserves the suffix and caret for a correction in the middle', async () => {
    const update = await service.processInput(change('middle', 'Schmerzne Text', 'Schmerzne, Text', 10))
    expect(update.mutation).toMatchObject({ start: 0, end: 9, replacement: 'Schmerzen', cursor: 10 })
    expect(applyMutation('Schmerzne, Text', update.mutation!)).toBe('Schmerzen, Text')
  })

  test('corrects after Unicode punctuation and preserves initial capitalization', async () => {
    const punctuation = await service.processInput(change('punctuation', 'Tachykardje', 'Tachykardje𐄀'))
    expect(punctuation.mutation).toMatchObject({ replacement: 'Tachykardie', cursor: 13 })
    expect(applyMutation('Tachykardje𐄀', punctuation.mutation!)).toBe('Tachykardie𐄀')
  })

  test('immediate Backspace restores the typo and only works once', async () => {
    const update = await service.processInput(change('undo', 'Tachykardje', 'Tachykardje '))
    const corrected = applyMutation('Tachykardje ', update.mutation!)
    const undo = service.handleBackspace('undo', snapshot(corrected, update.mutation!.cursor))
    expect(undo).toMatchObject({ replacement: 'Tachykardje', cursor: 11 })
    expect(applyMutation(corrected, undo!)).toBe('Tachykardje')
    expect(service.handleBackspace('undo', snapshot('Tachykardje'))).toBeNull()
  })

  test('cursor or selection activity invalidates immediate correction undo', async () => {
    const update = await service.processInput(change('moved', 'Tachykardje', 'Tachykardje '))
    const corrected = applyMutation('Tachykardje ', update.mutation!)
    service.invalidateSession('moved', snapshot(corrected, corrected.length - 1))
    expect(service.handleBackspace('moved', snapshot(corrected, corrected.length))).toBeNull()
  })

  test('two rejected corrections add the original to the learned dictionary', async () => {
    for (const sessionId of ['learn-1', 'learn-2']) {
      const update = await service.processInput(change(sessionId, 'Schmerzne', 'Schmerzne '))
      const corrected = applyMutation('Schmerzne ', update.mutation!)
      service.handleBackspace(sessionId, snapshot(corrected, update.mutation!.cursor))
      await vi.waitFor(async () => {
        const rejection = repository.state.rejectedCorrections.find(entry => entry.original === 'Schmerzne')
        expect(rejection?.rejectionCount).toBe(sessionId === 'learn-1' ? 1 : 2)
      })
    }
    expect(await service.userDictionary.getWords()).toContain('Schmerzne')
    await service.removeUserWord('Schmerzne')
    expect(await service.userDictionary.getWords()).not.toContain('Schmerzne')
    expect(repository.state.rejectedCorrections.some(entry => entry.original === 'Schmerzne')).toBe(false)
  })

  test('two rejected capitalization corrections preserve the lowercase user preference', async () => {
    const preferenceRepository = new MemoryRepository()
    const preferenceService = new TextAssistService(preferenceRepository)

    for (const sessionId of ['case-reject-1', 'case-reject-2']) {
      const update = await preferenceService.processInput(change(sessionId, 'krankenhaus', 'krankenhaus '))
      const corrected = applyMutation('krankenhaus ', update.mutation!)
      preferenceService.handleBackspace(sessionId, snapshot(corrected, update.mutation!.cursor))
      await vi.waitFor(() => {
        const rejection = preferenceRepository.state.rejectedCorrections[0]
        expect(rejection?.rejectionCount).toBe(sessionId === 'case-reject-1' ? 1 : 2)
      })
    }

    expect(await preferenceService.userDictionary.getWords()).toContain('krankenhaus')
    const suppressed = await preferenceService.processInput(change(
      'case-preference',
      'krankenhaus',
      'krankenhaus ',
    ))
    expect(suppressed.mutation).toBeUndefined()
  })

  test('does not correct during active IME composition', async () => {
    const update = await service.processInput(change('ime', 'Schmerzne', 'Schmerzne ', 10, true))
    expect(update.mutation).toBeUndefined()
    expect(update.suggestions).toEqual([])
  })

  test('ranks repeated contextual next words in the shared suggestion API', async () => {
    service.learning.recordSequence(['Patient', 'wurde', 'in', 'die', 'Notaufnahme'], 'prediction')
    service.learning.recordSequence(['Patient', 'wurde', 'in', 'die', 'Notaufnahme'], 'prediction')
    const suggestions = await service.getSuggestions('prediction-session', 'prediction', snapshot('Patient wurde in die '))
    expect(suggestions[0]).toMatchObject({ replacement: 'Notaufnahme', type: 'word' })
  })
})

describe('snippets and usage learning', () => {
  test('filters @ locations and replaces the complete trigger expression', () => {
    const snippets = new SnippetService()
    expect(snippets.getSuggestions('@', 1)).toHaveLength(14)
    const filtered = snippets.getSuggestions('Ziel @uni jetzt', 9)
    expect(filtered.map(item => item.label)).toEqual(['Uniklinik Dresden'])
    expect(filtered[0]).toMatchObject({ start: 5, end: 9, replacement: 'Uniklinik Dresden' })
  })

  test('combines global and field bigram and phrase statistics after two uses', () => {
    const repository = new MemoryRepository()
    const learning = new TextLearningService(repository)
    learning.recordSequence(['Patient', 'wurde', 'in', 'die', 'Notaufnahme'], 'situation')
    expect(learning.getNextWordCandidates('die', 'situation')).toEqual([])
    learning.recordSequence(['Patient', 'wurde', 'in', 'die', 'Notaufnahme'], 'situation')

    const next = learning.getNextWordCandidates('die', 'situation')
    expect(next[0]).toMatchObject({ word: 'Notaufnahme', globalCount: 2, contextCount: 2 })
    expect(learning.getPhraseCompletions(['Patient', 'wurde', 'in', 'die'], 'situation')[0].replacement).toBe('Notaufnahme')
    expect(learning.getNextWordCandidates('die', 'treatment.tasks')[0]).toMatchObject({
      word: 'Notaufnahme',
      globalCount: 2,
      contextCount: 0,
    })
  })
})
