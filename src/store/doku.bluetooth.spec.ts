import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'

const bluetooth = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getConnectedDevices: vi.fn(),
  getServices: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  initialize: vi.fn(),
  isEnabled: vi.fn(),
  isLocationEnabled: vi.fn(),
  openLocationSettings: vi.fn(),
  requestDevice: vi.fn(),
  requestEnable: vi.fn(),
  setDisplayStrings: vi.fn(),
}))

const capacitor = vi.hoisted(() => ({
  getPlatform: vi.fn(),
}))

const device = vi.hoisted(() => ({
  getInfo: vi.fn(),
}))

vi.mock('@capacitor-community/bluetooth-le', () => ({
  BleClient: bluetooth,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: capacitor,
  registerPlugin: vi.fn(() => ({})),
}))

vi.mock('@capacitor/device', () => ({
  Device: device,
}))

import { useDokuStore } from '@/store/doku'
import { ConfigUUID, ServiceUUID } from '@/types/dongle'
import { encodeDongleConfig, decodeDongleConfig } from '@/utils/dongle-config'

describe('DokuDongle Android BLE initialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    capacitor.getPlatform.mockReturnValue('android')
    device.getInfo.mockResolvedValue({ androidSDKVersion: 34 })
    bluetooth.initialize.mockResolvedValue(undefined)
    bluetooth.isEnabled.mockResolvedValue(true)
    bluetooth.isLocationEnabled.mockResolvedValue(true)
    bluetooth.getConnectedDevices.mockResolvedValue([])
    bluetooth.getServices.mockResolvedValue([])
    bluetooth.requestEnable.mockResolvedValue(undefined)
    bluetooth.openLocationSettings.mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => vi.restoreAllMocks())

  it('uses Nearby devices permissions without requiring Location on Android 12+', async () => {
    const store = useDokuStore()

    await store.initDongle()

    expect(bluetooth.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true })
    expect(bluetooth.isLocationEnabled).not.toHaveBeenCalled()
    expect(bluetooth.openLocationSettings).not.toHaveBeenCalled()
    expect(store.initialized).toBe(true)
  })

  it('keeps the Location service check on Android 11 and below', async () => {
    device.getInfo.mockResolvedValue({ androidSDKVersion: 30 })
    const store = useDokuStore()

    await store.initDongle()

    expect(bluetooth.isLocationEnabled).toHaveBeenCalledOnce()
    expect(bluetooth.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true })
    expect(store.initialized).toBe(true)
  })

  it('stops and opens Location settings when legacy Location services are disabled', async () => {
    device.getInfo.mockResolvedValue({ androidSDKVersion: 30 })
    bluetooth.isLocationEnabled.mockResolvedValue(false)
    const store = useDokuStore()

    await store.connectDongle()

    expect(bluetooth.openLocationSettings).toHaveBeenCalledOnce()
    expect(bluetooth.initialize).not.toHaveBeenCalled()
    expect(store.connection.isConnecting).toBe(false)
    expect(store.connection.isConnected).toBe(false)
    expect(store.connection.lastError).toContain('Standortdienste')
  })

  it('reports when the Bluetooth enable prompt is rejected', async () => {
    bluetooth.isEnabled.mockResolvedValue(false)
    bluetooth.requestEnable.mockRejectedValue(new Error('requestEnable failed.'))
    const store = useDokuStore()

    await store.connectDongle()

    expect(store.connection.isConnecting).toBe(false)
    expect(store.connection.isConnected).toBe(false)
    expect(store.connection.lastError).toContain('Bluetooth wurde nicht aktiviert')
  })

  it('discovers dongles by name without a native service UUID scan filter', async () => {
    bluetooth.requestDevice.mockRejectedValue(new Error('requestDevice cancelled.'))
    const store = useDokuStore()

    await store.connectDongle()

    expect(bluetooth.requestDevice).toHaveBeenCalledWith({
      namePrefix: 'DokuDongle',
      optionalServices: ['00001888-0000-1000-8000-00805f9b34fb', '00001530-1212-efde-1523-785feabcd123'],
    })
    expect(bluetooth.requestDevice.mock.calls[0]?.[0]).not.toHaveProperty('services')
  })

  it('cleans up after denied permissions and succeeds on retry', async () => {
    bluetooth.initialize.mockRejectedValueOnce(new Error('Permission denied.'))
    const store = useDokuStore()

    await store.connectDongle()

    expect(store.connection.isConnecting).toBe(false)
    expect(store.connection.isConnected).toBe(false)
    expect(store.connection.lastError).toContain('Bluetooth-Berechtigung')

    let connected = false
    bluetooth.getConnectedDevices.mockImplementation(async () => connected
      ? [{ deviceId: 'AA:BB:CC:DD:EE:FF', name: 'DokuDongle-Test' }]
      : [])
    bluetooth.requestDevice.mockResolvedValue({
      deviceId: 'AA:BB:CC:DD:EE:FF',
      name: 'DokuDongle-Test',
    })
    bluetooth.disconnect.mockResolvedValue(undefined)
    bluetooth.connect.mockImplementation(async () => {
      connected = true
    })

    await store.connectDongle()

    expect(store.connection.isConnecting).toBe(false)
    expect(store.connection.isConnected).toBe(true)
    expect(store.connection.lastError).toBeNull()
  })
})


