import { MAX_DONGLE_NAME_BYTES, MIN_KEY_GAP_MS, MAX_KEY_GAP_MS, type DongleConfig } from '@/types/dongle'

export function isValidDongleConfig(config: DongleConfig): boolean {
  return /^[A-Za-z0-9]+$/.test(config.name)
    && config.name.length <= MAX_DONGLE_NAME_BYTES
    && Number.isInteger(config.keyGapMs)
    && config.keyGapMs >= MIN_KEY_GAP_MS
    && config.keyGapMs <= MAX_KEY_GAP_MS
}

// Shared BLE wire format: uint16 little-endian gap, then 1–18 ASCII name bytes.
export function encodeDongleConfig(config: DongleConfig): DataView {
  if (!isValidDongleConfig(config)) throw new Error('Ungültige Dongle-Einstellungen.')
  const data = new DataView(new ArrayBuffer(2 + config.name.length))
  data.setUint16(0, config.keyGapMs, true)
  for (let i = 0; i < config.name.length; i++) data.setUint8(i + 2, config.name.charCodeAt(i))
  return data
}

export function decodeDongleConfig(data: DataView): DongleConfig {
  if (data.byteLength < 3 || data.byteLength > MAX_DONGLE_NAME_BYTES + 2) {
    throw new Error('Ungültige Dongle-Konfiguration empfangen.')
  }
  let name = ''
  for (let i = 2; i < data.byteLength; i++) name += String.fromCharCode(data.getUint8(i))
  const config = { name, keyGapMs: data.getUint16(0, true) }
  if (!isValidDongleConfig(config)) throw new Error('Ungültige Dongle-Konfiguration empfangen.')
  return config
}

// The browser BLE adapter does not enforce timeouts for reads/writes.
export async function withDongleTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Zeitüberschreitung bei der Dongle-Verbindung.')), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
