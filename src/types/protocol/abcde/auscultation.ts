export const auscultationFindings = [
  { key: 'enhanced', label: 'Verschärft' },
  { key: 'diminished', label: 'Abgeschwächt' },
  { key: 'silent', label: 'Stumm' },
  { key: 'wheezing', label: 'Giemen' },
  { key: 'rhonchi', label: 'Brummen' },
  { key: 'crackles', label: 'RGs' },
] as const
export type AuscultationFinding = typeof auscultationFindings[number]['key']
export const lungSides = ['right', 'left'] as const
export type LungSide = typeof lungSides[number]
export const lungRegions = ['upper', 'base'] as const
export type LungRegion = typeof lungRegions[number]
export const regionLabels: Record<LungRegion, string> = { upper: 'Oberfeld', base: 'Basal' }
export type LungLocations = Record<LungRegion, boolean>
export type AuscultationLocations = Record<LungSide, LungLocations>
export interface BreathingAuscultation {
  normalVolume: boolean
  noAddedSounds: boolean
  findings: Record<AuscultationFinding, AuscultationLocations>
}

export const auscultationGroups = [
  { key: 'volume', title: 'Lautstärke', normalLabel: 'Normal', normalKey: 'normalVolume', findings: auscultationFindings.slice(0, 3) },
  { key: 'addedSounds', title: 'Nebengeräusche', normalLabel: 'Keine', normalKey: 'noAddedSounds', findings: auscultationFindings.slice(3) },
] as const
export type AuscultationGroup = typeof auscultationGroups[number]['key']

export function emptyLungLocations(): LungLocations {
  return { upper: false, base: false }
}
export function emptyAuscultationLocations(): AuscultationLocations {
  return { right: emptyLungLocations(), left: emptyLungLocations() }
}
export function emptyAuscultation(): BreathingAuscultation {
  return {
    normalVolume: false,
    noAddedSounds: false,
    findings: Object.fromEntries(auscultationFindings.map(({ key }) => [key, emptyAuscultationLocations()])) as BreathingAuscultation['findings'],
  }
}
export function hasLocations(value: AuscultationLocations): boolean {
  return lungSides.some(side => lungRegions.some(region => value[side][region]))
}
export function hasAuscultationFindings(value: BreathingAuscultation): boolean {
  return auscultationFindings.some(({ key }) => hasLocations(value.findings[key]))
}
export function hasAuscultationGroupFindings(value: BreathingAuscultation, group: AuscultationGroup): boolean {
  return auscultationGroups.find(item => item.key === group)!.findings.some(({ key }) => hasLocations(value.findings[key]))
}
function copyAuscultation(value: BreathingAuscultation): BreathingAuscultation {
  const next = { ...value, findings: { ...value.findings } }
  for (const { key } of auscultationFindings) next.findings[key] = copyLocations(value.findings[key])
  return next
}
export function setAuscultationGroupNormal(
  value: BreathingAuscultation, group: AuscultationGroup, normal: boolean,
): BreathingAuscultation {
  const next = copyAuscultation(value)
  const definition = auscultationGroups.find(item => item.key === group)!
  next[definition.normalKey] = normal
  if (normal) {
    for (const { key } of definition.findings) next.findings[key] = emptyAuscultationLocations()
  }
  return next
}
export function copyLocations(value: AuscultationLocations): AuscultationLocations {
  return { right: { ...value.right }, left: { ...value.left } }
}

export function selectLungRegion(value: AuscultationLocations, side: LungSide, region: LungRegion): void {
  value[side][region] = !value[side][region]
}
/** Quick choices replace the complete localization, including the opposite side. */
export function selectLungSides(sides: readonly LungSide[]): AuscultationLocations {
  const value = emptyAuscultationLocations()
  for (const side of sides) value[side] = { upper: true, base: true }
  return value
}

const exclusiveFindings: readonly AuscultationFinding[] = ['enhanced', 'diminished', 'silent']
export function confirmAuscultationFinding(
  value: BreathingAuscultation, finding: AuscultationFinding, selection: AuscultationLocations,
): BreathingAuscultation {
  const next = copyAuscultation(value)
  next.findings[finding] = copyLocations(selection)
  if (hasLocations(selection)) next[exclusiveFindings.includes(finding) ? 'normalVolume' : 'noAddedSounds'] = false
  for (const { key: other } of auscultationFindings) {
    if (other === finding) continue
    const conflicts = finding === 'silent' || other === 'silent'
      || (exclusiveFindings.includes(finding) && exclusiveFindings.includes(other))
    if (!conflicts) continue
    for (const side of lungSides) {
      for (const region of lungRegions) {
        if (selection[side][region]) next.findings[other][side][region] = false
      }
    }
  }
  return next
}
export function setNormalAuscultation(normal: boolean): BreathingAuscultation {
  return { ...emptyAuscultation(), normalVolume: normal, noAddedSounds: normal }
}

/** Keep newer choices authoritative when the reanimation snapshot restores individual booleans. */
export function reconcileRestoredAuscultation(
  restored: BreathingAuscultation, current: BreathingAuscultation,
): BreathingAuscultation {
  // Restored booleans can conflict with newer choices. Apply only the newer
  // fields as authoritative; do not let merged old fields displace them.
  let next = normalizeAuscultation({ value: restored }).value
  for (const group of auscultationGroups) {
    if (current[group.normalKey]) next = setAuscultationGroupNormal(next, group.key, true)
  }
  for (const { key } of auscultationFindings) {
    const edited = current.findings[key]
    if (!hasLocations(edited)) continue
    const previous = next.findings[key]
    next = confirmAuscultationFinding(next, key, edited)
    for (const side of lungSides) for (const region of lungRegions) {
      next.findings[key][side][region] ||= previous[side][region]
    }
  }
  return next
}

