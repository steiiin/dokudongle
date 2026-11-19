import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import * as Ionic from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoStateItem from '@/components/protocol/DodoStateItem.vue'
import { useDokuStore } from '@/store/doku'
import SampleSymptomsTrauma from '@/views/doku/sample/SampleSymptomsTrauma.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

enableAutoUnmount(afterEach)
beforeEach(() => {
  setActivePinia(createPinia())
  const store = useDokuStore()
  store.doku.ident.age.timespan = 35
  store.doku.ident.age.unit = 'years'
  store.doku.sampler.symptoms.trauma.head.isInjured = true
})

describe('SHT with unassessable amnesia', () => {
  const orientations = ['ja', 'teilweise', 'nein'] as const
  test.each(orientations.flatMap(Z => orientations.map(S => ({ Z, S }))))(
    'assesses temporal=$Z and situational=$S orientation', ({ Z, S }) => {
      const store = useDokuStore()
      Object.assign(store.doku.xabcDe.zops, { Z, S })
      const head = store.doku.sampler.symptoms.trauma.head
      const impaired = Z !== 'ja' || S !== 'ja'
      expect(head.hasSHTIndicators).toBe(impaired)
      expect(head.headState.title).toBe(impaired ? 'SHT möglich' : 'SHT unwahrscheinlich')
      expect(head.generateText()).toBe(impaired
        ? 'Kopf: Amnesie nicht beurteilbar – SHT mgl.\n'
        : 'Kopf: kein Anhalt SHT.\n')
      if (impaired) expect(head.headState.description).toBe('Amnesie nicht beurteilbar')
    },
  )

  test('applies at baseline and preserves additional indicators instead of the stored amnesia', () => {
    const store = useDokuStore()
    store.doku.xabcDe.baseline = true
    store.doku.xabcDe.zops.Z = 'teilweise'
    store.doku.xabcDe.headache = true
    store.doku.xabcdE.nausea = true
    const head = store.doku.sampler.symptoms.trauma.head
    head.Amnesia = 'beides'
    head.wasInitiallyUnconscious = true
    const text = head.generateText()
    for (const indicator of ['bewusstlos', 'Übelkeit', 'Kopfschmerzen', 'Amnesie nicht beurteilbar', 'SHT mgl.']) {
      expect(text).toContain(indicator)
    }
    expect(text).not.toContain('retro-/anterograde Amnesie')
    expect(head.Amnesia).toBe('beides')
  })

  test.each(['O', 'P'] as const)('does not trigger for isolated %s impairment', dimension => {
    const store = useDokuStore()
    store.doku.xabcDe.zops[dimension] = 'nein'
    expect(store.doku.sampler.symptoms.trauma.head.generateText()).toBe('Kopf: kein Anhalt SHT.\n')
  })

  test('ignores inactive orientation and pediatric adult values', () => {
    const store = useDokuStore()
    const head = store.doku.sampler.symptoms.trauma.head
    store.doku.xabcDe.zops.S = 'nein'
    store.doku.xabcDe.assessment.zops = 'inactive'
    expect(head.hasSHTIndicators).toBe(false)
    store.doku.xabcDe.assessment.zops = 'active'
    store.doku.ident.age.timespan = 3
    expect(head.hasSHTIndicators).toBe(false)
    store.doku.ident.age.timespan = 35
    expect(head.hasSHTIndicators).toBe(true)
  })

  test('respects automatic versus explicitly active nonverbal orientation', () => {
    const store = useDokuStore()
    store.doku.flavors.non_verbal = true
    store.doku.xabcDe.zops.Z = 'nein'
    const head = store.doku.sampler.symptoms.trauma.head
    expect(head.hasSHTIndicators).toBe(false)
    store.doku.xabcDe.assessment.zops = 'active'
    expect(head.hasSHTIndicators).toBe(true)
  })

  test('keeps the output unchanged without plausible head trauma', () => {
    const store = useDokuStore()
    const head = store.doku.sampler.symptoms.trauma.head
    head.isInjured = false
    const original = head.generateText()
    store.doku.xabcDe.zops.Z = 'nein'
    expect(head.hasSHTIndicators).toBe(false)
    expect(head.headState.title).toBe('')
    expect(head.generateText()).toBe(original)
  })

  test('hides and restores the amnesia selector and its saved value reactively', async () => {
    const store = useDokuStore()
    const head = store.doku.sampler.symptoms.trauma.head
    head.Amnesia = 'retrograd'
    const wrapper = mount(SampleSymptomsTrauma, {
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
          DodoInputSelect: true,
          DodoInputToggle: true,
          DodoInputSampleLimb: true,
          DodoInputText: true,
          DodoStateItem: true,
        },
      },
    })
    const amnesia = () => wrapper.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Amnesie')
    expect(amnesia()?.props('modelValue')).toBe('retrograd')
    store.doku.xabcDe.zops.S = 'teilweise'
    await nextTick()
    expect(amnesia()).toBeUndefined()
    expect(wrapper.getComponent(DodoStateItem).props()).toMatchObject({
      title: 'SHT möglich', description: 'Amnesie nicht beurteilbar',
    })
    expect(head.generateText()).not.toContain('retrograde Amnesie')
    store.doku.xabcDe.zops.Z = 'nein'
    store.doku.xabcDe.zops.S = 'ja'
    await nextTick()
    expect(amnesia()).toBeUndefined()
    store.doku.xabcDe.zops.Z = 'ja'
    await nextTick()
    expect(amnesia()?.props('modelValue')).toBe('retrograd')
    expect(head.generateText()).toBe('Kopf: retrograde Amnesie - mgl. SHT.\n')
  })
})
