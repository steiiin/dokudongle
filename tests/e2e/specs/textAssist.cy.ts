const openSituation = () => {
  // Native scrolling reaches Ionic's shadow-root scroll container.
  cy.contains('ion-button', 'Situation')
    .then(($button) => { $button[0].scrollIntoView({ block: 'center' }) })
    .click({ scrollBehavior: false })
}

describe('German text assistance', () => {
  it('capitalizes a German compound after a delimiter', () => {
    cy.visit('/tabs/doku')
    openSituation()
    cy.get('textarea.dd-modal-textarea')
      .should('be.visible')
      .and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) })
      .type('krankenhaus ')
      .should('have.value', 'Krankenhaus ')
  })

  it('expands a shortcut and restores it with immediate Backspace', () => {
    cy.visit('/tabs/doku')
    openSituation()
    cy.get('textarea.dd-modal-textarea')
      .should('be.visible')
      .and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) })
      .type('lt ')
      .should('have.value', 'laut ')
      .type('{backspace}')
      .should('have.value', 'lt')
  })
})


describe('Bounded multiline editor', () => {
  // Cypress .type changes textarea values synthetically and does not perform
  // native caret scrolling. Use the browser's editing path for this regression.
  const insertNativeText = (text: string) => cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.insertText',
    params: { text },
  }))
  const editor = () => cy.get<HTMLTextAreaElement>('textarea.dd-modal-textarea')
  const assertBottomVisible = () => {
    editor().should(($textarea) => {
      const textarea = $textarea[0]
      expect(textarea.scrollHeight).to.be.greaterThan(textarea.clientHeight)
      const bottomPadding = parseFloat(textarea.ownerDocument.defaultView!.getComputedStyle(textarea).paddingBottom)
      expect(textarea.scrollHeight - textarea.clientHeight - textarea.scrollTop).to.be.at.most(bottomPadding + 1)
      const footer = textarea.closest('ion-modal')!.querySelector('ion-footer')!
      expect(textarea.getBoundingClientRect().bottom).to.be.at.most(footer.getBoundingClientRect().top)
    })
    cy.get('ion-content.dd-modal-content').shadow().find('[part="scroll"]').should(($scroll) => {
      expect($scroll[0].scrollTop).to.eq(0)
    })
  }

  it('keeps long text and its underline visible through typing, resizing, and suggestions', () => {
    cy.viewport(375, 812)
    cy.visit('/tabs/doku')
    openSituation()
    editor().should('be.visible').and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) })
    cy.get('.dd-modal-help-toggle').should('have.attr', 'aria-expanded', 'true')
    editor().type('12345{enter}'.repeat(40), { delay: 0 })
    cy.get('.dd-modal-header-toolbar .dd-modal-help-toggle').shadow().find('button').should('have.attr', 'aria-expanded', 'false')
    cy.get('.dd-modal-help').should('not.be.visible')
    assertBottomVisible()
    editor().then(($textarea) => {
      const height = $textarea[0].getBoundingClientRect().height
      insertNativeText('67890\n'.repeat(5))
      editor().should(($updated) => {
        expect($updated[0].getBoundingClientRect().height).to.eq(height)
        expect($updated[0].style.height).to.eq('')
      })
    })
    assertBottomVisible()

    cy.viewport(375, 480)
    assertBottomVisible()
    insertNativeText('@uni')
    cy.contains('.dd-suggestion', 'Uniklinik Dresden').should('be.visible')
    cy.get('.dd-active-word').should(($word) => {
      const textarea = $word[0].closest('.dd-modal-textarea-wrap')!.querySelector('textarea')!
      const bounds = $word[0].getBoundingClientRect()
      expect(bounds.top).to.be.at.least(textarea.getBoundingClientRect().top)
      expect(bounds.bottom).to.be.at.most(textarea.getBoundingClientRect().bottom)
      const mirror = $word[0].parentElement!
      expect(mirror.scrollTop).to.eq(textarea.scrollTop)
      expect(mirror.clientWidth).to.eq(textarea.clientWidth)
    })
    cy.contains('.dd-suggestion', 'Uniklinik Dresden').click()
    editor().should('have.value', '12345\n'.repeat(40) + '67890\n'.repeat(5) + 'Uniklinik Dresden')
    assertBottomVisible()
    editor().type('{enter}lt ', { delay: 30 }).should(($textarea) => {
      expect($textarea.val()).to.match(/\nlaut $/)
    })
    assertBottomVisible()
    editor().type('{backspace}').should(($textarea) => {
      expect($textarea.val()).to.match(/\nlt$/)
    })
    assertBottomVisible()

    cy.get('.dd-modal-header-toolbar .dd-modal-help-toggle').click()
    cy.get('.dd-modal-help .dd-modal-help-toggle').should('have.attr', 'aria-expanded', 'true')
    insertNativeText('\n12345')
    cy.get('.dd-modal-help-toggle').should('have.attr', 'aria-expanded', 'true')
    assertBottomVisible()
    editor().then(($textarea) => {
      const expandedHeight = $textarea[0].clientHeight
      cy.get('.dd-modal-help-collapse').click()
      cy.get('.dd-modal-header-toolbar .dd-modal-help-toggle').shadow().find('button').should('have.attr', 'aria-label', 'Hinweise anzeigen')
      cy.get('.dd-modal-help').should('not.be.visible')
      editor().should(($updated) => { expect($updated[0].clientHeight).to.be.greaterThan(expandedHeight) })
    })
    cy.viewport(812, 375)
    assertBottomVisible()
    cy.viewport(375, 812)
    assertBottomVisible()
  })

  it('collapses expanded help when the viewport shrinks and checks saved text on reopening', () => {
    cy.viewport(375, 812)
    cy.visit('/tabs/doku')
    openSituation()
    editor().should('be.visible').and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) })
      .type('12345{enter}'.repeat(10), { delay: 0 })
    cy.get('.dd-modal-help-toggle').should('have.attr', 'aria-expanded', 'true')
    cy.viewport(375, 360)
    cy.get('.dd-modal-header-toolbar .dd-modal-help-toggle').shadow().find('button').should('have.attr', 'aria-expanded', 'false')
    cy.get('.dd-modal-help').should('not.be.visible')
    assertBottomVisible()
    cy.contains('ion-modal ion-button', 'Speichern').click()
    cy.get('textarea.dd-modal-textarea').should('not.exist')
    openSituation()
    editor().should('be.visible')
    cy.get('.dd-modal-header-toolbar .dd-modal-help-toggle').shadow().find('button').should('have.attr', 'aria-expanded', 'false')
  })
})


