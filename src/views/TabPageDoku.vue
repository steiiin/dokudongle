<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Eingabe</IonTitle>
          <DodoConnectionBadge></DodoConnectionBadge>
        </div>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">

      <div id="container">

        <DetailLevelCard />
        <FlavorsCard />

        <!-- SETTING -->
        <IdentifikationCard></IdentifikationCard>
        <SettingCard v-if="ctx.requireSceneDetails"></SettingCard>

        <!-- FLAVORS -->

        <!-- SITUATION -->
        <SituationCard></SituationCard>

        <!-- ABCDE -->
        <AbcdeContainerCard></AbcdeContainerCard>

        <!-- SAMPLE -->
        <SampleContainerCard></SampleContainerCard>

        <!-- BEHANDLUNG -->
        <TreatmentContainerCard></TreatmentContainerCard>

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

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

</script>
<style lang="scss" scoped>

#container {
  position: relative;
}

</style>