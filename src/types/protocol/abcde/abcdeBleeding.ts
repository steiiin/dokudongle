import { breakDoku, placeholder, prefix, unbreak } from "@/utils/text"

import { useDokuStore } from "@/store/doku"
import { EnhanceableText } from "../input"
function getCtx() { return useDokuStore().context }

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

  public generateText(): string
  {
    if (getCtx().isTrauma && this.hasCriticalBleeding)
    {
      return breakDoku(prefix('x:', this.description.value))
    }
    return ''
  }

}