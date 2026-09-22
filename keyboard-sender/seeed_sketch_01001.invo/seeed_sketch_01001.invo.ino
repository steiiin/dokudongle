/**
 * DokuDongle
 * Version: 1.0
 *
 * Heading levels: # section, ## subsection, ### function or setup step.
 */

// =============================================================================
// # Dependencies
// =============================================================================

#include <Arduino.h>
#include <bluefruit.h>
#include <Adafruit_TinyUSB.h>
#include <Adafruit_LittleFS.h>
#include <InternalFileSystem.h>
#include <FreeRTOS.h>
#include <queue.h>
#include <task.h>

// =============================================================================
// # Constants, types, and shared state
// =============================================================================

// -----------------------------------------------------------------------------
// ## 2.1 Device identity and request limits
// -----------------------------------------------------------------------------

static constexpr char BASE_NAME[] = "DokuDongle";
static constexpr size_t MAX_CUSTOM_NAME_BYTES = 18;
static constexpr size_t CHUNK_BYTES = 20;
static constexpr uint32_t USB_TIMEOUT_MS = 1500;
static constexpr uint32_t ACK_TIMEOUT_MS = 1000;
static constexpr uint32_t KEY_HOLD_MS = 8;
static constexpr uint32_t KEY_GAP_MS = 30;
static constexpr UBaseType_t QUEUE_DEPTH = 8;

// -----------------------------------------------------------------------------
// ## 2.2 Bluetooth services and characteristics
// -----------------------------------------------------------------------------

#define SERVICE_UUID  "00001888-0000-1000-8000-00805f9b34fb"
#define SENDTEXT_UUID "00000881-0000-1000-8000-00805f9b34fb"
#define SENDACK_UUID  "00000882-0000-1000-8000-00805f9b34fb"
#define SETNAME_UUID  "00000883-0000-1000-8000-00805f9b34fb"

BLEService writerService(SERVICE_UUID);
BLECharacteristic chSendChunk(SENDTEXT_UUID);
BLECharacteristic chSendAck(SENDACK_UUID);
BLECharacteristic chSetName(SETNAME_UUID);

// -----------------------------------------------------------------------------
// ## 2.3 USB keyboard
// -----------------------------------------------------------------------------

static uint8_t const HID_DESCRIPTOR[] = { TUD_HID_REPORT_DESC_KEYBOARD() };
Adafruit_USBD_HID usbKeyboard;

static bool releaseNeeded = false;

// -----------------------------------------------------------------------------
// ## 2.4 Persistent configuration
// -----------------------------------------------------------------------------

struct DeviceConfig {
  uint32_t magic;
  uint16_t version;
  char name[32];
};

static constexpr uint32_t CONFIG_MAGIC = 0x444F444F;
static constexpr uint16_t CONFIG_VERSION = 1;

static constexpr char CONFIG_PATH[] = "/dokudongle.cfg";
static constexpr char CONFIG_TEMP_PATH[] = "/dokudongle.tmp";

static DeviceConfig gConfig = {};
static char fullName[sizeof(BASE_NAME) + 1 + MAX_CUSTOM_NAME_BYTES];

// -----------------------------------------------------------------------------
// ## 2.5 Request queue and connection state
// -----------------------------------------------------------------------------

enum RequestKind : uint8_t { REQUEST_KEYS, REQUEST_NAME };

struct WriteRequest {
  uint32_t session;
  uint16_t connection;
  RequestKind kind;
  uint8_t length;
  uint8_t data[CHUNK_BYTES];
};

static QueueHandle_t requests = nullptr;
static volatile uint32_t currentSession = 0;
static volatile uint16_t currentConnection = BLE_CONN_HANDLE_INVALID;

// =============================================================================
// # Function declarations
// =============================================================================

// -----------------------------------------------------------------------------
// ## System diagnostics
// -----------------------------------------------------------------------------

static void fatalError(const char* message);

// -----------------------------------------------------------------------------
// ## Configuration and device name
// -----------------------------------------------------------------------------

static String truncateUtf8(const String& value, size_t maxBytes);
static bool validConfig(const DeviceConfig& config);
static bool readConfig(const char* path, DeviceConfig& config);
static bool saveConfig(const DeviceConfig& config);
static void loadOrCreateConfig();
static void processName(const WriteRequest& request);

// -----------------------------------------------------------------------------
// ## Bluetooth sessions and communication
// -----------------------------------------------------------------------------

static bool sameSession(const WriteRequest& request);
static void abortRequest(const WriteRequest& request, const char* reason);
static void connectedCallback(uint16_t connection);
static void disconnectedCallback(uint16_t connection, uint8_t reason);
static bool sendAck(const WriteRequest& request);
static void startAdvertising();

