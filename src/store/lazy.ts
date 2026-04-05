import { defineStore } from 'pinia'

// ############################################################################

function delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ############################################################################

export const useLazyStore = defineStore('lazy', {
  state: () => ({

    abcde: {
      airway: false,
      bleeding: false,
      breathing: false,
      circulation: false,
      disability: false,
      exposure: false,
    },
    sample: {
      allergies: false,
      contacts: false,
      medications: false,
      pler: false,
      symptoms: false,
      stu: false,
    },
    treatment: {
      medications: false,
      redflags: false,
      tasks: false,
    },

    initialize: false,

  }),
  actions: {

    async initHeavyComponents() {

      if (this.initialize) { return }
      this.initialize = true

      await delay(); this.abcde.bleeding = true
      await delay(); this.abcde.airway = true
      await delay(); this.abcde.breathing = true
      await delay(); this.abcde.circulation = true
      await delay(); this.abcde.disability = true
      await delay(); this.abcde.exposure = true

      await delay(); this.sample.stu = true
      await delay(); this.sample.symptoms = true
      await delay(); this.sample.allergies = true
      await delay(); this.sample.medications = true
      await delay(); this.sample.pler = true
      await delay(); this.sample.contacts = true

      await delay(); this.treatment.tasks = true
      await delay(); this.treatment.medications = true
      await delay(); this.treatment.redflags = true

    }

  },
})
