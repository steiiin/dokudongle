
import { useDokuStore } from "@/store/doku"
import { onNormal } from "@/utils/filter"
import { SampleSymptomsTrauma } from "./sampleSymptomsTrauma"
function getCtx() { return useDokuStore().context }

export class SampleSymptoms {

  public trauma: SampleSymptomsTrauma

  constructor()
  {
    this.trauma = new SampleSymptomsTrauma()
  }

  public generateText(): string
  {
    return ''
  }

}