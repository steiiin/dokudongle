import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'
import { DisabilityPsych } from '@/types/protocol/abcde'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'
import DodoInputSelectLR from '@/components/DodoInputSelectLR.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('DisabilityPsych', () => {
  test('keeps normal findings empty in protocol text', () => {
    const disability = useDokuStore().doku.xabcDe
    expect(disability.psych.value).toBeInstanceOf(DisabilityPsych)
    expect(disability.psych.value.state).toBe('normal')
    expect(disability.psych.value.text).toBe('')
    expect(disability.psych.value.hasAbnormalities).toBe(false)
    expect(disability.needTreatment).toBe(false)
    expect(disability.couldBeBaseline).toBe(false)

    disability.baseline = true
    expect(disability.psych.value.hasAbnormalities).toBe(false)
    expect(disability.needTreatment).toBe(false)
  })

  test('preserves psychiatric wording and order in generated disability text', () => {
    const disability = useDokuStore().doku.xabcDe
    Object.assign(disability.psych.value, {
      rass: 'agitiert', disorder: 'Delir', hallucinations: true, delusions: true,
      behavioralChange: true, perseveration: true,
    })
    disability.psych.assessed = true
    disability.psych.value.dementia = true
    disability.baseline = true
    const text = 'agitiert; deliranter Zustand; halluziniert; wahnhaft; wesensverändert; verbale Perseveration; bek. Demenz'
    expect(disability.psych.value.text).toBe(text)
    expect(disability.psych.value.state).toBe(text)
    expect(disability.generateText()).toContain(`${text}; baseline: nichts akutes`)
    expect(disability.needTreatment).toBe(true)
    expect(disability.couldBeBaseline).toBe(true)

    disability.psych.value.disorder = 'Stupor'
    expect(disability.psych.value.disorderText).toBe('stuporöser Zustand')
  })

  test.each([
    { rass: 'unruhig' }, { disorder: 'Stupor' }, { hallucinations: true },
    { delusions: true }, { behavioralChange: true }, { perseveration: true },
  ] satisfies Partial<DisabilityPsych>[])('recognizes an isolated acute finding: %j', (finding) => {
    const disability = useDokuStore().doku.xabcDe
    Object.assign(disability.psych.value, finding)
    disability.psych.assessed = true
    expect(disability.psych.value.needTreatment).toBe(true)
    expect(disability.psych.value.hasAbnormalities).toBe(true)
    expect(disability.needTreatment).toBe(true)
    expect(disability.couldBeBaseline).toBe(true)
  })

  test('recognizes dementia without requiring treatment', () => {
    const disability = useDokuStore().doku.xabcDe
    disability.psych.assessed = true
    disability.psych.value.dementia = true
    expect(disability.generateText()).toContain('bek. Demenz')
    expect(disability.psych.value.state).toBe('bek. Demenz')
    expect(disability.psych.value.hasAbnormalities).toBe(true)
    expect(disability.psych.value.needTreatment).toBe(false)
    expect(disability.needTreatment).toBe(false)
    expect(disability.couldBeBaseline).toBe(true)
  })

  test('uses independent baseline and dementia in store context', () => {
    const store = useDokuStore()
    store.doku.xabcDe.avpu = 'bewusstlos'
    expect(store.context.isCritical).toBe(true)
    expect(store.context.isLowVigilant).toBe(true)

    store.doku.xabcDe.baseline = true
    expect(store.context.isCritical).toBe(false)
    expect(store.context.isLowVigilant).toBe(false)

    store.doku.xabcDe.baseline = false
    store.doku.xabcDe.psych.assessed = true
    store.doku.xabcDe.psych.value.dementia = true
    expect(store.context.isCritical).toBe(true)
    expect(store.context.isLowVigilant).toBe(false)
  })

  test('clears baseline when the card no longer has eligible findings', async () => {
    const disability = useDokuStore().doku.xabcDe
    disability.psych.assessed = true
    disability.psych.value.dementia = true
    disability.baseline = true
    const wrapper = shallowMount(AbcdeDisabilityCard)
    expect(disability.baseline).toBe(true)

    disability.psych.value.dementia = false
    await nextTick()
    expect(disability.couldBeBaseline).toBe(false)
    expect(disability.baseline).toBe(false)
    wrapper.unmount()
  })
})

