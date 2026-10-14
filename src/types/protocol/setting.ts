import { textIf } from "@/utils/filter"
import { capitalizeBegin, concatDoku, suffix } from "@/utils/text"

export class Setting {

  public mobility: string
  public location: string
  public helpers: string[]
  public isForcedEntry: boolean
  public isAlone: boolean

  // #####################################################################

  constructor()
  {
    this.mobility = ''
    this.location = ''
    this.helpers = []
    this.isForcedEntry = false
    this.isAlone = false
  }

  // #####################################################################

  get isEmpty(): boolean {
    return this.mobility == ''
      && this.location == ''
      && this.helpers.length == 0
      && !this.isForcedEntry
      && !this.isAlone
  }

  // #####################################################################

  public generateText(): string
  {
    const helpers = this.helpers.map(e => e === 'nursing'
      ? (this.location === 'Pflegeheim' ? 'Pflegepersonal' : 'Pflegedienst')
      : e).join('+')

    return capitalizeBegin(
      concatDoku([
        this.location,
        textIf('alleinlebend', this.isAlone),
        this.mobility,
        textIf('Notfalltüröffnung', this.isForcedEntry),
        suffix(helpers, 'vor Ort'),
      ])
    )
  }

}
