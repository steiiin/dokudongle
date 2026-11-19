import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createSchwindelBlockState, SchwindelTextAreaBlock } from '@/data/blocks/schwindel'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputTextArea from '@/components/inputs/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/inputs/DodoToggleChip.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import SampleSymptomsCard from '@/views/doku/sample/SampleSymptomsCard.vue'
import BlockSchwindelCard from '@/views/doku/blocks/BlockSchwindelCard.vue'

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

const blockId = 'schwindel.symptoms'
const target = 'sampler.symptoms.additionalSymptoms'
const rendered = new SchwindelTextAreaBlock()

function setup() {
  const store = useDokuStore()
  store.setDizziness('gerichteter')
  store.doku.textAreaBlocks.schwindel.details.quality = ['Drehschwindel']
  store.doku.sampler.symptoms.additionalSymptoms.setText('Eigener Text')
  return store
}

describe('Schwindel text rendering', () => {
  test('starts empty, accepts partial details, and disappears when the last detail is cleared', () => {
    const state = createSchwindelBlockState()
    expect(rendered.render(state)).toBeNull()
    state.details.quality = ['Drehschwindel']
    expect(rendered.render(state)).toMatchObject({
      id: blockId, target, complete: true, active: true, text: 'Drehschwindel.',
    })
    state.details.quality = []
    expect(rendered.render(state)).toBeNull()
    state.details.onspan = '  '
    expect(rendered.render(state)).toBeNull()
  })

  test.each([
    [['Schwankschwindel'], 'Schwankschwindel.'],
    [['Liftgefühl'], 'Schwindel: Liftgefühl.'],
    [['Liftgefühl', 'Schwankschwindel'], 'Schwankschwindel und Liftgefühl.'],
  ] as const)('uses a context prefix only when needed for %j', (qualities, expected) => {
    const state = createSchwindelBlockState()
    state.details.quality = [...qualities]
    expect(rendered.render(state)?.text).toBe(expected)
  })

  test('renders a complete block in option order with natural wording and punctuation', () => {
    const state = createSchwindelBlockState()
    Object.assign(state.details, {
      onset: 'plötzlicher Beginn', onspan: 'heute früh',
      quality: ['Schwankschwindel', 'Drehschwindel'], severity: 'mittel',
      provocation: ['Aufstehen', 'Belastung', 'Kopfbewegung'],
      palliation: ['Ruhe', 'Augen zu', 'Punkt fixieren'],
      radiation: ['Ohrgeräusche', 'Hörminderung', 'Nystagmus'],
      time: ['Erstmalig', 'Zunehmend'],
    })
    expect(rendered.render(state)?.text).toBe(
      'Mittelstarker Drehschwindel und mittelstarker Schwankschwindel mit Gangunsicherheit; ' +
      'heute früh, plötzlicher Beginn; Verstärkung bei Kopfbewegung, beim Aufstehen und bei körperlicher Belastung; ' +
      'Besserung in ruhiger Liegeposition und beim Schließen der Augen und Fixieren eines Punkts; ' +
      'zusätzlich Ohrgeräusche, Hörminderung und Nystagmus; erstmalig, stetig zunehmend.',
    )
    expect(rendered.render(state)?.text).not.toContain('&')
  })

  describe.each([
    ['minimal', 'minimaler', 'minimales', ', kaum beeinträchtigt'],
    ['leicht', 'leichter', 'leichtes', ', gehfähig'],
    ['mittel', 'mittelstarker', 'mittelstarkes', ' mit Gangunsicherheit'],
    ['stark', 'starker', 'starkes', ', nur mit Hilfe gehfähig'],
    ['maximal', 'maximal ausgeprägter', 'maximal ausgeprägtes', ', nicht steh- oder gehfähig'],
  ] as const)('severity %s', (severity, masculine, neuter, description) => {
    test.each(['Drehschwindel', 'Schwankschwindel', 'Liftgefühl', ''])('agrees with quality "%s"', quality => {
      const state = createSchwindelBlockState()
      state.details.severity = severity
      state.details.quality = quality ? [quality] : []
      const adjective = quality === 'Liftgefühl' ? neuter : masculine
      const beginning = quality === 'Liftgefühl'
        ? `Schwindel: ${adjective}`
        : adjective[0].toUpperCase() + adjective.slice(1)
      expect(rendered.render(state)?.text).toBe(`${beginning} ${quality || 'Schwindel'}${description}.`)
    })
  })

  test('combines multiple qualities with mixed genders and one functional description', () => {
    const state = createSchwindelBlockState()
    state.details.quality = ['Liftgefühl', 'Schwankschwindel', 'Drehschwindel']
    state.details.severity = 'mittel'
    expect(rendered.render(state)?.text).toBe(
      'Mittelstarker Drehschwindel, mittelstarker Schwankschwindel und mittelstarkes Liftgefühl mit Gangunsicherheit.',
    )
    state.details.severity = ''
    expect(rendered.render(state)?.text).toBe('Drehschwindel, Schwankschwindel und Liftgefühl.')
    state.details.quality = []
    expect(rendered.render(state)).toBeNull()
  })

  test.each([
    ['provocation', ['Kopfbewegung'], 'Verstärkung bei Kopfbewegung'],
    ['provocation', ['Lagewechsel'], 'Verstärkung bei Lagewechsel'],
    ['provocation', ['Aufstehen'], 'Verstärkung beim Aufstehen'],
    ['provocation', ['Gehen'], 'Verstärkung beim Gehen'],
    ['provocation', ['Belastung'], 'Verstärkung bei körperlicher Belastung'],
    ['provocation', ['Lagewechsel', 'Kopfbewegung'], 'Verstärkung bei Kopfbewegung und Lagewechsel'],
    ['provocation', ['Gehen', 'Aufstehen'], 'Verstärkung beim Aufstehen und Gehen'],
    ['provocation', ['Aufstehen', 'Kopfbewegung'], 'Verstärkung bei Kopfbewegung und beim Aufstehen'],
    ['provocation', ['Belastung', 'Gehen', 'Aufstehen', 'Lagewechsel', 'Kopfbewegung'],
      'Verstärkung bei Kopfbewegung und Lagewechsel, beim Aufstehen und Gehen und bei körperlicher Belastung'],
    ['palliation', ['Ruhe'], 'Besserung in ruhiger Liegeposition'],
    ['palliation', ['Augen zu'], 'Besserung beim Schließen der Augen'],
    ['palliation', ['Punkt fixieren'], 'Besserung beim Fixieren eines Punkts'],
    ['palliation', ['Punkt fixieren', 'Augen zu'], 'Besserung beim Schließen der Augen und Fixieren eines Punkts'],
    ['palliation', ['Augen zu', 'Ruhe'], 'Besserung in ruhiger Liegeposition und beim Schließen der Augen'],
  ] as const)('renders %s selection %j as a standalone partial finding', (field, selection, expected) => {
    const state = createSchwindelBlockState()
    state.details[field] = [...selection]
    expect(rendered.render(state)?.text).toBe(`Schwindel: ${expected}.`)
    state.details[field] = []
    expect(rendered.render(state)).toBeNull()
  })

  test.each([
    [['Ohrgeräusche'], 'Ohrgeräusche'],
    [['Hörminderung', 'Ohrgeräusche'], 'Ohrgeräusche und Hörminderung'],
    [['Nystagmus', 'Druck im Ohr', 'Hörminderung', 'Ohrgeräusche'],
      'Ohrgeräusche, Hörminderung, Druck im Ohr und Nystagmus'],
  ] as const)('renders accompanying symptoms %j without requiring quality or severity', (selection, expected) => {
    const state = createSchwindelBlockState()
    state.details.radiation = [...selection]
    expect(rendered.render(state)?.text).toBe(`Schwindel: zusätzlich ${expected}.`)
  })

  test.each([
    ['2 Stunden', 'seit 2 Stunden'], ['seit Tagen', 'seit Tagen'], ['heute früh', 'heute früh'],
  ])('formats custom onset timing %s', (input, expected) => {
    const state = createSchwindelBlockState()
    state.details.onspan = input
    expect(rendered.render(state)?.text).toBe(`Schwindel: ${expected}.`)
  })
})

