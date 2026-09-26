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

/** Nordic changes only the last address byte, without carrying into the prefix. */
export function offsetDfuAddress(address: string, offset: 1 | -1): string {
  if (!/^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(address)) throw new Error('Ungültige Bluetooth-Adresse.')
  const normalized = address.toUpperCase()
  return normalized.slice(0, 15) + ((parseInt(normalized.slice(15), 16) + offset + 256) & 255).toString(16).padStart(2, '0').toUpperCase()
}
export function matchesDfuAddress(applicationAddress: string, candidate: string): boolean {
  return [applicationAddress.toUpperCase(), offsetDfuAddress(applicationAddress, 1)].includes(candidate.toUpperCase())
}
