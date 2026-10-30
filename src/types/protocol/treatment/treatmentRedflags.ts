import { DATA_Redflags } from '@/data/redflags'
import type { RedflagSignal, RedflagApplication, RedflagCategory, RedflagScenarioSelection, ResolvedRedflagScenario } from '@/types/redflags'
import { interleaveUnique, resolveRedflagScenario } from '@/utils/redflags'
import { OptionalValue } from "../input"

/** Stored snapshots from before the catalog replacement; never offered as new choices. */
export interface LegacyRedflagScenario {
  id: string
  name: string
  requirements: string
  application: RedflagApplication
  category: RedflagCategory
  majorSignals: string[]
  minorSignals: string[]
  diagnoses: string[]
  consequences: string
}

export interface VisibleRedflag {
  key: string
  id?: string
  text: string
}

export interface RedflagSelectionResolution {
  selection: RedflagScenarioSelection
  resolved?: ResolvedRedflagScenario
  error?: string
}

export class TreatmentRedflags {

  public noTransportType: '' | RedflagApplication

  public choosenScenarios: Array<LegacyRedflagScenario>
  public scenarioSelections: RedflagScenarioSelection[]
  public choosenSignals: Array<RedflagSignal>
  public removedMajorSignals: Array<string>
  public removedMinorSignals: Array<string>
  public removedMajorSignalIds: string[]
  public removedMinorSignalIds: string[]
  public disableMinorBlock: boolean

  public attendant: OptionalValue<string>

  public consent: '' | 'Fähig' | 'Unfähig' | 'Zeitkritisch'

  // ##########################################################################

  constructor()
  {
    this.noTransportType = ''
    this.choosenScenarios = []
    this.scenarioSelections = []
    this.choosenSignals = []
    this.removedMajorSignals = []
    this.removedMinorSignals = []
    this.removedMajorSignalIds = []
    this.removedMinorSignalIds = []
    this.disableMinorBlock = false
    this.attendant = OptionalValue.inactive('')

    this.consent = ''
  }

  // ##########################################################################

  private dedupeById<T extends { id: string }>(list: T[]): T[] {
    return Array.from(new Map(list.map((entry) => [entry.id, entry])).values())
  }

  public getResolvedContent() {
    const resolutions: RedflagSelectionResolution[] = this.scenarioSelections.map(selection => {
      try {
        return { selection, resolved: resolveRedflagScenario(DATA_Redflags, selection) }
      } catch (error) {
        return { selection, error: error instanceof Error ? error.message : 'Ungültige RedFlags-Auswahl' }
      }
    })
    const resolved = resolutions.flatMap(entry => entry.resolved ? [entry.resolved] : [])
    const legacy = this.dedupeById(this.choosenScenarios)
    const custom = this.dedupeById(this.choosenSignals)
    const modern = this.scenarioSelections.length > 0
    const removedMajor = new Set(this.removedMajorSignals)
    const removedMinor = new Set(this.removedMinorSignals)
    const removedMajorIds = new Set(this.removedMajorSignalIds)
    const removedMinorIds = new Set(this.removedMinorSignalIds)
    const signalRow = (signal: RedflagSignal): VisibleRedflag => ({ key: `signal:${signal.id}`, ...signal })
    const legacyRow = (text: string): VisibleRedflag => {
      const signal = [...DATA_Redflags.signals, ...custom].find(entry => entry.text === text)
      return { key: modern && signal ? `signal:${signal.id}` : `legacy:${text}`, id: signal?.id, text }
    }
    const majorLists = [
      ...legacy.map(entry => entry.majorSignals.map(legacyRow)),
      ...resolved.map(entry => entry.majorSignals.map(signalRow)),
    ]
    const minorLists = [
      ...legacy.map(entry => entry.minorSignals.map(legacyRow)),
      ...resolved.map(entry => entry.minorSignals.map(signalRow)),
    ]
    const inheritedMajor = interleaveUnique(majorLists, signal => signal.key)
    const majorCandidates = [...inheritedMajor.filter(signal => !removedMajor.has(signal.text)), ...custom.map(signalRow)]
    const major = modern
      ? interleaveUnique([majorCandidates], signal => signal.key)
      : majorCandidates
    // Priority is decided before exclusions so removing a major cannot promote its minor copy.
    const majorKeys = new Set([...inheritedMajor, ...custom.map(signalRow)].map(signal => signal.key))
    const minor = interleaveUnique(minorLists, signal => signal.key)
      .filter(signal => !removedMinor.has(signal.text))
      .filter(signal => !modern || !majorKeys.has(signal.key))
    return {
      resolutions,
      majorSignals: major.filter(signal => !signal.id || !removedMajorIds.has(signal.id)),
      minorSignals: minor.filter(signal => !signal.id || !removedMinorIds.has(signal.id)),
      diagnoses: interleaveUnique([...legacy.map(entry => entry.diagnoses), ...resolved.map(entry => entry.diagnoses)]),
      // Retain historical output (including empty legacy strings) for old records.
      consequences: modern
        ? interleaveUnique([...legacy.map(entry => entry.consequences ? [entry.consequences] : []), ...resolved.map(entry => entry.consequences)])
        : legacy.map(entry => entry.consequences),
    }
  }

