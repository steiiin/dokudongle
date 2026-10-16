import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import * as Ionic from '@ionic/vue'
import { IonButton, IonItem, IonModal, IonPopover, IonSelect, IonToggle } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoExaminationCard from '@/components/DodoExaminationCard.vue'
import DodoExaminationItem from '@/components/DodoExaminationItem.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import AbcdeBreathingCard from '@/views/dokuCards/abcdeCards/AbcdeBreathingCard.vue'
import AbcdeAirwayCard from '@/views/dokuCards/abcdeCards/AbcdeAirwayCard.vue'
import { useDokuStore } from '@/store/doku'

const global = {
  renderStubDefaultSlot: true,
  stubs: { ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])), DodoInputText: true, DodoInputTreatment: true },
}
enableAutoUnmount(afterEach)
beforeEach(() => setActivePinia(createPinia()))

function fixture(assessedPresets = false) {
  const activate = vi.fn()
  const selected = vi.fn()
  const wrapper = mount(defineComponent({
    components: { DodoExaminationCard, DodoExaminationItem, DodoItemModal, DodoInputSelect },
    setup() {
      return {
        assessed: ref(false), second: ref(false), available: ref(true), mounted: ref(true),
        assessedPresets, selected, activate, modal: ref(), select: ref(), value: ref('a'),
      }
    },
    template: `<DodoExaminationCard title="Test">
      <DodoExaminationItem v-if="mounted" id="first" label="First" v-model:assessed="assessed"
        :available="available" :assessed-presets="assessedPresets" @select="selected" @activate="activate">
        <span class="finding">Finding</span>
      </DodoExaminationItem>
      <DodoExaminationItem id="second" :assessed-presets="assessedPresets" v-model:assessed="second" @activate="modal.open()">
        <template #picker><span class="custom-picker">Custom second</span></template>
        <DodoItemModal ref="modal" label="Details"><span>Modal content</span></DodoItemModal>
      </DodoExaminationItem>
      <DodoExaminationItem id="select" label="Select" v-model:assessed="selectAssessed" @activate="select.open()" />
      <template #footer><span class="footer">Treatment</span></template>
    </DodoExaminationCard>`,
    data: () => ({ selectAssessed: false }),
  }), { global })
  const card = wrapper.getComponent(DodoExaminationCard)
  const picker = () => card.getComponent(IonPopover)
  const rows = () => picker().findAllComponents(IonItem)
  const open = async () => { await card.get('.add-examination').trigger('click') }
  const dismiss = async () => {
    picker().vm.$emit('willDismiss')
    picker().vm.$emit('didDismiss')
    await flushPromises()
  }
  return { wrapper, card, picker, rows, open, dismiss, activate, selected }
}

