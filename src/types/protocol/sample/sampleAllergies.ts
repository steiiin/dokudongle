import { onNormal } from "@/utils/filter"
import { prefixAllergie } from "@/utils/prefix/sample"

export class SampleAllergies {

  public level: 'n/a' | '' | 'unknown' | 'minor' | 'major'
  public description: string

  constructor()
  {
    this.level = ''
    this.description = ''
  }

  public generateText(): string
  {
    if (this.level == 'n/a') {
      return ''
    }
    else if (this.level == 'unknown') {
      return `Allergien unklar (keine Angaben).`
    }
    else if (this.level == '') {
      return 'Keine Allergien.'
    }
    else if (this.level == 'minor') {
      return prefixAllergie(`${this.description}, sonst keine Med.-Unverträglichkeiten.`)
    }
    else {
      return prefixAllergie(`${this.description}.`)
    }
  }

}