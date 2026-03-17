export class EnhanceableText {
  public _text: string
  public _undoStack: string[]
  public _redoStack: string[]
  public _editingBaseline: string | null

  public isEnhancing: boolean

  constructor(initialText = '') {
    this._text = initialText
    this._undoStack = []
    this._redoStack = []
    this._editingBaseline = null
    this.isEnhancing = false
  }

  get isEmpty(): boolean {
    return this._text.trim().length === 0
  }

  get value(): string {
    return this._text
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0
  }

  /**
   * Startet eine Benutzersitzung zum Editieren.
   * Mehrere Tastenanschläge werden dadurch später als ein Undo-Schritt behandelt.
   */
  public beginEdit(): void {
    if (this._editingBaseline === null) {
      this._editingBaseline = this._text
    }
  }

  /**
   * Schließt eine Benutzersitzung ab und übernimmt den Text als genau einen Undo-Schritt.
   */
  public commitEdit(nextText: string): void {
    const next = nextText ?? ''
    const baseline = this._editingBaseline ?? this._text

    this._editingBaseline = null

    if (next === baseline) {
      this._text = next
      return
    }

    this._undoStack.push(baseline)
    this._text = next
    this._redoStack = []
  }

  /**
   * Setzt direkt einen neuen Text als eigenen History-Schritt.
   * Für KI-Ersetzungen oder programmatische Änderungen.
   */
  public setText(nextText: string): void {
    const next = nextText ?? ''

    if (next === this._text) {
      return
    }

    this._undoStack.push(this._text)
    this._text = next
    this._redoStack = []
    this._editingBaseline = null
  }

  public applyEnhanced(nextText: string): void {
    this.setText(nextText)
  }

  public undo(): void {
    if (!this.canUndo) {
      return
    }

    this._redoStack.push(this._text)
    this._text = this._undoStack.pop()!
    this._editingBaseline = null
  }

  public redo(): void {
    if (!this.canRedo) {
      return
    }

    this._undoStack.push(this._text)
    this._text = this._redoStack.pop()!
    this._editingBaseline = null
  }

  /**
   * Text ohne History setzen.
   * Nützlich für Initialisierung / API-Mapping.
   */
  public replaceSilently(nextText: string): void {
    this._text = nextText ?? ''
    this._editingBaseline = null
  }

  public clearHistory(): void {
    this._undoStack = []
    this._redoStack = []
    this._editingBaseline = null
  }

  public clear(): void {
    this.setText('')
    this.clearHistory()
  }

  public clone(): EnhanceableText {
    const cloned = new EnhanceableText(this._text)
    cloned._undoStack = [...this._undoStack]
    cloned._redoStack = [...this._redoStack]
    cloned._editingBaseline = this._editingBaseline
    cloned.isEnhancing = this.isEnhancing
    return cloned
  }

  public toJSON() {
    return {
      text: this._text,
      isEnhancing: this.isEnhancing,
    }
  }

  public static fromText(text: string): EnhanceableText {
    return new EnhanceableText(text)
  }
}

export interface AssessedValue<T> {
  assessed: boolean
  value: T
}
export function unassessed<T>(defaultValue: T): AssessedValue<T> {
  return {
    assessed: false,
    value: defaultValue,
  }
}
export function assessed<T>(value: T): AssessedValue<T> {
  return {
    assessed: true,
    value,
  }
}

export interface OptionalValue<T> {
  active: boolean
  value: T
}
export function active<T>(defaultValue: T): OptionalValue<T> {
  return {
    active: false,
    value: defaultValue,
  }
}
export function inactive<T>(value: T): OptionalValue<T> {
  return {
    active: true,
    value,
  }
}