describe('examination picker', () => {
  test('registers labels and picker slots in order, and activates only after dismissal', async () => {
    const f = fixture()
    await nextTick()
    expect(f.rows().map(row => row.text())).toEqual(['First', 'Custom second', 'Select'])
    expect(f.card.find('.finding').exists()).toBe(false)
    expect(f.card.find('.footer').text()).toBe('Treatment')
    await f.open()
    const row = f.rows()[0]
    await row.trigger('click')
    await row.trigger('click')
    expect(f.selected).toHaveBeenCalledExactlyOnceWith()
    expect(f.card.find('.finding').exists()).toBe(true)
    expect(f.rows().map(row => row.text())).toEqual(['Custom second', 'Select'])
    expect(f.activate).not.toHaveBeenCalled()
    await f.dismiss()
    expect(f.activate).toHaveBeenCalledOnce()
    await f.dismiss()
    expect(f.activate).toHaveBeenCalledOnce()
  })

  test.each(['negative', 'positive'] as const)('%s preset emits once and focuses after dismissal', async preset => {
    const f = fixture(true)
    await f.open()
    const row = f.rows()[0]
    const button = row.get('.positive-examination')
    expect(button.attributes()).toMatchObject({ slot: 'end', color: 'danger', 'aria-label': 'First: Hinzufügen und bearbeiten' })
    await (preset === 'negative' ? row : button).trigger('click')
    await button.trigger('click')
    expect(f.selected).toHaveBeenCalledExactlyOnceWith(preset)
    expect(f.wrapper.vm.assessed).toBe(true)
    const focus = vi.spyOn(f.card.get('.examination-item').element as HTMLElement, 'focus')
    expect(f.activate).not.toHaveBeenCalled()
    await f.dismiss()
    expect(focus).toHaveBeenCalledOnce()
    expect(f.activate).toHaveBeenCalledTimes(preset === 'positive' ? 1 : 0)
    await f.dismiss()
    expect(focus).toHaveBeenCalledOnce()
  })

  test('preset buttons are opt-in', async () => {
    const f = fixture()
    await f.open()
    expect(f.picker().find('.positive-examination').exists()).toBe(false)
  })

  test.each(['negative', 'positive'] as const)('%s modal preset controls editor activation', async preset => {
    const f = fixture(true)
    await f.open()
    const row = f.rows()[1]
    await (preset === 'negative' ? row : row.get('.positive-examination')).trigger('click')
    const modal = f.wrapper.getComponent(DodoItemModal)
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(false)
    await f.dismiss()
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(preset === 'positive')
    if (preset === 'negative') {
      await modal.getComponent(IonItem).trigger('click')
      expect(modal.getComponent(IonModal).props('isOpen')).toBe(true)
    }
  })

  test('cancel changes nothing; remove makes an examination available again', async () => {
    const f = fixture()
    await f.open()
    await f.dismiss()
    expect(f.wrapper.vm.assessed).toBe(false)
    expect(f.selected).not.toHaveBeenCalled()
    await f.open()
    await f.rows()[0].trigger('click')
    await f.dismiss()
    const item = f.wrapper.findAllComponents(DodoExaminationItem)[0]
    await item.get('.remove-examination').trigger('click')
    expect(item.emitted('remove')).toHaveLength(1)
    expect(f.card.find('.finding').exists()).toBe(false)
    expect(f.rows()[0].text()).toBe('First')
    await f.open()
    await f.rows()[0].trigger('click')
    await f.dismiss()
    expect(f.activate).toHaveBeenCalledTimes(2)
  })

  test('removal waits until Ionic re-enables the add button before restoring focus', async () => {
    const f = fixture()
    await f.open()
    await f.rows()[0].trigger('click')
    await f.dismiss()
    const button = document.createElement('button')
    button.disabled = true
    f.card.get('.add-examination').element.attachShadow({ mode: 'open' }).append(button)
    const focus = vi.spyOn(button, 'focus')
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
    try {
      await f.card.get('.remove-examination').trigger('click')
      for (let frame = 0; frame < 2; frame++) {
        expect(frames).toHaveLength(1)
        frames.shift()!(0)
        await flushPromises()
        expect(focus).not.toHaveBeenCalled()
      }
      button.disabled = false
      frames.shift()!(0)
      await flushPromises()
      expect(focus).toHaveBeenCalledOnce()
      expect(frames).toHaveLength(0)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  test('reveals items in declaration order and does not activate restored assessments', async () => {
    const f = fixture()
    f.wrapper.vm.second = true
    await nextTick()
    expect(f.wrapper.getComponent(DodoItemModal).getComponent(IonModal).props('isOpen')).toBe(false)
    await f.open()
    await f.rows()[0].trigger('click')
    await f.dismiss()
    expect(f.card.findAll('.examination-item').map(row => row.attributes('data-examination')))
      .toEqual(['first', 'second'])
  })

  test.each(
    (['legacy', 'negative', 'positive'] as const).flatMap(preset =>
      (['unavailable', 'unassessed', 'unmounted'] as const).map(reason => ({ preset, reason }))),
  )('cancels $preset selection when $reason', async ({ preset, reason }) => {
    const f = fixture(preset !== 'legacy')
    await f.open()
    const row = f.rows()[0]
    await (preset === 'positive' ? row.get('.positive-examination') : row).trigger('click')
    if (reason === 'unavailable') f.wrapper.vm.available = false
    if (reason === 'unassessed') f.wrapper.vm.assessed = false
    if (reason === 'unmounted') f.wrapper.vm.mounted = false
    await nextTick()
    // Restoring eligibility must not revive a cancelled activation.
    if (reason === 'unavailable') f.wrapper.vm.available = true
    await f.dismiss()
    expect(f.activate).not.toHaveBeenCalled()
  })

  test('opens a revealed item modal after the picker has dismissed', async () => {
    const f = fixture()
    await f.open()
    await f.rows()[1].trigger('click')
    const detail = f.wrapper.getComponent(DodoItemModal).getComponent(IonModal)
    expect(detail.props('isOpen')).toBe(false)
    await f.dismiss()
    expect(detail.props('isOpen')).toBe(true)
  })

  test.each(['legacy', 'negative', 'positive'] as const)('%s select activation preserves its value', async preset => {
    const wrapper = mount(defineComponent({
      components: { DodoExaminationCard, DodoExaminationItem, DodoInputSelect },
      setup: () => ({ assessed: ref(false), select: ref(), value: ref('a'), presets: preset !== 'legacy' }),
      template: `<DodoExaminationCard title="Test">
        <DodoExaminationItem id="select" label="Select" :assessed-presets="presets" v-model:assessed="assessed" @activate="select.open()">
          <DodoInputSelect ref="select" label="Choice" v-model="value" :options="['a', 'b']" />
        </DodoExaminationItem>
      </DodoExaminationCard>`,
    }), { global })
    await nextTick()
    await wrapper.get('.add-examination').trigger('click')
    const picker = wrapper.getComponent(IonPopover)
    await (preset === 'positive' ? picker.get('.positive-examination') : picker.getComponent(IonItem)).trigger('click')
    const open = vi.fn().mockResolvedValue(undefined)
    const select = wrapper.getComponent(IonSelect).element as HTMLIonSelectElement
    select.open = open
    expect(open).not.toHaveBeenCalled()
    picker.vm.$emit('didDismiss')
    await flushPromises()
    if (preset === 'negative') expect(open).not.toHaveBeenCalled()
    else expect(open).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ target: select }))
    expect(wrapper.vm.value).toBe('a')
    picker.vm.$emit('didDismiss')
    await flushPromises()
    expect(open).toHaveBeenCalledTimes(preset === 'negative' ? 0 : 1)
    expect(wrapper.get('.add-examination').attributes('disabled')).toBe('true')
  })
})

