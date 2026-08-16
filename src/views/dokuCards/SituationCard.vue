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
import { QU_SIT_Einweisung, QU_SIT_Verlegung } from '@/data/quickies'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const quickieKeys = computed(() => {
  const list: Array<string> = []
  if (ctx.value.isVerlegung) { list.push(QU_SIT_Verlegung) }
  if (ctx.value.isEinweisung) { list.push(QU_SIT_Einweisung) }
  return list
})

</script>
