import type {
  RedflagCatalog, RedflagScenarioSelection, RedflagSelectionTarget,
  ResolvedRedflagScenario,
} from '@/types/redflags'

export class RedflagResolutionError extends Error {}

const fail = (message: string): never => { throw new RedflagResolutionError(message) }

function indexCatalog(catalog: RedflagCatalog) {
  const ids = new Set<string>()
  for (const entry of [...catalog.signals, ...catalog.scenarios, ...catalog.subscenarios]) {
    if (!entry.id || ids.has(entry.id)) fail(`Ungültige oder doppelte RedFlags-ID: ${entry.id}`)
    ids.add(entry.id)
  }
  const signals = new Map(catalog.signals.map(signal => [signal.id, signal]))
  const scenarios = new Map(catalog.scenarios.map(scenario => [scenario.id, scenario]))
  const subscenarios = new Map(catalog.subscenarios.map(scenario => [scenario.id, scenario]))
  for (const entry of [...catalog.scenarios, ...catalog.subscenarios]) {
    if ('parentId' in entry && !scenarios.has(entry.parentId)) {
      fail(`Unbekanntes Hauptszenario: ${entry.parentId}`)
    }
    for (const id of [...entry.majorSignalIds, ...entry.minorSignalIds]) {
      if (!signals.has(id)) fail(`Unbekanntes Warnzeichen: ${id}`)
    }
  }
  return { signals, scenarios, subscenarios }
}

export function validateRedflagCatalog(catalog: RedflagCatalog): void {
  indexCatalog(catalog)
}

export function resolveRedflagScenario(
  catalog: RedflagCatalog,
  selection: RedflagScenarioSelection,
): ResolvedRedflagScenario {
  const { signals, scenarios, subscenarios } = indexCatalog(catalog)
  if (!selection || typeof selection.scenarioId !== 'string' || !Array.isArray(selection.subscenarioIds)) {
    return fail('Ungültige RedFlags-Auswahl')
  }
  if (selection.subscenarioMode !== undefined && selection.subscenarioMode !== 'all' && selection.subscenarioMode !== 'selected') {
    return fail('Ungültiger Unterszenario-Auswahlmodus')
  }
  const scenario = scenarios.get(selection.scenarioId)
    ?? fail(`Unbekanntes Hauptszenario: ${selection.scenarioId}`)
  const selected = new Set(selection.subscenarioIds)
  for (const id of selected) {
    const subscenario = subscenarios.get(id) ?? fail(`Unbekanntes Unterszenario: ${id}`)
    if (subscenario.parentId !== scenario.id) {
      fail(`Unterszenario ${id} gehört nicht zu ${scenario.id}`)
    }
  }
  const includeAll = selection.subscenarioMode === 'all'
    || (selection.subscenarioMode === undefined && selected.size === 0)
  const included = catalog.subscenarios.filter(subscenario => subscenario.parentId === scenario.id
    && (includeAll || selected.has(subscenario.id)))
  const content = [scenario, ...included]
  const unique = <T>(values: readonly T[]) => [...new Set(values)]
  const majorIds = unique(content.flatMap(entry => entry.majorSignalIds))
  const majorSet = new Set(majorIds)
  const minorIds = unique(content.flatMap(entry => entry.minorSignalIds)).filter(id => !majorSet.has(id))
  return {
    scenario,
    selection: {
      scenarioId: scenario.id,
      subscenarioIds: includeAll ? [] : included.map(entry => entry.id),
      ...(selection.subscenarioMode === undefined ? {} : { subscenarioMode: selection.subscenarioMode }),
    },
    aggregationMode: includeAll ? 'all-subscenarios' : 'selected-subscenarios',
    includedSubscenarioIds: included.map(entry => entry.id),
    requirements: unique(content.map(entry => entry.requirements).filter(text => text !== '')),
    majorSignals: majorIds.map(id => signals.get(id)!),
    minorSignals: minorIds.map(id => signals.get(id)!),
    diagnoses: unique(content.flatMap(entry => entry.diagnoses)),
    consequences: unique(content.flatMap(entry => entry.consequences)),
  }
}

/** An explicit child narrows an unrestricted parent; subsequent children extend it. */
export function selectRedflagTarget(
  catalog: RedflagCatalog,
  selections: readonly RedflagScenarioSelection[],
  target: RedflagSelectionTarget,
): RedflagScenarioSelection[] {
  const parentId = target.type === 'scenario' ? target.id
    : catalog.subscenarios.find(entry => entry.id === target.id)?.parentId
      ?? fail(`Unbekanntes Unterszenario: ${target.id}`)
  const previous = selections.find(selection => selection?.scenarioId === parentId)
  const previousResolved = previous && target.type === 'subscenario' ? resolveRedflagScenario(catalog, previous) : undefined
  const selection = resolveRedflagScenario(catalog, {
    scenarioId: parentId,
    subscenarioMode: target.type === 'scenario' ? 'all' : 'selected',
    subscenarioIds: target.type === 'scenario' ? [] : [...(previousResolved?.selection.subscenarioIds ?? []), target.id],
  }).selection
  return previous
    ? selections.map(entry => entry?.scenarioId === parentId ? selection : entry)
    : [...selections, selection]
}

/** Preserve the existing round-robin order across separately selected scenarios. */
export function interleaveUnique<T>(lists: readonly (readonly T[])[], key: (value: T) => unknown = value => value): T[] {
  const result: T[] = []
  const seen = new Set<unknown>()
  const maxLength = Math.max(0, ...lists.map(list => list.length))
  for (let i = 0; i < maxLength; i++) {
    for (const list of lists) {
      const value = list[i]
      if (value !== undefined && !seen.has(key(value))) {
        seen.add(key(value))
        result.push(value)
      }
    }
  }
  return result
}
