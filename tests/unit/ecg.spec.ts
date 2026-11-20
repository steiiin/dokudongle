import { describe, expect, test } from 'vitest'
import {
  createEcgFinding, ecgText, ecgNeedsTreatment, normalizeEcgFinding, updateEcg, sgarbossaResult,
  ecgAvailability, ecgFrequencyConfig, refinementOptions, type EcgFinding, type EcgRhythm, type EcgRefinement, type CriterionAnswer, type SgarbossaAnswers,
} from '@/types/protocol/abcde/ecg'

describe('ECG protocol', () => {
  test.each<[EcgRhythm, EcgRefinement | '', string]>([
    ['sinus', 'normo', 'EKG SR'], ['sinus', 'tachy', 'Sinustachyk.'], ['sinus', 'brady', 'Sinusbradyk.'],
    ['af', 'normo', 'EKG VHF'], ['af', 'tachy', 'EKG TAA'], ['af', 'brady', 'EKG BAA'],
    ['flutter', 'normo', 'Vorhofflattern'], ['flutter', 'tachy', 'Vorhofflattern mit tachyk. Kammerfrq.'],
    ['flutter', 'brady', 'Vorhofflattern mit bradyk. Kammerfrq.'],
    ['paced', 'normo', 'EKG Schrittmacherrhythmus'], ['paced', 'tachy', 'EKG tachyk. Schrittmacherrhythmus'],
    ['paced', 'brady', 'EKG bradyk. Schrittmacherrhythmus'],
    ['av', 'av1', 'AV-Block I°'], ['av', 'av2t1', 'AV-Block II° Typ 1'], ['av', 'av2t2', 'AV-Block II° Typ 2'], ['av', 'av3', 'AV-Block III°'],
    ['ventricular', 'vt', 'EKG VT'], ['ventricular', 'torsades', 'EKG Torsade de pointes'],
    ['arrest', 'vf', 'EKG VF'], ['arrest', 'asystole', 'EKG Asystolie'], ['arrest', 'pea', 'EKG PEA'],
    ['sinus', '', 'Sinusrhythmus'], ['af', '', 'Vorhofflimmern'], ['flutter', '', 'Vorhofflattern'],
    ['av', '', 'AV-Block'], ['paced', '', 'Schrittmacherrhythmus'], ['ventricular', '', 'Kammerrhythmus'], ['arrest', '', 'Herzstillstand'],
  ])('%s / %s → %s', (rhythm, refinement, expected) => {
    expect(ecgText({ ...createEcgFinding(), rhythm, refinement })).toBe(expected)
  })

  test('keeps defaults silent and appends explicit findings in report order', () => {
    expect(ecgText(createEcgFinding())).toBe('EKG SR')
    expect(createEcgFinding().sgarbossa).toEqual(['no', 'no', 'no'])
    const lsb = updateEcg(createEcgFinding(), { type: 'bundleBranch', value: 'lsb' })
    expect(ecgText(lsb)).toBe('EKG SR; LSB; Sgarbossa negativ')
    expect(normalizeEcgFinding({ ...lsb, sgarbossa: ['unknown', null, 'yes'] }).sgarbossa)
      .toEqual(['no', 'no', 'yes'])
    const finding = { ...createEcgFinding(), bundleBranch: 'lsb', sgarbossa: ['no', 'yes', 'unknown'],
      sves: true, ves: true, morphology: 'poly', st: 'changes', elevation: true, depression: true,
      elevationLeads: ['aVF', 'III', 'II'], depressionLeads: ['V2', 'V1'], notes: 'Frequenz 80/min' } as const
    expect(ecgText(normalizeEcgFinding(finding))).toBe('EKG SR; LSB; Sgarbossa erfüllt (konk. ST-Senkung); SVES; polymorphe VES; Frequenz 80/min')
    expect(ecgText({ ...createEcgFinding(), st: 'unassessable' })).toBe('EKG SR; ST-Strecke nicht beurteilbar')
  })

  test('retains unknown legacy text exactly without adding sinus rhythm', () => {
    const text = '  EKG: TAA 130–160/min. '
    const finding = normalizeEcgFinding(text)
    expect(finding).toMatchObject({ rhythm: '', refinement: '', notes: text })
    expect(ecgText(finding)).toBe(text)
    expect(normalizeEcgFinding('VHF')).toMatchObject({ rhythm: 'af', refinement: 'normo' })
  })

  test('keeps ST findings without leads explicit', () => {
    expect(ecgText({ ...createEcgFinding(), st: 'changes', elevation: true, depression: true }))
      .toBe('EKG SR; ST-Hebung; ST-Senkung')
  })

  test('preserves the treatment hint for SR/VHF and includes new positive findings', () => {
    expect(ecgNeedsTreatment(createEcgFinding())).toBe(false)
    expect(ecgNeedsTreatment(normalizeEcgFinding('VHF'))).toBe(false)
    expect(ecgNeedsTreatment({ ...createEcgFinding(), st: 'unassessable' })).toBe(false)
    for (const patch of [{ refinement: 'tachy' }, { bundleBranch: 'rsb' }, { sves: true }, { ves: true },
      { st: 'changes', elevation: true }, { notes: 'Frequenz 120/min' }]) {
      expect(ecgNeedsTreatment(normalizeEcgFinding({ ...createEcgFinding(), ...patch }))).toBe(true)
    }
  })
})

