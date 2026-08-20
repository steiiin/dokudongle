import { beforeAll, describe, expect, test, vi } from 'vitest'
import { ConservativeCorrectionPolicy } from '@/services/text-assist/CorrectionPolicy'
import { SnippetService } from '@/services/text-assist/SnippetService'
import { ShortcutReplacementService } from '@/services/text-assist/ShortcutReplacementService'
import { TextAssistService } from '@/services/text-assist/TextAssistService'
import { TextLearningService } from '@/services/text-assist/TextLearningService'
import { emptyTextAssistState, type TextAssistStateRepositoryLike } from '@/services/text-assist/persistence'
import { isCompletionDelimiter, wordAroundCursor } from '@/services/text-assist/text'
import type {
  ImeDictionary,
  TextAssistPersistedState,
  TextInputChange,
  TextInputSnapshot,
  TextMutation,
} from '@/services/text-assist/types'

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

describe('shortcut replacements', () => {
  test('replaces the configured shortcut after space or punctuation', () => {
    const shortcuts = new ShortcutReplacementService()
    const afterSpace = shortcuts.replaceAfterDelimiter(change('shortcut-space', 'lt', 'lt '))
    expect(afterSpace).toEqual({ start: 0, end: 2, replacement: 'laut', cursor: 5 })
    expect(applyMutation('lt ', afterSpace!)).toBe('laut ')

    const afterPunctuation = shortcuts.replaceAfterDelimiter({
      sessionId: 'shortcut-punctuation',
      contextId: 'situation',
      before: snapshot('Ziel lt danach', 7),
      after: snapshot('Ziel lt, danach', 8),
      inputType: 'insertText',
      data: ',',
    })
    expect(afterPunctuation).toEqual({ start: 5, end: 7, replacement: 'laut', cursor: 10 })
    expect(applyMutation('Ziel lt, danach', afterPunctuation!)).toBe('Ziel laut, danach')
  })

  test('matches complete shortcuts with exact casing only', () => {
    const shortcuts = new ShortcutReplacementService()
    for (const typed of ['Lt', 'LT', 'halt', 'unbekannt']) {
      expect(shortcuts.replaceAfterDelimiter(change(`exact-${typed}`, typed, `${typed} `))).toBeNull()
    }
  })

  test('does not replace selections or text composed by an IME', () => {
    const shortcuts = new ShortcutReplacementService()
    expect(shortcuts.replaceAfterDelimiter({
      ...change('shortcut-selection', 'lt', 'lt '),
      before: { ...snapshot('lt'), selectionStart: 0, selectionEnd: 2 },
    })).toBeNull()
    expect(shortcuts.replaceAfterDelimiter(change('shortcut-ime', 'lt', 'lt ', 3, true))).toBeNull()
  })
})

describe('automatic-only text assist', () => {
  test('uses additional words as local accepted spellings and preferred correction targets', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const dictionary = { words: [' DokuDongle ', '', 'DOKUDONGLE', 'two words'] }

    const exact = await service.processAutomaticInput(
      change('local-exact', 'DokuDongle', 'DokuDongle '),
      dictionary,
    )
    expect(exact).toBeNull()

    const casing = await service.processAutomaticInput(
      change('local-casing', 'dokudongle', 'dokudongle '),
      dictionary,
    )
    expect(casing).toMatchObject({ replacement: 'DokuDongle', cursor: 11 })

    const typo = await service.processAutomaticInput(
      change('local-typo', 'DokuDongel', 'DokuDongel '),
      dictionary,
    )
    expect(typo).toMatchObject({ replacement: 'DokuDongle', cursor: 11 })

    const withoutDictionary = await service.processAutomaticInput(
      change('local-isolation', 'DokuDongel', 'DokuDongel '),
    )
    expect(withoutDictionary).toBeNull()
  })

  test('keeps custom shortcuts local, lets them override defaults, and undoes without persistence', async () => {
    const repository = new MemoryRepository()
    const service = new TextAssistService(repository)
    const dictionary = { shortcuts: { dd: 'DokuDongle', lt: 'gemäß', empty: ' ' } }

    const custom = await service.processAutomaticInput(change('local-shortcut', 'dd', 'dd '), dictionary)
    expect(custom).toEqual({ start: 0, end: 2, replacement: 'DokuDongle', cursor: 11 })
    const expanded = applyMutation('dd ', custom!)
    const undone = service.handleAutomaticBackspace('local-shortcut', snapshot(expanded))
    expect(undone).toEqual({ start: 0, end: 11, replacement: 'dd', cursor: 2 })

    const overridden = await service.processAutomaticInput(change('override-shortcut', 'lt', 'lt '), dictionary)
    expect(overridden?.replacement).toBe('gemäß')

    const isolated = await service.processAutomaticInput(change('isolated-shortcut', 'dd', 'dd '))
    expect(isolated).toBeNull()
    expect(repository.state.rejectedCorrections).toEqual([])
    expect(repository.state.userDictionary).toEqual([])
    expect(repository.saveNow).not.toHaveBeenCalled()
  })
})

