
import { SampleSymptomsTrauma } from "./sampleSymptomsTrauma"
import { EnhanceableText } from "../input"

export class SampleSymptoms {

  public trauma: SampleSymptomsTrauma
  public additionalSymptoms: EnhanceableText

  constructor()
  {
    this.trauma = new SampleSymptomsTrauma()
    this.additionalSymptoms = new EnhanceableText()
  }

}