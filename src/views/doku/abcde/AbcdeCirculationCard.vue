<template>
  <DodoExaminationCard title="C - Circulation">

    <DodoItemModal label="Haut" modal-label="Hautbefund"
      :state="store.doku.xabCde.skinText" lines="full">

      <IonItemDivider>
        <IonLabel>Farbe</IonLabel>
      </IonItemDivider>
      <IonRadioGroup v-model="store.doku.xabCde.skin.color">
        <IonItem lines="inset">
          <IonRadio value="rosig">Rosig</IonRadio>
        </IonItem>
        <IonItem lines="inset">
          <IonRadio value="blass">Blass</IonRadio>
        </IonItem>
        <IonItem lines="inset">
          <IonRadio value="zyanotisch">Zyanotisch</IonRadio>
        </IonItem>
      </IonRadioGroup>
      <IonItem button :detail="true" aria-haspopup="dialog" :aria-expanded="isSkinColorPopoverOpen"
        @click="openSkinColorPopover($event)">
        <IonLabel>Weitere{{ selectedAdditionalSkinColor ? ': ' + selectedAdditionalSkinColor.label : '' }}</IonLabel>
      </IonItem>
      <IonPopover :is-open="isSkinColorPopoverOpen" :event="skinColorPopoverEvent" reference="trigger"
        aria-label="Weitere Hautfarben" @didDismiss="closeSkinColorPopover">
        <IonContent>
          <IonList lines="none">
            <IonItem v-for="option in additionalSkinColors" :key="option.value" button :detail="false"
              :aria-current="store.doku.xabCde.skin.color === option.value ? 'true' : undefined"
              @click="selectSkinColor(option.value)">
              <IonLabel>{{ option.label }}</IonLabel>
              <IonIcon v-if="store.doku.xabCde.skin.color === option.value" slot="end"
                :icon="checkmark" aria-hidden="true" />
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>

      <IonItemDivider>
        <IonLabel>Beschaffenheit</IonLabel>
      </IonItemDivider>
      <DodoInputToggle lines="inset" v-model="store.doku.xabCde.skin.clammy">
        Schweißig?
      </DodoInputToggle>
      <DodoInputToggleOptional id="poorSkinTurgor" label="Stehende Hautfalten?" lines="full" v-model="store.doku.xabCde.skin.poorSkinTurgor" />
      <DodoInputToggleOptional id="hasUrtikaria" label="Quaddeln?" lines="inset" v-model="store.doku.xabCde.skin.hasUrtikaria" />
      <DodoInputToggleOptional id="hasExanthem" label="Exanthem (flächiger Ausschlag)?" lines="inset" v-model="store.doku.xabCde.skin.hasExanthem" />
      <DodoInputToggleOptional id="hasFlush" label="Flush?" v-model="store.doku.xabCde.skin.hasFlush" />

      <IonItemDivider>
        <IonLabel>Temperatur (Extremitäten)</IonLabel>
      </IonItemDivider>
      <IonRadioGroup v-model="store.doku.xabCde.skin.peripheralTemp">
        <IonItem lines="inset">
          <IonRadio value="warm">Warm</IonRadio>
        </IonItem>
        <IonItem>
          <IonRadio value="kühl">Kühl</IonRadio>
        </IonItem>
      </IonRadioGroup>

      <template v-if="store.doku.xabCde.skin.peripheralTemp == 'kühl'">

        <IonItemDivider>
          <IonLabel>Temperatur (Stamm)</IonLabel>
        </IonItemDivider>
        <IonRadioGroup v-model="store.doku.xabCde.skin.centralTemp">
          <IonItem lines="inset">
            <IonRadio value="warm">Warm</IonRadio>
          </IonItem>
          <IonItem>
            <IonRadio value="kühl">Kühl</IonRadio>
          </IonItem>
        </IonRadioGroup>

      </template>

    </DodoItemModal>

    <DodoItemModal label="Puls"
      :state="store.doku.xabCde.pulseText">

      <IonItemDivider>
        <IonLabel>Puls (Peripher)</IonLabel>
      </IonItemDivider>
      <IonRadioGroup v-model="store.doku.xabCde.pulse.peripheralStrength">
        <IonItem>
          <IonRadio value="gut">Gut tastbar</IonRadio>
        </IonItem>
        <IonItem>
          <IonRadio value="schlecht">Schlecht tastbar</IonRadio>
        </IonItem>
        <IonItem>
          <IonRadio value="nicht">Kein Puls</IonRadio>
        </IonItem>
      </IonRadioGroup>

      <template v-if="store.doku.xabCde.pulse.peripheralStrength != 'gut'">

        <IonItemDivider>
          <IonLabel>Puls (Zentral)</IonLabel>
        </IonItemDivider>
        <IonRadioGroup v-model="store.doku.xabCde.pulse.centralStrength">
          <IonItem>
            <IonRadio value="gut">Gut tastbar</IonRadio>
          </IonItem>
          <IonItem>
            <IonRadio value="schlecht">Schlecht tastbar</IonRadio>
          </IonItem>
          <IonItem>
            <IonRadio value="nicht">Kein Puls</IonRadio>
          </IonItem>
        </IonRadioGroup>

      </template>

      <template v-if="ctx.hasPulse">

        <IonItemDivider>
          <IonLabel>Frequenz</IonLabel>
        </IonItemDivider>
        <DodoInputToggle lines="full" v-model="store.doku.xabCde.pulse.rhythmic">
          Regelmäßig?
        </DodoInputToggle>

        <IonRadioGroup v-model="store.doku.xabCde.pulse.rate">
          <IonItem>
            <IonRadio value="normofrequent">Normofrequent</IonRadio>
          </IonItem>
          <IonItem>
            <IonRadio value="bradykard">Bradykard</IonRadio>
          </IonItem>
          <IonItem>
            <IonRadio value="tachykard">Tachykard</IonRadio>
          </IonItem>
        </IonRadioGroup>

      </template>

    </DodoItemModal>

    <DodoInputSelect v-model="store.doku.xabCde.rr" v-if="ctx.hasPulse"
      label="Blutdruck" lines="full"
      :options="[
        { value: '', label: 'Normoton' },
        { value: 'hypoton', label: 'Hypoton' },
        { value: 'hyperton', label: 'Hyperton' },
      ]">
    </DodoInputSelect>

    <DodoExaminationItem id="chest" label="Brustschmerz" show-line="full"
      :removable="store.context.isNonVerbal"
      :assessed="store.doku.xabCde.isExamined('chest')"
      @update:assessed="store.doku.xabCde.assessment.chest = $event ? 'active' : 'inactive'"
      @select="resetChest" @remove="resetChest"
      @activate="chestModal?.open()">
      <DodoItemModal ref="chestModal" label="Brustschmerz"
        :state="store.doku.xabCde.chestpainState" lines="none">

        <DodoInputToggle lines="full" v-model="store.doku.xabCde.chest.tightness" @update:model-value="store.doku.xabCde.assessment.chest = 'active'">
          Brustenge?
        </DodoInputToggle>

        <DodoInputSelect v-model="store.doku.xabCde.chest.pain" @update:model-value="store.doku.xabCde.assessment.chest = 'active'" v-if="ctx.hasPulse"
          label="Brustschmerzen" :lines="insetIf(store.doku.xabCde.chest.pain != 'keine')"
          :options="[
            { value: 'keine', label: 'Keine' },
            { value: 'leichte', label: 'Leicht' },
            { value: '', label: 'Mittel' },
            { value: 'starke', label: 'Stark' },
          ]">
        </DodoInputSelect>

        <template v-if="store.doku.xabCde.chest.pain !== 'keine'">

          <DodoInputToggle lines="inset" v-model="store.doku.xabCde.chest.tenderness" @update:model-value="store.doku.xabCde.assessment.chest = 'active'">
            Druckdolent?
          </DodoInputToggle>

          <DodoInputToggle lines="inset" v-model="store.doku.xabCde.chest.aggravation" @update:model-value="store.doku.xabCde.assessment.chest = 'active'">
            Bewegungsabhängig?
          </DodoInputToggle>

          <DodoInputTextOptional lines="none"
            toggle-label="Strahlt aus?" v-model:toggle="store.doku.xabCde.chest.radiation.assessed" @update:toggle="store.doku.xabCde.assessment.chest = 'active'"
            text-label="Wohin?" text-placeholder="z.B. li. Arm" v-model:text="store.doku.xabCde.chest.radiation.value" @update:text="store.doku.xabCde.assessment.chest = 'active'"
            :ime-dictionary="{ /* IME aktivieren */ }">
          </DodoInputTextOptional>

        </template>

      </DodoItemModal>
    </DodoExaminationItem>

    <DodoInputSelect v-model="store.doku.xabCde.capillaryRefill" v-if="ctx.hasPulse"
      label="Rekap-Zeit" lines="full"
      :options="[
        { value: '1s', label: '1s' },
        { value: '2s', label: '2s' },
        { value: '3s', label: '3s' },
        { value: '>3s', label: '>3s' },
      ]">
    </DodoInputSelect>

    <DodoExaminationItem id="ecg" label="EKG"
      v-model:assessed="store.doku.xabCde.ecg.assessed" show-line="full"
      @select="store.doku.xabCde.ecg.value = 'SR'"
      @activate="ecgModal?.open()" @remove="store.doku.xabCde.ecg.value = 'SR'">
      <DodoItemModal ref="ecgModal" label="EKG"
        :state="store.doku.xabCde.ecgState" lines="none">
        <DodoInputSelect v-model="store.doku.xabCde.ecg.value"
          label="EKG" lines="none"
          :options="[
            { value: 'SR', label: 'Sinusrhythmus' },
            { value: 'VHF', label: 'Vorhofflimmern' },
          ]"
          allow-custom custom-label="Rhythmus"
          custom-placeholder="z.B. TAA 130-160/min">
        </DodoInputSelect>
      </DodoItemModal>
    </DodoExaminationItem>

    <DodoExaminationItem id="edema" label="Ödeme" show-line="full"
      v-model:assessed="store.doku.xabCde.edema.assessed" :available="ctx.hasPulse"
      @select="resetEdema" @activate="edemaSelect?.open()" @remove="resetEdema">
      <DodoInputSelect ref="edemaSelect" v-model="store.doku.xabCde.edema.value.grade"
        label="Ödeme" lines="none"
        :options="[
          'keine Ödeme',
          'Knöchelödeme',
          'Unterschenkelödeme',
          'ausgeprägte abhängige Ödeme',
        ]">
      </DodoInputSelect>
      <DodoInputSelect v-model="store.doku.xabCde.edema.value.variation" v-if="store.doku.xabCde.edema.value.grade != 'keine Ödeme'"
        label="Verlauf" lines="none" empty-label="unklar"
        :options="[
          'neu',
          'zunehmend',
          'bekannt',
        ]">
      </DodoInputSelect>
    </DodoExaminationItem>

  </DodoExaminationCard>
