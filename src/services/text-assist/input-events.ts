import type { TextInputSnapshot, TextMutation } from './types'

export const snippetStartMutation = (snapshot: TextInputSnapshot): TextMutation => {
  // Die Wortgrenzenregel von SnippetService übernehmen, einschließlich Unicode-Buchstaben und kombinierender Zeichen.
  const previous = Array.from(snapshot.text.slice(0, snapshot.selectionStart)).at(-1) ?? ''
  const replacement = /[\p{L}\p{M}\p{N}_]/u.test(previous) ? ' @' : '@'
  return {
    start: snapshot.selectionStart,
    end: snapshot.selectionEnd,
    replacement,
    cursor: snapshot.selectionStart + replacement.length,
  }
}

export const sameInputSnapshot = (before: TextInputSnapshot | null, after: TextInputSnapshot): boolean =>
  before !== null
  && before.text === after.text
  && before.selectionStart === after.selectionStart
  && before.selectionEnd === after.selectionEnd
  && before.isComposing === after.isComposing

// deleteSurroundingText von AOSP kann das zu löschende Zeichen unmittelbar vor beforeinput
// auswählen, ohne zuvor eine Auswahlbenachrichtigung zu senden. Die letzte Cursorposition ohne Auswahl
// nur beibehalten, wenn die Auswahl exakt dem von dort rückwärts zu löschenden Bereich entspricht.
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

// Manche IMEs lassen beforeinput aus oder erlauben keinen Abbruch. Das Rückgängigmachen erst auslösen,
// wenn bestätigt ist, dass die native Änderung genau einem Rückschritt an der gespeicherten Cursorposition entsprach.
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

  // Der Bereich des Dienstes bezieht sich auf den Text vor dem Löschen, nicht auf das aktuelle DOM.
  return {
    start: 0,
    end: after.text.length,
    replacement: before.text.slice(0, mutation.start) + mutation.replacement + before.text.slice(mutation.end),
    cursor: mutation.cursor,
  }
}
