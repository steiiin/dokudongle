import { IonButton, IonChip, IonItem, IonModal, IonReorderGroup } from '@ionic/vue'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoInputSaamed from '@/components/DodoInputSaamed.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoInputToggle from '@/components/DodoInputToggle.vue'
import { DATA_SaamedOptions } from '@/data/lists/saamed'
import { ConsentMed, ConsentMedTask, SaamedIndication } from '@/types/lists/saamed'
import type { ConsentMedIndication } from '@/types/lists/saamed'

vi.mock('@/data/lists/saamed', () => ({ DATA_SaamedOptions: vi.fn() }))
enableAutoUnmount(afterEach)

const mountInput = (modelValue: ConsentMedTask[] = []) => shallowMount(DodoInputSaamed, {
  props: { modelValue },
  global: { renderStubDefaultSlot: true },
})
type InputWrapper = ReturnType<typeof mountInput>
const selectModal = (wrapper: InputWrapper) => wrapper.findAllComponents(IonModal)[0]
const editModal = (wrapper: InputWrapper) => wrapper.findAllComponents(IonModal)[1]
const dosageInput = (wrapper: InputWrapper) => editModal(wrapper).findAllComponents(DodoInputText)[0]
const chipTexts = (wrapper: InputWrapper) => editModal(wrapper).findAllComponents(IonChip).map(chip => chip.text())
const chipColors = (wrapper: InputWrapper) => editModal(wrapper).findAllComponents(IonChip).map(chip => chip.props('color'))
const setDosageChips = (chips: ConsentMedIndication['dosageChips']) => {
  vi.mocked(DATA_SaamedOptions)()[0].indication.dosageChips = chips
}
const selectOption = async (wrapper: InputWrapper, index = 0) => {
  await wrapper.findAllComponents(IonButton).find(button => button.text() === 'Medikament hinzufügen')!.trigger('click')
  await selectModal(wrapper).findAllComponents(IonItem)[index].trigger('click')
  expect(editModal(wrapper).props('isOpen')).toBe(true)
}
const clickChip = async (wrapper: InputWrapper, text: string) => {
  await editModal(wrapper).findAllComponents(IonChip).find(chip => chip.text() === text)!.trigger('click')
}
const cancel = async (wrapper: InputWrapper) => {
  await editModal(wrapper).findAllComponents(IonButton).find(button => button.attributes('aria-label') === 'Abbrechen')!.trigger('click')
}
const save = async (wrapper: InputWrapper) => {
  await editModal(wrapper).findAllComponents(IonButton).find(button => button.text() === 'Speichern')!.trigger('click')
}
const lastUpdate = (wrapper: InputWrapper) => wrapper.emitted('update:modelValue')!.at(-1)![0] as ConsentMedTask[]

