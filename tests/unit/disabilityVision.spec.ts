import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import * as Ionic from '@ionic/vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DodoInputToggle from '@/components/inputs/DodoInputToggle.vue'
import BlockSehenCard from '@/views/doku/blocks/BlockSehenCard.vue'
import SampleSymptomsCard from '@/views/doku/sample/SampleSymptomsCard.vue'
import DodoInputTextArea from '@/components/inputs/DodoInputTextArea.vue'
import { createSehenBlockState } from '@/data/blocks/sehen'
import DodoInputSelect from '@/components/inputs/DodoInputSelect.vue'
import DodoInputSelectChips from '@/components/inputs/DodoInputSelectChips.vue'
import DodoInputText from '@/components/inputs/DodoInputText.vue'
import DodoItemModal from '@/components/ui/DodoItemModal.vue'
import AbcdeDisabilityCard from '@/views/doku/abcde/AbcdeDisabilityCard.vue'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, saveDokuState } from '@/store/persistence'
import { ProtocolVerbosity } from '@/types/protocol'
import { DisabilityVision, visionSideSymptoms, visionSymptoms } from '@/types/protocol/abcde'
import { AssessedValue } from '@/types/protocol/input'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

const focusText = vi.fn()
const global = {
  renderStubDefaultSlot: true,
  stubs: {
    ...Object.fromEntries(Object.keys(Ionic).filter(key => key.startsWith('Ion')).map(key => [key, true])),
    DodoInputTextArea: true,
    DodoInputText: defineComponent({
      props: ['modelValue', 'label', 'placeholder'],
      emits: ['update:modelValue', 'leaved-empty'],
      setup(_: unknown, { expose }) { expose({ setFocus: focusText }) },
      template: '<input />',
    }),
  },
}
enableAutoUnmount(afterEach)
beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.mocked(loadDokuState).mockReset()
})

function seedDetails(vision: DisabilityVision) {
  vision.setSymptoms([...visionSymptoms, 'Farbringe'])
  for (const symptom of visionSideSymptoms) vision.sides[symptom] = 'links'
  vision.shadowDescription = AssessedValue.assessed('oben')
  vision.missingAreaDescription = 'unten rechts'
  vision.doubleImages = 'Beide Geöffnet'
}

