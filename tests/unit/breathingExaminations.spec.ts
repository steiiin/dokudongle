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

const findings = [
  ['accessoryMuscles', 'useAccessoryMuscles', 'Einsatz AHM', 'kein Einsatz AHM'],
  ['retractions', 'hasRetractions', 'Einziehungen', 'keine Einziehungen'],
  ['paradoxical', 'isParadoxical', 'paradoxe Atmung', 'keine paradoxe Atmung'],
  ['jugularVenousDistension', 'hasJugularVenousDistension', 'Halsvenenstauung', 'keine Halsvenenstauung'],
  ['emphysema', 'hasEmphysema', 'subkutanes Emphysem', 'kein subkutanes Emphysem'],
  ['trachealDeviation', 'hasTrachealDeviation', 'Trachea verschoben', 'keine Trachealverschiebung'],
] as const

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('Breathing assessment semantics', () => {
  test.each(findings)('%s respects assessment and verbosity', (key, _legacy, positive, negative) => {
    const store = useDokuStore()
    const breathing = store.doku.xaBcde
    expect(breathing[key]).toEqual(AssessedValue.unassessed(false))
    for (const verbosity of [ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH]) {
      vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
      for (const value of [false, true]) {
        breathing[key] = AssessedValue.unassessed(value)
        expect(breathing.thoraxText).toBe('')
        expect(breathing.generateText()).not.toContain(positive)
        expect(breathing.generateText()).not.toContain(negative)
        expect(breathing.needTreatment).toBe(false)
        expect(breathing.normalBreathing).toBe(true)
      }
      breathing[key] = AssessedValue.assessed(true)
      expect(breathing.thoraxText).toContain(positive)
      expect(breathing.needTreatment).toBe(true)
      expect(breathing.normalBreathing).toBe(false)
      breathing[key].value = false
      expect(breathing.needTreatment).toBe(false)
      expect(breathing.normalBreathing).toBe(true)
      expect(breathing.thoraxText.includes(negative)).toBe(verbosity !== ProtocolVerbosity.LOW)
    }
  })

  test('only assessed positive tracheal deviation makes the context critical', () => {
    const store = useDokuStore()
    const finding = store.doku.xaBcde.trachealDeviation
    expect(store.context.isCritical).toBe(false)
    finding.value = true
    expect(store.context.isCritical).toBe(false)
    finding.assessed = true
    expect(store.context.isCritical).toBe(true)
    finding.value = false
    expect(store.context.isCritical).toBe(false)
  })

  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])('preserves auscultation rules at verbosity %s', verbosity => {
    const store = useDokuStore()
    vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
    const breathing = store.doku.xaBcde
    expect(breathing.auscultation.assessed).toBe(false)
    breathing.auscultation.value.wheezing = 're.'
    expect(breathing.auscultationText).toBe('')
    expect(breathing.needTreatment).toBe(false)
    breathing.auscultation.assessed = true
    expect(breathing.auscultationText).toBe('Giemen re')
    expect(breathing.needTreatment).toBe(true)
    breathing.auscultation.value.wheezing = ''
    expect(breathing.needTreatment).toBe(false)
    expect(breathing.auscultationText).toBe(verbosity === ProtocolVerbosity.LOW ? '' : 'Ausk. unauffällig')
  })
})

describe('Breathing persistence', () => {
  test.each(['saved', 'temporary', 'history'] as const)('migrates legacy booleans in %s protocols', async source => {
    for (const value of [false, true]) {
      const store = useDokuStore()
      const doku = { xaBcde: Object.fromEntries(findings.map(([, legacy]) => [legacy, value])), xabcDe: { psychDementia: true } }
      const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
      if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
        schemaVersion: 1,
        protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku: doku as never }],
      })
      await store.hydrateFromStorage()
      if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
      for (const [key, legacy] of findings) {
        expect(store.doku.xaBcde[key]).toBeInstanceOf(AssessedValue)
        expect(store.doku.xaBcde[key]).toEqual(new AssessedValue(value, value))
        expect(store.doku.xaBcde).not.toHaveProperty(legacy)
      }
    }
  })

  test.each([
    undefined, { assessed: false, value: false }, { assessed: false, value: true },
    { assessed: true, value: false }, { assessed: true, value: true },
  ])('round-trips missing or wrapped findings: %j', async finding => {
    const auscultation = { assessed: true, value: { wheezing: 're.', crackles: '', dimished: 'li.' } }
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1,
      doku: { xaBcde: { ...Object.fromEntries(findings.map(([key]) => [key, finding])), auscultation } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.schemaVersion).toBe(1)
    for (const [key, legacy] of findings) {
      expect(saved.doku.xaBcde[key]).toEqual(finding ?? { assessed: false, value: false })
      expect(saved.doku.xaBcde).not.toHaveProperty(legacy)
    }
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    for (const [key] of findings) {
      expect(store.doku.xaBcde[key]).toBeInstanceOf(AssessedValue)
      expect(store.doku.xaBcde[key]).toMatchObject(finding ?? { assessed: false, value: false })
    }
    expect(store.doku.xaBcde.auscultation).toBeInstanceOf(AssessedValue)
    expect(store.doku.xaBcde.auscultation).toMatchObject(auscultation)
  })

  test('prefers new fields and supports wrapped legacy fields', async () => {
    const negative = { assessed: true, value: false }
    const breathing = Object.fromEntries(findings.flatMap(([key, legacy]) => [[key, negative], [legacy, true]]))
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xaBcde: breathing } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    for (const [key] of findings) expect(store.doku.xaBcde[key]).toMatchObject(negative)
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, doku: { xaBcde: Object.fromEntries(findings.map(([, legacy]) => [legacy, negative])) },
    })
    await store.hydrateFromStorage()
    for (const [key] of findings) expect(store.doku.xaBcde[key]).toMatchObject(negative)
  })
})
