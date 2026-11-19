import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createKopfschmerzBlockState, KopfschmerzTextAreaBlock, WOUND_LOCATION } from '@/data/blocks/kopfschmerz'
import { AssessedValue } from '@/types/protocol/input'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'
import { severityOptions } from '@/data/blocks/bauchschmerz'
import type { KopfschmerzDetails } from '@/types/blocks/kopfschmerz'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import DodoInputTextArea from '@/components/inputs/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/inputs/DodoToggleChip.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import DodoExaminationItem from '@/components/examination/DodoExaminationItem.vue'
import DodoBlockSourceShortcut from '@/components/protocol/DodoBlockSourceShortcut.vue'
import BlockKopfschmerzCard from '@/views/doku/blocks/BlockKopfschmerzCard.vue'
import BlockSehenCard from '@/views/doku/blocks/BlockSehenCard.vue'
import SampleSymptomsCard from '@/views/doku/sample/SampleSymptomsCard.vue'
import AbcdeDisabilityCard from '@/views/doku/abcde/AbcdeDisabilityCard.vue'
import SampleSymptomsTrauma from '@/views/doku/sample/SampleSymptomsTrauma.vue'
import DodoStateItem from '@/components/protocol/DodoStateItem.vue'

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

const blockId = 'kopfschmerz.symptoms'
const target = 'sampler.symptoms.additionalSymptoms'
const rendered = new KopfschmerzTextAreaBlock()
const global = { renderStubDefaultSlot: true }

function setup() {
  const store = useDokuStore()
  store.setHeadache(true)
  store.doku.textAreaBlocks.kopfschmerz.details.quality = ['stechend']
  store.doku.sampler.symptoms.additionalSymptoms.setText('Eigener Text')
  return store
}

describe('Kopfschmerz text rendering', () => {
  test('starts empty and renders partial findings without inventing negative symptoms', () => {
    const state = createKopfschmerzBlockState()
    expect(rendered.render(state)).toBeNull()
    state.details.quality = ['stechend']
    expect(rendered.render(state)).toMatchObject({
      id: blockId, sourceId: 'kopfschmerz', target, active: true, complete: true,
      text: 'Kopfschmerzen: stechend.',
    })
    expect(state.values).toEqual({})
  })

  test('renders all fields in stable order regardless of selection order', () => {
    const state = createKopfschmerzBlockState()
    Object.assign(state.details, {
      onset: 'schlagartig', peak: 'innerhalb von 5 Minuten',
      location: ['Schläfe', 'Stirn'], side: 'links', quality: ['pulsierend–pochend'],
      severity: 'stark', progression: 'zunehmend', pattern: 'attackenartig',
      provocation: ['körperliche Belastung'],
    })
    expect(rendered.render(state)?.text).toBe(
      'Kopfschmerzen: schlagartiger Beginn; Schmerzmaximum innerhalb von 5 Minuten erreicht; ' +
      'links an der Stirn und Schläfe; pulsierend–pochend; stark; zunehmend, attackenartig; ' +
      'Verstärkung/Auslösung: körperliche Belastung.',
    )
  })

  test.each(['minimal', 'leicht', 'mittel', 'stark', 'maximal'] as const)('renders severity %s and distinguishes it from unassessed', value => {
    const state = createKopfschmerzBlockState()
    state.details.severity = value
    expect(rendered.render(state)?.text).toBe(`Kopfschmerzen: ${value}.`)
    state.details.severity = ''
    expect(rendered.render(state)).toBeNull()
  })

  test.each<[string[], KopfschmerzDetails['side'], string]>([
    [['Stirn'], 'links', 'links an der Stirn'],
    [['Schläfe', 'Stirn'], 'links', 'links an der Stirn und Schläfe'],
    [['hinter dem Auge'], 'beidseits', 'beidseits hinter den Augen'],
    [['Schläfe'], 'beidseits', 'beidseits an den Schläfen'],
    [['hinter dem Auge'], 'rechts', 'rechts hinter dem Auge'],
    [['Hinterkopf'], '', 'am Hinterkopf'],
    [['Stirn', 'Hinterkopf'], '', 'an der Stirn und am Hinterkopf'],
    [[], 'rechts', 'rechts'],
    [[WOUND_LOCATION], '', 'im Wundbereich'],
    [['gesamter Kopf', 'Stirn'], 'links', 'am gesamten Kopf'],
  ])('connects locations %s and side %s', (location, side, expected) => {
    const state = createKopfschmerzBlockState()
    Object.assign(state.details, { location, side })
    expect(rendered.render(state)?.text).toBe(`Kopfschmerzen: ${expected}.`)
  })

  test('ignores removed legacy fields even if supplied directly', () => {
    const state = createKopfschmerzBlockState()
    Object.assign(state.details, { onspan: '2 Stunden', accompanying: ['Übelkeit'] })
    expect(rendered.render(state)).toBeNull()
  })

  test.each(['sofort', 'innerhalb von 5 Minuten', 'später'] as const)('renders peak %s only for sudden onset', peak => {
    const state = createKopfschmerzBlockState()
    state.details.peak = peak
    expect(rendered.render(state)).toBeNull()
    state.details.onset = 'allmählich'
    expect(rendered.render(state)).toBeNull()
    state.details.onset = 'schlagartig'
    expect(rendered.render(state)?.text).toContain(`Schmerzmaximum ${peak} erreicht`)
  })
})

