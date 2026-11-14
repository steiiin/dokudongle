<template>
  <DodoItemModal label="Sehstörungen" :state="vision.findingsText || 'Keine Angabe'">
    <template v-if="$slots.trigger" #trigger="{ open }">
      <slot name="trigger" :open="open" />
    </template>
    <IonItemDivider><IonLabel>Beschwerden</IonLabel></IonItemDivider>
    <DodoInputSelect :model-value="vision.visionLoss" label="Sehverlust"
      @update:model-value="vision.setVisionLoss($event as DisabilityVision['visionLoss'])"
      :options="[
        { value: 'kein', label: 'Keiner' },
        { value: 'rechts', label: 'Rechts' },
        { value: 'links', label: 'Links' },
        { value: 'beide', label: 'Beide' },
      ]" />

    <template v-if="vision.visionLoss !== 'beide'">
      <DodoInputSelectChips :model-value="vision.symptoms" label="Sehbeschwerden"
        @update:model-value="vision.setSymptoms($event as string[])"
        :options="visionSymptoms" empty-label="Keine" allow-custom custom-mode="append"
        custom-option-label="Sonstige" custom-label="Sonstige" />

      <template v-if="vision.selectedSideSymptoms.length">
        <IonItemDivider><IonLabel>Betroffene Seite</IonLabel></IonItemDivider>
        <DodoInputSelect v-for="symptom in vision.selectedSideSymptoms" :key="symptom"
          v-model="vision.sides[symptom]" :label="symptom"
          :options="['rechts', 'links', 'beide', 'unklar']" />
      </template>

      <template v-if="vision.hasDescription">
        <IonItemDivider><IonLabel>Beschreibung</IonLabel></IonItemDivider>
        <DodoExaminationItem v-if="vision.symptoms.includes('Schatten/Vorhang')"
          id="visionShadowDescription" label="Schatten / Vorhang" show-line="inset"
          v-model:assessed="vision.shadowDescription.assessed"
          @activate="visionShadowInput?.setFocus()" @remove="vision.resetShadowDescription()">
          <IonItem lines="none">
            <DodoInputText ref="visionShadowInput" v-model="vision.shadowDescription.value"
              label="Schatten / Vorhang" placeholder="z.B. Lage" />
          </IonItem>
        </DodoExaminationItem>
        <DodoInputSelect v-if="vision.symptoms.includes('Doppelbilder')"
          v-model="vision.doubleImages" label="Doppelbilder pro Auge"
          :options="['nur Rechts', 'nur Links', 'Beide Einzeln', 'Beide Geöffnet', 'Unklar']" />
        <IonItem v-if="vision.symptoms.includes('Fehlender Bildbereich')">
          <DodoInputText v-model="vision.missingAreaDescription" label="Fehlender Bildbereich"
            placeholder="Genauere Beschreibung" />
        </IonItem>
      </template>
    </template>
  </DodoItemModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DodoInputText from '@/components/inputs/DodoInputText.vue'
import { DisabilityVision, visionSymptoms } from '@/types/blocks/sehen'
import { useDokuStore } from '@/store/doku'

const store = useDokuStore()
const vision = computed(() => store.doku.textAreaBlocks.sehen.details)
const visionShadowInput = ref<InstanceType<typeof DodoInputText>>()
</script>
