import { notEmpty, onNormal } from "@/utils/filter"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

export class SampleMedication {

  public level: '' | 'unknown' | 'minor' | 'major'
  public Flags: {
    oak: string,
    tah: string,
    insulin: boolean,
  }
  public isPlanAvailable: boolean
  public PlanMedication: Array<SampleMedicationItem>
  public MinormedDescription: string
  public TetanusStatus: '' | 'unklar' | 'nein' | 'ja'

  constructor()
  {
    this.level = ''
    this.Flags = { oak: '', tah: '', insulin: false}
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
      return onNormal(`Medikamenteneinnahme unklar (kein Plan/keine Angaben). ${tetanusSeg}`)
    }
    else if (this.level == 'minor') {
      return `${this.MinormedDescription}, sonst keine Dauermedikation. ${tetanusSeg}`
    }
    else if (this.level == 'major') {

      const flags: string[] = []
      const oakFlag = notEmpty(this.Flags.oak)
      const tahFlag = notEmpty(this.Flags.tah)

      if (oakFlag && tahFlag) { flags.push(`Nimmt ${this.Flags.oak}+${this.Flags.tah} ein.`) }
      else if (tahFlag && this.Flags.tah == 'TAH') { flags.push('Nimmt Aggregationshemmer (kein OAK) ein.') }
      else if (tahFlag) { flags.push(`Nimmt ${this.Flags.tah} ein.`) }
      else if (oakFlag) { flags.push(`Nimmt ${this.Flags.oak} ein.`) }
      else { flags.push('Keine Blutverdünner.') }

      if (this.Flags.insulin) { flags.push('Insulinpflichtig.')}
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
      return onNormal(`Keine Medikamenteneinnahme. ${tetanusSeg}`)
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