import { beforeEach, describe, expect, test, vi } from 'vitest'
import { TextAssistService } from '@/services/text-assist/TextAssistService'
import { TextAssistStateRepository, emptyTextAssistState } from '@/services/text-assist/persistence'
import { loadStoredValue, saveStoredValue } from '@/store/persistence'
import defaultShortcuts from '@/assets/text-assist/shortcut-replacements.json'
import defaultLocations from '@/assets/snippets/locations.json'
import type { TextInputChange } from '@/services/text-assist/types'

vi.mock('@/store/persistence', () => ({ loadStoredValue: vi.fn(), saveStoredValue: vi.fn() }))
beforeEach(() => {
  vi.mocked(loadStoredValue).mockReset().mockResolvedValue(null)
  vi.mocked(saveStoredValue).mockReset().mockResolvedValue(undefined)
})
const setup = () => {
  const repository = new TextAssistStateRepository()
  return { repository, service: new TextAssistService(repository) }
}
const input = (word: string): TextInputChange => ({
  sessionId: 'settings', contextId: 'settings', inputType: 'insertText', data: ' ',
  before: { text: word, selectionStart: word.length, selectionEnd: word.length, isComposing: false },
  after: { text: word + ' ', selectionStart: word.length + 1, selectionEnd: word.length + 1, isComposing: false },
})
const location = { trigger: '#', label: 'Eigener Ort', replacement: 'Ziel: Eigener Ort', keywords: ['heimat'], category: 'custom' }
const reload = () => {
  vi.mocked(loadStoredValue).mockResolvedValue(structuredClone(vi.mocked(saveStoredValue).mock.calls.at(-1)![1]))
  return setup()
}

