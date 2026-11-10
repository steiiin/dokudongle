import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import * as Ionic from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import DodoBlockSourceShortcut from '@/components/protocol/DodoBlockSourceShortcut.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'

enableAutoUnmount(afterEach)
beforeEach(() => setActivePinia(createPinia()))

const global = {
  renderStubDefaultSlot: true,
  stubs: Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
}

const cases = [
  { source: 'schwangerschaft', label: 'Schwangerschaft', input: 'Mehrlingsstatus', value: 'Zwillinge', field: 'childCount',
    activate: (store: ReturnType<typeof useDokuStore>) => store.setPregnancyAssessed(true),
    deactivate: (store: ReturnType<typeof useDokuStore>) => store.setPregnancy(false) },
  { source: 'schwindel', label: 'Schwindel', input: 'Beginn', value: 'plötzlicher Beginn', field: 'onset',
    activate: (store: ReturnType<typeof useDokuStore>) => store.setDizziness('gerichteter'),
    deactivate: (store: ReturnType<typeof useDokuStore>) => store.setDizziness('ungerichteter') },
  { source: 'excretions_bowel', label: 'Stuhlgang', input: 'Frequenz', value: 'Durchfall', field: 'pattern',
    activate: (store: ReturnType<typeof useDokuStore>) => { store.setExcretionsAssessed(true); store.setBowelAbnormalities(true) },
    deactivate: (store: ReturnType<typeof useDokuStore>) => store.setBowelAbnormalities(false) },
  { source: 'excretions_urinary', label: 'Wasserlassen', input: 'Blut im Urin', value: 'etwas Blut im Urin', field: 'hematuria',
    activate: (store: ReturnType<typeof useDokuStore>) => { store.setExcretionsAssessed(true); store.setUrinaryAbnormalities(true) },
    deactivate: (store: ReturnType<typeof useDokuStore>) => store.setUrinaryAbnormalities(false) },
  { source: 'bauchschmerz', label: 'Bauchschmerz', input: 'Beginn', value: 'plötzlicher Beginn', field: 'onset',
    activate: (store: ReturnType<typeof useDokuStore>) => { store.setAbdominalAssessed(true); store.setAbdominalPain('leichte') },
    deactivate: (store: ReturnType<typeof useDokuStore>) => store.setAbdominalPain('keine') },
] as const

describe('block source shortcuts', () => {
  test.each(cases)('$source opens the existing form, shares data and follows availability', async entry => {
    const store = useDokuStore()
    const wrapper = mount(DodoBlockSourceShortcut, { props: { source: entry.source }, global, attachTo: document.body })
    expect(wrapper.find('button').exists()).toBe(false)
    entry.activate(store)
    await nextTick()
    const button = wrapper.get('button')
    expect(button.attributes('title')).toContain('bearbeiten')
    expect(wrapper.getComponent(Ionic.IonIcon).props('color')).toBe('medium')
    const modal = wrapper.getComponent(DodoItemModal)
    expect(modal.props('label')).toBe(entry.label)
    // The default row is replaced by the shortcut, not duplicated next to it.
    expect(modal.findComponent(Ionic.IonNote).exists()).toBe(false)
    const before = JSON.stringify([store.doku.xabcDe, store.doku.xabcdE])
    await button.trigger('click')
    expect(modal.getComponent(Ionic.IonModal).props('isOpen')).toBe(true)
    expect(JSON.stringify([store.doku.xabcDe, store.doku.xabcdE])).toBe(before)
    const input = modal.findAllComponents(DodoInputSelect).find(input => input.props('label') === entry.input)!
    input.vm.$emit('update:modelValue', entry.value)
    await nextTick()
    expect(store.doku.textAreaBlocks[entry.source].details).toHaveProperty(entry.field, entry.value)
    modal.getComponent(Ionic.IonModal).vm.$emit('willDismiss')
    await nextTick()
    const focus = vi.spyOn(button.element as HTMLElement, 'focus')
    modal.getComponent(Ionic.IonModal).vm.$emit('didDismiss')
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    // Output activation is independent of form availability.
    for (const key of Object.keys(store.doku.textAreaBlocks[entry.source].active)) store.setTextAreaBlockActive(key, false)
    await nextTick()
    expect(wrapper.find('button').exists()).toBe(true)
    if (entry.source !== 'schwangerschaft') {
      store.doku.flavors.no_emergency_call = true
      await nextTick()
      expect(wrapper.find('button').exists()).toBe(false)
      store.doku.flavors.no_emergency_call = false
      await nextTick()
    }
    entry.deactivate(store)
    await nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  test.each(['click', 'pointerdown', 'pointerup', 'keydown', 'keyup'])('%s stays within the shortcut', async event => {
    useDokuStore().setPregnancyAssessed(true)
    const wrapper = mount(DodoBlockSourceShortcut, { props: { source: 'schwangerschaft' }, global, attachTo: document.body })
    const listener = vi.fn()
    document.body.addEventListener(event, listener)
    try {
      await wrapper.get('button').trigger(event, { key: ' ' })
      expect(listener).not.toHaveBeenCalled()
    } finally {
      document.body.removeEventListener(event, listener)
    }
  })
})
