/**
 * Verbindet die Textteile zu einer mehrzeiligen Zeichenkette.
 */
export function multiline(lines: string[]): string {
  return lines.join(' \n')
}

/**
 * Schreibt den ersten Buchstaben jedes Wortes in der übergebenen Zeichenkette groß.
 */
export function capitalizeWords(text: string): string {
  const trimmedSplitted = text.trim().split(' ')
  return trimmedSplitted.map(e => capitalizeBegin(e)).filter(e => e).join(' ')
}

/**
 * Schreibt nur das erste Zeichen nach führenden Leerzeichen in der Eingabezeichenkette groß.
 */
export function capitalizeBegin(text: string, ignoreLength?: number): string {
  const trimmed = text.trimStart()
  if (trimmed.length === 0) return trimmed
  if (!!ignoreLength && trimmed.length<=ignoreLength) { return trimmed }
  return trimmed.charAt(0).toUpperCase()
    + trimmed.slice(1)
}

/**
 * Stellt dem übergebenen Text das Präfix voran, sofern der Text nicht leer ist.
 */
export function prefix(prefix: string, text: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return '' }
  return `${prefix} ${trimmed}`
}

/**
 * Fügt ein Präfix hinzu, sofern der Entwurf noch keines der übergebenen Schlüsselwörter enthält.
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
 * Hängt das Suffix an den übergebenen Text an, sofern der Text nicht leer ist.
 */
export function suffix(text: string, suffix: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return '' }
  return `${trimmed} ${suffix}`
}

/**
 * Gibt den Platzhaltertext zurück, wenn der ursprüngliche Text leer ist.
 */
export function placeholder(text: string, placeholder: string): string {
  const trimmed = text.trim()
  if (trimmed.length==0) { return `[${placeholder.toUpperCase()}]` }
  return trimmed
}

/**
 * Entfernt Satz- und Leerzeichen an beiden Enden der übergebenen Zeichenkette.
 */
export function supertrim(text: string): string {
  return text.replace(/^[.,; ]+|[.,; ]+$/g, "")
}

/**
 * Entfernt Zeilenumbrüche aus dem Text.
 */
export function unbreak(text: string): string {
  return text.replace(/[\r\n]+/g, "")
}

/**
 * Hängt einen Zeilenumbruch (oder Absatzumbruch) an, wenn der Text Inhalt enthält.
 * Akzeptiert eine Zeichenkette oder ein Array aus Zeichenketten.
 */
export function breakDoku(text: string | string[], paragraph: boolean = false): string {
  const block = Array.isArray(text)
    ? text.map(t => t.trim()).filter(Boolean).join('\n').trim()
    : text.trim()

  const linebreak = block.length > 0 ? (paragraph ? '\n\n' : '\n') : ''
  return `${block}${linebreak}`
}

/**
 * Verbindet ein Array aus Zeichenketten (oder Unterarrays) zu einer durch Kommas und Semikolons getrennten Zeichenkette.
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
