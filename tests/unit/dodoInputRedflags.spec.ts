import { IonButton, IonCheckbox, IonChip, IonItem, IonModal, IonSearchbar } from '@ionic/vue'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import DodoInputRedflags from '@/components/DodoInputRedflags.vue'
import DodoToggleGroup from '@/components/DodoToggleGroup.vue'
import { DATA_Signals } from '@/data/redflags'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'
import TaskRedflagsCard from '@/views/dokuCards/taskCards/TaskRedflagsCard.vue'
import { useDokuStore } from '@/store/doku'
import { tryScrollingToBottom } from '@/utils/input'

vi.mock('@/utils/input', () => ({ tryScrollingToBottom: vi.fn() }))

enableAutoUnmount(afterEach)
const mountInput = (model = new TreatmentRedflags()) => {
  model.noTransportType ||= 'BvO'
  return shallowMount(DodoInputRedflags, { props: { modelValue: model }, global: { renderStubDefaultSlot: true } })
}
type Wrapper = ReturnType<typeof mountInput>
const modal = (wrapper: Wrapper) => wrapper.getComponent(IonModal)
const entries = (wrapper: Wrapper) => modal(wrapper).findAllComponents(IonItem).filter(item => item.find('h3').exists())
const names = (wrapper: Wrapper) => entries(wrapper).map(item => item.get('h3').text())
const update = async (wrapper: Wrapper) => {
  const value = wrapper.emitted('update:modelValue')!.at(-1)![0] as TreatmentRedflags
  await wrapper.setProps({ modelValue: value })
  return value
}
const choose = async (wrapper: Wrapper, name: string) => {
  await entries(wrapper).find(item => item.get('h3').text() === name)!.trigger('click')
  return update(wrapper)
}
const open = (wrapper: Wrapper) => wrapper.findAllComponents(IonButton).find(button => button.text() === 'RedFlags hinzufügen')!.trigger('click')

