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
import type { ExcretionsBowelsDetails } from '@/types/blocks/excretions'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelectChips from '@/components/inputs/DodoInputSelectChips.vue'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import DodoInputTextArea from '@/components/inputs/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/inputs/DodoToggleChip.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoExaminationItem from '@/components/examination/DodoExaminationItem.vue'
import SampleSymptomsCard from '@/views/doku/sample/SampleSymptomsCard.vue'
import AbcdeExposureCard from '@/views/doku/abcde/AbcdeExposureCard.vue'
import BlockSchwindelCard from '@/views/doku/blocks/BlockSchwindelCard.vue'
import BlockExcretionsBowelsCard from '@/views/doku/blocks/BlockExcretionsBowelsCard.vue'
import BlockExcretionsUrinaryCard from '@/views/doku/blocks/BlockExcretionsUrinaryCard.vue'
import BlockBauchschmerzCard from '@/views/doku/blocks/BlockBauchschmerzCard.vue'

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
  store.doku.textAreaBlocks.excretions_bowel.details.blood = ['mixed']
  store.doku.textAreaBlocks.excretions_bowel.details.bloodColor = 'schwarz'
  store.doku.textAreaBlocks.excretions_urinary.details.output = ['Harnverhalt']
  store.doku.sampler.symptoms.additionalSymptoms.setText('Eigener Text')
  return store
}

const modalOptions = { global: { renderStubDefaultSlot: true, stubs: { DodoItemModal: false } } }

