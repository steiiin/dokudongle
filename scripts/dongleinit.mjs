import { spawn } from 'node:child_process'
import { constants, accessSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { buildConfig, check } from './firmware.mjs'

export const bootloaderFilename = 'xiao_nrf52840_ble_bootloader-0.9.2-OTAFIX2.3-BP1.4-2-g3a75482-dirty_s140_7.3.0.zip'
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolHint = 'Install adafruit-nrfutil with pipx and add its bin directory to PATH, or set ADAFRUIT_NRFUTIL to its executable path.'

export function runCommand(command, args, { cwd, signal, flash = false, quiet = false } = {}) {
  signal?.throwIfAborted()
  return new Promise((resolveCommand, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    let killTimer
    const cancel = () => {
      child.kill('SIGTERM')
      killTimer = setTimeout(() => child.kill('SIGKILL'), 2000)
      killTimer.unref()
    }
    signal?.addEventListener('abort', cancel, { once: true })
    for (const [stream, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.setEncoding('utf8')
      stream.on('data', chunk => {
        output += chunk
        if (!quiet) destination.write(chunk)
      })
    }
    let spawnError
    child.on('error', error => { spawnError = error })
    child.on('close', (code, terminationSignal) => {
      clearTimeout(killTimer)
      signal?.removeEventListener('abort', cancel)
      if (signal?.aborted) return reject(signal.reason)
      if (spawnError) return reject(new Error('Cannot execute ' + command + ': ' + spawnError.message + '. ' + (command === 'python3' ? 'Install Python 3 to validate the bootloader ZIP.' : toolHint)))
      if (code !== 0 || (flash && (!output.includes('Device programmed.') || /Failed to upgrade target|Traceback \(most recent call last\)/i.test(output)))) {
        return reject(new Error(command + ' failed (' + (terminationSignal || 'exit ' + code) + ').' + (quiet ? '\n' + output.trim() : ' See tool output above.')))
      }
      resolveCommand(output)
    })
  })
}

export async function validateBootloader(path, run = runCommand, signal) {
  try {
    if (!statSync(path).isFile()) throw new Error('not a regular file')
    accessSync(path, constants.R_OK)
  } catch (error) { throw new Error('Cannot read bootloader package ' + path + ': ' + error.message, { cause: error }) }
  // Python is already required by firmware preparation; zipfile verifies every entry's CRC.
  await run('python3', ['-c', [
    'import json, sys, zipfile',
    'with zipfile.ZipFile(sys.argv[1]) as z:',
    "    assert z.testzip() is None, 'Corrupt bootloader ZIP'",
    "    manifest = json.loads(z.read('manifest.json'))['manifest']",
    "    assert set(manifest) <= {'dfu_version', 'softdevice_bootloader'}, 'Unexpected bootloader package type'",
    "    image = manifest['softdevice_bootloader']",
    "    binary = z.read(image['bin_file'])",
    "    assert image['bl_size'] > 0 and image['sd_size'] > 0",
    "    assert len(binary) == image['bl_size'] + image['sd_size'], 'Invalid bootloader image size'",
    "    assert z.read(image['dat_file']), 'Missing bootloader init packet'",
  ].join('\n'), path], { signal, quiet: true })
}

function attribute(path, name) {
  try { return readFileSync(join(path, name), 'utf8').trim() } catch (error) {
    if (['ENOENT', 'ENODEV', 'EIO'].includes(error.code)) return null
    throw error
  }
}

function entries(path) {
  try { return readdirSync(path) } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

function usbParent(path) {
  let current = realpathSync(path)
  while (dirname(current) !== current) {
    if (attribute(current, 'idVendor') && attribute(current, 'idProduct')) return current
    current = dirname(current)
  }
  throw new Error('No USB device found for ' + path)
}

export function serialDevice(port, sysRoot = '/sys') {
  try {
    const canonicalPort = realpathSync(port)
    if (!statSync(canonicalPort).isCharacterDevice()) throw new Error('not a serial character device')
    accessSync(canonicalPort, constants.R_OK | constants.W_OK)
    const usb = usbParent(join(sysRoot, 'class/tty', basename(canonicalPort), 'device'))
    if (attribute(usb, 'idVendor') !== '2886') throw new Error('not a Seeed USB device (VID 2886)')
    return { port: canonicalPort, location: basename(usb) }
  } catch (error) {
    throw new Error('Cannot use serial address ' + port + ': ' + error.message + '. Check the address, permissions, and double-tap reset to enter flash mode.', { cause: error })
  }
}

export function inspectUsb(location, sysRoot = '/sys') {
  const path = join(sysRoot, 'bus/usb/devices', location)
  const vendor = attribute(path, 'idVendor')
  if (!vendor) return null
  const interfaces = entries(join(sysRoot, 'bus/usb/devices')).filter(name => name.startsWith(location + ':'))
  const keyboard = interfaces.some(name => {
    const iface = join(sysRoot, 'bus/usb/devices', name)
    return attribute(iface, 'bInterfaceClass') === '03'
      && attribute(iface, 'bInterfaceSubClass') === '01'
      && attribute(iface, 'bInterfaceProtocol') === '01'
  })
  const ports = entries(join(sysRoot, 'class/tty')).filter(name => {
    try { return basename(usbParent(join(sysRoot, 'class/tty', name, 'device'))) === location } catch { return false }
  }).map(name => '/dev/' + name)
  return {
    location, vendor, productId: attribute(path, 'idProduct'),
    manufacturer: attribute(path, 'manufacturer'), product: attribute(path, 'product'),
    serial: attribute(path, 'serial'), keyboard, ports,
  }
}

export function formatDevice(device) {
  if (!device) return 'Device not currently detected.'
  return [
    'Manufacturer: ' + (device.manufacturer || 'unavailable'), 'Product: ' + (device.product || 'unavailable'),
    'USB serial: ' + (device.serial || 'unavailable'), 'VID/PID: ' + device.vendor + ':' + device.productId,
    'USB location: ' + device.location, 'Serial port: ' + (device.ports.join(', ') || 'unavailable'),
    'HID keyboard: ' + (device.keyboard ? 'detected' : 'not detected'),
  ].join('\n')
}

export async function waitForDevice(location, {
  inspect = inspectUsb, signal, timeoutMs = 30000, intervalMs = 500,
  sleep = ms => delay(ms, undefined, { signal }), now = () => performance.now(),
} = {}) {
  const deadline = now() + timeoutMs
  let observed = null
  do {
    signal?.throwIfAborted()
    const device = inspect(location)
    if (device) observed = device
    if (device?.location === location && device.vendor === '2886' && device.productId === '8044'
      && device.manufacturer === buildConfig.usbManufacturer && device.product === buildConfig.usbProduct && device.keyboard) return device
    const remaining = deadline - now()
    if (remaining <= 0) break
    await sleep(Math.min(intervalMs, remaining))
  } while (now() <= deadline)
  throw new Error('USB verification timed out at ' + location + '. Reconnect the dongle to the same USB port and inspect it with lsusb or the Android app.\nLast observed device:\n' + formatDevice(observed))
}

export async function initialize({
  root = projectRoot, platform = process.platform, env = process.env, ask, signal,
  log = console.log, run = runCommand, identify = serialDevice, verify = waitForDevice,
} = {}) {
  if (platform !== 'linux') throw new Error('Dongle initialization currently requires Linux for USB verification.')
  signal?.throwIfAborted()
  const manifest = check(root)
  const bootDirectory = join(root, 'keyboard-sender/xiao_bootloader')
  await validateBootloader(join(bootDirectory, bootloaderFilename), run, signal)
  const tool = env.ADAFRUIT_NRFUTIL || 'adafruit-nrfutil'
  await run(tool, ['version'], { signal, quiet: true })
  log('Selected firmware v' + manifest.version + ': ' + manifest.packageFilename)
  log('Double-tap the XIAO reset button to enter flash mode. Keep the dongle in the same physical USB port throughout initialization.')
  const promptPort = async defaultPort => {
    const answer = await ask('Serial address [' + defaultPort + '] (Enter to proceed): ')
    signal?.throwIfAborted()
    return identify(answer.trim() || defaultPort)
  }
  const first = await promptPort('/dev/ttyACM0')
  log('Flashing bootloader…')
  await run(tool, ['--verbose', 'dfu', 'serial', '--package', bootloaderFilename, '-p', first.port,
    '-b', '115200', '--singlebank', '--touch', '1200'], { cwd: bootDirectory, signal, flash: true })
  log('Bootloader flashed. Double-tap the XIAO reset button AGAIN to re-enter flash mode. Wait for the serial device to appear, then continue below.')
  const second = await promptPort(first.port)
  if (second.location !== first.location) throw new Error('The selected serial address belongs to a different USB location. Reconnect the original dongle to its original USB port and try again.')
  // Reject a concurrent firmware preparation or changed package before the second flash.
  const current = check(root)
  if (current.packageFilename !== manifest.packageFilename || current.packageSha256 !== manifest.packageSha256) {
    throw new Error('The selected firmware changed during initialization. Restart the task.')
  }
  log('Flashing firmware…')
  await run(tool, ['dfu', 'serial', '-p', second.port, '-b', '115200', '--singlebank',
    '--package', join(root, 'public/firmware', manifest.packageFilename)], { cwd: root, signal, flash: true })
  log('Firmware transfer completed. Waiting up to 30 seconds for the DokuDongle USB keyboard…')
  const device = await verify(first.location, { signal })
  signal?.throwIfAborted()
  log('Initialization successful. Flashed package: ' + manifest.packageFilename + ' (v' + manifest.version + ').')
  log(formatDevice(device))
  log('USB identity and keyboard interface verified. Installed firmware version was not read over USB.')
  return device
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run dongle initialization in an interactive terminal (npm run dongle:init).')
  const controller = new AbortController()
  const terminal = createInterface({ input: process.stdin, output: process.stdout })
  const cancel = () => controller.abort(new Error('Initialization cancelled.'))
  terminal.on('SIGINT', cancel)
  terminal.on('close', cancel)
  process.on('SIGINT', cancel)
  process.on('SIGTERM', cancel)
  try {
    await initialize({ signal: controller.signal, ask: question => terminal.question(question, { signal: controller.signal }) })
  } catch (error) {
    if (controller.signal.aborted) { process.exitCode = 130; throw controller.signal.reason }
    throw error
  } finally {
    terminal.removeListener('close', cancel)
    terminal.close()
    process.removeListener('SIGINT', cancel)
    process.removeListener('SIGTERM', cancel)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode ||= 1 })
}
