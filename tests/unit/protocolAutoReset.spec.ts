import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useDokuStore } from '@/store/doku'
import {
  appendProtocolAuditEntry,
  loadDokuState,
  loadTemporaryProtocolState,
  removeTemporaryProtocolState,
  saveDokuState,
  saveTemporaryProtocolState,
} from '@/store/persistence'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
  saveTemporaryProtocolState: vi.fn(),
}))

const MINUTE_MS = 60 * 1000
const RESET_AT_MS = Date.parse('2026-08-19T10:00:00.000Z')

describe('automatic protocol reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(appendProtocolAuditEntry).mockResolvedValue()
    vi.mocked(loadDokuState).mockResolvedValue(null)
    vi.mocked(loadTemporaryProtocolState).mockResolvedValue(null)
    vi.mocked(removeTemporaryProtocolState).mockResolvedValue()
    vi.mocked(saveDokuState).mockResolvedValue()
    vi.mocked(saveTemporaryProtocolState).mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('keeps the protocol for 60 minutes and then resets it', () => {
    const store = useDokuStore()
    store.lastProtocolResetAt = new Date(RESET_AT_MS).toISOString()

    expect(store.getAutoProtocolResetAction(RESET_AT_MS + 60 * MINUTE_MS - 1)).toBe('none')
    expect(store.getAutoProtocolResetAction(RESET_AT_MS + 60 * MINUTE_MS)).toBe('reset')
  })

  test('saves the full protocol before resetting through the audited reset path', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(RESET_AT_MS + 60 * MINUTE_MS)
    const store = useDokuStore()
    store.doku.situation.setText('Persisted situation')

    await store.autoResetProtocol()

    expect(saveTemporaryProtocolState).toHaveBeenCalledOnce()
    const temporaryState = vi.mocked(saveTemporaryProtocolState).mock.calls[0][0]
    expect(temporaryState).toMatchObject({
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
    })
    expect((temporaryState.doku as typeof store.doku).situation._text).toBe('Persisted situation')
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    expect(vi.mocked(saveTemporaryProtocolState).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(appendProtocolAuditEntry).mock.invocationCallOrder[0])
    expect(store.doku.situation.value).toBe('')
    expect(store.lastProtocolResetAt).toBe(new Date().toISOString())
    expect(store.lastProtocolSentAt).toBeNull()
    expect(saveDokuState).toHaveBeenCalledOnce()
  })

  test('does not reset when saving the temporary state fails', async () => {
    const store = useDokuStore()
    store.doku.situation.setText('Must remain')
    vi.mocked(saveTemporaryProtocolState).mockRejectedValueOnce(new Error('storage unavailable'))

    await expect(store.autoResetProtocol()).rejects.toThrow('storage unavailable')

    expect(store.doku.situation.value).toBe('Must remain')
    expect(appendProtocolAuditEntry).not.toHaveBeenCalled()
    expect(saveDokuState).not.toHaveBeenCalled()
  })

  test('hydrates the temporary protocol, restarts its clock, and removes the snapshot', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(RESET_AT_MS + 61 * MINUTE_MS)
    vi.mocked(loadTemporaryProtocolState).mockResolvedValue({
      schemaVersion: 1,
      savedAt: new Date(RESET_AT_MS + 60 * MINUTE_MS).toISOString(),
      doku: {
        situation: {
          _text: 'Restored situation',
        },
      },
    })
    const store = useDokuStore()
    store.lastProtocolSentAt = new Date(RESET_AT_MS + 30 * MINUTE_MS).toISOString()

    await expect(store.restoreTemporaryProtocol()).resolves.toBe(true)

    expect(store.doku.situation.value).toBe('Restored situation')
    expect(store.doku.situation.setText).toBeTypeOf('function')
    expect(store.lastProtocolResetAt).toBe(new Date().toISOString())
    expect(store.lastProtocolSentAt).toBeNull()
    expect(saveDokuState).toHaveBeenCalledOnce()
    expect(removeTemporaryProtocolState).toHaveBeenCalledOnce()
  })

  test('discards an invalid temporary protocol instead of replacing the active state', async () => {
    vi.mocked(loadTemporaryProtocolState).mockResolvedValue({
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      doku: null,
    })
    const store = useDokuStore()
    store.doku.situation.setText('Active situation')

    await expect(store.restoreTemporaryProtocol()).resolves.toBe(false)

    expect(store.doku.situation.value).toBe('Active situation')
    expect(removeTemporaryProtocolState).toHaveBeenCalledOnce()
    expect(saveDokuState).not.toHaveBeenCalled()
  })

  test('marks a successfully sent protocol without clearing its current contents', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(RESET_AT_MS + 15 * MINUTE_MS)
    const store = useDokuStore()
    store.lastProtocolResetAt = new Date(RESET_AT_MS).toISOString()
    store.doku.situation.setText('Still visible after sending')

    await store.markProtocolSent()

    expect(store.doku.situation.value).toBe('Still visible after sending')
    expect(store.wasCurrentProtocolSent()).toBe(true)
    expect(saveDokuState).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: 1,
      lastProtocolSentAt: new Date().toISOString(),
    }))
  })

  test('hydrates schema-v1 state with and without the optional send marker', async () => {
    const resetAt = new Date(RESET_AT_MS).toISOString()
    const sentAt = new Date(RESET_AT_MS + 15 * MINUTE_MS).toISOString()
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1,
      updatedAt: sentAt,
      lastProtocolResetAt: resetAt,
      lastProtocolSentAt: sentAt,
      doku: { situation: { _text: 'Sent protocol' } },
    })
    const sentStore = useDokuStore()

    await sentStore.hydrateFromStorage()

    expect(sentStore.wasCurrentProtocolSent()).toBe(true)
    expect(sentStore.doku.situation.value).toBe('Sent protocol')

    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1,
      updatedAt: resetAt,
      lastProtocolResetAt: resetAt,
      doku: { situation: { _text: 'Legacy protocol' } },
      lastAutoProtocolResetPromptAt: sentAt,
    } as Awaited<ReturnType<typeof loadDokuState>> & { lastAutoProtocolResetPromptAt: string })
    const legacyStore = useDokuStore()

    await legacyStore.hydrateFromStorage()

    expect(legacyStore.wasCurrentProtocolSent()).toBe(false)
    expect(legacyStore.doku.situation.value).toBe('Legacy protocol')
  })
})