describe('DisabilityVision text and state', () => {
  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])(
    'gates the normal finding by assessment and verbosity %s', verbosity => {
      const store = useDokuStore()
      vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
      const disability = store.doku.xabcDe
      expect(disability.generateText()).not.toContain('Sehstörung')
      disability.vision.assessed = true
      expect(store.doku.textAreaBlocks.sehen.details.findingsText).toBe('')
      expect(disability.generateText().includes('keine Sehstörung')).toBe(verbosity !== ProtocolVerbosity.LOW)
    },
  )

  test.each(['rechts', 'links', 'beide'] as const)('describes vision loss %s', side => {
    const vision = new DisabilityVision()
    vision.setVisionLoss(side)
    expect(vision.findingsText).toBe(`Sehverlust ${side === 'beide' ? 'beidseits' : side}`)
  })

  describe.each(visionSideSymptoms)('%s', symptom => {
    test.each([
      ['rechts', 'rechts'], ['links', 'links'], ['beide', 'beidseits'], ['unklar', '(Seite unklar)'],
    ] as const)('describes side %s', (side, text) => {
      const vision = new DisabilityVision()
      vision.setSymptoms([symptom])
      vision.sides[symptom] = side
      expect(vision.findingsText).toBe(`Sehstörungen: ${symptom} ${text}`)
    })
  })

  test.each([
    ['nur Rechts', 'nur rechts'], ['nur Links', 'nur links'],
    ['Beide Einzeln', 'bei beiden Augen einzeln'], ['Beide Geöffnet', 'bei beiden geöffneten Augen'],
    ['Unklar', '(pro Auge unklar)'],
  ] as const)('describes double images %s', (value, text) => {
    const vision = new DisabilityVision()
    vision.setSymptoms(['Doppelbilder'])
    vision.doubleImages = value
    expect(vision.findingsText).toBe(`Sehstörungen: Doppelbilder ${text}`)
  })

  test('puts details in symptoms and a short summary in D without changing clinical rules', () => {
    const store = useDokuStore()
    const disability = store.doku.xabcDe
    const vision = store.doku.textAreaBlocks.sehen.details
    vision.setVisionLoss('rechts')
    vision.setSymptoms(['Flimmern', 'Schatten/Vorhang', 'Fehlender Bildbereich', 'Farbringe'])
    vision.sides.Flimmern = 'rechts'
    vision.sides['Schatten/Vorhang'] = 'links'
    vision.shadowDescription = AssessedValue.assessed('oben')
    vision.missingAreaDescription = 'unten rechts'
    const expected = 'Sehverlust rechts; Sehstörungen: Flimmern rechts, Schatten/Vorhang links (oben), Fehlender Bildbereich (unten rechts), Farbringe'
    expect(vision.findingsText).toBe(expected)
    expect(store.generatedProtocol).not.toContain(expected)
    store.setVisionSymptoms(true)
    const dLine = store.generatedProtocol.split('\n').find(line => line.startsWith('D:'))!
    expect(dLine).toContain('Sehstörungen')
    expect(dLine).not.toMatch(/Sehverlust|Flimmern|Farbringe/)
    expect(store.freeformText['sampler.symptoms.additionalSymptoms']).toBe(expected)
    expect(store.generatedProtocol).toContain(expected)
    expect(store.generatedProtocol.match(/Sehstörungen:/g)).toHaveLength(1)
    expect(disability.needTreatment).toBe(false)
    expect(disability.couldBeBaseline).toBe(false)
  })

  test('resets only removed symptoms and clears all details for bilateral loss', () => {
    const vision = new DisabilityVision()
    seedDetails(vision)
    vision.setSymptoms(['Flimmern', 'Farbringe'])
    expect(vision.sides.Flimmern).toBe('links')
    expect(vision.sides['Schatten/Vorhang']).toBe('unklar')
    expect(vision.shadowDescription).toEqual(AssessedValue.unassessed(''))
    expect(vision.missingAreaDescription).toBe('')
    expect(vision.doubleImages).toBe('Unklar')
    seedDetails(vision)
    vision.setVisionLoss('beide')
    expect(vision).toEqual(Object.assign(new DisabilityVision(), { visionLoss: 'beide' }))
    expect(vision.findingsText).toBe('Sehverlust beidseits')
    vision.setVisionLoss('kein')
    expect(vision).toEqual(new DisabilityVision())
  })
})