describe('Kopfschmerz form', () => {
  test.each(['allmählich', ''] as const)('clears peak for onset %s and defaults to immediate on the next sudden onset', async nextOnset => {
    const store = useDokuStore()
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const select = (label: string) => form.findAllComponents(DodoInputSelect).find(input => input.props('label') === label)
    expect(select('Beginn')!.props()).toMatchObject({
      modelValue: 'allmählich',
      options: [{ value: 'allmählich', label: 'Allmählich / k.A.' }, { value: 'schlagartig', label: 'Schlagartig' }],
    })
    expect(select('Beginn')!.props('emptyLabel')).toBeUndefined()
    expect(select('↳ Schmerzmaximum')).toBeUndefined()
    select('Beginn')!.vm.$emit('update:modelValue', 'schlagartig')
    await nextTick()
    expect(select('↳ Schmerzmaximum')!.props('modelValue')).toBe('sofort')
    expect(select('↳ Schmerzmaximum')!.props('emptyLabel')).toBeUndefined()
    select('↳ Schmerzmaximum')!.vm.$emit('update:modelValue', 'später')
    expect(store.doku.textAreaBlocks.kopfschmerz.details.peak).toBe('später')
    select('Beginn')!.vm.$emit('update:modelValue', nextOnset)
    await nextTick()
    expect(select('↳ Schmerzmaximum')).toBeUndefined()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.peak).toBe('')
    expect(select('Beginn')!.props('modelValue')).toBe('allmählich')
    expect(rendered.render(store.doku.textAreaBlocks.kopfschmerz)).toBeNull()
    select('Beginn')!.vm.$emit('update:modelValue', 'schlagartig')
    await nextTick()
    expect(select('↳ Schmerzmaximum')!.props('modelValue')).toBe('sofort')
  })

  test('allows multiple regions, excludes whole head in both directions, and deselects chips', async () => {
    const store = useDokuStore()
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const toggle = async (label: string, enabled = true) => {
      form.findAllComponents(DodoToggleChip).find(chip => chip.text() === label)!.vm.$emit('update:modelValue', enabled)
      await nextTick()
    }
    const details = store.doku.textAreaBlocks.kopfschmerz.details
    await toggle('Stirn')
    await toggle('Schläfe')
    expect(details.location).toEqual(['Stirn', 'Schläfe'])
    await toggle('Links')
    await toggle('Gesamter Kopf')
    expect(details.location).toEqual(['gesamter Kopf'])
    expect(details.side).toBe('')
    for (const label of ['Links', 'Rechts', 'Beidseits', 'Stirn', 'Schläfe', 'Hinterkopf', 'hinter dem Auge', WOUND_LOCATION]) {
      expect(form.findAllComponents(DodoToggleChip).some(chip => chip.text() === label)).toBe(false)
    }
    await toggle('Gesamter Kopf', false)
    expect(details.location).toEqual([])
    expect(details.side).toBe('')
    await toggle('hinter dem Auge')
    expect(details.location).toEqual(['hinter dem Auge'])
    await toggle('hinter dem Auge', false)
    await toggle('stechend')
    await toggle('drückend')
    await toggle('Husten–Pressen')
    await toggle('Lagewechsel')
    expect(rendered.render(store.doku.textAreaBlocks.kopfschmerz)?.text).toBe(
      'Kopfschmerzen: drückend, stechend; Verstärkung/Auslösung: Husten–Pressen, Lagewechsel.',
    )
    for (const label of ['stechend', 'drückend', 'Husten–Pressen', 'Lagewechsel']) await toggle(label, false)
    expect(form.getComponent(DodoItemModal).props('state')).toBe('Keine Angabe')
  })

  test.each(['Links', 'Rechts'])('combines side chips starting with %s and clears bilateral selection', async first => {
    const store = useDokuStore()
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const chip = (label: string) => form.findAllComponents(DodoToggleChip).find(item => item.text() === label)
    const second = first === 'Links' ? 'Rechts' : 'Links'
    expect(chip(first)!.props()).toMatchObject({ color: 'warning', modelValue: false })
    chip(first)!.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.side).toBe(first.toLowerCase())
    chip(first)!.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.side).toBe('')
    chip(first)!.vm.$emit('update:modelValue', true)
    chip(second)!.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(chip(first)).toBeUndefined()
    expect(chip(second)).toBeUndefined()
    expect(chip('Beidseits')!.props()).toMatchObject({ color: 'success', modelValue: true })
    expect(store.doku.textAreaBlocks.kopfschmerz.details.side).toBe('beidseits')
    chip('Beidseits')!.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.side).toBe('')
    expect(chip('Beidseits')).toBeUndefined()
    expect(chip(first)!.props('modelValue')).toBe(false)
    expect(chip(second)!.props('modelValue')).toBe(false)
  })

  test('hides alternatives independently in each course group and allows clearing every choice', async () => {
    const store = useDokuStore()
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const chip = (label: string) => form.findAllComponents(DodoToggleChip).find(item => item.text() === label)
    const details = store.doku.textAreaBlocks.kopfschmerz.details
    for (const progression of ['Zunehmend', 'Gleichbleibend', 'Abnehmend']) {
      expect(chip(progression)!.props('color')).toBe('primary')
      chip(progression)!.vm.$emit('update:modelValue', true)
      await nextTick()
      for (const other of ['Zunehmend', 'Gleichbleibend', 'Abnehmend'].filter(value => value !== progression)) {
        expect(chip(other)).toBeUndefined()
      }
      for (const pattern of ['Anhaltend', 'Attackenartig']) {
        expect(chip(pattern)!.props('color')).toBe('success')
        chip(pattern)!.vm.$emit('update:modelValue', true)
        await nextTick()
        expect(chip(pattern === 'Anhaltend' ? 'Attackenartig' : 'Anhaltend')).toBeUndefined()
        expect(details.progression).toBe(progression.toLowerCase())
        expect(details.pattern).toBe(pattern.toLowerCase())
        chip(pattern)!.vm.$emit('update:modelValue', false)
        await nextTick()
        expect(details.pattern).toBe('')
      }
      chip(progression)!.vm.$emit('update:modelValue', false)
      await nextTick()
      expect(details.progression).toBe('')
    }
  })

  test('removes time-span, side select and accompanying symptom guidance', () => {
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const labels = form.findAllComponents(DodoInputSelect).map(select => select.props('label'))
    expect(labels).toEqual(['Beginn', 'Schmerzen'])
    for (const text of ['Seit wann?', 'Begleitsymptome', 'Übelkeit', 'Erbrechen', 'Lichtempfindlichkeit', 'Geräuschempfindlichkeit', 'Nackenschmerz']) {
      expect(form.text()).not.toContain(text)
    }
  })

  test('updates the output live while keeping manual text, undo and other findings independent', async () => {
    const store = useDokuStore()
    store.setHeadache(true)
    const manual = store.doku.sampler.symptoms.additionalSymptoms
    manual.setText('Vorher')
    manual.setText('Eigener Text')
    const findings = JSON.stringify([store.doku.xabcDe, store.doku.xabcdE, store.doku.sampler.symptoms.trauma])
    const symptoms = shallowMount(SampleSymptomsCard, { global: { ...global, stubs: { BlockKopfschmerzCard: false } } })
    const form = symptoms.getComponent(BlockKopfschmerzCard)
    const editor = symptoms.getComponent(DodoInputTextArea)
    const nrs = form.findAllComponents(DodoInputSelect).find(select => select.props('label') === 'Schmerzen')!
    expect(nrs.props()).toMatchObject({ options: severityOptions, emptyLabel: 'Keine Angabe' })
    nrs.vm.$emit('update:modelValue', 'minimal')
    await nextTick()
    expect(editor.props('blocks')).toEqual([expect.objectContaining({ text: 'Kopfschmerzen: minimal.', active: true })])
    expect(store.generatedProtocol).toContain('Kopfschmerzen: minimal.\nEigener Text')
    editor.vm.$emit('activation-change', blockId, false)
    await nextTick()
    expect(store.generatedProtocol).not.toContain('Kopfschmerzen:')
    nrs.vm.$emit('update:modelValue', '')
    await nextTick()
    expect(store.textAreaBlocks).toEqual([])
    expect(form.getComponent(DodoItemModal).props('state')).toBe('Keine Angabe')
    nrs.vm.$emit('update:modelValue', 'maximal')
    await nextTick()
    expect(editor.props('blocks')?.[0]).toMatchObject({ active: false, text: 'Kopfschmerzen: maximal.' })
    manual.undo()
    expect(manual.value).toBe('Vorher')
    expect(JSON.stringify([store.doku.xabcDe, store.doku.xabcdE, store.doku.sampler.symptoms.trauma])).toBe(findings)
    editor.vm.$emit('activation-change', blockId, true)
    await nextTick()
    expect(store.generatedProtocol).toContain('Kopfschmerzen: maximal.\nVorher')
  })
})

