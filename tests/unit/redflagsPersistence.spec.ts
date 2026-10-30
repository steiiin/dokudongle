import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(), loadDokuState: vi.fn(), loadProtocolAuditEntries: vi.fn(),
  loadTemporaryProtocolState: vi.fn(), removeTemporaryProtocolState: vi.fn(), saveDokuState: vi.fn(),
}))

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  vi.mocked(loadDokuState).mockResolvedValue(null)
  vi.mocked(loadTemporaryProtocolState).mockResolvedValue(null)
})

describe('RedFlags persistence compatibility', () => {
  test.each(['legacy', 'new', 'mixed'] as const)('round-trips %s selections through active, history and temporary protocols', async mode => {
    const protocol = resetProtocol()
    const flags = protocol.redflags
    flags.noTransportType = 'BvO'
    if (mode !== 'new') {
      flags.choosenScenarios = [{ id: 'old-id', name: 'Old name', requirements: 'Old requirement', application: 'BvO', category: 'neuro',
        majorSignals: ['Old major', 'Removed'], minorSignals: ['Old minor'], diagnoses: ['Old diagnosis'], consequences: 'Old risk' }]
      flags.choosenSignals = [{ id: 'removed-from-catalog', text: 'Old custom' }]
      flags.removedMajorSignals = ['Removed']
      flags.removedMinorSignals = ['Old minor']
    }
    if (mode !== 'legacy') {
      flags.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['synkope-bvo-orthostatisch'] }]
      flags.removedMajorSignalIds = ['atmung-luftnot']
      flags.removedMinorSignalIds = ['neuro-fallneigung-anhaltend']
    }
    const expected = flags.getRedflagBlock()
    const raw = copy(protocol)
    if (mode === 'legacy') {
      for (const key of ['scenarioSelections', 'removedMajorSignalIds', 'removedMinorSignalIds'] as const) {
        delete (raw.redflags as Partial<TreatmentRedflags>)[key]
      }
    }
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: raw,
      protocolHistory: [{ id: 'history', archivedAt: '2026-10-30T10:00:00.000Z', doku: copy(raw) }] })
    vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce({ schemaVersion: 1, savedAt: '2026-10-30T11:00:00.000Z', doku: copy(raw) })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.redflags).toBeInstanceOf(TreatmentRedflags)
    expect(store.doku.redflags.getRedflagBlock()).toBe(expected)
    expect(store.protocolHistory).toHaveLength(2)
    for (const entry of store.protocolHistory) expect(entry.doku.redflags.getRedflagBlock()).toBe(expected)
    expect(store.doku.redflags.scenarioSelections).toEqual(flags.scenarioSelections)
    await store.persistToStorage()
    const saved = copy(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    const restarted = useDokuStore()
    await restarted.hydrateFromStorage()
    expect(restarted.doku.redflags.getRedflagBlock()).toBe(expected)
    expect(await restarted.restoreProtocolFromHistory('history')).toBe(true)
    expect(restarted.doku.redflags.getRedflagBlock()).toBe(expected)
  })

  test('preserves unknown and wrongly assigned IDs without dropping the rest of a saved protocol', async () => {
    const raw = copy(resetProtocol())
    raw.situation._text = 'Keep this protocol'
    raw.redflags.noTransportType = 'BvO'
    raw.redflags.scenarioSelections = [
      { scenarioId: 'missing-parent', subscenarioIds: [] },
      { scenarioId: 'synkope-bvo', subscenarioIds: ['missing-child'] },
      { scenarioId: 'synkope-verweigerung', subscenarioIds: ['synkope-bvo-orthostatisch'] },
    ]
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: raw })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.situation.value).toBe('Keep this protocol')
    expect(store.doku.redflags.scenarioSelections).toEqual(raw.redflags.scenarioSelections)
    expect(store.doku.redflags.getResolvedContent().resolutions.every(entry => entry.error)).toBe(true)
    expect(store.generatedProtocol).toContain('RedFlags-Auswahl prüfen')
    expect(vi.mocked(saveDokuState).mock.lastCall![0].doku.redflags.scenarioSelections).toEqual(raw.redflags.scenarioSelections)
  })
})
