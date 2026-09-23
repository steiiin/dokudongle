#!/usr/bin/env python3
"""Run the sketch's configuration, persistence, and key timing code with host fakes.

Requires Python 3 and g++. This is not a replacement for an nRF52 build or a
hardware check: only the selected functions below run against simulated I/O.
"""
from pathlib import Path
import re
import subprocess
import tempfile

sketch = (Path(__file__).resolve().parents[2] / 'keyboard-sender/xiao_sketch.ino').read_text()


def function(name):
    match = re.search(r'^static [\w*]+ ' + name + r'\([^;{]*\) \{', sketch, re.M)
    assert match, name
    start = match.start()
    end = match.end()
    depth = 1
    while depth:
        depth += (sketch[end] == '{') - (sketch[end] == '}')
        end += 1
    return sketch[start:end]


constants = '\n'.join(re.findall(r'^static constexpr (?:char|size_t|uint\d+_t) .*?;', sketch, re.M))
structures = '\n'.join(re.search(r'struct ' + name + r' \{.*?\};', sketch, re.S)[0]
                       for name in ['DeviceConfig', 'WriteRequest'])
kinds = re.search(r'enum RequestKind .*?;', sketch)[0]

fake_io = r'''
#include <cassert>
#include <cstdio>
#include <cstring>
#include <cstdint>
#include <map>
#include <string>
#include <vector>
#include <stdexcept>
using std::string;
using std::vector;
#define taskENTER_CRITICAL()
#define taskEXIT_CRITICAL()
struct FakeFS {
  std::map<string, vector<uint8_t>> files;
  bool failRename = false;
  bool begin() { return true; }
  bool exists(const char* path) { return files.count(path); }
  bool remove(const char* path) { return files.erase(path); }
  bool rename(const char* src, const char* dst) {
    if (failRename) return false;
    files[dst] = files.at(src); files.erase(src); return true;
  }
} InternalFS;
namespace Adafruit_LittleFS_Namespace {
const int FILE_O_READ = 0, FILE_O_WRITE = 1;
class File {
  FakeFS& fs;
  string path;
public:
  File(FakeFS& fs): fs(fs) {}
  bool open(const char* name, int mode) {
    path = name;
    if (mode == FILE_O_WRITE) fs.files[path].clear();
    return fs.exists(name);
  }
  size_t size() { return fs.files.at(path).size(); }
  int read(void* out, size_t count) { memcpy(out, fs.files.at(path).data(), count); return count; }
  size_t write(const uint8_t* data, size_t count) {
    fs.files[path] = vector<uint8_t>(data, data + count); return count;
  }
  void close() {}
  void flush() {}
};
}
struct { void println(const char*) {} } Serial;
struct Ficr { uint32_t DEVICEID[1] = {0x12345678}; } ficr;
Ficr* NRF_FICR = &ficr;
bool activeSession = true;
int resets = 0;
vector<string> events;
uint32_t elapsed = 0;
void delay(uint32_t ms) { elapsed += ms; events.push_back("delay:" + std::to_string(ms)); }
uint32_t millis() { return elapsed; }
void NVIC_SystemReset() { ++resets; }
struct {
  struct { void restartOnDisconnect(bool) {} void stop() {} } Advertising;
  void disconnect(uint16_t) { activeSession = false; }
} Bluefruit;
struct {
  bool ready() { return true; }
  bool keyboardReport(uint8_t, uint8_t, uint8_t*) { events.push_back("press"); return true; }
  bool keyboardRelease(uint8_t) { events.push_back("release"); return true; }
} usbKeyboard;
struct { bool notifyEnabled(uint16_t) { return true; } } chSendAck;
struct BLECharacteristic {};
struct ble_gatts_evt_read_t { uint16_t offset; };
struct ReadReply { uint16_t gatt_status, update, offset, len; const uint8_t* p_data; };
struct ble_gatts_rw_authorize_reply_params_t { uint8_t type; struct { ReadReply read; } params; };
const int BLE_GATTS_AUTHORIZE_TYPE_READ = 1, BLE_GATT_STATUS_SUCCESS = 0;
const int BLE_GATT_STATUS_ATTERR_INVALID_OFFSET = 7;
vector<uint8_t> lastRead;
int lastReadStatus;
void sd_ble_gatts_rw_authorize_reply(uint16_t, ble_gatts_rw_authorize_reply_params_t* reply) {
  lastReadStatus = reply->params.read.gatt_status;
  if (reply->params.read.update) {
    assert(reply->params.read.offset == 0);
    lastRead.assign(reply->params.read.p_data, reply->params.read.p_data + reply->params.read.len);
  }
}
static void fatalError(const char* message) { throw std::runtime_error(message); }
'''

support = r'''
static DeviceConfig gConfig = {};
static bool releaseNeeded = false;
static bool sameSession(const WriteRequest&) { return activeSession; }
static bool sendAck(const WriteRequest&) { events.push_back("ack"); return true; }
static void abortRequest(const WriteRequest&, const char* message) { throw std::runtime_error(message); }
'''

# Compile the actual production functions, including atomic persistence and migration.
functions = '\n'.join(function(name) for name in [
    'validName', 'validConfig', 'readStoredConfig', 'readConfig', 'saveConfig',
    'loadOrCreateConfig', 'isSafeKey', 'waitForUsb', 'releaseKeys', 'sendRawKey',
    'processKeys', 'processConfig', 'configRead',
])

