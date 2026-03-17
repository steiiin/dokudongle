import { SampleAllergies, SampleMedication, SamplePler, SampleContacts } from "@/types/protocol/sample"

export class Sampler {

  // public symptoms: sampleSymptoms
  public allergies: SampleAllergies
  public medication: SampleMedication
  public pler: SamplePler
  public contacts: SampleContacts

  constructor()
  {
    this.allergies = new SampleAllergies()
    this.medication = new SampleMedication()
    this.pler = new SamplePler()
    this.contacts = new SampleContacts()
  }

}
