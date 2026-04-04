<template>

  <hr v-if="ctx.isTrauma">

  <DodoInputTextArea v-model="store.doku.sampler.symptoms.additionalSymptoms"
    title="Symptome" placeholder="Beschreibe ..."
    :quickieKeys="quickieKeys" :enhance-fn="enhanceGeneral">
    Zusätzliche Symptome beschreiben, die weder in Situation, noch ABCDE erfasst wurden, oder<br>
    Infos bezüglich <b>OPQRST</b> ergänzen.
  </DodoInputTextArea>

</template>

<script setup lang="ts">

import { computed } from 'vue'

import { enhanceGeneral } from '@/utils/gpt/general'

import { useDokuStore } from '@/store/doku'
import { QU_AbdominalPain, QU_Einweisung, QU_ExcretionsBowel, QU_ExcretionsUrinary } from '@/data/quickies'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const quickieKeys = computed(() => {
  const list: Array<string> = []
  if (store.doku.xabcdE.abdominal.isAssessed && store.doku.xabcdE.abdominal.value.pain != 'keine') { list.push(QU_AbdominalPain) }
  if (store.doku.xabcdE.excretions.isAssessed)
  {
    if (store.doku.xabcdE.excretions.value.urinaryAbnormalities) { list.push(QU_ExcretionsUrinary) }
    if (store.doku.xabcdE.excretions.value.bowelAbnormalities) { list.push(QU_ExcretionsBowel) }
  }
  return list
})

</script>
<style scoped>

  hr {
    border-top: 1px solid var(--card-bg);
  }

</style>