describe('ECG transitions', () => {
  test('allows deselection, resets refinement and applies rate defaults only when appropriate', () => {
    let f = updateEcg(createEcgFinding(), { type: 'refinement', value: 'normo' })
    expect(ecgText(f)).toBe('Sinusrhythmus')
    f = updateEcg(f, { type: 'refinement', value: 'tachy' })
    f = updateEcg(f, { type: 'rhythm', value: 'af' })
    expect(f.refinement).toBe('normo')
    f = updateEcg(f, { type: 'rhythm', value: 'av' })
    expect(f.refinement).toBe('')
    f = updateEcg(f, { type: 'rhythm', value: 'av' })
    expect(f.rhythm).toBe('')
    expect(ecgText(f)).toBe('')
  })

  test('combines SVES/VES and clears dependent morphology', () => {
    let f = updateEcg(createEcgFinding(), { type: 'extrasystoles', value: 'sves' })
    f = updateEcg(f, { type: 'extrasystoles', value: 'ves' })
    f = updateEcg(f, { type: 'morphology', value: 'mono' })
    expect(ecgText(f)).toBe('EKG SR; SVES; monomorphe VES')
    f = updateEcg(f, { type: 'morphology', value: 'poly' })
    expect(f.morphology).toBe('poly')
    f = updateEcg(f, { type: 'extrasystoles', value: 'ves' })
    expect(f).toMatchObject({ sves: true, ves: false, morphology: '' })
    f = updateEcg(f, { type: 'extrasystoles', value: 'none' })
    expect(ecgText(f)).toBe('EKG SR')
  })

  test('moves leads between simultaneous ST changes and clears hidden selections', () => {
    let f = updateEcg(createEcgFinding(), { type: 'st', value: 'elevation' })
    f = updateEcg(f, { type: 'lead', direction: 'elevation', value: 'II' })
    f = updateEcg(f, { type: 'st', value: 'depression' })
    f = updateEcg(f, { type: 'lead', direction: 'depression', value: 'II' })
    expect(f.elevationLeads).toEqual([])
    expect(f.depressionLeads).toEqual(['II'])
    expect(ecgText(f)).toBe('EKG SR; ST-Hebung; senkt in II')
    f = updateEcg(f, { type: 'st', value: 'depression' })
    expect(f.depressionLeads).toEqual([])
    f = updateEcg(f, { type: 'st', value: 'elevation' })
    expect(f.st).toBe('none')
    f = updateEcg(f, { type: 'st', value: 'elevation' })
    f = updateEcg(f, { type: 'lead', direction: 'elevation', value: 'V9r' })
    f = updateEcg(f, { type: 'st', value: 'unassessable' })
    expect(f).toMatchObject({ elevation: false, depression: false, elevationLeads: [], depressionLeads: [] })
  })

  test('sets ST findings from lead selections, moves leads and removes the last finding', () => {
    const original = createEcgFinding()
    let f = updateEcg(original, { type: 'leads', direction: 'elevation', value: ['III', 'II', 'II'] })
    expect(f).toMatchObject({ st: 'changes', elevation: true, elevationLeads: ['II', 'III'] })
    f = updateEcg(f, { type: 'leads', direction: 'depression', value: ['II', 'V1'] })
    expect(ecgText(f)).toBe('EKG SR; hebt in III; senkt in II, V1')
    f = updateEcg(f, { type: 'leads', direction: 'depression', value: ['II', 'III', 'V1'] })
    expect(f).toMatchObject({ elevation: false, elevationLeads: [], depression: true })
    expect(ecgText(f)).toBe('EKG SR; senkt in II, III, V1')
    f = updateEcg(f, { type: 'leads', direction: 'depression', value: [] })
    expect(f).toMatchObject({ st: 'none', elevation: false, depression: false, depressionLeads: [] })
    expect(ecgText(f)).toBe('EKG SR')
    expect(original).toEqual(createEcgFinding())
  })

  test('clears Sgarbossa when leaving LSB and does not mutate the previous state', () => {
    const previous = { ...createEcgFinding(), bundleBranch: 'lsb', sgarbossa: ['yes', 'no', 'no'] } as const
    const original = normalizeEcgFinding(previous)
    const next = updateEcg(original, { type: 'bundleBranch', value: 'rsb' })
    expect(next.sgarbossa).toEqual(['no', 'no', 'no'])
    expect(original.sgarbossa).toEqual(['yes', 'no', 'no'])
    expect(ecgText(next)).toBe('EKG SR; RSB')
  })
})