// -----------------------------------------------------------------------------
// ## Request queue and write callbacks
// -----------------------------------------------------------------------------

static void enqueueWrite(RequestKind kind, uint16_t connection,
                         const uint8_t* data, uint16_t length);
static void keysWritten(uint16_t connection, BLECharacteristic* characteristic,
                        uint8_t* data, uint16_t length);
static void nameWritten(uint16_t connection, BLECharacteristic* characteristic,
                        uint8_t* data, uint16_t length);

// -----------------------------------------------------------------------------
// ## USB keyboard and key processing
// -----------------------------------------------------------------------------

static bool isSafeKey(uint8_t key, uint8_t mod);
static bool waitForUsb(const WriteRequest* request);
static bool releaseKeys();
static bool sendRawKey(const WriteRequest& request, uint8_t key, uint8_t modifier);
static void processKeys(const WriteRequest& request);

// =============================================================================
// # System diagnostics
// =============================================================================

// -----------------------------------------------------------------------------
// ## Error handling
// -----------------------------------------------------------------------------

// ### fatalError() - Print an error and halt execution.
static void fatalError(const char* message) {
  Serial.println(message);
  while (true) {
    delay(1000);
  }
}

// =============================================================================
// # Configuration and device name
// =============================================================================

// -----------------------------------------------------------------------------
// ## Name formatting and configuration validation
// -----------------------------------------------------------------------------

// ### truncateUtf8() - Limit text length in bytes without splitting a UTF-8 character.
static String truncateUtf8(const String& value, size_t maxBytes) {
  if (value.length() <= maxBytes) return value;
  size_t cut = maxBytes;
  while (cut > 0 && (static_cast<uint8_t>(value[cut]) & 0xC0) == 0x80) --cut;
  return value.substring(0, cut);
}

// ### validConfig() - Check the configuration signature, version, and name length.
static bool validConfig(const DeviceConfig& config) {
  if (config.magic != CONFIG_MAGIC || config.version != CONFIG_VERSION) return false;
  const char* end = static_cast<const char*>(memchr(config.name, '\0', sizeof(config.name)));
  return end && end > config.name &&
         static_cast<size_t>(end - config.name) <= MAX_CUSTOM_NAME_BYTES;
}

// -----------------------------------------------------------------------------
// ## Persistent storage
// -----------------------------------------------------------------------------

// ### readConfig() - Read a configuration file and validate its contents.
static bool readConfig(const char* path, DeviceConfig& config) {
  Adafruit_LittleFS_Namespace::File file(InternalFS);
  if (!file.open(path, Adafruit_LittleFS_Namespace::FILE_O_READ)) return false;
  bool ok = file.size() == sizeof(config) &&
            file.read(&config, sizeof(config)) == static_cast<int>(sizeof(config));
  file.close();
  return ok && validConfig(config);
}

// ### saveConfig() - Write, verify, and atomically replace the saved configuration.
static bool saveConfig(const DeviceConfig& config) {
  if (!validConfig(config)) return false;
  if (InternalFS.exists(CONFIG_TEMP_PATH) && !InternalFS.remove(CONFIG_TEMP_PATH)) return false;

  Adafruit_LittleFS_Namespace::File file(InternalFS);
  if (!file.open(CONFIG_TEMP_PATH, Adafruit_LittleFS_Namespace::FILE_O_WRITE)) return false;
  size_t written = file.write(reinterpret_cast<const uint8_t*>(&config), sizeof(config));
  file.flush();
  file.close();
  if (written != sizeof(config)) return false;

  DeviceConfig verify = {};
  if (!readConfig(CONFIG_TEMP_PATH, verify) || memcmp(&verify, &config, sizeof(config)) != 0)
    return false;

  // LittleFS replaces the destination atomically; do not delete it first.
  return InternalFS.rename(CONFIG_TEMP_PATH, CONFIG_PATH);
}

// ### loadOrCreateConfig() - Load the saved configuration or create one with a device-specific name.
static void loadOrCreateConfig() {
  if (!InternalFS.begin()) fatalError("Cannot start InternalFS");
  if (readConfig(CONFIG_PATH, gConfig)) return;

  memset(&gConfig, 0, sizeof(gConfig));
  gConfig.magic = CONFIG_MAGIC;
  gConfig.version = CONFIG_VERSION;
  snprintf(gConfig.name, sizeof(gConfig.name), "sf%08lx",
           static_cast<unsigned long>(NRF_FICR->DEVICEID[0]));
  if (!saveConfig(gConfig)) fatalError("Cannot save initial device name");
}