describe('DodoInputSaamed indication metadata', () => {
  beforeEach(() => {
    const med = new ConsentMed('testmed', 'Testmedikament', {
      [SaamedIndication.REA]: {
        name: 'Reanimation', dosageHint: 'Hinweis für Reanimation',
        dosageChips: ['mg', 'µg'], requiresContracheck: false,
      },
      [SaamedIndication.BRADYKARDIE]: {
        name: 'Bradykardie', dosageHint: 'Hinweis für Bradykardie',
        dosageChips: ['g'], requiresContracheck: true, contraReason: 'Spezifische Begründung',
      },
      [SaamedIndication.ACS]: {
        name: 'ACS', dosageHint: 'Hinweis für ACS', requiresContracheck: true,
      },
    })
    vi.mocked(DATA_SaamedOptions).mockReturnValue([
      { med, indicationId: SaamedIndication.REA, indication: med.Indications.rea! },
      { med, indicationId: SaamedIndication.BRADYKARDIE, indication: med.Indications.bradykardie! },
      { med, indicationId: SaamedIndication.ACS, indication: med.Indications.acs! },
    ])
  })

  test('starts empty and switches hints, chips and contraindications with the indication', async () => {
    const wrapper = mountInput()
    await selectOption(wrapper)
    expect(dosageInput(wrapper).props('modelValue')).toBe('')
    expect(dosageInput(wrapper).props('placeholder')).toBe('Hinweis für Reanimation')
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
    expect(editModal(wrapper).findComponent(DodoInputToggle).exists()).toBe(false)
    await cancel(wrapper)
    await selectOption(wrapper, 1)
    expect(dosageInput(wrapper).props('modelValue')).toBe('')
    expect(dosageInput(wrapper).props('placeholder')).toBe('Hinweis für Bradykardie')
    expect(chipTexts(wrapper)).toEqual(['g'])
    editModal(wrapper).getComponent(DodoInputToggle).vm.$emit('update:modelValue', false)
    await nextTick()
    expect(editModal(wrapper).findAllComponents(DodoInputText)[1].props('placeholder')).toBe('Spezifische Begründung')
  })

  test('supports missing optional metadata and saves an empty dose', async () => {
    const wrapper = mountInput()
    await selectOption(wrapper, 2)
    expect(chipTexts(wrapper)).toEqual([])
    editModal(wrapper).getComponent(DodoInputToggle).vm.$emit('update:modelValue', false)
    await nextTick()
    expect(editModal(wrapper).findAllComponents(DodoInputText)[1].props('placeholder')).toBe('Begründung eingeben …')
    await save(wrapper)
    expect(lastUpdate(wrapper)[0].dosageText).toBe('')
  })

  test('appends literal chip text, hides only used chips and resets when reopened', async () => {
    const wrapper = mountInput()
    await selectOption(wrapper)
    dosageInput(wrapper).vm.$emit('update:modelValue', '12  ')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
    await clickChip(wrapper, 'mg')
    expect(dosageInput(wrapper).props('modelValue')).toBe('12 mg')
    expect(chipTexts(wrapper)).toEqual(['µg'])
    dosageInput(wrapper).vm.$emit('update:modelValue', '')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['µg'])
    await clickChip(wrapper, 'µg')
    expect(dosageInput(wrapper).props('modelValue')).toBe('µg')
    expect(chipTexts(wrapper)).toEqual([])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await cancel(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await selectOption(wrapper)
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
    expect(dosageInput(wrapper).props('modelValue')).toBe('')
  })

  test.each(['Enter', ' '])('supports keyboard activation with %s', async (key) => {
    setDosageChips([['mg', 'µg'], 'titriert'])
    const wrapper = mountInput()
    await selectOption(wrapper)
    await editModal(wrapper).findAllComponents(IonChip)[0].trigger('keydown', { key })
    expect(dosageInput(wrapper).props('modelValue')).toBe('mg')
    expect(chipTexts(wrapper)).toEqual(['titriert'])
  })

  test('consumes independent groups and root chips without changing remaining colors', async () => {
    setDosageChips([['0.5', '0.3', '0.15'], ['(i.v.)', '(i.m.)'], '4mg (inhalativ)'])
    const wrapper = mountInput()
    await selectOption(wrapper)
    expect(chipColors(wrapper)).toEqual(['primary', 'primary', 'primary', 'tertiary', 'tertiary', 'success'])
    await clickChip(wrapper, '0.3')
    expect(dosageInput(wrapper).props('modelValue')).toBe('0.3')
    expect(chipTexts(wrapper)).toEqual(['(i.v.)', '(i.m.)', '4mg (inhalativ)'])
    expect(chipColors(wrapper)).toEqual(['tertiary', 'tertiary', 'success'])
    dosageInput(wrapper).vm.$emit('update:modelValue', '0.3mg  ')
    await nextTick()
    await clickChip(wrapper, '(i.m.)')
    expect(dosageInput(wrapper).props('modelValue')).toBe('0.3mg (i.m.)')
    expect(chipTexts(wrapper)).toEqual(['4mg (inhalativ)'])
    expect(chipColors(wrapper)).toEqual(['success'])
    dosageInput(wrapper).vm.$emit('update:modelValue', '')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['4mg (inhalativ)'])
    await clickChip(wrapper, '4mg (inhalativ)')
    expect(dosageInput(wrapper).props('modelValue')).toBe('4mg (inhalativ)')
    expect(chipTexts(wrapper)).toEqual([])
    await cancel(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await selectOption(wrapper)
    expect(chipTexts(wrapper)).toEqual(['0.5', '0.3', '0.15', '(i.v.)', '(i.m.)', '4mg (inhalativ)'])
    expect(chipColors(wrapper)).toEqual(['primary', 'primary', 'primary', 'tertiary', 'tertiary', 'success'])
  })

  test('keeps repeated labels independent across groups and root chips', async () => {
    setDosageChips([['mg', 'µg'], ['mg', 'g'], 'mg', 'mg'])
    const wrapper = mountInput()
    await selectOption(wrapper)
    await clickChip(wrapper, 'mg')
    expect(chipTexts(wrapper)).toEqual(['mg', 'g', 'mg', 'mg'])
    expect(chipColors(wrapper)).toEqual(['tertiary', 'tertiary', 'success', 'warning'])
    await clickChip(wrapper, 'g')
    expect(chipTexts(wrapper)).toEqual(['mg', 'mg'])
    await clickChip(wrapper, 'mg')
    expect(chipTexts(wrapper)).toEqual(['mg'])
    expect(chipColors(wrapper)).toEqual(['warning'])
    await clickChip(wrapper, 'mg')
    expect(chipTexts(wrapper)).toEqual([])
    expect(dosageInput(wrapper).props('modelValue')).toBe('mg g mg mg')
  })

  test('cycles colors by original top-level position including empty groups', async () => {
    setDosageChips(['a', ['b', 'c'], [], 'd', 'e', 'f'])
    const wrapper = mountInput()
    await selectOption(wrapper)
    expect(chipTexts(wrapper)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(chipColors(wrapper)).toEqual(['primary', 'tertiary', 'tertiary', 'warning', 'secondary', 'primary'])
    await clickChip(wrapper, 'b')
    expect(chipColors(wrapper)).toEqual(['primary', 'warning', 'secondary', 'primary'])
  })

  test.each<{ chips: ConsentMedIndication['dosageChips'] }>([
    { chips: undefined }, { chips: [] }, { chips: [[]] },
  ])('omits the chip container for $chips', async ({ chips }) => {
    setDosageChips(chips)
    const wrapper = mountInput()
    await selectOption(wrapper)
    expect(chipTexts(wrapper)).toEqual([])
    expect(wrapper.find('.dodo-saamed-dosage-chips').exists()).toBe(false)
  })

  test('hides saved-task groups until the dosage is cleared, then allows normal selection', async () => {
    setDosageChips([['(i.v.)', '(i.m.)'], '4mg (inhalativ)'])
    const wrapper = mountInput()
    await selectOption(wrapper)
    await clickChip(wrapper, '(i.v.)')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual([new ConsentMedTask('testmed', 'rea', '(i.v.)', true, '', '')])
    await wrapper.setProps({ modelValue: lastUpdate(wrapper) })
    editModal(wrapper).vm.$emit('willDismiss')
    await nextTick()
    await wrapper.getComponent(IonReorderGroup).getComponent(IonItem).trigger('click')
    expect(dosageInput(wrapper).props('modelValue')).toBe('(i.v.)')
    expect(chipTexts(wrapper)).toEqual([])
    dosageInput(wrapper).vm.$emit('update:modelValue', 'changed dose')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual([])
    dosageInput(wrapper).vm.$emit('update:modelValue', '')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['(i.v.)', '(i.m.)', '4mg (inhalativ)'])
    expect(chipColors(wrapper)).toEqual(['primary', 'primary', 'tertiary'])
    dosageInput(wrapper).vm.$emit('update:modelValue', '12mg')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['(i.v.)', '(i.m.)', '4mg (inhalativ)'])
    await clickChip(wrapper, '(i.m.)')
    expect(dosageInput(wrapper).props('modelValue')).toBe('12mg (i.m.)')
    expect(chipTexts(wrapper)).toEqual(['4mg (inhalativ)'])
  })

  test.each(['', '   '])('offers chips immediately for an existing task with blank dosage %j', async (dosage) => {
    const wrapper = mountInput([new ConsentMedTask('testmed', 'rea', dosage, true, '', '')])
    await wrapper.getComponent(IonReorderGroup).getComponent(IonItem).trigger('click')
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
  })

  test('keeps editing isolated until save and locks chips again when a stored task is reopened', async () => {
    const stored = new ConsentMedTask('testmed', 'rea', '12', true, '', 'Gespeicherte Notiz')
    const wrapper = mountInput([stored])
    const openStored = () => wrapper.getComponent(IonReorderGroup).getComponent(IonItem).trigger('click')
    await openStored()
    expect(dosageInput(wrapper).props('modelValue')).toBe('12')
    expect(chipTexts(wrapper)).toEqual([])
    dosageInput(wrapper).vm.$emit('update:modelValue', '')
    await nextTick()
    await clickChip(wrapper, 'mg')
    expect(stored.dosageText).toBe('12')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await cancel(wrapper)
    await openStored()
    expect(dosageInput(wrapper).props('modelValue')).toBe('12')
    expect(chipTexts(wrapper)).toEqual([])
    dosageInput(wrapper).vm.$emit('update:modelValue', '   ')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
    await clickChip(wrapper, 'µg')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual([
      new ConsentMedTask('testmed', 'rea', 'µg', true, '', 'Gespeicherte Notiz'),
    ])
    expect(stored.dosageText).toBe('12')
    await wrapper.setProps({ modelValue: lastUpdate(wrapper) })
    editModal(wrapper).vm.$emit('willDismiss')
    await nextTick()
    await openStored()
    expect(dosageInput(wrapper).props('modelValue')).toBe('µg')
    expect(chipTexts(wrapper)).toEqual([])
    await cancel(wrapper)
    await selectOption(wrapper)
    expect(chipTexts(wrapper)).toEqual(['g'])
    await cancel(wrapper)
    await openStored()
    expect(chipTexts(wrapper)).toEqual([])
    dosageInput(wrapper).vm.$emit('update:modelValue', '')
    await nextTick()
    expect(chipTexts(wrapper)).toEqual(['mg', 'µg'])
  })

  test('saves a new task with stable IDs and still offers other indications of the same medication', async () => {
    const wrapper = mountInput()
    await selectOption(wrapper)
    await clickChip(wrapper, 'mg')
    await save(wrapper)
    expect(lastUpdate(wrapper)).toEqual([new ConsentMedTask('testmed', 'rea', 'mg', true, '', '')])
    await wrapper.setProps({ modelValue: lastUpdate(wrapper) })
    editModal(wrapper).vm.$emit('willDismiss')
    await nextTick()
    await selectOption(wrapper)
    expect(editModal(wrapper).text()).toContain('Bradykardie · Testmedikament')
    expect(chipTexts(wrapper)).toEqual(['g'])
  })

  test('continues to display unknown stored IDs', () => {
    const wrapper = mountInput([new ConsentMedTask('altes medikament', 'alte indikation', '', true, '', '')])
    const list = wrapper.getComponent(IonReorderGroup)
    expect(list.text()).toContain('altes medikament')
    expect(list.text()).toContain('alte indikation')
  })
})
