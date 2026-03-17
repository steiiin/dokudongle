import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { EnhanceableText } from "../input"
import { onNormal, textIf } from "@/utils/filter"

export interface AirwayMucosa {
  m: 'feucht' | 'trocken'
  e: 'rosig' | 'blass' | 'gerötet' | 'bläulich'
}

export class AbcdeAirway {

  public isBreathing: boolean

  public mucosa: AirwayMucosa
  public obstruction: string

  public hasStridor: boolean
  public hasTongueBite: boolean

  public treatment: string

  // #####################################################################

  constructor()
  {
    this.isBreathing = true
    this.mucosa = { m: 'feucht', e: 'rosig' }
    this.obstruction = ''
    this.hasStridor = false
    this.hasTongueBite = false
    this.treatment = ''
  }

  // #####################################################################

  get needTreatment(): boolean {
    return !this.isBreathing
      || this.hasStridor
      || !this.noObstruction
  }

  // #####################################################################

  get noObstruction(): boolean { return this.obstruction == '' }

  get obstructionText(): string {
    return this.noObstruction
      ? 'Mundraum frei'
      : `Mundraum ${this.obstruction}`
  }

  ///////////////////////////////////////////////

  get mucosaText(): string {
    return `${this.mucosa.e}/${this.mucosa.m}`
  }

  // #####################################################################

  public generateText(): string
  {

    const assessedLine: string = breakDoku(prefix('A:',
      textIf('keine Atmung! ', !this.isBreathing) + capitalizeBegin(concatDoku([
      this.obstructionText,
      onNormal('SH ' + this.mucosaText),
      textIf('Stridor', this.hasStridor),
      this.hasTongueBite
        ? 'Zungenbiss'
        : onNormal('kein Zungenbiss')
    ]))))

    const treatmentLine: string = textIf(prefix('\n>> ', this.treatment), this.needTreatment)

    return breakDoku([ assessedLine, treatmentLine ])

  }

}