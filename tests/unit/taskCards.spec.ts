import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonModal } from '@ionic/vue'
import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DodoContainerCard from '@/components/DodoContainerCard.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputTextOptional from '@/components/DodoInputTextOptional.vue'
import DodoInputRedflags from '@/components/DodoInputRedflags.vue'
import { ConsentMedTask } from '@/types/lists/saamed'
import { useDokuStore } from '@/store/doku'
import { tryScrollingToBottom } from '@/utils/input'
import TasksContainerCard from '@/views/dokuCards/TasksContainerCard.vue'
import TaskInterventionsCard from '@/views/dokuCards/taskCards/TaskInterventionsCard.vue'
import DodoInputSaamed from '@/components/DodoInputSaamed.vue'
import DodoInputSaatreats from '@/components/DodoInputSaatreats.vue'
import TaskConsentCard from '@/views/dokuCards/taskCards/TaskConsentCard.vue'
import TaskCourseCard from '@/views/dokuCards/taskCards/TaskCourseCard.vue'
import TaskRedflagsCard from '@/views/dokuCards/taskCards/TaskRedflagsCard.vue'

vi.mock('@/utils/input', () => ({ tryScrollingToBottom: vi.fn() }))

const global = { renderStubDefaultSlot: true }

describe('task cards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test.each([
    [false, false, ''],
    [true, false, 'Invasive'],
    [false, true, 'Medikamente'],
    [true, true, 'Invasiv+Medikamente'],
  ] as const)('renders the saved selection title (procedures: %s, medications: %s)', (procedures, medications, title) => {
    const store = useDokuStore()
    if (procedures) store.doku.saatreats.selectedIds = ['pvk-20g']
    if (medications) store.doku.saamed.medTasks.push(new ConsentMedTask('adrenalin', 'rea', '', true, '', ''))
    const wrapper = shallowMount(TaskInterventionsCard, { global })
    expect(wrapper.findComponent(IonCardHeader).exists()).toBe(Boolean(title))
    expect(wrapper.findComponent(IonCardTitle).exists()).toBe(Boolean(title))
    if (title) expect(wrapper.getComponent(IonCardTitle).text()).toBe(title)
    wrapper.unmount()
  })

  test('updates the title when selections are saved and the last entries are removed', async () => {
    const wrapper = shallowMount(TaskInterventionsCard, { global })
    const procedures = wrapper.getComponent(DodoInputSaatreats)
    const medications = wrapper.getComponent(DodoInputSaamed)
    procedures.vm.$emit('update:modelValue', ['pvk-20g'])
    await nextTick()
    expect(wrapper.getComponent(IonCardTitle).text()).toBe('Invasive')
    medications.vm.$emit('update:modelValue', [new ConsentMedTask('adrenalin', 'rea', '', true, '', '')])
    await nextTick()
    expect(wrapper.getComponent(IonCardTitle).text()).toBe('Invasiv+Medikamente')
    medications.vm.$emit('update:modelValue', [])
    await nextTick()
    expect(wrapper.getComponent(IonCardTitle).text()).toBe('Invasive')
    medications.vm.$emit('update:modelValue', [new ConsentMedTask('adrenalin', 'rea', '', true, '', '')])
    procedures.vm.$emit('update:modelValue', [])
    await nextTick()
    expect(wrapper.getComponent(IonCardTitle).text()).toBe('Medikamente')
    medications.vm.$emit('update:modelValue', [])
    await nextTick()
    expect(wrapper.findComponent(IonCardHeader).exists()).toBe(false)
    expect(wrapper.findComponent(IonCardTitle).exists()).toBe(false)
    wrapper.unmount()
  })

  test('shares one card with ordered lists and buttons, and keeps draft selections out of the title', async () => {
    const store = useDokuStore()
    const wrapper = shallowMount(TaskInterventionsCard, {
      global: { ...global, stubs: { DodoInputSaatreats: false, DodoInputSaamed: false } },
    })
    const content = wrapper.getComponent(IonCardContent)
    expect(wrapper.findAllComponents(IonCard)).toHaveLength(1)
    expect(wrapper.findAllComponents(IonCardContent)).toHaveLength(1)
    const listSelector = '.dodo-saatreats-input > ion-list-stub, .dodo-saamed-input > ion-list-stub'
    const buttonSelector = '.dodo-saatreats-input > ion-button-stub, .dodo-saamed-input > ion-button-stub'
    expect(content.findAll(listSelector)).toHaveLength(0)
    expect(content.findAll(buttonSelector).map(button => button.text()))
      .toEqual(['Invasives hinzufügen', 'Medikament hinzufügen'])
    await content.findAll(buttonSelector)[0].trigger('click')
    const procedures = wrapper.getComponent(DodoInputSaatreats)
    expect(procedures.getComponent(IonModal).props('isOpen')).toBe(true)
    await procedures.findAll('.dodo-saatreats-chip')[0].trigger('click')
    expect(store.doku.saatreats.selectedIds).toEqual([])
    expect(wrapper.findComponent(IonCardHeader).exists()).toBe(false)
    procedures.getComponent(IonModal).vm.$emit('willDismiss')
    await nextTick()
    await content.findAll(buttonSelector)[1].trigger('click')
    expect(wrapper.getComponent(DodoInputSaamed).findAllComponents(IonModal)[0].props('isOpen')).toBe(true)
    expect(wrapper.findComponent(IonCardHeader).exists()).toBe(false)
    store.doku.saatreats.selectedIds = ['pvk-20g']
    store.doku.saamed.medTasks.push(new ConsentMedTask('adrenalin', 'rea', '', true, '', ''))
    await nextTick()
    expect(content.findAll(`${listSelector}, ${buttonSelector}`).map(element => element.element.tagName.toLowerCase()))
      .toEqual(['ion-list-stub', 'ion-button-stub', 'ion-list-stub', 'ion-button-stub'])
    expect(content.findAll(listSelector)[0].text()).toContain('PVK 20 G')
    expect(content.findAll(listSelector)[1].text()).toContain('Adrenalin')
    wrapper.unmount()
  })

  test.each([
    ['standard', true, true, true],
    ['verlegung', true, false, false],
    ['einweisung', true, true, false],
    ['no_emergency_call', false, false, true],
  ] as const)('%s preserves visibility and the course placeholder rule', (flavor, medications, consent, mandatory) => {
    const store = useDokuStore()
    if (flavor !== 'standard') store.setFlavor(flavor, true)
    const wrapper = shallowMount(TasksContainerCard, { global })
    const invasive = wrapper.findAllComponents(DodoContainerCard)[1]
    expect(invasive.props('title')).toBe('Maßnahmen')
    expect(invasive.isVisible()).toBe(medications || consent)
    expect(invasive.findComponent(TaskInterventionsCard).isVisible()).toBe(medications)
    expect(invasive.findComponent(TaskConsentCard).isVisible()).toBe(consent)
    expect(wrapper.findComponent(TaskRedflagsCard).isVisible()).toBe(consent)
    expect(wrapper.findComponent(TaskCourseCard).isVisible()).toBe(true)
    expect(store.generatedProtocol.includes('[VERLAUF]')).toBe(mandatory)
    store.doku.treatment.setText('Verlauf dokumentiert')
    expect(store.generatedProtocol).toContain('Verlauf dokumentiert')
    expect(store.generatedProtocol).not.toContain('[VERLAUF]')
    wrapper.unmount()
  })

  test('saving procedures defaults consent only when empty and never clears it', async () => {
    const store = useDokuStore()
    const wrapper = shallowMount(TaskInterventionsCard, { global })
    const input = wrapper.getComponent(DodoInputSaatreats)
    expect(store.doku.redflags.consent).toBe('')
    input.vm.$emit('update:modelValue', [])
    expect(store.doku.redflags.consent).toBe('')
    input.vm.$emit('update:modelValue', ['pvk-20g'])
    await nextTick()
    expect(store.doku.saatreats.selectedIds).toEqual(['pvk-20g'])
    expect(input.props('modelValue')).toEqual(['pvk-20g'])
    expect(store.doku.redflags.consent).toBe('Fähig')
    for (const consent of ['Unfähig', 'Zeitkritisch', 'Fähig'] as const) {
      store.doku.redflags.consent = consent
      input.vm.$emit('update:modelValue', ['intraossaer'])
      expect(store.doku.redflags.consent).toBe(consent)
      input.vm.$emit('update:modelValue', [])
      expect(store.doku.redflags.consent).toBe(consent)
    }
    wrapper.unmount()
  })

  test('separate consent card retains the stored value and medication default', async () => {
    const store = useDokuStore()
    const consent = shallowMount(TaskConsentCard, { global })
    const medications = shallowMount(TaskInterventionsCard, { global })
    const input = () => consent.getComponent(DodoInputSelect)
    store.doku.saamed.medTasks.push(new ConsentMedTask('adrenalin', 'rea', '', true, '', ''))
    await nextTick()
    expect(input().props('modelValue')).toBe('Fähig')
    for (const value of ['Unfähig', 'Zeitkritisch', 'Fähig', ''] as const) {
      input().vm.$emit('update:modelValue', value)
      await nextTick()
      expect(store.doku.redflags.consent).toBe(value)
    }
    input().vm.$emit('update:modelValue', 'Unfähig')
    store.doku.saamed.medTasks.push(new ConsentMedTask('adrenalin', 'rea', '', true, '', ''))
    await nextTick()
    expect(store.doku.redflags.consent).toBe('Unfähig')
    consent.unmount()
    medications.unmount()
  })

  test('explanation modes retain attendant fields, redflags and scrolling', async () => {
    const store = useDokuStore()
    store.doku.redflags.consent = 'Zeitkritisch'
    const wrapper = shallowMount(TaskRedflagsCard, { global })
    expect(wrapper.findAllComponents(DodoInputSelect)).toHaveLength(1)
    const mode = wrapper.getComponent(DodoInputSelect)
    expect(wrapper.findComponent(DodoInputRedflags).exists()).toBe(false)
    mode.vm.$emit('update:modelValue', 'BvO')
    await nextTick()
    const attendant = wrapper.getComponent(DodoInputTextOptional)
    attendant.vm.$emit('update:toggle', true)
    attendant.vm.$emit('update:text', 'Betreuerin')
    await nextTick()
    expect(store.doku.redflags.attendant.active).toBe(true)
    expect(store.doku.redflags.attendant.value).toBe('Betreuerin')
    expect(wrapper.getComponent(DodoInputRedflags).props('modelValue')).toEqual(store.doku.redflags)
    expect(tryScrollingToBottom).toHaveBeenCalled()
    mode.vm.$emit('update:modelValue', 'Verweigerung')
    await nextTick()
    expect(store.doku.redflags.noTransportType).toBe('Verweigerung')
    expect(wrapper.findComponent(DodoInputTextOptional).exists()).toBe(false)
    expect(wrapper.findComponent(DodoInputRedflags).exists()).toBe(true)
    mode.vm.$emit('update:modelValue', '')
    await nextTick()
    expect(wrapper.findComponent(DodoInputRedflags).exists()).toBe(false)
    expect(store.doku.redflags.consent).toBe('Zeitkritisch')
    wrapper.unmount()
  })
})
