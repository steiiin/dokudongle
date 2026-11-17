export const representativeRoles = ['Sorgeberechtigt', 'Rechtl. Betreuer', 'Bevollmächtigter', 'Sonstige'] as const
export const representativeInvolvements = ['Anwesend', 'Telefonisch', 'Nicht Erreicht', 'Nicht Kontaktiert'] as const
export const therapyRestrictions = ['Keine Einschränkungen', 'Keine Reanimation', 'Keine Beatmung', 'Keine Klinikeinweisung', 'Andere'] as const

export type RepresentativeRole = '' | typeof representativeRoles[number]
export type RepresentativeInvolvement = typeof representativeInvolvements[number]
export type DirectiveStatus = 'Keine' | 'Vorhanden' | 'Keine Angabe'
export type TherapyRestriction = typeof therapyRestrictions[number]

export interface RepresentativeDetails {
  role: RepresentativeRole
  name: string
  involvement: RepresentativeInvolvement
}

export interface AdvanceDirectiveDetails {
  status: DirectiveStatus
  restrictions: TherapyRestriction[]
  otherRestriction: string
}

export interface RepresentationContext {
  addressee: string
  contactStatus: string
}

const emptyRepresentative = (): RepresentativeDetails => ({ role: '', name: '', involvement: 'Anwesend' })
const emptyDirective = (): AdvanceDirectiveDetails => ({ status: 'Keine Angabe', restrictions: [], otherRestriction: '' })

export class SampleRepresentation {
  public representative = emptyRepresentative()
  public advanceDirective = emptyDirective()

  public setRepresentativeRole(role: RepresentativeRole): void {
    if (!role) this.representative = emptyRepresentative()
    else this.representative.role = role
  }

  public setDirectiveStatus(status: DirectiveStatus): void {
    this.advanceDirective.status = status
    if (status !== 'Vorhanden') {
      this.advanceDirective.restrictions = []
      this.advanceDirective.otherRestriction = ''
    }
  }

  public setRestrictions(values: readonly TherapyRestriction[]): void {
    const unrestricted = values.includes('Keine Einschränkungen')
    this.advanceDirective.restrictions = therapyRestrictions.filter(value =>
      values.includes(value) && (!unrestricted || value === 'Keine Einschränkungen' || value === 'Andere'))
    if (!this.advanceDirective.restrictions.includes('Andere')) {
      this.advanceDirective.otherRestriction = ''
    }
  }

  get representativeSummary(): string {
    if (!this.representative.role) return 'Nein'
    const { role, name, involvement } = this.representative
    return [role, name.trim(), involvement].filter(Boolean).join(' · ')
  }

  get explanationContext(): RepresentationContext {
    const empty = { addressee: '', contactStatus: '' }
    const { role, name, involvement } = this.representative
    if (!name.trim() || !role || role === 'Sonstige' || !involvement) return empty
    const person = `${name.trim()} (${role})`
    if (involvement === 'Anwesend' || involvement === 'Telefonisch') {
      return { addressee: `${person}, ${involvement.toLowerCase()}`, contactStatus: '' }
    }
    return { addressee: '', contactStatus: `Vertreter ${person} ${involvement.toLowerCase()}.` }
  }

  public generateText(): string {
    const lines: string[] = []
    const { role, name, involvement } = this.representative
    if (role) {
      const roleText = role === 'Sorgeberechtigt' ? 'Sorgeberechtigter' : role === 'Sonstige' ? 'Sonstige Vertretung' : role
      const involvementText: Record<RepresentativeInvolvement, string> = {
        Anwesend: 'anwesend',
        Telefonisch: 'tel. informiert',
        'Nicht Erreicht': 'nicht erreicht',
        'Nicht Kontaktiert': 'nicht kontaktiert',
      }
      lines.push(`${roleText}${name.trim() ? ` (${name.trim()})` : ''} ${involvementText[involvement]}.`)
    }
    const { status, restrictions, otherRestriction } = this.advanceDirective
    if (status === 'Keine') {
      lines.push('Keine Patientenverfügung.')
    } else if (status === 'Vorhanden') {
      const unrestricted = restrictions.includes('Keine Einschränkungen')
      const descriptions = restrictions
        .filter(value => !unrestricted || value === 'Keine Einschränkungen' || value === 'Andere')
        .map(value => {
          if (value === 'Keine Einschränkungen') return 'keine Therapiebeschränkungen'
          if (value === 'Andere') return otherRestriction.trim() ? `andere: ${otherRestriction.trim()}` : 'andere'
          return value.charAt(0).toLowerCase() + value.slice(1)
        })
      lines.push(`Patientenverfügung vorhanden${descriptions.length ? `, ${descriptions.join('; ')}` : ''}.`)
    }
    return lines.join('\n')
  }
}
