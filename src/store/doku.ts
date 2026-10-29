import { FirmwareUUID, DfuUUID } from '@/types/firmware'
import { decodeFirmwareInfo, isCompatibleFirmware } from '@/utils/dongle-firmware'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { Device as CapacitorDevice } from '@capacitor/device'
import { defineStore } from 'pinia'

import { toRaw, type UnwrapRef } from 'vue'
import { resetQuickies } from '@/data/quickies'
import { discardReanimationSnapshot, setReanimation } from '@/store/reanimation'
import { TEXT_AREA_BLOCK_SOURCES, createTextAreaBlockSourceState, resolveTextAreaBlocks } from '@/data/text-area-blocks'
import { createSchwindelBlockState } from '@/data/schwindel'
import { createSchwangerschaftBlockState } from '@/data/schwangerschaft'
import { createBauchschmerzBlockState } from '@/data/bauchschmerz'
import { createExcretionsBowelsBlockState, createExcretionsUrinaryBlockState } from '@/data/excretions'
import { composeTextAreaText } from '@/types/text-area-block'
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
import { transmitDongleEvents } from '@/services/dongle-transmission'
import { AuditExport } from '@/plugins/audit-export'
import { decodeDongleConfig, encodeDongleConfig, withDongleTimeout } from '@/utils/dongle-config'
import { awaitBleOperation, disconnectDongle, dongleConnectionTimeout } from '@/utils/dongle-connection'
import { Device, DeviceConnection, DongleConfig, DONGLE_NAME_PREFIX, ServiceUUID, ConfigUUID } from '@/types/dongle'
import { Protocol, ProtocolContext, ProtocolCourse, ProtocolFlavors, ProtocolVerbosity, resetProtocol } from '@/types/protocol'
import { DisabilityNeuro, DisabilityPsych, ExposureAbdominal, ExposureExcretions } from '@/types/protocol/abcde'
import { EnhanceableText } from '@/types/protocol/input'
import { SampleContactsItem, SampleMedicationItem } from '@/types/protocol/sample'

