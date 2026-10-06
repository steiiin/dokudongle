const expectNativeFocus = (button: JQuery<HTMLElement>) => {
  const root = button[0].getRootNode() as ShadowRoot
  expect(root.activeElement).to.equal(button[0])
  expect(button[0].ownerDocument.activeElement).to.equal(root.host)
}

const pressKey = (key: 'Enter' | 'Escape') => {
  const params = { key, code: key, windowsVirtualKeyCode: key === 'Enter' ? 13 : 27 }
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: key === 'Enter' ? '\r' : '' },
  }))
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
  }))
}

describe('Paired motor assessment selectors', () => {
  for (const width of [320, 1024]) {
    it(`selects each side independently and fits at ${width}px`, () => {
      cy.viewport(width, 812)
      // Separate loopback origins keep the two persisted test protocols independent.
      const url = new URL('/tabs/doku', Cypress.config('baseUrl')!)
      url.hostname = width === 320 ? '127.0.0.1' : 'localhost'
      cy.visit(url.href)
      cy.contains('ion-label', 'Neuro-Befund').click({ scrollBehavior: 'center' })
      cy.get('ion-modal:visible').should('contain.text', 'Neurologischer Befund')
      cy.contains('.dd-input-select-lr', 'Armhalteversuch').as('arms')
      cy.contains('.dd-input-select-lr', 'Beinhalteversuch').as('legs')
      cy.get('@arms').should('contain.text', 'Li: Ohne Absinken • Re: Ohne Absinken')

      cy.get('@arms').contains('ion-button', 'Links').as('left')
      cy.get('@left').shadow().find('button').should('have.attr', 'aria-label', 'Armhalteversuch: Links')
      cy.get('@left').click()
      cy.get('ion-popover:visible').as('popover')
      cy.get('@popover').find('ion-item[aria-current="true"]').should('have.text', 'Ohne Absinken')
      cy.get('@popover').shadow().find('[part="content"]').then(content => {
        cy.get('@left').then(button => {
          const anchor = button[0].getBoundingClientRect()
          const bounds = content[0].getBoundingClientRect()
          expect(bounds.left).to.be.lessThan(anchor.right)
          expect(bounds.right).to.be.greaterThan(anchor.left)
          expect(bounds.top).to.be.at.least(anchor.bottom - 2)
        })
      })
      cy.get('@popover').contains('ion-item', 'Voll Absinken').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-popover ion-content').should('not.exist')
      cy.get('@arms').should('contain.text', 'Li: Voll Absinken • Re: Ohne Absinken')
      cy.get('@legs').should('contain.text', 'Li: Ohne Absinken • Re: Ohne Absinken')

      cy.get('@arms').contains('ion-button', 'Rechts').as('right')
      // Native focus/events preserve shadow-DOM retargeting through Ionic's focus trap.
      cy.get('@right').should('be.visible').shadow().find('button').then(button => { button[0].focus(); expectNativeFocus(button) })
      cy.get('@right').shadow().find('button').should(expectNativeFocus)
      pressKey('Enter')
      cy.get('ion-popover:visible').find('ion-item[aria-current="true"]').should('have.text', 'Ohne Absinken')
      cy.get('ion-popover:visible').contains('ion-item', 'Leichtes Absinken')
        .should('be.visible').shadow().find('button').then(button => { button[0].focus(); expectNativeFocus(button) })
      pressKey('Enter')
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-popover ion-content').should('not.exist')
      cy.get('@arms').should('contain.text', 'Li: Voll Absinken • Re: Leichtes Absinken')
      cy.get('@right').shadow().find('button').should(expectNativeFocus)

      pressKey('Enter')
      cy.get('ion-popover:visible').should('be.visible')
      pressKey('Escape')
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-popover ion-content').should('not.exist')
      cy.get('@arms').should('contain.text', 'Li: Voll Absinken • Re: Leichtes Absinken')
      cy.get('@right').shadow().find('button').should(expectNativeFocus)

      cy.get('@legs').contains('ion-button', 'Links').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Nur Restbewegung').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-popover ion-content').should('not.exist')
      cy.get('@legs').contains('ion-button', 'Rechts').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Keine Bewegung').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-popover ion-content').should('not.exist')
      cy.get('@legs').should('contain.text', 'Li: Nur Restbewegung • Re: Keine Bewegung')
      cy.get('@arms').should('contain.text', 'Li: Voll Absinken • Re: Leichtes Absinken')

      cy.get('.dd-input-select-lr').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
        const bounds = row[0].getBoundingClientRect()
        row.find('ion-button, [aria-live="polite"]').each((_, element) => {
          const child = element.getBoundingClientRect()
          expect(child.left).to.be.at.least(bounds.left - 1)
          expect(child.right).to.be.at.most(bounds.right + 1)
          expect(child.bottom).to.be.at.most(bounds.bottom + 1)
        })
      })
    })
  }
})
