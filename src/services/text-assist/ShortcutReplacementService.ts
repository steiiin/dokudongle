import shortcutReplacements from '@/assets/text-assist/shortcut-replacements.json'
import type { TextInputChange, TextInputSnapshot, TextMutation } from './types'
import { isCompletionDelimiter, wordImmediatelyBefore } from './text'

interface AppliedShortcutReplacement {
  original: string
  replacement: string
  start: number
  delimiter: string
  cursorAfterReplacement: number
}

export class ShortcutReplacementService {
  private readonly lastReplacements = new Map<string, AppliedShortcutReplacement>()

  constructor(private readonly replacements: Readonly<Record<string, string>> = shortcutReplacements) {}

  replaceAfterDelimiter(change: TextInputChange): TextMutation | null {
    if (change.before.isComposing || change.after.isComposing) return null
    if (change.before.selectionStart !== change.before.selectionEnd) return null
    if (!change.inputType.startsWith('insert')) return null

    const cursor = change.after.selectionStart
    if (cursor !== change.after.selectionEnd || cursor === 0) return null
    const delimiter = Array.from(change.after.text.slice(0, cursor)).at(-1) ?? ''
    if (!isCompletionDelimiter(delimiter)) return null

    const range = wordImmediatelyBefore(change.after.text, cursor - delimiter.length)
    if (!range || !Object.prototype.hasOwnProperty.call(this.replacements, range.word)) return null
    const replacement = this.replacements[range.word]
    if (!replacement || replacement === range.word) return null

    const cursorAfterReplacement = range.start + replacement.length + delimiter.length
    this.lastReplacements.set(change.sessionId, {
      original: range.word,
      replacement,
      start: range.start,
      delimiter,
      cursorAfterReplacement,
    })

    return {
      start: range.start,
      end: range.end,
      replacement,
      cursor: cursorAfterReplacement,
    }
  }

  tryUndo(sessionId: string, snapshot: TextInputSnapshot): TextMutation | null {
    const applied = this.lastReplacements.get(sessionId)
    if (!applied) return null
    if (snapshot.selectionStart !== snapshot.selectionEnd
      || snapshot.selectionStart !== applied.cursorAfterReplacement) return null

    const expected = applied.replacement + applied.delimiter
    if (snapshot.text.slice(applied.start, applied.cursorAfterReplacement) !== expected) return null
    this.lastReplacements.delete(sessionId)
    return {
      start: applied.start,
      end: applied.cursorAfterReplacement,
      replacement: applied.original,
      cursor: applied.start + applied.original.length,
    }
  }

  invalidate(sessionId: string): void {
    this.lastReplacements.delete(sessionId)
  }
}
