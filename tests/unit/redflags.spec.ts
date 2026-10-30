import { describe, expect, test } from 'vitest'
import { DATA_Redflags, DATA_Scenarios, DATA_Signals, DATA_Subscenarios } from '@/data/redflags'
import type { RedflagCatalog, RedflagContent, RedflagScenarioSelection } from '@/types/redflags'
import { resolveRedflagScenario, selectRedflagTarget, validateRedflagCatalog } from '@/utils/redflags'

const empty: RedflagContent = { majorSignalIds: [], minorSignalIds: [], diagnoses: [], consequences: [] }
const catalog: RedflagCatalog = {
  signals: [{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta' }, { id: 'c', text: 'Gamma' }],
  scenarios: [
    { ...empty, id: 'parent', name: 'Parent', requirements: 'Parent requirement', category: 'neuro', application: 'BvO',
      majorSignalIds: ['a'], minorSignalIds: ['b'], diagnoses: ['Parent diagnosis'], consequences: ['Shared risk'] },
    { ...empty, id: 'other', name: 'Other', requirements: '', category: 'neuro', application: 'BvO' },
  ],
  subscenarios: [
    { ...empty, id: 'first', parentId: 'parent', name: 'First', requirements: 'First requirement',
      majorSignalIds: ['b', 'a'], minorSignalIds: ['c'], diagnoses: ['Child diagnosis', 'Parent diagnosis'], consequences: ['Shared risk', 'First risk'] },
    { ...empty, id: 'second', parentId: 'parent', name: 'Second', requirements: 'Parent requirement',
      majorSignalIds: ['c'], diagnoses: ['Second diagnosis'], consequences: ['Second risk'] },
  ],
}

describe('RedFlags catalog and resolver', () => {
  test('loads the complete replacement catalog with valid stable references', () => {
    expect(DATA_Signals).toHaveLength(9)
    expect(DATA_Scenarios).toHaveLength(135)
    expect(DATA_Subscenarios).toHaveLength(33)
    expect(DATA_Redflags.scenarios).toBe(DATA_Scenarios)
    expect(DATA_Redflags.subscenarios).toBe(DATA_Subscenarios)
    expect(() => validateRedflagCatalog(DATA_Redflags)).not.toThrow()
    for (const scenario of DATA_Scenarios) {
      expect(() => resolveRedflagScenario(DATA_Redflags, { scenarioId: scenario.id, subscenarioIds: [] })).not.toThrow()
    }
  })

  test('combines universal and all child content in catalog order without duplicates', () => {
    const before = JSON.stringify(catalog)
    const result = resolveRedflagScenario(catalog, { scenarioId: 'parent', subscenarioIds: [] })
    expect(result.aggregationMode).toBe('all-subscenarios')
    expect(result.includedSubscenarioIds).toEqual(['first', 'second'])
    expect(result.majorSignals.map(signal => signal.id)).toEqual(['a', 'b', 'c'])
    expect(result.minorSignals).toEqual([])
    expect(result.requirements).toEqual(['Parent requirement', 'First requirement'])
    expect(result.diagnoses).toEqual(['Parent diagnosis', 'Child diagnosis', 'Second diagnosis'])
    expect(result.consequences).toEqual(['Shared risk', 'First risk', 'Second risk'])
    expect(JSON.stringify(catalog)).toBe(before)
  })

  test('includes only explicit children and normalizes duplicate/reversed child IDs', () => {
    const one = resolveRedflagScenario(catalog, { scenarioId: 'parent', subscenarioIds: ['first'] })
    expect(one.aggregationMode).toBe('selected-subscenarios')
    expect(one.majorSignals.map(signal => signal.id)).toEqual(['a', 'b'])
    expect(one.minorSignals.map(signal => signal.id)).toEqual(['c'])
    expect(one.diagnoses).not.toContain('Second diagnosis')
    const two = resolveRedflagScenario(catalog, { scenarioId: 'parent', subscenarioIds: ['second', 'first', 'second'] })
    expect(two.selection.subscenarioIds).toEqual(['first', 'second'])
    expect(two.consequences).toEqual(['Shared risk', 'First risk', 'Second risk'])
  })

  test('handles empty parents without children or invented requirements', () => {
    const result = resolveRedflagScenario(catalog, { scenarioId: 'other', subscenarioIds: [] })
    expect(result.includedSubscenarioIds).toEqual([])
    expect(result.requirements).toEqual([])
    expect(result.majorSignals).toEqual([])
    expect(result.consequences).toEqual([])
  })

  test.each([
    [{ scenarioId: 'missing', subscenarioIds: [] }, 'Unbekanntes Hauptszenario'],
    [{ scenarioId: 'parent', subscenarioIds: ['missing'] }, 'Unbekanntes Unterszenario'],
    [{ scenarioId: 'other', subscenarioIds: ['first'] }, 'gehört nicht'],
  ] satisfies [RedflagScenarioSelection, string][])('rejects invalid selection %j', (selection, error) => {
    expect(() => resolveRedflagScenario(catalog, selection)).toThrow(error)
  })

  test('rejects duplicate IDs, dangling signal references and unknown parents', () => {
    expect(() => validateRedflagCatalog({ ...catalog, signals: [...catalog.signals, catalog.signals[0]] })).toThrow('doppelte')
    expect(() => validateRedflagCatalog({ ...catalog, signals: [] })).toThrow('Unbekanntes Warnzeichen')
    expect(() => validateRedflagCatalog({ ...catalog, subscenarios: [{ ...catalog.subscenarios[0], parentId: 'missing' }] })).toThrow('Unbekanntes Hauptszenario')
  })

  test('selecting children creates, narrows and extends a parent without mutating input', () => {
    const first = selectRedflagTarget(catalog, [], { type: 'subscenario', id: 'first' })
    expect(first).toEqual([{ scenarioId: 'parent', subscenarioIds: ['first'] }])
    const second = selectRedflagTarget(catalog, first, { type: 'subscenario', id: 'second' })
    expect(second[0].subscenarioIds).toEqual(['first', 'second'])
    expect(first[0].subscenarioIds).toEqual(['first'])
    const all = selectRedflagTarget(catalog, second, { type: 'scenario', id: 'parent' })
    expect(all[0].subscenarioIds).toEqual([])
    expect(selectRedflagTarget(catalog, all, { type: 'subscenario', id: 'second' })[0].subscenarioIds).toEqual(['second'])
  })
})
