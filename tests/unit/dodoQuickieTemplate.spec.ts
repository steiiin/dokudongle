import { IonButton } from '@ionic/vue'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, test } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoQuickieTemplate from '@/components/quickie-components/DodoQuickieTemplate.vue'
import {
  DATA_Quickies,
  QU_SIT_Einweisung,
  QU_SIT_Verlegung,
  type QuickieTemplate,
} from '@/data/quickies'

const mountQuickie = (key: string) => shallowMount(DodoQuickieTemplate, {
  props: {
    isOpen: true,
    quickie: DATA_Quickies[key] as QuickieTemplate,
  },
  global: { renderStubDefaultSlot: true },
})

const insertButton = (wrapper: ReturnType<typeof mountQuickie>) =>
  wrapper.findAllComponents(IonButton).find(button => button.text().trim() === 'Einfügen')!

describe('DodoQuickieTemplate situation quickies', () => {
  test.each([
    {
      key: QU_SIT_Verlegung,
      labels: ['START', 'ZIEL'],
      placeholders: ['z.B. FKH Coswig', 'z.B. FKH Coswig'],
    },
    {
      key: QU_SIT_Einweisung,
      labels: ['ARZT', 'ZIEL', 'KRANKHEIT'],
      placeholders: ['z.B. HA Wegner', 'z.B. FKH Coswig', 'z.B. Thrombose'],
    },
  ])('renders $key with IME-enabled normal text inputs', ({ key, labels, placeholders }) => {
    const wrapper = mountQuickie(key)
    const inputs = wrapper.findAllComponents(DodoInputText)

    expect(wrapper.findComponent(DodoInputSelect).exists()).toBe(false)
    expect(inputs.map(input => input.props('label'))).toEqual(labels)
    expect(inputs.map(input => input.props('placeholder'))).toEqual(placeholders)
    expect(inputs.every(input => input.props('imeDictionary') !== undefined)).toBe(true)
    expect(inputs.map(input => input.props('assistContextId'))).toEqual(
      labels.map(label => `quickie.${key}.${label.toLowerCase()}`),
    )
    expect(insertButton(wrapper).props('disabled')).toBe(true)
  })

  test.each([
    {
      key: QU_SIT_Verlegung,
      values: ['KH Radebeul', 'Uniklinik Dresden'],
      expected: 'Verlegung von KH Radebeul nach Uniklinik Dresden.\n',
    },
    {
      key: QU_SIT_Einweisung,
      values: ['HA Wegner', 'FKH Coswig', 'Thrombose'],
      expected: 'Einweisung HA Wegner nach FKH Coswig wg. Thrombose.\n',
    },
  ])('emits the unchanged completed $key template', async ({ key, values, expected }) => {
    const wrapper = mountQuickie(key)
    const inputs = wrapper.findAllComponents(DodoInputText)

    values.forEach((value, index) => inputs[index].vm.$emit('update:modelValue', value))
    await nextTick()

    expect(insertButton(wrapper).props('disabled')).toBe(false)
    await insertButton(wrapper).trigger('click')
    expect(wrapper.emitted('accept')?.at(-1)?.[0]).toBe(expected)
  })
})
