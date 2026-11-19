import { defineStore } from 'pinia'
import { loadStoredValue, saveStoredValue } from '@/store/persistence'
import { defaultOutputSettings, hydrateOutputSettings, validOutputGroups, type OutputSettings } from '@/utils/separated-output'

export const OUTPUT_SETTINGS_KEY = 'separated_output_settings'

export const useOutputSettingsStore = defineStore('output-settings', {
  state: () => ({ config: defaultOutputSettings(), saving: false }),
  actions: {
    async hydrate() {
      this.config = hydrateOutputSettings(await loadStoredValue(OUTPUT_SETTINGS_KEY))
    },
    async save(config: OutputSettings) {
      if (this.saving) throw new Error('Die Einstellungen werden bereits gespeichert.')
      if (!validOutputGroups(config.groups)) throw new Error('Bitte eindeutige, nicht leere Überschriften vergeben.')
      this.saving = true
      try {
        const next = hydrateOutputSettings(config)
        await saveStoredValue(OUTPUT_SETTINGS_KEY, next)
        this.config = next
      } finally {
        this.saving = false
      }
    },
  },
})
