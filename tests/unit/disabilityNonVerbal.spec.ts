import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import * as Ionic from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import { DisabilityNeuro } from '@/types/protocol/abcde'
import { OptionalValue } from '@/types/protocol/input'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from '@/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'
import AbcdeBreathingCard from '@/views/dokuCards/abcdeCards/AbcdeBreathingCard.vue'
import AbcdeCirculationCard from '@/views/dokuCards/abcdeCards/AbcdeCirculationCard.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))
const global = {
  renderStubDefaultSlot: true,
  stubs: {
    ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
    IonSelect: defineComponent({
      template: '<ion-select-stub><slot /></ion-select-stub>',
      mounted() { this.$el.open = vi.fn() },
    }),
    DodoInputText: true,
  },
}
enableAutoUnmount(afterEach)
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks(); vi.mocked(loadDokuState).mockReset() })

const triggers: [string, (store: ReturnType<typeof useDokuStore>, enabled: boolean) => void][] = [
  ['flavor', (store, enabled) => { store.doku.flavors.non_verbal = enabled }],
  ['unconscious', (store, enabled) => { store.doku.xabcDe.avpu = enabled ? 'bewusstlos' : 'wach' }],
  ['soporous', (store, enabled) => { store.doku.xabcDe.avpu = enabled ? 'soporös' : 'wach' }],
  ['verbal GCS', (store, enabled) => { store.doku.xabcDe.gcs.v = enabled ? 3 : 5 }],
  ['not breathing', (store, enabled) => { store.doku.xAbcde.isBreathing = !enabled }],
]
const neuroFields = ['followInstructions', 'msMeningism', 'sensitivity', 'paraesthesia', 'dysarthria', 'aphasia'] as const

function seedNeuro() {
  const neuro = useDokuStore().doku.xabcDe.neuro
  neuro.assessed = true
  Object.assign(neuro.value, {
    followInstructions: 'nicht befolgt', sensitivity: OptionalValue.active('Taubheit li. Arm'),
    paraesthesia: OptionalValue.active('Kribbeln li. Bein'), dysarthria: 'verwaschen',
    aphasia: 'schwere', msArmLeft: 'Absinken', msMeningism: 'leichter', msTremor: true,
  } satisfies Partial<DisabilityNeuro>)
  for (const key of neuroFields) neuro.value.assessment[key] = 'active'
  return neuro
}

