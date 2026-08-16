import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoToggleChip from '@/components/DodoToggleChip.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState } from '@/store/persistence'
import { resetProtocol } from '@/types/protocol'
import FlavorsCard from '@/views/dokuCards/FlavorsCard.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  saveDokuState: vi.fn(),
}))

describe('Fehlfahrt flavor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockReset()
  })

  test('defaults missing persisted flavor state to false', async () => {
    vi.mocked(loadDokuState).mockResolvedValue({
      schemaVersion: 1,
      doku: {
        flavors: {
          trauma: true,
          non_verbal: false,
          reanimation: false,
        },
      },
    })

    const store = useDokuStore()
    await store.hydrateFromStorage()

    expect(store.doku.flavors).toEqual({
      no_emergency_call: false,
      trauma: true,
      non_verbal: false,
      reanimation: false,
    })
  })

  test('selecting Fehlfahrt is exclusive and clears excluded clinical data', () => {
    const store = useDokuStore()
    store.doku.flavors.trauma = true
    store.doku.flavors.non_verbal = true
    store.doku.flavors.reanimation = true
    store.doku.Xabcde.description.setText('critical bleeding')
    store.doku.xAbcde.obstruction = 'blocked'
    store.doku.saamed.medTasks.push({} as never)
    store.doku.redflags.consent = 'Fähig'
    store.doku.situation.setText('Situation retained')
    store.doku.sampler.symptoms.additionalSymptoms.setText('SAMPLE retained')
    store.doku.sampler.pler.PLER.setText('Other SAMPLE retained')
    store.doku.treatment.setText('Measures retained')

    const previousXabcde = store.doku.Xabcde
    const previousXAbcde = store.doku.xAbcde
    const previousXaBcde = store.doku.xaBcde
    const previousXabCde = store.doku.xabCde
    const previousXabcDe = store.doku.xabcDe
    const previousXabcdE = store.doku.xabcdE
    const previousSaamed = store.doku.saamed
    const previousRedflags = store.doku.redflags

    store.setFlavor('no_emergency_call', true)

    expect(store.doku.flavors).toEqual({
      no_emergency_call: true,
      trauma: false,
      non_verbal: false,
      reanimation: false,
    })
    expect(store.doku.Xabcde).not.toBe(previousXabcde)
    expect(store.doku.xAbcde).not.toBe(previousXAbcde)
    expect(store.doku.xaBcde).not.toBe(previousXaBcde)
    expect(store.doku.xabCde).not.toBe(previousXabCde)
    expect(store.doku.xabcDe).not.toBe(previousXabcDe)
    expect(store.doku.xabcdE).not.toBe(previousXabcdE)
    expect(store.doku.saamed).not.toBe(previousSaamed)
    expect(store.doku.redflags).not.toBe(previousRedflags)

    const emptyProtocol = resetProtocol()
    expect(store.doku.Xabcde).toEqual(emptyProtocol.Xabcde)
    expect(store.doku.xAbcde).toEqual(emptyProtocol.xAbcde)
    expect(store.doku.xaBcde).toEqual(emptyProtocol.xaBcde)
    expect(store.doku.xabCde).toEqual(emptyProtocol.xabCde)
    expect(store.doku.xabcDe).toEqual(emptyProtocol.xabcDe)
    expect(store.doku.xabcdE).toEqual(emptyProtocol.xabcdE)
    expect(store.doku.saamed).toEqual(emptyProtocol.saamed)
    expect(store.doku.redflags).toEqual(emptyProtocol.redflags)
    expect(store.doku.situation.value).toBe('Situation retained')
    expect(store.doku.sampler.symptoms).toEqual(emptyProtocol.sampler.symptoms)
    expect(store.doku.sampler.pler.PLER.value).toBe('Other SAMPLE retained')
    expect(store.doku.treatment.value).toBe('Measures retained')
  })

  test('hides other flavor chips while Fehlfahrt is selected', async () => {
    const store = useDokuStore()
    const wrapper = shallowMount(FlavorsCard, {
      global: {
        renderStubDefaultSlot: true,
      },
    })

    const fehlfahrt = wrapper.findAllComponents(DodoToggleChip)
      .find((chip) => chip.text().includes('Fehlfahrt'))
    expect(fehlfahrt?.props('color')).toBe('primary')
    expect(wrapper.text()).toContain('Trauma')
    expect(wrapper.text()).toContain('Reanimation')
    expect(wrapper.text()).toContain('Non-Verbal')

    store.setFlavor('no_emergency_call', true)
    await nextTick()

    expect(wrapper.text()).toContain('Fehlfahrt')
    expect(wrapper.text()).not.toContain('Trauma')
    expect(wrapper.text()).not.toContain('Reanimation')
    expect(wrapper.text()).not.toContain('Non-Verbal')
    expect(wrapper.findAllComponents(DodoToggleChip)).toHaveLength(1)
  })

  test('suppresses excluded UI contexts and protocol blocks defensively', () => {
    const store = useDokuStore()
    store.doku.situation.setText('SITUATION_MARKER')
    store.doku.sampler.symptoms.additionalSymptoms.setText('SAMPLE_SYMPTOMS_MARKER')
    store.doku.sampler.pler.PLER.setText('OTHER_SAMPLE_MARKER')
    store.doku.treatment.setText('MEASURES_MARKER')

    vi.spyOn(store.doku.Xabcde, 'generateText').mockReturnValue('XABCDE_X_MARKER')
    vi.spyOn(store.doku.xAbcde, 'generateText').mockReturnValue('XABCDE_A_MARKER')
    vi.spyOn(store.doku.xaBcde, 'generateText').mockReturnValue('XABCDE_B_MARKER')
    vi.spyOn(store.doku.xabCde, 'generateText').mockReturnValue('XABCDE_C_MARKER')
    vi.spyOn(store.doku.xabcDe, 'generateText').mockReturnValue('XABCDE_D_MARKER')
    vi.spyOn(store.doku.xabcdE, 'generateText').mockReturnValue('XABCDE_E_MARKER')
    vi.spyOn(store.doku.saamed, 'getBlock').mockReturnValue('SAAMED_MARKER')
    vi.spyOn(store.doku.redflags, 'getConsentBlock').mockReturnValue('CONSENT_MARKER')
    vi.spyOn(store.doku.redflags, 'getRedflagBlock').mockReturnValue('REDFLAG_MARKER')

    // Set the state directly to verify output gates do not rely on the clearing action.
    store.doku.flavors.no_emergency_call = true

    expect(store.context.requireABCDE).toBe(false)
    expect(store.context.requireSampler).toBe(true)
    expect(store.context.requireSampleSymptoms).toBe(false)
    expect(store.context.requireSaamed).toBe(false)
    expect(store.context.requireRedflags).toBe(false)

    expect(store.generatedProtocol).toContain('SITUATION_MARKER')
    expect(store.generatedProtocol).toContain('OTHER_SAMPLE_MARKER')
    expect(store.generatedProtocol).toContain('MEASURES_MARKER')
    expect(store.generatedProtocol).not.toContain('SAMPLE_SYMPTOMS_MARKER')
    expect(store.generatedProtocol).not.toContain('XABCDE_')
    expect(store.generatedProtocol).not.toContain('SAAMED_MARKER')
    expect(store.generatedProtocol).not.toContain('CONSENT_MARKER')
    expect(store.generatedProtocol).not.toContain('REDFLAG_MARKER')
  })
})