cases = r'''
static WriteRequest configRequest(const string& name, uint16_t gap) {
  WriteRequest request = {};
  request.kind = REQUEST_CONFIG;
  request.length = 2 + name.size();
  request.data[0] = gap & 255;
  request.data[1] = gap >> 8;
  memcpy(request.data + 2, name.data(), name.size());
  return request;
}
static void writeLegacy(const string& name, uint16_t padding) {
  DeviceConfig legacy = {};
  legacy.magic = CONFIG_MAGIC;
  legacy.version = 1;
  memcpy(legacy.name, name.c_str(), name.size() + 1);
  legacy.keyGapMs = padding;
  auto bytes = reinterpret_cast<uint8_t*>(&legacy);
  InternalFS.files[CONFIG_PATH] = vector<uint8_t>(bytes, bytes + sizeof(legacy));
}
int main() {
  // First boot creates a persistent default; v1 trailing bytes are never a gap.
  loadOrCreateConfig();
  assert(validConfig(gConfig) && gConfig.keyGapMs == 30);
  assert(string(gConfig.name) == "sf12345678");
  for (uint16_t padding : {0, 200, 65535}) {
    writeLegacy("Keep123", padding);
    loadOrCreateConfig();
    assert(gConfig.version == 2 && gConfig.keyGapMs == 30);
    assert(string(gConfig.name) == "Keep123");
    assert(readConfig(CONFIG_PATH, gConfig));
  }
  writeLegacy("Bad-Name", 0);
  loadOrCreateConfig();
  assert(string(gConfig.name) == "sf12345678" && gConfig.keyGapMs == 30);

  // Invalid requests and a failed atomic rename change neither live nor saved config.
  const DeviceConfig before = gConfig;
  const auto storedBefore = InternalFS.files.at(CONFIG_PATH);
  for (const auto& request : {
    configRequest("", 30), configRequest("Bad Name", 30), configRequest("Bad-Name", 30),
    configRequest(string("A\0B", 3), 30), configRequest("\xc3\xa4", 30),
    configRequest("Valid", 201), configRequest("Valid", 65535)
  }) {
    processConfig(request);
    assert(memcmp(&before, &gConfig, sizeof(before)) == 0 && resets == 0);
    assert(InternalFS.files.at(CONFIG_PATH) == storedBefore);
  }
  for (uint8_t length : {0, 1, 2, 21, 255}) {
    WriteRequest malformed = {};
    malformed.length = length;
    processConfig(malformed);
    assert(memcmp(&before, &gConfig, sizeof(before)) == 0 && resets == 0);
  }
  InternalFS.failRename = true;
  processConfig(configRequest("NewName", 200));
  assert(memcmp(&before, &gConfig, sizeof(before)) == 0 && resets == 0);
  assert(InternalFS.files.at(CONFIG_PATH) == storedBefore);
  InternalFS.failRename = false;
  ble_gatts_evt_read_t readRequest = {0};
  configRead(0, nullptr, &readRequest);
  assert(lastReadStatus == BLE_GATT_STATUS_SUCCESS);
  assert(lastRead[0] == 30 && lastRead[1] == 0);
  assert(string(lastRead.begin() + 2, lastRead.end()) == before.name);
  readRequest.offset = 21;
  configRead(0, nullptr, &readRequest);
  assert(lastReadStatus == BLE_GATT_STATUS_ATTERR_INVALID_OFFSET);

  // Maximum-length suffix, gap boundaries, restart, and persistence across reload.
  int expectedResets = 0;
  for (uint16_t gap : {0, 30, 200}) {
    activeSession = true;
    processConfig(configRequest("Ab012345678901234Z", gap));
    assert(resets == ++expectedResets);
    assert(gConfig.keyGapMs == gap && string(gConfig.name) == "Ab012345678901234Z");
    readRequest.offset = 0;
    configRead(0, nullptr, &readRequest);
    assert(lastRead.size() == 20 && lastRead[0] == gap && lastRead[1] == 0);
    assert(string(lastRead.begin() + 2, lastRead.end()) == "Ab012345678901234Z");
    gConfig = {};
    loadOrCreateConfig();
    assert(gConfig.keyGapMs == gap && string(gConfig.name) == "Ab012345678901234Z");

    // Repeated keys retain the fixed hold, then release before the configured gap.
    activeSession = true;
    events.clear();
    WriteRequest keys = {};
    keys.kind = REQUEST_KEYS;
    keys.length = 4;
    keys.data[0] = keys.data[2] = 0x04;
    processKeys(keys);
    const string gapDelay = "delay:" + std::to_string(gap);
    assert((events == vector<string>{"press", "delay:8", "release", gapDelay,
      "press", "delay:8", "release", gapDelay, "ack"}));
  }
  puts("XIAO host checks passed: migration, config validation, atomic persistence, restart, key timing.");
}
'''

with tempfile.TemporaryDirectory(prefix='dokudongle-xiao-host-') as temp:
    source = Path(temp) / 'test.cpp'
    binary = Path(temp) / 'test'
    source.write_text(fake_io + constants + kinds + structures + support + functions + cases)
    subprocess.run(['g++', '-std=c++17', '-Wall', '-Wextra', str(source), '-o', str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
