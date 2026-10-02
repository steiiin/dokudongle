import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, test } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import { useDokuStore } from '@/store/doku'
import { Setting } from '@/types/protocol/setting'
import SettingCard from '@/views/dokuCards/SettingCard.vue'

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
    setting.helpers = 'nursing'

    expect(setting.generateText().trim()).toBe(
      `${location ? `${location}; ` : ''}${expected} vor Ort.`,
    )
    expect(setting.helpers).toBe('nursing')
  })

  test.each(['Pflegedienst', 'Pflegepersonal', 'Angehörige', 'Tochter & Nachbarin'])(
    'preserves literal helper text %j at any location', helpers => {
      const setting = new Setting()
      setting.helpers = helpers

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
    const helpers = selects.find(select => select.props('label') === 'Vor Ort')!
    const location = selects.find(select => select.props('label') === 'Einsatzort')!
    expect(helpers.props('options')).toEqual([
      { value: 'nursing', label: 'Pflege' },
      'Angehörige', 'Ehepartner', 'Lebenspartner', 'Kinder',
    ])

    helpers.vm.$emit('update:modelValue', 'nursing')
    for (const [value, expected] of [
      ['Häuslichkeit', 'Pflegedienst'],
      ['Pflegeheim', 'Pflegepersonal'],
      ['Betreutes Wohnen', 'Pflegedienst'],
    ]) {
      location.vm.$emit('update:modelValue', value)
      await wrapper.vm.$nextTick()
      expect(store.doku.setting.generateText()).toContain(`${expected} vor Ort`)
      expect(store.doku.setting.helpers).toBe('nursing')
      expect(helpers.props('modelValue')).toBe('nursing')
    }
    wrapper.unmount()
  })
})
