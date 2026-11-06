# DokuDongle

Ionic-/Vue-App mit Android-Anbindung zur Dokumentation und Übertragung an einen Bluetooth-USB-Dongle.

## Verzeichnisübersicht

| Verzeichnis | Inhalt |
| --- | --- |
| `src/` | App-Code; Komponenten nach Aufgabe, Ansichten nach Dokumentation und Einstellungen gruppiert |
| `src/assets/` | Beim Build eingebundene Wörterbücher und Textassistenz-Vorgaben |
| `hardware/keyboard-case/` | CAD-Quelle des Dongle-Gehäuses |
| `hardware/keyboard-sender/` | XIAO- und Arduino-Firmware, Bootloader und Hardware-Anleitungen |
| `resources/` | Logo und Splashscreen als Vorlagen für die native Asset-Erzeugung |
| `public/firmware/` | Mit der App ausgeliefertes Firmware-Paket und Laufzeitmanifest |
| `android/` | Natives Capacitor-Projekt und Android-Plugins |
| `scripts/` | Firmware-Build und Dongle-Initialisierung |
| `tests/` | Unit-, Browser-, Build- und Firmwaretests |

`firmware-version.json` hält den Build-Stand fest; `public/firmware/manifest.json` ist dessen ausgelieferte Kopie. Beide werden durch das Firmware-Skript gemeinsam gepflegt. Generierte Webdateien liegen in `dist/`; Browser-Testausgaben werden nicht versioniert.

## Entwicklung

Node.js 22 oder neuer verwenden und Abhängigkeiten mit `npm ci` installieren.

```sh
npm run dev
npm run typecheck
npm run lint
npm run test:unit -- --run
npm run test:firmware-build
npm run test:dongle-init
python3 tests/firmware/test_xiao_config.py
```

Für `npm run test:e2e` muss der Entwicklungsserver unter `http://localhost:5173` laufen. Cypress prüft auch die HTML-Testseiten unter `tests/e2e/fixtures/`. Der Python-Firmwaretest benötigt zusätzlich `g++`.

## Firmware und Android

Toolchain, Vorbereitung und Geräteinitialisierung sind in der [Firmware-Anleitung](hardware/keyboard-sender/README.md) beschrieben. Firmware wird offline mit der App ausgeliefert. Der Android-Build benötigt ein vollständiges JDK 21; dafür kann `JAVA_HOME` auf die mit Android Studio gelieferte JBR zeigen. Eine reine Java-Laufzeit ohne `javac` genügt nicht.

```sh
npm run firmware:prepare
npm run firmware:check
npm run build
npx cap sync android
cd android
./gradlew assembleDebug testDebugUnitTest
```

`firmware:prepare` aktualisiert Paket und Manifeste zusammen. Auch Änderungen an den Quellpfaden oder am Build-Skript ändern den Fingerprint und können eine neue Firmware-Version auslösen. Pakete und Prüfsummen nicht manuell anpassen.

Grafikvorlagen in `resources/` werden mit `npx capacitor-assets generate --android` verarbeitet. Sie gehören nicht in `public/`, da dort Dateien unverändert mit der App ausgeliefert werden.