describe('IME autocorrect flags', () => {
  test('capitalizes the completed field prefix and preserves delimiters, suffixes, and carets', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const dictionary = {
      autocorrect: ['unknown', 'capitalize', 'capitalize'],
    } as unknown as ImeDictionary
    const atEnd = await service.processAutomaticInput(
      change('capitalize-end', '  max', '  max '),
      dictionary,
    )

    expect(atEnd).toEqual({ start: 0, end: 5, replacement: 'Max', cursor: 4 })
    expect(applyMutation('  max ', atEnd!)).toBe('Max ')

    const inMiddle = await service.processAutomaticInput({
      sessionId: 'capitalize-middle',
      contextId: 'contact.name',
      before: snapshot('max Rest', 3),
      after: snapshot('max, Rest', 4),
      inputType: 'insertText',
      data: ',',
    }, { autocorrect: ['capitalize'] })

    expect(inMiddle).toEqual({ start: 0, end: 3, replacement: 'Max', cursor: 4 })
    expect(applyMutation('max, Rest', inMiddle!)).toBe('Max, Rest')
  })

  test('formats a completed telephone prefix with the legacy grouping', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const mutation = await service.processAutomaticInput(
      change('phone', '0151-1234567', '0151-1234567 '),
      { autocorrect: ['phone'] },
    )

    expect(mutation).toEqual({ start: 0, end: 12, replacement: '0151 123 4567', cursor: 14 })
    expect(applyMutation('0151-1234567 ', mutation!)).toBe('0151 123 4567 ')
  })

  test('composes shortcut replacement with configured field normalization', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const mutation = await service.processAutomaticInput(
      change('shortcut-capitalize', 'dd', 'dd '),
      {
        shortcuts: { dd: 'dokuDongle' },
        autocorrect: ['capitalize'],
      },
    )

    expect(mutation).toEqual({ start: 0, end: 2, replacement: 'DokuDongle', cursor: 11 })
    expect(applyMutation('dd ', mutation!)).toBe('DokuDongle ')
  })

  test('immediate Backspace restores the exact pre-transform text and invalidation disables undo', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const mutation = await service.processAutomaticInput(
      change('profile-undo', '  max', '  max '),
      { autocorrect: ['capitalize'] },
    )
    const corrected = applyMutation('  max ', mutation!)

    const undo = service.handleAutomaticBackspace('profile-undo', snapshot(corrected))
    expect(undo).toEqual({ start: 0, end: 4, replacement: '  max', cursor: 5 })
    expect(applyMutation(corrected, undo!)).toBe('  max')
    expect(service.handleAutomaticBackspace('profile-undo', snapshot('  max'))).toBeNull()

    const invalidatedMutation = await service.processAutomaticInput(
      change('profile-invalidated', 'max', 'max '),
      { autocorrect: ['capitalize'] },
    )
    const invalidatedText = applyMutation('max ', invalidatedMutation!)
    service.invalidateAutomaticSession('profile-invalidated')
    expect(service.handleAutomaticBackspace('profile-invalidated', snapshot(invalidatedText))).toBeNull()
  })

  test('does not apply flags without a delimiter or during composition and selection replacement', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const dictionary = { autocorrect: ['capitalize'] as const }

    expect(await service.processAutomaticInput(change('no-delimiter', 'ma', 'max'), dictionary)).toBeNull()
    expect(await service.processAutomaticInput(change('composing', 'max', 'max ', 4, true), dictionary)).toBeNull()
    expect(await service.processAutomaticInput({
      ...change('selection', 'max', 'max '),
      before: { ...snapshot('max'), selectionStart: 0, selectionEnd: 3 },
    }, dictionary)).toBeNull()
  })
})

