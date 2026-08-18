describe('German text assistance', () => {
  it('capitalizes a German compound after a delimiter', () => {
    cy.visit('/tabs/doku')
    cy.contains('ion-button', 'Situation').click()
    cy.get('textarea.dd-modal-textarea')
      .should('be.visible')
      .and('not.have.attr', 'readonly')
      .type('krankenhaus ')
      .should('have.value', 'Krankenhaus ')
  })
})

