import { shallowMount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputText from '@/components/DodoInputText.vue'

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
