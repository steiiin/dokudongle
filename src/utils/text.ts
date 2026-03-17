/**
 * Join the string parts to a multiline string
 */
export function multiline(lines: string[]): string {
  return lines.join(' \n')
}

/**
 * Capitalises the first letter of every word in the given string.
 */
export function capitalizeWords(text: string): string {
  const trimmedSplitted = text.trim().split(' ')
  return trimmedSplitted.map(e => capitalizeBegin(e)).filter(e => e).join(' ')
}

/**
 * Capitalises only the first non-space character of the input string.
 */
export function capitalizeBegin(text: string): string {
  const trimmed = text.trimStart()
  const firstLetterIndex = trimmed.search(/\p{L}/u)
  if (firstLetterIndex === -1) return trimmed
  return trimmed.slice(0, firstLetterIndex)
    + trimmed.charAt(firstLetterIndex).toUpperCase()
    + trimmed.slice(firstLetterIndex + 1)
}

/**
 * Prefix given text with prefix if not empty
 */
export function prefix(prefix: string, text: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return '' }
  return `${prefix} ${trimmed}`
}

/**
 * Suffix given text with suffix if not empty
 */
export function suffix(text: string, suffix: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return '' }
  return `${trimmed} ${suffix}`
}

/**
 * Returns placeholder text if original text is empty
 */
export function placeholder(text: string, placeholder: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return `[${placeholder.toUpperCase()}]` }
  return trimmed
}

/**
 * Trims punctuation and whitespace from both ends of the provided string.
 */
export function supertrim(text: string): string {
  return text.replace(/^[.,; ]+|[.,; ]+$/g, "")
}

/**
 * Trims breaks of the text
 */
export function unbreak(text: string): string {
  return text.replace(/[\r\n]+/g, "")
}

/**
 * Appends a newline (or paragraph break) when the text contains content.
 * Accepts either a string or an array of strings.
 */
export function breakDoku(text: string | string[], paragraph: boolean = false): string {
  const block = Array.isArray(text)
    ? text.map(t => t.trim()).filter(Boolean).join('\n').trim()
    : text.trim()

  const linebreak = block.length > 0 ? (paragraph ? '\n\n' : '\n') : ''
  return `${block}${linebreak}`
}

/**
 * Formats a string array (or sub-arrays) to a with comma/semicolon concatted string.
 *
 */
export function concatDoku(array: Array<Array<string>|string>, finishWithDot: boolean = true): string {
  const result = array.reduce<string>((accumulator, item) => {
    let segment = ''

    if (Array.isArray(item)) {
      for (const entry of item) {
        if (!entry) continue
        const trimmed = supertrim(entry)
        if (!trimmed) continue
        segment += (segment ? ', ' : '') + trimmed
      }
    } else {
      const trimmed = supertrim(item)
      if (trimmed) segment = trimmed
    }

    if (!segment) return accumulator

    return accumulator ? `${accumulator}; ${segment}` : segment
  }, '')

  return (finishWithDot && result.trim().length>0 ? `${result}. ` : result).replaceAll('..', '.').replaceAll(',,', ',')
}
