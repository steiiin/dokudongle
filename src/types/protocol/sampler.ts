import { SampleSymptoms, SampleAllergies, SampleMedication, SamplePler, SampleContacts, SampleRepresentation } from "@/types/protocol/sample"

export class Sampler {

  public symptoms: SampleSymptoms
  public allergies: SampleAllergies
  public medication: SampleMedication
  public pler: SamplePler
  public contacts: SampleContacts
  public representation: SampleRepresentation

  constructor()
  {
    this.symptoms = new SampleSymptoms()
    this.allergies = new SampleAllergies()
    this.medication = new SampleMedication()
    this.pler = new SamplePler()
    this.contacts = new SampleContacts()
    this.representation = new SampleRepresentation()
  }

}
