import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { IonButton, IonItem, IonModal } from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createExcretionsBowelsBlockState, createExcretionsUrinaryBlockState,
  ExcretionsBowelsTextAreaBlock, ExcretionsUrinaryTextAreaBlock,
} from '@/data/blocks/excretions'
import { DATA_Quickies, resetQuickies } from '@/data/quickies'
import { OptionalValue } from '@/types/protocol/input'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputToggle from '@/components/DodoInputToggle.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/DodoToggleChip.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'
import DodoExaminationItem from '@/components/DodoExaminationItem.vue'
import SampleSymptomsCard from '@/views/dokuCards/sampleCards/SampleSymptomsCard.vue'
import AbcdeExposureCard from '@/views/dokuCards/abcdeCards/AbcdeExposureCard.vue'
import BlockSchwindelCard from '@/views/dokuCards/blocksourceCards/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '@/views/dokuCards/blocksourceCards/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '@/views/dokuCards/blocksourceCards/BlockExcretionsUrinaryCard.vue'
import BlockBauchschmerzCard from '@/views/dokuCards/blocksourceCards/BlockBauchschmerzCard.vue'

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

const bowelId = 'excretions_bowel.symptoms'
const urinaryId = 'excretions_urinary.symptoms'
const target = 'sampler.symptoms.additionalSymptoms'
const bowels = new ExcretionsBowelsTextAreaBlock()
const urinary = new ExcretionsUrinaryTextAreaBlock()

function setup() {
  const store = useDokuStore()
  store.setExcretionsAssessed(true)
  store.setBowelAbnormalities(true)
  store.setUrinaryAbnormalities(true)
  store.doku.textAreaBlocks.excretions_bowel.details.blood = 'Teerstuhl'
  store.doku.textAreaBlocks.excretions_urinary.details.output = ['Harnverhalt']
  store.doku.sampler.symptoms.additionalSymptoms.setText('Eigener Text')
  return store
}

const modalOptions = { global: { renderStubDefaultSlot: true, stubs: { DodoItemModal: false } } }

describe('Excretions text rendering', () => {
  test('omits empty blocks and accepts individual details', () => {
    const bowelState = createExcretionsBowelsBlockState()
    const urinaryState = createExcretionsUrinaryBlockState()
    expect(bowels.render(bowelState)).toBeNull()
    expect(urinary.render(urinaryState)).toBeNull()
    bowelState.details.lastBowel = OptionalValue.active('  ')
    expect(bowels.render(bowelState)).toBeNull()
    bowelState.details.bowelPain = true
    urinaryState.details.hematuria = 'minimal Blut im Urin'
    expect(bowels.render(bowelState)).toMatchObject({
      id: bowelId, target, active: true, complete: true, text: 'Stuhlgang: schmerzhafter Stuhlgang.',
    })
    expect(urinary.render(urinaryState)).toMatchObject({
      id: urinaryId, target, active: true, complete: true, text: 'Wasserlassen: minimal Blut im Urin.',
    })
  })

  test('preserves bowel sentence grouping and optional timing', () => {
    const state = createExcretionsBowelsBlockState()
    Object.assign(state.details, {
      pattern: 'Obstipation', consistency: 'hartlaibig', lastBowel: OptionalValue.active('2 Tagen'),
      blood: 'Blut am Klopapier', bowelPain: true, bowelSounds: 'vermindert',
    })
    expect(bowels.render(state)?.text).toBe(
      'Stuhlgang: Obstipation, hartlaibig, zuletzt vor 2 Tagen; Blut am Klopapier, schmerzhafter Stuhlgang; DG vermindert.',
    )
    state.details.lastBowel.active = false
    expect(bowels.render(state)?.text).not.toContain('zuletzt')
  })

  test('renders urinary chips in option order with their original wording', () => {
    const state = createExcretionsUrinaryBlockState()
    Object.assign(state.details, {
      catheterIssues: 'verstopft', output: ['Harndrang', 'Verringert'], pain: ['Flankenschmerz', 'Brennen'],
      anomalies: ['Trübe', 'Dunkel'], hematuria: 'viel Blut im Urin',
    })
    expect(urinary.render(state)?.text).toBe(
      'Wasserlassen: verstopft; verringerte Ausfuhr, ständinger Harndrang; Brennen beim Wasserlassen, Flankenschmerz; dunkler, trüber Urin; viel Blut im Urin.',
    )
  })
})

