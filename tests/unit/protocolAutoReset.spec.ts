import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { computed, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useDokuStore } from '@/store/doku'
import { createAppStartup } from '@/services/app-startup'
import {
  appendProtocolAuditEntry, loadDokuState, loadTemporaryProtocolState,
  removeTemporaryProtocolState, saveDokuState, type PersistedDokuState,
} from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import { SampleContactsItem, SampleMedicationItem } from '@/types/protocol/sample'

vi.mock('@capacitor-community/bluetooth-le', () => ({
  BleClient: { startNotifications: vi.fn(), stopNotifications: vi.fn(), write: vi.fn() },
}))

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  initStorage: vi.fn(),
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

const RESET_AT_MS = Date.parse('2026-08-19T10:00:00.000Z')
const MINUTE_MS = 60 * 1000
const legacySnapshot = {
  schemaVersion: 1,
  savedAt: new Date(RESET_AT_MS).toISOString(),
  doku: { situation: { _text: 'Legacy situation' } },
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  vi.mocked(loadDokuState).mockResolvedValue(null)
  vi.mocked(loadTemporaryProtocolState).mockResolvedValue(null)
  vi.useFakeTimers()
  vi.setSystemTime(RESET_AT_MS)
})
afterEach(() => vi.useRealTimers())

async function archive(text: string) {
  const store = useDokuStore()
  store.doku.situation.setText(text)
  vi.setSystemTime(Date.now() + MINUTE_MS)
  await store.newProtocol()
  return store.protocolHistory[0].id
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

describe('protocol data detection', () => {
  test('tracks nested values reactively and ignores text editor state', () => {
    const store = useDokuStore()
    const hasData = computed(() => store.hasProtocolData)
    expect(hasData.value).toBe(false)
    store.doku.situation.beginEdit()
    store.doku.situation.isEnhancing = true
    expect(hasData.value).toBe(false)
    store.doku.situation.setText('Changed')
    expect(hasData.value).toBe(true)
    store.doku.situation.undo()
    expect(hasData.value).toBe(false)
    store.doku.ident.age.timespan = 22
    expect(hasData.value).toBe(true)
    store.doku.ident.age.timespan = 50
    expect(hasData.value).toBe(false)
    store.doku.flavors.trauma = true
    expect(hasData.value).toBe(true)
    store.doku.flavors.trauma = false
    expect(hasData.value).toBe(false)
    store.doku.sampler.contacts.contacts.push(new SampleContactsItem({ contactName: 'Contact' }))
    expect(hasData.value).toBe(true)
    store.doku.sampler.contacts.contacts.pop()
    expect(hasData.value).toBe(false)
  })
})

describe('reset and history', () => {
  test('keeps the one-hour threshold', () => {
    const store = useDokuStore()
    expect(store.getAutoProtocolResetAction(RESET_AT_MS + 60 * MINUTE_MS - 1)).toBe('none')
    expect(store.getAutoProtocolResetAction(RESET_AT_MS + 60 * MINUTE_MS)).toBe('reset')
    store.lastProtocolOpenedAt = 'invalid'
    expect(store.getAutoProtocolResetAction()).toBe('reset')
  })

  test.each(['newProtocol', 'autoResetProtocol'] as const)('%s archives full data, audits and clears the active protocol', async action => {
    const store = useDokuStore()
    store.doku.situation.setText('Saved situation')
    store.doku.flavors.trauma = true
    await store.markProtocolSent()
    vi.setSystemTime(RESET_AT_MS + MINUTE_MS)
    await store[action]()
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0].doku.situation._text).toBe('Saved situation')
    expect(store.protocolHistory[0].doku.flavors.trauma).toBe(true)
    expect(store.lastProtocolResetAt).toBe(new Date().toISOString())
    expect(store.lastProtocolOpenedAt).toBe(new Date().toISOString())
    expect(store.lastProtocolSentAt).toBeNull()
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    expect(saveDokuState).toHaveBeenLastCalledWith(expect.objectContaining({
      doku: expect.objectContaining({ situation: expect.objectContaining({ _text: '' }) }),
      protocolHistory: expect.arrayContaining([expect.objectContaining({ id: store.protocolHistory[0].id })]),
    }))
  })

  test('keeps three newest snapshots and empty resets do not evict history', async () => {
    const store = useDokuStore()
    for (const text of ['one', 'two', 'three', 'four']) await archive(text)
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['four', 'three', 'two'])
    await store.newProtocol()
    await store.autoResetProtocol()
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['four', 'three', 'two'])
  })

  test.each([saveDokuState, appendProtocolAuditEntry])('keeps current work and history if a reset write fails', async failingWrite => {
    const store = useDokuStore()
    await archive('previous')
    store.doku.situation.setText('Must remain')
    await store.markProtocolSent()
    const before = JSON.stringify(store.$state)
    vi.mocked(failingWrite).mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(store.newProtocol()).rejects.toThrow('storage unavailable')
    expect(JSON.stringify(store.$state)).toBe(before)
  })

  test('waits for persistence, suppresses duplicate actions and queues autosaves with fresh state', async () => {
    const store = useDokuStore()
    store.doku.situation.setText('Keep until saved')
    const write = deferred()
    vi.mocked(saveDokuState).mockReturnValueOnce(write.promise)
    const reset = store.newProtocol()
    const duplicate = store.newProtocol()
    const autosave = store.persistToStorage()
    await vi.waitFor(() => expect(saveDokuState).toHaveBeenCalledOnce())
    expect(store.doku.situation.value).toBe('Keep until saved')
    expect(store.protocolHistory).toHaveLength(0)
    write.resolve()
    await Promise.all([reset, duplicate, autosave])
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    expect(store.protocolHistory).toHaveLength(1)
    expect(vi.mocked(saveDokuState).mock.lastCall![0].doku.situation._text).toBe('')
    expect(vi.mocked(saveDokuState).mock.lastCall![0].protocolHistory).toHaveLength(1)
  })
})

