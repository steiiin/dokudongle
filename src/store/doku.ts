import { FirmwareUUID, DfuUUID } from '@/types/firmware'
import { decodeFirmwareInfo, isCompatibleFirmware } from '@/utils/dongle-firmware'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { Device as CapacitorDevice } from '@capacitor/device'
import { defineStore } from 'pinia'

import { toRaw, type UnwrapRef } from 'vue'
import { resetQuickies } from '@/data/quickies'
import {
  DOKU_SCHEMA_VERSION,
  ProtocolAuditEntry,
  type ProtocolHistoryEntry,
  type PersistedDokuState,
  appendProtocolAuditEntry,
  loadDokuState,
  loadProtocolAuditEntries,
  loadTemporaryProtocolState,
  removeTemporaryProtocolState,
  saveDokuState,
} from '@/store/persistence'
import { stripNotSupported, textToHidEvents } from '@/utils/keymaps/keymap-german'
import { AuditExport } from '@/plugins/audit-export'
import { decodeDongleConfig, encodeDongleConfig, withDongleTimeout } from '@/utils/dongle-config'
import { awaitBleOperation, disconnectDongle, dongleConnectionTimeout } from '@/utils/dongle-connection'
import { Device, DeviceConnection, DongleConfig, DONGLE_NAME_PREFIX, SendAckUUID, SendTextUUID, ServiceUUID, ConfigUUID } from '@/types/dongle'
import { Protocol, ProtocolContext, ProtocolCourse, ProtocolFlavors, ProtocolVerbosity, resetProtocol } from '@/types/protocol'
import { EnhanceableText } from '@/types/protocol/input'
import { SampleContactsItem, SampleMedicationItem } from '@/types/protocol/sample'

import { breakDoku, multiline, placeholder } from '@/utils/text'
import { textIf } from '@/utils/filter'

// ############################################################################

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hydrateLikeTemplate<T>(template: T, input: unknown): T {
  if (input === undefined) return template

  if (Array.isArray(template)) {
    if (!Array.isArray(input)) throw new Error('Invalid protocol array')
    return toPersistable(input) as T
  }

  if (isRecord(template)) {
    if (!isRecord(input)) throw new Error('Invalid protocol object')

    for (const key of Object.keys(template)) {
      const typedKey = key as keyof T
      ;(template as Record<string, unknown>)[key] = hydrateLikeTemplate(
        template[typedKey],
        input[key],
      ) as T[keyof T]
    }

    return template
  }

  if (template !== null && typeof input !== typeof template) throw new Error('Invalid protocol value')
  return input as T
}

function hydrateProtocol(input: unknown): Protocol | null {
  try {
    return hydrateProtocolUnchecked(input)
  } catch {
    return null
  }
}

function hydrateProtocolUnchecked(input: unknown): Protocol | null {
  if (!isRecord(input)) {
    return null
  }

  const legacyCourse = input.course
  // Normalize legacy psychiatric fields before hydrating the class instances.
  let normalizedInput = input
  if (isRecord(input.xabcDe)) {
    const disability = input.xabcDe
    const psych = isRecord(disability.psych) ? { ...disability.psych } : {}
    const legacyPsychFields = {
      rass: 'psychRass',
      disorder: 'psychDisorder',
      hallucinations: 'psychHallucinations',
      delusions: 'psychDelusions',
      dementia: 'psychDementia',
      perseveration: 'psychPerseveration',
      behavioralChange: 'psychBehavioralChange',
      baseline: 'psychBaseline',
    } as const

    for (const [key, legacyKey] of Object.entries(legacyPsychFields)) {
      if (psych[key] === undefined) {
        psych[key] = disability[legacyKey]
      }
    }
    normalizedInput = { ...input, xabcDe: { ...disability, psych } }
  }
  const hydratedProtocol = hydrateLikeTemplate(resetProtocol(), normalizedInput)

  if (legacyCourse === 1 || legacyCourse === 2) {
    hydratedProtocol.course = ProtocolCourse.TRANSPORT
    hydratedProtocol.flavors.verlegung = legacyCourse === 1
    hydratedProtocol.flavors.einweisung = legacyCourse === 2
  }

  hydratedProtocol.sampler.medication.PlanMedication = hydratedProtocol.sampler.medication.PlanMedication
    .map((item) => hydrateLikeTemplate(new SampleMedicationItem(), item))

  hydratedProtocol.sampler.contacts.contacts = hydratedProtocol.sampler.contacts.contacts
    .map((contact) => hydrateLikeTemplate(new SampleContactsItem(), contact))

  return hydratedProtocol
}

function toPersistable<T>(value: T): T {
  const rawValue = toRaw(value)

  if (Array.isArray(rawValue)) {
    return rawValue.map((entry) => toPersistable(entry)) as T
  }

  if (isRecord(rawValue)) {
    const plainObject: Record<string, unknown> = {}

    for (const key of Object.keys(rawValue)) {
      plainObject[key] = toPersistable(rawValue[key])
    }

    return plainObject as T
  }

  return rawValue
}


