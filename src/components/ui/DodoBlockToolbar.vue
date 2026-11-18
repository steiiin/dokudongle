<template>
  <nav class="block-toolbar" aria-label="Dokumentationsbereiche" :data-current-group="current.id">
    <button type="button" class="group-chevron" :disabled="!previous"
      :aria-label="previous ? `Zu ${previous.label}` : 'Kein vorheriger Bereich'"
      @click="previous && emit('navigate', previous.id)">
      <IonIcon :icon="chevronBack" aria-hidden="true" />
    </button>
    <div class="group-heading">
      <span class="group-label">{{ current.label }}</span>
      <span class="edit-indicator" :class="{ edited }" role="img"
        :aria-label="edited ? 'Bearbeitet' : 'Unverändert'" :title="edited ? 'Bearbeitet' : 'Unverändert'" />
    </div>
    <button type="button" class="group-chevron" :disabled="!next"
      :aria-label="next ? `Zu ${next.label}` : 'Kein nächster Bereich'"
      @click="next && emit('navigate', next.id)">
      <IonIcon :icon="chevronForward" aria-hidden="true" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward } from 'ionicons/icons'
import type { DokuGroup, DokuGroupId } from '@/utils/doku-groups'

defineProps<{
  current: DokuGroup
  previous?: DokuGroup
  next?: DokuGroup
  edited: boolean
}>()
const emit = defineEmits<{ navigate: [id: DokuGroupId] }>()
</script>

<style scoped>
.block-toolbar {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  margin: 8px max(12px, var(--ion-safe-area-right, 0px)) 8px max(12px, var(--ion-safe-area-left, 0px));
  border-radius: 24px;
  background: var(--ion-card-background, var(--ion-background-color, #fff));
  color: var(--ion-text-color, #000);
  box-shadow: 0 2px 6px rgb(0 0 0 / 40%);
}
.group-chevron {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ion-color-medium);
  cursor: pointer;
}
.group-chevron ion-icon { font-size: 22px; }
.group-chevron:disabled { opacity: .35; cursor: default; }
.group-chevron:focus-visible { outline: 2px solid var(--ion-color-primary); outline-offset: -3px; }
.group-heading { position: relative; justify-self: center; }
.group-label { font-size: .85rem; font-weight: 600; letter-spacing: 1px; }
.edit-indicator {
  display: none;
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  color: var(--ion-color-medium);
}
.edit-indicator.edited::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: currentColor;
}
</style>
