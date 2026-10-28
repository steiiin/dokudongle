import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputTextOptional from '@/components/DodoInputTextOptional.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import { useDokuStore } from '@/store/doku'
import { DisabilityNeuro } from '@/types/protocol/abcde'
import { OptionalValue } from '@/types/protocol/input'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'

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
  vi.clearAllMocks()
})

function seedNeuro() {
  const neuro = useDokuStore().doku.xabcDe.neuro
  neuro.assessed = true
  Object.assign(neuro.value, {
    followInstructions: 'nicht befolgt',
    sensitivity: OptionalValue.active('Taubheit li. Arm'),
    paraesthesia: OptionalValue.active('Kribbeln li. Bein'),
    dysarthria: 'verwaschen',
    aphasia: 'schwere',
    msArmLeft: 'Absinken',
    msMeningism: 'leichter',
    msTremor: true,
  } satisfies Partial<DisabilityNeuro>)
  return neuro
}

const triggers: [string, (store: ReturnType<typeof useDokuStore>, enabled: boolean) => void][] = [
  ['flavor', (store, enabled) => { store.doku.flavors.non_verbal = enabled }],
  ['unconscious', (store, enabled) => { store.doku.xabcDe.avpu = enabled ? 'bewusstlos' : 'wach' }],
  ['soporous', (store, enabled) => { store.doku.xabcDe.avpu = enabled ? 'soporös' : 'wach' }],
  ['verbal GCS', (store, enabled) => { store.doku.xabcDe.gcs.v = enabled ? 3 : 5 }],
  ['not breathing', (store, enabled) => { store.doku.xAbcde.isBreathing = !enabled }],
]

describe('Non-verbal Neuro inputs', () => {
  test.each(triggers)('hides and resets only inapplicable findings on %s', async (_, setNonVerbal) => {
    const store = useDokuStore()
    const neuro = seedNeuro()
    const wrapper = shallowMount(AbcdeDisabilityCard, { global: { renderStubDefaultSlot: true } })
    const modal = wrapper.findAllComponents(DodoItemModal).find(item => item.props('label') === 'Neuro-Befund')!
    const labels = () => modal.findAllComponents(DodoInputSelect).map(input => input.props('label'))
    const sections = () => modal.findAll('ion-item-divider-stub').map(divider => divider.text())
    const visibleLabels = ['Anweisungen befolgen', 'Fazialisparese', 'Nackensteife', 'Artikulation', 'Aphasie']
    expect(labels()).toEqual(visibleLabels)
    expect(modal.findAllComponents(DodoInputTextOptional)).toHaveLength(2)
    expect(sections()).toEqual(['Bewusstsein', 'Motorik', 'Sensorik', 'Sprache'])

    setNonVerbal(store, true)
    expect(store.context.isNonVerbal).toBe(true)
    const expected = Object.assign(new DisabilityNeuro(), {
      msArmLeft: 'Absinken', msTremor: true,
    })
    // Reset is synchronous so reanimation can capture all dependent changes.
    expect(neuro.value).toEqual(expected)
    expect(neuro.assessed).toBe(true)
    await nextTick()
    expect(labels()).toEqual(['Fazialisparese'])
    expect(modal.findAllComponents(DodoInputTextOptional)).toHaveLength(0)
    expect(sections()).toEqual(['Motorik'])
    expect(modal.props('state')).toBe('Absinken Arm li; Tremor/Myoklonien')

    setNonVerbal(store, false)
    await nextTick()
    expect(store.context.isNonVerbal).toBe(false)
    expect(labels()).toEqual(visibleLabels)
    expect(modal.findAllComponents(DodoInputTextOptional)).toHaveLength(2)
    expect(sections()).toEqual(['Bewusstsein', 'Motorik', 'Sensorik', 'Sprache'])
    expect(neuro.value).toEqual(expected)
    expect(neuro.assessed).toBe(true)
  })

  test('restores findings after leaving reanimation', () => {
    const store = useDokuStore()
    const neuro = seedNeuro()
    const previous = JSON.stringify(neuro)
    shallowMount(AbcdeDisabilityCard)

    store.setFlavor('reanimation', true)
    expect(neuro.value.followInstructions).toBe('befolgt')
    expect(neuro.value.msMeningism).toBe('kein')
    expect(neuro.value.sensitivity.isActive).toBe(false)
    expect(neuro.value.paraesthesia.isActive).toBe(false)
    expect(neuro.value.dysarthria).toBe('normal')
    expect(neuro.value.aphasia).toBe('keine')

    store.setFlavor('reanimation', false)
    expect(JSON.stringify(neuro)).toBe(previous)
  })
})

describe('Non-verbal Neuro protocol', () => {
  test.each([false, true])('filters stored findings without a mounted card, with motor findings=%s', withMotorFindings => {
    const store = useDokuStore()
    const neuro = seedNeuro()
    if (!withMotorFindings) {
      neuro.value.msArmLeft = 'ohne Absinken'
      neuro.value.msMeningism = 'kein'
      neuro.value.msTremor = false
    }
    expect(store.generatedProtocol).toContain('Anweisungen nicht befolgt')
    expect(store.generatedProtocol).toContain('schwere Aphasie')
    store.doku.flavors.non_verbal = true

    const protocol = store.generatedProtocol
    expect(protocol).not.toMatch(/Anweisungen|Sensibilit|Taubheit|Parästhes|Kribbeln|Artikulation|Aphasie|Nackensteife/)
    if (withMotorFindings) {
      expect(protocol).toContain('Armparese')
      expect(protocol).toContain('Neuro: Absinken Arm li; Tremor/Myoklonien')
    } else {
      expect(protocol).toContain('keine Paresen')
      expect(protocol).not.toContain('Neuro:')
      expect(neuro.value.state).toBe('normal')
    }
    // Generation filters stored values independently of the UI reset watcher.
    expect(neuro.value.aphasia).toBe('schwere')
    neuro.assessed = false
    expect(store.generatedProtocol).not.toMatch(/Neuro:|Paresen|Armparese|Nackensteife/)
  })
})
