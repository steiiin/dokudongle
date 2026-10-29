import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createSchwindelBlockState, SchwindelTextAreaBlock } from '@/data/blocks/schwindel'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/DodoToggleChip.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import SampleSymptomsCard from '@/views/dokuCards/sampleCards/SampleSymptomsCard.vue'
import BlockSchwindelCard from '@/views/dokuCards/blocksourceCards/BlockSchwindelCard.vue'

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
      id: blockId, target, complete: true, active: true, text: 'Schwindel: Drehschwindel.',
    })
    state.details.quality = []
    expect(rendered.render(state)).toBeNull()
    state.details.onspan = '  '
    expect(rendered.render(state)).toBeNull()
  })

  test('preserves OPQRST ordering, preposition groups, and original wording', () => {
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
      'Schwindel: Drehschwindel, Schwankschwindel; Intensität mittel, unsicher beim Gehen; ' +
      'heute früh, plötzlicher Beginn; bei Kopfbewegung, körperl. Belastung & beim Aufstehen schlimmer; ' +
      'beim ruhig liegen, Augen schließen & bei Fixieren eines Punkts besser; ' +
      'zusätzlich Ohrgeräusche, Hörminderung & Nystagmus; erstmalig, stetig zunehmend.',
    )
    state.details.provocation = ['Kopfbewegung', 'Lagewechsel']
    state.details.palliation = ['Ruhe', 'Augen zu']
    expect(rendered.render(state)?.text).toContain('bei Kopfbewegung & Lagewechsel schlimmer')
    expect(rendered.render(state)?.text).toContain('beim ruhig liegen & Augen schließen besser')
  })

  test.each([
    ['minimal', 'minimal, kaum beeinträchtigt'],
    ['leicht', 'leicht, gehfähig'],
    ['mittel', 'mittel, unsicher beim Gehen'],
    ['stark', 'stark, nur mit Hilfe gehfähig'],
    ['maximal', 'maximal, nicht steh-/gehfähig'],
  ] as const)('formats severity %s without requiring other fields', (severity, description) => {
    const state = createSchwindelBlockState()
    state.details.severity = severity
    expect(rendered.render(state)?.text).toBe(`Schwindel: Intensität ${description}.`)
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
    const expected = 'Schwindel: Drehschwindel; Intensität leicht, gehfähig; seit 2 Stunden, schleichender Beginn.'
    expect(modal.props('state')).toBe('')
    expect(editor.props('blocks')?.[0].text).toBe(expected)
    expect(store.generatedProtocol).toContain(`${expected}\nEigener Text`)
    expect(manual.value).toBe('Eigener Text')
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain('Schwindel:')
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
    expect(store.generatedProtocol).toContain('Schwindel: Intensität leicht, gehfähig; seit 2 Stunden, schleichender Beginn.')
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
    expect(store.textAreaBlocks).toEqual([expect.objectContaining({ active: false, text: 'Schwindel: Drehschwindel.' })])
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
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.schwindel).toEqual(store.doku.textAreaBlocks.schwindel)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Schwindel: Drehschwindel.' })
    const symptoms = shallowMount(BlockSchwindelCard, { global: { renderStubDefaultSlot: true } })
    const modal = symptoms.getComponent(DodoItemModal)
    expect(modal.props('state')).toBe('')
    expect(modal.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Drehschwindel')?.props('modelValue')).toBe(true)
  })

  test.each([true, false])('reset audits active=%s output, clears state, and history restores it', async active => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, active)
    await store.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      [target]: active ? 'Schwindel: Drehschwindel.\nEigener Text' : 'Eigener Text',
    }))
    expect(store.doku.textAreaBlocks.schwindel).toEqual(createSchwindelBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active, text: 'Schwindel: Drehschwindel.' })
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
    const text = 'Schwindel: Drehschwindel.'
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
