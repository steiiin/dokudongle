# XIAO dongle settings

`xiao_sketch.ino` exposes the configuration characteristic
`00000883-0000-1000-8000-00805f9b34fb` in service
`00001888-0000-1000-8000-00805f9b34fb` with READ and WRITE properties.

Both operations use the same payload, with no prefix or trailing NUL:

| Bytes | Value |
| --- | --- |
| 0–1 | `keyGapMs`, unsigned 16-bit little-endian, 0–200 ms |
| 2–19 | Name suffix, 1–18 ASCII letters or digits |

The total length is 3–20 bytes. For example, name `A1` and gap 30 ms are
`1e 00 41 31`. A write always replaces both settings. Invalid requests and
failed persistence leave the committed settings unchanged. Reads return the
committed configuration, including when an incoming write is still queued.

A successful update persists both fields and restarts the dongle. The app waits
for restart, reconnects to the same device, and verifies the configuration with
a read before reporting success. Older firmware has a write-only name
characteristic and therefore cannot use the new settings editor. Text sending
remains available on older firmware; `arduino_sketch.ino` retains its existing
protocol.

The key hold remains 8 ms. The configured gap is the wait after releasing a key,
not the hold duration. New configurations default to 30 ms. Persisted format v2
migrates v1 by retaining a valid name and setting this default: the gap field in
v1 is indistinguishable from padding in the original name-only structure.

## Verification

Run `python3 tests/firmware/test_xiao_config.py` from the repository root for
host regression checks (Python 3 and g++ required). They compile the production
configuration and key-processing functions against simulated storage, BLE, and
USB calls. They do not emulate the Nordic BLE stack or physical USB timing.

Build the XIAO sketch in its own sketch directory, separate from
`arduino_sketch.ino`, with Seeed nRF52 core 1.1.13, board `xiaonRF52840`, and
SoftDevice option `s140v6` (S140 7.3.0). The installed legacy `arduino-builder`
needs the core's precompiled nRFCrypto library explicitly added to
`compiler.libraries.ldflags`; modern Arduino tooling reads that library's
`library.properties`.

Physical checks after flashing:

- Connect, read settings, and save name-only, gap-only, and combined changes.
  Check the readback and advertised name after restart, then unplug and reconnect
  to confirm persistence.
- Upgrade a v1 device and verify its valid name survives with a 30 ms gap.
- Send repeated characters at 0, 30, and 200 ms and check for missing or stuck
  keys; disconnect during transmission and confirm pending keys are released.
- Send malformed settings and verify neither saved field changes and the dongle
  does not restart.
