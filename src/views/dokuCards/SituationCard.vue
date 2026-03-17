<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'Situation & Unfallmechanik' : 'Situation' }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <DodoInputTextArea v-model="store.doku.situation"
        title="Situation" placeholder="Beschreibe ..."
        :enhance-fn="enhanceSituation" mandatory>
        Beschreibe die <b>Situation</b> vor Ort. <br>
        <template v-if="ctx.isTrauma">
          Denke an den <b>Unfallzeitpunkt</b>.
        </template>
        <template v-else>Wenn möglich auch den <i>Grund für den Notruf</i>.</template>
      </DodoInputTextArea>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { enhanceSituation } from '@/utils/gpt/situation'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
