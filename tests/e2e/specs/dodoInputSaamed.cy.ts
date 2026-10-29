export {}

const chips = () => cy.get('ion-modal:visible .dodo-saamed-dosage-chips ion-chip')

describe('Grouped dosage chips', () => {
  for (const dark of [false, true]) {
    it(`shows stable group colors and hides alternatives in ${dark ? 'dark' : 'light'} mode`, () => {
      cy.viewport(390, 844)
      cy.visit(`/tests/e2e/fixtures/dodoInputSaamed.html${dark ? '?dark' : ''}`)
      cy.contains('ion-item', 'Anaphylaxie').click()
      chips().should('have.length', 5)
      chips().should(elements => {
        const colors = [...elements].map(element => getComputedStyle(element).color)
        expect(colors[0]).to.equal(colors[1]).and.to.equal(colors[2])
        expect(new Set([colors[0], colors[3], colors[4]]).size).to.equal(3)
      })
      cy.screenshot(`dosage-groups-${dark ? 'dark' : 'light'}`)
      chips().eq(4).then(element => {
        const rootColor = getComputedStyle(element[0]).color
        cy.contains('ion-modal:visible ion-chip', /^0\.3$/).click()
        chips().should('have.length', 2)
        chips().eq(0).should('have.text', 'mg (i.m.)')
        chips().eq(1).should('have.css', 'color', rootColor)
      })
      cy.get('ion-modal:visible input').should('have.value', '0.3')
      cy.contains('ion-modal:visible ion-chip', 'mg (i.m.)').click()
      cy.get('ion-modal:visible input').should('have.value', '0.3 mg (i.m.)')
      cy.contains('ion-modal:visible ion-button', 'Speichern').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.contains('ion-item', 'Anaphylaxie').click()
      cy.get('ion-modal:visible input').should('have.value', '0.3 mg (i.m.)')
      chips().should('not.exist')
      cy.get('ion-modal:visible input').clear()
      chips().should('have.length', 5)
      cy.get('ion-modal:visible input').type('0.5')
      chips().should('have.length', 5)
      cy.contains('ion-modal:visible ion-chip', 'mg (i.m.)').click()
      cy.get('ion-modal:visible input').should('have.value', '0.5 mg (i.m.)')
    })
  }
})
