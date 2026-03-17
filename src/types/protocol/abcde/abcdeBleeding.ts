import { breakDoku, placeholder, prefix, unbreak } from "@/utils/text"

import { useDokuStore } from "@/store/doku"
import { EnhanceableText } from "../input"
function getCtx() { return useDokuStore().context }

export class AbcdeBleeding {

  public hasCriticalBleeding: boolean
  public bleeding: EnhanceableText
  public treatment: string

  // #####################################################################

  constructor()
  {
    this.hasCriticalBleeding = false
    this.bleeding = new EnhanceableText()
    this.treatment = ''
  }

  // #####################################################################

  public generateText(): string
  {
    if (!getCtx().isTrauma) { return '' }
    if (this.hasCriticalBleeding)
    {
      const description = placeholder(unbreak(this.bleeding.value), 'Blutungen')
      return breakDoku(prefix('x:', description))
    }
    else
    {
      return breakDoku(prefix('x:', 'Keine kritischen Blutungen.'))
    }
  }

}