describe('ECG availability and hidden findings', () => {
  const emptySt = { st: 'none', elevation: false, depression: false, elevationLeads: [], depressionLeads: [] }
  const populated = (): EcgFinding => ({
    ...createEcgFinding(), bundleBranch: 'rsb', sves: true, ves: true, morphology: 'poly',
    st: 'changes', elevation: true, depression: true, elevationLeads: ['II'], depressionLeads: ['V1'],
  })
  const cases: [EcgFinding['rhythm'], EcgFinding['pacingType'], boolean, boolean, boolean, boolean][] = [
    ['', 'unknown', true, true, true, true],
    ['sinus', 'unknown', true, true, true, true],
    ['af', 'unknown', true, false, true, true],
    ['flutter', 'unknown', true, false, true, true],
    ['av', 'unknown', true, true, true, true],
    ['paced', 'unknown', true, true, true, true],
    ['paced', 'atrial', true, true, true, true],
    ['paced', 'ventricular', false, true, true, false],
    ['ventricular', 'unknown', false, false, false, false],
    ['arrest', 'unknown', false, false, false, false],
  ]
  test.each(cases)('applies %s / %s to all refinements and bundle choices', (rhythm, pacingType, bundle, sves, ves, st) => {
    const refinements: (EcgRefinement | '')[] = ['', ...(rhythm ? refinementOptions[rhythm].map(o => o.value) : [])]
    for (const refinement of refinements) {
      for (const bundleBranch of ['none', 'rsb', 'lsb'] as const) {
        const raw = { ...populated(), rhythm, refinement, pacingType, bundleBranch, sgarbossa: ['yes', 'no', 'no'] as SgarbossaAnswers }
        const hasSgarbossa = (bundle && bundleBranch === 'lsb') || (rhythm === 'paced' && pacingType === 'ventricular')
        const hasSt = st && !hasSgarbossa
        expect(ecgAvailability(raw)).toMatchObject({ bundleBranch: bundle, sves, ves, st: hasSt, sgarbossa: hasSgarbossa })
        const f = normalizeEcgFinding(raw)
        expect(f).toMatchObject({ bundleBranch: bundle ? bundleBranch : 'none', sves, ves, morphology: ves ? 'poly' : '' })
        if (!hasSt) expect(f).toMatchObject(emptySt)
        else expect(f.elevationLeads).toEqual(['II'])
        expect(f.sgarbossa).toEqual(hasSgarbossa ? ['yes', 'no', 'no'] : ['no', 'no', 'no'])
        expect(normalizeEcgFinding(f)).toEqual(f)
        if (!sves) expect(ecgText(raw)).not.toContain('SVES')
        if (!ves) expect(ecgText(raw)).not.toContain('VES')
        if (!hasSt) expect(ecgText(raw)).not.toMatch(/hebt|senkt/)
      }
    }
  })

  test.each(['arrest', 'ventricular'] as const)('clears all additions on switch to %s without restoring them', rhythm => {
    const original = populated()
    const next = updateEcg(original, { type: 'rhythm', value: rhythm })
    expect(next).toMatchObject({ ...emptySt, bundleBranch: 'none', sves: false, ves: false, morphology: '' })
    expect(ecgText(updateEcg(next, { type: 'rhythm', value: 'sinus' }))).toBe('EKG SR')
    expect(original).toEqual(populated())
  })

  test.each(['af', 'flutter'] as const)('removes only SVES on switch to %s', rhythm => {
    const next = updateEcg(populated(), { type: 'rhythm', value: rhythm })
    expect(next).toMatchObject({ sves: false, ves: true, morphology: 'poly', bundleBranch: 'rsb', elevation: true })
    expect(updateEcg(next, { type: 'rhythm', value: 'sinus' }).sves).toBe(false)
    expect(ecgNeedsTreatment({ ...createEcgFinding(), rhythm: 'af', sves: true })).toBe(false)
  })

  test('clears ST when selecting LSB and rejects hidden ST actions', () => {
    let f = updateEcg(populated(), { type: 'bundleBranch', value: 'lsb' })
    expect(f).toMatchObject(emptySt)
    f = updateEcg(f, { type: 'leads', direction: 'elevation', value: ['II'] })
    expect(f).toMatchObject(emptySt)
    expect(updateEcg(f, { type: 'bundleBranch', value: 'rsb' })).toMatchObject(emptySt)
  })

  test('clears block/ST for ventricular pacing and resets Sgarbossa on context changes', () => {
    let f: EcgFinding = { ...populated(), rhythm: 'paced', pacingType: 'atrial' }
    f = updateEcg(f, { type: 'pacingType', value: 'ventricular' })
    expect(f).toMatchObject({ ...emptySt, bundleBranch: 'none', sves: true, ves: true })
    f = updateEcg(f, { type: 'sgarbossa', index: 0, value: 'yes' })
    expect(ecgText(f)).toContain('ventrikulär / AV-sequenziell stimuliert; Sgarbossa erfüllt (konk. ST-Hebung)')
    f = updateEcg(f, { type: 'pacingType', value: 'atrial' })
    expect(f).toMatchObject({ ...emptySt, bundleBranch: 'none', sgarbossa: ['no', 'no', 'no'] })
    f = updateEcg(f, { type: 'bundleBranch', value: 'lsb' })
    f = updateEcg(f, { type: 'sgarbossa', index: 1, value: 'yes' })
    expect(ecgText(f)).toContain('nur atrial stimuliert; LSB; Sgarbossa erfüllt (konk. ST-Senkung)')
    f = updateEcg(f, { type: 'pacingType', value: 'ventricular' })
    expect(f.sgarbossa).toEqual(['no', 'no', 'no'])
    f = updateEcg(f, { type: 'sgarbossa', index: 2, value: 'yes' })
    f = updateEcg(f, { type: 'rhythm', value: 'sinus' })
    expect(f).toMatchObject({ pacingType: 'unknown', sgarbossa: ['no', 'no', 'no'] })
    expect(updateEcg(f, { type: 'rhythm', value: 'paced' }).pacingType).toBe('ventricular')
  })

  test('defaults legacy or invalid pacing types without removing applicable findings', () => {
    for (const pacingType of [undefined, null, 'invalid']) {
      const f = normalizeEcgFinding({ ...populated(), rhythm: 'paced', pacingType })
      expect(f).toMatchObject({ pacingType: 'unknown', bundleBranch: 'rsb', sves: true, ves: true, elevation: true })
      expect(ecgText(f)).not.toContain('stimuliert')
    }
  })
})

