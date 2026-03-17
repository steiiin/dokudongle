
export class SampleContacts {

  public contacts: Array<SampleContactsItem>
  constructor()
  {
    this.contacts = []
  }
  public generateText(): string
  {
    const entries = this.contacts
      .map((contact) => {
        const name = contact.contactName?.trim()
        const telephone = contact.telephone?.trim()
        if (name && telephone) return `${name}: ${telephone}`
        if (name) return name
        if (telephone) return telephone
        return ''
      })
      .filter((entry) => entry.length > 0)

    if (entries.length === 0) return ''
    return `Kontakt${entries.length>1 ? 'e' : ''}:\n${entries.join('.\n')}`
  }
}

export class SampleContactsItem {

  public contactName: string = ''
  public telephone: string = ''

  constructor(data?: Partial<SampleContactsItem>) {
    Object.assign(this, data)
  }

}