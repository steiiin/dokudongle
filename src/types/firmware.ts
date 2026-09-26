export const FirmwareUUID = '00000884-0000-1000-8000-00805f9b34fb'
export const DfuUUID = '00001530-1212-efde-1523-785feabcd123'

export interface FirmwareInfo { protocolRevision: number; targetId: number; version: number }
export interface FirmwareManifest extends FirmwareInfo {
  target: 'xiao-nrf52840'
  sketchSha256: string
  buildFingerprint: string
  packageFilename: string
  packageSha256: string
}
export type UpdatePhase = 'idle' | 'searching' | 'preparing' | 'transferring' | 'restarting' | 'transferred' | 'verifying' | 'done' | 'error'
export interface FirmwareRecovery {
  jobId: string
  deviceId: string
  deviceName: string
  version: number
  dfuDeviceId?: string
}
export interface FirmwareUpdateStatus {
  phase: UpdatePhase
  updatedAt: number
  jobId?: string
  deviceId?: string
  deviceName?: string
  version?: number
  progress?: number
  error?: string
  dfuDeviceId?: string
  recovery?: FirmwareRecovery
}
