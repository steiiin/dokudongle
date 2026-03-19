
import { useDokuStore } from "@/store/doku"
import { onNormal } from "@/utils/filter"
import { SampleSymptomsTrauma } from "./sampleSymptomsTrauma"
import { EnhanceableText } from "../input"
function getCtx() { return useDokuStore().context }

export class SampleSymptoms {

  public trauma: SampleSymptomsTrauma
  public additionalSymptoms: EnhanceableText

  constructor()
  {
    this.trauma = new SampleSymptomsTrauma()
    this.additionalSymptoms = new EnhanceableText()
  }

}