import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, mount, shallowMount } from '@vue/test-utils'
import * as Ionic from '@ionic/vue'
import { IonItem, IonModal, IonPopover } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createSchwangerschaftBlockState, pregnancySpanFromTerm, pregnancyTermFromSpan,
  SchwangerschaftTextAreaBlock,
} from '@/data/schwangerschaft'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { PatientAge, ProtocolVerbosity } from '@/types/protocol'
import { AssessedValue } from '@/types/protocol/input'
import { PregnancySpan } from '@/types/protocol/pregnancy'
import DodoExaminationCard from '@/components/DodoExaminationCard.vue'
import DodoInputGravTerm from '@/components/DodoInputGravTerm.vue'
import DodoInputNumber from '@/components/DodoInputNumber.vue'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoInputToggle from '@/components/DodoInputToggle.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import AbcdeExposureCard from '@/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'
import SamplePlerCard from '@/views/dokuCards/sampleCards/SamplePlerCard.vue'
import BlockSchwangerschaftCard from '@/views/dokuCards/blocksourceCards/BlockSchwangerschaftCard.vue'

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
  vi.mocked(loadDokuState).mockResolvedValue(null)
})
afterEach(() => vi.useRealTimers())

const blockId = 'schwangerschaft.pler'
const rendered = new SchwangerschaftTextAreaBlock()

function setup() {
  const store = useDokuStore()
  store.setPregnancyAssessed(true)
  store.doku.textAreaBlocks.schwangerschaft.details.gravida = AssessedValue.assessed(2)
  store.doku.sampler.pler.PLER.setText('Eigener Text')
  return store
}

describe('pregnancy findings in E', () => {
  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])(
    'renders absent/on/off independently of verbosity %s', verbosity => {
      const store = useDokuStore()
      if (verbosity === ProtocolVerbosity.NORMAL) store.doku.xaBcde.breathlessness = 'leichte'
      if (verbosity === ProtocolVerbosity.HIGH) store.doku.xAbcde.isBreathing = false
      expect(store.context.verbosity).toBe(verbosity)
      expect(store.doku.xabcdE.generateText()).not.toContain('Schwangerschaft')
      store.setPregnancyAssessed(true)
      expect(store.doku.xabcdE.generateText()).toContain('Schwangerschaft')
      expect(store.doku.xabcdE.generateText()).not.toContain('ausgeschlossen')
      expect(store.doku.xabcdE.needTreatment).toBe(false)
      store.setPregnancy(false)
      expect(store.doku.xabcdE.generateText()).toContain('Schwangerschaft ausgeschlossen')
      store.setPregnancyAssessed(false)
      expect(store.doku.xabcdE.generateText()).not.toContain('Schwangerschaft')
      store.setPregnancyAssessed(true)
      expect(store.doku.xabcdE.pregnancy.matches(true)).toBe(true)
    },
  )

  test('picker respects age boundaries, adds on, and keeps an added item editable after age changes', async () => {
    const store = useDokuStore()
    const exposure = mount(AbcdeExposureCard, {
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
          DodoInputTemperature: true,
        },
      },
    })
    const card = exposure.getComponent(DodoExaminationCard)
    const picker = card.getComponent(IonPopover)
    const pregnancyRow = () => picker.find('[data-examination="pregnancy"]')
    for (const [age, available] of [[9, false], [10, true], [52, true], [53, false]] as const) {
      store.doku.ident.age = new PatientAge(age, 'years')
      await nextTick()
      expect(pregnancyRow().exists()).toBe(available)
    }
    store.doku.ident.age = new PatientAge(30, 'years')
    await nextTick()
    await card.get('.add-examination').trigger('click')
    await pregnancyRow().trigger('click')
    expect(store.doku.xabcdE.pregnancy.matches(true)).toBe(true)
    store.doku.ident.age = new PatientAge(53, 'years')
    await nextTick()
    const row = card.get('.examination-item[data-examination="pregnancy"]')
    const toggle = exposure.findAllComponents(DodoInputToggle).find(input => input.text() === 'Schwangerschaft')!
    toggle.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.xabcdE.pregnancy.matches(false)).toBe(true)
    await row.get('.remove-examination').trigger('click')
    expect(store.doku.xabcdE.pregnancy.isAssessed).toBe(false)
    expect(pregnancyRow().exists()).toBe(false)
  })
})