describe('individual nonverbal assessments', () => {
  test.each(triggers)('keeps all untouched checks visible and independently inactive on %s', async (_, trigger) => {
    const store = useDokuStore()
    trigger(store, true)
    const wrapper = mount(AbcdeDisabilityCard, { global })
    for (const id of ['zops', 'headache', 'dizziness']) {
      expect(wrapper.get(`[data-examination="${id}"]`).classes()).toContain('examination-inactive')
    }
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    for (const id of neuroFields) {
      expect(wrapper.get(`[data-examination="${id}"]`).classes()).toContain('examination-inactive')
      expect(store.doku.xabcDe.neuro.value.isExamined(id)).toBe(false)
    }
    expect(wrapper.text()).toContain('Sensorik')
    expect(wrapper.text()).toContain('Sprache')
    expect(store.generatedProtocol).not.toMatch(/Nackensteife|Parästhesien|Aphasie|orientiert|Kopfschmerzen|Schwindel/)
    await wrapper.get('[data-examination="msMeningism"] .activate-examination').trigger('click')
    expect(store.generatedProtocol).toContain('keine Nackensteife')
    expect(store.doku.xabcDe.neuro.value.assessment.aphasia).toBe('auto')
    trigger(store, false)
    await nextTick()
    expect(store.doku.xabcDe.neuro.value.isExamined('aphasia')).toBe(true)
  })

  test.each(triggers)('preserves entered findings and explicit normal results on %s', async (_, trigger) => {
    const store = useDokuStore()
    const neuro = seedNeuro()
    store.doku.xabcDe.assessment.headache = 'active'
    const previous = JSON.stringify(neuro)
    const wrapper = mount(AbcdeDisabilityCard, { global })
    trigger(store, true)
    await nextTick()
    expect(JSON.stringify(neuro)).toBe(previous)
    for (const id of neuroFields) {
      expect(wrapper.get(`[data-examination="${id}"]`).classes()).not.toContain('examination-inactive')
    }
    expect(store.doku.xabcDe.isExamined('headache')).toBe(true)
    expect(store.generatedProtocol).toContain('schwere Aphasie')
    expect(store.generatedProtocol).toContain('Taubheit li. Arm')
    trigger(store, false)
    await nextTick()
    expect(JSON.stringify(neuro)).toBe(previous)
  })

  test('ALS-style selection documents only the selected checks and resets on deactivation', async () => {
    const store = useDokuStore()
    store.setFlavor('non_verbal', true)
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    await wrapper.get('[data-examination="followInstructions"] .activate-examination').trigger('click')
    wrapper.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Anweisungen befolgen')!
      .vm.$emit('update:modelValue', 'teilweise befolgt')
    await nextTick()
    expect(store.generatedProtocol).toContain('Anweisungen teilweise befolgt')
    expect(store.generatedProtocol).not.toMatch(/Artikulation|Aphasie|Parästhesien|Nackensteife/)
    await wrapper.get('[data-examination="followInstructions"] .remove-examination').trigger('click')
    expect(store.doku.xabcDe.neuro.value.followInstructions).toBe('befolgt')
    expect(store.doku.xabcDe.neuro.value.assessment.followInstructions).toBe('inactive')
    expect(store.generatedProtocol).not.toContain('Anweisungen')
    store.setFlavor('non_verbal', false)
    await nextTick()
    expect(wrapper.get('[data-examination="followInstructions"]').classes()).toContain('examination-inactive')
  })

  test('group activation and reactivation leave untouched children automatic', async () => {
    const store = useDokuStore()
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    expect(Object.values(store.doku.xabcDe.neuro.value.assessment)).toEqual(neuroFields.map(() => 'auto'))
    await wrapper.get('[data-examination="neuro"] > .remove-examination').trigger('click')
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    expect(Object.values(store.doku.xabcDe.neuro.value.assessment)).toEqual(neuroFields.map(() => 'auto'))
    store.setFlavor('non_verbal', true)
    expect(store.doku.xabcDe.neuro.value.isExamined('paraesthesia')).toBe(false)
  })

  test('parent activation retains deliberately inactive child assessments', async () => {
    const store = useDokuStore()
    store.doku.xabcDe.neuro.value.assessment.msMeningism = 'inactive'
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    expect(wrapper.get('[data-examination="msMeningism"]').classes()).toContain('examination-inactive')
    expect(store.generatedProtocol).not.toContain('Nackensteife')
  })

  test.each(['auto', 'active', 'inactive'] as const)('abdominal activation preserves %s pain assessment', async intent => {
    const store = useDokuStore()
    store.doku.xabcdE.abdominal.value.assessment.pain = intent
    const wrapper = mount(AbcdeExposureCard, { global })
    await wrapper.get('[data-examination="abdominal"] .activate-examination').trigger('click')
    expect(store.doku.xabcdE.abdominal.value.assessment.pain).toBe(intent)
    store.setFlavor('non_verbal', true)
    expect(store.doku.xabcdE.abdominal.value.isExamined('pain')).toBe(intent === 'active')
  })

  test.each([3, 35])('offers the appropriate orientation assessment at age %s', async age => {
    const store = useDokuStore()
    store.doku.ident.age.timespan = age
    store.doku.ident.age.unit = 'years'
    store.setFlavor('non_verbal', true)
    const wrapper = mount(AbcdeDisabilityCard, { global })
    expect(wrapper.get('[data-examination="zops"]').text()).toContain(age === 3 ? 'pädiatrisch' : 'Orientierung')
    expect(wrapper.findAll('[data-examination="zops"]')).toHaveLength(1)
    await wrapper.get('[data-examination="zops"] .activate-examination').trigger('click')
    expect(store.doku.xabcDe.assessment.zops).toBe('active')
    expect(store.generatedProtocol).toContain(age === 3 ? 'aufmerksam' : 'orientiert')
  })

  test('shows symptoms in B/C/E and keeps abdominal pain independent of its parent', async () => {
    const store = useDokuStore()
    store.setFlavor('non_verbal', true)
    const breathing = mount(AbcdeBreathingCard, { global })
    const circulation = mount(AbcdeCirculationCard, { global })
    const exposure = mount(AbcdeExposureCard, { global })
    expect(breathing.get('[data-examination="breathlessness"]').classes()).toContain('examination-inactive')
    expect(circulation.get('[data-examination="chest"]').classes()).toContain('examination-inactive')
    expect(exposure.get('[data-examination="nausea"]').classes()).toContain('examination-inactive')
    await exposure.get('[data-examination="abdominal"] .activate-examination').trigger('click')
    expect(exposure.get('[data-examination="pain"]').classes()).toContain('examination-inactive')
    expect(store.generatedProtocol).toContain('Abdomen weich')
    expect(store.generatedProtocol).not.toMatch(/schmerzfrei|Wasserlassen|Stuhlgang/)
    await exposure.get('[data-examination="pain"] .activate-examination').trigger('click')
    expect(store.generatedProtocol).toContain('schmerzfrei')
    store.setAbdominalPain('starke')
    store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
    expect(store.context.hasAbdominalIssue).toBe(true)
    expect(store.generatedProtocol).toContain('stechend')
    await exposure.get('[data-examination="pain"] .remove-examination').trigger('click')
    expect(store.context.hasAbdominalIssue).toBe(false)
    expect(store.generatedProtocol).not.toMatch(/stechend|schmerzfrei/)
    expect(store.doku.textAreaBlocks.bauchschmerz.details.quality).toEqual([])
  })

  test('inactive raw values cannot influence summaries, treatment or symptom sources', () => {
    const store = useDokuStore()
    const p = store.doku
    p.xaBcde.breathlessness = 'schwere'; p.xaBcde.assessment.breathlessness = 'inactive'
    p.xabCde.chest.pain = 'starke'; p.xabCde.assessment.chest = 'inactive'
    p.xabcDe.headache = true; p.xabcDe.assessment.headache = 'inactive'
    p.xabcDe.dizziness = 'gerichteter'; p.xabcDe.assessment.dizziness = 'inactive'
    p.xabcDe.zops.Z = 'nein'; p.xabcDe.assessment.zops = 'inactive'
    p.xabcdE.nausea = true; p.xabcdE.assessment.nausea = 'inactive'
    p.xabcdE.abdominal.assessed = true
    p.xabcdE.abdominal.value.pain = 'starke'; p.xabcdE.abdominal.value.assessment.pain = 'inactive'
    expect(store.context).toMatchObject({ isCritical: false, hasHeadache: false, hasDizziness: false, hasHeartIssue: false, hasAbdominalIssue: false, hasNausea: false, gcs: 15 })
    expect([p.xaBcde.needTreatment, p.xabCde.needTreatment, p.xabcDe.needTreatment, p.xabcdE.needTreatment]).toEqual([false, false, false, false])
    expect(store.textAreaBlocks).toEqual([])
    expect(store.generatedProtocol).not.toMatch(/Luftnot|Brustschmerz|Kopfschmerz|Schwindel|desorientiert|Übelkeit|schmerzfrei/)
  })

  test('reanimation preserves entered neurological assessments through restoration', () => {
    const store = useDokuStore()
    const neuro = seedNeuro()
    const previous = JSON.stringify(neuro)
    mount(AbcdeDisabilityCard, { global })
    store.setFlavor('reanimation', true)
    expect(JSON.stringify(neuro)).toBe(previous)
    store.setFlavor('reanimation', false)
    expect(JSON.stringify(neuro)).toBe(previous)
  })
})

