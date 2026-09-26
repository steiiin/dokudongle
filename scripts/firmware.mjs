import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

export const buildConfig = {
  core: 'Seeeduino:nrf52', coreVersion: '1.1.13',
  fqbn: 'Seeeduino:nrf52:xiaonRF52840:softdevice=s140v6,debug=l0',
  softdevice: '0x0123', target: 'xiao-nrf52840', targetId: 1, protocolRevision: 1,
  packageFormat: 'nordic-legacy-application',
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const manifestPath = root => join(root, 'firmware-version.json')
const assets = root => join(root, 'public/firmware')
const readManifest = root => existsSync(manifestPath(root)) ? JSON.parse(readFileSync(manifestPath(root), 'utf8')) : null
const help = 'Run npm run firmware:prepare (VSCode: Prepare dongle firmware).'

export function inputs(root) {
  const sketchDirectory = join(root, 'keyboard-sender/xiao_sketch')
  const files = directory => readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [[path.slice(root.length + 1), sha256(readFileSync(path))]]
  })
  return {
    sketchSha256: sha256(readFileSync(join(sketchDirectory, 'xiao_sketch.ino'))),
    buildFingerprint: sha256(JSON.stringify({ buildConfig, files: files(sketchDirectory),
      builder: sha256(readFileSync(join(root, 'scripts/firmware.mjs'))) })),
  }
}
function validManifest(manifest) {
  return manifest && Number.isInteger(manifest.version) && manifest.version >= 1 && manifest.version <= 0xfffffffe
    && manifest.target === buildConfig.target && manifest.targetId === 1 && manifest.protocolRevision === 1
    && /^dongle-v\d+-[a-f0-9]{16}\.zip$/.test(manifest.packageFilename)
    && ['sketchSha256', 'buildFingerprint', 'packageSha256'].every(key => /^[a-f0-9]{64}$/.test(manifest[key]))
}
function validPackage(root, manifest) {
  try {
    return validManifest(manifest)
      && sha256(readFileSync(join(assets(root), manifest.packageFilename))) === manifest.packageSha256
      && readFileSync(join(assets(root), 'manifest.json'), 'utf8') === JSON.stringify(manifest, null, 2) + '\n'
  } catch { return false }
}
export function check(root) {
  if (existsSync(join(root, '.firmware-build.lock'))) throw new Error('Firmware preparation is running. Retry after it finishes.')
  const manifest = readManifest(root)
  const current = inputs(root)
  if (!validPackage(root, manifest) || manifest.sketchSha256 !== current.sketchSha256 || manifest.buildFingerprint !== current.buildFingerprint) {
    throw new Error(`Bundled dongle firmware is missing, corrupt, or stale. ${help}`)
  }
  return manifest
}

