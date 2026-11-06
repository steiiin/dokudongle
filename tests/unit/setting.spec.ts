import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputSelectChips from '@/components/DodoInputSelectChips.vue'
import DodoInputToggle from '@/components/DodoInputToggle.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { Setting } from '@/types/protocol/setting'
import SettingCard from '@/views/dokuCards/SettingCard.vue'

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
    const toggle = wrapper.findAllComponents(DodoInputToggle)
      .find(toggle => toggle.text() === 'BG-Fall')!

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
