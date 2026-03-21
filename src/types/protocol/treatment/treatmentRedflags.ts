import { RedflagScenario, RedflagSignal, Scenarios } from "@/data/redflags"
import { OptionalValue } from "../input"

export class TreatmentRedflags {

  public noTransportType: '' | 'BvO' | 'Verweigerung'

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

    this.availableScenarios = Scenarios
    this.availableSignals = {}

    this.attendant = OptionalValue.inactive('')

    this.consent = ''
  }

  // ##########################################################################

  private availableScenarios: Record<string, RedflagScenario>
  private availableSignals: Record<string, RedflagSignal>

  // ##########################################################################

  private fetchAvailableScenarios(): Array<RedflagScenario>
  {
    return []
  }

  // private fetchAllRedFlagsx(): Array<RedFlag> {

  //   // 1. collect all ids referenced in diagnoses
  //   const diagnoseFlagIds = this.RedDiagnoses.flatMap(d => d.RedFlagIds)

  //   // 2. collect all ids referenced in cases (cases -> diagnoses -> flags)
  //   const caseFlagIds = this.RedCases
  //     .flatMap(c => c.DiagnoseIds)
  //     .flatMap(dId => {
  //       const diag = this.allRedDiagnoses.find(d => d.id === dId)
  //       return diag ? diag.RedFlagIds : []
  //     })

  //   // 3. merge ids
  //   const allIds = new Set([
  //     ...this.RedFlags.map(f => f.id),
  //     ...diagnoseFlagIds,
  //     ...caseFlagIds,
  //   ])

  //   // 4. return actual RedFlag objects for all unique ids
  //   return Array.from(allIds)
  //     .map(id => this.allRedFlags.find(f => f.id === id))
  //     .filter((f): f is RedFlag => !!f)
  // }

  // private fetchAllRedDiagnosesx(): Array<RedDiagnose> {
  //   const casesDiagnosesIds = this.RedCases.flatMap(e => e.DiagnoseIds)
  //   const diagnosesIds = this.RedDiagnoses.map(e => e.id)
  //   return Array.from([ ...casesDiagnosesIds, ...diagnosesIds ])
  //     .map(id => this.allRedDiagnoses.find(f => f.id === id))
  //     .filter((f): f is RedDiagnose => !!f)
  // }

  // ##########################################################################

  // private dedupeRedFlags(flags: RedFlag[]): RedFlag[] {
  //   const map = new Map<string, RedFlag>()

  //   for (const f of flags) {
  //     const key = f.DedupeKey ?? f.id
  //     const existing = map.get(key)

  //     if (!existing || (f.Priority ?? 0) > (existing.Priority ?? 0)) {
  //       map.set(key, f)
  //     }
  //   }

  //   // Optional: doppelte Descriptions zusätzlich entfernen (falls zwei Flags gleichen Text haben)
  //   const byDesc = new Map<string, RedFlag>()
  //   for (const f of map.values()) {
  //     byDesc.set((f.Description ?? '').trim(), f)
  //   }

  //   return Array.from(byDesc.values())
  // }

  // private createRedFlagsText(redflags: Array<RedFlag>): string {
  //   const emergency = redflags.filter(e => e.IsEmergency).map(e => e.Description!)
  //   const noEmergency = redflags.filter(e => !e.IsEmergency).map(e => e.Description!)

  //   let text = ''
  //   if (emergency.length>0) {
  //     text += `Bei ${this.joinWithOder(emergency)} Vorstellung NFA/RD. \n`
  //   }
  //   if (noEmergency.length>0) {
  //     text += `Bei ${this.joinWithOder(noEmergency)} Rücksprache HA/KV. \n`
  //   }
  //   return text
  // }

  // private joinWithOder(items: string[], breakEach: boolean = false): string {
  //   if (items.length === 0) return ''
  //   if (items.length === 1) return items[0]
  //   const allButLast = items.slice(0, -1).join(breakEach ? ', \n' : ', ')
  //   return `${allButLast} oder ${breakEach ? '\n' : ''}${items[items.length - 1]}`
  // }

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
    // const allFlags = this.dedupeRedFlags(this.fetchAllRedFlags())
    //   .sort((a, b) =>
    //     (a.IsEmergency === b.IsEmergency ? 0 : a.IsEmergency ? -1 : 1) ||
    //     a.Group.Name.localeCompare(b.Group.Name) ||
    //     a.Name.localeCompare(b.Name))

    // // diagnosises
    // const diagnoses = this.fetchAllRedDiagnoses()
    // if (diagnoses.length>0 && this.NoTransportType == 'Verweigerung') {
    //   block += `Aufklärung bzgl. ${diagnoses.map(e => e.Name).join('/')}. \n`
    // }
    // else if (allFlags.length>0) {
    //   block += `Aufklärung bzgl. RedFlags: \n`
    // }

    // flags
    // if (allFlags.length>0) {
    //   block += this.createRedFlagsText(allFlags)
    // }

    // // type: denial
    // if (this.NoTransportType == 'Verweigerung') {

    //   block += '\n'
    //   block += 'Transport nicht gewünscht. Auch nach Verdeutlichung mgl. Konsequenzen'
    //   const consequences = this.RedCases.filter(e => e.Consequences != '').map(e => e.Consequences)
    //   if (consequences.length == 1)
    //   {
    //     block += `, wie ${consequences[0]}`
    //   }
    //   else if (consequences.length>0)
    //   {
    //     block += ', wie '
    //     block += this.joinWithOder(consequences, true)
    //   }
    //   else
    //   {
    //     block += ' (bleibende Schäden/Tod)'
    //   }
    //   block += ', weiterhin Transport/Behandlung verweigert. \n'

    // }

    // // competent to make decisions
    // if (this.NoTransportType == 'BvO') {
    //   block += this.attendant.active
    //     ? `${this.attendant.value} (Vormund/Betreuer) anwesend. \nA`
    //     : 'Pat. a'
    //   block += 'ufgeklärt über mögliche Verschlechterungszeichen; entscheidungsfähig und einverstanden mit weiteren Vorgehen. \n'
    // }
    // else if (this.NoTransportType == 'Verweigerung') {
    //   block += 'Pat. einsichtsfähig (versteht Bedeutung/Tragweite/Risiken) & steuerungsfähig (kann eigenes Urteil bilden/umsetzen). \nEntscheidung eigenverantwortlich getroffen.'
    // }

    return block

  }

}