function compile(root, temp, version) {
  const cli = process.env.ARDUINO_CLI || 'arduino-cli'
  const nrfutil = process.env.ADAFRUIT_NRFUTIL || 'adafruit-nrfutil'
  const cores = JSON.parse(execFileSync(cli, ['core', 'list', '--format', 'json'], { encoding: 'utf8' }))
  const installed = Array.isArray(cores) ? cores : cores.platforms ?? []
  if (!installed.some(core => core.id === buildConfig.core && (core.installed_version ?? core.installed) === buildConfig.coreVersion)) {
    throw new Error(`Install ${buildConfig.core}@${buildConfig.coreVersion} with Arduino CLI first.`)
  }
  execFileSync(cli, ['compile', '--fqbn', buildConfig.fqbn, '--build-path', temp,
    '--build-property', `compiler.cpp.extra_flags=-DDOKU_FIRMWARE_VERSION=${version}UL`,
    join(root, 'keyboard-sender/xiao_sketch')], { stdio: 'inherit' })
  const output = join(temp, 'application.zip')
  execFileSync(nrfutil, ['dfu', 'genpkg', '--dev-type', '0x0052', '--sd-req', buildConfig.softdevice,
    '--application-version', String(version), '--application', join(temp, 'xiao_sketch.ino.hex'), output], { stdio: 'inherit' })
  // Reject wrong package types and verify init-packet version, target stack, and CRC.
  execFileSync('python3', ['-c', `
import json, struct, sys, zipfile, binascii
with zipfile.ZipFile(sys.argv[1]) as z:
 m = json.loads(z.read('manifest.json'))['manifest']
 assert set(m) <= {'application', 'dfu_version'} and 'application' in m, 'Only application updates are permitted'
 a = m['application']; image = z.read(a['bin_file']); init = z.read(a['dat_file'])
 device, revision, version, count = struct.unpack_from('<HHIH', init)
 assert device == 0x52 and version == int(sys.argv[2])
 assert 0x123 in struct.unpack_from('<' + 'H'*count, init, 10)
 crc, = struct.unpack_from('<H', init, 10 + 2*count)
 assert image and binascii.crc_hqx(image, 0xffff) == crc
 assert len(image) <= 811008, 'Application exceeds board flash allocation'
`, output, String(version)], { stdio: 'inherit' })
  return readFileSync(output)
}

export function prepare(root, builder = compile) {
  const lock = join(root, '.firmware-build.lock')
  try { mkdirSync(lock) } catch { throw new Error('Another firmware preparation owns .firmware-build.lock. Remove a stale lock only after confirming it is no longer running.') }
  const temp = mkdtempSync(join(tmpdir(), 'dokudongle-firmware-'))
  try {
    const previous = readManifest(root)
    if (previous && !validManifest(previous)) throw new Error('Invalid firmware-version.json; restore it before preparing firmware.')
    const current = inputs(root)
    const unchanged = previous && previous.sketchSha256 === current.sketchSha256 && previous.buildFingerprint === current.buildFingerprint
    if (unchanged && validPackage(root, previous)) return previous
    const version = previous ? previous.version + (unchanged ? 0 : 1) : 1
    if (version > 0xfffffffe) throw new Error('Firmware version exhausted.')
    const bytes = builder(root, temp, version)
    if (JSON.stringify(inputs(root)) !== JSON.stringify(current)) throw new Error('Firmware inputs changed while compiling; retry preparation.')
    const packageSha256 = sha256(bytes)
    const manifest = { version, ...current, target: buildConfig.target, targetId: 1, protocolRevision: 1,
      packageFilename: `dongle-v${version}-${packageSha256.slice(0, 16)}.zip`, packageSha256 }
    const json = JSON.stringify(manifest, null, 2) + '\n'
    mkdirSync(assets(root), { recursive: true })
    const changes = [[join(assets(root), manifest.packageFilename), bytes], [join(assets(root), 'manifest.json'), json], [manifestPath(root), json]]
    const originals = changes.map(([path]) => [path, existsSync(path) ? readFileSync(path) : null])
    try {
      for (const [path, data] of changes) {
        writeFileSync(path + '.tmp', data)
        renameSync(path + '.tmp', path)
      }
    } catch (error) {
      for (const [path, data] of originals) {
        if (data === null) rmSync(path, { force: true }); else writeFileSync(path, data)
        rmSync(path + '.tmp', { force: true })
      }
      throw error
    }
    if (previous && previous.packageFilename !== manifest.packageFilename) rmSync(join(assets(root), previous.packageFilename), { force: true })
    return manifest
  } finally {
    rmSync(temp, { recursive: true, force: true })
    rmSync(lock, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  try {
    const mode = process.argv[2]
    if (!['prepare', 'check'].includes(mode)) throw new Error('Usage: node scripts/firmware.mjs prepare|check')
    const manifest = mode === 'prepare' ? prepare(root) : check(root)
    console.log(`Dongle firmware v${manifest.version}: ${manifest.packageFilename}`)
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
