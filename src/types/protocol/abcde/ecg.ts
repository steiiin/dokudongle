import { concatDoku } from '@/utils/text'

export const rhythmRows = [
  [{ value: 'sinus', label: 'Sinus', color: 'success' }],
  [{ value: 'af', label: 'Vorhofflimmern', color: 'success' }, { value: 'flutter', label: 'Vorhofflattern', color: 'success' }],
  [{ value: 'av', label: 'AV-Block', color: 'warning' }, { value: 'paced', label: 'Schrittmacherrhythmus', color: 'warning' }],
  [{ value: 'ventricular', label: 'Kammerrhythmus', color: 'danger' }, { value: 'arrest', label: 'Herzstillstand', color: 'danger' }],
] as const
export type EcgRhythm = typeof rhythmRows[number][number]['value']
const rateOptions = [
  { value: 'normo', label: 'Normo' }, { value: 'tachy', label: 'Tachy' }, { value: 'brady', label: 'Brady' },
] as const
export const refinementOptions = {
  sinus: rateOptions, af: rateOptions, flutter: rateOptions, paced: rateOptions,
  av: [
    { value: 'av1', label: 'I. Grad' }, { value: 'av2t1', label: 'II. Grad Typ 1' },
    { value: 'av2t2', label: 'II. Grad Typ 2' }, { value: 'av3', label: 'III. Grad' },
  ],
  ventricular: [{ value: 'vt', label: 'VT' }, { value: 'torsades', label: 'Torsade de pointes' }],
  arrest: [{ value: 'vf', label: 'Kammerflimmern' }, { value: 'asystole', label: 'Asystolie' }, { value: 'pea', label: 'PEA' }],
} as const
export type EcgRefinement = typeof refinementOptions[EcgRhythm][number]['value']
export const leadRows = [
  ['I', 'II', 'III', 'aVF', 'aVL', 'aVR'],
  ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'],
  ['V1r', 'V2r', 'V3r', 'V4r', 'V5r', 'V6r', 'V7r', 'V8r', 'V9r'],
] as const
export type EcgLead = typeof leadRows[number][number]
export type CriterionAnswer = 'yes' | 'no'
export type SgarbossaAnswers = [CriterionAnswer, CriterionAnswer, CriterionAnswer]
export type StDirection = 'elevation' | 'depression'
export type EcgFrequency = number | { lower: number; upper: number }
export interface EcgFinding {
  rhythm: EcgRhythm | ''
  refinement: EcgRefinement | ''
  pacingType: 'unknown' | 'atrial' | 'ventricular'
  bundleBranch: 'none' | 'rsb' | 'lsb'
  sves: boolean
  ves: boolean
  morphology: '' | 'mono' | 'poly'
  st: 'none' | 'changes' | 'unassessable'
  elevation: boolean
  depression: boolean
  elevationLeads: EcgLead[]
  depressionLeads: EcgLead[]
  sgarbossa: SgarbossaAnswers
  frequency: EcgFrequency | null
  notes: string
}
export const createEcgFinding = (): EcgFinding => ({
  rhythm: 'sinus', refinement: 'normo', pacingType: 'unknown', bundleBranch: 'none', sves: false, ves: false,
  morphology: '', st: 'none', elevation: false, depression: false,
  elevationLeads: [], depressionLeads: [], sgarbossa: ['no', 'no', 'no'], frequency: null, notes: '',
})

// Presets describe the control only; they are not recorded until slider interaction.
export function ecgFrequencyConfig(f: Pick<EcgFinding, 'rhythm' | 'refinement'>) {
  if (!f.rhythm || f.rhythm === 'arrest') return null
  if (f.rhythm !== 'av' && f.rhythm !== 'ventricular' && f.refinement !== 'tachy' && f.refinement !== 'brady') return null
  const tachy = f.refinement === 'tachy' || f.refinement === 'vt' || f.refinement === 'torsades'
  const brady = f.refinement === 'brady'
  const higherDegreeAvBlock = f.rhythm === 'av' && ['av2t1', 'av2t2', 'av3'].includes(f.refinement)
  const min = tachy ? 105 : 5
  const max = brady ? 55 : higherDegreeAvBlock ? 100 : 300
  const dualKnobs = f.rhythm === 'af' || f.refinement === 'av2t1' || f.refinement === 'av2t2' || f.refinement === 'torsades'
  const preset: EcgFrequency = dualKnobs ? { lower: min, upper: max } : brady ? 50 : tachy ? 150 : 60
  return { min, max, step: 5, dualKnobs, preset }
}

