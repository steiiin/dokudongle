import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref, toRef } from 'vue'
import * as Ionic from '@ionic/vue'
import { IonModal, IonToggle } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoExaminationItem from '@/components/examination/DodoExaminationItem.vue'
import DodoExaminationCard from '@/components/examination/DodoExaminationCard.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import DodoInputToggleOptional from '@/components/inputs/DodoInputToggleOptional.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import AbcdeAirwayCard from '@/views/doku/abcde/AbcdeAirwayCard.vue'
import AbcdeBreathingCard from '@/views/doku/abcde/AbcdeBreathingCard.vue'
import AbcdeCirculationCard from '@/views/doku/abcde/AbcdeCirculationCard.vue'
import AbcdeDisabilityCard from '@/views/doku/abcde/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from '@/views/doku/abcde/AbcdeExposureCard.vue'
import { useDokuStore } from '@/store/doku'

const openSelect = vi.fn()
const focusText = vi.fn()
const global = {
  renderStubDefaultSlot: true,
  stubs: {
    ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
    IonSelect: defineComponent({
      template: '<ion-select-stub><slot /></ion-select-stub>',
      mounted() { this.$el.open = openSelect },
    }),
    DodoInputText: defineComponent({
      template: '<input />',
      setup(_, { expose }) { expose({ setFocus: focusText }) },
    }),
  },
}
enableAutoUnmount(afterEach)
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

type DokuStore = ReturnType<typeof useDokuStore>
const positiveFindings = [
  ['hasHypoxia', AbcdeBreathingCard, (s: DokuStore) => toRef(s.doku.xaBcde, 'hasHypoxia'), 'Hypoxie'],
  ['poorSkinTurgor', AbcdeCirculationCard, (s: DokuStore) => toRef(s.doku.xabCde.skin, 'poorSkinTurgor'), 'stehende Hautfalten'],
  ['hasUrtikaria', AbcdeCirculationCard, (s: DokuStore) => toRef(s.doku.xabCde.skin, 'hasUrtikaria'), 'Urtikaria'],
  ['hasExanthem', AbcdeCirculationCard, (s: DokuStore) => toRef(s.doku.xabCde.skin, 'hasExanthem'), 'Ausschlag'],
  ['hasFlush', AbcdeCirculationCard, (s: DokuStore) => toRef(s.doku.xabCde.skin, 'hasFlush'), 'Flush'],
  ['urinaryIncontinence', AbcdeExposureCard, (s: DokuStore) => toRef(s.doku.xabcdE, 'urinaryIncontinence'), 'eingenässt'],
  ['delusions', AbcdeDisabilityCard, (s: DokuStore) => toRef(s.doku.xabcDe.psych.value, 'delusions'), 'wahnhaft'],
  ['hallucinations', AbcdeDisabilityCard, (s: DokuStore) => toRef(s.doku.xabcDe.psych.value, 'hallucinations'), 'halluziniert'],
  ['behavioralChange', AbcdeDisabilityCard, (s: DokuStore) => toRef(s.doku.xabcDe.psych.value, 'behavioralChange'), 'wesensverändert'],
  ['perseveration', AbcdeDisabilityCard, (s: DokuStore) => toRef(s.doku.xabcDe.psych.value, 'perseveration'), 'verbale Perseveration'],
  ['dementia', AbcdeDisabilityCard, (s: DokuStore) => toRef(s.doku.xabcDe.psych.value, 'dementia'), 'bek. Demenz'],
] as const

