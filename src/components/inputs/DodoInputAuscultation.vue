<template>
  <template v-for="(group, index) in groups" :key="group.title">
    <IonItemDivider>
      <IonLabel>{{ group.title }}</IonLabel>
    </IonItemDivider>
    <IonItem :lines="index === 0 ? 'inset' : 'none'">
      <div class="finding-group" role="group" :aria-label="group.title">
        <div class="finding-row">
          <button type="button" class="auscultation-chip auscultation-chip--normal" :class="rippleClass"
            :aria-pressed="modelValue[group.normalKey]" :data-testid="`auscultation-${group.key}-normal`"
            @click="emit('update:modelValue', setAuscultationGroupNormal(modelValue, group.key, !modelValue[group.normalKey]))">
            {{ group.normalLabel }}
            <IonRippleEffect v-if="rippleEnabled" aria-hidden="true" />
          </button>
        </div>
        <template v-for="(row, rowIndex) in group.rows" :key="rowIndex">
          <div v-if="row.length" class="finding-row"
            :class="{ 'finding-row--selected': rowIndex === 1 }">
            <button v-for="finding in row" :key="finding.key" ref="findingButtons" type="button" class="auscultation-chip"
              :class="[rippleClass, index === 0 ? 'auscultation-chip--warning' : 'auscultation-chip--danger',
                { selected: hasLocations(modelValue.findings[finding.key]) }]"
              :aria-pressed="hasLocations(modelValue.findings[finding.key])"
              aria-haspopup="dialog" :aria-expanded="activeFinding === finding.key && isOpen"
              :data-finding="finding.key" @click="open(finding.key, $event)">
              <span>{{ finding.label }}<template v-if="hasLocations(modelValue.findings[finding.key])"><span aria-hidden="true"> • </span><small>{{ auscultationLocationText(modelValue.findings[finding.key], true) }}</small></template></span>
              <IonRippleEffect v-if="rippleEnabled" aria-hidden="true" />
            </button>
          </div>
        </template>
      </div>
    </IonItem>
  </template>

  <IonPopover :is-open="isOpen" :arrow="false" :dismiss-on-select="false"
    class="auscultation-popover" :aria-label="`${activeLabel}: Lokalisation`" @didDismiss="dismissed">
    <IonContent>
      <div class="localization-editor">
        <Transition :name="detailed ? 'slide-forward' : 'slide-back'"
          @before-enter="enableEnteringPanel" @before-leave="disableLeavingPanel" @after-enter="focusNavigation">
          <IonList v-if="!detailed" key="simple" class="localization-panel quick-sides" lines="none"
            aria-label="Patientenseite">
            <IonItem v-for="selection in quickSelections" :key="selection.key" button :detail="false"
              :data-side="selection.key" @click="confirmSide(selection.sides)">
              <IonLabel>{{ selection.label }}</IonLabel>
            </IonItem>
            <div class="localization-divider" role="separator" />
            <IonItem button :detail="true" :detail-icon="chevronForward" class="detail-toggle"
              data-testid="auscultation-detail-toggle" :aria-expanded="false" @click="detailed = true">
              <IonLabel>Detailierter</IonLabel>
            </IonItem>
          </IonList>
          <div v-else key="detailed" class="localization-panel">
            <IonList lines="none">
              <IonItem button :detail="false" class="detail-toggle"
                data-testid="auscultation-detail-toggle" :aria-expanded="true" @click="detailed = false">
                <IonIcon slot="start" :icon="chevronBack" aria-hidden="true" />
                <IonLabel>Einfach</IonLabel>
              </IonItem>
            </IonList>
            <div class="lung-editor">
              <div class="patient-sides"><span>Patient rechts</span><span>Patient links</span></div>
              <svg class="lung-map" viewBox="0 0 320 260" role="group" aria-label="Lungenregionen">
                <path d="M153 8 V47 L142 65 M167 8 V47 L178 65" class="trachea" aria-hidden="true" />
                <g v-for="side in lungSides" :key="side">
                  <g v-for="(region, index) in lungRegions" :key="region" role="button" tabindex="0"
                    class="lung-region" :class="{ selected: draft[side][region] }"
                    :aria-label="`${side === 'right' ? 'Rechts' : 'Links'}: ${regionLabels[region]}`"
                    :aria-pressed="draft[side][region]" :data-region="`${side}-${region}`"
                    @click="selectLungRegion(draft, side, region)" @keydown="regionKey($event, side, region)">
                    <path :d="regionPaths[index]" :transform="side === 'left' ? 'translate(320 0) scale(-1 1)' : undefined" />
                  </g>
                </g>
              </svg>
              <div class="editor-actions">
                <IonButton @click="confirm">Speichern</IonButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </IonContent>
  </IonPopover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IonButton, IonContent, IonIcon, IonItem, IonItemDivider, IonLabel, IonList, IonPopover, IonRippleEffect } from '@ionic/vue'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { isMaterialMode } from '@/utils/ripple'
