/**
 * return given text if expression true, otherwise empty
 */
export function textIf(text: string, expr: boolean): string {
  return expr ? text.trim() : ''
}