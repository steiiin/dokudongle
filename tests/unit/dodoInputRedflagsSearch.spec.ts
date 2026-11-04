import { IonButton, IonItem, IonModal, IonSearchbar } from '@ionic/vue'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DodoInputRedflags from '@/components/DodoInputRedflags.vue'
import DodoToggleGroup from '@/components/DodoToggleGroup.vue'
import { DATA_Scenarios, DATA_Signals, DATA_Subscenarios } from '@/data/redflags'
import { TreatmentRedflags } from '@/types/protocol/treatment/treatmentRedflags'

// Exercise alias wiring with fixtures without changing the production catalog.
vi.mock('@/data/redflags', async importOriginal => {
  const data = await importOriginal<typeof import('@/data/redflags')>()
  return {
    ...data,
    DATA_Scenarios: data.DATA_Scenarios.map(entry => entry.id === 'synkope-bvo'
      ? { ...entry, name_alt: 'Ohnmacht' } : entry),
    DATA_Subscenarios: data.DATA_Subscenarios.map(entry => entry.id === 'synkope-bvo-orthostatisch'
      ? { ...entry, name_alt: 'Lagewechselkollaps' } : entry),
  }
})

enableAutoUnmount(afterEach)
const mountInput = () => {
  const model = new TreatmentRedflags()
  model.noTransportType = 'BvO'
  return shallowMount(DodoInputRedflags, {
    props: { modelValue: model }, global: { renderStubDefaultSlot: true },
  })
}
type Wrapper = ReturnType<typeof mountInput>
const modal = (wrapper: Wrapper) => wrapper.getComponent(IonModal)
const entries = (wrapper: Wrapper) => modal(wrapper).findAllComponents(IonItem).filter(item => item.find('h3').exists())
const names = (wrapper: Wrapper) => entries(wrapper).map(item => item.get('h3').text())
const search = (wrapper: Wrapper, query: string) => modal(wrapper).getComponent(IonSearchbar).setValue(query)

describe('RedFlag search results', () => {
  test.each(['synkope', 'synkpoe'])('ranks Synkope first for %s and excludes reflux', async query => {
    const wrapper = mountInput()
    await search(wrapper, query)
    expect(names(wrapper)[0]).toBe('Synkope (leicht)')
    expect(names(wrapper)).toEqual(expect.arrayContaining(['Orthostatische Synkope', 'Vasovagale Synkope (bekanntes Niedrigrisikomuster)']))
    expect(names(wrapper)).not.toContain('Refluxbeschwerden (bekanntes Muster)')
    expect(modal(wrapper).find('.category-divider').exists()).toBe(false)
    expect(entries(wrapper)[0].get('.search-result-category').text()).toBe('neuro')
    expect(entries(wrapper)[0].text()).toContain('kurzzeitiger Bewusstseinsverlust')
  })

  test('searches own and inherited alternative names while displaying canonical names', async () => {
    const wrapper = mountInput()
    await search(wrapper, 'ohnmacht')
    expect(names(wrapper)[0]).toBe('Synkope (leicht)')
    expect(names(wrapper)).toContain('Orthostatische Synkope')
    await search(wrapper, 'lagewechselkollaps')
    expect(names(wrapper)).toEqual(['Orthostatische Synkope'])
    await search(wrapper, 'Synkope (leicht)')
    expect(names(wrapper)).toContain('Orthostatische Synkope')
    await search(wrapper, 'Unterfall von')
    expect(names(wrapper)).toEqual([])
  })

  test('keeps categories and descriptions searchable below title matches across categories', async () => {
    const wrapper = mountInput()
    await search(wrapper, 'neuro')
    expect(names(wrapper)).toContain('Synkope (leicht)')
    expect(names(wrapper)[0]).toBe('Neurodermitisschub (bekannt und leicht)')
    await search(wrapper, 'kurzzeitiger Bewusstseinsverlust')
    expect(names(wrapper)).toContain('Synkope (leicht)')
  })

  test('restores alphabetical browsing for empty and whitespace-only queries', async () => {
    const wrapper = mountInput()
    const expected = [...DATA_Scenarios.filter(entry => entry.application === 'BvO').map(entry => ({ name: entry.name, category: entry.category })),
      ...DATA_Subscenarios.flatMap(entry => {
        const parent = DATA_Scenarios.find(parent => parent.id === entry.parentId)!
        return parent.application === 'BvO' ? [{ name: entry.name, category: parent.category }] : []
      })].sort((a, b) => a.category.localeCompare(b.category, 'de') || a.name.localeCompare(b.name, 'de')).map(entry => entry.name)
    expect(names(wrapper)).toEqual(expected)
    await search(wrapper, 'synkope')
    await search(wrapper, '   ')
    expect(names(wrapper)).toEqual(expected)
    expect(modal(wrapper).find('.category-divider').exists()).toBe(true)
    await search(wrapper, 'zzzzzzzz')
    expect(modal(wrapper).text()).toContain('Keine Ergebnisse gefunden')
  })

  test('selects ranked results and retains application and selection exclusions', async () => {
    const wrapper = mountInput()
    await wrapper.findAllComponents(IonButton).find(button => button.text() === 'RedFlags hinzufügen')!.trigger('click')
    await search(wrapper, 'synkope')
    await entries(wrapper)[0].trigger('click')
    const model = wrapper.emitted('update:modelValue')!.at(-1)![0] as TreatmentRedflags
    expect(model.scenarioSelections).toEqual([{ scenarioId: 'synkope-bvo', subscenarioMode: 'all', subscenarioIds: [] }])
    expect(modal(wrapper).props('isOpen')).toBe(false)
    await wrapper.setProps({ modelValue: model })
    expect(names(wrapper)).not.toContain('Synkope (leicht)')
    model.scenarioSelections = [{ scenarioId: 'synkope-bvo', subscenarioMode: 'selected', subscenarioIds: ['synkope-bvo-orthostatisch'] }]
    await wrapper.setProps({ modelValue: Object.assign(new TreatmentRedflags(), model) })
    expect(names(wrapper)).not.toContain('Orthostatische Synkope')
    const refusal = new TreatmentRedflags()
    refusal.noTransportType = 'Verweigerung'
    await wrapper.setProps({ modelValue: refusal })
    expect(names(wrapper)[0]).toBe('Synkope')
    expect(names(wrapper)).not.toContain('Orthostatische Synkope')
  })

  test('uses typo-tolerant signal search and excludes selected signals', async () => {
    const wrapper = mountInput()
    modal(wrapper).getComponent(DodoToggleGroup).vm.$emit('update:modelValue', 'signal')
    await search(wrapper, 'bauchschmerzne')
    const signal = DATA_Signals.find(entry => entry.id === 'abdomen__zunehmende_schmerzen')!
    expect(names(wrapper)).toEqual([signal.text])
    expect(modal(wrapper).find('.search-result-category').exists()).toBe(false)
    await entries(wrapper)[0].trigger('click')
    const model = wrapper.emitted('update:modelValue')!.at(-1)![0] as TreatmentRedflags
    expect(model.choosenSignals).toEqual([signal])
    await wrapper.setProps({ modelValue: model })
    expect(names(wrapper)).toEqual([])
  })
})
