import { correctPhone } from '@/utils/autocorrect/telephone'
import { isCompletionDelimiter, wordAroundCursor, wordRanges } from './text'
import type {
  ImeAutocorrectFlag,
  TextInputChange,
  TextInputSnapshot,
  TextMutation,
} from './types'

interface AppliedImeAutocorrection {
  original: TextInputSnapshot
  corrected: TextInputSnapshot
  capitalize: boolean
}

interface SuppressedCapitalization {
  start: number
  prefix: string
  initial: string
}

export class ImeAutocorrectService {
  private readonly lastCorrections = new Map<string, AppliedImeAutocorrection>()
  private readonly suppressedCapitalizations = new Map<string, SuppressedCapitalization>()

  correctInput(
    change: TextInputChange,
    flags: readonly ImeAutocorrectFlag[],
    baseMutation?: TextMutation,
  ): TextMutation | null {
    if (flags.length === 0) return null
    if (change.before.isComposing || change.after.isComposing) return null
    if (change.before.selectionStart !== change.before.selectionEnd) return null
    if (change.after.selectionStart !== change.after.selectionEnd) return null
    if (!change.inputType.startsWith('insert')) return null

    const originalCursor = change.after.selectionStart
    if (originalCursor === 0) return null
    const lastCharacter = Array.from(change.after.text.slice(0, originalCursor)).at(-1) ?? ''
    const delimiter = isCompletionDelimiter(lastCharacter) ? lastCharacter : ''
    const base = baseMutation ? this.snapshotAfterMutation(change.after, baseMutation) : change.after
    const suppressed = this.activeSuppression(change)
    let text = base.text
    let cursor = base.selectionStart

    for (const flag of flags) {
      if (flag === 'capitalize') {
        const prefixEnd = cursor - delimiter.length
        const prefix = text.slice(0, prefixEnd)
        const editStart = baseMutation?.start ?? change.before.selectionStart
        let offset = 0
        let replacement = prefix
        for (const range of wordRanges(prefix)) {
          // Only touch words reached by this insertion, not earlier words in the field.
          if (range.end < editStart || (suppressed && range.start === suppressed.start)) continue
          const initial = Array.from(range.word)[0]
          const capitalized = initial.toLocaleUpperCase('de-DE')
          const start = range.start + offset
          replacement = replacement.slice(0, start) + capitalized + replacement.slice(start + initial.length)
          offset += capitalized.length - initial.length
        }
        // Retain the existing field-prefix normalization when text is present.
        if (replacement.trimStart()) replacement = replacement.trimStart()
        text = replacement + text.slice(prefixEnd)
        cursor += replacement.length - prefix.length
      }
      if (flag === 'phone') {
        const trailing = delimiter && cursor === text.length ? delimiter : ''
        const number = trailing ? text.slice(0, -trailing.length) : text
        const replacement = /^\s*\+\s*$/.test(number) ? '+' : correctPhone(number)
        const digitsBeforeCursor = (text.slice(0, cursor).match(/\d/g) ?? []).length
        const wasAtEnd = cursor === text.length
        if (wasAtEnd) cursor = replacement.length + trailing.length
        else if (digitsBeforeCursor === 0) cursor = replacement.startsWith('+') && cursor > 0 ? 1 : 0
        else {
          let digits = 0
          cursor = replacement.length
          for (let index = 0; index < replacement.length; index += 1) {
            if (/\d/.test(replacement[index])) digits += 1
            if (digits === digitsBeforeCursor) {
              cursor = index + 1
              break
            }
          }
        }
        text = replacement + trailing
      }
    }
    if (text === base.text) return null

    const corrected = { text, selectionStart: cursor, selectionEnd: cursor, isComposing: false }
    // Live undo restores the inserted character. At a delimiter retain the existing
    // one-Backspace behavior: undo the combined correction and remove that delimiter.
    const originalText = change.after.text.slice(0, originalCursor - delimiter.length)
      + change.after.text.slice(originalCursor)
    const original = {
      text: originalText,
      selectionStart: originalCursor - delimiter.length,
      selectionEnd: originalCursor - delimiter.length,
      isComposing: false,
    }
    this.lastCorrections.set(change.sessionId, { original, corrected, capitalize: flags.includes('capitalize') })

    // Preserve untouched suffixes (including the completion delimiter) in the mutation.
    const suffix = flags.includes('phone')
      ? (delimiter && originalCursor === change.after.text.length ? delimiter : '')
      : change.after.text.slice(originalCursor - delimiter.length)
    return {
      start: 0,
      end: change.after.text.length - suffix.length,
      replacement: suffix ? text.slice(0, -suffix.length) : text,
      cursor,
    }
  }

  tryUndo(sessionId: string, snapshot: TextInputSnapshot): TextMutation | null {
    const correction = this.lastCorrections.get(sessionId)
    if (!correction || snapshot.selectionStart !== snapshot.selectionEnd
      || snapshot.selectionStart !== correction.corrected.selectionStart
      || snapshot.text !== correction.corrected.text) return null
    this.lastCorrections.delete(sessionId)
    const { original } = correction
    const word = correction.capitalize ? wordAroundCursor(original.text, original.selectionStart) : null
    if (word) this.suppressedCapitalizations.set(sessionId, {
      start: word.start,
      prefix: original.text.slice(0, word.start),
      initial: Array.from(word.word)[0],
    })
    return { start: 0, end: snapshot.text.length, replacement: original.text, cursor: original.selectionStart }
  }

  accept(sessionId: string): void {
    this.lastCorrections.delete(sessionId)
  }

  invalidate(sessionId: string): void {
    this.accept(sessionId)
    this.suppressedCapitalizations.delete(sessionId)
  }

  private activeSuppression(change: TextInputChange): SuppressedCapitalization | undefined {
    const suppressed = this.suppressedCapitalizations.get(change.sessionId)
    if (!suppressed) return undefined
    const word = wordAroundCursor(change.before.text, change.before.selectionStart)
    if (word?.start === suppressed.start && word.word.startsWith(suppressed.initial)
      && change.before.text.slice(0, word.start) === suppressed.prefix) return suppressed
    this.suppressedCapitalizations.delete(change.sessionId)
    return undefined
  }

  private snapshotAfterMutation(snapshot: TextInputSnapshot, mutation: TextMutation): TextInputSnapshot {
    return {
      text: snapshot.text.slice(0, mutation.start) + mutation.replacement + snapshot.text.slice(mutation.end),
      selectionStart: mutation.cursor,
      selectionEnd: mutation.cursor,
      isComposing: false,
    }
  }
}
