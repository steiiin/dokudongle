<template>
  <IonCard class="representation-card">
    <IonCardHeader>
      <IonCardTitle>Vertretung</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonList lines="full">
        <DodoItemModal label="Vertreter" :state="representation.representativeSummary">
          <DodoInputSelect :model-value="representation.representative.role" label="Vertreter vorhanden?"
            :options="representativeRoles" empty-label="Nein" :lines="representation.representative.role ? 'full' : 'none'"
            @update:model-value="setRepresentativeRole($event as RepresentativeRole)"
            @ionDismiss="focusRepresentativeName" />
          <template v-if="representation.representative.role">
            <IonItem :lines="hasNameSuggestions ? 'none' : 'full'">
              <DodoInputText ref="nameInput" v-model="representation.representative.name" label="↳ Wer?"
                :placeholder="namePlaceholder" />
            </IonItem>
            <IonItem v-if="nameSuggestions.length" lines="full">
              <div class="name-suggestions">
                <IonChip v-for="name in nameSuggestions" :key="name" class="name-suggestion"
                  color="primary" outline role="button" tabindex="0"
                  @click="representation.representative.name = name"
                  @keydown.enter.prevent="representation.representative.name = name"
                  @keydown.space.prevent="representation.representative.name = name">
                  {{ name }}
                </IonChip>
              </div>
            </IonItem>
            <DodoInputSelect v-model="representation.representative.involvement" label="Beteiligung"
              :options="representativeInvolvements" lines="none" />
          </template>
        </DodoItemModal>

        <div class="advance-directive">
          <DodoInputSelect :model-value="representation.advanceDirective.status" label="Patientenverfügung"
            :options="['Keine', 'Vorhanden', 'Keine Angabe']" lines="none"
            @update:model-value="representation.setDirectiveStatus($event as DirectiveStatus)" />
          <template v-if="representation.advanceDirective.status === 'Vorhanden'">
            <DodoInputSelectChips :model-value="representation.advanceDirective.restrictions"
              label="↳ Beschränkungen?" :options="restrictionOptions" empty-label="Keine Angabe" lines="none"
              @update:model-value="representation.setRestrictions($event as TherapyRestriction[])" />
            <IonItem v-if="representation.advanceDirective.restrictions.includes('Andere')" lines="none">
              <DodoInputText v-model="representation.advanceDirective.otherRestriction"
                label="↳ Andere" placeholder="Therapiebeschränkung beschreiben" />
            </IonItem>
          </template>
        </div>
      </IonList>
    </IonCardContent>
  </IonCard>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import DodoInputText from '@/components/inputs/DodoInputText.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import { useDokuStore } from '@/store/doku'
import {
  representativeRoles, representativeInvolvements, therapyRestrictions,
  type DirectiveStatus, type TherapyRestriction, type RepresentativeRole,
} from '@/types/protocol/sample/sampleRepresentation'

const store = useDokuStore()
const representation = computed(() => store.doku.sampler.representation)
const nameInput = ref<InstanceType<typeof DodoInputText> | null>(null)
let pendingNameFocus = false

const setRepresentativeRole = (role: RepresentativeRole) => {
  pendingNameFocus = !!role && role !== representation.value.representative.role
  representation.value.setRepresentativeRole(role)
}

const focusRepresentativeName = async () => {
  if (!pendingNameFocus) return
  pendingNameFocus = false
  // Let Ionic restore select focus and Vue render the dependent input first.
  await nextTick()
  if (representation.value.representative.role) nameInput.value?.setFocus()
}

const namePlaceholder = computed(() => {
  switch (representation.value.representative.role) {
    case 'Sorgeberechtigt': return 'z.B. Mama'
    case 'Bevollmächtigter': return 'z.B. Tochter'
    case 'Rechtl. Betreuer': return 'z.B. Frau Müller'
    default: return 'Name/Bezeichnung'
  }
})
const nameSuggestions = computed(() => {
  switch (representation.value.representative.role) {
    case 'Sorgeberechtigt': return ['Mama', 'Papa']
    case 'Bevollmächtigter': return ['Tochter', 'Sohn', 'Vater', 'Mutter']
    default: return []
  }
})
const hasNameSuggestions = computed(() => nameSuggestions.value.length>0)
const restrictionOptions = computed(() => representation.value.advanceDirective.restrictions.includes('Keine Einschränkungen')
  ? ['Keine Einschränkungen', 'Andere']
  : therapyRestrictions)
</script>

<style scoped>
.representation-card {
  --card-bg: #3a2550;
  container-type: inline-size;
}
ion-card-content {
  margin: 0;
  padding: 0 0 10px;
}
.name-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: .25rem;
}
.name-suggestion {
  min-height: 44px;
  border-radius: 9999px;
}

/* Labels and entered values each need a full line on narrow nested cards. */
@container (max-width: 420px) {
  :deep(.advance-directive ion-select::part(wrapper)) {
    flex-direction: column;
    align-items: stretch;
  }
  :deep(.advance-directive ion-select::part(label)) {
    margin: 0;
    max-width: 100%;
  }
  :deep(.advance-directive ion-select::part(inner)) {
    padding-bottom: 8px;
  }
  :deep(.dd-input-select-chips) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
  :deep(.dd-input-select-chips__label) {
    grid-column: 1 / -1;
    hyphens: auto;
  }
  :deep(.dd-input-select-chips__summary) {
    text-align: start;
    font-size: .875em;
  }
}
</style>