describe('Airway Stridor interaction', () => {
  test('adds positive, keeps negative visible, removes/reset and observes breathing availability', async () => {
    const store = useDokuStore()
    const wrapper = mount(AbcdeAirwayCard, { global })
    const stridor = wrapper.getComponent(DodoExaminationItem)
    const card = wrapper.getComponent(DodoExaminationCard)
    await nextTick()
    expect(stridor.findComponent(IonToggle).exists()).toBe(false)
    await card.get('.add-examination').trigger('click')
    const picker = card.getComponent(IonPopover)
    await picker.getComponent(IonItem).trigger('click')
    picker.vm.$emit('didDismiss')
    await flushPromises()
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: true, value: true })
    stridor.getComponent(IonToggle).vm.$emit('update:modelValue', false)
    await nextTick()
    expect(stridor.findComponent(IonToggle).exists()).toBe(true)
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: true, value: false })
    await stridor.getComponent(IonButton).trigger('click')
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: false, value: false })
    await card.get('.add-examination').trigger('click')
    await picker.getComponent(IonItem).trigger('click')
    picker.vm.$emit('didDismiss')
    await flushPromises()
    store.doku.xAbcde.isBreathing = false
    await nextTick()
    expect(store.doku.xAbcde.stridor).toMatchObject({ assessed: false, value: false })
    expect(stridor.findComponent(IonToggle).exists()).toBe(false)
    expect(picker.findAllComponents(IonItem)).toHaveLength(0)
    expect(card.get('.add-examination').attributes('disabled')).toBe('true')
  })
})

const breathingBooleanIds = [
  'accessoryMuscles', 'retractions', 'paradoxical', 'jugularVenousDistension', 'emphysema', 'trachealDeviation',
] as const

function breathingFixture() {
  const wrapper = mount(AbcdeBreathingCard, { global })
  const picker = wrapper.getComponent(IonPopover)
  const item = (id: string) => wrapper.findAllComponents(DodoExaminationItem).find(item => item.props('id') === id)!
  const select = async (id: string, positive = false) => {
    await wrapper.get('.add-examination').trigger('click')
    const row = picker.get(`[data-examination="${id}"]`)
    await (positive ? row.get('.positive-examination') : row).trigger('click')
  }
  const dismiss = async () => {
    picker.vm.$emit('didDismiss')
    await flushPromises()
  }
  return { wrapper, picker, item, select, dismiss }
}

