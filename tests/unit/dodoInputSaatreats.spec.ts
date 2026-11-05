import { IonButton, IonIcon, IonItem, IonItemDivider, IonModal, IonReorder, IonReorderGroup, IonSearchbar } from '@ionic/vue'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { chevronBackOutline } from 'ionicons/icons'
import { nextTick } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DodoInputSaatreats from '@/components/DodoInputSaatreats.vue'
import { DATA_Saatreats } from '@/data/lists/saatreats'

enableAutoUnmount(afterEach)
const mountInput = (modelValue: string[] = []) => {
  const wrapper = shallowMount(DodoInputSaatreats, {
    props: { modelValue },
    global: { renderStubDefaultSlot: true },
  })
  // Feed updates back into props just as the parent card does.
  void wrapper.setProps({ 'onUpdate:modelValue': (value: string[]) => wrapper.setProps({ modelValue: value }) })
  return wrapper
}
type Wrapper = ReturnType<typeof mountInput>
const modal = (wrapper: Wrapper) => wrapper.getComponent(IonModal)
const chips = (wrapper: Wrapper) => modal(wrapper).findAll('.dodo-saatreats-chip')
const labels = (wrapper: Wrapper) => chips(wrapper).map(chip => chip.text())
const chip = (wrapper: Wrapper, label: string) => chips(wrapper).find(item => item.text() === label)!
const open = (wrapper: Wrapper) => wrapper.findAllComponents(IonButton)
  .find(button => button.text() === 'Invasives hinzufügen')!.trigger('click')
const back = (wrapper: Wrapper) => modal(wrapper).findAllComponents(IonButton)
  .find(button => button.attributes('aria-label') === 'Zurück')!.trigger('click')
const lastUpdate = (wrapper: Wrapper) => wrapper.emitted('update:modelValue')!.at(-1)![0]

