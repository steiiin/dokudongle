import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { enableAutoUnmount, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createIntoxicationBlockState, intoxicationReasonRows, renderIntoxicationText } from '@/data/blocks/intoxikation'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import DodoInputSelect from '@/components/DodoInputSelect.vue'
import DodoInputSelectChips from '@/components/DodoInputSelectChips.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoToggleChip from '@/components/DodoToggleChip.vue'
import DodoExaminationItem from '@/components/DodoExaminationItem.vue'
import BlockIntoxikationCard from '@/views/dokuCards/blocksourceCards/BlockIntoxikationCard.vue'
import SamplePlerCard from '@/views/dokuCards/sampleCards/SamplePlerCard.vue'
import AbcdeDisabilityCard from '@/views/dokuCards/abcdeCards/AbcdeDisabilityCard.vue'

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
const blockId = 'intoxikation.pler'
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function setup() {
  const store = useDokuStore()
  store.setIntoxicationAssessed(true)
  store.setIntoxicationSubstance('alcohol', true)
  store.setIntoxicationBasis('alcohol', 'confirmed')
  store.doku.textAreaBlocks.intoxikation.details.substances.alcohol.amount = '3 Bier'
  store.setIntoxicationSubstance('cannabis', true)
  store.doku.textAreaBlocks.intoxikation.details.substances.cannabis.reasons = ['Gerötete Augen', 'Fremdanamnestischer Hinweis']
  store.setIntoxicationSubstance('cocaine', true)
  store.setIntoxicationBasis('cocaine', 'positive')
  store.doku.sampler.pler.PLER.setText('Eigener Text')
  return store
}