describe('optional positive boolean findings', () => {
  test.each(positiveFindings)('%s activates, clears and reactivates with its report text', async (id, card, binding, text) => {
    const store = useDokuStore()
    store.doku.xabcDe.psych.assessed = true
    const value = binding(store)
    const wrapper = mount(card, { global, attachTo: document.body })
    const row = () => wrapper.get(`[data-examination="${id}"]`)
    const report = () => store.generatedProtocol.toLowerCase()

    for (let attempt = 0; attempt < 2; attempt++) {
      expect(value.value).toBe(false)
      expect(row().classes()).toContain('examination-inactive')
      expect(row().findComponent(DodoInputToggle).exists()).toBe(false)
      expect(report()).not.toContain(text.toLowerCase())
      await row().get('.activate-examination').trigger('click')
      await flushPromises()
      expect(value.value).toBe(true)
      expect(row().classes()).not.toContain('examination-inactive')
      expect(row().getComponent(IonToggle).props('modelValue')).toBe(true)
      expect(row().getComponent(DodoInputToggle).props('lines')).toBe('none')
      expect(row().find('.remove-examination').exists()).toBe(false)
      expect(report()).toContain(text.toLowerCase())
      row().getComponent(IonToggle).vm.$emit('update:modelValue', false)
      await flushPromises()
      expect(value.value).toBe(false)
      expect(row().classes()).toContain('examination-inactive')
      expect(report()).not.toContain(text.toLowerCase())
      expect(document.activeElement).toBe(row().get('.activate-examination').element)
    }
  })

  test.each(positiveFindings)('%s displays an existing true value and follows external changes', async (id, card, binding) => {
    const store = useDokuStore()
    store.doku.xabcDe.psych.assessed = true
    const value = binding(store)
    value.value = true
    const wrapper = mount(card, { global })
    const row = () => wrapper.get(`[data-examination="${id}"]`)
    expect(row().getComponent(IonToggle).props('modelValue')).toBe(true)
    value.value = false
    await nextTick()
    expect(row().classes()).toContain('examination-inactive')
    value.value = true
    await nextTick()
    expect(row().getComponent(IonToggle).props('modelValue')).toBe(true)
  })

  test('places urinary incontinence between vomiting and excretions', () => {
    const wrapper = mount(AbcdeExposureCard, { global })
    const row = wrapper.get('[data-examination="urinaryIncontinence"]').element
    expect(row.previousElementSibling?.textContent).toContain('Erbrechen')
    expect(row.nextElementSibling?.getAttribute('data-examination')).toBe('excretions')
  })
})

function fixture() {
  const activate = vi.fn()
  const selected = vi.fn()
  const removed = vi.fn()
  const wrapper = mount(defineComponent({
    components: { DodoExaminationCard, DodoExaminationItem },
    setup: () => ({ assessed: ref(false), available: ref(true), activate, selected, removed }),
    template: `<DodoExaminationCard title="Test">
      <DodoExaminationItem id="first" label="First" v-model:assessed="assessed" :available="available"
        @select="selected" @activate="activate" @remove="removed">
        <span class="finding">Finding</span>
      </DodoExaminationItem>
    </DodoExaminationCard>`,
  }), { global, attachTo: document.body })
  return { wrapper, activate, selected, removed }
}

