import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { BleClient, type ScanResult } from '@capacitor-community/bluetooth-le'
import { DongleFirmware } from '@/plugins/dongle-firmware'
import { useDokuStore } from '@/store/doku'
import { ServiceUUID } from '@/types/dongle'
import { DfuUUID, FirmwareUUID, type FirmwareManifest, type FirmwareUpdateStatus, type FirmwareRecovery } from '@/types/firmware'
import { decodeFirmwareInfo, isCompatibleFirmware, parseFirmwareManifest, updateAvailable, matchesDfuAddress, offsetDfuAddress } from '@/utils/dongle-firmware'
import { withDongleTimeout } from '@/utils/dongle-config'
import { awaitBleOperation, disconnectDongle, discoverDongleServices, dongleConnectionTimeout, dongleTimeRemaining, DongleDeadlineError } from '@/utils/dongle-connection'

const CONFIRMATION_ERROR = 'Installation konnte nach dem Neustart nicht bestätigt werden. Bitte das Update erneut versuchen. Dongle angeschlossen lassen und Bluetooth einschalten.'
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useFirmwareStore = defineStore('firmware', () => {
  const doku = useDokuStore()
  const manifest = ref<FirmwareManifest | null>(null)
  const manifestError = ref('')
  const status = ref<FirmwareUpdateStatus>({ phase: 'idle', updatedAt: 0 })
  const initialized = ref(false)
  const nativeError = ref('')
  const android = Capacitor.getPlatform() === 'android'
  const recoveryDevices = ref<Array<{ deviceId: string; name: string }>>([])
  const manualRecovery = ref(false)
  const recovery = computed(() => status.value.recovery)
  const active = computed(() => ['searching', 'preparing', 'transferring', 'restarting', 'transferred', 'verifying'].includes(status.value.phase))
  const available = computed(() => updateAvailable(doku.connection.firmware, manifest.value))
  const canInstall = computed(() => android && initialized.value && !nativeError.value && available.value
    && doku.isDongleConnected && doku.connection.hasDfu && doku.connection.firmwareStatus === 'ready'
    && !doku.connection.isUpdatingFirmware && !doku.connection.isSavingSettings
    && !doku.connection.isTransmitting && !doku.connection.isConnecting)
  const canRecover = computed(() => android && initialized.value && !nativeError.value && !!manifest.value
    && !active.value && !doku.connection.isUpdatingFirmware && !doku.connection.isSavingSettings
    && !doku.connection.isTransmitting && !doku.connection.isConnecting)
  type Discovery = { cancelled: boolean; cancelScan?: () => void; select?: (deviceId: string) => void }
  let discovery: Discovery | null = null
  let verification: Promise<void> | null = null
  let initialization: Promise<void> | null = null
  let starting = false
  let nativeListener: PluginListenerHandle | null = null
  let appListener: PluginListenerHandle | null = null
  let latestNativeTimestamp = 0

  async function loadManifest() {
    manifestError.value = ''
    try {
      const response = await withDongleTimeout(fetch(`${import.meta.env.BASE_URL}firmware/manifest.json`, { cache: 'no-store' }), 5000)
      if (!response.ok) throw new Error('Firmware-Datei fehlt.')
      manifest.value = parseFirmwareManifest(await response.json())
    } catch {
      manifest.value = null
      manifestError.value = 'Die mitgelieferte Dongle-Firmware konnte nicht geladen werden.'
    }
  }

  function receive(next: FirmwareUpdateStatus) {
    if (discovery) return // Discovery owns the UI until it hands BLE to the native service.
    if (next.updatedAt < latestNativeTimestamp) return
    latestNativeTimestamp = next.updatedAt
    if (verification && next.jobId === status.value.jobId && next.phase === 'transferred') return
    status.value = next
    doku.connection.isUpdatingFirmware = active.value
    if (next.phase === 'transferred' && !verification) {
      verification = verify(next).finally(() => { verification = null })
    }
  }

  async function verify(completed: FirmwareUpdateStatus) {
    status.value = { ...completed, phase: 'verifying' }
    doku.connection.isUpdatingFirmware = true
    const deadline = Date.now() + 30000
    let verified = false
    let stage = 'Bluetooth initialisieren'
    let diagnostic = ''
    const recordError = (error: unknown) => {
      if (error instanceof DongleDeadlineError && diagnostic) return
      diagnostic = `${stage}: ${error instanceof Error ? error.message : String(error)}`
      console.error('Firmware verification failed', { jobId: completed.jobId, deviceId: completed.deviceId, diagnostic })
    }
    const deviceId = completed.deviceId
    try {
      if (!deviceId || !completed.jobId || !completed.version) throw new Error(CONFIRMATION_ERROR)
      await doku.initDongle()
      doku.connection.device = { id: deviceId, name: completed.deviceName ?? 'DokuDongle' }
      while (Date.now() < deadline) {
        try {
          stage = 'Verbindung bereinigen'
          doku.dongleDisconnected(deviceId, doku.connection.session)
          await disconnectDongle(deviceId, { deadline })
          stage = 'Dongle verbinden'
          await doku.openDongleConnection(deviceId, dongleTimeRemaining(deadline, dongleConnectionTimeout()))
          const session = doku.connection.session
          stage = 'Dienste aktualisieren'
          await discoverDongleServices(deviceId, deadline)
          stage = 'Firmware-Version lesen'
          const timeout = dongleTimeRemaining(deadline, 3000)
          const info = decodeFirmwareInfo(await awaitBleOperation(
            BleClient.read(deviceId, ServiceUUID, FirmwareUUID, { timeout }), timeout,
          ))
          if (doku.connection.session !== session || !doku.connection.isConnected) throw new Error(CONFIRMATION_ERROR)
          doku.connection.firmware = info
          doku.connection.firmwareStatus = isCompatibleFirmware(info) ? 'ready' : 'unsupported'
          verified = isCompatibleFirmware(info) && info.version === completed.version
          if (!verified) recordError(new Error(`Erwartet: ${completed.version}, empfangen: ${info.version}, Protokoll: ${info.protocolRevision}, Ziel: ${info.targetId}.`))
          // A responsive device with the wrong version is a conclusive failure.
          break
        } catch (error) {
          recordError(error)
          doku.dongleDisconnected(deviceId, doku.connection.session)
          if (error instanceof DongleDeadlineError) break
          const wait = Math.min(500, deadline - Date.now())
          if (wait > 0) await pause(wait)
        }
      }
    } catch (error) { recordError(error) }
    try {
      if (!completed.jobId) throw new Error(CONFIRMATION_ERROR)
      receive(await DongleFirmware.finish({ jobId: completed.jobId, verified }))
    } catch (error) {
      stage = 'Bestätigung speichern'
      recordError(error)
      status.value = { ...completed, phase: 'error', error: CONFIRMATION_ERROR }
    } finally {
      if (status.value.phase === 'error' && diagnostic) {
        status.value = { ...status.value, error: `${status.value.error ?? CONFIRMATION_ERROR} (${diagnostic})` }
      }
      doku.connection.isUpdatingFirmware = false
    }
    if (doku.connection.isConnected) {
      await doku.refreshDongleConfig()
      await doku.refreshDongleFirmware()
    }
  }

  async function restore() {
    if (!android || starting) return
    try {
      receive(await DongleFirmware.getStatus())
      nativeError.value = ''
    } catch {
      nativeError.value = 'Der Update-Status konnte nicht geladen werden. Bitte die App erneut öffnen.'
      // Ownership is uncertain; keep dongle operations locked until status can be read.
      doku.connection.isUpdatingFirmware = true
    }
  }

  async function initialize() {
    if (initialization) return initialization
    initialization = (async () => {
      if (android) {
        doku.connection.isUpdatingFirmware = true
        try {
          nativeListener = await DongleFirmware.addListener('status', receive)
          appListener = await App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) void restore()
            else cancelDiscovery()
          })
          await restore()
        } catch {
          nativeError.value = 'Der Dongle-Updater konnte nicht gestartet werden. Bitte die App erneut öffnen.'
        }
      }
      await loadManifest()
      initialized.value = true
    })()
    return initialization
  }

  async function install() {
    if (!canInstall.value || !manifest.value || !doku.connection.device) return
    const device = { ...doku.connection.device }
    const version = manifest.value.version
    starting = true
    doku.connection.isUpdatingFirmware = true
    status.value = { phase: 'preparing', updatedAt: latestNativeTimestamp, deviceId: device.id, deviceName: device.name, version, progress: 0, recovery: recovery.value }
    try {
      // Recheck the connected device immediately before transferring ownership.
      const session = doku.connection.session
      const info = decodeFirmwareInfo(await awaitBleOperation(BleClient.read(device.id, ServiceUUID, FirmwareUUID, { timeout: 3000 }), 3000))
      if (session !== doku.connection.session || !doku.connection.isConnected || !updateAvailable(info, manifest.value)) {
        throw new Error('Die Firmware-Version oder Verbindung hat sich geändert. Bitte erneut verbinden.')
      }
      await disconnectDongle(device.id, { strict: true })
      doku.dongleDisconnected(device.id, doku.connection.session)
      receive(await DongleFirmware.start({ deviceId: device.id, deviceName: device.name, version }))
    } catch (error) {
      // A native start failure can arrive after the service acquired ownership.
      try {
        const native = await DongleFirmware.getStatus()
        if (native.phase !== 'idle') { receive(native); return }
      } catch {
        nativeError.value = 'Update-Status unbekannt. Bitte die App erneut öffnen.'
        return
      }
      status.value = { ...status.value, phase: 'error', error: error instanceof Error ? error.message : 'Aktualisierung fehlgeschlagen.' }
      doku.connection.isUpdatingFirmware = false
    } finally { starting = false }
  }

  async function dismiss() {
    if (active.value) return
    if (status.value.jobId) {
      try { await DongleFirmware.dismiss({ jobId: status.value.jobId }) }
      catch { await restore(); return }
    }
    status.value = { phase: 'idle', updatedAt: latestNativeTimestamp, recovery: recovery.value }
  }

  function assertDiscovery(current: Discovery) {
    if (current.cancelled || discovery !== current) throw new Error('Suche abgebrochen. Das Update kann später erneut versucht werden.')
  }

  function cancelDiscovery() {
    if (!discovery) return
    discovery.cancelled = true
    discovery.cancelScan?.()
  }

  function selectRecoveryDevice(deviceId: string) {
    discovery?.select?.(deviceId)
  }

  async function scanForDfu(current: Discovery, target?: FirmwareRecovery): Promise<string> {
    let timer: ReturnType<typeof setTimeout> | undefined
    let settled = false
    let scanStarted = false
    let acceptingAdvertisements = true
    let stop: Promise<void> | undefined
    const stopScan = () => {
      if (!scanStarted) return Promise.resolve()
      return stop ??= BleClient.stopLEScan()
    }
    let resolveResult!: (address: string) => void
    let rejectResult!: (error: Error) => void
    const result = new Promise<string>((resolve, reject) => { resolveResult = resolve; rejectResult = reject })
    // Attach the rejection handler before awaiting the native scan startup.
    void result.catch(() => {})
    const finish = (address?: string, error?: Error) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (address) resolveResult(address)
      else rejectResult(error ?? new Error('Suche abgebrochen.'))
    }
    current.cancelScan = () => finish(undefined, new Error('Suche abgebrochen. Das Update kann später erneut versucht werden.'))
    current.select = address => {
      if (recoveryDevices.value.some(device => device.deviceId === address)) finish(address)
    }
    try {
      assertDiscovery(current)
      // Await startup before stopping, including cancellation during permission prompts.
      await BleClient.requestLEScan({ services: [DfuUUID], allowDuplicates: true }, (result: ScanResult) => {
        if (settled || !acceptingAdvertisements || current.cancelled || discovery !== current) return
        const address = result.device.deviceId.toUpperCase()
        if (target) {
          if (matchesDfuAddress(target.deviceId, address)) finish(address)
        } else if ((result.localName ?? result.device.name) === 'XIAO_DFU') {
          if (!recoveryDevices.value.some(device => device.deviceId === address)) {
            recoveryDevices.value.push({ deviceId: address, name: 'XIAO_DFU' })
          }
        }
      })
      scanStarted = true
      assertDiscovery(current)
      if (!settled) timer = setTimeout(() => {
        acceptingAdvertisements = false
        void stopScan().catch(error => finish(undefined, error))
        if (target || recoveryDevices.value.length === 0) {
          finish(undefined, new Error('Kein passender Dongle gefunden. Bluetooth einschalten, Dongle aus- und wieder einstecken und das Update erneut versuchen. Falls die drahtlose Wiederherstellung weiterhin scheitert, ist eine USB-Wiederherstellung möglich.'))
        }
      }, 15000)
      return await result
    } finally {
      if (timer) clearTimeout(timer)
      current.cancelScan = undefined
      current.select = undefined
      await stopScan()
    }
  }

  async function readApplication(current: Discovery, deviceId: string) {
    let connected = false
    let info: ReturnType<typeof decodeFirmwareInfo> | null = null
    try {
      const timeout = dongleConnectionTimeout()
      await awaitBleOperation(BleClient.connect(deviceId, () => {}, { timeout }), timeout)
      connected = true
      assertDiscovery(current)
      await discoverDongleServices(deviceId)
      assertDiscovery(current)
      info = decodeFirmwareInfo(await awaitBleOperation(
        BleClient.read(deviceId, ServiceUUID, FirmwareUUID, { timeout: 3000 }), 3000,
      ))
    } catch { /* A missing application may still be recoverable through DFU. */ }
    await disconnectDongle(deviceId, { strict: connected })
    assertDiscovery(current)
    return info
  }

  async function validateDfu(current: Discovery, deviceId: string) {
    try {
      await awaitBleOperation(BleClient.connect(deviceId, () => {}, { timeout: 3000 }), 3000)
      assertDiscovery(current)
      // The application and bootloader may share an address; discard cached GATT services.
      await discoverDongleServices(deviceId)
      assertDiscovery(current)
      const services = await withDongleTimeout(BleClient.getServices(deviceId), 3000)
      const dfu = services.find(service => service.uuid.toLowerCase() === DfuUUID)
      const hasCharacteristic = (uuid: string) => dfu?.characteristics.some(characteristic => characteristic.uuid.toLowerCase() === uuid)
      if (!hasCharacteristic('00001531-1212-efde-1523-785feabcd123')
        || !hasCharacteristic('00001532-1212-efde-1523-785feabcd123')
        || services.some(service => service.uuid.toLowerCase() === ServiceUUID)) {
        throw new Error('Dieser Dongle bietet keinen unterstützten DFU-Bootloader an.')
      }
    } finally {
      await disconnectDongle(deviceId, { strict: true })
    }
    assertDiscovery(current)
  }

  async function recover(manual = false) {
    if (!canRecover.value || starting || !manifest.value) return
    const target = manual ? undefined : recovery.value
    if (!manual && !target) {
      // A failure before native ownership has not put the dongle into DFU.
      if (canInstall.value) await install()
      else await recover(true)
      return
    }
    const current: Discovery = { cancelled: false }
    const version = manifest.value.version
    const previousRecovery = recovery.value
    discovery = current
    starting = true
    manualRecovery.value = manual
    recoveryDevices.value = []
    status.value = { phase: 'searching', updatedAt: latestNativeTimestamp, recovery: previousRecovery }
    doku.connection.isUpdatingFirmware = true
    let handedOff = false
    try {
      if (target && version < target.version) throw new Error('Diese App enthält eine ältere Firmware als das unterbrochene Update. Bitte zuerst die App aktualisieren.')
      await doku.initDongle()
      assertDiscovery(current)
      const connected = doku.connection.device
      if (connected) {
        await disconnectDongle(connected.id, { strict: doku.connection.isConnected })
        doku.dongleDisconnected(connected.id, doku.connection.session)
      }
      assertDiscovery(current)
      let dfuDeviceId: string | undefined
      let deviceId = target?.deviceId
      const deviceName = target?.deviceName ?? 'DokuDongle'
      if (target) {
        const info = await readApplication(current, target.deviceId)
        assertDiscovery(current)
        if (info) {
          if (!isCompatibleFirmware(info)) throw new Error('Die Firmware dieses Dongles ist nicht kompatibel.')
          if (info.version === target.version) {
            const confirmed = await DongleFirmware.clearRecovery({ jobId: target.jobId, version: info.version })
            discovery = null
            receive(confirmed)
            doku.connection.isUpdatingFirmware = true
            doku.connection.device = { id: target.deviceId, name: target.deviceName }
            try { await doku.openDongleConnection(target.deviceId) }
            catch { doku.dongleDisconnected(target.deviceId, doku.connection.session) }
            return
          }
          if (info.version >= version) throw new Error('Der Dongle enthält bereits eine andere aktuelle oder neuere Firmware. Es wird keine ältere Firmware installiert.')
        } else {
          dfuDeviceId = await scanForDfu(current, target)
        }
      } else {
        dfuDeviceId = await scanForDfu(current)
        deviceId = offsetDfuAddress(dfuDeviceId, -1)
      }
      assertDiscovery(current)
      if (dfuDeviceId) await validateDfu(current, dfuDeviceId)
      assertDiscovery(current)
      if (!deviceId) throw new Error('Kein Update-Ziel vorhanden.')
      // Discovery is over. The native service owns BLE from this point onward.
      discovery = null
      manualRecovery.value = false
      status.value = { ...status.value, phase: 'preparing', deviceId, deviceName, version, dfuDeviceId }
      handedOff = true
      receive(await DongleFirmware.start({ deviceId, deviceName, version, ...(dfuDeviceId ? { dfuDeviceId } : {}) }))
    } catch (error) {
      if (handedOff) {
        try {
          const native = await DongleFirmware.getStatus()
          if (['preparing', 'transferring', 'restarting', 'transferred'].includes(native.phase)) { receive(native); return }
          receive(native)
        } catch {
          nativeError.value = 'Update-Status unbekannt. Bitte die App erneut öffnen.'
          return
        }
      }
      status.value = { ...status.value, phase: 'error', error: error instanceof Error ? error.message : 'Wiederherstellung fehlgeschlagen. Bitte erneut versuchen.' }
    } finally {
      if (discovery === current) discovery = null
      starting = false
      manualRecovery.value = false
      recoveryDevices.value = []
      doku.connection.isUpdatingFirmware = active.value || !!nativeError.value
      if (status.value.phase === 'done' && doku.connection.isConnected) {
        await doku.refreshDongleConfig()
        await doku.refreshDongleFirmware()
      }
    }
    // Version confirmation after a transfer uses verify(), including settings refresh.
  }

  async function retry() { await recover() }
  async function recoverManually() { await recover(true) }

  async function dispose() {
    cancelDiscovery()
    await nativeListener?.remove()
    await appListener?.remove()
    nativeListener = appListener = null
    initialization = null
  }
  return { manifest, manifestError, status, initialized, nativeError, android, active, available, canInstall,
    recovery, recoveryDevices, manualRecovery, canRecover, cancelDiscovery, selectRecoveryDevice, recoverManually,
    loadManifest, initialize, restore, install, dismiss, retry, dispose }
})
