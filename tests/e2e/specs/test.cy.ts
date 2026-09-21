describe('Tab navigation', () => {
  it('opens Eingabe by default and exposes settings as the first tab', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/tabs/doku')
    cy.contains('ion-title', 'Eingabe').should('be.visible')
    cy.get('ion-tab-button').first().should('contain.text', 'Einstellungen').click()
    cy.location('pathname').should('eq', '/tabs/settings')
    cy.contains('ion-title', 'Einstellungen').should('be.visible')
    cy.contains('ion-toolbar:visible ion-button', 'Verbinden').should('be.visible')
    cy.contains('ion-card-title', 'Dongle').should('not.exist')
    cy.contains('Dongle suchen').should('not.exist')
  })

  it('redirects the tabs root to Eingabe and the old connection URL to settings', () => {
    cy.visit('/tabs/')
    cy.location('pathname').should('eq', '/tabs/doku')
    cy.visit('/tabs/connect')
    cy.location('pathname').should('eq', '/tabs/settings')
    cy.contains('ion-title', 'Einstellungen').should('be.visible')
  })
})