describe('RedFlags scenario selection', () => {
  test('directly selects, extends and removes children, then restores all children and removes the parent', async () => {
    const wrapper = mountInput()
    await open(wrapper)
    expect(entries(wrapper).find(item => item.get('h3').text() === 'Orthostatische Synkope')!.text())
      .toContain('Unterfall von Synkope (leicht)')
    let value = await choose(wrapper, 'Orthostatische Synkope')
    expect(value.scenarioSelections).toEqual([{ scenarioId: 'synkope-bvo', subscenarioIds: ['synkope-bvo-orthostatisch'] }])
    expect(modal(wrapper).props('isOpen')).toBe(false)
    expect(wrapper.get('.scenario-chip').text()).toContain('Synkope (leicht)')
    expect(wrapper.findAll('.subscenario-chip').map(chip => chip.text())).toEqual(['Orthostatische Synkope'])
    expect(value.getRedflagBlock()).not.toContain('vasovagale Ursache')
    await open(wrapper)
    value = await choose(wrapper, 'Vasovagale Synkope (bekanntes Niedrigrisikomuster)')
    expect(value.scenarioSelections[0].subscenarioIds).toHaveLength(2)
    await wrapper.findAll('.subscenario-chip')[0].trigger('click')
    value = await update(wrapper)
    expect(value.scenarioSelections[0].subscenarioIds).toEqual(['synkope-bvo-vasovagal'])
    await wrapper.get('.subscenario-chip').trigger('click')
    value = await update(wrapper)
    expect(value.scenarioSelections[0].subscenarioIds).toEqual([])
    expect(wrapper.get('.scenario-chip').text()).toContain('alle Unterfälle')
    expect(value.getRedflagBlock()).toContain('orthostatische Synkope; vasovagale Ursache')
    await wrapper.get('.scenario-chip').trigger('click')
    value = await update(wrapper)
    expect(value.scenarioSelections).toEqual([])
    expect(wrapper.find('.scenario-chip').exists()).toBe(false)
  })

  test('narrows a generic parent and can explicitly select all again without duplicates', async () => {
    const wrapper = mountInput()
    await choose(wrapper, 'Synkope (leicht)')
    expect(wrapper.get('.scenario-chip').text()).toContain('alle Unterfälle')
    expect(names(wrapper)).not.toContain('Synkope (leicht)')
    await choose(wrapper, 'Orthostatische Synkope')
    expect(wrapper.get('.scenario-chip').text()).not.toContain('alle Unterfälle')
    expect(names(wrapper)).toContain('Synkope (leicht)')
    const value = await choose(wrapper, 'Synkope (leicht)')
    expect(value.scenarioSelections).toEqual([{ scenarioId: 'synkope-bvo', subscenarioIds: [] }])
  })

  test('searches children, parent names and categories while applying the inherited application', async () => {
    const wrapper = mountInput()
    const search = modal(wrapper).getComponent(IonSearchbar)
    await search.setValue('Synkope (leicht)')
    expect(names(wrapper)).toEqual(expect.arrayContaining(['Synkope (leicht)', 'Orthostatische Synkope', 'Vasovagale Synkope (bekanntes Niedrigrisikomuster)']))
    await search.setValue('orthostatisch')
    expect(names(wrapper)).toContain('Orthostatische Synkope')
    const model = new TreatmentRedflags()
    model.noTransportType = 'Verweigerung'
    await wrapper.setProps({ modelValue: model })
    expect(names(wrapper)).not.toContain('Orthostatische Synkope')
    await search.setValue('neuro')
    expect(names(wrapper)).toContain('Synkope')
    await search.setValue('zzzzzzzz')
    expect(modal(wrapper).text()).toContain('Keine Ergebnisse gefunden')
  })

  test('removes inherited and custom contributions together, restores a signal and toggles minor text', async () => {
    const model = new TreatmentRedflags()
    model.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: [] }]
    const signal = DATA_Signals.find(entry => entry.id === 'atmung-luftnot')!
    model.choosenSignals = [signal]
    const wrapper = mountInput(model)
    const chips = () => wrapper.findAllComponents(IonChip).filter(chip => chip.text() === signal.text)
    expect(chips()).toHaveLength(1)
    await chips()[0].trigger('click')
    let value = await update(wrapper)
    expect(value.getRedflagBlock()).not.toContain(signal.text)
    expect(chips()).toHaveLength(0)
    expect(model.choosenSignals).toEqual([signal])
    expect(model.removedMajorSignalIds).toEqual([])
    expect(value.removedMajorSignals).toEqual([])
    await open(wrapper)
    modal(wrapper).getComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'signal')
    await wrapper.vm.$nextTick()
    value = await choose(wrapper, signal.text)
    expect(chips()).toHaveLength(1)
    expect(value.getRedflagBlock()).toContain(signal.text)
    wrapper.getComponent(IonCheckbox).vm.$emit('ionChange', { detail: { checked: true } })
    value = await update(wrapper)
    expect(value.getRedflagBlock()).not.toContain('Rücksprache Haus-/Facharzt')
    for (const chip of wrapper.findAllComponents(IonChip).filter(chip => chip.props('color') === 'warning')) {
      expect(chip.isVisible()).toBe(false)
    }
  })

  test('displays invalid IDs with an actionable removal and leaves empty scenarios selectable', async () => {
    const model = new TreatmentRedflags()
    model.noTransportType = 'Verweigerung'
    model.scenarioSelections = [{ scenarioId: 'missing', subscenarioIds: [] }]
    const wrapper = mountInput(model)
    expect(wrapper.get('[role="alert"]').text()).toContain('Unbekanntes Hauptszenario: missing')
    expect(model.getRedflagBlock()).toContain('RedFlags-Auswahl prüfen')
    await wrapper.get('.scenario-chip').trigger('click')
    await update(wrapper)
    const value = await choose(wrapper, 'Abdominaltrauma mit Verdacht auf innere Verletzung')
    expect(value.scenarioSelections).toHaveLength(1)
    expect(value.getResolvedContent().majorSignals).toEqual([])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  test('keeps an invalid child selection when extending it fails and allows explicit parent reselection', async () => {
    const model = new TreatmentRedflags()
    model.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['missing-child'] }]
    const wrapper = mountInput(model)
    await open(wrapper)
    await entries(wrapper).find(item => item.get('h3').text() === 'Orthostatische Synkope')!.trigger('click')
    expect(modal(wrapper).get('[role="alert"]').text()).toContain('Unbekanntes Unterszenario: missing-child')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(model.scenarioSelections[0].subscenarioIds).toEqual(['missing-child'])
    const value = await choose(wrapper, 'Synkope (leicht)')
    expect(value.scenarioSelections[0].subscenarioIds).toEqual([])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  test('scrolls when a child is replaced without changing the number of selected scenarios', async () => {
    setActivePinia(createPinia())
    const store = useDokuStore()
    store.doku.redflags.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['synkope-bvo-orthostatisch'] }]
    shallowMount(TaskRedflagsCard, { global: { renderStubDefaultSlot: true } })
    vi.mocked(tryScrollingToBottom).mockClear()
    store.doku.redflags.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioIds: ['synkope-bvo-vasovagal'] }]
    await nextTick()
    expect(tryScrollingToBottom).toHaveBeenCalledOnce()
  })
})
