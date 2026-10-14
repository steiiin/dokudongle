export {}

const pressKey = (key: 'Enter' | 'Escape' | ' ') => {
  const params = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: key === 'Enter' ? 13 : key === 'Escape' ? 27 : 32 }
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : '' },
  }))
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
  }))
}

describe('DodoInputSelectChips', () => {
  for (const width of [320, 1024]) {
    for (const dark of [false, true]) {
      it(`supports selection, keyboard and custom input at ${width}px in ${dark ? 'dark' : 'light'} mode`, () => {
        cy.viewport(width, 812)
        cy.visit(`/tests/e2e/fixtures/dodoInputSelectChips.html${dark ? '?dark' : ''}`)
        cy.get('.dd-input-select-chips').as('trigger').focus()
        pressKey('Enter')
        cy.get('ion-popover:visible').as('popover').should('be.visible')
        cy.get('@popover').find('.dd-input-select-chips__row').should('have.length', 2).then(rows => {
          const first = rows[0].getBoundingClientRect()
          const second = rows[1].getBoundingClientRect()
          expect(second.top).to.be.greaterThan(first.bottom)
          const buttons = rows[1].querySelectorAll('button')
          expect(buttons[1].getBoundingClientRect().top).to.be.greaterThan(buttons[0].getBoundingClientRect().top)
          expect(buttons[buttons.length - 1].getAttribute('aria-label')).to.equal('Eigenen Wert eingeben')
        })
        cy.get('@popover').contains('button', 'Alpha').focus()
        pressKey(' ')
        cy.get('#selection').should('have.text', '["a"]')
        cy.get('@popover').contains('button', 'Alpha').should('have.attr', 'aria-pressed', 'true')
        cy.get('@popover').contains('button', 'Beta').click()
        cy.get('#selection').should('have.text', '["a","b"]')
        cy.get('@popover').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '["b"]')
        cy.get('@popover').contains('button', 'EinSehrLanger').click()

        cy.get('.dd-input-select-chips__cloud').then(cloud => {
          expect(cloud[0].scrollWidth).to.be.at.most(cloud[0].clientWidth)
          const bounds = cloud[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
          cloud.find('button').each((_, button) => {
            expect(button.scrollWidth).to.be.at.most(button.clientWidth)
          })
        })
        cy.get('@popover').contains('button', 'Beta').then(button => {
          const style = getComputedStyle(button[0])
          expect(style.backgroundColor).not.to.equal(style.color)
          expect(style.backgroundColor).not.to.equal('rgba(0, 0, 0, 0)')
        })
        pressKey('Escape')
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('@trigger').should('be.focused').and('have.attr', 'aria-expanded', 'false')
        cy.get('@trigger').then(trigger => {
          expect(trigger[0].scrollWidth).to.be.at.most(trigger[0].clientWidth)
        })

        cy.get('@trigger').click()
        cy.get('ion-popover:visible').find('button[aria-label="Eigenen Wert eingeben"]').focus()
        pressKey('Enter')
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('#selection').should('have.text', '[]')
        cy.get('ion-input input').should('be.focused').type('Eigener Text')
        cy.get('#selection').should('have.text', '["Eigener Text"]')
        cy.get('@trigger').find('[aria-live="polite"]').should('contain.text', 'Andere').and('not.contain.text', 'Eigener Text')
        cy.get('@trigger').click()
        cy.get('ion-popover:visible').find('.dd-input-select-chips__custom').should('not.exist')
        cy.get('ion-popover:visible').contains('button', 'Beta').click()
        cy.get('ion-input').should('not.exist')
        cy.get('#selection').should('have.text', '["b"]')
        cy.get('ion-popover:visible').find('.dd-input-select-chips__custom').should('be.visible')
        cy.get('ion-popover:visible').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '["b","a"]')
        cy.get('ion-popover:visible').contains('ion-item', 'Speichern').should('have.css', 'text-align', 'end')
          .shadow().find('button').focus()
        pressKey('Enter')
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('#selection').should('have.text', '["b","a"]')
        cy.get('@trigger').should('be.focused').click()
        cy.get('ion-popover:visible').contains('button', 'Beta').click()
        cy.get('ion-popover:visible').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '[]')
        cy.get('ion-popover:visible').shadow().find('ion-backdrop').click({ force: true })
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('@trigger').find('[aria-live="polite"]').should('have.text', 'Keine')
      })
    }
  }
})
