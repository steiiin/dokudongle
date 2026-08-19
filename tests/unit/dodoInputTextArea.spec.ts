import { IonButton } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoTextSuggestionPanel from '@/components/DodoTextSuggestionPanel.vue'
import DodoQuickieTemplate from '@/components/quickie-components/DodoQuickieTemplate.vue'
import { QU_SIT_Verlegung } from '@/data/quickies'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'
import { EnhanceableText } from '@/types/protocol/input'

vi.mock('@/plugins/input-suggestions', () => ({
  setInputSuggestionsDisabled: vi.fn().mockResolvedValue(undefined),
}))

const mountTextarea = (modelValue = new EnhanceableText(''), attachTo?: HTMLElement) => shallowMount(DodoInputTextArea, {
  ...(attachTo ? { attachTo } : {}),
  props: {
    modelValue,
    title: 'Situation',
    assistContextId: 'test.situation',
    placeholder: 'Text eingeben ...',
    enhanceFn: vi.fn().mockResolvedValue('Verbessert'),
  },
  global: {
    renderStubDefaultSlot: true,
    stubs: {
      DodoTextSuggestionHost: false,
      DodoTextSuggestionPanel: false,
    },
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

  test('underlines the complete active word without exposing the mirror to assistive technology', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    await textarea.trigger('focus')
    await textarea.setValue('Erste\nNot-Arzt Ende')
    await flushPromises()

    textarea.element.setSelectionRange(10, 10)
    await textarea.trigger('select')
    await nextTick()

    const mirror = wrapper.get('.dd-modal-textarea-mirror')
    expect(mirror.attributes('aria-hidden')).toBe('true')
    expect(mirror.get('.dd-active-word').text()).toBe('Not-Arzt')
  })

  test('hides the active-word underline for selections, composition, and completed words', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    await textarea.trigger('focus')
    await textarea.setValue('Alpha Beta')
    await flushPromises()

    textarea.element.setSelectionRange(6, 10)
    await textarea.trigger('select')
    expect(wrapper.get('.dd-modal-textarea-mirror').isVisible()).toBe(false)

    textarea.element.setSelectionRange(10, 10)
    await textarea.trigger('select')
    expect(wrapper.get('.dd-active-word').text()).toBe('Beta')

    await textarea.trigger('compositionstart')
    expect(wrapper.get('.dd-modal-textarea-mirror').isVisible()).toBe(false)

    await textarea.trigger('compositionend', { data: 'Beta' })
    await flushPromises()
    await textarea.setValue('Alpha ')
    await flushPromises()
    expect(wrapper.get('.dd-modal-textarea-mirror').isVisible()).toBe(false)

    await textarea.trigger('blur')
    expect(wrapper.get('.dd-modal-textarea-mirror').isVisible()).toBe(false)
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

  test('shows @ snippets and applies one without moving the caret to the end', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Ziel '))
    wrapper.vm.openModal()
    await nextTick()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    textarea.element.setSelectionRange(5, 5)
    await textarea.trigger('focus')
    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: '@uni',
      inputType: 'insertText',
    }))
    await textarea.setValue('Ziel @uni')
    await flushPromises()

    const panel = wrapper.getComponent(DodoTextSuggestionPanel)
    await vi.waitFor(() => expect(panel.props('suggestions')).toHaveLength(1))
    const university = panel.props('suggestions').find(suggestion => suggestion.label === 'Uniklinik Dresden')!
    panel.vm.$emit('select', university)
    await flushPromises()

    expect(textarea.element.value).toBe('Ziel Uniklinik Dresden')
    expect(textarea.element.selectionStart).toBe('Ziel Uniklinik Dresden'.length)
  })

  test('automatically applies a unique @ location when a delimiter is typed', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Ziel '), document.body)
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    textarea.element.setSelectionRange(5, 5)
    await textarea.trigger('focus')

    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: '@radebe',
      inputType: 'insertText',
    }))
    await textarea.setValue('Ziel @radebe')
    await flushPromises()

    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: ' ',
      inputType: 'insertText',
    }))
    textarea.element.value = 'Ziel @radebe '
    textarea.element.setSelectionRange(13, 13)
    textarea.element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: ' ',
      inputType: 'insertText',
    }))

    await vi.waitFor(() => {
      expect(textarea.element.value).toBe('Ziel KH Radebeul ')
      expect(textarea.element.selectionStart).toBe('Ziel KH Radebeul '.length)
    })
    wrapper.unmount()
  })

  test('corrects on punctuation in the middle without moving the caret to the end', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Krankehaus Rest'), document.body)
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    textarea.element.setSelectionRange(10, 10)
    await textarea.trigger('focus')

    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: ',',
      inputType: 'insertText',
    }))
    textarea.element.value = 'Krankehaus, Rest'
    textarea.element.setSelectionRange(11, 11)
    textarea.element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: ',',
      inputType: 'insertText',
    }))

    await vi.waitFor(() => {
      expect(textarea.element.value).toBe('Krankenhaus, Rest')
      expect(textarea.element.selectionStart).toBe(12)
    })
    wrapper.unmount()
  })

  test('uses beforeinput Backspace to undo the immediately preceding correction', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    textarea.element.focus()
    await textarea.trigger('focus')
    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: ' ',
      inputType: 'insertText',
    }))
    await textarea.setValue('Patietn ')
    await vi.waitFor(() => expect(textarea.element.value).toBe('Patient '))

    textarea.element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward',
    }))
    await flushPromises()

    expect(textarea.element.value).toBe('Patietn')
    expect(textarea.element.selectionStart).toBe('Patietn'.length)
  })
})
