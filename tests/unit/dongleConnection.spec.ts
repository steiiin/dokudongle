import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ platform: 'android', disconnect: vi.fn(), getConnectedDevices: vi.fn(), discoverServices: vi.fn() }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }))
vi.mock('@capacitor-community/bluetooth-le', () => ({ BleClient: mocks }))
import { disconnectDongle, discoverDongleServices, DongleDeadlineError } from '@/utils/dongle-connection'

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  mocks.platform = 'android'
  mocks.getConnectedDevices.mockResolvedValue([])
})
afterEach(() => vi.useRealTimers())

describe('dongle cleanup', () => {
  test('waits for the native disconnect result before checking whether the link is gone', async () => {
    mocks.disconnect.mockImplementation(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Disconnection timeout.')), 5000)
    }))
    const cleanup = disconnectDongle('AA:BB')
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.getConnectedDevices).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    await cleanup
    expect(mocks.getConnectedDevices).toHaveBeenCalledWith([])
  })
  test('does not tolerate a timeout when Android still reports the device connected', async () => {
    mocks.disconnect.mockRejectedValue(new Error('Disconnection timeout.'))
    mocks.getConnectedDevices.mockResolvedValue([{ deviceId: 'aa:bb' }])
    await expect(disconnectDongle('AA:BB')).rejects.toThrow('Disconnection timeout.')
  })
  test('does not tolerate an unconfirmed connection state', async () => {
    mocks.disconnect.mockRejectedValue(new Error('Disconnection timeout.'))
    mocks.getConnectedDevices.mockRejectedValue(new Error('Bluetooth unavailable'))
    await expect(disconnectDongle('AA:BB')).rejects.toThrow('Bluetooth unavailable')
  })
  test.each(['Permission denied.', 'Disconnected', 'Other failure'])('propagates %s', async message => {
    mocks.disconnect.mockRejectedValue(new Error(message))
    await expect(disconnectDongle('AA:BB')).rejects.toThrow(message)
    expect(mocks.getConnectedDevices).not.toHaveBeenCalled()
  })
  test('strict handoff cannot waive a disconnect timeout', async () => {
    mocks.disconnect.mockRejectedValue(new Error('Disconnection timeout.'))
    await expect(disconnectDongle('AA:BB', { strict: true })).rejects.toThrow('Disconnection timeout.')
    expect(mocks.getConnectedDevices).not.toHaveBeenCalled()
  })
  test('does not enqueue native operations when their fixed timeout exceeds the remaining budget', async () => {
    await expect(disconnectDongle('AA:BB', { deadline: Date.now() + 4999 })).rejects.toBeInstanceOf(DongleDeadlineError)
    await expect(discoverDongleServices('AA:BB', Date.now() + 4999)).rejects.toBeInstanceOf(DongleDeadlineError)
    expect(mocks.disconnect).not.toHaveBeenCalled()
    expect(mocks.discoverServices).not.toHaveBeenCalled()
  })
  test('retains bounded cleanup for the browser adapter', async () => {
    mocks.platform = 'web'
    mocks.disconnect.mockImplementation(() => new Promise(() => {}))
    const result = expect(disconnectDongle('device')).rejects.toThrow('Zeitüberschreitung')
    await vi.advanceTimersByTimeAsync(3000)
    await result
    expect(mocks.getConnectedDevices).not.toHaveBeenCalled()
  })
})
