import { flushPromises, shallowMount } from '@vue/test-utils'
import { defineComponent, nextTick, onMounted, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import { textAssistService } from '@/services/text-assist'
import { DefaultGermanSpellChecker } from '@/services/text-assist/GermanSpellChecker'
import { EnhanceableText } from '@/types/protocol/input'

vi.mock('@/plugins/input-suggestions', () => ({
  setInputSuggestionsDisabled: vi.fn().mockResolvedValue(undefined),
}))

// Emit the model update before the native listener, as Ionic does. The textarea
// uses Vue's real v-model listener; neither may supply the pre-deletion snapshot.
const IonInputStub = defineComponent({
  props: { modelValue: String },
  emits: ['update:modelValue'],
  setup(_, { emit }) {
    const host = ref<HTMLElement | null>(null)
    const input = ref<HTMLInputElement | null>(null)
    onMounted(() => {
      Object.defineProperties(host.value!, {
        getInputElement: { value: async () => input.value! },
        value: {
          get: () => input.value!.value,
          set: (value: string) => { input.value!.value = value },
        },
      })
    })
    return { host, input, emit }
  },
  template: `<div ref="host"><input ref="input" :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)" /></div>`,
})

type EditMode = 'cancelable' | 'non-cancelable' | 'input-only' | 'ime-selection'
type NativeInput = HTMLInputElement | HTMLTextAreaElement

const edit = (input: NativeInput, value: string, cursor: number, inputType: string,
  mode: EditMode = 'cancelable', isComposing = false) => {
  const before = new InputEvent('beforeinput', {
    bubbles: true, cancelable: mode === 'cancelable' || mode === 'ime-selection', inputType, isComposing,
  })
  if (mode !== 'input-only') input.dispatchEvent(before)
  if (!before.defaultPrevented) {
    input.value = value
    input.setSelectionRange(cursor, cursor)
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType, isComposing }))
  }
  return before
}

const backspace = (input: NativeInput, mode: EditMode, isComposing = false) => {
  const start = input.selectionStart!
  const end = input.selectionEnd!
  // Match the actual AOSP trace: a selected deletion range before beforeinput,
  // with no preceding select/selectionchange event.
  if (mode === 'ime-selection') input.setSelectionRange(start - 1, start)
  return edit(input, input.value.slice(0, start - 1) + input.value.slice(end),
    start - 1, 'deleteContentBackward', mode, isComposing)
}

