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
      <slot name="footer" />
    </IonCardContent>

    <IonPopover class="examination-picker" :is-open="pickerOpen" :event="pickerEvent"
      reference="trigger" side="bottom" alignment="end" aria-label="Untersuchung hinzufügen"
      @will-dismiss="pickerOpen = false" @did-dismiss="afterDismiss">
      <IonContent>
        <IonList lines="none">
          <IonItem v-for="item in availableItems" :key="item.id" button :detail="false"
            :data-examination="item.id" @click="select(item)">
            <component :is="item.picker" />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPopover>

  </IonCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watchEffect } from 'vue'
import { duplicate } from 'ionicons/icons'
import { IonButton } from '@ionic/vue'
import { examinationCardKey, type ExaminationRegistration } from './examination'

defineProps<{ title: string }>()

const items = shallowRef<ExaminationRegistration[]>([])
const addButton = ref<InstanceType<typeof IonButton> | null>(null)
const pickerOpen = ref(false)
const pickerEvent = shallowRef<Event>()
const pickerBusy = ref(false)
const pending = shallowRef<ExaminationRegistration | null>(null)
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
    // Stencil updates the native button's disabled state in its next render frame.
    if (button.disabled) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    if (mounted) button.focus()
  },
  register(item) {
    if (items.value.some(existing => existing.id === item.id)) {
      throw new Error(`Duplicate examination id: ${item.id}`)
    }
    items.value = [...items.value, item]
    return () => {
      items.value = items.value.filter(existing => existing !== item)
      if (pending.value === item) pending.value = null
    }
  },
})

watchEffect(() => {
  if (pending.value && (!pending.value.available || !pending.value.assessed)) pending.value = null
}, { flush: 'post' })

function select(item: ExaminationRegistration) {
  if (!pickerOpen.value || pickerBusy.value || !availableItems.value.includes(item)) return
  pickerBusy.value = true
  pending.value = item
  item.select()
  pickerOpen.value = false
}

async function afterDismiss() {
  pickerOpen.value = false
  await nextTick()
  const item = pending.value
  pending.value = null
  pickerBusy.value = false
  if (mounted && item && items.value.includes(item) && item.available && item.assessed) item.activate()
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
.add-examination {
  flex: 0 1 auto;
  margin: 0;
}
</style>
