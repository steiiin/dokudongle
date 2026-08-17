import { IonButton } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoQuickieTemplate from '@/components/quickie-components/DodoQuickieTemplate.vue'
import { QU_SIT_Verlegung } from '@/data/quickies'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'
import { EnhanceableText } from '@/types/protocol/input'

vi.mock('@/plugins/input-suggestions', () => ({
  setInputSuggestionsDisabled: vi.fn().mockResolvedValue(undefined),
}))

const mountTextarea = (modelValue = new EnhanceableText('')) => shallowMount(DodoInputTextArea, {
  props: {
    modelValue,
    title: 'Situation',
    placeholder: 'Text eingeben ...',
    enhanceFn: vi.fn().mockResolvedValue('Verbessert'),
  },
  global: {
    renderStubDefaultSlot: true,
  },
})

const lastModelUpdate = (wrapper: ReturnType<typeof mountTextarea>): EnhanceableText => {
  const updates = wrapper.emitted('update:modelValue')
  expect(updates).toBeTruthy()
  return updates![updates!.length - 1][0] as EnhanceableText
}

describe('DodoInputTextArea native textarea', () => {
  beforeEach(() => {
    vi.mocked(setInputSuggestionsDisabled).mockClear()
  })

  test('uses a multiline native control with correction disabled', () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get('textarea.dd-modal-textarea')

    expect(wrapper.find('ion-textarea-stub').exists()).toBe(false)
    expect(textarea.attributes()).toMatchObject({
      rows: '1',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
    })
  })

  test('preserves multiline input and commits it as one undoable edit', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Vorher'))
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')

    await textarea.trigger('focus')
    await wrapper.setProps({ modelValue: lastModelUpdate(wrapper) })
    await textarea.setValue('Erste Zeile\nZweite Zeile')
    await textarea.trigger('blur')

    const updated = lastModelUpdate(wrapper)
    expect(updated.value).toBe('Erste Zeile\nZweite Zeile')
    expect(updated.canUndo).toBe(true)
    updated.undo()
    expect(updated.value).toBe('Vorher')
  })

  test('auto-grows to its native scroll height', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    Object.defineProperty(textarea.element, 'scrollHeight', { configurable: true, value: 96 })

    await textarea.setValue('Erste Zeile\nZweite Zeile')
    await nextTick()

    expect(textarea.element.style.height).toBe('96px')
  })

  test('suppresses suggestions only for the textarea focus lifecycle', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get('textarea')

    await textarea.trigger('focus')
    await textarea.trigger('blur')
    wrapper.unmount()

    expect(setInputSuggestionsDisabled).toHaveBeenNthCalledWith(1, true)
    expect(setInputSuggestionsDisabled).toHaveBeenNthCalledWith(2, false)
    expect(setInputSuggestionsDisabled).toHaveBeenNthCalledWith(3, false)
  })

  test('inserts quickie text at the current selection without removing line breaks', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Anfang Ende'))
    await wrapper.setProps({ quickieKeys: [QU_SIT_Verlegung] })
    wrapper.vm.openModal()
    await nextTick()

    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    textarea.element.setSelectionRange(7, 7)
    await textarea.trigger('focus')
    await wrapper.setProps({ modelValue: lastModelUpdate(wrapper) })

    const quickieButton = wrapper.findAllComponents(IonButton)
      .find((button) => button.text().trim() === 'Verlegung')
    expect(quickieButton).toBeTruthy()
    await quickieButton!.trigger('click')

    const quickie = wrapper.getComponent(DodoQuickieTemplate)
    quickie.vm.$emit('accept', 'Zeile 1\nZeile 2\n')
    await flushPromises()

    expect(lastModelUpdate(wrapper).value).toBe('Anfang Zeile 1\nZeile 2\nEnde')
  })
})
