<template>
  <IonItem ref="trigger" :lines="lines" button :detail="detail" @click="open">
    <template v-if="useStackedLayout">
      <IonLabel>
        <h2>{{ label }}</h2>
        <p>{{ stateText }}</p>
      </IonLabel>
    </template>
    <template v-else>
      <IonLabel>{{ label }}</IonLabel>
      <IonNote slot="end">{{ stateText }}</IonNote>
    </template>
  </IonItem>
  <IonModal :is-open="isModalOpen" @will-dismiss="closeModal">
    <IonHeader>
      <IonToolbar class="dd-modal-header-toolbar">
        <IonButtons slot="start">
          <IonButton @click="closeModal" aria-label="Zurück" title="Zurück">
            <IonIcon slot="icon-only" :icon="chevronBackOutline" aria-hidden="true" />
          </IonButton>
        </IonButtons>
        <IonTitle type="ios">{{ modalLabel ?? label }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList lines="none">
        <slot />
      </IonList>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { chevronBackOutline } from 'ionicons/icons'

import { computed, ref } from 'vue'
import { IonItem } from '@ionic/vue'

// ############################################################################

const props = withDefaults(defineProps<{
  label: string
  modalLabel?: string
  state?: string
  lines?: 'full' | 'none' | 'inset'
  detail?: boolean
}>(), {
  state: '',
  detail: true,
  lines: 'full'
})

// ############################################################################

const isModalOpen = ref(false)
const trigger = ref<InstanceType<typeof IonItem> | null>(null)

const stateText = computed(() => props.state ?? '')
const useStackedLayout = computed(() => stateText.value.length > 22)

const open = () => {
  trigger.value?.$el.shadowRoot?.querySelector('button')?.focus()
  isModalOpen.value = true
}

defineExpose({ open })

const closeModal = () => {
  isModalOpen.value = false
}

</script>
<style scoped>

  ion-label p {
    font-size: 0.8em;
    line-height: 1;
  }

</style>
