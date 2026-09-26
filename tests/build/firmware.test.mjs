import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepare, check } from '../../scripts/firmware.mjs'
const roots = []
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'doku-build-test-')); roots.push(root)
  mkdirSync(join(root, 'keyboard-sender/xiao_sketch'), { recursive: true })
  mkdirSync(join(root, 'scripts'))
  writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'sketch v1')
  writeFileSync(join(root, 'scripts/firmware.mjs'), 'builder')
  return root
}
const build = (_root, _temp, version) => Buffer.from(`firmware ${version}`)
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
test('initial preparation publishes version 1; unchanged inputs never invoke compiler', () => {
  const root = fixture(); const first = prepare(root, build)
  assert.equal(first.version, 1)
  assert.deepEqual(check(root), first)
  assert.deepEqual(prepare(root, () => { throw new Error('unexpected compile') }), first)
})
test('sketch and build-input changes increment exactly once and stale app builds fail', () => {
  const root = fixture(); prepare(root, build)
  writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'changed')
  assert.throws(() => check(root), /stale/)
  assert.equal(prepare(root, build).version, 2)
  writeFileSync(join(root, 'scripts/firmware.mjs'), 'changed builder')
  assert.equal(prepare(root, build).version, 3)
  assert.equal(prepare(root, build).version, 3)
})
test('failed compilation leaves all previously published data intact', () => {
  const root = fixture(); const first = prepare(root, build)
  writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'changed')
  assert.throws(() => prepare(root, () => { throw new Error('compile failed') }), /compile failed/)
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'firmware-version.json'))), first)
  assert.equal(readFileSync(join(root, 'public/firmware', first.packageFilename), 'utf8'), 'firmware 1')
  assert.equal(prepare(root, build).version, 2)
})
test('missing/corrupt artifact rebuilds the same version', () => {
  const root = fixture(); const first = prepare(root, build)
  for (const corrupt of [false, true]) {
    const file = join(root, 'public/firmware', first.packageFilename)
    if (corrupt) writeFileSync(file, 'bad'); else rmSync(file)
    assert.throws(() => check(root), /corrupt/)
    assert.equal(prepare(root, build).version, 1)
    assert.equal(check(root).version, 1)
  }
})
test('inconsistent manifest is repaired and concurrent builds are refused', () => {
  const root = fixture(); prepare(root, build)
  writeFileSync(join(root, 'public/firmware/manifest.json'), '{}')
  assert.throws(() => check(root), /stale/)
  assert.equal(prepare(root, build).version, 1)
  mkdirSync(join(root, '.firmware-build.lock'))
  assert.throws(() => prepare(root, build), /Another/)
  assert.throws(() => check(root), /running/)
})
test('source changes during compilation never publish a misleading checksum', () => {
  const root = fixture(); const first = prepare(root, build)
  writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'changed')
  assert.throws(() => prepare(root, () => {
    writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'changed again')
    return Buffer.from('stale build')
  }), /changed while compiling/)
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'firmware-version.json'))), first)
})


// Exercise the real builder in an isolated process: PATH contains only test tools.
function toolchainFixture() {
  const root = fixture()
  const first = prepare(root, build)
  const published = ['firmware-version.json', 'public/firmware/manifest.json', `public/firmware/${first.packageFilename}`]
    .map(file => [join(root, file), readFileSync(join(root, file))])
  const bin = join(root, 'bin'); mkdirSync(bin)
  const temp = join(root, 'temp'); mkdirSync(temp)
  const log = join(root, 'tool-calls.jsonl')
  const executables = {}
  for (const name of ['arduino-cli', 'adafruit-nrfutil', 'python3']) {
    const path = join(bin, name)
    writeFileSync(path, `#!${process.execPath}
const fs = require('node:fs')
const args = process.argv.slice(2)
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ name: ${JSON.stringify(name)}, args }) + '\\n')
if (args[0] === 'core') {
  console.log(JSON.stringify({ platforms: [{ id: 'Seeeduino:nrf52', installed_version: '1.1.13' }] }))
} else if (args[0] === 'compile') {
  console.error('compiler diagnostic: intentional test failure')
  process.exitCode = 17
} else {
  console.log('test tool version')
}
`, { mode: 0o755 })
    executables[name] = path
  }
  const env = { ...process.env, PATH: bin, TMPDIR: temp, TMP: temp, TEMP: temp, ARDUINO_CLI: '', ADAFRUIT_NRFUTIL: '' }
  const run = () => spawnSync(process.execPath, ['--input-type=module', '-e', `
import { prepare } from ${JSON.stringify(new URL('../../scripts/firmware.mjs', import.meta.url).href)}
try { prepare(process.argv[1]) }
catch (error) { console.error(error.message); process.exitCode = 1 }
`, root], { env, encoding: 'utf8' })
  return {
    root, env, executables, run,
    change: () => writeFileSync(join(root, 'keyboard-sender/xiao_sketch/xiao_sketch.ino'), 'changed'),
    calls: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [],
    assertPreserved: () => {
      for (const [path, bytes] of published) assert.deepEqual(readFileSync(path), bytes)
      assert.equal(existsSync(join(root, '.firmware-build.lock')), false)
      assert.deepEqual(readdirSync(temp), [])
      assert.deepEqual(readdirSync(join(root, 'public/firmware')).sort(), [first.packageFilename, 'manifest.json'].sort())
    },
  }
}

