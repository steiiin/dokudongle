import { enableAutoUnmount, flushPromises, mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import * as Ionic from '@ionic/vue'
import { IonToggle } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputSelectChips from '@/components/inputs/DodoInputSelectChips.vue'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import DodoInputToggleOptional from '@/components/inputs/DodoInputToggleOptional.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { Setting } from '@/types/protocol/setting'
import SettingCard from '@/views/doku/SettingCard.vue'

enableAutoUnmount(afterEach)

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

describe('setting BG-Fall', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('toggles the case marker and environment text', async () => {
    const store = useDokuStore()
    const wrapper = shallowMount(SettingCard, {
      global: { renderStubDefaultSlot: true },
    })
    const toggle = wrapper.findAllComponents(DodoInputToggleOptional)
      .find(toggle => toggle.props('label') === 'BG-Fall')!

    expect(toggle.props('modelValue')).toBe(false)
    expect(store.doku.setting.isEmpty).toBe(true)
    expect(store.doku.setting.generateText()).toBe('')

    toggle.vm.$emit('update:modelValue', true)
    await wrapper.vm.$nextTick()
    expect(toggle.props('modelValue')).toBe(true)
    expect(store.doku.setting.isEmpty).toBe(false)
    expect(store.doku.setting.generateText().trim()).toBe('BG-Fall.')
    expect(store.generatedProtocol).toContain('BG-Fall.')

    toggle.vm.$emit('update:modelValue', false)
    await wrapper.vm.$nextTick()
    expect(store.doku.setting.isBgCase).toBe(false)
    expect(store.doku.setting.isEmpty).toBe(true)
    expect(store.doku.setting.generateText()).toBe('')
    expect(store.generatedProtocol).not.toContain('BG-Fall')
    wrapper.unmount()
  })

  test('places BG-Fall after forced entry and respects scene visibility', () => {
    const store = useDokuStore()
    Object.assign(store.doku.setting, {
      location: 'Werkhalle', isForcedEntry: true, isBgCase: true, helpers: ['Kollege'],
    })
    expect(store.doku.setting.generateText().trim())
      .toBe('Werkhalle; Notfalltüröffnung; BG-Fall; Kollege vor Ort.')
    store.doku.flavors.verlegung = true
    expect(store.context.requireSceneDetails).toBe(false)
    expect(store.generatedProtocol).not.toContain('BG-Fall')
  })

  test('persists, restores, resets and recovers BG-Fall from history', async () => {
    const store = useDokuStore()
    store.doku.setting.isBgCase = true
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.doku.setting.isBgCase).toBe(true)
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)

    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.setting.isBgCase).toBe(true)
    expect(restored.doku.setting.generateText().trim()).toBe('BG-Fall.')
    await restored.newProtocol()
    expect(restored.doku.setting.isBgCase).toBe(false)
    expect(await restored.restoreProtocolFromHistory(restored.protocolHistory[0].id)).toBe(true)
    expect(restored.doku.setting.isBgCase).toBe(true)
  })

  test('loads older protocols with BG-Fall disabled', async () => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, doku: { setting: { location: 'Bahnhof' } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.setting.isBgCase).toBe(false)
    expect(store.doku.setting.generateText().trim()).toBe('Bahnhof.')
  })
})

