<template>

    <hr v-if="ctx.isTrauma">

    <BlockSchwindelCard
      v-if="ctx.requireSampleSymptoms && store.doku.xabcDe.dizziness === 'gerichteter'" />

    <DodoInputTextArea v-model="store.doku.sampler.symptoms.additionalSymptoms"
      assist-context-id="sampler.symptoms"
      :blocks="store.textAreaBlocks.filter(block => block.target === 'sampler.symptoms.additionalSymptoms')"
      @activation-change="store.setTextAreaBlockActive"
      title="Symptome" placeholder="Beschreibe ..."
      :quickieKeys="quickieKeys">
      Zusätzliche Symptome beschreiben, die weder in Situation, noch ABCDE erfasst wurden, oder<br>
      Infos ergänzen.
    </DodoInputTextArea>

</template>

<script setup lang="ts">

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
import { QU_SYM_AbdominalPain, QU_SYM_ExcretionsBowel, QU_SYM_ExcretionsUrinary, QU_SYM_OPQRST } from '@/data/quickies'
import BlockSchwindelCard from '../blocksourceCards/BlockSchwindelCard.vue'

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

  list.push(QU_SYM_OPQRST)

  return list
})

</script>
<style scoped>

  hr {
    border-top: 1px solid var(--card-bg);
  }

</style>
