import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import DodoToggleChip from '@/components/DodoToggleChip.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import FlavorsCard from '@/views/dokuCards/FlavorsCard.vue'
import AbcdeAirwayCard from '@/views/dokuCards/abcdeCards/AbcdeAirwayCard.vue'
import AbcdeBreathingCard from '@/views/dokuCards/abcdeCards/AbcdeBreathingCard.vue'
import AbcdeCirculationCard from '@/views/dokuCards/abcdeCards/AbcdeCirculationCard.vue'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'
import AbcdeExposureCard from '@/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'

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

function mountClinicalCards() {
  return [AbcdeAirwayCard, AbcdeBreathingCard, AbcdeCirculationCard,
    AbcdeDisabilityCard, AbcdeExposureCard].map(component => shallowMount(component))
}

function seedFindings(store: ReturnType<typeof useDokuStore>) {
  const p = store.doku
  p.xAbcde.hasStridor = true
  p.xAbcde.mucosa.e = 'blass'
  p.xaBcde.breathlessness = 'schwere'
  p.xaBcde.mechanics = { pattern: 'Kußmaul-Atmung', frequency: 'Tachypnoe', depth: 'Vertieft' }
  p.xaBcde.useAccessoryMuscles = true
  p.xaBcde.hasRetractions = true
  p.xaBcde.auscultation.value = { wheezing: 're.', crackles: 'li.', dimished: 'bds.' }
  p.xaBcde.isParadoxical = true
  p.xaBcde.hasJugularVenousDistension = true
  p.xaBcde.hasEmphysema = true
  p.xaBcde.hasTrachealDeviation = true
  p.xabCde.skin.color = 'blass'
  p.xabCde.skin.peripheralTemp = 'warm'
  p.xabCde.skin.centralTemp = 'warm'
  p.xabCde.pulse.peripheralStrength = 'schlecht'
  p.xabcDe.headache = true
  p.xabcDe.psych.baseline = true
  p.xabcdE.abdominal.value.pain = 'starke'
  p.xaBcde.treatment = 'Existing treatment'
  p.situation.setText('Existing situation')
}

const plain = (value: unknown) => JSON.parse(JSON.stringify(value))

