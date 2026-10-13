<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'Situation & Unfallmechanik' : 'Situation' }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.situation"
        assist-context-id="situation"
        title="Situation" placeholder="Beschreibe ..." mandatory
        :blocks="blocks"
        @activation-change="store.setTextAreaBlockActive">
        Beschreibe das <b>Notfallgeschehen</b> und die <b>Auffindesituation</b> vor Ort. <br>
        <template v-if="ctx.isTrauma">
          <br>
          <b>Verletzungen</b> gehören in die STU.<br>
          Denke an den <b>Unfallzeitpunkt</b>.
        </template>
      </DodoInputTextArea>

    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed } from 'vue'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const blocks = computed(() => store.textAreaBlocks.filter(block => block.target === 'situation'))

</script>