// -----------------------------------------------------------------------------
// ## Name change requests
// -----------------------------------------------------------------------------

// ### processName() - Validate and save a requested name, then restart the device.
static void processName(const WriteRequest& request) {
  if (!sameSession(request)) return;
  // Reject embedded NULs instead of silently saving a different name.
  if (memchr(request.data, '\0', request.length)) return;
  char buffer[MAX_CUSTOM_NAME_BYTES + 1] = {};
  memcpy(buffer, request.data, request.length);
  String name(buffer);
  name.trim();
  if (name.length() == 0) return;
  name = truncateUtf8(name, MAX_CUSTOM_NAME_BYTES);

  DeviceConfig updated = {};
  updated.magic = CONFIG_MAGIC;
  updated.version = CONFIG_VERSION;
  name.toCharArray(updated.name, sizeof(updated.name));
  if (!saveConfig(updated)) {
    Serial.println("Could not save new device name");
    return;
  }
  gConfig = updated;
  releaseKeys();
  Bluefruit.Advertising.restartOnDisconnect(false);
  Bluefruit.Advertising.stop();
  if (sameSession(request)) Bluefruit.disconnect(request.connection);
  delay(500);
  NVIC_SystemReset();
}

// =============================================================================
// # Bluetooth sessions and communication
// =============================================================================

// -----------------------------------------------------------------------------
// ## Session validation and request cancellation
// -----------------------------------------------------------------------------

// ### sameSession() - Check that a request belongs to the current, connected BLE session.
static bool sameSession(const WriteRequest& request) {
  taskENTER_CRITICAL();
  bool same = request.session == currentSession &&
              request.connection == currentConnection;
  taskEXIT_CRITICAL();
  return same && Bluefruit.connected(request.connection);
}

// ### abortRequest() - Log a failure and disconnect the sender if its session is still active.
static void abortRequest(const WriteRequest& request, const char* reason) {
  Serial.println(reason);
  if (sameSession(request)) Bluefruit.disconnect(request.connection);
}

// -----------------------------------------------------------------------------
// ## Connection lifecycle callbacks
// -----------------------------------------------------------------------------

// ### connectedCallback() - Start a new BLE session and discard queued requests from older clients.
static void connectedCallback(uint16_t connection) {
  taskENTER_CRITICAL();
  ++currentSession;
  currentConnection = connection;
  taskEXIT_CRITICAL();
  // Callbacks run in Bluefruit's task context. Clear work from older clients.
  xQueueReset(requests);
}

// ### disconnectedCallback() - Invalidate the current session when its BLE connection closes.
static void disconnectedCallback(uint16_t connection, uint8_t reason) {
  (void)reason;
  taskENTER_CRITICAL();
  if (currentConnection == connection) {
    ++currentSession;
    currentConnection = BLE_CONN_HANDLE_INVALID;
  }
  taskEXIT_CRITICAL();
}

// -----------------------------------------------------------------------------
// ## Acknowledgments and advertising
// -----------------------------------------------------------------------------

// ### sendAck() - Retry the chunk acknowledgment notification until sent, timed out, or unavailable.
static bool sendAck(const WriteRequest& request) {
  const uint8_t done = 1;
  const uint32_t started = millis();
  do {
    if (!sameSession(request) || !chSendAck.notifyEnabled(request.connection)) return false;
    if (chSendAck.notify(request.connection, &done, sizeof(done))) return true;
    delay(2);
  } while (static_cast<uint32_t>(millis() - started) < ACK_TIMEOUT_MS);
  return false;
}

// ### startAdvertising() - Configure BLE advertising and retry starting it up to three times.
static void startAdvertising() {
  Bluefruit.Advertising.clearData();
  Bluefruit.ScanResponse.clearData();
  if (!Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE) ||
      !Bluefruit.Advertising.addService(writerService) ||
      !Bluefruit.ScanResponse.addName()) fatalError("Cannot configure advertising");

  // Full name (at most 29 bytes) fits in its own 31-byte scan response.
  // DFU is discoverable over GATT; keep the writer service in the advertisement.
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);
  Bluefruit.Advertising.setFastTimeout(30);
  for (uint8_t attempt = 0; attempt < 3; ++attempt) {
    if (Bluefruit.connected() || Bluefruit.Advertising.start(0)) return;
    delay(250);
  }
  fatalError("Cannot start BLE advertising");
}

// =============================================================================
// # Request queue and write callbacks
// =============================================================================

// -----------------------------------------------------------------------------
// ## Queue insertion
// -----------------------------------------------------------------------------

