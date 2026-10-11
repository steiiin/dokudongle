import { describe, expect, test } from 'vitest'
import { snippetStartMutation } from '@/services/text-assist/input-events'

describe('snippet start insertion', () => {
  test.each([
    ['', 0, 0, '@', 1],
    ['Ziel', 4, 4, 'Ziel @', 6],
    ['Ziel ', 5, 5, 'Ziel @', 6],
    ['Ziel:', 5, 5, 'Ziel:@', 6],
    ['Ziel\n', 5, 5, 'Ziel\n@', 6],
    ['Ziel Ende', 5, 5, 'Ziel @Ende', 6],
    ['Ziel Alt Ende', 5, 8, 'Ziel @ Ende', 6],
    ['ZielAlt', 4, 7, 'Ziel @', 6],
    ['ä', 1, 1, 'ä @', 3],
    ['e\u0301', 2, 2, 'e\u0301 @', 4],
    ['1_', 2, 2, '1_ @', 4],
  ])('inserts into %j at %i–%i', (text, selectionStart, selectionEnd, expected, cursor) => {
    const mutation = snippetStartMutation({ text, selectionStart, selectionEnd, isComposing: false })
    expect(text.slice(0, mutation.start) + mutation.replacement + text.slice(mutation.end)).toBe(expected)
    expect(mutation.cursor).toBe(cursor)
  })
})
