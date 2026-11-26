import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createBauchschmerzBlockState, BauchschmerzTextAreaBlock, renderBauchschmerzRegion, provocationOptions, palliationOptions, qualityOptions, radiationOptions, timeOptions } from '@/data/blocks/bauchschmerz'
import type { BauchschmerzDetails, BauchschmerzRegion } from '@/types/blocks/bauchschmerz'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import DodoInputTextArea from '@/components/inputs/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/inputs/DodoToggleChip.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import SampleSymptomsCard from '@/views/doku/sample/SampleSymptomsCard.vue'
import BlockBauchschmerzCard from '@/views/doku/blocks/BlockBauchschmerzCard.vue'
import BlockSchwindelCard from '@/views/doku/blocks/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '@/views/doku/blocks/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '@/views/doku/blocks/BlockExcretionsUrinaryCard.vue'
import AbcdeExposureCard from '@/views/doku/abcde/AbcdeExposureCard.vue'
import DodoExaminationItem from '@/components/examination/DodoExaminationItem.vue'

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
      id: blockId, target, complete: true, active: true, text: 'Bauchschmerzen stechend.',
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
    const state = createBauchschmerzBlockState()
    state.details.region = region
    if (selected.length) expect(rendered.render(state)?.text).toMatch(/^Bauchschmerzen /)
    else expect(rendered.render(state)).toBeNull()
  })

  test.each([
    [['ubmi'], {}, 'Bauchschmerzen unterhalb Nabel.'],
    [['obre'], {}, 'Bauchschmerzen OB re.'],
    [['obmi'], {}, 'Bauchschmerzen epigastr.'],
    [['obli', 'ubli'], { quality: ['stechend'] }, 'Bauchschmerzen linksseitig; stechend.'],
    [['obli', 'mbmi', 'ubre'], { quality: ['krampfartig'] }, 'Bauchschmerzen diffus; krampfartig.'],
    [['obmi', 'mbmi', 'ubmi'], { quality: ['ziehend'] }, 'Bauchschmerzen Mittellinie; ziehend.'],
    [['mbmi'], { onspan: 'seit Tagen' }, 'Bauchschmerzen Nabelregion; seit Tagen.'],
    [['mbmi'], { provocation: ['Atmung'] }, 'Bauchschmerzen Nabelregion; bei tiefer Atmung schlimmer.'],
    [['mbmi'], { palliation: ['Stuhlgang'] }, 'Bauchschmerzen Nabelregion; nach Stuhlgang besser.'],
    [['mbmi'], { time: ['Erstmalig'] }, 'Bauchschmerzen Nabelregion; erstmalig.'],
    [['ubmi'], { quality: ['stechend'] }, 'unterhalb Nabel; stechend.'],
    [['obre'], { quality: ['stechend'] }, 'OB re; stechend.'],
    [['mbli'], { quality: ['ziehend'] }, 'Flanke li; ziehend.'],
    [['obmi'], { radiation: ['Rücken'] }, 'epigastr; strahlt aus in Rücken.'],
    [[], { quality: ['stechend'], radiation: ['Rücken'] }, 'Bauchschmerzen stechend; strahlt aus in Rücken.'],
    [[], { onset: 'plötzlicher Beginn', onspan: 'seit Tagen' }, 'Bauchschmerzen seit Tagen, plötzlicher Beginn.'],
    [['mbmi'], { quality: ['unbekannt'], radiation: ['unbekannt'] }, 'Bauchschmerzen Nabelregion.'],
  ] as [Array<keyof BauchschmerzRegion>, Partial<BauchschmerzDetails>, string][])(
    'adds context only when region %j and details %j need it', (region, details, expected) => {
      const state = createBauchschmerzBlockState()
      Object.assign(state.details, details)
      for (const key of region) state.details.region[key] = true
      expect(rendered.render(state)?.text).toBe(expected)
    },
  )

  test.each([
    ['provocation', provocationOptions], ['palliation', palliationOptions],
    ['quality', qualityOptions], ['radiation', radiationOptions], ['time', timeOptions],
  ] as const)('keeps every isolated %s option understandable', (field, options) => {
    for (const option of options) {
      const state = createBauchschmerzBlockState()
      state.details[field] = [option.label]
      const text = rendered.render(state)?.text
      expect(text, option.label).toMatch(/^Bauchschmerzen .+\.$/)
      expect(text, option.label).not.toContain('NRS')
    }
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
      'Nabelregion; heute früh, plötzlicher Beginn; ' +
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
    ['minimal', 'minimale'], ['leicht', 'leichte'], ['mittel', 'mittlere'], ['stark', 'starke'], ['maximal', 'maximale'],
    ['', ''],
  ] as const)('renders severity %s only in Exposure', (severity, adjective) => {
    const store = useDokuStore()
    store.setAbdominalPainEnabled(true)
    const state = store.doku.textAreaBlocks.bauchschmerz
    state.details.severity = severity
    expect(rendered.render(state)).toBeNull()
    const pain = [adjective, 'Bauchschmerzen'].filter(Boolean).join(' ')
    expect(store.doku.xabcdE.abdominalText).toBe(`${pain}; Abdomen weich`)
    expect(store.generatedProtocol).toContain(pain)
    state.details.quality = ['stechend']
    store.setTextAreaBlockActive(blockId, false)
    expect(store.generatedProtocol).toContain(pain)
    expect(store.generatedProtocol).not.toMatch(/stechend|NRS|Bauchschmerz:/)
  })

  test.each([
    ['2 Stunden', 'seit 2 Stunden'], ['seit Tagen', 'seit Tagen'], ['heute früh', 'heute früh'],
  ])('formats custom onset timing %s', (input, expected) => {
    const state = createBauchschmerzBlockState()
    state.details.onspan = input
    expect(rendered.render(state)?.text).toBe(`Bauchschmerzen ${expected}.`)
  })
})

