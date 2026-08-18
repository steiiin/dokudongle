import { flushPromises, shallowMount } from '@vue/test-utils'
import { defineComponent, onMounted, ref } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputSelectOptional from '@/components/DodoInputSelectOptional.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import { setInputSuggestionsDisabled } from '@/plugins/input-suggestions'
import { textAssistService, type ImeDictionary } from '@/services/text-assist'

vi.mock('@/plugins/input-suggestions', () => ({
  setInputSuggestionsDisabled: vi.fn().mockResolvedValue(undefined),
}))

const IonInputStub = defineComponent({
  name: 'IonInput',
  inheritAttrs: false,
  props: {
    modelValue: String,
    readonly: Boolean,
    autocomplete: String,
    autocorrect: String,
    autocapitalize: String,
    spellcheck: Boolean,
  },
  emits: ['update:modelValue', 'ionBlur'],
  setup(props, { emit }) {
    const host = ref<HTMLElement | null>(null)
    const input = ref<HTMLInputElement | null>(null)

    onMounted(() => {
      input.value!.value = props.modelValue ?? ''
      Object.defineProperties(host.value!, {
        getInputElement: { value: async () => input.value! },
        setFocus: { value: async () => input.value!.focus() },
        value: {
          get: () => input.value!.value,
          set: (value: string) => { input.value!.value = value },
        },
      })
    })

    return { emit, host, input }
  },
  template: `
    <div ref="host">
      <input
        ref="input"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('ionBlur')"
      />
    </div>
  `,
})

const mountInput = (imeDictionary?: ImeDictionary) => shallowMount(DodoInputText, {
  attachTo: document.body,
  props: {
    modelValue: '',
    ...(imeDictionary === undefined ? {} : { imeDictionary }),
  },
  global: {
    stubs: { IonInput: IonInputStub },
  },
})

const insertText = (input: HTMLInputElement, before: string, after: string, data: string) => {
  input.value = before
  input.setSelectionRange(before.length, before.length)
  input.dispatchEvent(new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    data,
    inputType: 'insertText',
  }))
  input.value = after
  input.setSelectionRange(after.length, after.length)
  input.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    data,
    inputType: 'insertText',
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(setInputSuggestionsDisabled).mockClear()
  document.body.innerHTML = ''
})

describe('DodoInputText single-line IME', () => {
  test('leaves native input behavior unchanged when no dictionary prop is present', async () => {
    const process = vi.spyOn(textAssistService, 'processAutomaticInput')
    const wrapper = mountInput()
    await flushPromises()
    const input = wrapper.get('input').element as HTMLInputElement

    insertText(input, 'lt', 'lt ', ' ')
    await flushPromises()

    expect(input.value).toBe('lt ')
    expect(process).not.toHaveBeenCalled()
    expect(wrapper.getComponent(IonInputStub).props()).toMatchObject({
      readonly: false,
      autocomplete: undefined,
      autocorrect: undefined,
    })
    wrapper.unmount()
    expect(setInputSuggestionsDisabled).not.toHaveBeenCalled()
  })

  test('applies a local shortcut, preserves the caret, and supports immediate Backspace undo', async () => {
    const wrapper = mountInput({ shortcuts: { dd: 'DokuDongle' } })
    await flushPromises()
    const input = wrapper.get('input').element as HTMLInputElement
    input.focus()

    insertText(input, 'dd', 'dd ', ' ')
    await wrapper.setProps({ imeDictionary: { shortcuts: { dd: 'DokuDongle' } } })
    await vi.waitFor(() => expect(input.value).toBe('DokuDongle '))
    expect(input.selectionStart).toBe(11)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('DokuDongle ')

    input.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward',
    }))
    await flushPromises()

    expect(input.value).toBe('dd')
    expect(input.selectionStart).toBe(2)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('dd')
    wrapper.unmount()
  })

  test('corrects a typo to a field-local dictionary word after a delimiter', async () => {
    const wrapper = mountInput({ words: ['DokuDongle'] })
    await flushPromises()
    const input = wrapper.get('input').element as HTMLInputElement

    insertText(input, 'DokuDongel', 'DokuDongel ', ' ')
    await vi.waitFor(() => expect(input.value).toBe('DokuDongle '))

    expect(input.selectionStart).toBe(11)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('DokuDongle ')
    wrapper.unmount()
  })

  test('suppresses platform suggestions only for enabled focus and ignores active composition', async () => {
    const wrapper = mountInput({ shortcuts: { dd: 'DokuDongle' } })
    await flushPromises()
    const input = wrapper.get('input').element as HTMLInputElement

    input.focus()
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }))
    input.value = 'dd'
    input.setSelectionRange(2, 2)
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: 'dd',
      inputType: 'insertCompositionText',
      isComposing: true,
    }))
    await flushPromises()
    expect(input.value).toBe('dd')

    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'dd' }))
    input.blur()
    await flushPromises()
    expect(setInputSuggestionsDisabled).toHaveBeenCalledWith(true)
    expect(setInputSuggestionsDisabled).toHaveBeenCalledWith(false)
    wrapper.unmount()
  })

  test('falls back to editable native input when initialization fails', async () => {
    vi.spyOn(textAssistService, 'initializeAutomatic').mockRejectedValueOnce(new Error('unavailable'))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountInput({})
    await flushPromises()

    expect(wrapper.getComponent(IonInputStub).props('readonly')).toBe(false)
    expect(wrapper.getComponent(IonInputStub).props('autocorrect')).toBeUndefined()
    const input = wrapper.get('input').element as HTMLInputElement
    insertText(input, 'Text', 'Text ', ' ')
    await flushPromises()
    expect(input.value).toBe('Text ')
    wrapper.unmount()
  })
})

describe('single-line IME dictionary forwarding', () => {
  const dictionary: ImeDictionary = {
    words: ['DokuDongle'],
    shortcuts: { dd: 'DokuDongle' },
  }

  test('forwards the dictionary from DodoInputSelect to its custom text input', async () => {
    const wrapper = shallowMount(DodoInputSelect, {
      props: {
        modelValue: 'custom value',
        label: 'Selection',
        options: ['known'],
        allowCustom: true,
        imeDictionary: dictionary,
      },
      global: { renderStubDefaultSlot: true },
    })
    await flushPromises()

    expect(wrapper.getComponent(DodoInputText).props('imeDictionary')).toEqual(dictionary)
  })

  test('forwards the dictionary from DodoInputSelectOptional to DodoInputSelect', () => {
    const wrapper = shallowMount(DodoInputSelectOptional, {
      props: {
        toggleLabel: 'Enabled',
        toggle: true,
        text: '',
        options: ['known'],
        imeDictionary: dictionary,
      },
      global: { renderStubDefaultSlot: true },
    })

    expect(wrapper.getComponent(DodoInputSelect).props('imeDictionary')).toEqual(dictionary)
  })
})
