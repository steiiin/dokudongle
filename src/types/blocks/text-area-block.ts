export interface TextAreaBlockField {
  key: string
  color?: string
  customPlaceholder?: string
}

export interface TextAreaBlockSourceState {
  values: Record<string, string>
  active: Record<string, boolean>
}

export interface RenderedTextAreaBlock {
  id: string
  sourceId: string
  target: string
  color: string
  text: string
  complete: boolean
  active: boolean
}

const palette = ['primary', 'tertiary', 'success', 'warning', 'secondary']

/** A generated output, independent of the editable text and its undo history. */
export class TextAreaBlock {
  public readonly color: string

  constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly target: string,
    public readonly template: string,
    public readonly fields: readonly TextAreaBlockField[],
    public readonly mandatory = false,
    color?: string,
  ) {
    const hash = Array.from(id).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
    this.color = color?.trim() || palette[hash % palette.length]
  }

  render(state: TextAreaBlockSourceState): RenderedTextAreaBlock | null {
    const complete = this.fields.every(field => Boolean(state.values[field.key]?.trim()))
    if (!complete && !this.mandatory) return null
    // Replace only template tokens, never tokens contained in a user's values.
    const text = this.template.replace(/<([^<>]+)>/g, (token, key: string) => {
      if (!this.fields.some(field => field.key === key)) return token
      return state.values[key]?.trim() || `[${key}]`
    }).trim()
    return {
      id: this.id, sourceId: this.sourceId, target: this.target,
      color: this.color, text, complete, active: state.active[this.id] !== false,
    }
  }
}

export function composeTextAreaText(manualText: string, blocks: readonly RenderedTextAreaBlock[]): string {
  return [...blocks.filter(block => block.active).map(block => block.text), manualText]
    .map(text => text.trim()).filter(Boolean).join('\n')
}