describe('Kopfschmerz source lifecycle', () => {
  test('shows the form before vision details only when the headache finding and symptoms are available', async () => {
    const store = useDokuStore()
    const symptoms = shallowMount(SampleSymptomsCard, { global })
    expect(symptoms.findComponent(BlockKopfschmerzCard).exists()).toBe(false)
    store.setHeadache(true)
    store.setVisionSymptoms(true)
    await nextTick()
    expect(symptoms.getComponent(BlockKopfschmerzCard).element.nextElementSibling).toBe(symptoms.getComponent(BlockSehenCard).element)
    store.doku.flavors.no_emergency_call = true
    await nextTick()
    expect(symptoms.findComponent(BlockKopfschmerzCard).exists()).toBe(false)
    store.doku.flavors.no_emergency_call = false
    store.setHeadache(false)
    await nextTick()
    expect(symptoms.findComponent(BlockKopfschmerzCard).exists()).toBe(false)
  })

  test('D toggle and removal reset details and activation, and explicit nonverbal assessment enables editing', async () => {
    const store = setup()
    store.setFlavor('non_verbal', true)
    const disability = shallowMount(AbcdeDisabilityCard, { global: { ...global, stubs: { DodoInputToggle: false } } })
    const row = disability.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'headache')!
    expect(row.props('assessed')).toBe(true)
    expect(row.getComponent(DodoBlockSourceShortcut).props('source')).toBe('kopfschmerz')
    store.setTextAreaBlockActive(blockId, false)
    row.getComponent(DodoInputToggle).vm.$emit('update:modelValue', false)
    expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
    row.getComponent(DodoInputToggle).vm.$emit('update:modelValue', true)
    store.doku.textAreaBlocks.kopfschmerz.details.quality = ['stechend']
    row.vm.$emit('update:assessed', false)
    row.vm.$emit('remove')
    await nextTick()
    expect(store.doku.xabcDe.isExamined('headache')).toBe(false)
    expect(store.doku.xabcDe.headache).toBe(false)
    expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    row.vm.$emit('update:assessed', true)
    row.vm.$emit('select')
    await nextTick()
    expect(row.props('assessed')).toBe(true)
    expect(store.context.hasHeadache).toBe(true)
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
  })

  test('clears implicit findings on nonverbal transition but preserves explicit findings and unrelated flavor changes', () => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    for (const flavor of ['trauma', 'verlegung', 'einweisung', 'non_verbal'] as const) store.setFlavor(flavor, true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Kopfschmerzen: stechend.' })
    store.doku.xabcDe.assessment.headache = 'auto'
    store.setFlavor('non_verbal', true)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
  })

  test('no-emergency-call resets explicitly assessed headache details', () => {
    const store = setup()
    store.setTextAreaBlockActive(blockId, false)
    store.setFlavor('no_emergency_call', true)
    expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
    store.setHeadache(true)
    expect(store.textAreaBlocks).toEqual([])
  })

  test.each([true, false])('persists structured details and activation=%s and restores from history', async active => {
    const store = setup()
    Object.assign(store.doku.textAreaBlocks.kopfschmerz.details, {
      onset: 'schlagartig', peak: 'sofort', severity: 'minimal', location: ['Stirn', 'Schläfe'],
    })
    store.setTextAreaBlockActive(blockId, active)
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.kopfschmerz).toEqual(store.doku.textAreaBlocks.kopfschmerz)
    const block = restored.textAreaBlocks[0]
    expect(block).toMatchObject({ active, text: expect.stringContaining('minimal') })
    const form = shallowMount(BlockKopfschmerzCard, { global })
    expect(form.findAllComponents(DodoToggleChip).find(chip => chip.text() === 'Stirn')!.props('modelValue')).toBe(true)
    await restored.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      [target]: active ? `${block.text}\nEigener Text` : 'Eigener Text',
    }))
    expect(restored.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
    expect(await restored.restoreProtocolFromHistory(restored.protocolHistory[0].id)).toBe(true)
    expect(restored.textAreaBlocks[0]).toEqual(block)
  })

  test.each(['negative', 'unassessed', 'gradual', 'empty'] as const)('cleans stale saved details for %s', async reason => {
    const store = setup()
    store.doku.textAreaBlocks.kopfschmerz.details.onset = 'schlagartig'
    store.doku.textAreaBlocks.kopfschmerz.details.peak = 'sofort'
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    if (reason === 'negative') saved.doku.xabcDe.headache = false
    else if (reason === 'unassessed') saved.doku.xabcDe.assessment.headache = 'inactive'
    else saved.doku.textAreaBlocks.kopfschmerz.details.onset = reason === 'gradual' ? 'allmählich' : ''
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.peak).toBe('')
    if (reason === 'negative' || reason === 'unassessed') {
      expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
      expect(store.textAreaBlocks).toEqual([])
    } else expect(store.textAreaBlocks[0].text).not.toContain('Schmerzmaximum')
  })

  test.each([
    [0, 'minimal'], [1, 'minimal'], [2, 'leicht'], [3, 'leicht'], [4, 'mittel'], [6, 'mittel'],
    [7, 'stark'], [8, 'stark'], [9, 'maximal'], [10, 'maximal'], [-1, ''], [11, ''], [2.5, ''], [NaN, ''],
  ])('migrates assessed NRS %s to %s before hydration', async (value, expected) => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { headache: true },
      textAreaBlocks: { kopfschmerz: { details: { severity: AssessedValue.assessed(value) } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.severity).toBe(expected)
  })

  test.each([AssessedValue.unassessed(0), AssessedValue.unassessed(10), null, 'invalid'])('leaves unassessed or invalid legacy severity %s empty', async severity => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { headache: true }, textAreaBlocks: { kopfschmerz: { details: { severity } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.severity).toBe('')
    expect(store.textAreaBlocks).toEqual([])
  })

  test('discards removed fields and normalizes whole-head and sudden-onset legacy details through history', async () => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { headache: true },
      sampler: { symptoms: { additionalSymptoms: { _text: 'Eigener Text' } } },
      textAreaBlocks: { kopfschmerz: { active: { [blockId]: false }, details: {
        onspan: '2 Stunden', accompanying: ['Übelkeit'], onset: 'schlagartig', peak: '',
        side: 'links', location: ['Stirn', 'gesamter Kopf', WOUND_LOCATION], severity: AssessedValue.assessed(7),
      } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    const details = store.doku.textAreaBlocks.kopfschmerz.details
    expect(details).toMatchObject({ side: '', location: ['gesamter Kopf'], peak: 'sofort', severity: 'stark' })
    expect(details).not.toHaveProperty('onspan')
    expect(details).not.toHaveProperty('accompanying')
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false,
      text: 'Kopfschmerzen: schlagartiger Beginn; Schmerzmaximum sofort erreicht; am gesamten Kopf; stark.' })
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
    await store.newProtocol()
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.doku.textAreaBlocks.kopfschmerz.details).toEqual(details)
    expect(store.textAreaBlocks[0].active).toBe(false)
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe('Eigener Text')
  })

  test('loads legacy protocols with empty new state and keeps existing prose exactly once', async () => {
    const text = 'Kopfschmerzen: stechend.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { headache: true },
      sampler: { symptoms: { additionalSymptoms: { _text: text } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.kopfschmerz).toEqual(createKopfschmerzBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.symptoms.additionalSymptoms.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })
})