describe('Reanimation restoration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(loadDokuState).mockReset()
  })

  test('the chip applies the preset and restores non-default values through the store', async () => {
    const store = useDokuStore()
    store.doku.xabcDe.avpu = 'somnolent'
    Object.assign(store.doku.xabcDe.gcs, { a: 2, v: 3, m: 4 })
    store.doku.xabCde.skin.color = 'marmoriert'
    const before = plain(store.doku)
    const wrapper = shallowMount(FlavorsCard, { global: { renderStubDefaultSlot: true } })
    const chip = wrapper.findAllComponents(DodoToggleChip).find(c => c.text() === 'Reanimation')!

    chip.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(store.doku.flavors.non_verbal).toBe(true)
    expect(store.doku.xAbcde.isBreathing).toBe(false)
    expect(store.doku.xabCde.skin).toMatchObject({ color: 'zyanotisch', peripheralTemp: 'kühl', centralTemp: 'kühl' })
    expect(store.doku.xabCde.pulse).toMatchObject({ peripheralStrength: 'nicht', centralStrength: 'nicht', rhythmic: false })
    expect(store.doku.xabcDe.avpu).toBe('bewusstlos')
    expect(store.doku.xabcDe.gcs).toMatchObject({ a: 1, v: 1, m: 1 })

    chip.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(plain(store.doku)).toEqual(before)
  })

  test.each([false, true])('restores indirect changes with initial Non-Verbal=%s', async nonVerbal => {
    const store = useDokuStore()
    store.doku.flavors.non_verbal = nonVerbal
    seedFindings(store)
    mountClinicalCards()
    const before = plain(store.doku)

    store.setFlavor('reanimation', true)
    expect(store.doku.xaBcde.mechanics.pattern).toBe('')
    expect(store.doku.xAbcde.mucosa.e).toBe('bläulich')
    expect(store.doku.xabcDe.psych.baseline).toBe(false)
    if (!nonVerbal) {
      expect(store.doku.xabcDe.headache).toBe(false)
      expect(store.doku.xabcdE.abdominal.value.pain).toBe('keine')
    }
    await nextTick()
    store.setFlavor('reanimation', false)
    expect(plain(store.doku)).toEqual(before)
    await nextTick()
    expect(plain(store.doku)).toEqual(before)
    expect(typeof store.doku.xaBcde.generateText).toBe('function')
  })

  test('preserves subsequent direct, indirect and unrelated edits during restoration', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    store.setFlavor('reanimation', true)
    store.doku.xabCde.skin.color = 'marmoriert'
    store.doku.xabCde.pulse.centralStrength = 'schlecht'
    store.doku.xabcDe.gcs.v = 2
    store.doku.xaBcde.mechanics.frequency = 'Bradypnoe'
    store.doku.xaBcde.auscultation.value.crackles = 'bds.'
    store.doku.xabcdE.abdominal.value.pain = 'leichte'
    store.doku.xaBcde.treatment = 'New treatment'
    store.doku.situation.setText('New situation')

    store.setFlavor('reanimation', false)
    await nextTick()
    expect(store.doku.xabCde.skin.color).toBe('marmoriert')
    expect(store.doku.xabCde.pulse.centralStrength).toBe('schlecht')
    expect(store.doku.xabCde.pulse.peripheralStrength).toBe('schlecht')
    expect(store.doku.xabcDe.gcs).toMatchObject({ a: 4, v: 2, m: 6 })
    expect(store.doku.xaBcde.mechanics).toEqual({ pattern: 'Kußmaul-Atmung', frequency: 'Bradypnoe', depth: 'Vertieft' })
    expect(store.doku.xaBcde.auscultation.value.crackles).toBe('bds.')
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('leichte')
    expect(store.doku.xaBcde.treatment).toBe('New treatment')
    expect(store.doku.situation.value).toBe('New situation')
    expect(store.doku.xAbcde.hasStridor).toBe(true)
  })

  test('restores an edited field returned to its preset value', () => {
    const store = useDokuStore()
    store.doku.xabCde.skin.color = 'blass'
    store.setFlavor('reanimation', true)
    store.doku.xabCde.skin.color = 'rosig'
    store.doku.xabCde.skin.color = 'zyanotisch'
    store.setFlavor('reanimation', false)
    expect(store.doku.xabCde.skin.color).toBe('blass')
  })

  test('handles rapid cycles and repeated activation without replacing the snapshot', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    const before = plain(store.doku)
    store.setFlavor('reanimation', true)
    store.setFlavor('reanimation', true)
    store.setFlavor('reanimation', false)
    expect(plain(store.doku)).toEqual(before)

    store.doku.xabCde.skin.color = 'marmoriert'
    const next = plain(store.doku)
    store.setFlavor('reanimation', true)
    store.setFlavor('reanimation', false)
    store.setFlavor('reanimation', false)
    await nextTick()
    expect(plain(store.doku)).toEqual(next)
  })

  test('keeps the snapshot across component remounts', async () => {
    const store = useDokuStore()
    seedFindings(store)
    const before = plain(store.doku)
    const cards = mountClinicalCards()
    const flavors = shallowMount(FlavorsCard)
    store.setFlavor('reanimation', true)
    cards.forEach(card => card.unmount())
    flavors.unmount()
    mountClinicalCards()
    shallowMount(FlavorsCard)
    store.setFlavor('reanimation', false)
    await nextTick()
    expect(plain(store.doku)).toEqual(before)
  })

  test('Fehlfahrt clears clinical data and discards the snapshot', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    store.setFlavor('reanimation', true)
    store.setFlavor('no_emergency_call', true)
    store.setFlavor('reanimation', false)
    await nextTick()
    const empty = resetProtocol()
    for (const key of ['xAbcde', 'xaBcde', 'xabCde', 'xabcDe', 'xabcdE'] as const) {
      expect(plain(store.doku[key])).toEqual(plain(empty[key]))
    }
    store.setFlavor('no_emergency_call', false)
    const before = plain(store.doku)
    store.setFlavor('reanimation', true)
    store.setFlavor('reanimation', false)
    await nextTick()
    expect(plain(store.doku)).toEqual(before)
  })

  test('a saved and reloaded protocol has no restoration data', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    store.setFlavor('reanimation', true)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(Object.keys(saved.doku as object)).toEqual(Object.keys(resetProtocol()))
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    await store.hydrateFromStorage()
    await nextTick()
    const before = plain(store.doku)
    store.setFlavor('reanimation', false)
    await nextTick()
    before.flavors.reanimation = false
    expect(plain(store.doku)).toEqual(before)
  })

  test('resetting and reopening history never reuses the old snapshot', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    store.setFlavor('reanimation', true)
    await store.newProtocol()
    await nextTick()
    expect(plain(store.doku)).toEqual(plain(resetProtocol()))
    const id = store.protocolHistory[0].id
    store.setFlavor('reanimation', true)
    expect(await store.restoreProtocolFromHistory(id)).toBe(true)
    await nextTick()
    const before = plain(store.doku)
    store.setFlavor('reanimation', false)
    await nextTick()
    before.flavors.reanimation = false
    expect(plain(store.doku)).toEqual(before)
  })

  test('dependent watchers still handle ordinary clinical edits', async () => {
    const store = useDokuStore()
    seedFindings(store)
    mountClinicalCards()
    store.setFlavor('reanimation', true)
    store.setFlavor('reanimation', false)

    store.doku.xAbcde.isBreathing = false
    store.doku.xabCde.pulse.centralStrength = 'nicht'
    store.setFlavor('non_verbal', true)
    await nextTick()
    expect(store.doku.xAbcde.hasStridor).toBe(false)
    expect(store.doku.xaBcde.mechanics.pattern).toBe('')
    expect(store.doku.xaBcde.hasHypoxia).toBe(true)
    expect(store.doku.xabCde.pulse.peripheralStrength).toBe('nicht')
    expect(store.doku.xabcDe.headache).toBe(false)
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('keine')
  })
})