function normalizeEcgFrequency(value: unknown, config: ReturnType<typeof ecgFrequencyConfig>): EcgFrequency | null {
  if (!config) return null
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
  const snap = (n: number) => Math.max(config.min, Math.min(config.max, Math.round(n / config.step) * config.step))
  if (!config.dualKnobs) return finite(value) ? snap(value) : null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { lower, upper } = value as Record<string, unknown>
  if (!finite(lower) || !finite(upper)) return null
  return { lower: snap(Math.min(lower, upper)), upper: snap(Math.max(lower, upper)) }
}

export function ecgFrequencyText(value: EcgFrequency): string {
  return `${typeof value === 'number' ? value : `${value.lower}-${value.upper}`}/min`
}

// UI documentation rules: PEA is intentionally grouped with cardiac arrest.
// LSB and ventricular pacing use modified Sgarbossa instead of ordinary ST entry
// (ACC 2022 Expert Consensus, Table 1; doi:10.1016/j.jacc.2022.08.750).
export function ecgAvailability(f: Pick<EcgFinding, 'rhythm' | 'pacingType' | 'bundleBranch'>) {
  const extras = f.rhythm !== 'arrest' && f.rhythm !== 'ventricular'
  const ventricularPacing = f.rhythm === 'paced' && f.pacingType === 'ventricular'
  const sgarbossaContext = !extras ? null : ventricularPacing ? 'ventricular' : f.bundleBranch === 'lsb' ? 'lsb' : null
  return {
    bundleBranch: extras && !ventricularPacing,
    sves: extras && f.rhythm !== 'af' && f.rhythm !== 'flutter',
    ves: extras,
    st: extras && sgarbossaContext === null,
    sgarbossa: sgarbossaContext !== null,
    sgarbossaContext,
  }
}