import { breakDoku, multiline, placeholder, prefix } from '@/utils/text'
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
  // Normalize legacy disability findings before restoring their class instances.
  let normalizedInput = input
  if (isRecord(input.xabcDe)) {
    const disability = { ...input.xabcDe }
    const previousPsych = disability.psych
    const wrappedPsych = isRecord(previousPsych) && 'assessed' in previousPsych
    const psychInput = wrappedPsych ? previousPsych.value : previousPsych
    const psych = isRecord(psychInput) ? { ...psychInput } : {}
    const legacyPsychFields = {
      rass: 'psychRass',
      disorder: 'psychDisorder',
      hallucinations: 'psychHallucinations',
      delusions: 'psychDelusions',
      perseveration: 'psychPerseveration',
      behavioralChange: 'psychBehavioralChange',
    } as const

    for (const [key, legacyKey] of Object.entries(legacyPsychFields)) {
      if (psych[key] === undefined) psych[key] = disability[legacyKey]
    }
    // Restore dementia under psych, including records with a separate assessment.
    const separateDementia = disability.dementia
    const migratedDementia = psych.dementia === undefined && separateDementia !== undefined
    if (psych.dementia === undefined) {
      psych.dementia = separateDementia === undefined
        ? disability.psychDementia
        : isRecord(separateDementia)
          ? separateDementia.assessed === true && separateDementia.value === true
          : separateDementia
    }
    disability.baseline = disability.baseline === undefined
      ? (psych.baseline === undefined ? disability.psychBaseline : psych.baseline)
      : disability.baseline
    delete psych.baseline
    disability.psych = wrappedPsych
      ? { ...previousPsych, assessed: previousPsych.assessed || (migratedDementia && psych.dementia === true), value: psych }
      : { assessed: hydrateLikeTemplate(new DisabilityPsych(), psych).hasAbnormalities, value: psych }

    const neuro = disability.neuro
    if (isRecord(neuro) && !('assessed' in neuro)) {
      disability.neuro = { assessed: hydrateLikeTemplate(new DisabilityNeuro(), neuro).hasAbnormalities, value: neuro }
    }
    if (isRecord(disability.headache)) {
      disability.headache = disability.headache.assessed === true ? disability.headache.value : false
    }
    if (isRecord(disability.dizziness)) {
      disability.dizziness = disability.dizziness.assessed === true ? disability.dizziness.value : 'kein'
    }
    if (typeof disability.bloodGlucose === 'string') {
      disability.bloodGlucose = { assessed: disability.bloodGlucose !== '', value: disability.bloodGlucose }
    }
    const intoxication = disability.intoxication
    if (isRecord(intoxication) && !('assessed' in intoxication) && typeof intoxication.active === 'boolean') {
      disability.intoxication = { assessed: intoxication.active, value: intoxication.value }
    }
    normalizedInput = { ...input, xabcDe: disability }
  }
  if (isRecord(normalizedInput.xAbcde)) {
    const airway = normalizedInput.xAbcde
    const stridor = airway.stridor === undefined ? airway.hasStridor : airway.stridor
    normalizedInput = {
      ...normalizedInput,
      xAbcde: {
        ...airway,
        stridor: typeof stridor === 'boolean' ? { assessed: stridor, value: stridor } : stridor,
      },
    }
  }
  if (isRecord(normalizedInput.xaBcde)) {
    const breathing = { ...normalizedInput.xaBcde }
    const legacyBreathingFields = {
      accessoryMuscles: 'useAccessoryMuscles',
      retractions: 'hasRetractions',
      paradoxical: 'isParadoxical',
      jugularVenousDistension: 'hasJugularVenousDistension',
      emphysema: 'hasEmphysema',
      trachealDeviation: 'hasTrachealDeviation',
    } as const
    for (const [key, legacyKey] of Object.entries(legacyBreathingFields)) {
      const finding = breathing[key] === undefined ? breathing[legacyKey] : breathing[key]
      breathing[key] = typeof finding === 'boolean' ? { assessed: finding, value: finding } : finding
    }
    normalizedInput = { ...normalizedInput, xaBcde: breathing }
  }
  if (isRecord(normalizedInput.xabCde)) {
    const circulation = normalizedInput.xabCde
    const edema = circulation.edema
    if (isRecord(edema) && edema.assessed === undefined && edema.value === undefined && typeof edema.grade === 'string') {
      normalizedInput = {
        ...normalizedInput,
        xabCde: {
          ...circulation,
          edema: { assessed: edema.grade !== 'keine Ödeme', value: edema },
        },
      }
    }
  }
  const hydratedProtocol = hydrateLikeTemplate(resetProtocol(), normalizedInput)

  if (legacyCourse === 1 || legacyCourse === 2) {
    hydratedProtocol.course = ProtocolCourse.TRANSPORT
    hydratedProtocol.flavors.verlegung = legacyCourse === 1
    hydratedProtocol.flavors.einweisung = legacyCourse === 2
  }

  for (const source of TEXT_AREA_BLOCK_SOURCES) {
    if (!source.isAvailable(hydratedProtocol)) {
      hydratedProtocol.textAreaBlocks[source.id] = createTextAreaBlockSourceState(source)
    }
  }

  if (!hydratedProtocol.xabcdE.excretions.value.catheterType) {
    hydratedProtocol.textAreaBlocks.excretions_urinary.details.catheterIssues = ''
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
    if (!doku) return []
    clearProtocolEditingState(doku)
    ids.add(entry.id)
    return [{ id: entry.id, archivedAt: entry.archivedAt, doku }]
  }).sort((a, b) => Date.parse(b.archivedAt) - Date.parse(a.archivedAt)).slice(0, 3)
}

function updateHistoryEntry(
  protocol: UnwrapRef<Protocol>, history: ProtocolHistoryEntry[], activeHistoryEntryId: string | null,
): ProtocolHistoryEntry[] {
  const entry = history.find(entry => entry.id === activeHistoryEntryId)
  if (!entry) return history
  const doku = toPersistable(protocol)
  // Keep the same reference when nothing changed so committing an autosave
  // cannot keep triggering the persistence subscription indefinitely.
  if (JSON.stringify(toPersistable(entry.doku)) === JSON.stringify(doku)) return history
  return history.map(item => item.id === entry.id ? { ...item, doku } : item)
}

