import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { withDongleTimeout } from './dongle-config'

// bluetooth-le 8.1.3: connect defaults to 10s; disconnect/discovery to 5s.
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

// Android owns the timeout and closes GATT before rejecting connect. Racing it
// with a JS timer leaves native work in BleClient's queue after the caller exits.
// The web adapter needs the JS deadline because it does not enforce timeouts.
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
    // Only a confirmed, already-disconnected Android target is safe to retry.
    // In particular, never waive a failure while handing an active link to DFU.
    if (!android || options.strict || !(error instanceof Error)
      || !/^Disconnection timeout\.?$/.test(error.message)) throw error
    const connected = await BleClient.getConnectedDevices([])
    if (connected.some(device => device.deviceId.toLowerCase() === deviceId.toLowerCase())) throw error
    // The next native connect closes the stale handle before opening fresh GATT.
  }
}

export async function discoverDongleServices(deviceId: string, deadline = Infinity) {
  const timeout = dongleTimeRemaining(deadline, NATIVE_OPERATION_TIMEOUT, NATIVE_OPERATION_TIMEOUT)
  await awaitBleOperation(BleClient.discoverServices(deviceId), timeout)
}