describe('examination card grouping', () => {
  function groupingFixture() {
    const wrapper = mount(defineComponent({
      components: { DodoExaminationCard, DodoExaminationItem, DodoInputToggleOptional, DodoItemModal },
      setup: () => ({ first: ref(false), second: ref(true), positive: ref(false), available: ref(true), nested: ref(false) }),
      template: `<DodoExaminationCard title="Grouping">
        <span data-row="regular">Regular</span>
        <DodoExaminationItem id="first" v-model:assessed="first"><input value="preserved" /></DodoExaminationItem>
        <span v-if="available" data-row="conditional">Conditional</span>
        <DodoInputToggleOptional id="positive" label="Positive" v-model="positive" />
        <DodoExaminationItem id="second" v-model:assessed="second" :available="available"><input value="negative finding" /></DodoExaminationItem>
        <DodoItemModal label="Nested">
          <DodoExaminationItem id="nested-first" v-model:assessed="nested"><span>Nested</span></DodoExaminationItem>
          <DodoExaminationItem id="nested-second" :assessed="true"><span>Nested active</span></DodoExaminationItem>
        </DodoItemModal>
      </DodoExaminationCard>`,
    }), { global, attachTo: document.body })
    const order = () => Array.from(wrapper.get('ion-list-stub').element.children)
      .map(el => el.getAttribute('data-examination') ?? el.getAttribute('data-row'))
      .filter(Boolean)
    return { wrapper, order }
  }

  test('stably groups direct rows and preserves instances, values and focus on activation/removal', async () => {
    const { wrapper, order } = groupingFixture()
    expect(order()).toEqual(['regular', 'conditional', 'second', 'first', 'positive'])
    const first = wrapper.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'first')!
    const second = wrapper.get('[data-examination="second"] input').element
    await wrapper.get('[data-examination="first"] .activate-examination').trigger('click')
    await flushPromises()
    expect(order()).toEqual(['regular', 'first', 'conditional', 'second', 'positive'])
    expect(wrapper.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'first')!.vm.$).toBe(first.vm.$)
    expect(wrapper.get('[data-examination="second"] input').element).toBe(second)
    expect(document.activeElement).toBe(wrapper.get('[data-examination="first"]').element)

    await wrapper.get('[data-examination="first"] input').setValue('edited')
    wrapper.vm.positive = true
    await nextTick()
    expect(order()).toEqual(['regular', 'first', 'conditional', 'positive', 'second'])
    expect((wrapper.get('[data-examination="first"] input').element as HTMLInputElement).value).toBe('edited')
    await wrapper.get('[data-examination="first"] .remove-examination').trigger('click')
    await flushPromises()
    expect(order()).toEqual(['regular', 'conditional', 'positive', 'second', 'first'])
    expect(document.activeElement).toBe(wrapper.get('[data-examination="first"] .activate-examination').element)
    await wrapper.get('[data-examination="first"] .activate-examination').trigger('click')
    expect(order()).toEqual(['regular', 'first', 'conditional', 'positive', 'second'])
  })

  test('updates external state and availability without reordering modal contents', async () => {
    const { wrapper, order } = groupingFixture()
    const nestedOrder = () => wrapper.findAll('[data-examination^="nested-"]').map(item => item.attributes('data-examination'))
    expect(nestedOrder()).toEqual(['nested-first', 'nested-second'])
    wrapper.vm.nested = true
    wrapper.vm.available = false
    wrapper.vm.positive = true
    await nextTick()
    expect(order()).toEqual(['regular', 'positive', 'first'])
    expect(nestedOrder()).toEqual(['nested-first', 'nested-second'])
    wrapper.vm.available = true
    wrapper.vm.positive = false
    await nextTick()
    expect(order()).toEqual(['regular', 'conditional', 'second', 'first', 'positive'])
  })

  test('moves a formerly last row up with a separator and omits the last visible separator', async () => {
    const store = useDokuStore()
    const wrapper = mount(AbcdeBreathingCard, { global })
    const tracheal = () => wrapper.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'trachealDeviation')!
    expect(tracheal().props('showLine')).toBe(false)
    store.doku.xaBcde.trachealDeviation.assessed = true
    await nextTick()
    expect(tracheal().props('showLine')).toBe('full')
    expect(wrapper.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'emphysema')!.props('showLine')).toBe(false)
    // A negative finding is still assessed and stays in the upper group.
    expect(store.doku.xaBcde.trachealDeviation.value).toBe(false)
    const list = wrapper.get('ion-list-stub').element
    const ids = Array.from(list.children).map(el => el.getAttribute('data-examination')).filter(Boolean)
    expect(ids).toEqual(['breathlessness', 'trachealDeviation', 'hasHypoxia', 'auscultation', 'jugularVenousDistension', 'emphysema'])
  })

  test('keeps adult and pediatric orientation instances distinct through context and order changes', async () => {
    const store = useDokuStore()
    store.doku.ident.age.timespan = 35
    const wrapper = mount(AbcdeDisabilityCard, { global })
    const orientations = () => wrapper.findAllComponents(DodoExaminationItem).filter(item => item.props('id') === 'zops')
    const original = orientations().map(item => item.vm.$)
    store.setFlavor('non_verbal', true)
    await nextTick()
    orientations().forEach((item, index) => expect(item.vm.$).toBe(original[index]))
    expect(wrapper.findAll('[data-examination="zops"]')).toHaveLength(1)
    store.doku.ident.age.timespan = 2
    await nextTick()
    orientations().forEach((item, index) => expect(item.vm.$).toBe(original[index]))
    expect(wrapper.findAll('[data-examination="zops"]')).toHaveLength(1)
    expect(wrapper.get('[data-examination="zops"]').text()).toContain('pädiatrisch')
  })
})