import {
  auscultationFindings, auscultationGroups, auscultationLocationText, confirmAuscultationFinding, copyLocations,
  emptyAuscultationLocations, hasLocations, lungRegions, lungSides, regionLabels,
  selectLungRegion, selectLungSides, setAuscultationGroupNormal,
  type AuscultationFinding, type BreathingAuscultation, type LungRegion, type LungSide,
} from '@/types/protocol/abcde/auscultation'

const props = defineProps<{ modelValue: BreathingAuscultation }>()
const emit = defineEmits<{ 'update:modelValue': [value: BreathingAuscultation] }>()
const rippleEnabled = isMaterialMode()
const rippleClass = { 'dd-ripple-surface ion-activatable': rippleEnabled }
const quickSelections: { key: string; label: string; sides: readonly LungSide[] }[] = [
  { key: 'right', label: 'Rechts', sides: ['right'] },
  { key: 'left', label: 'Links', sides: ['left'] },
  { key: 'both', label: 'Beidseits', sides: lungSides },
]
const groups = computed(() => auscultationGroups.map(group => ({
  ...group,
  rows: [
    group.findings.filter(({ key }) => !hasLocations(props.modelValue.findings[key])),
    group.findings.filter(({ key }) => hasLocations(props.modelValue.findings[key])),
  ],
})))
const findingButtons = ref<HTMLButtonElement[]>([])
const activeFinding = ref<AuscultationFinding | null>(null)
const activeLabel = computed(() => auscultationFindings.find(item => item.key === activeFinding.value)?.label ?? '')
const isOpen = ref(false)
const detailed = ref(false)
const draft = ref(emptyAuscultationLocations())
let opener: HTMLElement | undefined
const regionPaths = [
  'M145 35 Q135 10 112 25 Q70 40 50 105 Q35 135 28 170 H145 Z',
  'M28 170 Q20 200 23 225 Q70 255 130 235 Q145 230 145 210 V170 Z',
]
function open(finding: AuscultationFinding, event: Event) {
  if (activeFinding.value !== null) return
  opener = event.currentTarget as HTMLElement
  opener.focus({ preventScroll: true })
  draft.value = copyLocations(props.modelValue.findings[finding])
  detailed.value = lungSides.some(side => draft.value[side].upper !== draft.value[side].base)
  activeFinding.value = finding
  isOpen.value = true
}
function enableEnteringPanel(element: Element) {
  element.removeAttribute('inert')
  element.removeAttribute('aria-hidden')
}
function disableLeavingPanel(element: Element) {
  element.setAttribute('inert', '')
  element.setAttribute('aria-hidden', 'true')
}
function focusNavigation(element: Element) {
  if (!isOpen.value) return
  const item = element.querySelector<HTMLElement>('[data-testid="auscultation-detail-toggle"]')
  item?.shadowRoot?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
}
function confirmSide(sides: readonly LungSide[]) {
  draft.value = selectLungSides(sides)
  confirm()
}
function regionKey(event: KeyboardEvent, side: LungSide, region: LungRegion) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (!event.repeat) selectLungRegion(draft.value, side, region)
}
function confirm() {
  if (!isOpen.value || !activeFinding.value) return
  emit('update:modelValue', confirmAuscultationFinding(props.modelValue, activeFinding.value, draft.value))
  isOpen.value = false
}
async function dismissed() {
  // Confirmation can move the chip between rows and replace its DOM node.
  const finding = activeFinding.value
  const previousOpener = opener
  isOpen.value = false
  activeFinding.value = null
  draft.value = emptyAuscultationLocations()
  opener = undefined
  await nextTick()
  const returnFocus = findingButtons.value.find(button => button.isConnected && button.dataset.finding === finding) ?? previousOpener
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
}
</script>

