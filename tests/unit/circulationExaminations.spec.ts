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

const normalEdema = { grade: 'keine Ödeme', variation: '' } as const
const abnormalEdema = { grade: 'Unterschenkelödeme', variation: 'zunehmend' } as const

describe('Circulation assessment semantics', () => {
  test('defaults to unassessed findings', () => {
    const circulation = useDokuStore().doku.xabCde
    expect(circulation.edema).toEqual(AssessedValue.unassessed(normalEdema))
    expect(circulation.ecg).toEqual(AssessedValue.unassessed('SR'))
    expect(circulation.edemaText).toBe('')
    expect(circulation.ecgText).toBe('')
  })

  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])(
    'preserves edema text rules at verbosity %s', verbosity => {
      const store = useDokuStore()
      const circulation = store.doku.xabCde
      for (const hasHeartIssue of [false, true]) {
        vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity, isHigh: verbosity === ProtocolVerbosity.HIGH, hasHeartIssue })
        for (const value of [normalEdema, abnormalEdema]) {
          circulation.edema = AssessedValue.unassessed({ ...value })
          expect(circulation.edemaText).toBe('')
          expect(circulation.generateText()).not.toContain(value.grade)
          expect(circulation.needTreatment).toBe(false)
          circulation.edema.assessed = true
          const expected = value === normalEdema
            ? (verbosity === ProtocolVerbosity.HIGH || hasHeartIssue ? 'keine Ödeme' : '')
            : 'Unterschenkelödeme (zunehmend)'
          expect(circulation.edemaText).toBe(expected)
          if (expected) expect(circulation.generateText()).toContain(expected)
          expect(circulation.needTreatment).toBe(false)
        }
      }
      circulation.edema.value.variation = ''
      expect(circulation.edemaText).toBe('Unterschenkelödeme')
    },
  )

  test.each(['SR', 'VHF', 'TAA 130-160/min'])('preserves ECG text and treatment rules for %s', rhythm => {
    const circulation = useDokuStore().doku.xabCde
    circulation.ecg.value = rhythm
    expect(circulation.ecgText).toBe('')
    expect(circulation.needTreatment).toBe(false)
    circulation.ecg.assessed = true
    expect(circulation.ecgText).toBe(rhythm)
    expect(circulation.generateText()).toContain(rhythm)
    expect(circulation.needTreatment).toBe(rhythm !== 'SR' && rhythm !== 'VHF')
  })
})

describe('Circulation persistence', () => {
  test.each(['saved', 'temporary', 'history'] as const)('migrates legacy edema in %s protocols', async source => {
    for (const edema of [normalEdema, abnormalEdema]) {
      const store = useDokuStore()
      const ecg = { assessed: true, value: 'VHF' }
      const doku = { xabCde: { edema, ecg } }
      const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
      if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
        schemaVersion: 1,
        protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku: doku as never }],
      })
      await store.hydrateFromStorage()
      if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
      expect(store.doku.xabCde.edema).toBeInstanceOf(AssessedValue)
      expect(store.doku.xabCde.edema).toEqual(new AssessedValue(edema !== normalEdema, edema))
      expect(store.doku.xabCde.ecg).toBeInstanceOf(AssessedValue)
      expect(store.doku.xabCde.ecg).toMatchObject(ecg)
    }
  })

  test.each([
    undefined,
    { assessed: false, value: normalEdema }, { assessed: true, value: normalEdema },
    { assessed: false, value: abnormalEdema }, { assessed: true, value: abnormalEdema },
  ])('round-trips missing or wrapped edema: %j', async edema => {
    const ecg = { assessed: true, value: 'TAA 130-160/min' }
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabCde: { edema, ecg } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    const expected = edema ?? { assessed: false, value: normalEdema }
    expect(saved.schemaVersion).toBe(1)
    expect(saved.doku.xabCde.edema).toEqual(expected)
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    expect(store.doku.xabCde.edema).toBeInstanceOf(AssessedValue)
    expect(store.doku.xabCde.edema).toMatchObject(expected)
    expect(store.doku.xabCde.ecg).toBeInstanceOf(AssessedValue)
    expect(store.doku.xabCde.ecg).toMatchObject(ecg)
  })
})
