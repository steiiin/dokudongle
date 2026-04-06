<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Eingabe</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
        <DodoSendAction></DodoSendAction>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">

      <div id="container">

        <IdentifikationCard></IdentifikationCard>
        <DetailLevelCard />

        <div v-show="store.doku.course != ProtocolCourse.NEF_VOR_ORT">

          <!-- FLAVORS -->
          <FlavorsCard v-show="ctx.requireFlavors" />

          <!-- SETTING -->
          <SettingCard v-show="ctx.requireSceneDetails"></SettingCard>

          <!-- SITUATION -->
          <SituationCard></SituationCard>

          <!-- ABCDE -->
          <AbcdeContainerCard v-show="ctx.requireABCDE"></AbcdeContainerCard>

          <!-- SAMPLE -->
          <SampleContainerCard v-show="ctx.requireSampler"></SampleContainerCard>

          <!-- BEHANDLUNG -->
          <TreatmentContainerCard></TreatmentContainerCard>

        </div>

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

// ############################################################################

import { onIonViewDidEnter } from '@ionic/vue'
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