export function auscultationLocationText(value: AuscultationLocations, compact = false): string {
  const remaining = copyLocations(value)
  const parts: string[] = []
  if (lungSides.every(side => lungRegions.every(region => value[side][region]))) {
    return compact ? 'ubiquitär' : 'Ubiquitär'
  }
  for (const region of lungRegions) {
    if (!lungSides.every(side => remaining[side][region])) continue
    parts.push(`bds. ${region === 'upper' ? 'Oberfeld' : 'basal'}`)
    for (const side of lungSides) remaining[side][region] = false
  }
  for (const side of lungSides) {
    const regions = lungRegions.filter(region => remaining[side][region])
    if (!regions.length) continue
    const label = side === 'right' ? 're.' : 'li.'
    parts.push(regions.length === 2 ? label : `${label} ${regions[0] === 'upper' ? 'Oberfeld' : 'basal'}`)
  }
  const text = parts.join(' und ')
  return text
}

const findingLabels: Record<AuscultationFinding, string> = {
  enhanced: 'AG verschärft', diminished: 'AG abgeschwächt', silent: 'kein AG',
  wheezing: 'Giemen', rhonchi: 'Brummen', crackles: 'RGs',
}
function joinSounds(sounds: string[]): string {
  if (sounds.length < 2) return sounds.join('')
  return `${sounds.slice(0, -1).join(', ')} und ${sounds[sounds.length - 1]}`
}
/** Group only identical complete localizations, never split partially overlapping findings. */
export function auscultationText(value: BreathingAuscultation): string {
  const groups = new Map<string, { locations: AuscultationLocations; findings: AuscultationFinding[] }>()
  for (const { key } of auscultationFindings) {
    const locations = value.findings[key]
    if (!hasLocations(locations)) continue
    const signature = lungSides.flatMap(side => lungRegions.map(region => Number(locations[side][region]))).join('')
    const group = groups.get(signature)
    if (group) group.findings.push(key)
    else groups.set(signature, { locations, findings: [key] })
  }
  if (!groups.size) {
    if (value.normalVolume && value.noAddedSounds) return 'Ausk. unauffällig'
    if (value.normalVolume) return 'AG normal'
    return value.noAddedSounds ? 'keine Nebengeräusche' : ''
  }
  return [...groups.values()].map(group => {
    const ag = group.findings.filter(key => exclusiveFindings.includes(key)).map(key => findingLabels[key])
    const sounds = group.findings.filter(key => !exclusiveFindings.includes(key)).map(key => findingLabels[key])
    const findings = [...ag, joinSounds(sounds)].filter(Boolean).join(', ')
    return `${auscultationLocationText(group.locations)} ${findings}.`
  }).join(' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
/** Normalize before hydration. Old data has no edit order, so silent > diminished > enhanced. */
export function normalizeAuscultation(input: unknown): { assessed: boolean; value: BreathingAuscultation } {
  const assessed = isRecord(input) && input.assessed === true
  const source = isRecord(input) && isRecord(input.value) ? input.value : {}
  const value = emptyAuscultation()
  if ('normal' in source || 'normalVolume' in source || 'noAddedSounds' in source || 'findings' in source) {
    const findings = isRecord(source.findings) ? source.findings : {}
    for (const { key } of auscultationFindings) {
      const finding = findings[key]
      if (!isRecord(finding)) continue
      for (const side of lungSides) {
        const saved = finding[side]
        if (!isRecord(saved)) continue
        const upper = saved.upper === true || saved.apex === true || saved.middle === true
        const base = saved.base === true
        const wholeSide = saved.unspecified === true && !upper && !base
        value.findings[key][side] = { upper: upper || wholeSide, base: base || wholeSide }
      }
    }
    for (const side of lungSides) for (const region of lungRegions) {
      if (value.findings.silent[side][region]) {
        for (const { key } of auscultationFindings) {
          if (key !== 'silent') value.findings[key][side][region] = false
        }
      } else if (value.findings.diminished[side][region]) {
        value.findings.enhanced[side][region] = false
      }
    }
    const hasGroupChoices = 'normalVolume' in source || 'noAddedSounds' in source
    const legacyNormal = source.normal === true && !hasAuscultationFindings(value)
    for (const group of auscultationGroups) {
      value[group.normalKey] = (hasGroupChoices ? source[group.normalKey] === true : legacyNormal)
        && !hasAuscultationGroupFindings(value, group.key)
    }
  } else {
    const legacy = { wheezing: 'wheezing', crackles: 'crackles', dimished: 'diminished' } as const
    for (const [oldKey, key] of Object.entries(legacy)) {
      const saved = source[oldKey]
      value.findings[key] = selectLungSides(saved === 'bds.' ? lungSides : saved === 're.' ? ['right'] : saved === 'li.' ? ['left'] : [])
    }
    const legacyNormal = assessed && Object.keys(legacy).every(key => source[key] === '')
    value.normalVolume = legacyNormal
    value.noAddedSounds = legacyNormal
  }
  return { assessed, value }
}
