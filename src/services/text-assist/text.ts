const WORD_PATTERN = /[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/gu
const SINGLE_WORD_PATTERN = /^[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*$/u

export const DELIMITERS = new Set([' ', '.', ',', ';', ':', '!', '?', '\n'])

export const normalizeKey = (value: string): string => value
  .normalize('NFC')
  .toLocaleLowerCase('de-DE')

export const normalizeDictionaryWord = (value: string): string => value.trim().normalize('NFC')

export const isDictionaryWord = (value: string): boolean => SINGLE_WORD_PATTERN.test(value)

export interface WordRange {
  word: string
  start: number
  end: number
}

export const wordImmediatelyBefore = (text: string, end: number): WordRange | null => {
  const prefix = text.slice(0, end)
  let match: RegExpExecArray | null
  let last: RegExpExecArray | null = null
  WORD_PATTERN.lastIndex = 0
  while ((match = WORD_PATTERN.exec(prefix)) !== null) last = match
  if (!last || last.index + last[0].length !== prefix.length) return null
  return { word: last[0], start: last.index, end }
}

export const wordAtCursor = (text: string, cursor: number): WordRange | null => {
  const prefix = text.slice(0, cursor)
  const range = wordImmediatelyBefore(prefix, prefix.length)
  return range
}

export const wordsBefore = (text: string, cursor: number, limit = 5): string[] => {
  const matches = Array.from(text.slice(0, cursor).matchAll(WORD_PATTERN), match => match[0])
  return matches.slice(-limit)
}

export const damerauLevenshtein = (left: string, right: string): number => {
  const a = Array.from(normalizeKey(left))
  const b = Array.from(normalizeKey(right))
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost)
      }
    }
  }
  return matrix[a.length][b.length]
}