describe('protocol lifecycle', () => {
  async function startLifecycle() {
    const store = useDokuStore()
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValueOnce(vi.mocked(saveDokuState).mock.lastCall![0])
    let notify!: (active: boolean) => void
    const showError = vi.fn().mockResolvedValue(undefined)
    const startup = createAppStartup({
      getStore: () => store,
      initializeStorage: vi.fn().mockResolvedValue(undefined),
      registerAppStateChange: async handler => { notify = handler },
      scheduleAfterPaint: callback => callback(),
      showError,
      startupTimeoutMs: 1000,
    })
    await startup.start()
    await flushPromises()
    return {
      store, showError, startup, notify,
      async change(active: boolean) { notify(active); await flushPromises() },
    }
  }

  test('resets a sent protocol immediately on inactivity, silently and only once', async () => {
    const { store, change, showError } = await startLifecycle()
    store.doku.situation.setText('sent work')
    await store.markProtocolSent()
    expect(store.getAutoProtocolResetAction()).toBe('reset')
    await change(false)
    await change(false)
    await change(true)
    await change(true)
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0].doku.situation._text).toBe('sent work')
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    expect(showError).not.toHaveBeenCalled()
    store.$dispose()
  })

  test('leaves active work alone until the app becomes inactive at 60 minutes', async () => {
    const { store, change } = await startLifecycle()
    store.doku.situation.setText('active work')
    await vi.advanceTimersByTimeAsync(60 * MINUTE_MS)
    expect(store.hasProtocolData).toBe(true)
    await change(false)
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory[0].doku.situation._text).toBe('active work')
    store.$dispose()
  })

  test('checks expiry before updating the opening clock on resume', async () => {
    const { store, change } = await startLifecycle()
    store.doku.situation.setText('background work')
    vi.setSystemTime(RESET_AT_MS + 10 * MINUTE_MS)
    await change(false)
    expect(store.hasProtocolData).toBe(true)
    expect(store.lastProtocolOpenedAt).toBe(new Date(RESET_AT_MS).toISOString())
    vi.setSystemTime(RESET_AT_MS + 60 * MINUTE_MS)
    await change(true)
    expect(store.hasProtocolData).toBe(false)
    expect(store.lastProtocolOpenedAt).toBe(new Date().toISOString())
    expect(store.protocolHistory[0].doku.situation._text).toBe('background work')
    store.$dispose()
  })

  test('a young unsent protocol survives inactivity, resume and restart with a fresh opening clock', async () => {
    const { store, change } = await startLifecycle()
    store.doku.situation.setText('keep')
    vi.setSystemTime(RESET_AT_MS + 30 * MINUTE_MS)
    await change(false)
    await change(true)
    expect(store.lastProtocolOpenedAt).toBe(new Date().toISOString())
    vi.setSystemTime(RESET_AT_MS + 60 * MINUTE_MS)
    await change(false)
    expect(store.hasProtocolData).toBe(true)
    store.$dispose()
    // Simulate a fresh process using the last persisted snapshot.
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await useDokuStore().hydrateFromStorage()
    const restarted = await startLifecycle()
    expect(restarted.store.doku.situation.value).toBe('keep')
    expect(restarted.store.lastProtocolOpenedAt).toBe(new Date().toISOString())
    expect(restarted.store.protocolHistory).toEqual([])
    restarted.store.$dispose()
  })

  test.each(['sent', 'expired'] as const)('cold start resets %s work without a shutdown event', async reason => {
    const store = useDokuStore()
    store.doku.situation.setText('killed app')
    if (reason === 'sent') await store.markProtocolSent()
    else vi.setSystemTime(RESET_AT_MS + 60 * MINUTE_MS)
    const { showError } = await startLifecycle()
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory[0].doku.situation._text).toBe('killed app')
    expect(showError).not.toHaveBeenCalled()
    store.$dispose()
  })

  test.each(['send', 'change'] as const)('defers lifecycle work during a protocol %s and drains rapid transitions in order', async busy => {
    const { store, notify } = await startLifecycle()
    store.doku.situation.setText('pending work')
    if (busy === 'send') store.connection.isTransmitting = true
    else store.isProtocolChanging = true
    notify(false)
    notify(false)
    vi.setSystemTime(RESET_AT_MS + MINUTE_MS)
    notify(true)
    notify(false)
    await flushPromises()
    expect(store.hasProtocolData).toBe(true)
    await store.markProtocolSent()
    expect(store.hasProtocolData).toBe(true)
    store.connection.isTransmitting = false
    store.isProtocolChanging = false
    await flushPromises()
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory).toHaveLength(1)
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    expect(vi.mocked(saveDokuState).mock.lastCall![0].doku.situation._text).toBe('')
    store.$dispose()
  })

  function prepareSend(store: ReturnType<typeof useDokuStore>) {
    store.connection.device = { id: 'dongle', name: 'DokuDongle-Test' }
    store.connection.isConnected = true
    vi.spyOn(store, 'checkConnection').mockResolvedValue(undefined)
    vi.spyOn(store, 'generatedProtocol', 'get').mockReturnValue('A')
    let acknowledge!: (value: DataView) => void
    vi.mocked(BleClient.startNotifications).mockImplementation(async (_device, _service, _characteristic, callback) => {
      acknowledge = callback
    })
    vi.mocked(BleClient.write).mockImplementation(async () => {
      acknowledge(new DataView(new ArrayBuffer(0)))
    })
  }

  test('a real send persists completion under the transmission guard before a pending background reset', async () => {
    const { store, change } = await startLifecycle()
    store.doku.situation.setText('transmitted work')
    prepareSend(store)
    const packet = deferred()
    const write = vi.mocked(BleClient.write).getMockImplementation()!
    vi.mocked(BleClient.write).mockImplementationOnce(async (...args) => {
      await packet.promise
      await write(...args)
    })
    const send = store.sendProtocol()
    await flushPromises()
    await change(false)
    expect(store.hasProtocolData).toBe(true)
    expect(store.wasCurrentProtocolSent()).toBe(false)
    const completion = deferred()
    vi.mocked(saveDokuState).mockImplementationOnce(async payload => {
      expect(payload.lastProtocolSentAt).toBeDefined()
      expect(store.connection.isTransmitting).toBe(true)
      await completion.promise
    })
    packet.resolve()
    await flushPromises()
    expect(store.connection.isTransmitting).toBe(true)
    expect(store.hasProtocolData).toBe(true)
    completion.resolve()
    expect(await send).toBe(true)
    await flushPromises()
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory[0].doku.situation._text).toBe('transmitted work')
    expect(appendProtocolAuditEntry).toHaveBeenCalledOnce()
    store.$dispose()
  })

  test.each(['failure', 'cancel'] as const)('a %s during transmission does not mark or reset a young protocol', async outcome => {
    const { store, change } = await startLifecycle()
    store.doku.situation.setText('unfinished send')
    prepareSend(store)
    const packet = deferred()
    vi.mocked(BleClient.write).mockImplementationOnce(async () => {
      await packet.promise
      if (outcome === 'failure') throw new Error('disconnected')
    })
    const send = store.sendProtocol()
    await flushPromises()
    await change(false)
    if (outcome === 'cancel') await store.cancelSend()
    packet.resolve()
    expect(await send).toBe(false)
    await flushPromises()
    expect(store.wasCurrentProtocolSent()).toBe(false)
    expect(store.doku.situation.value).toBe('unfinished send')
    expect(store.protocolHistory).toEqual([])
    store.$dispose()
  })

  test('a send finishing after manual replacement does not mark the replacement as sent', async () => {
    const { store } = await startLifecycle()
    store.doku.situation.setText('original')
    prepareSend(store)
    const packet = deferred()
    const write = vi.mocked(BleClient.write).getMockImplementation()!
    vi.mocked(BleClient.write).mockImplementationOnce(async (...args) => {
      await packet.promise
      await write(...args)
    })
    const send = store.sendProtocol()
    await flushPromises()
    await store.newProtocol()
    store.doku.situation.setText('replacement')
    packet.resolve()
    expect(await send).toBe(true)
    expect(store.wasCurrentProtocolSent()).toBe(false)
    expect(store.doku.situation.value).toBe('replacement')
    store.$dispose()
  })

  test('retains work and its clock on a failed background reset, reports on resume, then retries', async () => {
    const { store, change, showError } = await startLifecycle()
    store.doku.situation.setText('keep on failure')
    const openedAt = store.lastProtocolOpenedAt
    vi.setSystemTime(RESET_AT_MS + 60 * MINUTE_MS)
    vi.mocked(appendProtocolAuditEntry).mockRejectedValue(new Error('storage unavailable'))
    await change(false)
    expect(store.doku.situation.value).toBe('keep on failure')
    expect(showError).not.toHaveBeenCalled()
    await change(true)
    expect(store.lastProtocolOpenedAt).toBe(openedAt)
    expect(showError).toHaveBeenCalledOnce()
    vi.mocked(appendProtocolAuditEntry).mockResolvedValue(undefined)
    await change(false)
    expect(store.hasProtocolData).toBe(false)
    expect(store.protocolHistory[0].doku.situation._text).toBe('keep on failure')
    store.$dispose()
  })
})

