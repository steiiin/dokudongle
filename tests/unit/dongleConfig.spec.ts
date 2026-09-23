import { describe, expect, test } from 'vitest'
import { decodeDongleConfig, encodeDongleConfig } from '@/utils/dongle-config'

describe('dongle configuration wire format', () => {
  test.each([0, 30, 200])('round trips a maximum length name and %i ms within one BLE packet', keyGapMs => {
    const config = { name: 'Ab012345678901234Z', keyGapMs }
    const data = encodeDongleConfig(config)
    expect(data.byteLength).toBe(20)
    expect(data.getUint8(0)).toBe(keyGapMs)
    expect(data.getUint8(1)).toBe(0)
    expect(decodeDongleConfig(data)).toEqual(config)
  })

  test('decodes a DataView at an offset without including surrounding bytes', () => {
    const bytes = new Uint8Array([255, 30, 0, 65, 49, 255])
    expect(decodeDongleConfig(new DataView(bytes.buffer, 1, 4))).toEqual({ name: 'A1', keyGapMs: 30 })
  })

  test.each(['', 'A'.repeat(19), 'Ä', 'A B', 'A-B', 'A_B', 'A\0B', 'A\n'])('rejects invalid name %j', name => {
    expect(() => encodeDongleConfig({ name, keyGapMs: 30 })).toThrow()
  })

  test.each([-1, 201, 65536, 1.5, NaN, Infinity])('rejects invalid gap %s', keyGapMs => {
    expect(() => encodeDongleConfig({ name: 'Valid', keyGapMs })).toThrow()
  })

  test.each([
    [], [30], [30, 0], [0, 30, 65], [201, 0, 65], [30, 0, 0], [30, 0, 255],
    [30, 0, 65, 0], [30, 0, ...Array(19).fill(65)],
  ].map(bytes => ({ bytes })))('rejects malformed response $bytes', ({ bytes }) => {
    expect(() => decodeDongleConfig(new DataView(new Uint8Array(bytes).buffer))).toThrow()
  })
})
