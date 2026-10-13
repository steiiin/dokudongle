import { breakDoku, prefix } from "@/utils/text"
import { EnhanceableText } from "../input"

import { useDokuStore } from "@/store/doku"
function getCtx() { return useDokuStore().context }

// ############################################################################

export class AbcdeBleeding {

  public description: EnhanceableText

  // #####################################################################

  constructor()
  {
    this.description = new EnhanceableText()
  }

  // #####################################################################

  get hasCriticalBleeding(): boolean
  {
    return !this.description.isEmpty
  }

  public generateText(description = this.description.value): string
  {
    if (getCtx().isTrauma && description.trim().length > 0)
    {
      return breakDoku(prefix('x:', description))
    }
    return ''
  }

}