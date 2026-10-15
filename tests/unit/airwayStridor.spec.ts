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

describe('Stridor assessment semantics', () => {
  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])('respects assessment and verbosity %s', verbosity => {
    const store = useDokuStore()
    vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
    const airway = store.doku.xAbcde
    expect(airway.stridor).toEqual(AssessedValue.unassessed(false))
    for (const value of [false, true]) {
      airway.stridor = AssessedValue.unassessed(value)
      expect(airway.generateText()).not.toMatch(/Stridor/i)
      expect(airway.needTreatment).toBe(false)
    }
    airway.stridor = AssessedValue.assessed(true)
    expect(airway.generateText()).toContain('Stridor')
    expect(airway.needTreatment).toBe(true)
    airway.stridor.value = false
    expect(airway.needTreatment).toBe(false)
    expect(airway.generateText().includes('kein Stridor')).toBe(verbosity !== ProtocolVerbosity.LOW)
  })
})

describe('Stridor persistence', () => {
  test.each([
    { assessed: false, value: false }, { assessed: true, value: false }, { assessed: true, value: true },
  ])('migrates the previous wrapped field name: %j', async hasStridor => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xAbcde: { hasStridor } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xAbcde.stridor).toBeInstanceOf(AssessedValue)
    expect(store.doku.xAbcde.stridor).toMatchObject(hasStridor)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.doku.xAbcde.stridor).toEqual(hasStridor)
    expect(saved.doku.xAbcde).not.toHaveProperty('hasStridor')
  })

  test('prefers stridor when both field names are present', async () => {
    const stridor = { assessed: true, value: false }
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, doku: { xAbcde: { stridor, hasStridor: true } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xAbcde.stridor).toMatchObject(stridor)
  })

  test.each(['saved', 'temporary', 'history'] as const)('migrates legacy booleans in %s records', async source => {
    for (const value of [false, true]) {
      const store = useDokuStore()
      const doku = { xAbcde: { hasStridor: value }, xabcDe: { psychDementia: true } }
      const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
      if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
        schemaVersion: 1,
        protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku: doku as never }],
      })
      await store.hydrateFromStorage()
      if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
      expect(store.doku.xAbcde.stridor).toBeInstanceOf(AssessedValue)
      expect(store.doku.xAbcde.stridor).toEqual(new AssessedValue(value, value))
      expect(store.doku.xabcDe.psych.dementia).toBe(true)
    }
  })

  test.each([
    undefined, { assessed: false, value: false }, { assessed: true, value: false }, { assessed: true, value: true },
  ])('restores and round-trips wrapped or missing values: %j', async stridor => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xAbcde: { stridor } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    const expected = stridor ?? { assessed: false, value: false }
    expect(store.doku.xAbcde.stridor).toMatchObject(expected)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.schemaVersion).toBe(1)
    expect(saved.doku.xAbcde.stridor).toEqual(expected)
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    expect(store.doku.xAbcde.stridor).toBeInstanceOf(AssessedValue)
    expect(store.doku.xAbcde.stridor).toMatchObject(expected)
  })
})
