<template>

    <hr v-if="ctx.isTrauma">

    <BlockSchwindelCard
      v-if="ctx.requireSampleSymptoms && store.doku.xabcDe.dizziness === 'gerichteter'" />

    <BlockExcretionsBowelsCard
      v-if="ctx.requireSampleSymptoms && store.doku.xabcdE.excretions.isAssessed && store.doku.xabcdE.excretions.value.bowelAbnormalities" />
    <BlockExcretionsUrinaryCard
      v-if="ctx.requireSampleSymptoms && store.doku.xabcdE.excretions.isAssessed && store.doku.xabcdE.excretions.value.urinaryAbnormalities" />

    <BlockBauchschmerzCard v-if="ctx.requireSampleSymptoms && ctx.hasAbdominalIssue" />

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
import { QU_SYM_OPQRST } from '@/data/quickies'
import BlockSchwindelCard from '../blocksourceCards/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '../blocksourceCards/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '../blocksourceCards/BlockExcretionsUrinaryCard.vue'
import BlockBauchschmerzCard from '../blocksourceCards/BlockBauchschmerzCard.vue'

const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const quickieKeys = [QU_SYM_OPQRST]

</script>
<style scoped>

  hr {
    border-top: 1px solid var(--card-bg);
  }

</style>
