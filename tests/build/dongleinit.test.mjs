import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { prepare } from '../../scripts/firmware.mjs'
import { bootloaderFilename, initialize, inspectUsb, runCommand, serialDevice, validateBootloader, waitForDevice } from '../../scripts/dongleinit.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const roots = []
function temporary() {
  const root = mkdtempSync(join(tmpdir(), 'dongle-init-'))
  roots.push(root)
  return root
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
const device = { location: '3-6', vendor: '2886', productId: '8044', manufacturer: 'STEIIIN', product: 'DokuDongle', serial: '1234', keyboard: true, ports: ['/dev/ttyACM1'] }
function fixture() {
  const root = temporary()
  for (const directory of ['scripts', 'keyboard-sender/xiao_sketch', 'keyboard-sender/xiao_bootloader']) mkdirSync(join(root, directory), { recursive: true })
  writeFileSync(join(root, 'scripts/firmware.mjs'), 'builder')
  writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'sketch')
  const bootloader = join(root, 'keyboard-sender/xiao_bootloader', bootloaderFilename)
  copyFileSync(join(repo, 'keyboard-sender/xiao_bootloader', bootloaderFilename), bootloader)
  const manifest = prepare(root, () => Buffer.from('application'))
  const events = []
  let answers = ['', '/dev/ttyACM1']
  const options = {
    root, platform: 'linux', env: { ADAFRUIT_NRFUTIL: '/custom/nrfutil' },
    log: message => events.push({ message }),
    ask: async prompt => { events.push({ prompt }); return answers.shift() },
    run: async (command, args, options) => { events.push({ command, args, options }); return 'Device programmed.' },
    identify: port => ({ port, location: '3-6' }),
    verify: async location => { events.push({ verified: location }); return device },
  }
  return { root, manifest, bootloader, events, options, answers }
}

test('two manual reset prompts bracket exact commands; manifest wins over higher filename; custom tool and changed port work', async () => {
  const f = fixture()
  writeFileSync(join(f.root, 'public/firmware/dongle-v999-aaaaaaaaaaaaaaaa.zip'), 'unused')
  assert.equal(await initialize(f.options), device)
  const flashes = f.events.filter(e => e.options?.flash)
  assert.equal(flashes.length, 2)
  assert.equal(flashes[0].command, '/custom/nrfutil')
  assert.deepEqual(flashes[0].args, ['--verbose', 'dfu', 'serial', '--package', bootloaderFilename, '-p', '/dev/ttyACM0', '-b', '115200', '--singlebank', '--touch', '1200'])
  assert.equal(flashes[0].options.cwd, join(f.root, 'keyboard-sender/xiao_bootloader'))
  assert.deepEqual(flashes[1].args, ['dfu', 'serial', '-p', '/dev/ttyACM1', '-b', '115200', '--singlebank', '--package', join(f.root, 'public/firmware', f.manifest.packageFilename)])
  const prompts = f.events.filter(e => e.prompt)
  assert.equal(prompts.length, 2)
  assert.match(prompts[0].prompt, /\[\/dev\/ttyACM0\]/)
  assert.match(prompts[1].prompt, /\[\/dev\/ttyACM0\]/)
  assert.ok(f.events.indexOf(prompts[0]) < f.events.indexOf(flashes[0]))
  assert.ok(f.events.indexOf(flashes[0]) < f.events.indexOf(prompts[1]))
  assert.ok(f.events.indexOf(prompts[1]) < f.events.indexOf(flashes[1]))
  assert.match(f.events[f.events.indexOf(prompts[1]) - 1].message, /Double-tap.*AGAIN/)
  assert.ok(f.events.find(e => e.verified === '3-6'))
  assert.ok(f.events.find(e => e.message?.includes('USB serial: 1234')))
})

test('second prompt retains an explicitly selected port', async () => {
  const f = fixture()
  f.answers.splice(0, 2, '/dev/ttyACM7', '')
  await initialize(f.options)
  assert.match(f.events.filter(e => e.prompt)[1].prompt, /ttyACM7/)
  assert.ok(f.events.filter(e => e.options?.flash)[1].args.includes('/dev/ttyACM7'))
})