describe('Excretions text rendering', () => {
  test.each<[Partial<ExcretionsBowelsDetails>, string]>([
    [{ blood: ['paper'] }, 'hellrotes Blut am Toilettenpapier'],
    [{ blood: ['on_stool'], bloodColor: 'dunkelrot', bloodAmount: 'wenig' }, 'Blut auf Stuhl aufgelagert (dunkelrot, wenig)'],
    [{ blood: ['mixed'] }, 'Blut mit Stuhl vermischt'],
    [{ blood: ['without_stool'], bloodAmount: 'minimal' }, 'Blutabgang ohne Stuhl (minimal)'],
    [{ blood: ['mixed', 'on_stool'], bloodColor: 'hellrot', bloodAmount: 'deutlich' }, 'Blut auf Stuhl aufgelagert und mit Stuhl vermischt (hellrot, deutlich)'],
    [{ blood: ['clots', 'on_stool'], bloodColor: 'dunkelrot', bloodAmount: 'wenig' }, 'Blut auf Stuhl aufgelagert (dunkelrot, wenig, mit Koageln)'],
    [{ blood: ['clots', 'without_stool', 'mixed', 'paper', 'on_stool'], bloodColor: 'schwarz' }, 'hellrotes Blut am Toilettenpapier; Blut auf Stuhl aufgelagert und mit Stuhl vermischt und Blutabgang ohne Stuhl (schwarz, mit Koageln)'],
    [{ blood: ['paper', 'clots'], bloodColor: 'schwarz', bloodAmount: 'wenig' }, 'hellrotes Blut am Toilettenpapier'],
    [{ mucus: true }, 'Schleimbeimengungen'],
    [{ consistency: 'breiig', mucus: true, blood: ['mixed'] }, 'breiig, Schleimbeimengungen; Blut mit Stuhl vermischt'],
  ])('renders bleeding and mucus details %j', (details, expected) => {
    const state = createExcretionsBowelsBlockState()
    Object.assign(state.details, details)
    expect(bowels.render(state)?.text).toBe(`Stuhlgang: ${expected}.`)
  })

  test.each(['minimal', 'wenig', 'deutlich', 'überwiegend', 'nicht einschätzbar', 'ca. 20 ml'])('renders amount %s', amount => {
    const state = createExcretionsBowelsBlockState()
    Object.assign(state.details, { blood: ['mixed'], bloodAmount: amount })
    expect(bowels.render(state)?.text).toBe(`Stuhlgang: Blut mit Stuhl vermischt (${amount}).`)
  })

  test('ignores orphaned bleeding details without mutating them', () => {
    const state = createExcretionsBowelsBlockState()
    Object.assign(state.details, { blood: ['clots'], bloodAmount: 'wenig', bloodColor: 'schwarz' })
    expect(bowels.render(state)).toBeNull()
    expect(state.details.blood).toEqual(['clots'])
  })

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
      blood: ['paper'], bowelPain: true, bowelSounds: 'vermindert',
    })
    expect(bowels.render(state)?.text).toBe(
      'Stuhlgang: Obstipation, hartlaibig, zuletzt vor 2 Tagen; hellrotes Blut am Toilettenpapier, schmerzhafter Stuhlgang; DG vermindert.',
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
  test.each(['on_stool', 'mixed', 'without_stool'] as const)(
    'hides other blood group options while %s is selected and restores them after deselection', async (value) => {
      const store = useDokuStore()
      const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
      const blood = card.getComponent(DodoInputSelectChips)
      const initialOptions = blood.props('options')
      const group = [
        { value: 'on_stool', label: 'Auf Stuhl aufgelagert' },
        { value: 'mixed', label: 'Mit Stuhl vermischt' },
        { value: 'without_stool', label: 'Blutabgang ohne Stuhl' },
      ]
      expect(initialOptions[1]).toEqual(group)

      blood.vm.$emit('update:modelValue', ['paper', value])
      await nextTick()
      expect(blood.props('options')).toEqual([
        initialOptions[0], group.filter(option => option.value === value),
        [{ value: 'clots', label: 'Koagel' }],
      ])
      expect(blood.props('modelValue')).toEqual(['paper', value])

      blood.vm.$emit('update:modelValue', ['paper', value, 'clots'])
      await nextTick()
      expect(blood.props('options')[1]).toEqual(group.filter(option => option.value === value))

      blood.vm.$emit('update:modelValue', ['paper', 'clots'])
      await nextTick()
      expect(blood.props('options')).toEqual(initialOptions)
      expect(store.doku.textAreaBlocks.excretions_bowel.details.blood).toEqual(['paper'])
    },
  )

  test('keeps restored multiple blood group selections visible and individually removable', async () => {
    const store = useDokuStore()
    store.doku.textAreaBlocks.excretions_bowel.details.blood = ['on_stool', 'without_stool']
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    const blood = card.getComponent(DodoInputSelectChips)
    expect(blood.props('options')[1]).toEqual([
      { value: 'on_stool', label: 'Auf Stuhl aufgelagert' },
      { value: 'without_stool', label: 'Blutabgang ohne Stuhl' },
    ])
    expect(blood.props('modelValue')).toEqual(['on_stool', 'without_stool'])

    blood.vm.$emit('update:modelValue', ['on_stool'])
    await nextTick()
    expect(blood.props('options')[1]).toEqual([{ value: 'on_stool', label: 'Auf Stuhl aufgelagert' }])
    expect(blood.props('modelValue')).toEqual(['on_stool'])

    blood.vm.$emit('update:modelValue', [])
    await nextTick()
    expect(blood.props('options')[1]).toHaveLength(3)
    expect(blood.props('modelValue')).toEqual([])
  })

  test('groups blood chips, shows dependent fields and clears them after the last group selection', async () => {
    const store = useDokuStore()
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    const blood = card.getComponent(DodoInputSelectChips)
    const select = (label: string) => card.findAllComponents(DodoInputSelect).find(input => input.props('label') === label)
    const details = store.doku.textAreaBlocks.excretions_bowel.details
    expect(blood.props('options')).toEqual([
      [{ value: 'paper', label: 'Hellrotes Blut am Toilettenpapier' }],
      [{ value: 'on_stool', label: 'Auf Stuhl aufgelagert' }, { value: 'mixed', label: 'Mit Stuhl vermischt' }, { value: 'without_stool', label: 'Blutabgang ohne Stuhl' }],
    ])
    expect(select('Blutmenge')).toBeUndefined()
    expect(select('Farbe')).toBeUndefined()
    blood.vm.$emit('update:modelValue', ['paper'])
    await nextTick()
    expect(select('Blutmenge')).toBeUndefined()
    blood.vm.$emit('update:modelValue', ['paper', 'mixed'])
    await nextTick()
    expect(blood.props('options').at(-1)).toEqual([{ value: 'clots', label: 'Koagel' }])
    expect(select('Blutmenge')?.props()).toMatchObject({ modelValue: '', allowCustom: true, customOptionLabel: 'Benutzerdefinierte Angabe' })
    expect(select('Farbe')?.props('modelValue')).toBe('')
    select('Blutmenge')!.vm.$emit('update:modelValue', 'ca. 20 ml')
    select('Farbe')!.vm.$emit('update:modelValue', 'dunkelrot')
    blood.vm.$emit('update:modelValue', ['paper', 'mixed', 'clots'])
    await nextTick()
    expect(details).toMatchObject({ bloodAmount: 'ca. 20 ml', bloodColor: 'dunkelrot' })
    blood.vm.$emit('update:modelValue', ['paper', 'clots'])
    await nextTick()
    expect(details).toMatchObject({ blood: ['paper'], bloodAmount: '', bloodColor: '' })
    expect(select('Blutmenge')).toBeUndefined()
    expect(select('Farbe')).toBeUndefined()
    expect(blood.props('options')).toHaveLength(2)
    blood.vm.$emit('update:modelValue', ['mixed'])
    await nextTick()
    expect(select('Blutmenge')?.props('modelValue')).toBe('')
    expect(select('Farbe')?.props('modelValue')).toBe('')
  })

  test('switches amount options and clears the amount when blood without stool is toggled', async () => {
    const store = useDokuStore()
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    const blood = card.getComponent(DodoInputSelectChips)
    const details = store.doku.textAreaBlocks.excretions_bowel.details
    blood.vm.$emit('update:modelValue', ['mixed', 'clots'])
    await nextTick()
    details.bloodAmount = 'ca. 20 ml'
    details.bloodColor = 'hellrot'
    blood.vm.$emit('update:modelValue', ['mixed', 'clots', 'without_stool'])
    await nextTick()
    const amount = () => card.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Blutmenge')!
    expect(amount().props()).toMatchObject({
      disabled: false, modelValue: '', allowCustom: true, emptyLabel: 'Nicht erfasst',
      options: [
        { value: 'minimale Menge', label: 'minimale Menge' },
        { value: 'geringe Menge', label: 'geringe Menge' },
        { value: 'deutliche Menge', label: 'deutliche Menge' },
        { value: 'große Menge', label: 'große Menge' },
      ],
    })
    for (const value of ['minimale Menge', 'geringe Menge', 'deutliche Menge', 'große Menge', 'ca. 20 ml']) {
      amount().vm.$emit('update:modelValue', value)
      await nextTick()
      expect(details.bloodAmount).toBe(value)
      expect(bowels.render(store.doku.textAreaBlocks.excretions_bowel)?.text).toBe(
        `Stuhlgang: Blut mit Stuhl vermischt und Blutabgang ohne Stuhl (hellrot, ${value}, mit Koageln).`,
      )
    }
    blood.vm.$emit('update:modelValue', ['mixed', 'clots'])
    await nextTick()
    expect(amount().props()).toMatchObject({
      disabled: false, modelValue: '', allowCustom: true, emptyLabel: 'Nicht erfasst',
      options: [
        { value: 'minimale Menge', label: 'Minimal' },
        { value: 'geringe Menge', label: 'Wenig' },
        { value: 'deutliche Menge', label: 'Deutlich' },
        { value: 'überwiegend Blut', label: 'Überwiegend' },
      ],
    })
    expect(details).toMatchObject({ blood: ['mixed', 'clots'], bloodColor: 'hellrot' })
  })

  test.each(['minimale Menge', 'große Menge', 'überwiegend Blut', 'nicht einschätzbar', 'ca. 20 ml'])(
    'retains stored amount %s when opening the card', async bloodAmount => {
      const store = useDokuStore()
      const details = store.doku.textAreaBlocks.excretions_bowel.details
      Object.assign(details, { blood: ['without_stool'], bloodAmount })
      const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
      await nextTick()
      const amount = card.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Blutmenge')!
      expect(amount.props()).toMatchObject({ modelValue: bloodAmount, disabled: false, allowCustom: true })
      expect(details.bloodAmount).toBe(bloodAmount)
      expect(bowels.render(store.doku.textAreaBlocks.excretions_bowel)?.text).toBe(
        `Stuhlgang: Blutabgang ohne Stuhl (${bloodAmount}).`,
      )
    },
  )

  test('places the mucus toggle after consistency and includes it in the summary', async () => {
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    const mucus = card.findAllComponents(DodoInputToggle).find(toggle => toggle.text() === 'Schleimbeimengungen')!
    const consistency = card.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Konsistenz')!
    expect(consistency.element.nextElementSibling).toBe(mucus.element)
    mucus.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(card.getComponent(DodoItemModal).props('state')).toBe('')
    expect(bowels.render(useDokuStore().doku.textAreaBlocks.excretions_bowel)?.text).toBe('Stuhlgang: Schleimbeimengungen.')
    mucus.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(card.getComponent(DodoItemModal).props('state')).toBe('Keine Angabe')
  })

  test.each(['mixed', 'without_stool'] as const)('retains the restored amount for %s when replacing a protocol while the card is mounted', async finding => {
    const store = useDokuStore()
    const card = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    card.getComponent(DodoInputSelectChips).vm.$emit('update:modelValue', ['without_stool'])
    await nextTick()
    const restored = createExcretionsBowelsBlockState()
    Object.assign(restored.details, { blood: [finding], bloodAmount: 'ca. 20 ml', bloodColor: 'hellrot' })
    store.doku.textAreaBlocks.excretions_bowel = restored
    await nextTick()
    expect(store.doku.textAreaBlocks.excretions_bowel.details.bloodAmount).toBe('ca. 20 ml')
    expect(card.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Blutmenge')?.props('disabled')).toBe(false)
  })

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
    modal.findAllComponents(DodoInputSelectChips).find(select => select.props('label') === 'Blut')!.vm.$emit('update:modelValue', ['on_stool'])
    await nextTick()
    expect(editor.props('blocks')?.map(block => block.text)).toEqual(['Stuhlgang: Blut auf Stuhl aufgelagert (schwarz).', 'Wasserlassen: Harnverhalt.'])
    expect(store.generatedProtocol).toContain('Stuhlgang: Blut auf Stuhl aufgelagert (schwarz).\nWasserlassen: Harnverhalt.\nNeuer Text')
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
    expect(modal.findAllComponents(DodoInputSelectChips).find(select => select.props('label') === 'Blut')?.props('modelValue')).toEqual(['on_stool'])
    store.doku.textAreaBlocks.excretions_bowel.details.blood = []
    await nextTick()
    expect(modal.props('state')).toBe('Keine Angabe')
    store.doku.textAreaBlocks.excretions_bowel.details.blood = ['mixed']
    store.doku.textAreaBlocks.excretions_bowel.details.bloodColor = 'schwarz'
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
  test.each([
    ['', [], '', ''],
    ['Blut am Klopapier', ['paper'], '', 'Stuhlgang: hellrotes Blut am Toilettenpapier.'],
    ['Blut im Stuhl', ['mixed'], '', 'Stuhlgang: Blut mit Stuhl vermischt.'],
    ['Teerstuhl', ['mixed'], 'schwarz', 'Stuhlgang: Blut mit Stuhl vermischt (schwarz).'],
  ])('migrates legacy blood value %s from storage and history', async (legacyBlood, blood, bloodColor, text) => {
    const doku = JSON.parse(JSON.stringify(setup().doku))
    doku.textAreaBlocks.excretions_bowel.details = { blood: legacyBlood }
    vi.mocked(loadDokuState).mockResolvedValue({
      schemaVersion: 1, doku,
      protocolHistory: [{ id: 'legacy', archivedAt: '2026-11-09T10:00:00.000Z', doku }],
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    const assertDetails = () => {
      expect(store.doku.textAreaBlocks.excretions_bowel.details).toMatchObject({ blood, bloodAmount: '', bloodColor, mucus: false })
      expect(bowels.render(store.doku.textAreaBlocks.excretions_bowel)?.text ?? '').toBe(text)
    }
    assertDetails()
    expect(await store.restoreProtocolFromHistory('legacy')).toBe(true)
    assertDetails()
  })

  test.each([
    { blood: ['paper', 'clots'], bloodAmount: 'wenig', bloodColor: 'hellrot', expected: { blood: ['paper'], bloodAmount: '', bloodColor: '' } },
    { blood: ['without_stool', 'clots'], bloodAmount: 'wenig', bloodColor: 'dunkelrot', expected: { blood: ['without_stool', 'clots'], bloodAmount: 'wenig', bloodColor: 'dunkelrot' } },
  ])('normalizes stored dependent bleeding details $blood', async ({ expected, ...details }) => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcdE: { excretions: { assessed: true, value: { bowelAbnormalities: true } } },
      textAreaBlocks: { excretions_bowel: { details } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.excretions_bowel.details).toMatchObject(expected)
  })

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
      expect.objectContaining({ id: bowelId, active: false, text: 'Stuhlgang: Blut mit Stuhl vermischt (schwarz).' }),
      expect.objectContaining({ id: urinaryId, active: true, text: 'Wasserlassen: Harnverhalt.' }),
    ])
  })

  test('persists details and activation, restores OptionalValue and chip selections', async () => {
    const store = setup()
    store.setCatheterType('ISK')
    store.doku.textAreaBlocks.excretions_urinary.details.catheterIssues = 'disloziert'
    store.doku.textAreaBlocks.excretions_bowel.details.lastBowel = OptionalValue.active('2 Tagen')
    Object.assign(store.doku.textAreaBlocks.excretions_bowel.details, {
      blood: ['paper', 'mixed', 'clots'], bloodAmount: 'ca. 20 ml', mucus: true,
    })
    store.setTextAreaBlockActive(bowelId, false)
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValue(vi.mocked(saveDokuState).mock.lastCall![0])
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks).toEqual(store.doku.textAreaBlocks)
    expect(restored.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Stuhlgang: Schleimbeimengungen, zuletzt vor 2 Tagen; hellrotes Blut am Toilettenpapier; Blut mit Stuhl vermischt (schwarz, ca. 20 ml, mit Koageln).' })
    const bowelCard = shallowMount(BlockExcretionsBowelsCard, modalOptions)
    expect(bowelCard.getComponent(DodoInputSelectChips).props('modelValue')).toEqual(['paper', 'mixed', 'clots'])
    expect(bowelCard.findAllComponents(DodoInputSelect).find(input => input.props('label') === 'Blutmenge')?.props('modelValue')).toBe('ca. 20 ml')
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
      [target]: 'Stuhlgang: Blut mit Stuhl vermischt (schwarz).\nEigener Text',
    }))
    expect(store.doku.textAreaBlocks.excretions_bowel).toEqual(createExcretionsBowelsBlockState())
    expect(store.doku.textAreaBlocks.excretions_urinary).toEqual(createExcretionsUrinaryBlockState())
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks).toEqual([
      expect.objectContaining({ id: bowelId, active: true, text: 'Stuhlgang: Blut mit Stuhl vermischt (schwarz).' }),
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
