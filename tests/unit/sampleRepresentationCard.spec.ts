import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import SampleRepresentationCard from '@/views/doku/sample/SampleRepresentationCard.vue'
import SampleContainerCard from '@/views/doku/SampleContainerCard.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputSelectChips from '@/components/inputs/DodoInputSelectChips.vue'
import DodoInputText from '@/components/inputs/DodoInputText.vue'
import { useDokuStore } from '@/store/doku'

enableAutoUnmount(afterEach)
beforeEach(() => setActivePinia(createPinia()))
const mountCard = () => shallowMount(SampleRepresentationCard, {
  global: { renderStubDefaultSlot: true, stubs: { DodoItemModal: false, DodoInputSelectChips: false } },
})
const selectByLabel = (wrapper: ReturnType<typeof mountCard>, label: string) =>
  wrapper.findAllComponents(DodoInputSelect).find(select => select.props('label') === label)!

describe('representation card', () => {
  test('follows contacts and immediately shows ordinary rows with empty defaults', () => {
    const container = shallowMount(SampleContainerCard, { global: { renderStubDefaultSlot: true } })
    expect(container.find('sample-contacts-card-stub + sample-representation-card-stub').exists()).toBe(true)
    const wrapper = mountCard()
    expect(wrapper.getComponent(DodoItemModal).props()).toMatchObject({ label: 'Vertreter', state: 'Nein' })
    expect(selectByLabel(wrapper, 'Patientenverfügung').props('modelValue')).toBe('Keine Angabe')
    expect(wrapper.find('dodo-examination-item-stub').exists()).toBe(false)
    expect(wrapper.find('.representation-actions').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Vorsorgevollmacht')
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(selectByLabel(wrapper, 'Beteiligung')).toBeUndefined()
    expect(useDokuStore().doku.sampler.representation.generateText()).toBe('')
  })

  test('opens the modal and supports defaults, chips, role changes and Nein', async () => {
    const value = useDokuStore().doku.sampler.representation
    const wrapper = mountCard()
    await wrapper.getComponent(DodoItemModal).get('ion-item-stub').trigger('click')
    expect(wrapper.getComponent(IonModal).props('isOpen')).toBe(true)
    const role = selectByLabel(wrapper, 'Vertreter vorhanden?')
    expect(role.props()).toMatchObject({ modelValue: '', emptyLabel: 'Nein' })
    role.vm.$emit('update:modelValue', 'Sorgeberechtigt')
    await nextTick()
    const involvement = selectByLabel(wrapper, 'Beteiligung')
    expect(involvement.props('modelValue')).toBe('Anwesend')
    expect(involvement.props('emptyLabel')).toBeUndefined()
    expect(wrapper.getComponent(DodoInputText).props('label')).toBe('↳ Wer?')
    expect(wrapper.findAll('.name-suggestion').map(chip => chip.text())).toEqual(['Mama', 'Papa'])
    await wrapper.findAll('.name-suggestion')[1].trigger('click')
    expect(value.representative.name).toBe('Papa')
    await wrapper.findAll('.name-suggestion')[0].trigger('keydown', { key: 'Enter' })
    expect(value.representative.name).toBe('Mama')
    await wrapper.findAll('.name-suggestion')[1].trigger('keydown', { key: ' ' })
    expect(value.representative.name).toBe('Papa')
    role.vm.$emit('update:modelValue', 'Bevollmächtigter')
    involvement.vm.$emit('update:modelValue', 'Telefonisch')
    await nextTick()
    expect(value.representative.name).toBe('Papa')
    expect(wrapper.findAll('.name-suggestion').map(chip => chip.text())).toEqual(['Tochter', 'Sohn', 'Vater', 'Mutter'])
    await wrapper.findAll('.name-suggestion')[0].trigger('click')
    expect(value.representative.name).toBe('Tochter')
    await wrapper.findAll('.name-suggestion')[1].trigger('keydown', { key: 'Enter' })
    expect(value.representative.name).toBe('Sohn')
    await wrapper.findAll('.name-suggestion')[3].trigger('keydown', { key: ' ' })
    expect(value.representative.name).toBe('Mutter')
    wrapper.getComponent(IonModal).vm.$emit('willDismiss')
    await nextTick()
    expect(wrapper.getComponent(DodoItemModal).props('state')).toBe('Bevollmächtigter · Mutter · Telefonisch')
    role.vm.$emit('update:modelValue', '')
    await nextTick()
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.find('.name-suggestion').exists()).toBe(false)
    expect(selectByLabel(wrapper, 'Beteiligung')).toBeUndefined()
    expect(value.representative).toEqual({ role: '', name: '', involvement: 'Anwesend' })
    expect(value.generateText()).toBe('')
  })

  test.each([
    ['Sorgeberechtigt', 'z.B. Mama', 2],
    ['Bevollmächtigter', 'z.B. Tochter', 4],
    ['Sonstige', 'Name/Bezeichnung', 0],
    ['Rechtl. Betreuer', 'z.B. Frau Müller', 0],
  ])('shows the placeholder and suggestions for %s', async (role, placeholder, count) => {
    const wrapper = mountCard()
    selectByLabel(wrapper, 'Vertreter vorhanden?').vm.$emit('update:modelValue', role)
    await nextTick()
    expect(wrapper.getComponent(DodoInputText).props('placeholder')).toBe(placeholder)
    expect(wrapper.findAll('.name-suggestion')).toHaveLength(count)
  })

  test('edits restrictions and clears dependent details on status changes', async () => {
    const value = useDokuStore().doku.sampler.representation
    const wrapper = mountCard()
    const status = selectByLabel(wrapper, 'Patientenverfügung')
    expect(wrapper.findComponent(DodoInputSelectChips).exists()).toBe(false)
    status.vm.$emit('update:modelValue', 'Vorhanden')
    await nextTick()
    expect(wrapper.getComponent(DodoInputSelectChips).props('label')).toBe('↳ Beschränkungen?')
    const chips = () => wrapper.findAll('.dd-input-select-chips__chip')
    const choose = async (label: string) => { await chips().find(chip => chip.text() === label)!.trigger('click') }
    await choose('Keine Reanimation')
    await choose('Keine Beatmung')
    await choose('Keine Klinikeinweisung')
    await choose('Andere')
    wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', 'Keine Dialyse')
    await choose('Keine Einschränkungen')
    expect(chips().map(chip => chip.text())).toEqual(['Keine Einschränkungen', 'Andere'])
    expect(value.advanceDirective.restrictions).toEqual(['Keine Einschränkungen', 'Andere'])
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('Keine Dialyse')
    await choose('Keine Einschränkungen')
    expect(chips()).toHaveLength(5)
    expect(value.advanceDirective.restrictions).toEqual(['Andere'])
    status.vm.$emit('update:modelValue', 'Keine')
    await nextTick()
    expect(wrapper.findComponent(DodoInputSelectChips).exists()).toBe(false)
    expect(value.advanceDirective.restrictions).toEqual([])
    expect(value.advanceDirective.otherRestriction).toBe('')
    expect(value.generateText()).toContain('Keine Patientenverfügung.')
    status.vm.$emit('update:modelValue', 'Keine Angabe')
    expect(value.generateText()).toBe('')
  })
})
