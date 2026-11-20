<template>
  <IonPage>
    <IonHeader :mode="mainHeaderMode" class="main-app-header ion-no-border">
      <IonToolbar>
        <div class="with-badge">
          <IonTitle>Eingabe</IonTitle>
        </div>
        <DodoSendAction show-reset></DodoSendAction>
      </IonToolbar>
    </IonHeader>
    <IonContent
      ref="dokuContent"
      fixed-slot-placement="before"
      :class="{ 'dongle-connecting': store.isDongleConnecting }"
      :style="{ '--doku-content-width': dokuContentWidth }"
    >
      <div slot="fixed" class="position-toolbar-vignette" aria-hidden="true" />
      <DodoBlockToolbar slot="fixed" :current="current" :previous="previous" :next="next"
        :edited="editedGroups[current.id]" @navigate="navigate" />

      <div id="container" ref="dokuContainer">

        <section data-doku-group="einsatz" aria-label="Einsatz">
          <DodoContainerCard title="" card-in-card>
            <DodoContainerCard title="Protokoll">
              <IonItem class="protocol-age" :lines="isTransport && ctx.requireFlavors ? 'full' : 'none'">
                <IdentifikationCard />
              </IonItem>
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

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { ProtocolCourse } from '@/types/protocol'
import { provideTextSuggestionScope } from '@/services/text-assist/text-suggestions'
import { editedDokuGroups, visibleDokuGroups } from '@/utils/doku-groups'
import { useDokuGroupNavigation } from '@/composables/useDokuGroupNavigation'

import { useDokuStore } from '@/store/doku'
import { getMainHeaderMode } from '@/utils/ionic-mode'
const mainHeaderMode = getMainHeaderMode()
const store = useDokuStore()
const ctx = computed(() => store.context)
const dokuContent = ref<{ $el?: HTMLIonContentElement } | null>(null)
const dokuContainer = ref<HTMLElement | null>(null)
const dokuContentWidth = ref<string>()
let contentResizeObserver: ResizeObserver | undefined

onMounted(() => {
  // The fixed slot includes the scrollbar gutter; the cards' container does not.
  contentResizeObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0) dokuContentWidth.value = `${entry.contentRect.width}px`
  })
  if (dokuContainer.value) contentResizeObserver.observe(dokuContainer.value)
})
onBeforeUnmount(() => contentResizeObserver?.disconnect())

const isTransport = computed(() => store.doku.course !== ProtocolCourse.NEF_VOR_ORT)
const groups = computed(() => visibleDokuGroups(store.doku.course, ctx.value))
const editedGroups = computed(() => editedDokuGroups(store.doku))
const { current, previous, next, navigate, resetToStart } = useDokuGroupNavigation(dokuContent, groups)

watch(() => store.lastProtocolResetAt, resetToStart)

provideTextSuggestionScope()

</script>
<style lang="scss" scoped>

  ion-content {
    --doku-group-margin-inline: 10px;
    /* 44px pill with 8px clearance above and below, scrolled away with the content. */
    --position-toolbar-space: 60px;
    --padding-top: var(--position-toolbar-space);
  }

  ion-content.ios {
    --doku-group-margin-inline: 16px;
  }

  ion-content::part(scroll) {
    scroll-padding-top: var(--position-toolbar-space);
  }

  .position-toolbar-vignette {
    top: 0;
    inset-inline: 0;
    height: calc(var(--position-toolbar-space) + 8px);
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(to bottom, rgb(0 0 0 / 65%) 0%, rgb(0 0 0 / 40%) 50%, transparent 100%);
  }

  .block-toolbar {
    top: 0;
    inset-inline: 0;
    inline-size: calc(var(--doku-content-width, 100%) - 2 * var(--doku-group-margin-inline));
    z-index: 2;
  }

  .block-toolbar,
  [data-doku-group] > ion-card {
    margin-inline: var(--doku-group-margin-inline);
  }

  #container {
    position: relative;
  }

  .protocol-age {
    --padding-start: 0;
    --inner-padding-end: 0;
  }

  [data-doku-group] {
    display: flow-root;
  }

  [data-doku-group="einsatz"] > ion-card {
    margin-top: 0;
  }

  .dongle-connecting {
    filter: blur(4px);
  }

</style>