describe('inline examination controls', () => {
  test('shows a gray unassessed row with one activation button and no picker', () => {
    const { wrapper } = fixture()
    expect(wrapper.get('.examination-inactive').text()).toBe('First')
    expect(wrapper.find('.positive-examination').exists()).toBe(false)
    expect(wrapper.find('.finding').exists()).toBe(false)
    expect(wrapper.find('.add-examination').exists()).toBe(false)
    expect(wrapper.find('ion-popover-stub').exists()).toBe(false)
    expect(wrapper.get('.activate-examination').element.tagName).toBe('BUTTON')
    expect(wrapper.get('.activate-examination').attributes('aria-label')).toBe('First: Untersuchung aktivieren')
  })

  test('initializes once before mounting the editor and restores focus on removal', async () => {
    const { wrapper, selected, activate, removed } = fixture()
    selected.mockImplementation(() => {
      expect(wrapper.vm.assessed).toBe(true)
      expect(wrapper.find('.finding').exists()).toBe(false)
    })
    activate.mockImplementation(() => {
      expect(wrapper.get('.finding').text()).toBe('Finding')
    })
    const button = wrapper.get('.activate-examination')
    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(selected).toHaveBeenCalledExactlyOnceWith()
    expect(activate).toHaveBeenCalledExactlyOnceWith()
    expect(wrapper.get('.examination-item').element).toBe(document.activeElement)
    expect(wrapper.get('.finding').text()).toBe('Finding')
    await wrapper.get('.remove-examination').trigger('click')
    await flushPromises()
    expect(removed).toHaveBeenCalledOnce()
    expect(wrapper.get('.activate-examination').element).toBe(document.activeElement)
  })

  test('cancels pending activation when the item becomes unavailable', async () => {
    const { wrapper, activate } = fixture()
    wrapper.get('.activate-examination').element.dispatchEvent(new MouseEvent('click'))
    wrapper.vm.available = false
    await flushPromises()
    expect(wrapper.find('.examination-item').exists()).toBe(false)
    expect(activate).not.toHaveBeenCalled()
  })

  test('does not activate an unmounted editor', async () => {
    const { wrapper, activate } = fixture()
    wrapper.get('.activate-examination').element.dispatchEvent(new MouseEvent('click'))
    wrapper.unmount()
    await flushPromises()
    expect(activate).not.toHaveBeenCalled()
  })

  test('cancels pending activation when assessment is cleared', async () => {
    const { wrapper, activate } = fixture()
    wrapper.get('.activate-examination').element.dispatchEvent(new MouseEvent('click'))
    wrapper.vm.assessed = false
    await flushPromises()
    expect(activate).not.toHaveBeenCalled()
    expect(wrapper.find('.finding').exists()).toBe(false)
  })
})

