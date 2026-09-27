import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AutocorrectService } from '@/services/text-assist/AutocorrectService'
import { TextAssistService } from '@/services/text-assist/TextAssistService'
import { UserDictionaryService } from '@/services/text-assist/UserDictionaryService'
import { TextAssistStateRepository, emptyTextAssistState } from '@/services/text-assist/persistence'
import type { TextInputSnapshot } from '@/services/text-assist/types'
import { loadStoredValue, saveStoredValue } from '@/store/persistence'

vi.mock('@/store/persistence', () => ({ loadStoredValue: vi.fn(), saveStoredValue: vi.fn() }))

const snapshot = (text: string, cursor = text.length): TextInputSnapshot => ({
  text, selectionStart: cursor, selectionEnd: cursor, isComposing: false,
})

beforeEach(() => {
  vi.mocked(loadStoredValue).mockReset().mockResolvedValue(null)
  vi.mocked(saveStoredValue).mockReset().mockResolvedValue(undefined)
})

const setup = async () => {
  const repository = new TextAssistStateRepository()
  const registry = { addUserWord: vi.fn().mockResolvedValue(undefined), rebuildUserWords: vi.fn().mockResolvedValue(undefined) }
  const dictionary = new UserDictionaryService(repository, registry)
  await repository.initialize()
  return { repository, registry, dictionary }
}

