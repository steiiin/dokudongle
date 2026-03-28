<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle @click="store.sendProtocol(true)">Eingabe</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
        <DodoSendAction></DodoSendAction>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">

      <div id="container">

        <IdentifikationCard></IdentifikationCard>
        <DetailLevelCard />

        <template v-if="store.doku.course != ProtocolCourse.NEF_VOR_ORT">

          <!-- FLAVORS -->
          <FlavorsCard v-if="ctx.requireFlavors" />

          <!-- SETTING -->
          <SettingCard v-if="ctx.requireSceneDetails"></SettingCard>

          <!-- SITUATION -->
          <SituationCard></SituationCard>

          <!-- ABCDE -->
          <AbcdeContainerCard v-if="ctx.requireABCDE"></AbcdeContainerCard>

          <!-- SAMPLE -->
          <SampleContainerCard v-if="ctx.requireSampler"></SampleContainerCard>

          <!-- BEHANDLUNG -->
          <TreatmentContainerCard></TreatmentContainerCard>

        </template>

      </div>

    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">

import DetailLevelCard from './dokuCards/DetailLevelCard.vue'
import FlavorsCard from './dokuCards/FlavorsCard.vue'

import IdentifikationCard from './dokuCards/IdentifikationCard.vue'
import SettingCard from './dokuCards/SettingCard.vue'
import SituationCard from './dokuCards/SituationCard.vue'
import AbcdeContainerCard from './dokuCards/AbcdeContainerCard.vue'
import SampleContainerCard from './dokuCards/SampleContainerCard.vue'
import TreatmentContainerCard from './dokuCards/TreatmentContainerCard.vue'

import { computed } from 'vue'
import { ProtocolCourse } from '@/types/protocol'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
<style lang="scss" scoped>

#container {
  position: relative;
}

</style>