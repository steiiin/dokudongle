import { IonButton, IonIcon, IonItem, IonItemDivider, IonModal, IonReorder, IonReorderGroup, IonSearchbar } from '@ionic/vue'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DodoInputSaatreats from '@/components/DodoInputSaatreats.vue'
import { DATA_Saatreats } from '@/data/lists/saatreats'

enableAutoUnmount(afterEach)
const mountInput = (modelValue: string[] = []) => shallowMount(DodoInputSaatreats, {
  props: { modelValue },
  global: { renderStubDefaultSlot: true },
})
type Wrapper = ReturnType<typeof mountInput>
const modal = (wrapper: Wrapper) => wrapper.getComponent(IonModal)
const chips = (wrapper: Wrapper) => modal(wrapper).findAll('.dodo-saatreats-chip')
const labels = (wrapper: Wrapper) => chips(wrapper).map(chip => chip.text())
const chip = (wrapper: Wrapper, label: string) => chips(wrapper).find(item => item.text() === label)!
const open = (wrapper: Wrapper) => wrapper.findAllComponents(IonButton)
  .find(button => button.text() === 'Invasives hinzufügen')!.trigger('click')
const save = (wrapper: Wrapper) => modal(wrapper).findAllComponents(IonButton)
  .find(button => button.text() === 'Speichern')!.trigger('click')
const lastUpdate = (wrapper: Wrapper) => wrapper.emitted('update:modelValue')!.at(-1)![0]