for (const [name, label, hint] of [
  ['arduino-cli', 'Arduino CLI', 'ARDUINO_CLI'],
  ['adafruit-nrfutil', 'adafruit-nrfutil', 'ADAFRUIT_NRFUTIL'],
  ['python3', 'Python 3', 'Install Python 3'],
]) {
  for (const failure of ['missing', 'permission']) {
    test(`${name}: ${failure} is actionable and preserves published firmware`, () => {
      const fixture = toolchainFixture(); fixture.change()
      if (failure === 'missing') rmSync(fixture.executables[name])
      else chmodSync(fixture.executables[name], 0o644)
      const result = fixture.run()
      assert.equal(result.status, 1, result.stderr)
      assert.ok(result.stderr.includes(`${label} (${JSON.stringify(name)})`), result.stderr)
      assert.ok(result.stderr.includes(hint), result.stderr)
      assert.match(result.stderr, failure === 'missing' ? /was not found/ : /permission denied/)
      assert.equal(fixture.calls().some(call => call.args[0] === 'compile'), false)
      fixture.assertPreserved()
    })
  }
}

for (const [variable, name] of [['ARDUINO_CLI', 'arduino-cli'], ['ADAFRUIT_NRFUTIL', 'adafruit-nrfutil']]) {
  test(`${variable}: invalid override reports the configured path without falling back to PATH`, () => {
    const fixture = toolchainFixture(); fixture.change()
    const missing = join(fixture.root, 'missing tool')
    fixture.env[variable] = missing
    const result = fixture.run()
    assert.equal(result.status, 1, result.stderr)
    assert.ok(result.stderr.includes(JSON.stringify(missing)), result.stderr)
    assert.ok(result.stderr.includes(variable), result.stderr)
    assert.match(result.stderr, /was not found/)
    assert.equal(fixture.calls().some(call => call.name === name), false)
    fixture.assertPreserved()
  })
}

test('a tool that exits unsuccessfully retains diagnostics and is not reported as missing', () => {
  const fixture = toolchainFixture(); fixture.change()
  writeFileSync(fixture.executables['adafruit-nrfutil'], `#!${process.execPath}\nconsole.error('broken Python dependency'); process.exitCode = 3\n`)
  const result = fixture.run()
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /adafruit-nrfutil.*failed:/)
  assert.match(result.stderr, /broken Python dependency/)
  assert.doesNotMatch(result.stderr, /was not found|permission denied/)
  assert.equal(fixture.calls().some(call => call.args[0] === 'compile'), false)
  fixture.assertPreserved()
})

test('valid overrides are used and compiler diagnostics survive a failed build', () => {
  const fixture = toolchainFixture(); fixture.change()
  for (const [variable, name] of [['ARDUINO_CLI', 'arduino-cli'], ['ADAFRUIT_NRFUTIL', 'adafruit-nrfutil']]) {
    const path = join(fixture.root, `${name} with spaces`)
    writeFileSync(path, readFileSync(fixture.executables[name]), { mode: 0o755 })
    fixture.env[variable] = path
    rmSync(fixture.executables[name])
  }
  const result = fixture.run()
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /compiler diagnostic: intentional test failure/)
  assert.match(result.stderr, /Arduino CLI.*failed:/)
  assert.deepEqual(fixture.calls().slice(0, 3).map(call => call.args), [['version'], ['version'], ['--version']])
  assert.equal(fixture.calls().some(call => call.args[0] === 'compile'), true)
  fixture.assertPreserved()
})

test('unchanged valid firmware needs no toolchain in the real builder', () => {
  const fixture = toolchainFixture()
  for (const path of Object.values(fixture.executables)) rmSync(path)
  fixture.env.ARDUINO_CLI = join(fixture.root, 'missing cli')
  fixture.env.ADAFRUIT_NRFUTIL = join(fixture.root, 'missing nrfutil')
  const result = fixture.run()
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(fixture.calls(), [])
  fixture.assertPreserved()
})