describe('pregnancy block rendering and editing', () => {
  test('starts empty, accepts partial findings and preserves full detail wording and order', () => {
    const state = createSchwangerschaftBlockState()
    expect(rendered.render(state)).toBeNull()
    state.details.para = AssessedValue.assessed(0)
    expect(rendered.render(state)?.text).toBe('Schwangerschaft: G? P0.')
    state.details.gravida = AssessedValue.assessed(2)
    state.details.childCount = 'Zwillinge'
    state.details.presentation = 'SL'
    state.details.amnioticFluid = 'Kein Fruchtwasserabgang'
    state.details.calculatedTerm = { approx: '2. Trimenon', date: '' }
    expect(rendered.render(state)).toMatchObject({
      id: blockId, target: 'sampler.pler.PLER', active: true,
      text: 'Schwangerschaft: G2 P0; Zwillinge; Kindslage SL, Kein Fruchtwasserabgang, Termin unklar, ca. 2. Trimenon.',
    })
  })

  test('stores exact dates as local calendar strings and calculates SSW at rendering time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 13, 12))
    const state = createSchwangerschaftBlockState()
    state.details.calculatedTerm = pregnancyTermFromSpan(new PregnancySpan(new Date(2026, 11, 3)))
    expect(state.details.calculatedTerm).toEqual({ approx: '', date: '2026-12-03' })
    expect(rendered.render(state)?.text).toBe('Schwangerschaft: SSW 24+0, errechneter Termin 03.12.2026.')
    vi.setSystemTime(new Date(2026, 7, 15, 12))
    expect(rendered.render(state)?.text).toContain('SSW 24+2')
    expect(pregnancySpanFromTerm({ approx: '', date: '2026-02-31' })).toBeNull()
    state.details.calculatedTerm = pregnancyTermFromSpan(null)
    expect(rendered.render(state)).toBeNull()
  })

  test('modal precedes PLER editing, starts empty, updates live, and keeps manual text and undo independent', async () => {
    const store = useDokuStore()
    const pler = shallowMount(SamplePlerCard, {
      global: { renderStubDefaultSlot: true, stubs: { BlockSchwangerschaftCard: false, DodoItemModal: false } },
    })
    expect(pler.findComponent(BlockSchwangerschaftCard).exists()).toBe(false)
    store.setPregnancyAssessed(true)
    await nextTick()
    const modal = pler.getComponent(DodoItemModal)
    const editor = pler.getComponent(DodoInputTextArea)
    expect(modal.getComponent(IonItem).element.nextElementSibling?.nextElementSibling).toBe(editor.element)
    expect(modal.props('state')).toBe('Keine Angabe')
    await modal.getComponent(IonItem).trigger('click')
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(true)
    expect(store.textAreaBlocks).toEqual([])
    const manual = store.doku.sampler.pler.PLER
    manual.setText('Vorher')
    manual.setText('Eigener Text')
    modal.findAllComponents(DodoInputNumber)[0].vm.$emit('update:modelValue', AssessedValue.assessed(2))
    modal.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Kindslage')!
      .vm.$emit('update:modelValue', 'BEL')
    modal.getComponent(DodoInputGravTerm).vm.$emit('update:modelValue', new PregnancySpan('3. Trimenon'))
    await nextTick()
    expect(modal.props('state')).toBe('')
    const expected = 'Schwangerschaft: G2 P?; Kindslage BEL, Termin unklar, ca. 3. Trimenon.'
    expect(editor.props('blocks')?.[0].text).toBe(expected)
    expect(store.generatedProtocol).toContain(`${expected}\nEigener Text`)
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain('Schwangerschaft:')
    expect(store.doku.xabcdE.generateText()).toContain('Schwangerschaft')
    expect(manual.value).toBe('Eigener Text')
    manual.undo()
    expect(manual.value).toBe('Vorher')
    modal.getComponent(DodoInputGravTerm).vm.$emit('update:modelValue', null)
    await nextTick()
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Schwangerschaft: G2 P?; Kindslage BEL.' })
    store.setPregnancy(false)
    await nextTick()
    expect(pler.findComponent(BlockSchwangerschaftCard).exists()).toBe(false)
    expect(editor.props('blocks')).toEqual([])
  })
})

describe('pregnancy block lifecycle', () => {
  test.each(['off', 'remove', 'no_emergency_call'] as const)('%s clears details and activation without changing manual PLER', action => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    if (action === 'off') store.setPregnancy(false)
    else if (action === 'remove') store.setPregnancyAssessed(false)
    else store.setFlavor('no_emergency_call', true)
    expect(store.doku.textAreaBlocks.schwangerschaft).toEqual(createSchwangerschaftBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.pler.PLER.value).toBe('Eigener Text')
    store.setPregnancyAssessed(true)
    store.setPregnancy(true)
    expect(store.textAreaBlocks).toEqual([])
  })

  test.each([true, false])('persists details, dates and activation=%s and restores them from history', async active => {
    const store = setup()
    store.doku.textAreaBlocks.schwangerschaft.details.calculatedTerm = { approx: '', date: '2027-03-24' }
    store.setTextAreaBlockActive(blockId, active)
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.xabcdE.pregnancy.matches(true)).toBe(true)
    expect(restored.doku.textAreaBlocks.schwangerschaft).toEqual(store.doku.textAreaBlocks.schwangerschaft)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active, text: expect.stringContaining('24.03.2027') })
    await restored.newProtocol()
    expect(restored.doku.xabcdE.pregnancy.isAssessed).toBe(false)
    expect(restored.doku.textAreaBlocks.schwangerschaft).toEqual(createSchwangerschaftBlockState())
    expect(await restored.restoreProtocolFromHistory(restored.protocolHistory[0].id)).toBe(true)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active, text: expect.stringContaining('G2 P?') })
    expect(restored.doku.textAreaBlocks.schwangerschaft.details.calculatedTerm.date).toBe('2027-03-24')
  })

  test('old saved pregnancy prose remains manual and does not create a finding or block', async () => {
    const text = 'Schwangerschaft: G2 P0.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      sampler: { pler: { PLER: { _text: text } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcdE.pregnancy.isAssessed).toBe(false)
    expect(store.doku.textAreaBlocks.schwangerschaft).toEqual(createSchwangerschaftBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.pler.PLER.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })

  test('hydration clears stale pregnancy details when excluded', async () => {
    const store = setup()
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    saved.doku.xabcdE.pregnancy.value = false
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    await store.hydrateFromStorage()
    expect(store.doku.xabcdE.pregnancy.matches(false)).toBe(true)
    expect(store.doku.textAreaBlocks.schwangerschaft).toEqual(createSchwangerschaftBlockState())
  })

  test('quickie reset does not restore the removed pregnancy quickie', () => {
    resetQuickies()
    expect(DATA_Quickies).not.toHaveProperty('pler_schwangerschaft')
  })
})
