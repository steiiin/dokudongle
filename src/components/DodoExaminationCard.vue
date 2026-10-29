<template>
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>{{ title }}</IonCardTitle>
      <IonButton ref="addButton" class="add-examination"
        aria-haspopup="dialog" :aria-expanded="pickerOpen"
        aria-label="Untersuchung hinzufügen" title="Untersuchung hinzufügen" fill="clear" color="dark"
        :disabled="!availableItems.length || pickerBusy" @click="openPicker">
        <IonIcon :src="duplicate" slot="icon-only" aria-hidden="true" />
      </IonButton>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="none"><slot /></IonList>
    </IonCardContent>

    <IonPopover class="examination-picker" :is-open="pickerOpen" :event="pickerEvent"
      reference="trigger" side="bottom" alignment="end" aria-label="Untersuchung hinzufügen"
      @will-dismiss="pickerOpen = false" @did-dismiss="afterDismiss">
      <IonContent>
        <IonList lines="none">
          <IonItem v-for="(item, index) in availableItems" :key="item.id" button :detail="false"
            :lines="item.pickerSeparatorAfter && index < availableItems.length - 1 ? 'full' : 'none'"
            :data-examination="item.id" @click="select(item, item.assessedPresets ? 'negative' : undefined)">
            <component :is="item.picker" />
            <IonButton v-if="item.assessedPresets" slot="start" fill="clear" color="danger" size="default"
              class="positive-examination" :aria-label="`${item.label}: Hinzufügen und bearbeiten`"
              @click.stop="select(item, 'positive')">
              <IonIcon slot="icon-only" :icon="create" aria-hidden="true" />
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPopover>

  </IonCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watchEffect } from 'vue'
import { create, duplicate } from 'ionicons/icons'
import { IonButton } from '@ionic/vue'
import { examinationCardKey, type ExaminationPreset, type ExaminationRegistration } from './examination'

defineProps<{ title: string }>()

const items = shallowRef<ExaminationRegistration[]>([])
const addButton = ref<InstanceType<typeof IonButton> | null>(null)
const pickerOpen = ref(false)
const pickerEvent = shallowRef<Event>()
const pickerBusy = ref(false)
const pending = shallowRef<{ item: ExaminationRegistration; preset?: ExaminationPreset } | null>(null)
const availableItems = computed(() => items.value.filter(item => item.available && !item.assessed))
let mounted = true

function openPicker() {
  if (!availableItems.value.length || pickerBusy.value) return
  // Give Ionic a stable focus target to restore when the picker is cancelled.
  addButton.value?.$el.shadowRoot?.querySelector('button')?.focus()
  pickerEvent.value = { target: addButton.value?.$el } as Event
  pickerOpen.value = true
}

provide(examinationCardKey, {
  async focusAddButton() {
    await nextTick()
    const button = addButton.value?.$el.shadowRoot?.querySelector('button') as HTMLButtonElement | undefined
    if (!button) return
    // Stencil may need multiple frames to re-enable the native button.
    while (mounted && availableItems.value.length && button.disabled) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
    if (mounted && availableItems.value.length && !button.disabled) button.focus()
  },
  register(item) {
    if (items.value.some(existing => existing.id === item.id)) {
      throw new Error(`Duplicate examination id: ${item.id}`)
    }
    items.value = [...items.value, item]
    return () => {
      items.value = items.value.filter(existing => existing !== item)
      if (pending.value?.item === item) pending.value = null
    }
  },
})

watchEffect(() => {
  if (pending.value && (!pending.value.item.available || !pending.value.item.assessed)) pending.value = null
}, { flush: 'post' })

function select(item: ExaminationRegistration, preset?: ExaminationPreset) {
  if (!pickerOpen.value || pickerBusy.value || !availableItems.value.includes(item)) return
  pickerBusy.value = true
  pending.value = { item, preset }
  item.select(preset)
  pickerOpen.value = false
}

async function afterDismiss() {
  pickerOpen.value = false
  await nextTick()
  const selection = pending.value
  pending.value = null
  pickerBusy.value = false
  if (!selection) return
  const { item, preset } = selection
  if (mounted && items.value.includes(item) && item.available && item.assessed) {
    item.focus()
    if (preset !== 'negative') item.activate()
  }
}

onBeforeUnmount(() => {
  mounted = false
  pending.value = null
})
</script>

<style scoped>
ion-card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .25rem;
  padding-block: 0 !important;
}
ion-card-content ion-list {
  padding: 0;
}

.add-examination {
  flex: 0 1 auto;
  margin: 0;
}

.positive-examination {
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
}
</style>