function archiveProtocol(
  protocol: UnwrapRef<Protocol>, history: ProtocolHistoryEntry[], activeHistoryEntryId: string | null,
  preserveId?: string,
): ProtocolHistoryEntry[] {
  if (history.some(entry => entry.id === activeHistoryEntryId)) {
    return updateHistoryEntry(protocol, history, activeHistoryEntryId)
  }
  if (!containsProtocolData(protocol)) return history
  const next = [{
    id: crypto.randomUUID(),
    archivedAt: new Date().toISOString(),
    doku: toPersistable(protocol),
  }, ...history]
  // Opening the oldest entry must not evict the entry we are about to edit.
  while (next.length > 3) {
    next.splice(next.findLastIndex(entry => entry.id !== preserveId), 1)
  }
  return next
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
  activeHistoryEntryId: string | null
  lastProtocolResetAt: string
  lastProtocolOpenedAt: string
  lastProtocolSentAt: string | null
}): PersistedDokuState {
  return {
    schemaVersion: DOKU_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    lastProtocolResetAt: state.lastProtocolResetAt,
    lastProtocolOpenedAt: state.lastProtocolOpenedAt,
    lastProtocolSentAt: state.lastProtocolSentAt ?? undefined,
    doku: toPersistable(state.doku),
    protocolHistory: toPersistable(state.protocolHistory),
    activeHistoryEntryId: state.activeHistoryEntryId,
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

function composedFreeformText(protocol: UnwrapRef<Protocol>): Record<string, string> {
  const freeform = collectFreeformBlocks(protocol)
  const blocks = resolveTextAreaBlocks(protocol)
  for (const target of new Set(blocks.map(block => block.target))) {
    freeform[target] = composeTextAreaText(freeform[target] ?? '', blocks.filter(block => block.target === target))
  }
  return freeform
}

function createProtocolAuditEntry(protocol: UnwrapRef<Protocol>, protocolText: string): ProtocolAuditEntry {
  return {
    schemaVersion: DOKU_SCHEMA_VERSION,
    resetAt: new Date().toISOString(),
    protocolText,
    ...composedFreeformText(protocol),
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
      transmissionPaused: false,
      transmissionBlockPending: false,
      transmissionWaitingForDongle: false,
      transmissionReconnectCount: 0,
    } as DeviceConnection,

    doku: resetProtocolState(),
    protocolHistory: [] as ProtocolHistoryEntry[],
    activeHistoryEntryId: null as string | null,
    isProtocolChanging: false,
    lastProtocolResetAt: new Date().toISOString(),
    lastProtocolOpenedAt: new Date().toISOString(),
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
      if (this.connection.isTransmitting) this.connection.transmissionWaitingForDongle = true
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
            protocolHistory: archiveProtocol(this.doku, this.protocolHistory, this.activeHistoryEntryId),
            activeHistoryEntryId: null,
            lastProtocolResetAt: new Date().toISOString(),
            lastProtocolOpenedAt: new Date().toISOString(),
            lastProtocolSentAt: null,
          }
          await appendProtocolAuditEntry(createProtocolAuditEntry(this.doku, this.generatedProtocol))
          await saveDokuState(persistedProtocolState(next))
          resetQuickies()
          discardReanimationSnapshot(this.doku)
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
          if (!this.protocolHistory.some(entry => entry.id === id)) return false
          const protocolHistory = archiveProtocol(this.doku, this.protocolHistory, this.activeHistoryEntryId, id)
          const entry = protocolHistory.find(entry => entry.id === id)
          const doku = entry && hydrateProtocol(toPersistable(entry.doku))
          if (!doku) return false
          clearProtocolEditingState(doku)
          const next = {
            doku,
            protocolHistory,
            activeHistoryEntryId: id,
            lastProtocolResetAt: new Date().toISOString(),
            lastProtocolOpenedAt: new Date().toISOString(),
            lastProtocolSentAt: null,
          }
          await saveDokuState(persistedProtocolState(next))
          resetQuickies()
          discardReanimationSnapshot(this.doku)
          this.$patch(state => Object.assign(state, next))
          return true
        })
      } finally {
        this.isProtocolChanging = false
      }
    },
    setTextAreaBlockActive(id: string, active: boolean) {
      const source = TEXT_AREA_BLOCK_SOURCES.find(source => source.outputs.some(output => output.id === id))
      if (source?.isAvailable(this.doku)) this.doku.textAreaBlocks[source.id].active[id] = active
    },
    setDizziness(value: Protocol['xabcDe']['dizziness']) {
      this.doku.xabcDe.dizziness = value
      if (value !== 'gerichteter') this.doku.textAreaBlocks.schwindel = createSchwindelBlockState()
    },
    setPregnancyAssessed(value: boolean) {
      if (this.doku.xabcdE.pregnancy.assessed !== value || !value) {
        this.doku.xabcdE.pregnancy.value = true
        this.doku.textAreaBlocks.schwangerschaft = createSchwangerschaftBlockState()
      }
      this.doku.xabcdE.pregnancy.assessed = value
    },
    setPregnancy(value: boolean) {
      this.doku.xabcdE.pregnancy.value = value
      if (!this.doku.xabcdE.pregnancy.isAssessed || !value) {
        this.doku.textAreaBlocks.schwangerschaft = createSchwangerschaftBlockState()
      }
    },
    setExcretionsAssessed(value: boolean) {
      this.doku.xabcdE.excretions.assessed = value
      if (!value) {
        this.doku.textAreaBlocks.excretions_bowel = createExcretionsBowelsBlockState()
        this.doku.textAreaBlocks.excretions_urinary = createExcretionsUrinaryBlockState()
      }
    },
    setBowelAbnormalities(value: boolean) {
      this.doku.xabcdE.excretions.value.bowelAbnormalities = value
      if (!this.doku.xabcdE.excretions.isAssessed || !value) {
        this.doku.textAreaBlocks.excretions_bowel = createExcretionsBowelsBlockState()
      }
    },
    setUrinaryAbnormalities(value: boolean) {
      this.doku.xabcdE.excretions.value.urinaryAbnormalities = value
      if (!this.doku.xabcdE.excretions.isAssessed || !value) {
        this.doku.textAreaBlocks.excretions_urinary = createExcretionsUrinaryBlockState()
      }
    },
    setCatheterType(value: ExposureExcretions['catheterType']) {
      this.doku.xabcdE.excretions.value.catheterType = value
      if (!value) this.doku.textAreaBlocks.excretions_urinary.details.catheterIssues = ''
    },
    resetExcretions() {
      this.doku.xabcdE.excretions.value = new ExposureExcretions()
      this.doku.textAreaBlocks.excretions_bowel = createExcretionsBowelsBlockState()
      this.doku.textAreaBlocks.excretions_urinary = createExcretionsUrinaryBlockState()
    },
    setAbdominalPain(value: ExposureAbdominal['pain']) {
      this.doku.xabcdE.abdominal.value.pain = value
      if (!this.doku.xabcdE.abdominal.isAssessed || value === 'keine') {
        this.doku.textAreaBlocks.bauchschmerz = createBauchschmerzBlockState()
      }
    },
    setAbdominalAssessed(value: boolean) {
      this.doku.xabcdE.abdominal.assessed = value
      if (!this.doku.xabcdE.abdominal.isAssessed || this.doku.xabcdE.abdominal.value.pain === 'keine') {
        this.doku.textAreaBlocks.bauchschmerz = createBauchschmerzBlockState()
      }
    },
    resetAbdominal() {
      this.doku.xabcdE.abdominal.value = new ExposureAbdominal()
      this.doku.textAreaBlocks.bauchschmerz = createBauchschmerzBlockState()
    },
    setFlavor(key: keyof ProtocolFlavors, enabled: boolean) {
      if (key === 'reanimation') {
        setReanimation(this.doku, enabled)
      } else {
        this.doku.flavors[key] = enabled
      }

      if (enabled && (key === 'no_emergency_call' || key === 'verlegung' || key === 'einweisung')) {
        this.doku.flavors.no_emergency_call = key === 'no_emergency_call'
        this.doku.flavors.verlegung = key === 'verlegung'
        this.doku.flavors.einweisung = key === 'einweisung'
      }

      for (const source of TEXT_AREA_BLOCK_SOURCES) {
        if (!source.isAvailable(this.doku)) this.doku.textAreaBlocks[source.id] = createTextAreaBlockSourceState(source)
      }

      if (!enabled) {
        return
      }

      if (key !== 'no_emergency_call') {
        return
      }

      discardReanimationSnapshot(this.doku)
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
      this.doku.textAreaBlocks.schwangerschaft = emptyProtocol.textAreaBlocks.schwangerschaft
      this.doku.textAreaBlocks.excretions_bowel = emptyProtocol.textAreaBlocks.excretions_bowel
      this.doku.textAreaBlocks.excretions_urinary = emptyProtocol.textAreaBlocks.excretions_urinary
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
    async markProtocolOpened(referenceTime: number = Date.now()) {
      const protocol = this.doku
      await serializeStorage(this, async () => {
        if (this.doku !== protocol) return
        const lastProtocolOpenedAt = new Date(referenceTime).toISOString()
        await saveDokuState(persistedProtocolState({ ...this.$state, lastProtocolOpenedAt }))
        this.lastProtocolOpenedAt = lastProtocolOpenedAt
      })
    },
    async markProtocolSent(referenceTime: number = Date.now(), protocol?: UnwrapRef<Protocol>) {
      const sentProtocol = protocol ?? this.doku
      await serializeStorage(this, async () => {
        if (this.doku !== sentProtocol) return
        const lastProtocolSentAt = new Date(referenceTime).toISOString()
        const protocolHistory = updateHistoryEntry(this.doku, this.protocolHistory, this.activeHistoryEntryId)
        await saveDokuState(persistedProtocolState({ ...this.$state, lastProtocolSentAt, protocolHistory }))
        if (protocolHistory !== this.protocolHistory) this.protocolHistory = protocolHistory
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
          activeHistoryEntryId: doku && typeof persistedState?.activeHistoryEntryId === 'string'
            && protocolHistory.some(entry => entry.id === persistedState.activeHistoryEntryId)
            ? persistedState.activeHistoryEntryId : null,
          lastProtocolResetAt: doku
            ? persistedState!.lastProtocolResetAt ?? persistedState!.updatedAt ?? new Date().toISOString()
            : new Date().toISOString(),
          lastProtocolSentAt: doku ? persistedState!.lastProtocolSentAt ?? null : null,
          lastProtocolOpenedAt: (doku ? [persistedState!.lastProtocolOpenedAt,
            persistedState!.lastProtocolResetAt, persistedState!.updatedAt] : [])
            .find(value => typeof value === 'string' && Number.isFinite(Date.parse(value)))
            ?? new Date().toISOString(),
        }
        if (!next.lastProtocolSentAt || Number.isNaN(Date.parse(next.lastProtocolResetAt))
          || !(Date.parse(next.lastProtocolSentAt) >= Date.parse(next.lastProtocolResetAt))) {
          next.lastProtocolSentAt = null
        }
        clearProtocolEditingState(next.doku)
        next.protocolHistory = updateHistoryEntry(next.doku, next.protocolHistory, next.activeHistoryEntryId)
        await saveDokuState(persistedProtocolState(next))
        resetQuickies()
        discardReanimationSnapshot(this.doku)
        this.$patch(state => Object.assign(state, next))
        if (temporary) await removeTemporaryProtocolState()
      })
    },
    getAutoProtocolResetAction(referenceTime: number = Date.now()): AutoProtocolResetAction {
      if (this.wasCurrentProtocolSent()) return 'reset'
      const lastOpenedAtMs = Date.parse(this.lastProtocolOpenedAt)
      if (Number.isNaN(lastOpenedAtMs)) {
        return 'reset'
      }

      const protocolAgeMs = referenceTime - lastOpenedAtMs
      if (protocolAgeMs >= AUTO_RESET_THRESHOLD_MS) {
        return 'reset'
      }
      return 'none'
    },
    async persistToStorage() {
      await serializeStorage(this, async () => {
        const protocolHistory = updateHistoryEntry(this.doku, this.protocolHistory, this.activeHistoryEntryId)
        await saveDokuState(persistedProtocolState({ ...this.$state, protocolHistory }))
        if (protocolHistory !== this.protocolHistory) this.protocolHistory = protocolHistory
      })
    },
    async sendProtocol() {
      if (this.connection.isSavingSettings || this.connection.isConnecting || this.connection.isTransmitting || this.connection.isUpdatingFirmware) return false
      this.connection.isTransmitting = true
      this.connection.transmissionPaused = false
      this.connection.transmissionWaitingForDongle = false
      this.connection.transmissionBlockPending = false
      this.connection.transmissionCurrent = 0

      const protocol = this.doku
      const protocolText = this.generatedProtocol
      const deviceId = this.connection.device?.id
      const wasConnected = this.connection.isConnected
      const controller = new AbortController()
      this.connection.transmissionAbortController = controller

      try {
        await this.checkConnection()
        if (!deviceId || !wasConnected || controller.signal.aborted) return false
        const events = textToHidEvents(stripNotSupported(protocolText))
        this.connection.transmissionLength = events.length
        await transmitDongleEvents({
          connection: this.connection,
          deviceId,
          events,
          signal: controller.signal,
          openConnection: () => this.openDongleConnection(deviceId),
          refreshConnection: async () => {
            await this.refreshDongleConfig()
            await this.refreshDongleFirmware()
          },
          invalidateConnection: () => this.dongleDisconnected(deviceId, this.connection.session),
        })
        controller.signal.throwIfAborted()
        // Keep the guard until completion is persisted for this exact protocol.
        await this.markProtocolSent(Date.now(), protocol)
        return true
      } catch (error) {
        if (!controller.signal.aborted) console.warn('Protokoll konnte nicht gesendet werden.', error)
        return false
      } finally {
        this.connection.transmissionAbortController = null
        this.connection.transmissionCurrent = 0
        this.connection.transmissionLength = 0
        this.connection.transmissionPaused = false
        this.connection.transmissionWaitingForDongle = false
        this.connection.transmissionBlockPending = false
        this.connection.isTransmitting = false
      }
    },
    pauseSend() {
      if (this.connection.isTransmitting) this.connection.transmissionPaused = true
    },
    resumeSend() {
      if (this.connection.isTransmitting && this.isDongleConnected && !this.connection.transmissionWaitingForDongle) {
        this.connection.transmissionPaused = false
      }
    },
    async cancelSend() {
      this.connection.transmissionAbortController?.abort()
    }

  },
  getters: {
    hasProtocolData: (state): boolean => containsProtocolData(state.doku),

    // app status
    isDongleConnecting: (state) => state.connection.isConnecting,
    isDongleConnected: (state) => state.connection.isConnected && !state.connection.isConnecting,
    isDongleTransmitting: (state) => state.connection.isTransmitting,
    transmissionProgress: (state) => (state.connection.isTransmitting && state.connection.transmissionLength>0) ? (state.connection.transmissionCurrent / state.connection.transmissionLength) : 0,
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
        !this.freeformText['Xabcde.description'].trim()
        && !state.doku.xAbcde.needTreatment
        && !state.doku.xaBcde.needTreatment
        && !state.doku.xabCde.needTreatment
        && !state.doku.xabcDe.needTreatment
        && !state.doku.xabcdE.needTreatment
        // TODO: STU
      )

      const gcs: number = state.doku.xabcDe.gcsScore
      const isBaseline: boolean = state.doku.xabcDe.baseline

      const isTrauma: boolean = requireABCDE && state.doku.flavors.trauma

      const isCritical: boolean =
        !state.doku.xAbcde.isBreathing
        || state.doku.xaBcde.breathlessness == 'schwere'
        || state.doku.xaBcde.mechanics.pattern == 'Biotsche Atmung'
        || state.doku.xaBcde.trachealDeviation.matches(true)
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
        (!state.doku.xabcDe.baseline && !(state.doku.xabcDe.psych.isAssessed && state.doku.xabcDe.psych.value.dementia))

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
    textAreaBlocks(state) {
      return resolveTextAreaBlocks(state.doku)
    },
    freeformText(state): Record<string, string> {
      return composedFreeformText(state.doku)
    },
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
        placeholder(this.freeformText.situation, 'Situation'),
      ], true)


      if (this.context.requireABCDE)
      {

        // ABCDE
        text += breakDoku([
          state.doku.Xabcde.generateText(this.freeformText['Xabcde.description']),
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
        text += textIf(breakDoku([
          textIf(prefix('Neuro:', state.doku.xabcDe.neuro.value.symptomsText), state.doku.xabcDe.neuro.isAssessed),
          this.freeformText['sampler.symptoms.additionalSymptoms'],
        ], true), this.context.requireSampleSymptoms)
        text += breakDoku([
          state.doku.sampler.allergies.generateText(),
          state.doku.sampler.medication.generateText(),
        ], true)
        text += breakDoku(this.freeformText['sampler.pler.PLER'], true)
        text += breakDoku(state.doku.sampler.contacts.generateText(), true)

      }

      // TREATMENT
      text += textIf(breakDoku(state.doku.saamed.getBlock(), true), this.context.requireSaamed)
      text += breakDoku(
        this.context.requireTasks
        ? placeholder(this.freeformText.treatment, 'Verlauf')
        : this.freeformText.treatment.trim(), true)
      text += textIf(breakDoku(state.doku.redflags.getConsentBlock(), true), this.context.requireRedflags)
      text += textIf(breakDoku(state.doku.redflags.getRedflagBlock(), true), this.context.requireRedflags)

      return text.trim()

    },

  },
})