describe('Sehstörungen modal', () => {
  async function activate() {
    useDokuStore().setVisionSymptoms(true)
    return mount(BlockSehenCard, { global })
  }

  test('places the toggle below headache and activates the card in symptoms, including nonverbal context', async () => {
    const store = useDokuStore()
    const disability = mount(AbcdeDisabilityCard, { global })
    const symptoms = mount(SampleSymptomsCard, { global })
    expect(symptoms.findComponent(BlockSehenCard).exists()).toBe(false)
    const toggle = disability.findAllComponents(DodoInputToggle).find(input => input.text().includes('Sehstörungen?'))!
    const headache = disability.get('[data-examination="headache"]')
    expect(headache.element.nextElementSibling).toBe(toggle.element)
    expect(disability.find('[data-examination="vision"]').exists()).toBe(false)
    // Nonverbal mode groups unassessed examinations at the end, but keeps this toggle available.
    store.doku.flavors.non_verbal = true
    await nextTick()
    toggle.vm.$emit('update:modelValue', true)
    await nextTick()
    expect(store.doku.xabcDe.vision.matches(true)).toBe(true)
    const card = symptoms.getComponent(BlockSehenCard)
    const modal = card.getComponent(DodoItemModal)
    expect(modal.getComponent(Ionic.IonModal).props('isOpen')).toBe(false)
    expect(modal.props('state')).toBe('Keine Angabe')
    await modal.getComponent(Ionic.IonItem).trigger('click')
    expect(modal.getComponent(Ionic.IonModal).props('isOpen')).toBe(true)
    seedDetails(store.doku.textAreaBlocks.sehen.details)
    await nextTick()
    expect(symptoms.getComponent(DodoInputTextArea).props('blocks')).toEqual(store.textAreaBlocks)
    toggle.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(store.doku.xabcDe.vision).toEqual(AssessedValue.assessed(false))
    expect(store.doku.textAreaBlocks.sehen).toEqual(createSehenBlockState())
    expect(symptoms.findComponent(BlockSehenCard).exists()).toBe(false)
    expect(store.textAreaBlocks).toEqual([])
    expect(store.generatedProtocol).not.toMatch(/Farbringe|Sehverlust/)
  })

  test('shows dependent controls, appends custom complaints and clears hidden details', async () => {
    const wrapper = await activate()
    const vision = useDokuStore().doku.textAreaBlocks.sehen.details
    const row = () => wrapper
    const select = (label: string) => wrapper.findAllComponents(DodoInputSelect).find(input => input.props('label') === label)!
    expect(row().text()).not.toMatch(/Betroffene Seite|Beschreibung/)
    const chips = wrapper.getComponent(DodoInputSelectChips)
    const chip = (label: string) => chips.findAll('.dd-input-select-chips__chip').find(button => button.text() === label)!
    for (const symptom of visionSymptoms) await chip(symptom).trigger('click')
    expect(row().text()).toContain('Betroffene Seite')
    expect(row().text()).toContain('Beschreibung')
    for (const symptom of visionSideSymptoms) {
      expect(select(symptom).props('options')).toEqual(['rechts', 'links', 'beide', 'unklar'])
      select(symptom).vm.$emit('update:modelValue', 'links')
    }
    await chip('Sonstige').trigger('click')
    chips.getComponent(DodoInputText).vm.$emit('update:modelValue', 'Farbringe')
    await nextTick()
    expect(vision.symptoms).toEqual([...visionSymptoms, 'Farbringe'])

    const shadowRow = () => wrapper.get('[data-examination="visionShadowDescription"]')
    await shadowRow().get('.activate-examination').trigger('click')
    expect(focusText).toHaveBeenCalled()
    const shadowInput = wrapper.findAllComponents(DodoInputText).find(input => input.props('label') === 'Schatten / Vorhang')!
    expect(shadowInput.props('placeholder')).toBe('z.B. Lage')
    shadowInput.vm.$emit('update:modelValue', 'oben')
    await nextTick()
    expect(vision.findingsText).toContain('Schatten/Vorhang links (oben)')
    await shadowRow().get('.remove-examination').trigger('click')
    expect(vision.shadowDescription).toEqual(AssessedValue.unassessed(''))

    select('Doppelbilder pro Auge').vm.$emit('update:modelValue', 'Beide Geöffnet')
    wrapper.findAllComponents(DodoInputText).find(input => input.props('label') === 'Fehlender Bildbereich')!
      .vm.$emit('update:modelValue', 'unten rechts')
    await nextTick()
    for (const symptom of visionSymptoms) await chip(symptom).trigger('click')
    expect(vision.symptoms).toEqual(['Farbringe'])
    expect(vision.sides.Flimmern).toBe('unklar')
    expect(vision.doubleImages).toBe('Unklar')
    expect(vision.missingAreaDescription).toBe('')
    expect(row().text()).not.toMatch(/Betroffene Seite|Beschreibung/)

    seedDetails(vision)
    await nextTick()
    select('Sehverlust').vm.$emit('update:modelValue', 'beide')
    await nextTick()
    expect(wrapper.findComponent(DodoInputSelectChips).exists()).toBe(false)
    expect(row().text()).not.toMatch(/Betroffene Seite|Beschreibung/)
    expect(select('Sehverlust').exists()).toBe(true)
    expect(vision.findingsText).toBe('Sehverlust beidseits')
    select('Sehverlust').vm.$emit('update:modelValue', 'kein')
    await nextTick()
    expect(vision).toEqual(new DisabilityVision())
    expect(wrapper.getComponent(DodoInputSelectChips).props('modelValue')).toEqual([])
  })
})

