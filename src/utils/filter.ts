
import { useDokuStore } from "@/store/doku"
import { ProtocolVerbosity } from "@/types/protocol"
import { prefix } from "./text"

function getCtx() { return useDokuStore().context }

/**
 * Adds a prefix unless one of the provided keywords is already present in the draft.
 */
export function conditionalPrefix(draft: string, condPrefix: string, condKeywords: Array<string>): string {

  const caseInsensitiveDraft = draft.toLowerCase()
  const caseInsensitiveKeywords = condKeywords.map(w => w.toLowerCase())
  if (caseInsensitiveKeywords.length === 0) {
    return prefix(condPrefix, draft)
  }

  const anyFound = caseInsensitiveKeywords.some(w => caseInsensitiveDraft.includes(w))
  if (anyFound) { return draft }
  return prefix(condPrefix, draft)

}

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
 * return 'inset' if true, otherwise 'none'
 */
export function insetIf(expr: boolean): string {
  return expr ? 'inset' : 'none'
}

/**
 * return 'none' if true, otherwise 'full'
 */
export function noneIf(expr: boolean): string {
  return expr ? 'none' : 'full'
}

/**
 * return true if string not empty, otherwise false
 */
export function notEmpty(text: string): boolean {
  return text?.trim().length>0
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
