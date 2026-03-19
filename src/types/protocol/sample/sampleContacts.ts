
export class SampleContacts {

  public contacts: Array<SampleContactsItem>
  constructor()
  {
    this.contacts = []
  }
  public generateText(): string
  {

    const divider = this.contacts.length>1 ? ':' : ' -'

    const entries = this.contacts
      .map((contact) => {
        const name = contact.contactName?.trim()
        const telephone = contact.telephone?.trim()
        if (name && telephone) return `${name}${divider} ${telephone}`
        if (name) return name
        if (telephone) return telephone
        return ''
      })
      .filter((entry) => entry.length > 0)
    if (entries.length === 0) return ''

    if (entries.length>1) {
      return `Kontakte:\n- ${entries.join('\n- ')}`
    } else {
      return `Kontakt: ${entries[0]}.`
    }

  }
}

export class SampleContactsItem {

  public contactName: string = ''
  public telephone: string = ''

  constructor(data?: Partial<SampleContactsItem>) {
    Object.assign(this, data)
  }

}