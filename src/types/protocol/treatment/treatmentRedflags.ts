import { RedflagScenario, RedflagSignal, RedflagApplication, Scenarios, Signals } from "@/data/redflags"
import { OptionalValue } from "../input"

type WithArrayProp<T> = {
  [K in keyof T]: T[K] extends (infer U)[] | undefined ? K : never
}[keyof T]

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

  private getInterleavedEntries<T, K extends WithArrayProp<T>>(items: T[], key: K): T[K] extends (infer U)[] | undefined ? U[] : never {
    const result: unknown[] = []
    const seen = new Set<unknown>()
    const maxLength = Math.max(
      ...items.map(item => ((item[key] as unknown[] | undefined)?.length ?? 0))
    )
    for (let i = 0; i < maxLength; i++) {
      for (const item of items) {
        const arr = item[key] as unknown[] | undefined;
        const value = arr?.[i];

        if (value !== undefined && !seen.has(value)) {
          seen.add(value);
          result.push(value);
        }
      }
    }
    return result as any
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

    let block = ''
    const scenarios = this.dedupeById(this.choosenScenarios)
    const signals = this.dedupeById(this.choosenSignals)

    // create intro
    const diagnoses = this.getInterleavedEntries(scenarios, 'diagnoses')
    if (diagnoses.length > 0) {
      block += `Aufklärung bzgl. ${diagnoses.map((d) => d).join('; ')}. \n`
    }

    // create signals text
    const majorTexts: string[] = this.getInterleavedEntries(scenarios, 'majorSignals')
    const minorTexts: string[] = this.getInterleavedEntries(scenarios, 'minorSignals')
    const customSignals = signals.map(e => e.text)

    if (majorTexts.length>0 || customSignals.length>0) {
      block += `Bei ${this.getConcatText([ ...majorTexts, ...customSignals ])} erneut Notruf/Vorstellung NFA. \n`
    }
    if (minorTexts.length>0) {
      block += `Bei ${this.getConcatText(minorTexts)} Rücksprache Haus-/Facharzt. \n`
    }

    // create information text
    if (this.noTransportType == 'Verweigerung')
    {
      block += 'Transport nicht gewünscht. Auch nach Verdeutlichung mgl. Konsequenzen'
      const consequences = scenarios.map(e => e.consequences)
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
