import { onNormal } from "@/utils/filter"
import { prefixAllergie } from "@/utils/prefix/sample"

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
      return prefixAllergie(`${this.description}, sonst keine Med.-Unverträglichkeiten.`)
    }
    else {
      return prefixAllergie(`${this.description}.`)
    }
  }

}