import defaultShortcuts from '@/assets/text-assist/shortcut-replacements.json'
import defaultLocations from '@/assets/snippets/locations.json'
import { loadStoredValue, saveStoredValue } from '@/store/persistence'
import type { LearningScopeState, TextAssistPersistedState } from './types'

const STORAGE_KEY = 'text_assist_state_v1'

export const emptyLearningScope = (): LearningScopeState => ({
  words: {},
  bigrams: {},
  phrases: {},
})

export const emptyTextAssistState = (): TextAssistPersistedState => ({
  schemaVersion: 1,
  shortcutReplacements: { ...defaultShortcuts },
  locationSnippets: structuredClone(defaultLocations),
  userDictionary: [],
  rejectedCorrections: [],
  learning: {
    global: emptyLearningScope(),
    contexts: {},
  },
})

export interface TextAssistStateRepositoryLike {
  initialize(): Promise<TextAssistPersistedState>
  getState(): TextAssistPersistedState
  saveNow(): Promise<void>
  scheduleSave(): void
}

export class TextAssistStateRepository implements TextAssistStateRepositoryLike {
  private state: TextAssistPersistedState = emptyTextAssistState()
  private initialization?: Promise<TextAssistPersistedState>
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private saveChain: Promise<void> = Promise.resolve()

  initialize(): Promise<TextAssistPersistedState> {
    if (!this.initialization) {
      this.initialization = loadStoredValue<TextAssistPersistedState>(STORAGE_KEY).then((stored) => {
        if (stored?.schemaVersion === 1) this.state = this.sanitize(stored)
        return this.state
      }).catch(error => {
        this.initialization = undefined
        throw error
      })
    }
    return this.initialization
  }

  getState(): TextAssistPersistedState {
    return this.state
  }

  scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      void this.saveNow()
    }, 300)
  }

  async saveNow(): Promise<void> {
    await this.initialize()
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    const snapshot = structuredClone(this.state)
    // A failed write must not prevent a later explicit retry from saving.
    this.saveChain = this.saveChain.catch(() => undefined).then(() => saveStoredValue(STORAGE_KEY, snapshot))
    await this.saveChain
  }

  private sanitize(stored: TextAssistPersistedState): TextAssistPersistedState {
    return {
      schemaVersion: 1,
      shortcutReplacements: stored.shortcutReplacements && typeof stored.shortcutReplacements === 'object'
        && !Array.isArray(stored.shortcutReplacements)
        ? Object.fromEntries(Object.entries(stored.shortcutReplacements).filter(([, value]) => typeof value === 'string'))
        : { ...defaultShortcuts },
      locationSnippets: Array.isArray(stored.locationSnippets)
        ? stored.locationSnippets.filter(entry => entry && typeof entry.id === 'string'
          && typeof entry.trigger === 'string' && typeof entry.label === 'string'
          && typeof entry.replacement === 'string'
          && (entry.category === undefined || typeof entry.category === 'string')
          && (entry.keywords === undefined || (Array.isArray(entry.keywords) && entry.keywords.every(word => typeof word === 'string'))))
        : structuredClone(defaultLocations),
      userDictionary: Array.isArray(stored.userDictionary) ? stored.userDictionary : [],
      rejectedCorrections: Array.isArray(stored.rejectedCorrections) ? stored.rejectedCorrections : [],
      learning: {
        global: stored.learning?.global ?? emptyLearningScope(),
        contexts: stored.learning?.contexts ?? {},
      },
    }
  }
}