describe('Disability card paired motor assessments', () => {
  test('binds each side to the corresponding arm or leg field', async () => {
    const neuro = useDokuStore().doku.xabcDe.neuro.value
    const wrapper = shallowMount(AbcdeDisabilityCard, {
      global: { renderStubDefaultSlot: true },
    })
    const pairs = wrapper.findAllComponents(DodoInputSelectLR)
    expect(pairs.map(pair => pair.props('label'))).toEqual(['Armhalteversuch', 'Beinhalteversuch'])

    pairs[0].vm.$emit('update:left', 'Absinken')
    pairs[0].vm.$emit('update:right', 'leichtes Absinken')
    pairs[1].vm.$emit('update:left', 'nur Restbewegungen')
    pairs[1].vm.$emit('update:right', 'keine aktive Bewegung')
    await nextTick()

    expect([neuro.msArmLeft, neuro.msArmRight, neuro.msLegLeft, neuro.msLegRight])
      .toEqual(['Absinken', 'leichtes Absinken', 'nur Restbewegungen', 'keine aktive Bewegung'])
    expect(pairs.map(pair => [pair.props('left'), pair.props('right')]))
      .toEqual([['Absinken', 'leichtes Absinken'], ['nur Restbewegungen', 'keine aktive Bewegung']])
    wrapper.unmount()
  })
})

describe('psychiatric persistence', () => {
  const legacy = {
    psychRass: 'sehr agitiert', psychDisorder: 'Delir', psychHallucinations: true,
    psychDelusions: true, psychDementia: true, psychPerseveration: true,
    psychBehavioralChange: true, psychBaseline: true,
  }
  const nested = {
    rass: 'sehr agitiert', disorder: 'Delir', hallucinations: true,
    delusions: true, dementia: true, perseveration: true,
    behavioralChange: true, baseline: true,
  }

  const psychiatric = {
    rass: nested.rass, disorder: nested.disorder, hallucinations: nested.hallucinations,
    dementia: nested.dementia, delusions: nested.delusions, perseveration: nested.perseveration, behavioralChange: nested.behavioralChange,
  }

  test.each(['saved', 'temporary'] as const)('migrates all legacy fields from a %s protocol', async (source) => {
    const payload = {
      schemaVersion: 1, savedAt: new Date().toISOString(), doku: { xabcDe: legacy },
    }
    const store = useDokuStore()
    if (source === 'saved') {
      vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      await store.hydrateFromStorage()
    } else {
      vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      await store.hydrateFromStorage()
      await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
    }
    expect(store.doku.xabcDe.psych.value).toBeInstanceOf(DisabilityPsych)
    expect(store.doku.xabcDe.psych.value).toEqual(psychiatric)
    expect(store.doku.xabcDe.psych.value.disorderText).toBe('deliranter Zustand')

    await store.persistToStorage()
    const persisted = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(persisted.schemaVersion).toBe(1)
    expect(persisted.doku.xabcDe.psych.value).toEqual(psychiatric)
    expect(persisted.doku.xabcDe.psych.assessed).toBe(true)
    expect(persisted.doku.xabcDe).not.toHaveProperty('dementia')
    expect(persisted.doku.xabcDe.baseline).toBe(true)
    for (const key of Object.keys(legacy)) {
      expect(persisted.doku.xabcDe).not.toHaveProperty(key)
    }
  })

  test('prefers explicit nested empty and false values, then legacy values, then defaults', async () => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1,
      doku: { xabcDe: {
        psychRass: 'agitiert', psychDisorder: 'Delir', psychHallucinations: true,
        psychBaseline: true, psychDementia: true,
        psych: { rass: '', disorder: '', hallucinations: false, baseline: false },
      } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value).toEqual({
      rass: '', disorder: '', hallucinations: false,
      dementia: true, delusions: false, perseveration: false, behavioralChange: false,
    })
  })

  test.each([undefined, {}, { psych: nested }])('hydrates missing or nested psychiatric data: %j', async (xabcDe) => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value).toBeInstanceOf(DisabilityPsych)
    expect(store.doku.xabcDe.psych.value).toEqual(xabcDe?.psych ? psychiatric : new DisabilityPsych())
    expect(store.doku.xabcDe.psych.value.state).toBe(xabcDe?.psych ? store.doku.xabcDe.psych.value.text : 'normal')
  })
})