beforeEach(async () => {
  vi.spyOn(DefaultGermanSpellChecker.prototype, 'correct')
    .mockImplementation(async word => !['ha', 'Krankehaus'].includes(word))
  vi.spyOn(DefaultGermanSpellChecker.prototype, 'suggest')
    .mockImplementation(async word => word === 'ha' ? ['HA'] : word === 'Krankehaus' ? ['Krankenhaus'] : [])
  await textAssistService.initialize()
  textAssistService.repository.getState().rejectedCorrections = []
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe.each(['textarea', 'single-line'] as const)('%s Backspace input events', kind => {
  const mountEditor = async () => {
    const wrapper = kind === 'textarea'
      ? shallowMount(DodoInputTextArea, {
        attachTo: document.body,
        props: { modelValue: new EnhanceableText(''), title: 'Situation', assistContextId: 'event-test' },
        global: { renderStubDefaultSlot: true },
      })
      : shallowMount(DodoInputText, {
        attachTo: document.body,
        props: { modelValue: '', imeDictionary: {} },
        global: { stubs: { IonInput: IonInputStub } },
      })
    if (kind === 'textarea') wrapper.getComponent(DodoInputTextArea).vm.openModal()
    await flushPromises()
    const input = wrapper.get<NativeInput>(kind === 'textarea' ? 'textarea' : 'input').element
    input.focus()
    await flushPromises()
    return { wrapper, input }
  }

  const correct = async (input: NativeInput, delimiter = ' ', original = 'ha', replacement = 'HA') => {
    edit(input, `Start ${original} Ende`, 6 + original.length, 'insertText')
    await flushPromises()
    edit(input, `Start ${original}${delimiter} Ende`, 7 + original.length, 'insertText')
    await vi.waitFor(() => expect(input.value).toBe(`Start ${replacement}${delimiter} Ende`))
    expect(input.selectionStart).toBe(7 + replacement.length)
    await flushPromises()
    // Include notifications after the old temporary mutation guard has expired.
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  test.each([
    ['cancelable', ' '], ['cancelable', '.'],
    ['non-cancelable', ' '], ['non-cancelable', '.'],
    ['input-only', ' '], ['input-only', '.'],
    ['ime-selection', ' '], ['ime-selection', '.'],
  ] as const)('restores ha after %s deletion of %j, only once', async (mode, delimiter) => {
    const { wrapper, input } = await mountEditor()
    try {
      await correct(input, delimiter)
      input.dispatchEvent(new Event('select', { bubbles: true }))
      document.dispatchEvent(new Event('selectionchange'))
      await flushPromises()
      const event = backspace(input, mode)
      expect(event.defaultPrevented).toBe(mode === 'cancelable')
      await flushPromises()
      expect(input.value).toBe('Start ha Ende')
      expect(input.selectionStart).toBe(8)
      expect(input.selectionEnd).toBe(8)
      expect(textAssistService.repository.getState().rejectedCorrections).toEqual([
        { original: 'ha', suggested: 'HA', rejectionCount: 1 },
      ])
      backspace(input, mode)
      await flushPromises()
      expect(input.value).toBe('Start h Ende')
      expect(input.selectionStart).toBe(7)
      expect(textAssistService.repository.getState().rejectedCorrections[0].rejectionCount).toBe(1)
      if (kind === 'textarea') {
        input.blur()
        await nextTick()
        const model = wrapper.emitted('update:modelValue')!.at(-1)![0] as EnhanceableText
        expect(model.value).toBe('Start h Ende')
      } else {
        expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe('Start h Ende')
      }
    } finally { wrapper.unmount() }
  })

  test('restores a correction that changed word length after native deletion', async () => {
    const { wrapper, input } = await mountEditor()
    try {
      await correct(input, '.', 'Krankehaus', 'Krankenhaus')
      backspace(input, 'input-only')
      await flushPromises()
      expect(input.value).toBe('Start Krankehaus Ende')
      expect(input.selectionStart).toBe(16)
    } finally { wrapper.unmount() }
  })

  test.each(['move', 'selection', 'typing', 'blur', 'composition'] as const)(
    'does not undo after %s', async action => {
      const { wrapper, input } = await mountEditor()
      try {
        await correct(input)
        if (action === 'move' || action === 'selection') {
          input.setSelectionRange(action === 'move' ? 8 : 6, 8)
          input.dispatchEvent(new Event('select', { bubbles: true }))
          input.setSelectionRange(9, 9)
          input.dispatchEvent(new Event('select', { bubbles: true }))
        } else if (action === 'typing') {
          edit(input, 'Start HA x Ende', 10, 'insertText')
          await flushPromises()
          backspace(input, 'input-only')
          await flushPromises()
        } else if (action === 'blur') {
          input.blur()
          input.focus()
          input.setSelectionRange(9, 9)
        } else {
          input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
        }
        await flushPromises()
        backspace(input, 'input-only', action === 'composition')
        await flushPromises()
        expect(input.value).toBe('Start HA Ende')
        expect(textAssistService.repository.getState().rejectedCorrections).toEqual([])
      } finally { wrapper.unmount() }
    },
  )

  test.each(['deleteContentForward', 'deleteWordBackward', 'insertText'])(
    'does not infer Backspace from a %s event', async inputType => {
      const { wrapper, input } = await mountEditor()
      try {
        await correct(input)
        edit(input, 'Start HA Ende', 8, inputType, 'input-only')
        await flushPromises()
        expect(input.value).toBe('Start HA Ende')
        expect(textAssistService.repository.getState().rejectedCorrections).toEqual([])
      } finally { wrapper.unmount() }
    },
  )

  test('does not mistake an explicit delimiter selection for an IME deletion range', async () => {
    const { wrapper, input } = await mountEditor()
    try {
      await correct(input)
      input.setSelectionRange(8, 9)
      input.dispatchEvent(new Event('select', { bubbles: true }))
      await flushPromises()
      edit(input, 'Start HA Ende', 8, 'deleteContentBackward')
      await flushPromises()
      expect(input.value).toBe('Start HA Ende')
      expect(textAssistService.repository.getState().rejectedCorrections).toEqual([])
    } finally { wrapper.unmount() }
  })

  test('does not undo when deletion removes more than one character', async () => {
    const { wrapper, input } = await mountEditor()
    try {
      await correct(input)
      edit(input, 'Start H Ende', 7, 'deleteContentBackward', 'input-only')
      await flushPromises()
      expect(input.value).toBe('Start H Ende')
      expect(textAssistService.repository.getState().rejectedCorrections).toEqual([])
    } finally { wrapper.unmount() }
  })
})