describe('text assist integration', () => {
  const repository = new MemoryRepository()
  const service = new TextAssistService(repository)

  beforeAll(async () => {
    await service.initialize()
  })

  test('corrects supported German and medical typos only after a delimiter', async () => {
    const german = await service.processInput(change('german', 'Krankehaus', 'Krankehaus '))
    expect(german.mutation).toMatchObject({ replacement: 'Krankenhaus', cursor: 12 })
    expect(applyMutation('Krankehaus ', german.mutation!)).toBe('Krankenhaus ')

    const medical = await service.processInput(change('medical', 'Patietn', 'Patietn '))
    expect(medical.mutation).toMatchObject({ replacement: 'Patient', cursor: 8 })
    expect(applyMutation('Patietn ', medical.mutation!)).toBe('Patient ')

    const valid = await service.processInput(change('valid', 'Patient', 'Patient '))
    expect(valid.mutation).toBeUndefined()
  })

  test('leaves removed or ambiguous medical terms unchanged', async () => {
    for (const term of ['Schmerzne', 'Tachykardje', 'Tachykardie']) {
      const update = await service.processInput(change(`unsupported-${term}`, term, `${term} `))
      expect(update.mutation).toBeUndefined()
    }
  })

  test('applies configured shortcuts before spelling autocorrection', async () => {
    const update = await service.processInput(change('shortcut-precedence', 'lt', 'lt '))
    expect(update.mutation).toEqual({ start: 0, end: 2, replacement: 'laut', cursor: 5 })
    expect(applyMutation('lt ', update.mutation!)).toBe('laut ')
  })

  test('combines field-local dictionaries with full suggestions and global snippets', async () => {
    const localService = new TextAssistService(new MemoryRepository())

    const shortcut = await localService.processInput(
      change('full-local-shortcut', 'dd', 'dd '),
      { shortcuts: { dd: 'DokuDongle' } },
    )
    expect(shortcut.mutation).toMatchObject({ replacement: 'DokuDongle', cursor: 11 })

    const localWord = await localService.processInput(
      change('full-local-word', 'DokuDongel', 'DokuDongel '),
      { words: ['DokuDongle'] },
    )
    expect(localWord.mutation).toMatchObject({ replacement: 'DokuDongle', cursor: 11 })

    const snippets = await localService.getSuggestions(
      'full-location-snippet',
      'single-line',
      snapshot('@uni'),
    )
    expect(snippets).toHaveLength(1)
    expect(snippets[0]).toMatchObject({ type: 'snippet', replacement: 'Uniklinik Dresden' })
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
    const update = await service.processInput(change('middle', 'Krankehaus Text', 'Krankehaus, Text', 11))
    expect(update.mutation).toMatchObject({ start: 0, end: 10, replacement: 'Krankenhaus', cursor: 12 })
    expect(applyMutation('Krankehaus, Text', update.mutation!)).toBe('Krankenhaus, Text')
  })

  test('corrects after Unicode punctuation and preserves initial capitalization', async () => {
    const punctuation = await service.processInput(change('punctuation', 'Patietn', 'Patietn𐄀'))
    expect(punctuation.mutation).toMatchObject({ replacement: 'Patient', cursor: 9 })
    expect(applyMutation('Patietn𐄀', punctuation.mutation!)).toBe('Patient𐄀')
  })

  test('immediate Backspace restores the typo and only works once', async () => {
    const update = await service.processInput(change('undo', 'Krankehaus', 'Krankehaus '))
    const corrected = applyMutation('Krankehaus ', update.mutation!)
    const undo = service.handleBackspace('undo', snapshot(corrected, update.mutation!.cursor))
    expect(undo).toMatchObject({ replacement: 'Krankehaus', cursor: 10 })
    expect(applyMutation(corrected, undo!)).toBe('Krankehaus')
    expect(service.handleBackspace('undo', snapshot('Krankehaus'))).toBeNull()
  })

  test('immediate Backspace restores a shortcut without recording a spelling rejection', async () => {
    const shortcutRepository = new MemoryRepository()
    const shortcutService = new TextAssistService(shortcutRepository)
    const update = await shortcutService.processInput(change('shortcut-undo', 'lt', 'lt,'))
    const expanded = applyMutation('lt,', update.mutation!)

    expect(expanded).toBe('laut,')
    const undo = shortcutService.handleBackspace('shortcut-undo', snapshot(expanded))
    expect(undo).toEqual({ start: 0, end: 5, replacement: 'lt', cursor: 2 })
    expect(applyMutation(expanded, undo!)).toBe('lt')
    expect(shortcutService.handleBackspace('shortcut-undo', snapshot('lt'))).toBeNull()
    expect(shortcutRepository.state.rejectedCorrections).toEqual([])
    expect(shortcutRepository.state.userDictionary).toEqual([])
  })

  test('cursor activity invalidates immediate shortcut undo', async () => {
    const shortcutService = new TextAssistService(new MemoryRepository())
    const update = await shortcutService.processInput(change('shortcut-moved', 'lt', 'lt '))
    const expanded = applyMutation('lt ', update.mutation!)

    shortcutService.invalidateSession('shortcut-moved', snapshot(expanded, expanded.length - 1))
    expect(shortcutService.handleBackspace('shortcut-moved', snapshot(expanded))).toBeNull()
  })

  test('cursor or selection activity invalidates immediate correction undo', async () => {
    const update = await service.processInput(change('moved', 'Rettungsdient', 'Rettungsdient '))
    const corrected = applyMutation('Rettungsdient ', update.mutation!)
    service.invalidateSession('moved', snapshot(corrected, corrected.length - 1))
    expect(service.handleBackspace('moved', snapshot(corrected, corrected.length))).toBeNull()
  })

  test('two rejected corrections add the original to the learned dictionary', async () => {
    for (const sessionId of ['learn-1', 'learn-2']) {
      const update = await service.processInput(change(sessionId, 'Patietn', 'Patietn '))
      const corrected = applyMutation('Patietn ', update.mutation!)
      service.handleBackspace(sessionId, snapshot(corrected, update.mutation!.cursor))
      await vi.waitFor(async () => {
        const rejection = repository.state.rejectedCorrections.find(entry => entry.original === 'Patietn')
        expect(rejection?.rejectionCount).toBe(sessionId === 'learn-1' ? 1 : 2)
      })
    }
    expect(await service.userDictionary.getWords()).toContain('Patietn')
    await service.removeUserWord('Patietn')
    expect(await service.userDictionary.getWords()).not.toContain('Patietn')
    expect(repository.state.rejectedCorrections.some(entry => entry.original === 'Patietn')).toBe(false)
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

  test('automatically applies a unique @ location when space is inserted', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const update = await service.processInput(change(
      'snippet-space',
      'Ziel @radebe',
      'Ziel @radebe ',
    ))

    expect(update.mutation).toMatchObject({
      start: 5,
      end: 12,
      replacement: 'KH Radebeul',
      cursor: 'Ziel KH Radebeul '.length,
    })
    expect(applyMutation('Ziel @radebe ', update.mutation!)).toBe('Ziel KH Radebeul ')
  })

  test('preserves punctuation, suffix, and caret when completing a unique @ location in the middle', async () => {
    const service = new TextAssistService(new MemoryRepository())
    const update = await service.processInput({
      sessionId: 'snippet-punctuation',
      contextId: 'situation',
      before: snapshot('Ziel @radebe danach', 12),
      after: snapshot('Ziel @radebe, danach', 13),
      inputType: 'insertText',
      data: ',',
    })

    expect(update.mutation).toMatchObject({
      start: 5,
      end: 12,
      replacement: 'KH Radebeul',
      cursor: 'Ziel KH Radebeul,'.length,
    })
    expect(applyMutation('Ziel @radebe, danach', update.mutation!)).toBe('Ziel KH Radebeul, danach')
  })

  test('does not automatically apply ambiguous or unmatched @ location queries', async () => {
    const service = new TextAssistService(new MemoryRepository())
    for (const [sessionId, query] of [
      ['snippet-ambiguous', '@rad'],
      ['snippet-unmatched', '@zzzz'],
    ]) {
      const update = await service.processInput(change(
        sessionId,
        `Ziel ${query}`,
        `Ziel ${query} `,
      ))
      expect(update.mutation).toBeUndefined()
    }
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
