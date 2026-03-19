import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { defineStore, storeToRefs } from 'pinia';

import { textToHidEvents } from '@/utils/keymap-german';
import { Device, DeviceConnection, ServiceUUID } from '@/types/dongle';
import { Protocol, ProtocolContext, ProtocolCourse, ProtocolVerbosity, resetProtocol } from '@/types/protocol';
import { breakDoku, multiline, placeholder } from '@/utils/text';
import { textIf } from '@/utils/filter';

export const useDokuStore = defineStore('doku', {
  state: () => ({

    initialized: false,
    connection: {
      device: null,
      isConnecting: false,
      isConnected: false,
      isTransmitting: false,
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

      const requireSceneDetails: boolean = state.doku.course == ProtocolCourse.TRANSPORT || state.doku.course == ProtocolCourse.NEF_VOR_ORT

      const isPediatric: boolean = state.doku.ident.age.totalYears <= 3

      const nothingToTreat: boolean = (
        !state.doku.Xabcde.hasCriticalBleeding
        && !state.doku.xAbcde.needTreatment
        && !state.doku.xaBcde.needTreatment
        && !state.doku.xabCde.needTreatment
        && !state.doku.xabcDe.needTreatment
        && !state.doku.xabcdE.needTreatment
        // TODO: STU
      )

      const gcs: number = state.doku.xabcDe.gcs.score
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

        isTrauma,
        isPediatric,
        isGeriatric: state.doku.ident.age.totalYears >= 65,

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
        state.doku.setting.generateText(),
        placeholder(state.doku.situation.value, 'Situation'),
      ], true)

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

      // SAMPLE
      debugger
      text += breakDoku([
        state.doku.sampler.allergies.generateText(),
        state.doku.sampler.medication.generateText(),
        state.doku.sampler.pler.generateText(),
        state.doku.sampler.contacts.generateText(),
      ], true)

      // TREATMENT
      text += breakDoku([
        state.doku.treatment.value,
        state.doku.redflags.getBlock(),
        state.doku.consent.getBlock(),
      ], true)

      return text.trim()

    },

  },
})