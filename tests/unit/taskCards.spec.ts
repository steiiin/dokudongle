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
import TaskMedicationsCard from '@/views/dokuCards/taskCards/TaskMedicationsCard.vue'
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
    ['standard', true, true, true],
    ['verlegung', true, false, false],
    ['einweisung', true, true, false],
    ['no_emergency_call', false, false, true],
  ] as const)('%s preserves visibility and the course placeholder rule', (flavor, medications, consent, mandatory) => {
    const store = useDokuStore()
    if (flavor !== 'standard') store.setFlavor(flavor, true)
    const wrapper = shallowMount(TasksContainerCard, { global })
    const invasive = wrapper.findAllComponents(DodoContainerCard)[1]
    expect(invasive.props('title')).toBe('Invasive Maßnahmen')
    expect(invasive.isVisible()).toBe(medications || consent)
    expect(invasive.findComponent(TaskMedicationsCard).isVisible()).toBe(medications)
    expect(invasive.findComponent(TaskConsentCard).isVisible()).toBe(consent)
    expect(wrapper.findComponent(TaskRedflagsCard).isVisible()).toBe(consent)
    expect(wrapper.findComponent(TaskCourseCard).isVisible()).toBe(true)
    expect(store.generatedProtocol.includes('[VERLAUF]')).toBe(mandatory)
    store.doku.treatment.setText('Verlauf dokumentiert')
    expect(store.generatedProtocol).toContain('Verlauf dokumentiert')
    expect(store.generatedProtocol).not.toContain('[VERLAUF]')
    wrapper.unmount()
  })

  test('separate consent card retains the stored value and medication default', async () => {
    const store = useDokuStore()
    const consent = shallowMount(TaskConsentCard, { global })
    const medications = shallowMount(TaskMedicationsCard, { global })
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
