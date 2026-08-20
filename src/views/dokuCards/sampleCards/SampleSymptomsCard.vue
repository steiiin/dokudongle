<template>

    <hr v-if="ctx.isTrauma">

    <DodoInputTextArea v-model="store.doku.sampler.symptoms.additionalSymptoms"
      assist-context-id="sampler.symptoms"
      title="Symptome" placeholder="Beschreibe ..."
      :quickieKeys="quickieKeys">
      Zusätzliche Symptome beschreiben, die weder in Situation, noch ABCDE erfasst wurden, oder<br>
      Infos ergänzen.
    </DodoInputTextArea>

</template>

<script setup lang="ts">

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
import { QU_SYM_AbdominalPain, QU_SYM_ExcretionsBowel, QU_SYM_ExcretionsUrinary, QU_SYM_OPQRST, QU_SCHWINDEL } from '@/data/quickies'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const quickieKeys = computed(() => {
  const list: Array<string> = []

  if (store.doku.xabcdE.abdominal.isAssessed && store.doku.xabcdE.abdominal.value.pain != 'keine')
  {
    list.push(QU_SYM_AbdominalPain)
  }

  if (store.doku.xabcdE.excretions.isAssessed)
  {
    if (store.doku.xabcdE.excretions.value.urinaryAbnormalities) { list.push(QU_SYM_ExcretionsUrinary) }
    if (store.doku.xabcdE.excretions.value.bowelAbnormalities) { list.push(QU_SYM_ExcretionsBowel) }
  }

  if (store.doku.xabcDe.dizziness == 'gerichteter')
  {
    list.push(QU_SCHWINDEL)
  }

  list.push(QU_SYM_OPQRST)

  return list
})

</script>
<style scoped>

  hr {
    border-top: 1px solid var(--card-bg);
  }

</style>