describe('Bauchschmerz source lifecycle', () => {
  test.each(['severity', 'guarding', 'peristalsis'] as const)('marks the card as filled with only %s, without a symptom block', async field => {
    const store = useDokuStore()
    store.setAbdominalPainEnabled(true)
    const card = shallowMount(BlockBauchschmerzCard)
    const modal = card.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('Keine Angabe')
    if (field === 'severity') store.doku.textAreaBlocks.bauchschmerz.details.severity = 'minimal'
    else if (field === 'guarding') store.doku.xabcdE.abdominal.value.guarding = 'starke'
    else store.doku.xabcdE.abdominal.value.peristalsis = 'fehlend'
    await nextTick()
    expect(modal.props('state')).toBe('')
    expect(store.textAreaBlocks).toEqual([])
    store.doku.textAreaBlocks.bauchschmerz.details.severity = ''
    store.doku.xabcdE.abdominal.value.guarding = ''
    store.doku.xabcdE.abdominal.value.peristalsis = ''
    await nextTick()
    expect(modal.props('state')).toBe('Keine Angabe')
  })

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

  test('Exposure toggle resets findings and details without automatic pain activation', async () => {
    const store = setup()
    const exposure = shallowMount(AbcdeExposureCard, { global: { renderStubDefaultSlot: true } })
    const assessment = exposure.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'abdominal')!
    const pain = assessment.getComponent(DodoInputToggle)
    expect(exposure.findAllComponents(DodoItemModal).some(modal => modal.props('label') === 'Bauchbefund')).toBe(false)
    store.setTextAreaBlockActive(blockId, false)
    store.doku.xabcdE.abdominal.value.guarding = 'leichte'
    store.doku.xabcdE.abdominal.value.peristalsis = 'hochgestellt'
    store.doku.textAreaBlocks.bauchschmerz.details.severity = 'maximal'
    pain.vm.$emit('update:modelValue', false)
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.doku.xabcdE.abdominal.value).toMatchObject({ guarding: '', peristalsis: '', pain: 'keine' })
    expect(store.doku.xabcdE.abdominalText).toBe('Abdomen weich/schmerzfrei')
    store.doku.xabcdE.abdominal.value.guarding = 'leichte'
    await nextTick()
    expect(store.context.hasAbdominalIssue).toBe(false)
    expect(store.textAreaBlocks).toEqual([])
    pain.vm.$emit('update:modelValue', true)
    store.doku.textAreaBlocks.bauchschmerz.details.quality = ['stechend']
    store.setFlavor('non_verbal', true)
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('')
    expect(store.doku.textAreaBlocks.bauchschmerz.details.quality).toEqual(['stechend'])
    store.setAbdominalAssessed(false)
    expect(store.doku.xabcdE.abdominal.isAssessed).toBe(false)
    expect(store.doku.xabcdE.abdominal.value).toMatchObject({ guarding: '', peristalsis: '', pain: 'keine' })
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.doku.xabcdE.abdominalText).toBe('')
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
    expect(selects.map(select => select.props('label'))).toEqual(['Abwehrspannung', 'Peristaltik', 'Beginn', 'Wann', 'Schmerzen'])
    selects.find(select => select.props('label') === 'Beginn')!.vm.$emit('update:modelValue', 'schleichender Beginn')
    selects.find(select => select.props('label') === 'Wann')!.vm.$emit('update:modelValue', '2 Stunden')
    selects.find(select => select.props('label') === 'Schmerzen')!.vm.$emit('update:modelValue', 'leicht')
    const quality = () => modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'stechend')!
    quality().vm.$emit('update:modelValue', true)
    await nextTick()
    const expected = 'Bauchschmerzen seit 2 Stunden, schleichender Beginn; stechend.'
    expect(modal.props('state')).toBe('')
    expect(editor.props('blocks')?.[0].text).toBe(expected)
    expect(store.generatedProtocol).toContain(`${expected}\nEigener Text`)
    expect(manual.value).toBe('Eigener Text')
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('')
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain(expected)
    expect(store.generatedProtocol).toContain('leichte Bauchschmerzen')
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
    expect(store.generatedProtocol).toContain('seit 2 Stunden, schleichender Beginn.')
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
    expect(store.textAreaBlocks).toEqual([expect.objectContaining({ active: false, text: 'Bauchschmerzen stechend.' })])
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
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Bauchschmerzen erstmalig.' })
    expect(modal.props('state')).toBe('')
  })

  test('persists structured details and activation, and restores chip selections on remount', async () => {
    const store = setup()
    store.doku.textAreaBlocks.bauchschmerz.details.severity = 'mittel'
    store.doku.xabcdE.abdominal.value.guarding = 'leichte'
    store.doku.xabcdE.abdominal.value.peristalsis = 'spärlich'
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
    expect(restored.doku.xabcdE.abdominalText).toBe('mittlere Bauchschmerzen; Abdomen leichte Abwehrspannung; DG spärlich')
    expect(restored.textAreaBlocks[0]).toMatchObject({ active: false, text: 'OB re; stechend.' })
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
      [target]: active ? 'Bauchschmerzen stechend.\nEigener Text' : 'Eigener Text',
    }))
    expect(store.doku.textAreaBlocks.bauchschmerz).toEqual(createBauchschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active, text: 'Bauchschmerzen stechend.' })
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

  test.each([
    ['leichte', undefined, 'leicht'], ['starke', undefined, 'stark'],
    ['leichte', '', 'leicht'], ['starke', 'minimal', 'minimal'], ['', undefined, ''],
  ] as const)('restores legacy pain %s with severity %s as %s', async (pain, severity, expected) => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcdE: { abdominal: { assessed: true, value: { pain } } },
      textAreaBlocks: { bauchschmerz: { details: { severity } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.context.hasAbdominalIssue).toBe(true)
    expect(store.doku.xabcdE.abdominal.value.pain).toBe('')
    expect(store.doku.textAreaBlocks.bauchschmerz.details.severity).toBe(expected)
    expect(store.textAreaBlocks).toEqual([])
    store.doku.textAreaBlocks.bauchschmerz.details.severity = ''
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValue(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.bauchschmerz.details.severity).toBe('')
    expect(restored.doku.xabcdE.abdominalText).toBe('Bauchschmerzen; Abdomen weich')
  })

  test('quickie reset never registers Bauchschmerz as a modal or template', () => {
    resetQuickies()
    expect(DATA_Quickies).not.toHaveProperty('abdominal_pain')
    expect(DATA_Quickies).not.toHaveProperty('bauchschmerz')
    expect(DATA_Quickies).toHaveProperty('verlegung')
    expect(DATA_Quickies).toHaveProperty('einweisung')
  })
})