describe('complete dongle settings', () => {
  const initial = { name: 'SavedName', keyGapMs: 30 }
  let connected: boolean
  let onDisconnect: (() => void) | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    vi.useFakeTimers()
    capacitor.getPlatform.mockReturnValue('web')
    bluetooth.initialize.mockResolvedValue(undefined)
    connected = false
    onDisconnect = undefined
    bluetooth.requestDevice.mockResolvedValue({ deviceId: 'dongle-1', name: 'DokuDongle-StaleAdvertisement' })
    bluetooth.getConnectedDevices.mockImplementation(async () => connected ? [{ deviceId: 'dongle-1' }] : [])
    bluetooth.getServices.mockResolvedValue([{
      uuid: ServiceUUID,
      characteristics: [{ uuid: ConfigUUID, properties: { read: true, write: true } }],
    }])
    bluetooth.connect.mockImplementation(async (_id, callback) => {
      connected = true
      onDisconnect = callback
    })
    bluetooth.disconnect.mockImplementation(async () => {
      connected = false
      onDisconnect?.()
    })
    bluetooth.read.mockResolvedValue(encodeDongleConfig(initial))
    bluetooth.write.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const connect = async () => {
    const store = useDokuStore()
    await store.connectDongle()
    return store
  }

  test('reads committed settings on connect and clears them on disconnect', async () => {
    const store = await connect()
    expect(store.connection.config).toEqual(initial)
    expect(store.connectedDongleName).toBe('DokuDongle-SavedName')
    expect(bluetooth.read).toHaveBeenCalledWith('dongle-1', ServiceUUID, ConfigUUID, { timeout: 3000 })
    onDisconnect?.()
    expect(store.connection.config).toBeNull()
    expect(store.connection.isConnected).toBe(false)
  })

  test('keeps legacy firmware connected but disables configuration editing', async () => {
    bluetooth.getServices.mockResolvedValue([{
      uuid: ServiceUUID,
      characteristics: [{ uuid: ConfigUUID, properties: { read: false, write: true } }],
    }])
    const store = await connect()
    expect(store.isDongleConnected).toBe(true)
    expect(store.connection.configStatus).toBe('unsupported')
    expect(store.connectedDongleName).toBe('DokuDongle-StaleAdvertisement')
    expect(bluetooth.read).not.toHaveBeenCalled()
    expect(await store.updateDongleConfig(initial)).toBe(false)
    expect(bluetooth.write).not.toHaveBeenCalled()
  })

  test('read failures and malformed replies can be retried without losing the BLE connection', async () => {
    bluetooth.read.mockResolvedValueOnce(new DataView(new Uint8Array([30, 0]).buffer))
    const store = await connect()
    expect(store.isDongleConnected).toBe(true)
    expect(store.connection.configStatus).toBe('error')
    await store.refreshDongleConfig()
    expect(store.connection.config).toEqual(initial)
  })

  test.each([
    { name: 'Changed', keyGapMs: 30 },
    { name: 'SavedName', keyGapMs: 0 },
    { name: 'Changed', keyGapMs: 200 },
  ])('saves the complete config and verifies it after reconnect: %j', async requested => {
    const store = await connect()
    bluetooth.read.mockResolvedValue(encodeDongleConfig(requested))
    const saving = store.updateDongleConfig(requested)
    expect(store.connection.isSavingSettings).toBe(true)
    expect(await store.updateDongleConfig(requested)).toBe(false)
    expect(await store.sendProtocol()).toBe(false)
    await store.connectDongle()
    expect(bluetooth.requestDevice).toHaveBeenCalledOnce()
    expect(store.connection.config).toEqual(initial)
    await vi.advanceTimersByTimeAsync(2000)
    expect(await saving).toBe(true)
    expect(decodeDongleConfig(bluetooth.write.mock.calls[0][3])).toEqual(requested)
    expect(bluetooth.write).toHaveBeenCalledOnce()
    expect(bluetooth.connect).toHaveBeenLastCalledWith('dongle-1', expect.any(Function), { timeout: 3000 })
    expect(bluetooth.requestDevice).toHaveBeenCalledOnce()
    expect(store.connection.config).toEqual(requested)
    expect(store.connection.isSavingSettings).toBe(false)
  })

  test('rejects readback mismatches and displays the actual saved config', async () => {
    const store = await connect()
    const saving = store.updateDongleConfig({ name: 'NotSaved', keyGapMs: 200 })
    await vi.advanceTimersByTimeAsync(2000)
    expect(await saving).toBe(false)
    expect(store.connection.config).toEqual(initial)
    expect(store.connectedDongleName).toBe('DokuDongle-SavedName')
  })

  test('write failures keep the previous config and allow retry without opening a chooser', async () => {
    const store = await connect()
    bluetooth.write.mockRejectedValueOnce(new Error('write failed'))
    expect(await store.updateDongleConfig({ name: 'Changed', keyGapMs: 40 })).toBe(false)
    expect(store.connection.config).toEqual(initial)
    expect(store.connection.isSavingSettings).toBe(false)
    expect(bluetooth.connect).toHaveBeenCalledOnce()
    expect(bluetooth.requestDevice).toHaveBeenCalledOnce()
    const requested = { name: 'Changed', keyGapMs: 40 }
    bluetooth.read.mockResolvedValue(encodeDongleConfig(requested))
    const saving = store.updateDongleConfig(requested)
    await vi.advanceTimersByTimeAsync(2000)
    expect(await saving).toBe(true)
  })

  test('retries a transient reconnect failure', async () => {
    const store = await connect()
    bluetooth.connect.mockRejectedValueOnce(new Error('still restarting'))
    bluetooth.read.mockResolvedValue(encodeDongleConfig({ ...initial, keyGapMs: 40 }))
    const saving = store.updateDongleConfig({ ...initial, keyGapMs: 40 })
    await vi.advanceTimersByTimeAsync(2500)
    expect(await saving).toBe(true)
    expect(bluetooth.connect).toHaveBeenCalledTimes(3)
  })

  test('recovers settings on an existing BLE connection after a verification timeout', async () => {
    const store = await connect()
    bluetooth.read.mockImplementation(() => new Promise(() => {}))
    const saving = store.updateDongleConfig({ name: 'Changed', keyGapMs: 40 })
    await vi.advanceTimersByTimeAsync(17000)
    expect(await saving).toBe(false)
    bluetooth.read.mockResolvedValue(encodeDongleConfig({ name: 'Changed', keyGapMs: 40 }))
    await store.connectDongle()
    expect(store.isDongleConnected).toBe(true)
    expect(store.connection.config).toEqual({ name: 'Changed', keyGapMs: 40 })
    expect(bluetooth.requestDevice).toHaveBeenCalledOnce()
  })

  test.each(['connect', 'read'] as const)('bounds a hung %s and retains no unconfirmed settings', async operation => {
    const store = await connect()
    bluetooth[operation].mockImplementation(() => new Promise(() => {}))
    const saving = store.updateDongleConfig({ name: 'Changed', keyGapMs: 40 })
    await vi.advanceTimersByTimeAsync(17000)
    expect(await saving).toBe(false)
    expect(store.connection.isSavingSettings).toBe(false)
    expect(store.connection.config).toBeNull()
    expect(store.connection.isConnected).toBe(false)
    expect(store.connection.lastError).toContain('nicht bestätigt')
  })

  test('ignores disconnect callbacks from the previous connection after reconnect', async () => {
    const store = await connect()
    const oldDisconnect = onDisconnect
    bluetooth.read.mockResolvedValue(encodeDongleConfig({ ...initial, keyGapMs: 40 }))
    const saving = store.updateDongleConfig({ ...initial, keyGapMs: 40 })
    await vi.advanceTimersByTimeAsync(2000)
    await saving
    oldDisconnect?.()
    expect(store.connection.isConnected).toBe(true)
    expect(store.connection.config?.keyGapMs).toBe(40)
  })

  test('does not publish an in-flight read after disconnect', async () => {
    let resolveRead!: (value: DataView) => void
    bluetooth.read.mockReturnValue(new Promise<DataView>(resolve => { resolveRead = resolve }))
    const store = useDokuStore()
    const connecting = store.connectDongle()
    await vi.advanceTimersByTimeAsync(0)
    onDisconnect?.()
    resolveRead(encodeDongleConfig(initial))
    await connecting
    expect(store.connection.config).toBeNull()
    expect(store.connection.isConnected).toBe(false)
  })

  test('rejects invalid input and saves during text transmission without BLE writes', async () => {
    const store = await connect()
    await expect(store.updateDongleConfig({ name: 'ä', keyGapMs: 30 })).rejects.toThrow()
    expect(store.connection.isSavingSettings).toBe(false)
    store.connection.isTransmitting = true
    expect(await store.updateDongleConfig({ ...initial, keyGapMs: 40 })).toBe(false)
    await store.connectDongle()
    expect(bluetooth.write).not.toHaveBeenCalled()
    expect(bluetooth.requestDevice).toHaveBeenCalledOnce()
  })
})