describe('restoration', () => {
  test('restores independent class instances, clears editing state and restarts its clock', async () => {
    const store = useDokuStore()
    store.doku.sampler.medication.PlanMedication.push(new SampleMedicationItem({ Name: 'Medication' }))
    store.doku.sampler.contacts.contacts.push(new SampleContactsItem({ contactName: 'Contact' }))
    store.doku.situation.isEnhancing = true
    const id = await archive('Saved situation')
    await store.markProtocolSent()
    vi.setSystemTime(Date.now() + MINUTE_MS)
    await expect(store.restoreProtocolFromHistory(id)).resolves.toBe(true)
    expect(store.doku.situation.value).toBe('Saved situation')
    expect(store.doku.situation.canUndo).toBe(false)
    expect(store.doku.situation.isEnhancing).toBe(false)
    expect(store.doku.sampler.medication.PlanMedication[0].getProtocolLabel).toContain('Medication')
    expect(store.doku.sampler.contacts.contacts[0]).toBeInstanceOf(SampleContactsItem)
    expect(store.doku.ident.age.totalYears).toBe(50)
    expect(store.lastProtocolResetAt).toBe(new Date().toISOString())
    expect(store.lastProtocolOpenedAt).toBe(new Date().toISOString())
    expect(store.lastProtocolSentAt).toBeNull()
    expect(store.hasProtocolData).toBe(true)
    expect(store.protocolHistory).toHaveLength(1)
    store.doku.situation.setText('Edited copy')
    store.doku.sampler.medication.PlanMedication[0].Name = 'Changed'
    expect(store.protocolHistory[0].doku.situation._text).toBe('Saved situation')
    expect(store.protocolHistory[0].doku.sampler.medication.PlanMedication[0].Name).toBe('Medication')
  })

  test('retains the oldest selected snapshot when archiving current work fills history', async () => {
    const store = useDokuStore()
    const oldest = await archive('one')
    await archive('two')
    await archive('three')
    store.doku.situation.setText('current')
    await expect(store.restoreProtocolFromHistory(oldest)).resolves.toBe(true)
    expect(store.doku.situation.value).toBe('one')
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['current', 'three', 'one'])
    expect(store.activeHistoryEntryId).toBe(oldest)
    store.doku.situation.setText('one edited')
    await store.persistToStorage()
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['current', 'three', 'one edited'])
  })

  test('retains the selected snapshot when current work does not fill history', async () => {
    const store = useDokuStore()
    const id = await archive('saved')
    store.doku.situation.setText('current')
    await store.restoreProtocolFromHistory(id)
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['current', 'saved'])
  })

  test('does not replace current work on invalid selection or failed storage', async () => {
    const store = useDokuStore()
    const id = await archive('saved')
    store.doku.situation.setText('current')
    await expect(store.restoreProtocolFromHistory('missing')).resolves.toBe(false)
    const before = JSON.stringify(store.$state)
    vi.mocked(saveDokuState).mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(store.restoreProtocolFromHistory(id)).rejects.toThrow('storage unavailable')
    expect(JSON.stringify(store.$state)).toBe(before)
    await expect(store.restoreProtocolFromHistory(id)).resolves.toBe(true)
  })

  test('suppresses repeated restore requests while saving', async () => {
    const store = useDokuStore()
    const id = await archive('saved')
    store.doku.situation.setText('current')
    const write = deferred()
    vi.mocked(saveDokuState).mockReturnValueOnce(write.promise)
    const restore = store.restoreProtocolFromHistory(id)
    await expect(store.restoreProtocolFromHistory(id)).resolves.toBe(false)
    write.resolve()
    await restore
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['current', 'saved'])
  })
})

