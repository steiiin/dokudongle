import { EnhanceableText } from '@/types/protocol/input'

// Read through Vue proxies so nested edits remain reactive. Editor history and
// enhancement activity are transient; only the text itself is protocol data.
export function protocolValues(value: unknown): unknown {
  if (value instanceof EnhanceableText) return value.value
  if (Array.isArray(value)) return value.map(protocolValues)
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().map(key => [key, protocolValues(record[key])]))
  }
  return value
}
