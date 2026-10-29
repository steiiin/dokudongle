import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'

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
})

const sections = ['xAbcde', 'xaBcde', 'xabCde', 'xabcDe', 'xabcdE'] as const

for (const abnormal of [false, true]) {
  test.each(['saved', 'temporary', 'history'] as const)(
    `discards legacy immediate treatments from %s protocols with abnormal findings=${abnormal}`,
    async source => {
      const store = useDokuStore()
      store.doku.treatment.setText('MEASURES_RETAINED')
      if (abnormal) {
        store.doku.xAbcde.obstruction = 'Fremdkörper'
        store.doku.xaBcde.hasHypoxia = true
        store.doku.xabCde.skin.color = 'blass'
        store.doku.xabcDe.headache = true
        store.doku.xabcdE.nausea = true
      }
      const expectedText = store.generatedProtocol
      const expectedAssessments = sections.map(key => store.doku[key].generateText())
      await store.persistToStorage()
      const doku = structuredClone(vi.mocked(saveDokuState).mock.lastCall![0].doku)
      for (const key of sections) doku[key].treatment = `LEGACY_IMMEDIATE_${key}`
      const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku }
      if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
        schemaVersion: 1,
        protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku }],
      })

      await store.hydrateFromStorage()
      if (source !== 'saved') {
        await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
      }

      for (const [index, key] of sections.entries()) {
        expect(store.doku[key]).not.toHaveProperty('treatment')
        expect(store.doku[key].generateText()).toBe(expectedAssessments[index])
        expect(store.doku[key].needTreatment).toBe(abnormal)
      }
      expect(store.generatedProtocol).toBe(expectedText)
      expect(store.generatedProtocol).not.toMatch(/LEGACY_IMMEDIATE_|>>/)
      expect(store.generatedProtocol).toContain('MEASURES_RETAINED')
      expect(store.doku.treatment.value).toBe('MEASURES_RETAINED')

      await store.persistToStorage()
      const saved = vi.mocked(saveDokuState).mock.lastCall![0]
      expect(saved.schemaVersion).toBe(1)
      for (const key of sections) {
        expect(saved.doku[key]).not.toHaveProperty('treatment')
        for (const entry of saved.protocolHistory ?? []) expect(entry.doku[key]).not.toHaveProperty('treatment')
      }
      vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
      await store.hydrateFromStorage()
      expect(store.generatedProtocol).toBe(expectedText)
    },
  )
}