describe('editing reopened protocols', () => {
  test.each(['persistToStorage', 'markProtocolSent'] as const)('%s updates the same entry without changing its date or position', async action => {
    const store = useDokuStore()
    const id = await archive('original')
    await archive('newer')
    const metadata = store.protocolHistory.map(({ id, archivedAt }) => ({ id, archivedAt }))
    await store.restoreProtocolFromHistory(id)
    store.doku.situation.setText('edited')
    store.doku.sampler.medication.PlanMedication.push(new SampleMedicationItem({ Name: 'Medication' }))
    vi.setSystemTime(Date.now() + MINUTE_MS)
    await store[action]()
    expect(store.protocolHistory.map(({ id, archivedAt }) => ({ id, archivedAt }))).toEqual(metadata)
    expect(store.protocolHistory[1].doku.situation._text).toBe('edited')
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.activeHistoryEntryId).toBe(id)
    expect(saved.protocolHistory![1].doku.situation._text).toBe('edited')
    store.doku.situation.setText('not saved yet')
    store.doku.sampler.medication.PlanMedication[0].Name = 'Changed'
    expect(store.protocolHistory[1].doku.situation._text).toBe('edited')
    expect(store.protocolHistory[1].doku.sampler.medication.PlanMedication[0].Name).toBe('Medication')
    expect(saved.doku.situation._text).toBe('edited')
  })

  test.each(['newProtocol', 'autoResetProtocol'] as const)('%s saves pending edits in place and clears the link', async action => {
    const store = useDokuStore()
    const id = await archive('original')
    await store.restoreProtocolFromHistory(id)
    store.doku.situation.setText('edited')
    await store[action]()
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0]).toMatchObject({ id, doku: { situation: { _text: 'edited' } } })
    expect(store.activeHistoryEntryId).toBeNull()
    expect(vi.mocked(saveDokuState).mock.lastCall![0].activeHistoryEntryId).toBeNull()
    expect(store.hasProtocolData).toBe(false)
    await archive('new protocol')
    expect(store.protocolHistory).toHaveLength(2)
    expect(store.protocolHistory[0].id).not.toBe(id)
  })

  test('switching and repeatedly reopening preserves edits made before autosave', async () => {
    const store = useDokuStore()
    const first = await archive('first')
    const second = await archive('second')
    await store.restoreProtocolFromHistory(first)
    store.doku.situation.setText('first edited')
    await store.restoreProtocolFromHistory(first)
    expect(store.doku.situation.value).toBe('first edited')
    store.doku.situation.setText('first edited again')
    await store.restoreProtocolFromHistory(second)
    expect(store.doku.situation.value).toBe('second')
    store.doku.situation.setText('second edited')
    await store.restoreProtocolFromHistory(first)
    expect(store.doku.situation.value).toBe('first edited again')
    expect(store.protocolHistory.map(entry => entry.doku.situation._text)).toEqual(['second edited', 'first edited again'])
    expect(store.activeHistoryEntryId).toBe(first)
  })

  test.each(['persistToStorage', 'markProtocolSent', 'newProtocol', 'restoreProtocolFromHistory'] as const)(
    '%s leaves history and active edits intact after a failed write', async action => {
      const store = useDokuStore()
      const id = await archive('original')
      const other = await archive('other')
      await store.restoreProtocolFromHistory(id)
      store.doku.situation.setText('unsaved edit')
      const before = JSON.stringify(store.$state)
      vi.mocked(saveDokuState).mockRejectedValueOnce(new Error('storage unavailable'))
      const run = () => action === 'restoreProtocolFromHistory' ? store[action](other) : store[action]()
      await expect(run()).rejects.toThrow('storage unavailable')
      expect(JSON.stringify(store.$state)).toBe(before)
      await run()
      expect(store.protocolHistory.find(entry => entry.id === id)!.doku.situation._text).toBe('unsaved edit')
    },
  )

  test('commits history only after saving and queues later edits without overwriting them', async () => {
    const store = useDokuStore()
    const id = await archive('original')
    await store.restoreProtocolFromHistory(id)
    store.doku.situation.setText('first edit')
    const write = deferred()
    vi.mocked(saveDokuState).mockClear().mockReturnValueOnce(write.promise)
    const firstSave = store.persistToStorage()
    await vi.waitFor(() => expect(saveDokuState).toHaveBeenCalledOnce())
    expect(store.protocolHistory[0].doku.situation._text).toBe('original')
    store.doku.situation.setText('second edit')
    const secondSave = store.persistToStorage()
    write.resolve()
    await Promise.all([firstSave, secondSave])
    expect(store.doku.situation.value).toBe('second edit')
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0].doku.situation._text).toBe('second edit')
    expect(vi.mocked(saveDokuState).mock.calls[0][0].protocolHistory![0].doku.situation._text).toBe('first edit')
    expect(vi.mocked(saveDokuState).mock.lastCall![0].protocolHistory![0].doku.situation._text).toBe('second edit')
  })

  test('an autosave queued behind switching entries persists the new active link', async () => {
    const store = useDokuStore()
    const first = await archive('first')
    const second = await archive('second')
    await store.restoreProtocolFromHistory(first)
    store.doku.situation.setText('first edited')
    const write = deferred()
    vi.mocked(saveDokuState).mockReturnValueOnce(write.promise)
    const restore = store.restoreProtocolFromHistory(second)
    const autosave = store.persistToStorage()
    write.resolve()
    await Promise.all([restore, autosave])
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.activeHistoryEntryId).toBe(second)
    expect(saved.doku.situation._text).toBe('second')
    expect(saved.protocolHistory!.map(entry => entry.doku.situation._text)).toEqual(['second', 'first edited'])
  })

  test('the application autosave subscription updates history and settles without looping', async () => {
    const store = useDokuStore()
    const id = await archive('original')
    await store.restoreProtocolFromHistory(id)
    vi.mocked(loadDokuState).mockResolvedValueOnce(vi.mocked(saveDokuState).mock.lastCall![0])
    const startup = createAppStartup({
      getStore: () => store,
      initializeStorage: vi.fn().mockResolvedValue(undefined),
      registerAppStateChange: vi.fn().mockResolvedValue(undefined),
      scheduleAfterPaint: callback => callback(),
      showError: vi.fn().mockResolvedValue(undefined),
      startupTimeoutMs: 1000,
    })
    await startup.start()
    expect(startup.state.status).toBe('ready')
    vi.mocked(saveDokuState).mockClear()
    store.doku.situation.setText('autosaved edit')
    await nextTick()
    await vi.advanceTimersByTimeAsync(3000)
    expect(store.protocolHistory[0].doku.situation._text).toBe('autosaved edit')
    await vi.advanceTimersByTimeAsync(3000)
    const calls = vi.mocked(saveDokuState).mock.calls.length
    expect(calls).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(12000)
    expect(saveDokuState).toHaveBeenCalledTimes(calls)
    store.$dispose()
  })
})

