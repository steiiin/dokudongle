import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { Device as CapacitorDevice } from '@capacitor/device'
import { defineStore } from 'pinia'

import { toRaw } from 'vue'
import { resetQuickies } from '@/data/quickies'
import {
  DOKU_SCHEMA_VERSION,
  ProtocolAuditEntry,
  appendProtocolAuditEntry,
  loadDokuState,
  loadProtocolAuditEntries,
  loadTemporaryProtocolState,
  removeTemporaryProtocolState,
  saveDokuState,
  saveTemporaryProtocolState,
} from '@/store/persistence'
import { stripNotSupported, textToHidEvents } from '@/utils/keymaps/keymap-german'
import { AuditExport } from '@/plugins/audit-export'
import { Device, DeviceConnection, SendAckUUID, SendTextUUID, ServiceUUID, SetNameUUID } from '@/types/dongle'
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
  if (Array.isArray(template)) {
    return Array.isArray(input) ? input as T : template
  }

  if (isRecord(template)) {
    if (!isRecord(input)) {
      return template
    }

    for (const key of Object.keys(template)) {
      const typedKey = key as keyof T
      ;(template as Record<string, unknown>)[key] = hydrateLikeTemplate(
        template[typedKey],
        input[key],
      ) as T[keyof T]
    }

    return template
  }

  return input === undefined ? template : input as T
}

