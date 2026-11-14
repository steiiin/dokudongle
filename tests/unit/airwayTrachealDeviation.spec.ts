import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'
import { AssessedValue } from '@/types/protocol/input'
import { ProtocolVerbosity } from '@/types/protocol'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('Tracheal deviation in A', () => {
  test('only assessed positive tracheal deviation makes the context critical', () => {
    const store = useDokuStore()
    const finding = store.doku.xAbcde.trachealDeviation
    expect(store.context.isCritical).toBe(false)
    finding.value = true
    expect(store.context.isCritical).toBe(false)
    finding.assessed = true
    expect(store.context.isCritical).toBe(true)
    finding.value = false
    expect(store.context.isCritical).toBe(false)
  })


  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])('renders assessed findings only in A at verbosity %s', verbosity => {
    const store = useDokuStore()
    vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
    const airway = store.doku.xAbcde
    expect(airway.trachealDeviation).toEqual(AssessedValue.unassessed(false))
    airway.trachealDeviation.value = true
    expect(airway.generateText()).not.toMatch(/Trachea/)
    expect(airway.needTreatment).toBe(false)
    airway.trachealDeviation.assessed = true
    expect(airway.generateText()).toContain('Trachea verschoben')
    expect(airway.needTreatment).toBe(true)
    expect(store.doku.xaBcde.generateText()).not.toMatch(/Trachea/)
    expect(store.doku.xaBcde.needTreatment).toBe(false)
    expect(store.doku.xaBcde.normalBreathing).toBe(true)
    airway.trachealDeviation.value = false
    expect(airway.needTreatment).toBe(false)
    expect(airway.generateText()).toContain('keine Trachealverschiebung')
  })

  test.each(['saved', 'temporary', 'history'] as const)('migrates B findings in %s protocols and saves them in A', async source => {
    for (const key of ['trachealDeviation', 'hasTrachealDeviation']) {
      for (const finding of [false, true, { assessed: false, value: true }, { assessed: true, value: false }, { assessed: true, value: true }]) {
        const store = useDokuStore()
        const doku = { xaBcde: { [key]: finding }, xabcDe: { psychDementia: true } }
        const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
        if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
        if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
        if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
          schemaVersion: 1,
          protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku: doku as never }],
        })
        await store.hydrateFromStorage()
        if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
        const expected = typeof finding === 'boolean' ? { assessed: finding, value: finding } : finding
        expect(store.doku.xAbcde.trachealDeviation).toBeInstanceOf(AssessedValue)
        expect(store.doku.xAbcde.trachealDeviation).toMatchObject(expected)
        await store.persistToStorage()
        const saved = vi.mocked(saveDokuState).mock.lastCall![0]
        expect(saved.doku.xAbcde.trachealDeviation).toEqual(expected)
        expect(saved.doku.xaBcde).not.toHaveProperty('trachealDeviation')
        expect(saved.doku.xaBcde).not.toHaveProperty('hasTrachealDeviation')
        vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
        await store.hydrateFromStorage()
        expect(store.doku.xAbcde.trachealDeviation).toMatchObject(expected)
      }
    }
  })

  test('prefers the A finding over old B values', async () => {
    const trachealDeviation = { assessed: true, value: false }
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1,
      doku: { xAbcde: { trachealDeviation }, xaBcde: { trachealDeviation: true, hasTrachealDeviation: true } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xAbcde.trachealDeviation).toMatchObject(trachealDeviation)
  })
})