// Read through Vue proxies so the getter tracks nested changes. Only text values,
// not the editor's transient state, determine whether a protocol contains data.
function protocolValues(value: unknown): unknown {
  if (value instanceof EnhanceableText) return value.value
  if (Array.isArray(value)) return value.map(protocolValues)
  if (isRecord(value)) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, protocolValues(value[key])]))
  }
  return value
}

// Protocol classes import store-dependent text helpers; initialize after module loading.
let emptyProtocolValues: string | undefined
function containsProtocolData(protocol: unknown): boolean {
  emptyProtocolValues ??= JSON.stringify(protocolValues(resetProtocol()))
  return JSON.stringify(protocolValues(protocol)) !== emptyProtocolValues
}

function clearProtocolEditingState(value: unknown): void {
  if (value instanceof EnhanceableText) {
    value.clearHistory()
    value.isEnhancing = false
  } else if (Array.isArray(value)) {
    value.forEach(clearProtocolEditingState)
  } else if (isRecord(value)) {
    Object.values(value).forEach(clearProtocolEditingState)
  }
}

function hydrateHistory(input: unknown): ProtocolHistoryEntry[] {
  if (!Array.isArray(input)) return []
  const ids = new Set<string>()
  return input.flatMap((entry): ProtocolHistoryEntry[] => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)
      || typeof entry.archivedAt !== 'string' || Number.isNaN(Date.parse(entry.archivedAt))) return []
    const doku = hydrateProtocol(entry.doku)
    if (!doku || !containsProtocolData(doku)) return []
    clearProtocolEditingState(doku)
    ids.add(entry.id)
    return [{ id: entry.id, archivedAt: entry.archivedAt, doku }]
  }).sort((a, b) => Date.parse(b.archivedAt) - Date.parse(a.archivedAt)).slice(0, 3)
}

function archiveProtocol(protocol: UnwrapRef<Protocol>, history: ProtocolHistoryEntry[]): ProtocolHistoryEntry[] {
  if (!containsProtocolData(protocol)) return [...history]
  return [{
    id: crypto.randomUUID(),
    archivedAt: new Date().toISOString(),
    doku: toPersistable(protocol),
  }, ...history].slice(0, 3)
}

// Queue operations outside reactive state. Persist reads the current state when
// its turn begins, so a queued autosave cannot overwrite a completed restore.
const storageQueues = new WeakMap<object, Promise<unknown>>()
function serializeStorage<T>(store: object, operation: () => Promise<T>): Promise<T> {
  const pending = storageQueues.get(store) ?? Promise.resolve()
  const result = pending.then(operation)
  storageQueues.set(store, result.catch(() => undefined))
  return result
}

function persistedProtocolState(state: {
  doku: UnwrapRef<Protocol>
  protocolHistory: ProtocolHistoryEntry[]
  lastProtocolResetAt: string
  lastProtocolSentAt: string | null
}): PersistedDokuState {
  return {
    schemaVersion: DOKU_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    lastProtocolResetAt: state.lastProtocolResetAt,
    lastProtocolSentAt: state.lastProtocolSentAt ?? undefined,
    doku: toPersistable(state.doku),
    protocolHistory: toPersistable(state.protocolHistory),
  }
}


function collectFreeformBlocks(value: unknown, prefix = '', result: Record<string, string> = {}): Record<string, string> {
  if (value instanceof EnhanceableText) {
    if (prefix) {
      result[prefix] = value.value
    }
    return result
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectFreeformBlocks(entry, `${prefix}${prefix ? '.' : ''}${index}`, result))
    return result
  }

  if (isRecord(value)) {
    for (const key of Object.keys(value)) {
      collectFreeformBlocks(value[key], `${prefix}${prefix ? '.' : ''}${key}`, result)
    }
  }

  return result
}

function createProtocolAuditEntry(protocol: unknown, protocolText: string): ProtocolAuditEntry {
  return {
    schemaVersion: DOKU_SCHEMA_VERSION,
    resetAt: new Date().toISOString(),
    protocolText,
    ...collectFreeformBlocks(protocol),
  }
}

function resetProtocolState(): Protocol {
  resetQuickies()
  return resetProtocol()
}

const AUTO_RESET_THRESHOLD_MS = 60 * 60 * 1000

export type AutoProtocolResetAction = 'none' | 'reset'

const LEGACY_ANDROID_MAX_SDK = 30

function connectionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('permission denied')) {
    return 'Die Bluetooth-Berechtigung fehlt. Bitte erlaube DokuDongle in den Android-Einstellungen den Zugriff auf Geräte in der Nähe.'
  }

  if (normalizedMessage.includes('location services disabled')) {
    return 'Bitte aktiviere die Android-Standortdienste und starte die Dongle-Suche anschließend erneut.'
  }

  if (normalizedMessage.includes('requestenable failed')) {
    return 'Bluetooth wurde nicht aktiviert. Bitte aktiviere Bluetooth und starte die Suche erneut.'
  }

  if (normalizedMessage.includes('no device found')) {
    return 'Kein DokuDongle gefunden. Prüfe, ob der Dongle eingeschaltet und in Reichweite ist.'
  }

  if (normalizedMessage.includes('ble is not supported') || normalizedMessage.includes('ble is not available')) {
    return 'Bluetooth Low Energy ist auf diesem Gerät nicht verfügbar.'
  }

  if (normalizedMessage.includes('timeout') || normalizedMessage.includes('zeitüberschreitung')) {
    return `Die Dongle-Verbindung hat zu lange gedauert. Bitte erneut verbinden. (${message})`
  }

  return 'Die Dongle-Suche ist fehlgeschlagen. Prüfe Bluetooth und die App-Berechtigung „Geräte in der Nähe“ und versuche es erneut.'
}

