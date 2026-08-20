import { IonButton } from '@ionic/vue'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, test } from 'vitest'

import DodoInputContacts from '@/components/DodoInputContacts.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import { SampleContacts } from '@/types/protocol/sample'

const mountContacts = () => shallowMount(DodoInputContacts, {
  props: { modelValue: new SampleContacts() },
  global: { renderStubDefaultSlot: true },
})

const buttonWithText = (wrapper: ReturnType<typeof mountContacts>, text: string) =>
  wrapper.findAllComponents(IonButton).find(button => button.text().includes(text))!

describe('DodoInputContacts IME autocorrection', () => {
  test('configures name and telephone autocorrection through IME dictionaries', () => {
    const wrapper = mountContacts()
    const inputs = wrapper.findAllComponents(DodoInputText)

    expect(inputs[0].props('imeDictionary')).toEqual({ autocorrect: ['capitalize'] })
    expect(inputs[1].props('imeDictionary')).toEqual({ autocorrect: ['phone'] })
  })

  test('does not normalize contact values again while saving', async () => {
    const wrapper = mountContacts()
    await buttonWithText(wrapper, 'Kontakt hinzufügen').trigger('click')

    const inputs = wrapper.findAllComponents(DodoInputText)
    inputs[0].vm.$emit('update:modelValue', 'max mustermann')
    inputs[1].vm.$emit('update:modelValue', '0151-1234567')
    await nextTick()

    await buttonWithText(wrapper, 'Hinzufügen').trigger('click')

    const updated = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as SampleContacts
    expect(updated.contacts[0]).toMatchObject({
      contactName: 'max mustermann',
      telephone: '0151-1234567',
    })
  })
})
