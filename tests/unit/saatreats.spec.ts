import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { TreatmentSaatreats } from '@/types/protocol/treatment/treatmentSaatreats'
import { ProtocolCourse } from '@/types/protocol'
import { ConsentMedTask } from '@/types/lists/saamed'
import { DATA_Saatreats } from '@/data/lists/saatreats'

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
  vi.clearAllMocks()
  vi.mocked(loadDokuState).mockReset()
})

describe('invasive procedure protocol', () => {
  test('uses distinct IDs and produces literal catalog text in selection order without duplicates', () => {
    const ids = DATA_Saatreats.flatMap(group => group.chips.map(chip => chip.id))
    expect(new Set(ids).size).toBe(ids.length)
    const treatment = new TreatmentSaatreats()
    expect(treatment.getBlock()).toBe('')
    treatment.selectedIds = ['intraossaer', 'unknown', 'pvk-20g', 'intraossaer']
    expect(treatment.getBlock()).toBe('Intraossärer Zugang; PVK 20 G;')
    treatment.selectedIds = ['unknown']
    expect(treatment.getBlock()).toBe('')
  })

  test.each(['standard', 'verlegung', 'einweisung'] as const)('places procedures immediately before medications for %s', flavor => {
    const store = useDokuStore()
    if (flavor !== 'standard') store.setFlavor(flavor, true)
    store.doku.saatreats.selectedIds = ['intraossaer', 'pvk-20g']
    store.doku.saamed.medTasks = [new ConsentMedTask('adrenalin', 'rea', '', true, '', '')]
    expect(store.generatedProtocol).toMatch(/Intraossärer Zugang; PVK 20 G;\s+SAA Adrenalin/)
  })

  test('omits invasive procedures for Fehlfahrt and the special NEF course', () => {
    const store = useDokuStore()
    store.doku.saatreats.selectedIds = ['pvk-20g']
    store.doku.flavors.no_emergency_call = true
    expect(store.generatedProtocol).not.toContain('PVK')
    store.doku.flavors.no_emergency_call = false
    store.doku.course = ProtocolCourse.NEF_VOR_ORT
    expect(store.generatedProtocol).not.toContain('PVK')
  })

  test('persists selection and restores a functioning treatment instance', async () => {
    const store = useDokuStore()
    store.doku.saatreats.selectedIds = ['intraossaer', 'pvk-20g']
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.doku.saatreats).toEqual({ selectedIds: ['intraossaer', 'pvk-20g'] })
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.saatreats).toBeInstanceOf(TreatmentSaatreats)
    expect(restored.doku.saatreats.selectedIds).toEqual(['intraossaer', 'pvk-20g'])
    expect(restored.doku.saatreats.getBlock()).toBe('Intraossärer Zugang; PVK 20 G;')
  })

  test('resets a new protocol and restores the archived selection', async () => {
    const store = useDokuStore()
    store.doku.saatreats.selectedIds = ['endotracheal', 'pvk-20g']
    await store.newProtocol()
    expect(store.doku.saatreats.selectedIds).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.doku.saatreats).toBeInstanceOf(TreatmentSaatreats)
    expect(store.doku.saatreats.selectedIds).toEqual(['endotracheal', 'pvk-20g'])
    expect(store.doku.saatreats.getBlock()).toBe('Endotracheale Intubation; PVK 20 G;')
    store.setFlavor('no_emergency_call', true)
    expect(store.doku.saatreats.selectedIds).toEqual([])
    expect(store.doku.saatreats.getBlock()).toBe('')
  })

  test.each(['saved', 'history'] as const)('defaults old %s protocols to an empty selection', async source => {
    const doku = { situation: { _text: 'Unverändert' } }
    vi.mocked(loadDokuState).mockResolvedValueOnce(source === 'saved'
      ? { schemaVersion: 1, doku }
      : { schemaVersion: 1, protocolHistory: [{ id: 'old', archivedAt: new Date().toISOString(), doku: doku as never }] })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    if (source === 'history') expect(await store.restoreProtocolFromHistory('old')).toBe(true)
    expect(store.doku.situation.value).toBe('Unverändert')
    expect(store.doku.saatreats).toBeInstanceOf(TreatmentSaatreats)
    expect(store.doku.saatreats.selectedIds).toEqual([])
    expect(store.doku.saatreats.getBlock()).toBe('')
  })
})