describe('ECG frequency', () => {
  test('formats a tachycardic range without a prefix and preserves matching free text', () => {
    const finding: EcgFinding = {
      ...createEcgFinding(), rhythm: 'af', refinement: 'tachy', frequency: { lower: 120, upper: 150 },
    }
    expect(ecgText(finding)).toBe('EKG TAA; 120-150/min')
    expect(ecgText({ ...finding, notes: 'Frequenz 120-150/min' }))
      .toBe('EKG TAA; 120-150/min; Frequenz 120-150/min')
  })

  test('shows only applicable controls with rhythm-derived knob modes and presets', () => {
    for (const rhythm of ['', 'sinus', 'af', 'flutter', 'paced', 'av', 'ventricular', 'arrest'] as const) {
      const refinements: (EcgRefinement | '')[] = ['', ...(rhythm ? refinementOptions[rhythm].map(o => o.value) : [])]
      for (const refinement of refinements) {
        const f = { ...createEcgFinding(), rhythm, refinement }
        const config = ecgFrequencyConfig(f)
        const visible = rhythm === 'av' || rhythm === 'ventricular' || refinement === 'tachy' || refinement === 'brady'
        if (!visible) {
          expect(config).toBeNull()
          expect(normalizeEcgFinding({ ...f, frequency: 50 }).frequency).toBeNull()
          continue
        }
        const dualKnobs = rhythm === 'af' || refinement === 'av2t1' || refinement === 'av2t2' || refinement === 'torsades'
        const brady = refinement === 'brady'
        const tachy = ['tachy', 'vt', 'torsades'].includes(refinement)
        const min = tachy ? 105 : 5
        const max = brady ? 55 : ['av2t1', 'av2t2', 'av3'].includes(refinement) ? 100 : 300
        expect(config).toEqual({ min, max, step: 5, dualKnobs,
          preset: dualKnobs ? { lower: min, upper: max } : brady ? 50 : tachy ? 150 : 60 })
        expect(ecgFrequencyConfig({ ...f, ...{ sves: true, ves: true } })).toEqual(config)
        expect(ecgText(f)).not.toContain('/min')
      }
    }
  })

  test('snaps, clamps and orders finite values and rejects malformed or incompatible shapes', () => {
    const brady = { ...createEcgFinding(), refinement: 'brady' } as const
    for (const [frequency, expected] of [[17, 15], [18, 20], [-5, 5], [300, 55]]) {
      expect(normalizeEcgFinding({ ...brady, frequency }).frequency).toBe(expected)
    }
    const af = { ...brady, rhythm: 'af' } as const
    expect(normalizeEcgFinding({ ...af, frequency: { lower: 63, upper: -8 } }).frequency).toEqual({ lower: 5, upper: 55 })
    expect(normalizeEcgFinding({ ...af, frequency: { lower: 18, upper: 14 } }).frequency).toEqual({ lower: 15, upper: 20 })
    for (const frequency of [undefined, null, NaN, Infinity, '50', {}, [], { lower: 10 }, { lower: 10, upper: Infinity }]) {
      expect(normalizeEcgFinding({ ...brady, frequency }).frequency).toBeNull()
      expect(normalizeEcgFinding({ ...af, frequency }).frequency).toBeNull()
    }
    expect(normalizeEcgFinding({ ...brady, frequency: { lower: 15, upper: 20 } }).frequency).toBeNull()
    expect(normalizeEcgFinding({ ...af, frequency: 50 }).frequency).toBeNull()
    expect(normalizeEcgFinding({ ...brady, refinement: 'tachy', frequency: 50 }).frequency).toBe(105)
    const normalized = normalizeEcgFinding({ ...af, frequency: { lower: 18, upper: 14 } })
    expect(normalizeEcgFinding(normalized)).toEqual(normalized)
  })

  test('records only interaction, retains unrelated edits and resets on rhythm/refinement changes', () => {
    let f = updateEcg(createEcgFinding(), { type: 'refinement', value: 'brady' })
    expect(f.frequency).toBeNull()
    expect(ecgText(f)).toBe('Sinusbradyk.')
    f = updateEcg(f, { type: 'frequency', value: 45 })
    expect(ecgText(f)).toBe('Sinusbradyk; 45/min')
    f = updateEcg(f, { type: 'extrasystoles', value: 'ves' })
    f = updateEcg(f, { type: 'bundleBranch', value: 'rsb' })
    f = updateEcg(f, { type: 'notes', value: 'Kontrolle' })
    expect(ecgText(f)).toBe('Sinusbradyk; RSB; VES; 45/min; Kontrolle')
    for (const value of ['tachy', 'normo', 'brady'] as const) {
      expect(updateEcg(f, { type: 'refinement', value }).frequency).toBeNull()
    }
    for (const value of ['af', 'arrest', 'sinus'] as const) {
      expect(updateEcg(f, { type: 'rhythm', value }).frequency).toBeNull()
    }
    expect(f.frequency).toBe(45)
    const af = normalizeEcgFinding({ ...f, rhythm: 'af', frequency: { lower: 15, upper: 20 } })
    expect(ecgText(af)).toContain('15-20/min; Kontrolle')
    expect(updateEcg(createEcgFinding(), { type: 'frequency', value: 50 }).frequency).toBeNull()
    const paced = normalizeEcgFinding({ ...f, rhythm: 'paced' })
    expect(updateEcg(paced, { type: 'pacingType', value: 'ventricular' }).frequency).toBe(45)
  })

  test('does not invent frequency when hydrating legacy records', () => {
    for (const input of ['SR', 'VHF', 'TAA 130-160/min', { rhythm: 'sinus', refinement: 'brady' },
      { rhythm: 'af', refinement: 'tachy' }, { rhythm: 'av', refinement: 'av2t1' }]) {
      expect(normalizeEcgFinding(input).frequency).toBeNull()
    }
  })
})

