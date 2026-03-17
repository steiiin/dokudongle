
import { useDokuStore } from "@/store/doku"
import { onNormal } from "@/utils/filter"
function getCtx() { return useDokuStore().context }

export class SampleMedication {

  public level: '' | 'unknown' | 'minor' | 'major'
  public Flags: Array<'OAK'|'TAH'|'Insulin'>
  public isPlanAvailable: boolean
  public PlanMedication: Array<SampleMedicationItem>
  public MinormedDescription: string
  public TetanusStatus: '' | 'unklar' | 'nein' | 'ja'

  constructor()
  {
    this.level = ''
    this.Flags = []
    this.isPlanAvailable = false
    this.PlanMedication = []
    this.MinormedDescription = ''
    this.TetanusStatus = ''
  }

  public generateText(): string
  {

    let tetanusSeg = ''
    if (getCtx().isTrauma) {
      if (this.TetanusStatus == 'unklar') { tetanusSeg = 'Tetanus unklar.' }
      else if (this.TetanusStatus == 'ja') { tetanusSeg = 'Tetanus iO.' }
      else if (this.TetanusStatus == 'nein') { tetanusSeg = 'Tetanusschutz veraltet.' }
    }

    if (this.level == 'unknown') {
      return onNormal(`Medikamenteneinnahme unklar (kein Plan/keine Angaben). ${tetanusSeg} \n`)
    }
    else if (this.level == 'minor') {
      return `${this.MinormedDescription}, sonst keine Dauermedikation. ${tetanusSeg} \n`
    }
    else if (this.level == 'major') {

      const flags: string[] = []
      if (this.Flags.includes('OAK') && this.Flags.includes('TAH')) { flags.push('Nimmt OAK+TAH ein.') }
      else if (this.Flags.includes('OAK') && !this.Flags.includes('TAH')) { flags.push('Nimmt OAK ein.') }
      else if (this.Flags.includes('TAH') && !this.Flags.includes('OAK')) { flags.push('Nimmt Aggregationshemmer ein.') }
      else { flags.push(onNormal('Keine Blutverdünner.')) }
      if (this.Flags.includes('Insulin')) { flags.push('Insulinpflichtig.')}
      const flagsText = flags.filter(e=>e).join(' ')

      const planMedicationtext = (this.isPlanAvailable
        ? `MedPlan vorhanden. ${tetanusSeg} ${flagsText}`
        : `Dauermedikation: ${tetanusSeg} ${flagsText} \n` + (this.PlanMedication.length>0
          ? this.PlanMedication.map(e => e.getProtocolLabel).join('\n')
          : '[DAUERMED]')
        )

      return planMedicationtext + '\n'

    }
    else {
      return onNormal(`Keine Medikamenteneinnahme. ${tetanusSeg} \n`)
    }

  }

}

export class SampleMedicationItem {

  public isFuzzy: boolean = false
  public Name: string = ''
  public isRegularly: boolean = true
  public Times: Array<'morgens' | 'mittags' | 'abends' | 'nachts'> = []
  public TimesCustom: string = ''

  constructor(data?: Partial<SampleMedicationItem>) {
    Object.assign(this, data)
  }

  get getTimesLabel(): string {
    if (this.isRegularly)
    {
      return this.Times.join(', ')
    }
    else
    {
      return this.TimesCustom
    }
  }

  get getProtocolLabel(): string {
    if (this.isFuzzy) { return `- ${this.Name}` }
    return `- ${this.Name}; ${this.getTimesLabel}`
  }

}