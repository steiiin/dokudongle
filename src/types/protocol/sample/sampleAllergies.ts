import { onNormal } from "@/utils/filter"

export class SampleAllergies {

  public level: '' | 'unknown' | 'minor' | 'major'
  public description: string

  constructor()
  {
    this.level = ''
    this.description = ''
  }

  public generateText(): string
  {
    if (this.level == 'unknown') {
      return onNormal(`Allergien unklar (keine Angaben).`)
    }
    else if (this.level == '') {
      return onNormal('Keine Allergien.')
    }
    else if (this.level == 'minor') {
      return `Allergie: ${this.description}, sonst keine Med.-Unverträglichkeiten.`
    }
    else {
      return `Allergie: ${this.description}.`
    }
  }

}