describe('Dictionary quick-add', () => {
  it('saves a selected phrase and completes it after reloading', () => {
    const phrase = 'Patient ist beschwerdefrei'
    const editor = () => cy.get<HTMLTextAreaElement>('textarea.dd-modal-textarea')
    cy.visit('/tabs/doku')
    openSituation()
    editor().should('be.visible').and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) }).clear().type(phrase)
    editor().then(($textarea) => {
      $textarea[0].setSelectionRange(0, phrase.length)
      $textarea[0].dispatchEvent(new Event('select', { bubbles: true }))
    })
    cy.get('ion-button[aria-label="Auswahl zum Wörterbuch hinzufügen"]').click()
    cy.get('ion-toast').shadow().should('contain.text', 'Zum Wörterbuch hinzugefügt.')
    editor().should('have.value', phrase).and('be.focused').and(($textarea) => {
      expect($textarea[0].selectionStart).to.eq(0)
      expect($textarea[0].selectionEnd).to.eq(phrase.length)
    })
    cy.get('ion-modal.dd-dictionary-modal').should('not.be.visible')
    cy.contains('ion-modal ion-button', 'Speichern').click()
    cy.reload()
    openSituation()
    editor().should('be.visible').and(($textarea) => { expect($textarea[0].hasAttribute('readonly')).to.eq(false) }).clear().type('Patient ist')
    cy.contains('.dd-suggestion', phrase).click()
    editor().should('have.value', phrase)
    editor().type('{selectall}')
    cy.get('ion-button[aria-label="Auswahl zum Wörterbuch hinzufügen"]').click()
    cy.get('ion-toast').shadow().should('contain.text', 'Bereits im Wörterbuch vorhanden.')
  })
})
