import { describe, expect, test } from 'vitest'
import { createPreviewDocument, editPreview, hydratePreview, previewDifferences, reconcilePreview, resolvePreviewConflict, resolvePreviewDifference, textEdits } from '@/utils/preview-document'

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

describe('live preview differences', () => {
  test.each(['user', 'generated'] as const)('keeps additions separate through replacements, regeneration and the %s choice', choice => {
    let document = editPreview(createPreviewDocument('orientiert. '), 'orientiert. added.')
    expect(previewDifferences(document)).toMatchObject([{ changeType: 'insertion', userText: 'added.' }])
    document = editPreview(document, 'desorientiert. added.')
    expect(previewDifferences(document)).toMatchObject([
      { changeType: 'replacement', userText: 'desorientiert', generatedText: 'orientiert' },
      { changeType: 'insertion', userText: 'added.' },
    ])
    document = reconcilePreview(document, 'teilweise orientiert. ')
    expect(document.text).toBe('teilweise orientiert. added.')
    const id = document.conflicts[0].id
    expect(previewDifferences(document)).toMatchObject([
      { changeType: 'conflict', userText: 'desorientiert', generatedText: 'teilweise orientiert' },
      { changeType: 'insertion', userText: 'added.' },
    ])
    document = reconcilePreview(document, 'teilweise orientiert! ')
    document = hydratePreview(JSON.parse(JSON.stringify(document)))!
    expect(document.conflicts[0].id).toBe(id)
    document = resolvePreviewDifference(document, id, choice)
    expect(document.text).toBe(`${choice === 'user' ? 'desorientiert' : 'teilweise orientiert'}! added.`)
    expect(previewDifferences(document).at(-1)).toMatchObject({ changeType: 'insertion', userText: 'added.' })
  })

  test.each(['teilweise orientiert.', 'orientiert teilweise.'])('conflicts on a generated qualifier at either replacement boundary: %s', generated => {
    const document = merge('orientiert.', 'desorientiert. added.', generated)
    expect(document.text).toBe(`${generated} added.`)
    expect(document.conflicts).toHaveLength(1)
    expect(resolvePreviewConflict(document, document.conflicts[0].id, 'user').text).toBe('desorientiert. added.')
  })

  test('keeps edits inside an insertion green and clears the marking when removed', () => {
    let document = editPreview(createPreviewDocument('orientiert. '), 'orientiert. added.')
    document = editPreview(document, 'orientiert. edited addition.')
    expect(previewDifferences(document)).toMatchObject([{ changeType: 'insertion', userText: 'edited addition.' }])
    document = editPreview(document, 'orientiert. ')
    expect(previewDifferences(document)).toEqual([])
  })

  test.each(['insertion', 'deletion', 'replacement'])('resolves only the selected %s alongside other edits', changeType => {
    const document = editPreview(createPreviewDocument('Alpha rot. Beta grün. Gamma blau.'), 'Alpha rosa. Beta . Gamma blau. added.')
    const differences = previewDifferences(document)
    expect(differences.map(item => item.changeType)).toEqual(['replacement', 'deletion', 'insertion'])
    const selected = differences.find(item => item.changeType === changeType)!
    const result = resolvePreviewDifference(document, selected.id, 'generated')
    expect(previewDifferences(result).map(item => [item.changeType, item.userText, item.generatedText])).toEqual(
      differences.filter(item => item !== selected).map(item => [item.changeType, item.userText, item.generatedText]))
  })

  test.each([
    ['Patient wach.', 'Patient wacher.'],
    ['Patient wach.', 'Patient müde.'],
    ['Patient wach.', 'Heute: Patient wach.'],
    ['Patient wach.', 'Patient .'],
    ['Patient wach.', ''],
    ['', 'Erste Zeile\n<b>Nur Text</b> 🙂'],
    ['Übelkeit 🙂\nPatient wach.\tEnde', 'Keine Übelkeit 🙂\nPatient müde.\tSchluss'],
  ])('derives selectable differences from %j to %j', (baseline, text) => {
    const document = editPreview(createPreviewDocument(baseline), text)
    const saved = JSON.stringify(document)
    const differences = previewDifferences(document)
    expect(differences.length).toBeGreaterThan(0)
    expect(document.conflicts).toEqual([])
    let restored = text
    for (const difference of differences.toReversed()) {
      expect(difference.kind).toBe('manual')
      expect(text.slice(difference.start, difference.end)).toBe(difference.userText)
      expect(baseline.slice(difference.baseStart, difference.baseEnd)).toBe(difference.generatedText)
      expect(resolvePreviewDifference(document, difference.id, 'user')).toBe(document)
      expect(resolvePreviewDifference(document, difference.id, 'generated').text).toBe(
        text.slice(0, difference.start) + difference.generatedText + text.slice(difference.end))
      restored = restored.slice(0, difference.start) + difference.generatedText + restored.slice(difference.end)
    }
    expect(restored).toBe(baseline)
    expect(JSON.stringify(document)).toBe(saved)
    expect(previewDifferences(hydratePreview(JSON.parse(saved))!)).toEqual(differences)
    expect(previewDifferences(editPreview(document, baseline))).toEqual([])
  })

  test('keeps manual differences and retained conflicts separate across generation updates', () => {
    let document = merge('Alpha rot, Beta grün, Gamma blau.',
      'Alpha rosa, Beta gelb, Gamma türkis.', 'Alpha orange, Beta grün, Gamma violett.')
    document = editPreview(document, `Heute: ${document.text}!`)
    const differences = previewDifferences(document)
    expect(differences.map(item => item.kind)).toEqual(['manual', 'conflict', 'manual', 'conflict', 'manual'])
    for (let index = 1; index < differences.length; index++) {
      expect(differences[index].start).toBeGreaterThanOrEqual(differences[index - 1].end)
    }
    const manual = differences.find(item => item.userText === 'gelb')!
    document = resolvePreviewDifference(document, manual.id, 'generated')
    expect(document.text).toContain('Beta grün')
    expect(document.conflicts).toHaveLength(2)
    const conflict = document.conflicts[0]
    document = resolvePreviewDifference(document, conflict.id, 'user')
    expect(document.text).toContain('Alpha rosa')
    expect(previewDifferences(document)).toContainEqual(expect.objectContaining({
      kind: 'manual', userText: 'rosa', generatedText: 'orange',
    }))
    document = reconcilePreview(document, 'Alpha rosa, Beta grün, Gamma violett.')
    expect(previewDifferences(document).some(item => item.userText === 'rosa')).toBe(false)
    expect(document.conflicts).toHaveLength(1)
  })

  test('replaces a directly edited conflict with a live manual difference', () => {
    const document = editPreview(merge('Patient wach.', 'Patient müde.', 'Patient schläfrig.'), 'Patient fit.')
    expect(document.conflicts).toEqual([])
    expect(previewDifferences(document)).toMatchObject([
      { kind: 'manual', userText: 'fit', generatedText: 'schläfrig' },
    ])
    expect(resolvePreviewDifference(document, 'missing', 'generated')).toBe(document)
  })

  test('places manual differences around a zero-width conflict', () => {
    const document = editPreview(merge('A B C', 'A X C', 'A C'), 'Before A C after')
    expect(previewDifferences(document).map(item => item.kind)).toEqual(['manual', 'conflict', 'manual'])
    expect(previewDifferences(document)[1]).toMatchObject({ start: 9, end: 9, generatedText: '' })
  })
})