describe('text assistance settings', () => {
  test('initializes new and legacy state with independent defaults', async () => {
    const legacy = { schemaVersion: 1, userDictionary: [{ word: 'Test' }], rejectedCorrections: [], learning: emptyTextAssistState().learning }
    vi.mocked(loadStoredValue).mockResolvedValue(legacy)
    const { service, repository } = setup()
    expect(await service.getShortcutReplacements()).toEqual(defaultShortcuts)
    const locations = await service.getLocationSnippets()
    expect(locations).toEqual(defaultLocations)
    expect(new Set(locations.map(entry => entry.id)).size).toBe(locations.length)
    expect(repository.getState().userDictionary).toEqual(legacy.userDictionary)
    locations[0].keywords!.push('changed')
    expect((await service.getLocationSnippets())[0].keywords).not.toContain('changed')
    expect(saveStoredValue).not.toHaveBeenCalled()
  })

  test('retries a failed repository load', async () => {
    const { service } = setup()
    vi.mocked(loadStoredValue).mockRejectedValueOnce(new Error('Read failed'))
    await expect(service.getShortcutReplacements()).rejects.toThrow('Read failed')
    expect(await service.getShortcutReplacements()).toEqual(defaultShortcuts)
  })

  test('serializes overlapping mutations without losing a successful change', async () => {
    const { service } = setup()
    vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('Write failed'))
    const failed = service.addShortcutReplacement('eins', 'Erste')
    const successful = service.addShortcutReplacement('zwei', 'Zweite')
    await expect(failed).rejects.toThrow('Write failed')
    await successful
    expect(await service.getShortcutReplacements()).not.toHaveProperty('eins')
    expect(await service.getShortcutReplacements()).toHaveProperty('zwei', 'Zweite')
    expect(await reload().service.getShortcutReplacements()).toHaveProperty('zwei', 'Zweite')
  })

  test('normalizes, persists, reloads and deletes both types without merging defaults', async () => {
    const { service } = setup()
    await service.removeShortcutReplacement('lt')
    await service.addShortcutReplacement('  a\u0308rz  ', '  Ärztlicher Dienst  ')
    await service.addLocationSnippet({ ...location, label: '  O\u0308rtlich ', keywords: [' heimat ', '', 'heimat'] })
    const restored = reload().service
    expect(await restored.getShortcutReplacements()).toMatchObject({ ärz: 'Ärztlicher Dienst' })
    expect(await restored.getShortcutReplacements()).not.toHaveProperty('lt')
    const entry = (await restored.getLocationSnippets()).at(-1)!
    expect(entry).toMatchObject({ ...location, label: 'Örtlich', keywords: ['heimat'] })
    expect(entry.id).toBeTruthy()
    await restored.removeLocationSnippet(entry.id)
    expect(await restored.getLocationSnippets()).toEqual(defaultLocations)
    expect(vi.mocked(saveStoredValue).mock.calls.at(-1)![0]).toBe('text_assist_state_v1')
  })

  test('keeps empty tables after restart and resets collections independently', async () => {
    const { service } = setup()
    for (const key of Object.keys(await service.getShortcutReplacements())) await service.removeShortcutReplacement(key)
    for (const entry of await service.getLocationSnippets()) await service.removeLocationSnippet(entry.id)
    const restored = reload().service
    expect(await restored.getShortcutReplacements()).toEqual({})
    expect(await restored.getLocationSnippets()).toEqual([])
    await restored.resetShortcutReplacements()
    expect(await restored.getShortcutReplacements()).toEqual(defaultShortcuts)
    expect(await restored.getLocationSnippets()).toEqual([])
    await restored.addShortcutReplacement('custom', 'Wunschtext')
    await restored.resetLocationSnippets()
    expect(await restored.getLocationSnippets()).toEqual(defaultLocations)
    expect(await restored.getShortcutReplacements()).toHaveProperty('custom')
    await restored.resetShortcutReplacements()
    expect(await reload().service.getShortcutReplacements()).toEqual(defaultShortcuts)
  })

  test('rejects unusable shortcuts and locations, preserving case-sensitive keys', async () => {
    const { service } = setup()
    for (const key of ['', 'two words', '123', 'a!']) await expect(service.addShortcutReplacement(key, 'text')).rejects.toThrow('einzelnen Wort')
    await expect(service.addShortcutReplacement('valid', '  ')).rejects.toThrow('Ersetzung')
    await expect(service.addShortcutReplacement('lt', 'other')).rejects.toThrow('bereits vorhanden')
    await service.addShortcutReplacement('Lt', 'Groß')
    expect(await service.getShortcutReplacements()).toMatchObject({ lt: 'laut', Lt: 'Groß' })
    for (const trigger of ['', '# #']) await expect(service.addLocationSnippet({ ...location, trigger })).rejects.toThrow('Auslöser')
    await expect(service.addLocationSnippet({ ...location, label: ' ' })).rejects.toThrow('Bezeichnung')
    await service.addLocationSnippet(location)
    await service.addLocationSnippet(location)
    const locations = await service.getLocationSnippets()
    expect(locations.at(-1)!.id).not.toBe(locations.at(-2)!.id)
  })

  test('failed add, remove and reset roll back and allow retries', async () => {
    const { service } = setup()
    await service.addShortcutReplacement('custom', 'text')
    await service.addLocationSnippet(location)
    const shortcuts = await service.getShortcutReplacements()
    const locations = await service.getLocationSnippets()
    const actions = [
      () => service.addShortcutReplacement('neu', 'text'),
      () => service.removeShortcutReplacement('lt'),
      () => service.resetShortcutReplacements(),
      () => service.addLocationSnippet(location),
      () => service.removeLocationSnippet(locations[0].id),
      () => service.resetLocationSnippets(),
    ]
    for (const action of actions) {
      vi.mocked(saveStoredValue).mockRejectedValueOnce(new Error('Disk full'))
      await expect(action()).rejects.toThrow('Disk full')
      expect(await service.getShortcutReplacements()).toEqual(shortcuts)
      expect(await service.getLocationSnippets()).toEqual(locations)
    }
    await service.addShortcutReplacement('neu', 'text')
    expect(await service.getShortcutReplacements()).toHaveProperty('neu')
  })

  test('updates running assistance, respects local overrides, and retains shortcut undo', async () => {
    const { service } = setup()
    vi.spyOn(service.autocorrect, 'initialize').mockResolvedValue(undefined)
    vi.spyOn(service.autocorrect, 'correctAfterDelimiter').mockResolvedValue(null)
    await service.addShortcutReplacement('custom', 'Wunschtext')
    expect(await service.processAutomaticInput(input('custom'))).toMatchObject({ replacement: 'Wunschtext' })
    expect(await service.processInput(input('custom'))).toMatchObject({ mutation: { replacement: 'Wunschtext' } })
    expect(service.handleBackspace('settings', { text: 'Wunschtext ', selectionStart: 11, selectionEnd: 11, isComposing: false })).toMatchObject({ replacement: 'custom' })
    expect(await service.processAutomaticInput(input('custom'), { shortcuts: { custom: 'Lokal' } })).toMatchObject({ replacement: 'Lokal' })
    await service.removeShortcutReplacement('custom')
    expect(await service.processAutomaticInput(input('custom'))).toBeNull()
    await service.removeShortcutReplacement('lt')
    expect(await service.processAutomaticInput(input('lt'))).toBeNull()
    await service.resetShortcutReplacements()
    expect(await service.processAutomaticInput(input('lt'))).toMatchObject({ replacement: 'laut' })
    await service.addLocationSnippet(location)
    const suggestion = service.snippets.getSuggestions('#heim', 5)[0]
    expect(suggestion).toMatchObject({ replacement: location.replacement, label: location.label })
    expect(await service.processInput(input('#heim'))).toMatchObject({ mutation: { replacement: location.replacement } })
    await service.removeLocationSnippet(suggestion.snippetId)
    expect(service.snippets.getSuggestions('#heim', 5)).toEqual([])
    await service.resetLocationSnippets()
    expect(service.snippets.getSuggestions('@uni', 4)[0].label).toBe('Uniklinik Dresden')
    await service.flush()
  })
})
