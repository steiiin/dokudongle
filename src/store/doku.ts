import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { defineStore } from 'pinia'

import { toRaw } from 'vue'
import { DOKU_SCHEMA_VERSION, loadDokuState, saveDokuState } from '@/store/persistence'
import { stripNotSupported, textToHidEvents } from '@/utils/keymaps/keymap-german'
import { Device, DeviceConnection, SendAckUUID, SendTextUUID, ServiceUUID, SetNameUUID } from '@/types/dongle'
import { Protocol, ProtocolContext, ProtocolCourse, ProtocolVerbosity, resetProtocol } from '@/types/protocol'

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

  return hydrateLikeTemplate(resetProtocol(), input)
}

// ############################################################################

export const useDokuStore = defineStore('doku', {
  state: () => ({

    initialized: false,
    connection: {
      device: null,
      isConnecting: false,
      isConnected: false,
      isTransmitting: false,
      isRenaming: false,
      transmissionCurrent: 0, transmissionLength: 0,
      transmissionAbortController: null,
    } as DeviceConnection,

    doku: resetProtocol(),

  }),
  actions: {

    // dongle
    async connectDongle() {

      await this.initDongle()
      await this.checkConnection()
      if (this.isDongleConnected) { return }

      this.connection.isConnecting = true
      try {

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
        console.error('could not connect to dongle')
        console.error(e)
      }
      finally {
        this.connection.isConnecting = false
      }

    },
    async initDongle() {

      if (!this.initialized) {

        await BleClient.initialize()
        BleClient.setDisplayStrings({
          scanning: 'Suche DokuDongle ...',
          cancel: 'Abbrechen',
          availableDevices: 'Gefundene Dongles',
          noDeviceFound: 'Kein Dongle gefunden',
        })
        this.initialized = true

      }

      // check Android permissions
      if (Capacitor.getPlatform() === 'android')
      {

        // location permission
        const isLocationEnabled = await BleClient.isLocationEnabled()
        if (!isLocationEnabled) {
          await BleClient.openLocationSettings()
        }

        // bluetooth enabled
        const isBleEnabled = await BleClient.isEnabled()
        if (!isBleEnabled) {
          await BleClient.requestEnable()
        }

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
    async renameDongle(newName: string) {

      try
      {

        // cancel if not connected
        await this.checkConnection()
        if (!this.isDongleConnected) { return false }
        this.connection.isRenaming = true

        // max length must match firmware
        if (newName.length > 20) {
          throw new Error("Name too long (max 20 chars)");
        }

        // convert string → bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(newName);
        const view = new DataView(
          data.buffer,
          data.byteOffset,
          data.byteLength
        )

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

    // protocol
    newProtocol() {
      this.doku = resetProtocol()
      void this.persistToStorage()
    },
    async hydrateFromStorage() {
      const persistedState = await loadDokuState()
      if (!persistedState || persistedState.schemaVersion !== DOKU_SCHEMA_VERSION) {
        this.doku = resetProtocol()
        await this.persistToStorage()
        return
      }

      const hydratedProtocol = hydrateProtocol(persistedState.doku)
      if (!hydratedProtocol) {
        this.doku = resetProtocol()
        await this.persistToStorage()
        return
      }

      this.doku = hydratedProtocol
    },
    async persistToStorage() {
      await saveDokuState({
        schemaVersion: DOKU_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        doku: toRaw(this.doku),
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

      const requireSceneDetails: boolean = state.doku.course == ProtocolCourse.TRANSPORT
      const requireFlavors: boolean = state.doku.course == ProtocolCourse.TRANSPORT
      const requireABCDE: boolean = state.doku.course == ProtocolCourse.TRANSPORT || state.doku.course == ProtocolCourse.EINWEISUNG
      const requireSampler: boolean = state.doku.course == ProtocolCourse.TRANSPORT || state.doku.course == ProtocolCourse.EINWEISUNG
      const requireRedflags: boolean = state.doku.course == ProtocolCourse.TRANSPORT || state.doku.course == ProtocolCourse.EINWEISUNG

      const isCourseVerlegung: boolean = state.doku.course == ProtocolCourse.VERLEGUNG
      const isCourseEinweisung: boolean = state.doku.course == ProtocolCourse.EINWEISUNG
      const isPediatric: boolean = state.doku.ident.age?.totalYears <= 3

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

      const isTrauma: boolean = requireSceneDetails && (state.doku.flavors.trauma)

      const isCritical: boolean = state.doku.Xabcde.hasCriticalBleeding
        || !state.doku.xAbcde.isBreathing
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

      const verbosity: ProtocolVerbosity = state.doku.course !== ProtocolCourse.TRANSPORT || isCritical
        ? ProtocolVerbosity.HIGH
        : nothingToTreat
          ? ProtocolVerbosity.LOW
          : ProtocolVerbosity.NORMAL

      const isNonVerbal: boolean = state.doku.flavors.non_verbal
        || !state.doku.xAbcde.isBreathing
        || state.doku.xabcDe.avpu == 'bewusstlos'
        || state.doku.xabcDe.avpu == 'soporös'
        || state.doku.xabcDe.gcs.v < 4
        || (isPediatric && state.doku.xabcDe.zops.isPediatricNonVerbal)

      const isLowVigilant: boolean =
        (state.doku.xabcDe.gcsScore<14 || state.doku.xabcDe.avpu != 'wach') &&
        (!state.doku.xabcDe.psychBaseline && !state.doku.xabcDe.psychDementia)

      return {

        verbosity,
        isLow: verbosity == ProtocolVerbosity.LOW,
        isNormal: verbosity == ProtocolVerbosity.NORMAL,
        isHigh: verbosity == ProtocolVerbosity.HIGH,

        requireSceneDetails,
        requireFlavors,
        requireABCDE,
        requireSampler,
        requireRedflags,

        isCourseVerlegung,
        isCourseEinweisung,

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
        hasHeartIssue: state.doku.xabCde.chest.pain != 'keine' || state.doku.xabCde.chest.tenderness,
        hasAbdominalIssue: state.doku.xabcdE.abdominal.isAssessed && state.doku.xabcdE.abdominal.value.pain != 'keine',

        isTrauma,
        isPediatric,
        isGeriatric: state.doku.ident.age?.totalYears >= 65,

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
        ], true), this.context.isTrauma)

      }

      if (this.context.requireSampler)
      {

        // SAMPLE
        text += breakDoku(state.doku.sampler.symptoms.additionalSymptoms.value, true)
        text += breakDoku([
          state.doku.sampler.allergies.generateText(),
          state.doku.sampler.medication.generateText(),
        ], true)
        text += breakDoku(state.doku.sampler.pler.generateText(), true)
        text += breakDoku(state.doku.sampler.contacts.generateText(), true)

      }

      // TREATMENT
      text += breakDoku([
        state.doku.saamed.getBlock(),
        state.doku.redflags.getConsentBlock(),
      ], true)
      text += breakDoku(placeholder(state.doku.treatment.value, 'Maßnahmen'), true)
      text += textIf(breakDoku(state.doku.redflags.getRedflagBlock(), true), this.context.requireRedflags)

      return text.trim()

    },

  },
})