// ############################################################################

export const useDokuStore = defineStore('doku', {
  state: () => ({

    initialized: false,
    connection: {
      device: null,
      isConnecting: false,
      isConnected: false,
      lastError: null,
      failedConnectionAttempts: 0,
      isTransmitting: false,
      isSavingSettings: false,
      isUpdatingFirmware: false,
      firmware: null,
      firmwareStatus: 'unavailable',
      hasDfu: false,
      config: null,
      configStatus: 'unavailable',
      session: 0,
      transmissionCurrent: 0, transmissionLength: 0,
      transmissionAbortController: null,
    } as DeviceConnection,

    doku: resetProtocolState(),
    protocolHistory: [] as ProtocolHistoryEntry[],
    isProtocolChanging: false,
    lastProtocolResetAt: new Date().toISOString(),
    lastProtocolSentAt: null as string | null,

  }),
  actions: {

    // dongle
    async initDongle() {

      if (Capacitor.getPlatform() === 'android') {
        const deviceInfo = await CapacitorDevice.getInfo()

        if ((deviceInfo.androidSDKVersion ?? Number.MAX_SAFE_INTEGER) <= LEGACY_ANDROID_MAX_SDK) {
          const isLocationEnabled = await BleClient.isLocationEnabled()
          if (!isLocationEnabled) {
            await BleClient.openLocationSettings()
            throw new Error('Location services disabled.')
          }
        }
      }

      if (!this.initialized) {

        await BleClient.initialize({ androidNeverForLocation: true })
        BleClient.setDisplayStrings({
          scanning: 'Suche DokuDongle ...',
          cancel: 'Abbrechen',
          availableDevices: 'Gefundene Dongles',
          noDeviceFound: 'Kein Dongle gefunden',
        })
        this.initialized = true

      }

      if (Capacitor.getPlatform() === 'android') {
        const isBleEnabled = await BleClient.isEnabled()
        if (!isBleEnabled) {
          await BleClient.requestEnable()
        }
      }

    },

    dongleDisconnected(deviceId: string, session: number) {
      if (this.connection.device?.id !== deviceId || this.connection.session !== session) return
      ++this.connection.session
      this.connection.isConnected = false
      this.connection.config = null
      this.connection.configStatus = 'unavailable'
      this.connection.firmware = null
      this.connection.firmwareStatus = 'unavailable'
      this.connection.hasDfu = false
      void this.cancelSend()
    },

    async openDongleConnection(deviceId: string, timeout = dongleConnectionTimeout()) {
      const session = ++this.connection.session
      await awaitBleOperation(BleClient.connect(
        deviceId,
        () => this.dongleDisconnected(deviceId, session),
        { timeout },
      ), timeout)
      if (this.connection.session !== session || this.connection.device?.id !== deviceId) {
        throw new Error('Dongle-Verbindung wurde unterbrochen.')
      }
      this.connection.isConnected = true
      this.connection.failedConnectionAttempts = 0
    },

    async refreshDongleConfig() {
      const deviceId = this.connection.device?.id
      const session = this.connection.session
      if (!deviceId || !this.connection.isConnected || this.connection.isSavingSettings || this.connection.isUpdatingFirmware) return
      this.connection.config = null
      this.connection.configStatus = 'loading'
      const isCurrent = () => this.connection.device?.id === deviceId
        && this.connection.session === session && this.connection.isConnected
      try {
        const services = await withDongleTimeout(BleClient.getServices(deviceId), 3000)
        if (!isCurrent()) return
        const characteristic = services.find(service => service.uuid.toLowerCase() === ServiceUUID)
          ?.characteristics.find(characteristic => characteristic.uuid.toLowerCase() === ConfigUUID)
        if (!characteristic?.properties.read || !characteristic.properties.write) {
          this.connection.configStatus = 'unsupported'
          return
        }
        const config = decodeDongleConfig(await withDongleTimeout(
          BleClient.read(deviceId, ServiceUUID, ConfigUUID, { timeout: 3000 }), 3000,
        ))
        if (!isCurrent()) return
        this.connection.config = config
        this.connection.configStatus = 'ready'
        this.connection.device!.name = DONGLE_NAME_PREFIX + config.name
      } catch {
        if (isCurrent()) this.connection.configStatus = 'error'
      }
    },

    async refreshDongleFirmware() {
      const deviceId = this.connection.device?.id
      const session = this.connection.session
      if (!deviceId || !this.connection.isConnected || this.connection.isUpdatingFirmware) return
      this.connection.firmware = null
      this.connection.hasDfu = false
      this.connection.firmwareStatus = 'loading'
      const current = () => this.connection.device?.id === deviceId && this.connection.session === session && this.connection.isConnected
      try {
        const services = await withDongleTimeout(BleClient.getServices(deviceId), 3000)
        if (!current()) return
        this.connection.hasDfu = services.some(service => service.uuid.toLowerCase() === DfuUUID)
        const characteristic = services.find(service => service.uuid.toLowerCase() === ServiceUUID)
          ?.characteristics.find(characteristic => characteristic.uuid.toLowerCase() === FirmwareUUID)
        if (!characteristic?.properties.read) {
          this.connection.firmwareStatus = 'unsupported'
          return
        }
        const info = decodeFirmwareInfo(await withDongleTimeout(BleClient.read(deviceId, ServiceUUID, FirmwareUUID, { timeout: 3000 }), 3000))
        if (!current()) return
        this.connection.firmware = info
        this.connection.firmwareStatus = isCompatibleFirmware(info) ? 'ready' : 'unsupported'
      } catch {
        if (current()) this.connection.firmwareStatus = 'error'
      }
    },

    async connectDongle() {
      if (this.connection.isUpdatingFirmware || this.connection.isConnecting || this.connection.isSavingSettings || this.connection.isTransmitting) return
      this.connection.isConnecting = true
      this.connection.lastError = null
      let connected = false
      try {
        await this.initDongle()
        await this.checkConnection()
        if (this.connection.isConnected) {
          connected = true
          this.connection.failedConnectionAttempts = 0
          if (!this.connection.config) await this.refreshDongleConfig()
          await this.refreshDongleFirmware()
          return
        }

        const device = await BleClient.requestDevice({
          namePrefix: 'DokuDongle',
          optionalServices: [ ServiceUUID, DfuUUID ],
        })
        ++this.connection.session
        this.connection.config = null
        this.connection.configStatus = 'unavailable'
        this.connection.firmware = null
        this.connection.firmwareStatus = 'unavailable'
        this.connection.hasDfu = false
        this.connection.device = {
          id: device.deviceId,
          name: device.name ?? 'Unbekannt',
        } as Device

        await disconnectDongle(device.deviceId)
        await this.openDongleConnection(device.deviceId)
        connected = true
        await this.refreshDongleConfig()
        await this.refreshDongleFirmware()
      } catch (e) {
        if (!connected) ++this.connection.failedConnectionAttempts
        this.dongleDisconnected(this.connection.device?.id ?? '', this.connection.session)
        this.connection.isConnected = false
        this.connection.config = null
        this.connection.configStatus = 'unavailable'
        this.connection.firmware = null
        this.connection.firmwareStatus = 'unavailable'
        this.connection.hasDfu = false
        this.connection.lastError = connectionErrorMessage(e)
        console.error('could not connect to dongle', e)
      } finally {
        this.connection.isConnecting = false
      }
    },

    async updateDongleConfig(config: DongleConfig): Promise<boolean> {
      if (!this.isDongleConnected || !this.connection.config || this.connection.isSavingSettings
        || this.connection.isTransmitting || this.connection.isUpdatingFirmware) return false
      const requested = { ...config }
      const payload = encodeDongleConfig(requested)
      const deviceId = this.connection.device!.id
      // Lock before the first await, including programmatic callers.
      this.connection.isSavingSettings = true
      this.connection.lastError = null
      try {
        await withDongleTimeout(BleClient.write(deviceId, ServiceUUID, ConfigUUID, payload, { timeout: 3000 }), 3000)
        await new Promise(resolve => setTimeout(resolve, 2000))

        const deadline = Date.now() + 15000
        while (Date.now() < deadline) {
          const attemptDeadline = Capacitor.getPlatform() === 'android' ? deadline : Math.min(deadline, Date.now() + 3000)
          const remaining = () => {
            const timeout = Math.min(3000, attemptDeadline - Date.now())
            if (timeout <= 0) throw new Error('Zeitüberschreitung beim Wiederverbinden.')
            return timeout
          }
          try {
            this.dongleDisconnected(deviceId, this.connection.session)
            await disconnectDongle(deviceId, { deadline: attemptDeadline })
            await this.openDongleConnection(deviceId, remaining())
            const session = this.connection.session
            const saved = decodeDongleConfig(await awaitBleOperation(
              BleClient.read(deviceId, ServiceUUID, ConfigUUID, { timeout: remaining() }), remaining(),
            ))
            if (session !== this.connection.session || !this.connection.isConnected) {
              throw new Error('Dongle-Verbindung wurde unterbrochen.')
            }
            this.connection.config = saved
            this.connection.configStatus = 'ready'
            this.connection.device!.name = DONGLE_NAME_PREFIX + saved.name
            await this.refreshDongleFirmware()
            return saved.name === requested.name && saved.keyGapMs === requested.keyGapMs
          } catch {
            this.dongleDisconnected(deviceId, this.connection.session)
            const pause = Math.min(500, deadline - Date.now())
            if (pause > 0) await new Promise(resolve => setTimeout(resolve, pause))
          }
        }
        throw new Error('Die gespeicherten Dongle-Einstellungen konnten nach dem Neustart nicht bestätigt werden.')
      } catch (error) {
        this.connection.lastError = error instanceof Error ? error.message : 'Dongle-Einstellungen konnten nicht gespeichert werden.'
        return false
      } finally {
        this.connection.isSavingSettings = false
      }
    },

    async checkConnection() {
      if (this.connection.isUpdatingFirmware) return
      const deviceId = this.connection.device?.id
      const session = this.connection.session
      try {
        await this.initDongle()
        const connected = await BleClient.getConnectedDevices([ ServiceUUID ])
        let isConnected = connected.some(device => device.deviceId === deviceId)
        if (isConnected && deviceId && Capacitor.getPlatform() === 'android') {
          // Android reports system-wide links, including a link whose local
          // GATT client was closed on timeout. Only adopt a usable app client.
          try { await BleClient.getServices(deviceId) }
          catch { isConnected = false }
        }
        if (this.connection.session !== session || this.connection.device?.id !== deviceId) return
        this.connection.isConnected = isConnected
        if (isConnected) this.connection.failedConnectionAttempts = 0
        if (!this.connection.isConnected) {
          this.connection.config = null
          this.connection.configStatus = 'unavailable'
          this.connection.firmware = null
          this.connection.firmwareStatus = 'unavailable'
          this.connection.hasDfu = false
        }
      } catch (e) {
        console.warn('Bluetooth not available', e)
      }
    },

    // protocol
    async newProtocol() {
      if (this.isProtocolChanging) return
      this.isProtocolChanging = true
      try {
        await serializeStorage(this, async () => {
          const next = {
            doku: resetProtocol(),
            protocolHistory: archiveProtocol(this.doku, this.protocolHistory),
            lastProtocolResetAt: new Date().toISOString(),
            lastProtocolSentAt: null,
          }
          await appendProtocolAuditEntry(createProtocolAuditEntry(this.doku, this.generatedProtocol))
          await saveDokuState(persistedProtocolState(next))
          resetQuickies()
          this.$patch(state => Object.assign(state, next))
        })
      } finally {
        this.isProtocolChanging = false
      }
    },
    async restoreProtocolFromHistory(id: string): Promise<boolean> {
      if (this.isProtocolChanging) return false
      this.isProtocolChanging = true
      try {
        return await serializeStorage(this, async () => {
          const entry = this.protocolHistory.find(entry => entry.id === id)
          const doku = entry && hydrateProtocol(toPersistable(entry.doku))
          if (!doku) return false
          clearProtocolEditingState(doku)
          const next = {
            doku,
            protocolHistory: archiveProtocol(this.doku, this.protocolHistory),
            lastProtocolResetAt: new Date().toISOString(),
            lastProtocolSentAt: null,
          }
          await saveDokuState(persistedProtocolState(next))
          resetQuickies()
          this.$patch(state => Object.assign(state, next))
          return true
        })
      } finally {
        this.isProtocolChanging = false
      }
    },
    setFlavor(key: keyof ProtocolFlavors, enabled: boolean) {
      this.doku.flavors[key] = enabled

      if (!enabled) {
        return
      }

      if (key === 'no_emergency_call' || key === 'verlegung' || key === 'einweisung') {
        this.doku.flavors.no_emergency_call = key === 'no_emergency_call'
        this.doku.flavors.verlegung = key === 'verlegung'
        this.doku.flavors.einweisung = key === 'einweisung'
      }

      if (key !== 'no_emergency_call') {
        return
      }

      this.doku.flavors.trauma = false
      this.doku.flavors.non_verbal = false
      this.doku.flavors.reanimation = false

      const emptyProtocol = resetProtocol()
      this.doku.Xabcde = emptyProtocol.Xabcde
      this.doku.xAbcde = emptyProtocol.xAbcde
      this.doku.xaBcde = emptyProtocol.xaBcde
      this.doku.xabCde = emptyProtocol.xabCde
      this.doku.xabcDe = emptyProtocol.xabcDe
      this.doku.xabcdE = emptyProtocol.xabcdE
      this.doku.sampler.symptoms = emptyProtocol.sampler.symptoms
      this.doku.saamed = emptyProtocol.saamed
      this.doku.redflags = emptyProtocol.redflags
    },
    async downloadProtocolAuditJsonl() {
      const entries = await loadProtocolAuditEntries()
      const jsonl = entries.map(entry => JSON.stringify(entry)).join('\n')
      const content = jsonl ? `${jsonl}\n` : ''
      const fileName = `dokudongle-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`

      if (Capacitor.getPlatform() === 'android') {
        await AuditExport.save({ content, fileName })
        return
      }

      const blob = new Blob([content], { type: 'application/x-ndjson;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
    async markProtocolSent(referenceTime: number = Date.now()) {
      const protocol = this.doku
      await serializeStorage(this, async () => {
        if (this.doku !== protocol) return
        const lastProtocolSentAt = new Date(referenceTime).toISOString()
        await saveDokuState(persistedProtocolState({ ...this.$state, lastProtocolSentAt }))
        this.lastProtocolSentAt = lastProtocolSentAt
      })
    },
    wasCurrentProtocolSent(): boolean {
      if (!this.lastProtocolSentAt) return false

      const lastResetAtMs = Date.parse(this.lastProtocolResetAt)
      const lastSentAtMs = Date.parse(this.lastProtocolSentAt)
      return !Number.isNaN(lastResetAtMs)
        && !Number.isNaN(lastSentAtMs)
        && lastSentAtMs >= lastResetAtMs
    },
    async autoResetProtocol() {
      await this.newProtocol()
    },
    async hydrateFromStorage() {
      await serializeStorage(this, async () => {
        const persistedState = await loadDokuState()
        const compatible = persistedState?.schemaVersion === DOKU_SCHEMA_VERSION
        const doku = compatible ? hydrateProtocol(persistedState.doku) : null
        let protocolHistory = compatible ? hydrateHistory(persistedState.protocolHistory) : []
        const temporary = await loadTemporaryProtocolState()
        if (temporary?.schemaVersion === DOKU_SCHEMA_VERSION) {
          const legacy = hydrateProtocol(temporary.doku)
          // Deterministic identity makes migration safe if cleanup was interrupted.
          const id = `legacy-temporary:${temporary.savedAt}`
          if (legacy && containsProtocolData(legacy) && !protocolHistory.some(entry => entry.id === id)) {
            protocolHistory = hydrateHistory([
              ...protocolHistory,
              { id, archivedAt: temporary.savedAt, doku: legacy },
            ])
          }
        }
        const next = {
          doku: doku ?? resetProtocol(),
          protocolHistory,
          lastProtocolResetAt: doku
            ? persistedState!.lastProtocolResetAt ?? persistedState!.updatedAt ?? new Date().toISOString()
            : new Date().toISOString(),
          lastProtocolSentAt: doku ? persistedState!.lastProtocolSentAt ?? null : null,
        }
        if (!next.lastProtocolSentAt || Number.isNaN(Date.parse(next.lastProtocolResetAt))
          || !(Date.parse(next.lastProtocolSentAt) >= Date.parse(next.lastProtocolResetAt))) {
          next.lastProtocolSentAt = null
        }
        clearProtocolEditingState(next.doku)
        await saveDokuState(persistedProtocolState(next))
        resetQuickies()
        this.$patch(state => Object.assign(state, next))
        if (temporary) await removeTemporaryProtocolState()
      })
    },
    getAutoProtocolResetAction(referenceTime: number = Date.now()): AutoProtocolResetAction {
      const lastResetAtMs = Date.parse(this.lastProtocolResetAt)
      if (Number.isNaN(lastResetAtMs)) {
        return 'reset'
      }

      const protocolAgeMs = referenceTime - lastResetAtMs
      if (protocolAgeMs >= AUTO_RESET_THRESHOLD_MS) {
        return 'reset'
      }
      return 'none'
    },
    async persistToStorage() {
      await serializeStorage(this, () => saveDokuState(persistedProtocolState(this)))
    },
    async sendProtocol() {
      if (this.connection.isSavingSettings || this.connection.isConnecting || this.connection.isTransmitting || this.connection.isUpdatingFirmware) return false
      this.connection.isTransmitting = true

      const protocolText = this.generatedProtocol

      console.log('Protokoll gesendet:')
      console.log(stripNotSupported(protocolText))
      console.log(stripNotSupported(protocolText))

      const controller = new AbortController()
      this.connection.transmissionAbortController = controller
      const signal = controller.signal

      try
      {

        // cancel if not connected
        await this.checkConnection()
        if (!this.isDongleConnected || signal?.aborted) { return false }
        this.connection.isTransmitting = true

        // set transmission info
        this.connection.transmissionLength = protocolText.length
        this.connection.transmissionCurrent = 0
        const abortError = new Error('Send Cancelled')
        abortError.name = 'AbortError'
        const throwIfAborted = () => {
          if (signal?.aborted) { throw abortError }
        }

        let notificationsStarted = false
        try
        {

          // register acknowledge system
          let resolveAck: (() => void) | null = null
          const waitForAck = async (ackPromise: Promise<void>) => {
            if (!signal) {
              await ackPromise
              return }
            if (signal.aborted) { throw abortError }

            await new Promise<void>((resolve, reject) => {
              const onAbort = () => {
                signal.removeEventListener('abort', onAbort)
                reject(abortError)
              }
              ackPromise.then(() => {
                signal.removeEventListener('abort', onAbort)
                resolve()
              }).catch((error) => {
                signal.removeEventListener('abort', onAbort)
                reject(error)
              })
              signal.addEventListener('abort', onAbort, { once: true })
            })
          }

          await BleClient.startNotifications(this.connection.device!.id, ServiceUUID, SendAckUUID, () => {
            resolveAck?.()
          })
          notificationsStarted = true

          // send chunks
          const events = textToHidEvents(stripNotSupported(protocolText));
          const MTU_PAYLOAD = 20;
          const EVENTS_PER_PKT = MTU_PAYLOAD / 2;

          for (let i = 0; i < events.length; i += EVENTS_PER_PKT) {
            throwIfAborted()
            const slice = events.slice(i, i + EVENTS_PER_PKT)

            // pack into a single ArrayBuffer
            const buf = new ArrayBuffer(slice.length * 2)
            const dv  = new DataView(buf)
            slice.forEach(([key, mod], idx) => {
              dv.setUint8(idx * 2 + 0, key)
              dv.setUint8(idx * 2 + 1, mod)
            })

            const ackPromise = new Promise<void>(r => { resolveAck = r })
            await BleClient.write(this.connection.device!.id, ServiceUUID, SendTextUUID, dv)
            await waitForAck(ackPromise)
            this.connection.transmissionCurrent += slice.length

          }
          throwIfAborted()

          // send EOD
          await BleClient.write(this.connection.device!.id, ServiceUUID, SendTextUUID, new DataView(new Uint8Array([0x00,0x00]).buffer))

          return true

        }
        catch (error)
        {
          if ((error as Error).name === 'AbortError') {
            console.info('sendText aborted')
          } else {
            console.warn(error)
          }
          return false
        }
        finally
        {
          if (notificationsStarted) {
            try {
              await BleClient.stopNotifications(this.connection.device!.id, ServiceUUID, SendAckUUID)
            } catch (error) {
              console.warn(error)
            }
          }

          this.connection.isTransmitting = false
          this.connection.transmissionCurrent = 0
          this.connection.transmissionLength = 0

        }

      }
      finally
      {
        this.connection.transmissionAbortController = null
        this.connection.isTransmitting = false
      }

    },
    async cancelSend() {
      if (this.connection.transmissionAbortController) {
        this.connection.transmissionAbortController.abort()
        this.connection.transmissionAbortController = null
      }
    }

  },
  getters: {
    hasProtocolData: (state): boolean => containsProtocolData(state.doku),

    // app status
    isDongleConnecting: (state) => state.connection.isConnecting,
    isDongleConnected: (state) => state.connection.isConnected && !state.connection.isConnecting,
    isDongleTransmitting: (state) => state.connection.isConnected && state.connection.isTransmitting,
    transmissionProgress: (state) => (state.connection.isConnected && state.connection.isTransmitting && state.connection.transmissionLength>0) ? (state.connection.transmissionCurrent / state.connection.transmissionLength) : 0,
    connectedDongleName: (state) => state.connection.isConnected ? (state.connection.config ? DONGLE_NAME_PREFIX + state.connection.config.name : state.connection.device?.name ?? 'Unbekanntes Dongle') : '',

    // context
    context(state): ProtocolContext {

      const isNoEmergencyCall: boolean = state.doku.flavors.no_emergency_call
      const isVerlegung: boolean = state.doku.flavors.verlegung
      const isEinweisung: boolean = state.doku.flavors.einweisung
      const isTransport: boolean = state.doku.course == ProtocolCourse.TRANSPORT
      const requireSceneDetails: boolean = isTransport && !isVerlegung && !isEinweisung
      const requireFlavors: boolean = state.doku.course == ProtocolCourse.TRANSPORT
      const requireABCDE: boolean = isTransport && !isNoEmergencyCall && !isVerlegung
      const requireSampler: boolean = isTransport && !isVerlegung
      const requireSampleSymptoms: boolean = requireSampler && !isNoEmergencyCall
      const requireSaamed: boolean = !isNoEmergencyCall
      const requireRedflags: boolean = !isNoEmergencyCall && isTransport && !isVerlegung
      const requireTasks: boolean = !(isEinweisung || isVerlegung)
      const isPediatric: boolean = state.doku.ident.age?.totalYears <= 4

      const nothingToTreat: boolean = (
        !state.doku.Xabcde.hasCriticalBleeding
        && !state.doku.xAbcde.needTreatment
        && !state.doku.xaBcde.needTreatment
        && !state.doku.xabCde.needTreatment
        && !state.doku.xabcDe.needTreatment
        && !state.doku.xabcdE.needTreatment
        // TODO: STU
      )

      const gcs: number = state.doku.xabcDe.gcsScore
      const isBaseline: boolean = state.doku.xabcDe.psych.baseline

      const isTrauma: boolean = requireABCDE && state.doku.flavors.trauma

      const isCritical: boolean =
        !state.doku.xAbcde.isBreathing
        || state.doku.xaBcde.breathlessness == 'schwere'
        || state.doku.xaBcde.mechanics.pattern == 'Biotsche Atmung'
        || state.doku.xaBcde.hasTrachealDeviation
        || state.doku.xabCde.pulse.peripheralStrength == 'nicht'
        || state.doku.xabCde.pulse.centralStrength != 'gut'
        || (isTrauma && gcs <= 12 && !isBaseline)
        || (state.doku.xabcDe.avpu == 'bewusstlos' && !isBaseline)
        || state.doku.sampler.symptoms.trauma.head.Anisocoria != ''
        || state.doku.sampler.symptoms.trauma.spine.hasObviousSevereInjury
        || state.doku.sampler.symptoms.trauma.thorax.hasUnstableChestWall
        || state.doku.sampler.symptoms.trauma.pelvis.hasHemodynamicInstability

      const verbosity: ProtocolVerbosity = isCritical
        ? ProtocolVerbosity.HIGH
        : nothingToTreat
          ? ProtocolVerbosity.LOW
          : ProtocolVerbosity.NORMAL

      const isNonVerbal: boolean = state.doku.flavors.non_verbal
        || !state.doku.xAbcde.isBreathing
        || state.doku.xabcDe.avpu == 'bewusstlos'
        || state.doku.xabcDe.avpu == 'soporös'
        || state.doku.xabcDe.gcs.v < 4

      const isLowVigilant: boolean =
        (state.doku.xabcDe.gcsScore<14 || state.doku.xabcDe.avpu != 'wach') &&
        (!state.doku.xabcDe.psych.baseline && !state.doku.xabcDe.psych.dementia)

      const isChildbearingAge: boolean =
        (state.doku.ident.age?.totalYears >= 10) &&
        (state.doku.ident.age?.totalYears <= 52)

      return {

        verbosity,
        isLow: verbosity == ProtocolVerbosity.LOW,
        isNormal: verbosity == ProtocolVerbosity.NORMAL,
        isHigh: verbosity == ProtocolVerbosity.HIGH,

        requireSceneDetails,
        requireFlavors,
        requireABCDE,
        requireSampler,
        requireSampleSymptoms,
        requireSaamed,
        requireRedflags,
        requireTasks,

        isVerlegung,
        isEinweisung,

        isBreathing: state.doku.xAbcde.isBreathing,
        hasPulse: state.doku.xabCde.pulse.centralStrength != 'nicht',
        isNonVerbal,
        isLowVigilant,
        isCritical,
        gcs,
        isBaseline,

        hasNausea: state.doku.xabcdE.nausea,
        hasEmesis: state.doku.xabcdE.emesis.needTreatment,
        hasHeadache: state.doku.xabcDe.headache,
        hasDizziness: state.doku.xabcDe.dizziness != 'kein',
        hasSensomotoricDeficit: state.doku.xabcDe.paresis.active,
        hasHeartIssue: state.doku.xabCde.chest.pain != 'keine' || state.doku.xabCde.chest.tightness,
        hasAbdominalIssue: state.doku.xabcdE.abdominal.isAssessed && state.doku.xabcdE.abdominal.value.pain != 'keine',

        isTrauma,
        isPediatric,
        isGeriatric: state.doku.ident.age?.totalYears >= 65,
        isChildbearingAge,

      } as ProtocolContext
    },

    // protocol
    generatedProtocol(state): string {
      let text = ''

      // special course: NEF
      if (state.doku.course == ProtocolCourse.NEF_VOR_ORT) {
        return multiline([
          'Notarzt bereits vor Ort.',
          'Keine eigenverantwortlichen Maßnahmen durchgeführt.',
          'Einsatzdokumentation im Notarztprotokoll.'
        ])
      }

      // Situation
      text += breakDoku([
        textIf(state.doku.setting.generateText(), this.context.requireSceneDetails),
        placeholder(state.doku.situation.value, 'Situation'),
      ], true)


      if (this.context.requireABCDE)
      {

        // ABCDE
        text += breakDoku([
          state.doku.Xabcde.generateText(),
          state.doku.xAbcde.generateText(),
          state.doku.xaBcde.generateText(),
          state.doku.xabCde.generateText(),
          state.doku.xabcDe.generateText(),
          state.doku.xabcdE.generateText(),
        ], true)

        // STU
        text += textIf(breakDoku([
          state.doku.sampler.symptoms.trauma.head.generateText(),
          state.doku.sampler.symptoms.trauma.spine.generateText(),
          state.doku.sampler.symptoms.trauma.thorax.generateText(),
          state.doku.sampler.symptoms.trauma.pelvis.generateText(),
          state.doku.sampler.symptoms.trauma.limbs.generateText(),
          state.doku.sampler.symptoms.trauma.injuries.length === 1
            ? state.doku.sampler.symptoms.trauma.injuries[0] + '.'
            : state.doku.sampler.symptoms.trauma.injuries.map(injury => `- ${injury}`).join('\n'),
        ], true), this.context.isTrauma)

      }

      if (this.context.requireSampler)
      {

        // SAMPLE
        text += textIf(breakDoku(state.doku.sampler.symptoms.additionalSymptoms.value, true), this.context.requireSampleSymptoms)
        text += breakDoku([
          state.doku.sampler.allergies.generateText(),
          state.doku.sampler.medication.generateText(),
        ], true)
        text += breakDoku(state.doku.sampler.pler.generateText(), true)
        text += breakDoku(state.doku.sampler.contacts.generateText(), true)

      }

      // TREATMENT
      text += textIf(breakDoku(state.doku.saamed.getBlock(), true), this.context.requireSaamed)
      text += breakDoku(
        this.context.requireTasks
        ? placeholder(state.doku.treatment.value, 'Maßnahmen')
        : state.doku.treatment.value.trim(), true)
      text += textIf(breakDoku(state.doku.redflags.getConsentBlock(), true), this.context.requireRedflags)
      text += textIf(breakDoku(state.doku.redflags.getRedflagBlock(), true), this.context.requireRedflags)

      return text.trim()

    },

  },
})
