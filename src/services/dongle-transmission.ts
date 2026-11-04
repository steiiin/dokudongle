import { BleClient } from '@capacitor-community/bluetooth-le'
import { watch } from 'vue'
import { SendAckUUID, SendTextUUID, ServiceUUID, type DeviceConnection } from '@/types/dongle'
import { awaitBleOperation, disconnectDongle } from '@/utils/dongle-connection'
import { withDongleTimeout } from '@/utils/dongle-config'

const ACK_TIMEOUT_MS = 10000
const RETRY_DELAY_MS = 2000
const BLE_TIMEOUT_MS = 5000
const EVENTS_PER_PACKET = 10

// Jeder Wartevorgang verwaltet seinen eigenen Listener und Timer, auch bei Unterbrechung durch Abbruch.
function interruptibleWait(signal: AbortSignal, subscribe: (done: () => void) => () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    const onAbort = () => { cleanup(); reject(signal.reason) }
    const cleanup = () => {
      unsubscribe()
      signal.removeEventListener('abort', onAbort)
    }
    const unsubscribe = subscribe(() => { cleanup(); resolve() })
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

interface TransmissionOptions {
  connection: DeviceConnection
  deviceId: string
  events: [number, number][]
  signal: AbortSignal
  openConnection: () => Promise<void>
  refreshConnection: () => Promise<void>
  invalidateConnection: () => void
}

/** Ein Sendevorgang im Arbeitsspeicher mit einem neuen Benachrichtigungsabonnement für jede BLE-Verbindung. */
export async function transmitDongleEvents({
  connection, deviceId, events, signal, openConnection, refreshConnection, invalidateConnection,
}: TransmissionOptions): Promise<void> {
  let reconnect = false
  let retryDelay = false

  while (true) {
    signal.throwIfAborted()
    if (retryDelay) {
      await interruptibleWait(signal, done => {
        const timer = setTimeout(done, RETRY_DELAY_MS)
        return () => clearTimeout(timer)
      })
    }

    let notificationsAttempted = false
    let linkReady = false
    let stopWatching: (() => void) | undefined
    const link = new AbortController()
    const cancelLink = () => link.abort(signal.reason)
    signal.addEventListener('abort', cancelLink, { once: true })
    let resolveAck: (() => void) | null = null

    try {
      signal.throwIfAborted()
      if (reconnect) {
        connection.isConnecting = true
        await disconnectDongle(deviceId)
        signal.throwIfAborted()
        // Native Verbindungsversuche abschließen lassen, bevor die Kontrolle über BLE freigegeben wird.
        await openConnection()
        signal.throwIfAborted()
      }

      const session = connection.session
      const isCurrent = () => !signal.aborted && connection.isConnected
        && connection.device?.id === deviceId && connection.session === session
      stopWatching = watch(
        () => [connection.isConnected, connection.session, connection.device?.id],
        () => { if (!isCurrent()) link.abort(new Error('Dongle-Verbindung unterbrochen.')) },
        { flush: 'sync' },
      )
      if (!isCurrent()) throw new Error('Dongle nicht verbunden.')
      if (reconnect) await refreshConnection()
      signal.throwIfAborted()
      link.signal.throwIfAborted()

      notificationsAttempted = true
      await awaitBleOperation(BleClient.startNotifications(deviceId, ServiceUUID, SendAckUUID, () => {
        if (isCurrent() && !link.signal.aborted) resolveAck?.()
      }, { timeout: BLE_TIMEOUT_MS }), BLE_TIMEOUT_MS)
      signal.throwIfAborted()
      link.signal.throwIfAborted()
      connection.isConnecting = false
      connection.transmissionWaitingForDongle = false
      if (reconnect) ++connection.transmissionReconnectCount
      linkReady = true
      retryDelay = false

      const waitForResume = async () => {
        while (connection.transmissionPaused) {
          await interruptibleWait(link.signal, done => watch(
            () => connection.transmissionPaused, () => done(), { flush: 'sync' },
          ))
        }
        signal.throwIfAborted()
        link.signal.throwIfAborted()
      }

      const sendPacket = async (packet: [number, number][], advances: number) => {
        signal.throwIfAborted()
        link.signal.throwIfAborted()
        const payload = new DataView(new ArrayBuffer(packet.length * 2))
        packet.forEach(([key, modifier], index) => {
          payload.setUint8(index * 2, key)
          payload.setUint8(index * 2 + 1, modifier)
        })
        connection.transmissionBlockPending = true
        const ack = interruptibleWait(link.signal, done => {
          const timer = setTimeout(() => link.abort(new Error('Dongle-Bestätigung ausgeblieben.')), ACK_TIMEOUT_MS)
          resolveAck = () => {
            // Bei Eingang der Benachrichtigung bestätigen: Ein Verbindungsabbruch unmittelbar nach einem ACK
            // darf nicht dazu führen, dass ein bereits bestätigter Block erneut eingegeben wird.
            connection.transmissionCurrent += advances
            done()
          }
          return () => { clearTimeout(timer); resolveAck = null }
        })
        try {
          await Promise.all([
            ack,
            awaitBleOperation(BleClient.write(deviceId, ServiceUUID, SendTextUUID, payload,
              { timeout: BLE_TIMEOUT_MS }), BLE_TIMEOUT_MS),
          ])
        } finally {
          // Im Fehlerfall beendet die umgebende Verbindungsbereinigung den ACK-Timer.
          resolveAck = null
          connection.transmissionBlockPending = false
        }
      }

      while (connection.transmissionCurrent < events.length) {
        await waitForResume()
        const packet = events.slice(connection.transmissionCurrent, connection.transmissionCurrent + EVENTS_PER_PACKET)
        await sendPacket(packet, packet.length)
      }
      await waitForResume()
      await sendPacket([[0, 0]], 0)
      signal.throwIfAborted()
      return
    } catch (error) {
      if (signal.aborted) throw signal.reason
      connection.transmissionWaitingForDongle = true
      // Vor der Bereinigung ungültig machen, damit alte Rückrufe bei Verbindungsabbrüchen und ACKs wirkungslos bleiben.
      invalidateConnection()
      retryDelay = reconnect && !linkReady
      reconnect = true
      console.warn('Dongle-Übertragung pausiert; Verbindung wird wiederhergestellt.', error)
    } finally {
      resolveAck = null
      stopWatching?.()
      link.abort()
      signal.removeEventListener('abort', cancelLink)
      connection.isConnecting = false
      connection.transmissionBlockPending = false
      if (notificationsAttempted) {
        try {
          await withDongleTimeout(BleClient.stopNotifications(deviceId, ServiceUUID, SendAckUUID), BLE_TIMEOUT_MS)
        } catch { /* Die alte Verbindung ist möglicherweise bereits getrennt. */ }
      }
      if (signal.aborted && reconnect) {
        // Ein nach dem Abbruch abgeschlossener Verbindungsaufbau darf den Sendevorgang niemals erneut starten.
        invalidateConnection()
        try { await disconnectDongle(deviceId) } catch { /* Bereinigung, soweit möglich. */ }
      }
    }
  }
}