</template>

<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { checkmark } from 'ionicons/icons'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import { isRestoringReanimation } from '@/store/reanimation'

import { AbcdeCirculation } from '@/types/protocol/abcde'
import type { CirculationSkin } from '@/types/protocol/abcde/abcdeCirculation'
import { AssessedValue } from '@/types/protocol/input'
import { insetIf } from '@/utils/filter'

import { useDokuStore } from '@/store/doku'
const store = useDokuStore()
const ctx = computed(() => store.context)

// ############################################################################

const additionalSkinColors = [
  { value: 'ikterisch', label: 'Ikterisch' },
  { value: 'gerötet', label: 'Gerötet' },
  { value: 'marmoriert', label: 'Marmoriert' },
  { value: 'grau-fahl', label: 'Grau-Fahl' },
] as const satisfies readonly { value: CirculationSkin['color']; label: string }[]
const selectedAdditionalSkinColor = computed(() =>
  additionalSkinColors.find(option => option.value === store.doku.xabCde.skin.color))
const isSkinColorPopoverOpen = ref(false)
const skinColorPopoverEvent = ref<Event>()

function openSkinColorPopover(event: Event) {
  skinColorPopoverEvent.value = event
  isSkinColorPopoverOpen.value = true
}

function selectSkinColor(color: CirculationSkin['color']) {
  store.doku.xabCde.skin.color = color
  isSkinColorPopoverOpen.value = false
}