describe('Schwindel source lifecycle', () => {
  test('modal edits update the preview and protocol without duplicating the preview or changing manual text or undo', async () => {
    const store = useDokuStore()
    store.setDizziness('gerichteter')
    const manual = store.doku.sampler.symptoms.additionalSymptoms
    manual.setText('Vorher')
    manual.setText('Eigener Text')
    const symptoms = shallowMount(SampleSymptomsCard, {
      global: { renderStubDefaultSlot: true, stubs: { BlockSchwindelCard: false, DodoItemModal: false } },
    })
    const editor = symptoms.getComponent(DodoInputTextArea)
    const modal = symptoms.getComponent(DodoItemModal)
    const overlay = modal.getComponent(IonModal)
    expect(modal.props()).toMatchObject({ label: 'Schwindel', modalLabel: 'Schwindel', state: 'Keine Angabe' })
    expect(overlay.props('isOpen')).toBe(false)
    await modal.getComponent(IonItem).trigger('click')
    expect(overlay.props('isOpen')).toBe(true)
    expect(store.textAreaBlocks).toEqual([])
    const selects = modal.findAllComponents(DodoInputSelect)
    expect(selects.map(select => select.props('emptyLabel'))).toEqual(['Keine Angabe', 'Keine Angabe', 'Keine Angabe'])
    selects.find(select => select.props('label') === 'Beginn')!.vm.$emit('update:modelValue', 'schleichender Beginn')
    selects.find(select => select.props('label') === 'Wann')!.vm.$emit('update:modelValue', '2 Stunden')
    selects.find(select => select.props('label') === 'Schweregrad')!.vm.$emit('update:modelValue', 'leicht')
    const quality = () => modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Drehschwindel')!
    quality().vm.$emit('update:modelValue', true)
    await nextTick()
    const expected = 'Leichter Drehschwindel, gehfähig; seit 2 Stunden, schleichender Beginn.'
    expect(modal.props('state')).toBe('')
    expect(editor.props('blocks')?.[0].text).toBe(expected)
    expect(store.generatedProtocol).toContain(`${expected}\nEigener Text`)
    expect(manual.value).toBe('Eigener Text')
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain(expected)
    expect(editor.props('blocks')?.[0].active).toBe(false)
    quality().vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.textAreaBlocks.schwindel.details.quality).toEqual([])
    expect(store.textAreaBlocks[0].active).toBe(false)
    manual.undo()
    expect(manual.value).toBe('Vorher')
    expect(store.textAreaBlocks[0].active).toBe(false)
    editor.vm.$emit('activation-change', blockId, true)
    await nextTick()
    expect(store.generatedProtocol).toContain('Leichter Schwindel, gehfähig; seit 2 Stunden, schleichender Beginn.')
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

  test.each(['kein', 'ungerichteter'] as const)('clears details and activation when dizziness changes to %s', value => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    store.setDizziness(value)
    expect(store.doku.textAreaBlocks.schwindel).toEqual(createSchwindelBlockState())
    expect(store.textAreaBlocks).toEqual([])
    store.setTextAreaBlockActive(blockId, false)
    expect(store.doku.textAreaBlocks.schwindel.active[blockId]).toBe(true)
    store.setDizziness('gerichteter')
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
  })

  test('preserves details and activation across unrelated flavor changes and reselecting directed dizziness', () => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    store.setFlavor('trauma', true)
    store.setFlavor('verlegung', true)
    store.setFlavor('einweisung', true)
    store.setDizziness('gerichteter')
    expect(store.textAreaBlocks).toEqual([expect.objectContaining({ active: false, text: 'Drehschwindel.' })])
  })

  test('retains activation and restores the empty indicator when all details are temporarily cleared', async () => {
    const store = setup()
    const symptoms = shallowMount(BlockSchwindelCard, { global: { renderStubDefaultSlot: true } })
    const modal = symptoms.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('')
    store.setTextAreaBlockActive(blockId, false)
    store.doku.textAreaBlocks.schwindel.details.quality = []
    store.doku.textAreaBlocks.schwindel.details.onspan = '  '
    await nextTick()
    expect(store.textAreaBlocks).toEqual([])
    expect(modal.props('state')).toBe('Keine Angabe')
    store.doku.textAreaBlocks.schwindel.details.time = ['Erstmalig']
    await nextTick()
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Schwindel: erstmalig.' })
    expect(modal.props('state')).toBe('')
  })

  test('persists structured details and activation, and restores chip selections on remount', async () => {
    const store = setup()
    store.doku.textAreaBlocks.schwindel.details.severity = 'mittel'
    store.doku.textAreaBlocks.schwindel.details.palliation = ['Ruhe', 'Augen zu']
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.schwindel).toEqual(store.doku.textAreaBlocks.schwindel)
    expect(restored.textAreaBlocks[0]).toMatchObject({
      active: false,
      text: 'Mittelstarker Drehschwindel mit Gangunsicherheit; Besserung in ruhiger Liegeposition und beim Schließen der Augen.',
    })
    const symptoms = shallowMount(BlockSchwindelCard, { global: { renderStubDefaultSlot: true } })
    const modal = symptoms.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('')
    expect(modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Drehschwindel')?.props('modelValue')).toBe(true)
    expect(modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Ruhe')?.props('modelValue')).toBe(true)
    expect(modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Augen zu')?.props('modelValue')).toBe(true)
  })

  test.each([true, false])('reset audits active=%s output, clears state, and history restores it', async active => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, active)
    await store.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      [target]: active ? 'Drehschwindel.\nEigener Text' : 'Eigener Text',
    }))
    expect(store.doku.textAreaBlocks.schwindel).toEqual(createSchwindelBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active, text: 'Drehschwindel.' })
  })

  test('hydration clears persisted details when directed dizziness is not selected', async () => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    saved.doku.xabcDe.dizziness = 'ungerichteter'
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.schwindel).toEqual(createSchwindelBlockState())
    expect(restored.textAreaBlocks).toEqual([])
  })

  test('legacy inserted sentences remain manual without producing a duplicate block', async () => {
    const text = 'Schwindel: Drehschwindel; Intensität mittel, unsicher beim Gehen; beim ruhig liegen & Augen schließen besser.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { dizziness: 'gerichteter' },
      sampler: { symptoms: { additionalSymptoms: { _text: text } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.schwindel).toEqual(createSchwindelBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })

  test('quickie reset never registers Schwindel as a modal or template', () => {
    resetQuickies()
    expect(DATA_Quickies).not.toHaveProperty('intern_schwindel')
    expect(DATA_Quickies).not.toHaveProperty('schwindel')
    expect(DATA_Quickies).toHaveProperty('verlegung')
    expect(DATA_Quickies).toHaveProperty('einweisung')
  })
})
