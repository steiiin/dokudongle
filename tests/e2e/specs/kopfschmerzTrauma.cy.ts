export {}

for (const width of [375, 1024]) {
  describe(`wound-localized headache at ${width}px`, () => {
    it('shares the yellow trauma chip with the SHT output and excludes other locations', () => {
      cy.viewport(width, 900)
      cy.visit('/tests/e2e/fixtures/examination.html?disability&shortcuts&trauma')
      cy.get('[data-block-source="kopfschmerz"]').scrollIntoView().click()
      cy.contains('ion-modal:visible ion-chip', 'Im Wundbereich').should('have.attr', 'color', 'warning')
      cy.get('#report').should('contain.text', 'Kopf: Kopfschmerzen - mgl. SHT.')
      cy.contains('ion-modal:visible ion-chip', 'Stirn').scrollIntoView().click()
      cy.contains('ion-modal:visible ion-chip', 'Im Wundbereich').click()
      cy.contains('ion-modal:visible ion-chip', 'Stirn').should('have.class', 'DdToggleChip--inactive')
      cy.get('#report').should('contain.text', 'Lokalisation: Im Wundbereich')
        .and('contain.text', 'Schmerzen nur im Wundbereich - SHT unwahrsch')
      cy.contains('ion-modal:visible ion-chip', 'gesamter Kopf').click()
      cy.contains('ion-modal:visible ion-chip', 'Im Wundbereich').should('have.class', 'DdToggleChip--inactive')
      cy.get('#report').should('contain.text', 'Kopf: Kopfschmerzen - mgl. SHT.')
        .and('not.contain.text', 'Wundbereich')
      cy.get('ion-modal:visible ion-button[title="Zurück"]').click()
      cy.contains('#original-block-forms ion-item', 'Kopfschmerzen').scrollIntoView().click()
      cy.contains('ion-modal:visible ion-chip', 'gesamter Kopf').should('have.class', 'DdToggleChip--bold')
      cy.contains('ion-modal:visible ion-chip', 'Im Wundbereich').click().click()
      cy.get('#report').should('contain.text', 'Kopf: Kopfschmerzen - mgl. SHT.')
        .and('not.contain.text', 'Wundbereich')

      cy.visit('/tests/e2e/fixtures/examination.html?disability&shortcuts')
      cy.get('[data-block-source="kopfschmerz"]').scrollIntoView().click()
      cy.contains('ion-modal:visible ion-chip', 'Im Wundbereich').should('not.exist')
    })
  })
}
