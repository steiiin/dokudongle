import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { IonButton } from '@ionic/vue'
import { FirmwareUUID, DfuUUID, type FirmwareUpdateStatus } from '@/types/firmware'
import { ConfigUUID, ServiceUUID } from '@/types/dongle'
import { decodeFirmwareInfo, parseFirmwareManifest, updateAvailable } from '@/utils/dongle-firmware'
import { encodeDongleConfig } from '@/utils/dongle-config'

const mocks = vi.hoisted(() => ({
  platform: 'android',
  ble: { connect: vi.fn(), disconnect: vi.fn(), getServices: vi.fn(), read: vi.fn(), initialize: vi.fn() },
  native: { start: vi.fn(), getStatus: vi.fn(), finish: vi.fn(), dismiss: vi.fn(), addListener: vi.fn() },
  app: { addListener: vi.fn() },
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform }, registerPlugin: () => ({}) }))
vi.mock('@capacitor-community/bluetooth-le', () => ({ BleClient: mocks.ble }))
vi.mock('@/plugins/dongle-firmware', () => ({ DongleFirmware: mocks.native }))
vi.mock('@capacitor/app', () => ({ App: mocks.app }))
import { useDokuStore } from '@/store/doku'
import { useFirmwareStore } from '@/store/firmware'
import DongleFirmwareCard from '@/views/settingsCards/DongleFirmwareCard.vue'
import DodoFirmwareUpdate from '@/components/DodoFirmwareUpdate.vue'

const manifest = { version: 2, protocolRevision: 1, targetId: 1, target: 'xiao-nrf52840',
  packageFilename: 'dongle-v2-0123456789abcdef.zip', packageSha256: 'a'.repeat(64), sketchSha256: 'b'.repeat(64), buildFingerprint: 'c'.repeat(64) }
