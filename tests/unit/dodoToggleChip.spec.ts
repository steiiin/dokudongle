import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import DodoToggleChip from '@/components/inputs/DodoToggleChip.vue'

test('exposes selection and supports click, Enter and Space without key-repeat toggling', async () => {
  const wrapper = mount(DodoToggleChip, {
    props: { modelValue: false },
    global: { stubs: { IonChip: true } },
  })
  expect(wrapper.attributes()).toMatchObject({ role: 'button', tabindex: '0', 'aria-pressed': 'false' })
  await wrapper.trigger('click')
  await wrapper.trigger('keydown', { key: 'Enter' })
  await wrapper.trigger('keydown', { key: ' ' })
  await wrapper.trigger('keydown', { key: ' ', repeat: true })
  await wrapper.trigger('keydown', { key: 'Escape' })
  expect(wrapper.emitted('update:modelValue')).toEqual([[true], [true], [true]])
  await wrapper.setProps({ modelValue: true })
  expect(wrapper.attributes('aria-pressed')).toBe('true')
  await wrapper.trigger('keydown', { key: 'Enter' })
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
})

test('disabled chips leave the tab order and ignore pointer and keyboard activation', async () => {
  const wrapper = mount(DodoToggleChip, {
    props: { modelValue: false, disabled: true },
    global: { stubs: { IonChip: true } },
  })
  expect(wrapper.attributes('tabindex')).toBe('-1')
  await wrapper.trigger('click')
  await wrapper.trigger('keydown', { key: 'Enter' })
  await wrapper.trigger('keydown', { key: ' ' })
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})
