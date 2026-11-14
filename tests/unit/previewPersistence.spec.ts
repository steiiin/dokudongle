import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  loadDokuState: vi.fn(), saveDokuState: vi.fn(), appendProtocolAuditEntry: vi.fn(),
  loadTemporaryProtocolState: vi.fn().mockResolvedValue(null), removeTemporaryProtocolState: vi.fn(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(loadDokuState).mockReset().mockResolvedValue(null)
  vi.mocked(saveDokuState).mockReset().mockResolvedValue(undefined)
  vi.mocked(appendProtocolAuditEntry).mockReset().mockResolvedValue(undefined)
})

describe('preview persistence and lifecycle', () => {
  test('starts from generated text and keeps structured inputs unchanged while editing', () => {
    const store = useDokuStore()
    expect(store.effectiveProtocolText).toBe(store.generatedProtocol)
    const original = JSON.stringify(store.doku)
    store.editPreview('Edited final text')
    expect(store.effectiveProtocolText).toBe('Edited final text')
    expect(JSON.stringify(store.doku)).toBe(original)
    expect(store.hasProtocolData).toBe(true)
  })

  test('merges form changes synchronously without mounting the preview and restores conflicts', async () => {
    const store = useDokuStore()
    store.doku.situation.setText('Patient wach, ruhig.')
    store.editPreview(store.generatedProtocol.replace('Patient wach', 'Patient müde'))
    store.doku.situation.setText('Patient schläfrig, ruhig.')
    expect(store.effectiveProtocolText).toContain('Patient schläfrig, ruhig.')
    expect(store.previewDocument.conflicts[0].userText).toBe('müde')
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.previewDocument).toEqual(saved.preview)
    restored.doku.situation.setText('Patient schläfrig, unruhig.')
    const conflict = restored.previewDocument.conflicts[0]
    restored.resolvePreviewConflict(conflict.id, 'user')
    expect(restored.effectiveProtocolText).toContain('Patient müde, unruhig.')
    expect(restored.previewDocument.conflicts).toEqual([])
  })

  test('archives preview-only work, audits effective text and restores its draft', async () => {
    const store = useDokuStore()
    store.editPreview('Only preview edited')
    await store.newProtocol()
    expect(store.protocolHistory).toHaveLength(1)
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ protocolText: 'Only preview edited' }))
    expect(store.effectiveProtocolText).toBe(store.generatedProtocol)
    const id = store.protocolHistory[0].id
    await store.restoreProtocolFromHistory(id)
    expect(store.effectiveProtocolText).toBe('Only preview edited')
    store.editPreview('Further edits')
    await store.persistToStorage()
    expect(store.protocolHistory.find(entry => entry.id === id)?.preview?.text).toBe('Further edits')
    await store.autoResetProtocol()
    await store.restoreProtocolFromHistory(id)
    expect(store.effectiveProtocolText).toBe('Further edits')
  })

  test('preserves empty drafts through saving and restoration, rejecting blank transmission', async () => {
    const store = useDokuStore()
    store.editPreview('')
    expect(await store.sendProtocol()).toBe(false)
    expect(store.connection.isTransmitting).toBe(false)
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValue(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.effectiveProtocolText).toBe('')
    await restored.newProtocol()
    expect(restored.protocolHistory[0].preview?.text).toBe('')
  })

  test('hydrates legacy protocols without preview data', async () => {
    const store = useDokuStore()
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    delete saved.preview
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    await store.hydrateFromStorage()
    expect(store.effectiveProtocolText).toBe(store.generatedProtocol)
    expect(store.previewDocument.conflicts).toEqual([])
  })
})