describe('setting optional toggles', () => {
  const global = {
    renderStubDefaultSlot: true,
    stubs: {
      ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
      DodoInputSelect: true,
      DodoInputSelectChips: true,
    },
  }
  const flags = [
    ['isAlone', 'Lebt allein?', 'alleinlebend'],
    ['isForcedEntry', 'Türöffnung?', 'Notfalltüröffnung'],
    ['isBgCase', 'BG-Fall', 'BG-Fall'],
  ] as const

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test.each(flags)('%s activates and clears with its protocol text and keyboard focus', async (id, label, text) => {
    const store = useDokuStore()
    const wrapper = mount(SettingCard, { global, attachTo: document.body })
    const row = () => wrapper.get(`[data-examination="${id}"]`)
    const report = () => store.generatedProtocol.toLowerCase()

    for (let attempt = 0; attempt < 2; attempt++) {
      expect(store.doku.setting[id]).toBe(false)
      expect(row().classes()).toContain('examination-inactive')
      expect(row().text()).toBe(label)
      expect(row().findComponent(DodoInputToggle).exists()).toBe(false)
      expect(report()).not.toContain(text.toLowerCase())

      await row().get('.activate-examination').trigger('click')
      await flushPromises()
      expect(store.doku.setting[id]).toBe(true)
      expect(row().classes()).not.toContain('examination-inactive')
      expect(row().getComponent(IonToggle).props('modelValue')).toBe(true)
      expect(row().find('.remove-examination').exists()).toBe(false)
      expect(report()).toContain(text.toLowerCase())

      row().getComponent(IonToggle).vm.$emit('update:modelValue', false)
      await flushPromises()
      expect(store.doku.setting[id]).toBe(false)
      expect(row().classes()).toContain('examination-inactive')
      expect(store.doku.setting.isEmpty).toBe(true)
      expect(report()).not.toContain(text.toLowerCase())
      expect(document.activeElement).toBe(row().get('.activate-examination').element)
    }
  })

  test('groups mixed states in source order and preserves inputs and toggle instances', async () => {
    const store = useDokuStore()
    store.doku.setting.isForcedEntry = true
    const wrapper = mount(SettingCard, { global })
    const order = () => Array.from(wrapper.get('ion-list-stub').element.children)
      .map(el => el.getAttribute('data-examination') ?? el.getAttribute('label'))
    const toggles = () => wrapper.findAllComponents(DodoInputToggleOptional)
    const original = new Map(toggles().map(toggle => [toggle.props('id'), toggle.vm.$]))
    const location = wrapper.findAllComponents(DodoInputSelect)
      .find(select => select.props('label') === 'Einsatzort')!
    location.vm.$emit('update:modelValue', 'Häuslichkeit')
    expect(order()).toEqual(['Einsatzort', 'isForcedEntry', 'Mobilität', 'Vor Ort', 'isAlone', 'isBgCase'])
    expect(toggles().at(-1)!.props('lines')).toBe('none')

    store.doku.setting.isBgCase = true
    await nextTick()
    expect(order()).toEqual(['Einsatzort', 'isForcedEntry', 'isBgCase', 'Mobilität', 'Vor Ort', 'isAlone'])
    expect(wrapper.get('[data-examination="isBgCase"]').getComponent(IonToggle).props('modelValue')).toBe(true)
    expect(toggles().find(toggle => toggle.props('id') === 'isBgCase')!.props('lines')).toBe('full')
    expect(toggles().at(-1)!.props('lines')).toBe('none')

    store.doku.setting.isForcedEntry = false
    await nextTick()
    expect(order()).toEqual(['Einsatzort', 'isBgCase', 'Mobilität', 'Vor Ort', 'isAlone', 'isForcedEntry'])
    expect(wrapper.get('[data-examination="isForcedEntry"]').classes()).toContain('examination-inactive')
    toggles().forEach(toggle => expect(toggle.vm.$).toBe(original.get(toggle.props('id'))))
    expect(wrapper.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Einsatzort')!.vm.$).toBe(location.vm.$)
    expect(location.props('modelValue')).toBe('Häuslichkeit')
  })
})

describe('setting nursing wording', () => {
  test.each([
    ['Pflegeheim', 'Pflegepersonal'],
    ['Häuslichkeit', 'Pflegedienst'],
    ['Betreutes Wohnen', 'Pflegedienst'],
    ['Bahnhof', 'Pflegedienst'],
    ['Bei Nachbarn', 'Pflegedienst'],
    ['', 'Pflegedienst'],
  ])('resolves nursing at location %j', (location, expected) => {
    const setting = new Setting()
    setting.location = location
    setting.helpers = ['nursing']

    expect(setting.generateText().trim()).toBe(
      `${location ? `${location}; ` : ''}${expected} vor Ort.`,
    )
    expect(setting.helpers).toEqual(['nursing'])
  })

  test.each(['Pflegedienst', 'Pflegepersonal', 'Angehörige', 'Tochter & Nachbarin'])(
    'preserves literal helper text %j at any location', helpers => {
      const setting = new Setting()
      setting.helpers = [helpers]

      for (const location of ['Pflegeheim', 'Häuslichkeit']) {
        setting.location = location
        expect(setting.generateText().trim()).toBe(`${location}; ${helpers} vor Ort.`)
      }
    },
  )

  test('omits empty helpers', () => {
    const setting = new Setting()
    expect(setting.generateText()).toBe('')
    setting.location = 'Pflegeheim'
    expect(setting.generateText().trim()).toBe('Pflegeheim.')
  })

  test('stores the Pflege option and updates wording when the location changes', async () => {
    setActivePinia(createPinia())
    const store = useDokuStore()
    const wrapper = shallowMount(SettingCard, {
      global: { renderStubDefaultSlot: true },
    })
    const selects = wrapper.findAllComponents(DodoInputSelect)
    const helpers = wrapper.getComponent(DodoInputSelectChips)
    const location = selects.find(select => select.props('label') === 'Einsatzort')!
    expect(helpers.props('options').flat()).toContainEqual({ value: 'nursing', label: 'Pflege' })

    helpers.vm.$emit('update:modelValue', ['nursing'])
    for (const [value, expected] of [
      ['Häuslichkeit', 'Pflegedienst'],
      ['Pflegeheim', 'Pflegepersonal'],
      ['Betreutes Wohnen', 'Pflegedienst'],
    ]) {
      location.vm.$emit('update:modelValue', value)
      await wrapper.vm.$nextTick()
      expect(store.doku.setting.generateText()).toContain(`${expected} vor Ort`)
      expect(store.doku.setting.helpers).toEqual(['nursing'])
      expect(helpers.props('modelValue')).toEqual(['nursing'])
    }
    wrapper.unmount()
  })
})