describe('modified Sgarbossa truth table', () => {
  const answers: CriterionAnswer[] = ['yes', 'no']
  const cases: [SgarbossaAnswers, string][] = answers.flatMap(a => answers.flatMap(b => answers.map(c => {
    const values: SgarbossaAnswers = [a, b, c]
    const positives = values.filter(value => value === 'yes').length
    return [values, positives > 0 ? 'erfüllt' : 'nicht erfüllt'] as [SgarbossaAnswers, string]
  })))
  test.each(cases)('%j → %s', (values, expected) => expect(sgarbossaResult(values)).toBe(expected))

  test.each<[SgarbossaAnswers, string]>([
    [['no', 'no', 'no'], 'Sgarbossa negativ'],
    [['yes', 'no', 'no'], 'Sgarbossa erfüllt (konk. ST-Hebung)'],
    [['no', 'yes', 'no'], 'Sgarbossa erfüllt (konk. ST-Senkung)'],
    [['no', 'no', 'yes'], 'Sgarbossa erfüllt (disk. ST-Hebung)'],
    [['yes', 'yes', 'no'], 'Sgarbossa erfüllt (konk. ST-Hebung, konk. ST-Senkung)'],
    [['yes', 'no', 'yes'], 'Sgarbossa erfüllt (konk. ST-Hebung, disk. ST-Hebung)'],
    [['no', 'yes', 'yes'], 'Sgarbossa erfüllt (konk. ST-Senkung, disk. ST-Hebung)'],
    [['yes', 'yes', 'yes'], 'Sgarbossa erfüllt (konk. ST-Hebung, konk. ST-Senkung, disk. ST-Hebung)'],
  ])('reports %j as %s in both applicable contexts', (sgarbossa, expected) => {
    expect(ecgText({ ...createEcgFinding(), bundleBranch: 'lsb', sgarbossa }))
      .toBe(`EKG SR; LSB; ${expected}`)
    expect(ecgText({ ...createEcgFinding(), rhythm: 'paced', pacingType: 'ventricular', sgarbossa }))
      .toBe(`EKG Schrittmacherrhythmus; ventrikulär / AV-sequenziell stimuliert; ${expected}`)
  })
})
