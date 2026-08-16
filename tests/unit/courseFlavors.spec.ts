import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoToggleButton from '@/components/DodoToggleButton.vue'
import DodoToggleChip from '@/components/DodoToggleChip.vue'
import { QU_SIT_Einweisung, QU_SIT_Verlegung } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { loadDokuState } from '@/store/persistence'
import { ProtocolCourse } from '@/types/protocol'
import DetailLevelCard from '@/views/dokuCards/DetailLevelCard.vue'
import FlavorsCard from '@/views/dokuCards/FlavorsCard.vue'
import SituationCard from '@/views/dokuCards/SituationCard.vue'
import TreatmentTasksCard from '@/views/dokuCards/treatmentCards/TreatmentTasksCard.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  saveDokuState: vi.fn(),
}))

const mountFlavors = () => shallowMount(FlavorsCard, {
  global: {
    renderStubDefaultSlot: true,
  },
})

const flavorLabels = (wrapper: ReturnType<typeof mountFlavors>) => wrapper
  .findAllComponents(DodoToggleChip)
  .map((chip) => chip.text().trim())

describe('Verlegung and Einweisung flavors', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(loadDokuState).mockReset()
  })

  test.each([
    [1, 'verlegung'],
    [2, 'einweisung'],
  ] as const)('migrates legacy course %i to the %s flavor', async (legacyCourse, flavor) => {
    vi.mocked(loadDokuState).mockResolvedValue({
      schemaVersion: 1,
      doku: {
        course: legacyCourse,
        flavors: {
          trauma: true,
        },
        situation: {
          _text: 'Persisted situation',
        },
      },
    })

    const store = useDokuStore()
    await store.hydrateFromStorage()

    expect(store.doku.course).toBe(ProtocolCourse.TRANSPORT)
    expect(store.doku.flavors[flavor]).toBe(true)
    expect(store.doku.flavors.trauma).toBe(true)
    expect(store.doku.situation.value).toBe('Persisted situation')
  })

  test('preserves the persisted NEF course value', async () => {
    vi.mocked(loadDokuState).mockResolvedValue({
      schemaVersion: 1,
      doku: {
        course: 3,
      },
    })

    const store = useDokuStore()
    await store.hydrateFromStorage()

    expect(store.doku.course).toBe(ProtocolCourse.NEF_VOR_ORT)
    expect(store.doku.flavors.verlegung).toBe(false)
    expect(store.doku.flavors.einweisung).toBe(false)
  })

  test('keeps only Transport and NEF in the course selector', () => {
    const wrapper = shallowMount(DetailLevelCard, {
      global: { renderStubDefaultSlot: true },
    })
    const courses = wrapper.findAllComponents(DodoToggleButton)

    expect(courses.map((course) => course.text().trim())).toEqual([
      'Behandlung / Transport',
      'NEF vor Ort (keine Maßnahmen)',
    ])
    expect(courses.map((course) => course.props('value'))).toEqual([
      ProtocolCourse.TRANSPORT,
      ProtocolCourse.NEF_VOR_ORT,
    ])
  })

  test('keeps the blue flavors mutually exclusive without clearing clinical data', () => {
    const store = useDokuStore()
    store.doku.flavors.trauma = true
    store.doku.xAbcde.obstruction = 'retained'

    store.setFlavor('verlegung', true)
    expect(store.doku.flavors.verlegung).toBe(true)
    expect(store.doku.flavors.einweisung).toBe(false)
    expect(store.doku.flavors.no_emergency_call).toBe(false)

    store.setFlavor('einweisung', true)
    expect(store.doku.flavors.verlegung).toBe(false)
    expect(store.doku.flavors.einweisung).toBe(true)
    expect(store.doku.flavors.no_emergency_call).toBe(false)
    expect(store.doku.flavors.trauma).toBe(true)
    expect(store.doku.xAbcde.obstruction).toBe('retained')
  })

  test('shows flavors in the requested order and applies tiered visibility', async () => {
    const store = useDokuStore()
    const wrapper = mountFlavors()

    expect(flavorLabels(wrapper)).toEqual([
      'Fehlfahrt',
      'Verlegung',
      'Einweisung',
      'Trauma',
      'Reanimation',
      'Non-Verbal',
    ])
    expect(wrapper.findAllComponents(DodoToggleChip).slice(0, 3)
      .every((chip) => chip.props('color') === 'primary')).toBe(true)

    store.setFlavor('verlegung', true)
    await nextTick()
    expect(flavorLabels(wrapper)).toEqual(['Verlegung', 'Non-Verbal'])

    store.setFlavor('verlegung', false)
    store.setFlavor('einweisung', true)
    await nextTick()
    expect(flavorLabels(wrapper)).toEqual([
      'Einweisung',
      'Trauma',
      'Reanimation',
      'Non-Verbal',
    ])

    store.setFlavor('reanimation', true)
    await nextTick()
    expect(flavorLabels(wrapper)).toEqual(['Einweisung', 'Trauma', 'Reanimation'])
  })

  test('uses the former Verlegung context, quickie, and optional treatment', () => {
    const store = useDokuStore()
    store.setFlavor('verlegung', true)

    expect(store.context).toMatchObject({
      requireSceneDetails: false,
      requireABCDE: false,
      requireSampler: false,
      requireSaamed: true,
      requireRedflags: false,
      isVerlegung: true,
      isEinweisung: false,
    })

    const situation = shallowMount(SituationCard, {
      global: { renderStubDefaultSlot: true },
    })
    expect(situation.findComponent(DodoInputTextArea).props('quickieKeys')).toEqual([QU_SIT_Verlegung])

    const treatment = shallowMount(TreatmentTasksCard, {
      global: { renderStubDefaultSlot: true },
    })
    expect(treatment.findComponent(DodoInputTextArea).props('mandatory')).toBe(false)
  })

  test('uses the former Einweisung context and enables its clinical flavors', () => {
    const store = useDokuStore()
    store.setFlavor('einweisung', true)
    store.setFlavor('trauma', true)
    store.setFlavor('non_verbal', true)

    expect(store.context).toMatchObject({
      requireSceneDetails: false,
      requireABCDE: true,
      requireSampler: true,
      requireSampleSymptoms: true,
      requireSaamed: true,
      requireRedflags: true,
      isVerlegung: false,
      isEinweisung: true,
      isTrauma: true,
      isNonVerbal: true,
    })

    const situation = shallowMount(SituationCard, {
      global: { renderStubDefaultSlot: true },
    })
    expect(situation.findComponent(DodoInputTextArea).props('quickieKeys')).toEqual([QU_SIT_Einweisung])

    const treatment = shallowMount(TreatmentTasksCard, {
      global: { renderStubDefaultSlot: true },
    })
    expect(treatment.findComponent(DodoInputTextArea).props('mandatory')).toBe(false)
  })

  test.each([
    ['verlegung', false, false, true, false],
    ['einweisung', true, true, true, true],
  ] as const)(
    '%s gates generated protocol blocks like its former course',
    (flavor, hasAbcde, hasSampler, hasSaamed, hasRedflags) => {
      const store = useDokuStore()
      store.setFlavor(flavor, true)
      store.doku.situation.setText('SITUATION_MARKER')
      store.doku.sampler.symptoms.additionalSymptoms.setText('SAMPLE_MARKER')
      store.doku.treatment.setText('TREATMENT_MARKER')

      vi.spyOn(store.doku.setting, 'generateText').mockReturnValue('SETTING_MARKER')
      vi.spyOn(store.doku.Xabcde, 'generateText').mockReturnValue('ABCDE_MARKER')
      vi.spyOn(store.doku.sampler.allergies, 'generateText').mockReturnValue('SAMPLER_MARKER')
      vi.spyOn(store.doku.saamed, 'getBlock').mockReturnValue('SAAMED_MARKER')
      vi.spyOn(store.doku.redflags, 'getConsentBlock').mockReturnValue('REDFLAGS_MARKER')
      vi.spyOn(store.doku.redflags, 'getRedflagBlock').mockReturnValue('')

      const protocol = store.generatedProtocol
      expect(protocol).not.toContain('SETTING_MARKER')
      expect(protocol.includes('ABCDE_MARKER')).toBe(hasAbcde)
      expect(protocol.includes('SAMPLER_MARKER')).toBe(hasSampler)
      expect(protocol.includes('SAAMED_MARKER')).toBe(hasSaamed)
      expect(protocol.includes('REDFLAGS_MARKER')).toBe(hasRedflags)
      expect(protocol).toContain('SITUATION_MARKER')
      expect(protocol).toContain('TREATMENT_MARKER')
    },
  )
})
