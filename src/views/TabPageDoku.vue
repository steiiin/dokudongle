<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Eingabe</IonTitle>
        </div>
        <DodoSendAction show-reset></DodoSendAction>
      </IonToolbar>
    </IonHeader>
    <IonContent
      ref="dokuContent"
      :fullscreen="true"
      :class="{ 'dongle-connecting': store.isDongleConnecting }"
    >

      <div id="container">

        <IdentifikationCard></IdentifikationCard>
        <DetailLevelCard />

        <div v-show="store.doku.course != ProtocolCourse.NEF_VOR_ORT">

          <!-- EINSATZBESONDERHEITEN -->
          <FlavorsCard v-show="ctx.requireFlavors" />

          <!-- EINSATZUMSTÄNDE -->
          <SettingCard v-show="ctx.requireSceneDetails"></SettingCard>

          <!-- SITUATION -->
          <SituationCard></SituationCard>

          <!-- ABCDE -->
          <AbcdeContainerCard v-show="ctx.requireABCDE"></AbcdeContainerCard>

          <!-- SAMPLE -->
          <SampleContainerCard v-show="ctx.requireSampler"></SampleContainerCard>

          <!-- AUFGABEN -->
          <TasksContainerCard></TasksContainerCard>

        </div>

      </div>

    </IonContent>
    <IonFooter>
      <DodoTextSuggestionHost />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">

import DetailLevelCard from './doku/DetailLevelCard.vue'
import FlavorsCard from './doku/FlavorsCard.vue'
import DodoTextSuggestionHost from '@/components/text-assist/DodoTextSuggestionHost.vue'

import IdentifikationCard from './doku/IdentifikationCard.vue'
import SettingCard from './doku/SettingCard.vue'
import SituationCard from './doku/SituationCard.vue'
import AbcdeContainerCard from './doku/AbcdeContainerCard.vue'
import SampleContainerCard from './doku/SampleContainerCard.vue'
import TasksContainerCard from './doku/TasksContainerCard.vue'

// ############################################################################

import { computed, nextTick, ref, watch } from 'vue'

import { ProtocolCourse } from '@/types/protocol'
import { provideTextSuggestionScope } from '@/services/text-assist/text-suggestions'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)
const dokuContent = ref<{ $el?: HTMLIonContentElement } | null>(null)

watch(() => store.lastProtocolResetAt, async () => {
  await nextTick()
  await dokuContent.value?.$el?.scrollToTop(300)
})

provideTextSuggestionScope()

</script>
<style lang="scss" scoped>

  #container {
    position: relative;
  }

  .dongle-connecting {
    filter: blur(4px);
  }

</style>
