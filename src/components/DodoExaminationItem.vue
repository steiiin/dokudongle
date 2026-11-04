<template>
  <div v-if="available" ref="row" tabindex="-1" class="examination-item"
    :class="{ 'examination-inactive': !assessed }" :data-examination="id" :data-assessed="assessed">
    <template v-if="assessed">
      <div class="examination-control"><slot /></div>
      <IonButton v-if="removable" fill="clear" color="medium" class="remove-examination"
        :aria-label="`${label || id}: Untersuchung entfernen`" @click.stop="remove">
        <IonIcon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
      </IonButton>
    </template>
    <template v-else>
      <button ref="activation" type="button" class="activate-examination"
        :aria-label="`${label || id}: Untersuchung aktivieren`"
        @click="select">
        <span>{{ label || id }}</span>
        <span class="examination-status"></span>
      </button>
    </template>
    <IonItem v-if="showLine" class="examination-separator"
      :lines="showLine === true ? 'full' : showLine" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { closeOutline } from 'ionicons/icons'

const props = withDefaults(defineProps<{
  id: string
  assessed: boolean
  available?: boolean
  removable?: boolean
  label?: string
  showLine?: boolean | 'full' | 'inset'
}>(), { available: true, removable: true, label: '', showLine: false })
const emit = defineEmits<{
  'update:assessed': [value: boolean]
  select: []
  activate: []
  remove: []
}>()
const row = ref<HTMLElement | null>(null)
const activation = ref<HTMLButtonElement | null>(null)
let busy = false
let mounted = true
onBeforeUnmount(() => { mounted = false })

async function select() {
  if (busy || props.assessed || !props.available) return
  busy = true
  emit('update:assessed', true)
  emit('select')
  await nextTick()
  if (mounted && props.available && props.assessed) {
    row.value?.focus()
    emit('activate')
  }
  busy = false
}

async function remove() {
  if (busy || !props.assessed || !props.removable) return
  busy = true
  emit('update:assessed', false)
  emit('remove')
  await nextTick()
  if (mounted) activation.value?.focus()
  busy = false
}
</script>

<style scoped>
.examination-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}
.examination-control, .activate-examination {
  min-width: 0;
}
.activate-examination {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .25rem .75rem;
  min-height: 48px;
  padding: 8px 16px;
  border: 0;
  background: var(--ion-color-light, #f4f5f8);
  color: var(--ion-color-medium-shade, #60646b);
  font: inherit;
  font-size: 1rem;
  line-height: 1.5;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.ios .activate-examination {
  min-height: 44px;
}
.activate-examination:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: -2px;
}
.examination-status {
  font-size: .8em;
}
.remove-examination {
  min-width: 44px;
  min-height: 44px;
  margin: 0;
}
.examination-separator {
  grid-column: 1 / -1;
  --min-height: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  --background: transparent;
  pointer-events: none;
}
.examination-item:last-child > .examination-separator {
  display: none;
}
</style>