describe('intoxication blocks', () => {
  test('separates D summary from PLER details and keeps manual text unchanged', () => {
    const store = setup()
    expect(store.intoxicationSummary).toBe('Alkohol / Vd. Cannabis / Kokain')
    expect(store.context.isNormal).toBe(true)
    const dLine = store.generatedProtocol.split('\n').find(line => line.startsWith('D:'))!
    expect(dLine).toContain('Intox: Alkohol / Vd. Cannabis / Kokain')
    expect(dLine).not.toMatch(/3 Bier|Gerötete Augen|Test positiv/)
    const detailText = 'Alkohol: Konsum bestätigt; Menge: 3 Bier.\n'
      + 'Cannabis: Verdacht; Hinweise: Gerötete Augen, Fremdanamnestischer Hinweis.\nKokain: Test positiv.'
    expect(store.textAreaBlocks[0]).toMatchObject({ id: blockId, active: true, text: detailText })
    expect(store.freeformText['sampler.pler.PLER']).toBe(`${detailText}\nEigener Text`)
    expect(store.generatedProtocol.split(detailText)).toHaveLength(2)
    expect(store.doku.sampler.pler.PLER.value).toBe('Eigener Text')
    store.setTextAreaBlockActive(blockId, false)
    expect(store.generatedProtocol).toContain('Intox: Alkohol / Vd. Cannabis / Kokain')
    expect(store.generatedProtocol).not.toContain(detailText)
    expect(store.freeformText['sampler.pler.PLER']).toBe('Eigener Text')
  })

  test('omits empty selections and unnamed other substances but allows incomplete details', () => {
    const store = useDokuStore()
    store.setIntoxicationAssessed(true)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.generatedProtocol).not.toContain('Intox:')
    expect(store.context.isLow).toBe(true)
    store.setIntoxicationSubstance('other', true)
    store.doku.textAreaBlocks.intoxikation.details.otherName = '  '
    expect(store.textAreaBlocks).toEqual([])
    store.doku.textAreaBlocks.intoxikation.details.otherName = '  GHB  '
    store.setIntoxicationSubstance('alcohol', true)
    expect(store.intoxicationSummary).toBe('Vd. Alkohol / Vd. GHB')
    expect(store.textAreaBlocks[0].text).toBe('Alkohol: Verdacht.\nGHB: Verdacht.')
    store.setIntoxicationBasis('alcohol', 'positive')
    expect(store.doku.textAreaBlocks.intoxikation.details.substances.alcohol.basis).toBe('suspected')
    store.setIntoxicationBasis('alcohol', 'confirmed')
    expect(store.textAreaBlocks[0].text).toContain('Alkohol: Konsum bestätigt.')
  })

  test('clears incompatible details on basis changes and all details when deselected', () => {
    const store = setup()
    const details = store.doku.textAreaBlocks.intoxikation.details
    store.setIntoxicationBasis('cannabis', 'confirmed')
    expect(details.substances.cannabis.reasons).toEqual([])
    details.substances.cannabis.amount = 'ein Joint'
    store.setIntoxicationBasis('cannabis', 'positive')
    expect(details.substances.cannabis.amount).toBe('')
    store.setIntoxicationBasis('cannabis', 'suspected')
    expect(details.substances.cannabis.reasons).toEqual([])
    store.setIntoxicationSubstance('alcohol', false)
    store.setIntoxicationSubstance('alcohol', true)
    expect(details.substances.alcohol).toEqual({ enabled: true, basis: 'suspected', reasons: [], amount: '' })
    store.setIntoxicationSubstance('other', true)
    details.otherName = 'GHB'
    store.setIntoxicationSubstance('other', false)
    expect(details.otherName).toBe('')
    // Renderer also excludes fields inappropriate to the selected basis.
    details.substances.alcohol.amount = 'stale'
    expect(renderIntoxicationText(details)).not.toContain('stale')
  })

  test.each(['remove', 'no_emergency_call'])('resets details and activation for %s', action => {
    const store = setup()
    store.doku.xabcDe.intoxication.value = 'Alttext'
    store.setTextAreaBlockActive(blockId, false)
    if (action === 'remove') store.setIntoxicationAssessed(false)
    else store.setFlavor('no_emergency_call', true)
    expect(store.doku.textAreaBlocks.intoxikation).toEqual(createIntoxicationBlockState())
    expect(store.doku.xabcDe.intoxication.value).toBe('')
    expect(store.textAreaBlocks).toEqual([])
    expect(store.intoxicationSummary).toBe('')
    store.setIntoxicationAssessed(true)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.sampler.pler.PLER.value).toBe('Eigener Text')
  })

  test.each([true, false])('persists and restores all details and block activation=%s through history', async active => {
    const store = setup()
    store.setIntoxicationSubstance('other', true)
    store.doku.textAreaBlocks.intoxikation.details.otherName = 'GHB'
    store.doku.textAreaBlocks.intoxikation.details.substances.cannabis.reasons.push('Eigener Hinweis')
    store.doku.xabcDe.intoxication.value = 'Alte Beobachtung'
    store.setTextAreaBlockActive(blockId, active)
    await store.persistToStorage()
    vi.mocked(loadDokuState).mockResolvedValue(plain(vi.mocked(saveDokuState).mock.lastCall![0]))
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks.intoxikation).toEqual(store.doku.textAreaBlocks.intoxikation)
    expect(restored.generatedProtocol).toBe(store.generatedProtocol)
    expect(restored.textAreaBlocks[0].active).toBe(active)
    await restored.newProtocol()
    expect(restored.doku.textAreaBlocks.intoxikation).toEqual(createIntoxicationBlockState())
    expect(await restored.restoreProtocolFromHistory(restored.protocolHistory[0].id)).toBe(true)
    expect(restored.doku.textAreaBlocks.intoxikation).toEqual(store.doku.textAreaBlocks.intoxikation)
    expect(restored.generatedProtocol).toBe(store.generatedProtocol)
  })

  test.each([{ assessed: true }, { active: true }])('preserves legacy free text without inferring substances (%j)', async activation => {
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      xabcDe: { intoxication: { ...activation, value: 'C2-Geruch' } },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.generatedProtocol).toContain('Intox: C2-Geruch')
    expect(store.doku.textAreaBlocks.intoxikation).toEqual(createIntoxicationBlockState())
    expect(store.textAreaBlocks).toEqual([])
    const modal = shallowMount(BlockIntoxikationCard, { global: { renderStubDefaultSlot: true } })
    const legacy = modal.findAllComponents(DodoInputText).find(input => input.props('label') === 'Bisherige Angabe')!
    expect(legacy.props('modelValue')).toBe('C2-Geruch')
    legacy.vm.$emit('update:modelValue', 'Alte Beobachtung')
    expect(store.generatedProtocol).toContain('Intox: Alte Beobachtung')
    store.setIntoxicationSubstance('cannabis', true)
    expect(store.generatedProtocol).toContain('Intox: Vd. Cannabis; Alte Beobachtung')
  })

  test('clears unavailable saved block details on hydration', async () => {
    const store = setup()
    const saved = plain(store.doku)
    saved.xabcDe.intoxication.assessed = false
    vi.mocked(loadDokuState).mockResolvedValue({ doku: saved })
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks.intoxikation).toEqual(createIntoxicationBlockState())
    expect(store.textAreaBlocks).toEqual([])
  })

  test('keeps the modal in D and sends independent substance details to the PLER block', async () => {
    const store = useDokuStore()
    const global = { renderStubDefaultSlot: true }
    const pler = shallowMount(SamplePlerCard, { global })
    const disability = shallowMount(AbcdeDisabilityCard, { global })
    const examination = disability.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'intoxication')!
    expect(pler.findComponent(BlockIntoxikationCard).exists()).toBe(false)
    examination.vm.$emit('update:assessed', true)
    await nextTick()
    expect(pler.findComponent(BlockIntoxikationCard).exists()).toBe(false)
    expect(disability.findComponent(BlockIntoxikationCard).exists()).toBe(true)
    const modal = shallowMount(BlockIntoxikationCard, { global })
    const chips = modal.findAllComponents(DodoToggleChip)
    expect(chips.map(chip => chip.text())).toEqual(['Alkohol', 'Cannabis', 'Opioide', 'Amphetamin', 'Methamphetamin', 'Ecstasy', 'Kokain', 'Sonstige'])
    for (const label of ['Alkohol', 'Cannabis', 'Sonstige']) chips.find(chip => chip.text() === label)!.vm.$emit('update:modelValue', true)
    await nextTick()
    const bases = modal.findAllComponents(DodoInputSelect)
    expect(bases.map(input => input.props('modelValue'))).toEqual(['suspected', 'suspected', 'suspected'])
    expect(bases[0].props('options')).not.toContainEqual({ value: 'positive', label: 'Test positiv' })
    expect(bases[1].props('options')).toContainEqual({ value: 'positive', label: 'Test positiv' })
    const reasons = modal.findAllComponents(DodoInputSelectChips)
    expect(reasons.map(input => input.props('options'))).toEqual([intoxicationReasonRows.alcohol, intoxicationReasonRows.cannabis, intoxicationReasonRows.other])
    expect(reasons[0].props()).toMatchObject({ customMode: 'append', customOptionLabel: 'Sonstige', allowCustom: true })
    reasons[0].vm.$emit('update:modelValue', ['Alkoholgeruch', 'Eigener Hinweis'])
    expect(store.doku.textAreaBlocks.intoxikation.details.substances.alcohol.reasons).toEqual(['Alkoholgeruch', 'Eigener Hinweis'])
    bases[0].vm.$emit('update:modelValue', 'confirmed')
    bases[1].vm.$emit('update:modelValue', 'positive')
    await nextTick()
    expect(modal.findAllComponents(DodoInputSelectChips)).toHaveLength(1)
    const inputs = modal.findAllComponents(DodoInputText)
    inputs.find(input => input.props('label') === 'Menge')!.vm.$emit('update:modelValue', '3 Bier')
    inputs.find(input => input.props('label') === 'Sonstige Substanz')!.vm.$emit('update:modelValue', 'GHB')
    expect(store.intoxicationSummary).toBe('Alkohol / Cannabis / Vd. GHB')
    expect(store.textAreaBlocks[0].text).toContain('Menge: 3 Bier')
    await nextTick()
    expect(pler.getComponent(DodoInputTextArea).props('blocks')![0].text).toContain('Menge: 3 Bier')
    disability.findAllComponents(DodoExaminationItem).find(item => item.props('id') === 'intoxication')!
      .vm.$emit('update:assessed', false)
    await nextTick()
    expect(pler.findComponent(BlockIntoxikationCard).exists()).toBe(false)
    expect(store.doku.textAreaBlocks.intoxikation).toEqual(createIntoxicationBlockState())
  })
})
