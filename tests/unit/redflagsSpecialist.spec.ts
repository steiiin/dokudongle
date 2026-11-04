import { describe, expect, test, vi } from 'vitest'
import type { RedflagCatalog, RedflagScenario } from '@/types/redflags'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'

vi.mock('@/data/redflags', () => {
  const scenario = (id: string, extra: Partial<RedflagScenario> = {}): RedflagScenario => ({
    id, name: id, requirements: '', application: 'BvO', category: 'neuro',
    majorSignalIds: [], minorSignalIds: ['minor'], diagnoses: [], consequences: [],
    ...extra,
  })
  const catalog: RedflagCatalog = {
    signals: [{ id: 'minor', text: 'anhaltenden Beschwerden' }],
    scenarios: [
      scenario('missing'),
      scenario('null', { minorSpecialist: null }),
      scenario('empty', { minorSpecialist: '' }),
      scenario('whitespace', { minorSpecialist: ' \t ' }),
      scenario('cardiology', { minorSpecialist: ' Kardiologe ' }),
      scenario('cardiology-duplicate', { minorSpecialist: 'Kardiologe' }),
      scenario('neurology', { minorSpecialist: 'Neurologe' }),
      scenario('parent', { minorSpecialist: 'Neurologe', minorSignalIds: [] }),
    ],
    subscenarios: [{
      id: 'child', parentId: 'parent', name: 'Child', requirements: '',
      majorSignalIds: [], minorSignalIds: ['minor'], diagnoses: [], consequences: [],
    }],
  }
  return { DATA_Redflags: catalog }
})

function select(...ids: string[]): TreatmentRedflags {
  const value = new TreatmentRedflags()
  value.noTransportType = 'BvO'
  value.scenarioSelections = ids.map(scenarioId => ({ scenarioId, subscenarioIds: [] }))
  return value
}

describe('RedFlags minor specialist text', () => {
  test.each(['missing', 'null', 'empty', 'whitespace'])('uses the historical wording for %s', id => {
    expect(select(id).getRedflagBlock()).toContain(
      'Bei anhaltenden Beschwerden Rücksprache Haus-/Facharzt. \n',
    )
  })

  test.each(['BvO', 'Verweigerung'] as const)('uses a trimmed specialist for %s', application => {
    const value = select('cardiology')
    value.noTransportType = application
    expect(value.getRedflagBlock()).toContain(
      'Bei anhaltenden Beschwerden Rücksprache Hausarzt/Kardiologe. \n',
    )
  })

  test('joins distinct specialists with slashes in selection order and ignores missing entries', () => {
    const value = select('missing', 'neurology', 'cardiology', 'cardiology-duplicate', 'null', 'whitespace')
    expect(value.getRedflagBlock()).toContain(
      'Bei anhaltenden Beschwerden Rücksprache Hausarzt/Neurologe/Kardiologe. \n',
    )
    expect(value.getRedflagBlock().match(/Rücksprache/g)).toHaveLength(1)
  })

  test('uses the parent specialist for explicitly selected child signals', () => {
    const value = select('parent')
    value.scenarioSelections = [{ scenarioId: 'parent', subscenarioMode: 'selected', subscenarioIds: ['child'] }]
    expect(value.getRedflagBlock()).toContain(
      'Bei anhaltenden Beschwerden Rücksprache Hausarzt/Neurologe. \n',
    )
  })

  test('ignores specialists from invalid selections while keeping the error visible', () => {
    const value = select('missing')
    value.scenarioSelections.push({ scenarioId: 'cardiology', subscenarioIds: ['unknown-child'] })
    const text = value.getRedflagBlock()
    expect(text).toContain('RedFlags-Auswahl prüfen')
    expect(text).toContain('Rücksprache Haus-/Facharzt. \n')
    expect(text).not.toContain('Kardiologe')
  })

  test('omits the consultation sentence when the minor block is disabled', () => {
    const value = select('cardiology')
    value.disableMinorBlock = true
    expect(value.getRedflagBlock()).not.toContain('Rücksprache')
  })

  test('omits the consultation sentence when no minor signals are included or remain', () => {
    const value = select('parent')
    value.scenarioSelections = [{ scenarioId: 'parent', subscenarioMode: 'selected', subscenarioIds: [] }]
    expect(value.getRedflagBlock()).not.toContain('Rücksprache')
    value.scenarioSelections = [{ scenarioId: 'cardiology', subscenarioIds: [] }]
    value.removedMinorSignalIds = ['minor']
    expect(value.getRedflagBlock()).not.toContain('Rücksprache')
  })

  test('keeps legacy scenario wording unchanged', () => {
    const value = new TreatmentRedflags()
    value.noTransportType = 'BvO'
    value.choosenScenarios = [{
      id: 'legacy', name: 'Legacy', requirements: '', application: 'BvO', category: 'neuro',
      majorSignals: [], minorSignals: ['alten Beschwerden'], diagnoses: [], consequences: '',
    }]
    expect(value.getRedflagBlock()).toContain('Bei alten Beschwerden Rücksprache Haus-/Facharzt. \n')
  })
})