describe('Sehstörungen block lifecycle and persistence', () => {
  test('toggles output independently and preserves manual text and undo history', () => {
    const store = useDokuStore()
    store.setVisionSymptoms(true)
    expect(store.doku.xabcDe.generateText()).toContain('Sehstörungen')
    expect(store.doku.xabcDe.generateText()).not.toContain('keine Sehstörung')
    expect(store.textAreaBlocks).toEqual([])
    const manual = store.doku.sampler.symptoms.additionalSymptoms
    manual.setText('Vorher')
    manual.setText('Eigener Text')
    const snapshot = JSON.stringify(manual)
    store.doku.textAreaBlocks.sehen.details.setVisionLoss('beide')
    expect(store.freeformText['sampler.symptoms.additionalSymptoms']).toBe('Sehverlust beidseits\nEigener Text')
    store.setTextAreaBlockActive('sehen.symptoms', false)
    expect(store.freeformText['sampler.symptoms.additionalSymptoms']).toBe('Eigener Text')
    expect(store.doku.xabcDe.vision.matches(true)).toBe(true)
    store.setTextAreaBlockActive('sehen.symptoms', true)
    expect(store.freeformText['sampler.symptoms.additionalSymptoms']).toContain('Sehverlust beidseits')
    store.setVisionSymptoms(false)
    expect(JSON.stringify(manual)).toBe(snapshot)
    store.setVisionSymptoms(true)
    expect(store.doku.textAreaBlocks.sehen).toEqual(createSehenBlockState())
  })

  test.each([false, true])('round-trips output active=%s, details and class methods', async active => {
    const store = useDokuStore()
    store.setVisionSymptoms(true)
    seedDetails(store.doku.textAreaBlocks.sehen.details)
    store.setTextAreaBlockActive('sehen.symptoms', active)
    const expected = JSON.parse(JSON.stringify(store.doku.textAreaBlocks.sehen))
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    const restored = store.doku.textAreaBlocks.sehen
    expect(store.doku.xabcDe.vision).toEqual(AssessedValue.assessed(true))
    expect(restored.details).toBeInstanceOf(DisabilityVision)
    expect(restored.details.shadowDescription).toBeInstanceOf(AssessedValue)
    expect(JSON.parse(JSON.stringify(restored))).toEqual(expected)
    expect(store.generatedProtocol.includes('Farbringe')).toBe(active)
    restored.details.setVisionLoss('beide')
    expect(restored.details.findingsText).toBe('Sehverlust beidseits')
  })

  test.each([false, true])('migrates the previous D modal with findings=%s', async findings => {
    const details = new DisabilityVision()
    if (findings) seedDetails(details)
    vi.mocked(loadDokuState).mockResolvedValueOnce({
      schemaVersion: 1, doku: { xabcDe: { vision: JSON.parse(JSON.stringify(AssessedValue.assessed(details))) } },
    })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.vision).toEqual(AssessedValue.assessed(findings))
    expect(store.doku.textAreaBlocks.sehen.details).toEqual(details)
    expect(store.generatedProtocol.includes('Farbringe')).toBe(findings)
  })

  test('loads older protocols with an inactive default', async () => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe: { avpu: 'wach' } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.vision).toEqual(AssessedValue.unassessed(false))
    expect(store.doku.textAreaBlocks.sehen).toEqual(createSehenBlockState())
    expect(store.generatedProtocol).not.toMatch(/Sehstörung|Sehverlust/)
  })
})
