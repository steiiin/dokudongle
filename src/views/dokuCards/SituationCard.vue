<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'Situation & Unfallmechanik' : 'Situation' }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.situation"
        title="Situation" placeholder="Beschreibe ..."
        :enhance-fn="enhanceGeneral" mandatory
        :quickieKeys="quickieKeys">
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
import { QU_Einweisung, QU_Verlegung } from '@/data/quickies'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const quickieKeys = computed(() => {
  const list: Array<string> = []
  if (ctx.value.isCourseVerlegung) { list.push(QU_Verlegung) }
  if (ctx.value.isCourseEinweisung) { list.push(QU_Einweisung) }
  return list
})

</script>