describe('persistence and migration', () => {
  test.each([
    ['2026-08-19T09:50:00.000Z', '2026-08-19T09:00:00.000Z', '2026-08-19T09:30:00.000Z', '2026-08-19T09:50:00.000Z'],
    [undefined, '2026-08-19T09:00:00.000Z', '2026-08-19T09:30:00.000Z', '2026-08-19T09:00:00.000Z'],
    ['invalid', 'invalid', '2026-08-19T09:30:00.000Z', '2026-08-19T09:30:00.000Z'],
    [undefined, undefined, undefined, new Date(RESET_AT_MS).toISOString()],
  ])('migrates opening timestamps using valid persisted values (%s, %s, %s)', async (opened, reset, updated, expected) => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, lastProtocolOpenedAt: opened, lastProtocolResetAt: reset,
      updatedAt: updated, doku: { situation: { _text: 'Existing' } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.lastProtocolOpenedAt).toBe(expected)
    expect(vi.mocked(saveDokuState).mock.lastCall![0].lastProtocolOpenedAt).toBe(expected)
    expect(store.doku.situation.value).toBe('Existing')
  })

  test('a failed opening-time write preserves the previous clock', async () => {
    const store = useDokuStore()
    const openedAt = store.lastProtocolOpenedAt
    vi.mocked(saveDokuState).mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(store.markProtocolOpened(RESET_AT_MS + MINUTE_MS)).rejects.toThrow('storage unavailable')
    expect(store.lastProtocolOpenedAt).toBe(openedAt)
  })

  test('ignores send completion for a protocol that has already been replaced', async () => {
    const store = useDokuStore()
    const original = store.doku
    await store.newProtocol()
    await store.markProtocolSent(Date.now(), original)
    expect(store.wasCurrentProtocolSent()).toBe(false)
  })

  test.each([false, true])('preserves the active link and subsequent updates across restart (cleared: %s)', async cleared => {
    const store = useDokuStore()
    const id = await archive('original')
    const archivedAt = store.protocolHistory[0].archivedAt
    await store.restoreProtocolFromHistory(id)
    if (cleared) store.doku = resetProtocol()
    else store.doku.situation.setText('edited')
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    const restarted = useDokuStore()
    await restarted.hydrateFromStorage()
    expect(restarted.activeHistoryEntryId).toBe(id)
    expect(restarted.protocolHistory).toHaveLength(1)
    expect(restarted.protocolHistory[0]).toMatchObject({ id, archivedAt })
    expect(restarted.doku.situation.value).toBe(cleared ? '' : 'edited')
    await restarted.newProtocol()
    expect(restarted.protocolHistory).toHaveLength(1)
    // Cleared entries also survive reload once they are no longer active.
    vi.mocked(loadDokuState).mockResolvedValueOnce(vi.mocked(saveDokuState).mock.lastCall![0])
    await restarted.hydrateFromStorage()
    await restarted.restoreProtocolFromHistory(id)
    expect(restarted.doku.situation.value).toBe(cleared ? '' : 'edited')
    restarted.doku.situation.setText('after restart')
    await restarted.newProtocol()
    expect(restarted.protocolHistory).toHaveLength(1)
    expect(restarted.protocolHistory[0]).toMatchObject({ id, archivedAt, doku: { situation: { _text: 'after restart' } } })
  })

  test.each([undefined, null, '', 'missing', 42])('ignores an absent or invalid persisted history link: %s', async activeHistoryEntryId => {
    await archive('saved')
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValueOnce({ ...saved, activeHistoryEntryId } as PersistedDokuState)
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.activeHistoryEntryId).toBeNull()
    expect(store.protocolHistory).toHaveLength(1)
  })

  test('survives restart and restores saved class methods', async () => {
    const id = await archive('Persistent situation')
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toHaveLength(1)
    await store.restoreProtocolFromHistory(id)
    expect(store.doku.situation.value).toBe('Persistent situation')
    expect(store.doku.situation.setText).toBeTypeOf('function')
  })

  test.each([undefined, '2026-08-19T10:15:00.000Z'])('loads schema-v1 without history and with send marker %s', async sentAt => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, updatedAt: new Date(RESET_AT_MS).toISOString(),
      lastProtocolSentAt: sentAt, doku: { situation: { _text: 'Existing' } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toEqual([])
    expect(store.activeHistoryEntryId).toBeNull()
    expect(store.doku.situation.value).toBe('Existing')
    expect(store.wasCurrentProtocolSent()).toBe(Boolean(sentAt))
  })

  test('preserves valid history despite invalid active data and skips malformed entries', async () => {
    await archive('valid')
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    saved.doku = null
    const valid = saved.protocolHistory![0]
    saved.activeHistoryEntryId = valid.id
    saved.protocolHistory = [null, { ...valid, id: 'broken', doku: { situation: { _text: 42 } } },
      { ...valid, id: 'bad-date', archivedAt: 'invalid' }, valid, valid] as unknown as PersistedDokuState['protocolHistory']
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.hasProtocolData).toBe(false)
    expect(store.activeHistoryEntryId).toBeNull()
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0].doku.situation.value).toBe('valid')
  })

  test('migrates a temporary snapshot once and cleans up only after persistence', async () => {
    vi.mocked(loadTemporaryProtocolState).mockResolvedValue(legacySnapshot)
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toHaveLength(1)
    expect(store.protocolHistory[0].doku.situation.value).toBe('Legacy situation')
    expect(vi.mocked(saveDokuState).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(removeTemporaryProtocolState).mock.invocationCallOrder[0])
    vi.mocked(loadDokuState).mockResolvedValueOnce(vi.mocked(saveDokuState).mock.lastCall![0])
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toHaveLength(1)
  })

  test('retains the legacy snapshot when migration cannot be saved', async () => {
    vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(legacySnapshot)
    vi.mocked(saveDokuState).mockRejectedValueOnce(new Error('storage unavailable'))
    const store = useDokuStore()
    await expect(store.hydrateFromStorage()).rejects.toThrow('storage unavailable')
    expect(removeTemporaryProtocolState).not.toHaveBeenCalled()
  })

  test.each([null, resetProtocol(), { situation: { _text: 12 } }])('does not archive empty or invalid legacy snapshots', async doku => {
    vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce({ ...legacySnapshot, doku })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.protocolHistory).toEqual([])
    expect(removeTemporaryProtocolState).toHaveBeenCalledOnce()
  })
})