describe('Breathing examinations', () => {
  test.each(breathingBooleanIds)('%s adds positive, keeps negative visible, removes and re-adds', async id => {
    const store = useDokuStore()
    const f = breathingFixture()
    await nextTick()
    expect(f.picker.findAllComponents(IonItem).map(row => row.attributes('data-examination')))
      .toEqual(['auscultation', ...breathingBooleanIds])
    expect(f.wrapper.findAllComponents(DodoItemModal).some(modal => modal.props('label') === 'Thoraxbefunde')).toBe(false)
    expect(f.item(id).findComponent(IonToggle).exists()).toBe(false)
    await f.select(id)
    await f.dismiss()
    expect(store.doku.xaBcde[id]).toMatchObject({ assessed: true, value: true })
    f.item(id).getComponent(IonToggle).vm.$emit('update:modelValue', false)
    await nextTick()
    expect(f.item(id).findComponent(IonToggle).exists()).toBe(true)
    expect(store.doku.xaBcde[id]).toMatchObject({ assessed: true, value: false })
    await f.item(id).get('.remove-examination').trigger('click')
    expect(store.doku.xaBcde[id]).toMatchObject({ assessed: false, value: false })
    await f.select(id)
    await f.dismiss()
    expect(store.doku.xaBcde[id]).toMatchObject({ assessed: true, value: true })
  })

  test('only auscultation offers presets and adds its default without opening', async () => {
    const store = useDokuStore()
    const f = breathingFixture()
    await nextTick()
    expect(f.picker.findAll('.positive-examination')).toHaveLength(1)
    await f.select('auscultation')
    await f.dismiss()
    expect(store.doku.xaBcde.auscultation).toMatchObject({
      assessed: true, value: { wheezing: '', crackles: '', dimished: '' },
    })
    const modal = f.item('auscultation').getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('unauffällig')
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(false)
    await modal.getComponent(IonItem).trigger('click')
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(true)
  })

  test('opens auscultation after dismissal, preserves edits on reopen and resets on removal', async () => {
    const store = useDokuStore()
    const f = breathingFixture()
    await f.select('auscultation', true)
    const modal = f.item('auscultation').getComponent(DodoItemModal).getComponent(IonModal)
    expect(modal.props('isOpen')).toBe(false)
    await f.dismiss()
    expect(modal.props('isOpen')).toBe(true)
    expect(f.item('auscultation').findComponent(IonToggle).exists()).toBe(false)
    store.doku.xaBcde.auscultation.value.crackles = 'bds.'
    modal.vm.$emit('willDismiss')
    await nextTick()
    await f.item('auscultation').getComponent(DodoItemModal).getComponent(IonItem).trigger('click')
    expect(store.doku.xaBcde.auscultation.value.crackles).toBe('bds.')
    await f.item('auscultation').get('.remove-examination').trigger('click')
    expect(store.doku.xaBcde.auscultation).toMatchObject({
      assessed: false, value: { wheezing: '', crackles: '', dimished: '' },
    })
    await f.select('auscultation', true)
    await f.dismiss()
    expect(store.doku.xaBcde.auscultation.assessed).toBe(true)
    expect(store.doku.xaBcde.auscultation.value.crackles).toBe('')
  })

  test('restored auscultation remains intact without opening its modal', async () => {
    const store = useDokuStore()
    const f = breathingFixture()
    store.doku.xaBcde.auscultation.value.wheezing = 'li.'
    store.doku.xaBcde.auscultation.assessed = true
    await nextTick()
    expect(store.doku.xaBcde.auscultation.value.wheezing).toBe('li.')
    expect(f.item('auscultation').getComponent(IonModal).props('isOpen')).toBe(false)
  })

  test('breathing changes reset all findings and restrict only breathing-dependent examinations', async () => {
    const store = useDokuStore()
    mount(AbcdeAirwayCard, { global })
    const f = breathingFixture()
    for (const id of ['auscultation', ...breathingBooleanIds]) {
      await f.select(id)
      await f.dismiss()
    }
    store.doku.xaBcde.auscultation.value.wheezing = 're.'
    store.doku.xAbcde.isBreathing = false
    for (const id of breathingBooleanIds) expect(store.doku.xaBcde[id]).toMatchObject({ assessed: false, value: false })
    expect(store.doku.xaBcde.auscultation).toMatchObject({
      assessed: false, value: { wheezing: '', crackles: '', dimished: '' },
    })
    await nextTick()
    expect(f.wrapper.findAll('.examination-item')).toHaveLength(0)
    expect(f.picker.findAllComponents(IonItem).map(row => row.attributes('data-examination')))
      .toEqual(['jugularVenousDistension', 'emphysema', 'trachealDeviation'])
    await f.select('emphysema')
    await f.dismiss()
    expect(f.item('emphysema').findComponent(IonToggle).exists()).toBe(true)
    store.doku.xAbcde.isBreathing = true
    await nextTick()
    expect(f.picker.findAllComponents(IonItem)).toHaveLength(7)
  })
})
