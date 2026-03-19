import { EnhanceableText } from "../input";

export class SamplePler {

  public PLER: EnhanceableText
  constructor()
  {
    this.PLER = new EnhanceableText('')
  }
  public generateText(): string {
    return `${this.PLER.value}`
  }
}