function hydrateProtocol(input: unknown): Protocol | null {
  if (!isRecord(input)) {
    return null
  }

  const legacyCourse = input.course
  const hydratedProtocol = hydrateLikeTemplate(resetProtocol(), input)

  if (legacyCourse === 1 || legacyCourse === 2) {
    hydratedProtocol.course = ProtocolCourse.TRANSPORT
    hydratedProtocol.flavors.verlegung = legacyCourse === 1
    hydratedProtocol.flavors.einweisung = legacyCourse === 2
  }

  hydratedProtocol.sampler.medication.PlanMedication = hydratedProtocol.sampler.medication.PlanMedication
    .map((item) => new SampleMedicationItem(item))

  hydratedProtocol.sampler.contacts.contacts = hydratedProtocol.sampler.contacts.contacts
    .map((contact) => new SampleContactsItem(contact))

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

const AUTO_RESET_PROMPT_THRESHOLD_MS = 10 * 60 * 1000
const AUTO_RESET_THRESHOLD_MS = 30 * 60 * 1000

export type AutoProtocolResetAction = 'none' | 'prompt' | 'reset'

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
      isTransmitting: false,
      isRenaming: false,
      transmissionCurrent: 0, transmissionLength: 0,
      transmissionAbortController: null,
    } as DeviceConnection,

    doku: resetProtocolState(),
    lastProtocolResetAt: new Date().toISOString(),
    lastAutoProtocolResetPromptAt: null as string | null,

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

    async connectDongle() {

      this.connection.isConnecting = true
      this.connection.lastError = null
      try {

        await this.initDongle()
        await this.checkConnection()
        if (this.isDongleConnected) { return }

        const device = await BleClient.requestDevice({
          services: [ ServiceUUID ],
        })

        this.connection.device = {
          id: device.deviceId,
          name: device.name ?? 'Unbekannt',
        } as Device

        await BleClient.disconnect(device.deviceId)
        await BleClient.connect(device.deviceId, () => this.checkConnection())
        await this.checkConnection()

      }
      catch (e) {
        this.connection.isConnected = false
        this.connection.lastError = connectionErrorMessage(e)
        console.error('could not connect to dongle')
        console.error(e)
      }
      finally {
        this.connection.isConnecting = false
      }

    },
    async renameDongle(newName: string) {

      try
      {

        // cancel if not connected
        await this.checkConnection()
        if (!this.isDongleConnected) { return false }
        this.connection.isRenaming = true

        // convert string to bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(newName);
        const view = new DataView(
          data.buffer,
          data.byteOffset,
          data.byteLength
        )

        // max length must match firmware
        if (data.byteLength === 0) {
          throw new Error("Name darf nicht leer sein")
        }
        if (data.byteLength > 18) {
          throw new Error("Name darf nicht länger als 18 Byte sein");
        }

        await BleClient.write(
          this.connection.device!.id,
          ServiceUUID,
          SetNameUUID,
          view,
        )

        await new Promise(r => setTimeout(r, 500));
        await BleClient.disconnect(this.connection.device!.id);

        this.initialized = false
        this.connection.device = null

        await new Promise(r => setTimeout(r, 2000));

      }
      finally
      {
        this.connection.isRenaming = false
        this.connectDongle()
      }

    },
    async checkConnection() {
      try {

        await this.initDongle()
        const connected = await BleClient.getConnectedDevices([ ServiceUUID ])
        this.connection.isConnected = connected.some(device => device.deviceId === this.connection.device?.id)

      } catch (e) {
        console.warn('Bluetooth not available')
        console.warn(e)
      }
    },

    // protocol
    async newProtocol() {
      await appendProtocolAuditEntry(createProtocolAuditEntry(this.doku, this.generatedProtocol))
      this.doku = resetProtocolState()
      this.lastProtocolResetAt = new Date().toISOString()
      this.lastAutoProtocolResetPromptAt = null
      await this.persistToStorage()
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
    async markAutoProtocolResetPrompted(referenceTime: number = Date.now()) {
      this.lastAutoProtocolResetPromptAt = new Date(referenceTime).toISOString()
      await this.persistToStorage()
    },
    async autoResetProtocol() {
      await saveTemporaryProtocolState({
        schemaVersion: DOKU_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        doku: toPersistable(this.doku),
      })

      try {
        await this.newProtocol()
      } catch (error) {
        await removeTemporaryProtocolState()
        throw error
      }
    },
    async restoreTemporaryProtocol() {
      const temporaryState = await loadTemporaryProtocolState()
      if (!temporaryState || temporaryState.schemaVersion !== DOKU_SCHEMA_VERSION) {
        await removeTemporaryProtocolState()
        return false
      }

      const hydratedProtocol = hydrateProtocol(temporaryState.doku)
      if (!hydratedProtocol) {
        await removeTemporaryProtocolState()
        return false
      }

      resetQuickies()
      this.doku = hydratedProtocol
      this.lastProtocolResetAt = new Date().toISOString()
      this.lastAutoProtocolResetPromptAt = null
      await this.persistToStorage()
      await removeTemporaryProtocolState()
      return true
    },
    async discardTemporaryProtocol() {
      await removeTemporaryProtocolState()
    },
    async hydrateFromStorage() {
      const persistedState = await loadDokuState()
      if (!persistedState || persistedState.schemaVersion !== DOKU_SCHEMA_VERSION) {
        this.doku = resetProtocolState()
        this.lastProtocolResetAt = new Date().toISOString()
        this.lastAutoProtocolResetPromptAt = null
        await this.persistToStorage()
        return
      }

      const hydratedProtocol = hydrateProtocol(persistedState.doku)
      if (!hydratedProtocol) {
        this.doku = resetProtocolState()
        this.lastProtocolResetAt = new Date().toISOString()
        this.lastAutoProtocolResetPromptAt = null
        await this.persistToStorage()
        return
      }

      resetQuickies()
      this.doku = hydratedProtocol
      this.lastProtocolResetAt = persistedState.lastProtocolResetAt ?? persistedState.updatedAt ?? new Date().toISOString()
      this.lastAutoProtocolResetPromptAt = persistedState.lastAutoProtocolResetPromptAt ?? null
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
      if (protocolAgeMs < AUTO_RESET_PROMPT_THRESHOLD_MS) {
        return 'none'
      }

      const lastPromptAtMs = this.lastAutoProtocolResetPromptAt
        ? Date.parse(this.lastAutoProtocolResetPromptAt)
        : Number.NaN
      if (
        !Number.isNaN(lastPromptAtMs)
        && lastPromptAtMs >= lastResetAtMs
        && referenceTime - lastPromptAtMs < AUTO_RESET_PROMPT_THRESHOLD_MS
      ) {
        return 'none'
      }

      return 'prompt'
    },
    async persistToStorage() {
      await saveDokuState({
        schemaVersion: DOKU_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        lastProtocolResetAt: this.lastProtocolResetAt,
        lastAutoProtocolResetPromptAt: this.lastAutoProtocolResetPromptAt ?? undefined,
        doku: toPersistable(this.doku),
      })
    },
    async sendProtocol() {

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

    // app status
    isDongleConnecting: (state) => state.connection.isConnecting,
    isDongleConnected: (state) => state.connection.isConnected && !state.connection.isConnecting,
    isDongleTransmitting: (state) => state.connection.isConnected && state.connection.isTransmitting,
    transmissionProgress: (state) => (state.connection.isConnected && state.connection.isTransmitting && state.connection.transmissionLength>0) ? (state.connection.transmissionCurrent / state.connection.transmissionLength) : 0,
    connectedDongleName: (state) => state.connection.isConnected ? state.connection.device?.name ?? 'Unbekanntes Dongle' : '',

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
      const isBaseline: boolean = state.doku.xabcDe.psychBaseline

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
        (!state.doku.xabcDe.psychBaseline && !state.doku.xabcDe.psychDementia)

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
      text += breakDoku(placeholder(state.doku.treatment.value, 'Maßnahmen'), true)
      text += textIf(breakDoku(state.doku.redflags.getConsentBlock(), true), this.context.requireRedflags)
      text += textIf(breakDoku(state.doku.redflags.getRedflagBlock(), true), this.context.requireRedflags)

      return text.trim()

    },

  },
})
