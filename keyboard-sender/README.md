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

## Bluetooth firmware updates (Android)

Firmware is bundled with the app; no server or internet connection is needed to
install it. Settings compares the connected dongle's integer version with the
bundled version. Installation enters the Nordic legacy DFU bootloader, transfers
an **application-only** ZIP, restarts, and reconnects to the original Bluetooth
address. The app reports success only after reading the exact expected version.
The browser can show version information but cannot install firmware.

### Prepare an app release

Use Node.js 22 or newer for Capacitor. Install Arduino CLI (verified with 1.3.1),
Python 3, and `adafruit-nrfutil`. Install
the pinned Seeed core using its package index:

```sh
arduino-cli core update-index --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
arduino-cli core install Seeeduino:nrf52@1.1.13 --additional-urls https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
pipx install adafruit-nrfutil
npm run firmware:prepare
npm run build
npx cap sync android
```

Alternatively run the VSCode task **Prepare dongle firmware**. `ARDUINO_CLI` and
`ADAFRUIT_NRFUTIL` may specify executable paths. Use JDK 21 **with javac** for the
Android Gradle build. No bootloader installation or flashing is performed by the
preparation task.

#### Toolchain paths and troubleshooting

On Linux, keep the extracted Arduino CLI executable in a persistent directory,
not `/tmp`. For example, replace the source path below with your downloaded
Arduino CLI executable:

```sh
mkdir -p "$HOME/.local/bin"
install -m 0755 /path/to/extracted/arduino-cli "$HOME/.local/bin/arduino-cli"
export PATH="$HOME/.local/bin:$PATH"
arduino-cli version
adafruit-nrfutil version
python3 --version
```

If `~/.local/bin` is not already on your login `PATH`, add the export to your
shell startup configuration. Fully close and reopen VSCode after changing its
inherited environment. In a VSCode terminal, `command -v arduino-cli` should
resolve to the persistent executable before running **Prepare dongle firmware**.
A `spawnSync arduino-cli ENOENT` error means the tool could not be launched,
usually because it is missing from that environment's `PATH`.

You can also specify executable paths for an individual invocation:

```sh
ARDUINO_CLI="$HOME/.local/bin/arduino-cli" \
ADAFRUIT_NRFUTIL="$HOME/.local/bin/adafruit-nrfutil" \
npm run firmware:prepare
```

For task-specific overrides, set `ARDUINO_CLI` and `ADAFRUIT_NRFUTIL` in the
VSCode task's `options.env` using absolute executable paths. These values are
paths, not shell commands: do not include arguments or a literal `~`.

Before a rebuild, preparation checks all three tools. Missing-tool errors name
the attempted executable and explain how to install or configure it. For
permission errors, check executable permissions and directory access. A tool
that starts but fails retains its own diagnostics; fix that reported error
before retrying. Preparation does not install tools automatically. Unchanged,
valid bundled firmware skips these checks, and `firmware:check` never requires
the firmware toolchain.

`firmware-version.json` records the last successful build. The task hashes the
sketch and fingerprints all sketch files, the pinned board configuration, and the
build script. Changed inputs increment the version once; unchanged inputs do
nothing. A missing/corrupt artifact rebuilds the existing version. The same
version is compiled into the sketch and encoded in the DFU init packet.
Generated version definitions do not modify the sketch.

Commit the manifest and `public/firmware/` together with the source changes.
Compilation/package validation happens before publication; errors retain the
previous package. An interrupted publication is detected by `firmware:check`.
The npm app build runs this check and refuses stale or corrupt artifacts without
requiring the firmware toolchain. After an interrupted preparation, remove
`.firmware-build.lock` only when no preparation process remains, then rerun it.
Prepare firmware releases serially on the release branch; resolve version
manifest conflicts by preparing a new version above the last released version.

### One-time USB setup and recovery

Existing sketches do not expose a version or enabled DFU service. They require
USB provisioning before the app offers updates. Use the XIAO bootloader from
[OTAFIX 2.3 / BP1.4](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases/tag/0.9.2-OTAFIX2.3-BP1.4),
keeping SoftDevice S140 7.3.0. This is a hardware-qualified deployment
prerequisite, not something the Android app updates.

1. Double-press reset to expose the UF2 drive. Read `INFO_UF2.TXT` and record the
   Board-ID. Some non-Sense boards ship with the Sense bootloader: select the
   **matching installed variant**, not just the product label.
2. Download that variant's `update-..._nosd.uf2` from the pinned release and verify
   its published checksum. Copy it to the UF2 drive. The `nosd` updater retains
   the installed SoftDevice; do not substitute a combined image for another board.
3. Prepare version 1, re-enter USB bootloader mode, and flash the generated
   application package to the dongle's actual serial port:

   ```sh
   adafruit-nrfutil dfu serial --package public/firmware/<packageFilename-from-manifest> -p <dongle-port> -b 115200 --singlebank
   ```

4. Connect from Android and verify the displayed version and existing settings.
   Keep the initial ZIP for recovery. Do not erase the whole chip; that also
   removes the saved dongle configuration.

If an interrupted update leaves the dongle in its bootloader, the app does not
pick a device by the shared `XIAO_DFU` name. Try reconnecting to the original
application; if unavailable, double-reset and repeat the USB application flash.
There is no automatic rollback guarantee. See the
[bootloader instructions](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX)
for board identification and recovery.

### Firmware information and update interface

Service `00001888-0000-1000-8000-00805f9b34fb` exposes read-only characteristic
`00000884-0000-1000-8000-00805f9b34fb`:

| Bytes | Value |
| --- | --- |
| 0 | Protocol revision: 1 |
| 1 | Target: 1 = XIAO nRF52840 |
| 2–5 | Firmware version, uint32 little-endian, 1–4294967294 |

The persisted configuration's `CONFIG_VERSION` remains independent. The
Bluefruit DFU service uses Nordic legacy UUIDs (`00001530-1212-efde-1523-785feabcd123`).
The local Capacitor `DongleFirmware` plugin provides `start`, `getStatus`,
`finish` (post-restart verification), `dismiss`, and `status` events. Native status
includes job ID, original device address, target version, phase, progress, and a
monotonic update timestamp. A foreground service owns transfer independently of
the WebView; persisted status detects interrupted processes. App resume restores
that status. PRN is 8, high-MTU negotiation is disabled, and one native retry is
allowed. Legacy DFU retries start over.

### Verification and release gate

```sh
npm run test:firmware-build
python3 tests/firmware/test_xiao_config.py
npx vitest run tests/unit/dongleFirmware.spec.ts src/store/doku.bluetooth.spec.ts
npm run typecheck
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Before distributing an OTA-enabled app, test on the actual provisioned hardware:

- Prepare version 2 after a sketch change and update 1 → 2 while plugged into a
  computer's USB port. Verify automatic restart, version readback, keyboard
  output, saved name, and saved key gap after unplugging and reconnecting.
- Interrupt Bluetooth and power during transfer. Verify bounded error handling,
  retry behavior, and USB recovery. Repeat with the phone backgrounded, screen
  locked, WebView recreated, and app process terminated.
- Place two dongles nearby and confirm only the selected device is updated;
  test both the default and a customized dongle name.
- Test denied Bluetooth/notification permissions, Bluetooth disabled, corrupt
  assets, same/newer device versions, legacy firmware, and a wrong target ID.

Automated tests do not qualify bootloader compatibility, flash preservation,
physical USB behavior, or BLE radio reliability. Keep OTA distribution gated on
these hardware checks.