// ### enqueueWrite() - Validate and queue an incoming write; disconnect on oversize data or a full queue.
static void enqueueWrite(RequestKind kind, uint16_t connection,
                         const uint8_t* data, uint16_t length) {
  const size_t limit = kind == REQUEST_KEYS ? CHUNK_BYTES : MAX_CUSTOM_NAME_BYTES;
  if (length > limit) {
    Bluefruit.disconnect(connection);
    return;
  }
  WriteRequest request = {};
  taskENTER_CRITICAL();
  request.session = currentSession;
  bool active = connection == currentConnection;
  taskEXIT_CRITICAL();
  if (!active) return;
  request.connection = connection;
  request.kind = kind;
  request.length = static_cast<uint8_t>(length);
  if (length) memcpy(request.data, data, length);
  if (xQueueSend(requests, &request, 0) != pdPASS) {
    // No silent overwrite of an earlier, not-yet-typed chunk.
    Bluefruit.disconnect(connection);
  }
}

// -----------------------------------------------------------------------------
// ## Incoming BLE writes
// -----------------------------------------------------------------------------

// ### keysWritten() - Queue an incoming BLE write as a keyboard request.
static void keysWritten(uint16_t connection, BLECharacteristic* characteristic,
                        uint8_t* data, uint16_t length) {
  (void)characteristic;
  enqueueWrite(REQUEST_KEYS, connection, data, length);
}

// ### nameWritten() - Queue an incoming BLE write as a device name request.
static void nameWritten(uint16_t connection, BLECharacteristic* characteristic,
                        uint8_t* data, uint16_t length) {
  (void)characteristic;
  enqueueWrite(REQUEST_NAME, connection, data, length);
}

// =============================================================================
// # USB keyboard and key processing
// =============================================================================

// -----------------------------------------------------------------------------
// ## Allowed keys and modifiers
// -----------------------------------------------------------------------------

// ### isSafeKey() - Check whether a key code and modifier are allowed by the whitelist.
static bool isSafeKey(uint8_t key, uint8_t mod) {
  // Exactly the original whitelist: none, left Shift, or right Alt (AltGr).
  if (!(mod == 0x00 || mod == 0x02 || mod == 0x40)) return false;
  if (key >= 0x04 && key <= 0x1D) return true;
  if (key >= 0x1E && key <= 0x27) return true;
  switch (key) {
    case 0x28: // ENTER
    case 0x2C: // SPACE
    case 0x2D: // MINUS
    case 0x2E: // EQUAL
    case 0x2F: // LBRACKET
    case 0x30: // RBRACKET
    case 0x31: // BACKSLASH
    case 0x33: // SEMICOLON
    case 0x34: // APOSTROPHE
    case 0x35: // GRAVE
    case 0x36: // COMMA
    case 0x37: // DOT
    case 0x38: // SLASH
    case 0x64: // NONUS
      return true;
    default:
      return false;
  }
}

// -----------------------------------------------------------------------------
// ## USB readiness and key reports
// -----------------------------------------------------------------------------

// ### waitForUsb() - Wait for USB readiness with a timeout and optional BLE session validation.
static bool waitForUsb(const WriteRequest* request) {
  const uint32_t started = millis();
  while (!usbKeyboard.ready()) {
    if (request && !sameSession(*request)) return false;
    if (static_cast<uint32_t>(millis() - started) >= USB_TIMEOUT_MS) return false;
    delay(1);
  }
  return !request || sameSession(*request);
}

// ### releaseKeys() - Release any pending keys, even after the BLE sender disconnects.
static bool releaseKeys() {
  if (!releaseNeeded) return true;
  // Always try to release, even after the BLE sender has disconnected.
  if (!waitForUsb(nullptr) || !usbKeyboard.keyboardRelease(0)) return false;
  if (!waitForUsb(nullptr)) return false;
  releaseNeeded = false;
  return true;
}

// ### sendRawKey() - Send one USB key press and release it after the hold interval.
static bool sendRawKey(const WriteRequest& request, uint8_t key, uint8_t modifier) {
  if (!releaseKeys() || !waitForUsb(&request)) return false;
  uint8_t keys[6] = {key, 0, 0, 0, 0, 0};
  if (!usbKeyboard.keyboardReport(0, modifier, keys)) return false;
  releaseNeeded = true;
  delay(KEY_HOLD_MS);
  if (!releaseKeys()) return false;
  return sameSession(request);
}

// -----------------------------------------------------------------------------
// ## Queued key requests
// -----------------------------------------------------------------------------

