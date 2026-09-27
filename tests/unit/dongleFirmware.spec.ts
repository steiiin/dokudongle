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
  ble: { connect: vi.fn(), disconnect: vi.fn(), getServices: vi.fn(), getConnectedDevices: vi.fn(), discoverServices: vi.fn(), read: vi.fn(), requestDevice: vi.fn(), initialize: vi.fn(), requestLEScan: vi.fn(), stopLEScan: vi.fn() },
  native: { start: vi.fn(), getStatus: vi.fn(), finish: vi.fn(), clearRecovery: vi.fn(), dismiss: vi.fn(), addListener: vi.fn() },
  app: { addListener: vi.fn() },
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform }, registerPlugin: () => ({}) }))
vi.mock('@capacitor-community/bluetooth-le', () => ({ BleClient: mocks.ble }))
vi.mock('@/plugins/dongle-firmware', () => ({ DongleFirmware: mocks.native }))
vi.mock('@capacitor/app', () => ({ App: mocks.app }))
import { useDokuStore } from '@/store/doku'
import { useFirmwareStore } from '@/store/firmware'
import DongleSettingsCard from '@/views/settingsCards/DongleSettingsCard.vue'
import DodoFirmwareUpdate from '@/views/settingsCards/DodoFirmwareUpdate.vue'

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
  const mountCard = () => shallowMount(DongleSettingsCard, {
    global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } },
  })
  const findButton = (wrapper: ReturnType<typeof mountCard>, label: string) =>
    wrapper.findAllComponents(IonButton).find(button => button.text() === label)

  test('replaces settings with installation and restores editing when current', async () => {
    const wrapper = mountCard()
    expect(wrapper.get('.current-settings').text()).toContain('Version: v1 (v2 verfügbar)')
    expect(findButton(wrapper, 'Einstellungen ändern')).toBeUndefined()
    await findButton(wrapper, 'Neue Dongle-Version installieren')!.trigger('click')
    expect(firmware.pendingUpdate).toBe('install')
    expect(mocks.native.start).not.toHaveBeenCalled()
    doku.connection.firmware!.version = 2
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.current-settings').text()).toContain('Version: v2')
    expect(wrapper.get('.current-settings').text()).not.toContain('verfügbar')
    expect(findButton(wrapper, 'Neue Dongle-Version installieren')).toBeUndefined()
    expect(findButton(wrapper, 'Einstellungen ändern')!.props('disabled')).toBe(false)
    wrapper.unmount()
  })

  test.each(['isTransmitting', 'isSavingSettings', 'isUpdatingFirmware'] as const)(
    'keeps installation visible but disabled while %s', async busyFlag => {
      const wrapper = mountCard()
      doku.connection[busyFlag] = true
      await wrapper.vm.$nextTick()
      expect(findButton(wrapper, 'Neue Dongle-Version installieren')!.props('disabled')).toBe(true)
      expect(findButton(wrapper, 'Einstellungen ändern')).toBeUndefined()
      doku.connection[busyFlag] = false
      await wrapper.vm.$nextTick()
      expect(findButton(wrapper, 'Neue Dongle-Version installieren')!.props('disabled')).toBe(false)
      wrapper.unmount()
    },
  )

  test('blocks saving an open settings draft when an installable update appears', async () => {
    firmware.manifest = null
    const wrapper = mountCard()
    await findButton(wrapper, 'Einstellungen ändern')!.trigger('click')
    wrapper.getComponent({ name: 'IonInput' }).vm.$emit('ionInput', { detail: { value: 'Changed' } })
    await wrapper.vm.$nextTick()
    expect(findButton(wrapper, 'Speichern')!.props('disabled')).toBe(false)
    await firmware.loadManifest()
    await wrapper.vm.$nextTick()
    expect(findButton(wrapper, 'Speichern')!.props('disabled')).toBe(true)
    const save = vi.spyOn(doku, 'updateDongleConfig').mockResolvedValue(true)
    await findButton(wrapper, 'Speichern')!.trigger('click')
    expect(save).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  test('uses shared error hints in the update overlay', async () => {
    firmware.status = { phase: 'error', updatedAt: 1, error: 'Installation fehlgeschlagen' }
    firmware.nativeError = 'Status konnte nicht geladen werden'
    const wrapper = shallowMount(DodoFirmwareUpdate, {
      global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } },
    })
    expect(wrapper.findAll('.dd-hint--error[role="alert"]').map(hint => hint.text())).toEqual([
      'Installation fehlgeschlagen', 'Status konnte nicht geladen werden',
    ])
    wrapper.unmount()
  })

  test('shows loading and unavailable versions and retries a read failure', async () => {
    doku.connection.firmware = null
    doku.connection.firmwareStatus = 'loading'
    const wrapper = mountCard()
    expect(wrapper.get('.current-settings').text()).toContain('Version: wird gelesen …')
    doku.connection.firmwareStatus = 'unavailable'
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.current-settings').text()).toContain('Version: nicht verfügbar')
    doku.connection.firmwareStatus = 'error'
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('Dongle-Version konnte nicht gelesen')
    const refresh = vi.spyOn(doku, 'refreshDongleFirmware').mockResolvedValue(undefined)
    await findButton(wrapper, 'Version erneut laden')!.trigger('click')
    expect(refresh).toHaveBeenCalledOnce()
    doku.connection.isUpdatingFirmware = true
    await wrapper.vm.$nextTick()
    expect(findButton(wrapper, 'Version erneut laden')!.props('disabled')).toBe(true)
    wrapper.unmount()
  })

  test('retains settings and USB warning for firmware without DFU', () => {
    doku.connection.hasDfu = false
    const wrapper = mountCard()
    expect(wrapper.get('.current-settings').text()).toContain('Version: v1 (v2 verfügbar)')
    expect(wrapper.get('.dd-hint--warning').text()).toContain('Einrichtung über USB')
    expect(findButton(wrapper, 'Neue Dongle-Version installieren')).toBeUndefined()
    expect(findButton(wrapper, 'Einstellungen ändern')!.props('disabled')).toBe(false)
    wrapper.unmount()
  })

  test('renders settings, manifest and native failures with their retry actions', async () => {
    doku.connection.configStatus = 'error'
    firmware.manifestError = 'Firmware fehlt'
    firmware.nativeError = 'Status fehlt'
    const wrapper = mountCard()
    expect(wrapper.findAll('[role="alert"]').map(hint => hint.text())).toEqual([
      'Die Dongle-Einstellungen konnten nicht gelesen werden.', 'Firmware fehlt', 'Status fehlt',
    ])
    const refresh = vi.spyOn(doku, 'refreshDongleConfig').mockResolvedValue(undefined)
    const load = vi.spyOn(firmware, 'loadManifest').mockResolvedValue(undefined)
    const restore = vi.spyOn(firmware, 'restore').mockResolvedValue(undefined)
    await findButton(wrapper, 'Einstellungen erneut laden')!.trigger('click')
    await findButton(wrapper, 'Firmware erneut laden')!.trigger('click')
    await findButton(wrapper, 'Update-Status erneut laden')!.trigger('click')
    expect(refresh).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
    expect(restore).toHaveBeenCalledOnce()
    expect(findButton(wrapper, 'Neue Dongle-Version installieren')!.props('disabled')).toBe(true)
    wrapper.unmount()
  })

  test('keeps recovery actions without connected-device settings', async () => {
    doku.connection.isConnected = false
    firmware.status = { phase: 'idle', updatedAt: 1, recovery: {
      jobId: 'interrupted', deviceId: 'AA:BB:CC:DD:EE:FF', deviceName: 'DokuDongle-Test', version: 2,
    } }
    const wrapper = mountCard()
    expect(wrapper.find('[data-testid="dongle-settings"]').exists()).toBe(true)
    expect(wrapper.find('.current-settings').exists()).toBe(false)
    expect(findButton(wrapper, 'Einstellungen ändern')).toBeUndefined()
    expect(findButton(wrapper, 'Neue Dongle-Version installieren')).toBeUndefined()
    expect(wrapper.get('.dd-hint--warning').text()).toContain('noch nicht bestätigt')
    await findButton(wrapper, 'Update erneut versuchen')!.trigger('click')
    expect(firmware.pendingUpdate).toBe('retry')
    firmware.cancelUpdate()
    await findButton(wrapper, 'Dongle wiederherstellen')!.trigger('click')
    expect(firmware.pendingUpdate).toBe('recoverManually')
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.requestLEScan).not.toHaveBeenCalled()
    doku.connection.isConnecting = true
    await wrapper.vm.$nextTick()
    expect(findButton(wrapper, 'Update erneut versuchen')!.props('disabled')).toBe(true)
    expect(findButton(wrapper, 'Dongle wiederherstellen')!.props('disabled')).toBe(true)
    wrapper.unmount()
  })

  test('offers only compatible upgrades and displays legacy setup instructions', async () => {
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.text()).toContain('Version: v1 (v2 verfügbar)')
    expect(wrapper.findAllComponents(IonButton).some(button => button.text() === 'Neue Dongle-Version installieren')).toBe(true)
    doku.connection.firmware!.version = 3; await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Neue Dongle-Version installieren')
    doku.connection.firmwareStatus = 'unsupported'; await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Einrichtung über USB')
    wrapper.unmount()
  })
  test('browser displays firmware information without an installation action', async () => {
    await firmware.dispose(); mocks.platform = 'web'; setActivePinia(createPinia())
    doku = useDokuStore(); Object.assign(doku.connection, { isConnected: true, firmware: decodeFirmwareInfo(wire(1)), firmwareStatus: 'ready', hasDfu: true })
    firmware = useFirmwareStore(); await firmware.initialize()
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.text()).toContain('Android-App')
    expect(wrapper.text()).toContain('Version: v1 (v2 verfügbar)')
    expect(findButton(wrapper, 'Neue Dongle-Version installieren')).toBeUndefined()
    expect(findButton(wrapper, 'Einstellungen ändern')).toBeDefined()
    doku.connection.failedConnectionAttempts = 2
    firmware.status = { phase: 'error', updatedAt: 1 }
    await wrapper.vm.$nextTick()
    expect(firmware.showRecovery).toBe(false)
    expect(wrapper.text()).not.toContain('Dongle wiederherstellen')
    expect(firmware.canInstall).toBe(false)
    await firmware.install(); expect(mocks.native.start).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  test('confirms before updating, cancels without side effects, and starts only once on proceed', async () => {
    const card = mountCard()
    const wrapper = shallowMount(DodoFirmwareUpdate, { global: { renderStubDefaultSlot: true } })
    const modal = wrapper.getComponent({ name: 'IonModal' })
    expect(modal.props('isOpen')).toBe(false)
    await findButton(card, 'Neue Dongle-Version installieren')!.trigger('click')
    expect(modal.props('isOpen')).toBe(true)
    expect(wrapper.text()).toContain('dauert einige Minuten')
    expect(wrapper.text()).toContain('nicht abziehen')
    expect(wrapper.text()).toContain('Smartphone eingeschaltet')
    expect(wrapper.text()).toContain('Bildschirm eingeschaltet')
    const cancel = findButton(wrapper, 'Abbrechen')!
    const proceed = findButton(wrapper, 'Fortfahren')!
    expect(cancel.element.parentElement?.getAttribute('slot')).toBe('start')
    expect(proceed.element.parentElement?.getAttribute('slot')).toBe('end')
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.disconnect).not.toHaveBeenCalled()
    await cancel.trigger('click')
    expect(modal.props('isOpen')).toBe(false)
    expect(firmware.status.phase).toBe('idle')
    expect(mocks.native.start).not.toHaveBeenCalled()
    await findButton(card, 'Neue Dongle-Version installieren')!.trigger('click')
    await findButton(wrapper, 'Fortfahren')!.trigger('click')
    await firmware.confirmUpdate()
    await flushPromises()
    expect(mocks.native.start).toHaveBeenCalledOnce()
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('canDismiss')).toBe(false)
    expect(findButton(wrapper, 'Abbrechen')).toBeUndefined()
    expect(findButton(wrapper, 'Fortfahren')).toBeUndefined()
    card.unmount()
    wrapper.unmount()
  })

  test('blocks proceeding when the dongle disconnects during confirmation', async () => {
    const wrapper = shallowMount(DodoFirmwareUpdate, { global: { renderStubDefaultSlot: true } })
    firmware.requestUpdate('install')
    doku.connection.isConnected = false
    await wrapper.vm.$nextTick()
    const proceed = findButton(wrapper, 'Fortfahren')!
    expect(proceed.props('disabled')).toBe(true)
    await proceed.trigger('click')
    expect(mocks.native.start).not.toHaveBeenCalled()
    expect(mocks.ble.disconnect).not.toHaveBeenCalled()
    await findButton(wrapper, 'Abbrechen')!.trigger('click')
    expect(wrapper.getComponent({ name: 'IonModal' }).props('isOpen')).toBe(false)
    wrapper.unmount()
  })

  test('overlay stays open during a bootloader disconnect', async () => {
    const wrapper = shallowMount(DodoFirmwareUpdate, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
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
    expect(firmware.showRecovery).toBe(false)
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
    expect(firmware.showRecovery).toBe(true)
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.text()).toContain('Dongle wiederherstellen')
    expect(wrapper.text()).toContain('Update erneut versuchen')
    wrapper.unmount()
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
  test('Settings reveals recovery after two cancelled searches and hides it after connecting', async () => {
    doku.connection.isConnected = false
    mocks.ble.requestDevice.mockRejectedValue(new Error('requestDevice cancelled.'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.find('[data-testid="dongle-settings"]').exists()).toBe(false)
    await doku.connectDongle()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="dongle-settings"]').exists()).toBe(false)
    await doku.connectDongle()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Dongle wiederherstellen')
    expect(wrapper.text()).toContain('aus- und wieder einstecken')
    mocks.ble.requestDevice.mockResolvedValue({ deviceId: applicationAddress, name: 'DokuDongle-Test' })
    await doku.connectDongle()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Version: v1')
    expect(wrapper.text()).not.toContain('Dongle wiederherstellen')
    doku.dongleDisconnected(applicationAddress, doku.connection.session)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="dongle-settings"]').exists()).toBe(false)
    wrapper.unmount()
  })
  test('connected firmware information stays visible without recovery controls', () => {
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.text()).toContain('Version: v1')
    expect(wrapper.text()).toContain('Neue Dongle-Version installieren')
    expect(wrapper.text()).not.toContain('Dongle wiederherstellen')
    expect(wrapper.text()).not.toContain('aus- und wieder einstecken')
    wrapper.unmount()
  })
  test('an initial update in progress does not reveal recovery', async () => {
    await firmware.install()
    expect(firmware.active).toBe(true)
    expect(firmware.recovery).toBeDefined()
    expect(firmware.showRecovery).toBe(false)
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.find('[data-testid="dongle-settings"]').exists()).toBe(false)
    wrapper.unmount()
  })
  test('preflight failure keeps recovery visible after dismissal until verified success', async () => {
    mocks.ble.disconnect.mockRejectedValueOnce(new Error('Disconnection timeout.'))
    await firmware.install()
    expect(firmware.status.phase).toBe('error')
    expect(firmware.recovery).toBeUndefined()
    expect(firmware.showRecovery).toBe(true)
    await firmware.dismiss()
    expect(firmware.status.phase).toBe('idle')
    expect(firmware.showRecovery).toBe(true)
    const wrapper = shallowMount(DongleSettingsCard, { global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } } })
    expect(wrapper.text()).toContain('Dongle wiederherstellen')
    await firmware.install()
    mocks.ble.read.mockImplementation(async (_id, _service, characteristic) => characteristic === ConfigUUID
      ? encodeDongleConfig({ name: 'Test', keyGapMs: 30 }) : wire(2))
    nativeStatus = { ...nativeStatus, phase: 'transferred', updatedAt: nativeStatus.updatedAt + 1 }
    emit(nativeStatus)
    await flushPromises()
    expect(mocks.native.finish).toHaveBeenCalledWith({ jobId: 'job-1', verified: true })
    expect(firmware.showRecovery).toBe(false)
    expect(wrapper.text()).not.toContain('Dongle wiederherstellen')
    wrapper.unmount()
  })
  test('preflight failure without a saved update is forgotten after restart', async () => {
    mocks.ble.disconnect.mockRejectedValueOnce(new Error('Disconnection timeout.'))
    await firmware.install()
    await firmware.dismiss()
    expect(firmware.showRecovery).toBe(true)
    await firmware.dispose()
    setActivePinia(createPinia())
    firmware = useFirmwareStore()
    await firmware.initialize()
    expect(firmware.showRecovery).toBe(false)
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
