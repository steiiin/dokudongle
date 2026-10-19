import { mount, shallowMount } from '@vue/test-utils'
import { IonItem, IonToggle } from '@ionic/vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DodoInputToggle, { type ToggleColor } from '@/components/DodoInputToggle.vue'
import DodoInputTextOptional from '@/components/DodoInputTextOptional.vue'
import DodoInputSelectOptional from '@/components/DodoInputSelectOptional.vue'

const mountToggle = (props: {
  modelValue?: boolean
  disabled?: boolean
  colorOn?: ToggleColor
  colorOff?: ToggleColor
  lines?: 'full' | 'inset' | 'none'
} = {}, attrs: Record<string, string> = {}) => shallowMount(DodoInputToggle, {
  props: { modelValue: false, ...props },
  attrs,
  slots: { default: 'Atmung vorhanden?' },
  global: { renderStubDefaultSlot: true },
})

describe('DodoInputToggle', () => {
  test('renders one item with a labeled toggle and preserves Ionic defaults', () => {
    const wrapper = mountToggle()
    expect(wrapper.findAllComponents(IonItem)).toHaveLength(1)
    const toggle = wrapper.getComponent(IonToggle)
    expect(toggle.text()).toBe('Atmung vorhanden?')
    expect(toggle.props('labelPlacement')).toBe('end')
    expect(toggle.props('modelValue')).toBe(false)
    expect(toggle.attributes('style') ?? '').toBe('')
    // Ionic's Vue proxy uses a sentinel for omitted props; compare to a bare item.
    const defaultItem = shallowMount(IonItem)
    expect(wrapper.getComponent(IonItem).props('lines')).toBe(defaultItem.props('lines'))
    defaultItem.unmount()
    wrapper.unmount()
  })

  test('emits one boolean update per user change and stays controlled by the parent', async () => {
    const wrapper = mountToggle()
    const toggle = wrapper.getComponent(IonToggle)
    toggle.vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(toggle.props('modelValue')).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(toggle.props('modelValue')).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    toggle.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
    wrapper.unmount()
  })

  test('disables the underlying control and ignores changes while disabled', () => {
    const wrapper = mountToggle({ disabled: true })
    const toggle = wrapper.getComponent(IonToggle)
    expect(toggle.props('disabled')).toBe(true)
    toggle.vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  test('preserves row attributes, separators, and pointer-down events', async () => {
    const wrapper = mountToggle({ lines: 'none' }, {
      class: 'custom-row', style: 'margin: 2px', 'data-field': 'breathing',
    })
    await wrapper.setProps({ lines: 'inset' })
    const item = wrapper.getComponent(IonItem)
    expect(item.props('lines')).toBe('inset')
    expect(item.classes()).toContain('custom-row')
    expect(item.attributes('style')).toContain('margin: 2px')
    expect(item.attributes('data-field')).toBe('breathing')
    await wrapper.getComponent(IonToggle).trigger('pointerdown')
    expect(wrapper.emitted('pointerdown')).toHaveLength(1)
    wrapper.unmount()
  })

  test.each([
    ['green', 'var(--ion-color-success)'],
    ['yellow', 'var(--ion-color-warning)'],
    ['orange', '#ff9800'],
    ['red', 'var(--ion-color-danger)'],
  ] as const)('colors both states with %s and clears overrides when props are removed', async (color, cssColor) => {
    const wrapper = mountToggle({ colorOn: color, colorOff: color })
    const style = (wrapper.getComponent(IonToggle).element as HTMLElement).style
    expect(style.getPropertyValue('--track-background')).toBe(cssColor)
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe(cssColor)
    expect(style.getPropertyValue('--handle-background')).not.toBe('')
    await wrapper.setProps({ modelValue: true })
    expect(style.getPropertyValue('--track-background-checked')).toBe(cssColor)
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe(cssColor)
    expect(style.getPropertyValue('--handle-background-checked')).not.toBe('')
    await wrapper.setProps({ colorOn: undefined, colorOff: undefined })
    expect(style.cssText).toBe('')
    wrapper.unmount()
  })

  test('resolves independent state colors and leaves omitted states at their defaults', async () => {
    const wrapper = mountToggle({ colorOn: 'green', colorOff: 'red' })
    const style = (wrapper.getComponent(IonToggle).element as HTMLElement).style
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe('var(--ion-color-danger)')
    await wrapper.setProps({ modelValue: true })
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe('var(--ion-color-success)')
    await wrapper.setProps({ colorOn: undefined })
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe('')
    expect(style.getPropertyValue('--track-background-checked')).toBe('')
    expect(style.getPropertyValue('--handle-background-checked')).toBe('')
    await wrapper.setProps({ modelValue: false, colorOn: 'orange', colorOff: undefined })
    expect(style.getPropertyValue('--dd-toggle-label-color')).toBe('')
    expect(style.getPropertyValue('--track-background')).toBe('')
    expect(style.getPropertyValue('--handle-background')).toBe('')
    wrapper.unmount()
  })
})

describe('optional-input toggle integration', () => {
  afterEach(() => vi.useRealTimers())

  test('preserves text focus and the pointer-down guard against clearing the toggle', async () => {
    vi.useFakeTimers()
    const setFocus = vi.fn()
    const wrapper = mount(DodoInputTextOptional, {
      props: { toggle: false, toggleLabel: 'Details?', text: '' },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          IonItem: true, IonToggle: true,
          DodoInputText: { name: 'DodoInputText', template: '<input />', methods: { setFocus } },
        },
      },
    })
    const toggle = wrapper.getComponent(IonToggle)
    toggle.vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:toggle')).toEqual([[true]])
    await wrapper.setProps({ toggle: true })
    await vi.advanceTimersByTimeAsync(300)
    expect(setFocus).toHaveBeenCalledOnce()
    expect(wrapper.getComponent(DodoInputToggle).getComponent(IonItem).props('lines')).toBe('none')
    const input = wrapper.findComponent({ name: 'DodoInputText' })
    await toggle.trigger('pointerdown')
    input.vm.$emit('leaved-empty')
    expect(wrapper.emitted('update:toggle')).toEqual([[true]])
    await vi.advanceTimersByTimeAsync(200)
    input.vm.$emit('leaved-empty')
    expect(wrapper.emitted('update:toggle')).toEqual([[true], [false]])
    wrapper.unmount()
  })

  test('preserves select opening and empty-value handling', async () => {
    vi.useFakeTimers()
    const open = vi.fn()
    const wrapper = mount(DodoInputSelectOptional, {
      props: { toggle: false, toggleLabel: 'Details?', text: '', options: ['A'] },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          IonItem: true, IonToggle: true,
          DodoInputSelect: { name: 'DodoInputSelect', template: '<button @click="open" />', methods: { open } },
        },
      },
    })
    wrapper.getComponent(IonToggle).vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:toggle')).toEqual([[true]])
    await wrapper.setProps({ toggle: true })
    await vi.advanceTimersByTimeAsync(300)
    expect(open).toHaveBeenCalledOnce()
    wrapper.findComponent({ name: 'DodoInputSelect' }).vm.$emit('leaved-empty')
    expect(wrapper.emitted('update:toggle')).toEqual([[true], [false]])
    wrapper.unmount()
  })
})