describe('invasive procedure selection', () => {
  test('offers only a back chevron in the modal header', async () => {
    const wrapper = mountInput()
    await open(wrapper)
    const buttons = modal(wrapper).findAllComponents(IonButton)
    expect(buttons).toHaveLength(1)
    expect(buttons[0].attributes('aria-label')).toBe('Zurück')
    expect(buttons[0].attributes('title')).toBe('Zurück')
    expect(buttons[0].getComponent(IonIcon).props('icon')).toBe(chevronBackOutline)
  })

  test('removes a saved entry immediately without opening the modal or mutating props', async () => {
    const original = ['sga', 'pvk', 'io']
    const wrapper = mountInput(original)
    await wrapper.get('[aria-label="i.v.-Zugang: Maßnahme entfernen"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['sga', 'io']]])
    expect(original).toEqual(['sga', 'pvk', 'io'])
    expect(modal(wrapper).props('isOpen')).toBe(false)

    await wrapper.setProps({ modelValue: ['sga', 'io'] })
    expect(wrapper.getComponent(IonReorderGroup).findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['SGA (iGel/LT/LaMa)', 'i.o.-Zugang'])
    await open(wrapper)
    expect(chip(wrapper, 'i.v.-Zugang').attributes('aria-pressed')).toBe('false')
    expect(labels(wrapper)).toContain('i.v.-Zugang+Infusion')
    expect(chip(wrapper, 'i.o.-Zugang').attributes('aria-pressed')).toBe('true')
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['sga', 'io'])
  })

  test('removes the last saved entry and keeps adding available', async () => {
    const wrapper = mountInput(['pvk'])
    await wrapper.get('.remove-saatreat').trigger('click')
    expect(lastUpdate(wrapper)).toEqual([])
    expect(modal(wrapper).props('isOpen')).toBe(false)
    await wrapper.setProps({ modelValue: [] })
    expect(wrapper.findComponent(IonReorderGroup).exists()).toBe(false)
    await open(wrapper)
    expect(modal(wrapper).props('isOpen')).toBe(true)
    expect(chip(wrapper, 'i.v.-Zugang').attributes('aria-pressed')).toBe('false')
  })

  test('applies each selection immediately in selection order and keeps the modal open', async () => {
    const wrapper = mountInput()
    await open(wrapper)
    expect(modal(wrapper).findAllComponents(IonItemDivider).map(group => group.text()))
      .toEqual(DATA_Saatreats.map(group => group.name))
    await chip(wrapper, 'SGA (iGel/LT/LaMa)').trigger('click')
    await chip(wrapper, 'i.o.-Zugang').trigger('click')
    await chip(wrapper, 'i.v.-Zugang').trigger('click')
    expect(labels(wrapper)).toContain('i.v.-Zugang')
    expect(labels(wrapper)).not.toContain('i.v.-Zugang+Infusion')
    expect(chip(wrapper, 'i.v.-Zugang').attributes('aria-pressed')).toBe('true')
    expect(chip(wrapper, 'i.v.-Zugang').findComponent(IonIcon).exists()).toBe(true)
    expect(wrapper.props('modelValue')).toEqual(['sga', 'io', 'pvk'])
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['sga']], [['sga', 'io']], [['sga', 'io', 'pvk']],
    ])
    expect(modal(wrapper).props('isOpen')).toBe(true)
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['sga', 'io', 'pvk'])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(3)
    expect(modal(wrapper).props('isOpen')).toBe(false)
    // Ionic's later dismissal notification must not emit another update.
    modal(wrapper).vm.$emit('willDismiss')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(3)
  })

  test('restores alternatives on deselection and keeps exclusions local to their parent group', async () => {
    DATA_Saatreats.push({ id: 'test', name: 'Test', chips: [
      { id: 'test-a', label: 'Test A', protocolText: 'A', exclusiveGroupId: 'pvk' },
      { id: 'test-b', label: 'Test B', protocolText: 'B', exclusiveGroupId: 'pvk' },
    ] })
    try {
      const wrapper = mountInput(['pvk'])
      await open(wrapper)
      expect(labels(wrapper)).toContain('Test A')
      expect(labels(wrapper)).toContain('Test B')
      await chip(wrapper, 'Test A').trigger('click')
      expect(labels(wrapper)).not.toContain('Test B')
      await chip(wrapper, 'i.v.-Zugang').trigger('click')
      expect(labels(wrapper)).toContain('i.v.-Zugang+Infusion')
      expect(labels(wrapper)).not.toContain('Test B')
      await chip(wrapper, 'i.v.-Zugang+Infusion').trigger('click')
      await back(wrapper)
      expect(lastUpdate(wrapper)).toEqual(['test-a', 'pvk-vel'])
    } finally {
      DATA_Saatreats.pop()
    }
  })

  test('searches group names and chip labels without changing or bypassing selections', async () => {
    const wrapper = mountInput(['pvk', 'io'])
    await open(wrapper)
    const search = modal(wrapper).getComponent(IonSearchbar)
    await search.setValue('atemweg')
    expect(labels(wrapper)).toEqual(DATA_Saatreats.find(group => group.id === 'atemweg')!.chips.map(chip => chip.label))
    await search.setValue('infusion')
    expect(labels(wrapper)).toEqual([])
    await search.setValue(' sgaigel ')
    expect(labels(wrapper)).toEqual(['SGA (iGel/LT/LaMa)'])
    await chip(wrapper, 'SGA (iGel/LT/LaMa)').trigger('click')
    await search.setValue('')
    expect(chip(wrapper, 'i.v.-Zugang').attributes('aria-pressed')).toBe('true')
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['pvk', 'io', 'sga'])
  })

  test.each(['button', 'dismiss'] as const)('keeps edits on %s without extra updates and reopens from current props', async method => {
    const wrapper = mountInput(['pvk'])
    await open(wrapper)
    await chip(wrapper, 'i.v.-Zugang').trigger('click')
    await chip(wrapper, 'i.v.-Zugang+Infusion').trigger('click')
    await modal(wrapper).getComponent(IonSearchbar).setValue('infusion')
    if (method === 'button') await back(wrapper)
    else {
      modal(wrapper).vm.$emit('willDismiss')
      await nextTick()
    }
    expect(modal(wrapper).props('isOpen')).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]], [['pvk-vel']]])
    expect(wrapper.props('modelValue')).toEqual(['pvk-vel'])
    await open(wrapper)
    expect(chip(wrapper, 'i.v.-Zugang+Infusion').attributes('aria-pressed')).toBe('true')
    expect(labels(wrapper)).not.toContain('i.v.-Zugang')
    expect(modal(wrapper).getComponent(IonSearchbar).props('modelValue')).toBe('')
    await back(wrapper)
    await wrapper.setProps({ modelValue: ['pvk'] })
    await wrapper.findAllComponents(IonItem)[0].trigger('click')
    expect(chip(wrapper, 'i.v.-Zugang').attributes('aria-pressed')).toBe('true')
    expect(labels(wrapper)).not.toContain('i.v.-Zugang+Infusion')
  })

  test('shows saved entries in input order without duplicates or unknown IDs and allows clearing everything', async () => {
    const wrapper = mountInput(['unknown', 'sga', 'pvk', 'sga'])
    expect(wrapper.findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['SGA (iGel/LT/LaMa)', 'i.v.-Zugang'])
    await wrapper.findAllComponents(IonItem)[0].trigger('click')
    await chip(wrapper, 'i.v.-Zugang').trigger('click')
    await chip(wrapper, 'SGA (iGel/LT/LaMa)').trigger('click')
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual([])
  })

  test('reorders displayed IDs without mutating props and retains the order on close and appends reselected entries', async () => {
    const original = ['unknown', 'pvk', 'sga', 'pvk', 'io']
    const wrapper = mountInput(original)
    const complete = vi.fn((ids: string[]) => {
      expect(ids).toEqual(['pvk', 'sga', 'io'])
      ids.splice(0, 0, ids.splice(2, 1)[0])
      return ids
    })
    const list = wrapper.getComponent(IonReorderGroup)
    expect(list.props('disabled')).toBe(false)
    expect(list.findAllComponents(IonReorder)).toHaveLength(3)
    list.vm.$emit('ionItemReorder', { detail: { from: 2, to: 0, complete } })
    expect(complete).toHaveBeenCalledOnce()
    expect(complete.mock.calls[0][0]).not.toBe(original)
    const reordered = ['io', 'pvk', 'sga']
    expect(lastUpdate(wrapper)).toEqual(reordered)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(original).toEqual(['unknown', 'pvk', 'sga', 'pvk', 'io'])
    expect(modal(wrapper).props('isOpen')).toBe(false)
    await wrapper.setProps({ modelValue: reordered })
    expect(list.findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['i.o.-Zugang', 'i.v.-Zugang', 'SGA (iGel/LT/LaMa)'])
    await list.getComponent(IonItem).trigger('click')
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(reordered)
    await open(wrapper)
    await chip(wrapper, 'i.o.-Zugang').trigger('click')
    await chip(wrapper, 'i.o.-Zugang').trigger('click')
    modal(wrapper).vm.$emit('willDismiss')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(3)
    await open(wrapper)
    expect(list.findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['i.v.-Zugang', 'SGA (iGel/LT/LaMa)', 'i.o.-Zugang'])
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['pvk', 'sga', 'io'])
  })

  test('appends new and reselected items after existing selections in selection order', async () => {
    const wrapper = mountInput(['sga', 'pvk'])
    await open(wrapper)
    await chip(wrapper, 'Guedel').trigger('click')
    await chip(wrapper, 'i.o.-Zugang').trigger('click')
    await chip(wrapper, 'SGA (iGel/LT/LaMa)').trigger('click')
    await chip(wrapper, 'SGA (iGel/LT/LaMa)').trigger('click')
    await back(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['pvk', 'guedel', 'io', 'sga'])
  })

  test('handles empty and single selections', async () => {
    const wrapper = mountInput()
    expect(wrapper.findComponent(IonReorderGroup).exists()).toBe(false)
    await open(wrapper)
    await back(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ modelValue: ['sga'] })
    expect(wrapper.findAllComponents(IonReorder)).toHaveLength(1)
    await open(wrapper)
    await back(wrapper)
    expect(wrapper.props('modelValue')).toEqual(['sga'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