// ### processKeys() - Type allowed key/modifier pairs and acknowledge the completed chunk.
static void processKeys(const WriteRequest& request) {
  if (!sameSession(request)) return;
  if (!chSendAck.notifyEnabled(request.connection)) {
    abortRequest(request, "Subscribe to ACK notifications before sending text");
    return;
  }
  // As in the original, an unmatched final byte is ignored.
  for (uint8_t i = 0; i + 1 < request.length; i += 2) {
    if (!sameSession(request)) return;
    const uint8_t key = request.data[i];
    const uint8_t modifier = request.data[i + 1];
    if (key == 0 && modifier == 0) break;
    if (isSafeKey(key, modifier) && !sendRawKey(request, key, modifier)) {
      abortRequest(request, "USB keyboard unavailable or BLE disconnected; chunk not acknowledged");
      return;
    }
    delay(KEY_GAP_MS);
  }
  if (!sendAck(request)) abortRequest(request, "Could not send chunk ACK");
}

// =============================================================================
// # Arduino lifecycle
// =============================================================================

// -----------------------------------------------------------------------------
// ## Initialization
// -----------------------------------------------------------------------------

// ### setup() - Initialize USB, the request queue, configuration, BLE services, and advertising.
void setup() {
  // ### Serial logging
  Serial.begin(115200);

  // ### USB keyboard initialization
  usbKeyboard.setBootProtocol(HID_ITF_PROTOCOL_KEYBOARD);
  usbKeyboard.setPollInterval(2);
  usbKeyboard.setReportDescriptor(HID_DESCRIPTOR, sizeof(HID_DESCRIPTOR));
  if (!usbKeyboard.begin()) fatalError("Cannot start USB keyboard");

  // ### Request queue allocation
  requests = xQueueCreate(QUEUE_DEPTH, sizeof(WriteRequest));
  if (!requests) fatalError("Cannot allocate request queue");
  // ### Bluetooth stack and connection callbacks
  if (!Bluefruit.begin(1, 0)) fatalError("Cannot start Bluetooth");
  Bluefruit.autoConnLed(false);
  Bluefruit.Periph.setConnectCallback(connectedCallback);
  Bluefruit.Periph.setDisconnectCallback(disconnectedCallback);

  // ### Persistent configuration and advertised name
  loadOrCreateConfig();
  int length = snprintf(fullName, sizeof(fullName), "%s-%s", BASE_NAME, gConfig.name);
  if (length < 0 || static_cast<size_t>(length) >= sizeof(fullName)) fatalError("Device name too long");
  Bluefruit.setName(fullName);

  // ### Optional firmware update service
#if ENABLE_BLE_DFU
  if (firmwareUpdate.begin() != ERROR_NONE) fatalError("Cannot start DFU service");
#endif
  // ### Writer service
  if (writerService.begin() != ERROR_NONE) fatalError("Cannot start writer service");

  // ### Text write characteristic
  chSendChunk.setProperties(CHR_PROPS_WRITE);
  chSendChunk.setPermission(SECMODE_NO_ACCESS, SECMODE_OPEN);
  chSendChunk.setMaxLen(CHUNK_BYTES);
  chSendChunk.setWriteCallback(keysWritten);
  if (chSendChunk.begin() != ERROR_NONE) fatalError("Cannot start text characteristic");

  // ### Acknowledgment characteristic
  chSendAck.setProperties(CHR_PROPS_NOTIFY);
  chSendAck.setPermission(SECMODE_OPEN, SECMODE_NO_ACCESS);
  chSendAck.setFixedLen(1);
  if (chSendAck.begin() != ERROR_NONE) fatalError("Cannot start ACK characteristic");

  // ### Device name characteristic
  chSetName.setProperties(CHR_PROPS_WRITE);
  chSetName.setPermission(SECMODE_NO_ACCESS, SECMODE_OPEN);
  chSetName.setMaxLen(MAX_CUSTOM_NAME_BYTES);
  chSetName.setWriteCallback(nameWritten);
  if (chSetName.begin() != ERROR_NONE) fatalError("Cannot start name characteristic");

  // ### Start BLE advertising
  startAdvertising();
}

// -----------------------------------------------------------------------------
// ## Main loop
// -----------------------------------------------------------------------------

// ### loop() - Retry pending key releases and process one queued request per iteration.
void loop() {
  // Retry a pending release when USB becomes available again.
  if (releaseNeeded && usbKeyboard.ready()) releaseKeys();
  WriteRequest request = {};
  if (xQueueReceive(requests, &request, 0) == pdPASS && sameSession(request)) {
    if (request.kind == REQUEST_KEYS) processKeys(request);
    else processName(request);
  }
  delay(1); // USB/BLE tasks are maintained by the Seeed core; no BLE.poll().
}
