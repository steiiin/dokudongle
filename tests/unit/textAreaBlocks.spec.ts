import { computed, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, shallowMount } from '@vue/test-utils'
import { IonIcon } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { TextAreaBlock, composeTextAreaText } from '@/types/text-area-block'
import { TEXT_AREA_BLOCK_SOURCES, createTextAreaBlockState } from '@/data/text-area-blocks'
import DodoTextAreaBlocks from '@/components/DodoTextAreaBlocks.vue'
import DodoInputText from '@/components/DodoInputText.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import BlockVerlegungCard from '@/views/dokuCards/blocksourceCards/BlockVerlegungCard.vue'
import BlockEinweisungCard from '@/views/dokuCards/blocksourceCards/BlockEinweisungCard.vue'
import SituationCard from '@/views/dokuCards/SituationCard.vue'
import TreatmentTasksCard from '@/views/dokuCards/treatmentCards/TreatmentTasksCard.vue'
import { useDokuStore } from '@/store/doku'
import { appendProtocolAuditEntry, loadDokuState, saveDokuState } from '@/store/persistence'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

const fields = [{ key: 'START' }, { key: 'ZIEL' }]
const sourceState = () => ({ values: { START: ' A ', ZIEL: ' B ' }, active: {} as Record<string, boolean> })
const definition = (mandatory = false, color?: string) =>
  new TextAreaBlock('transport.situation', 'transport', 'situation', 'Von <START> nach <ZIEL>.', fields, mandatory, color)

describe('TextAreaBlock rendering', () => {
  test('omits incomplete optional outputs and renders mandatory placeholders as plain text', () => {
    const state = sourceState()
    state.values.ZIEL = ' \n '
    expect(definition().render(state)).toBeNull()
    const block = definition(true).render(state)!
    expect(block).toMatchObject({ text: 'Von A nach [ZIEL].', complete: false, active: true })
    expect(composeTextAreaText('', [block])).toBe('Von A nach [ZIEL].')
  })

  test('preserves user text literally, including markup and tokens', () => {
    const state = sourceState()
    state.values.START = '<ZIEL><script>alert(1)</script>'
    const block = definition().render(state)!
    expect(block.text).toBe('Von <ZIEL><script>alert(1)</script> nach B.')
    const wrapper = mount(DodoTextAreaBlocks, { props: { blocks: [block] } })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain(block.text)
  })

  test('uses configured colors and deterministic defaults', () => {
    expect(definition(false, '#ff0000').color).toBe('#ff0000')
    expect(definition(false, 'tertiary').color).toBe('tertiary')
    expect(definition().color).toBe(definition().color)
    expect(definition(false, ' ').color).toBe(definition().color)
  })

  test('one source supports multiple outputs and targets with independent activation', () => {
    const state = sourceState()
    const outputs = [definition(),
      new TextAreaBlock('transport.second', 'transport', 'situation', 'Ziel <ZIEL>.', [fields[1]]),
      new TextAreaBlock('transport.treatment', 'transport', 'treatment', 'Transport nach <ZIEL>.', [fields[1]])]
    state.active['transport.second'] = false
    const blocks = outputs.map(output => output.render(state)!)
    expect(composeTextAreaText('Eigener Text', blocks.filter(block => block.target === 'situation')))
      .toBe('Von A nach B.\nEigener Text')
    expect(composeTextAreaText('', blocks.filter(block => block.target === 'treatment'))).toBe('Transport nach B.')
    state.values.ZIEL = 'C'
    expect(outputs.map(output => output.render(state)!.text)).toEqual(['Von A nach C.', 'Ziel C.', 'Transport nach C.'])
  })

  test('inactive output stays visible and has an accessible reactivation control', async () => {
    const block = { ...definition().render(sourceState())!, active: false }
    const wrapper = mount(DodoTextAreaBlocks, { props: { blocks: [block] } })
    expect(wrapper.get('.dd-textarea-block').classes()).toContain('is-inactive')
    expect(wrapper.text()).toContain('Von A nach B.')
    expect(wrapper.getComponent(IonIcon).props('icon')).toBe(eyeOffOutline)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.get('.dd-textarea-block-text').trigger('click')
    expect(wrapper.emitted('activation-change')).toEqual([[block.id, true]])
    await wrapper.setProps({ blocks: [{ ...block, active: true }] })
    expect(wrapper.getComponent(IonIcon).props('icon')).toBe(eyeOutline)
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    await wrapper.get('.dd-textarea-block-toggle').trigger('click')
    expect(wrapper.emitted('activation-change')).toEqual([[block.id, true], [block.id, false]])
  })
})