describe('invasive procedure selection', () => {
  test('selects across groups, keeps selected chips visible and saves once in selection order', async () => {
    const wrapper = mountInput()
    await open(wrapper)
    expect(modal(wrapper).findAllComponents(IonItemDivider).map(group => group.text()))
      .toEqual(['Gefäßzugang', 'Atemweg'])
    await chip(wrapper, 'Endotracheale Intubation').trigger('click')
    await chip(wrapper, 'Intraossärer Zugang').trigger('click')
    await chip(wrapper, 'PVK 20 G').trigger('click')
    expect(labels(wrapper)).toEqual([
      'PVK 20 G', 'Intraossärer Zugang', 'Endotracheale Intubation', 'Supraglottischer Atemweg',
    ])
    expect(chip(wrapper, 'PVK 20 G').attributes('aria-pressed')).toBe('true')
    expect(chip(wrapper, 'PVK 20 G').findComponent(IonIcon).exists()).toBe(true)
    expect(wrapper.props('modelValue')).toEqual([])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['endotracheal', 'intraossaer', 'pvk-20g'])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(modal(wrapper).props('isOpen')).toBe(false)
    // Ionic's later dismissal notification must not emit a second update.
    modal(wrapper).vm.$emit('willDismiss')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  test('restores alternatives on deselection and keeps exclusions local to their parent group', async () => {
    DATA_Saatreats.push({ id: 'test', name: 'Test', chips: [
      { id: 'test-a', label: 'Test A', protocolText: 'A', exclusiveGroupId: 'pvk' },
      { id: 'test-b', label: 'Test B', protocolText: 'B', exclusiveGroupId: 'pvk' },
    ] })
    try {
      const wrapper = mountInput(['pvk-20g'])
      await open(wrapper)
      expect(labels(wrapper)).toContain('Test A')
      expect(labels(wrapper)).toContain('Test B')
      await chip(wrapper, 'Test A').trigger('click')
      expect(labels(wrapper)).not.toContain('Test B')
      await chip(wrapper, 'PVK 20 G').trigger('click')
      expect(labels(wrapper)).toContain('PVK 18 G')
      expect(labels(wrapper)).toContain('PVK 22 G')
      expect(labels(wrapper)).not.toContain('Test B')
      await chip(wrapper, 'PVK 22 G').trigger('click')
      await save(wrapper)
      expect(lastUpdate(wrapper)).toEqual(['test-a', 'pvk-22g'])
    } finally {
      DATA_Saatreats.pop()
    }
  })

  test('searches group names and chip labels without changing or bypassing selections', async () => {
    const wrapper = mountInput(['pvk-20g', 'intraossaer'])
    await open(wrapper)
    const search = modal(wrapper).getComponent(IonSearchbar)
    await search.setValue('atemweg')
    expect(labels(wrapper)).toEqual(['Endotracheale Intubation', 'Supraglottischer Atemweg'])
    await search.setValue('pvk18')
    expect(labels(wrapper)).toEqual([])
    await search.setValue(' intub ')
    expect(labels(wrapper)).toEqual(['Endotracheale Intubation'])
    await chip(wrapper, 'Endotracheale Intubation').trigger('click')
    await search.setValue('')
    expect(chip(wrapper, 'PVK 20 G').attributes('aria-pressed')).toBe('true')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['pvk-20g', 'intraossaer', 'endotracheal'])
  })

  test.each(['button', 'dismiss'] as const)('discards edits on %s and reopens from current props', async method => {
    const wrapper = mountInput(['pvk-20g'])
    await open(wrapper)
    await chip(wrapper, 'PVK 20 G').trigger('click')
    await chip(wrapper, 'PVK 18 G').trigger('click')
    if (method === 'button') {
      await modal(wrapper).findAllComponents(IonButton)
        .find(button => button.attributes('aria-label') === 'Abbrechen')!.trigger('click')
    } else {
      modal(wrapper).vm.$emit('willDismiss')
    }
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.props('modelValue')).toEqual(['pvk-20g'])
    await wrapper.setProps({ modelValue: ['pvk-22g'] })
    await wrapper.findAllComponents(IonItem)[0].trigger('click')
    expect(chip(wrapper, 'PVK 22 G').attributes('aria-pressed')).toBe('true')
    expect(labels(wrapper)).not.toContain('PVK 18 G')
    expect(labels(wrapper)).not.toContain('PVK 20 G')
  })

  test('shows saved entries in input order without duplicates or unknown IDs and allows clearing everything', async () => {
    const wrapper = mountInput(['unknown', 'endotracheal', 'pvk-20g', 'endotracheal'])
    expect(wrapper.findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['Endotracheale Intubation', 'PVK 20 G'])
    await wrapper.findAllComponents(IonItem)[0].trigger('click')
    await chip(wrapper, 'PVK 20 G').trigger('click')
    await chip(wrapper, 'Endotracheale Intubation').trigger('click')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual([])
  })

  test('reorders displayed IDs without mutating props and retains the order through modal save and cancel', async () => {
    const original = ['unknown', 'pvk-20g', 'endotracheal', 'pvk-20g', 'intraossaer']
    const wrapper = mountInput(original)
    const complete = vi.fn((ids: string[]) => {
      expect(ids).toEqual(['pvk-20g', 'endotracheal', 'intraossaer'])
      ids.splice(0, 0, ids.splice(2, 1)[0])
      return ids
    })
    const list = wrapper.getComponent(IonReorderGroup)
    expect(list.props('disabled')).toBe(false)
    expect(list.findAllComponents(IonReorder)).toHaveLength(3)
    list.vm.$emit('ionItemReorder', { detail: { from: 2, to: 0, complete } })
    expect(complete).toHaveBeenCalledOnce()
    expect(complete.mock.calls[0][0]).not.toBe(original)
    const reordered = ['intraossaer', 'pvk-20g', 'endotracheal']
    expect(lastUpdate(wrapper)).toEqual(reordered)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(original).toEqual(['unknown', 'pvk-20g', 'endotracheal', 'pvk-20g', 'intraossaer'])
    expect(modal(wrapper).props('isOpen')).toBe(false)
    await wrapper.setProps({ modelValue: reordered })
    expect(list.findAllComponents(IonItem).map(item => item.text()))
      .toEqual(['Intraossärer Zugang', 'PVK 20 G', 'Endotracheale Intubation'])
    await list.getComponent(IonItem).trigger('click')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(reordered)
    await open(wrapper)
    await chip(wrapper, 'Intraossärer Zugang').trigger('click')
    await chip(wrapper, 'Intraossärer Zugang').trigger('click')
    modal(wrapper).vm.$emit('willDismiss')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
    await open(wrapper)
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(reordered)
  })

  test('appends new and reselected items after existing selections in selection order', async () => {
    const wrapper = mountInput(['endotracheal', 'pvk-20g'])
    await open(wrapper)
    await chip(wrapper, 'Supraglottischer Atemweg').trigger('click')
    await chip(wrapper, 'Intraossärer Zugang').trigger('click')
    await chip(wrapper, 'Endotracheale Intubation').trigger('click')
    await chip(wrapper, 'Endotracheale Intubation').trigger('click')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['pvk-20g', 'supraglottisch', 'intraossaer', 'endotracheal'])
  })

  test('handles empty and single selections', async () => {
    const wrapper = mountInput()
    expect(wrapper.findComponent(IonReorderGroup).exists()).toBe(false)
    await open(wrapper)
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual([])
    await wrapper.setProps({ modelValue: ['endotracheal'] })
    expect(wrapper.findAllComponents(IonReorder)).toHaveLength(1)
    await open(wrapper)
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual(['endotracheal'])
  })
})