describe('Excretions modal editing', () => {
  test('shows conditional modals between Schwindel and Bauchschmerz and retains only OPQRST as a quickie', async () => {
    const store = useDokuStore()
    store.setDizziness('gerichteter')
    store.setAbdominalAssessed(true)
    store.setAbdominalPain('leichte')
    const symptoms = shallowMount(SampleSymptomsCard)
    expect(symptoms.findComponent(BlockExcretionsBowelsCard).exists()).toBe(false)
    expect(symptoms.findComponent(BlockExcretionsUrinaryCard).exists()).toBe(false)
    store.setBowelAbnormalities(true)
    store.setUrinaryAbnormalities(true)
    await nextTick()
    expect(symptoms.findComponent(BlockExcretionsBowelsCard).exists()).toBe(false)
    expect(symptoms.findComponent(BlockExcretionsUrinaryCard).exists()).toBe(false)
    store.setExcretionsAssessed(true)
    await nextTick()
    const ordered = [BlockSchwindelCard, BlockExcretionsBowelsCard, BlockExcretionsUrinaryCard, BlockBauchschmerzCard, DodoInputTextArea]
      .map(component => symptoms.getComponent(component).element)
    ordered.slice(0, -1).forEach((element, index) => expect(element.nextElementSibling).toBe(ordered[index + 1]))
    expect(symptoms.getComponent(DodoInputTextArea).props('quickieKeys')).toEqual(['intern_opqrst'])
    store.setBowelAbnormalities(false)
    await nextTick()
    expect(symptoms.findComponent(BlockExcretionsBowelsCard).exists()).toBe(false)
    expect(symptoms.findComponent(BlockExcretionsUrinaryCard).exists()).toBe(true)
    store.setFlavor('no_emergency_call', true)
    await nextTick()
    expect(symptoms.findComponent(BlockExcretionsBowelsCard).exists()).toBe(false)
    expect(symptoms.findComponent(BlockExcretionsUrinaryCard).exists()).toBe(false)
  })

  test('edits live blocks, keeps activation independent, and preserves manual text and undo', async () => {
    const store = setup()
    const manual = store.doku.sampler.symptoms.additionalSymptoms
    manual.setText('Neuer Text')
    const symptoms = shallowMount(SampleSymptomsCard, {
      global: { renderStubDefaultSlot: true, stubs: { BlockExcretionsBowelsCard: false, BlockExcretionsUrinaryCard: false, DodoItemModal: false } },
    })
    const editor = symptoms.getComponent(DodoInputTextArea)
    const modal = symptoms.getComponent(BlockExcretionsBowelsCard).getComponent(DodoItemModal)
    expect(modal.props()).toMatchObject({ label: 'Stuhlgang', modalLabel: 'Stuhlgang', state: '' })
    await modal.getComponent(IonItem).trigger('click')
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(true)
    modal.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Blut')!.vm.$emit('update:modelValue', 'Blut im Stuhl')
    await nextTick()
    expect(editor.props('blocks')?.map(block => block.text)).toEqual(['Stuhlgang: Blut im Stuhl.', 'Wasserlassen: Harnverhalt.'])
    expect(store.generatedProtocol).toContain('Stuhlgang: Blut im Stuhl.\nWasserlassen: Harnverhalt.\nNeuer Text')
    editor.vm.$emit('activation-change', bowelId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain('Stuhlgang:')
    expect(store.generatedProtocol).toContain('Wasserlassen: Harnverhalt.')
    expect(manual.value).toBe('Neuer Text')
    manual.undo()
    expect(manual.value).toBe('Eigener Text')
    await modal.getComponent(IonButton).trigger('click')
    expect(modal.getComponent(IonModal).props('isOpen')).toBe(false)
    await modal.getComponent(IonItem).trigger('click')
    expect(modal.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Blut')?.props('modelValue')).toBe('Blut im Stuhl')
    store.doku.textAreaBlocks.excretions_bowel.details.blood = ''
    await nextTick()
    expect(modal.props('state')).toBe('Keine Angabe')
    store.doku.textAreaBlocks.excretions_bowel.details.blood = 'Teerstuhl'
    await nextTick()
    expect(editor.props('blocks')?.[0].active).toBe(false)
  })

  test('synchronizes bowel frequency and consistency including Hart', async () => {
    setup()
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    const selects = card.findAllComponents(DodoInputSelect)
    const pattern = selects.find(select => select.props('label') === 'Frequenz')!
    const consistency = selects.find(select => select.props('label') === 'Konsistenz')!
    pattern.vm.$emit('update:modelValue', 'Durchfall')
    await nextTick()
    expect(consistency.props('modelValue')).toBe('breiig')
    consistency.vm.$emit('update:modelValue', 'hartlaibig')
    await nextTick()
    expect(pattern.props('modelValue')).toBe('Obstipation')
    consistency.vm.$emit('update:modelValue', 'wässrig')
    await nextTick()
    expect(pattern.props('modelValue')).toBe('Durchfall')
  })

  test('keeps urinary pain chips mutually exclusive and retains edits on reopen', async () => {
    const store = setup()
    const card = shallowMount(BlockExcretionsUrinaryCard, modalOptions)
    const modal = card.getComponent(DodoItemModal)
    expect(modal.props()).toMatchObject({ label: 'Wasserlassen', modalLabel: 'Wasserlassen', state: '' })
    const chip = (label: string) => modal.findAllComponents(DodoToggleChip).find(entry => entry.text() === label)!
    chip('Nierenklopfschmerz').vm.$emit('update:modelValue', true)
    await nextTick()
    chip('Nierenlager Frei').vm.$emit('update:modelValue', true)
    await nextTick()
    expect(chip('Nierenklopfschmerz').props('modelValue')).toBe(false)
    expect(store.doku.textAreaBlocks.excretions_urinary.details.pain).toEqual(['Nierenlager Frei'])
    chip('Nierenklopfschmerz').vm.$emit('update:modelValue', true)
    await nextTick()
    expect(chip('Nierenlager Frei').props('modelValue')).toBe(false)
    await modal.getComponent(IonItem).trigger('click')
    await modal.getComponent(IonButton).trigger('click')
    await modal.getComponent(IonItem).trigger('click')
    expect(chip('Nierenklopfschmerz').props('modelValue')).toBe(true)
    chip('Nierenklopfschmerz').vm.$emit('update:modelValue', false)
    chip('Harnverhalt').vm.$emit('update:modelValue', false)
    await nextTick()
    expect(modal.props('state')).toBe('Keine Angabe')
    expect(store.textAreaBlocks.map(block => block.id)).toEqual([bowelId])
  })

  test('exposure controls reset the appropriate source and clear catheter complications', async () => {
    const store = setup()
    store.setCatheterType('transurethraler DK')
    store.doku.textAreaBlocks.excretions_urinary.details.catheterIssues = 'verstopft'
    const card = shallowMount(AbcdeExposureCard, { global: { renderStubDefaultSlot: true } })
    const urinaryCard = shallowMount(BlockExcretionsUrinaryCard, modalOptions)
    const complication = () => urinaryCard.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Komplikation')
    expect(complication()).toBeDefined()
    card.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Typ')!.vm.$emit('update:modelValue', '')
    await nextTick()
    expect(complication()).toBeUndefined()
    expect(store.doku.textAreaBlocks.excretions_urinary.details.catheterIssues).toBe('')
    expect(store.textAreaBlocks[1].text).toBe('Wasserlassen: Harnverhalt.')
    const toggles = card.findAllComponents(DodoInputToggle)
    toggles.find(toggle => toggle.text() === 'Stuhlgang auffällig?')!.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.textAreaBlocks.map(block => block.id)).toEqual([urinaryId])
    const examination = card.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'excretions')!
    examination.vm.$emit('update:assessed', false)
    examination.vm.$emit('remove')
    await nextTick()
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    expect(store.doku.xabcdE.excretions.value.urinaryAbnormalities).toBe(false)
    expect(store.textAreaBlocks).toEqual([])
  })
})

