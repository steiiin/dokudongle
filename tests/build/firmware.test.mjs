import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
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
