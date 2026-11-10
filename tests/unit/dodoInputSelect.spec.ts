import { shallowMount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { IonSelect, IonSelectOption } from '@ionic/vue'

import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputText from '@/components/inputs/DodoInputText.vue'

const mountCustomSelect = (emptyLabel?: string) => shallowMount(DodoInputSelect, {
  props: {
    modelValue: 'wrong draft',
    label: 'Selection',
    options: ['known option'],
    allowCustom: true,
    ...(emptyLabel === undefined ? {} : { emptyLabel }),
  },
  global: { renderStubDefaultSlot: true },
})

const clearCustomDraft = async (wrapper: ReturnType<typeof mountCustomSelect>) => {
  wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', '')
  await wrapper.setProps({ modelValue: '' })
}

describe('DodoInputSelect custom text', () => {
  test('supports a custom option label while retaining the default', async () => {
    const wrapper = mountCustomSelect('Empty')
    const customOption = () => wrapper.findAllComponents(IonSelectOption).find(option => option.props('value') === '__custom')!
    expect(customOption().text()).toBe('Andere')
    await wrapper.setProps({ customOptionLabel: 'Benutzerdefinierte Angabe' })
    expect(customOption().text()).toBe('Benutzerdefinierte Angabe')
  })

  test('prevents select changes and custom text edits while disabled', async () => {
    const wrapper = mountCustomSelect('Empty')
    await wrapper.setProps({ disabled: true })
    const previousUpdates = wrapper.emitted('update:modelValue')?.length ?? 0
    const select = wrapper.getComponent(IonSelect)
    const open = vi.fn()
    Object.assign(select.element, { open })
    wrapper.vm.open()
    expect(open).not.toHaveBeenCalled()
    expect(select.props('disabled')).toBe(true)
    expect(wrapper.getComponent(DodoInputText).attributes('disabled')).toBeDefined()
    select.vm.$emit('update:modelValue', 'known option')
    wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', 'changed draft')
    wrapper.getComponent(DodoInputText).vm.$emit('leaved-empty')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')?.length ?? 0).toBe(previousUpdates)
    await wrapper.setProps({ modelValue: 'known option' })
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    select.vm.$emit('update:modelValue', '__custom')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    await wrapper.setProps({ disabled: false })
    wrapper.vm.open()
    expect(open).toHaveBeenCalledOnce()
    select.vm.$emit('update:modelValue', '')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  test('keeps an empty custom draft editable while it is active', async () => {
    const wrapper = mountCustomSelect('Empty')

    await clearCustomDraft(wrapper)

    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('')

    wrapper.getComponent(DodoInputText).vm.$emit('update:modelValue', 'corrected draft')
    await wrapper.setProps({ modelValue: 'corrected draft' })

    expect(wrapper.getComponent(DodoInputText).props('modelValue')).toBe('corrected draft')
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('corrected draft')
  })

  test('selects the empty option after leaving an empty custom draft', async () => {
    const wrapper = mountCustomSelect('Empty')
    await clearCustomDraft(wrapper)

    wrapper.getComponent(DodoInputText).vm.$emit('leaved-empty')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('')
  })

  test('selects the first regular option after leaving an empty custom draft without an empty option', async () => {
    const wrapper = mountCustomSelect()
    await clearCustomDraft(wrapper)

    wrapper.getComponent(DodoInputText).vm.$emit('leaved-empty')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(DodoInputText).exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('known option')
  })
})