describe('user dictionary words and phrases', () => {
  test('normalizes phrases, preserves punctuation and case, and deduplicates', async () => {
    const { dictionary, registry } = await setup()
    expect(await dictionary.addWord('  A\u0308rztlich\n  abgeklärt!  ')).toBe('added')
    expect(await dictionary.addWord('ärztlich abgeklärt!')).toBe('already-present')
    expect(await dictionary.getWords()).toEqual(['Ärztlich abgeklärt!'])
    expect(registry.addUserWord).not.toHaveBeenCalled()
    await expect(dictionary.addWord('123 ! \n')).rejects.toThrow('Buchstaben')
    expect(await dictionary.addWord('Not-Arzt')).toBe('added')
    expect(registry.addUserWord).toHaveBeenCalledWith('Not-Arzt')
  })

  test('reloads existing words and new phrases with the unchanged storage format', async () => {
    const { dictionary } = await setup()
    await dictionary.addWord('DokuDongle')
    await dictionary.addWord('Patient ist beschwerdefrei')
    const [key, stored] = vi.mocked(saveStoredValue).mock.calls.at(-1)!
    expect(key).toBe('text_assist_state_v1')
    vi.mocked(loadStoredValue).mockResolvedValue(structuredClone(stored))
    const reloaded = await setup()
    expect(await reloaded.dictionary.getWords()).toEqual(['DokuDongle', 'Patient ist beschwerdefrei'])
    await reloaded.dictionary.removeWord(' PATIENT\nIST beschwerdefrei ')
    expect(reloaded.dictionary.getCompletions('Pat', 3)).toEqual([])
    expect(await reloaded.dictionary.getWords()).toEqual(['DokuDongle'])
  })

  test.each(['DokuDongle', 'Patient ist beschwerdefrei'])('a failed save of %s can be retried', async word => {
    const { dictionary } = await setup()
    vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('Disk full'))
    await expect(dictionary.addWord(word)).rejects.toThrow('Disk full')
    expect(await dictionary.getWords()).toEqual([])
    expect(await dictionary.addWord(word)).toBe('added')
    expect(saveStoredValue).toHaveBeenCalledTimes(2)
  })

  test('registers only valid single words with Hunspell at startup, add, and rebuild', async () => {
    const state = emptyTextAssistState()
    state.userDictionary = ['DokuDongle', 'Patient ist beschwerdefrei', 'Kontrolle!'].map(word => ({
      word, normalized: word.toLowerCase(), source: 'manual', addedAt: 0,
    }))
    vi.mocked(loadStoredValue).mockResolvedValue(state)
    const spell = {
      initialize: vi.fn().mockResolvedValue(undefined), rebuild: vi.fn().mockResolvedValue(undefined),
      addWord: vi.fn().mockResolvedValue(undefined), correct: vi.fn().mockResolvedValue(true),
      suggest: vi.fn().mockResolvedValue([]), dispose: vi.fn().mockResolvedValue(undefined),
    }
    const autocorrect = new AutocorrectService(new TextAssistStateRepository(), undefined, spell)
    await autocorrect.initialize()
    await autocorrect.addUserWord('Noch eine Phrase')
    await autocorrect.addUserWord('Not-Arzt')
    await autocorrect.rebuildUserWords()
    for (const words of [spell.initialize.mock.calls[0][0], spell.rebuild.mock.calls[0][0]]) {
      expect(words).toContain('DokuDongle')
      expect(words).not.toContain('Patient ist beschwerdefrei')
      expect(words).not.toContain('Kontrolle!')
    }
    expect(spell.addWord.mock.calls).toEqual([['Not-Arzt']])
  })

  test('matches the longest prefix at a word boundary with original replacement offsets', async () => {
    const { dictionary } = await setup()
    await dictionary.addWord('Patient ist beschwerdefrei')
    await dictionary.addWord('Patient Patient stabil')
    for (const text of ['Pat', 'patient ist', 'Patient\n  ist ', 'Befund: Patient ist']) {
      const match = dictionary.getCompletions(text, text.length).find(item => item.entry.word === 'Patient ist beschwerdefrei')!
      expect(match).toBeDefined()
      expect(match.start).toBe(text.startsWith('Befund: ') ? 8 : 0)
      expect(text.slice(0, match.start) + match.entry.word).toBe((text.startsWith('Befund: ') ? 'Befund: ' : '') + 'Patient ist beschwerdefrei')
    }
    expect(dictionary.getCompletions('Patient Patient', 15).find(item => item.entry.word === 'Patient Patient stabil')?.start).toBe(0)
    for (const text of ['P', 'XPat', '12Pat', 'Not-Pat', 'Patient ist beschwerdefrei', 'Patient ist beschwerdefrei ']) {
      expect(dictionary.getCompletions(text, text.length).filter(item => item.entry.word === 'Patient ist beschwerdefrei')).toEqual([])
    }
    expect(dictionary.getCompletions('Patient', 3)).toEqual([])
    await dictionary.addWord('Ärztlich abgeklärt')
    expect(dictionary.getCompletions('🚑 A\u0308rz', 7)[0]).toMatchObject({ start: 3, end: 7 })
    expect(dictionary.getCompletions('Wort '.repeat(2000) + 'Pat', 10003)[0]).toMatchObject({ start: 10000, end: 10003 })
  })

  test('ranks dictionary completions first, retains snippets, and safely applies a phrase', async () => {
    const service = new TextAssistService(new TextAssistStateRepository())
    // Keep these tests about dictionary behavior, without loading Hunspell.
    vi.spyOn(service.autocorrect, 'initialize').mockResolvedValue(undefined)
    vi.spyOn(service.autocorrect, 'getSpellingCandidates').mockResolvedValue([])
    vi.spyOn(service.autocorrect, 'addUserWord').mockResolvedValue(undefined)
    await service.initialize()
    await service.addUserWord('DokuDongle')
    expect((await service.getSuggestions('test', 'test', snapshot('Doku')))[0]).toMatchObject({ source: 'dictionary', type: 'word', replacement: 'DokuDongle' })
    await service.addUserWord('Patient ist beschwerdefrei')
    for (let i = 0; i < 20; i++) service.learning.recordCompletedWord('Patienten', 'test')
    const suggestions = await service.getSuggestions('test', 'test', snapshot('Pat'))
    const phrase = suggestions[0]
    expect(phrase).toMatchObject({ source: 'dictionary', type: 'phrase', replacement: 'Patient ist beschwerdefrei' })
    const input = snapshot('Befund: Patient ist Rest', 19)
    const mutation = service.applySuggestion('test', 'test', input, phrase)!
    expect(input.text.slice(0, mutation.start) + mutation.replacement + input.text.slice(mutation.end)).toBe('Befund: Patient ist beschwerdefrei Rest')
    expect(service.applySuggestion('test', 'test', snapshot('Anders'), phrase)).toBeNull()
    expect(service.applySuggestion('test', 'test', { ...snapshot('Pat'), selectionStart: 0 }, phrase)).toBeNull()
    expect(await service.getSuggestions('test', 'test', { ...snapshot('Pat'), isComposing: true })).toEqual([])
    await service.addUserWord('Uniklinik Wunschtext')
    expect((await service.getSuggestions('test', 'test', snapshot('@uni'))).every(item => item.type === 'snippet')).toBe(true)
    for (const suffix of ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs']) await service.addUserWord(`Patient ${suffix}`)
    const limited = await service.getSuggestions('test', 'test', snapshot('Pat'))
    expect(limited).toHaveLength(5)
    expect(limited.every(item => 'source' in item && item.source === 'dictionary')).toBe(true)
    await service.flush()
  })
})
