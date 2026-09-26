import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { FirmwareUpdateStatus } from '@/types/firmware'

interface DongleFirmwarePlugin {
  start(options: { deviceId: string; deviceName: string; version: number }): Promise<FirmwareUpdateStatus>
  getStatus(): Promise<FirmwareUpdateStatus>
  finish(options: { jobId: string; verified: boolean }): Promise<FirmwareUpdateStatus>
  dismiss(options: { jobId: string }): Promise<void>
  addListener(event: 'status', listener: (status: FirmwareUpdateStatus) => void): Promise<PluginListenerHandle>
}
export const DongleFirmware = registerPlugin<DongleFirmwarePlugin>('DongleFirmware')
