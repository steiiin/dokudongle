import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createBauchschmerzBlockState, BauchschmerzTextAreaBlock, renderBauchschmerzRegion } from '@/data/bauchschmerz'
import type { BauchschmerzRegion } from '@/types/bauchschmerz'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/DodoToggleChip.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import SampleSymptomsCard from '@/views/dokuCards/sampleCards/SampleSymptomsCard.vue'
import BlockBauchschmerzCard from '@/views/dokuCards/blocksourceCards/BlockBauchschmerzCard.vue'
import BlockSchwindelCard from '@/views/dokuCards/blocksourceCards/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '@/views/dokuCards/blocksourceCards/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '@/views/dokuCards/blocksourceCards/BlockExcretionsUrinaryCard.vue'
import AbcdeExposureCard from '@/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'
import DodoExaminationItem from '@/components/DodoExaminationItem.vue'

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

const blockId = 'bauchschmerz.symptoms'
const target = 'sampler.symptoms.additionalSymptoms'
const rendered = new BauchschmerzTextAreaBlock()

function setup() {
  const store = useDokuStore()
  store.setAbdominalAssessed(true)
  store.setAbdominalPain('')
  store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
  store.doku.sampler.symptoms.additionalSymptoms.setText('Eigener Text')
  return store
}

describe('Bauchschmerz text rendering', () => {
  test('starts empty and supports partial details without an implicit region, onset or severity', () => {
    const state = createBauchschmerzBlockState()
    expect(rendered.render(state)).toBeNull()
    state.details.quality = ['stechend']
    expect(rendered.render(state)).toMatchObject({
      id: blockId, target, complete: true, active: true, text: 'Bauchschmerz: stechend.',
    })
    state.details.quality = []
    state.details.onspan = '  '
    expect(rendered.render(state)).toBeNull()
  })

  test.each([
    [[], ''], [['obli'], 'OB li.'], [['obmi'], 'epigastr.'], [['obre'], 'OB re.'],
    [['mbli'], 'Flanke li.'], [['mbmi'], 'Nabelregion'], [['mbre'], 'Flanke re.'],
    [['ubli'], 'UB li'], [['ubmi'], 'unterhalb Nabel'], [['ubre'], 'UB re.'],
    [['obli', 'ubli'], 'linksseitig'], [['obre', 'ubre'], 'rechtsseitig'],
    [['obli', 'obre'], 'OB'], [['ubli', 'ubre'], 'UB'],
    [['obli', 'mbli', 'ubli', 'mbmi'], 'diffus linksseitig'],
    [['obre', 'mbre', 'ubre', 'mbmi'], 'diffus rechtsseitig'],
    [['obli', 'obmi', 'obre', 'mbmi'], 'diffus OB'],
    [['ubli', 'ubmi', 'ubre', 'mbmi'], 'diffus UB'],
    [['obli', 'obmi'], 'diffus oben/li.'], [['obmi', 'obre'], 'diffus oben/re.'],
    [['mbli', 'ubli'], 'diffus unten/li.'], [['mbre', 'ubre'], 'diffus unten/re.'],
    [['mbli', 'mbmi', 'mbre'], 'Mittelbauch'], [['obmi', 'mbmi', 'ubmi'], 'Mittellinie'],
    [['mbli', 'mbmi'], 'Nabel linksbetont'], [['mbmi', 'mbre'], 'Nabel rechtsbetont'],
    [['mbmi', 'ubmi'], 'Nabel+Richtung UB'],
    [['obli', 'mbmi', 'ubre'], 'diffus'], [['obli', 'ubre'], 'OB li., UB re.'],
  ] as [Array<keyof BauchschmerzRegion>, string][])('renders region selection %j as %s', (selected, expected) => {
    const region = createBauchschmerzBlockState().details.region
    for (const key of selected) region[key] = true
    expect(renderBauchschmerzRegion(region)).toBe(expected)
  })

  test('preserves region and OPQRST ordering, prepositions, option order and wording', () => {
    const state = createBauchschmerzBlockState()
    Object.assign(state.details, {
      onset: 'plötzlicher Beginn', onspan: 'heute früh', severity: 'mittel',
      provocation: ['Nahrungsaufnahme', 'Bewegung', 'Atmung'],
      palliation: ['Erbrechen', 'Stuhlgang', 'Sitzen', 'Ruhe'],
      quality: ['krampfartig', 'stechend'], radiation: ['Schulterblätter', 'Flanke re.'],
      time: ['Früher Milder', 'Gleichbleibend'],
    })
    state.details.region.mbmi = true
    expect(rendered.render(state)?.text).toBe(
      'Bauchschmerz: Nabelregion; NRS 4-6; heute früh, plötzlicher Beginn; ' +
      'bei tiefer Atmung, Bewegung & nach Nahrungsaufnahme schlimmer; ' +
      'bei körperl. Schonung & im Sitzen & nach Stuhlgang, Erbrechen besser; ' +
      'stechend, krampfartig; strahlt aus in re. Flanke & zwischen die Schulterblätter; ' +
      'bereits milder aufgetreten, Intensität konstant.',
    )
    state.details.provocation = ['Atmung', 'Bewegung']
    state.details.palliation = ['Stuhlgang', 'Erbrechen']
    expect(rendered.render(state)?.text).toContain('bei tiefer Atmung & Bewegung schlimmer')
    expect(rendered.render(state)?.text).toContain('nach Stuhlgang & Erbrechen besser')
  })

  test.each([
    ['minimal', '0-1'], ['leicht', '2-3'], ['mittel', '4-6'], ['stark', '7-8'], ['maximal', '9-10'],
  ] as const)('formats severity %s without requiring other fields', (severity, range) => {
    const state = createBauchschmerzBlockState()
    state.details.severity = severity
    expect(rendered.render(state)?.text).toBe(`Bauchschmerz: NRS ${range}.`)
  })

  test.each([
    ['2 Stunden', 'seit 2 Stunden'], ['seit Tagen', 'seit Tagen'], ['heute früh', 'heute früh'],
  ])('formats custom onset timing %s', (input, expected) => {
    const state = createBauchschmerzBlockState()
    state.details.onspan = input
    expect(rendered.render(state)?.text).toBe(`Bauchschmerz: ${expected}.`)
  })
})

