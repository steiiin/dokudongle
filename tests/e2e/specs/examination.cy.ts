const pressEscape = () => cy.then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
})).then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
}))

const expectFocusWithin = (element: JQuery<HTMLElement>) => {
  const active = element[0].ownerDocument.activeElement
  expect(active === element[0] || element[0].contains(active)).to.equal(true)
}

for (const width of [320, 1024]) {
  describe(`examination picker at ${width}px`, () => {
    beforeEach(() => {
      cy.viewport(width, 900)
      cy.visit('/tests/e2e/fixtures/examination.html')
      cy.contains('ion-card', 'A - Airway').as('airway')
      cy.contains('ion-card', 'Controls').as('controls')
    })

    it('adds Stridor, keeps a negative result visible, removes and re-adds it', () => {
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Stridor').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', true).click()
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', false)
      cy.get('@airway').find('.add-examination').should('have.prop', 'disabled', true)
      cy.get('@airway').find('.remove-examination').click()
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').should(expectFocusWithin)
      cy.get('@airway').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Stridor').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', true)
      cy.get('@airway').contains('ion-toggle', 'Atmung vorhanden?').click()
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').should('have.prop', 'disabled', true)
    })

    it('cancels the picker, then opens modal and select after dismissal with usable focus', () => {
      cy.get('@controls').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').should('contain.text', 'Modal examination')
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@controls').find('.add-examination').then(button => {
        const anchor = button[0].getBoundingClientRect()
        cy.get('ion-popover.examination-picker:visible').shadow().find('[part="content"]').should(content => {
          const bounds = content[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
          expect(bounds.left).to.be.lessThan(anchor.right)
          expect(bounds.right).to.be.greaterThan(anchor.left)
          expect(bounds.top).to.be.at.least(anchor.bottom - 2)
        })
      })
      pressEscape()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@controls').find('.examination-item').should('not.exist')
      cy.get('@controls').find('.add-examination').should(expectFocusWithin).click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Modal examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('have.length', 1).and('contain.text', 'Examination details')
      cy.get('ion-modal:visible').should(expectFocusWithin)
      pressEscape()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@controls').find('[data-examination="modal"] ion-item').should(expectFocusWithin)
      cy.get('@controls').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Select examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-popover:visible').should('have.length', 1).and('contain.text', 'Beta')
      cy.get('ion-alert:visible').should('not.exist')
      cy.get('ion-popover:visible').shadow().find('[part="content"]').then(content => {
        cy.get('@controls').find('ion-select').shadow().find('[part="container"]').then(select => {
          const anchor = select[0].getBoundingClientRect()
          const bounds = content[0].getBoundingClientRect()
          expect(bounds.left).to.be.lessThan(anchor.right)
          expect(bounds.right).to.be.greaterThan(anchor.left)
          expect(bounds.top).to.be.at.least(anchor.bottom - 2)
        })
      })
      cy.get('ion-popover:visible').contains('ion-item', 'Beta').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('ion-select').should('have.prop', 'value', 'Beta').should(expectFocusWithin)
      cy.get('@controls').find('ion-select').click()
      cy.get('ion-popover:visible').should('be.visible')
      pressEscape()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('ion-select').should(expectFocusWithin)
      cy.get('.examination-item').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
      })
    })
  })
}
