import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { SendTextUUID } from '@/types/dongle'

const ble = vi.hoisted(() => ({
  connect: vi.fn(), disconnect: vi.fn(), startNotifications: vi.fn(), stopNotifications: vi.fn(), write: vi.fn(),
}))
vi.mock('@capacitor-community/bluetooth-le', () => ({ BleClient: ble }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' }, registerPlugin: vi.fn(() => ({})) }))

let store: ReturnType<typeof useDokuStore>
let task: Promise<boolean> | undefined
let acknowledgements: Array<(value: DataView) => void>
let disconnects: Array<() => void>
const ackValue = new DataView(new Uint8Array([1]).buffer)

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  setActivePinia(createPinia())
  store = useDokuStore()
  store.connection.device = { id: 'original-dongle', name: 'DokuDongle-Test' }
  store.connection.isConnected = true
  store.connection.session = 1
  acknowledgements = []
  disconnects = []
  task = undefined
  vi.spyOn(store, 'checkConnection').mockResolvedValue(undefined)
  vi.spyOn(store, 'refreshDongleConfig').mockResolvedValue(undefined)
  vi.spyOn(store, 'refreshDongleFirmware').mockResolvedValue(undefined)
  vi.spyOn(store, 'markProtocolSent').mockResolvedValue(undefined)
  vi.spyOn(store, 'generatedProtocol', 'get').mockReturnValue('ABCDEFGHIJabcdefghijZ')
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  ble.connect.mockImplementation(async (_device, disconnected) => { disconnects.push(disconnected) })
  ble.startNotifications.mockImplementation(async (_device, _service, _characteristic, callback) => {
    acknowledgements.push(callback)
  })
})