describe('Bauchschmerz source lifecycle', () => {
  test('appears after Schwindel and excretions only when symptoms and the abdominal finding are available', async () => {
    const store = useDokuStore()
    store.setDizziness('gerichteter')
    const symptoms = shallowMount(SampleSymptomsCard)
    expect(symptoms.findComponent(BlockBauchschmerzCard).exists()).toBe(false)
    store.setAbdominalAssessed(true)
    await nextTick()
    expect(symptoms.findComponent(BlockBauchschmerzCard).exists()).toBe(false)
    store.setAbdominalPain('')
    await nextTick()
    expect(symptoms.findComponent(BlockBauchschmerzCard).exists()).toBe(true)
    store.setExcretionsAssessed(true)
    store.setBowelAbnormalities(true)
    store.setUrinaryAbnormalities(true)
    await nextTick()
    const schwindel = symptoms.getComponent(BlockSchwindelCard).element
    const bowels = symptoms.getComponent(BlockExcretionsBowelsCard).element
    const urinary = symptoms.getComponent(BlockExcretionsUrinaryCard).element
    const bauchschmerz = symptoms.getComponent(BlockBauchschmerzCard).element
    expect(schwindel.nextElementSibling).toBe(bowels)
    expect(bowels.nextElementSibling).toBe(urinary)
    expect(urinary.nextElementSibling).toBe(bauchschmerz)
    expect(bauchschmerz.nextElementSibling).toBe(symptoms.getComponent(DodoInputTextArea).element)
    expect(symptoms.getComponent(DodoInputTextArea).props('quickieKeys')).not.toContain('abdominal_pain')
    store.setFlavor('no_emergency_call', true)
    await nextTick()
    expect(symptoms.findComponent(BlockBauchschmerzCard).exists()).toBe(false)
    store.setFlavor('no_emergency_call', false)
    store.setAbdominalAssessed(false)
    await nextTick()
    expect(symptoms.findComponent(BlockBauchschmerzCard).exists()).toBe(false)
  })

  test('Exposure controls and automatic changes use the abdominal source lifecycle', async () => {
    const store = setup()
    const exposure = shallowMount(AbcdeExposureCard, { global: { renderStubDefaultSlot: true } })
    const assessment = exposure.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'abdominal')!
    const pain = exposure.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Bauchschmerzen')!
    store.setTextAreaBlockActive(blockId, false)
    pain.vm.$emit('update:modelValue', 'keine')
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    store.doku.xabcdE.abdominal.value.guarding = 'leichte'
    await nextTick()
    expect(store.context.hasAbdominalIssue).toBe(true)
    expect(store.textAreaBlocks).toEqual([])
    store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
    store.setFlavor('non_verbal', true)
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('keine')
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    store.setFlavor('non_verbal', false)
    store.setAbdominalPain('starke')
    store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
    assessment.vm.$emit('update:assessed', false)
    assessment.vm.$emit('remove')
    expect(store.doku.xabcdE.abdominal.isAssessed).toBe(false)
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('keine')
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
  })

  test('modal edits update the preview and protocol without duplicating the preview or changing manual text or undo', async () => {
    const store = useDokuStore()
    store.setAbdominalAssessed(true)
    store.setAbdominalPain('')
    const manual = store.doku.sampler.symptoms.additionalSymptoms
    manual.setText('Vorher')
    manual.setText('Eigener Text')
    const symptoms = shallowMount(SampleSymptomsCard, {
      global: { renderStubDefaultSlot: true, stubs: { BlockBauchschmerzCard: false, DodoItemModal: false } },
    })
    const editor = symptoms.getComponent(DodoInputTextArea)
    const modal = symptoms.getComponent(DodoItemModal)
    const overlay = modal.getComponent(IonModal)
    expect(modal.props()).toMatchObject({ label: 'Bauchschmerz', modalLabel: 'Bauchschmerz', state: 'Keine Angabe' })
    expect(overlay.props('isOpen')).toBe(false)
    await modal.getComponent(IonItem).trigger('click')
    expect(overlay.props('isOpen')).toBe(true)
    expect(store.textAreaBlocks).toEqual([])
    const selects = modal.findAllComponents(DodoInputSelect)
    expect(selects.map(select => select.props('emptyLabel'))).toEqual(['Keine Angabe', 'Keine Angabe', 'Keine Angabe'])
    selects.find(select => select.props('label') === 'Beginn')!.vm.$emit('update:modelValue', 'schleichender Beginn')
    selects.find(select => select.props('label') === 'Wann')!.vm.$emit('update:modelValue', '2 Stunden')
    selects.find(select => select.props('label') === 'Schmerzen')!.vm.$emit('update:modelValue', 'leicht')
    const quality = () => modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'stechend')!
    quality().vm.$emit('update:modelValue', true)
    await nextTick()
    const expected = 'Bauchschmerz: NRS 2-3; seit 2 Stunden, schleichender Beginn; stechend.'
    expect(modal.props('state')).toBe('')
    expect(editor.props('blocks')?.[0].text).toBe(expected)
    expect(store.generatedProtocol).toContain(`${expected}\nEigener Text`)
    expect(manual.value).toBe('Eigener Text')
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('')
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain('Bauchschmerz:')
    expect(editor.props('blocks')?.[0].active).toBe(false)
    quality().vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.textAreaBlocks.bauchschmerz.details.quality).toEqual([])
    expect(store.textAreaBlocks[0].active).toBe(false)
    manual.undo()
    expect(manual.value).toBe('Vorher')
    expect(store.textAreaBlocks[0].active).toBe(false)
    editor.vm.$emit('activation-change', blockId, true)
    await nextTick()
    expect(store.generatedProtocol).toContain('Bauchschmerz: NRS 2-3; seit 2 Stunden, schleichender Beginn.')
    await modal.getComponent(IonButton).trigger('click')
    expect(overlay.props('isOpen')).toBe(false)
    expect(modal.props('state')).toBe('')
    await modal.getComponent(IonItem).trigger('click')
    expect(overlay.props('isOpen')).toBe(true)
    expect(selects.find(select => select.props('label') === 'Beginn')!.props('modelValue')).toBe('schleichender Beginn')
    expect(quality().props('modelValue')).toBe(false)
    overlay.vm.$emit('willDismiss')
    await nextTick()
    expect(overlay.props('isOpen')).toBe(false)
  })

  test.each(['keine', 'unassessed', 'reset'] as const)('clears details and activation on %s', value => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    if (value === 'keine') store.setAbdominalPain('keine')
    else if (value === 'unassessed') store.setAbdominalAssessed(false)
    else store.resetAbdominal()
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    store.setTextAreaBlockActive(blockId, false)
    expect(store.doku.textAreaBlocks.bauchschmerz.active[blockId]).toBe(true)
    store.setAbdominalAssessed(true)
    store.setAbdominalPain('')
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
  })

  test('preserves details and activation across unrelated flavor changes and reselecting abdominal pain', () => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    store.setFlavor('trauma', true)
    store.setFlavor('verlegung', true)
    store.setFlavor('einweisung', true)
    store.setAbdominalAssessed(true)
    store.setAbdominalPain('')
    expect(store.textAreaBlocks).toEqual([expect.objectContaining({ active: false, text: 'Bauchschmerz: stechend.' })])
  })

  test('retains activation and restores the empty indicator when all details are temporarily cleared', async () => {
    const store = setup()
    const symptoms = shallowMount(BlockBauchschmerzCard, { global: { renderStubDefaultSlot: true } })
    const modal = symptoms.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('')
    store.setTextAreaBlockActive(blockId, false)
    store.doku.textAreaBlocks.bauchschmerz.details.quality = []
    store.doku.textAreaBlocks.bauchschmerz.details.onspan = '  '
    await nextTick()
    expect(store.textAreaBlocks).toEqual([])
    expect(modal.props('state')).toBe('Keine Angabe')
    store.doku.textAreaBlocks.bauchschmerz.details.time = ['Erstmalig']
    await nextTick()
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Bauchschmerz: erstmalig.' })
    expect(modal.props('state')).toBe('')
  })

  test('persists structured details and activation, and restores chip selections on remount', async () => {
    const store = setup()
    const original = shallowMount(BlockBauchschmerzCard, { global: { renderStubDefaultSlot: true } })
    const regionChip = original.findAllComponents(DodoToggleChip)[0]
    expect(regionChip.text()).toBe('Rechts')
    regionChip.vm.$emit('update:modelValue', true)
    expect(store.doku.textAreaBlocks.bauchschmerz.details.region.obre).toBe(true)
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.bauchschmerz).toEqual(store.doku.textAreaBlocks.bauchschmerz)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Bauchschmerz: OB re; stechend.' })
    const symptoms = shallowMount(BlockBauchschmerzCard, { global: { renderStubDefaultSlot: true } })
    const modal = symptoms.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('')
    expect(modal.findAllComponents(DodoToggleChip)[0].props('modelValue')).toBe(true)
    expect(modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'stechend')?.props('modelValue')).toBe(true)
  })

  test.each([true, false])('reset audits active=%s output, clears state, and history restores it', async active => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, active)
    await store.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      [target]: active ? 'Bauchschmerz: stechend.\nEigener Text' : 'Eigener Text',
    }))
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active, text: 'Bauchschmerz: stechend.' })
  })

  test.each(['unassessed', 'keine'])('hydration clears persisted details when unavailable: %s', async reason => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    if (reason === 'unassessed') saved.doku.xabcdE.abdominal.assessed = false
    else saved.doku.xabcdE.abdominal.value.pain = 'keine'
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(restored.textAreaBlocks).toEqual([])
  })

  test('legacy inserted sentences remain manual without producing a duplicate block', async () => {
    const text = 'Bauchschmerz: stechend.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcdE: { abdominal: { assessed: true, value: { pain: '' } } },
      sampler: { symptoms: { additionalSymptoms: { _text: text } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })

  test('quickie reset never registers Bauchschmerz as a modal or template', () => {
    resetQuickies()
    expect(DATA_Quickies).not.toHaveProperty('abdominal_pain')
    expect(DATA_Quickies).not.toHaveProperty('bauchschmerz')
    expect(DATA_Quickies).toHaveProperty('verlegung')
    expect(DATA_Quickies).toHaveProperty('einweisung')
  })
})
