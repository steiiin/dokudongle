/****************************************************************************************
 * DokuDongle
 ****************************************************************************************
 *
**/

#include <ArduinoBLE.h>
#include "PluggableUSBHID.h"
#include "USBKeyboard.h"
#include "FlashIAP.h"

//###############################################

const char* BASE_NAME = "DokuDongle"; 

#define SERVICE_UUID   "00001888-0000-1000-8000-00805f9b34fb"
#define SENDTEXT_UUID  "00000881-0000-1000-8000-00805f9b34fb"
#define SENDACK_UUID   "00000882-0000-1000-8000-00805f9b34fb"
#define SETNAME_UUID   "00000883-0000-1000-8000-00805f9b34fb"

BLEService writerService(SERVICE_UUID);
BLECharacteristic chSendChunk(SENDTEXT_UUID, BLEWrite, 20);
BLECharacteristic chSendAck(SENDACK_UUID, BLENotify, 1);
BLEStringCharacteristic chSetName(SETNAME_UUID, BLEWrite, 20);

//---------------------------

USBKeyboard Keyboard;

//---------------------------

mbed::FlashIAP Flash;

//###############################################

void error()
{
  while (1)
  {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
    digitalWrite(LED_BUILTIN, LOW);
    delay(1000);
  }
}

//---------------------------

struct DeviceConfig {
  uint32_t magic;
  uint16_t version;
  char name[32];
};

static const uint32_t CONFIG_MAGIC   = 0x444F444F; // DODO
static const uint16_t CONFIG_VERSION = 1;

DeviceConfig gConfig;
uint32_t gFlashStart = 0;
uint32_t gFlashSize = 0;
uint32_t gSectorSize = 0;
uint32_t gPageSize = 0;
uint32_t gConfigAddr = 0;
bool gFlashReady = false;

String generateRandomId() {

  uint32_t r =
    (uint32_t)random(0xFFFF) << 16 |
    random(0xFFFF);

  char buf[9];
  snprintf(buf, sizeof(buf), "%08lx", r);

  return String("sf") + buf;
}

bool startFlash() {

  int rc = Flash.init();
  if (rc != 0) return false;

  gFlashStart = Flash.get_flash_start();
  gFlashSize  = Flash.get_flash_size();

  uint32_t lastAddr = gFlashStart + gFlashSize - 1;
  gSectorSize = Flash.get_sector_size(lastAddr);
  gPageSize   = Flash.get_page_size();

  if (gSectorSize == 0 || gPageSize == 0) {
    Flash.deinit();
    return false;
  }

  // Reserve the last sector for config
  gConfigAddr = gFlashStart + gFlashSize - gSectorSize;

  gFlashReady = true;
  return true;

}

void resetConfig() {

  memset(&gConfig, 0, sizeof(gConfig));
  gConfig.magic = CONFIG_MAGIC;
  gConfig.version = CONFIG_VERSION;

  String rnd = generateRandomId();
  rnd.toCharArray(gConfig.name, sizeof(gConfig.name));

  if (!saveConfig()) { error(); }
  
}

bool loadConfig() {
  if (!gFlashReady) return false;

  DeviceConfig tmp;
  memcpy(&tmp, (const void*)gConfigAddr, sizeof(DeviceConfig));

  if (tmp.magic != CONFIG_MAGIC) return false;
  if (tmp.version != CONFIG_VERSION) return false;

  gConfig = tmp;
  return true;
}

bool saveConfig() {
  if (!gFlashReady) return false;

  uint8_t eraseValue = Flash.get_erase_value();

  uint8_t sectorBuf[gSectorSize];
  memset(sectorBuf, eraseValue, gSectorSize);

  DeviceConfig tmp = gConfig;

  memcpy(sectorBuf, &tmp, sizeof(DeviceConfig));

  int rc = Flash.erase(gConfigAddr, gSectorSize);
  if (rc != 0) return false;

  for (uint32_t offset = 0; offset < gSectorSize; offset += gPageSize) {
    rc = Flash.program(sectorBuf + offset, gConfigAddr + offset, gPageSize);
    if (rc != 0) return false;
  }

  return true;
}

//---------------------------

void advertise() {

  gConfig.name[sizeof(gConfig.name) - 1] = '\0';
  char fullName[40];

  snprintf(fullName, sizeof(fullName),
    "%s-%s", BASE_NAME, gConfig.name);

  BLE.stopAdvertise();
  BLE.setDeviceName(fullName);
  BLE.setLocalName(fullName);
  BLE.advertise();

}

bool isSafeKey(uint8_t key, uint8_t mod) {

  // --- check modifier ---
  // allowed:
  // 0x00 = none
  // 0x02 = Shift
  // 0x40 = AltGr
  if (!(mod == 0x00 || mod == 0x02 || mod == 0x40)) {
    return false;
  }

  // --- letters A–Z ---
  if (key >= 0x04 && key <= 0x1D) {
    return true;
  }

  // --- digits 0–9 ---
  if (key >= 0x1E && key <= 0x27) {
    return true;
  }

  // --- explicitly allowed single keys ---
  switch (key) {

    // controls
    case 0x28: // ENTER
    case 0x2C: // SPACE

    // punctuation block
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
  }

  // everything else is rejected
  return false;
}

//###############################################

void setup() {
  
  // device init
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  // load Config
  if (!startFlash()) { error(); }
  if (!loadConfig()) { resetConfig(); }

  // start Bluetooth service
  if (!BLE.begin()) { error(); }

  BLE.setAdvertisedService(writerService);
  writerService.addCharacteristic(chSendChunk);
  writerService.addCharacteristic(chSendAck);
  writerService.addCharacteristic(chSetName);
  BLE.addService(writerService);
  advertise();

}

void loop() {
  BLEDevice central = BLE.central();
  if (central)
  {

    // status light on
    digitalWrite(LED_BUILTIN, HIGH);
    bool led = digitalRead(LED_BUILTIN);
    
    // keyboard mode
    while (central.connected()) {

      if (chSendChunk.written()) {
        
        int len = chSendChunk.valueLength();
        const uint8_t* p = chSendChunk.value();

        // process each 2‑byte event
        for (int i = 0; i + 1 < len; i += 2) {

          uint8_t key = p[i];
          uint8_t mod = p[i + 1];

          // EOD
          if (key==0x00 && mod==0x00)
          {
            digitalWrite(LED_BUILTIN, HIGH);
            break;
          }

          // send it
          if (isSafeKey(key, mod)) {
            Keyboard.key_code_raw(key, mod);
          }

          // flicker led
          led = !led;
          digitalWrite(LED_BUILTIN, led);

          delay(30); 
        }

        uint8_t done = 1;
        chSendAck.writeValue(&done, 1);
        digitalWrite(LED_BUILTIN, HIGH);

      }
      if (chSetName.written()) {

        String newName = chSetName.value();
        newName.toCharArray(gConfig.name, sizeof(gConfig.name));
        if (saveConfig()) {
          
          central.disconnect();
          delay(500);
          NVIC_SystemReset();
          break;
          
        }

      }
      BLE.poll();
      
    }

    // disconnected
    digitalWrite(LED_BUILTIN, LOW);
    delay(200);
    advertise();

  }
}
