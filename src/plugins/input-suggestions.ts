import { Capacitor, registerPlugin } from '@capacitor/core'

interface InputSuggestionsPlugin {
  setSuggestionsDisabled(options: { disabled: boolean }): Promise<void>
}

const InputSuggestions = registerPlugin<InputSuggestionsPlugin>('InputSuggestions')

export async function setInputSuggestionsDisabled(disabled: boolean): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') { return }

  try {
    await InputSuggestions.setSuggestionsDisabled({ disabled })
  }
  catch (error) {
    console.warn('Could not update Android input suggestions mode', error)
  }
}