describe('generated Situation blocks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(loadDokuState).mockResolvedValue(null)
  })

  function setup() {
    const store = useDokuStore()
    store.setFlavor('verlegung', true)
    Object.assign(store.doku.textAreaBlocks.verlegung.values, { START: 'KH Radebeul', ZIEL: 'Uniklinik Dresden' })
    store.doku.situation.setText('Eigener Text')
    return store
  }

  test.each([
    { flavor: 'verlegung' as const, component: BlockVerlegungCard, labels: ['START', 'ZIEL'],
      values: ['KH Radebeul', 'FKH Coswig'], text: 'Verlegung von KH Radebeul nach FKH Coswig.' },
    { flavor: 'einweisung' as const, component: BlockEinweisungCard, labels: ['ARZT', 'ZIEL', 'KRANKHEIT'],
      values: ['HA Wegner', 'FKH Coswig', 'Thrombose'], text: 'Einweisung HA Wegner nach FKH Coswig wg. Thrombose.' },
  ])('titleless $flavor card updates the Situation preview and protocol live', async ({ flavor, component, labels, values, text }) => {
    const store = setup()
    store.setFlavor(flavor, true)
    const card = shallowMount(component, { global: { renderStubDefaultSlot: true } })
    const situation = shallowMount(SituationCard, { global: { renderStubDefaultSlot: true } })
    expect(card.find('ion-card-title').exists()).toBe(false)
    const inputs = card.findAllComponents(DodoInputText)
    expect(inputs.map(input => input.props('label'))).toEqual(labels)
    inputs.forEach((input, index) => input.vm.$emit('update:modelValue', values[index]))
    await nextTick()
    expect(situation.getComponent(DodoInputTextArea).props('blocks')![0].text)
      .toBe(text)
    expect(store.generatedProtocol).toContain(`${text}\nEigener Text`)
    expect(store.doku.situation.value).toBe('Eigener Text')
    card.unmount()
    situation.unmount()
  })

  test('optional blocks disappear when incomplete without losing activation preference', () => {
    const store = setup()
    const protocol = computed(() => store.generatedProtocol)
    store.setTextAreaBlockActive('verlegung.situation', false)
    expect(protocol.value).not.toContain('Verlegung von')
    expect(protocol.value).toContain('Eigener Text')
    store.doku.textAreaBlocks.verlegung.values.ZIEL = ''
    expect(store.textAreaBlocks).toEqual([])
    store.doku.textAreaBlocks.verlegung.values.ZIEL = 'Neues Ziel'
    expect(store.textAreaBlocks[0]).toMatchObject({ active: false, text: 'Verlegung von KH Radebeul nach Neues Ziel.' })
    store.setTextAreaBlockActive('verlegung.situation', true)
    expect(protocol.value).toContain('Verlegung von KH Radebeul nach Neues Ziel.')
    store.doku.situation.undo()
    expect(store.textAreaBlocks[0].active).toBe(true)
    expect(protocol.value).not.toContain('[SITUATION]')
    store.setTextAreaBlockActive('verlegung.situation', false)
    expect(protocol.value).toContain('[SITUATION]')
  })

  test.each(['deselect', 'einweisung', 'no_emergency_call'] as const)('clears values and activation on %s', action => {
    const store = setup()
    store.setTextAreaBlockActive('verlegung.situation', false)
    if (action === 'deselect') store.setFlavor('verlegung', false)
    else store.setFlavor(action, true)
    expect(store.doku.textAreaBlocks.verlegung).toEqual(createTextAreaBlockState().verlegung)
    expect(store.textAreaBlocks).toEqual([])
    store.setFlavor('verlegung', true)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.situation.value).toBe('Eigener Text')
  })

  test('Einweisung uses its original sentence and distinct color', () => {
    const store = setup()
    const color = store.textAreaBlocks[0].color
    store.setFlavor('einweisung', true)
    Object.assign(store.doku.textAreaBlocks.einweisung.values, { ARZT: 'HA Wegner', ZIEL: 'FKH Coswig', KRANKHEIT: 'Thrombose' })
    expect(store.textAreaBlocks[0].text).toBe('Einweisung HA Wegner nach FKH Coswig wg. Thrombose.')
    expect(store.textAreaBlocks[0].color).not.toBe(color)
  })

  test('routes additional outputs from one source into other editors, protocol and audit', async () => {
    const source = TEXT_AREA_BLOCK_SOURCES[1]
    const targets = ['treatment', 'Xabcde.description', 'sampler.pler.PLER', 'sampler.symptoms.additionalSymptoms']
    const outputs = targets.map(target => new TextAreaBlock(`test.${target}`, source.id, target,
      `${target}: <ZIEL>`, [{ key: 'ZIEL' }]))
    source.outputs.push(...outputs)
    try {
      const store = useDokuStore()
      store.setFlavor('einweisung', true)
      store.setFlavor('trauma', true)
      Object.assign(store.doku.textAreaBlocks.einweisung.values, { ARZT: 'Hausarzt', ZIEL: 'Klinik', KRANKHEIT: 'Diagnose' })
      const treatment = shallowMount(TreatmentTasksCard, { global: { renderStubDefaultSlot: true } })
      expect(treatment.getComponent(DodoInputTextArea).props('blocks')![0].text).toBe('treatment: Klinik')
      for (const target of targets) expect(store.generatedProtocol).toContain(`${target}: Klinik`)
      treatment.getComponent(DodoInputTextArea).vm.$emit('activation-change', 'test.treatment', false)
      await nextTick()
      expect(store.generatedProtocol).not.toContain('treatment: Klinik')
      expect(store.generatedProtocol).toContain('Einweisung Hausarzt nach Klinik wg. Diagnose.')
      expect(store.doku.treatment.value).toBe('')
      await store.newProtocol()
      expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
        treatment: '', 'sampler.pler.PLER': 'sampler.pler.PLER: Klinik',
      }))
      treatment.unmount()
    } finally {
      source.outputs.splice(source.outputs.length - outputs.length, outputs.length)
    }
  })

  test('persists and restores source values and inactive outputs', async () => {
    const store = setup()
    store.setTextAreaBlockActive('verlegung.situation', false)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValue(saved)
    setActivePinia(createPinia())
    const restored = useDokuStore()
    await restored.hydrateFromStorage()
    expect(restored.doku.textAreaBlocks).toEqual(store.doku.textAreaBlocks)
    expect(restored.textAreaBlocks[0].active).toBe(false)
    expect(restored.generatedProtocol).not.toContain('Verlegung von')
    restored.setTextAreaBlockActive('verlegung.situation', true)
    expect(restored.generatedProtocol).toContain('Verlegung von KH Radebeul nach Uniklinik Dresden.')
  })

  test.each([true, false])('reset audits composed text and history restores activation=%s', async active => {
    const store = setup()
    store.setTextAreaBlockActive('verlegung.situation', active)
    await store.newProtocol()
    expect(appendProtocolAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      situation: active ? 'Verlegung von KH Radebeul nach Uniklinik Dresden.\nEigener Text' : 'Eigener Text',
    }))
    expect(store.doku.textAreaBlocks).toEqual(createTextAreaBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(await store.restoreProtocolFromHistory(store.protocolHistory[0].id)).toBe(true)
    expect(store.textAreaBlocks[0]).toMatchObject({ active, text: 'Verlegung von KH Radebeul nach Uniklinik Dresden.' })
  })

  test('old protocols retain manually inserted sentences without creating generated duplicates', async () => {
    const text = 'Verlegung von Alt nach Ziel.'
    vi.mocked(loadDokuState).mockResolvedValue({ schemaVersion: 1, doku: {
      flavors: { verlegung: true }, situation: { _text: text },
    } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.textAreaBlocks).toEqual(createTextAreaBlockState())
    expect(store.textAreaBlocks).toEqual([])
    expect(store.doku.situation.value).toBe(text)
    expect(store.generatedProtocol.split(text)).toHaveLength(2)
  })
})
