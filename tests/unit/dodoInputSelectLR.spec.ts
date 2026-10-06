import { shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonPopover } from '@ionic/vue'
import { describe, expect, test } from 'vitest'

import DodoInputSelectLR from '@/components/DodoInputSelectLR.vue'
import type { OptionInput, SelectValue } from '@/components/DodoInputSelect.vue'

const mountSelect = (props: {
  left?: SelectValue
  right?: SelectValue
  options?: readonly OptionInput[]
  emptyLabel?: string
} = {}) => shallowMount(DodoInputSelectLR, {
  props: {
    left: 'steady',
    right: 'drop',
    label: 'Armhalteversuch',
    options: [
      { value: 'steady', label: 'Ohne Absinken' },
      { value: 'drop', label: 'Absinken' },
    ],
    ...props,
  },
  global: { renderStubDefaultSlot: true },
})

describe('DodoInputSelectLR', () => {
  test('shows option labels in a reactive summary and keeps side button labels fixed', async () => {
    const wrapper = mountSelect()
    const summary = () => wrapper.get('[aria-live="polite"]').text()
    expect(summary()).toBe('Li: Ohne Absinken • Re: Absinken')
    const buttons = wrapper.findAllComponents(IonButton)
    expect(buttons.map(button => button.text())).toEqual(['Links', 'Rechts'])
    expect(buttons.map(button => button.attributes('aria-label')))
      .toEqual(['Armhalteversuch: Links', 'Armhalteversuch: Rechts'])

    await wrapper.setProps({ left: 'drop', right: 'steady', description: 'Arme ausstrecken' })
    expect(summary()).toBe('Li: Absinken • Re: Ohne Absinken')
    expect(wrapper.text()).toContain('Arme ausstrecken')
    await wrapper.setProps({ options: [{ value: 'drop', label: 'Voll Absinken' }] })
    expect(summary()).toBe('Li: Voll Absinken • Re: steady')
    expect(wrapper.emitted('update:left')).toBeUndefined()
    expect(wrapper.emitted('update:right')).toBeUndefined()
  })

  test.each(['left', 'right'] as const)('opens and updates only the %s side', async (side) => {
    const wrapper = mountSelect()
    const button = wrapper.findAllComponents(IonButton)[side === 'left' ? 0 : 1]
    await button.trigger('click')
    const popover = wrapper.getComponent(IonPopover)
    expect(popover.props('isOpen')).toBe(true)
    expect(popover.props('event')).toBeInstanceOf(Event)
    const options = popover.findAllComponents(IonItem)
    expect(options.filter(option => option.attributes('aria-current') === 'true').map(option => option.text()))
      .toEqual([side === 'left' ? 'Ohne Absinken' : 'Absinken'])

    await options[side === 'left' ? 1 : 0].trigger('click')
    expect(wrapper.emitted(`update:${side}`)).toEqual([[side === 'left' ? 'drop' : 'steady']])
    expect(wrapper.emitted(`update:${side === 'left' ? 'right' : 'left'}`)).toBeUndefined()
    expect(popover.props('isOpen')).toBe(false)

    popover.vm.$emit('didDismiss')
    await wrapper.vm.$nextTick()
    await wrapper.findAllComponents(IonButton)[side === 'left' ? 1 : 0].trigger('click')
    expect(popover.props('isOpen')).toBe(true)
  })

  test('dismisses without changing either model', async () => {
    const wrapper = mountSelect()
    await wrapper.findAllComponents(IonButton)[0].trigger('click')
    const popover = wrapper.getComponent(IonPopover)
    popover.vm.$emit('didDismiss')
    await wrapper.vm.$nextTick()
    expect(popover.props('isOpen')).toBe(false)
    expect(wrapper.emitted('update:left')).toBeUndefined()
    expect(wrapper.emitted('update:right')).toBeUndefined()
  })

  test('preserves numeric zero and distinguishes numeric from string values', async () => {
    const wrapper = mountSelect({ left: 0, right: '0', options: [0, '0', 1, 'Other'] })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Li: 0 • Re: 0')
    await wrapper.findAllComponents(IonButton)[1].trigger('click')
    const options = wrapper.getComponent(IonPopover).findAllComponents(IonItem)
    expect(options[0].attributes('aria-current')).toBeUndefined()
    expect(options[1].attributes('aria-current')).toBe('true')
    await options[0].trigger('click')
    expect(wrapper.emitted('update:right')).toEqual([[0]])
  })

  test('uses the empty label once, ahead of an existing empty option', async () => {
    const wrapper = mountSelect({
      left: '', right: 'drop', emptyLabel: 'Nicht anwendbar',
      options: [{ value: '', label: 'Empty' }, { value: 'drop', label: 'Absinken' }],
    })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Li: Nicht anwendbar • Re: Absinken')
    await wrapper.findAllComponents(IonButton)[1].trigger('click')
    const options = wrapper.getComponent(IonPopover).findAllComponents(IonItem)
    expect(options.map(option => option.text())).toEqual(['Nicht anwendbar', 'Absinken'])
    await options[0].trigger('click')
    expect(wrapper.emitted('update:right')).toEqual([['']])
  })

  test('uses an explicit empty option label or a dash, and preserves unknown values', async () => {
    const wrapper = mountSelect({ left: '', right: 'legacy', options: [{ value: '', label: 'Keine' }] })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Li: Keine • Re: legacy')
    await wrapper.setProps({ options: [] })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Li: — • Re: legacy')
    expect(wrapper.getComponent(IonPopover).findAllComponents(IonItem)).toHaveLength(0)
    expect(wrapper.emitted('update:left')).toBeUndefined()
    expect(wrapper.emitted('update:right')).toBeUndefined()
  })
})
