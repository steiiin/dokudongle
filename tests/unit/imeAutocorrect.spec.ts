import { describe, expect, test } from 'vitest'
import { ImeAutocorrectService } from '@/services/text-assist/ImeAutocorrectService'
import type { ImeAutocorrectFlag, TextInputChange, TextInputSnapshot, TextMutation } from '@/services/text-assist/types'

const snapshot = (text: string, cursor = text.length): TextInputSnapshot => ({
  text, selectionStart: cursor, selectionEnd: cursor, isComposing: false,
})
const change = (before: string, after: string, beforeCursor = before.length, afterCursor = after.length): TextInputChange => ({
  sessionId: 'live', contextId: 'test', before: snapshot(before, beforeCursor), after: snapshot(after, afterCursor),
  inputType: 'insertText', data: null,
})
const apply = (text: string, mutation: TextMutation | null): string => mutation
  ? text.slice(0, mutation.start) + mutation.replacement + text.slice(mutation.end)
  : text

const correct = (input: TextInputChange, flag: ImeAutocorrectFlag) => {
  const service = new ImeAutocorrectService()
  const mutation = service.correctInput(input, [flag])
  return { text: apply(input.after.text, mutation), cursor: mutation?.cursor ?? input.after.selectionStart, service }
}

describe('live field normalization', () => {
  test.each([
    ['', 'äRztin öMER', 'ÄRztin ÖMER'],
    ['', 'hans-peter o’neill d\'angelo', 'Hans-peter O’neill D\'angelo'],
    ['', 'max,moritz.anna', 'Max,Moritz.Anna'],
    ['', 'ß', 'SS'],
    ['klein ', 'klein m', 'klein M'],
    ['HA ', 'HA w', 'HA W'],
  ])('capitalizes only word initials when inserting %j → %j', (before, after, expected) => {
    const result = correct(change(before, after), 'capitalize')
    expect(result.text).toBe(expected)
    expect(result.cursor).toBe(expected.length)
  })

  test('preserves the suffix and caret when inserting at the start of a word', () => {
    const result = correct(change('HA olf Rest', 'HA wolf Rest', 3, 4), 'capitalize')
    expect(result.text).toBe('HA Wolf Rest')
    expect(result.cursor).toBe(4)
  })

  test('normalizes pasted words and completed composition, but not active composition or selection replacement', () => {
    const service = new ImeAutocorrectService()
    for (const inputType of ['insertFromPaste', 'insertCompositionText']) {
      const input = { ...change('', 'max moritz'), inputType }
      expect(apply(input.after.text, service.correctInput(input, ['capitalize']))).toBe('Max Moritz')
    }
    const composing = change('', 'max')
    composing.after.isComposing = true
    expect(service.correctInput(composing, ['capitalize'])).toBeNull()
    const selection = change('alt', 'neu')
    selection.before.selectionStart = 0
    expect(service.correctInput(selection, ['capitalize'])).toBeNull()
  })

  test.each(['deleteContentBackward', 'deleteContentForward', 'deleteByCut', 'historyUndo'])(
    'does not reformat a %s event', inputType => {
      const input = { ...change('max', 'ma'), inputType }
      expect(new ImeAutocorrectService().correctInput(input, ['capitalize', 'phone'])).toBeNull()
    },
  )

  test('formats each telephone digit, retaining an initial plus and changing the grouping', () => {
    const service = new ImeAutocorrectService()
    let text = ''
    for (const [digit, expected] of [
      ['+', '+'], ['0', '+0'], ['1', '+01'], ['5', '+015'], ['1', '+015 1'],
      ['1', '+015 11'], ['2', '+015 112'], ['3', '+015 1123'], ['4', '+0151 1234'],
      ['5', '+0151 123 45'], ['6', '+0151 123 456'], ['7', '+0151 123 4567'],
    ]) {
      const input = change(text, text + digit)
      const mutation = service.correctInput(input, ['phone'])
      text = apply(input.after.text, mutation)
      expect(text).toBe(expected)
      expect(mutation?.cursor ?? input.after.selectionStart).toBe(expected.length)
    }
  })

  test('regroups the complete telephone number while keeping the caret after the inserted digit', () => {
    const result = correct(change('0151 123 4567', '0151 1923 4567', 6, 7), 'phone')
    expect(result.text).toBe('0151 192 345 67')
    expect(result.cursor).toBe(7)
    expect(result.text.slice(0, result.cursor).replace(/\D/g, '')).toBe('015119')
  })

  test('normalizes a pasted telephone number', () => {
    const input = { ...change('', '+49 (151) 123-4567'), inputType: 'insertFromPaste' }
    expect(correct(input, 'phone').text).toBe('+491 511 234 567')
  })

  test('undoes a telephone regrouping without deleting the inserted digit', () => {
    const result = correct(change('015', '0151'), 'phone')
    expect(result.text).toBe('015 1')
    const undo = result.service.tryUndo('live', snapshot(result.text))
    expect(apply(result.text, undo)).toBe('0151')
    expect(undo?.cursor).toBe(4)
    expect(result.service.tryUndo('live', snapshot('0151'))).toBeNull()
  })

  test('limits undo to the session, complete text and original caret', () => {
    const result = correct(change('HA ', 'HA w'), 'capitalize')
    expect(result.service.tryUndo('other', snapshot(result.text))).toBeNull()
    expect(result.service.tryUndo('live', snapshot(result.text, 0))).toBeNull()
    expect(result.service.tryUndo('live', snapshot('HA W suffix', 4))).toBeNull()
    result.service.invalidate('live')
    expect(result.service.tryUndo('live', snapshot(result.text))).toBeNull()
  })

  test('clears a capitalization override on explicit session invalidation', () => {
    const result = correct(change('', 'w'), 'capitalize')
    result.service.tryUndo('live', snapshot('W'))
    result.service.invalidate('live')
    expect(apply('wo', result.service.correctInput(change('w', 'wo'), ['capitalize']))).toBe('Wo')
  })

  test('keeps an undone initial lowercase when continuing inside the same word', () => {
    const result = correct(change('olf', 'wolf', 0, 1), 'capitalize')
    expect(result.text).toBe('Wolf')
    expect(apply('Wolf', result.service.tryUndo('live', snapshot('Wolf', 1)))).toBe('wolf')
    expect(result.service.correctInput(change('wolf', 'waolf', 1, 2), ['capitalize'])).toBeNull()
    expect(result.service.correctInput(change('waolf', 'waeolf', 2, 3), ['capitalize'])).toBeNull()
  })
})
