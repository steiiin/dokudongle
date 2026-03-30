<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'Situation & Unfallmechanik' : 'Situation' }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.situation"
        title="Situation" placeholder="Beschreibe ..."
        :enhance-fn="enhanceGeneral" mandatory
        :placeholders="placeholders">
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
import { enhanceGeneral } from '@/utils/gpt/general'
import { PH_Einweisung, PH_Verlegung } from '@/data/placeholders'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const placeholders = computed(() => {
  const list: Array<string> = []
  if (ctx.value.isCourseVerlegung) { list.push(PH_Verlegung) }
  if (ctx.value.isCourseEinweisung) { list.push(PH_Einweisung) }
  return list
})

</script>
