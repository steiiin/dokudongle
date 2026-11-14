import { describe, expect, test } from 'vitest'
import { createPreviewDocument, editPreview, hydratePreview, reconcilePreview, resolvePreviewConflict, textEdits } from '@/utils/preview-document'

function merge(base: string, user: string, generated: string) {
  return reconcilePreview(editPreview(createPreviewDocument(base), user), generated)
}

describe('preview three-way merge', () => {
  test('merges independent words and punctuation in the same sentence', () => {
    const result = merge('Patient wach, ruhig.', 'Patient müde, ruhig.', 'Patient wach, unruhig!')
    expect(result.text).toBe('Patient müde, unruhig!')
    expect(result.conflicts).toEqual([])
  })

  test.each([
    ['Patient wach.', 'Patient müde.', 'Patient schläfrig.', 'müde', 'schläfrig'],
    ['A B', 'A X B', 'A Y B', 'X', 'Y'],
    ['A, B', 'A; B', 'A: B', ';', ':'],
    ['A B C', 'A X C', 'A C', 'X ', ''],
  ])('retains overlapping alternatives for %s', (base, user, generated, own, automatic) => {
    const result = merge(base, user, generated)
    expect(result.text).toBe(generated)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].userText).toContain(own)
    expect(result.conflicts[0].generatedText).toContain(automatic)
    expect(resolvePreviewConflict(result, result.conflicts[0].id, 'user').text).toBe(user)
    expect(resolvePreviewConflict(result, result.conflicts[0].id, 'generated').conflicts).toEqual([])
  })

  test('identical changes are accepted without a conflict', () => {
    expect(merge('A B', 'A X', 'A X').conflicts).toEqual([])
  })

  test('preserves whitespace, repeated passages and Unicode', () => {
    const base = 'Übelkeit 🙂\n\nPatient wach.\nPatient wach.\tEnde'
    const result = merge(base, base.replace('Übelkeit', 'Keine Übelkeit'), base.replace('Ende', 'Schluss'))
    expect(result.text).toBe('Keine Übelkeit 🙂\n\nPatient wach.\nPatient wach.\tSchluss')
    expect(result.conflicts).toEqual([])
  })

  test('retains conflicts and IDs across unrelated and overlapping generation updates', () => {
    let result = merge('Patient wach, ruhig.', 'Patient müde, ruhig.', 'Patient schläfrig, ruhig.')
    const id = result.conflicts[0].id
    result = reconcilePreview(result, 'Patient schläfrig, unruhig.')
    expect(result.text).toBe('Patient schläfrig, unruhig.')
    expect(result.conflicts[0]).toMatchObject({ id, userText: 'müde', generatedText: 'schläfrig' })
    result = reconcilePreview(result, 'Patient bewusstlos, unruhig.')
    expect(result.conflicts[0]).toMatchObject({ id, userText: 'müde', generatedText: 'bewusstlos' })
    expect(resolvePreviewConflict(result, id, 'user').text).toBe('Patient müde, unruhig.')
    expect(reconcilePreview(result, 'Patient müde, unruhig.').conflicts).toEqual([])
  })

  test('moves conflicts with edits elsewhere and resolves direct editing', () => {
    const conflict = merge('Patient wach.', 'Patient müde.', 'Patient schläfrig.')
    const shifted = editPreview(conflict, `Heute: ${conflict.text}`)
    expect(shifted.conflicts[0].start).toBe(conflict.conflicts[0].start + 7)
    expect(resolvePreviewConflict(shifted, shifted.conflicts[0].id, 'user').text).toBe('Heute: Patient müde.')
    expect(editPreview(shifted, 'Heute: Patient wach!').conflicts).toEqual([])
  })

  test('retains deletion conflicts across further generation and reload', () => {
    let result = merge('A B C', 'A X C', 'A C')
    result = reconcilePreview(result, 'A C D')
    expect(result.text).toBe('A C D')
    expect(result.conflicts).toHaveLength(1)
    const restored = hydratePreview(JSON.parse(JSON.stringify(result)))!
    expect(restored).toEqual(result)
    expect(resolvePreviewConflict(restored, restored.conflicts[0].id, 'user').text).toBe('A X C D')
  })

  test('keeps adjacent punctuation changes when resolving an older word conflict', () => {
    let result = merge('Patient wach.', 'Patient müde.', 'Patient schläfrig.')
    result = reconcilePreview(result, 'Patient schläfrig!')
    expect(result.conflicts[0].generatedText).toBe('schläfrig')
    expect(resolvePreviewConflict(result, result.conflicts[0].id, 'user').text).toBe('Patient müde!')
  })

  test('preserves multiple conflicts while merging independent updates between them', () => {
    let result = merge('Alpha rot, Beta grün, Gamma blau.', 'Alpha rosa, Beta grün, Gamma türkis.', 'Alpha orange, Beta grün, Gamma violett.')
    expect(result.conflicts).toHaveLength(2)
    result = reconcilePreview(result, 'Alpha orange, Beta gelb, Gamma violett.')
    expect(result.conflicts).toHaveLength(2)
    for (const conflict of result.conflicts) result = resolvePreviewConflict(result, conflict.id, 'user')
    expect(result.text).toBe('Alpha rosa, Beta gelb, Gamma türkis.')
  })

  test('supports a deliberately empty draft and ignores invalid stored ranges', () => {
    const empty = editPreview(createPreviewDocument('Generated'), '')
    expect(reconcilePreview(empty, 'Generated').text).toBe('')
    expect(hydratePreview({ ...empty, conflicts: [{ start: -1 }] })?.conflicts).toEqual([])
    expect(hydratePreview({ text: 12 })).toBeNull()
  })

  test('diffs reconstruct arbitrary short strings deterministically', () => {
    let seed = 17
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed }
    const alphabet = ['a', 'b', ' ', '.', '\n', 'ü', '🙂']
    const text = () => Array.from({ length: random() % 30 }, () => alphabet[random() % alphabet.length]).join('')
    for (let i = 0; i < 500; i++) {
      const before = text()
      const after = text()
      for (const characters of [false, true]) {
        const edits = textEdits(before, after, characters)
        let result = before
        for (const edit of edits.toReversed()) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
        expect(result).toBe(after)
      }
      expect(merge(before, before, after).text).toBe(after)
      expect(merge(before, after, after).conflicts).toEqual([])
    }
  })
})