describe('Excretions source lifecycle', () => {
  test('resets each source independently when its abnormality is removed', () => {
    const store = setup()
    store.setTextAreaBlockActive(bowelId, false)
    store.setTextAreaBlockActive(urinaryId, false)
    store.setBowelAbnormalities(false)
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.textAreaBlocks).toEqual([expect.objectContaining({ id: urinaryId, active: false })])
    store.setTextAreaBlockActive(bowelId, false)
    expect(store.doku.textAreaBlocks.excretions_bowel.active[bowelId]).toBe(true)
    store.setBowelAbnormalities(true)
    expect(store.textAreaBlocks).toHaveLength(1)
    store.setUrinaryAbnormalities(false)
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    store.setUrinaryAbnormalities(true)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
  })

  test.each(['unassess', 'reset', 'no_emergency_call'] as const)('%s clears both sources and activation', action => {
    const store = setup()
    store.setTextAreaBlockActive(bowelId, false)
    store.setTextAreaBlockActive(urinaryId, false)
    if (action === 'unassess') store.setExcretionsAssessed(false)
    else if (action === 'reset') store.resetExcretions()
    else store.setFlavor('no_emergency_call', true)
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    expect(store.textAreaBlocks).toEqual([])
  })

  test('reselecting abnormalities and unrelated flavor changes retain details and activation', () => {
    const store = setup()
    store.setTextAreaBlockActive(bowelId, false)
    store.setBowelAbnormalities(true)
    store.setUrinaryAbnormalities(true)
    store.setExcretionsAssessed(true)
    store.setFlavor('trauma', true)
    expect(store.textAreaBlocks).toEqual([
      expect.objectContaining({ id: bowelId, active: false, text: 'Stuhlgang: Teerstuhl.' }),
      expect.objectContaining({ id: urinaryId, active: true, text: 'Wasserlassen: Harnverhalt.' }),
    ])
  })

  test('persists details and activation, restores OptionalValue and chip selections', async () => {
    const store = setup()
    store.setCatheterType('ISK')
    store.doku.textAreaBlocks.excretions_urinary.details.catheterIssues = 'disloziert'
    store.doku.textAreaBlocks.excretions_bowel.details.lastBowel = OptionalValue.active('2 Tagen')
    store.setTextAreaBlockActive(bowelId, false)
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValue(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks).toEqual(store.doku.textAreaBlocks)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Stuhlgang: zuletzt vor 2 Tagen; Teerstuhl.' })
    const card = shallowMount(BlockExcretionsUrinaryCard, modalOptions)
    expect(card.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Harnverhalt')?.props('modelValue')).toBe(true)
    expect(card.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Komplikation')?.props('modelValue')).toBe('disloziert')
  })

  test('hydration clears unavailable sources and stale catheter issues', async () => {
    const store = setup()
    store.setCatheterType('ISK')
    store.doku.textAreaBlocks.excretions_urinary.details.catheterIssues = 'gezogen'
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    saved.doku.xabcdE.excretions.value.bowelAbnormalities = false
    saved.doku.xabcdE.excretions.value.catheterType = ''
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(restored.doku.textAreaBlocks.excretions_urinary.details.catheterIssues).toBe('')
    expect(restored.textAreaBlocks).toEqual([expect.objectContaining({ text: 'Wasserlassen: Harnverhalt.' })])
  })

  test('reset audits composed text and history restores both sources', async () => {
    const store = setup()
    store.setTextAreaBlockActive(urinaryId, false)
    await store.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      [target]: 'Stuhlgang: Teerstuhl.\nEigener Text',
    }))
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks).toEqual([
      expect.objectContaining({ id: bowelId, active: true, text: 'Stuhlgang: Teerstuhl.' }),
      expect.objectContaining({ id: urinaryId, active: false, text: 'Wasserlassen: Harnverhalt.' }),
    ])
  })

  test('legacy sentences remain manual with empty block defaults and no duplication', async () => {
    const text = 'Stuhlgang: Teerstuhl.\nWasserlassen: Harnverhalt.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcdE: { excretions: { assessed: true, value: { bowelAbnormalities: true, urinaryAbnormalities: true } } },
      sampler: { symptoms: { additionalSymptoms: { _text: text } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })

  test('quickie reset does not register either obsolete quickie', () => {
    resetQuickies()
    expect(DATA_Quickies).not.toHaveProperty('excretions_bowel')
    expect(DATA_Quickies).not.toHaveProperty('excretions_urinary')
    expect(DATA_Quickies).toHaveProperty('intern_opqrst')
  })
})
