
import { useDokuStore } from "@/store/doku"
import { ProtocolVerbosity } from "@/types/protocol"
function getCtx() { return useDokuStore().context }

/**
 * return given text if expression true, otherwise empty
 */
export function textIf(text: string, expr: boolean): string {
  return expr ? text : ''
}

/**
 * return given default text if expression is empty, otherwise text
 */
export function textDef(def: string, text: string): string {
  return text == '' ? def : text
}

/**
 * return 'full' if true, otherwise 'none'
 */
export function fullIf(expr: boolean): string {
  return expr ? 'full' : 'none'
}

/**
 * return 'none' if true, otherwise 'full'
 */
export function noneIf(expr: boolean): string {
  return expr ? 'none' : 'full'
}

/**
 * return given text if verbosity == HIGH
 */
export function onHigh(text: string): string {
  if (getCtx().verbosity == ProtocolVerbosity.HIGH) { return text }
  return ''
}

/**
 * return given text if verbosity >= NORMAL
 */
export function onNormal(text: string): string {
  const ctxVerbosity = getCtx().verbosity
  if (ctxVerbosity == ProtocolVerbosity.HIGH || ctxVerbosity == ProtocolVerbosity.NORMAL) {
    return text
  }
  return ''
}
