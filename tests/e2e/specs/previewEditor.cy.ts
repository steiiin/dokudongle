export {}

describe('editable preview', () => {
  beforeEach(() => {
    cy.viewport(390, 844)
    cy.visit('/tests/e2e/fixtures/previewEditor.html')
  })

  it('merges form changes, exposes tappable highlights, and restores the user version', () => {
    cy.get('textarea').should('have.value', 'Patient müde, ruhig.' + '\nWeitere Angaben bleiben unverändert.'.repeat(40))
    cy.get('#generate').click()
    cy.get('textarea').invoke('val').should('match', /^Patient schläfrig, unruhig\./)
    cy.screenshot('editable-preview-conflict-mobile')
    cy.get('[data-conflict-id]').should('have.length', 1).click()
    cy.contains('ion-popover ion-button', 'Eigenen Text verwenden').click()
    cy.get('[data-conflict-id]').should('not.exist')
    cy.get('textarea').invoke('val').should('match', /^Patient müde, unruhig\./)
  })

  it('preserves typing, selection, scrolling, and highlight alignment', () => {
    cy.get('textarea').type('{moveToStart}Heute: ')
    cy.get('#generate').click()
    cy.get('textarea').invoke('val').should('match', /^Heute: Patient schläfrig, unruhig\./)
    cy.get('textarea').then($input => {
      const input = $input[0] as HTMLTextAreaElement
      const mirror = input.parentElement!.querySelector('.text-mirror') as HTMLElement
      const style = getComputedStyle(input)
      expect(getComputedStyle(mirror).font).to.equal(style.font)
      expect(mirror.clientWidth).to.equal(input.clientWidth)
      expect(getComputedStyle(mirror).padding).to.equal(style.padding)
      input.setSelectionRange(7, 14)
      expect(input.value.slice(input.selectionStart, input.selectionEnd)).to.equal('Patient')
    })
    cy.get('textarea').scrollTo('bottom')
    cy.get('textarea').should($input => {
      const input = $input[0] as HTMLTextAreaElement
      expect(input.scrollTop).to.be.greaterThan(0)
      expect(input.parentElement!.querySelector('.text-mirror')!.scrollTop).to.equal(input.scrollTop)
    })
    cy.get('textarea').scrollTo('top')
    cy.get('[data-conflict-id]').focus().trigger('keydown', { key: 'Enter' })
    cy.contains('ion-popover ion-button', 'Generierten Text verwenden').click()
    cy.get('[data-conflict-id]').should('not.exist')
    cy.get('textarea').invoke('val').should('match', /^Heute: Patient schläfrig, unruhig\./)
  })

  it('shows a selectable deletion marker without inserting it in the text', () => {
    cy.get('#delete').click()
    cy.get('.deletion').should('exist').focus().trigger('keydown', { key: 'Enter' })
    cy.contains('ion-popover ion-button', 'Eigenen Text verwenden').click()
    cy.get('textarea').invoke('val').should('match', /^Patient müde, unruhig\./)
  })

  it('accepts multiline plain text and IME composition', () => {
    cy.get('textarea').clear().type('Erste Zeile{enter}<b>Nur Text</b>')
    cy.get('.text-mirror b').should('not.exist')
    cy.get('textarea').trigger('compositionstart').then($input => {
      ($input[0] as HTMLTextAreaElement).value += ' ä'
    }).trigger('input', { isComposing: true }).trigger('compositionend')
    cy.get('textarea').should('have.value', 'Erste Zeile\n<b>Nur Text</b> ä')
  })
})

describe('preview in the application', () => {
  it('preserves direct edits across tab changes, form updates and reload', () => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', {
      command: 'Storage.clearDataForOrigin',
      params: { origin: new URL(Cypress.config('baseUrl')!).origin, storageTypes: 'all' },
    }))
    cy.viewport(390, 844)
    cy.visit('/tabs/doku')
    cy.contains('ion-chip', 'Verlegung').then($element => $element[0].scrollIntoView({ block: 'center' }))
      .click({ scrollBehavior: false })
    for (const [label, value] of [['Start', 'Radebeul'], ['Ziel', 'Dresden']]) {
      cy.get('ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === label)
        .find('input').should($input => expect($input[0].hasAttribute('readonly')).to.equal(false))
        .then($input => $input[0].scrollIntoView({ block: 'center' }))
        .type(value, { scrollBehavior: false })
    }
    cy.contains('ion-tab-button', 'Vorschau').click()
    cy.get('textarea:visible').should('contain.value', 'Radebeul').and('contain.value', 'Dresden').then($input => {
      const textarea = $input[0] as HTMLTextAreaElement
      textarea.value = textarea.value.replace('Dresden', 'Coswig')
    }).trigger('input')
    cy.contains('ion-tab-button', 'Eingabe').click()
    cy.get('ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === 'Start')
      .find('input').then($input => $input[0].scrollIntoView({ block: 'center' }))
      .type('{moveToEnd} Nord', { scrollBehavior: false })
    cy.contains('ion-tab-button', 'Vorschau').click()
    cy.get('textarea:visible').should('contain.value', 'Radebeul Nord').and('contain.value', 'Coswig')
      .and('not.contain.value', 'Dresden')
    // The app persists after its existing three-second idle debounce.
    cy.wait(3200)
    cy.reload()
    cy.get('textarea:visible').should('contain.value', 'Radebeul Nord').and('contain.value', 'Coswig')
      .and('not.contain.value', 'Dresden')
  })
})
