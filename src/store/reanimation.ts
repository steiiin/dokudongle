import { toRaw, type UnwrapRef } from 'vue'
import type { Protocol } from '@/types/protocol'

type ActiveProtocol = UnwrapRef<Protocol>
type FieldValue = string | number | boolean
type Change = { path: string[]; previous: FieldValue; applied: FieldValue }

// Undo data belongs to this protocol instance only, never to persisted records.
const snapshots = new WeakMap<object, Change[]>()
const restoring = new WeakSet<object>()

export function isRestoringReanimation(protocol: ActiveProtocol): boolean {
  return restoring.has(toRaw(protocol))
}

export function discardReanimationSnapshot(protocol: ActiveProtocol): void {
  snapshots.delete(toRaw(protocol))
}

function clinicalValues(protocol: ActiveProtocol): Map<string, FieldValue> {
  const values = new Map<string, FieldValue>()
  function collect(value: unknown, path: string): void {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      values.set(path, value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) collect(child, `${path}.${key}`)
    }
  }

  values.set('flavors.non_verbal', protocol.flavors.non_verbal)
  for (const key of ['xAbcde', 'xaBcde', 'xabCde', 'xabcDe', 'xabcdE'] as const) {
    collect(protocol[key], key)
  }
  return values
}

export function setReanimation(protocol: ActiveProtocol, enabled: boolean): void {
  if (protocol.flavors.reanimation === enabled) return
  const identity = toRaw(protocol)

  if (enabled) {
    const previous = clinicalValues(protocol)
    protocol.flavors.reanimation = true
    protocol.flavors.non_verbal = true
    protocol.xAbcde.isBreathing = false
    protocol.xabCde.skin.color = 'zyanotisch'
    protocol.xabCde.skin.peripheralTemp = 'kühl'
    protocol.xabCde.skin.centralTemp = 'kühl'
    protocol.xabCde.pulse.peripheralStrength = 'nicht'
    protocol.xabCde.pulse.centralStrength = 'nicht'
    protocol.xabCde.pulse.rhythmic = false
    protocol.xabcDe.avpu = 'bewusstlos'
    protocol.xabcDe.gcs.a = 1
    protocol.xabcDe.gcs.v = 1
    protocol.xabcDe.gcs.m = 1

    // Dependent clinical watchers run synchronously, so their changes are included.
    const applied = clinicalValues(protocol)
    const changes: Change[] = []
    for (const [path, value] of previous) {
      const next = applied.get(path)
      if (next !== undefined && next !== value) {
        changes.push({ path: path.split('.'), previous: value, applied: next })
      }
    }
    snapshots.set(identity, changes)
    return
  }

  // Guard the whole rollback, including changes caused by the flavor itself.
  restoring.add(identity)
  try {
    protocol.flavors.reanimation = false
    for (const change of snapshots.get(identity) ?? []) {
      let parent = protocol as unknown as Record<string, unknown>
      for (const key of change.path.slice(0, -1)) parent = parent[key] as Record<string, unknown>
      const key = change.path[change.path.length - 1]
      if (parent[key] === change.applied) parent[key] = change.previous
    }
  } finally {
    restoring.delete(identity)
    snapshots.delete(identity)
  }
}