test('preflight failures prevent any flash or prompt', async () => {
  for (const failure of ['bootloader', 'firmware', 'tool', 'python', 'platform']) {
    const f = fixture()
    if (failure === 'bootloader') rmSync(f.bootloader)
    if (failure === 'firmware') writeFileSync(join(f.root, 'public/firmware', f.manifest.packageFilename), 'corrupt')
    if (failure === 'platform') f.options.platform = 'win32'
    const original = f.options.run
    f.options.run = async (...args) => {
      if ((failure === 'tool' && args[1][0] === 'version') || (failure === 'python' && args[0] === 'python3')) throw new Error('missing prerequisite')
      return original(...args)
    }
    await assert.rejects(initialize(f.options))
    assert.equal(f.events.filter(e => e.options?.flash || e.prompt).length, 0)
  }
})

test('bootloader validator accepts real archive and rejects a truncated ZIP', async () => {
  const f = fixture()
  await validateBootloader(f.bootloader)
  writeFileSync(f.bootloader, readFileSync(f.bootloader).subarray(0, 100))
  await assert.rejects(validateBootloader(f.bootloader), /failed/)
})

test('another USB location prevents the firmware flash', async () => {
  const f = fixture()
  f.options.identify = port => ({ port, location: port.endsWith('0') ? '3-6' : '3-7' })
  await assert.rejects(initialize(f.options), /different USB location/)
  assert.equal(f.events.filter(e => e.options?.flash).length, 1)
})

test('failed transfers stop subsequent stages and never report success', async () => {
  for (const failAt of [1, 2]) {
    const f = fixture()
    const run = f.options.run
    let flashes = 0
    f.options.run = async (...args) => {
      await run(...args)
      if (args[2]?.flash && ++flashes === failAt) throw new Error('transfer failed')
    }
    await assert.rejects(initialize(f.options), /transfer failed/)
    assert.equal(flashes, failAt)
    assert.equal(f.events.some(e => e.verified || e.message?.includes('Initialization successful')), false)
  }
})

test('command runner rejects exit-zero failures, missing success message, nonzero exit and missing executable', async () => {
  for (const code of [
    "console.log('Failed to upgrade target. Error is: disconnected')",
    "console.log('Device programmed.'); console.error('Failed to upgrade target')",
    "console.log('no completion')",
    "console.log('Device programmed.'); process.exitCode = 1",
  ]) await assert.rejects(runCommand(process.execPath, ['-e', code], { flash: true, quiet: true }), /failed/)
  await assert.rejects(runCommand('/nonexistent/nrfutil', ['version'], { quiet: true }), /Cannot execute.*ADAFRUIT_NRFUTIL/)
  await runCommand(process.execPath, ['-e', "console.log('Device programmed.')"], { flash: true, quiet: true })
})

test('cancellation at a prompt prevents flashing', async () => {
  const f = fixture()
  const controller = new AbortController()
  f.options.signal = controller.signal
  f.options.ask = async () => { controller.abort(new Error('cancelled')); return '' }
  await assert.rejects(initialize(f.options), /cancelled/)
  assert.equal(f.events.filter(e => e.options?.flash).length, 0)
})

test('cancellation terminates an active subprocess', async () => {
  const controller = new AbortController()
  const running = runCommand(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { signal: controller.signal, quiet: true })
  const rejected = assert.rejects(running, /cancelled/)
  await delay(100)
  controller.abort(new Error('cancelled'))
  await rejected
})

