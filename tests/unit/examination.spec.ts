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
import AbcdeAirwayCard from '@/views/dokuCards/abcdeCards/AbcdeAirwayCard.vue'
import { useDokuStore } from '@/store/doku'

const global = {
  renderStubDefaultSlot: true,
  stubs: { ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])), DodoInputText: true, DodoInputTreatment: true },
}
enableAutoUnmount(afterEach)
beforeEach(() => setActivePinia(createPinia()))

function fixture() {
  const activate = vi.fn()
  const selected = vi.fn()
  const wrapper = mount(defineComponent({
    components: { DodoExaminationCard, DodoExaminationItem, DodoItemModal, DodoInputSelect },
    setup() {
      return {
        assessed: ref(false), second: ref(false), available: ref(true), mounted: ref(true),
        selected, activate, modal: ref(), select: ref(), value: ref('a'),
      }
    },
    template: `<DodoExaminationCard title="Test">
      <DodoExaminationItem v-if="mounted" id="first" label="First" v-model:assessed="assessed"
        :available="available" @select="selected" @activate="activate">
        <span class="finding">Finding</span>
      </DodoExaminationItem>
      <DodoExaminationItem id="second" v-model:assessed="second" @activate="modal.open()">
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
    expect(f.selected).toHaveBeenCalledOnce()
    expect(f.card.find('.finding').exists()).toBe(true)
    expect(f.rows().map(row => row.text())).toEqual(['Custom second', 'Select'])
    expect(f.activate).not.toHaveBeenCalled()
    await f.dismiss()
    expect(f.activate).toHaveBeenCalledOnce()
    await f.dismiss()
    expect(f.activate).toHaveBeenCalledOnce()
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

  test.each(['unavailable', 'unassessed', 'unmounted'] as const)('cancels activation when %s', async reason => {
    const f = fixture()
    await f.open()
    await f.rows()[0].trigger('click')
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

  test('opens a revealed select exactly once after dismissal', async () => {
    const wrapper = mount(defineComponent({
      components: { DodoExaminationCard, DodoExaminationItem, DodoInputSelect },
      setup: () => ({ assessed: ref(false), select: ref(), value: ref('a') }),
      template: `<DodoExaminationCard title="Test">
        <DodoExaminationItem id="select" label="Select" v-model:assessed="assessed" @activate="select.open()">
          <DodoInputSelect ref="select" label="Choice" v-model="value" :options="['a', 'b']" />
        </DodoExaminationItem>
      </DodoExaminationCard>`,
    }), { global })
    await nextTick()
    await wrapper.get('.add-examination').trigger('click')
    const picker = wrapper.getComponent(IonPopover)
    await picker.getComponent(IonItem).trigger('click')
    const open = vi.fn().mockResolvedValue(undefined)
    const select = wrapper.getComponent(IonSelect).element as HTMLIonSelectElement
    select.open = open
    expect(open).not.toHaveBeenCalled()
    picker.vm.$emit('didDismiss')
    await flushPromises()
    expect(open).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ target: select }))
    picker.vm.$emit('didDismiss')
    await flushPromises()
    expect(open).toHaveBeenCalledOnce()
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
