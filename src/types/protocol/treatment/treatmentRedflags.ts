import { RedflagScenario, RedflagSignal, RedflagApplication, Scenarios, Signals } from "@/data/redflags"
import { OptionalValue } from "../input"

export class TreatmentRedflags {

  public noTransportType: '' | RedflagApplication

  public choosenScenarios: Array<RedflagScenario>
  public choosenSignals: Array<RedflagSignal>

  public attendant: OptionalValue<string>

  public consent: '' | 'Fähig' | 'Unfähig' | 'Zeitkritisch'

  // ##########################################################################

  constructor()
  {
    this.noTransportType = ''
    this.choosenScenarios = []
    this.choosenSignals = []
    this.attendant = OptionalValue.inactive('')

    this.consent = ''
  }

  // ##########################################################################

  private dedupeById<T extends { id: string }>(list: T[]): T[] {
    return Array.from(new Map(list.map((entry) => [entry.id, entry])).values())
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

    let block = ''
    const scenarios = this.dedupeById(this.choosenScenarios)
    const signals = this.dedupeById(this.choosenSignals)

    if (scenarios.length > 0) {
      block += `Aufklärung bzgl. ${scenarios.map((s) => s.name).join('/')}. \n`
    }

    const signalMap = new Map(signals.map((signal) => [signal.id, signal]))
    const emergencyTexts: string[] = []
    const nonEmergencyTexts: string[] = []
    scenarios.forEach((scenario) => {
      const majorMatches = scenario.majorSignals
        .map((id) => signalMap.get(id)?.text)
        .filter((text): text is string => !!text)
      const minorMatches = scenario.minorSignals
        .map((id) => signalMap.get(id)?.text)
        .filter((text): text is string => !!text)

      emergencyTexts.push(...majorMatches)
      if (minorMatches.length >= 2) {
        nonEmergencyTexts.push(...minorMatches)
      }
    })

    if (emergencyTexts.length > 0) {
      block += `Bei ${emergencyTexts.join(', ')} Vorstellung NFA/RD. \n`
    }
    if (nonEmergencyTexts.length > 0) {
      block += `Bei ${nonEmergencyTexts.join(', ')} Rücksprache HA/KV. \n`
    }

    return block

  }

}
