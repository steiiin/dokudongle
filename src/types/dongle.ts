export interface Device {
  id: string;
  name: string;
}

export interface DeviceConnection {
  device: (Device | null),
  isConnecting: boolean,
  isConnected: boolean,
  isTransmitting: boolean,
  isRenaming: boolean,
  transmissionCurrent: number,
  transmissionLength: number,
  transmissionAbortController: AbortController | null,
}

export const ServiceUUID: string =  "00001888-0000-1000-8000-00805f9b34fb"
export const SendTextUUID: string = "00000881-0000-1000-8000-00805f9b34fb"
export const SendAckUUID: string =  "00000882-0000-1000-8000-00805f9b34fb"
export const SetNameUUID:string =   "00000883-0000-1000-8000-00805f9b34fb"