import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useDokuStore } from '@/store/doku'
import { loadDokuState, loadTemporaryProtocolState, saveDokuState } from '@/store/persistence'
import { AssessedValue } from '@/types/protocol/input'
import { AbcdeDisability, DisabilityNeuro, DisabilityPsych } from '@/types/protocol/abcde'
import { ProtocolVerbosity } from '@/types/protocol'
import SampleSymptomsCard from '@/views/dokuCards/sampleCards/SampleSymptomsCard.vue'
import SampleContainerCard from '@/views/dokuCards/SampleContainerCard.vue'
import DodoInputTextArea from '@/components/DodoInputTextArea.vue'
import DodoItemModal from '@/components/DodoItemModal.vue'

vi.mock('@/store/persistence', () => ({
  DOKU_SCHEMA_VERSION: 1,
  appendProtocolAuditEntry: vi.fn(),
  loadDokuState: vi.fn(),
  loadProtocolAuditEntries: vi.fn().mockResolvedValue([]),
  loadTemporaryProtocolState: vi.fn(),
  removeTemporaryProtocolState: vi.fn(),
  saveDokuState: vi.fn(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

const keys = [ 'neuro', 'psych', 'bloodGlucose', 'intoxication'] as const
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const findings: [typeof keys[number], (d: Pick<AbcdeDisability, typeof keys[number]>) => void, string, boolean, boolean][] = [
  ['neuro', d => { d.neuro.value.msArmLeft = 'Absinken' }, 'Armparese', false, false],
  ['psych', d => { d.psych.value.disorder = 'Delir' }, 'deliranter Zustand', true, true],
  ['psych', d => { d.psych.value.dementia = true }, 'bek. Demenz', false, true],
  ['bloodGlucose', d => { d.bloodGlucose.value = 'niedrig' }, 'BZ niedrig', true, false],
  ['intoxication', d => { d.intoxication.value = 'C2-Geruch' }, 'Intox: C2-Geruch', true, false],
]

describe('Neuro protocol placement', () => {
  test.each([
    ['leichter', 'leichte Nackensteife', ''],
    ['ausgeprägter', 'ausgeprägte Nackensteife', ''],
    ['kein', '', 'keine Nackensteife'],
    ['', '', ''],
  ] as const)('places neck stiffness %j once and updates after assessment changes', (value, positive, negative) => {
    const store = useDokuStore()
    const d = store.doku.xabcDe
    const symptoms = store.doku.sampler.symptoms.additionalSymptoms
    symptoms.setText('Weitere Beschwerden\nEigener Text')
    d.neuro.value.msMeningism = value
    expect(store.generatedProtocol).not.toMatch(/Nackensteife|Neuro:/)
    d.neuro.assessed = true

    for (const withOtherFindings of [false, true]) {
      d.neuro.value.msArmLeft = withOtherFindings ? 'Absinken' : 'ohne Absinken'
      d.neuro.value.msTremor = withOtherFindings
      const protocol = store.generatedProtocol
      const dLine = protocol.split('\n').find(line => line.startsWith('D:'))!
      if (positive) expect(dLine).toContain(positive)
      else expect(dLine).not.toContain('Nackensteife')
      const details = [
        withOtherFindings ? 'Absinken Arm li' : '',
        negative,
        withOtherFindings ? 'Tremor/Myoklonien' : '',
      ].filter(Boolean).join('; ')
      if (details) expect(protocol).toContain(`Neuro: ${details}\nWeitere Beschwerden\nEigener Text`)
      else expect(protocol).not.toContain('Neuro:')
      expect(protocol.match(/Nackensteife/g) ?? []).toHaveLength(value === '' ? 0 : 1)
      expect(protocol).not.toContain('Meningismus')
      expect(symptoms.value).toBe('Weitere Beschwerden\nEigener Text')
    }

    d.neuro.assessed = false
    expect(store.generatedProtocol).not.toMatch(/Nackensteife|Neuro:/)
    expect(store.generatedProtocol).toContain('Weitere Beschwerden\nEigener Text')
  })

  test('renders grouped limb findings and recomputes them in the Neuro section', () => {
    const store = useDokuStore()
    const neuro = store.doku.xabcDe.neuro
    neuro.assessed = true
    Object.assign(neuro.value, {
      msArmLeft: 'Absinken', msArmRight: 'Absinken',
      msLegLeft: 'Absinken', msLegRight: 'Absinken',
    })
    expect(store.generatedProtocol).toContain('Neuro: Absinken Extremitäten')

    neuro.value.msLegRight = 'ohne Absinken'
    expect(store.generatedProtocol).toContain('Neuro: Absinken Arme und Bein li')
    expect(store.generatedProtocol).not.toContain('Absinken Extremitäten')

    neuro.value.msArmRight = 'leichtes Absinken'
    expect(store.generatedProtocol).toContain('Neuro: Absinken li; leichtes Absinken Arm re')
    expect(store.generatedProtocol).not.toContain('ohne Absinken')
    neuro.assessed = false
    expect(store.generatedProtocol).not.toContain('Neuro:')
  })

  test('puts the summary in D and the complete details before existing symptoms', () => {
    const store = useDokuStore()
    const d = store.doku.xabcDe
    d.neuro.assessed = true
    Object.assign(d.neuro.value, {
      msArmLeft: 'Absinken', msLegRight: 'nur Restbewegungen',
      aphasia: 'schwere', dysarthria: 'verwaschen', msTremor: true,
    })
    const symptoms = store.doku.sampler.symptoms.additionalSymptoms
    symptoms.setText('Weitere Beschwerden\nEigener Text')

    const details = 'Absinken Arm li; nur Restbewegungen Bein re; keine Nackensteife; '
      + 'Tremor/Myoklonien; verwaschene Artikulation; schwere Aphasie'
    const protocol = store.generatedProtocol
    const dLine = protocol.split('\n').find(line => line.startsWith('D:'))!
    expect(dLine).toContain('Aphasie, Paresen')
    expect(dLine.match(/Aphasie/g)).toHaveLength(1)
    expect(dLine).not.toMatch(/Arm li|Bein re|Tremor|Artikulation|schwere/)
    expect(protocol).toContain(`Neuro: ${details}\nWeitere Beschwerden\nEigener Text`)
    expect(protocol.split(details)).toHaveLength(2)
    expect(protocol.indexOf('Neuro:')).toBeGreaterThan(protocol.indexOf('E:'))
    expect(symptoms.value).toBe('Weitere Beschwerden\nEigener Text')
  })

  test('updates both outputs and suppresses unassessed or removed findings', () => {
    const store = useDokuStore()
    const d = store.doku.xabcDe
    d.neuro.value.msArmLeft = 'Absinken'
    expect(store.generatedProtocol).not.toMatch(/Armparese|Neuro:|keine Paresen/)

    d.neuro.assessed = true
    expect(store.generatedProtocol).toContain('Armparese')
    expect(store.generatedProtocol).toContain('Neuro: Absinken Arm li')

    d.neuro.value.msArmLeft = 'ohne Absinken'
    d.neuro.value.msMeningism = 'leichter'
    expect(d.generateText()).toContain('; leichte Nackensteife.')
    expect(store.generatedProtocol).not.toContain('Neuro:')
    expect(store.generatedProtocol).not.toMatch(/Armparese|Arm li/)

    d.neuro.assessed = false
    expect(store.generatedProtocol).not.toMatch(/Nackensteife|Neuro:/)
    d.neuro.value = new DisabilityNeuro()
    d.neuro.assessed = true
    expect(d.generateText()).toContain('keine Paresen/Parästhesien')
    expect(store.generatedProtocol).toContain('Neuro: keine Nackensteife')
  })

  test.each([
    [{ msTremor: true }, 'Tremor/Myoklonien'],
    [{ followInstructions: 'teilweise befolgt' }, 'Anweisungen teilweise befolgt'],
    [{ followInstructions: 'nicht befolgt' }, 'Anweisungen nicht befolgt'],
  ] satisfies [Partial<DisabilityNeuro>, string][])(
    'keeps detail-only finding %j in symptoms alongside the negative D summary', (finding, detail) => {
      const store = useDokuStore()
      const d = store.doku.xabcDe
      d.neuro.assessed = true
      Object.assign(d.neuro.value, finding)
      expect(d.generateText()).toContain('keine Paresen/Parästhesien')
      expect(d.generateText()).not.toContain(detail)
      expect(store.generatedProtocol).toContain(`Neuro: ${d.neuro.value.symptomsText}`)
      expect(d.neuro.value.symptomsText).toContain(detail)
      expect(d.neuro.value.symptomsText).toContain('keine Nackensteife')
    },
  )

  test.each(['no_emergency_call', 'verlegung'] as const)('omits neuro details when %s hides symptoms', flavor => {
    const store = useDokuStore()
    store.doku.xabcDe.neuro.assessed = true
    store.doku.xabcDe.neuro.value.msArmLeft = 'Absinken'
    expect(store.generatedProtocol).toContain('Neuro: Absinken Arm li')
    // Set directly to check the output gates independently of data resets.
    store.doku.flavors[flavor] = true
    expect(store.context.requireSampleSymptoms).toBe(false)
    expect(store.context.requireSampler).toBe(flavor === 'no_emergency_call')
    expect(store.generatedProtocol).not.toMatch(/Neuro:|Absinken Arm li|Nackensteife/)
  })
})

describe('Disability assessment semantics', () => {
  test('defaults to unassessed findings with independent baseline', () => {
    const d = useDokuStore().doku.xabcDe
    for (const key of keys) {
      expect(d[key]).toBeInstanceOf(AssessedValue)
      expect(d[key].assessed).toBe(false)
    }
    expect(d.neuro.value).toBeInstanceOf(DisabilityNeuro)
    expect(d.psych.value).toBeInstanceOf(DisabilityPsych)
    expect(d.psych.value.dementia).toBe(false)
    expect(d.psych.value).not.toHaveProperty('baseline')
    expect(d.headache).toBe(false)
    expect(d.dizziness).toBe('kein')
    expect(d.baseline).toBe(false)
    expect(d.needTreatment).toBe(false)
    expect(d.couldBeBaseline).toBe(false)
  })

  test.each(findings)('gates %s text, treatment and baseline eligibility on assessment', (key, seed, text, treatment, baseline) => {
    const d = useDokuStore().doku.xabcDe
    seed(d)
    expect(d.generateText()).not.toContain(text)
    expect(d.needTreatment).toBe(false)
    expect(d.couldBeBaseline).toBe(false)
    d[key].assessed = true
    expect(d.generateText()).toContain(text)
    expect(d.needTreatment).toBe(treatment)
    expect(d.couldBeBaseline).toBe(baseline)
    d[key].assessed = false
    expect(d.generateText()).not.toContain(text)
    expect(d.needTreatment).toBe(false)
    expect(d.couldBeBaseline).toBe(false)
  })

  test.each([ProtocolVerbosity.LOW, ProtocolVerbosity.NORMAL, ProtocolVerbosity.HIGH])(
    'preserves normal findings and verbosity rules at %s', verbosity => {
      const store = useDokuStore()
      vi.spyOn(store, 'context', 'get').mockReturnValue({ ...store.context, verbosity })
      const d = store.doku.xabcDe
      expect(d.generateText()).not.toContain('BZ')
      for (const key of keys.filter(key => key !== 'intoxication')) d[key].assessed = true
      expect(d.generateText()).toContain('BZ normal')
      expect(d.generateText()).toContain('keine Paresen/Parästhesien')
      expect(d.generateText().includes('keine Kopfschmerzen')).toBe(verbosity !== ProtocolVerbosity.LOW)
      expect(d.generateText().includes('kein Schwindel')).toBe(verbosity !== ProtocolVerbosity.LOW)
      expect(d.generateText()).not.toContain('bek. Demenz')
      expect(d.neuro.value.text).toBe('')
      expect(d.psych.value.text).toBe('')
      expect(d.needTreatment).toBe(false)
      expect(d.couldBeBaseline).toBe(false)
    },
  )

  test.each([
    [true, 'kein', 'Kopfschmerzen'],
    [false, 'ungerichteter', 'diffuser/ungerichteter Schwindel'],
    [false, 'gerichteter', 'Dreh-/Schwankschwindel'],
  ] as const)('uses permanent symptoms directly: headache=%s, dizziness=%s', (headache, dizziness, text) => {
    const store = useDokuStore()
    const d = store.doku.xabcDe
    d.headache = headache
    d.dizziness = dizziness
    expect(d.generateText()).toContain(text)
    expect(d.needTreatment).toBe(true)
    expect(d.couldBeBaseline).toBe(false)
    expect(store.context.hasHeadache).toBe(headache)
    expect(store.context.hasDizziness).toBe(dizziness !== 'kein')
    d.headache = false
    d.dizziness = 'kein'
    expect(d.needTreatment).toBe(false)
  })

  test('an assessed intoxication suspicion needs no description to require treatment', () => {
    const d = useDokuStore().doku.xabcDe
    d.intoxication.assessed = true
    expect(d.intoxication.isAssessed).toBe(false)
    expect(d.needTreatment).toBe(true)
    d.intoxication.assessed = false
    expect(d.needTreatment).toBe(false)
  })

  test('context uses permanent symptoms and ignores unassessed dementia', () => {
    const store = useDokuStore()
    const d = store.doku.xabcDe
    d.psych.value.dementia = true
    d.avpu = 'benommen'
    expect(store.context).toMatchObject({ hasHeadache: false, hasDizziness: false, isLowVigilant: true })
    d.headache = true
    d.dizziness = 'ungerichteter'
    d.psych.assessed = true
    expect(store.context).toMatchObject({ hasHeadache: true, hasDizziness: true, isLowVigilant: false })
  })

  test.each([false, true])('shows the Schwindel modal inside symptoms before the textarea only when eligible, trauma=%s', async trauma => {
    const store = useDokuStore()
    store.setFlavor('trauma', trauma)
    const wrapper = shallowMount(SampleContainerCard, {
      global: { renderStubDefaultSlot: true, stubs: { SampleSymptomsCard: false } },
    })
    expect(wrapper.findComponent(DodoItemModal).exists()).toBe(false)
    store.setDizziness('gerichteter')
    await wrapper.vm.$nextTick()
    const modal = wrapper.getComponent(SampleSymptomsCard).getComponent(DodoItemModal)
    const symptoms = wrapper.get('.sample-symptoms')
    expect(symptoms.element.contains(modal.element)).toBe(true)
    expect(modal.element.nextElementSibling).toBe(wrapper.getComponent(DodoInputTextArea).element)
    expect(symptoms.find('hr').exists()).toBe(trauma)
    if (trauma) expect(modal.element.previousElementSibling).toBe(symptoms.get('hr').element)
    expect(wrapper.getComponent(DodoInputTextArea).props('quickieKeys')).not.toContain('intern_schwindel')
    store.setDizziness('ungerichteter')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(DodoItemModal).exists()).toBe(false)
    store.setDizziness('gerichteter')
    store.setFlavor('verlegung', true)
    await wrapper.vm.$nextTick()
    expect(store.context.requireSampleSymptoms).toBe(false)
    expect(store.doku.xabcDe.dizziness).toBe('gerichteter')
    expect(wrapper.findComponent(DodoItemModal).exists()).toBe(false)
    store.setFlavor('verlegung', false)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(DodoItemModal).exists()).toBe(true)
    wrapper.unmount()
  })

  test('retains the existing GCS text change and nonverbal symptom suppression', () => {
    const d = useDokuStore().doku.xabcDe
    d.headache = true
    d.dizziness = 'gerichteter'
    expect(d.generateText()).not.toContain('GCS 15')
    d.gcs.a = 3
    expect(d.generateText()).not.toContain('GCS 14')
    d.gcs.a = 2
    expect(d.generateText()).toContain('GCS 13')
    d.avpu = 'bewusstlos'
    expect(d.generateText()).not.toMatch(/Kopfschmerzen|Schwindel/)
  })
})

describe('Disability persistence', () => {
  test.each([
    [true, true],
    [false, false],
    [{ assessed: true, value: true }, true],
    [{ assessed: true, value: false }, false],
    [{ assessed: false, value: true }, false],
    [{ assessed: false, value: false }, false],
  ])('moves separate dementia %j into psych', async (dementia, expected) => {
    const store = useDokuStore()
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe: {
      dementia, psych: { assessed: false, value: { rass: '' } },
    } } })
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value.dementia).toBe(expected)
    expect(store.doku.xabcDe.psych.assessed).toBe(expected)
    expect(store.doku.xabcDe.generateText().includes('bek. Demenz')).toBe(expected)
    await store.persistToStorage()
    const saved = vi.mocked(saveDokuState).mock.lastCall![0]
    expect(saved.doku.xabcDe).not.toHaveProperty('dementia')
    vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value.dementia).toBe(expected)
    expect(store.doku.xabcDe.psych.assessed).toBe(expected)
  })

  test.each(['saved', 'temporary', 'history'] as const)('migrates legacy findings from %s protocols', async source => {
    for (const abnormal of [false, true]) {
      const store = useDokuStore()
      const neuro = new DisabilityNeuro()
      if (abnormal) {
        neuro.paraesthesia.active = true
        neuro.paraesthesia.value = 'Kribbeln li. Arm'
      }
      const psych = { ...new DisabilityPsych(), dementia: abnormal, baseline: abnormal }
      if (abnormal) psych.rass = 'agitiert'
      const xabcDe = {
        headache: abnormal, dizziness: abnormal ? 'gerichteter' : 'kein',
        bloodGlucose: abnormal ? 'hoch' : '', intoxication: { active: abnormal, value: 'C2-Geruch' },
        neuro: plain(neuro), psych,
      }
      const payload = { schemaVersion: 1, savedAt: new Date().toISOString(), doku: { xabcDe } }
      if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
      if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
      if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
        schemaVersion: 1, protocolHistory: [{ id: 'legacy', archivedAt: payload.savedAt, doku: payload.doku as never }],
      })
      await store.hydrateFromStorage()
      if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
      const d = store.doku.xabcDe
      for (const key of keys) {
        expect(d[key]).toBeInstanceOf(AssessedValue)
        expect(d[key].assessed).toBe(abnormal)
      }
      expect(d.headache).toBe(abnormal)
      expect(d.dizziness).toBe(abnormal ? 'gerichteter' : 'kein')
      expect(d.baseline).toBe(abnormal)
      expect(d.intoxication.value).toBe('C2-Geruch')
      expect(d.bloodGlucose.value).toBe(abnormal ? 'hoch' : '')
      expect(d.neuro.value).toBeInstanceOf(DisabilityNeuro)
      expect(d.neuro.value.paraesthesia.isActive).toBe(abnormal)
      expect(d.psych.value).toBeInstanceOf(DisabilityPsych)
      expect(d.psych.value.dementia).toBe(abnormal)
      expect(d.psych.value).not.toHaveProperty('baseline')
    }
  })

  test.each(['saved', 'temporary', 'history'] as const)('normalizes wrapped symptoms from %s protocols', async source => {
    for (const assessed of [false, true]) {
      for (const abnormal of [false, true]) {
        const store = useDokuStore()
        const payload = {
          schemaVersion: 1, savedAt: new Date().toISOString(),
          doku: { situation: { _text: 'Existing situation' }, xabcDe: {
            headache: { assessed, value: abnormal },
            dizziness: { assessed, value: abnormal ? 'gerichteter' : 'kein' },
          } },
        }
        if (source === 'saved') vi.mocked(loadDokuState).mockResolvedValueOnce(payload)
        if (source === 'temporary') vi.mocked(loadTemporaryProtocolState).mockResolvedValueOnce(payload)
        if (source === 'history') vi.mocked(loadDokuState).mockResolvedValueOnce({
          schemaVersion: 1, protocolHistory: [{ id: 'wrapped', archivedAt: payload.savedAt, doku: payload.doku as never }],
        })
        await store.hydrateFromStorage()
        if (source !== 'saved') await expect(store.restoreProtocolFromHistory(store.protocolHistory[0].id)).resolves.toBe(true)
        expect(store.doku.xabcDe.headache).toBe(assessed && abnormal)
        expect(store.doku.xabcDe.dizziness).toBe(assessed && abnormal ? 'gerichteter' : 'kein')
        expect(store.doku.xabcDe.needTreatment).toBe(assessed && abnormal)
        await store.persistToStorage()
        const saved = vi.mocked(saveDokuState).mock.lastCall![0]
        vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
        await store.hydrateFromStorage()
        expect(store.doku.xabcDe.headache).toBe(assessed && abnormal)
        expect(store.doku.xabcDe.dizziness).toBe(assessed && abnormal ? 'gerichteter' : 'kein')
      }
    }
  })

  test.each([false, true])('round-trips assessed=%s without inferring assessment from values', async assessed => {
    for (const abnormal of [false, true]) {
      const d = new AbcdeDisability()
      d.headache = abnormal
      d.dizziness = abnormal ? 'gerichteter' : 'kein'
      if (abnormal) for (const [, seed] of findings) seed(d)
      for (const key of keys) d[key].assessed = assessed
      d.baseline = true
      const store = useDokuStore()
      vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe: plain(d) } })
      await store.hydrateFromStorage()
      await store.persistToStorage()
      const saved = vi.mocked(saveDokuState).mock.lastCall![0]
      expect(saved.schemaVersion).toBe(1)
      expect(saved.doku.xabcDe).toEqual(plain(d))
      vi.mocked(loadDokuState).mockResolvedValueOnce(saved)
      await store.hydrateFromStorage()
      for (const key of keys) expect(store.doku.xabcDe[key]).toBeInstanceOf(AssessedValue)
      expect(store.doku.xabcDe.neuro.value).toBeInstanceOf(DisabilityNeuro)
      expect(store.doku.xabcDe.psych.value).toBeInstanceOf(DisabilityPsych)
      expect(store.doku.xabcDe).toEqual(d)
    }
  })

  test.each([
    { dementia: false, baseline: false },
    { dementia: { assessed: false, value: true }, baseline: false },
    { dementia: { assessed: true, value: false }, baseline: false },
  ])('prefers nested dementia and top-level baseline over legacy values: %j', async fields => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe: {
      ...fields, psychDementia: true, psychBaseline: true,
      psych: { dementia: true, baseline: true },
    } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value.dementia).toBe(true)
    expect(store.doku.xabcDe.psych.assessed).toBe(true)
    expect(store.doku.xabcDe.baseline).toBe(false)
  })

  test('prefers nested false values to legacy positives and assesses measured normal glucose', async () => {
    vi.mocked(loadDokuState).mockResolvedValueOnce({ schemaVersion: 1, doku: { xabcDe: {
      psychDementia: true, psychBaseline: true, bloodGlucose: 'normal',
      psych: { dementia: false, baseline: false },
    } } })
    const store = useDokuStore()
    await store.hydrateFromStorage()
    expect(store.doku.xabcDe.psych.value.dementia).toBe(false)
    expect(store.doku.xabcDe.baseline).toBe(false)
    expect(store.doku.xabcDe.psych.assessed).toBe(false)
    expect(store.doku.xabcDe.bloodGlucose).toEqual(AssessedValue.assessed('normal'))
  })
})
