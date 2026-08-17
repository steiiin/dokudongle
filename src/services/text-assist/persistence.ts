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
    this.saveChain = this.saveChain.then(() => saveStoredValue(STORAGE_KEY, snapshot))
    await this.saveChain
  }

  private sanitize(stored: TextAssistPersistedState): TextAssistPersistedState {
    return {
      schemaVersion: 1,
      userDictionary: Array.isArray(stored.userDictionary) ? stored.userDictionary : [],
      rejectedCorrections: Array.isArray(stored.rejectedCorrections) ? stored.rejectedCorrections : [],
      learning: {
        global: stored.learning?.global ?? emptyLearningScope(),
        contexts: stored.learning?.contexts ?? {},
      },
    }
  }
}