function usbFixture() {
  const sys = temporary()
  const usb = join(sys, 'bus/usb/devices/3-6')
  mkdirSync(usb, { recursive: true })
  for (const [name, value] of Object.entries({ idVendor: '2886', idProduct: '8044', manufacturer: 'STEIIIN', product: 'DokuDongle', serial: '1234' })) writeFileSync(join(usb, name), value + '\n')
  const iface = join(usb, '3-6:1.0')
  mkdirSync(iface)
  for (const [name, value] of Object.entries({ bInterfaceClass: '03', bInterfaceSubClass: '01', bInterfaceProtocol: '01' })) writeFileSync(join(iface, name), value + '\n')
  symlinkSync(iface, join(sys, 'bus/usb/devices/3-6:1.0'))
  mkdirSync(join(sys, 'class/tty/ttyACM1'), { recursive: true })
  symlinkSync(iface, join(sys, 'class/tty/ttyACM1/device'))
  return { sys, usb, iface }
}

test('sysfs inspection reads USB attributes, serial port and keyboard interface', () => {
  const f = usbFixture()
  assert.deepEqual(inspectUsb('3-6', f.sys), device)
  assert.equal(inspectUsb('3-7', f.sys), null)
  writeFileSync(join(f.iface, 'bInterfaceProtocol'), '00')
  assert.equal(inspectUsb('3-6', f.sys).keyboard, false)
})

test('serial validation rejects absent ports and regular files', () => {
  assert.throws(() => serialDevice('/nonexistent/ttyACM0'), /Cannot use serial address/)
  const path = join(temporary(), 'ttyACM0')
  writeFileSync(path, '')
  assert.throws(() => serialDevice(path), /not a serial character device/)
})

test('USB polling waits through disappearance and bootloader before accepting application', async () => {
  let now = 0
  const states = [null, { ...device, productId: '0044', keyboard: false }, device]
  const result = await waitForDevice('3-6', { inspect: () => states.shift(), now: () => now, sleep: async ms => { now += ms } })
  assert.equal(result, device)
  assert.equal(now, 1000)
})

test('USB polling rejects bootloader, wrong device, absent keyboard, wrong descriptors and disappearance', async () => {
  for (const observed of [null, { ...device, productId: '0044' }, { ...device, location: '3-7' }, { ...device, keyboard: false }, { ...device, product: 'Other' }, { ...device, manufacturer: 'Other' }, { ...device, vendor: '0000' }]) {
    let now = 0
    await assert.rejects(waitForDevice('3-6', { inspect: () => observed, timeoutMs: 1000, now: () => now, sleep: async ms => { now += ms } }), /timed out.*Reconnect[\s\S]*Last observed device/)
    assert.equal(now, 1000)
  }
})

test('USB polling respects cancellation', async () => {
  const controller = new AbortController()
  await assert.rejects(waitForDevice('3-6', {
    inspect: () => null, signal: controller.signal,
    sleep: async () => controller.abort(new Error('cancelled')),
  }), /cancelled/)
})

test('a changed firmware package between prompts prevents the second flash', async () => {
  const f = fixture()
  const ask = f.options.ask
  let prompts = 0
  f.options.ask = async prompt => {
    if (++prompts === 2) writeFileSync(join(f.root, 'public/firmware', f.manifest.packageFilename), 'changed')
    return ask(prompt)
  }
  await assert.rejects(initialize(f.options), /missing, corrupt, or stale/)
  assert.equal(f.events.filter(e => e.options?.flash).length, 1)
})

test('USB verification failure never reports initialization success', async () => {
  const f = fixture()
  f.options.verify = async () => { throw new Error('USB verification timed out') }
  await assert.rejects(initialize(f.options), /USB verification timed out/)
  assert.equal(f.events.filter(e => e.options?.flash).length, 2)
  assert.equal(f.events.some(e => e.message?.includes('Initialization successful')), false)
})

test('cancellation at the second reset prompt prevents firmware flashing', async () => {
  const f = fixture()
  const controller = new AbortController()
  f.options.signal = controller.signal
  const ask = f.options.ask
  let prompts = 0
  f.options.ask = async prompt => {
    if (++prompts === 2) controller.abort(new Error('cancelled'))
    return ask(prompt)
  }
  await assert.rejects(initialize(f.options), /cancelled/)
  assert.equal(f.events.filter(e => e.options?.flash).length, 1)
})