function closeSkinColorPopover() {
  isSkinColorPopoverOpen.value = false
  skinColorPopoverEvent.value = undefined
}

watch(() => store.doku.xabCde.pulse.centralStrength, (v) => {
  if (isRestoringReanimation(store.doku)) return
  if (v == 'schlecht' && store.doku.xabCde.pulse.peripheralStrength == 'gut') {
    store.doku.xabCde.pulse.peripheralStrength = 'schlecht'
  }
  if (v == 'nicht' && store.doku.xabCde.pulse.peripheralStrength != 'nicht') {
    store.doku.xabCde.pulse.peripheralStrength = 'nicht'
  }
}, { flush: 'sync' })

watch(() => store.doku.xabCde.pulse.peripheralStrength, (v) => {
  if (isRestoringReanimation(store.doku)) return
  if (v == 'gut') { store.doku.xabCde.pulse.centralStrength = 'gut' }
  if (v == 'schlecht' && store.doku.xabCde.pulse.centralStrength == 'nicht') {
    store.doku.xabCde.pulse.centralStrength = 'schlecht'
  }
}, { flush: 'sync' })

watch(() => store.doku.xabCde.chest.pain, (v) => {
  if (v == 'keine') {
    store.doku.xabCde.chest.tenderness = false
    store.doku.xabCde.chest.aggravation = false
    store.doku.xabCde.chest.radiation = AssessedValue.unassessed('')
  }
})

const chestModal = ref<InstanceType<typeof DodoItemModal>>()
function resetChest() {
  store.doku.xabCde.chest = new AbcdeCirculation().chest
}

const ecgModal = ref<InstanceType<typeof DodoItemModal>>()
const edemaSelect = ref<InstanceType<typeof DodoInputSelect>>()

function resetEdema() {
  store.doku.xabCde.edema.value = { grade: 'keine Ödeme', variation: 'bekannt' }
}

watch(() => store.doku.xabCde.edema.value.grade, (v) => {
  if (v == 'keine Ödeme') { store.doku.xabCde.edema.value.variation = '' }
})

</script>
<style scoped>

  ion-card {
    --card-bg: #984EA380;
  }

</style>
