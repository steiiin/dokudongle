import { correctPhone } from '@/utils/autocorrect/telephone'
import { capitalizeBegin } from '@/utils/text'
import { isCompletionDelimiter } from './text'
import type {
  ImeAutocorrectFlag,
  TextInputChange,
  TextInputSnapshot,
  TextMutation,
} from './types'

interface AppliedImeAutocorrection {
  original: string
  replacement: string
  delimiter: string
  cursorAfterCorrection: number
}

export class ImeAutocorrectService {
  private readonly lastCorrections = new Map<string, AppliedImeAutocorrection>()

  correctAfterDelimiter(
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
    const delimiter = Array.from(change.after.text.slice(0, originalCursor)).at(-1) ?? ''
    if (!isCompletionDelimiter(delimiter)) return null

    const originalPrefixEnd = originalCursor - delimiter.length
    const originalPrefix = change.after.text.slice(0, originalPrefixEnd)
    const baseSnapshot = baseMutation
      ? this.snapshotAfterMutation(change.after, baseMutation)
      : change.after
    const completedPrefixEnd = baseSnapshot.selectionStart - delimiter.length
    if (completedPrefixEnd < 0) return null

    const completedPrefix = baseSnapshot.text.slice(0, completedPrefixEnd)
    const replacement = flags.reduce((value, flag) => this.applyFlag(value, flag), completedPrefix)
    if (replacement === completedPrefix) return null

    const cursorAfterCorrection = replacement.length + delimiter.length
    this.lastCorrections.set(change.sessionId, {
      original: originalPrefix,
      replacement,
      delimiter,
      cursorAfterCorrection,
    })

    return {
      start: 0,
      end: originalPrefixEnd,
      replacement,
      cursor: cursorAfterCorrection,
    }
  }

  tryUndo(sessionId: string, snapshot: TextInputSnapshot): TextMutation | null {
    const correction = this.lastCorrections.get(sessionId)
    if (!correction) return null
    if (snapshot.selectionStart !== snapshot.selectionEnd
      || snapshot.selectionStart !== correction.cursorAfterCorrection) return null

    const expected = correction.replacement + correction.delimiter
    if (snapshot.text.slice(0, correction.cursorAfterCorrection) !== expected) return null
    this.lastCorrections.delete(sessionId)
    return {
      start: 0,
      end: correction.cursorAfterCorrection,
      replacement: correction.original,
      cursor: correction.original.length,
    }
  }

  invalidate(sessionId: string): void {
    this.lastCorrections.delete(sessionId)
  }

  private applyFlag(value: string, flag: ImeAutocorrectFlag): string {
    if (flag === 'capitalize') return capitalizeBegin(value)
    if (flag === 'phone') return correctPhone(value)
    return value
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
