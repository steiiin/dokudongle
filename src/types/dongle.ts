export interface Device {
  id: string
  name: string
}

export interface DongleConfig {
  name: string
  keyGapMs: number
}

export const DONGLE_NAME_PREFIX = 'DokuDongle-'
export const MAX_DONGLE_NAME_BYTES = 18
export const MIN_KEY_GAP_MS = 0
export const MAX_KEY_GAP_MS = 200
export const DEFAULT_KEY_GAP_MS = 30
export const KEY_GAP_STEP_MS = 10

export interface DeviceConnection {
  device: (Device | null),
  isConnecting: boolean,
  isConnected: boolean,
  lastError: string | null,
  isTransmitting: boolean,
  isSavingSettings: boolean,
  config: DongleConfig | null,
  configStatus: 'unavailable' | 'loading' | 'ready' | 'unsupported' | 'error',
  session: number,
  transmissionCurrent: number,
  transmissionLength: number,
  transmissionAbortController: AbortController | null,
}

export const ServiceUUID: string =  "00001888-0000-1000-8000-00805f9b34fb"
export const SendTextUUID: string = "00000881-0000-1000-8000-00805f9b34fb"
export const SendAckUUID: string =  "00000882-0000-1000-8000-00805f9b34fb"
export const ConfigUUID: string =  "00000883-0000-1000-8000-00805f9b34fb"
