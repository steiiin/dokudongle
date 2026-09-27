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

### USB device name

`npm run firmware:prepare` sets `build.usb_product="DokuDongle"` and
`build.usb_manufacturer="STEIIIN"` through Arduino CLI build properties. Both settings
are included in the build fingerprint and apply before USB enumeration. Linux
combines the manufacturer and product strings into the keyboard name
`STEIIIN DokuDongle`. Manual builds must supply the same properties to get the
same name.

The USB product name is always `DokuDongle`, independent of the configurable
Bluetooth name suffix. USB VID/PID, serial identity, and keyboard interfaces remain the
same. Bootloader/recovery mode retains its own device names.

After installing the prepared firmware, unplug and reconnect the dongle. On
Linux, verify `lsusb -v -d 2886:8044` reports `iProduct` as `DokuDongle` and
manufacturer `STEIIIN`, and `/proc/bus/input/devices` contains
`N: Name="STEIIIN DokuDongle"`. KDE should display
**STEIIIN DokuDongle eingesteckt**. The ordinary `lsusb` summary can still show the vendor name from its numeric-ID database.
Reconnect over Bluetooth and send text to verify keyboard operation as well.

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
   adafruit-nrfutil dfu serial -p /dev/ttyACM0 -b 115200 --singlebank --package public/firmware/<packageFilename-from-manifest>
   ```

4. Connect from Android and verify the displayed version and existing settings.
   Keep the initial ZIP for recovery. Do not erase the whole chip; that also
   removes the saved dongle configuration.

If an interrupted update leaves the dongle in its bootloader, choose **Update
erneut versuchen** in the Android app. Recovery first checks the original
application address, then scans the legacy DFU service for up to 15 seconds at
that address or the address with its final byte incremented (FF wraps to 00).
It validates the DFU GATT service, restarts the application-only transfer from
the beginning, and verifies the installed version at the original address.
Recovery information survives closing the dialog and restarting the app or
phone. The currently bundled firmware must not be older than the interrupted
target. No automatic retry loop runs after reopening the app.

Without saved history, use **Dongle wiederherstellen** in Android Settings,
which is available without a normal dongle connection. Unplug/replug the affected
dongle before scanning, then explicitly select its `XIAO_DFU` entry and Bluetooth
address. Selection starts the update. This flow supports the pinned OTAFIX
bootloader: on a cold start without a valid application it advertises at the
application address with the final byte incremented. Other bootloaders and board
types are not supported. The shared name alone does not identify a particular
dongle or authenticate its hardware; only select your previously provisioned XIAO.

Keep the dongle powered and the phone nearby. Bluetooth interruptions can be
retried while DFU remains available. If no supported DFU device is reachable,
double-reset and repeat the USB application flash. There is no automatic rollback
guarantee. See the [bootloader instructions](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX)
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
`finish` (post-restart verification), `clearRecovery`, `dismiss`, and `status` events. Native status
includes job ID, original application address, optional DFU transport address, a
persisted recovery record, target version, phase, progress, and a
monotonic update timestamp. A foreground service owns transfer independently of
the WebView; persisted status detects interrupted processes. App resume restores
that status. PRN is 8, high-MTU negotiation is disabled, and one native retry is
allowed. Legacy DFU retries start over.

Legacy bootloader scanning is forced because OTAFIX can advertise at an
incremented Bluetooth address after entering DFU. Reconnecting directly to the
application address can time out before transfer starts. Nordic's default
selector accepts only the original address or its incremented bootloader address;
it does not select a dongle by the shared `XIAO_DFU` name. This follows the
[OTAFIX recommendation to enable force scanning](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX#recommended-ota-dfu-settings).