function wire(version: number, target = 1, revision = 1) {
  const data = new DataView(new ArrayBuffer(6)); data.setUint8(0, revision); data.setUint8(1, target); data.setUint32(2, version, true); return data
}
let emit: (status: FirmwareUpdateStatus) => void
let resume: (state: { isActive: boolean }) => void
let nativeStatus: FirmwareUpdateStatus
let firmware: ReturnType<typeof useFirmwareStore>
let doku: ReturnType<typeof useDokuStore>

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.platform = 'android'
  setActivePinia(createPinia())
  nativeStatus = { phase: 'idle', updatedAt: 0 }
  mocks.native.addListener.mockImplementation(async (_name, listener) => { emit = listener; return { remove: vi.fn() } })
  mocks.app.addListener.mockImplementation(async (_name, listener) => { resume = listener; return { remove: vi.fn() } })
  mocks.native.getStatus.mockImplementation(async () => nativeStatus)
  mocks.native.start.mockImplementation(async options => nativeStatus = { ...options, jobId: 'job-1', phase: 'preparing', updatedAt: 1 })
  mocks.native.finish.mockImplementation(async ({ verified }) => nativeStatus = { ...nativeStatus, phase: verified ? 'done' : 'error', error: verified ? undefined : 'Installation konnte nicht bestätigt werden.', updatedAt: 4 })
  mocks.native.dismiss.mockImplementation(async () => { nativeStatus = { phase: 'idle', updatedAt: 5 } })
  mocks.ble.connect.mockResolvedValue(undefined)
  mocks.ble.disconnect.mockResolvedValue(undefined)
  mocks.ble.getServices.mockResolvedValue([{ uuid: ServiceUUID, characteristics: [
    { uuid: FirmwareUUID, properties: { read: true } }, { uuid: ConfigUUID, properties: { read: true, write: true } },
  ] }, { uuid: DfuUUID, characteristics: [] }])
  mocks.ble.read.mockImplementation(async (_id, _service, characteristic) => characteristic === ConfigUUID ? encodeDongleConfig({ name: 'Test', keyGapMs: 30 }) : wire(1))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manifest }))
  doku = useDokuStore()
  vi.spyOn(doku, 'initDongle').mockResolvedValue(undefined)
  Object.assign(doku.connection, { device: { id: 'AA:BB:CC:DD:EE:FF', name: 'DokuDongle-Test' }, isConnected: true,
    firmware: decodeFirmwareInfo(wire(1)), firmwareStatus: 'ready', hasDfu: true, config: { name: 'Test', keyGapMs: 30 } })
  firmware = useFirmwareStore()
  await firmware.initialize()
})
afterEach(async () => { await firmware.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('firmware protocol and discovery', () => {
  test('decodes uint32 little endian, rejects malformed versions, and respects compatibility', () => {
    expect(decodeFirmwareInfo(wire(0x12345678)).version).toBe(0x12345678)
    expect(() => decodeFirmwareInfo(wire(0))).toThrow()
    expect(() => decodeFirmwareInfo(new DataView(new ArrayBuffer(5)))).toThrow()
    const bundled = parseFirmwareManifest(manifest)
    expect(updateAvailable(decodeFirmwareInfo(wire(1)), bundled)).toBe(true)
    for (const info of [wire(2), wire(3), wire(1, 2), wire(1, 1, 2)]) expect(updateAvailable(decodeFirmwareInfo(info), bundled)).toBe(false)
    expect(() => parseFirmwareManifest({ ...manifest, packageFilename: '../wrong.zip' })).toThrow()
  })
  test('discovers version and DFU; legacy and malformed responses are distinct', async () => {
    await doku.refreshDongleFirmware()
    expect(doku.connection.firmwareStatus).toBe('ready')
    expect(doku.connection.hasDfu).toBe(true)
    mocks.ble.getServices.mockResolvedValue([])
    await doku.refreshDongleFirmware()
    expect(doku.connection.firmwareStatus).toBe('unsupported')
    mocks.ble.getServices.mockRejectedValue(new Error('read failure'))
    await doku.refreshDongleFirmware()
    expect(doku.connection.firmwareStatus).toBe('error')
  })
  test('ignores reads from a disconnected session', async () => {
    mocks.ble.read.mockImplementationOnce(async () => { doku.dongleDisconnected(doku.connection.device!.id, doku.connection.session); return wire(2) })
    await doku.refreshDongleFirmware()
    expect(doku.connection.firmware).toBeNull()
    expect(doku.connection.firmwareStatus).toBe('unavailable')
  })
})

describe('update lifecycle', () => {
  test('locks operations immediately, transfers BLE ownership, and prevents duplicate installs', async () => {
    const installation = firmware.install()
    expect(doku.connection.isUpdatingFirmware).toBe(true)
    expect(await doku.sendProtocol()).toBe(false)
    expect(await doku.updateDongleConfig({ name: 'Other', keyGapMs: 50 })).toBe(false)
    await doku.connectDongle()
    await firmware.install()
    await installation
    expect(mocks.native.start).toHaveBeenCalledOnce()
    expect(mocks.ble.disconnect.mock.invocationCallOrder[0]).toBeLessThan(mocks.native.start.mock.invocationCallOrder[0])
    expect(doku.connection.isConnected).toBe(false)
    expect(firmware.active).toBe(true)
    emit({ ...nativeStatus, phase: 'transferring', progress: 45, updatedAt: 2 })
    expect(firmware.status.progress).toBe(45)
    await firmware.dismiss()
    expect(firmware.status.phase).toBe('transferring')
  })
  test('reports success only after reconnecting to the original address and reading the target version', async () => {
    await firmware.install()
    mocks.ble.read.mockImplementation(async (_id, _service, characteristic) => characteristic === ConfigUUID ? encodeDongleConfig({ name: 'Test', keyGapMs: 30 }) : wire(2))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }
    emit(nativeStatus)
    expect(firmware.status.phase).toBe('verifying')
    await flushPromises()
    expect(mocks.ble.connect).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', expect.any(Function), expect.any(Object))
    expect(mocks.native.finish).toHaveBeenCalledWith({ jobId: 'job-1', verified: true })
    expect(firmware.status.phase).toBe('done')
    expect(doku.connection.isUpdatingFirmware).toBe(false)
    expect(doku.connection.config).toEqual({ name: 'Test', keyGapMs: 30 })
  })
  test('a completed transfer with a wrong installed version is a failure', async () => {
    await firmware.install()
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }; emit(nativeStatus)
    await flushPromises()
    expect(firmware.status.phase).toBe('error')
    expect(mocks.native.finish).toHaveBeenCalledWith({ jobId: 'job-1', verified: false })
  })
  test('reconnection expires after 30 seconds and releases the lock', async () => {
    await firmware.install()
    mocks.ble.connect.mockRejectedValue(new Error('offline'))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }; emit(nativeStatus)
    await vi.advanceTimersByTimeAsync(30000)
    expect(firmware.status.phase).toBe('error')
    expect(doku.connection.isUpdatingFirmware).toBe(false)
  })
  test('resume restores native transfer state and ignores stale events', async () => {
    nativeStatus = { phase: 'transferring', progress: 60, updatedAt: 10, jobId: 'restored', deviceId: 'AA:BB:CC:DD:EE:FF', version: 2 }
    resume({ isActive: true }); await flushPromises()
    expect(firmware.status.progress).toBe(60)
    expect(doku.connection.isUpdatingFirmware).toBe(true)
    emit({ phase: 'idle', updatedAt: 1 })
    expect(firmware.status.phase).toBe('transferring')
    emit({ ...nativeStatus, phase: 'error', error: 'Interrupted', updatedAt: 11 })
    expect(doku.connection.isUpdatingFirmware).toBe(false)
  })
  test('retry reconnects only to the original address and does not silently install', async () => {
    await firmware.install()
    nativeStatus = { ...nativeStatus, phase: 'error', updatedAt: 3 }; emit(nativeStatus)
    await firmware.retry()
    expect(mocks.ble.connect).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', expect.any(Function), expect.any(Object))
    expect(firmware.canInstall).toBe(true)
    expect(mocks.native.start).toHaveBeenCalledOnce()
  })
})

