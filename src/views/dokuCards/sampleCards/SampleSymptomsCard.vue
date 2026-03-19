<template>

  <hr v-if="ctx.isTrauma">

  <DodoInputTextArea v-model="store.doku.sampler.symptoms.additionalSymptoms"
    title="Symptome" :enhance-fn="enhanceSituation">
    <p>Zusätzliche Symptome beschreiben, die weder in Situation, noch ABCDE erfasst wurden.</p>
  </DodoInputTextArea>

</template>

<script setup lang="ts">

import { computed, watch } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

import { basicCap } from '@/utils/autocorrect/basic'
import { fullIf, insetIf } from '@/utils/filter'
import { enhanceSituation } from '@/utils/gpt/situation'

</script>
<style scoped>
hr {
  border-top: 1px solid var(--card-bg);
}
</style>