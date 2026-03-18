import { SampleSymptoms, SampleAllergies, SampleMedication, SamplePler, SampleContacts } from "@/types/protocol/sample"

export class Sampler {

  public symptoms: SampleSymptoms
  public allergies: SampleAllergies
  public medication: SampleMedication
  public pler: SamplePler
  public contacts: SampleContacts

  constructor()
  {
    this.symptoms = new SampleSymptoms()
    this.allergies = new SampleAllergies()
    this.medication = new SampleMedication()
    this.pler = new SamplePler()
    this.contacts = new SampleContacts()
  }

}
