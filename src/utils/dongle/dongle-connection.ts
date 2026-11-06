import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { withDongleTimeout } from './dongle-config'

// bluetooth-le 8.1.3: Das Standardzeitlimit beträgt für connect 10 s, für disconnect/discovery 5 s.
const NATIVE_OPERATION_TIMEOUT = 5000

export class DongleDeadlineError extends Error {
  constructor() { super('Zeitüberschreitung bei der Dongle-Verbindung.') }
}

export function dongleConnectionTimeout() {
  return Capacitor.getPlatform() === 'android' ? 10000 : 3000
}

export function dongleTimeRemaining(deadline: number, maximum: number, minimum = 1) {
  const remaining = Math.min(maximum, deadline - Date.now())
  if (remaining < minimum) throw new DongleDeadlineError()
  return remaining
}

// Android verwaltet das Zeitlimit und schließt GATT, bevor connect fehlschlägt. Ein konkurrierender
// JS-Timer lässt native Vorgänge in der Warteschlange von BleClient zurück, nachdem der Aufrufer beendet wurde.
// Der Webadapter benötigt das JS-Zeitlimit, da er selbst keine Zeitlimits erzwingt.
export function awaitBleOperation<T>(operation: Promise<T>, timeout: number): Promise<T> {
  return Capacitor.getPlatform() === 'android' ? operation : withDongleTimeout(operation, timeout)
}

export async function disconnectDongle(deviceId: string, options: {
  strict?: boolean
  deadline?: number
} = {}) {
  const android = Capacitor.getPlatform() === 'android'
  const timeout = dongleTimeRemaining(options.deadline ?? Infinity,
    android ? NATIVE_OPERATION_TIMEOUT : 3000, android ? NATIVE_OPERATION_TIMEOUT : 1)
  try {
    await awaitBleOperation(BleClient.disconnect(deviceId), timeout)
  } catch (error) {
    // Nur bei einem nachweislich bereits getrennten Android-Ziel ist ein erneuter Versuch sicher.
    // Insbesondere bei der Übergabe einer aktiven Verbindung an DFU niemals einen Fehler übergehen.
    if (!android || options.strict || !(error instanceof Error)
      || !/^Disconnection timeout\.?$/.test(error.message)) throw error
    const connected = await BleClient.getConnectedDevices([])
    if (connected.some(device => device.deviceId.toLowerCase() === deviceId.toLowerCase())) throw error
    // Der nächste native connect-Aufruf schließt das veraltete Handle, bevor eine neue GATT-Verbindung geöffnet wird.
  }
}

export async function discoverDongleServices(deviceId: string, deadline = Infinity) {
  const timeout = dongleTimeRemaining(deadline, NATIVE_OPERATION_TIMEOUT, NATIVE_OPERATION_TIMEOUT)
  await awaitBleOperation(BleClient.discoverServices(deviceId), timeout)
}
