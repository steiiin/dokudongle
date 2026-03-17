describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('IonContent', 'Tab 1 page')
  })
})
