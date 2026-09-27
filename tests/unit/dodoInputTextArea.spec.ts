import { IonButton, IonModal } from '@ionic/vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import DodoHint from '@/components/DodoHint.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoTextSuggestionPanel from '@/components/DodoTextSuggestionPanel.vue'
import DodoQuickieTemplate from '@/components/quickie-components/DodoQuickieTemplate.vue'
import { QU_SIT_Verlegung } from '@/data/quickies'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'
import { EnhanceableText } from '@/types/protocol/input'

vi.mock('@/plugins/input-suggestions', () => ({
  setInputSuggestionsDisabled: vi.fn().mockResolvedValue(undefined),
}))

const mountTextarea = (modelValue = new EnhanceableText(''), attachTo?: HTMLElement, hint?: string) => shallowMount(DodoInputTextArea, {
  ...(attachTo ? { attachTo } : {}),
  ...(hint ? { slots: { default: hint } } : {}),
  props: {
    modelValue,
    title: 'Situation',
    assistContextId: 'test.situation',
    placeholder: 'Text eingeben ...',
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

const resizeObservers: Array<{ callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = []

describe('DodoInputTextArea native textarea', () => {
  beforeEach(() => {
    vi.mocked(setInputSuggestionsDisabled).mockClear()
    resizeObservers.length = 0
    vi.stubGlobal('ResizeObserver', class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(readonly callback: () => void) { resizeObservers.push(this) }
    })
  })

  afterEach(() => { vi.unstubAllGlobals() })

  test('renders optional help through the shared hint', () => {
    const wrapper = shallowMount(DodoInputTextArea, {
      props: { modelValue: new EnhanceableText(''), title: 'Situation', assistContextId: 'test.hint' },
      slots: { default: '<strong>Hinweis</strong> zur Eingabe' },
      global: { renderStubDefaultSlot: true, stubs: { DodoHint: false } },
    })
    expect(wrapper.getComponent(DodoHint).props('variant')).toBe('info')
    expect(wrapper.get('.dd-modal-hint strong').text()).toBe('Hinweis')
    expect(wrapper.get('.dd-modal-hint').text()).toContain('zur Eingabe')
    expect(wrapper.get('.dd-modal-hint').attributes('role')).toBeUndefined()
    wrapper.unmount()
    const withoutHint = mountTextarea()
    expect(withoutHint.findComponent(DodoHint).exists()).toBe(false)
    withoutHint.unmount()
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

  test('trims surrounding whitespace and blank lines when saving', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Vorher'))
    wrapper.vm.openModal()
    await nextTick()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')

    await textarea.trigger('focus')
    await wrapper.setProps({ modelValue: lastModelUpdate(wrapper) })
    await textarea.setValue('\n  Erste Zeile  \nZweite Zeile\n\n')
    await textarea.trigger('blur')
    await wrapper.setProps({ modelValue: lastModelUpdate(wrapper) })

    wrapper.getComponent(IonModal).vm.$emit('willDismiss')
    await nextTick()

    expect(lastModelUpdate(wrapper).value).toBe('Erste Zeile  \nZweite Zeile')
  })

  test('leaves height to layout when typing and reopening', async () => {
    const wrapper = mountTextarea(new EnhanceableText('Erste Zeile\nZweite Zeile'))
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    Object.defineProperty(textarea.element, 'scrollHeight', { configurable: true, value: 960 })

    for (let opening = 0; opening < 2; opening++) {
      wrapper.vm.openModal()
      wrapper.getComponent(IonModal).vm.$emit('didPresent')
      await flushPromises()
      await textarea.setValue('Zeile\n'.repeat(100))
      expect(textarea.element.style.height).toBe('')
      wrapper.getComponent(IonModal).vm.$emit('willDismiss')
      await nextTick()
    }
    expect(resizeObservers).toHaveLength(2)
    for (const observer of resizeObservers) {
      expect(observer.observe).toHaveBeenCalledWith(textarea.element)
      expect(observer.disconnect).toHaveBeenCalledOnce()
    }
    wrapper.unmount()
  })

  test('collapses help once on overflow, honors manual expansion, and resets on reopening', async () => {
    const wrapper = mountTextarea(new EnhanceableText(''), undefined, 'Hinweis')
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    let scrollHeight = 100
    Object.defineProperties(textarea.element, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, get: () => scrollHeight },
    })
    wrapper.vm.openModal()
    wrapper.getComponent(IonModal).vm.$emit('didPresent')
    await flushPromises()
    const toggle = () => wrapper.get('.dd-modal-help-toggle')
    expect(toggle().attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.dd-modal-help .dd-modal-help-collapse').attributes('aria-label')).toBe('Hinweise einklappen')
    expect(toggle().attributes('aria-controls')).toBe(wrapper.get('.dd-modal-hint').attributes('id'))
    await textarea.setValue('Kurzer Text')
    expect(toggle().attributes('aria-expanded')).toBe('true')

    scrollHeight = 200
    resizeObservers[0].callback()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await flushPromises()
    expect(toggle().attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('.dd-modal-help').isVisible()).toBe(false)
    expect(wrapper.find('.dd-modal-help-collapse').exists()).toBe(false)
    expect(wrapper.get('.dd-modal-header-toolbar .dd-modal-help-toggle').attributes('aria-label')).toBe('Hinweise anzeigen')
    scrollHeight = 100
    await textarea.setValue('Kurz')
    expect(toggle().attributes('aria-expanded')).toBe('false')

    await toggle().trigger('click')
    scrollHeight = 300
    await textarea.setValue('Viel Text\n'.repeat(30))
    resizeObservers[0].callback()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await flushPromises()
    expect(toggle().attributes('aria-expanded')).toBe('true')

    wrapper.getComponent(IonModal).vm.$emit('willDismiss')
    await nextTick()
    await wrapper.setProps({ modelValue: lastModelUpdate(wrapper) })
    wrapper.vm.openModal()
    await nextTick()
    expect(toggle().attributes('aria-expanded')).toBe('true')
    wrapper.getComponent(IonModal).vm.$emit('didPresent')
    await flushPromises()
    // The existing long draft is also checked when opening.
    expect(toggle().attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
    expect(resizeObservers[1].disconnect).toHaveBeenCalledOnce()
  })

  test('does not collapse empty help and respects a manual toggle before overflow', async () => {
    const wrapper = mountTextarea(new EnhanceableText(''), undefined, 'Hinweis')
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    Object.defineProperties(textarea.element, {
      clientHeight: { configurable: true, value: 30 },
      scrollHeight: { configurable: true, value: 100 },
    })
    wrapper.vm.openModal()
    wrapper.getComponent(IonModal).vm.$emit('didPresent')
    await flushPromises()
    const toggle = () => wrapper.get('.dd-modal-help-toggle')
    expect(toggle().attributes('aria-expanded')).toBe('true')
    await toggle().trigger('click')
    await toggle().trigger('click')
    await textarea.setValue('Text that overflows')
    await flushPromises()
    expect(toggle().attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })

  test('synchronizes the underline with native scrolling and available width', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get<HTMLTextAreaElement>('textarea')
    const mirror = wrapper.get<HTMLDivElement>('.dd-modal-textarea-mirror')
    Object.defineProperty(textarea.element, 'clientWidth', { configurable: true, value: 240 })
    textarea.element.scrollTop = 120
    textarea.element.scrollLeft = 3
    await textarea.trigger('scroll')
    expect(mirror.element.scrollTop).toBe(120)
    expect(mirror.element.scrollLeft).toBe(3)
    expect(mirror.element.style.width).toBe('240px')
    await textarea.setValue('Alpha Beta')
    await textarea.trigger('focus')
    textarea.element.setSelectionRange(10, 10)
    await textarea.trigger('select')
    await nextTick()
    expect(mirror.element.scrollTop).toBe(120)
    wrapper.unmount()
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
    expect(wrapper.get('.dd-active-word').text()).toBe('')

    textarea.element.setSelectionRange(10, 10)
    await textarea.trigger('select')
    expect(wrapper.get('.dd-active-word').text()).toBe('Beta')

    await textarea.trigger('compositionstart')
    expect(wrapper.get('.dd-active-word').text()).toBe('')

    await textarea.trigger('compositionend', { data: 'Beta' })
    await flushPromises()
    await textarea.setValue('Alpha ')
    await flushPromises()
    expect(wrapper.get('.dd-active-word').text()).toBe('')

    await textarea.trigger('blur')
    expect(wrapper.get('.dd-active-word').text()).toBe('')
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
