import { shallowMount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { IonItem, IonPopover } from '@ionic/vue'
import { describe, expect, test, vi } from 'vitest'
import DodoInputSelectChips from '@/components/DodoInputSelectChips.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import type { OptionInput, SelectValue } from '@/components/DodoInputSelect.vue'

const focus = vi.fn()
const TextStub = defineComponent({
  props: ['modelValue', 'label', 'placeholder', 'labelColor', 'imeDictionary', 'assistContextId'],
  emits: ['update:modelValue', 'leaved-empty'],
  setup(_, { expose }) { expose({ setFocus: focus }) },
  template: '<input />',
})

const mountSelect = (props: {
  modelValue?: SelectValue[]
  options?: readonly (OptionInput | readonly OptionInput[])[]
  allowCustom?: boolean
  emptyLabel?: string
} = {}) => {
  const wrapper = shallowMount(DodoInputSelectChips, {
    props: {
      modelValue: [],
      label: 'Selection',
      options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
      ...props,
    },
    global: { renderStubDefaultSlot: true, stubs: { DodoInputText: TextStub } },
  })
  return wrapper
}
type Wrapper = ReturnType<typeof mountSelect>
const chips = (wrapper: Wrapper) => wrapper.findAll('.dd-input-select-chips__chip')
const chip = (wrapper: Wrapper, label: string) => {
  const match = chips(wrapper).find(button => button.text() === label)
  if (!match) throw new Error(`Missing chip: ${label}`)
  return match
}
const model = (wrapper: Wrapper) => wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SelectValue[]
const acceptUpdate = async (wrapper: Wrapper) => { await wrapper.setProps({ modelValue: model(wrapper) }) }
const edit = async (wrapper: Wrapper, value: string) => {
  wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', value)
  await nextTick()
  await acceptUpdate(wrapper)
}

describe('DodoInputSelectChips', () => {
  test.each([
    { options: ['a', 'b'], rows: [['a', 'b']] },
    { options: ['a', ['b', 'c']], rows: [['a'], ['b', 'c']] },
    { options: [['a', 'b'], ['c', 'd']], rows: [['a', 'b'], ['c', 'd']] },
    { options: ['a', 'b', ['c'], 'd', 'e'], rows: [['a', 'b'], ['c'], ['d', 'e']] },
    { options: [[], 'a', [], 'b', ['', 'a'], ['c']], rows: [['a'], ['b'], ['c']] },
  ])('preserves explicit row boundaries: $options', ({ options, rows }) => {
    const wrapper = mountSelect({ options })
    expect(wrapper.findAll('.dd-input-select-chips__row').map(row =>
      row.findAll('button').map(button => button.text()))).toEqual(rows)
  })

  test('deduplicates across rows using the first label and emits a flat selection', async () => {
    const options = Object.freeze([
      Object.freeze([{ value: 'a', label: 'First' }, 0]),
      Object.freeze([{ value: 'a', label: 'Duplicate' }, '0', 'b']),
    ])
    const wrapper = mountSelect({ options })
    expect(chips(wrapper).map(button => button.text())).toEqual(['First', '0', '0', 'b'])
    await chip(wrapper, 'b').trigger('click')
    await acceptUpdate(wrapper)
    await chip(wrapper, 'First').trigger('click')
    await acceptUpdate(wrapper)
    expect(model(wrapper)).toEqual(['b', 'a'])
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('b, First')
  })

  test('places the accessible pencil in the last row, including with no options', async () => {
    const wrapper = mountSelect({ options: [['a'], ['b']], allowCustom: true })
    const rows = wrapper.findAll('.dd-input-select-chips__row')
    expect(rows[0].find('.dd-input-select-chips__custom').exists()).toBe(false)
    expect(rows[1].get('button:last-child').attributes('aria-label')).toBe('Eigenen Wert eingeben')
    await wrapper.setProps({ options: [[], ['']] })
    expect(wrapper.findAll('.dd-input-select-chips__row')).toHaveLength(1)
    expect(chips(wrapper)).toHaveLength(1)
    await wrapper.setProps({ allowCustom: false })
    expect(wrapper.findAll('.dd-input-select-chips__row')).toHaveLength(0)
  })

  test.each([false, true])('Speichern only closes the popover (allowCustom=%s)', async allowCustom => {
    const wrapper = mountSelect({ allowCustom })
    await wrapper.get('.dd-input-select-chips').trigger('click')
    await chip(wrapper, 'Alpha').trigger('click')
    await acceptUpdate(wrapper)
    const updates = wrapper.emitted('update:modelValue')?.length
    const save = wrapper.get('.dd-input-select-chips__save')
    expect(save.text()).toBe('Speichern')
    await save.trigger('click')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(updates!)
    expect(model(wrapper)).toEqual(['a'])
  })

  test('toggles immediately in selection order without mutating the model or closing', async () => {
    const original: SelectValue[] = ['b']
    Object.freeze(original)
    const wrapper = mountSelect({ modelValue: original })
    await wrapper.get('.dd-input-select-chips').trigger('click')
    const popover = wrapper.getComponent(IonPopover)
    expect(popover.props('isOpen')).toBe(true)
    expect(popover.props('event')).toBeInstanceOf(Event)
    expect(chip(wrapper, 'Beta').attributes('aria-pressed')).toBe('true')
    await chip(wrapper, 'Alpha').trigger('click')
    expect(model(wrapper)).toEqual(['b', 'a'])
    expect(model(wrapper)).not.toBe(original)
    await acceptUpdate(wrapper)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Beta, Alpha')
    await chip(wrapper, 'Beta').trigger('click')
    expect(model(wrapper)).toEqual(['a'])
    expect(original).toEqual(['b'])
    expect(popover.props('isOpen')).toBe(true)
  })

  test('deduplicates options and emitted values while distinguishing numbers and strings', async () => {
    const wrapper = mountSelect({ modelValue: [0, 0], options: [0, '0', 0, '__custom'] })
    expect(chips(wrapper)).toHaveLength(3)
    expect(chips(wrapper).map(button => button.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    await chips(wrapper)[1].trigger('click')
    expect(model(wrapper)).toEqual([0, '0'])
    await acceptUpdate(wrapper)
    await chip(wrapper, '__custom').trigger('click')
    expect(model(wrapper)).toEqual([0, '0', '__custom'])
  })

  test('shows the empty label after deselecting the last value without adding an empty option', async () => {
    const wrapper = mountSelect({ modelValue: ['a'], options: ['', 'a'] })
    expect(chips(wrapper).map(button => button.text())).toEqual(['a'])
    await chip(wrapper, 'a').trigger('click')
    expect(model(wrapper)).toEqual([])
    await acceptUpdate(wrapper)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Keine')
    expect(chip(wrapper, 'a').attributes('aria-pressed')).toBe('false')
    await wrapper.setProps({ options: [{ value: '', label: 'Empty' }] })
    expect(chips(wrapper)).toHaveLength(0)
    await wrapper.setProps({ options: [] })
    expect(chips(wrapper)).toHaveLength(0)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Keine')
    await wrapper.setProps({ emptyLabel: 'Nicht ausgewählt' })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Nicht ausgewählt')
    await wrapper.setProps({ emptyLabel: '' })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('')
  })

  test('uses semantic buttons and synchronizes dismissal without updating the model', async () => {
    const wrapper = mountSelect()
    const initialEvent = wrapper.getComponent(IonPopover).props('event')
    const trigger = wrapper.get('button.dd-input-select-chips')
    expect(trigger.attributes('type')).toBe('button')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(chips(wrapper).every(button => button.element.tagName === 'BUTTON' && button.attributes('type') === 'button')).toBe(true)
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    wrapper.getComponent(IonPopover).vm.$emit('didDismiss')
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.getComponent(IonPopover).props('event')).toBe(initialEvent)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  test('opens and focuses one custom input after dismissal and forwards input props', async () => {
    focus.mockClear()
    const wrapper = mountSelect({ modelValue: ['a'], allowCustom: true })
    await wrapper.setProps({ customLabel: 'Details', customPlaceholder: 'Type here', labelColor: 'warning', assistContextId: 'example', lines: 'inset', description: 'Choose values' })
    await wrapper.get('.dd-input-select-chips').trigger('click')
    const customRow = wrapper.get('.dd-input-select-chips__custom')
    expect(customRow.element.tagName).toBe('BUTTON')
    expect(customRow.attributes('aria-label')).toBe('Eigenen Wert eingeben')
    await customRow.trigger('click')
    expect(model(wrapper)).toEqual([])
    await acceptUpdate(wrapper)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(false)
    expect(wrapper.find('.dd-input-select-chips__custom').exists()).toBe(false)
    expect(focus).not.toHaveBeenCalled()
    const input = wrapper.getComponent(DodoInputText)
    expect(input.props()).toMatchObject({ modelValue: '', label: '↳ Details', placeholder: 'Type here', labelColor: 'warning', assistContextId: 'example' })
    expect(wrapper.findAllComponents(IonItem).slice(0, 2).map(item => item.props('lines'))).toEqual(['none', 'inset'])
    wrapper.getComponent(IonPopover).vm.$emit('didDismiss')
    await nextTick()
    expect(focus).toHaveBeenCalledOnce()
    await edit(wrapper, 'custom')
    expect(model(wrapper)).toEqual(['custom'])
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    await edit(wrapper, 'edited')
    expect(model(wrapper)).toEqual(['edited'])
    await wrapper.get('.dd-input-select-chips').trigger('click')
    expect(wrapper.find('.dd-input-select-chips__custom').exists()).toBe(false)
    await chip(wrapper, 'Beta').trigger('click')
    await acceptUpdate(wrapper)
    expect(model(wrapper)).toEqual(['b'])
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.find('.dd-input-select-chips__custom').exists()).toBe(true)
    expect(wrapper.getComponent(IonPopover).props('isOpen')).toBe(true)
    await chip(wrapper, 'Alpha').trigger('click')
    await acceptUpdate(wrapper)
    expect(model(wrapper)).toEqual(['b', 'a'])
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Beta, Alpha')
  })

  test('keeps a cleared draft editable, then hides it on empty blur', async () => {
    const wrapper = mountSelect({ modelValue: ['a', 'custom'], allowCustom: true })
    await edit(wrapper, '')
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Alpha, Andere')
    await edit(wrapper, 'again')
    expect(model(wrapper)).toEqual(['a', 'again'])
    await edit(wrapper, '')
    wrapper.getComponent(DodoInputText).vm.$emit('leaved-empty')
    await nextTick()
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Alpha')
  })

  test('handles DodoInputText whitespace blur before its final trim update', async () => {
    const wrapper = mountSelect({ modelValue: ['a', 'custom'], allowCustom: true })
    await edit(wrapper, '   ')
    const input = wrapper.getComponent(DodoInputText)
    input.vm.$emit('leaved-empty')
    input.vm.$emit('update:modelValue', '')
    await acceptUpdate(wrapper)
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
  })

  test('does not take ownership of an already selected value when custom text collides', async () => {
    const wrapper = mountSelect({ modelValue: ['a', 'custom'], allowCustom: true })
    await edit(wrapper, 'a')
    expect(model(wrapper)).toEqual(['a'])
    await edit(wrapper, 'new')
    expect(model(wrapper)).toEqual(['a', 'new'])
    await edit(wrapper, 'a')
    await chip(wrapper, 'Alpha').trigger('click')
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
  })

  test('rehydrates external values and options without emitting or dropping unknown values', async () => {
    const wrapper = mountSelect({ modelValue: ['a', 'legacy', 42], allowCustom: true })
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('legacy')
    expect(chip(wrapper, '42').exists()).toBe(true)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Alpha, Andere, 42')
    await wrapper.setProps({ options: ['a', 'legacy', 42] })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    await wrapper.setProps({ options: ['a'], modelValue: ['a', 'external'] })
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('external')
    await wrapper.setProps({ allowCustom: false })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(chip(wrapper, 'external').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await chip(wrapper, 'external').trigger('click')
    expect(model(wrapper)).toEqual(['a'])
    await wrapper.setProps({ modelValue: [], allowCustom: true })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
  })

  test('shows Andere for custom-only selections and the empty label after deselection', async () => {
    const wrapper = mountSelect({ modelValue: ['custom'], allowCustom: true })
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    await wrapper.setProps({ labelColor: '#123456' })
    expect(wrapper.get('.dd-input-select-chips__label > span').attributes('style')).toContain('rgb(18, 52, 86)')
    await edit(wrapper, '')
    wrapper.getComponent(DodoInputText).vm.$emit('leaved-empty')
    await nextTick()
    expect(model(wrapper)).toEqual([])
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Keine')
    await wrapper.get('.dd-input-select-chips__custom').trigger('click')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('')
  })

  test('selects a preset matching custom text instead of toggling it off', async () => {
    const wrapper = mountSelect({ allowCustom: true })
    await wrapper.get('.dd-input-select-chips__custom').trigger('click')
    await edit(wrapper, 'a')
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    expect(chip(wrapper, 'Alpha').attributes('aria-pressed')).toBe('false')
    await chip(wrapper, 'Alpha').trigger('click')
    expect(model(wrapper)).toEqual(['a'])
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(chip(wrapper, 'Alpha').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Alpha')
  })

  test('preserves custom mode when parent renders recreate inline options', async () => {
    const options = () => [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]
    const wrapper = mountSelect({ modelValue: ['a'], options: options(), allowCustom: true })
    await wrapper.get('.dd-input-select-chips__custom').trigger('click')
    await wrapper.setProps({ modelValue: model(wrapper), options: options() })
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('')
    await wrapper.setProps({ options: options() })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(true)
    wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', 'a')
    await wrapper.setProps({ modelValue: model(wrapper), options: options() })
    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('a')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Andere')
    await wrapper.setProps({ options: [{ value: 'a', label: 'Changed' }] })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Changed')
  })
})
