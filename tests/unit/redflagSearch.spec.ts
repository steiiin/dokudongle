import { describe, expect, test } from 'vitest'
import { normalizeRedflagSearch, searchRedflagEntries, type RedflagSearchEntry } from '@/utils/redflagSearch'

const resultIds = (entries: readonly RedflagSearchEntry[], query: string) =>
  searchRedflagEntries(entries, query).map(entry => entry.id)

describe('RedFlag search ranking', () => {
  test('prioritizes own names, parent names, categories, then descriptions', () => {
    const entries = [
      { id: 'description', name: 'A', requirements: 'Synkope' },
      { id: 'category', name: 'B', category: 'Synkope' },
      { id: 'parent', name: 'C', parentName: 'Synkope' },
      { id: 'alias', name: 'D', name_alt: 'Synkope' },
      { id: 'title', name: 'Synkpoe' },
    ]
    expect(resultIds(entries, 'synkope')).toEqual(['alias', 'title', 'parent', 'category', 'description'])
  })

  test('ranks exact, prefix, phrase, all-word, then fuzzy matches', () => {
    const entries = [
      { id: 'fuzzy', name: 'Leichte Synkpoe' },
      { id: 'words', name: 'Synkope leichte' },
      { id: 'phrase', name: 'Bekannte leichte Synkope' },
      { id: 'prefix', name: 'Leichte Synkope bekannt' },
      { id: 'exact', name: 'Leichte Synkope' },
    ]
    expect(resultIds(entries, 'leichte synkope')).toEqual(['exact', 'prefix', 'phrase', 'words', 'fuzzy'])
  })

  test('breaks ties by edits, unmatched length, German name, then ID without mutating input', () => {
    const entries = [
      { id: 'two-edits', name: 'Kopfxchmerzn' },
      { id: 'one-edit', name: 'Kopfschmerzn' },
      { id: 'long', name: 'Synkope mit langem Zusatz' },
      { id: 'short', name: 'Synkope leicht' },
      { id: 'z', name: 'Ärger', name_alt: 'Synkope' },
      { id: 'a', name: 'Ärger', name_alt: 'Synkope' },
      { id: 'b', name: 'Bauch', name_alt: 'Synkope' },
    ]
    const before = structuredClone(entries)
    expect(resultIds(entries, 'synkope')).toEqual(['a', 'z', 'b', 'short', 'long'])
    expect(resultIds(entries, 'kopfschmerzen')).toEqual(['one-edit', 'two-edits'])
    expect(entries).toEqual(before)
  })

  test.each(['synkpoe', 'synkoe', 'synkopee', 'synkoxe', 'synk', ' SYNKOPE '])('finds Synkope for %s', query => {
    expect(resultIds([{ id: 's', name: 'Synkope (leicht)' }], query)).toEqual(['s'])
  })

  test('bounds typo edits by query word length and rejects scattered letters', () => {
    expect(resultIds([{ id: 'short', name: 'ACS' }], 'ads')).toEqual([])
    expect(resultIds([{ id: 'medium', name: 'Synkope' }], 'synxxpe')).toEqual([])
    expect(resultIds([{ id: 'long', name: 'Kopfschmerzen' }], 'kopxxchmerzen')).toEqual(['long'])
    expect(resultIds([{ id: 'long', name: 'Kopfschmerzen' }], 'kopxxxhmerzen')).toEqual([])
    expect(resultIds([{ id: 'scattered', name: 's y n k o p e' }], 'synkope')).toEqual([])
  })

  test('requires all words in a single field without joining names or metadata', () => {
    const entries = [{ id: 's', name: 'Synkope', name_alt: 'Ohnmacht', category: 'neuro', requirements: 'kurzzeitig erholt' }]
    expect(resultIds(entries, 'synkope neuro')).toEqual([])
    expect(resultIds(entries, 'synkope ohnmacht')).toEqual([])
    expect(resultIds(entries, 'erholt kurz')).toEqual(['s'])
    expect(resultIds(entries, 'kurz unbekannt')).toEqual([])
  })

  test('normalizes accents, German spellings, punctuation and whitespace', () => {
    expect(normalizeRedflagSearch('  ÄÖÜ ae/oe/ue Straße STRASSE Café  ')).toBe('aou a o u strasse strasse cafe')
    expect(resultIds([{ id: 's', name: 'Überwärmung (mäßig)' }], 'ueberwaermung maessig')).toEqual(['s'])
    expect(resultIds([{ id: 's', name: 'Synkope (leicht)' }], ' SYNKOPE,   leicht! ')).toEqual(['s'])
  })

  test('supports parent aliases, blank alternatives, empty queries and no matches', () => {
    const entries = [
      { id: 'child', name: 'Orthostatisch', parentNameAlt: 'Ohnmacht' },
      { id: 'blank', name: 'Synkope', name_alt: ' ' },
      { id: 'missing', name: 'Synkope' },
    ]
    expect(resultIds(entries, 'ohnmacht')).toEqual(['child'])
    expect(resultIds(entries, 'synkope')).toEqual(['blank', 'missing'])
    expect(resultIds(entries, 'zzzzzzzz')).toEqual([])
    expect(searchRedflagEntries(entries, '   ')).toEqual(entries)
    expect(searchRedflagEntries(entries, '---')).toEqual(entries)
  })
})