describe('wound-localized headache and SHT', () => {
  function setupTrauma() {
    const store = setup()
    store.setFlavor('trauma', true)
    store.doku.ident.age.timespan = 35
    store.doku.sampler.symptoms.trauma.head.isInjured = true
    return store
  }

  test('shows a yellow trauma-only chip, with exclusive selection and shared SHT state', async () => {
    const store = setup()
    store.doku.ident.age.timespan = 35
    const form = shallowMount(BlockKopfschmerzCard, { global })
    const chip = (label: string) => form.findAllComponents(DodoToggleChip).find(item => item.text() === label)
    expect(chip(WOUND_LOCATION)).toBeUndefined()
    store.setFlavor('trauma', true)
    store.doku.sampler.symptoms.trauma.head.isInjured = true
    const trauma = shallowMount(SampleSymptomsTrauma, { global })
    const headState = () => trauma.findAllComponents(DodoStateItem)[0].props('title')
    await nextTick()
    expect(chip(WOUND_LOCATION)!.props('color')).toBe('warning')
    expect(trauma.findAllComponents(DodoInputSelect).some(select => select.props('label') === 'Kopfschmerzen')).toBe(false)
    expect(headState()).toBe('SHT möglich')
    chip('Stirn')!.vm.$emit('update:modelValue', true)
    chip(WOUND_LOCATION)!.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.location).toEqual([WOUND_LOCATION])
    expect(store.textAreaBlocks[0].text).toContain('im Wundbereich')
    expect(headState()).toBe('SHT unwahrscheinlich')
    // Deactivating the generated sentence must not change the clinical finding.
    store.setTextAreaBlockActive(blockId, false)
    expect(store.doku.sampler.symptoms.trauma.head.hasWoundOnlyHeadache).toBe(true)
    for (const location of ['gesamter Kopf', 'Schläfe']) {
      chip(location === 'gesamter Kopf' ? 'Gesamter Kopf' : location)!.vm.$emit('update:modelValue', true)
      await nextTick()
      expect(store.doku.textAreaBlocks.kopfschmerz.details.location).toEqual([location])
      expect(headState()).toBe('SHT möglich')
      if (location === 'gesamter Kopf') {
        expect(chip(WOUND_LOCATION)).toBeUndefined()
        chip('Gesamter Kopf')!.vm.$emit('update:modelValue', false)
        await nextTick()
      }
      chip(WOUND_LOCATION)!.vm.$emit('update:modelValue', true)
      await nextTick()
      expect(store.doku.textAreaBlocks.kopfschmerz.details.location).toEqual([WOUND_LOCATION])
    }
    chip(WOUND_LOCATION)!.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(headState()).toBe('SHT möglich')
    chip(WOUND_LOCATION)!.vm.$emit('update:modelValue', true)
    store.setFlavor('trauma', false)
    await nextTick()
    expect(chip(WOUND_LOCATION)).toBeUndefined()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.location).toEqual([])
    expect(store.doku.textAreaBlocks.kopfschmerz.details.quality).toEqual(['stechend'])
  })

  test('preserves other SHT indicators and handles non-wound or contradictory locations conservatively', () => {
    const store = setupTrauma()
    const head = store.doku.sampler.symptoms.trauma.head
    const details = store.doku.textAreaBlocks.kopfschmerz.details
    details.location = [WOUND_LOCATION]
    expect(head.generateText()).toContain('Schmerzen nur im Wundbereich - SHT unwahrsch')
    head.wasInitiallyUnconscious = true
    expect(head.hasSHTIndicators).toBe(true)
    expect(head.generateText()).toContain('inital bewusstlos')
    expect(head.generateText()).not.toContain('Kopfschmerzen')
    head.wasInitiallyUnconscious = false
    for (const locations of [[], ['Stirn'], ['gesamter Kopf'], [WOUND_LOCATION, 'Stirn']]) {
      details.location = locations
      expect(head.hasSHTIndicators).toBe(true)
      expect(head.generateText()).toContain('Kopfschmerzen')
    }
    details.location = [WOUND_LOCATION]
    store.setDizziness('gerichteter')
    expect(head.generateText()).toContain('Schwindel')
    expect(head.generateText()).not.toContain('Kopfschmerzen')
    store.setDizziness('kein')
    store.setHeadache(false)
    expect(head.hasSHTIndicators).toBe(false)
    expect(head.generateText()).not.toContain('Wundbereich')
  })

  test('round-trips the wound location and SHT result through persistence and history', async () => {
    const store = setupTrauma()
    store.doku.textAreaBlocks.kopfschmerz.details.location = [WOUND_LOCATION]
    store.setTextAreaBlockActive(blockId, false)
    await store.persistToStorage()
    const saved = JSON.parse(JSON.stringify(vi.mocked(saveDokuState).mock.lastCall![0]))
    expect(saved.doku.sampler.symptoms.trauma.head).not.toHaveProperty('headacheType')
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    await store.hydrateFromStorage()
    expect(store.doku.sampler.symptoms.trauma.head.hasWoundOnlyHeadache).toBe(true)
    expect(store.doku.sampler.symptoms.trauma.head.hasSHTIndicators).toBe(false)
    await store.newProtocol()
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.doku.sampler.symptoms.trauma.head.hasWoundOnlyHeadache).toBe(true)
    expect(store.textAreaBlocks[0].active).toBe(false)
  })

  test.each([
    { legacy: 'local', trauma: true, location: [], expected: [WOUND_LOCATION] },
    { legacy: 'local', trauma: true, location: ['Stirn'], expected: ['Stirn'] },
    { legacy: 'global', trauma: true, location: [], expected: [] },
    { legacy: 'local', trauma: false, location: [], expected: [] },
    { legacy: undefined, trauma: false, location: [WOUND_LOCATION], expected: [] },
  ])('migrates legacy $legacy with trauma=$trauma and location=$location', async ({ legacy, trauma, location, expected }) => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      flavors: { trauma },
      xabcDe: { headache: true },
      sampler: { symptoms: { trauma: { head: { isInjured: true, headacheType: legacy } } } },
      textAreaBlocks: { kopfschmerz: { details: { location } } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.kopfschmerz.details.location).toEqual(expected)
    expect(store.doku.sampler.symptoms.trauma.head).not.toHaveProperty('headacheType')
  })
})
