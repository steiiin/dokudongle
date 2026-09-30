import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'
import { DisabilityPsych } from '@/types/protocol/abcde'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
  saveTemporaryProtocolState: vi.fn(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('DisabilityPsych', () => {
  test('keeps normal findings empty in protocol text', () => {
    const disability = useDokuStore().doku.xabcDe
    expect(disability.psych).toBeInstanceOf(DisabilityPsych)
    expect(disability.psych.state).toBe('normal')
    expect(disability.psych.text).toBe('')
    expect(disability.psych.hasAbnormalities).toBe(false)
    expect(disability.needTreatment).toBe(false)
    expect(disability.couldBeBaseline).toBe(false)

    disability.psych.baseline = true
    expect(disability.psych.hasAbnormalities).toBe(false)
    expect(disability.needTreatment).toBe(false)
  })

  test('preserves psychiatric wording and order in generated disability text', () => {
    const disability = useDokuStore().doku.xabcDe
    Object.assign(disability.psych, {
      rass: 'agitiert', disorder: 'Delir', hallucinations: true, delusions: true,
      behavioralChange: true, perseveration: true, dementia: true, baseline: true,
    })
    const text = 'agitiert; deliranter Zustand; halluziniert; wahnhaft; wesensverändert; verbale Perseveration; bek. Demenz'
    expect(disability.psych.text).toBe(text)
    expect(disability.psych.state).toBe(text)
    expect(disability.generateText()).toContain(`${text}; baseline: nichts akutes`)
    expect(disability.needTreatment).toBe(true)
    expect(disability.couldBeBaseline).toBe(true)

    disability.psych.disorder = 'Stupor'
    expect(disability.psych.disorderText).toBe('stuporöser Zustand')
  })

  test.each([
    { rass: 'unruhig' }, { disorder: 'Stupor' }, { hallucinations: true },
    { delusions: true }, { behavioralChange: true }, { perseveration: true },
  ] satisfies Partial<DisabilityPsych>[])('recognizes an isolated acute finding: %j', (finding) => {
    const disability = useDokuStore().doku.xabcDe
    Object.assign(disability.psych, finding)
    expect(disability.psych.needTreatment).toBe(true)
    expect(disability.psych.hasAbnormalities).toBe(true)
    expect(disability.needTreatment).toBe(true)
    expect(disability.couldBeBaseline).toBe(true)
  })

  test('recognizes dementia without requiring treatment', () => {
    const disability = useDokuStore().doku.xabcDe
    disability.psych.dementia = true
    expect(disability.psych.state).toBe('bek. Demenz')
    expect(disability.psych.hasAbnormalities).toBe(true)
    expect(disability.psych.needTreatment).toBe(false)
    expect(disability.needTreatment).toBe(false)
    expect(disability.couldBeBaseline).toBe(true)
  })

  test('uses nested baseline and dementia in store context', () => {
    const store = useDokuStore()
    store.doku.xabcDe.avpu = 'bewusstlos'
    expect(store.context.isCritical).toBe(true)
    expect(store.context.isLowVigilant).toBe(true)

    store.doku.xabcDe.psych.baseline = true
    expect(store.context.isCritical).toBe(false)
    expect(store.context.isLowVigilant).toBe(false)

    store.doku.xabcDe.psych.baseline = false
    store.doku.xabcDe.psych.dementia = true
    expect(store.context.isCritical).toBe(true)
    expect(store.context.isLowVigilant).toBe(false)
  })

  test('clears nested baseline when the card no longer has eligible findings', async () => {
    const disability = useDokuStore().doku.xabcDe
    disability.psych.dementia = true
    disability.psych.baseline = true
    const wrapper = shallowMount(AbcdeDisabilityCard)
    expect(disability.psych.baseline).toBe(true)

    disability.psych.dementia = false
    await nextTick()
    expect(disability.couldBeBaseline).toBe(false)
    expect(disability.psych.baseline).toBe(false)
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
      await expect(store.restoreTemporaryProtocol()).resolves.toBe(true)
    }
    expect(store.doku.xabcDe.psych).toBeInstanceOf(DisabilityPsych)
    expect(store.doku.xabcDe.psych).toEqual(nested)
    expect(store.doku.xabcDe.psych.disorderText).toBe('deliranter Zustand')

    await store.persistToStorage()
    const persisted = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(persisted.schemaVersion).toBe(1)
    expect(persisted.doku.xabcDe.psych).toEqual(nested)
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
    expect(store.doku.xabcDe.psych).toEqual({
      rass: '', disorder: '', hallucinations: false, baseline: false,
      dementia: true, delusions: false, perseveration: false, behavioralChange: false,
    })
  })

  test.each([undefined, {}, { psych: nested }])('hydrates missing or nested psychiatric data: %j', async (xabcDe) => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych).toBeInstanceOf(DisabilityPsych)
    expect(store.doku.xabcDe.psych).toEqual(xabcDe?.psych ?? new DisabilityPsych())
    expect(store.doku.xabcDe.psych.state).toBe(xabcDe?.psych ? store.doku.xabcDe.psych.text : 'normal')
  })
})
