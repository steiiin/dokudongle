import type { TextInputSnapshot, TextMutation } from './types'

export const sameInputSnapshot = (before: TextInputSnapshot | null, after: TextInputSnapshot): boolean =>
  before !== null
  && before.text === after.text
  && before.selectionStart === after.selectionStart
  && before.selectionEnd === after.selectionEnd
  && before.isComposing === after.isComposing

// AOSP's deleteSurroundingText can select the character to delete immediately
// before beforeinput, without first sending a selection notification. Preserve
// the last collapsed caret only when this is exactly its backward-delete range.
export const snapshotBeforeInput = (
  current: TextInputSnapshot,
  previous: TextInputSnapshot | null,
  inputType: string,
): TextInputSnapshot => {
  if (inputType !== 'deleteContentBackward' || !previous
    || current.isComposing || previous.isComposing
    || current.text !== previous.text
    || previous.selectionStart !== previous.selectionEnd
    || current.selectionEnd !== previous.selectionStart) return current

  const deleted = Array.from(previous.text.slice(0, previous.selectionStart)).at(-1)
  return deleted && current.selectionStart === previous.selectionStart - deleted.length
    ? previous
    : current
}

// Some IMEs omit beforeinput or make it non-cancellable. Only consume undo
// after confirming that the native edit was one Backspace at the saved caret.
export const undoAfterBackwardDeletion = (
  before: TextInputSnapshot,
  after: TextInputSnapshot,
  inputType: string,
  undo: (snapshot: TextInputSnapshot) => TextMutation | null,
): TextMutation | null => {
  if (inputType && inputType !== 'deleteContentBackward') return null
  if (before.isComposing || after.isComposing
    || before.selectionStart !== before.selectionEnd
    || after.selectionStart !== after.selectionEnd) return null

  const cursor = before.selectionStart
  const deleted = Array.from(before.text.slice(0, cursor)).at(-1)
  if (!deleted || after.selectionStart !== cursor - deleted.length
    || after.text !== before.text.slice(0, cursor - deleted.length) + before.text.slice(cursor)) return null

  const mutation = undo(before)
  if (!mutation) return null

  // The service's range refers to the pre-deletion text, not the current DOM.
  return {
    start: 0,
    end: after.text.length,
    replacement: before.text.slice(0, mutation.start) + mutation.replacement + before.text.slice(mutation.end),
    cursor: mutation.cursor,
  }
}
