import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { defineStore } from 'pinia';

import { textToHidEvents } from '@/utils/keymap-german';
import { Device, DeviceConnection, ServiceUUID } from '@/types/dongle';
import { Protocol, ProtocolCourse, resetProtocol } from '@/types/protocol';
import { breakDoku, multiline } from '@/utils/text';

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

      ], true)

      return text

    },

  },
})