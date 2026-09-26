import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { IonButton } from '@ionic/vue'
import { FirmwareUUID, DfuUUID, type FirmwareUpdateStatus, type FirmwareRecovery } from '@/types/firmware'
import { ConfigUUID, ServiceUUID } from '@/types/dongle'
import { decodeFirmwareInfo, parseFirmwareManifest, updateAvailable, offsetDfuAddress, matchesDfuAddress } from '@/utils/dongle-firmware'
import { encodeDongleConfig } from '@/utils/dongle-config'

const mocks = vi.hoisted(() => ({
  platform: 'android',
  ble: { connect: vi.fn(), disconnect: vi.fn(), getServices: vi.fn(), getConnectedDevices: vi.fn(), discoverServices: vi.fn(), read: vi.fn(), initialize: vi.fn(), requestLEScan: vi.fn(), stopLEScan: vi.fn() },
  native: { start: vi.fn(), getStatus: vi.fn(), finish: vi.fn(), clearRecovery: vi.fn(), dismiss: vi.fn(), addListener: vi.fn() },
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
let persistedRecovery: FirmwareRecovery | undefined
let nativeStatus: FirmwareUpdateStatus
let scan: (result: { device: { deviceId: string; name?: string }; localName?: string }) => void
let firmware: ReturnType<typeof useFirmwareStore>
let doku: ReturnType<typeof useDokuStore>

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.platform = 'android'
  setActivePinia(createPinia())
  nativeStatus = { phase: 'idle', updatedAt: 0 }
  persistedRecovery = undefined
  mocks.native.addListener.mockImplementation(async (_name, listener) => { emit = listener; return { remove: vi.fn() } })
  mocks.app.addListener.mockImplementation(async (_name, listener) => { resume = listener; return { remove: vi.fn() } })
  mocks.native.getStatus.mockImplementation(async () => ({ ...nativeStatus, recovery: persistedRecovery }))
  mocks.native.start.mockImplementation(async options => {
    persistedRecovery = { ...options, jobId: 'job-1' }
    return nativeStatus = { ...options, jobId: 'job-1', phase: 'preparing', updatedAt: nativeStatus.updatedAt + 1, recovery: persistedRecovery }
  })
  mocks.native.finish.mockImplementation(async ({ verified }) => {
    if (verified) persistedRecovery = undefined
    return nativeStatus = { ...nativeStatus, phase: verified ? 'done' : 'error', error: verified ? undefined : 'Installation konnte nicht bestätigt werden.', updatedAt: nativeStatus.updatedAt + 1, recovery: persistedRecovery }
  })
  mocks.native.clearRecovery.mockImplementation(async () => {
    const completed = persistedRecovery
    persistedRecovery = undefined
    return nativeStatus = { ...completed, phase: 'done', updatedAt: nativeStatus.updatedAt + 1 }
  })
  mocks.native.dismiss.mockImplementation(async () => { nativeStatus = { phase: 'idle', updatedAt: nativeStatus.updatedAt + 1, recovery: persistedRecovery } })
  mocks.ble.requestLEScan.mockImplementation(async (_options, listener) => { scan = listener })
  mocks.ble.stopLEScan.mockResolvedValue(undefined)
  mocks.ble.discoverServices.mockResolvedValue(undefined)
  mocks.ble.connect.mockResolvedValue(undefined)
  mocks.ble.disconnect.mockResolvedValue(undefined)
  mocks.ble.getConnectedDevices.mockResolvedValue([])
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
  test('waits for native connection cleanup and recovers from a stale disconnected handle', async () => {
    await firmware.install()
    mocks.ble.connect.mockImplementationOnce(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout.')), 10000)
    }))
    mocks.ble.disconnect.mockResolvedValueOnce(undefined).mockImplementationOnce(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Disconnection timeout.')), 5000)
    }))
    mocks.ble.read.mockImplementation(async (_id, _service, characteristic) => characteristic === ConfigUUID
      ? encodeDongleConfig({ name: 'Test', keyGapMs: 30 }) : wire(2))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }; emit(nativeStatus)
    await vi.advanceTimersByTimeAsync(9999)
    expect(mocks.ble.connect).toHaveBeenCalledTimes(1)
    expect(mocks.ble.disconnect).toHaveBeenCalledTimes(2) // install and first verification attempt
    expect(mocks.native.finish).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5501)
    expect(mocks.ble.getConnectedDevices).toHaveBeenCalledWith([])
    expect(mocks.ble.connect).toHaveBeenCalledTimes(2)
    expect(mocks.ble.connect).toHaveBeenLastCalledWith(applicationAddress, expect.any(Function), { timeout: 10000 })
    expect(mocks.ble.discoverServices.mock.invocationCallOrder[0]).toBeLessThan(mocks.ble.read.mock.invocationCallOrder[1])
    expect(firmware.status.phase).toBe('done')
  })
  test('retains the last native failure and starts no work after verification exhausts its budget', async () => {
    await firmware.install()
    mocks.ble.connect.mockImplementation((_id, _callback, { timeout }) => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout.')), timeout)
    }))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }; emit(nativeStatus)
    await vi.advanceTimersByTimeAsync(30000)
    expect(firmware.status.phase).toBe('error')
    expect(firmware.status.error).toContain('Dongle verbinden: Connection timeout.')
    expect(firmware.recovery).toBeDefined()
    expect(doku.connection.isUpdatingFirmware).toBe(false)
    const calls = mocks.ble.connect.mock.calls.length
    await vi.advanceTimersByTimeAsync(10000)
    expect(mocks.ble.connect).toHaveBeenCalledTimes(calls)
    expect(mocks.native.finish).toHaveBeenCalledOnce()
  })
  test('rejects version data returned after a disconnect during verification', async () => {
    await firmware.install()
    mocks.ble.read.mockImplementationOnce(async () => {
      doku.dongleDisconnected(applicationAddress, doku.connection.session)
      return wire(2)
    })
    mocks.ble.connect.mockResolvedValueOnce(undefined).mockRejectedValue(new Error('offline'))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: 3 }; emit(nativeStatus)
    await vi.advanceTimersByTimeAsync(30000)
    expect(mocks.native.finish).toHaveBeenCalledWith({ jobId: 'job-1', verified: false })
    expect(doku.connection.firmware).toBeNull()
  })
  test('keeps active application cleanup strict before native DFU starts', async () => {
    mocks.ble.disconnect.mockRejectedValue(new Error('Disconnection timeout.'))
    await firmware.install()
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.getConnectedDevices).not.toHaveBeenCalled()
    expect(firmware.status.phase).toBe('error')
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
  test('retry restarts the update when the original application is still running', async () => {
    await firmware.install()
    nativeStatus = { ...nativeStatus, phase: 'error', updatedAt: 3 }; emit(nativeStatus)
    await firmware.retry()
    expect(mocks.ble.connect).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', expect.any(Function), expect.any(Object))
    expect(firmware.active).toBe(true)
    expect(mocks.native.start).toHaveBeenCalledTimes(2)
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


const applicationAddress = 'AA:BB:CC:DD:EE:FF'
const dfuAddress = 'AA:BB:CC:DD:EE:00'
const dfuServices = [{ uuid: DfuUUID, characteristics: [
  { uuid: '00001531-1212-efde-1523-785feabcd123', properties: { write: true, notify: true } },
  { uuid: '00001532-1212-efde-1523-785feabcd123', properties: { writeWithoutResponse: true } },
] }]
function interrupted(version = 2) {
  persistedRecovery = { jobId: 'failed-job', deviceId: applicationAddress, deviceName: 'DokuDongle-Test', version }
  nativeStatus = { ...persistedRecovery, phase: 'error', updatedAt: 10, recovery: persistedRecovery, error: 'Interrupted' }
  emit(nativeStatus)
  doku.connection.isConnected = false
}
async function startDfuRetry() {
  interrupted()
  mocks.ble.connect.mockRejectedValueOnce(new Error('application missing'))
  mocks.ble.getServices.mockResolvedValue(dfuServices)
  const attempt = firmware.retry()
  await flushPromises()
  return { attempt }
}

describe('DFU recovery', () => {
  test('address mapping wraps only the last byte and rejects unrelated addresses', () => {
    expect(offsetDfuAddress(applicationAddress, 1)).toBe(dfuAddress)
    expect(offsetDfuAddress(dfuAddress, -1)).toBe(applicationAddress)
    expect(matchesDfuAddress(applicationAddress.toLowerCase(), dfuAddress)).toBe(true)
    expect(matchesDfuAddress(applicationAddress, 'AA:BB:CC:DD:EF:00')).toBe(false)
    expect(() => offsetDfuAddress('not-an-address', 1)).toThrow()
  })
  test.each([applicationAddress, dfuAddress])('restarts directly at matching DFU address %s after GATT validation', async address => {
    const { attempt } = await startDfuRetry()
    scan({ device: { deviceId: '11:22:33:44:55:66', name: 'XIAO_DFU' } })
    await flushPromises()
    expect(mocks.native.start).not.toHaveBeenCalled()
    scan({ device: { deviceId: address, name: 'XIAO_DFU' } })
    await attempt
    expect(mocks.native.start).toHaveBeenCalledWith({ deviceId: applicationAddress, deviceName: 'DokuDongle-Test', version: 2, dfuDeviceId: address })
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(mocks.ble.stopLEScan.mock.invocationCallOrder[0]).toBeLessThan(mocks.native.start.mock.invocationCallOrder[0])
    expect(mocks.ble.disconnect.mock.invocationCallOrder.at(-1)).toBeLessThan(mocks.native.start.mock.invocationCallOrder[0])
  })
  test('discovery locks other operations and ignores duplicate retries and stale native events', async () => {
    const { attempt } = await startDfuRetry()
    await firmware.retry()
    await firmware.recoverManually()
    await doku.connectDongle()
    expect(await doku.sendProtocol()).toBe(false)
    expect(await doku.updateDongleConfig({ name: 'Other', keyGapMs: 50 })).toBe(false)
    emit({ phase: 'error', updatedAt: 11 })
    expect(firmware.status.phase).toBe('searching')
    expect(mocks.ble.requestLEScan).toHaveBeenCalledOnce()
    firmware.cancelDiscovery()
    await attempt
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(doku.connection.isUpdatingFirmware).toBe(false)
  })
  test('a timed-out application connection can still discover DFU when cleanup reports it already disconnected', async () => {
    interrupted()
    mocks.ble.connect.mockRejectedValueOnce(new Error('Connection timeout'))
    mocks.ble.disconnect.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Disconnection timeout'))
    mocks.ble.getServices.mockResolvedValue(dfuServices)
    const attempt = firmware.retry()
    await flushPromises()
    expect(mocks.ble.requestLEScan).toHaveBeenCalledOnce()
    scan({ device: { deviceId: dfuAddress } })
    await attempt
    expect(mocks.native.start).toHaveBeenCalledOnce()
    expect(mocks.ble.discoverServices).toHaveBeenCalledWith(dfuAddress)
  })
  test('does not hand BLE to native DFU if disconnecting a validated bootloader fails', async () => {
    const { attempt } = await startDfuRetry()
    mocks.ble.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'))
    scan({ device: { deviceId: dfuAddress } })
    await attempt
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(firmware.status.phase).toBe('error')
    expect(firmware.recovery).toBeDefined()
  })
  test('scan timeout retains recovery and permits a later attempt', async () => {
    const { attempt } = await startDfuRetry()
    await vi.advanceTimersByTimeAsync(15000)
    await attempt
    expect(firmware.status.phase).toBe('error')
    expect(firmware.recovery?.deviceId).toBe(applicationAddress)
    expect(firmware.canRecover).toBe(true)
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(mocks.native.start).not.toHaveBeenCalled()
  })
  test('backgrounding cancels discovery and late advertisements cannot start an update', async () => {
    const { attempt } = await startDfuRetry()
    resume({ isActive: false })
    await attempt
    scan({ device: { deviceId: dfuAddress, name: 'XIAO_DFU' } })
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(firmware.recovery).toBeDefined()
  })
  test('cancellation during native scan startup stops the scan when startup returns', async () => {
    let started!: () => void
    mocks.ble.requestLEScan.mockImplementation(() => new Promise<void>(resolve => { started = resolve }))
    const { attempt } = await startDfuRetry()
    firmware.cancelDiscovery()
    started()
    await attempt
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(mocks.native.start).not.toHaveBeenCalled()
  })
  test('rejects a DFU advertisement without the required GATT service', async () => {
    const { attempt } = await startDfuRetry()
    mocks.ble.getServices.mockResolvedValue([])
    scan({ device: { deviceId: dfuAddress } })
    await attempt
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(firmware.status.error).toContain('DFU-Bootloader')
    expect(firmware.recovery).toBeDefined()
  })
  test('recognizes an already completed update and refreshes settings without reflashing', async () => {
    interrupted()
    mocks.ble.read.mockImplementation(async (_id, _service, characteristic) => characteristic === ConfigUUID ? encodeDongleConfig({ name: 'Restored', keyGapMs: 50 }) : wire(2))
    await firmware.retry()
    expect(mocks.native.clearRecovery).toHaveBeenCalledWith({ jobId: 'failed-job', version: 2 })
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(firmware.status.phase).toBe('done')
    expect(firmware.recovery).toBeUndefined()
    expect(doku.connection.config).toEqual({ name: 'Restored', keyGapMs: 50 })
  })
  test('refuses a bundled version older than the interrupted target', async () => {
    interrupted(3)
    await firmware.retry()
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.requestLEScan).not.toHaveBeenCalled()
    expect(firmware.status.error).toContain('App aktualisieren')
    expect(firmware.recovery?.version).toBe(3)
  })
  test('retains retry after dismissal and a fresh store restores the persisted target', async () => {
    interrupted()
    await firmware.dismiss()
    expect(firmware.status.phase).toBe('idle')
    expect(firmware.recovery?.deviceId).toBe(applicationAddress)
    await firmware.dispose()
    setActivePinia(createPinia())
    firmware = useFirmwareStore()
    await firmware.initialize()
    expect(firmware.status.phase).toBe('idle')
    expect(firmware.recovery?.deviceId).toBe(applicationAddress)
    expect(firmware.canRecover).toBe(true)
  })
  test('manual recovery requires selecting a supported device and derives its application address', async () => {
    doku.connection.isConnected = false
    mocks.ble.getServices.mockResolvedValue(dfuServices)
    const attempt = firmware.recoverManually()
    await flushPromises()
    scan({ device: { deviceId: '11:22:33:44:55:66', name: 'Other_DFU' } })
    scan({ device: { deviceId: dfuAddress, name: 'XIAO_DFU' } })
    scan({ device: { deviceId: '11:22:33:44:55:67', name: 'XIAO_DFU' } })
    scan({ device: { deviceId: dfuAddress, name: 'XIAO_DFU' } })
    expect(firmware.recoveryDevices).toHaveLength(2)
    expect(mocks.native.start).not.toHaveBeenCalled()
    firmware.selectRecoveryDevice('not-a-scanned-device')
    expect(mocks.native.start).not.toHaveBeenCalled()
    firmware.selectRecoveryDevice(dfuAddress)
    await attempt
    expect(mocks.native.start).toHaveBeenCalledWith({ deviceId: applicationAddress, deviceName: 'DokuDongle', version: 2, dfuDeviceId: dfuAddress })
  })
  test('manual scan stops at 15 seconds but keeps discovered devices available for selection', async () => {
    const attempt = firmware.recoverManually()
    await flushPromises()
    scan({ device: { deviceId: dfuAddress, name: 'XIAO_DFU' } })
    await vi.advanceTimersByTimeAsync(15000)
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
    expect(firmware.recoveryDevices).toHaveLength(1)
    firmware.cancelDiscovery()
    await attempt
    expect(mocks.ble.stopLEScan).toHaveBeenCalledOnce()
  })
  test('Settings offers recovery without a normal dongle connection', async () => {
    doku.connection.isConnected = false
    const wrapper = shallowMount(DongleFirmwareCard, { global: { renderStubDefaultSlot: true } })
    expect(wrapper.text()).toContain('Dongle wiederherstellen')
    expect(wrapper.text()).toContain('aus- und wieder einstecken')
    wrapper.unmount()
  })
  test('recovered transfers still require exact application version confirmation', async () => {
    const { attempt } = await startDfuRetry()
    scan({ device: { deviceId: dfuAddress } })
    await attempt
    mocks.ble.read.mockResolvedValue(wire(1))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: nativeStatus.updatedAt + 1 }
    emit(nativeStatus)
    await flushPromises()
    expect(firmware.status.phase).toBe('error')
    expect(firmware.recovery).toBeDefined()
    expect(mocks.native.finish).toHaveBeenCalledWith({ jobId: 'job-1', verified: false })
  })
})