describe('assessment persistence', () => {
  test('round-trips explicit negative, inactive and automatic intent with saved findings', async () => {
    const store = useDokuStore()
    seedNeuro()
    store.doku.xabcDe.assessment.headache = 'active'
    store.doku.xabcDe.assessment.zops = 'inactive'
    store.setFlavor('non_verbal', true)
    store.setAbdominalAssessed(true)
    store.setAbdominalPain('starke')
    store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
    store.setDizziness('gerichteter')
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.xabcDe.assessment).toEqual(store.doku.xabcDe.assessment)
    expect(restored.doku.xabcDe.neuro.value).toBeInstanceOf(DisabilityNeuro)
    expect(restored.doku.xabcDe.neuro.value.assessment).toEqual(store.doku.xabcDe.neuro.value.assessment)
    expect(restored.generatedProtocol).toContain('schwere Aphasie')
    expect(restored.generatedProtocol).toContain('stechend')
    expect(restored.doku.xabcDe.isExamined('headache')).toBe(true)
    expect(restored.doku.xabcDe.isExamined('zops')).toBe(false)
    await restored.newProtocol()
    expect(restored.doku.xabcDe.assessment.headache).toBe('auto')
    const history = restored.protocolHistory.find(entry => entry.doku.xabcDe.neuro.assessed)!
    expect(await restored.restoreProtocolFromHistory(history.id)).toBe(true)
    expect(restored.doku.xabcDe.assessment.headache).toBe('active')
    expect(restored.generatedProtocol).toContain('schwere Aphasie')
  })

  test('migrates non-default legacy values but does not mistake defaults for assessments', async () => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: {
      flavors: { non_verbal: true },
      xaBcde: { breathlessness: 'schwere' },
      xabCde: { chest: { pain: 'leichte' } },
      xabcDe: { headache: { assessed: true, value: false }, dizziness: 'kein',
        neuro: { assessed: true, value: { aphasia: 'leichte' } } },
      xabcdE: { nausea: true, abdominal: { assessed: true, value: { pain: 'starke' } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xaBcde.assessment.breathlessness).toBe('active')
    expect(store.doku.xabCde.assessment.chest).toBe('active')
    expect(store.doku.xabcDe.assessment).toMatchObject({ headache: 'active', dizziness: 'auto', zops: 'auto' })
    expect(store.doku.xabcDe.neuro.value.assessment).toMatchObject({ aphasia: 'active', msMeningism: 'auto' })
    expect(store.doku.xabcdE.assessment.nausea).toBe('active')
    expect(store.doku.xabcdE.abdominal.value.assessment.pain).toBe('active')
    expect(store.generatedProtocol).toContain('leichte Aphasie')
  })

  test('infers an unwrapped legacy Neuro assessment independently of the open context', async () => {
    const store = useDokuStore()
    store.doku.flavors.non_verbal = true
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: {
      flavors: { non_verbal: true }, xabcDe: { neuro: { aphasia: 'schwere' } },
    } })
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.neuro.assessed).toBe(true)
    expect(store.doku.xabcDe.neuro.value.assessment.aphasia).toBe('active')
    expect(store.generatedProtocol).toContain('schwere Aphasie')
  })

  test('restores block eligibility using the saved context rather than the previously open record', async () => {
    const store = useDokuStore()
    store.doku.flavors.non_verbal = true
    const saved = resetProtocol()
    saved.xabcDe.dizziness = 'gerichteter'
    saved.textAreaBlocks.schwindel.details.quality = ['Drehschwindel']
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: saved })
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.isExamined('dizziness')).toBe(true)
    expect(store.doku.textAreaBlocks.schwindel.details.quality).toEqual(['Drehschwindel'])
  })
})
