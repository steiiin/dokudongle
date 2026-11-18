<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Eingabe</IonTitle>
        </div>
        <DodoSendAction show-reset></DodoSendAction>
      </IonToolbar>
      <DodoBlockToolbar :current="current" :previous="previous" :next="next"
        :edited="editedGroups[current.id]" @navigate="navigate" />
    </IonHeader>
    <IonContent
      ref="dokuContent"
      :class="{ 'dongle-connecting': store.isDongleConnecting }"
    >

      <div id="container">

        <section data-doku-group="einsatz" aria-label="Einsatz">
          <DodoContainerCard title="Einsatz" card-in-card>
            <IdentifikationCard />
            <DodoContainerCard title="Protokoll">
              <DetailLevelCard />
              <FlavorsCard v-show="isTransport && ctx.requireFlavors" />
            </DodoContainerCard>
            <SettingCard v-show="isTransport && ctx.requireSceneDetails" />
            <SituationCard v-show="isTransport" />
          </DodoContainerCard>
        </section>
        <section data-doku-group="abcde" aria-label="ABCDE" v-show="isTransport && ctx.requireABCDE">
          <AbcdeContainerCard />
        </section>
        <section data-doku-group="sampler" aria-label="SAMPLER" v-show="isTransport && ctx.requireSampler">
          <SampleContainerCard />
        </section>
        <section data-doku-group="aufgaben" aria-label="Aufgaben" v-show="isTransport">
          <TasksContainerCard />
        </section>

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
import DodoBlockToolbar from '@/components/ui/DodoBlockToolbar.vue'
import DodoContainerCard from '@/components/ui/DodoContainerCard.vue'

import IdentifikationCard from './doku/IdentifikationCard.vue'
import SettingCard from './doku/SettingCard.vue'
import SituationCard from './doku/SituationCard.vue'
import AbcdeContainerCard from './doku/AbcdeContainerCard.vue'
import SampleContainerCard from './doku/SampleContainerCard.vue'
import TasksContainerCard from './doku/TasksContainerCard.vue'

// ############################################################################

import { computed, ref, watch } from 'vue'

import { ProtocolCourse } from '@/types/protocol'
import { provideTextSuggestionScope } from '@/services/text-assist/text-suggestions'
import { editedDokuGroups, visibleDokuGroups } from '@/utils/doku-groups'
import { useDokuGroupNavigation } from '@/composables/useDokuGroupNavigation'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)
const dokuContent = ref<{ $el?: HTMLIonContentElement } | null>(null)
const isTransport = computed(() => store.doku.course !== ProtocolCourse.NEF_VOR_ORT)
const groups = computed(() => visibleDokuGroups(store.doku.course, ctx.value))
const editedGroups = computed(() => editedDokuGroups(store.doku))
const { current, previous, next, navigate, resetToStart } = useDokuGroupNavigation(dokuContent, groups)

watch(() => store.lastProtocolResetAt, resetToStart)

provideTextSuggestionScope()

</script>
<style lang="scss" scoped>

  #container {
    position: relative;
  }

  [data-doku-group] {
    display: flow-root;
  }

  .dongle-connecting {
    filter: blur(4px);
  }

</style>
