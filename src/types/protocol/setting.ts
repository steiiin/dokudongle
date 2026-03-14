import { textIf } from "@/utils/filter"
import { capitalizeBegin, concatDoku, suffix } from "@/utils/text"

export class Setting {

  public mobility: string
  public location: string
  public helpers: string
  public isForcedEntry: boolean
  public isAlone: boolean

  // #####################################################################

  constructor()
  {
    this.mobility = ''
    this.location = ''
    this.helpers = ''
    this.isForcedEntry = false
    this.isAlone = false
  }

  // #####################################################################

  get isEmpty(): boolean {
    return this.mobility == ''
      && this.location == ''
      && this.helpers == ''
      && !this.isForcedEntry
      && !this.isAlone
  }

  // #####################################################################

  public generateText(): string
  {
    return capitalizeBegin(
      concatDoku([
        this.location,
        textIf('alleinlebend', this.isAlone),
        this.mobility,
        textIf('Notfalltüröffnung', this.isForcedEntry),
        suffix(this.helpers, 'vor Ort'),
      ])
    )
  }

}
