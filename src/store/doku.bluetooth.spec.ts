import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bluetooth = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getConnectedDevices: vi.fn(),
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