  public removeVisibleSignal(signal: VisibleRedflag): void {
    const ids = new Set(signal.id ? [signal.id]
      : this.choosenSignals.filter(entry => entry.text === signal.text).map(entry => entry.id))
    this.choosenSignals = this.choosenSignals.filter(entry => !ids.has(entry.id))
    this.removedMajorSignalIds = [...new Set([...this.removedMajorSignalIds, ...ids])]
    this.removedMinorSignalIds = [...new Set([...this.removedMinorSignalIds, ...ids])]
    if (this.choosenScenarios.some(entry => [...entry.majorSignals, ...entry.minorSignals].includes(signal.text))) {
      this.removedMajorSignals = [...new Set([...this.removedMajorSignals, signal.text])]
      this.removedMinorSignals = [...new Set([...this.removedMinorSignals, signal.text])]
    }
  }

  private getConcatText(list: Array<string>): string {
    if (list.length <= 1) { return list.pop() ?? '' }
    else {
      const lastEntry = list.pop()
      return `${list.join(', ')} oder ${lastEntry}`
    }
  }

  // ##########################################################################

  public getConsentBlock(): string
  {

    if (this.consent == 'Fähig') {
      return 'Pat. über erforderliche invasive Maßnahmen verständlich aufgeklärt; verstanden; ausdrücklich eingewilligt.'
    } else if (this.consent == 'Unfähig') {
      return 'Pat. nicht einwilligungsfähig; Maßnahme im Rahmen der mutmaßlichen Einwilligung durchgeführt; \nkeine Hinweise auf entgegenstehenden Patientenwillen.'
    } else if (this.consent == 'Zeitkritisch') {
      return 'Aufgrund zeitkritischer Situation verkürzte Aufklärung; \nPat. verständnisfähig; Einwilligung erteilt.'
    } else {
      return ''
    }

  }

  public getRedflagBlock(): string {

    // skip if no redflags information needed
    if (this.noTransportType == '') { return '' }

    const content = this.getResolvedContent()
    let block = content.resolutions.filter(entry => entry.error)
      .map(entry => `[RedFlags-Auswahl prüfen: ${entry.error}] \n`).join('')

    // create intro
    const diagnoses = content.diagnoses
    if (diagnoses.length > 0) {
      block += `Aufklärung bzgl. ${diagnoses.map((d) => d).join('; ')}. \n`
    }

    // create signals text
    const majorTexts = content.majorSignals.map(signal => signal.text)
    const minorTexts = content.minorSignals.map(signal => signal.text)

    if (majorTexts.length>0) {
      block += `Bei ${this.getConcatText(majorTexts)} erneut Notruf/Vorstellung NFA. \n`
    }
    if (!this.disableMinorBlock && minorTexts.length>0) {
      block += `Bei ${this.getConcatText(minorTexts)} Rücksprache Haus-/Facharzt. \n`
    }

    // create information text
    if (this.noTransportType == 'Verweigerung')
    {
      block += 'Transport nicht gewünscht. Auch nach Verdeutlichung mgl. Konsequenzen'
      const consequences = content.consequences
      if (consequences.length>0) {
        block += `, wie ${this.getConcatText(consequences)}`
      } else {
        block += ' (bleibende Schäden/Tod)'
      }
      block += ', weiterhin Transport/Behandlung verweigert. \n'
      block += 'Pat. einsichtsfähig (versteht Bedeutung/Tragweite/Risiken) & steuerungsfähig (kann eigenes Urteil bilden/umsetzen). \nEntscheidung eigenverantwortlich getroffen.'
    }
    else if (this.noTransportType == 'BvO')
    {
      if (this.attendant.isActive) { block += `${this.attendant.value} (Vormund/Betreuer) anwesend. \nA` }
      else { block += 'Pat. a' }
      block += 'ufgeklärt über mögliche Verschlechterungszeichen; entscheidungsfähig und einverstanden mit weiteren Vorgehen. \n'
    }

    return block

  }

}
