import { breakDoku, capitalizeBegin, concatDoku, prefix } from "@/utils/text"
import { assessedText, onNormal, textIf } from "@/utils/filter"
import { AssessedValue } from "../input"

// ############################################################################

export interface AirwayMucosa {
  m: 'feucht' | 'trocken'
  e: 'rosig' | 'blass' | 'gerötet' | 'bläulich'
}

// ############################################################################

export class AbcdeAirway {

  public isBreathing: boolean

  public mucosa: AirwayMucosa
  public obstruction: string

  public hasTongueBite: boolean
  public stridor: AssessedValue<boolean>
  public trachealDeviation: AssessedValue<boolean>

  // #####################################################################

  constructor()
  {
    this.isBreathing = true
    this.mucosa = { m: 'feucht', e: 'rosig' }
    this.obstruction = ''
    this.stridor = AssessedValue.unassessed(false)
    this.trachealDeviation = AssessedValue.unassessed(false)
    this.hasTongueBite = false
  }

  // #####################################################################

  get needTreatment(): boolean {
    return !this.isBreathing
      || this.stridor.matches(true)
      || this.trachealDeviation.matches(true)
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
      textIf(
        this.stridor.value ? 'Stridor' : 'kein Stridor',
        this.stridor.isAssessed
      ),
      assessedText(this.trachealDeviation, 'Trachea verschoben', 'keine Trachealverschiebung'),
      this.hasTongueBite
        ? 'Zungenbiss'
        : onNormal('kein Zungenbiss')
    ]))))

    return assessedLine

  }

}