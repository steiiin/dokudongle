import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { DongleFirmware } from '@/plugins/dongle-firmware'
import { useDokuStore } from '@/store/doku'
import { ServiceUUID } from '@/types/dongle'
import { FirmwareUUID, type FirmwareManifest, type FirmwareUpdateStatus } from '@/types/firmware'
import { decodeFirmwareInfo, isCompatibleFirmware, parseFirmwareManifest, updateAvailable } from '@/utils/dongle-firmware'
import { withDongleTimeout } from '@/utils/dongle-config'

const CONFIRMATION_ERROR = 'Installation konnte nach dem Neustart nicht bestätigt werden. Bitte erneut verbinden oder den Dongle über USB wiederherstellen.'
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useFirmwareStore = defineStore('firmware', () => {
  const doku = useDokuStore()
  const manifest = ref<FirmwareManifest | null>(null)
  const manifestError = ref('')
  const status = ref<FirmwareUpdateStatus>({ phase: 'idle', updatedAt: 0 })
  const initialized = ref(false)
  const nativeError = ref('')
  const android = Capacitor.getPlatform() === 'android'
  const active = computed(() => ['preparing', 'transferring', 'restarting', 'transferred', 'verifying'].includes(status.value.phase))
  const available = computed(() => updateAvailable(doku.connection.firmware, manifest.value))
  const canInstall = computed(() => android && initialized.value && !nativeError.value && available.value
    && doku.isDongleConnected && doku.connection.hasDfu && doku.connection.firmwareStatus === 'ready'
    && !doku.connection.isUpdatingFirmware && !doku.connection.isSavingSettings
    && !doku.connection.isTransmitting && !doku.connection.isConnecting)
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
    const deviceId = completed.deviceId
    try {
      if (!deviceId || !completed.jobId || !completed.version) throw new Error(CONFIRMATION_ERROR)
      await withDongleTimeout(doku.initDongle(), 3000)
      doku.connection.device = { id: deviceId, name: completed.deviceName ?? 'DokuDongle' }
      while (Date.now() < deadline) {
        const remaining = () => {
          const ms = Math.min(3000, deadline - Date.now())
          if (ms <= 0) throw new Error(CONFIRMATION_ERROR)
          return ms
        }
        try {
          doku.dongleDisconnected(deviceId, doku.connection.session)
          await withDongleTimeout(BleClient.disconnect(deviceId), remaining())
          await doku.openDongleConnection(deviceId, remaining())
          const session = doku.connection.session
          const info = decodeFirmwareInfo(await withDongleTimeout(
            BleClient.read(deviceId, ServiceUUID, FirmwareUUID, { timeout: remaining() }), remaining(),
          ))
          if (doku.connection.session !== session || !doku.connection.isConnected) throw new Error(CONFIRMATION_ERROR)
          doku.connection.firmware = info
          doku.connection.firmwareStatus = isCompatibleFirmware(info) ? 'ready' : 'unsupported'
          verified = isCompatibleFirmware(info) && info.version === completed.version
          // A responsive device with the wrong version is a conclusive failure.
          break
        } catch {
          doku.dongleDisconnected(deviceId, doku.connection.session)
          await pause(Math.max(0, Math.min(500, deadline - Date.now())))
        }
      }
    } catch { /* Report a bounded verification failure below. */ }
    try {
      if (!completed.jobId) throw new Error(CONFIRMATION_ERROR)
      receive(await DongleFirmware.finish({ jobId: completed.jobId, verified }))
    } catch {
      status.value = { ...completed, phase: 'error', error: CONFIRMATION_ERROR }
    } finally {
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
          appListener = await App.addListener('appStateChange', ({ isActive }) => { if (isActive) void restore() })
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
    status.value = { phase: 'preparing', updatedAt: 0, deviceId: device.id, deviceName: device.name, version, progress: 0 }
    try {
      // Recheck the connected device immediately before transferring ownership.
      const session = doku.connection.session
      const info = decodeFirmwareInfo(await withDongleTimeout(BleClient.read(device.id, ServiceUUID, FirmwareUUID, { timeout: 3000 }), 3000))
      if (session !== doku.connection.session || !doku.connection.isConnected || !updateAvailable(info, manifest.value)) {
        throw new Error('Die Firmware-Version oder Verbindung hat sich geändert. Bitte erneut verbinden.')
      }
      await withDongleTimeout(BleClient.disconnect(device.id), 3000)
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
    status.value = { phase: 'idle', updatedAt: latestNativeTimestamp }
  }

  async function retry() {
    if (active.value) return
    const deviceId = status.value.deviceId
    const deviceName = status.value.deviceName
    await dismiss()
    if (!deviceId || status.value.phase !== 'idle' || doku.connection.isUpdatingFirmware) return
    doku.connection.isConnecting = true
    try {
      await doku.initDongle()
      doku.connection.device = { id: deviceId, name: deviceName ?? 'DokuDongle' }
      await withDongleTimeout(BleClient.disconnect(deviceId), 3000)
      await doku.openDongleConnection(deviceId)
      await doku.refreshDongleConfig()
      await doku.refreshDongleFirmware()
    } catch {
      doku.dongleDisconnected(deviceId, doku.connection.session)
      status.value = { phase: 'error', updatedAt: latestNativeTimestamp, deviceId, deviceName,
        error: 'Dongle nicht erreichbar. Bitte den Dongle am Computer über USB neu einrichten.' }
    } finally { doku.connection.isConnecting = false }
    // Installation remains an explicit button action after rediscovery.
  }

  async function dispose() {
    await nativeListener?.remove()
    await appListener?.remove()
    nativeListener = appListener = null
    initialization = null
  }
  return { manifest, manifestError, status, initialized, nativeError, android, active, available, canInstall,
    loadManifest, initialize, restore, install, dismiss, retry, dispose }
})