afterEach(async () => {
  await store.cancelSend()
  await task
  expect(vi.getTimerCount()).toBe(0)
  store.$dispose()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

async function start() {
  task = store.sendProtocol()
  await flushPromises()
}
async function ack() {
  acknowledgements.at(-1)!(ackValue)
  await flushPromises()
}
function disconnect() {
  store.dongleDisconnected('original-dongle', store.connection.session)
}
function bytes(index: number) {
  const payload = ble.write.mock.calls[index][3] as DataView
  return Array.from(new Uint8Array(payload.buffer))
}

describe('pausing a protocol transmission', () => {
  test('finishes the current block, freezes progress, and supports repeated pause/resume', async () => {
    await start()
    expect(ble.write).toHaveBeenCalledTimes(1)
    store.pauseSend()
    expect(store.connection.transmissionBlockPending).toBe(true)
    await ack()
    expect(store.connection.transmissionCurrent).toBe(10)
    expect(store.transmissionProgress).toBe(10 / 21)
    expect(store.connection.transmissionBlockPending).toBe(false)
    await vi.advanceTimersByTimeAsync(20000)
    expect(ble.write).toHaveBeenCalledTimes(1)
    expect(store.connection.isTransmitting).toBe(true)
    store.resumeSend()
    await flushPromises()
    expect(ble.write).toHaveBeenCalledTimes(2)
    store.pauseSend()
    await ack()
    expect(store.connection.transmissionCurrent).toBe(20)
    expect(ble.write).toHaveBeenCalledTimes(2)
    store.resumeSend()
    await flushPromises()
    await ack()
    expect(bytes(3)).toEqual([0, 0])
    expect(store.markProtocolSent).not.toHaveBeenCalled()
    await ack()
    expect(await task).toBe(true)
    expect(store.markProtocolSent).toHaveBeenCalledOnce()
    expect(store.isDongleTransmitting).toBe(false)
  })

  test.each(['ack', 'pause'] as const)('cancels while waiting for %s without marking the protocol sent', async state => {
    await start()
    if (state === 'pause') { store.pauseSend(); await ack() }
    await store.cancelSend()
    expect(await task).toBe(false)
    expect(store.markProtocolSent).not.toHaveBeenCalled()
    expect(store.connection.transmissionCurrent).toBe(0)
    expect(ble.stopNotifications).toHaveBeenCalledOnce()
  })

  test('keeps all transmission guards active while paused', async () => {
    await start()
    store.pauseSend()
    await ack()
    expect(await store.sendProtocol()).toBe(false)
    await store.connectDongle()
    expect(ble.connect).not.toHaveBeenCalled()
    expect(await store.updateDongleConfig({ name: 'Other', keyGapMs: 30 })).toBe(false)
    expect(store.markProtocolSent).not.toHaveBeenCalled()
  })

  test('counts the actual HID events, including normalized and unsupported characters', async () => {
    vi.spyOn(store, 'generatedProtocol', 'get').mockReturnValue('A🙂e\u0301')
    await start()
    expect(store.connection.transmissionLength).toBe(bytes(0).length / 2)
    store.pauseSend()
    await ack()
    expect(store.transmissionProgress).toBe(1)
  })
})

describe('automatic transmission recovery', () => {
  test('recovers if the link disappears during the initial connection check', async () => {
    vi.mocked(store.checkConnection).mockImplementationOnce(async () => { disconnect() })
    await start()
    expect(ble.connect).toHaveBeenCalledOnce()
    expect(ble.write).toHaveBeenCalledOnce()
    expect(store.connection.isTransmitting).toBe(true)
  })

  test('replays only the unconfirmed block on the same dongle and ignores old notifications', async () => {
    await start()
    await ack()
    const oldAck = acknowledgements[0]
    expect(store.connection.transmissionCurrent).toBe(10)
    disconnect()
    expect(store.isDongleTransmitting).toBe(true)
    expect(store.transmissionProgress).toBe(10 / 21)
    expect(store.connection.transmissionWaitingForDongle).toBe(true)
    await flushPromises()
    expect(ble.connect.mock.calls[0][0]).toBe('original-dongle')
    expect(ble.startNotifications).toHaveBeenCalledTimes(2)
    expect(ble.stopNotifications.mock.invocationCallOrder[0]).toBeLessThan(ble.connect.mock.invocationCallOrder[0])
    expect(bytes(2)).toEqual(bytes(1))
    expect(store.connection.transmissionReconnectCount).toBe(1)
    oldAck(ackValue)
    await flushPromises()
    expect(store.connection.transmissionCurrent).toBe(10)
    expect(ble.write).toHaveBeenCalledTimes(3)
    await ack()
    await ack()
    await ack()
    expect(await task).toBe(true)
    expect(ble.write.mock.calls.every(call => call[0] === 'original-dongle' && call[2] === SendTextUUID)).toBe(true)
  })

  test('retains an ACK received immediately before disconnect', async () => {
    await start()
    acknowledgements[0](ackValue)
    disconnect()
    await flushPromises()
    expect(store.connection.transmissionCurrent).toBe(10)
    expect(bytes(1)).not.toEqual(bytes(0))
  })

  test('reconnects during a manual pause and waits for explicit resume', async () => {
    await start()
    store.pauseSend()
    await ack()
    disconnect()
    await flushPromises()
    expect(store.connection.transmissionReconnectCount).toBe(1)
    expect(store.connection.transmissionPaused).toBe(true)
    expect(ble.write).toHaveBeenCalledTimes(1)
    store.resumeSend()
    await flushPromises()
    expect(ble.write).toHaveBeenCalledTimes(2)
  })

  test('retries failed connections sequentially with two seconds between attempts', async () => {
    ble.connect.mockRejectedValueOnce(new Error('absent')).mockRejectedValueOnce(new Error('absent'))
    await start()
    disconnect()
    await flushPromises()
    expect(ble.connect).toHaveBeenCalledTimes(1)
    store.resumeSend()
    expect(store.connection.transmissionWaitingForDongle).toBe(true)
    await vi.advanceTimersByTimeAsync(1999)
    expect(ble.connect).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(ble.connect).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(2000)
    expect(ble.connect).toHaveBeenCalledTimes(3)
    expect(ble.write).toHaveBeenCalledTimes(2)
    expect(bytes(1)).toEqual(bytes(0))
  })

  test.each(['timeout', 'write'] as const)('recovers from %s without a disconnect callback', async failure => {
    if (failure === 'write') ble.write.mockRejectedValueOnce(new Error('write failed'))
    await start()
    if (failure === 'timeout') {
      await vi.advanceTimersByTimeAsync(9999)
      expect(ble.connect).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
    }
    expect(ble.connect).toHaveBeenCalledOnce()
    expect(bytes(1)).toEqual(bytes(0))
    expect(store.connection.transmissionCurrent).toBe(0)
  })

  test('cancels during retry delay and never reconnects again', async () => {
    ble.connect.mockRejectedValue(new Error('absent'))
    await start()
    disconnect()
    await flushPromises()
    await store.cancelSend()
    expect(await task).toBe(false)
    await vi.advanceTimersByTimeAsync(30000)
    expect(ble.connect).toHaveBeenCalledOnce()
    expect(store.markProtocolSent).not.toHaveBeenCalled()
  })

  test('cleans up a notification subscription that completes after cancellation', async () => {
    let finishSubscribe!: () => void
    ble.startNotifications.mockImplementationOnce(() => new Promise<void>(resolve => { finishSubscribe = resolve }))
    await start()
    await store.cancelSend()
    finishSubscribe()
    expect(await task).toBe(false)
    expect(ble.stopNotifications).toHaveBeenCalledOnce()
    expect(ble.write).not.toHaveBeenCalled()
  })

  test('retries a lost completion ACK without repeating confirmed text', async () => {
    await start()
    await ack()
    await ack()
    await ack()
    expect(bytes(3)).toEqual([0, 0])
    disconnect()
    await flushPromises()
    expect(bytes(4)).toEqual([0, 0])
    expect(store.markProtocolSent).not.toHaveBeenCalled()
    await ack()
    expect(await task).toBe(true)
  })

  test('cleans up a native connection that completes after cancellation', async () => {
    let finishConnect!: () => void
    ble.connect.mockImplementationOnce(() => new Promise<void>(resolve => { finishConnect = resolve }))
    await start()
    disconnect()
    await flushPromises()
    await store.cancelSend()
    expect(store.connection.isTransmitting).toBe(true)
    finishConnect()
    expect(await task).toBe(false)
    expect(store.connection.isConnected).toBe(false)
    expect(ble.write).toHaveBeenCalledTimes(1)
    expect(ble.disconnect).toHaveBeenCalledTimes(2)
    expect(store.markProtocolSent).not.toHaveBeenCalled()
  })

  test('ignores disconnect callbacks from a previous recovered connection', async () => {
    await start()
    disconnect()
    await flushPromises()
    disconnects[0]()
    await flushPromises()
    expect(store.connection.transmissionReconnectCount).toBe(2)
    disconnects[0]()
    await flushPromises()
    expect(store.connection.isConnected).toBe(true)
    expect(ble.connect).toHaveBeenCalledTimes(2)
  })
})
