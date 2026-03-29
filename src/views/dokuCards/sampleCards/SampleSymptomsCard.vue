<template>

  <hr v-if="ctx.isTrauma">

  <DodoInputTextArea v-model="store.doku.sampler.symptoms.additionalSymptoms"
    title="Symptome" placeholder="Beschreibe ..." :enhance-fn="enhanceGeneral">
    Zusätzliche Symptome beschreiben, die weder in Situation, noch ABCDE erfasst wurden, oder<br>
    Infos bezüglich <b>OPQRST</b> ergänzen.
  </DodoInputTextArea>

</template>

<script setup lang="ts">

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

import { enhanceGeneral } from '@/utils/gpt/general'

</script>
<style scoped>
hr {
  border-top: 1px solid var(--card-bg);
}
</style>