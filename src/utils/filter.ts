
import { useDokuStore } from "@/store/doku"
import { ProtocolVerbosity } from "@/types/protocol"
export { conditionalPrefix } from "./text"
import { AssessedValue } from "@/types/protocol/input"

function getCtx() { return useDokuStore().context }

/**
 * Gibt den übergebenen Text zurück, wenn der Ausdruck wahr ist, andernfalls eine leere Zeichenkette.
 */
export function textIf(text: string, expr: boolean): string {
  return expr ? text : ''
}

/**
 * Gibt bei erfolgter Beurteilung den Text für true bzw. false zurück, andernfalls eine leere Zeichenkette.
 */
export function assessedText(value: AssessedValue<boolean>, trueText: string, falseText: string): string {
  return value.isAssessed ? (value.value ? trueText : falseText) : ''
}

/**
 * Gibt bei leerem Text den übergebenen Standardtext zurück, andernfalls den Text selbst.
 */
export function textDef(def: string, text: string): string {
  return text == '' ? def : text
}

/**
 * Gibt bei true 'full' zurück, andernfalls 'none'.
 */
export function fullIf(expr: boolean): 'full' | 'none' {
  return expr ? 'full' : 'none'
}

/**
 * Gibt bei true 'inset' zurück, andernfalls 'none'.
 */
export function insetIf(expr: boolean): 'inset' | 'none' {
  return expr ? 'inset' : 'none'
}

/**
 * Gibt bei true 'none' zurück, andernfalls 'full'.
 */
export function noneIf(expr: boolean): 'none' | 'full' {
  return expr ? 'none' : 'full'
}

/**
 * Gibt bei einer nicht leeren Zeichenkette true zurück, andernfalls false.
 */
export function notEmpty(text: string): boolean {
  return text?.trim().length>0
}

/**
 * Gibt den übergebenen Text zurück, wenn verbosity == HIGH gilt.
 */
export function onHigh(text: string): string {
  if (getCtx().verbosity == ProtocolVerbosity.HIGH) { return text }
  return ''
}

/**
 * Gibt den übergebenen Text zurück, wenn verbosity >= NORMAL gilt.
 */
export function onNormal(text: string): string {
  const ctxVerbosity = getCtx().verbosity
  if (ctxVerbosity == ProtocolVerbosity.HIGH || ctxVerbosity == ProtocolVerbosity.NORMAL) {
    return text
  }
  return ''
}