describe('ABCDE examination integration', () => {
  test('stridor activates as true and remains visible after clearing', async () => {
    const store = useDokuStore()
    const wrapper = mount(AbcdeAirwayCard, { global })
    await wrapper.get('[data-examination="stridor"] .activate-examination').trigger('click')
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: true, value: true })
    expect(wrapper.findComponent(IonToggle).exists()).toBe(true)
    await wrapper.get('[data-examination="stridor"] .remove-examination').trigger('click')
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: false, value: false })
    expect(wrapper.get('[data-examination="stridor"]').classes()).toContain('examination-inactive')
    store.doku.xAbcde.isBreathing = false
    await nextTick()
    expect(wrapper.find('[data-examination="stridor"]').exists()).toBe(false)
  })

  test.each(['accessoryMuscles', 'retractions', 'paradoxical', 'jugularVenousDistension', 'emphysema', 'trachealDeviation'] as const)(
    '%s activates as true, allows false and resets on removal', async field => {
      const store = useDokuStore()
      const wrapper = mount(AbcdeBreathingCard, { global })
      await wrapper.get(`[data-examination="${field}"] .activate-examination`).trigger('click')
      expect(store.doku.xaBcde[field]).toMatchObject({ assessed: true, value: true })
      wrapper.get(`[data-examination="${field}"]`).getComponent(DodoInputToggle).vm.$emit('update:modelValue', false)
      expect(store.doku.xaBcde[field]).toMatchObject({ assessed: true, value: false })
      await wrapper.get(`[data-examination="${field}"] .remove-examination`).trigger('click')
      expect(store.doku.xaBcde[field]).toMatchObject({ assessed: false, value: false })
      await wrapper.get(`[data-examination="${field}"] .activate-examination`).trigger('click')
      expect(store.doku.xaBcde[field]).toMatchObject({ assessed: true, value: true })
    },
  )

  test('ECG activation opens its modal and dismissal keeps the default assessed', async () => {
    const wrapper = mount(AbcdeCirculationCard, { global })
    await wrapper.get('[data-examination="ecg"] .activate-examination').trigger('click')
    const modal = wrapper.findAllComponents(DodoItemModal).find(modal => modal.props('label') === 'EKG')!
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(true)
    modal.getComponent(IonModal).vm.$emit('willDismiss')
    await nextTick()
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(false)
    expect(useDokuStore().doku.xabCde.ecg).toMatchObject({ assessed: true, value: 'SR' })
    await wrapper.get('[data-examination="ecg"] .remove-examination').trigger('click')
    expect(useDokuStore().doku.xabCde.ecg.assessed).toBe(false)
  })

  test('blood glucose opens its select on activation', async () => {
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="bloodGlucose"] .activate-examination').trigger('click')
    expect(openSelect).toHaveBeenCalledOnce()
    expect(useDokuStore().doku.xabcDe.bloodGlucose).toMatchObject({ assessed: true, value: 'normal' })
  })

  test('intoxication focuses text on activation and omits an empty value', async () => {
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="intoxication"] .activate-examination').trigger('click')
    expect(focusText).toHaveBeenCalledOnce()
    expect(useDokuStore().generatedProtocol).not.toContain('Intox')
  })

  test('pregnancy activates as true and can be switched to false', async () => {
    const store = useDokuStore()
    // An already assessed pregnancy remains available at any age.
    store.doku.xabcdE.pregnancy.assessed = true
    const wrapper = mount(AbcdeExposureCard, { global })
    store.doku.ident.age.timespan = 25
    store.doku.ident.age.unit = 'years'
    await wrapper.get('[data-examination="pregnancy"] .remove-examination').trigger('click')
    await wrapper.get('[data-examination="pregnancy"] .activate-examination').trigger('click')
    expect(store.doku.xabcdE.pregnancy).toMatchObject({ assessed: true, value: true })
    wrapper.get('[data-examination="pregnancy"]').getComponent(DodoInputToggle).vm.$emit('update:modelValue', false)
    expect(store.doku.xabcdE.pregnancy).toMatchObject({ assessed: true, value: false })
    expect(store.generatedProtocol).toContain('Schwangerschaft ausgeschlossen')
    await wrapper.get('[data-examination="pregnancy"] .remove-examination').trigger('click')
    await wrapper.get('[data-examination="pregnancy"] .activate-examination').trigger('click')
    expect(store.doku.xabcdE.pregnancy).toMatchObject({ assessed: true, value: true })
  })

  test.each(['sensitivity', 'paraesthesia'] as const)('%s activation enables the toggle and focuses its text', async field => {
    const store = useDokuStore()
    store.setFlavor('non_verbal', true)
    const wrapper = mount(AbcdeDisabilityCard, { global })
    await wrapper.get('[data-examination="neuro"] .activate-examination').trigger('click')
    await wrapper.get(`[data-examination="${field}"] .activate-examination`).trigger('click')
    await flushPromises()
    expect(store.doku.xabcDe.neuro.value.assessment[field]).toBe('active')
    expect(store.doku.xabcDe.neuro.value[field].active).toBe(true)
    expect(focusText).toHaveBeenCalledOnce()
    await wrapper.get(`[data-examination="${field}"] .remove-examination`).trigger('click')
    expect(store.doku.xabcDe.neuro.value.assessment[field]).toBe('inactive')
    expect(store.doku.xabcDe.neuro.value[field].active).toBe(false)
  })

  test('nonverbal headache and nausea activate as true', async () => {
    const store = useDokuStore()
    store.setFlavor('non_verbal', true)
    const disability = mount(AbcdeDisabilityCard, { global })
    const exposure = mount(AbcdeExposureCard, { global })
    await disability.get('[data-examination="headache"] .activate-examination').trigger('click')
    await exposure.get('[data-examination="nausea"] .activate-examination').trigger('click')
    expect(store.doku.xabcDe.headache).toBe(true)
    expect(store.doku.xabcDe.assessment.headache).toBe('active')
    expect(store.doku.xabcdE.nausea).toBe(true)
    expect(store.doku.xabcdE.assessment.nausea).toBe('active')
  })

  test('records ordinary-context edits as explicit assessments before switching modes', async () => {
    const store = useDokuStore()
    const wrapper = mount(AbcdeDisabilityCard, { global })
    wrapper.findAllComponents(DodoInputToggle).find(input => input.text().includes('Kopfschmerzen'))!.vm.$emit('update:modelValue', true)
    const dizziness = wrapper.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Schwindel')!
    dizziness.vm.$emit('update:modelValue', 'kein')
    await nextTick()
    store.setFlavor('non_verbal', true)
    await nextTick()
    expect(store.doku.xabcDe.assessment).toMatchObject({ headache: 'active', dizziness: 'active', zops: 'auto' })
    expect(wrapper.get('[data-examination="headache"]').classes()).not.toContain('examination-inactive')
    expect(wrapper.get('[data-examination="dizziness"]').classes()).not.toContain('examination-inactive')
    expect(wrapper.get('[data-examination="zops"]').classes()).toContain('examination-inactive')
    expect(store.generatedProtocol).toContain('Kopfschmerzen')
  })
})