describe('settings and overlay', () => {
  test('offers only compatible upgrades and displays legacy setup instructions', async () => {
    const wrapper = shallowMount(DongleFirmwareCard, { global: { renderStubDefaultSlot: true } })
    expect(wrapper.text()).toContain('Neue Dongle-Version verfügbar.')
    expect(wrapper.findAllComponents(IonButton).some(button => button.text() === 'Installieren')).toBe(true)
    doku.connection.firmware!.version = 3; await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Installieren')
    doku.connection.firmwareStatus = 'unsupported'; await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Einrichtung über USB')
    wrapper.unmount()
  })
  test('browser displays firmware information without an installation action', async () => {
    await firmware.dispose(); mocks.platform = 'web'; setActivePinia(createPinia())
    doku = useDokuStore(); Object.assign(doku.connection, { isConnected: true, firmware: decodeFirmwareInfo(wire(1)), firmwareStatus: 'ready', hasDfu: true })
    firmware = useFirmwareStore(); await firmware.initialize()
    const wrapper = shallowMount(DongleFirmwareCard, { global: { renderStubDefaultSlot: true } })
    expect(wrapper.text()).toContain('Android-App')
    expect(firmware.canInstall).toBe(false)
    await firmware.install(); expect(mocks.native.start).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  test('overlay stays open during a bootloader disconnect', async () => {
    const wrapper = shallowMount(DodoFirmwareUpdate, { global: { renderStubDefaultSlot: true } })
    await firmware.install(); await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'IonModal' }).props('isOpen')).toBe(true)
    expect(wrapper.findComponent({ name: 'IonModal' }).props('canDismiss')).toBe(false)
    expect(doku.connection.isConnected).toBe(false)
    wrapper.unmount()
  })
})
