export {}

const representative = () => cy.get('.representation-card').contains('ion-item', 'Vertreter')
const directive = () => cy.get('.representation-card .advance-directive')
const roleSelector = () => cy.get('ion-modal:visible').contains('ion-select', 'Vertreter vorhanden?')
const choose = (label: string, value: string) => {
  cy.contains('ion-select', label).click()
  cy.get('ion-popover:visible').contains('ion-radio', value).click()
  cy.get('ion-popover:visible').should('not.exist')
}

it('filters contact options and resets uncontacted when switching roles', () => {
  cy.visit('/tests/e2e/fixtures/representation.html')
  representative().click()
  for (const [source, target] of [['Sorgeberechtigt', 'Bevollmächtigter'], ['Gesetzl. Betreuer', 'Sonstige']]) {
    choose('Vertreter vorhanden?', source)
    choose('Beteiligung', 'Nicht Kontaktiert')
    choose('Vertreter vorhanden?', target)
    cy.get('ion-modal:visible').contains('ion-select', 'Beteiligung')
      .should('contain.text', 'Anwesend').click()
    cy.get('ion-popover:visible').should('not.contain.text', 'Nicht Kontaktiert')
    cy.get('ion-popover:visible').contains('ion-radio', 'Telefonisch').click()
    cy.get('ion-popover:visible').should('not.exist')
  }
})

for (const mode of ['md', 'ios']) {
  for (const width of [320, 1024]) {
    it(`captures representation without overflow at ${width}px (${mode})`, () => {
      cy.viewport(width, 900)
      cy.visit(`/tests/e2e/fixtures/representation.html?mode=${mode}`)
      cy.get('.representation-card ion-card-header').should('have.css', 'background-color', 'rgb(58, 37, 80)')
      cy.get('.representation-card').prev().should('contain.text', 'Angehörigenkontakte')
      cy.get('.representation-card .examination-item').should('not.exist')
      representative().should('contain.text', 'Nein').and('have.class', 'item-lines-full').click()
      cy.get('ion-modal:visible').should('contain.text', 'Vertreter vorhanden?')
      cy.get('ion-modal:visible ion-input').should('not.exist')
      roleSelector().closest('ion-item').should('have.class', 'item-lines-none')
      choose('Vertreter vorhanden?', 'Sorgeberechtigt')
      roleSelector().closest('ion-item').should('have.class', 'item-lines-full')
      cy.get('ion-modal:visible ion-input input').should('be.focused')
      cy.get('ion-modal:visible .name-suggestion').each(chip => {
        expect(parseFloat(getComputedStyle(chip[0]).borderRadius)).to.be.at.least(chip[0].getBoundingClientRect().height / 2)
      })
      cy.get('ion-modal:visible').contains('ion-select', 'Beteiligung').should('contain.text', 'Anwesend')
      cy.get('ion-modal:visible').contains('.name-suggestion', 'Mama').click()
      cy.get('ion-modal:visible ion-input input').should('have.value', 'Mama')
      choose('Beteiligung', 'Telefonisch')
      cy.get('ion-modal:visible ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      representative().should('contain.text', 'Sorgeberechtigt · Mama · Telefonisch')
      cy.get('#report').should('contain.text', 'gegenüber Mama (Sorgeberechtigt), telefonisch')
        .and('contain.text', 'Sorgeberechtigten (Mama) tel. informiert.')
        .and('not.contain.text', 'Vertretung:')
        .and('not.contain.text', 'Vertreter:')

      representative().click()
      choose('Vertreter vorhanden?', 'Bevollmächtigter')
      cy.get('ion-modal:visible ion-input input').should('be.focused').and('have.value', 'Mama')
      cy.get('ion-modal:visible .name-suggestion').should('have.length', 4)
      cy.get('ion-modal:visible').contains('.name-suggestion', 'Tochter').click()
      cy.get('ion-modal:visible ion-input input').should('have.value', 'Tochter')
      cy.get('ion-modal:visible ion-header ion-button').click()
      cy.get('#report').should('contain.text', 'Bevollmächtigter (Tochter) vorhanden; tel. informiert.')
        .and('not.contain.text', 'Vorsorgevollmacht')

      representative().click()
      choose('Vertreter vorhanden?', 'Nein')
      roleSelector().closest('ion-item').should('have.class', 'item-lines-none')
      cy.get('ion-modal:visible ion-input, ion-modal:visible .name-suggestion').should('not.exist')
      cy.get('ion-modal:visible').should('not.contain.text', 'Beteiligung')
      cy.get('ion-modal:visible ion-header ion-button').click()
      representative().should('contain.text', 'Nein').and('have.class', 'item-lines-full')

      choose('Patientenverfügung', 'Vorhanden')
      directive().find('ion-select').shadow().find('[part="text"]').should(text => {
        expect(text[0].scrollWidth, 'selected status is not truncated').to.be.at.most(text[0].clientWidth)
      })
      cy.get('.dd-input-select-chips').click()
      cy.get('ion-modal:visible').contains('button', 'Keine Reanimation').click()
      cy.get('ion-modal:visible').contains('button', 'Keine Einschränkungen').click()
      cy.get('.dd-input-select-chips__chip').should('have.length', 2)
      cy.get('ion-modal:visible').contains('button', 'Andere').click()
      cy.get('ion-modal:visible').contains('ion-button', 'Übernehmen').click()
      cy.get('ion-modal:visible').should('not.exist')
      directive().find('ion-input input').type('Keine Dialyse').blur()
      cy.get('#report').should('contain.text', 'Patientenverfügung vorhanden, keine Therapiebeschränkungen; andere: Keine Dialyse.')
        .and('not.contain.text', 'keine Reanimation')
      cy.get('.representation-card ion-card-content ion-item').each(item => {
        const bounds = item[0].getBoundingClientRect()
        expect(bounds.width).to.be.greaterThan(0)
        expect(item[0].scrollWidth).to.be.at.most(Math.ceil(bounds.width))
        expect(bounds.right).to.be.at.most(width)
      })
      cy.get('.representation-card').scrollIntoView().screenshot(`representation-${mode}-${width}`)
    })
  }
}