<style scoped>
.finding-group { display: flex; flex-direction: column; gap: .5rem; width: 100%; min-width: 0; padding: 12px 0; }
.finding-row { display: flex; flex-wrap: wrap; gap: .5rem; width: 100%; min-width: 0; }
.finding-group small { font-size: .75rem; overflow-wrap: anywhere; }
/* Match the option chips in DodoInputSelectChips. */
.auscultation-chip {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  max-width: 100%;
  min-height: 2rem;
  padding: .4rem .75rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 1.5rem;
  background: transparent;
  color: var(--ion-text-color, #000);
  font: inherit;
  font-size: .875rem;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.auscultation-chip[aria-pressed="true"] {
  background: var(--ion-text-color, #000);
  border-color: var(--ion-text-color, #000);
  color: var(--ion-background-color, #fff);
}
.auscultation-chip--warning {
  --finding-color: var(--ion-color-warning);
  --finding-contrast: var(--ion-color-warning-contrast);
}
.auscultation-chip--danger {
  --finding-color: var(--ion-color-danger);
  --finding-contrast: var(--ion-color-danger-contrast);
}
.auscultation-chip[data-finding] {
  border-color: var(--finding-color);
  background: color-mix(in srgb, var(--finding-color) 12%, transparent);
  color: var(--finding-color);
}
.auscultation-chip[data-finding][aria-pressed="true"] {
  background: var(--finding-color);
  color: var(--finding-contrast);
}
.auscultation-chip--normal { border-color: var(--ion-color-primary); color: var(--ion-color-primary); }
.auscultation-chip--normal[aria-pressed="true"] {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}
.auscultation-chip > span { min-width: 0; }
.auscultation-chip:focus-visible { outline: 2px solid var(--ion-color-primary); outline-offset: -2px; }
.auscultation-popover { --width: min(360px, calc(100vw - 24px)); --max-height: min(680px, calc(100dvh - 32px)); }
/* Ionic positions once on opening; keep both editor sizes inside the viewport. */
.auscultation-popover::part(content) {
  top: 50% !important;
  left: 50% !important;
  bottom: auto !important;
  translate: -50% -50%;
}
.localization-editor { position: relative; overflow: hidden; }
.localization-panel { width: 100%; }
.localization-panel ion-list, ion-list.localization-panel { margin: 0; padding: 0; }
.localization-divider {
  border-top: 1px solid var(--ion-item-border-color, var(--ion-border-color, var(--ion-background-color-step-250, #c8c7cc)));
  margin: 4px 0;
}
.lung-editor { padding: 16px; }
.slide-forward-enter-active, .slide-forward-leave-active,
.slide-back-enter-active, .slide-back-leave-active { transition: transform 200ms ease; }
.slide-forward-leave-active, .slide-back-leave-active { position: absolute; top: 0; left: 0; }
.slide-forward-enter-from, .slide-back-leave-to { transform: translateX(100%); }
.slide-forward-leave-to, .slide-back-enter-from { transform: translateX(-100%); }
@media (prefers-reduced-motion: reduce) {
  .slide-forward-enter-active, .slide-forward-leave-active,
  .slide-back-enter-active, .slide-back-leave-active { transition: none; }
}
.patient-sides { display: flex; justify-content: space-between; gap: 12px; font-size: .85rem; font-weight: 600; }
.lung-map { display: block; width: 100%; }
.trachea { fill: none; stroke: var(--ion-color-medium); stroke-width: 6; stroke-linejoin: round; }
.lung-region { cursor: pointer; outline: none; }
.lung-region path { fill: var(--ion-color-light); stroke: var(--ion-color-medium); stroke-width: 2; }
.lung-region text { fill: var(--ion-color-light-contrast); font-size: 15px; text-anchor: middle; pointer-events: none; }
.lung-region.selected path { fill: var(--ion-color-primary); }
.lung-region.selected text { fill: var(--ion-color-primary-contrast); font-weight: 700; }
.lung-region:focus-visible path { stroke: var(--ion-text-color); stroke-width: 4; }
.detail-toggle ion-icon { margin-inline-end: 12px; }
.detail-toggle:focus-within { outline: 2px solid var(--ion-color-primary); outline-offset: -2px; }
.editor-actions { display: flex; justify-content: flex-end; }
.editor-actions ion-button { margin: 0; font-size: .8rem; }
</style>