// Normalize before template hydration, including legacy free text without inventing a rhythm.
export function normalizeEcgFinding(input: unknown): EcgFinding {
  const defaults = createEcgFinding()
  if (typeof input === 'string') {
    if (input === 'SR') return defaults
    if (input === 'VHF') return { ...defaults, rhythm: 'af' }
    return { ...defaults, rhythm: '', refinement: '', notes: input }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return defaults
  const source = input as Record<string, unknown>
  const rhythm = rhythmRows.flat().some(option => option.value === source.rhythm) ? source.rhythm as EcgRhythm : ''
  const refinement = rhythm && refinementOptions[rhythm].some(option => option.value === source.refinement)
    ? source.refinement as EcgRefinement : ''
  const leads = (value: unknown): EcgLead[] => Array.isArray(value)
    ? leadRows.flat().filter(lead => value.includes(lead)) : []
  const pacingType = rhythm === 'paced' && (source.pacingType === 'atrial' || source.pacingType === 'ventricular')
    ? source.pacingType : 'unknown'
  const candidateBundle = source.bundleBranch === 'rsb' || source.bundleBranch === 'lsb' ? source.bundleBranch : 'none'
  const available = ecgAvailability({ rhythm, pacingType, bundleBranch: candidateBundle })
  const bundleBranch = available.bundleBranch ? candidateBundle : 'none'
  const sves = available.sves && source.sves === true
  const ves = available.ves && source.ves === true
  const st = available.st && (source.st === 'changes' || source.st === 'unassessable') ? source.st : 'none'
  const elevation = st === 'changes' && source.elevation === true
  const depression = st === 'changes' && source.depression === true
  const elevationLeads = elevation ? leads(source.elevationLeads) : []
  return {
    ...defaults, rhythm, refinement, pacingType, bundleBranch, sves, ves,
    morphology: ves && (source.morphology === 'mono' || source.morphology === 'poly') ? source.morphology : '',
    st: st === 'changes' && !elevation && !depression ? 'none' : st,
    elevation, depression, elevationLeads,
    depressionLeads: depression ? leads(source.depressionLeads).filter(lead => !elevationLeads.includes(lead)) : [],
    sgarbossa: defaults.sgarbossa.map((_, index) => {
      const answer = available.sgarbossa && Array.isArray(source.sgarbossa) ? source.sgarbossa[index] : undefined
      return answer === 'yes' ? 'yes' : 'no'
    }) as SgarbossaAnswers,
    frequency: normalizeEcgFrequency(source.frequency, ecgFrequencyConfig({ rhythm, refinement })),
    notes: typeof source.notes === 'string' ? source.notes : '',
  }
}

export type EcgAction =
  | { type: 'rhythm'; value: EcgRhythm }
  | { type: 'refinement'; value: EcgRefinement }
  | { type: 'pacingType'; value: EcgFinding['pacingType'] }
  | { type: 'bundleBranch'; value: EcgFinding['bundleBranch'] }
  | { type: 'extrasystoles'; value: 'none' | 'sves' | 'ves' }
  | { type: 'morphology'; value: 'mono' | 'poly' }
  | { type: 'st'; value: 'none' | 'unassessable' | StDirection }
  | { type: 'lead'; direction: StDirection; value: EcgLead }
  | { type: 'leads'; direction: StDirection; value: EcgLead[] }
  | { type: 'sgarbossa'; index: 0 | 1 | 2; value: CriterionAnswer }
  | { type: 'frequency'; value: EcgFrequency | null }
  | { type: 'notes'; value: string }

export function updateEcg(finding: EcgFinding, action: EcgAction): EcgFinding {
  const next = normalizeEcgFinding(finding)
  const previousContext = ecgAvailability(next).sgarbossaContext
  switch (action.type) {
    case 'rhythm':
      next.rhythm = next.rhythm === action.value ? '' : action.value
      next.pacingType = next.rhythm === 'paced' ? 'ventricular' : 'unknown'
      next.refinement = next.rhythm && refinementOptions[next.rhythm].some(option => option.value === 'normo') ? 'normo' : ''
      break
    case 'refinement': next.refinement = next.refinement === action.value ? '' : action.value; break
    case 'pacingType': next.pacingType = action.value; break
    case 'bundleBranch':
      next.bundleBranch = action.value
      break
    case 'extrasystoles':
      if (action.value === 'none') { next.sves = false; next.ves = false }
      else next[action.value] = !next[action.value]
      if (!next.ves) next.morphology = ''
      break
    case 'morphology': next.morphology = next.morphology === action.value ? '' : action.value; break
    case 'st':
      if (action.value === 'none' || action.value === 'unassessable') {
        next.st = action.value; next.elevation = false; next.depression = false
      } else {
        next.st = 'changes'; next[action.value] = !next[action.value]
      }
      break
    case 'lead': {
      if (!next[action.direction]) break
      const key = action.direction === 'elevation' ? 'elevationLeads' : 'depressionLeads'
      const other = action.direction === 'elevation' ? 'depressionLeads' : 'elevationLeads'
      next[key] = next[key].includes(action.value) ? next[key].filter(lead => lead !== action.value) : [...next[key], action.value]
      next[other] = next[other].filter(lead => lead !== action.value)
      break
    }
    case 'leads': {
      const key = action.direction === 'elevation' ? 'elevationLeads' : 'depressionLeads'
      const otherDirection = action.direction === 'elevation' ? 'depression' : 'elevation'
      const otherKey = otherDirection === 'elevation' ? 'elevationLeads' : 'depressionLeads'
      next[key] = leadRows.flat().filter(lead => action.value.includes(lead))
      const previousOtherLeads = next[otherKey]
      next[otherKey] = previousOtherLeads.filter(lead => !next[key].includes(lead))
      next[action.direction] = next[key].length > 0
      if (previousOtherLeads.length > 0 && next[otherKey].length === 0) next[otherDirection] = false
      next.st = next.elevation || next.depression ? 'changes' : 'none'
      break
    }
    case 'sgarbossa': next.sgarbossa[action.index] = action.value; break
    case 'frequency': next.frequency = action.value; break
    case 'notes': next.notes = action.value; break
  }
  if (next.rhythm !== finding.rhythm || next.refinement !== finding.refinement) next.frequency = null
  const normalized = normalizeEcgFinding(next)
  if (ecgAvailability(normalized).sgarbossaContext !== previousContext) {
    normalized.sgarbossa = ['no', 'no', 'no']
  }
  return normalized
}

export function sgarbossaResult(answers: SgarbossaAnswers): string {
  return answers.includes('yes') ? 'erfüllt' : 'nicht erfüllt'
}

const rhythmTexts: Record<EcgRhythm, Partial<Record<EcgRefinement | '', string>>> = {
  sinus: { '': 'Sinusrhythmus', normo: 'EKG SR', tachy: 'Sinustachyk.', brady: 'Sinusbradyk.' },
  af: { '': 'Vorhofflimmern', normo: 'EKG VHF', tachy: 'EKG TAA', brady: 'EKG BAA' },
  flutter: { '': 'Vorhofflattern', normo: 'Vorhofflattern', tachy: 'Vorhofflattern mit tachyk. Kammerfrq.', brady: 'Vorhofflattern mit bradyk. Kammerfrq.' },
  av: { '': 'AV-Block', av1: 'AV-Block I°', av2t1: 'AV-Block II° Typ 1', av2t2: 'AV-Block II° Typ 2', av3: 'AV-Block III°' },
  paced: { '': 'Schrittmacherrhythmus', normo: 'EKG Schrittmacherrhythmus', tachy: 'EKG tachyk. Schrittmacherrhythmus', brady: 'EKG bradyk. Schrittmacherrhythmus' },
  ventricular: { '': 'Kammerrhythmus', vt: 'EKG VT', torsades: 'EKG Torsade de pointes' },
  arrest: { '': 'Herzstillstand', vf: 'EKG VF', asystole: 'EKG Asystolie', pea: 'EKG PEA' },
}
export function ecgText(finding: EcgFinding): string {
  const f = normalizeEcgFinding(finding)
  const result = ecgAvailability(f).sgarbossa ? sgarbossaResult(f.sgarbossa) : ''
  const positiveCriteria = ['konk. ST-Hebung', 'konk. ST-Senkung', 'disk. ST-Hebung']
    .filter((_, index) => f.sgarbossa[index] === 'yes')
  const stText = (direction: StDirection, verb: string, fallback: string) => {
    const leads = direction === 'elevation' ? f.elevationLeads : f.depressionLeads
    return f[direction] ? leads.length ? `${verb} in ${leads.join(', ')}` : fallback : ''
  }
  const rhythmText = f.rhythm ? rhythmTexts[f.rhythm][f.refinement] ?? rhythmTexts[f.rhythm]['']! : ''
  const additions = concatDoku([
    f.pacingType === 'atrial' ? 'nur atrial stimuliert' : f.pacingType === 'ventricular' ? 'ventrikulär / AV-sequenziell stimuliert' : '',
    f.bundleBranch === 'none' ? '' : f.bundleBranch.toUpperCase(),
    result ? result === 'erfüllt' ? `Sgarbossa erfüllt (${positiveCriteria.join(', ')})` : 'Sgarbossa negativ' : '',
    f.sves ? 'SVES' : '',
    f.ves ? f.morphology === 'mono' ? 'monomorphe VES' : f.morphology === 'poly' ? 'polymorphe VES' : 'VES' : '',
    stText('elevation', 'hebt', 'ST-Hebung'), stText('depression', 'senkt', 'ST-Senkung'),
    f.st === 'unassessable' ? 'ST-Strecke nicht beurteilbar' : '',
    f.frequency !== null ? ecgFrequencyText(f.frequency) : '',
  ], false)
  // Preserve rhythm abbreviations and legacy free text when no joining is needed.
  if (!rhythmText && !additions) return f.notes
  return additions || f.notes.trim() ? concatDoku([rhythmText, additions, f.notes], false) : rhythmText
}

export function ecgNeedsTreatment(finding: EcgFinding): boolean {
  const f = normalizeEcgFinding(finding)
  const abnormalRhythm = !!f.rhythm && !((f.rhythm === 'sinus' || f.rhythm === 'af') && f.refinement === 'normo')
  return abnormalRhythm || f.bundleBranch !== 'none' || f.sves || f.ves || f.elevation || f.depression || !!f.notes.trim()
}
