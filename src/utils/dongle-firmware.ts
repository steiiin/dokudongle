import type { FirmwareInfo, FirmwareManifest } from '@/types/firmware'

export function decodeFirmwareInfo(data: DataView): FirmwareInfo {
  if (data.byteLength !== 6) throw new Error('Ungültige Firmware-Information.')
  const info = { protocolRevision: data.getUint8(0), targetId: data.getUint8(1), version: data.getUint32(2, true) }
  if (info.version < 1 || info.version > 0xfffffffe) throw new Error('Ungültige Firmware-Version.')
  return info
}
export function isCompatibleFirmware(info: FirmwareInfo): boolean {
  return info.protocolRevision === 1 && info.targetId === 1
}
export function updateAvailable(info: FirmwareInfo | null, manifest: FirmwareManifest | null): boolean {
  return !!info && !!manifest && isCompatibleFirmware(info) && info.version < manifest.version
}
export function parseFirmwareManifest(value: unknown): FirmwareManifest {
  const manifest = value as FirmwareManifest | null
  if (!manifest || !isCompatibleFirmware(manifest) || manifest.target !== 'xiao-nrf52840'
    || !Number.isInteger(manifest.version) || manifest.version < 1 || manifest.version > 0xfffffffe
    || !/^dongle-v\d+-[a-f0-9]{16}\.zip$/.test(manifest.packageFilename)
    || ![manifest.packageSha256, manifest.sketchSha256, manifest.buildFingerprint].every(hash => /^[a-f0-9]{64}$/.test(hash))) {
    throw new Error('Die mitgelieferte Dongle-Firmware ist ungültig.')
  }
  return manifest
}
