<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ ctx.isTrauma ? 'Situation & Unfallmechanik' : 'Situation' }}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>

      <DodoInputTextArea v-model="store.doku.situation"
        assist-context-id="situation"
        title="Situation" placeholder="Beschreibe ..." mandatory
        :quickieKeys="quickieKeys">
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
